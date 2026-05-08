// src/pages/TimelinePage.jsx
import { useState, useEffect, useRef } from 'react'

const STYLES = `
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes dotPop {
    0%   { transform: scale(0); opacity: 0; }
    65%  { transform: scale(1.3);           }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes pageIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`

function IconFoundation({ color, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M5 21V7l7-4 7 4v14"/>
      <rect x="9" y="13" width="6" height="8"/>
      <circle cx="9.5" cy="9.5" r="0.5" fill={color}/>
      <circle cx="14.5" cy="9.5" r="0.5" fill={color}/>
    </svg>
  )
}
function IconSword({ color, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5"/>
      <path d="M13 19l6-6"/>
      <path d="M16 16l4 4"/>
      <path d="M8 8l-2 2"/>
    </svg>
  )
}
function IconScroll({ color, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="8" y1="7"  x2="16" y2="7"/>
      <line x1="8" y1="11" x2="13" y2="11"/>
    </svg>
  )
}
function IconGlobe({ color, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 3c-1.5 2.5-2.5 5.5-2.5 9s1 6.5 2.5 9"/>
      <path d="M12 3c1.5 2.5 2.5 5.5 2.5 9s-1 6.5-2.5 9"/>
      <line x1="3.5"  y1="9"  x2="20.5" y2="9"/>
      <line x1="3.5"  y1="15" x2="20.5" y2="15"/>
    </svg>
  )
}

const ERA_ICONS = [IconFoundation, IconSword, IconScroll, IconGlobe]

const ERAS = [
  {
    label: '건국 · 초기',
    period: '1392 — 1494',
    king: '태조 ~ 성종',
    color: '#A07840',
    colorAlpha: 'rgba(160,120,64,0.15)',
    light: '#FDF6EC',
    desc: '한양 천도와 유교 국가의 기틀을 세운 시기',
    events: [
      { year: 1392, title: '조선 건국',    desc: '이성계가 고려를 무너뜨리고 조선을 세움. 한양으로 수도를 옮김.' },
      { year: 1443, title: '훈민정음 창제', desc: '세종대왕이 28자의 독창적 문자를 만들어 백성에게 반포.' },
      { year: 1485, title: '경국대전 완성', desc: '성종 때 조선의 기본 법전이 완성되어 국가 체계가 완비됨.' },
    ],
  },
  {
    label: '사화 · 전란기',
    period: '1494 — 1650',
    king: '연산군 ~ 인조',
    color: '#8A5A3A',
    colorAlpha: 'rgba(138,90,58,0.15)',
    light: '#FAF0E8',
    desc: '사화와 임진왜란·병자호란으로 혼란했던 시기',
    events: [
      { year: 1498, title: '무오사화',   desc: '연산군 시대, 사림파가 대거 숙청되며 4대 사화의 시작.' },
      { year: 1592, title: '임진왜란',   desc: '일본 도요토미 히데요시의 침략. 이순신 장군이 활약하며 7년간 항쟁.' },
      { year: 1636, title: '병자호란',   desc: '청나라 침입으로 인조가 남한산성에서 항전, 삼전도의 굴욕.' },
    ],
  },
  {
    label: '중흥 · 영정조',
    period: '1650 — 1800',
    king: '효종 ~ 정조',
    color: '#4A6A5A',
    colorAlpha: 'rgba(74,106,90,0.15)',
    light: '#EEF6F0',
    desc: '실학이 꽃피고 문예가 부흥한 조선의 르네상스',
    events: [
      { year: 1678, title: '상평통보 유통', desc: '숙종 때 동전이 전국적으로 통용되며 상업이 발달.' },
      { year: 1750, title: '균역법 시행',   desc: '영조가 군포 부담을 절반으로 줄여 백성의 세금을 경감.' },
      { year: 1796, title: '수원 화성 완공', desc: '정조가 실학을 적용해 새로운 도시 화성을 건설, 사도세자 추모.' },
    ],
  },
  {
    label: '세도 · 개화기',
    period: '1800 — 1897',
    king: '순조 ~ 고종',
    color: '#5A6A8A',
    colorAlpha: 'rgba(90,106,138,0.15)',
    light: '#EEF0F8',
    desc: '세도 정치의 혼란 속 서양 문물과 접촉한 시기',
    events: [
      { year: 1811, title: '홍경래의 난',   desc: '세도정치에 맞선 평안도 민란. 차별받던 서북민의 저항.' },
      { year: 1876, title: '강화도 조약',   desc: '일본과 맺은 최초의 근대적 조약. 부산 등 항구 개항.' },
      { year: 1897, title: '대한제국 선포', desc: '고종이 황제로 즉위하며 자주 독립 국가임을 천명.' },
    ],
  },
]

