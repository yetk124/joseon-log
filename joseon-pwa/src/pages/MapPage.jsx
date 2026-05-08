// src/pages/MapPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { placesAPI } from '../api/api'
import {
  Search, Landmark, Navigation, X, MapPin, Layers,
  ChevronRight, ArrowUpDown, LocateFixed,
  ArrowLeft, ArrowRight, ArrowUp, CornerUpLeft, CornerUpRight,
  Flag, CircleDot, Volume2, VolumeX
} from 'lucide-react'

const CATEGORIES = ['전체', '궁궐', '왕릉', '사적', '박물관']
const CATEGORY_STYLES = {
  '궁궐':   { color: '#A07840', light: '#FDF6EC', dot: '#D4A855' },
  '왕릉':   { color: '#5A8A5A', light: '#EFF7EF', dot: '#72B072' },
  '사적':   { color: '#4A78A0', light: '#EEF4FA', dot: '#6898C0' },
  '박물관': { color: '#7A5A9A', light: '#F3EEF8', dot: '#9A7ABB' },
}
const SHEET_HEIGHTS = { collapsed: 68, half: 300, full: 540 }

// 브랜드 컬러
const BRAND = {
  main:        '#8C6E4B',   // 메인 브라운
  mainLight:   '#8C6E4B1A', // 연한 배경
  mainBg:      '#F0EAE0',   // 카드 배경
  sectionBg:   '#FAF7F4',   // 섹션 배경
  iconBg:      '#EDE4D8',   // 아이콘 배경
  naviBanner:  '#5C4A32',   // 내비 배너 (짙은 다크 브라운)
  origin:      '#6B8FA8',   // 출발지 블루그레이
  originLight: '#EEF2F5',
  originBg:    '#E8EEF3',
  dest:        '#A05050',   // 도착지 레드브라운
  destLight:   '#F5EFEF',
  destBg:      '#F3EDED',
}

// ── OSRM maneuver → 한국어 + 아이콘 ────────────────────────
function parseManeuver(step) {
  const type     = step.maneuver?.type     || ''
  const modifier = step.maneuver?.modifier || ''
  const name     = step.name ? `${step.name}` : ''
  const dist     = step.distance < 1000
    ? `${Math.round(step.distance)}m`
    : `${(step.distance / 1000).toFixed(1)}km`

  let icon = ArrowUp
  if (type === 'turn' || type === 'new name' || type === 'end of road') {
    if (modifier === 'left' || modifier === 'sharp left')        icon = CornerUpLeft
    else if (modifier === 'right' || modifier === 'sharp right') icon = CornerUpRight
    else if (modifier === 'slight left')                          icon = ArrowLeft
    else if (modifier === 'slight right')                         icon = ArrowRight
    else                                                           icon = ArrowUp
  } else if (type === 'roundabout' || type === 'rotary') {
    icon = CircleDot
  } else if (type === 'arrive') {
    icon = Flag
  }

  let text = ''
  if (type === 'depart')   text = `출발${name ? ' · ' + name : ''}`
  else if (type === 'arrive') text = '목적지 도착'
  else if (type === 'roundabout' || type === 'rotary') text = `로터리 진입${name ? ' · ' + name : ''}`
  else {
    const dirMap = {
      'left': '좌회전', 'right': '우회전',
      'sharp left': '급좌회전', 'sharp right': '급우회전',
      'slight left': '좌측 방향', 'slight right': '우측 방향',
      'straight': '직진', 'uturn': 'U턴',
    }
    const dir = dirMap[modifier] || '직진'
    text = name ? `${dir} · ${name}` : dir
  }

  return { icon, text, dist, isArrive: type === 'arrive' }
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function makePinHTML(place, isSelected) {
  const cs = CATEGORY_STYLES[place.category] || CATEGORY_STYLES['궁궐']
  const bg = isSelected ? cs.color : 'white'
  const iconColor = isSelected ? 'white' : cs.color
  return `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transform:translate(-50%,-100%);filter:drop-shadow(0 2px 5px rgba(0,0,0,0.18));">
      <div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};border:2.5px solid ${cs.color};display:flex;align-items:center;justify-content:center;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.2" style="transform:rotate(45deg)">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="margin-top:3px;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;white-space:nowrap;background:${isSelected ? cs.color : 'white'};color:${isSelected ? 'white' : '#1A1208'};box-shadow:0 1px 6px rgba(0,0,0,0.13);">
        ${place.name}
      </div>
    </div>`
}

function useKakaoMap(containerRef, places, selected, onSelect) {
  const mapRef      = useRef(null)
  const overlaysRef = useRef([])
  useEffect(() => {
    if (!window.kakao || !containerRef.current) return
    window.kakao.maps.load(() => {
      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(36.5, 127.8),
        level: 8,
      })
      mapRef.current = map
    })
  }, [])
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return
    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []
    places.forEach(place => {
      if (!place.lat || !place.lng) return
      const isSelected = selected?.id === place.id
      const pos = new window.kakao.maps.LatLng(parseFloat(place.lat), parseFloat(place.lng))
      const overlay = new window.kakao.maps.CustomOverlay({ position: pos, content: makePinHTML(place, isSelected), yAnchor: 1 })
      overlay.setMap(mapRef.current)
      window.kakao.maps.event.addListener(overlay, 'click', () => onSelect(isSelected ? null : place))
      overlaysRef.current.push(overlay)
    })
  }, [places, selected])
  useEffect(() => {
    if (!mapRef.current || !selected?.lat || !selected?.lng) return
    mapRef.current.panTo(new window.kakao.maps.LatLng(parseFloat(selected.lat), parseFloat(selected.lng)))
  }, [selected])
  return mapRef
}

