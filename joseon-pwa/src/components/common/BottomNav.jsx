import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Map, Crown, ScrollText, Bookmark } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/',         icon: Home,       label: '홈'      },
  { path: '/map',      icon: Map,        label: '지도'    },
  { path: '/kings',    icon: Crown,      label: '왕·인물' },
  { path: '/timeline', icon: ScrollText, label: '역사흐름' },
  { path: '/record',   icon: Bookmark,   label: '내 기록' },
]

export default function BottomNav() {
  const location         = useLocation()
  const navigate         = useNavigate()
  const [hidden, setHidden] = useState(false)

  // KingsPage 챗봇 + PlaceDetail 리뷰 바텀시트 이벤트 수신
useEffect(() => {
  const hide = () => setHidden(true)
  const show = () => setHidden(false)
  window.addEventListener('chatbot:open',      hide)
  window.addEventListener('chatbot:close',     show)
  window.addEventListener('bottomsheet:open',  hide)   // ← 추가
  window.addEventListener('bottomsheet:close', show)   // ← 추가
  return () => {
    window.removeEventListener('chatbot:open',      hide)
    window.removeEventListener('chatbot:close',     show)
    window.removeEventListener('bottomsheet:open',  hide)   // ← 추가
    window.removeEventListener('bottomsheet:close', show)   // ← 추가
  }
}, [])

  if (hidden) return null

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-joseon-border z-50"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center h-16 px-2">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all active:scale-95
                ${isActive ? 'text-joseon-amber' : 'text-joseon-muted'}`}
            >
              <item.icon
                size={22}
                strokeWidth={1.8}
                className={`transition-transform ${isActive ? 'scale-110' : ''}`}
                color={isActive ? '#C49A6C' : '#A89080'}
              />
              <span className={`text-[10px] font-semibold ${isActive ? 'text-joseon-amber' : 'text-joseon-muted'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-2 w-1 h-1 rounded-full bg-joseon-amber" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}