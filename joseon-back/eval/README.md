# 챗봇 평가 & 모니터링

## 순서 (joseon-back 폴더에서)
1. `pip install -r requirements.txt`
2. **개선 전 기준선** — 인덱스 재생성 전에!
   `python eval/run_eval.py --version v1`
3. 인덱스 재생성 (코사인 거리 + 임베딩 정규화)
   `python rag/load_data.py`
4. 임계값 정하기 (API 비용 0)
   `python eval/run_eval.py --retrieval-only --sweep`
   → 근거 전달률은 높고 무관 질문 차단률도 높은 값 선택
5. **개선 후**
   `python eval/run_eval.py --version v2 --threshold <선택값>`
6. 서버에 반영: `.env`에 `RAG_THRESHOLD=<선택값>`
7. 운영 로그 집계: `python eval/log_report.py`

## 평가셋 (questions.jsonl, 40문항)
- 답변 가능 30: 정답 키워드 + 정답 근거 문서
- 답변 불가 10: 자료에 없는 질문 → '모른다'가 정답

## 변경 사항
- 프롬프트 v2: 자료에 있는 내용만 답변, 없으면 거절, [n] 출처 표시
- 근거 0개면 LLM 호출 없이 바로 거절
- 질의 로그(logs/chat_log.jsonl): 검색 문서·거리·거절 여부·응답시간
- 왕 데이터 재위/시대 값 뒤바뀜 수정
