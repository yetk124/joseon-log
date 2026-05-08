import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${import.meta.env.VITE_KAKAO_REST_KEY}` +
  `&redirect_uri=${import.meta.env.VITE_KAKAO_REDIRECT_URI}` +
  `&response_type=code`

const GOOGLE_AUTH_URL =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}` +
  `&redirect_uri=${import.meta.env.VITE_GOOGLE_REDIRECT_URI}` +
  `&response_type=code` +
  `&scope=email profile`

export default function LoginPage() {
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail)
        return
      }
      const data = await res.json()
      login(data, remember)
      navigate("/")
    } catch {
      setError("서버 연결에 실패했어요")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: "100vh",
      background: "#FAF6EF",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",  // ← 스크롤 완전 차단
    }}>

      {/* 상단 다크 영역 — 높이 고정 줄임 */}
      <div style={{
        background: "#3B2D1A",
        height: 400,          // ← 450 → 180
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 36px 36px",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.025)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.02)" }} />
        <p style={{ fontSize: 9, color: "rgba(245,230,200,0.4)", letterSpacing: "2.5px", marginBottom: 10, position: "relative", zIndex: 2 }}>
          JOSEON HERITAGE
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F5E6C8", lineHeight: 1.3, letterSpacing: "-0.3px", position: "relative", zIndex: 2, margin: 0 }}>
          다시 만나서<br />반가워요
        </h1>
      </div>

      {/* 하단 폼 카드 — flex: 1로 남은 공간 꽉 채움 */}
      <div style={{
        background: "#FAF6EF",
        borderRadius: "24px 24px 0 0",
        marginTop: -24,
        position: "relative",
        zIndex: 3,
        padding: "24px 32px 20px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#2C1F0E", marginBottom: 20, letterSpacing: "-0.2px", flexShrink: 0 }}>
          로그인
        </h2>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* 이메일 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 8, color: "#C4A882", fontWeight: 700, letterSpacing: "1.4px", display: "block", marginBottom: 7 }}>EMAIL</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#EDE5D8", borderRadius: 12, padding: "12px 16px" }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="#3B2D1A" strokeWidth="1.5"/>
                <path d="M1 6l7 4 7-4" stroke="#3B2D1A" strokeWidth="1.5"/>
              </svg>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com" required
                style={{ background: "none", border: "none", outline: "none", fontSize: 11, color: "#2C1F0E", width: "100%" }}
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 8, color: "#C4A882", fontWeight: 700, letterSpacing: "1.4px", display: "block", marginBottom: 7 }}>PASSWORD</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#EDE5D8", borderRadius: 12, padding: "12px 16px" }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                <rect x="3" y="7" width="10" height="8" rx="2" stroke="#3B2D1A" strokeWidth="1.5"/>
                <path d="M5 7V5a3 3 0 016 0v2" stroke="#3B2D1A" strokeWidth="1.5"/>
                <circle cx="8" cy="11" r="1.5" fill="#3B2D1A"/>
              </svg>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호 입력" required
                style={{ background: "none", border: "none", outline: "none", fontSize: 11, color: "#2C1F0E", width: "100%" }}
              />
            </div>
          </div>

          {/* 로그인 상태 유지 */}
          <div style={{ display: "flex", alignItems: "center", margin: "12px 0 16px", cursor: "pointer" }}
            onClick={() => setRemember(!remember)}>
            <div style={{
              width: 14, height: 14, borderRadius: 4,
              background: remember ? "#3B2D1A" : "#E5DBD0",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s", marginRight: 7
            }}>
              {remember && (
                <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                  <polyline points="1,3.5 2.8,5.5 6,1.5" stroke="#F5E6C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 10, color: "#B09070" }}>로그인 상태 유지</span>
          </div>

          {error && <p style={{ fontSize: 11, color: "#C0392B", marginBottom: 10 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: 13, borderRadius: 14,
            background: loading ? "#4A3828" : "#3B2D1A",
            color: "#F5E6C8", fontSize: 12, fontWeight: 600,
            border: "none", cursor: loading ? "default" : "pointer",
            letterSpacing: "0.3px",
          }}>
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>

        {/* 구분선 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#E5DBD0" }} />
          <span style={{ fontSize: 9, color: "#C4A882", letterSpacing: "1px" }}>또는</span>
          <div style={{ flex: 1, height: 1, background: "#E5DBD0" }} />
        </div>

        {/* 카카오 */}
        <a href={KAKAO_AUTH_URL} style={{ textDecoration: "none" }}>
          <button style={{
            width: "100%", padding: 12, borderRadius: 14,
            background: "#FEE500", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 12, fontWeight: 700, color: "#3C1E1E", marginBottom: 8,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "#3C1E1E",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
                <path d="M6 0.5C2.96 0.5 0.5 2.46 0.5 4.88c0 1.56.95 2.93 2.38 3.74L2.2 10.5l2.7-1.69c.36.06.73.1 1.1.1 3.04 0 5.5-1.96 5.5-4.38S9.04 0.5 6 0.5z" fill="#FEE500"/>
              </svg>
            </div>
            카카오로 로그인
          </button>
        </a>

        {/* 구글 */}
        <a href={GOOGLE_AUTH_URL} style={{ textDecoration: "none" }}>
          <button style={{
            width: "100%", padding: 12, borderRadius: 14,
            background: "#fff", border: "1.5px solid #E5DBD0", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 12, fontWeight: 700, color: "#3C1E1E", marginBottom: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.31a3.68 3.68 0 01-1.6 2.42v2h2.58c1.51-1.39 2.39-3.44 2.39-5.88z" fill="#4285F4"/>
              <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.58-2a4.8 4.8 0 01-2.72.76 4.79 4.79 0 01-4.5-3.32H.84v2.07A8 8 0 008 16z" fill="#34A853"/>
              <path d="M3.5 9.5A4.8 4.8 0 013.25 8c0-.52.09-1.02.25-1.5V4.43H.84A8 8 0 000 8c0 1.29.31 2.51.84 3.57L3.5 9.5z" fill="#FBBC05"/>
              <path d="M8 3.18a4.33 4.33 0 013.07 1.2l2.3-2.3A7.7 7.7 0 008 0 8 8 0 00.84 4.43L3.5 6.5A4.79 4.79 0 018 3.18z" fill="#EA4335"/>
            </svg>
            Google로 로그인
          </button>
        </a>

        {/* 비로그인 */}
        <button onClick={() => navigate("/")} style={{
          width: "100%", padding: 12, borderRadius: 14,
          background: "#EDE5D8", color: "#8A7060", fontSize: 12, fontWeight: 600,
          border: "none", cursor: "pointer", marginBottom: 14,
        }}>
          비로그인으로 이용하기
        </button>

        <p style={{ textAlign: "center", fontSize: 10, color: "#C4A882" }}>
          계정이 없으신가요?{" "}
          <Link to="/signup" style={{ color: "#5C3D1E", fontWeight: 700, textDecoration: "none" }}>
            회원가입 →
          </Link>
        </p>
      </div>
    </div>
  )
}