# .github/copilot-instructions.md for mymelody/history

## 1) Big picture
- Repo has 2 active modules:
  - `joseon-pwa`: React 18 + Vite PWA UI (route pages in `src/pages`, shared UI in `src/components/common`).
  - `joseon-data`: Python data ingestion under `collectors/`; outputs to `data/`.
- `joseon-back/` is currently empty (no backend code in this repo).
- The app can run either mock mode (`src/data/dummy.js` + `src/api/index.js`) or real mode (FastAPI target through `VITE_API_URL`).

## 2) Must-know flow and entry points
- UI routing: `joseon-pwa/src/main.jsx` -> `App.jsx` -> `src/pages/*`.
- API interfaces in `joseon-pwa/src/api/index.js`:
  - `placesAPI`, `kingsAPI`, `reviewsAPI`, `timelineAPI`, `stampAPI`.
  - Runtime switch uses `import.meta.env.VITE_API_URL`; if missing, returns in-memory dummy data with artificial `delay()`.
- Dummy datasets: `joseon-pwa/src/data/dummy.js`, `src/data/kings.js`.
- Collector script: `joseon-data/collectors/heritage_collector.py` builds `joseon-data/data/palaces_raw.json` and `palaces_clean.csv` from `heritage.go.kr` OpenAPI.

## 3) Developer workflows (commands)
- Frontend dev
  - `cd joseon-pwa && npm install && npm run dev` (localhost:5173)
  - `cd joseon-pwa && npm run build`; verify `npm run preview`.
- Environment switch
  - copy `.env.example` to `.env`, set `VITE_API_URL=http://localhost:8000` to hit real backend.
- Collector run
  - `cd joseon-data/collectors && python heritage_collector.py`.
  - The script uses `requests` and writes to `../data/palaces_raw.json`, `../data/palaces_clean.csv`.

## 4) Project-specific conventions
- Keep data source decisions in `src/api/index.js`; avoid embedding API URLs in components.
- Core state is page-local; no global state manager used.
- UI components are mostly presentational; business logic is in `api/*`.
- Default text is Korean; logs in collector are Korean + emoji status CLI.

## 5) Integration points / extension notes
- FastAPI backend expected route contracts:
  - GET `/places`, `/places/:id`, `/kings`, `/kings/:id`, `/reviews` (by `place_id`), POST `/reviews`.
- PWA uses Kakao Maps SDK (see `src/pages/MapPage.jsx`), so key injection and security must be checked in deployment.
- `joseon-data` collectors are independent from `joseon-pwa` runtime; use them when updating static historical data.

## 6) What to avoid
- Do not assume unit tests exist. There are no `test` scripts in `joseon-pwa/package.json`.
- Do not touch `joseon-back/` unless repository is expanded; currently unused.

## 7) Next iteration
- Confirm if you want explicit API contract examples in `src/data/*` or sample payload shapes from existing `dummy` objects.
