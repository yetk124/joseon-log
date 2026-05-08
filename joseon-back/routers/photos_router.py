import os, shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
from models import PlacePhoto, PhotoLike, PhotoComment, User
from schemas import PhotoResponse, CommentCreate, CommentResponse
from routers.auth_router import get_current_user
from fastapi.security import OAuth2PasswordBearer
from typing import Optional

router = APIRouter(prefix='/photos', tags=['photos'])

UPLOAD_DIR = 'uploads/photos'
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_photo_response(photo, db, current_user_id=None):
    like_count    = db.query(PhotoLike).filter(PhotoLike.photo_id == photo.id).count()
    comment_count = db.query(PhotoComment).filter(PhotoComment.photo_id == photo.id).count()
    liked = False
    if current_user_id:
        liked = db.query(PhotoLike).filter(
            PhotoLike.photo_id == photo.id,
            PhotoLike.user_id  == current_user_id
        ).first() is not None

    comments = db.query(PhotoComment).filter(
        PhotoComment.photo_id == photo.id
    ).order_by(PhotoComment.created_at.asc()).all()

    comment_list = []
    for c in comments:
        u = db.query(User).filter(User.id == c.user_id).first()
        comment_list.append({
            'id':         c.id,
            'photo_id':   c.photo_id,
            'user_id':    c.user_id,
            'nickname':   u.nickname if u else '알 수 없음',
            'content':    c.content,
            'created_at': c.created_at,
        })

    user  = db.query(User).filter(User.id == photo.user_id).first()
    
    # ── Place 테이블에서 장소명 가져오기 ──
    from models import Place
    place = db.query(Place).filter(Place.id == photo.place_id).first()

    return {
        'id':            photo.id,
        'user_id':       photo.user_id,
        'place_id':      photo.place_id,
        'place_name':    place.name if place else photo.place_id,  # ← 핵심!
        'photo_url':     photo.photo_url,
        'caption':       photo.caption,
        'created_at':    photo.created_at,
        'nickname':      user.nickname if user else '알 수 없음',
        'like_count':    like_count,
        'comment_count': comment_count,
        'liked':         liked,
        'comments':      comment_list,
    }

# ── 사진 업로드 ──
@router.post('')
async def upload_photo(
    place_id: str       = Form(...),
    caption:  str       = Form(None),
    file:     UploadFile = File(...),
    db:       Session   = Depends(get_db),
    current_user: User  = Depends(get_current_user),
):
    # 1인 1장 제한
    existing = db.query(PlacePhoto).filter(
        PlacePhoto.place_id == place_id,
        PlacePhoto.user_id  == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail='이미 사진을 등록하셨어요')

    # 파일 저장
    ext      = file.filename.split('.')[-1]
    filename = f'{current_user.id}_{place_id}_{int(__import__("time").time())}.{ext}'
    filepath = f'{UPLOAD_DIR}/{filename}'
    with open(filepath, 'wb') as f:
        shutil.copyfileobj(file.file, f)

    photo = PlacePhoto(
        user_id   = current_user.id,
        place_id  = place_id,
        photo_url = f'/uploads/photos/{filename}',
        caption   = caption,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return get_photo_response(photo, db, current_user.id)

# ── 장소별 사진 목록 ──
@router.get('/{place_id}')
def get_photos_by_place(
    place_id: str,
    sort:     str     = 'latest',
    db:       Session = Depends(get_db),
    token:    Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)),
):
    current_user_id = None
    if token:
        try:
            from auth import decode_token
            payload = decode_token(token)
            current_user_id = int(payload.get("sub"))
        except:
            pass

    photos = db.query(PlacePhoto).filter(
        PlacePhoto.place_id == place_id
    ).order_by(PlacePhoto.created_at.desc()).all()

    result = [get_photo_response(p, db, current_user_id) for p in photos]

    if sort == 'popular':
        result.sort(key=lambda x: x['like_count'], reverse=True)

    return result

# ── 내 사진 목록 ──
@router.get('/my/list')
def get_my_photos(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    photos = db.query(PlacePhoto).filter(
        PlacePhoto.user_id == current_user.id
    ).order_by(PlacePhoto.created_at.desc()).all()
    return [get_photo_response(p, db, current_user.id) for p in photos]

# ── 좋아요 토글 ──
@router.post('/{photo_id}/like')
def toggle_like(
    photo_id:     int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    existing = db.query(PhotoLike).filter(
        PhotoLike.photo_id == photo_id,
        PhotoLike.user_id  == current_user.id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {'liked': False}
    else:
        like = PhotoLike(photo_id=photo_id, user_id=current_user.id)
        db.add(like)
        db.commit()
        return {'liked': True}

# ── 댓글 작성 ──
@router.post('/{photo_id}/comments')
def add_comment(
    photo_id:     int,
    body:         CommentCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    comment = PhotoComment(
        photo_id = photo_id,
        user_id  = current_user.id,
        content  = body.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {
        'id':         comment.id,
        'photo_id':   comment.photo_id,
        'user_id':    comment.user_id,
        'nickname':   current_user.nickname,
        'content':    comment.content,
        'created_at': comment.created_at,
    }

# ── 댓글 삭제 ──
@router.delete('/{photo_id}/comments/{comment_id}')
def delete_comment(
    photo_id:     int,
    comment_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    comment = db.query(PhotoComment).filter(
        PhotoComment.id      == comment_id,
        PhotoComment.user_id == current_user.id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail='댓글을 찾을 수 없어요')
    db.delete(comment)
    db.commit()
    return {'message': '삭제됐어요'}

# ── 사진 삭제 ──
@router.delete('/{photo_id}')
def delete_photo(
    photo_id:     int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    photo = db.query(PlacePhoto).filter(
        PlacePhoto.id      == photo_id,
        PlacePhoto.user_id == current_user.id
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail='사진을 찾을 수 없어요')

    # 파일 삭제
    filepath = photo.photo_url.replace('/', os.sep).lstrip(os.sep)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(photo)
    db.commit()
    return {'message': '삭제됐어요'}