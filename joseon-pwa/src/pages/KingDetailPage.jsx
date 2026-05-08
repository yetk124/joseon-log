// src/pages/KingDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { kingsAPI } from '../api/api'
import { Crown, ChevronLeft, ChevronRight, MapPin, ExternalLink } from 'lucide-react'

const KING_IMAGES = {
  '태조': '//i.namu.wiki/i/Wn3Dcc2TXYa5toJnUpKZtY_fWTE_4W5edTb6fDuYgMJLFWgbVHW4D_WRxPE3RGKmpuHuVA8iJCzLJoWtwhuWygAWp6bIWkz2Q-7VuhXXT2Dhaxtiv5wF1BkPBihkFSvhj8hWhP74Uwrwx7_Iw8YOag.webp',
  '태종': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Portrait_of_King_Taejong.jpg/400px-Portrait_of_King_Taejong.jpg',
  '세종': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/King_Sejong_the_Great.jpg/400px-King_Sejong_the_Great.jpg',
  '세조': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Portrait_of_King_Sejo.jpg/400px-Portrait_of_King_Sejo.jpg',
  '성종': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Portrait_of_King_Seongjong.jpg/400px-Portrait_of_King_Seongjong.jpg',
  '중종': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Portrait_of_King_Jungjong.jpg/400px-Portrait_of_King_Jungjong.jpg',
  '선조': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Portrait_of_King_Seonjo.jpg/400px-Portrait_of_King_Seonjo.jpg',
  '영조': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Portrait_of_King_Yeongjo.jpg/400px-Portrait_of_King_Yeongjo.jpg',
  '정조': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Portrait_of_King_Jeongjo.jpg/400px-Portrait_of_King_Jeongjo.jpg',
  '고종': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Emperor_Gojong.jpg/400px-Emperor_Gojong.jpg',
}

const ERA_GRADIENTS = {
  '건국': 'linear-gradient(135deg, #2D1F0A, #B45309)',
  '전기': 'linear-gradient(135deg, #0A2E1A, #14532D)',
  '중기': 'linear-gradient(135deg, #0D1F3C, #1E3A5F)',
  '후기': 'linear-gradient(135deg, #1A0A2E, #4C1D95)',
  '말기': 'linear-gradient(135deg, #2D0A0A, #C2410C)',
}

