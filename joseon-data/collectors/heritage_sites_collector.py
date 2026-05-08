"""
조선시대 사적지 데이터 수집 + 스키마 정제
출처: 국가유산청 Open API (http://www.khs.go.kr)
API 키 불필요

실행 위치 : collectors/
실행 명령 : python heritage_sites_collector.py

결과물: ../data/sites/sites.json
        ../data/sites/sites.csv
"""

import requests
import xml.etree.ElementTree as ET
import pandas as pd
import json
import time
import re
from pathlib import Path

# =============================================
# API URL
# =============================================
LIST_URL   = "http://www.khs.go.kr/cha/SearchKindOpenapiList.do"
DETAIL_URL = "http://www.khs.go.kr/cha/SearchKindOpenapiDt.do"
IMAGE_URL  = "http://www.khs.go.kr/cha/SearchImageOpenapi.do"

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

# 종목코드: 13=사적, 14=사적및명승
TARGET_KDCD = ["13", "14"]

# 시도코드 전체 (ZZ 전국 코드 작동 안 해서 하나씩 순회)
SIDO_CODES = [
    "11",  # 서울
    "21",  # 부산
    "22",  # 대구
    "23",  # 인천
    "24",  # 광주
    "25",  # 대전
    "26",  # 울산
    "45",  # 세종
    "31",  # 경기
    "32",  # 강원
    "33",  # 충북
    "34",  # 충남
    "35",  # 전북
    "36",  # 전남
    "37",  # 경북
    "38",  # 경남
    "50",  # 제주
]

# 조선시대 필터 키워드
JOSEON_KEYWORDS = ["조선"]

# 저장 경로
DATA_DIR = Path(__file__).parent.parent / "data" / "sites"
DATA_DIR.mkdir(parents=True, exist_ok=True)


# =============================================
# 유틸 함수
# =============================================
def get_text(element, tag) -> str | None:
    node = element.find(tag)
    if node is not None and node.text:
        return node.text.strip()
    return None


def is_joseon(era_text: str | None) -> bool:
    if not era_text:
        return False
    return any(kw in era_text for kw in JOSEON_KEYWORDS)


# =============================================
# 카테고리 매핑
# =============================================
def map_category(ccma_name: str | None, name: str | None) -> str:
    text = f"{ccma_name or ''} {name or ''}"
    if any(k in text for k in ["왕릉", "능", "릉"]):
        return "왕릉"
    if any(k in text for k in ["궁궐", "궁", "경복", "창덕", "창경", "덕수", "경희"]):
        return "궁궐"
    if "종묘" in text:
        return "종묘"
    if "박물관" in text:
        return "박물관"
    return "사적"


# =============================================
# 태그 생성
# =============================================
def make_tags(name: str | None, era: str | None, address: str | None, category: str) -> list[str]:
    tags = []

    if era and "조선" in era:
        tags.append("조선")

    if category:
        tags.append(category)

    if address:
        for sido in ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
                     "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"]:
            if sido in address:
                tags.append(sido)
                break

    if name:
        if "유네스코" in name or "세계유산" in name:
            tags.append("유네스코")
        if "왕릉" in name or "능" in name:
            tags.append("왕릉")
        if "산성" in name:
            tags.append("산성")
        if "서원" in name:
            tags.append("서원")
        if "향교" in name:
            tags.append("향교")
        if "행궁" in name:
            tags.append("행궁")

    return list(dict.fromkeys(tags))


# =============================================
# description 정제
# =============================================
def make_description(content: str | None, name: str | None, era: str | None) -> str:
    if content:
        clean = re.sub(r"<[^>]+>", "", content).strip()
        sentence = re.split(r"[.。\n]", clean)[0].strip()
        if len(sentence) >= 10:
            return sentence[:60]
    if name and era:
        return f"{era}에 조성된 {name}"
    if name:
        return f"조선시대 사적지 {name}"
    return "조선시대 국가유산 사적지"


# =============================================
# STEP 1. 목록 수집 (시도코드 순회)
# =============================================
def fetch_list(kdcd: str) -> list[dict]:
    all_items = []
    print(f"\n  종목코드 {kdcd} 목록 수집 중...")

    for ctcd in SIDO_CODES:
        page = 1
        sido_count = 0

        while True:
            try:
                res = requests.get(
                    LIST_URL,
                    params={
                        "ccbaKdcd":  kdcd,
                        "ccbaCtcd":  ctcd,
                        "ccbaCncl":  "N",
                        "pageUnit":  100,
                        "pageIndex": page,
                    },
                    headers=HEADERS,
                    timeout=10
                )
                res.encoding = "utf-8"
                root = ET.fromstring(res.text)
            except Exception as e:
                print(f"    ⚠️  요청 실패 (ctcd={ctcd}, page={page}): {e}")
                break

            items = root.findall("item")
            if not items:
                break

            for node in items:
                all_items.append({
                    "ccbaKdcd": get_text(node, "ccbaKdcd"),
                    "ccbaAsno": get_text(node, "ccbaAsno"),
                    "ccbaCtcd": get_text(node, "ccbaCtcd"),
                    "name":     get_text(node, "ccbaMnm1"),
                    "ccmaName": get_text(node, "ccmaName"),
                    "lat":      get_text(node, "latitude"),
                    "lng":      get_text(node, "longitude"),
                })
                sido_count += 1

            total = int(root.findtext("totalCnt") or 0)
            if sido_count >= total:
                break
            page += 1
            time.sleep(0.2)

        if sido_count > 0:
            print(f"    시도 {ctcd}: {sido_count}개")

    print(f"  → 종목코드 {kdcd} 총 {len(all_items)}개")
    return all_items


