// src/pages/PlacedetailPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { placesAPI, photosAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft, MapPin, Clock, Ticket,
  Star, ChevronRight, ChevronLeft,
  Tag, ExternalLink, Landmark, Camera, Crown, Phone
} from 'lucide-react'

const CATEGORY_STYLES = {
  '궁궐':   { color: '#A07840', light: '#FDF6EC', dot: '#D4A855' },
  '왕릉':   { color: '#5A8A5A', light: '#EFF7EF', dot: '#72B072' },
  '사적':   { color: '#4A78A0', light: '#EEF4FA', dot: '#6898C0' },
  '박물관': { color: '#7A5A9A', light: '#F3EEF8', dot: '#9A7ABB' },
}

const RESERVATION_URLS = {
  '경복궁': 'https://royal.khs.go.kr/ROYAL/contents/R601000000.do?schGroupCode=gbg',
  '창덕궁': 'https://royal.khs.go.kr/ROYAL/contents/R601000000.do?schGroupCode=cdg',
  '덕수궁': 'https://royal.khs.go.kr/ROYAL/contents/R601000000.do?schGroupCode=dsg',
  '창경궁': 'https://royal.khs.go.kr/ROYAL/contents/R601000000.do?schGroupCode=cgg',
  '종묘':   'https://royal.khs.go.kr/ROYAL/contents/R601000000.do?schGroupCode=jms',
}

const REVIEW_TAGS = [
  { group: '방문 시기', tags: ['봄', '여름', '가을', '겨울'] },
  { group: '편의시설',  tags: ['주차 가능', '화장실 있음', '카페 있음'] },
  { group: '소요시간',  tags: ['30분', '1시간', '2시간 이상'] },
  { group: '분위기',    tags: ['조용함', '웅장함', '아이와 함께', '데이트'] },
]

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getCurrentHours = (opening_hours) => {
  if (!opening_hours) return null
  const month = new Date().getMonth() + 1
  const lines = opening_hours.split('/')
  let matched = null
  let closed  = null
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t.includes('휴궁') || t.includes('휴무')) { closed = t; continue }
    const rangeMatch = t.match(/(\d+)~(\d+)월/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1])
      const end   = parseInt(rangeMatch[2])
      const inRange = start > end
        ? (month >= start || month <= end)
        : (month >= start && month <= end)
      if (inRange) { matched = t; break }
      continue
    }
    const singleMatch = t.match(/^(\d+)월/)
    if (singleMatch) {
      if (month === parseInt(singleMatch[1])) { matched = t; break }
      continue
    }
    if (!matched) matched = t
  }
  return { hours: matched || lines[0].trim(), closed }
}

function StarIcon({ filled, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <polygon
        points="10,2 12.4,7.3 18,7.8 13.8,11.6 15.1,17 10,14 4.9,17 6.2,11.6 2,7.8 7.6,7.3"
        fill={filled ? '#C9A84C' : '#E8DDD0'}
      />
    </svg>
  )
}

