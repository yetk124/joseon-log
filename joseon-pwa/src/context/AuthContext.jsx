import { createContext, useContext, useState } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token    = localStorage.getItem("token")
    const nickname = localStorage.getItem("nickname")
    const user_id  = localStorage.getItem("user_id")
    const provider = localStorage.getItem("provider")
    return token ? { token, nickname, user_id, provider } : null
  })

  const login = (data, remember = true) => {
    const token    = data.access_token
    const nickname = data.nickname ?? data.user?.nickname
    const user_id  = data.user_id  ?? data.user?.id
    const provider = data.provider ?? data.user?.provider ?? "local"

    localStorage.setItem("token",    token)
    localStorage.setItem("nickname", nickname)
    localStorage.setItem("user_id",  String(user_id))
    localStorage.setItem("provider", provider)
    setUser({ token, nickname, user_id, provider })
  }

  const logout = async () => {
    const provider = localStorage.getItem("provider")
    const token    = localStorage.getItem("token")

    try {
      // 백엔드에 로그아웃 요청 (카카오/구글 연동 해제)
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ provider })
      })
    } catch {}

    localStorage.removeItem("token")
    localStorage.removeItem("nickname")
    localStorage.removeItem("user_id")
    localStorage.removeItem("provider")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}