# =============================================
# STEP 2. 상세 수집
# =============================================
def fetch_detail(kdcd: str, asno: str, ctcd: str) -> dict:
    try:
        res = requests.get(
            DETAIL_URL,
            params={"ccbaKdcd": kdcd, "ccbaAsno": asno, "ccbaCtcd": ctcd},
            headers=HEADERS,
            timeout=10
        )
        res.encoding = "utf-8"
        root = ET.fromstring(res.text)
    except Exception as e:
        print(f"    ⚠️  상세 요청 실패 ({asno}): {e}")
        return {}

    node = root.find("item")
    if node is None:
        return {}

    return {
        "content":   get_text(node, "content"),
        "image_url": get_text(node, "imageUrl"),
        "address":   get_text(node, "ccbaLcad"),
        "era":       get_text(node, "ccceName"),
        "lat":       get_text(node, "latitude"),
        "lng":       get_text(node, "longitude"),
    }


# =============================================
# STEP 3. 이미지 수집
# =============================================
def fetch_image(kdcd: str, asno: str, ctcd: str) -> str:
    try:
        res = requests.get(
            IMAGE_URL,
            params={"ccbaKdcd": kdcd, "ccbaAsno": asno, "ccbaCtcd": ctcd},
            headers=HEADERS,
            timeout=10
        )
        res.encoding = "utf-8"
        root = ET.fromstring(res.text)
        node = root.find("item")
        if node is not None:
            return get_text(node, "imageUrl") or ""
    except Exception:
        pass
    return ""


# =============================================
# STEP 4. 스키마 정제
# =============================================
def build_record(idx: int, item: dict, detail: dict, image_url: str) -> dict:
    name     = item.get("name")
    era      = detail.get("era")
    address  = detail.get("address")
    content  = detail.get("content")
    ccma     = item.get("ccmaName")

    category    = map_category(ccma, name)
    description = make_description(content, name, era)
    tags        = make_tags(name, era, address, category)

    lat = detail.get("lat") or item.get("lat")
    lng = detail.get("lng") or item.get("lng")
    lat = None if lat in ["0", "0.0"] else lat
    lng = None if lng in ["0", "0.0"] else lng

    img = detail.get("image_url") or image_url or ""

    return {
        "id":          str(idx),
        "name":        name or "",
        "category":    category,
        "description": description,
        "image_url":   img,
        "tags":        tags,
        "lat":         lat,
        "lng":         lng,
        "address":     address,
        "era":         era,
    }


# =============================================
# STEP 5. 전체 파이프라인
# =============================================
def collect_all() -> list[dict]:
    raw_items = []
    for kdcd in TARGET_KDCD:
        raw_items.extend(fetch_list(kdcd))

    print(f"\n총 {len(raw_items)}개 항목 → 상세 수집 + 조선 필터링 시작...")

    records = []
    idx = 1

    for i, item in enumerate(raw_items):
        kdcd = item["ccbaKdcd"]
        asno = item["ccbaAsno"]
        ctcd = item["ccbaCtcd"]

        print(f"  ({i+1}/{len(raw_items)}) {item['name']} 처리 중...", end="\r")

        detail = fetch_detail(kdcd, asno, ctcd)

        if not is_joseon(detail.get("era")):
            continue

        image_url = detail.get("image_url") or fetch_image(kdcd, asno, ctcd)
        record = build_record(idx, item, detail, image_url)
        records.append(record)
        idx += 1
        time.sleep(0.3)

    return records


# =============================================
# 저장
# =============================================
def save(records: list[dict]):
    json_path = DATA_DIR / "sites.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    csv_path = DATA_DIR / "sites.csv"
    df = pd.DataFrame(records)
    df["tags"] = df["tags"].apply(lambda x: json.dumps(x, ensure_ascii=False))
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")

    print(f"\n✅ 완료! 총 {len(records)}건")
    print(f"   📄 {json_path.resolve()}")
    print(f"   📄 {csv_path.resolve()}")

    null_counts = df.isnull().sum()
    null_counts = null_counts[null_counts > 0]
    if not null_counts.empty:
        print(f"\n결측값 현황:")
        for col, cnt in null_counts.items():
            print(f"  {col}: {cnt}건")


# =============================================
# 메인 실행
# =============================================
if __name__ == "__main__":
    print("=" * 50)
    print("  조선시대 사적지 데이터 수집 시작")
    print("=" * 50)

    records = collect_all()

    if records:
        save(records)
        print("\n미리보기 (상위 3건):")
        for r in records[:3]:
            print(f"  {r['id']}. {r['name']} | {r['category']} | tags: {r['tags']}")
    else:
        print("\n⚠️  수집된 데이터가 없습니다.")