import requests
from bs4 import BeautifulSoup
import re
import time
import csv
import json
from urllib.parse import quote

# =============================================
# 조선 27대 왕 이름 목록
# =============================================
JOSEON_KINGS = [
    "태조", "정종", "태종", "세종", "문종",
    "단종", "세조", "예종", "성종", "연산군",
    "중종", "인종", "명종", "선조", "광해군",
    "인조", "효종", "현종", "숙종", "경종",
    "영조", "정조", "순조", "헌종", "철종",
    "고종", "순종"
]

# =============================================
# 왕 순서 기준 시대 구분 매핑 (사용자 수정본)
# 1대       태조             → 건국
# 2~4대     정종~세종        → 초기
# 5~9대     문종~성종        → 중기
# 10~15대   연산군~광해군 직전 → 중기
# 15대      광해군           → 후기
# 16~22대   인조~정조        → 후기
# 23~27대   순조~순종        → 말기
# =============================================
KING_ERA_MAP = {
    "태조":   "건국",
    "정종":   "초기",
    "태종":   "초기",
    "세종":   "초기",
    "문종":   "중기",
    "단종":   "중기",
    "세조":   "중기",
    "예종":   "중기",
    "성종":   "중기",
    "연산군": "중기",
    "중종":   "중기",
    "인종":   "중기",
    "명종":   "중기",
    "선조":   "중기",
    "광해군": "후기",
    "인조":   "후기",
    "효종":   "후기",
    "현종":   "후기",
    "숙종":   "후기",
    "경종":   "후기",
    "영조":   "후기",
    "정조":   "후기",
    "순조":   "말기",
    "헌종":   "말기",
    "철종":   "말기",
    "고종":   "말기",
    "순종":   "말기",
}

BASE_URL = "https://encykorea.aks.ac.kr"
SEARCH_URL = "https://encykorea.aks.ac.kr/Article/Search?query={}"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# =============================================
# 조선 왕 검색 결과 패턴
# =============================================
KING_PATTERNS = [
    r"조선의?\s*제\d+대",
    r"조선\s*후기\s*,?\s*제\d+대",
    r"조선시대\s*제\d+대",
]


# =============================================
# 1단계: 검색 → 링크 수집
# =============================================
def is_joseon_king(text: str) -> bool:
    for pattern in KING_PATTERNS:
        if re.search(pattern, text):
            return True
    return False


