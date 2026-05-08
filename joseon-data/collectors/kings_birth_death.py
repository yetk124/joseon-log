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

KING_PATTERNS = [
    r"조선의?\s*제\d+대",
    r"조선\s*후기\s*,?\s*제\d+대",
    r"조선시대\s*제\d+대",
]


# =============================================
# 1단계: 검색 → 링크 수집 (기존 코드 재사용)
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
# 2단계: birth, death 추출
# =============================================
def extract_year(text: str) -> str | None:
    """연도 숫자만 추출: "1357년(공민왕 6)" → "1357" """
    match = re.search(r"\d{3,4}", text)
    return match.group(0) if match else None


def extract_birth_death(soup) -> tuple[str | None, str | None]:
    """
    div.property 안의 모든 li를 순회하며
    <strong> 키 텍스트로 출생/사망 연도 추출
    """
    birth = None
    death = None

    # ul.list 구조와 일반 li 구조 모두 커버
    items = soup.select("#meta div.property li")

    for item in items:
        strong = item.select_one("strong")
        span = item.select_one("span")
        if not strong or not span:
            continue

        key = strong.get_text(strip=True)
        value = span.get_text(strip=True)

        if "출생" in key:
            birth = extract_year(value)
        elif "사망" in key:
            death = extract_year(value)

    return birth, death


def crawl_birth_death(url: str, king_name: str, king_id: int) -> dict:
    """왕 상세 페이지에서 birth, death만 크롤링"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        print(f"    ⚠️  페이지 로딩 실패: {e}")
        return {"id": king_id, "name": king_name, "birth": None, "death": None}

    birth, death = extract_birth_death(soup)

    return {"id": king_id, "name": king_name, "birth": birth, "death": death}


# =============================================
# 3단계: CSV 저장 (birth, death만)
# =============================================
def save_to_csv(results: list[dict], filename: str = "joseon_kings_birth_death.csv"):
    fieldnames = ["id", "name", "birth", "death"]
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
    print(f"\n💾 CSV 저장 완료: {filename}")


# =============================================
# 메인 실행
# =============================================
def main():
    all_results = []

    print("=" * 60)
    print("  조선 왕 birth/death 크롤링 시작")
    print("=" * 60)

    for idx, king in enumerate(JOSEON_KINGS, start=1):
        print(f"\n[{idx:02d}/27] {king} 처리 중...")

        # 링크 찾기
        try:
            link = search_king(king)
        except Exception as e:
            print(f"  ❌ 검색 실패: {e}")
            link = None

        if not link:
            print(f"  ❌ 링크를 찾지 못함 → null 처리")
            all_results.append({"id": idx, "name": king, "birth": None, "death": None})
            time.sleep(0.5)
            continue

        print(f"  🔗 {link}")

        # birth, death 크롤링
        time.sleep(0.5)
        data = crawl_birth_death(link, king, idx)
        all_results.append(data)

        print(f"  ✅ birth: {data['birth']}")
        print(f"  ✅ death: {data['death']}")

        time.sleep(0.5)

    # CSV 저장
    save_to_csv(all_results)

    print("\n" + "=" * 60)
    print("  최종 결과 요약")
    print("=" * 60)
    for row in all_results:
        ok = "✅" if row["birth"] else "❌"
        print(f"  {ok} {row['id']:02d}. {row['name']:<4} | birth: {row['birth']} | death: {row['death']}")


if __name__ == "__main__":
    main()