function EventRow({ ev, era, index, total }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}
         style={{ display: 'grid', gridTemplateColumns: '44px 16px 1fr',
                  gap: '0 14px', paddingBottom: index < total - 1 ? 26 : 4,
                  animation: `fadeSlideUp 0.3s ease ${index * 0.07}s both`,
                  cursor: 'default' }}>
      <div style={{ textAlign: 'right', paddingTop: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 800,
                       color: hovered ? era.color : era.color + 'AA',
                       fontFamily: "'Noto Sans KR', sans-serif",
                       transition: 'color 0.18s' }}>
          {ev.year}
        </span>
      </div>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4,
                      background: era.color, flexShrink: 0,
                      position: 'relative', zIndex: 1,
                      transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s',
                      transform: hovered ? 'scale(1.4)' : 'scale(1)',
                      boxShadow: hovered
                        ? `0 0 0 3px ${era.light}, 0 0 0 5px ${era.color}55`
                        : `0 0 0 3px ${era.light}, 0 0 0 4px ${era.color}28`,
                      animation: `dotPop 0.38s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.07 + 0.12}s both` }} />
        {index < total - 1 && (
          <div style={{ position: 'absolute', top: 14, bottom: -4,
                        left: '50%', transform: 'translateX(-50%)', width: 1,
                        background: `linear-gradient(to bottom, ${era.color}55, transparent)` }} />
        )}
      </div>
      <div style={{ borderRadius: 10, padding: hovered ? '9px 13px' : '0 0 4px',
                    background: hovered ? era.light : 'transparent',
                    marginLeft: hovered ? -2 : 0,
                    transition: 'background 0.2s, padding 0.2s, margin 0.2s' }}>
        <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px', lineHeight: 1.3,
                    color: hovered ? era.color : '#1A1208',
                    transition: 'color 0.18s' }}>
          {ev.title}
        </p>
        <p style={{ fontSize: 11, color: '#8A7A68', margin: 0, lineHeight: 1.75,
                    fontFamily: "'Noto Sans KR', sans-serif" }}>
          {ev.desc}
        </p>
      </div>
    </div>
  )
}

function SummaryCard({ era, index, isActive, onClick }) {
  const [pressed, setPressed] = useState(false)
  const Icon = ERA_ICONS[index]

  return (
    <button onClick={onClick}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            style={{ textAlign: 'left', padding: '14px 15px', borderRadius: 14,
                     background: isActive ? era.color : 'rgba(255,255,255,0.82)',
                     border: `1.5px solid ${isActive ? era.color : 'rgba(160,140,110,0.14)'}`,
                     cursor: 'pointer',
                     transform: pressed ? 'scale(0.95)' : 'scale(1)',
                     transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, background 0.2s',
                     boxShadow: isActive ? `0 6px 20px ${era.color}40` : '0 1px 6px rgba(0,0,0,0.06)',
                     animation: `fadeSlideUp 0.4s ease ${index * 0.06}s both` }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, marginBottom: 9,
                    background: isActive ? 'rgba(255,255,255,0.18)' : era.light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s' }}>
        <Icon color={isActive ? '#fff' : era.color} size={15} />
      </div>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 3px',
                   color: isActive ? 'rgba(255,255,255,0.6)' : '#B0A080',
                   fontFamily: "'Noto Sans KR', sans-serif" }}>
        {era.period.split(' — ')[0]}
      </p>
      <p style={{ fontSize: 12, fontWeight: 800, margin: 0, lineHeight: 1.3,
                   color: isActive ? '#fff' : '#2A1E10' }}>
        {era.label}
      </p>
    </button>
  )
}

