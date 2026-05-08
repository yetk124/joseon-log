// src/pages/PlacePhotoGalleryPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, SlidersHorizontal, Camera, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { photosAPI } from '../api/api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const PLACE_NAMES = {
  'site_palace_1': '경복궁', 'site_palace_2': '창덕궁',
  'site_palace_3': '창경궁', 'site_palace_4': '덕수궁',
  'palace_gyeonghee': '경희궁', 'sajuk_65': '김제군 관아와 향교',
}

// ── 필터 칩 ──
function FilterChipBar({ active, onChange }) {
  const filters = ['전체', '최신순', '인기순']
  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto',
      padding: '10px 16px 12px',
      scrollbarWidth: 'none', msOverflowStyle: 'none',
    }}>
      {filters.map(f => (
        <button key={f} onClick={() => onChange(f)}
          style={{
            flexShrink: 0, padding: '6px 16px', borderRadius: 99,
            fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            transition: 'all 0.2s',
            background: active === f ? '#A07840' : 'white',
            color: active === f ? 'white' : '#7A6A50',
            boxShadow: active === f
              ? '0 4px 12px rgba(160,120,64,0.3)'
              : '0 1px 4px rgba(0,0,0,0.07)',
          }}>
          {f}
        </button>
      ))}
    </div>
  )
}

// ── 사진 카드 ──
function PhotoCard({ photo, onClick }) {
  return (
    <div onClick={() => onClick(photo)}
         style={{
           borderRadius: 16, overflow: 'hidden', background: 'white',
           boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer',
           transition: 'all 0.2s',
         }}
         onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'}
         onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'}>
      <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
        <img src={`${API}${photo.photo_url}`} alt=""
             style={{ width: '100%', height: '100%', objectFit: 'cover',
                      transition: 'transform 0.3s' }}
             onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
             onError={e => { e.currentTarget.style.display = 'none' }} />
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: 6 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#2A1E10' }}>{photo.nickname}</p>
          <p style={{ fontSize: 10, color: '#C4B49A' }}>
            {photo.created_at?.slice(0, 10).replace(/-/g, '.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#C4B49A',
                         display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ color: photo.liked ? '#E05050' : '#C4B49A' }}>
              {photo.liked ? '♥' : '♡'}
            </span>
            {photo.like_count || 0}
          </span>
          <span style={{ fontSize: 11, color: '#C4B49A',
                         display: 'flex', alignItems: 'center', gap: 3 }}>
            💬 {photo.comment_count || 0}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── 사진 그리드 ──
function PhotoGrid({ photos, onPhotoClick }) {
  if (photos.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: '#F0EAE0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <Camera size={26} color="#C4B49A" strokeWidth={1.5} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#5C4A32', marginBottom: 6 }}>
          아직 사진이 없어요
        </p>
        <p style={{ fontSize: 12, color: '#B0A090' }}>첫 방문 기록을 남겨보세요</p>
      </div>
    )
  }
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 10, padding: '0 16px 100px',
    }}>
      {photos.map(photo => (
        <PhotoCard key={photo.id} photo={photo} onClick={onPhotoClick} />
      ))}
    </div>
  )
}

