import requests
from bs4 import BeautifulSoup
import re
import time
import csv
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
# 조선 왕 설명 텍스트 패턴 목록
#   "조선의 제2대"       → 정종, 태종 등
#   "조선 후기 제22대"   → 순조 등
#   "조선 후기, 제16대"  → 인조 등
#   "조선시대 제10대"    → 연산군 등
# =============================================
KING_PATTERNS = [
    r"조선의?\s*제\d+대",            # 조선의 제n대 / 조선 제n대
    r"조선\s*후기\s*,?\s*제\d+대",   # 조선 후기 제n대 / 조선 후기, 제n대
    r"조선시대\s*제\d+대",           # 조선시대 제n대
]


def is_joseon_king(text: str) -> bool:
    """텍스트가 조선 왕 설명 패턴과 일치하는지 확인"""
    for pattern in KING_PATTERNS:
        if re.search(pattern, text):
            return True
    return False


def search_king(king_name: str) -> str | None:
    """
    왕 이름으로 검색해서 조선 왕 항목의 링크를 반환.
    못 찾으면 None 반환.
    """
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


def find_all_king_links() -> list[dict]:
    """
    27대 왕 전체 링크를 리스트로 반환.
    [{ "순번": 1, "왕": "태조", "링크": "https://..." }, ...]
    """
    results = []

    print("=" * 55)
    print("  조선 왕 링크 수집 시작")
    print("=" * 55)

    for idx, king in enumerate(JOSEON_KINGS, start=1):
        try:
            link = search_king(king)
            if link:
                print(f"  [{idx:02d}/27] ✅ {king} → {link}")
            else:
                print(f"  [{idx:02d}/27] ❌ {king} → 링크를 찾지 못했습니다")

            results.append({
                "순번": idx,
                "왕": king,
                "링크": link if link else ""
            })

        except Exception as e:
            print(f"  [{idx:02d}/27] ⚠️  {king} → 오류: {e}")
            results.append({
                "순번": idx,
                "왕": king,
                "링크": ""
            })

        time.sleep(0.5)

    print("=" * 55)
    found = sum(1 for r in results if r["링크"])
    print(f"  수집 완료: {found}/27 성공")
    print("=" * 55)

    return results


def save_to_csv(results: list[dict], filename: str = "joseon_kings.csv"):
    """결과를 CSV 파일로 저장"""
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["순번", "왕", "링크"])
        writer.writeheader()
        writer.writerows(results)
    print(f"\n💾 CSV 저장 완료: {filename}")


if __name__ == "__main__":
    king_links = find_all_king_links()
    save_to_csv(king_links)

    print("\n📋 최종 결과:")
    for row in king_links:
        status = row["링크"] if row["링크"] else "❌ 없음"
        print(f"  {row['순번']:02d}. {row['왕']}: {status}")