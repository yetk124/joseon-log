# 문화유산 데이터 수집기

국가유산청 Open API에서 조선시대 관련 문화유산 데이터를 수집하는 수집기

---

## 기술 스택

- Python 3.10+
- `requests` — API 요청
- `xml.etree.ElementTree` — XML 파싱
- `pandas` — 데이터 정제 및 저장

---

## 수집 대상

| 분류 | 수집기 | 데이터 출처 |
|------|--------|------------|
| 궁궐 · 종묘 | `heritage_collector.py` | 문화재청 궁능유적본부 API |
| 사적지 | `heritage_sites_collector.py` | 국가유산청 Open API |
| 왕릉 | `kings_tombs_builder.py` | 국가유산청 이미지 직접 수집 |

---

## 크롤링 방법

**궁궐 · 종묘**
1. 궁궐별(경복궁·창덕궁·창경궁·덕수궁·종묘) 목록 API 호출
2. 누락 필드가 있을 경우에만 상세 API 추가 호출
3. 빈 이름·중복 제거 후 저장

**사적지**
1. 목록 API — 전국 코드(`ZZ`) 미지원으로 시도코드 17개 순회
2. 상세 API — 설명·이미지·시대 추가 수집
3. 시대(`ccceName`) 필드에 **"조선"** 포함 항목만 필터링
4. 이미지 없으면 이미지 API 추가 호출
5. 카테고리 매핑·태그 자동 생성·description 정제 후 저장

**왕릉**
- easyocr, doctr, tesseract 등 다양한 OCR을 시도했으나 배경 무늬·표 구조·한국어 인식 한계로 100% 추출 불가
- 최종적으로 국가유산청 이미지를 직접 확인해 1대 태조 ~ 대한제국 순종까지 **48개 항목을 수동 입력**

---

## 데이터 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 고유 ID |
| `name` | string | 장소 이름 |
| `category` | string | 분류 (궁궐 / 종묘 / 왕릉 / 사적 / 박물관) |
| `description` | string | 장소 설명 |
| `image_url` | string | 대표 이미지 URL |
| `tags` | array | 키워드 태그 |
| `lat` / `lng` | string | 위도·경도 |
| `address` | string | 소재지 |

---

## 파일 구조

```
joseon-data/
├── collectors/
│   ├── heritage_collector.py         # 궁궐·종묘 수집기
│   ├── heritage_sites_collector.py   # 사적지 수집기
│   └── kings_tombs_builder.py        # 왕릉 데이터 생성기
└── data/
    └── heritages_data/
        ├── palaces_jongmyo/          # 궁궐·종묘
        ├── historic_sites/           # 사적지
        ├── royal_tombs/              # 왕릉
        └── museums/                  # 박물관
```

---

## 실행 방법

```bash
cd joseon-data/collectors

python heritage_collector.py          # 궁궐·종묘
python heritage_sites_collector.py    # 사적지
python kings_tombs_builder.py         # 왕릉
```

---

## 데이터 출처

- [문화재청 궁능유적본부 API](https://www.heritage.go.kr)
- [국가유산청 Open API](http://www.khs.go.kr)
- [국가유산청 조선왕릉과 왕실계보](https://www.data.go.kr/data/15102320/fileData.do) (정보기준일: 2024년 5월)