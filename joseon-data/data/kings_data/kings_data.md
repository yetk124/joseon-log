# 조선 왕 데이터 크롤러

한국민족문화대백과사전에서 조선 27대 왕의 데이터를 수집하는 크롤러입니다.

---

## 기술 스택

- Python 3.10+
- `requests` — HTTP 요청
- `BeautifulSoup4` — HTML 파싱
- `pandas` — 데이터 후처리 및 CSV 병합

---

## 크롤링 방법

1. **검색 → 링크 수집**  
   `/Article/Search?query=왕이름` 으로 요청 후 결과 목록에서  
   정규식으로 `조선의 제N대` 패턴을 감지해 상세 페이지 URL 추출

2. **상세 페이지 파싱**  
   추출한 URL에 접속해 두 가지 방식으로 데이터 수집

   - **Copy Selector 방식** — `era`, `desc`, `tags` 처럼 모든 왕이 동일한 HTML 구조를 가진 필드는 브라우저 개발자 도구의 Copy Selector로 추출한 CSS 선택자를 그대로 사용

   - **`<strong>` 키 텍스트 방식** — `birth`, `death` 처럼 왕마다 항목 순서가 달라 고정 선택자를 쓸 수 없는 필드는 `<li>` 를 순회하며 `<strong>` 텍스트("출생 연도", "사망 연도")를 키로 탐색

3. **데이터 후처리 및 저장**  
   누락 데이터 null 처리 → CSV 저장 → JSON 변환

---

## 데이터 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 조선 왕 대수 |
| `name` | string | 왕 이름 |
| `reign` | string | 시대 구분 (건국 / 초기 / 중기 / 후기 / 말기) |
| `era` | string | 재위 기간 (예: 1392~1398) |
| `birth` | string | 출생 연도 |
| `death` | string | 사망 연도 |
| `desc` | string | 내용 요약 |
| `tags` | array | 키워드 태그 |

---

## 파일 구조

```
joseon-data/
├── collectors/
│   ├── kings_crawler.py        # 링크 수집 (검색 → URL 추출)
│   ├── kings_data.py           # 상세 데이터 수집 (era, desc, tags)
│   └── kings_birth_death.py    # 출생·사망 연도 수집
└── data/
    ├── kings_data.csv          # 수집 결과 CSV
    └── kings_data.json         # 최종 JSON
```

---

## 실행 방법

```bash
# 가상환경 활성화
cd history
.\.venv\Scripts\activate

# 패키지 설치
pip install requests beautifulsoup4 pandas

# 크롤링 실행
cd joseon-data/collectors
python kings_crawler.py         # 링크 수집
python kings_data.py            # 상세 데이터 수집
python kings_birth_death.py     # 출생·사망 연도 수집
```

---

## 데이터 출처

[한국민족문화대백과사전](https://encykorea.aks.ac.kr) — 한국학중앙연구원