// src/pages/RecordPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Camera } from 'lucide-react'
import { photosAPI } from '../api/api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'


const STAMP_TOURS_DEFAULT = [
  {
    id: 1,
    title: '서울 5대 궁궐 완주',
    desc: '경복궁 · 창덕궁 · 창경궁 · 덕수궁 · 경희궁',
    color: '#B45309',
    gradient: 'linear-gradient(90deg, #B45309, #F59E0B)',
    stamps: [
      { name: '경복궁', placeId: 'site_palace_1', emoji: '🏯', done: false },
      { name: '창덕궁', placeId: 'site_palace_2', emoji: '🌿', done: false },
      { name: '창경궁', placeId: 'site_palace_3', emoji: '🌸', done: false },
      { name: '덕수궁', placeId: 'site_palace_4', emoji: '🌅', done: false },
      { name: '경희궁', placeId: 'palace_gyeonghee', emoji: '🏰', done: false },
    ],
  },
  {
    id: 2,
    title: '단종의 발자취',
    desc: '청령포 · 장릉 · 관풍헌 · 자규루',
    color: '#2E5C8A',
    gradient: 'linear-gradient(90deg, #1E3A5F, #4A90D9)',
    stamps: [
      { name: '청령포', placeId: 'sajuk_cheongnyeong', emoji: '⛵', done: false },
      { name: '장릉',   placeId: 'tomb_8',             emoji: '🪦', done: false },
      { name: '관풍헌', placeId: 'sajuk_gwanpung',     emoji: '🏚', done: false },
      { name: '자규루', placeId: 'sajuk_jagyu',        emoji: '🌙', done: false },
    ],
  },
]

const PLACE_NAME_MAP = {
  '1': '경복궁', '2': '청령포', '3': '창덕궁',
  '4': '종묘',   '5': '수원화성', '6': '덕수궁',
  'site_palace_1': '경복궁', 'site_palace_2': '창덕궁',
  'site_palace_3': '창경궁', 'site_palace_4': '덕수궁',
  'palace_gyeonghee': '경희궁',
  'sajuk_cheongnyeong': '청령포', 'tomb_8': '장릉',
  'sajuk_gwanpung': '관풍헌', 'sajuk_jagyu': '자규루',
}

function StarRow({ rating, size = 11 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize: size, color: n <= rating ? '#C9A84C' : '#E0D8CE' }}>★</span>
      ))}
    </div>
  )
}

