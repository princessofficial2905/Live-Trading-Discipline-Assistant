import { useMemo, useState } from "react";

const STEPS = {
  WELCOME: "WELCOME",
  OPEN_TRADINGVIEW: "OPEN_TRADINGVIEW",
  ONE_MIN_TIMEFRAME: "ONE_MIN_TIMEFRAME",
  ASK_STRONG_LOW_VISIBLE: "ASK_STRONG_LOW_VISIBLE",
  OPEN_ZERODHA_FROM_TV: "OPEN_ZERODHA_FROM_TV",
  SEARCH_SYMBOL: "SEARCH_SYMBOL",
  ASK_BLESSINGS_RECEIVED: "ASK_BLESSINGS_RECEIVED",
  ASK_BLUE_BLACK_MOVEMENT_TV_PATH: "ASK_BLUE_BLACK_MOVEMENT_TV_PATH",
  DO_NOT_ENTER_NEXT_TV: "DO_NOT_ENTER_NEXT_TV",
  VIEW_NEXT_SYMBOL_TV: "VIEW_NEXT_SYMBOL_TV",
  OPEN_ZERODHA_DIRECT: "OPEN_ZERODHA_DIRECT",
  SCROLL_LINGER: "SCROLL_LINGER",
  ASK_ANY_SYMBOL_BLESSINGS: "ASK_ANY_SYMBOL_BLESSINGS",
  ASK_BLUE_BLACK_MOVEMENT_ZERODHA_PATH: "ASK_BLUE_BLACK_MOVEMENT_ZERODHA_PATH",
  OPEN_TRADINGVIEW_AFTER_ZERODHA: "OPEN_TRADINGVIEW_AFTER_ZERODHA",
  ASK_VISIBLE_STRONG_LOW_AFTER_ZERODHA:
    "ASK_VISIBLE_STRONG_LOW_AFTER_ZERODHA",
  ZERODHA_NEXT_SYMBOL: "ZERODHA_NEXT_SYMBOL",
  ASK_ZERODHA_LINGERING_ENDED: "ASK_ZERODHA_LINGERING_ENDED",
  START_AGAIN_FROM_WATCHLIST: "START_AGAIN_FROM_WATCHLIST",
  REMIND_SL: "REMIND_SL",
  ENTER_TRADE: "ENTER_TRADE",
  CALCULATOR: "CALCULATOR",
  TARGET_HIT: "TARGET_HIT",
  SESSION_ENDED_NO_DONATION: "SESSION_ENDED_NO_DONATION",
  SL_HIT_WARNING: "SL_HIT_WARNING",
  DIARY_REMINDER: "DIARY_REMINDER",
  SESSION_CLOSED_PROTECTED: "SESSION_CLOSED_PROTECTED",
};

const initialCalculator = {
  entryPrice: "",
  quantity: "",
  target1Amount: "50",
  target2Amount: "100",
  maxRiskAmount: "50",
};

const tradeMode = "long";

