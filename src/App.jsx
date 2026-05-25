import { useEffect, useMemo, useState } from "react";

const LOCK_STORAGE_KEY = "tradingSessionLockedUntil";
const LOCK_DURATION_MS = 6 * 60 * 60 * 1000;
const LOCK_SYNC_URL =
  "https://princessofficial2905.github.io/Live-Trading-Discipline-Assistant/";

const SECTIONS = {
  HOME: "home",
  TRADING: "trading",
  HOMEWORK: "homework",
  ALERTS: "alerts",
};

const TRADING_STEPS = {
  OPEN_TRADINGVIEW: "TRADING_OPEN_TRADINGVIEW",
  ONE_MIN_TIMEFRAME: "TRADING_ONE_MIN_TIMEFRAME",
  STRONG_LOW: "TRADING_STRONG_LOW",
  BLESSING_TOOKED: "TRADING_BLESSING_TOOKED",
  BLUE_BLACK_MOVEMENT: "TRADING_BLUE_BLACK_MOVEMENT",
  LONG_NOS_CHECKLIST: "TRADING_LONG_NOS_CHECKLIST",
  LONG_OSM_CONFIRMATION: "TRADING_LONG_OSM_CONFIRMATION",
  LONG_SL_REMINDER: "TRADING_LONG_SL_REMINDER",
  LONG_ENTER: "TRADING_LONG_ENTER",
  LONG_CALCULATOR: "TRADING_LONG_CALCULATOR",
  LONG_ALLOCATION_CHECK: "TRADING_LONG_ALLOCATION_CHECK",
  SELL_ALERT_TRADINGVIEW: "TRADING_SELL_ALERT_TRADINGVIEW",
  SELL_ALERT_TIMEFRAME: "TRADING_SELL_ALERT_TIMEFRAME",
  STRONG_HIGH: "TRADING_STRONG_HIGH",
  SHORT_NOS_CHECKLIST: "TRADING_SHORT_NOS_CHECKLIST",
  SHORT_OSM_CONFIRMATION: "TRADING_SHORT_OSM_CONFIRMATION",
  SHORT_SL_REMINDER: "TRADING_SHORT_SL_REMINDER",
  SHORT_ENTER: "TRADING_SHORT_ENTER",
  SHORT_CALCULATOR: "TRADING_SHORT_CALCULATOR",
  SHORT_ALLOCATION_CHECK: "TRADING_SHORT_ALLOCATION_CHECK",
};

const TRADE_DIRECTIONS = {
  LONG: "long",
  SHORT: "short",
};

const CHECK_STATES = {
  EMPTY: 0,
  GREEN: 1,
  RED: 2,
};

const longChecklistItems = [
  "no near red barrier",
  "no zero-volume candle",
  "no rough-bar candles",
  "no stretched-wick candles",
];

const shortChecklistItems = [
  "no near blue barrier",
  "no zero-volume candles",
  "no rough bar candles",
  "no stretched-wick candles",
];

const homeworkSteps = [
  "Emails: shortlisted ones",
  "List down",
  "LTP's",
  "Qty",
  "Margin: 1000 → 100/2 = 50\n\n1000 - 50 = 950 → margin",
  "Replace Zerodha's watchlist",
  "Put on qty's",
  "Replace TradingView watchlist",
  "List all those watchlist's SS + Nifty 50.csv to ChatGPT",
  "Remove all Nifty 50 symbols from your both watchlists.",
  "Homework steps complete.",
];

const alertSteps = [
  "Nifty Total Market indice",
  "Alert - I",
  "Condition: LuxAlgo",
  "Bullish BOS",
  "Interval: 1 min",
  "Trigger: Once Per Minute",
  "Expiration: 1 week",
  "Message: BUY! BUY! BUY!",
  "Notifications: Toasts + Sound",
  "Alert - II",
  "Condition: LuxAlgo",
  "Bearish BOS",
  "Interval: 1 min",
  "Trigger: Once Per Minute",
  "Expiration: 1 week",
  "Message: SELL! SELL! SELL!",
  "Notifications: Toasts + Sound",
  "TradingView alerts setup complete.",
];