async function fetchOSRMRoute(oLat, oLng, dLat, dLng, mode) {
  const profile = mode === 'foot' ? 'foot' : 'driving'
  const url = `https://router.project-osrm.org/route/v1/${profile}/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`
  try {
    const res  = await fetch(url)
    const data = await res.json()
    if (data.code !== 'Ok') return null
    const route = data.routes[0]
    return {
      coords:   route.geometry.coordinates,
      distance: (route.distance / 1000).toFixed(1),
      duration: Math.round(route.duration / 60),
      steps:    route.legs[0].steps,
    }
  } catch { return null }
}

function kakaoPlaceSearch(keyword) {
  return new Promise(resolve => {
    if (!keyword.trim() || !window.kakao?.maps?.services) return resolve([])
    new window.kakao.maps.services.Places().keywordSearch(keyword, (data, status) =>
      resolve(status === window.kakao.maps.services.Status.OK ? data.slice(0, 6) : [])
    )
  })
}

// ── 턴바이턴 내비게이션 오버레이 ─────────────────────────────
function NaviOverlay({ steps, currentStepIdx, remainDist, remainTime, muted, onMuteToggle, onExit }) {
  if (!steps || steps.length === 0) return null
  const current = steps[currentStepIdx]
  const next    = steps[currentStepIdx + 1]
  if (!current) return null
  const cur  = parseManeuver(current)
  const nxt  = next ? parseManeuver(next) : null
  const CurIcon = cur.icon
  const NxtIcon = nxt?.icon

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
                  fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* 현재 안내 배너 */}
      <div style={{ background: BRAND.naviBanner, padding: '14px 16px 12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14,
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CurIcon size={32} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 3px', fontWeight: 500 }}>
              {cur.dist} 앞
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cur.text}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <button onClick={onMuteToggle}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none',
                             background: 'rgba(255,255,255,0.15)', cursor: 'pointer',
                             display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {muted ? <VolumeX size={14} color="#fff" /> : <Volume2 size={14} color="#fff" />}
            </button>
            <button onClick={onExit}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none',
                             background: 'rgba(255,255,255,0.15)', cursor: 'pointer',
                             display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color="#fff" />
            </button>
          </div>
        </div>
        {nxt && !cur.isArrive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                        padding: '7px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.12)' }}>
            <NxtIcon size={14} color="rgba(255,255,255,0.75)" />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0, fontWeight: 500 }}>
              이후 · {nxt.text}
            </p>
          </div>
        )}
      </div>
      {/* 남은 거리/시간 바 */}
      <div style={{ background: 'rgba(255,255,255,0.96)', display: 'flex',
                    padding: '8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    backdropFilter: 'blur(8px)' }}>
        <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid #EBEBEB' }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: BRAND.main, margin: 0 }}>
            {remainTime}분
          </p>
          <p style={{ fontSize: 10, color: '#AAA', margin: '1px 0 0' }}>남은 시간</p>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
            {remainDist}
          </p>
          <p style={{ fontSize: 10, color: '#AAA', margin: '1px 0 0' }}>남은 거리</p>
        </div>
      </div>
    </div>
  )
}

