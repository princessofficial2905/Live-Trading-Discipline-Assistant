# Live Trading Discipline Assistant

A static, mobile-first React + Vite checklist assistant for live trading discipline.

This is not a trading signal app. It does not predict trades, connect to brokers, use a backend, require authentication, or save user data permanently. State only lives in the current browser session while the app is open.

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

This project is configured for the repository:

```text
https://github.com/princessofficial2905/Live-Trading-Discipline-Assistant
```

The Vite base path is already set in `vite.config.js`:

```js
base: "/Live-Trading-Discipline-Assistant/",
```

### Option 1: Deploy With `gh-pages`

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build and publish the `dist/` folder:

   ```bash
   npm run deploy
   ```

3. In GitHub, open repository Settings -> Pages.

4. Set the source to deploy from the `gh-pages` branch.

5. Open:

   ```text
   https://princessofficial2905.github.io/Live-Trading-Discipline-Assistant/
   ```

### Option 2: GitHub Actions

1. Run:

   ```bash
   npm run build
   ```

2. In GitHub, open repository Settings -> Pages.

3. Choose GitHub Actions as the source.

4. Add a standard Vite GitHub Pages workflow that installs dependencies, runs `npm run build`, and uploads `dist/`.

## Checklist Flow

The app uses step IDs inside `src/App.jsx`, not routing or a backend. This keeps the live-session flow easy to edit later.

Current major sections:

- Welcome reminder
- TradingView checklist path with Strong Low or Strong High selection
- Barrier confirmation after the strong line selection
- Zero-volume, rough bar, and stretched-wick candle checks
- Zerodha checklist path
- Strict SL reminder before entry
- BUY/LONG and SELL/SHORT target calculator modes
- Target hit flow
- SL hit shutdown flow

## Calculator Formula

The calculator mode is selected earlier in the checklist:

- Strong Low leads to the BUY/LONG calculator.
- Strong High leads to the SELL/SHORT calculator.

After selecting Strong Low or Strong High, the app asks a barrier confirmation before the candle checks:

- Strong Low checks for no near red barrier.
- Strong High checks for no near blue barrier.

For long/buy trades:

```text
Target 1 Price = Entry Price + Target 1 Profit Amount / Quantity
Target 2 Price = Entry Price + Target 2 Profit Amount / Quantity
Stop Loss Price = Entry Price - Max Risk Amount / Quantity
```

For short/sell trades:

```text
Target 1 Price = Entry Price - Target 1 Profit Amount / Quantity
Target 2 Price = Entry Price - Target 2 Profit Amount / Quantity
Stop Loss Price = Entry Price + Max Risk Amount / Quantity
```

No user data is saved permanently. Checklist state and calculator values only live in the current browser session while the app is open.
