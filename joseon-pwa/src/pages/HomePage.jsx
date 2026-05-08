import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { placesAPI } from '../api/api'
import {
  Crown, Bot, Stamp, Star, ChevronRight, ArrowRight,
  Flame, Landmark, Navigation, Clock, BookOpen, Compass
} from 'lucide-react'

const BANNERS = [
  // ── 1. 에디토리얼 배너 ──
  {
    bg: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%)',
    image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&q=80',
    accent: '#ffffff',
    chip: null,
    chipLabel: null,
    era: null,
    title: '역사 속 그 공간으로',
    subtitle: '조선로그',
    sub: null,
    placeId: null,
    history: null,
    style: 'editorial',
  },
  // ── 2. 청령포 ──
  {
    bg: 'linear-gradient(160deg,rgba(8,20,40,0.55) 0%,transparent 50%,rgba(5,12,25,0.82) 100%)',
    image: 'https://flexible.img.hani.co.kr/flexible/normal/970/607/imgdb/original/2024/1122/20241122501962.jpg',
    accent: '#4A9EFF',
    chip: '지금 가장 핫한 곳',
    chipLabel: '단종 유배지',
    era: '1457 · 조선 세조',
    title: '청령포',
    subtitle: '단종 유배지',
    sub: '《왕과 사는 남자》 방영 후 방문객 급증',
    placeId: 'sajuk_cheongnyeong',
    history: { year: '1457', title: '단종, 청령포에 유배되다', desc: '17세의 왕은 삼면이 강으로 둘러싸인 땅에 홀로 남겨졌다.' },
    style: 'premium',
  },
  // ── 3. 창덕궁 ──
  {
    bg: 'linear-gradient(160deg,rgba(5,20,12,0.55) 0%,transparent 50%,rgba(3,15,8,0.82) 100%)',
    image: 'https://i.namu.wiki/i/87AdKb9xEHtc3CVEoQ-wnpyT3-pvrTaaNMcwXycJFTxMxMcP0cDt2C8IgLGPkCrOKIFkKR2XGJtL-R81HC7CrQ.webp',
    accent: '#52C97A',
    chip: '봄 특별 추천',
    chipLabel: '후원 봄 개방',
    era: '1443 · 조선 세종',
    title: '창덕궁',
    subtitle: '후원 봄 개방',
    sub: '4월 한정 봄 개방 · 사전 예약 필수',
    placeId: 'site_palace_2',
    history: { year: '1443', title: '세종대왕, 훈민정음을 창제하다', desc: '백성 누구나 쉽게 읽고 쓸 수 있는 문자 체계를 완성하다.' },
    style: 'premium',
  },
  // ── 4. 경복궁 ──
  {
    bg: 'linear-gradient(160deg,rgba(30,18,5,0.55) 0%,transparent 50%,rgba(20,10,3,0.82) 100%)',
    image: 'https://plus.unsplash.com/premium_photo-1661948404806-391a240d6d40?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8JUVBJUIyJUJEJUVCJUIzJUI1JUVBJUI2JTgxfGVufDB8fDB8fHww',
    accent: '#C9A84C',
    chip: '특별전 진행 중',
    chipLabel: '조선의 법궁',
    era: '1392 · 조선 태조',
    title: '경복궁',
    subtitle: '조선의 법궁',
    sub: '조선 왕실 의궤 특별전 · ~5월 31일',
    placeId: 'site_palace_1',
    history: { year: '1392', title: '태조 이성계, 조선을 건국하다', desc: '고려를 멸망시키고 새로운 왕조의 문을 열다.' },
    style: 'premium',
  },
]

const HOT_PLACES = [
  { name: '청령포',    image: 'https://flexible.img.hani.co.kr/flexible/normal/970/607/imgdb/original/2024/1122/20241122501962.jpg', reason: '↑324%',    rank: 1, isHot: true, placeId: 'sajuk_cheongnyeong' },
  { name: '경복궁',    image: 'https://plus.unsplash.com/premium_photo-1661948404806-391a240d6d40?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8JUVBJUIyJUJEJUVCJUIzJUI1JUVBJUI2JTgxfGVufDB8fDB8fHww',   reason: '야간개장',  rank: 2, placeId: 'site_palace_1' },
  { name: '창덕궁',    image: 'https://i.namu.wiki/i/87AdKb9xEHtc3CVEoQ-wnpyT3-pvrTaaNMcwXycJFTxMxMcP0cDt2C8IgLGPkCrOKIFkKR2XGJtL-R81HC7CrQ.webp', reason: '봄 시즌',   rank: 3, placeId: 'site_palace_2' },
  { name: '수원 화성', image: 'https://images.unsplash.com/photo-1519922639192-e73293ca430e?w=400&q=80', reason: '야경 명소', rank: 4, placeId: 'site_palace_3' },
]

