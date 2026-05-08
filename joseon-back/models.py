from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy import Column, Integer, String, Text, Float, Date, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from database import Base
from datetime import datetime
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    email         = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=True)   # ← nullable=False → True 변경
    nickname      = Column(String(50), nullable=False)
    profile_image = Column(Text, nullable=True)
    provider      = Column(String(20), default="local")  # ← 추가 ('local', 'kakao', 'google')
    provider_id   = Column(String(100), nullable=True)   # ← 추가 (카카오/구글 고유 ID)
    created_at    = Column(DateTime, server_default=func.now())
    updated_at    = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Review(Base):
    __tablename__ = "reviews"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, nullable=False)
    place_id   = Column(String(50), nullable=False)
    rating     = Column(Float, nullable=False)
    content    = Column(Text, nullable=True)
    tags       = Column(Text, nullable=True)
    visited_at = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class King(Base):
    __tablename__ = "kings"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String(20),  nullable=False)
    birth       = Column(Integer,     nullable=True)
    death       = Column(Integer,     nullable=True)
    reign       = Column(String(20),  nullable=True)   # ← 재위기간 ("1392~1398")
    era         = Column(String(30),  nullable=True)   # ← 시대구분 ("건국")
    description = Column(Text,        nullable=True)
    tags        = Column(Text,        nullable=True)
    url         = Column(String(200), nullable=True)
    achievement = Column(Text,        nullable=True)
    image_url = Column(String(500), nullable=True)

class Place(Base):
    __tablename__ = "places"

    id          = Column(String(50),  primary_key=True)
    name        = Column(String(100), nullable=False)
    category    = Column(String(20),  nullable=True)
    description = Column(Text,        nullable=True)
    image_url   = Column(Text,        nullable=True)
    lat         = Column(Float,       nullable=True)
    lng         = Column(Float,       nullable=True)
    address     = Column(String(200), nullable=True)
    tags        = Column(Text,        nullable=True)
    extra       = Column(Text,        nullable=True)
    opening_hours = Column(String(200), nullable=True)  # ← 추가
    fee           = Column(String(200), nullable=True)  # ← 추가
    summary       = Column(Text,        nullable=True)

class StampTour(Base):
    __tablename__ = "stamp_tours"

    id          = Column(Integer,     primary_key=True, autoincrement=True)
    title       = Column(String(100), nullable=False)
    description = Column(Text,        nullable=True)
    place_ids   = Column(Text,        nullable=False)
    total_count = Column(Integer,     default=0)
    created_at  = Column(DateTime,    server_default=func.now())

class Stamp(Base):
    __tablename__ = "stamps"

    id         = Column(Integer,    primary_key=True, autoincrement=True)
    user_id    = Column(Integer,    nullable=False)
    tour_id    = Column(Integer,    nullable=False)
    place_id   = Column(String(50), nullable=False)
    photo_url  = Column(Text,       nullable=True)
    visited_at = Column(Date,       nullable=True)
    stamped_at = Column(DateTime,   server_default=func.now())

class PlacePhoto(Base):
    __tablename__ = 'place_photos'
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    place_id   = Column(String(50), ForeignKey('places.id', ondelete='CASCADE'))
    photo_url  = Column(Text)
    caption    = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user       = relationship('User', backref='photos')

class PhotoLike(Base):
    __tablename__ = 'photo_likes'
    id         = Column(Integer, primary_key=True, index=True)
    photo_id   = Column(Integer, ForeignKey('place_photos.id', ondelete='CASCADE'))
    user_id    = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    created_at = Column(DateTime, default=datetime.utcnow)

class PhotoComment(Base):
    __tablename__ = 'photo_comments'
    id         = Column(Integer, primary_key=True, index=True)
    photo_id   = Column(Integer, ForeignKey('place_photos.id', ondelete='CASCADE'))
    user_id    = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    content    = Column(String(300))
    created_at = Column(DateTime, default=datetime.utcnow)
    user       = relationship('User', backref='photo_comments')