// ── 사진 뷰어 모달 ──
function PhotoViewerModal({ photos, initialIndex, onClose, onLike, onComment, onDelete }) {
  const { user } = useAuth()
  const [current,      setCurrent]      = useState(initialIndex)
  const [commentInput, setCommentInput] = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  const photo = photos[current]
  const prev  = () => setCurrent(i => Math.max(0, i - 1))
  const next  = () => setCurrent(i => Math.min(photos.length - 1, i + 1))

  const handleComment = async () => {
    if (!commentInput.trim() || submitting) return
    setSubmitting(true)
    await onComment(photo.id, commentInput.trim(), setCurrent, current)
    setCommentInput('')
    setSubmitting(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: '#F5F1EB',
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
      fontFamily: "'Noto Serif KR', 'Noto Sans KR', serif",
    }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '52px 16px 14px',
        background: '#F5F1EB',
        borderBottom: '1px solid #F0EAE0',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1208' }}>{photo.nickname}</p>
          <p style={{ fontSize: 10, color: '#B0A090', marginTop: 2 }}>
            {photo.created_at?.slice(0, 10).replace(/-/g, '.')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(user?.nickname === photo.nickname || String(user?.user_id) === String(photo.user_id)) && (
            <button onClick={() => onDelete(photo.id)} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(220,50,50,0.1)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Trash2 size={14} color="#E05050" />
            </button>
          )}
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(160,120,64,0.1)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ArrowLeft size={15} color="#A07840" />
          </button>
        </div>
      </div>

      {/* 사진 */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', flexShrink: 0 }}>
        <img src={`${API}${photo.photo_url}`} alt=""
             style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {current > 0 && (
          <button onClick={prev} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.9)',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <ChevronLeft size={14} color="#A07840" strokeWidth={2.5} />
          </button>
        )}
        {current < photos.length - 1 && (
          <button onClick={next} style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)',
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.9)',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <ChevronRight size={14} color="#A07840" strokeWidth={2.5} />
          </button>
        )}
        <div style={{
          position: 'absolute', bottom: 12, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
          borderRadius: 99, padding: '4px 12px',
        }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>
            {current + 1} / {photos.length}
          </p>
        </div>
      </div>

      {/* 좋아요 + 댓글 수 */}
      <div style={{ display: 'flex', gap: 16, padding: '12px 16px',
                    borderBottom: '1px solid #F0EAE0', background: 'white' }}>
        <button onClick={() => onLike(photo.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                         display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <span style={{
            fontSize: 18, transition: 'all 0.15s', display: 'inline-block',
            color: photo.liked ? '#E05050' : '#C4B49A',
            transform: photo.liked ? 'scale(1.2)' : 'scale(1)',
          }}>
            {photo.liked ? '♥' : '♡'}
          </span>
          <span style={{ fontSize: 12, color: '#9A8A70' }}>{photo.like_count || 0}</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, color: '#C4B49A' }}>💬</span>
          <span style={{ fontSize: 12, color: '#9A8A70' }}>{photo.comment_count || 0}</span>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px',
                    background: 'white', minHeight: 0 }}>
        {(photo.comments || []).length === 0 ? (
          <p style={{ fontSize: 11, color: '#B0A090',
                      textAlign: 'center', paddingTop: 20 }}>
            첫 번째 댓글을 남겨보세요
          </p>
        ) : (
          (photo.comments || []).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(160,120,64,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: '#A07840',
              }}>
                {c.nickname?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2A1E10' }}>
                    {c.nickname}
                  </span>
                  <span style={{ fontSize: 11, color: '#7A6A50' }}>{c.content}</span>
                </div>
                <p style={{ fontSize: 9, color: '#C4B49A', marginTop: 2 }}>
                  {c.created_at?.slice(0, 10).replace(/-/g, '.')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 댓글 입력 */}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 16px',
                      borderTop: '1px solid #F0EAE0',
                      background: 'white' }}>
          <input type="text" placeholder="댓글 달기..."
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleComment() }}
            style={{
              flex: 1, background: '#F5F0E8',
              border: '1px solid #E8DDD0',
              borderRadius: 20, padding: '8px 14px',
              fontSize: 11, color: '#2A1E10', outline: 'none',
            }} />
          <button onClick={handleComment} disabled={!commentInput.trim() || submitting}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, padding: '0 4px',
                    color: commentInput.trim() ? '#C9A84C' : '#E0D5C5',
                    transition: 'color 0.15s',
                  }}>➤</button>
        </div>
      ) : (
        <div style={{ padding: '12px 16px', textAlign: 'center',
                      borderTop: '1px solid #F0EAE0', background: 'white' }}>
          <p style={{ fontSize: 11, color: '#B0A090' }}>
            댓글을 달려면 로그인이 필요해요
          </p>
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ──
export default function PlacePhotoGalleryPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [filter,        setFilter]        = useState('전체')
  const [photos,        setPhotos]        = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading,       setLoading]       = useState(true)
  const loaderRef = useRef(null)

  const [placeName, setPlaceName] = useState('불러오는 중...')

  useEffect(() => {
  fetch(`${API}/places/${id}`)
    .then(res => res.ok ? res.json() : null)
    .then(data => { if (data?.name) setPlaceName(data.name) })
    .catch(() => {})
}, [id])

  // ── 사진 불러오기 ──
  useEffect(() => {
    setLoading(true)
    const sort = filter === '인기순' ? 'popular' : 'latest'
    photosAPI.getByPlace(id, sort)
      .then(data => setPhotos(Array.isArray(data) ? data : []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false))
  }, [id, filter])

  // ── 필터 정렬 ──
  const filteredPhotos = [...photos].sort((a, b) => {
    if (filter === '인기순') return (b.like_count || 0) - (a.like_count || 0)
    return 0
  })

  const handlePhotoClick = (photo) => {
    const idx = filteredPhotos.findIndex(p => p.id === photo.id)
    setSelectedIndex(idx)
    setSelectedPhoto(photo)
  }

  // ── 좋아요 ──
  const handleLike = async (photoId) => {
    if (!user) { navigate('/login'); return }
    await photosAPI.toggleLike(photoId)
    setPhotos(prev => prev.map(p =>
      p.id === photoId
        ? { ...p, liked: !p.liked, like_count: p.liked ? p.like_count - 1 : p.like_count + 1 }
        : p
    ))
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(prev => ({
        ...prev,
        liked: !prev.liked,
        like_count: prev.liked ? prev.like_count - 1 : prev.like_count + 1,
      }))
    }
  }

  // ── 댓글 ──
  const handleComment = async (photoId, content) => {
    if (!user) { navigate('/login'); return }
    const newComment = await photosAPI.addComment(photoId, content)
    if (!newComment?.id) return
    setPhotos(prev => prev.map(p =>
      p.id === photoId
        ? { ...p,
            comments: [...(p.comments || []), newComment],
            comment_count: (p.comment_count || 0) + 1 }
        : p
    ))
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
        comment_count: (prev.comment_count || 0) + 1,
      }))
    }
  }

  // ── 사진 삭제 ──
  const handleDelete = async (photoId) => {
    if (!window.confirm('사진을 삭제할까요?')) return
    await photosAPI.deletePhoto(photoId)
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    setSelectedPhoto(null)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F1EB',
      fontFamily: "'Noto Serif KR', 'Noto Sans KR', serif",
      position: 'relative',
    }}>

      {/* ── 헤더 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(245,241,235,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(160,120,64,0.1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '52px 16px 14px',
          maxWidth: 430, margin: '0 auto',
        }}>
          <button onClick={() => navigate(-1)} style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(160,120,64,0.1)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(160,120,64,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(160,120,64,0.1)'}>
            <ArrowLeft size={16} color="#A07840" strokeWidth={2} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1208', lineHeight: 1.2 }}>
              {placeName}
            </p>
            <p style={{ fontSize: 10, color: '#B0A090', marginTop: 2 }}>방문자 기록</p>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(160,120,64,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SlidersHorizontal size={14} color="#A07840" />
          </div>
        </div>
        <div style={{ maxWidth: 430, margin: '0 auto' }}>
          <FilterChipBar active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* ── 사진 그리드 ── */}
      <div style={{ maxWidth: 430, margin: '0 auto', paddingTop: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 12, color: '#B0A090' }}>불러오는 중...</p>
          </div>
        ) : (
          <PhotoGrid photos={filteredPhotos} onPhotoClick={handlePhotoClick} />
        )}

        {/* 하단 */}
        <div ref={loaderRef} style={{ padding: '24px 16px 40px', textAlign: 'center' }}>
          {!loading && photos.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: '#E8E0D4' }} />
              <p style={{ fontSize: 11, color: '#C4B49A', flexShrink: 0 }}>
                모든 사진을 불러왔어요
              </p>
              <div style={{ flex: 1, height: 1, background: '#E8E0D4' }} />
            </div>
          )}
        </div>
      </div>

      {/* ── 사진 뷰어 모달 ── */}
      {selectedPhoto && (
        <PhotoViewerModal
          photos={filteredPhotos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedPhoto(null)}
          onLike={handleLike}
          onComment={handleComment}
          onDelete={handleDelete}
        />
      )}

      {/* ── 업로드 플로팅 버튼 ── */}
      <button
        onClick={() => navigate(`/places/${id}/photos/upload`)}
        style={{
          position: 'fixed', bottom: 28, right: 20, zIndex: 40,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #C9A84C, #A07840)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(160,120,64,0.45)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1.08)'}>
        <Camera size={22} color="white" strokeWidth={1.8} />
      </button>

    </div>
  )
}