const initialCalculatorValues = {
  entryPrice: "",
  quantity: "",
  target1Amount: "50",
  target2Amount: "100",
  maxRiskAmount: "50",
};

const initialAllocationChecks = {
  sl: false,
  target: false,
};

function readStoredLock() {
  const storedValue = window.localStorage.getItem(LOCK_STORAGE_KEY);
  const timestamp = Number(storedValue);

  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
    window.localStorage.removeItem(LOCK_STORAGE_KEY);
    return null;
  }

  return timestamp;
}

function readLockFromUrl() {
  const url = new URL(window.location.href);

  if (!url.searchParams.has("lockedUntil")) {
    return null;
  }

  const timestamp = Number(url.searchParams.get("lockedUntil"));
  const isValidLock = Number.isFinite(timestamp) && Date.now() < timestamp;

  if (isValidLock) {
    window.localStorage.setItem(LOCK_STORAGE_KEY, String(timestamp));
  } else {
    readStoredLock();
  }

  url.searchParams.delete("lockedUntil");
  const cleanSearch = url.searchParams.toString();
  const cleanUrl = `${url.pathname}${cleanSearch ? `?${cleanSearch}` : ""}`;
  window.history.replaceState(window.history.state, "", cleanUrl);

  return isValidLock ? timestamp : null;
}

function createLockSyncLink(timestamp) {
  return `${LOCK_SYNC_URL}?lockedUntil=${timestamp}`;
}

function createChecklistState(items) {
  return items.map(() => CHECK_STATES.EMPTY);
}

function parseAmount(value) {
  if (String(value).trim() === "") {
    return Number.NaN;
  }

  return Number(value);
}

function calculatePrices(values, direction) {
  const entryPrice = parseAmount(values.entryPrice);
  const quantity = parseAmount(values.quantity);
  const target1Amount = parseAmount(values.target1Amount);
  const target2Amount = parseAmount(values.target2Amount);
  const maxRiskAmount = parseAmount(values.maxRiskAmount);

  if (
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(target1Amount) ||
    !Number.isFinite(target2Amount) ||
    !Number.isFinite(maxRiskAmount) ||
    quantity <= 0
  ) {
    return null;
  }

  const directionMultiplier = direction === TRADE_DIRECTIONS.SHORT ? -1 : 1;

  return {
    target1Price: entryPrice + directionMultiplier * (target1Amount / quantity),
    target2Price: entryPrice + directionMultiplier * (target2Amount / quantity),
    stopLossPrice:
      entryPrice - directionMultiplier * (maxRiskAmount / quantity),
  };
}

