import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer
import os, re

CHROMA_PATH = "./chroma_db"
COLLECTION  = "joseon"

def chunk_markdown(text: str, size=600, overlap=80) -> list[str]:
    # 헤더(##) 기준으로 먼저 분할 후 size 초과 시 재분할
    sections = re.split(r'\n(?=#{1,3} )', text)
    chunks = []
    for section in sections:
        section = section.strip()
        if not section:
            continue
        if len(section) <= size:
            chunks.append(section)
        else:
            # 긴 섹션은 overlap 방식으로 재분할
            start = 0
            while start < len(section):
                chunks.append(section[start:start + size])
                start += size - overlap
    return [c for c in chunks if len(c) > 30]

def build_index():
    print("한국어 임베딩 모델 로딩 중...")
    embedder   = SentenceTransformer("jhgan/ko-sroberta-multitask")
    client     = chromadb.PersistentClient(path=CHROMA_PATH)

    # 기존 컬렉션 초기화 (재실행 시 중복 방지)
    try:
        client.delete_collection(COLLECTION)
    except:
        pass
    collection = client.create_collection(COLLECTION, metadata={"hnsw:space": "cosine"})  # 거리 = 1 - 코사인 유사도

    all_docs, all_ids = [], []

    # ── joseon.md 처리 ──
    md_path = "./data/joseon.md"
    if os.path.exists(md_path):
        with open(md_path, "r", encoding="utf-8") as f:
            md_chunks = chunk_markdown(f.read())
        for i, chunk in enumerate(md_chunks):
            all_docs.append(chunk)
            all_ids.append(f"md_{i}")
        print(f"✅ md 청크: {len(md_chunks)}개")
    else:
        print("⚠️  joseon.md 없음 — 스킵")

    # ── joseon.csv 처리 ──
    # 컬럼: id, name, birth, death, reign, era, desc, tags, url
    csv_path = "./data/joseon.csv"
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        for _, row in df.iterrows():
            text = (
                f"왕 이름: {row['name']} | "
                f"재위: {row['era']} | "
                f"시대: {row['reign']} | "
                f"생몰: {row['birth']}~{row['death']} | "
                f"설명: {row['desc']}"
            )
            if pd.notna(row.get('tags')) and row['tags']:
                text += f" | 태그: {row['tags']}"
            all_docs.append(text)
            all_ids.append(f"csv_{row['id']}")
        print(f"✅ csv 행: {len(df)}개")
    else:
        print("⚠️  joseon.csv 없음 — 스킵")

    # ── 임베딩 & 저장 ──
    print(f"총 {len(all_docs)}개 문서 임베딩 중...")
    embeddings = embedder.encode(all_docs, show_progress_bar=True, normalize_embeddings=True).tolist()
    collection.add(documents=all_docs, embeddings=embeddings, ids=all_ids)
    print(f"🎉 ChromaDB 저장 완료 → {CHROMA_PATH}/")

if __name__ == "__main__":
    build_index()