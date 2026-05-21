import { useMemo, useState } from "react";

const STEPS = {
  WELCOME: "WELCOME",
  OPEN_TRADINGVIEW: "OPEN_TRADINGVIEW",
  ONE_MIN_TIMEFRAME: "ONE_MIN_TIMEFRAME",
  CHOOSE_STRONG_LINE_TYPE: "CHOOSE_STRONG_LINE_TYPE",
  CHECK_ZERO_VOLUME_CANDLE: "CHECK_ZERO_VOLUME_CANDLE",
  CHECK_ROUGH_BAR_CANDLES: "CHECK_ROUGH_BAR_CANDLES",
  CHECK_STRETCHED_WICK_CANDLES: "CHECK_STRETCHED_WICK_CANDLES",
  OPEN_ZERODHA: "OPEN_ZERODHA",
  SEARCH_SYMBOL: "SEARCH_SYMBOL",
  ASK_BLESSINGS_RECEIVED: "ASK_BLESSINGS_RECEIVED",
  ASK_BLUE_BLACK_MOVEMENT: "ASK_BLUE_BLACK_MOVEMENT",
  REMIND_SL: "REMIND_SL",
  ENTER_TRADE: "ENTER_TRADE",
  CALCULATOR: "CALCULATOR",
  REMOVE_ACTIVE_ORDER_REMINDER: "REMOVE_ACTIVE_ORDER_REMINDER",
  TARGET_HIT: "TARGET_HIT",
  SL_HIT_WARNING: "SL_HIT_WARNING",
  DIARY_REMINDER: "DIARY_REMINDER",
  SESSION_CLOSED: "SESSION_CLOSED",
  DO_NOT_ENTER_NEXT_SYMBOL: "DO_NOT_ENTER_NEXT_SYMBOL",
};

const initialCalculator = {
  entryPrice: "",
  quantity: "",
  target1Amount: "50",
  target2Amount: "100",
  maxRiskAmount: "50",
};

const NEXT_SYMBOL_MESSAGES = {
  doNotEnter: "Do not enter. View next symbol in TradingView.",
  viewNext: "View next symbol in TradingView.",
};

function parseCalculatorNumber(value) {
  if (String(value).trim() === "") {
    return Number.NaN;
  }

  return Number(value);
}

function calculateTradePrices(values, tradeDirection) {
  const entryPrice = parseCalculatorNumber(values.entryPrice);
  const quantity = parseCalculatorNumber(values.quantity);
  const target1Amount = parseCalculatorNumber(values.target1Amount);
  const target2Amount = parseCalculatorNumber(values.target2Amount);
  const maxRiskAmount = parseCalculatorNumber(values.maxRiskAmount);

  if (
    !tradeDirection ||
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(target1Amount) ||
    !Number.isFinite(target2Amount) ||
    !Number.isFinite(maxRiskAmount) ||
    quantity <= 0
  ) {
    return null;
  }

  const direction = tradeDirection === "short" ? -1 : 1;

  return {
    target1Price: entryPrice + direction * (target1Amount / quantity),
    target2Price: entryPrice + direction * (target2Amount / quantity),
    stopLossPrice: entryPrice - direction * (maxRiskAmount / quantity),
  };
}

function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  const absoluteValue = Math.abs(value);
  const decimals =
    absoluteValue > 0 && absoluteValue < 0.01
      ? 6
      : absoluteValue > 0 && absoluteValue < 1
        ? 4
        : 2;

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getTradeModeLabel(tradeDirection) {
  return tradeDirection === "short" ? "SELL / SHORT" : "BUY / LONG";
}