// ── 완주 축하 팝업 ──────────────────────────────────────────
function CompletionPopup({ tour, onClose }) {
  const canvasRef   = useRef(null)
  const circleRef   = useRef(null)
  const rippleRef   = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    setTimeout(() => {
      if (circleRef.current) circleRef.current.style.animation = 'trophyBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.05s forwards'
      if (rippleRef.current) rippleRef.current.style.animation = 'trophyRipple 0.8s ease-out 0.1s forwards'
      startConfetti()
    }, 100)
    return () => stopConfetti()
  }, [])

  const startConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const COLORS = ['#FFFFFF','#FAF6EF','#F0EAE0','#EDE5D8','#E8E0D4','#FFF8F0']
    const particles = Array.from({length: 60}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 8 + 4,
      h: Math.random() * 5 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * 2 + 1,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 6,
      opacity: Math.random() * 0.5 + 0.5,
    }))
    intervalRef.current = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.y += p.speed; p.angle += p.spin
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width }
        ctx.save()
        ctx.translate(p.x + p.w/2, p.y + p.h/2)
        ctx.rotate(p.angle * Math.PI / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h)
        ctx.restore()
      })
    }, 16)
  }

  const stopConfetti = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <>
      <style>{`
        @keyframes trophyBounce {
          0%   { transform: scale(0);    opacity: 0; }
          50%  { transform: scale(1.2);  opacity: 1; }
          70%  { transform: scale(0.92); }
          85%  { transform: scale(1.06); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes trophyRipple {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes stampPop {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center"
           style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
        <div style={{
          background: '#FAF6EF', borderRadius: 28, width: 280,
          overflow: 'hidden', position: 'relative',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          animation: 'stampPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }} onClick={e => e.stopPropagation()}>
          <canvas ref={canvasRef} style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            zIndex: 10, borderRadius: 28, width: '100%', height: '100%',
          }} />
          <div style={{
            background: 'linear-gradient(145deg,#D8D0C0 0%,#C8BEA8 45%,#B8AE9C 100%)',
            padding: '28px 20px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 14px' }}>
              <div ref={rippleRef} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#C9A84C', opacity: 0 }} />
              <div ref={circleRef} style={{
                position: 'relative', zIndex: 1, width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg,#D4A855,#B8860B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(180,130,50,0.4)', transform: 'scale(0)', opacity: 0,
              }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
                     stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/>
                  <path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
                  <path d="M12 17v4"/>
                  <path d="M8 21h8"/>
                  <path d="M6 2h12v7a6 6 0 0 1-12 0V2z"/>
                </svg>
              </div>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#2C1F0E', marginBottom: 4, position: 'relative', zIndex: 2 }}>완주 달성! 🎉</p>
            <p style={{ fontSize: 11, color: 'rgba(44,31,14,0.5)', position: 'relative', zIndex: 2 }}>{tour.title}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '16px 20px 12px' }}>
            {tour.stamps.map((s, i) => (
              <div key={s.name} style={{
                width: 40, height: 40, borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                background: `${tour.color}12`, border: `1.5px solid ${tour.color}45`,
                animation: `stampPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + i * 0.1}s both`,
              }}>
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <span style={{ fontSize: 7, fontWeight: 600, color: tour.color }}>{s.name}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#9A8A70', textAlign: 'center', padding: '0 20px 16px', lineHeight: 1.7 }}>
            {tour.stamps.length}개의 장소를 모두 방문했어요!<br />
            조선의 역사를 탐방한 역사 탐험가예요 🏛️
          </p>
          <button onClick={onClose} style={{
            margin: '0 20px 20px', width: 'calc(100% - 40px)',
            padding: 13, borderRadius: 14, background: '#3B2D1A', color: '#F5E6C8',
            fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
          }}>확인</button>
        </div>
      </div>
    </>
  )
}

// ── 스탬프 인증 모달 ────────────────────────────────────────
function StampModal({ stamp, tour, onClose, onComplete }) {
  const [photo,      setPhoto]      = useState(null)
  const [visitedAt,  setVisitedAt]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(stamp.done)
  const fileRef   = useRef(null)
  const circleRef = useRef(null)
  const checkRef  = useRef(null)
  const rippleRef = useRef(null)

  useEffect(() => { if (done) triggerAnim() }, [done])

  const triggerAnim = () => {
    ;[circleRef, checkRef, rippleRef].forEach(r => {
      if (r.current) { r.current.style.animation = 'none'; void r.current.offsetWidth }
    })
    setTimeout(() => {
      if (circleRef.current) circleRef.current.style.animation = 'stampBounce 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.05s forwards'
      if (checkRef.current)  checkRef.current.style.animation  = 'checkDraw 0.35s ease-out 0.45s forwards'
      if (rippleRef.current) rippleRef.current.style.animation = 'rippleOut 0.7s ease-out 0.2s forwards'
    }, 50)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!photo) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/stamps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          tour_id: tour.id, place_id: stamp.placeId,
          photo_url: photo, visited_at: visitedAt || null,
        }),
      })
      if (!res.ok) { const err = await res.json(); alert(err.detail || '스탬프 등록에 실패했어요'); return }
      setDone(true)
      onComplete?.()
    } catch { alert('스탬프 등록에 실패했어요') }
    finally { setSubmitting(false) }
  }

  return (
    <>
      <style>{`
        @keyframes stampBounce {
          0%   { transform: scale(0);    opacity: 0; }
          50%  { transform: scale(1.25); opacity: 1; }
          70%  { transform: scale(0.9); }
          85%  { transform: scale(1.08); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes checkDraw {
          0%   { stroke-dashoffset: 30; opacity: 0; }
          30%  { opacity: 1; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes rippleOut {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center"
           style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
        <div className="rounded-3xl overflow-hidden mx-6 w-full"
             style={{ maxWidth: 300, background: '#FAF6EF', boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}
             onClick={e => e.stopPropagation()}>
          <div style={{
            background: 'linear-gradient(145deg,#D8D0C0 0%,#C8BEA8 45%,#B8AE9C 100%)',
            padding: '22px 20px', textAlign: 'center', position: 'relative',
          }}>
            <button onClick={onClose} style={{
              position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer',
              color: '#5A4A38', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
            <div style={{
              width: 58, height: 58, borderRadius: 18, background: 'rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}>{stamp.emoji}</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#3A2D1A', marginBottom: 3 }}>{stamp.name}</p>
            <p style={{ fontSize: 10, color: 'rgba(58,45,26,0.5)' }}>{tour.title}</p>
          </div>
          <div style={{ padding: 18 }}>
            {!done && (
              <>
                <div onClick={() => fileRef.current?.click()} style={{
                  background: '#EDE5D8', borderRadius: 14,
                  padding: photo ? 0 : '20px 16px', textAlign: 'center', cursor: 'pointer',
                  border: photo ? '2px solid #B8AE9C' : '2px dashed #C4A882',
                  marginBottom: 14, overflow: 'hidden', transition: 'all 0.15s',
                }}>
                  {photo ? (
                    <img src={photo} alt="인증사진" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 12 }} />
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                        <Camera size={28} color="#A07840" strokeWidth={1.6} />
                      </div>
                      <p style={{ fontSize: 11, color: '#7A6A50', fontWeight: 600 }}>방문 사진 업로드</p>
                      <p style={{ fontSize: 9, color: '#C4A882', marginTop: 3 }}>탭하여 사진을 선택하세요</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 10, color: '#9A8A70', whiteSpace: 'nowrap', fontWeight: 500 }}>방문일</span>
                  <input type="date" value={visitedAt} onChange={e => setVisitedAt(e.target.value)}
                    style={{ background: '#EDE5D8', border: 'none', outline: 'none', borderRadius: 10,
                             padding: '7px 12px', fontSize: 10, color: '#9A8A70', flex: 1 }} />
                </div>
                <button onClick={handleSubmit} disabled={!photo || submitting} style={{
                  width: '100%', padding: 13, borderRadius: 14,
                  background: !photo ? '#C4B49A' : '#3B2D1A', color: '#F5E6C8',
                  fontSize: 12, fontWeight: 600, border: 'none', cursor: !photo ? 'default' : 'pointer',
                }}>
                  {submitting ? '인증 중...' : '스탬프 찍기'}
                </button>
              </>
            )}
            {done && (
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <div style={{ position: 'relative', width: 68, height: 68, margin: '0 auto 16px' }}>
                  <div ref={rippleRef} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4A9A6A', opacity: 0 }} />
                  <div ref={circleRef} style={{
                    position: 'relative', zIndex: 1, width: 68, height: 68, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#4A9A6A,#2D7A50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(45,122,80,0.35)', transform: 'scale(0)', opacity: 0,
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                         stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline ref={checkRef} points="20 6 9 17 4 12"
                                style={{ strokeDasharray: 30, strokeDashoffset: 30, opacity: 0 }} />
                    </svg>
                  </div>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1208', marginBottom: 5 }}>{stamp.name} 인증 완료!</p>
                <p style={{ fontSize: 11, color: '#9A8A70', lineHeight: 1.6, marginBottom: 16 }}>
                  스탬프가 찍혔어요!<br />계속해서 나머지 장소도 방문해보세요
                </p>
                <button onClick={onClose} style={{
                  width: '100%', padding: 13, borderRadius: 14,
                  background: '#3B2D1A', color: '#F5E6C8',
                  fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                }}>확인</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────
export function RecordPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const [stampTours,    setStampTours]    = useState(STAMP_TOURS_DEFAULT)
  const [openTours,     setOpenTours]     = useState(new Set([1, 2]))
  const [reviews,       setReviews]       = useState([])
  const [myPhotos,      setMyPhotos]      = useState([])  // ← 추가
  const [loading,       setLoading]       = useState(true)
  const [photosLoading, setPhotosLoading] = useState(true) // ← 추가
  const [hovered,       setHovered]       = useState(null)
  const [showLogout,    setShowLogout]    = useState(false)
  const [selectedStamp, setSelectedStamp] = useState(null)
  const [completedTour, setCompletedTour] = useState(null)
  const [visiblePhotos, setVisiblePhotos] = useState(3)

  const fetchMyStamps = async () => {
    if (!user) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/stamps/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setStampTours(prev => prev.map(tour => {
        const serverTour = data.find(t => t.tour_id === tour.id)
        if (!serverTour) return tour
        const updated = {
          ...tour,
          stamps: tour.stamps.map(s => ({
            ...s, done: serverTour.stamped.includes(s.placeId)
          }))
        }
        const prevDone = tour.stamps.filter(s => s.done).length
        const newDone  = updated.stamps.filter(s => s.done).length
        if (newDone === updated.stamps.length && prevDone < updated.stamps.length) {
          setCompletedTour(updated)
        }
        return updated
      }))
    } catch {}
  }

  useEffect(() => {
    if (!user) return
    fetchMyStamps()

    // 리뷰 불러오기
    const token = localStorage.getItem('token')
    fetch(`${API}/reviews/my/reviews`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setReviews(data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))

    // ── 내 사진 불러오기 ──
    photosAPI.getMy()
      .then(data => setMyPhotos(Array.isArray(data) ? data : []))
      .catch(() => setMyPhotos([]))
      .finally(() => setPhotosLoading(false))

  }, [user])

  const toggleTour = (id) => {
    setOpenTours(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleLogout = () => { logout(); navigate('/') }
  const getPlaceName = (place_id) => PLACE_NAME_MAP[String(place_id)] || place_id

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: '#F5F1EB' }}>

      {/* ── 헤더 ── */}
      <div className="px-5 pt-14 pb-6 flex-shrink-0"
           style={{ background: 'linear-gradient(160deg,#1A1208,#2D1F0A)' }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#F5E6C8]">내 기록</h2>
            <p className="text-[11px]" style={{ color: 'rgba(245,230,200,0.4)' }}>스탬프 투어 · 방문 리뷰 · 사진</p>
          </div>
          <button onClick={() => { setShowLogout(true); window.dispatchEvent(new Event('bottomsheet:open')) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                     color: 'rgba(245,230,200,0.6)', fontSize: 11 }}>
            <LogOut size={12} />로그아웃
          </button>
        </div>
        {user && <p className="text-[12px] mt-2" style={{ color: '#C9A84C' }}>{user.nickname}님의 기록</p>}
      </div>

      <div className="flex-1 px-4 pt-6 space-y-6">

        {/* ── 스탬프 투어 ── */}
        <section>
          <p className="text-[10px] font-bold tracking-[0.28em] mb-4" style={{ color: '#9A8A72' }}>스탬프 투어</p>
          <div className="space-y-3">
            {stampTours.map(tour => {
              const done   = tour.stamps.filter(s => s.done).length
              const total  = tour.stamps.length
              const pct    = (done / total) * 100
              const isOpen = openTours.has(tour.id)
              const isDone = done === total
              return (
                <div key={tour.id} className="rounded-2xl overflow-hidden"
                     style={{ background: 'white', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                  <button className="w-full px-5 py-4 text-left"
                    onClick={() => toggleTour(tour.id)}
                    onMouseEnter={e => e.currentTarget.style.background = '#FDFAF6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-0.5" style={{ color: '#1A1208' }}>{tour.title}</p>
                        <p className="text-[10px]" style={{ color: '#B0A090' }}>{tour.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {isDone && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                         style={{ background: '#DCFCE7', color: '#14532D' }}>완주 ✓</span>}
                        <span className="text-[11px] font-bold" style={{ color: tour.color }}>{done}/{total}</span>
                        <span style={{ fontSize: 10, color: '#C0B0A0', display: 'inline-block',
                          transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>▾</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EEE8E0' }}>
                      <div className="h-full rounded-full"
                           style={{ width: `${pct}%`, background: tour.gradient,
                                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                  </button>
                  <div style={{ maxHeight: isOpen ? 160 : 0, overflow: 'hidden',
                                transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
                    <div className="flex gap-2.5 px-5 pb-5 flex-wrap"
                         style={{ borderTop: '1px solid #F0EAE2' }}>
                      {tour.stamps.map(s => (
                        <div key={s.name}
                             onClick={() => { setSelectedStamp({ stamp: s, tour }); window.dispatchEvent(new Event('bottomsheet:open')) }}
                             className="flex flex-col items-center justify-center"
                             style={{
                               width: 56, height: 56, borderRadius: 16, marginTop: 14, cursor: 'pointer',
                               border: s.done ? `1.5px solid ${tour.color}45` : '1.5px dashed #DDD6CC',
                               background: s.done ? `${tour.color}07` : 'transparent',
                               gap: 3, transition: 'transform 0.1s',
                             }}
                             onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                             onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                          {s.done ? (
                            <><span style={{ fontSize: 22 }}>{s.emoji}</span>
                              <span style={{ fontSize: 9, fontWeight: 600, color: tour.color }}>{s.name}</span></>
                          ) : (
                            <><span style={{ fontSize: 16, color: '#DDD6CC' }}>○</span>
                              <span style={{ fontSize: 9, color: '#C8C0B8' }}>{s.name}</span></>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── 내 사진 ── */}
<section>
  <div className="flex items-center justify-between mb-4">
    <p className="text-[10px] font-bold tracking-[0.28em]" style={{ color: '#9A8A72' }}>내 사진</p>
    {myPhotos.length > 0 && (
      <span style={{ fontSize: 10, color: '#B0A090' }}>{myPhotos.length}장</span>
    )}
  </div>

  {photosLoading && (
    <div className="rounded-2xl p-5 text-center"
         style={{ background: 'white', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
      <p className="text-[11px]" style={{ color: '#B0A090' }}>사진을 불러오는 중이에요...</p>
    </div>
  )}

  {!photosLoading && myPhotos.length === 0 && (
    <div className="rounded-2xl p-5 text-center"
         style={{ background: 'white', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
      <Camera size={24} color="#E0D5C5" strokeWidth={1.5} style={{ margin: '0 auto 8px' }} />
      <p className="text-[11px]" style={{ color: '#B0A090' }}>아직 올린 사진이 없어요</p>
      <p className="text-[10px] mt-1" style={{ color: '#C9A84C' }}>
        장소 상세 페이지에서 사진을 올려보세요
      </p>
    </div>
  )}

  {!photosLoading && myPhotos.length > 0 && (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {myPhotos.slice(0, visiblePhotos).map(photo => (
          <div key={photo.id}
               onClick={() => navigate(`/places/${photo.place_id}/photos`)}
               style={{
                 borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                 position: 'relative', aspectRatio: '1',
                 boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
               }}>
            <img
              src={`${API}${photo.photo_url}`} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                       transition: 'transform 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '14px 6px 5px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
            }}>
              <p style={{ fontSize: 9, color: 'white', fontWeight: 600,
                          textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {photo.place_name || photo.place_id}
              </p>
            </div>
            <div style={{ position: 'absolute', top: 5, right: 6 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)',
                             textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                ♥ {photo.like_count || 0}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 더보기 / 접기 버튼 */}
      {myPhotos.length > 3 && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
    <div style={{
      flex: 1, height: '1px',
      background: 'linear-gradient(to right, transparent, rgba(160,120,64,0.25))',
    }} />
    <button
      onClick={() => setVisiblePhotos(prev => prev >= myPhotos.length ? 3 : prev + 3)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 10, fontWeight: 700, color: '#A07840',
        letterSpacing: '0.25em',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        padding: '2px 4px',
        opacity: 0.6,
        fontFamily: "'Noto Serif KR', serif",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.letterSpacing = '0.35em'
        e.currentTarget.style.color = '#7A5820'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '0.6'
        e.currentTarget.style.letterSpacing = '0.25em'
        e.currentTarget.style.color = '#A07840'
      }}>
      {visiblePhotos >= myPhotos.length ? '접 기' : '더 보 기'}
    </button>
    <div style={{
      flex: 1, height: '1px',
      background: 'linear-gradient(to left, transparent, rgba(160,120,64,0.25))',
    }} />
  </div>
)}
    </>
  )}
</section>

        {/* ── 방문 리뷰 ── */}
        <section>
          <p className="text-[10px] font-bold tracking-[0.28em] mb-4" style={{ color: '#9A8A72' }}>방문 리뷰</p>
          {loading && (
            <div className="rounded-2xl p-5 text-center"
                 style={{ background: 'white', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
              <p className="text-[11px]" style={{ color: '#B0A090' }}>리뷰를 불러오는 중이에요...</p>
            </div>
          )}
          {!loading && reviews.length === 0 && (
            <div className="rounded-2xl p-5 text-center"
                 style={{ background: 'white', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
              <p className="text-[11px]" style={{ color: '#B0A090' }}>아직 남긴 리뷰가 없어요</p>
              <p className="text-[10px] mt-1" style={{ color: '#C9A84C' }}>장소 상세 페이지에서 리뷰를 남겨보세요</p>
            </div>
          )}
          {!loading && reviews.length > 0 && (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="rounded-2xl p-5"
                     style={{
                       background: hovered === r.id ? '#FDFAF6' : 'white',
                       boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                       transform: hovered === r.id ? 'translateY(-1px)' : 'none',
                       transition: 'all 0.22s ease',
                     }}
                     onMouseEnter={() => setHovered(r.id)}
                     onMouseLeave={() => setHovered(null)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: '#1A1208' }}>
                        {r.place_name || getPlaceName(r.place_id)}
                      </p>
                      <StarRow rating={r.rating} />
                    </div>
                    <span style={{ fontSize: 10, color: '#B8A898' }}>
                      {r.visited_at?.slice(0, 7).replace('-', '.') || r.created_at?.slice(0, 7).replace('-', '.')}
                    </span>
                  </div>
                  {r.content && (
                    <p className="text-xs leading-relaxed mb-3" style={{ color: '#6A5A4A' }}>{r.content}</p>
                  )}
                  {r.tags?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {r.tags.map(t => (
                        <span key={t} className="text-[10px] px-2.5 py-1 rounded-full"
                              style={{ background: '#F3EFE8', color: '#8A7A60' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 스탬프 인증 모달 */}
      {selectedStamp && (
        <StampModal
          stamp={selectedStamp.stamp}
          tour={selectedStamp.tour}
          onClose={() => { setSelectedStamp(null); window.dispatchEvent(new Event('bottomsheet:close')) }}
          onComplete={() => fetchMyStamps()}
        />
      )}

      {/* 완주 축하 팝업 */}
      {completedTour && (
        <CompletionPopup
          tour={completedTour}
          onClose={() => { setCompletedTour(null); window.dispatchEvent(new Event('bottomsheet:close')) }}
        />
      )}

      {/* 로그아웃 모달 */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
             style={{ background: 'rgba(0,0,0,0.45)' }}
             onClick={() => { setShowLogout(false); window.dispatchEvent(new Event('bottomsheet:close')) }}>
          <div className="rounded-2xl p-6 mx-6 w-full max-w-xs"
               style={{ background: '#FAF6EF' }}
               onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold mb-1" style={{ color: '#1A1208' }}>로그아웃</p>
            <p className="text-[12px] mb-5" style={{ color: '#9A8A70' }}>정말 로그아웃 하시겠어요?</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowLogout(false); window.dispatchEvent(new Event('bottomsheet:close')) }}
                style={{ flex: 1, padding: 11, borderRadius: 12, background: '#EDE5D8',
                         color: '#9A8A70', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={handleLogout}
                style={{ flex: 1, padding: 11, borderRadius: 12, background: '#3B2D1A',
                         color: '#F5E6C8', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}