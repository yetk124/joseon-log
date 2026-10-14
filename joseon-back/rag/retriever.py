import chromadb
from sentence_transformers import SentenceTransformer
from functools import lru_cache

CHROMA_PATH = "./chroma_db"
COLLECTION  = "joseon"
DEFAULT_THRESHOLD = 0.5  # eval/run_eval.py --retrieval-only --sweep 결과로 조정

@lru_cache(maxsize=1)
def _load():
    """서버 시작 후 첫 호출 시 1회만 로드"""
    embedder   = SentenceTransformer("jhgan/ko-sroberta-multitask")
    client     = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_collection(COLLECTION)
    return embedder, collection

def search_detailed(query: str, top_k: int = 4, normalize: bool = True) -> list[dict]:
    """[{id, doc, distance}] — 거리 오름차순(낮을수록 유사)
    normalize=False 는 개선 전(v1) 동작 재현용"""
    embedder, collection = _load()
    q_emb   = embedder.encode([query], normalize_embeddings=normalize).tolist()
    res = collection.query(query_embeddings=q_emb, n_results=top_k,
                           include=["documents", "distances"])
    return [{"id": i, "doc": d, "distance": float(dist)}
            for i, d, dist in zip(res["ids"][0], res["documents"][0], res["distances"][0])]

def search(query: str, top_k: int = 4) -> list[str]:
    return [r["doc"] for r in search_detailed(query, top_k)]

def search_with_score(query: str, top_k: int = 4, threshold: float = DEFAULT_THRESHOLD) -> list[str]:
    return [r["doc"] for r in search_detailed(query, top_k) if r["distance"] < threshold]
