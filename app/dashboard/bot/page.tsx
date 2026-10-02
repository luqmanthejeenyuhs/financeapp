"use client";

import { useEffect, useState } from "react";

type BotSetting = {
  enabled: boolean;
  strategy: string;
  instrument: string;
  riskPercent: number;
  maxOpenTrades: number;
};

type BotTrade = {
  id: string;
  instrument: string;
  side: string;
  units: number;
  reason: string;
  status: string;
  createdAt: string;
};

export default function BotPage() {
  const [setting, setSetting] = useState<BotSetting | null>(null);
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/bot")
      .then((r) => r.json())
      .then((data) => {
        setSetting(data.botSetting);
        setTrades(data.trades ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function updateSetting(patch: Partial<BotSetting>) {
    const res = await fetch("/api/bot", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) setSetting(data.botSetting);
  }

  async function runNow() {
    setRunning(true);
    setMessage(null);
    const res = await fetch("/api/bot", { method: "POST" });
    const data = await res.json();
    setRunning(false);

    if (!res.ok) {
      setMessage(data.error ?? "Bot run failed.");
      return;
    }
    setMessage(
      data.traded
        ? `Signal: ${data.signal} — order placed.`
        : `Signal: ${data.signal ?? "hold"} — no trade this cycle.`
    );
    load();
  }

  if (loading || !setting) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium">Trading bot</h1>
      <p className="mt-1 max-w-lg text-sm text-muted">
        A moving-average crossover strategy (10/30, hourly candles). It
        trades your connected OANDA account directly — start on Practice and
        watch a few cycles before ever pointing it at Live.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border rule bg-panel p-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-medium">Status</span>
            <button
              onClick={() => updateSetting({ enabled: !setting.enabled })}
              className={`rounded-sm px-4 py-1.5 text-sm font-medium transition ${
                setting.enabled ? "bg-rise/20 text-rise" : "bg-line text-muted"
              }`}
            >
              {setting.enabled ? "Active — turn off" : "Inactive — turn on"}
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-4 text-sm">
            <label className="flex flex-col gap-2">
              <span className="text-muted">Instrument</span>
              <select
                value={setting.instrument}
                onChange={(e) => updateSetting({ instrument: e.target.value })}
                className="rounded-sm border rule bg-ink px-3 py-2 text-paper outline-none focus-visible:border-brass"
              >
                <option value="EUR_USD">EUR/USD</option>
                <option value="GBP_USD">GBP/USD</option>
                <option value="USD_JPY">USD/JPY</option>
                <option value="XAU_USD">XAU/USD</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-muted">Risk per trade: {setting.riskPercent}%</span>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={setting.riskPercent}
                onChange={(e) => updateSetting({ riskPercent: parseFloat(e.target.value) })}
                className="accent-brass"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-muted">Max concurrent trades</span>
              <input
                type="number"
                min={1}
                max={10}
                value={setting.maxOpenTrades}
                onChange={(e) => updateSetting({ maxOpenTrades: parseInt(e.target.value, 10) || 1 })}
                className="rounded-sm border rule bg-ink px-3 py-2 text-paper outline-none focus-visible:border-brass"
              />
            </label>
          </div>

          <button
            onClick={runNow}
            disabled={running}
            className="mt-6 w-full rounded-sm border rule bg-line px-4 py-2 text-sm text-paper hover:bg-line/70 disabled:opacity-60"
          >
            {running ? "Checking market…" : "Run one cycle now"}
          </button>
          {message && <p className="mt-3 text-xs text-muted">{message}</p>}
        </div>

        <div className="rounded-sm border rule bg-panel p-6">
          <span className="font-display text-lg font-medium">Activity</span>
          {trades.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No trades yet — activity will show up here once the bot runs a cycle.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3 font-mono text-xs">
              {trades.map((t) => (
                <li key={t.id} className="border-t rule pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className={t.side === "buy" ? "text-rise" : "text-fall"}>
                      {t.side.toUpperCase()} {t.instrument}
                    </span>
                    <span className="text-faint">{t.status}</span>
                  </div>
                  <div className="mt-1 text-faint">{t.reason}</div>
                  <div className="mt-1 text-faint">{new Date(t.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