def search_king(king_name: str) -> str | None:
    url = SEARCH_URL.format(quote(king_name))
    resp = requests.get(url, headers=HEADERS, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    items = soup.select(
        "#focus_cont > div.sub_cont > div.bo_gall.st_gall > ul > li"
    )

    for item in items:
        desc_tag = item.select_one("a > div.txt > p.desc")
        if not desc_tag:
            desc_tag = item.select_one("a > div.img > p") or item.select_one("a")

        desc_text = desc_tag.get_text(strip=True) if desc_tag else item.get_text(strip=True)

        if is_joseon_king(desc_text):
            link_tag = item.select_one("a")
            if link_tag and link_tag.get("href"):
                return BASE_URL + link_tag["href"]

    return None


# =============================================
# 2단계: 왕 상세 페이지 크롤링
# =============================================
def extract_reign_years(text: str) -> str | None:
    """
    #defi > div.detail > p 텍스트에서 재위 연도만 추출
    예: "조선의 제12대(재위: 1544년~1545년) 왕." → "1544~1545"
    """
    # '재위:' 포함된 괄호 안에서 연도만 추출
    match = re.search(r"재위\s*:\s*([\d~\-]+)", text)
    if match:
        # "1544년~1545년" → "1544~1545" (년 제거)
        years = match.group(1).replace("년", "").strip()
        return years

    # fallback: 그냥 숫자~숫자 패턴
    match2 = re.search(r"(\d{3,4})\s*[년]?\s*[~\-]\s*(\d{3,4})", text)
    if match2:
        return f"{match2.group(1)}~{match2.group(2)}"

    return None


def crawl_king_detail(url: str, king_name: str, king_id: int) -> dict:
    """왕 상세 페이지에서 데이터 크롤링"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        print(f"    ⚠️  페이지 로딩 실패: {e}")
        return _empty_row(king_id, king_name, url)

    # --- era: #defi > div.detail > p 에서 재위 연도 추출 ---
    era_tag = soup.select_one("#defi > div.detail > p")
    era_text = era_tag.get_text(strip=True) if era_tag else None
    era = extract_reign_years(era_text) if era_text else None

    # --- reign: KING_ERA_MAP에서 직접 매핑 ---
    reign = KING_ERA_MAP.get(king_name, None)

    # --- desc: 내용 요약 ---
    desc_tag = soup.select_one("#summary > div.detail > p")
    desc = desc_tag.get_text(strip=True) if desc_tag else None

    # desc 없으면 sect2로 fallback
    if not desc:
        desc2_tag = soup.select_one("#sect2 > div.detail")
        desc = desc2_tag.get_text(strip=True) if desc2_tag else None

    # --- tags: 키워드 리스트 ---
    tag_items = soup.select(
        "#summary > div.detail > div.detail_keyword > ul > li > a"
    )
    tags = [t.get_text(strip=True) for t in tag_items] if tag_items else None

    return {
        "id":   king_id,
        "name": king_name,
        "reign": reign,
        "era":  era,
        "desc": desc,
        "tags": tags,
        "url":  url
    }


def _empty_row(king_id: int, king_name: str, url: str | None) -> dict:
    return {
        "id":    king_id,
        "name":  king_name,
        "reign": KING_ERA_MAP.get(king_name, None),
        "era":   None,
        "desc":  None,
        "tags":  None,
        "url":   url
    }


# =============================================
# 3단계: CSV 저장
# =============================================
def save_to_csv(results: list[dict], filename: str = "joseon_kings.csv"):
    fieldnames = ["id", "name", "reign", "era", "desc", "tags", "url"]
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in results:
            row_copy = row.copy()
            if isinstance(row_copy["tags"], list):
                row_copy["tags"] = json.dumps(row_copy["tags"], ensure_ascii=False)
            writer.writerow(row_copy)
    print(f"\n💾 CSV 저장 완료: {filename}")


# =============================================
# 메인 실행
# =============================================
def main():
    all_results = []

    print("=" * 60)
    print("  조선 왕 데이터 크롤링 시작")
    print("=" * 60)

    for idx, king in enumerate(JOSEON_KINGS, start=1):
        print(f"\n[{idx:02d}/27] {king} 처리 중...")

        # 1단계: 링크 찾기
        try:
            link = search_king(king)
        except Exception as e:
            print(f"  ❌ 검색 실패: {e}")
            link = None

        if not link:
            print(f"  ❌ 링크를 찾지 못함 → null 처리")
            all_results.append(_empty_row(idx, king, None))
            time.sleep(0.5)
            continue

        print(f"  🔗 {link}")

        # 2단계: 상세 페이지 크롤링
        time.sleep(0.5)
        data = crawl_king_detail(link, king, idx)
        all_results.append(data)

        print(f"  ✅ reign(시대): {data['reign']}")
        print(f"  ✅ era(재위기간): {data['era']}")
        print(f"  ✅ tags: {data['tags']}")
        print(f"  ✅ desc: {str(data['desc'])[:40]}..." if data['desc'] else "  ❌ desc: None")

        time.sleep(0.5)

    # 3단계: CSV 저장
    save_to_csv(all_results)

    print("\n" + "=" * 60)
    print("  최종 결과 요약")
    print("=" * 60)
    for row in all_results:
        ok = "✅" if row["era"] else "❌"
        print(f"  {ok} {row['id']:02d}. {row['name']:<4} | reign: {row['reign']} | era: {row['era']}")


if __name__ == "__main__":
    main()