const ERA_COLORS = {
  '건국': { bg: '#B45309', light: '#FEF3C7', text: '#92400E' },
  '전기': { bg: '#14532D', light: '#DCFCE7', text: '#166534' },
  '중기': { bg: '#1E3A5F', light: '#DBEAFE', text: '#1E40AF' },
  '후기': { bg: '#4C1D95', light: '#EDE9FE', text: '#5B21B6' },
  '말기': { bg: '#C2410C', light: '#FFEDD5', text: '#9A3412' },
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl p-4"
         style={{ background: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
      <p className="text-[10px] font-bold tracking-[0.2em] mb-3" style={{ color: '#9A8A70' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

export default function KingDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [king,    setKing]    = useState(null)
  const [allKings, setAllKings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 전체 왕 목록 불러오기 (이전/다음 네비게이션용)
    kingsAPI.getAll().then(data => {
      setAllKings(data)
      const found = data.find(k => String(k.id) === String(id))
      if (found) setKing(found)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#F5F1EB' }}>
        <div style={{ color: '#9A8A70', fontSize: 13 }}>불러오는 중...</div>
      </div>
    )
  }

  if (!king) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ background: '#F5F1EB' }}>
        <Crown size={40} color="rgba(201,168,76,0.3)" strokeWidth={1} />
        <p className="text-sm font-bold mt-3" style={{ color: '#9A8A70' }}>왕 정보를 찾을 수 없어요</p>
        <button onClick={() => navigate('/kings')}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: '#1A1208', color: '#C9A84C' }}>
          목록으로
        </button>
      </div>
    )
  }

  const ec = ERA_COLORS[king.era] || ERA_COLORS['전기']
  const imgSrc = KING_IMAGES[king.name]

  const currentIdx = allKings.findIndex(k => String(k.id) === String(id))
  const prevKing   = allKings[currentIdx - 1] ?? null
  const nextKing   = allKings[currentIdx + 1] ?? null

  // achievement 문자열을 '/' 기준으로 분리
  const achievements = king.achievement
    ? king.achievement.split('/').map(a => a.trim()).filter(Boolean)
    : []

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F5F1EB' }}>

      {/* ── 헤더 ── */}
      <div className="relative flex-shrink-0 overflow-hidden"
           style={{ background: 'linear-gradient(160deg,#1A1208,#2D1F0A)', minHeight: 220 }}>

        {/* 배경 대수 숫자 */}
        <span className="absolute right-5 bottom-5 font-serif font-black leading-none select-none pointer-events-none"
              style={{ fontSize: 120, color: 'rgba(201,168,76,0.07)' }}>
          {king.king_id}
        </span>

        {/* 뒤로가기 */}
        <button onClick={() => navigate('/kings')}
                className="absolute top-14 left-4 flex items-center gap-1"
                style={{ color: 'rgba(245,230,200,0.5)', zIndex: 50, padding: '8px 12px', margin: '-8px -12px' }}>
          <ChevronLeft size={16} strokeWidth={2} />
          <span className="text-xs">왕·인물</span>
        </button>

        <div className="flex items-end gap-5 px-5 pt-24 pb-6 relative z-10">

          {/* 초상화 */}
          <div className="flex-shrink-0 relative overflow-hidden rounded-2xl shadow-lg"
               style={{ width: 90, height: 110, background: ERA_GRADIENTS[king.era] || ERA_GRADIENTS['전기'] }}>
            {imgSrc
              ? <img src={imgSrc} alt={king.name}
                     style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                              objectFit: 'cover', objectPosition: 'top center' }}
                     onError={e => { e.currentTarget.style.display = 'none' }} />
              : <div className="w-full h-full flex items-center justify-center">
                  <Crown size={32} color="rgba(255,255,255,0.2)" strokeWidth={1} />
                </div>
            }
          </div>

          {/* 이름·정보 */}
          <div className="flex-1 pb-1">
            <p className="text-[10px] font-bold tracking-[0.2em] mb-1" style={{ color: '#C9A84C' }}>
              제{king.king_id}대
            </p>
            <h1 className="font-serif text-2xl font-black mb-0.5" style={{ color: '#F5E6C8' }}>
              {king.name}
            </h1>
            {king.full_name && (
              <p className="text-xs mb-1" style={{ color: 'rgba(245,230,200,0.5)' }}>{king.full_name}</p>
            )}
            <p className="text-xs" style={{ color: 'rgba(245,230,200,0.4)' }}>{king.reign}</p>
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="flex-1 px-4 pt-4 pb-4 space-y-3">

        {/* 기본 정보 */}
        <div className="rounded-2xl overflow-hidden"
             style={{ background: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex divide-x" style={{ borderColor: '#F0ECE4' }}>
            {[
              { label: '생년', value: king.birth ?? '-' },
              { label: '몰년', value: king.death ?? '-' },
              { label: '시대', value: king.era   ?? '-' },
            ].map(item => (
              <div key={item.label} className="flex-1 text-center py-3.5">
                <p className="text-[9px] mb-1" style={{ color: '#9A8A70' }}>{item.label}</p>
                <p className="text-sm font-bold" style={{ color: '#1A1208' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 소개 */}
        {king.description && (
          <Section title="소개">
            <p className="text-sm leading-relaxed" style={{ color: '#555' }}>{king.description}</p>
          </Section>
        )}

        {/* 주요 업적 */}
        {achievements.length > 0 && (
          <Section title="주요 업적">
            <div className="space-y-1.5">
              {achievements.map((ach, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 border-b last:border-none"
                     style={{ borderColor: '#F0ECE4' }}>
                  <span style={{ color: ec.bg }}>✦</span>
                  <span className="text-sm" style={{ color: '#444' }}>{ach}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 키워드 태그 */}
        {king.tags?.length > 0 && (
          <Section title="키워드">
            <div className="flex flex-wrap gap-2">
              {king.tags.map(kw => (
                <span key={kw} className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                      style={{ background: ec.light, color: ec.text }}>
                  #{kw}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* 한국민족문화대백과 링크 */}
        {king.url && (
          <button
            onClick={() => window.open(king.url, '_blank')}
            className="w-full rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: `1px solid ${ec.bg}22` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: ec.light }}>
              <ExternalLink size={16} color={ec.bg} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold" style={{ color: '#1A1208' }}>한국민족문화대백과</p>
              <p className="text-[11px]" style={{ color: '#9A8A70' }}>더 자세한 정보 보기</p>
            </div>
            <ChevronRight size={16} color={ec.bg} />
          </button>
        )}

      </div>

      {/* ── 이전 / 다음 네비게이션 ── */}
      <div className="flex gap-3 px-4 py-3 flex-shrink-0"
           style={{ background: 'white', borderTop: '1px solid #E8E0D0',
                    paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>

        <button
          onClick={() => prevKing && navigate(`/kings/${prevKing.id}`)}
          disabled={!prevKing}
          className="flex-1 flex items-center gap-2.5 px-3 py-3 rounded-2xl"
          style={{ background: '#F5F1EB', opacity: prevKing ? 1 : 0.3, cursor: prevKing ? 'pointer' : 'default' }}>
          <ChevronLeft size={16} color="#9A8A70" strokeWidth={2} />
          <div className="text-left">
            <p className="text-[9px] font-bold tracking-wider" style={{ color: '#9A8A70' }}>이전 왕</p>
            <p className="text-sm font-bold" style={{ color: '#1A1208' }}>{prevKing?.name ?? '처음'}</p>
            {prevKing && <p className="text-[10px] font-semibold" style={{ color: '#C9A84C' }}>제{prevKing.king_id}대</p>}
          </div>
        </button>

        <button
          onClick={() => nextKing && navigate(`/kings/${nextKing.id}`)}
          disabled={!nextKing}
          className="flex-1 flex items-center justify-end gap-2.5 px-3 py-3 rounded-2xl"
          style={{ background: '#F5F1EB', opacity: nextKing ? 1 : 0.3, cursor: nextKing ? 'pointer' : 'default' }}>
          <div className="text-right">
            <p className="text-[9px] font-bold tracking-wider" style={{ color: '#9A8A70' }}>다음 왕</p>
            <p className="text-sm font-bold" style={{ color: '#1A1208' }}>{nextKing?.name ?? '마지막'}</p>
            {nextKing && <p className="text-[10px] font-semibold" style={{ color: '#C9A84C' }}>제{nextKing.king_id}대</p>}
          </div>
          <ChevronRight size={16} color="#9A8A70" strokeWidth={2} />
        </button>

      </div>
    </div>
  )
}