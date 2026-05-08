from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic
import os

load_dotenv()

router = APIRouter(prefix="/ai", tags=["ai"])

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


def get_context(query: str) -> str:
    try:
        from rag.retriever import search_with_score
        docs = search_with_score(query, top_k=4, threshold=0.5)
        return "\n\n".join(docs)
    except Exception:
        return ""


@router.post("/chat")
def chat(req: ChatRequest):
    try:
        context = get_context(req.message)

        if context:
            system = f"""{req.system}
조선 왕조(1392~1910)와 관련된 질문에 친절하고 쉽게 답변하세요.
아래 [참고 자료]를 우선적으로 활용하되, 자료에 없는 내용은
당신의 조선 역사 지식으로 보충해서 답변하세요.
답변은 3~5문장으로 간결하게, 한국어로 작성하세요.

[참고 자료]
{context}"""
        else:
            system = f"""{req.system}
조선 왕조(1392~1910)와 관련된 질문에 친절하고 쉽게 답변하세요.
당신의 조선 역사 지식을 활용해서 답변하세요.
답변은 3~5문장으로 간결하게, 한국어로 작성하세요."""

        messages = req.history + [{"role": "user", "content": req.message}]

        # ── 스트리밍 제너레이터 ──
        def generate():
            with get_client().messages.stream(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                system=system,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    yield text

        return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")

    except anthropic.AuthenticationError:
        raise HTTPException(status_code=500, detail="Claude API 키가 유효하지 않아요")
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=f"Claude API 오류: {e}")