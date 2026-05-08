# 조선, 그 공간을 걷다 🏯

조선왕조 역사 공간 탐방 가이드 PWA 앱

## 🚀 시작하기

### 1단계 — 설치
```bash
cd joseon-pwa
npm install
```

### 2단계 — 환경변수 설정
```bash
cp .env.example .env
# .env 파일 열어서 API 키 입력
```

### 3단계 — 개발 서버 실행
```bash
npm run dev
# → http://localhost:5173 열기
```

### 4단계 — 빌드 & 배포
```bash
npm run build
# dist/ 폴더를 Vercel에 드래그 드롭!
```

---

## 📁 폴더 구조

```
src/
├── api/          # 백엔드 API 호출 (더미→실제 전환 여기서)
├── data/         # 더미 데이터 (Day1 이후 교체)
├── pages/        # 각 탭 화면
│   ├── HomePage.jsx
│   ├── MapPage.jsx
│   └── OtherPages.jsx  (왕/타임라인/기록)
├── components/
│   └── common/   # 공통 컴포넌트 (BottomNav 등)
└── styles/       # 글로벌 CSS
```

---

## 🔌 백엔드 연결하기

`src/api/index.js` 상단에서 자동 전환됩니다:
- `VITE_API_URL` 없음 → 더미 데이터 사용
- `VITE_API_URL` 있음 → FastAPI 서버 호출

```bash
# .env 파일에서
VITE_API_URL=http://localhost:8000
```

---

## 📱 PWA 설치 방법

**Android (크롬)**
1. 브라우저로 배포 URL 접속
2. 주소창 옆 "설치" 버튼 클릭

**iPhone (사파리)**
1. 사파리로 배포 URL 접속
2. 하단 공유 버튼 → "홈 화면에 추가"

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | React 18 + Vite |
| PWA | vite-plugin-pwa |
| 스타일 | Tailwind CSS |
| 라우팅 | React Router v6 |
| API 통신 | Axios |
| 지도 | 카카오맵 SDK |
| 배포 | Vercel |
