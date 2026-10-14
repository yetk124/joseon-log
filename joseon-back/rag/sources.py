"""검색된 문서 → 사용자에게 보여줄 출처 제목 (예: '세종 (재위 1418~1450)', '5.8. 교육')"""
import os
import re
from functools import lru_cache

MD_PATH = "./data/joseon.md"
HEADER  = re.compile(r"^#{1,4}\s+(.+)$", re.M)
KING    = re.compile(r"왕 이름:\s*([^|]+?)\s*\|\s*재위:\s*([^|]+?)\s*\|")


@lru_cache(maxsize=1)
def _md_text() -> str:
    if not os.path.exists(MD_PATH):
        return ""
    with open(MD_PATH, encoding="utf-8") as f:
        return f.read()


def _clean(header: str) -> str:
    return re.sub(r"[*`#]", "", header).strip()


def source_title(doc: str) -> str:
    m = KING.search(doc)
    if m:
        return f"{m.group(1)} (재위 {m.group(2)})"

    first = doc.lstrip().splitlines()[0] if doc.strip() else ""
    if first.startswith("#"):
        return _clean(first)

    # 긴 섹션이 잘린 청크: 원문에서 위치를 찾아 바로 위 소제목을 사용
    md = _md_text()
    pos = md.find(doc[:60])
    if pos > 0:
        headers = HEADER.findall(md[:pos])
        if headers:
            return _clean(headers[-1])
    return "조선 개요 (한국민족문화대백과사전)"


def source_footer(docs: list[str], answer: str) -> str:
    """답변에 실제로 인용된 번호만 표시 (인용이 없으면 전체)"""
    cited = sorted({int(n) for n in re.findall(r"\[(\d+)\]", answer) if 0 < int(n) <= len(docs)})
    nums  = cited or list(range(1, len(docs) + 1))
    lines = [f"[{n}] {source_title(docs[n - 1])}" for n in nums]
    return "\n\n참고 자료\n" + "\n".join(lines)