function calculateTradePrices(values, mode = tradeMode) {
  const entryPrice = Number(values.entryPrice);
  const quantity = Number(values.quantity);
  const target1Amount = Number(values.target1Amount);
  const target2Amount = Number(values.target2Amount);
  const maxRiskAmount = Number(values.maxRiskAmount);

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

  const direction = mode === "short" ? -1 : 1;

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
  const decimals = absoluteValue > 0 && absoluteValue < 0.01 ? 6 : absoluteValue < 1 ? 4 : 2;

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function App() {
  const [step, setStep] = useState(STEPS.WELCOME);
  const [history, setHistory] = useState([]);
  const [restartArmed, setRestartArmed] = useState(false);
  const [calculatorValues, setCalculatorValues] = useState(initialCalculator);

  const screen = useMemo(() => getScreen(step), [step]);
  const prices = useMemo(
    () => calculateTradePrices(calculatorValues),
    [calculatorValues],
  );

  const canGoBack =
    history.length > 0 &&
    ![
      STEPS.WELCOME,
      STEPS.SL_HIT_WARNING,
      STEPS.DIARY_REMINDER,
      STEPS.SESSION_CLOSED_PROTECTED,
    ].includes(step);

  const canReset =
    ![
      STEPS.WELCOME,
      STEPS.SL_HIT_WARNING,
      STEPS.DIARY_REMINDER,
      STEPS.SESSION_CLOSED_PROTECTED,
    ].includes(step);

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
    setCalculatorValues(initialCalculator);
    goTo(STEPS.OPEN_TRADINGVIEW, { clearHistory: true });
  }

  function updateCalculatorValue(field, value) {
    setCalculatorValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
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
              className={`top-control reset-control ${restartArmed ? "armed" : ""}`}
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
              eyebrow="Session start"
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
                  onClick: () => goTo(screen.no),
                  variant: screen.noVariant || "secondary",
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
                  onClick: () =>
                    goTo(STEPS.OPEN_TRADINGVIEW, { clearHistory: true }),
                  variant: "success",
                },
                {
                  label: "No, end session",
                  onClick: () => goTo(STEPS.SESSION_ENDED_NO_DONATION),
                  variant: "secondary",
                },
              ]}
            />
          )}

          {screen.type === "calculator" && (
            <CalculatorScreen
              values={calculatorValues}
              prices={prices}
              onChange={updateCalculatorValue}
              onTargetHit={() => goTo(STEPS.TARGET_HIT)}
              onSlHit={() => goTo(STEPS.SL_HIT_WARNING)}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function getScreen(step) {
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
      next: STEPS.ASK_STRONG_LOW_VISIBLE,
    },
    [STEPS.ASK_STRONG_LOW_VISIBLE]: {
      type: "decision",
      eyebrow: "TradingView check",
      title: "Any today's strong low visible near entry?",
      detail:
        "Today a new strong line is made and is clearly visible and too near from our entry point.",
      yes: STEPS.OPEN_ZERODHA_FROM_TV,
      no: STEPS.OPEN_ZERODHA_DIRECT,
    },
    [STEPS.OPEN_ZERODHA_FROM_TV]: {
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
      title: "Blessing tooked?",
      detail: "Blessings received?",
      yes: STEPS.ASK_BLUE_BLACK_MOVEMENT_TV_PATH,
      no: STEPS.VIEW_NEXT_SYMBOL_TV,
    },
    [STEPS.ASK_BLUE_BLACK_MOVEMENT_TV_PATH]: {
      type: "decision",
      eyebrow: "Zerodha",
      title: "Proper Blue/Black movement done?",
      yes: STEPS.REMIND_SL,
      no: STEPS.DO_NOT_ENTER_NEXT_TV,
      noVariant: "danger",
    },
    [STEPS.DO_NOT_ENTER_NEXT_TV]: {
      type: "action",
      eyebrow: "Stop",
      title: "Do not enter. View next symbol in TradingView.",
      tone: "danger",
      buttonLabel: "Next Symbol",
      buttonVariant: "danger",
      next: STEPS.OPEN_TRADINGVIEW,
    },
    [STEPS.VIEW_NEXT_SYMBOL_TV]: {
      type: "action",
      eyebrow: "Next setup",
      title: "View next symbol in TradingView.",
      buttonLabel: "Next Symbol",
      next: STEPS.OPEN_TRADINGVIEW,
    },
    [STEPS.OPEN_ZERODHA_DIRECT]: {
      type: "action",
      eyebrow: "Zerodha",
      title: "Open Zerodha",
      buttonLabel: "Done",
      next: STEPS.SCROLL_LINGER,
    },
    [STEPS.SCROLL_LINGER]: {
      type: "action",
      eyebrow: "Zerodha",
      title: "Scroll and linger on",
      buttonLabel: "Done",
      next: STEPS.ASK_ANY_SYMBOL_BLESSINGS,
    },
    [STEPS.ASK_ANY_SYMBOL_BLESSINGS]: {
      type: "decision",
      eyebrow: "Zerodha",
      title: "Any symbol received blessings?",
      yes: STEPS.ASK_BLUE_BLACK_MOVEMENT_ZERODHA_PATH,
      no: STEPS.ASK_ZERODHA_LINGERING_ENDED,
    },
    [STEPS.ASK_BLUE_BLACK_MOVEMENT_ZERODHA_PATH]: {
      type: "decision",
      eyebrow: "Zerodha",
      title: "Proper Blue/Black movement done?",
      yes: STEPS.OPEN_TRADINGVIEW_AFTER_ZERODHA,
      no: STEPS.ZERODHA_NEXT_SYMBOL,
      noVariant: "danger",
    },
    [STEPS.OPEN_TRADINGVIEW_AFTER_ZERODHA]: {
      type: "action",
      eyebrow: "TradingView",
      title: "Open TradingView",
      buttonLabel: "Done",
      next: STEPS.ASK_VISIBLE_STRONG_LOW_AFTER_ZERODHA,
    },
    [STEPS.ASK_VISIBLE_STRONG_LOW_AFTER_ZERODHA]: {
      type: "decision",
      eyebrow: "TradingView check",
      title: "Visible strong low nearest line?",
      detail:
        "Today a new strong line is made and is clearly visible and too near from our entry point.",
      yes: STEPS.REMIND_SL,
      no: STEPS.ZERODHA_NEXT_SYMBOL,
      noVariant: "danger",
    },
    [STEPS.ZERODHA_NEXT_SYMBOL]: {
      type: "action",
      eyebrow: "Zerodha",
      title: "Back to next symbol in Zerodha.",
      buttonLabel: "Next Zerodha Symbol",
      next: STEPS.SCROLL_LINGER,
    },
    [STEPS.ASK_ZERODHA_LINGERING_ENDED]: {
      type: "decision",
      eyebrow: "Zerodha",
      title: "Zerodha lingering ended?",
      yes: STEPS.START_AGAIN_FROM_WATCHLIST,
      no: STEPS.SCROLL_LINGER,
    },
    [STEPS.START_AGAIN_FROM_WATCHLIST]: {
      type: "action",
      eyebrow: "Watchlist",
      title: "Start again from TradingView watchlist.",
      buttonLabel: "Restart Watchlist",
      next: STEPS.OPEN_TRADINGVIEW,
    },
    [STEPS.REMIND_SL]: {
      type: "action",
      eyebrow: "Risk lock",
      title: "Before entering: Put SL below that strong low line.",
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
    [STEPS.TARGET_HIT]: {
      type: "target-hit",
      tone: "success",
    },
    [STEPS.SESSION_ENDED_NO_DONATION]: {
      type: "action",
      eyebrow: "Session closed",
      title: "Session ended. No extra donation to the market.",
      tone: "success",
      buttonLabel: "Start New Session",
      buttonVariant: "secondary",
      next: STEPS.WELCOME,
      clearHistory: true,
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
    },
    [STEPS.DIARY_REMINDER]: {
      type: "action",
      eyebrow: "Diary",
      title:
        "Go and mark another day where you won this battle in your diary.\n\nA no means no.\n\nOvertrading means over-donation to the market.\n\nCome fresh tomorrow.",
      tone: "danger",
      buttonLabel: "End Session",
      buttonVariant: "danger",
      next: STEPS.SESSION_CLOSED_PROTECTED,
    },
    [STEPS.SESSION_CLOSED_PROTECTED]: {
      type: "action",
      eyebrow: "Session closed",
      title: "Session closed. You protected yourself today.",
      tone: "success",
      buttonLabel: "Start New Session",
      buttonVariant: "secondary",
      next: STEPS.WELCOME,
      clearHistory: true,
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
  values,
  prices,
  onChange,
  onTargetHit,
  onSlHit,
}) {
  return (
    <div className="calculator-card">
      <div className="calculator-head">
        <p className="eyebrow">Target calculator</p>
        <h1 className="calculator-title">Long trade levels</h1>
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
        <PriceCard label="Target 1 Price" value={formatPrice(prices?.target1Price)} />
        <PriceCard label="Target 2 Price" value={formatPrice(prices?.target2Price)} />
        <PriceCard label="Stop Loss Price" value={formatPrice(prices?.stopLossPrice)} danger />
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
    <div className={`price-card ${danger ? "price-danger" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
