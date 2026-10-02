"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: string;
};

export default function WalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((data) => setTransactions(data.transactions ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount: parseFloat(amount), currency: "USD" }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Couldn't submit that request.");
      return;
    }

    setAmount("");
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium">Wallet</h1>
      <p className="mt-1 max-w-lg text-sm text-muted">
        Most requests clear automatically. Anything unusual is routed to our team for a quick review — see the note
        below.
      </p>

      <div className="mt-4 max-w-lg rounded-sm border border-brass/40 bg-brass/10 p-4 text-xs leading-relaxed text-brass-bright">
        No live payment processor is connected yet, so nothing here moves real money regardless of status — replace{" "}
        <code className="font-mono">lib/payments/provider.ts</code> with a real processor before accepting live
        client funds. Requests within the standard daily limits are marked COMPLETED immediately by the risk
        engine; larger or unusual requests are held as PENDING for manual review.
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex max-w-lg flex-col gap-4 rounded-sm border rule bg-panel p-6">
        <div className="flex gap-2">
          {(["DEPOSIT", "WITHDRAWAL"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-sm px-4 py-2 text-sm transition ${
                type === t ? "bg-brass text-ink" : "bg-line text-muted hover:text-paper"
              }`}
            >
              {t === "DEPOSIT" ? "Deposit" : "Withdraw"}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted">Amount (USD)</span>
          <input
            type="number"
            min={1}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-sm border rule bg-ink px-3 py-2 font-mono text-paper outline-none focus-visible:border-brass"
          />
        </label>

        {error && <p className="text-sm text-fall">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
        >
          {submitting ? "Submitting…" : `Request ${type === "DEPOSIT" ? "deposit" : "withdrawal"}`}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="font-display text-lg font-medium">History</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No transactions yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-sm border rule">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs uppercase tracking-widest2 text-faint">
                <tr>
                  <th className="px-4 py-3 font-normal">Type</th>
                  <th className="px-4 py-3 font-normal">Amount</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t rule font-mono">
                    <td className="px-4 py-3">{t.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}</td>
                    <td className="px-4 py-3 font-tabular">
                      {t.currency} {t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-sm px-2 py-0.5 text-xs ${
                          t.status === "COMPLETED" || t.status === "APPROVED"
                            ? "bg-rise/20 text-rise"
                            : t.status === "REJECTED"
                            ? "bg-fall/20 text-fall"
                            : "bg-line text-muted"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
