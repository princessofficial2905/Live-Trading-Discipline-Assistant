# Live Trading Discipline Assistant

A static, mobile-first React + Vite app for live trading discipline.

This is not a trading signal app. It does not predict market direction, connect to brokers, use a backend, require authentication, or save personal trading data permanently.

## Main Sections

1. Trading Session
2. After Session Homework Steps
3. TradingView Alerts Steps

## Trading Session Lock

The Trading Session flow locks for 10 minutes only after:

- The calculator step is completed.
- SL allotted is checked.
- Target allotted is checked.
- "Yes! All Set." is clicked.

No lock is created when a No answer or checklist failure sends the user back home.

During the 10-minute lock, the Trading Session card is disabled and shows a countdown. Homework and TradingView alert steps remain available anytime.

## Privacy And Storage

- No backend
- No database
- No login or authentication
- No permanent personal trading data storage
- Only `tradingSessionLockedUntil` is stored in `localStorage` so the 10-minute countdown survives refreshes

Calculator values, checklist states, and trade details stay in memory only.

## Tech

- React
- Vite
- Static frontend only
- GitHub Pages ready
- Vite base path: `/Live-Trading-Discipline-Assistant/`

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
```

The production files are generated in `dist/`.

## Preview Production Build

```bash
npm run preview
```

## Deploy To GitHub Pages

This project is configured for:

```text
https://github.com/princessofficial2905/Live-Trading-Discipline-Assistant
```

The Vite base path must remain:

```js
base: "/Live-Trading-Discipline-Assistant/",
```

GitHub Actions deploys the built `dist/` folder to GitHub Pages on pushes to `main`.
