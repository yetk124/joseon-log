from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database import get_db
from models import Stamp, StampTour
from routers.auth_router import get_current_user
import json

router = APIRouter(prefix="/stamps", tags=["stamps"])

class StampCreate(BaseModel):
    tour_id:    int
    place_id:   str
    photo_url:  Optional[str] = None
    visited_at: Optional[date] = None

@router.get("/my")
def get_my_stamps(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    stamps = db.query(Stamp).filter(Stamp.user_id == current_user.id).all()
    tours  = db.query(StampTour).all()

    result = []
    for tour in tours:
        place_ids   = json.loads(tour.place_ids) if tour.place_ids else []
        my_stamps   = [s for s in stamps if s.tour_id == tour.id]
        stamped_ids = [s.place_id for s in my_stamps]
        result.append({
            "tour_id":     tour.id,
            "title":       tour.title,
            "description": tour.description,
            "place_ids":   place_ids,
            "total_count": tour.total_count,
            "stamped":     stamped_ids,
            "stamps": [
                {
                    "place_id":   s.place_id,
                    "photo_url":  s.photo_url,
                    "visited_at": str(s.visited_at) if s.visited_at else None,
                    "stamped_at": str(s.stamped_at),
                }
                for s in my_stamps
            ],
        })
    return result

@router.post("")
def create_stamp(
    req: StampCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 중복 체크
    existing = db.query(Stamp).filter(
        Stamp.user_id  == current_user.id,
        Stamp.tour_id  == req.tour_id,
        Stamp.place_id == req.place_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 스탬프를 찍었어요")

    stamp = Stamp(
        user_id    = current_user.id,
        tour_id    = req.tour_id,
        place_id   = req.place_id,
        photo_url  = req.photo_url,
        visited_at = req.visited_at,
    )
    db.add(stamp)
    db.commit()
    db.refresh(stamp)
    return {"message": "스탬프 등록 완료", "stamp_id": stamp.id}