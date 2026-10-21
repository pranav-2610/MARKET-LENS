# MarketLens AI

Mobile-first Indian equity research starter using Expo / React Native, FastAPI, Yahoo Finance (`yfinance`), and LangGraph.

> This is a runnable starter, not a finished financial-data product. Yahoo Finance data can be delayed, incomplete, or unavailable. Promoter pledges, regulatory events, news, consensus targets, and 2030 forecasts are deliberately marked unavailable until a verified source adapter is configured. Do not treat outputs as investment advice.

## Architecture
- `mobile/`: Expo app for Android and iOS
- `backend/`: FastAPI API, Yahoo Finance snapshot, deterministic ratios, LangGraph research workflow
- `render.yaml`: optional Render Blueprint for the API

## 1. Run backend locally
Requires Python 3.11–3.13 recommended (check compatibility of dependencies if using a newer Python).

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000/docs

Try:
- `GET /health`
- `GET /api/stocks/INFY.NS`
- `POST /api/research` with JSON `{"company":"Infosys Limited","symbol":"INFY.NS"}`

## 2. Run mobile app
Install Node.js LTS, then:

```bash
cd mobile
npm install
npx expo start
```

Install Expo Go on your phone and scan the QR code. Set the API URL in `mobile/src/config.ts`.
- Physical phone: use your computer's LAN IP, e.g. `http://192.168.1.20:8000`
- Deployed backend: use your Render HTTPS URL, e.g. `https://marketlens-api.onrender.com`

The mobile app is configured with a placeholder API URL. Change it before testing.

## 3. Deploy backend to Render
1. Push this folder's contents to a GitHub repository.
2. Create a Render account and connect the repository.
3. Create a Web Service, root directory `backend`, build command `pip install -r requirements.txt`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Set `PYTHON_VERSION` to a supported Python version if needed.
5. Add secrets only if you enable an LLM provider. Never commit `.env`.
6. Verify `/health` and `/docs`.
7. Set `API_BASE_URL` in `mobile/src/config.ts` to the deployed HTTPS URL and rebuild/restart Expo.

Render free web services sleep after inactivity and can have cold starts; its free tier is best for prototypes, not a dependable production service. Check current limits before deployment.

## 4. Build installable apps with Expo EAS
```bash
cd mobile
npm install
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```
- Android preview profile produces an installable APK as configured in `eas.json`.
- iOS device installation requires Apple provisioning/signing; easiest distribution for external testers is usually TestFlight and requires Apple Developer Program membership.
- Google Play publishing requires a Play Console developer account and store compliance. Store accounts are not free in all cases.
- EAS cloud-build allowances and pricing can change; check Expo's current documentation.

## External accounts / credentials
- **Required for backend deployment:** GitHub account, Render account.
- **Required for mobile cloud builds:** Expo account.
- **For app-store distribution:** Google Play Console and/or Apple Developer account, plus signing and store metadata.
- **Optional LLM:** Google Gemini API key or another supported provider key. This starter's core market snapshot works without one. If enabled, set `GOOGLE_API_KEY` only as a backend environment secret.
- **Market data:** `yfinance` requires no API key but is an unofficial Yahoo Finance interface; review Yahoo terms and use a licensed provider for commercial/production use.
- **Verified disclosures/news:** add authorized source access and comply with NSE/BSE site terms, robots rules, rate limits, and redistribution/licensing terms. Do not scrape around access controls.

## API endpoints
- `GET /health`
- `GET /api/stocks/{symbol}` — snapshot and one-year range
- `GET /api/stocks/{symbol}/history?period=1y` — price history
- `POST /api/research` — structured report generated from available data and LangGraph workflow
- `GET /api/sources` — primary disclosure links

## Data integrity principles
- Missing fields remain `null`, never silently become zero.
- Price response labels latest available daily close and includes timestamp; it does not claim a live CMP.
- Any LLM-generated narrative must be grounded in supplied tool results.
- Promoter integrity is not automatically inferred from a missing disclosure.
- 2030 values must be scenario outputs with explicit assumptions, not asserted consensus facts.
