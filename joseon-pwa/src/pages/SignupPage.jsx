import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

export default function SignupPage() {
  const [email,     setEmail]     = useState("")
  const [nickname,  setNickname]  = useState("")
  const [password,  setPassword]  = useState("")
  const [password2, setPassword2] = useState("")
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState("")
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== password2) {
      setError("비밀번호가 일치하지 않아요")
      return
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 해요")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname })
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail)
        return
      }
      setDone(true)
      setTimeout(() => navigate("/login"), 1200)
    } catch {
      setError("서버 연결에 실패했어요")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    display: "flex", alignItems: "center", gap: 10,
    background: "#EDE5D8", borderRadius: 12, padding: "13px 16px"
  }
  const fieldStyle = {
    background: "none", border: "none", outline: "none",
    fontSize: 11, color: "#2C1F0E", width: "100%"
  }
  const labelStyle = {
    fontSize: 8, color: "#C4A882", fontWeight: 700,
    letterSpacing: "1.4px", display: "block", marginBottom: 8
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6EF", display: "flex", flexDirection: "column" }}>

      {/* 상단 다크 영역 */}
      <div style={{
        background: "#3B2D1A",
        height: 320,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 36px 52px",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.025)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.02)" }} />

        <p style={{ fontSize: 9, color: "rgba(245,230,200,0.4)", letterSpacing: "2.5px", marginBottom: 14, position: "relative", zIndex: 2 }}>
          JOSEON HERITAGE
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F5E6C8", lineHeight: 1.3, letterSpacing: "-0.3px", position: "relative", zIndex: 2, margin: 0 }}>
          함께 시작해요
        </h1>
      </div>

      {/* 하단 폼 카드 */}
      <div style={{
        background: "#FAF6EF",
        borderRadius: "28px 28px 0 0",
        marginTop: -24,
        position: "relative",
        zIndex: 3,
        padding: "32px 32px 32px",
        flex: 1,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#2C1F0E", marginBottom: 28, letterSpacing: "-0.2px" }}>
          회원가입
        </h2>

        <form onSubmit={handleSignup}>

          {/* 이메일 */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>EMAIL</label>
            <div style={inputStyle}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="#3B2D1A" strokeWidth="1.5"/>
                <path d="M1 6l7 4 7-4" stroke="#3B2D1A" strokeWidth="1.5"/>
              </svg>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com" required style={fieldStyle}/>
            </div>
          </div>

          {/* 닉네임 */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>NICKNAME</label>
            <div style={inputStyle}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                <circle cx="8" cy="5" r="3" stroke="#3B2D1A" strokeWidth="1.5"/>
                <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#3B2D1A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                placeholder="닉네임 입력" required style={fieldStyle}/>
            </div>
          </div>

          {/* 비밀번호 */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>PASSWORD</label>
            <div style={inputStyle}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                <rect x="3" y="7" width="10" height="8" rx="2" stroke="#3B2D1A" strokeWidth="1.5"/>
                <path d="M5 7V5a3 3 0 016 0v2" stroke="#3B2D1A" strokeWidth="1.5"/>
                <circle cx="8" cy="11" r="1.5" fill="#3B2D1A"/>
              </svg>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="8자 이상" required style={fieldStyle}/>
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div style={{ marginBottom: 26 }}>
            <label style={labelStyle}>CONFIRM</label>
            <div style={inputStyle}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                <rect x="3" y="7" width="10" height="8" rx="2" stroke="#3B2D1A" strokeWidth="1.5"/>
                <path d="M5 7V5a3 3 0 016 0v2" stroke="#3B2D1A" strokeWidth="1.5"/>
                <circle cx="8" cy="11" r="1.5" fill="#3B2D1A"/>
              </svg>
              <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
                placeholder="비밀번호 재입력" required style={fieldStyle}/>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 11, color: "#C0392B", marginBottom: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || done}
            style={{
              width: "100%", padding: 15, borderRadius: 14,
              background: done ? "#2D5227" : loading ? "#4A3828" : "#3B2D1A",
              color: "#F5E6C8", fontSize: 12, fontWeight: 600,
              border: "none", cursor: (loading || done) ? "default" : "pointer",
              letterSpacing: "0.3px", transition: "background 0.2s, transform 0.1s"
            }}
          >
            {done ? "완료!" : loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 10, color: "#C4A882", marginTop: 16 }}>
          이미 계정이 있으신가요?{" "}
          <Link to="/login" style={{ color: "#5C3D1E", fontWeight: 700, textDecoration: "none" }}>
            로그인 →
          </Link>
        </p>
      </div>
    </div>
  )
}