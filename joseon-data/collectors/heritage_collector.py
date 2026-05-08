"""
궁궐·종묘 데이터 수집
실행 위치 : collectors/HeritageCollector
실행 명령 : python heritage_collector.py

결과물: ../data/palaces_raw.json, ../data/palaces_clean.csv
"""

import requests
import xml.etree.ElementTree as ET
import pandas as pd
import time
from pathlib import Path

LIST_URL   = "https://www.heritage.go.kr/heri/gungDetail/gogungListOpenApi.do"
DETAIL_URL = "https://www.heritage.go.kr/heri/gungDetail/gogungDetailOpenApi.do"

GUNG_MAP = {1: '경복궁', 2: '창덕궁', 3: '창경궁', 4: '덕수궁', 5: '종묘'}

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)


def get_text(element, tag):
    """태그 텍스트 안전하게 추출 (CDATA 포함, 없으면 None)"""
    node = element.find(tag)
    if node is not None and node.text:
        return node.text.strip()
    return None   # ← 없으면 None (JSON에서 null로 저장됨)


# ── STEP 1. 목록 수집 ─────────────────────────────────────────────
def fetch_list(gung_number):
    try:
        res = requests.get(
            LIST_URL,
            params={"gung_number": gung_number},
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        res.encoding = 'utf-8'
        root = ET.fromstring(res.text)
    except Exception as e:
        print(f"  ⚠️  목록 요청 실패: {e}")
        return []

    items = []
    for node in root.findall('list'):
        items.append({
            # ── API에서 가져오는 필드 ──
            'serial_number': get_text(node, 'serial_number'),
            'gung_number':   gung_number,
            'gung_name':     GUNG_MAP[gung_number],
            'name':          get_text(node, 'contents_kor'),     # contents_kor
            'name_en':       get_text(node, 'contents_eng'),     # contents_eng (선택)
            'description':   get_text(node, 'explanation_kor'),  # explanation_kor
            'image_url':     get_text(node, 'imgUrl'),           # imgUrl
            'detail_code':   get_text(node, 'detail_code'),      # 상세 호출용

            # ── API에 없어서 null ──
            'detail_images': None,   # 상세 API에서 추가 (image 필드)
            'lat':           None,   # 카카오 API 또는 수동 입력 예정
            'lng':           None,
            'address':       None,
            'tags':          None,
            'category':      '궁궐',
        })
    return items


# ── STEP 2. 상세 수집 ─────────────────────────────────────────────
def fetch_detail(serial_number, gung_number, detail_code):
    """상세 API에서 추가 필드 수집 (detail_images 등)"""
    try:
        res = requests.get(
            DETAIL_URL,
            params={
                "serial_number": serial_number,
                "gung_number":   gung_number,
                "detail_code":   detail_code,
            },
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        res.encoding = 'utf-8'
        root = ET.fromstring(res.text)
    except Exception as e:
        print(f"  ⚠️  상세 요청 실패 (serial={serial_number}): {e}")
        return {}

    node = root.find('list')
    if node is None:
        return {}

    return {
        # 목록에 없던 필드만 추가로 가져옴
        'name':          get_text(node, 'contents_kor'),
        'name_en':       get_text(node, 'contents_eng'),
        'description':   get_text(node, 'explanation_kor'),
        'image_url':     get_text(node, 'imgUrl'),
        'detail_images': get_text(node, 'image'),    # 상세 이미지
        # moving(동영상)은 제외
    }


# ── STEP 3. 전체 파이프라인 ──────────────────────────────────────
def collect_all():
    all_records = []

    for gung_num in range(1, 6):
        gung_name = GUNG_MAP[gung_num]
        print(f"\n[{gung_name}] 목록 수집 중...")

        items = fetch_list(gung_num)
        if not items:
            print(f"  → 데이터 없음")
            continue

        print(f"  → {len(items)}개 항목 발견")

        for i, item in enumerate(items):
            # 목록에서 name + description + image_url 모두 있으면 상세 스킵
            if item['name'] and item['description'] and item['image_url']:
                all_records.append(item)
                continue

            # 없으면 상세 호출로 보완
            print(f"  상세 수집 중... ({i+1}/{len(items)})", end='\r')
            detail = fetch_detail(
                item['serial_number'],
                item['gung_number'],
                item['detail_code'],
            )
            # 상세에서 가져온 값으로 덮어쓰기 (None이 아닌 것만)
            for k, v in detail.items():
                if v is not None:
                    item[k] = v

            all_records.append(item)
            time.sleep(0.3)

        print(f"  [{gung_name}] 완료")

    if not all_records:
        print("\n⚠️  수집된 데이터가 없습니다.")
        return pd.DataFrame()

    # ── pandas 정제 ──
    df = pd.DataFrame(all_records)

    # 빈 이름 제거
    df = df[df['name'].notna() & (df['name'].str.strip() != '')]

    # 중복 제거
    df = df.drop_duplicates(subset=['serial_number', 'gung_number'])

    # 컬럼 순서 정리 — 필드 정의서 기준
    df = df[[
        'serial_number', 'gung_number', 'gung_name', 'category',
        'name', 'name_en',
        'description', 'image_url', 'detail_images',
        'lat', 'lng', 'address', 'tags',
    ]].reset_index(drop=True)

    # null 현황 출력
    print(f"\n결측값(null) 현황:")
    null_counts = df.isnull().sum()
    for col, cnt in null_counts[null_counts > 0].items():
        print(f"  {col}: {cnt}건 → 추후 보완 예정")

    # ── 저장 ──
    raw_path = DATA_DIR / "palaces_raw.json"
    csv_path = DATA_DIR / "palaces_clean.csv"

    df.to_json(raw_path, force_ascii=False, orient='records', indent=2)
    df.to_csv(csv_path,  index=False, encoding='utf-8-sig')

    print(f"\n✅ 완료! 총 {len(df)}건")
    print(f"   궁궐별: {df.groupby('gung_name')['name'].count().to_dict()}")
    print(f"\n   저장 위치:")
    print(f"   📄 {raw_path.resolve()}")
    print(f"   📄 {csv_path.resolve()}")

    return df


if __name__ == "__main__":
    print("=" * 45)
    print("  궁궐·종묘 데이터 수집 시작")
    print("=" * 45)
    df = collect_all()

    if not df.empty:
        print("\n미리보기 (상위 3건):")
        print(df[['gung_name', 'name', 'image_url', 'lat', 'address']].head(3).to_string())