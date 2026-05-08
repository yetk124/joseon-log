import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const hasCalled = useRef(false)

  useEffect(() => {
    if (hasCalled.current) return
    hasCalled.current = true

    const code = new URLSearchParams(window.location.search).get("code")
    if (!code) {
      navigate("/login")
      return
    }

    fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          login(data, false)
          navigate("/")
        } else {
          navigate("/login")
        }
      })
      .catch(() => navigate("/login"))
  }, [])

  return (
    <div style={{
      minHeight: "100vh", background: "#FAF6EF",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid #EDE5D8",
        borderTop: "3px solid #3B2D1A",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{ fontSize: 13, color: "#8A7060" }}>Google 로그인 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}