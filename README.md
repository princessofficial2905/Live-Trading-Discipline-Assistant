# Live Trading Discipline Assistant

A static, mobile-first React + Vite app for live trading discipline.

This is not a trading signal app. It does not predict market direction, connect to brokers, use a backend, require authentication, or save personal trading data permanently.

## Main Sections

1. Trading Session
2. After Session Homework Steps
3. TradingView Alerts Steps

## Trading Session Lock

The BUY / LONG flow now includes OSM Green line confirmation after the NO'S checklist and before the SL reminder.

The SELL / SHORT flow now includes OSM Red line confirmation after the NO'S checklist and before the SL reminder.

The Trading Session flow locks for 6 hours only after:

- The calculator step is completed.
- SL allotted is checked.
- Target allotted is checked.
- "Yes! All Set." is clicked.

No lock is created when a No answer or checklist failure sends the user back home.

During the 6-hour lock, the Trading Session card is disabled and shows a countdown. Homework and TradingView alert steps remain available anytime.

## Manual Cross-device Lock Sync Without Backend

This app has no backend, database, Firebase, Supabase, or login. Because it is a static GitHub Pages app, automatic cross-device sync is not possible.

After Trading Session is locked, the app generates a Lock Link. Open that Lock Link on another device to apply the same 6-hour timer there.

A new lock link is generated every time because the `lockedUntil` timestamp changes. Old links expire automatically after the timestamp passes.

The lock is saved locally on each device using `tradingSessionLockedUntil` in `localStorage`. You can manually copy the Lock Link to another laptop or phone to apply the same timer there.

Homework and TradingView Alerts remain usable during the Trading Session lock.

## Privacy And Storage

- No backend
- No database
- No login or authentication
- No permanent personal trading data storage
- Only `tradingSessionLockedUntil` is stored in `localStorage` so the 6-hour countdown survives refreshes

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