export default function PlaceDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [place,          setPlace]          = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [sheetOpen,      setSheetOpen]      = useState(false)
  const [rating,         setRating]         = useState(0)
  const [hoverRating,    setHoverRating]    = useState(0)
  const [selectedTags,   setSelectedTags]   = useState([])
  const [content,        setContent]        = useState('')
  const [visitedAt,      setVisitedAt]      = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [submitted,      setSubmitted]      = useState(false)
  const [reviews,        setReviews]        = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  const [photos,     setPhotos]     = useState([])
  const [uploading,  setUploading]  = useState(false)
  const photoFileRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    placesAPI.getById(id)
      .then(data => setPlace(data))
      .catch(() => setPlace(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    photosAPI.getByPlace(id)
      .then(data => setPhotos(Array.isArray(data) ? data : []))
      .catch(() => setPhotos([]))
  }, [id])

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API}/reviews/${id}`)
      if (!res.ok) return
      setReviews(await res.json())
    } catch {}
    finally { setReviewsLoading(false) }
  }

  useEffect(() => { fetchReviews() }, [id])
  useEffect(() => { return () => window.dispatchEvent(new Event('bottomsheet:close')) }, [])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!user) { navigate('/login'); return }
    setUploading(true)
    try {
      const newPhoto = await photosAPI.upload(id, file)
      if (newPhoto?.id) setPhotos(prev => [newPhoto, ...prev])
    } catch {
      alert('사진 업로드에 실패했어요')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleLike = async (photoId) => {
    if (!user) { navigate('/login'); return }
    await photosAPI.toggleLike(photoId)
    setPhotos(prev => prev.map(p =>
      p.id === photoId
        ? { ...p, liked: !p.liked, like_count: p.liked ? p.like_count - 1 : p.like_count + 1 }
        : p
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#F5F1EB' }}>
        <p style={{ color: '#9A8A70', fontSize: 13 }}>불러오는 중...</p>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ background: '#F5F1EB' }}>
        <p className="mb-4" style={{ color: '#9A8A70' }}>장소를 찾을 수 없어요</p>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold" style={{ color: '#C9A84C' }}>돌아가기</button>
      </div>
    )
  }

  const cs         = CATEGORY_STYLES[place.category] || CATEGORY_STYLES['궁궐']
  const avgRating  = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0
  const hoursInfo  = getCurrentHours(place.opening_hours)
  const extra      = place.extra || {}                          // ← extra JSON 파싱
  const isRoyalTomb = place.category === '왕릉'                // ← 왕릉 여부
  const myPhotoExists = user && photos.some(p =>
    String(p.user_id) === String(user.user_id) ||
    String(p.user_id) === String(user.id)
  )
  const previewPhotos = photos.slice(0, 4)
  const hasMore       = photos.length > 4

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const openSheet = () => {
    if (!user) { navigate('/login'); return }
    setSheetOpen(true)
    window.dispatchEvent(new Event('bottomsheet:open'))
  }

  const closeSheet = () => {
    setSheetOpen(false)
    window.dispatchEvent(new Event('bottomsheet:close'))
    setRating(0); setHoverRating(0)
    setSelectedTags([]); setContent(''); setVisitedAt('')
    setSubmitted(false)
  }

  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ place_id: id, rating, content, tags: selectedTags, visited_at: visitedAt || null }),
      })
      if (!res.ok) throw new Error()
      await fetchReviews()
      setSubmitted(true)
      setTimeout(closeSheet, 1200)
    } catch {
      alert('리뷰 등록에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: '#F5F1EB' }}>

      {/* 히어로 이미지 */}
      <div className="relative" style={{ height: 380 }}>
        {place.image_url
          ? <img src={place.image_url} alt={place.name} className="absolute inset-0 w-full h-full object-cover" />
          : (
            <div className="absolute inset-0 flex items-center justify-center"
                 style={{ background: `linear-gradient(160deg, #1A1208 0%, ${cs.color}55 60%, ${cs.light} 100%)` }}>
              <Landmark size={80} color={cs.color} strokeWidth={0.8} style={{ opacity: 0.85 }} />
            </div>
          )
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <button onClick={() => navigate(-1)}
          className="absolute top-14 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft size={16} color="white" strokeWidth={2} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full"
                  style={{ background: cs.color, color: 'white' }}>{place.category}</span>
            {/* 왕릉일 때 몇 대 왕인지 뱃지 */}
            {isRoyalTomb && extra.order && (
              <span className="text-[10px] font-bold px-3 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.2)', color: 'white',
                             backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                {extra.order}
              </span>
            )}
          </div>
          <h1 className="font-serif text-4xl font-black text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
            {place.name}
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-white/55 text-[12px] flex items-center gap-1.5">
              <MapPin size={11} /> {place.address}
            </p>
            <button onClick={openSheet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                       color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
              <Star size={11} fill="white" color="white" />
              리뷰 남기기
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-5 relative z-10 space-y-4">

        {/* 설명 */}
        {(place.summary || place.description) && (
          <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#4A3A28', lineHeight: '1.8' }}>
              {place.summary || place.description}
            </p>
          </div>
        )}

        {/* 기본 정보 */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          <p className="text-[11px] font-bold tracking-wider" style={{ color: '#9A8A70' }}>기본 정보</p>

          {/* ── 왕릉 전용: 1. 누구의 능 ── */}
          {isRoyalTomb && extra.kings_name && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                   style={{ background: cs.light }}>
                <Crown size={13} color={cs.color} />
              </div>
              <div>
                <p className="text-[10px]" style={{ color: '#9A8A70' }}>능의 주인</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#2A1E10' }}>{extra.kings_name}</p>
              </div>
            </div>
          )}

          {/* ── 왕릉 전용: 2. 능역 이름 ── */}
          {isRoyalTomb && extra.heritage_name && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                   style={{ background: cs.light }}>
                <Landmark size={13} color={cs.color} />
              </div>
              <div>
                <p className="text-[10px]" style={{ color: '#9A8A70' }}>능역</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#2A1E10' }}>{extra.heritage_name}</p>
              </div>
            </div>
          )}

          {/* ── 왕릉 전용: 3. 전화번호 ── */}
          {isRoyalTomb && extra.phone && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                   style={{ background: cs.light }}>
                <Phone size={13} color={cs.color} />
              </div>
              <div>
                <p className="text-[10px]" style={{ color: '#9A8A70' }}>전화번호</p>
                <a href={`tel:${extra.phone}`}
                   className="text-xs font-medium mt-0.5 block"
                   style={{ color: cs.color }}>
                  {extra.phone}
                </a>
              </div>
            </div>
          )}

          {/* 구분선 (왕릉 정보가 있을 때만) */}
          {isRoyalTomb && (extra.kings_name || extra.heritage_name || extra.phone) && (
            <div style={{ height: 1, background: '#F0EAE0' }} />
          )}

          {hoursInfo?.hours && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                   style={{ background: cs.light }}>
                <Clock size={13} color={cs.color} />
              </div>
              <div>
                <p className="text-[10px]" style={{ color: '#9A8A70' }}>운영시간</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#2A1E10' }}>{hoursInfo.hours}</p>
                {hoursInfo.closed && (
                  <p className="text-[10px] mt-1 font-medium" style={{ color: '#C0392B' }}>{hoursInfo.closed}</p>
                )}
              </div>
            </div>
          )}
          {place.fee && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                   style={{ background: cs.light }}>
                <Ticket size={13} color={cs.color} />
              </div>
              <div>
                <p className="text-[10px]" style={{ color: '#9A8A70' }}>입장료</p>
                <div className="mt-0.5">
                  {place.fee.split('/').map((line, i) => (
                    <p key={i} className="text-xs font-medium" style={{ color: '#2A1E10', lineHeight: 1.9 }}>{line.trim()}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
          {place.address && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                   style={{ background: cs.light }}>
                <MapPin size={13} color={cs.color} />
              </div>
              <div>
                <p className="text-[10px]" style={{ color: '#9A8A70' }}>주소</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#2A1E10' }}>{place.address}</p>
              </div>
            </div>
          )}
          {reviews.length > 0 && (
            <>
              <div style={{ height: 1, background: '#F0EAE0', margin: '12px 0 0' }} />
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= Math.round(avgRating)} size={13} />)}
                </div>
                <span className="text-sm font-bold" style={{ color: '#2A1E10' }}>{avgRating}</span>
                <span className="text-[11px]" style={{ color: '#B0A090' }}>리뷰 {reviews.length}개</span>
              </div>
            </>
          )}
        </div>

        {/* 공식 웹사이트 버튼 */}
        {place.extra?.website && (
          <button onClick={() => window.open(place.extra.website, '_blank')}
                  className="w-full rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: `1px solid ${cs.color}22` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cs.light }}>
              <ExternalLink size={16} color={cs.color} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold" style={{ color: '#1A1208' }}>공식 웹사이트</p>
              <p className="text-[11px]" style={{ color: '#9A8A70' }}>상세 정보 및 안내</p>
            </div>
            <ChevronRight size={16} color={cs.color} />
          </button>
        )}


        {/* 키워드 태그 */}
        {place.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {place.tags.map(tag => (
              <span key={tag} className="text-[11px] px-3 py-1.5 rounded-xl font-medium flex items-center gap-1"
                    style={{ background: cs.light, color: cs.color, border: `1px solid ${cs.color}22` }}>
                <Tag size={9} />#{tag}
              </span>
            ))}
          </div>
        )}

        {/* 예약 버튼 */}
        {RESERVATION_URLS[place.name] && (
          <button onClick={() => window.open(RESERVATION_URLS[place.name], '_blank')}
                  className="w-full rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: `1px solid ${cs.color}22` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cs.light }}>
              <ExternalLink size={16} color={cs.color} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold" style={{ color: '#1A1208' }}>{place.name} 체험 예약하기</p>
              <p className="text-[11px]" style={{ color: '#9A8A70' }}>국가유산청 공식 예약 페이지</p>
            </div>
            <ChevronRight size={16} color={cs.color} />
          </button>
        )}


        {/* 유튜브 */}
        {place.extra?.youtube && (
          <div className="rounded-2xl overflow-hidden"
               style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
              <iframe
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                src={`https://www.youtube.com/embed/${place.extra.youtube.split('youtu.be/')[1]?.split('?')[0]}`}
                title="여행 코스"
                frameBorder="0"
                allowFullScreen
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold" style={{ color: '#1A1208' }}>영월 단종 역사 여행 코스</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#B0A090' }}>장릉 · 청령포 · 관풍헌 · 자규루를 둘러보는 코스</p>
              </div>
              <button onClick={() => window.open(place.extra.youtube, '_blank')}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: '#FF4444',
                               opacity: 0.75, border: 'none', cursor: 'pointer',
                               display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="8" viewBox="0 0 14 10" fill="white">
                  <path d="M13.7 1.6S13.5.6 13 .2C12.4-.4 11.7-.4 11.4-.4 9.5-.5 7-.5 7-.5S4.5-.5 2.6-.4C2.3-.4 1.6-.4 1 .2.5.6.3 1.6.3 1.6S0 2.7 0 3.9v1.1c0 1.2.3 2.3.3 2.3s.2 1 .7 1.4c.6.6 1.4.6 1.8.7C4 9.5 7 9.5 7 9.5s2.5 0 4.4-.1c.3 0 1-.1 1.6-.6.5-.4.7-1.4.7-1.4S14 6.2 14 5V3.9c0-1.2-.3-2.3-.3-2.3zM5.5 6.7V2.8l4 2-4 1.9z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 방문자 사진 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Camera size={13} color="#C9A84C" />
              <p className="text-[11px] font-bold tracking-wider" style={{ color: '#5C4A32' }}>
                방문자 사진
                {photos.length > 0 && (
                  <span className="ml-1.5 font-normal" style={{ color: '#C4B49A' }}>{photos.length}장</span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => document.getElementById('photo-scroll').scrollBy({ left: -130, behavior: 'smooth' })}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: 'transparent',
                               border: 'none', cursor: 'pointer', display: 'flex',
                               alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(160,120,64,0.1)'; e.currentTarget.style.transform = 'scale(1.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}>
                <ChevronLeft size={13} color={cs.color} strokeWidth={2.5} />
              </button>
              <button onClick={() => document.getElementById('photo-scroll').scrollBy({ left: 130, behavior: 'smooth' })}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: 'transparent',
                               border: 'none', cursor: 'pointer', display: 'flex',
                               alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(160,120,64,0.1)'; e.currentTarget.style.transform = 'scale(1.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}>
                <ChevronRight size={13} color={cs.color} strokeWidth={2.5} />
              </button>
              {hasMore && (
                <button onClick={() => navigate(`/places/${id}/photos`)}
                        style={{ fontSize: 10, color: cs.color, fontWeight: 600,
                                 background: 'none', border: 'none', cursor: 'pointer',
                                 display: 'flex', alignItems: 'center', gap: 2 }}>
                  전체보기 <ChevronRight size={11} color={cs.color} />
                </button>
              )}
            </div>
          </div>

          <input ref={photoFileRef} type="file" accept="image/*"
                 style={{ display: 'none' }} onChange={handlePhotoUpload} />

          <div id="photo-scroll" style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch',
          }}>
            {user && !myPhotoExists && (
              <div onClick={() => !uploading && photoFileRef.current?.click()}
                   style={{ flexShrink: 0, width: 100, borderRadius: 14, overflow: 'hidden',
                            background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                            cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                <div style={{ width: 100, height: 100, background: cs.light,
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: cs.color + '18',
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={13} color={cs.color} strokeWidth={1.5} />
                  </div>
                  <p style={{ fontSize: 9, color: cs.color, fontWeight: 600 }}>
                    {uploading ? '업로드중' : '사진 추가'}
                  </p>
                </div>
                <div style={{ padding: '7px 9px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#2A1E10' }}>{user.nickname}</p>
                  <p style={{ fontSize: 8, color: '#C4B49A' }}>
                    {new Date().toISOString().slice(0, 10).replace(/-/g, '.')}
                  </p>
                  <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: '#C4B49A' }}>♡ 0</span>
                    <span style={{ fontSize: 9, color: '#C4B49A' }}>💬 0</span>
                  </div>
                </div>
              </div>
            )}

            {previewPhotos.map((photo) => (
              <div key={photo.id} onClick={() => navigate(`/places/${id}/photos`)}
                   style={{ flexShrink: 0, width: 100, borderRadius: 14, overflow: 'hidden',
                            background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', cursor: 'pointer' }}>
                <div style={{ width: 100, height: 100, overflow: 'hidden' }}>
                  <img src={`${API}${photo.photo_url}`} alt=""
                       style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                       onError={e => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div style={{ padding: '7px 9px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#2A1E10', lineHeight: 1.2 }}>{photo.nickname}</p>
                  <p style={{ fontSize: 8, color: '#C4B49A', marginBottom: 3 }}>
                    {photo.created_at?.slice(0, 10).replace(/-/g, '.')}
                  </p>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={e => { e.stopPropagation(); handleLike(photo.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                     display: 'flex', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 9, color: photo.liked ? '#E05050' : '#C4B49A' }}>
                        {photo.liked ? '♥' : '♡'}
                      </span>
                      <span style={{ fontSize: 9, color: '#C4B49A' }}>{photo.like_count || 0}</span>
                    </button>
                    <span style={{ fontSize: 9, color: '#C4B49A' }}>💬 {photo.comment_count || 0}</span>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div onClick={() => navigate(`/places/${id}/photos`)}
                   style={{ flexShrink: 0, width: 100, borderRadius: 14, background: 'white',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.07)', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', height: 158, gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: cs.light,
                              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={13} color={cs.color} />
                </div>
                <p style={{ fontSize: 10, color: cs.color, fontWeight: 600 }}>+{photos.length - 4}장</p>
                <p style={{ fontSize: 9, color: '#B0A090' }}>전체보기</p>
              </div>
            )}

            {photos.length === 0 && !user && (
              <div style={{ width: '100%', borderRadius: 14, padding: '24px 16px',
                            textAlign: 'center', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                <Camera size={22} color="#E0D5C5" strokeWidth={1.5} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 11, color: '#B0A090' }}>아직 등록된 사진이 없어요</p>
                <p style={{ fontSize: 10, color: '#C9A84C', marginTop: 4 }}>로그인 후 첫 번째 사진을 올려보세요!</p>
              </div>
            )}

            {myPhotoExists && photos.length === 0 && (
              <p style={{ fontSize: 10, color: '#B0A090', paddingLeft: 2, marginTop: 6 }}>✓ 이미 사진을 올리셨어요</p>
            )}
          </div>
        </div>

        {/* 방문 리뷰 */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Star size={13} color="#C9A84C" fill="#C9A84C" />
            <p className="text-[11px] font-bold tracking-wider" style={{ color: '#5C4A32' }}>
              방문 리뷰
              {reviews.length > 0 && <span className="ml-1.5 font-normal" style={{ color: '#C4B49A' }}>{reviews.length}개</span>}
            </p>
          </div>
          {reviewsLoading && (
            <div className="rounded-2xl p-5 text-center" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
              <p className="text-[11px]" style={{ color: '#B0A090' }}>리뷰를 불러오는 중이에요...</p>
            </div>
          )}
          {!reviewsLoading && reviews.length === 0 && (
            <div className="rounded-2xl p-5 text-center" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
              <p className="text-[11px]" style={{ color: '#B0A090' }}>아직 리뷰가 없어요. 첫 번째 리뷰를 남겨보세요!</p>
            </div>
          )}
          {!reviewsLoading && reviews.length > 0 && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
              {reviews.map((r, idx) => (
                <div key={r.id} style={{
                  paddingBottom: idx < reviews.length - 1 ? 16 : 0,
                  borderBottom: idx < reviews.length - 1 ? '1px solid #F0EAE0' : 'none',
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold" style={{ color: '#2A1E10' }}>
                      {r.nickname || `방문자 ${r.user_id}`}
                    </span>
                    <span className="text-[10px]" style={{ color: '#C4B49A' }}>
                      {r.visited_at?.slice(0, 7).replace('-', '.')}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= r.rating} size={11} />)}
                  </div>
                  {r.content && <p className="text-[11px] mb-2" style={{ color: '#5C4A32', lineHeight: 1.7 }}>{r.content}</p>}
                  {r.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: '#F0EAE0', color: '#9A8A70' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={closeSheet} />
      )}

      <div className="fixed bottom-0 z-50 overflow-y-auto"
        style={{
          left: '50%',
          transform: sheetOpen ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(100%)',
          width: '100%', maxWidth: 430, background: '#FAF6EF',
          borderRadius: '24px 24px 0 0', padding: '0 24px 40px',
          maxHeight: '92vh', transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        }}>
        <div className="flex justify-center pt-3 pb-4">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E0D5C5' }} />
        </div>
        <h3 className="text-[15px] font-bold mb-5" style={{ color: '#2C1F0E' }}>리뷰 남기기</h3>
        <p style={{ fontSize: 8, color: '#B0A090', fontWeight: 700, letterSpacing: '1px', marginBottom: 8 }}>RATING</p>
        <div className="flex gap-2 mb-5">
          {[1,2,3,4,5].map(i => (
            <button key={i}
              onMouseEnter={() => setHoverRating(i)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(i)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <StarIcon filled={i <= (hoverRating || rating)} size={34} />
            </button>
          ))}
        </div>
        {REVIEW_TAGS.map(group => (
          <div key={group.group} className="mb-4">
            <p style={{ fontSize: 9, color: '#B0A090', fontWeight: 700, letterSpacing: '1px', marginBottom: 7 }}>
              {group.group.toUpperCase()}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.tags.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  style={{ padding: '6px 13px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                           border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                           background: selectedTags.includes(tag) ? cs.color : '#EDE5D8',
                           color: selectedTags.includes(tag) ? 'white' : '#9A8A70' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 mb-4">
          <span style={{ fontSize: 10, color: '#9A8A70', whiteSpace: 'nowrap' }}>방문일</span>
          <input type="date" value={visitedAt} onChange={e => setVisitedAt(e.target.value)}
            style={{ background: '#EDE5D8', border: 'none', outline: 'none', borderRadius: 10,
                     padding: '8px 12px', fontSize: 11, color: '#2A1E10', flex: 1 }} />
        </div>
        <textarea rows={3} value={content} onChange={e => setContent(e.target.value)}
          placeholder="방문 후기를 자유롭게 남겨주세요 (선택)"
          style={{ width: '100%', background: '#EDE5D8', border: 'none', outline: 'none',
                   borderRadius: 12, padding: '12px 14px', fontSize: 11, color: '#2A1E10',
                   resize: 'none', lineHeight: 1.7, marginBottom: 16 }} />
        <button onClick={handleSubmit} disabled={!rating || submitting}
          style={{ width: '100%', padding: 14, borderRadius: 14,
                   background: submitted ? '#2D5227' : !rating ? '#C4B49A' : '#3B2D1A',
                   color: '#F5E6C8', fontSize: 12, fontWeight: 600, border: 'none',
                   cursor: !rating ? 'default' : 'pointer', transition: 'background 0.2s' }}>
          {submitted ? '등록 완료!' : submitting ? '등록 중...' : '리뷰 등록'}
        </button>
      </div>

    </div>
  )
}