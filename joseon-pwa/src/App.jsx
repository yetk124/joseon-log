import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/common/BottomNav'
import HomePage from './pages/HomePage'
import { MapPage } from './pages/MapPage'
import { KingsPage } from './pages/KingsPage'
import { TimelinePage } from './pages/TimelinePage'
import { RecordPage } from './pages/RecordPage'
import KingDetailPage from './pages/KingDetailPage'
import PlaceDetailPage from './pages/PlacedetailPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NotFoundPage from './pages/NotFoundPage'
import PlacePhotoGalleryPage from './pages/PlacePhotoGalleryPage'
import KakaoCallbackPage from "./pages/KakaoCallbackPage"
import GoogleCallbackPage from "./pages/GoogleCallbackPage"

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.querySelector('.relative')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])
  return null
}

function BottomNavWrapper() {
  const location = useLocation()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const show = () => setHidden(true)
    const hide = () => setHidden(false)
    window.addEventListener('chatbot:open',   show)
    window.addEventListener('chatbot:close',  hide)
    window.addEventListener('bottomsheet:open',  show)
    window.addEventListener('bottomsheet:close', hide)
    return () => {
      window.removeEventListener('chatbot:open',   show)
      window.removeEventListener('chatbot:close',  hide)
      window.removeEventListener('bottomsheet:open',  show)
      window.removeEventListener('bottomsheet:close', hide)
    }
  }, [])

  const KNOWN_PATHS = ['/', '/map', '/kings', '/timeline', '/record']

const routeHide = ['/login', '/signup'].includes(location.pathname)
  || /^\/kings\/\d+$/.test(location.pathname)
  || /^\/places\//.test(location.pathname)
  || (!KNOWN_PATHS.includes(location.pathname))

  if (routeHide || hidden) return null
  return <BottomNav />
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <div className="relative">
      <ScrollToTop /> 
      <Routes>
        <Route path="/"           element={<HomePage />} />
        <Route path="/map"        element={<MapPage />} />
        <Route path="/kings"      element={<KingsPage />} />
        <Route path="/kings/:id"  element={<KingDetailPage />} />
        <Route path="/timeline"   element={<TimelinePage />} />
        {/* ← photos 라우트를 places/:id 보다 위로 */}
        <Route path="/places/:id/photos" element={<PlacePhotoGalleryPage />} />
        <Route path="/places/:id" element={<PlaceDetailPage />} />
        <Route path="/record" element={
          <ProtectedRoute><RecordPage /></ProtectedRoute>
        } />
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
      </Routes>
      <BottomNavWrapper />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}