function App() {
  const [step, setStep] = useState(STEPS.WELCOME);
  const [history, setHistory] = useState([]);
  const [restartArmed, setRestartArmed] = useState(false);
  const [tradeDirection, setTradeDirection] = useState(null);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);
  const [sessionClosedKind, setSessionClosedKind] = useState("protected");
  const [nextSymbolMessage, setNextSymbolMessage] = useState(
    NEXT_SYMBOL_MESSAGES.doNotEnter,
  );
  const [calculatorValues, setCalculatorValues] = useState(initialCalculator);

  const screen = useMemo(
    () => getScreen(step, tradeDirection, sessionClosedKind, nextSymbolMessage),
    [step, tradeDirection, sessionClosedKind, nextSymbolMessage],
  );
  const prices = useMemo(
    () => calculateTradePrices(calculatorValues, tradeDirection),
    [calculatorValues, tradeDirection],
  );

  const isLockedShutdown =
    [STEPS.SL_HIT_WARNING, STEPS.DIARY_REMINDER, STEPS.SESSION_CLOSED].includes(
      step,
    ) ||
    (step === STEPS.REMOVE_ACTIVE_ORDER_REMINDER &&
      pendingCloseAction === "sl");

  const canGoBack =
    history.length > 0 && ![STEPS.WELCOME].includes(step) && !isLockedShutdown;

  const canReset = ![STEPS.WELCOME].includes(step) && !isLockedShutdown;

  function goTo(nextStep, options = {}) {
    setRestartArmed(false);
    if (options.clearHistory) {
      setHistory([]);
    } else {
      setHistory((currentHistory) => [...currentHistory, step]);
    }
    setStep(nextStep);
  }

  function goBack() {
    const previousStep = history[history.length - 1];
    if (!previousStep) {
      return;
    }

    setRestartArmed(false);
    setStep(previousStep);
    setHistory(history.slice(0, -1));
  }

  function resetSession() {
    setStep(STEPS.WELCOME);
    setHistory([]);
    setRestartArmed(false);
    setTradeDirection(null);
    setPendingCloseAction(null);
    setSessionClosedKind("protected");
    setNextSymbolMessage(NEXT_SYMBOL_MESSAGES.doNotEnter);
    setCalculatorValues(initialCalculator);
  }

  function requestRestart() {
    if (restartArmed) {
      resetSession();
      return;
    }

    setRestartArmed(true);
    window.setTimeout(() => {
      setRestartArmed(false);
    }, 2400);
  }

  function startChecklist() {
    setTradeDirection(null);
    setPendingCloseAction(null);
    setSessionClosedKind("protected");
    setNextSymbolMessage(NEXT_SYMBOL_MESSAGES.doNotEnter);
    setCalculatorValues(initialCalculator);
    goTo(STEPS.OPEN_TRADINGVIEW, { clearHistory: true });
  }

  function chooseStrongLine(nextTradeDirection) {
    setTradeDirection(nextTradeDirection);
    goTo(STEPS.CHECK_ZERO_VOLUME_CANDLE);
  }

  function showNextSymbol(message) {
    setNextSymbolMessage(message);
    goTo(STEPS.DO_NOT_ENTER_NEXT_SYMBOL);
  }

  function startNextSymbol() {
    setTradeDirection(null);
    setPendingCloseAction(null);
    setNextSymbolMessage(NEXT_SYMBOL_MESSAGES.doNotEnter);
    setCalculatorValues(initialCalculator);
    goTo(STEPS.OPEN_TRADINGVIEW, { clearHistory: true });
  }

  function updateCalculatorValue(field, value) {
    setCalculatorValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleTargetHit() {
    setPendingCloseAction("target");
    goTo(STEPS.REMOVE_ACTIVE_ORDER_REMINDER);
  }

  function handleSlHit() {
    setPendingCloseAction("sl");
    goTo(STEPS.REMOVE_ACTIVE_ORDER_REMINDER);
  }

  function completeActiveOrderReminder() {
    if (pendingCloseAction === "sl") {
      goTo(STEPS.SL_HIT_WARNING, { clearHistory: true });
      return;
    }

    goTo(STEPS.TARGET_HIT);
  }

  function closeSession(kind) {
    setSessionClosedKind(kind);
    setPendingCloseAction(null);
    goTo(STEPS.SESSION_CLOSED, { clearHistory: true });
  }

  return (
    <main className={`app-shell tone-${screen.tone || "default"}`}>
      <div className="phone-frame">
        <header className="top-bar" aria-label="Session controls">
          {canGoBack ? (
            <button className="top-control" type="button" onClick={goBack}>
              Back
            </button>
          ) : (
            <span className="top-control-placeholder" />
          )}

          <span className="app-kicker">Live Trading Discipline Assistant</span>

          {canReset ? (
            <button
              className={`top-control reset-control ${
                restartArmed ? "armed" : ""
              }`}
              type="button"
              onClick={requestRestart}
            >
              {restartArmed ? "Confirm" : "Reset"}
            </button>
          ) : (
            <span className="top-control-placeholder" />
          )}
        </header>

        <section className="screen-shell" key={step}>
          {step === STEPS.WELCOME && (
            <StepScreen
              title="Reminder: Fuck The Idea of Brokerage Donation."
              tone="danger"
              actions={[
                {
                  label: "Start Session",
                  onClick: startChecklist,
                  variant: "primary",
                },
              ]}
            />
          )}

          {step === STEPS.CHOOSE_STRONG_LINE_TYPE && (
            <StepScreen
              eyebrow="TradingView check"
              title="Any today's line visible near entry?"
              actions={[
                {
                  label: "Strong Low",
                  onClick: () => chooseStrongLine("long"),
                  variant: "success",
                },
                {
                  label: "Strong High",
                  onClick: () => chooseStrongLine("short"),
                  variant: "danger",
                },
              ]}
            />
          )}

          {screen.type === "action" && (
            <StepScreen
              eyebrow={screen.eyebrow}
              title={screen.title}
              detail={screen.detail}
              tone={screen.tone}
              actions={[
                {
                  label: screen.buttonLabel,
                  onClick: () =>
                    goTo(screen.next, {
                      clearHistory: screen.clearHistory,
                    }),
                  variant: screen.buttonVariant || "primary",
                },
              ]}
            />
          )}

          {screen.type === "decision" && (
            <StepScreen
              eyebrow={screen.eyebrow}
              title={screen.title}
              detail={screen.detail}
              tone={screen.tone}
              actions={[
                {
                  label: "Yes",
                  onClick: () => goTo(screen.yes),
                  variant: screen.yesVariant || "primary",
                },
                {
                  label: "No",
                  onClick: () => showNextSymbol(screen.noMessage),
                  variant: screen.noVariant || "secondary",
                },
              ]}
            />
          )}

          {screen.type === "next-symbol" && (
            <StepScreen
              eyebrow={screen.eyebrow}
              title={screen.title}
              tone={screen.tone}
              actions={[
                {
                  label: "Next Symbol",
                  onClick: startNextSymbol,
                  variant: screen.buttonVariant || "primary",
                },
              ]}
            />
          )}

          {screen.type === "remove-order-reminder" && (
            <StepScreen
              eyebrow="Order check"
              title="Remove, if any active Order/ ATO"
              tone="danger"
              actions={[
                {
                  label: "Done",
                  onClick: completeActiveOrderReminder,
                  variant: "danger",
                },
              ]}
            />
          )}

          {screen.type === "target-hit" && (
            <StepScreen
              eyebrow="Target"
              title="Target hit. Good. Take the win and stay disciplined."
              detail="Do you want to check another setup?"
              tone="success"
              actions={[
                {
                  label: "Yes, restart",
                  onClick: startNextSymbol,
                  variant: "success",
                },
                {
                  label: "No, end session",
                  onClick: () => closeSession("noDonation"),
                  variant: "secondary",
                },
              ]}
            />
          )}

          {screen.type === "session-closed" && (
            <StepScreen
              eyebrow="Session closed"
              title={screen.title}
              tone="success"
              actions={[
                {
                  label: "Start New Session",
                  onClick: resetSession,
                  variant: "secondary",
                },
              ]}
            />
          )}

          {screen.type === "calculator" && (
            <CalculatorScreen
              tradeDirection={tradeDirection}
              values={calculatorValues}
              prices={prices}
              onChange={updateCalculatorValue}
              onTargetHit={handleTargetHit}
              onSlHit={handleSlHit}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function getScreen(step, tradeDirection, sessionClosedKind, nextSymbolMessage) {
  const screens = {
    [STEPS.WELCOME]: {
      type: "welcome",
      tone: "danger",
    },
    [STEPS.OPEN_TRADINGVIEW]: {
      type: "action",
      eyebrow: "TradingView",
      title: "Open TradingView",
      buttonLabel: "Done",
      next: STEPS.ONE_MIN_TIMEFRAME,
    },
    [STEPS.ONE_MIN_TIMEFRAME]: {
      type: "action",
      eyebrow: "Timeframe",
      title: "1 minute timeframe",
      buttonLabel: "Done",
      next: STEPS.CHOOSE_STRONG_LINE_TYPE,
    },
    [STEPS.CHOOSE_STRONG_LINE_TYPE]: {
      type: "choice",
    },
    [STEPS.CHECK_ZERO_VOLUME_CANDLE]: {
      type: "decision",
      eyebrow: "Candle check",
      title: "There was no zero-volume candle today?",
      yes: STEPS.CHECK_ROUGH_BAR_CANDLES,
      noMessage: NEXT_SYMBOL_MESSAGES.doNotEnter,
      noVariant: "danger",
    },
    [STEPS.CHECK_ROUGH_BAR_CANDLES]: {
      type: "decision",
      eyebrow: "Candle check",
      title: "No rough bar like candles?",
      yes: STEPS.CHECK_STRETCHED_WICK_CANDLES,
      noMessage: NEXT_SYMBOL_MESSAGES.doNotEnter,
      noVariant: "danger",
    },
    [STEPS.CHECK_STRETCHED_WICK_CANDLES]: {
      type: "decision",
      eyebrow: "Candle check",
      title: "No stretched-wick candles?",
      yes: STEPS.OPEN_ZERODHA,
      noMessage: NEXT_SYMBOL_MESSAGES.doNotEnter,
      noVariant: "danger",
    },
    [STEPS.OPEN_ZERODHA]: {
      type: "action",
      eyebrow: "Zerodha",
      title: "Open Zerodha",
      buttonLabel: "Done",
      next: STEPS.SEARCH_SYMBOL,
    },
    [STEPS.SEARCH_SYMBOL]: {
      type: "action",
      eyebrow: "Zerodha",
      title: "Search symbol",
      buttonLabel: "Done",
      next: STEPS.ASK_BLESSINGS_RECEIVED,
    },
    [STEPS.ASK_BLESSINGS_RECEIVED]: {
      type: "decision",
      eyebrow: "Zerodha",
      title: "Blessings received?",
      yes: STEPS.ASK_BLUE_BLACK_MOVEMENT,
      noMessage: NEXT_SYMBOL_MESSAGES.viewNext,
    },
    [STEPS.ASK_BLUE_BLACK_MOVEMENT]: {
      type: "decision",
      eyebrow: "Zerodha",
      title: "Proper Blue/Black movement done?",
      yes: STEPS.REMIND_SL,
      noMessage: NEXT_SYMBOL_MESSAGES.doNotEnter,
      noVariant: "danger",
    },
    [STEPS.REMIND_SL]: {
      type: "action",
      eyebrow: "Risk lock",
      title:
        tradeDirection === "short"
          ? "Before entering: Put SL above that strong high line."
          : "Before entering: Put SL below that strong low line.",
      tone: "danger",
      buttonLabel: "I placed SL mentally / noted it",
      buttonVariant: "danger",
      next: STEPS.ENTER_TRADE,
    },
    [STEPS.ENTER_TRADE]: {
      type: "action",
      eyebrow: "Entry",
      title: "Enter trade",
      buttonLabel: "I am entering",
      next: STEPS.CALCULATOR,
    },
    [STEPS.CALCULATOR]: {
      type: "calculator",
      tone: "default",
    },
    [STEPS.REMOVE_ACTIVE_ORDER_REMINDER]: {
      type: "remove-order-reminder",
      tone: "danger",
    },
    [STEPS.TARGET_HIT]: {
      type: "target-hit",
      tone: "success",
    },
    [STEPS.SL_HIT_WARNING]: {
      type: "action",
      eyebrow: "Stop",
      title:
        "Close your fist as tightly as you can.\nFeel the anger.\nBut control your ass off.\n\nShut your day down.\n\nNo more trading means no more trading.",
      tone: "danger",
      buttonLabel: "I accept. Shut day down.",
      buttonVariant: "danger",
      next: STEPS.DIARY_REMINDER,
      clearHistory: true,
    },
    [STEPS.DIARY_REMINDER]: {
      type: "action",
      eyebrow: "Diary",
      title:
        "Go and mark another day where you won this battle in your diary.\n\nA no means no.\n\nOvertrading means over-donation to the market.\n\nCome fresh tomorrow.",
      tone: "danger",
      buttonLabel: "End Session",
      buttonVariant: "danger",
      next: STEPS.SESSION_CLOSED,
      clearHistory: true,
    },
    [STEPS.SESSION_CLOSED]: {
      type: "session-closed",
      title:
        sessionClosedKind === "noDonation"
          ? "Session ended. No extra donation to the market."
          : "Session closed. You protected yourself today.",
      tone: "success",
    },
    [STEPS.DO_NOT_ENTER_NEXT_SYMBOL]: {
      type: "next-symbol",
      eyebrow:
        nextSymbolMessage === NEXT_SYMBOL_MESSAGES.viewNext
          ? "Next setup"
          : "Stop",
      title: nextSymbolMessage,
      tone:
        nextSymbolMessage === NEXT_SYMBOL_MESSAGES.viewNext
          ? "default"
          : "danger",
      buttonVariant:
        nextSymbolMessage === NEXT_SYMBOL_MESSAGES.viewNext
          ? "primary"
          : "danger",
    },
  };

  return screens[step] || screens[STEPS.OPEN_TRADINGVIEW];
}

function StepScreen({ eyebrow, title, detail, tone = "default", actions }) {
  return (
    <div className={`step-card card-${tone}`}>
      <div className="step-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="step-title" aria-live="polite">
          {title.split("\n").map((line, index) =>
            line ? (
              <span key={`${line}-${index}`}>
                {line}
                <br />
              </span>
            ) : (
              <span className="line-break" key={`break-${index}`} />
            ),
          )}
        </h1>
        {detail && <p className="step-detail">{detail}</p>}
      </div>

      <div className="action-stack">
        {actions.map((action) => (
          <button
            className={`action-button button-${action.variant || "primary"}`}
            key={action.label}
            type="button"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CalculatorScreen({
  tradeDirection,
  values,
  prices,
  onChange,
  onTargetHit,
  onSlHit,
}) {
  const modeLabel = getTradeModeLabel(tradeDirection);

  return (
    <div className="calculator-card">
      <div className="calculator-head">
        <p className={`calculator-mode mode-${tradeDirection || "long"}`}>
          Calculator Mode: {modeLabel}
        </p>
        <p className="eyebrow">Target calculator</p>
        <h1 className="calculator-title">Trade levels</h1>
      </div>

      <div className="input-grid">
        <NumberInput
          label="Entry Price"
          value={values.entryPrice}
          onChange={(value) => onChange("entryPrice", value)}
          placeholder="0.00"
        />
        <NumberInput
          label="Quantity"
          value={values.quantity}
          onChange={(value) => onChange("quantity", value)}
          placeholder="0"
        />
        <NumberInput
          label="Target 1 Profit Amount"
          value={values.target1Amount}
          onChange={(value) => onChange("target1Amount", value)}
          placeholder="50"
        />
        <NumberInput
          label="Target 2 Profit Amount"
          value={values.target2Amount}
          onChange={(value) => onChange("target2Amount", value)}
          placeholder="100"
        />
        <NumberInput
          label="Max Risk Amount"
          value={values.maxRiskAmount}
          onChange={(value) => onChange("maxRiskAmount", value)}
          placeholder="50"
        />
      </div>

      <div className="price-grid" aria-live="polite">
        <PriceCard
          label="Target 1 Price"
          value={formatPrice(prices?.target1Price)}
        />
        <PriceCard
          label="Target 2 Price"
          value={formatPrice(prices?.target2Price)}
        />
        <PriceCard
          label="Stop Loss Price"
          value={formatPrice(prices?.stopLossPrice)}
          danger
        />
      </div>

      <div className="calculator-actions">
        <button
          className="action-button button-success"
          type="button"
          onClick={onTargetHit}
        >
          Target Hit
        </button>
        <button
          className="action-button button-danger"
          type="button"
          onClick={onSlHit}
        >
          SL Hit
        </button>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, placeholder }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function PriceCard({ label, value, danger = false }) {
  return (
    <div className={`price-card ${danger ? "price-danger" : "price-target"}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
