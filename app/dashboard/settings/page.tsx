"use client";

import { useEffect, useState } from "react";

type BrokerAccount = { accountId: string; environment: string } | null;

export default function SettingsPage() {
  const [brokerAccount, setBrokerAccount] = useState<BrokerAccount>(null);
  const [accountId, setAccountId] = useState("");
  const [environment, setEnvironment] = useState<"practice" | "live">("practice");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/broker")
      .then((r) => r.json())
      .then((data) => {
        setBrokerAccount(data.brokerAccount);
        if (data.brokerAccount) {
          setAccountId(data.brokerAccount.accountId);
          setEnvironment(data.brokerAccount.environment);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const res = await fetch("/api/broker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, environment }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Couldn't save that.");
      return;
    }

    setBrokerAccount(data.brokerAccount);
    setMessage("Broker account connected.");
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-medium">Settings</h1>
      <p className="mt-1 text-sm text-muted">Connect the OANDA account the bot and dashboard should use.</p>

      {!loading && (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 rounded-sm border rule bg-panel p-6">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">OANDA account ID</span>
            <input
              required
              placeholder="101-011-1234567-001"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="rounded-sm border rule bg-ink px-3 py-2 font-mono text-paper outline-none focus-visible:border-brass"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Environment</span>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as "practice" | "live")}
              className="rounded-sm border rule bg-ink px-3 py-2 text-paper outline-none focus-visible:border-brass"
            >
              <option value="practice">Practice (recommended to start)</option>
              <option value="live">Live</option>
            </select>
          </label>

          <p className="text-xs text-faint">
            The API token used to talk to OANDA is a server-side environment
            variable (OANDA_API_TOKEN) shared across accounts — it&rsquo;s
            never sent to the browser. Only your account ID is stored here.
          </p>

          {error && <p className="text-sm text-fall">{error}</p>}
          {message && <p className="text-sm text-rise">{message}</p>}

          <button
            type="submit"
            className="mt-2 self-start rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            {brokerAccount ? "Update connection" : "Connect account"}
          </button>
        </form>
      )}
    </div>
  );
}