function EraHeader({ era, index, isOpen, onClick }) {
  const [hovered, setHovered] = useState(false)
  const Icon = ERA_ICONS[index]

  return (
    <button onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ width: '100%', textAlign: 'left', border: 'none',
                     cursor: 'pointer', padding: '10px 12px', borderRadius: 12,
                     background: hovered ? era.light : 'transparent',
                     transition: 'background 0.18s',
                     display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                      background: isOpen ? era.color : era.light,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: isOpen ? 'scale(1.07)' : 'scale(1)',
                      boxShadow: isOpen ? `0 4px 14px ${era.color}45` : 'none' }}>
          <Icon color={isOpen ? '#fff' : era.color} size={17} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: era.color, fontWeight: 700, margin: '0 0 2px',
                       letterSpacing: '0.15em', fontFamily: "'Noto Sans KR', sans-serif",
                       opacity: isOpen ? 1 : 0.65, transition: 'opacity 0.18s' }}>
            {era.period} · {era.king}
          </p>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1208', margin: 0, letterSpacing: '-0.01em' }}>
            {era.label}
          </p>
        </div>
        <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: isOpen ? era.colorAlpha : 'rgba(160,140,110,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), background 0.18s',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5l3 3 3-3"
                  stroke={isOpen ? era.color : '#9A8A70'}
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </button>
  )
}

