// src/pages/NotFoundPage.jsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF6EF',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 32px',
      fontFamily: "'Noto Serif KR', 'Noto Sans KR', serif",
      position: 'relative', overflow: 'hidden',
    }}>

      {/* 배경 장식 원 */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300,
                    borderRadius: '50%', background: 'rgba(160,120,64,0.07)' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220,
                    borderRadius: '50%', background: 'rgba(160,120,64,0.05)' }} />

      {/* 중앙 콘텐츠 */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        position: 'relative', zIndex: 1,
      }}>

        {/* 로고 */}
        <div style={{
          width: 88, height: 88, borderRadius: 24,
          background: '#F0E8DC',
          border: '1.5px solid rgba(160,120,64,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 32,
          boxShadow: '0 4px 20px rgba(160,120,64,0.12)',
          overflow: 'hidden',
        }}>
          <img src="/icons/한양마중.png" alt="한양마중 로고"
               style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* 404 */}
        <p style={{
          fontSize: 10, letterSpacing: '0.3em', fontWeight: 700,
          color: '#C9A84C', marginBottom: 14,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          404 · PAGE NOT FOUND
        </p>

        {/* 메인 타이틀 */}
        <h1 style={{
          fontSize: 24, fontWeight: 900, color: '#2A1E10',
          margin: '0 0 12px', lineHeight: 1.3, letterSpacing: '-0.02em',
          textAlign: 'center',
        }}>
          이 공간은<br />존재하지 않아요
        </h1>

        {/* 서브 텍스트 */}
        <p style={{
          fontSize: 12, color: '#B0A090', textAlign: 'center',
          lineHeight: 1.8, margin: '0 0 48px',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          찾으시는 페이지가 사라졌거나<br />잘못된 경로로 오셨어요
        </p>

        {/* 구분선 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', marginBottom: 48,
        }}>
          <div style={{ flex: 1, height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(160,120,64,0.2))' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%',
                        background: '#C9A84C' }} />
          <div style={{ flex: 1, height: 1,
                        background: 'linear-gradient(90deg, rgba(160,120,64,0.2), transparent)' }} />
        </div>

        {/* 버튼들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button onClick={() => navigate('/')}
                  style={{
                    width: '100%', padding: '15px 0', borderRadius: 14,
                    background: '#3B2D1A', color: '#F5E6C8',
                    fontSize: 13, fontWeight: 800, border: 'none',
                    cursor: 'pointer', letterSpacing: '0.02em',
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            홈으로 돌아가기
          </button>

          <button onClick={() => navigate(-1)}
                  style={{
                    width: '100%', padding: '15px 0', borderRadius: 14,
                    background: '#F0E8DC',
                    border: '1px solid rgba(160,120,64,0.2)',
                    color: '#8A7A68',
                    fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', letterSpacing: '0.02em',
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EAE0D4'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F0E8DC'}>
            이전 페이지로
          </button>
        </div>

        {/* 하단 브랜드 */}
        <p style={{
          fontSize: 10, color: 'rgba(160,120,64,0.35)',
          marginTop: 48, letterSpacing: '0.2em',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          JOSEON HERITAGE
        </p>
      </div>
    </div>
  )
}