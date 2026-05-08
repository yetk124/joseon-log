import chromadb
from sentence_transformers import SentenceTransformer
from functools import lru_cache

CHROMA_PATH = "./chroma_db"
COLLECTION  = "joseon"

@lru_cache(maxsize=1)
def _load():
    """서버 시작 후 첫 호출 시 1회만 로드"""
    embedder   = SentenceTransformer("jhgan/ko-sroberta-multitask")
    client     = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_collection(COLLECTION)
    return embedder, collection

def search(query: str, top_k: int = 4) -> list[str]:
    embedder, collection = _load()
    q_emb   = embedder.encode([query]).tolist()
    results = collection.query(query_embeddings=q_emb, n_results=top_k)
    return results["documents"][0]

def search_with_score(query: str, top_k: int = 4, threshold: float = 0.5) -> list[str]:
    embedder, collection = _load()
    q_emb   = embedder.encode([query]).tolist()
    results = collection.query(
        query_embeddings=q_emb,
        n_results=top_k,
        include=["documents", "distances"]
    )
    docs      = results["documents"][0]
    distances = results["distances"][0]

    # 유사도 낮은 문서 필터링 (distance가 낮을수록 유사도 높음)
    filtered = [doc for doc, dist in zip(docs, distances) if dist < threshold]
    return filtered  # 관련 문서 없으면 빈 리스트 반환