export function TimelinePage() {
  const [openEra, setOpenEra] = useState(0)
  const [mounted, setMounted] = useState(false)
  const eraRefs = useRef([])

  useEffect(() => { setMounted(true) }, [])

  const handleToggle = (idx) => {
    const next = openEra === idx ? null : idx
    setOpenEra(next)
    if (next !== null) {
      setTimeout(() => {
        eraRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100vh', background: '#F5EFE6',
                    fontFamily: "'Noto Serif KR', 'Noto Sans KR', serif",
                    opacity: mounted ? 1 : 0,
                    transition: 'opacity 0.35s ease' }}>

        {/* ── 헤더 ── */}
        <div style={{ background: 'linear-gradient(160deg, #1A1208 0%, #2D1F0A 60%, #3A2810 100%)',
                      padding: '56px 24px 36px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                        borderRadius: '50%', background: 'rgba(201,168,76,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 130, height: 130,
                        borderRadius: '50%', background: 'rgba(201,168,76,0.04)' }} />
          <div style={{ position: 'absolute', top: 24, right: 22, opacity: 0.07 }}>
            <IconScroll color="#C9A84C" size={60} />
          </div>
          <div style={{ position: 'relative', zIndex: 1,
                        animation: 'fadeSlideDown 0.5s ease both' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.32em', color: 'rgba(201,168,76,0.55)',
                        margin: '0 0 10px', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
              JOSEON  DYNASTY
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#F5E6C8',
                         margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              역사의 흐름
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(245,230,200,0.4)', margin: 0,
                        fontFamily: "'Noto Sans KR', sans-serif" }}>
              1392 · 건국 — 1897 · 대한제국 · 505년
            </p>
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ height: 1, flex: 1,
                            background: 'linear-gradient(90deg, rgba(201,168,76,0.45), transparent)' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(201,168,76,0.5)' }} />
            </div>
          </div>
        </div>

        {/* ── 요약 카드 그리드 ── */}
        <div style={{ padding: '22px 20px 0',
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ERAS.map((era, i) => (
            <SummaryCard key={era.label} era={era} index={i}
                         isActive={openEra === i}
                         onClick={() => handleToggle(i)} />
          ))}
        </div>

        {/* ── 유튜브 영상 ── */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: '#C9A84C' }} />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
                        color: '#A07840', margin: 0,
                        fontFamily: "'Noto Sans KR', sans-serif" }}>
              조선왕조 역사 영상
            </p>
          </div>

          {/* 영상 */}
          <div style={{
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid rgba(160,120,64,0.15)',
          }}>
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src="https://www.youtube.com/embed/dtjGdGJjzzc"
                title="조선왕조 역사 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  border: 'none',
                }}
              />
            </div>
          </div>

          {/* 영상 설명 - 분리해서 아래에 */}
          <div style={{ marginTop: 10, paddingLeft: 4,
                        display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          background: 'rgba(201,168,76,0.10)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="rgba(201,168,76,0.55)">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600,
                          color: 'rgba(26,18,8,0.45)', margin: 0 }}>
                조선왕조 518년의 역사
              </p>
              <p style={{ fontSize: 10, color: 'rgba(26,18,8,0.28)', margin: '2px 0 0',
                          fontFamily: "'Noto Sans KR', sans-serif" }}>
                역사 영상으로 흐름을 한눈에
              </p>
            </div>
          </div>
        </div>

        {/* ── 타임라인 본문 ── */}
        <div style={{ padding: '26px 20px 100px' }}>
          {ERAS.map((era, eraIdx) => (
            <div key={era.label}
                 ref={el => eraRefs.current[eraIdx] = el}
                 style={{ marginBottom: openEra === eraIdx ? 28 : 14,
                          scrollMarginTop: 16,
                          transition: 'margin 0.25s' }}>
              <EraHeader era={era} index={eraIdx}
                         isOpen={openEra === eraIdx}
                         onClick={() => handleToggle(eraIdx)} />
              {openEra === eraIdx && (
                <div style={{ paddingLeft: 14, paddingTop: 12,
                              animation: 'fadeSlideDown 0.26s ease both' }}>
                  <div style={{ padding: '11px 15px', borderRadius: 10, marginBottom: 20,
                                background: era.light, borderLeft: `3px solid ${era.color}`,
                                animation: 'fadeSlideDown 0.22s ease 0.04s both' }}>
                    <p style={{ fontSize: 12, color: '#6A5A48', margin: 0, lineHeight: 1.75,
                                 fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {era.desc}
                    </p>
                  </div>
                  {era.events.map((ev, i) => (
                    <EventRow key={ev.year} ev={ev} era={era}
                              index={i} total={era.events.length} />
                  ))}
                </div>
              )}
              {eraIdx < ERAS.length - 1 && (
                <div style={{ height: 1, marginTop: 14,
                              background: 'linear-gradient(90deg, rgba(160,140,110,0.18), transparent)' }} />
              )}
            </div>
          ))}

          {/* ── 하단 마무리 ── */}
          <div style={{ textAlign: 'center', paddingTop: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10,
                          padding: '10px 20px', borderRadius: 99,
                          background: 'rgba(160,120,64,0.08)',
                          border: '1px solid rgba(160,120,64,0.15)',
                          transition: 'box-shadow 0.2s, background 0.2s' }}
                 onMouseEnter={e => {
                   e.currentTarget.style.boxShadow = '0 4px 16px rgba(160,120,64,0.15)'
                   e.currentTarget.style.background = 'rgba(160,120,64,0.13)'
                 }}
                 onMouseLeave={e => {
                   e.currentTarget.style.boxShadow = 'none'
                   e.currentTarget.style.background = 'rgba(160,120,64,0.08)'
                 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C' }} />
              <p style={{ fontSize: 11, color: '#9A8060', margin: 0, fontWeight: 600,
                           fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '0.05em' }}>
                1897 · 대한제국으로 이어지다
              </p>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}