from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth_router, reviews_router, kings_router, places_router, stamps_router, ai_router
from fastapi.staticfiles import StaticFiles
from routers import photos_router


Base.metadata.create_all(bind=engine)

app = FastAPI(title="이음 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # dev
        "http://localhost:4173",  # preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(reviews_router.router)
app.include_router(kings_router.router)
app.include_router(places_router.router)
app.include_router(stamps_router.router)
app.include_router(ai_router.router)
app.include_router(photos_router.router)

app.mount('/uploads', StaticFiles(directory='uploads'), name='uploads')