from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime
import anthropic
import json
import os
import time

from rag.prompts import build_system, REFUSAL
from rag.sources import source_footer

load_dotenv()

router = APIRouter(prefix="/ai", tags=["ai"])

MODEL     = "claude-haiku-4-5-20251001"
TOP_K     = 4
THRESHOLD = float(os.getenv("RAG_THRESHOLD", "0.5"))  # 평가 결과로 정한 값
LOG_PATH  = os.getenv("CHAT_LOG_PATH", "./logs/chat_log.jsonl")

_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("CLAUDE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="CLAUDE_API_KEY가 설정되지 않았어요")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


class ChatRequest(BaseModel):
    message: str
    system:  str = ""
    history: list = []


def retrieve(query: str) -> list[dict]:
    try:
        from rag.retriever import search_detailed
        return [r for r in search_detailed(query, top_k=TOP_K) if r["distance"] < THRESHOLD]
    except Exception:
        return []


def write_log(record: dict):
    """운영 모니터링용 질의 로그 (eval/log_report.py 로 집계)"""
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception:
        pass


@router.post("/chat")
def chat(req: ChatRequest):
    started = time.time()
    hits    = retrieve(req.message)
    system  = build_system("v2", [h["doc"] for h in hits], req.system)
    log = {
        "ts": datetime.now().isoformat(timespec="seconds"),
        "query": req.message,
        "retrieved": [{"id": h["id"], "distance": round(h["distance"], 4)} for h in hits],
        "has_context": bool(hits),
    }

    # 근거 자료가 없으면 LLM을 호출하지 않고 바로 안내 (환각 방지 + 비용 절감)
    if system is None:
        write_log({**log, "refused": True, "answer": REFUSAL,
                   "latency_ms": int((time.time() - started) * 1000)})
        return StreamingResponse(iter([REFUSAL]), media_type="text/plain; charset=utf-8")

    messages = req.history + [{"role": "user", "content": req.message}]

    def generate():
        answer = ""
        try:
            with get_client().messages.stream(
                model=MODEL, max_tokens=1000, system=system, messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    answer += text
                    yield text
            refused = REFUSAL in answer
            if not refused:
                yield source_footer([h["doc"] for h in hits], answer)
            write_log({**log, "refused": refused, "answer": answer,
                       "latency_ms": int((time.time() - started) * 1000)})
        except anthropic.APIError as e:
            write_log({**log, "error": str(e)})
            yield "\n(일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.)"

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")
