from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import King
import json

router = APIRouter(prefix="/kings", tags=["kings"])

# era 매핑 (DB값 → 프론트값)
ERA_MAP = {
    '건국': '건국',
    '초기': '전기',   # ← 이게 핵심!
    '중기': '중기',
    '후기': '후기',
    '말기': '말기',
}

def king_to_dict(k):
    return {
        "id":          k.id,
        "king_id":     k.id,
        "name":        k.name,
        "full_name":   None,
        "birth":       k.birth,
        "death":       k.death,
        "reign":       k.era,                          # ← era에 재위기간 있음
        "era":         ERA_MAP.get(k.reign, k.reign),  # ← reign에 시대구분 있음
        "emoji":       None,
        "description": k.description,
        "achievement": k.achievement,
        "tags":        json.loads(k.tags) if k.tags else [],
        "tomb_name":   None,
        "url":         k.url,
        "image_url":   k.image_url,
    }
@router.get("")
def get_kings(db: Session = Depends(get_db)):
    kings = db.query(King).order_by(King.id).all()
    return [king_to_dict(k) for k in kings]

@router.get("/{king_id}")
def get_king(king_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    king = db.query(King).filter(King.id == king_id).first()
    if not king:
        raise HTTPException(status_code=404, detail="왕 정보를 찾을 수 없어요")
    return king_to_dict(king)