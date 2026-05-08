from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import SignupRequest, LoginRequest, LoginResponse
from auth import hash_password, verify_password, create_access_token, decode_token
import httpx
import base64
import json as _json
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일이에요")
    user = User(
        email         = req.email,
        password_hash = hash_password(req.password),
        nickname      = req.nickname
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "회원가입 완료", "user_id": user.id}

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸어요")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user_id":      user.id,
        "nickname":     user.nickname
    }

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않아요")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="유저를 찾을 수 없어요")
    return user

@router.post("/kakao")
async def kakao_login(payload: dict, db: Session = Depends(get_db)):
    code = payload.get("code")
    print("받은 code:", code)

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type":    "authorization_code",
                "client_id":     os.getenv("KAKAO_REST_KEY"),
                "redirect_uri":  os.getenv("KAKAO_REDIRECT_URI"),
                "code":          code,
                "client_secret": os.getenv("KAKAO_CLIENT_SECRET"),
            }
        )
    token_data = token_res.json()
    if "access_token" not in token_data:
        raise HTTPException(status_code=400, detail="카카오 토큰 발급 실패")

    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
    info = user_res.json()
    print("카카오 유저 정보:", info)

    kakao_id    = str(info["id"])
    kakao_acct  = info.get("kakao_account", {})
    email       = kakao_acct.get("email") or f"{kakao_id}@kakao.local"
    nickname    = kakao_acct.get("profile", {}).get("nickname") or f"사용자_{kakao_id[:4]}"
    profile_img = kakao_acct.get("profile", {}).get("profile_image_url")

    user = db.query(User).filter_by(provider="kakao", provider_id=kakao_id).first()
    if not user:
        user = db.query(User).filter_by(email=email).first()
        if user:
            user.provider    = "kakao"
            user.provider_id = kakao_id
        else:
            user = User(
                email=email,
                password_hash=None,
                nickname=nickname,
                profile_image=profile_img,
                provider="kakao",
                provider_id=kakao_id,
            )
            db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":            user.id,
            "email":         user.email,
            "nickname":      user.nickname,
            "profile_image": user.profile_image,
            "provider":      user.provider,
        }
    }

@router.post("/google")
async def google_login(payload: dict, db: Session = Depends(get_db)):
    code = payload.get("code")
    print("구글 받은 code:", code)

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code":          code,
                "client_id":     os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "redirect_uri":  os.getenv("GOOGLE_REDIRECT_URI"),
                "grant_type":    "authorization_code",
            }
        )
    token_data = token_res.json()
    print("구글 응답:", token_data)

    if "id_token" not in token_data:
        raise HTTPException(status_code=400, detail="구글 토큰 발급 실패")

    id_token_str = token_data["id_token"]
    part = id_token_str.split(".")[1]
    part += "=" * (-len(part) % 4)
    info = _json.loads(base64.b64decode(part))
    print("구글 유저 정보:", info)

    google_id   = info["sub"]
    email       = info.get("email") or f"{google_id}@google.local"
    nickname    = info.get("name") or f"사용자_{google_id[:4]}"
    profile_img = info.get("picture")

    user = db.query(User).filter_by(provider="google", provider_id=google_id).first()
    if not user:
        user = db.query(User).filter_by(email=email).first()
        if user:
            user.provider    = "google"
            user.provider_id = google_id
        else:
            user = User(
                email=email,
                password_hash=None,
                nickname=nickname,
                profile_image=profile_img,
                provider="google",
                provider_id=google_id,
            )
            db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":            user.id,
            "email":         user.email,
            "nickname":      user.nickname,
            "profile_image": user.profile_image,
            "provider":      user.provider,
        }
    }

@router.post("/logout")
async def logout(payload: dict, db: Session = Depends(get_db)):
    provider = payload.get("provider", "local")

    # 카카오 연동 해제
    if provider == "kakao":
        # 카카오는 서버 토큰이 없어서 클라이언트 로그아웃만 처리
        # (실제 연동 해제는 카카오 콘솔에서 하거나 어드민 키로 가능)
        pass

    # 구글은 별도 서버 처리 불필요 (토큰 만료로 자동 처리)

    return {"message": "로그아웃 완료"}