function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function App() {
  const [mainSection, setMainSection] = useState(SECTIONS.HOME);
  const [tradingStep, setTradingStep] = useState(
    TRADING_STEPS.OPEN_TRADINGVIEW,
  );
  const [homeworkIndex, setHomeworkIndex] = useState(0);
  const [alertsIndex, setAlertsIndex] = useState(0);
  const [tradeDirection, setTradeDirection] = useState(null);
  const [longChecklist, setLongChecklist] = useState(() =>
    createChecklistState(longChecklistItems),
  );
  const [shortChecklist, setShortChecklist] = useState(() =>
    createChecklistState(shortChecklistItems),
  );
  const [calculatorValues, setCalculatorValues] = useState(
    initialCalculatorValues,
  );
  const [calculatorCompleted, setCalculatorCompleted] = useState(false);
  const [calculatorWarning, setCalculatorWarning] = useState("");
  const [allocationChecks, setAllocationChecks] = useState(
    initialAllocationChecks,
  );
  const [allocationWarning, setAllocationWarning] = useState("");
  const [homeNotice, setHomeNotice] = useState("");
  const [lockedUntil, setLockedUntil] = useState(() => readStoredLock());
  const [timeLeftMs, setTimeLeftMs] = useState(() =>
    lockedUntil ? Math.max(0, lockedUntil - Date.now()) : 0,
  );

  const isTradingLocked = lockedUntil ? timeLeftMs > 0 : false;
  const countdown = formatCountdown(timeLeftMs);
  const lockSyncLink = lockedUntil ? createLockSyncLink(lockedUntil) : "";
  const isLongPreEntry = [
    TRADING_STEPS.STRONG_LOW,
    TRADING_STEPS.BLESSING_TOOKED,
    TRADING_STEPS.BLUE_BLACK_MOVEMENT,
    TRADING_STEPS.LONG_NOS_CHECKLIST,
    TRADING_STEPS.LONG_OSM_CONFIRMATION,
    TRADING_STEPS.LONG_SL_REMINDER,
    TRADING_STEPS.LONG_ENTER,
  ].includes(tradingStep);

  const calculatorPrices = useMemo(
    () => calculatePrices(calculatorValues, tradeDirection),
    [calculatorValues, tradeDirection],
  );

  useEffect(() => {
    const urlLock = readLockFromUrl();

    if (!urlLock) {
      return;
    }

    setLockedUntil(urlLock);
    setTimeLeftMs(Math.max(0, urlLock - Date.now()));
    setMainSection(SECTIONS.HOME);
  }, []);

  useEffect(() => {
    if (!lockedUntil) {
      setTimeLeftMs(0);
      return undefined;
    }

    function syncCountdown() {
      const remainingMs = lockedUntil - Date.now();

      if (remainingMs <= 0) {
        window.localStorage.removeItem(LOCK_STORAGE_KEY);
        setLockedUntil(null);
        setTimeLeftMs(0);
        return;
      }

      setTimeLeftMs(remainingMs);
    }

    syncCountdown();
    const intervalId = window.setInterval(syncCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [lockedUntil]);

  useEffect(() => {
    if (!homeNotice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setHomeNotice(""), 3600);

    return () => window.clearTimeout(timeoutId);
  }, [homeNotice]);

  function resetTradingState() {
    setTradingStep(TRADING_STEPS.OPEN_TRADINGVIEW);
    setTradeDirection(null);
    setLongChecklist(createChecklistState(longChecklistItems));
    setShortChecklist(createChecklistState(shortChecklistItems));
    setCalculatorValues(initialCalculatorValues);
    setCalculatorCompleted(false);
    setCalculatorWarning("");
    setAllocationChecks(initialAllocationChecks);
    setAllocationWarning("");
  }

  function goHome(message = "") {
    resetTradingState();
    setMainSection(SECTIONS.HOME);
    setHomeNotice(message);
  }

  function startTradingSession() {
    if (isTradingLocked) {
      return;
    }

    resetTradingState();
    setHomeNotice("");
    setMainSection(SECTIONS.TRADING);
  }

  function startHomework() {
    setHomeworkIndex(0);
    setHomeNotice("");
    setMainSection(SECTIONS.HOMEWORK);
  }

  function startAlerts() {
    setAlertsIndex(0);
    setHomeNotice("");
    setMainSection(SECTIONS.ALERTS);
  }

  function switchToShortFlow() {
    setTradeDirection(TRADE_DIRECTIONS.SHORT);
    setShortChecklist(createChecklistState(shortChecklistItems));
    setCalculatorValues(initialCalculatorValues);
    setCalculatorCompleted(false);
    setCalculatorWarning("");
    setAllocationChecks(initialAllocationChecks);
    setAllocationWarning("");
    setTradingStep(TRADING_STEPS.SELL_ALERT_TRADINGVIEW);
  }

  function updateChecklist(whichChecklist, index) {
    const update = (currentState) =>
      currentState.map((state, stateIndex) =>
        stateIndex === index
          ? (state + 1) % 3
          : state,
      );

    if (whichChecklist === TRADE_DIRECTIONS.SHORT) {
      setShortChecklist(update);
      return;
    }

    setLongChecklist(update);
  }

  function completeChecklist(whichChecklist) {
    const checklist =
      whichChecklist === TRADE_DIRECTIONS.SHORT
        ? shortChecklist
        : longChecklist;

    if (!checklist.every((state) => state === CHECK_STATES.GREEN)) {
      goHome("Checklist not all green. Trading Session stayed unlocked.");
      return;
    }

    setTradingStep(
      whichChecklist === TRADE_DIRECTIONS.SHORT
        ? TRADING_STEPS.SHORT_OSM_CONFIRMATION
        : TRADING_STEPS.LONG_OSM_CONFIRMATION,
    );
  }

  function updateCalculatorValue(field, value) {
    setCalculatorCompleted(false);
    setCalculatorWarning("");
    setCalculatorValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function completeCalculator(nextStep) {
    if (!calculatorPrices) {
      setCalculatorWarning("Complete the calculator first.");
      return;
    }

    setCalculatorCompleted(true);
    setCalculatorWarning("");
    setAllocationChecks(initialAllocationChecks);
    setAllocationWarning("");
    setTradingStep(nextStep);
  }

  function updateAllocation(field) {
    setAllocationWarning("");
    setAllocationChecks((currentChecks) => ({
      ...currentChecks,
      [field]: !currentChecks[field],
    }));
  }

  function completeAllocation() {
    if (!calculatorCompleted) {
      setAllocationWarning("Complete the calculator first.");
      return;
    }

    if (!allocationChecks.sl || !allocationChecks.target) {
      setAllocationWarning("Allot SL and target first.");
      return;
    }

    const nextLockedUntil = Date.now() + LOCK_DURATION_MS;

    window.localStorage.setItem(LOCK_STORAGE_KEY, String(nextLockedUntil));
    setLockedUntil(nextLockedUntil);
    setTimeLeftMs(LOCK_DURATION_MS);
    resetTradingState();
    setMainSection(SECTIONS.HOME);
  }

  function renderTradingStep() {
    const sellAlert = isLongPreEntry ? (
      <SellAlertButton onClick={switchToShortFlow} />
    ) : null;

    switch (tradingStep) {
      case TRADING_STEPS.OPEN_TRADINGVIEW:
        return (
          <StepScreen
            title="Open TradingView"
            buttonLabel="Done"
            onNext={() => setTradingStep(TRADING_STEPS.ONE_MIN_TIMEFRAME)}
          />
        );
      case TRADING_STEPS.ONE_MIN_TIMEFRAME:
        return (
          <StepScreen
            title="1 minute timeframe"
            buttonLabel="Done"
            onNext={() => setTradingStep(TRADING_STEPS.STRONG_LOW)}
          />
        );
      case TRADING_STEPS.STRONG_LOW:
        return (
          <StepScreen
            topSlot={sellAlert}
            title="Strong Low!"
            buttonLabel="Strong Low!"
            onNext={() => {
              setTradeDirection(TRADE_DIRECTIONS.LONG);
              setTradingStep(TRADING_STEPS.BLESSING_TOOKED);
            }}
            tone="long"
          />
        );
      case TRADING_STEPS.BLESSING_TOOKED:
        return (
          <DecisionScreen
            topSlot={sellAlert}
            title="Blessing tooked?"
            yesLabel="Yes"
            noLabel="No"
            onYes={() => setTradingStep(TRADING_STEPS.BLUE_BLACK_MOVEMENT)}
            onNo={() => goHome()}
          />
        );
      case TRADING_STEPS.BLUE_BLACK_MOVEMENT:
        return (
          <DecisionScreen
            topSlot={sellAlert}
            title="Proper Blue/Black movement?"
            yesLabel="Yes"
            noLabel="No"
            onYes={() => setTradingStep(TRADING_STEPS.LONG_NOS_CHECKLIST)}
            onNo={() => goHome()}
          />
        );
      case TRADING_STEPS.LONG_NOS_CHECKLIST:
        return (
          <ChecklistScreen
            topSlot={sellAlert}
            items={longChecklistItems}
            states={longChecklist}
            onToggle={(index) => updateChecklist(TRADE_DIRECTIONS.LONG, index)}
            onDone={() => completeChecklist(TRADE_DIRECTIONS.LONG)}
          />
        );
      case TRADING_STEPS.LONG_OSM_CONFIRMATION:
        return (
          <OsmConfirmationScreen
            topSlot={sellAlert}
            question="Price above OSM Green line?"
            confirmLabel="Yes, above OSM Green"
            rejectLabel="No, not above"
            onConfirm={() => setTradingStep(TRADING_STEPS.LONG_SL_REMINDER)}
            onReject={() => goHome()}
            tone="long"
          />
        );
      case TRADING_STEPS.LONG_SL_REMINDER:
        return (
          <StepScreen
            topSlot={sellAlert}
            title="Before entering: Put SL below that strong low line."
            buttonLabel="Done"
            onNext={() => setTradingStep(TRADING_STEPS.LONG_ENTER)}
            tone="danger"
          />
        );
      case TRADING_STEPS.LONG_ENTER:
        return (
          <StepScreen
            topSlot={sellAlert}
            title="Enter trade"
            buttonLabel="I entered"
            onNext={() => {
              setTradeDirection(TRADE_DIRECTIONS.LONG);
              setTradingStep(TRADING_STEPS.LONG_CALCULATOR);
            }}
            tone="long"
          />
        );
      case TRADING_STEPS.LONG_CALCULATOR:
        return (
          <CalculatorScreen
            direction={TRADE_DIRECTIONS.LONG}
            values={calculatorValues}
            prices={calculatorPrices}
            warning={calculatorWarning}
            onChange={updateCalculatorValue}
            onDone={() => completeCalculator(TRADING_STEPS.LONG_ALLOCATION_CHECK)}
          />
        );
      case TRADING_STEPS.LONG_ALLOCATION_CHECK:
        return (
          <AllocationCheckScreen
            checks={allocationChecks}
            warning={allocationWarning}
            onToggle={updateAllocation}
            onComplete={completeAllocation}
          />
        );
      case TRADING_STEPS.SELL_ALERT_TRADINGVIEW:
        return (
          <StepScreen
            title="TradingView"
            buttonLabel="Done"
            onNext={() => setTradingStep(TRADING_STEPS.SELL_ALERT_TIMEFRAME)}
            tone="short"
          />
        );
      case TRADING_STEPS.SELL_ALERT_TIMEFRAME:
        return (
          <StepScreen
            title="Timeframe: 1 min"
            buttonLabel="Done"
            onNext={() => setTradingStep(TRADING_STEPS.STRONG_HIGH)}
            tone="short"
          />
        );
      case TRADING_STEPS.STRONG_HIGH:
        return (
          <StepScreen
            title="Strong High."
            buttonLabel="Done"
            onNext={() => setTradingStep(TRADING_STEPS.SHORT_NOS_CHECKLIST)}
            tone="short"
          />
        );
      case TRADING_STEPS.SHORT_NOS_CHECKLIST:
        return (
          <ChecklistScreen
            items={shortChecklistItems}
            states={shortChecklist}
            onToggle={(index) => updateChecklist(TRADE_DIRECTIONS.SHORT, index)}
            onDone={() => completeChecklist(TRADE_DIRECTIONS.SHORT)}
          />
        );
      case TRADING_STEPS.SHORT_OSM_CONFIRMATION:
        return (
          <OsmConfirmationScreen
            question="Price below OSM Red line?"
            confirmLabel="Yes, below OSM Red"
            rejectLabel="No, not below"
            onConfirm={() => setTradingStep(TRADING_STEPS.SHORT_SL_REMINDER)}
            onReject={() => goHome()}
            tone="short"
          />
        );
      case TRADING_STEPS.SHORT_SL_REMINDER:
        return (
          <StepScreen
            title="Before entering: Put SL above that strong high line."
            buttonLabel="Done"
            onNext={() => setTradingStep(TRADING_STEPS.SHORT_ENTER)}
            tone="danger"
          />
        );
      case TRADING_STEPS.SHORT_ENTER:
        return (
          <StepScreen
            title=""
            buttonLabel="I am entering"
            onNext={() => {
              setTradeDirection(TRADE_DIRECTIONS.SHORT);
              setTradingStep(TRADING_STEPS.SHORT_CALCULATOR);
            }}
            tone="short"
          />
        );
      case TRADING_STEPS.SHORT_CALCULATOR:
        return (
          <CalculatorScreen
            direction={TRADE_DIRECTIONS.SHORT}
            values={calculatorValues}
            prices={calculatorPrices}
            warning={calculatorWarning}
            onChange={updateCalculatorValue}
            onDone={() => completeCalculator(TRADING_STEPS.SHORT_ALLOCATION_CHECK)}
          />
        );
      case TRADING_STEPS.SHORT_ALLOCATION_CHECK:
        return (
          <AllocationCheckScreen
            checks={allocationChecks}
            warning={allocationWarning}
            onToggle={updateAllocation}
            onComplete={completeAllocation}
          />
        );
      default:
        return null;
    }
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {mainSection === SECTIONS.HOME && (
          <HomePage
            isTradingLocked={isTradingLocked}
            countdown={countdown}
            lockSyncLink={lockSyncLink}
            notice={homeNotice}
            onTrading={startTradingSession}
            onHomework={startHomework}
            onAlerts={startAlerts}
          />
        )}

        {mainSection === SECTIONS.TRADING && !isTradingLocked && (
          <section className="flow-shell" key={tradingStep}>
            {renderTradingStep()}
          </section>
        )}

        {mainSection === SECTIONS.TRADING && isTradingLocked && (
          <HomePage
            isTradingLocked
            countdown={countdown}
            lockSyncLink={lockSyncLink}
            notice=""
            onTrading={startTradingSession}
            onHomework={startHomework}
            onAlerts={startAlerts}
          />
        )}

        {mainSection === SECTIONS.HOMEWORK && (
          <LinearFlow
            steps={homeworkSteps}
            index={homeworkIndex}
            setIndex={setHomeworkIndex}
            onHome={() => goHome()}
            finalButtonLabel="Back to Home"
          />
        )}

        {mainSection === SECTIONS.ALERTS && (
          <LinearFlow
            steps={alertSteps}
            index={alertsIndex}
            setIndex={setAlertsIndex}
            onHome={() => goHome()}
            finalButtonLabel="Back to Home"
          />
        )}
      </div>
    </main>
  );
}

function HomePage({
  isTradingLocked,
  countdown,
  lockSyncLink,
  notice,
  onTrading,
  onHomework,
  onAlerts,
}) {
  return (
    <section className="home-screen">
      <div className="home-copy">
        <p className="app-kicker">Live Trading Discipline Assistant</p>
        <h1>Reminder: Fuck The Idea of Brokerage Donation.</h1>
      </div>

      <div className="home-actions" aria-label="Main sections">
        <button
          className={`section-card trading-card ${
            isTradingLocked ? "section-card-locked" : ""
          }`}
          type="button"
          onClick={onTrading}
          disabled={isTradingLocked}
        >
          <span>Trading Session</span>
          {isTradingLocked && (
            <small>
              Trading Session locked
              <br />
              Available again in: {countdown}
            </small>
          )}
        </button>

        <button className="section-card homework-card" type="button" onClick={onHomework}>
          <span>After Session Homework Steps</span>
        </button>

        <button className="section-card alerts-card" type="button" onClick={onAlerts}>
          <span>TradingView Alerts Steps</span>
        </button>
      </div>

      {isTradingLocked && (
        <LockedTradingSessionScreen
          countdown={countdown}
          lockSyncLink={lockSyncLink}
        />
      )}

      {notice && <p className="home-notice" role="status">{notice}</p>}
    </section>
  );
}

function LockedTradingSessionScreen({ countdown, lockSyncLink }) {
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    setCopyMessage("");
  }, [lockSyncLink]);

  async function copyLockLink() {
    try {
      await navigator.clipboard.writeText(lockSyncLink);
      setCopyMessage("Lock link copied.");
    } catch {
      setCopyMessage("Copy failed. Please copy the link manually.");
    }
  }

  return (
    <section className="lock-panel" aria-live="polite">
      <h2>Trading Session locked for 6 hours.</h2>
      <p>Go Girl Go make yourself win one more day today by showing discipline.</p>
      <strong>Available again in: {countdown}</strong>
      <div className="lock-sync-section">
        <p className="lock-sync-title">
          Use this link to lock another device too:
        </p>
        <textarea
          className="lock-link-box"
          aria-label="Manual lock sync link"
          readOnly
          rows="3"
          value={lockSyncLink}
          onFocus={(event) => event.target.select()}
        />
        <button className="copy-lock-button" type="button" onClick={copyLockLink}>
          Copy Lock Link
        </button>
        {copyMessage && (
          <p className="copy-lock-message" role="status">
            {copyMessage}
          </p>
        )}
        <p className="lock-sync-helper">
          Open this link on your laptop/phone to show the same lock timer there.
        </p>
      </div>
    </section>
  );
}

function SellAlertButton({ onClick }) {
  return (
    <button className="sell-alert-button" type="button" onClick={onClick}>
      SELL! SELL! SELL! ALERT
    </button>
  );
}

function OsmConfirmationScreen({
  question,
  confirmLabel,
  rejectLabel,
  onConfirm,
  onReject,
  topSlot = null,
  tone = "default",
}) {
  const confirmClass =
    tone === TRADE_DIRECTIONS.SHORT
      ? "primary-action danger-action"
      : "primary-action success-action";

  return (
    <article className={`step-screen osm-screen tone-${tone}`}>
      <div className="screen-top">{topSlot}</div>
      <div className="osm-copy">
        <h1>OSM Confirmation</h1>
        <p className="osm-question">{question}</p>
      </div>
      <div className="osm-actions">
        <button className={confirmClass} type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button
          className="primary-action secondary-action"
          type="button"
          onClick={onReject}
        >
          {rejectLabel}
        </button>
      </div>
    </article>
  );
}

function StepScreen({
  title,
  buttonLabel,
  onNext,
  topSlot = null,
  tone = "default",
}) {
  return (
    <article className={`step-screen tone-${tone}`}>
      <div className="screen-top">{topSlot}</div>
      <div className="step-copy">
        {title && <h1>{title}</h1>}
      </div>
      <button className="primary-action" type="button" onClick={onNext}>
        {buttonLabel}
      </button>
    </article>
  );
}

function DecisionScreen({
  title,
  yesLabel,
  noLabel,
  onYes,
  onNo,
  topSlot = null,
}) {
  return (
    <article className="step-screen tone-default">
      <div className="screen-top">{topSlot}</div>
      <div className="step-copy">
        <h1>{title}</h1>
      </div>
      <div className="split-actions">
        <button className="primary-action success-action" type="button" onClick={onYes}>
          {yesLabel}
        </button>
        <button className="primary-action danger-action" type="button" onClick={onNo}>
          {noLabel}
        </button>
      </div>
    </article>
  );
}

function ChecklistScreen({ items, states, onToggle, onDone, topSlot = null }) {
  return (
    <article className="step-screen checklist-screen">
      <div className="screen-top">{topSlot}</div>
      <div className="checklist-copy">
        <h1>NO'S...</h1>
        <div className="checklist-items">
          {items.map((item, index) => (
            <button
              className={`checklist-item check-state-${states[index]}`}
              type="button"
              key={item}
              onClick={() => onToggle(index)}
            >
              <span className="check-icon" aria-hidden="true">
                {states[index] === CHECK_STATES.GREEN
                  ? "✓"
                  : states[index] === CHECK_STATES.RED
                    ? "×"
                    : ""}
              </span>
              <span>{item}</span>
            </button>
          ))}
        </div>
      </div>
      <button className="primary-action" type="button" onClick={onDone}>
        Done
      </button>
    </article>
  );
}

function CalculatorScreen({
  direction,
  values,
  prices,
  warning,
  onChange,
  onDone,
}) {
  const modeLabel =
    direction === TRADE_DIRECTIONS.SHORT ? "SELL / SHORT" : "BUY / LONG";

  return (
    <article className={`calculator-screen tone-${direction}`}>
      <div className="calculator-copy">
        <p className="calculator-mode">Calculator Mode: {modeLabel}</p>
        <div className="input-grid">
          <NumberInput
            label="Entry Price"
            value={values.entryPrice}
            onChange={(value) => onChange("entryPrice", value)}
          />
          <NumberInput
            label="Quantity"
            value={values.quantity}
            onChange={(value) => onChange("quantity", value)}
          />
          <NumberInput
            label="Target 1 Profit Amount"
            value={values.target1Amount}
            onChange={(value) => onChange("target1Amount", value)}
          />
          <NumberInput
            label="Target 2 Profit Amount"
            value={values.target2Amount}
            onChange={(value) => onChange("target2Amount", value)}
          />
          <NumberInput
            label="Max Risk Amount"
            value={values.maxRiskAmount}
            onChange={(value) => onChange("maxRiskAmount", value)}
          />
        </div>

        <div className="output-grid" aria-live="polite">
          <OutputCard
            label="Target 1 Price"
            value={formatPrice(prices?.target1Price)}
          />
          <OutputCard
            label="Target 2 Price"
            value={formatPrice(prices?.target2Price)}
          />
          <OutputCard
            label="Stop Loss Price"
            value={formatPrice(prices?.stopLossPrice)}
            danger
          />
        </div>
        {warning && <p className="calculator-warning">{warning}</p>}
      </div>

      <button className="primary-action" type="button" onClick={onDone}>
        Done
      </button>
    </article>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function OutputCard({ label, value, danger = false }) {
  return (
    <div className={`output-card ${danger ? "output-danger" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AllocationCheckScreen({ checks, warning, onToggle, onComplete }) {
  return (
    <article className="step-screen allocation-screen">
      <div className="allocation-copy">
        <ChecklistCheckbox
          label="SL allotted?"
          checked={checks.sl}
          onChange={() => onToggle("sl")}
        />
        <ChecklistCheckbox
          label="Target allotted?"
          checked={checks.target}
          onChange={() => onToggle("target")}
        />
        {warning && <p className="allocation-warning">{warning}</p>}
      </div>
      <button className="primary-action success-action" type="button" onClick={onComplete}>
        Yes! All Set.
      </button>
    </article>
  );
}

function ChecklistCheckbox({ label, checked, onChange }) {
  return (
    <label className={`allocation-row ${checked ? "allocation-row-checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function LinearFlow({ steps, index, setIndex, onHome, finalButtonLabel }) {
  const isFinal = index === steps.length - 1;

  function goBack() {
    if (index === 0) {
      onHome();
      return;
    }

    setIndex(index - 1);
  }

  return (
    <section className="linear-shell" key={`${steps.length}-${index}`}>
      <header className="flow-nav">
        <button className="nav-button" type="button" onClick={goBack}>
          Back
        </button>
        <button className="nav-button" type="button" onClick={onHome}>
          Home
        </button>
      </header>
      <article className="step-screen linear-screen">
        <div className="step-copy">
          <h1>{steps[index]}</h1>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={isFinal ? onHome : () => setIndex(index + 1)}
        >
          {isFinal ? finalButtonLabel : "Next"}
        </button>
      </article>
    </section>
  );
}

export default App;
