from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Place
import json

router = APIRouter(prefix="/places", tags=["places"])

def place_to_dict(p):
    return {
        "id":          p.id,
        "name":        p.name,
        "category":    p.category,
        "description": p.description,
        "image_url":   p.image_url,
        "lat":         p.lat,
        "lng":         p.lng,
        "address":     p.address,
        "tags":        json.loads(p.tags)  if p.tags  else [],
        "extra":       json.loads(p.extra) if p.extra else {},
        "opening_hours": p.opening_hours,  # ← 추가
        "fee":           p.fee,
        "summary":       p.summary,  
    }

@router.get("")
def get_places(
    category: str = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Place)
    if category:
        q = q.filter(Place.category == category)
    places = q.all()
    return [place_to_dict(p) for p in places]

@router.get("/{place_id}")
def get_place(place_id: str, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="장소를 찾을 수 없어요")
    return place_to_dict(place)