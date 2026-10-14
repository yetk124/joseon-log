"""운영 로그 집계: python eval/log_report.py [logs/chat_log.jsonl]"""
import json, sys
from collections import Counter

path = sys.argv[1] if len(sys.argv) > 1 else "./logs/chat_log.jsonl"
rows = [json.loads(l) for l in open(path, encoding="utf-8") if l.strip()]
n = len(rows)
no_ctx  = sum(not r.get("has_context") for r in rows)
refused = sum(bool(r.get("refused")) for r in rows)
errors  = sum("error" in r for r in rows)
lat = sorted(r["latency_ms"] for r in rows if "latency_ms" in r and r["latency_ms"] > 0)
print(f"총 질의 {n}건")
print(f"근거 없음(검색 실패) {no_ctx}건 ({no_ctx/n:.1%})  ← 데이터 보강 후보")
print(f"거절 응답 {refused}건 ({refused/n:.1%}) / 오류 {errors}건")
if lat: print(f"응답시간 중앙값 {lat[len(lat)//2]} ms / p90 {lat[int(len(lat)*0.9)]} ms")
print("\n근거 없이 거절된 질문 (자료 보강 우선순위)")
for q, c in Counter(r["query"] for r in rows if not r.get("has_context")).most_common(10):
    print(f"  {c}회 | {q}")