// ── 일반 검색 드롭다운 ────────────────────────────────────────
function NaverDropdown({ results, onSelectOrigin, onSelectDest }) {
  if (!results.length) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: '100%',
                  background: '#fff', zIndex: 100, borderTop: '1px solid #EBEBEB',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}>
      {results.map((r, i) => (
        <div key={r.id || i}
             style={{ display: 'flex', alignItems: 'center', padding: '11px 16px',
                      borderBottom: '1px solid #F5F5F5', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: BRAND.mainBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={14} color={BRAND.main} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.place_name}
            </p>
            <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>
              {r.category_name &&
                <span style={{ color: BRAND.main, marginRight: 4 }}>
                  {r.category_name.split(' > ').pop()}
                </span>}
              {r.road_address_name || r.address_name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button onMouseDown={() => onSelectOrigin(r)}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 4,
                             background: BRAND.originBg, color: BRAND.origin, border: 'none', cursor: 'pointer' }}>
              출발
            </button>
            <button onMouseDown={() => onSelectDest(r)}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 4,
                             background: BRAND.destBg, color: BRAND.dest, border: 'none', cursor: 'pointer' }}>
              도착
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 길찾기 패널 ───────────────────────────────────────────────
function NaverRoutePanel({ origin, dest, onSwap, onClearOrigin, onClearDest,
                           routeInfo, loading, onRoute, onClearRoute, onClose,
                           onStartNavi, search, onSearchChange, searchResults,
                           onSelectOrigin, onSelectDest }) {
  const [activeInput, setActiveInput] = useState(null)

  const MODES = [
    { key: 'car',  label: '자동차',   emoji: '🚗' },
    { key: 'bus',  label: '대중교통', emoji: '🚌' },
    { key: 'foot', label: '도보',     emoji: '🚶' },
  ]

  const openKakaoTransit = () => {
    if (!dest) return
    window.open(
      `https://map.kakao.com/link/to/${encodeURIComponent(dest.name || dest.place_name)},${dest.lat || dest.y},${dest.lng || dest.x}`,
      '_blank'
    )
  }

  const handleMode = (key) => {
    if (key === 'bus') { openKakaoTransit(); return }
    if (!origin || !dest) { alert('출발지와 도착지를 모두 설정해주세요'); return }
    onRoute(key)
  }

  return (
    <div style={{ position: 'absolute', top: 10, left: 14, right: 14, zIndex: 40,
                  background: 'rgba(255,255,255,0.98)', borderRadius: 16,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.13)', overflow: 'hidden' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 10px',
                    borderBottom: '1px solid #EBEBEB' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', flex: 1, margin: 0 }}>길찾기</p>
        <button onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none',
                         background: '#F5F5F5', cursor: 'pointer', display: 'flex',
                         alignItems: 'center', justifyContent: 'center' }}>
          <X size={14} color="#555" />
        </button>
      </div>

      {/* 출발 / 도착 입력 */}
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* 출발-도착 연결 아이콘 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                      paddingTop: 2, paddingBottom: 2, flexShrink: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND.origin,
                        boxShadow: `0 0 0 2.5px ${BRAND.origin}30` }} />
          <div style={{ width: 1.5, height: 24, background: '#CDCDCD', margin: '3px 0' }} />
          <div style={{ width: 10, height: 10, borderRadius: 2, background: BRAND.dest,
                        boxShadow: `0 0 0 2.5px ${BRAND.dest}30` }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* 출발지 */}
          <div style={{ display: 'flex', alignItems: 'center', height: 40,
                        background: activeInput === 'origin' ? BRAND.originLight : '#F5F5F5',
                        borderRadius: 6, padding: '0 10px', gap: 8,
                        border: activeInput === 'origin' ? `1.5px solid ${BRAND.origin}` : '1.5px solid transparent',
                        transition: 'all 0.15s' }}>
            <input type="text"
                   placeholder="출발지를 입력하세요"
                   value={activeInput === 'origin' ? search : (origin?.place_name || origin?.name || '')}
                   onChange={onSearchChange}
                   onFocus={() => setActiveInput('origin')}
                   onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                   style={{ flex: 1, fontSize: 13, border: 'none', background: 'transparent',
                            outline: 'none', color: '#1A1A1A', fontFamily: 'inherit' }} />
            {origin && (
              <button onMouseDown={onClearOrigin}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={13} color="#AAA" />
              </button>
            )}
          </div>
          {/* 도착지 */}
          <div style={{ display: 'flex', alignItems: 'center', height: 40,
                        background: activeInput === 'dest' ? BRAND.destLight : '#F5F5F5',
                        borderRadius: 6, padding: '0 10px', gap: 8,
                        border: activeInput === 'dest' ? `1.5px solid ${BRAND.dest}` : '1.5px solid transparent',
                        transition: 'all 0.15s' }}>
            <input type="text"
                   placeholder="도착지를 입력하세요"
                   value={activeInput === 'dest' ? search : (dest?.place_name || dest?.name || '')}
                   onChange={onSearchChange}
                   onFocus={() => setActiveInput('dest')}
                   onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                   style={{ flex: 1, fontSize: 13, border: 'none', background: 'transparent',
                            outline: 'none', color: '#1A1A1A', fontFamily: 'inherit' }} />
            {dest && (
              <button onMouseDown={onClearDest}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={13} color="#AAA" />
              </button>
            )}
          </div>
        </div>

        {/* 스왑 버튼 */}
        <button onClick={onSwap}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #EBEBEB',
                         background: '#fff', cursor: 'pointer', display: 'flex',
                         alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowUpDown size={15} color="#555" />
        </button>
      </div>

      {/* 검색 드롭다운 */}
      {(activeInput === 'origin' || activeInput === 'dest') && searchResults.length > 0 && (
        <div style={{ borderTop: '1px solid #EBEBEB', maxHeight: 220, overflowY: 'auto' }}>
          {searchResults.map((r, i) => (
            <div key={r.id || i}
                 style={{ display: 'flex', alignItems: 'center', padding: '10px 16px',
                          borderBottom: '1px solid #F5F5F5', gap: 10, cursor: 'pointer' }}
                 onMouseDown={() => activeInput === 'origin' ? onSelectOrigin(r) : onSelectDest(r)}>
              <MapPin size={14} color={BRAND.main} strokeWidth={2} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.place_name}
                </p>
                <p style={{ fontSize: 11, color: '#888', margin: '1px 0 0' }}>
                  {r.road_address_name || r.address_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 이동 수단 탭 */}
      <div style={{ display: 'flex', borderTop: '1px solid #EBEBEB' }}>
        {MODES.map(m => (
          <button key={m.key} onClick={() => handleMode(m.key)} disabled={loading}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                           padding: '10px 0', border: 'none', background: 'transparent',
                           cursor: loading ? 'not-allowed' : 'pointer', gap: 2,
                           borderBottom: routeInfo?.mode === m.key
                             ? `2.5px solid ${BRAND.main}`
                             : '2.5px solid transparent',
                           transition: 'all 0.15s', opacity: loading ? 0.5 : 1 }}>
            <span style={{ fontSize: 18 }}>{loading && m.key !== 'bus' ? '⏳' : m.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 600,
                           color: routeInfo?.mode === m.key ? BRAND.main : '#555' }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* 경로 결과 + 길 안내 시작 버튼 */}
      {routeInfo && (
        <div style={{ padding: '10px 12px 14px', background: BRAND.sectionBg,
                      borderTop: `1px solid ${BRAND.mainBg}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: BRAND.iconBg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}>{routeInfo.mode === 'foot' ? '🚶' : '🚗'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: BRAND.main, margin: 0 }}>
                약 {routeInfo.duration}분
              </p>
              <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>
                {routeInfo.distance}km · {routeInfo.mode === 'foot' ? '도보' : '자동차'} 기준
              </p>
            </div>
            <button onClick={onClearRoute}
                    style={{ fontSize: 11, color: '#888', background: '#EBEBEB', border: 'none',
                             borderRadius: 4, padding: '5px 10px', cursor: 'pointer' }}>
              지우기
            </button>
          </div>

          {/* 길 안내 시작 버튼 */}
          <button onClick={onStartNavi}
                  style={{ width: '100%', height: 46, borderRadius: 10, border: 'none',
                           background: `linear-gradient(135deg, ${BRAND.naviBanner}, ${BRAND.main})`,
                           color: '#fff', fontSize: 15, fontWeight: 800,
                           cursor: 'pointer', display: 'flex', alignItems: 'center',
                           justifyContent: 'center', gap: 8,
                           boxShadow: `0 4px 14px ${BRAND.main}55`,
                           fontFamily: 'inherit' }}>
            <Navigation size={18} color="#fff" strokeWidth={2.5} />
            길 안내 시작
          </button>
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────
export function MapPage() {
  const navigate        = useNavigate()
  const mapContainerRef = useRef(null)

  const [places, setPlaces]               = useState([])
  const [category, setCategory]           = useState('전체')
  const [search, setSearch]               = useState('')
  const [searchFocus, setSearchFocus]     = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]         = useState(false)
  const searchTimerRef                    = useRef(null)

  const [selected, setSelected]       = useState(null)
  const [sheetMode, setSheetMode]     = useState('half')
  const [hoveredItem, setHoveredItem] = useState(null)

  const [routeMode, setRouteMode] = useState(false)
  const [origin, setOrigin]       = useState(null)
  const [dest, setDest]           = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [loading, setLoading]     = useState(false)

  // 내비 상태
  const [naviActive, setNaviActive]         = useState(false)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [remainDist, setRemainDist]         = useState('0m')
  const [remainTime, setRemainTime]         = useState(0)
  const [muted, setMuted]                   = useState(false)
  const watchIdRef    = useRef(null)
  const polylineRef   = useRef(null)
  const myMarkerRef   = useRef(null)
  const speechRef     = useRef(null)

  useEffect(() => {
    placesAPI.getAll().then(setPlaces).catch(() => {})
  }, [])

  useEffect(() => {
    clearTimeout(searchTimerRef.current)
    if (!search.trim()) { setSearchResults([]); return }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true)
      const r = await kakaoPlaceSearch(search)
      setSearchResults(r)
      setSearching(false)
    }, 350)
  }, [search])

  useEffect(() => {
    if (!naviActive && watchIdRef.current) {
      navigator.geolocation?.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [naviActive])

  const filtered = places.filter(p => {
    const matchCat    = category === '전체' || p.category === category
    const matchSearch = !search || p.name.includes(search) || p.address?.includes(search)
    return matchCat && matchSearch
  })

  const mapRef = useKakaoMap(mapContainerRef, filtered, selected, (place) => {
    setSelected(place)
    if (place) { setSheetMode('half'); if (routeMode && !dest) setDest(place) }
  })

  const clearRoute = useCallback(() => {
    polylineRef.current?.setMap(null); polylineRef.current = null
    myMarkerRef.current?.setMap(null); myMarkerRef.current = null
    setRouteInfo(null)
  }, [])

  const speak = useCallback((text) => {
    if (muted || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'ko-KR'; utt.rate = 0.95; utt.pitch = 1
    window.speechSynthesis.speak(utt)
    speechRef.current = utt
  }, [muted])

  const handleRoute = async (mode) => {
    if (!origin || !dest || !mapRef.current || !window.kakao) return
    const oLat = parseFloat(origin.lat || origin.y)
    const oLng = parseFloat(origin.lng || origin.x)
    const dLat = parseFloat(dest.lat   || dest.y)
    const dLng = parseFloat(dest.lng   || dest.x)
    setLoading(true); setRouteInfo(null)
    try {
      const result = await fetchOSRMRoute(oLat, oLng, dLat, dLng, mode)
      if (!result) { alert('경로를 찾을 수 없어요'); return }
      clearRoute()
      myMarkerRef.current = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(oLat, oLng),
        content: `<div style="width:14px;height:14px;border-radius:50%;background:${BRAND.origin};border:3px solid white;box-shadow:0 0 0 4px ${BRAND.origin}40;"></div>`,
        yAnchor: 0.5,
      })
      myMarkerRef.current.setMap(mapRef.current)
      const path = result.coords.map(([lng, lat]) => new window.kakao.maps.LatLng(lat, lng))
      polylineRef.current = new window.kakao.maps.Polyline({
        path, strokeWeight: 6,
        strokeColor: mode === 'foot' ? BRAND.main : BRAND.origin,
        strokeOpacity: 0.9,
        strokeStyle: mode === 'foot' ? 'dashed' : 'solid',
      })
      polylineRef.current.setMap(mapRef.current)
      const bounds = new window.kakao.maps.LatLngBounds()
      path.forEach(p => bounds.extend(p))
      mapRef.current.setBounds(bounds)
      setRouteInfo({ distance: result.distance, duration: result.duration, mode, steps: result.steps })
    } catch (e) { alert(e.message) }
    finally { setLoading(false) }
  }

  const handleStartNavi = useCallback(() => {
    if (!routeInfo?.steps) return
    setNaviActive(true)
    setCurrentStepIdx(0)
    setRemainTime(routeInfo.duration)
    setRemainDist(routeInfo.distance + 'km')
    setRouteMode(false)

    const firstStep = parseManeuver(routeInfo.steps[0])
    speak(`길 안내를 시작합니다. ${firstStep.text}`)
    mapRef.current?.setLevel(4)

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const myLat = pos.coords.latitude
          const myLng = pos.coords.longitude
          if (!mapRef.current || !window.kakao) return

          const myLatLng = new window.kakao.maps.LatLng(myLat, myLng)
          myMarkerRef.current?.setMap(null)
          myMarkerRef.current = new window.kakao.maps.CustomOverlay({
            position: myLatLng,
            content: `<div style="width:20px;height:20px;border-radius:50%;background:${BRAND.origin};border:3px solid white;box-shadow:0 0 0 6px ${BRAND.origin}30;"></div>`,
            yAnchor: 0.5,
          })
          myMarkerRef.current.setMap(mapRef.current)
          mapRef.current.panTo(myLatLng)

          setCurrentStepIdx(prev => {
            let idx = prev
            const steps = routeInfo.steps
            while (idx < steps.length - 1) {
              const stepCoords = steps[idx].geometry?.coordinates
              if (!stepCoords?.length) break
              const [endLng, endLat] = stepCoords[stepCoords.length - 1]
              const dist = haversine(myLat, myLng, endLat, endLng)
              if (dist < 25) {
                const nextIdx = idx + 1
                const next = parseManeuver(steps[nextIdx])
                speak(next.isArrive ? '목적지에 도착했습니다.' : `${next.dist} 앞, ${next.text}`)
                if (next.isArrive) setTimeout(() => { setNaviActive(false); clearRoute() }, 3000)
                idx = nextIdx
              } else break
            }
            return idx
          })

          setCurrentStepIdx(idx => {
            const steps = routeInfo.steps
            let remM = 0
            for (let i = idx; i < steps.length; i++) remM += steps[i].distance
            const remKm = remM / 1000
            setRemainDist(remKm < 1 ? `${Math.round(remM)}m` : `${remKm.toFixed(1)}km`)
            setRemainTime(Math.round(remM / (routeInfo.mode === 'foot' ? 80 : 500)))
            return idx
          })
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      )
    }
  }, [routeInfo, speak, clearRoute, mapRef])

  const handleStopNavi = useCallback(() => {
    window.speechSynthesis?.cancel()
    navigator.geolocation?.clearWatch(watchIdRef.current)
    watchIdRef.current = null
    setNaviActive(false)
    clearRoute()
    setRouteMode(false)
    setOrigin(null); setDest(null)
  }, [clearRoute])

  const handleSwap = () => {
    const no = dest   ? { place_name: dest.name   || dest.place_name,   lat: dest.lat   || dest.y,   lng: dest.lng   || dest.x   } : null
    const nd = origin ? { place_name: origin.name || origin.place_name, lat: origin.lat || origin.y, lng: origin.lng || origin.x } : null
    setOrigin(no); setDest(nd); clearRoute()
  }

  const handleSelectOrigin = (r) => { setOrigin(r); setSearch(''); setSearchResults([]) }
  const handleSelectDest   = (r) => { setDest({ ...r, lat: r.y, lng: r.x, name: r.place_name }); setSearch(''); setSearchResults([]) }

  const cycleSheet = () => setSheetMode(p => p === 'collapsed' ? 'half' : p === 'half' ? 'full' : 'collapsed')
  const sheetH = naviActive ? 0 : SHEET_HEIGHTS[sheetMode]

  return (
    <div className="flex flex-col h-screen"
         style={{ background: '#F2EDE6', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="relative overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
        <div ref={mapContainerRef} className="absolute inset-0"
             id="kakao-map-container" style={{ background: '#EDE7DF' }} />

        {/* 내비게이션 오버레이 */}
        {naviActive && routeInfo?.steps && (
          <NaviOverlay
            steps={routeInfo.steps}
            currentStepIdx={currentStepIdx}
            remainDist={remainDist}
            remainTime={remainTime}
            muted={muted}
            onMuteToggle={() => setMuted(m => !m)}
            onExit={handleStopNavi}
          />
        )}

        {/* 일반 검색 모드 - 지도 위 플로팅 */}
        {!routeMode && !naviActive && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
                        pointerEvents: 'none' }}>

            {/* 검색바 + 길찾기 버튼 */}
            <div style={{ display: 'flex', alignItems: 'center',
                          padding: '12px 14px 0', gap: 8, pointerEvents: 'auto' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', height: 46,
                              background: 'rgba(255,255,255,0.97)',
                              borderRadius: 12, padding: '0 14px', gap: 10,
                              boxShadow: searchFocus
                                ? `0 4px 20px rgba(0,0,0,0.14), 0 0 0 2px ${BRAND.main}40`
                                : '0 2px 12px rgba(0,0,0,0.12)',
                              transition: 'box-shadow 0.2s' }}>
                  <Search size={15} color={searchFocus ? BRAND.main : '#B0A898'} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <input type="text"
                         placeholder="장소, 지역 검색"
                         value={search}
                         onChange={e => setSearch(e.target.value)}
                         onFocus={() => setSearchFocus(true)}
                         onBlur={() => setTimeout(() => { setSearchFocus(false); setSearchResults([]) }, 200)}
                         style={{ flex: 1, fontSize: 14, border: 'none', background: 'transparent',
                                  outline: 'none', color: '#1A1A1A', fontFamily: 'inherit' }} />
                  {searching && (
                    <div style={{ width: 14, height: 14, borderRadius: '50%',
                                  border: `2px solid ${BRAND.main}`, borderTopColor: 'transparent',
                                  animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  )}
                  {search && !searching && (
                    <button onClick={() => { setSearch(''); setSearchResults([]) }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <X size={13} color="#B0A898" />
                    </button>
                  )}
                </div>

                {/* 검색 드롭다운 */}
                {searchResults.length > 0 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 50, zIndex: 50,
                                background: 'rgba(255,255,255,0.98)', borderRadius: 12,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
                                overflow: 'hidden' }}>
                    <NaverDropdown
                      results={searchResults}
                      onSelectOrigin={r => { handleSelectOrigin(r); setRouteMode(true) }}
                      onSelectDest={r => { handleSelectDest(r); setRouteMode(true) }}
                    />
                  </div>
                )}
              </div>

              {/* 길찾기 버튼 */}
              <button onClick={() => setRouteMode(true)}
                      style={{ width: 46, height: 46, borderRadius: 12, border: 'none',
                               background: 'rgba(255,255,255,0.97)', cursor: 'pointer',
                               display: 'flex', alignItems: 'center', justifyContent: 'center',
                               flexShrink: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                               transition: 'all 0.15s' }}>
                <Navigation size={18} color={BRAND.main} strokeWidth={2} />
              </button>
            </div>

            {/* 카테고리 필터 - 플로팅 pill */}
            <div style={{ display: 'flex', overflowX: 'auto', padding: '8px 14px 0', gap: 6,
                          pointerEvents: 'auto' }}
                 className="scrollbar-hide">
              {CATEGORIES.map(c => {
                const isActive = category === c
                const cs = CATEGORY_STYLES[c]
                return (
                  <button key={c} onClick={() => setCategory(c)}
                          style={{ flexShrink: 0, fontSize: 12,
                                   fontWeight: isActive ? 700 : 500,
                                   padding: '6px 14px', borderRadius: 20,
                                   border: isActive
                                     ? `1.5px solid ${cs?.color || BRAND.main}88`
                                     : '1.5px solid rgba(255,255,255,0.6)',
                                   cursor: 'pointer',
                                   background: isActive
                                     ? 'rgba(255,255,255,0.97)'
                                     : 'rgba(255,255,255,0.88)',
                                   color: isActive ? (cs?.color || BRAND.main) : '#6A5C50',
                                   boxShadow: isActive
                                     ? `0 2px 10px rgba(0,0,0,0.10), 0 0 0 1px ${cs?.color || BRAND.main}30`
                                     : '0 1px 6px rgba(0,0,0,0.08)',
                                   backdropFilter: 'blur(6px)',
                                   transition: 'all 0.18s', fontFamily: 'inherit' }}>
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 길찾기 패널 */}
        {routeMode && !naviActive && (
          <NaverRoutePanel
            origin={origin} dest={dest}
            onSwap={handleSwap}
            onClearOrigin={() => { setOrigin(null); clearRoute() }}
            onClearDest={() => { setDest(null); clearRoute() }}
            routeInfo={routeInfo} loading={loading}
            onRoute={handleRoute}
            onClearRoute={clearRoute}
            onStartNavi={handleStartNavi}
            onClose={() => { setRouteMode(false); setOrigin(null); setDest(null); clearRoute() }}
            search={search} onSearchChange={e => setSearch(e.target.value)}
            searchResults={searchResults}
            onSelectOrigin={handleSelectOrigin}
            onSelectDest={handleSelectDest}
            mapRef={mapRef}
          />
        )}

        {/* 현재 위치 버튼 */}
        {!naviActive && (
          <button style={{ position: 'absolute', right: 12, bottom: sheetH + 12, zIndex: 20,
                           width: 42, height: 42, borderRadius: 8,
                           border: '1px solid #EBEBEB', background: '#fff',
                           cursor: 'pointer', display: 'flex',
                           alignItems: 'center', justifyContent: 'center',
                           boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                           transition: 'bottom 0.38s cubic-bezier(0.4,0,0.2,1)' }}
                  onClick={() => {
                    if (!window.kakao || !mapRef.current) return
                    navigator.geolocation?.getCurrentPosition(pos => {
                      const ll = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
                      mapRef.current.panTo(ll)
                      if (routeMode && !origin)
                        setOrigin({ place_name: '현재 위치', lat: pos.coords.latitude, lng: pos.coords.longitude })
                    })
                  }}>
            <LocateFixed size={18} color="#555" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* 하단 시트 */}
      {!naviActive && (
        <div className="relative z-30 flex-shrink-0 flex flex-col"
             style={{ height: sheetH, background: 'rgba(255,255,255,0.98)', borderRadius: '20px 20px 0 0',
                      boxShadow: '0 -1px 0 rgba(160,140,110,0.08), 0 -8px 32px rgba(0,0,0,0.08)',
                      transition: 'height 0.38s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}>

          <button className="w-full flex-shrink-0 flex flex-col items-center pt-3 pb-2 px-4"
                  onClick={cycleSheet}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E0E0E0', marginBottom: 10 }} />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>유적지</p>
                <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: 600,
                               background: BRAND.mainLight, color: BRAND.main }}>
                  {filtered.length}
                </span>
              </div>
              <div className="flex gap-1 items-center">
                {['collapsed', 'half', 'full'].map(m => (
                  <div key={m} style={{ width: sheetMode === m ? 16 : 5, height: 5, borderRadius: 3,
                                        background: sheetMode === m ? BRAND.main : '#E0E0E0',
                                        transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>
          </button>

          {/* 선택된 장소 카드 */}
          {selected && sheetMode !== 'collapsed' && (
            <div style={{ margin: '0 12px 8px', borderRadius: 10, overflow: 'hidden',
                          background: CATEGORY_STYLES[selected.category]?.light ?? '#FDF6EC',
                          border: '1px solid ' + (CATEGORY_STYLES[selected.category]?.color ?? '#A07840') + '22' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              background: CATEGORY_STYLES[selected.category]?.dot ?? '#D4A855' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, margin: 0,
                              color: CATEGORY_STYLES[selected.category]?.color ?? '#A07840' }}>
                    {selected.category}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: '1px 0 0', color: '#1A1A1A',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.name}
                  </p>
                  {selected.address && (
                    <p style={{ fontSize: 10, color: '#AAAAAA', margin: '1px 0 0',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selected.address}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => navigate(`/places/${selected.id}`)}
                          style={{ fontSize: 11, fontWeight: 600, padding: '6px 10px', borderRadius: 6,
                                   background: '#fff', color: '#555', border: '1px solid #EBEBEB', cursor: 'pointer' }}>
                    상세
                  </button>
                  <button onClick={() => { setDest(selected); setRouteMode(true) }}
                          style={{ fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 6,
                                   background: BRAND.main, color: '#fff', border: 'none', cursor: 'pointer' }}>
                    길찾기
                  </button>
                  <button onClick={() => setSelected(null)}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none',
                                   background: '#F5F5F5', cursor: 'pointer', display: 'flex',
                                   alignItems: 'center', justifyContent: 'center' }}>
                    <X size={11} color="#888" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 장소 리스트 */}
          {sheetMode !== 'collapsed' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 80px', minHeight: 0 }}
                 className="scrollbar-hide">
              {filtered.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                              justifyContent: 'center', padding: '40px 0', gap: 8 }}>
                  <MapPin size={24} color="#DDDDDD" strokeWidth={1.5} />
                  <p style={{ fontSize: 12, color: '#BBBBBB' }}>검색 결과가 없어요</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filtered.map(p => {
                    const isSelected = selected?.id === p.id
                    const cs = CATEGORY_STYLES[p.category] || CATEGORY_STYLES['궁궐']
                    return (
                      <button key={p.id}
                              onClick={() => { setSelected(isSelected ? null : p); if (!isSelected) setSheetMode('half') }}
                              onDoubleClick={() => navigate(`/places/${p.id}`)}
                              onMouseEnter={() => setHoveredItem(p.id)}
                              onMouseLeave={() => setHoveredItem(null)}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                       textAlign: 'left', padding: '10px 4px', borderRadius: 8,
                                       background: isSelected ? cs.light : 'transparent',
                                       border: 'none', cursor: 'pointer',
                                       borderBottom: '1px solid #F5F5F5',
                                       transition: 'background 0.15s' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                                      background: cs.light, border: '1px solid ' + cs.color + '20',
                                      flexShrink: 0, display: 'flex', alignItems: 'center',
                                      justifyContent: 'center', position: 'relative' }}>
                          {p.image_url
                            ? <img src={p.image_url} alt={p.name}
                                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Landmark size={16} strokeWidth={1.5}
                                        style={{ color: cs.color, opacity: 0.5 }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: cs.color,
                                           background: cs.light, padding: '1px 5px', borderRadius: 3 }}>
                              {p.category}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: 0,
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </p>
                          <p style={{ fontSize: 11, color: '#AAAAAA', margin: '2px 0 0',
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.address || ''}
                          </p>
                        </div>
                        {isSelected && (
                          <ChevronRight size={14} color={cs.color}
                                        onClick={e => { e.stopPropagation(); navigate(`/places/${p.id}`) }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}