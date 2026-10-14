"""
조선로그 RAG 챗봇 평가 스크립트

사용법 (joseon-back 폴더에서 실행):
  # 1) 개선 전 기준선 — 반드시 인덱스를 다시 만들기 '전에' 실행
  python eval/run_eval.py --version v1

  # 2) 인덱스 재생성 (코사인 거리 + 정규화)
  python rag/load_data.py

  # 3) 검색 임계값 정하기 (API 비용 없음)
  python eval/run_eval.py --retrieval-only --sweep

  # 4) 개선 후 평가
  python eval/run_eval.py --version v2 --threshold <3번에서 고른 값>

지표
  - 검색 적중률: 정답 근거 문서가 top-k 안에 있는 비율 (답변 가능 질문)
  - 근거 전달률: 임계값을 통과해 실제로 LLM에 전달된 비율 (답변 가능 질문)
  - 정답률: 답변에 정답 키워드가 모두 포함된 비율 (답변 가능 질문)
  - 출처 표시율: 답변에 [1] 같은 근거 번호가 있는 비율 (답변 가능 질문)
  - 거절 정확도: 자료에 없는 질문에 '모른다'고 답한 비율 (답변 불가 질문) = 환각 방지
"""
import argparse, csv, json, os, re, sys, time
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from rag.retriever import search_detailed
from rag.prompts import build_system, REFUSAL

load_dotenv()
HERE   = os.path.dirname(os.path.abspath(__file__))
MODEL  = "claude-haiku-4-5-20251001"
REFUSAL_MARKERS = ["찾을 수 없", "알 수 없", "확인할 수 없", "확인되지 않", "정보가 없",
                   "기록이 없", "자료가 없", "답변드리기 어렵", "답변하기 어렵", "모르"]


def load_questions():
    with open(os.path.join(HERE, "questions.jsonl"), encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def is_refusal(text: str) -> bool:
    return any(m in text for m in REFUSAL_MARKERS)


def retrieval_rows(questions, top_k, normalize):
    rows = []
    for q in questions:
        hits = search_detailed(q["q"], top_k=top_k, normalize=normalize)
        rank = next((i for i, h in enumerate(hits, 1) if q.get("src") and q["src"] in h["doc"]), None)
        rows.append({"q": q, "hits": hits, "rank": rank,
                     "src_dist": hits[rank - 1]["distance"] if rank else None})
    return rows


def retrieval_report(rows, thresholds):
    ans = [r for r in rows if r["q"]["type"] == "answerable"]
    una = [r for r in rows if r["q"]["type"] == "unanswerable"]
    hit = sum(r["rank"] is not None for r in ans) / len(ans)
    print(f"\n검색 적중률(top-k 안에 정답 근거): {hit:.1%}  ({len(ans)}문항)")
    ad = [r["src_dist"] for r in ans if r["src_dist"] is not None]
    ud = [r["hits"][0]["distance"] for r in una]
    if ad: print(f"정답 근거 거리  min {min(ad):.3f} / 평균 {sum(ad)/len(ad):.3f} / max {max(ad):.3f}")
    print(f"무관 질문 최근접 거리  min {min(ud):.3f} / 평균 {sum(ud)/len(ud):.3f} / max {max(ud):.3f}")
    print("\n임계값 | 근거 전달률(답변 가능) | 무관 질문 차단률(답변 불가)")
    for t in thresholds:
        passed  = sum(r["src_dist"] is not None and r["src_dist"] < t for r in ans) / len(ans)
        blocked = sum(all(h["distance"] >= t for h in r["hits"]) for r in una) / len(una)
        print(f"{t:>6.2f} | {passed:>20.1%} | {blocked:>24.1%}")


def ask(client, system, question):
    t = time.time()
    msg = client.messages.create(model=MODEL, max_tokens=1000, system=system,
                                 messages=[{"role": "user", "content": question}])
    return msg.content[0].text, int((time.time() - t) * 1000)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", choices=["v1", "v2"], default="v2")
    ap.add_argument("--threshold", type=float, default=0.5)
    ap.add_argument("--top-k", type=int, default=4)
    ap.add_argument("--retrieval-only", action="store_true")
    ap.add_argument("--sweep", action="store_true")
    args = ap.parse_args()

    questions = load_questions()
    normalize = args.version == "v2"  # v1 = 개선 전 동작(정규화 없음) 재현
    rows = retrieval_rows(questions, args.top_k, normalize)
    thresholds = [round(0.2 + 0.05 * i, 2) for i in range(11)] if args.sweep else [args.threshold]
    retrieval_report(rows, thresholds)
    if args.retrieval_only:
        return

    import anthropic
    client = anthropic.Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
    out, stats = [], {"ans": 0, "correct": 0, "cited": 0, "una": 0, "refused": 0, "lat": []}
    for r in rows:
        q = r["q"]
        docs = [h["doc"] for h in r["hits"] if h["distance"] < args.threshold]
        system = build_system(args.version, docs)
        if system is None:
            answer, ms = REFUSAL, 0
        else:
            answer, ms = ask(client, system, q["q"])
        stats["lat"].append(ms)
        if q["type"] == "answerable":
            ok = all(k in answer for k in q["keywords"]) and not is_refusal(answer)
            cited = bool(re.search(r"\[\d\]", answer))
            stats["ans"] += 1; stats["correct"] += ok; stats["cited"] += cited
            verdict = "정답" if ok else "오답"
        else:
            ok = is_refusal(answer)
            stats["una"] += 1; stats["refused"] += ok
            verdict = "거절(정상)" if ok else "환각 의심"
        print(f"[{q['id']:>2}] {verdict:<6} 근거 {len(docs)}개 | {q['q']}")
        out.append({"id": q["id"], "type": q["type"], "question": q["q"], "verdict": verdict,
                    "n_context": len(docs), "src_rank": r["rank"], "latency_ms": ms,
                    "answer": answer.replace("\n", " ")})

    acc = stats["correct"] / stats["ans"]; cite = stats["cited"] / stats["ans"]
    ref = stats["refused"] / stats["una"]
    print(f"\n=== {args.version} (threshold {args.threshold}) ===")
    print(f"정답률        {acc:.1%}  ({stats['correct']}/{stats['ans']})")
    print(f"출처 표시율    {cite:.1%}")
    print(f"거절 정확도    {ref:.1%}  ({stats['refused']}/{stats['una']})  ← 환각 방지")
    print(f"평균 응답시간  {sum(stats['lat'])/len(stats['lat']):.0f} ms")

    os.makedirs(os.path.join(HERE, "results"), exist_ok=True)
    stamp = datetime.now().strftime("%m%d_%H%M")
    path = os.path.join(HERE, "results", f"{args.version}_{stamp}.csv")
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
    print(f"상세 결과 → {path}")


if __name__ == "__main__":
    main()
