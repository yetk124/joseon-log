from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class SignupRequest(BaseModel):
    email:    EmailStr
    password: str
    nickname: str

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type:   str
    user_id:      int
    nickname:     str

# ── 사진 댓글 ──
class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id:         int
    photo_id:   int
    user_id:    int
    nickname:   str
    content:    str
    created_at: datetime

    class Config:
        from_attributes = True

# ── 사진 ──
class PhotoResponse(BaseModel):
    id:            int
    user_id:       int
    place_id:      str
    photo_url:     str
    caption:       Optional[str]
    created_at:    datetime
    nickname:      str
    like_count:    int
    comment_count: int
    liked:         bool = False
    comments:      List[CommentResponse] = []

    class Config:
        from_attributes = True

# ── 왕 ──
class KingResponse(BaseModel):
    id:          int
    king_id:     Optional[int]    = None  # 몇 대 왕인지
    name:        str
    birth:       Optional[str]    = None
    death:       Optional[str]    = None
    reign:       Optional[str]    = None
    era:         Optional[str]    = None
    description: Optional[str]    = None
    tags:        Optional[List[str]] = []
    url:         Optional[str]    = None
    achievement: Optional[str]    = None
    image_url:   Optional[str]    = None  # ← 추가된 필드

    class Config:
        from_attributes = True