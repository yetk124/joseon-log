// src/api/api.js
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── 공통 fetch 헬퍼 ──────────────────────────────────────────
const get  = (url) => fetch(`${BASE}${url}`).then(res => res.json())
const post = (url, body) => fetch(`${BASE}${url}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}).then(res => res.json())

const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  // 토큰 만료 → 자동 로그아웃
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('nickname')
    localStorage.removeItem('user_id')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('nickname')
    sessionStorage.removeItem('user_id')
    window.location.href = '/login'
    return null
  }

  return res.json()
}

const authGet  = (url)       => authFetch(url)
const authPost = (url, body) => authFetch(url, {
  method: 'POST',
  body: JSON.stringify(body),
})
const authDelete = (url)     => authFetch(url, { method: 'DELETE' })

// ── Kings API ────────────────────────────────────────────────
export const kingsAPI = {
  getAll:  ()   => get('/kings'),
  getById: (id) => get(`/kings/${id}`),
}

// ── Places API ───────────────────────────────────────────────
export const placesAPI = {
  getAll:        ()    => get('/places'),
  getById:       (id)  => get(`/places/${id}`),
  getByCategory: (cat) => get(`/places?category=${cat}`),
}

// ── Reviews API ──────────────────────────────────────────────
export const reviewsAPI = {
  getByPlace:   (place_id) => get(`/reviews/${place_id}`),
  getMyReviews: ()         => authGet('/reviews/my/reviews'),
  create:       (data)     => authPost('/reviews', data),
  delete:       (id)       => authDelete(`/reviews/${id}`),
}

// ── Auth API ─────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => post('/auth/signup', data),
  login:  (data) => post('/auth/login',  data),
}

// ── Stamp API ────────────────────────────────────────────────
export const stampAPI = {
  getAll:  ()          => authGet('/stamps/my'),   // ✅ /stamps/my 로 수정
  create:  (place_id)  => authPost('/stamps', { place_id }),
  delete:  (id)        => authDelete(`/stamps/${id}`),
}

// ── Timeline API ─────────────────────────────────────────────
export const timelineAPI = {
  getAll: () => Promise.resolve([]),
}

// ── Photos API ───────────────────────────────────────────────
export const photosAPI = {
  // 장소별 사진 목록
  getByPlace: (placeId, sort = 'latest') => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
    return fetch(`${BASE}/photos/${placeId}?sort=${sort}`, { headers }).then(r => r.json())
  },
  // 내 사진 목록
  getMy: () => authGet('/photos/my/list'),

  // 사진 업로드 (multipart/form-data라서 authFetch 직접 사용)
  upload: (placeId, file, caption = '') => {
    const formData = new FormData()
    formData.append('place_id', placeId)
    formData.append('file', file)
    if (caption) formData.append('caption', caption)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    return fetch(`${BASE}/photos`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    }).then(r => r.json())
  },

  // 좋아요 토글
  toggleLike: (photoId) => authPost(`/photos/${photoId}/like`, {}),

  // 댓글 작성
  addComment: (photoId, content) =>
    authPost(`/photos/${photoId}/comments`, { content }),

  // 댓글 삭제
  deleteComment: (photoId, commentId) =>
    authDelete(`/photos/${photoId}/comments/${commentId}`),

  // 사진 삭제
  deletePhoto: (photoId) => authDelete(`/photos/${photoId}`),
}