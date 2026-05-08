from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import json
from database import get_db
from models import Review, User
from routers.auth_router import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])

class ReviewRequest(BaseModel):
    place_id:   str
    rating:     float
    content:    Optional[str] = ""
    tags:       Optional[List[str]] = []
    visited_at: Optional[date] = None

@router.post("")
def create_review(
    req: ReviewRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    review = Review(
        user_id    = current_user.id,
        place_id   = req.place_id,
        rating     = req.rating,
        content    = req.content,
        tags       = json.dumps(req.tags, ensure_ascii=False),
        visited_at = req.visited_at,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"message": "리뷰가 등록됐어요", "review_id": review.id}

@router.get("/{place_id}")
def get_reviews(place_id: str, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.place_id == place_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        result.append({
            "id":         r.id,
            "user_id":    r.user_id,
            "nickname":   user.nickname if user else "익명",  # ← 닉네임 추가
            "rating":     r.rating,
            "content":    r.content,
            "tags":       json.loads(r.tags) if r.tags else [],
            "visited_at": str(r.visited_at) if r.visited_at else None,
            "created_at": str(r.created_at),
        })
    return result

# 내 리뷰 목록 (RecordPage용)
@router.get("/my/reviews")
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        {
            "id":         r.id,
            "place_id":   r.place_id,
            "rating":     r.rating,
            "content":    r.content,
            "tags":       json.loads(r.tags) if r.tags else [],
            "visited_at": str(r.visited_at) if r.visited_at else None,
            "created_at": str(r.created_at),
        }
        for r in reviews
    ]