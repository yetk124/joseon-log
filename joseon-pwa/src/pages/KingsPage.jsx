// src/pages/KingsPage.jsx
import { useState, useEffect, useRef } from 'react'
import { kingsAPI } from '../api/api'
import { Crown, ChevronRight, Search, X, Send, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ERA_COLORS = {
  '건국': { bg: '#B45309', light: '#FEF3C7', text: '#92400E' },
  '전기': { bg: '#14532D', light: '#DCFCE7', text: '#166534' },
  '중기': { bg: '#1E3A5F', light: '#DBEAFE', text: '#1E40AF' },
  '후기': { bg: '#4C1D95', light: '#EDE9FE', text: '#5B21B6' },
  '말기': { bg: '#C2410C', light: '#FFEDD5', text: '#9A3412' },
}

const ERA_GRADIENTS = {
  '건국': 'linear-gradient(160deg, #3D2A0A, #C9622A)',
  '전기': 'linear-gradient(160deg, #0A2E1A, #1E6B40)',
  '중기': 'linear-gradient(160deg, #0D1F3C, #2A5080)',
  '후기': 'linear-gradient(160deg, #1A0A2E, #6040A8)',
  '말기': 'linear-gradient(160deg, #2D0A0A, #D45020)',
}

const ERA_ORDER = ['건국', '전기', '중기', '후기', '말기']

const QUICK_QUESTIONS = [
  '세종대왕은 어떤 업적을 남겼나요?',
  '임진왜란은 누구 때 일어났나요?',
  '조선의 첫 번째 왕은 누구인가요?',
  '정조는 왜 수원 화성을 지었나요?',
]

// ── 챗봇 패널 ────────────────────────────────────────────────
function ChatBot({ onClose, kings }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: '안녕하세요! 👋\n조선 역사에 대해 궁금한 것을 물어보세요.' }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)
  const inputRef              = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200) }, [])

  const sendMessage = async (text) => {
    const q = (text || input).trim()
    if (!q) return

    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setLoading(true)

    try {
      const system = `당신은 조선시대 역사 전문 AI 해설사입니다.
조선 왕조(1392~1910)와 관련된 질문에 친절하고 쉽게 답변하세요.
답변은 3~5문장으로 간결하게, 한국어로 작성하세요.
현재 등록된 왕 정보: ${kings.map(k => `${k.name}(${k.reign}, ${k.era})`).join(', ')}`

      const history = messages
        .filter((_, i) => i !== 0)
        .slice(-10)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))

      const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, system, history }),
      })

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let answer    = ''

      setMessages(prev => [...prev, { role: 'bot', text: '' }])
      setLoading(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'bot', text: answer }
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '오류가 발생했어요. 잠시 후 다시 시도해주세요.' }])
      setLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end"
         style={{ background: 'rgba(10,8,5,0.72)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="flex flex-col rounded-t-3xl overflow-hidden w-full"
           style={{ height: '65vh', maxHeight: '560px', background: '#FEFCF9' }}
           onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
             style={{ borderBottom: '1px solid #F0E8DC' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
              <Sparkles size={14} color="#C9A84C" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#1A1208' }}>조선 역사 해설사</p>
              <p className="text-[10px]" style={{ color: '#B0A090' }}>AI가 답변해드려요</p>
            </div>
          </div>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#F0E8DC' }}>
            <X size={14} color="#9A8A70" />
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                     style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <Crown size={10} color="#C9A84C" strokeWidth={1.5} />
                </div>
              )}
              <div className="max-w-[78%] rounded-2xl px-3.5 py-2.5"
                   style={{ background: msg.role === 'user' ? '#C9A84C' : '#F5F0E8',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p className="text-[12px] leading-relaxed whitespace-pre-line"
                   style={{ color: msg.role === 'user' ? 'white' : '#3A2A18' }}>
                  {msg.text}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                   style={{ background: 'rgba(201,168,76,0.12)' }}>
                <Crown size={10} color="#C9A84C" strokeWidth={1.5} />
              </div>
              <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                   style={{ background: '#F5F0E8' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A84C',
                                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 빠른 질문 */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
            {QUICK_QUESTIONS.map(q => (
              <button key={q} onClick={() => sendMessage(q)}
                      className="flex-shrink-0 text-[10px] font-medium px-3 py-1.5 rounded-full"
                      style={{ background: '#FDF6EC', color: '#A07840',
                               border: '1px solid rgba(201,168,76,0.25)', whiteSpace: 'nowrap' }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* 입력창 */}
        <div className="px-4 pb-6 pt-2 flex-shrink-0" style={{ borderTop: '1px solid #F0E8DC' }}>
          <div className="flex items-center gap-2 rounded-2xl px-4"
               style={{ background: '#F5F0E8', border: '1px solid #E8DDD0', height: 46 }}>
            <input ref={inputRef} type="text"
                   placeholder="조선 역사에 대해 물어보세요"
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage() }}
                   className="flex-1 text-sm outline-none bg-transparent"
                   style={{ color: '#2A1E10', caretColor: '#C9A84C' }} />
            <button onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: input.trim() && !loading ? '#C9A84C' : '#E8DDD0',
                             transition: 'background 0.2s' }}>
              <Send size={12} color={input.trim() && !loading ? 'white' : '#B0A090'} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────
export function KingsPage() {
  const [kings, setKings]             = useState([])
  const [search, setSearch]           = useState('')
  const [selectedEra, setSelectedEra] = useState('전체')
  const [searchFocus, setSearchFocus] = useState(false)
  const [hoveredId, setHoveredId]     = useState(null)
  const [chatOpen, setChatOpen]       = useState(false)
  const navigate = useNavigate()

  useEffect(() => { kingsAPI.getAll().then(setKings) }, [])

  useEffect(() => {
    if (chatOpen) {
      document.body.style.overflow = 'hidden'
      window.dispatchEvent(new Event('chatbot:open'))
    } else {
      document.body.style.overflow = ''
      window.dispatchEvent(new Event('chatbot:close'))
    }
    return () => { document.body.style.overflow = '' }
  }, [chatOpen])

  const filtered = kings.filter(k => {
    const matchSearch = k.name.includes(search) || k.achievement?.includes(search)
    const matchEra    = selectedEra === '전체' || k.era === selectedEra
    return matchSearch && matchEra
  })

  const grouped = filtered.reduce((acc, k) => {
    if (!acc[k.era]) acc[k.era] = []
    acc[k.era].push(k)
    return acc
  }, {})

  return (
    <div className="relative flex flex-col min-h-screen pb-24" style={{ background: '#F5F1EB' }}>

      {/* 헤더 */}
      <div className="px-5 pt-14 pb-6"
           style={{ background: 'linear-gradient(160deg,#1A1208,#2D1F0A)' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Crown size={17} color="#C9A84C" strokeWidth={1.5} />
            <h2 className="font-serif text-xl font-bold text-[#F5E6C8]">왕 · 인물</h2>
          </div>
          <button onClick={() => setChatOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
                           transition: 'all 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.15)'}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(201,168,76,0.2)' }}>
              <Sparkles size={11} color="#C9A84C" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: '#C9A84C' }}>AI 해설사</span>
          </button>
        </div>

        <p className="text-[11px] mb-5" style={{ color: 'rgba(245,230,200,0.4)' }}>
          조선왕조 27대 왕 및 주요 인물
        </p>

        {/* 검색창 */}
        <div className="relative">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: searchFocus ? '#C9A84C' : 'rgba(245,230,200,0.35)', transition: 'color 0.22s' }} />
          <input type="text" placeholder="왕 이름 또는 업적 검색"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 onFocus={() => setSearchFocus(true)}
                 onBlur={() => setSearchFocus(false)}
                 className="w-full pl-9 pr-4 rounded-xl text-[12px] outline-none"
                 style={{ height: 42,
                          background: searchFocus ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
                          border: searchFocus ? '1px solid rgba(201,168,76,0.45)' : '1px solid rgba(255,255,255,0.10)',
                          color: '#F5F1EB', caretColor: '#C9A84C', transition: 'all 0.25s ease' }} />
        </div>
      </div>

      {/* 시대 필터 */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto scrollbar-hide" style={{ background: '#F5F1EB' }}>
        {['전체', ...ERA_ORDER].map(era => {
          const isActive = selectedEra === era
          const color    = ERA_COLORS[era]
          return (
            <button key={era} onClick={() => setSelectedEra(era)}
                    className="flex-shrink-0 rounded-full text-[11px] font-semibold"
                    style={{ padding: '6px 16px',
                             background: isActive ? (color?.bg || '#1A1208') : 'white',
                             color:      isActive ? 'white' : '#7A6A50',
                             boxShadow:  isActive ? `0 4px 14px ${color?.bg || '#1A1208'}35` : '0 1px 4px rgba(0,0,0,0.07)',
                             transform:  isActive ? 'translateY(-1px)' : 'none',
                             transition: 'all 0.22s ease' }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.11)' } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)' } }}>
              {era}
            </button>
          )
        })}
      </div>

      {/* 왕 목록 */}
      <div className="flex-1 px-4 pb-6" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {ERA_ORDER.filter(era => grouped[era]?.length > 0).map(era => {
          const color = ERA_COLORS[era]
          return (
            <div key={era}>
              <div className="flex items-center gap-2.5 mb-4">
                <div style={{ width: 4, height: 18, borderRadius: 2, background: color.bg, flexShrink: 0 }} />
                <p className="text-[11px] font-bold tracking-[0.22em]" style={{ color: color.text }}>{era}</p>
                <div className="flex-1 h-px" style={{ background: color.bg + '18' }} />
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: color.light, color: color.text }}>
                  {grouped[era].length}명
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {grouped[era].map(king => {
                  const isHovered = hoveredId === king.id
                  return (
                    <div key={king.id}
                         onClick={() => navigate('/kings/' + king.id)}
                         onMouseEnter={() => setHoveredId(king.id)}
                         onMouseLeave={() => setHoveredId(null)}
                         className="rounded-2xl overflow-hidden cursor-pointer"
                         style={{ background: 'white',
                                  boxShadow: isHovered ? '0 6px 24px rgba(0,0,0,0.10)' : '0 2px 12px rgba(0,0,0,0.05)',
                                  transform: isHovered ? 'translateY(-2px)' : 'none',
                                  transition: 'all 0.24s cubic-bezier(0.4,0,0.2,1)' }}>
                      <div className="flex items-stretch">

                        {/* 이미지 영역 - DB의 image_url 사용 */}
                        <div className="flex-shrink-0 relative overflow-hidden"
                             style={{ width: 84, minHeight: 106, background: ERA_GRADIENTS[era] }}>
                          {king.image_url ? (
                            <img src={king.image_url} alt={king.name}
                                 style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                                          objectFit: 'cover', objectPosition: 'top center',
                                          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                          transition: 'transform 0.4s ease' }}
                                 onError={e => { e.currentTarget.style.display = 'none' }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Crown size={26} color="rgba(255,255,255,0.2)" strokeWidth={1} />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 py-1 text-center"
                               style={{ background: 'rgba(0,0,0,0.42)' }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.65)' }}>
                              {king.king_id}대
                            </span>
                          </div>
                        </div>

                        {/* 텍스트 영역 */}
                        <div className="flex-1 flex flex-col justify-center min-w-0" style={{ padding: '14px 12px' }}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <span className="font-bold text-[#1A1208]" style={{ fontSize: 14 }}>{king.name}</span>
                              {king.full_name && (
                                <span style={{ fontSize: 10, color: '#9A8A70', marginLeft: 6 }}>{king.full_name}</span>
                              )}
                            </div>
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-lg flex-shrink-0"
                                  style={{ background: color.light, color: color.text, marginTop: 1 }}>
                              {era}
                            </span>
                          </div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: color.bg, marginBottom: 6 }}>{king.reign}</p>
                          <p className="line-clamp-2 leading-relaxed" style={{ fontSize: 11, color: '#7A6A50' }}>
                            {king.achievement}
                          </p>
                          {king.tags?.length > 0 && (
                            <div className="flex gap-1 mt-2.5 flex-wrap">
                              {king.tags.slice(0, 2).map(tag => (
                                <span key={tag} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6,
                                                          background: color.bg + '10', color: color.text }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center pr-4 flex-shrink-0"
                             style={{ opacity: isHovered ? 1 : 0.4,
                                      transform: isHovered ? 'translateX(2px)' : 'none',
                                      transition: 'all 0.22s ease' }}>
                          <ChevronRight size={14} color="#C9A84C" strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Crown size={36} color="rgba(201,168,76,0.25)" strokeWidth={1} />
            <p className="text-sm font-semibold mt-4" style={{ color: '#9A8A70' }}>검색 결과가 없습니다</p>
            {search && <p style={{ fontSize: 11, color: '#C9A84C', marginTop: 6 }}>"{search}" 를 다시 확인해보세요</p>}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Crown size={36} color="rgba(201,168,76,0.25)" strokeWidth={1} className="mb-3" />
            <p className="text-[11px] leading-relaxed" style={{ color: '#B0A090' }}>
              조선 왕의 초상화(어진)는 대부분 한국전쟁 당시 소실되었습니다.
            </p>
            <p className="text-[10px] mt-1 leading-relaxed" style={{ color: '#C9A090' }}>
              현재 전하는 어진은 태조·영조·철종·고종 등 극소수만 남아있으며,<br />
              일부는 후대에 복원된 것입니다.
            </p>
            <p className="text-[10px] mt-3" style={{ color: '#C9A84C' }}>
              사진은 사라졌지만, 그들의 기록은 남아있습니다
            </p>
          </div>
        )}
      </div>

      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} kings={kings} />}
    </div>
  )
}