const FEATURES = [
  { icon: Navigation, label: '지도 탐방', path: '/map',    color: '#1E3A5F' },
  { icon: Crown,      label: '왕·인물',  path: '/kings',  color: '#7C3D0A' },
  { icon: Bot,        label: 'AI 해설사', path: '/',       color: '#1F4D2E' },
  { icon: Stamp,      label: '스탬프',   path: '/record', color: '#4C1D95' },
  { icon: Star,       label: '리뷰',     path: '/record', color: '#9A2A2A' },
]

export default function HomePage() {
  const navigate    = useNavigate()
  const bannerRef   = useRef(null)

  const [places,        setPlaces]        = useState([])
  const [displayPlaces, setDisplayPlaces] = useState([])
  const [fadeIn,        setFadeIn]        = useState(true)
  const [bannerIdx,     setBannerIdx]     = useState(0)
  const [progress,      setProgress]      = useState(0)
  const timerRef    = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    placesAPI.getAll().then(data => setPlaces(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (places.length === 0) return
    const shuffle = () => {
      setFadeIn(false)
      setTimeout(() => {
        const shuffled = [...places].sort(() => Math.random() - 0.5).slice(0, 3)
        setDisplayPlaces(shuffled)
        setFadeIn(true)
      }, 400)
    }
    shuffle()
    const interval = setInterval(shuffle, 30000)
    return () => clearInterval(interval)
  }, [places])

  useEffect(() => {
    setProgress(0)
    const duration = 4000
    const tick = 30
    let elapsed = 0
    progressRef.current = setInterval(() => {
      elapsed += tick
      setProgress((elapsed / duration) * 100)
      if (elapsed >= duration) clearInterval(progressRef.current)
    }, tick)
    timerRef.current = setTimeout(() => {
      setBannerIdx(prev => (prev + 1) % BANNERS.length)
    }, duration)
    return () => {
      clearInterval(progressRef.current)
      clearTimeout(timerRef.current)
    }
  }, [bannerIdx])

  const banner = BANNERS[bannerIdx]

  const getCategoryColor = (category) => {
    switch (category) {
      case '궁궐':  return 'rgba(180,83,9,0.85)'
      case '왕릉':  return 'rgba(30,95,58,0.85)'
      case '사적':  return 'rgba(30,58,95,0.85)'
      case '박물관': return 'rgba(76,29,149,0.85)'
      default:      return 'rgba(30,58,95,0.85)'
    }
  }

  // 슬라이드 인디케이터 (공통)
  const Indicators = () => (
    <div className="flex gap-1">
      {BANNERS.map((_, i) => (
        <button key={i}
                onClick={e => { e.stopPropagation(); setBannerIdx(i) }}
                className="relative h-[2.5px] rounded-full overflow-hidden transition-all duration-300"
                style={{ width: i === bannerIdx ? 24 : 6, background: 'rgba(255,255,255,0.28)' }}>
          {i === bannerIdx && (
            <div className="absolute inset-y-0 left-0 rounded-full"
                 style={{ width: `${progress}%`, background: banner.accent }} />
          )}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: '#f5f1eb' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;700&display=swap');
        @keyframes slowZoom {
          0%   { transform: scale(1.0);  }
          100% { transform: scale(1.06); }
        }
        @keyframes floatY {
          0%, 100% { transform: scale(1.06) translateY(0px);  }
          50%       { transform: scale(1.06) translateY(-5px); }
        }
        .banner-zoom  { animation: slowZoom 8s ease-in-out infinite alternate; }
        .banner-float { animation: floatY 6s ease-in-out infinite; }
        @keyframes editorialFadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes premiumFadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .editorial-box   { animation: editorialFadeUp 0.8s ease 0.15s both; }
        .premium-content { animation: premiumFadeUp   0.7s ease 0.1s  both; }
        .places-fade     { transition: opacity 0.4s ease; }
      `}</style>

      {/* 헤더 */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between" style={{ background: '#f5f1eb' }}>
        <div>
          <p className="text-[10px] tracking-[0.3em] text-[#C9A84C] font-medium mb-0.5">JOSEON HERITAGE</p>
          <h1 className="font-serif text-lg font-bold text-[#1A1208]">조선, 그 공간을 걷다</h1>
        </div>
        <div className="w-9 h-9 rounded-full border-2 border-[rgba(201,168,76,0.4)] flex items-center justify-center"
             style={{ background: 'rgba(201,168,76,0.1)' }}>
          <BookOpen size={16} color="#C9A84C" strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex-1 space-y-6" style={{ background: '#f5f1eb' }}>

        {/* ── 메인 배너 ── */}
        <div className="px-4">
          <div
            ref={bannerRef}
            className="relative rounded-3xl overflow-hidden cursor-pointer"
            style={{ height: 290, boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}
            onClick={() => banner.placeId && navigate(`/places/${banner.placeId}`)}>

            {/* 배경 이미지 */}
            <img
              src={banner.image}
              alt={banner.title}
              className={`absolute inset-0 w-full h-full object-cover ${banner.style === 'editorial' ? 'banner-zoom' : 'banner-float'}`}
              style={{
                opacity: 0.92,
                filter: 'none',
              }}
            />
            {/* 색상 오버레이 */}
            <div className="absolute inset-0" style={{ background: banner.bg }} />

            {/* ────────────────────────────────
                1번 에디토리얼 배너
            ──────────────────────────────── */}
            {banner.style === 'editorial' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="absolute top-5 right-5"><Indicators /></div>
                <div className="editorial-box" style={{
                  border: '1px solid rgba(255,255,255,0.68)',
                  padding: '18px 36px',
                  textAlign: 'center',
                }}>
                  <p style={{
                    fontSize: '10px', letterSpacing: '0.38em',
                    color: 'rgba(255,255,255,0.6)', marginBottom: '10px',
                    fontFamily: 'sans-serif', fontWeight: 400,
                  }}>역사 속 그 공간으로</p>
                  <h2 style={{
                    fontSize: '26px', fontWeight: 300, color: '#fff',
                    letterSpacing: '0.22em',
                    fontFamily: 'Noto Serif KR, Georgia, serif',
                    lineHeight: 1, margin: 0,
                    textShadow: '0 1px 10px rgba(0,0,0,0.2)',
                  }}>조선로그</h2>
                </div>
              </div>
            )}

            {/* ────────────────────────────────
                2·3·4번 프리미엄 배너
            ──────────────────────────────── */}
            {banner.style === 'premium' && (
              <div className="absolute inset-0 flex flex-col justify-between p-5">

                {/* 상단: 연도 + 인디케이터 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div style={{ width: '1px', height: '14px', background: `${banner.accent}70` }} />
                    <span style={{
                      fontSize: '9px', letterSpacing: '0.28em',
                      color: `${banner.accent}cc`, fontFamily: 'sans-serif',
                    }}>{banner.era}</span>
                  </div>
                  <Indicators />
                </div>

                {/* 하단: 제목 + 미니 역사카드 */}
                <div className="premium-content flex items-end justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* chip + 구분선 */}
                    <div className="flex items-center gap-2 mb-5">
                      <span style={{
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em',
                        color: `${banner.accent}e0`, fontFamily: 'sans-serif',
                      }}>{banner.chipLabel}</span>
                      <div style={{ width: '16px', height: '1px', background: `${banner.accent}45` }} />
                      <span style={{
                        fontSize: '9px', color: 'rgba(255,255,255,0.32)',
                        letterSpacing: '0.12em',
                      }}>{banner.chip}</span>
                    </div>

                    {/* 제목 */}
                    <h2 style={{
                      fontSize: '40px', fontWeight: 200, color: '#fff',
                      letterSpacing: '0.06em',
                      fontFamily: 'Noto Serif KR, Georgia, serif',
                      lineHeight: 1, margin: '0 0 8px',
                      textShadow: '0 2px 16px rgba(0,0,0,0.4)',
                    }}>{banner.title}</h2>

                    {/* sub */}
                    {banner.sub && (
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.36)', margin: 0, letterSpacing: '0.04em' }}>
                        {banner.sub}
                      </p>
                    )}
                  </div>

                  {/* 미니 역사 카드 */}
                  {banner.history && (
                    <div className="flex-shrink-0" style={{
                      width: '108px', padding: '10px 12px',
                      borderRadius: '14px',
                      background: 'rgba(0,0,0,0.42)',
                      border: `1px solid ${banner.accent}28`,
                      backdropFilter: 'blur(14px)',
                    }}>
                      <div style={{
                        fontSize: '15px', fontWeight: 700,
                        color: banner.accent, fontFamily: 'Georgia, serif',
                        marginBottom: '4px',
                      }}>{banner.history.year}</div>
                      <p style={{
                        fontSize: '9px', color: 'rgba(255,255,255,0.72)',
                        lineHeight: 1.45, margin: 0,
                      }}>{banner.history.title}</p>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>

        {/* 지금 뜨는 장소 */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-1.5">
              <Flame size={12} color="#C9A84C" />
              <p className="text-[11px] font-bold tracking-[0.15em] text-[#5C4A32]">지금 뜨는 장소</p>
            </div>
            <button className="flex items-center gap-0.5 text-[10px] text-[#9A8A70]" onClick={() => navigate('/map')}>
              전체 <ChevronRight size={10} />
            </button>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
            {HOT_PLACES.map(p => (
              <div key={p.name}
                   onClick={() => navigate(`/places/${p.placeId}`)}
                   className="flex-shrink-0 w-32 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
                   style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
                <div className="h-20 relative overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-2 left-2 text-[10px] font-black text-white/70 bg-black/30 w-5 h-5 rounded-md flex items-center justify-center">
                    {p.rank}
                  </span>
                  {p.isHot && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                          style={{ background: '#C9A84C', color: 'white' }}>
                      <Flame size={7} /> HOT
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-[#1A1208] truncate">{p.name}</p>
                  <p className="text-[9px] text-[#9A8A70] mt-0.5">{p.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 추천 장소 */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Compass size={12} color="#C9A84C" />
              <p className="text-[11px] font-bold tracking-[0.15em] text-[#5C4A32]">추천 장소</p>
            </div>
            <button className="flex items-center gap-0.5 text-[10px] text-[#9A8A70]" onClick={() => navigate('/map')}>
              전체 <ChevronRight size={10} />
            </button>
          </div>

          <div className="places-fade space-y-3" style={{ opacity: fadeIn ? 1 : 0 }}>
            {displayPlaces.map(place => (
              <div key={place.id}
                   onClick={() => navigate(`/places/${place.id}`)}
                   className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                   style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div className="h-36 relative overflow-hidden"
                     style={{ background: 'linear-gradient(135deg,#1A1208,#2D1F0A)' }}>
                  {place.image_url
                    ? <img src={place.image_url} alt={place.name} className="w-full h-full object-cover opacity-80" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Landmark size={48} color="rgba(201,168,76,0.3)" strokeWidth={1} />
                      </div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-xl"
                        style={{ background: getCategoryColor(place.category), color: 'white', backdropFilter: 'blur(4px)' }}>
                    {place.category}
                  </span>
                  <div className="absolute bottom-3 left-4">
                    <h3 className="font-serif text-lg font-black text-white">{place.name}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-[#9A8A70] mb-2 flex items-center gap-1">
                    <Navigation size={9} color="#C9A84C" />
                    {place.address}
                  </p>
                  <p className="text-xs text-[#7A6A50] leading-relaxed line-clamp-2 mb-3">{place.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      {place.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-lg"
                              style={{ background: 'rgba(201,168,76,0.08)', color: '#9A7A30',
                                       border: '1px solid rgba(201,168,76,0.18)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                         style={{ background: 'rgba(201,168,76,0.1)' }}>
                      <ArrowRight size={13} color="#C9A84C" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {displayPlaces.length === 0 && [1,2,3].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden"
                   style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div className="h-36" style={{ background: '#EDE5D8', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded-full" style={{ background: '#EDE5D8', width: '60%' }} />
                  <div className="h-2 rounded-full" style={{ background: '#EDE5D8', width: '90%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 주요 기능 */}
        <div className="px-4 pb-2">
          <p className="text-[11px] font-bold tracking-[0.15em] text-[#5C4A32] mb-3">주요 기능</p>
          <div className="grid grid-cols-5 gap-2">
            {FEATURES.map(item => (
              <button key={item.label}
                      onClick={() => navigate(item.path)}
                      className="flex flex-col items-center gap-2 py-3.5 rounded-2xl active:scale-95 transition-all"
                      style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                     style={{ background: `${item.color}15` }}>
                  <item.icon size={16} strokeWidth={1.6} color={item.color} />
                </div>
                <span className="text-[9px] font-semibold text-[#7A6A50] text-center leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}