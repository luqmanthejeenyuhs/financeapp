"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  method: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

const STATUS_CLASS: Record<string, string> = {
  APPROVED: "bg-brass/20 text-brass-bright",
  COMPLETED: "bg-rise/20 text-rise",
  REJECTED: "bg-fall/20 text-fall",
  PENDING: "bg-line text-muted",
};

export default function AdminWalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/wallet")
      .then((r) => r.json())
      .then((data) => setTransactions(data.transactions ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id: string, status: "APPROVED" | "REJECTED" | "COMPLETED") {
    setError(null);
    setBusyId(id);
    const res = await fetch(`/api/admin/wallet/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Couldn't update that request.");
      return;
    }
    load();
  }

  const visible = transactions.filter((t) => (filter === "PENDING" ? t.status === "PENDING" : true));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium">Wallet requests</h1>
          <p className="mt-1 max-w-lg text-sm text-muted">
            No payment processor is connected — these are manual bank-transfer requests. Approve once you've
            confirmed the transfer, then mark it completed once funds have actually moved.
          </p>
        </div>
        <div className="flex gap-2">
          {(["PENDING", "ALL"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-sm px-3 py-1.5 text-xs uppercase tracking-widest2 transition ${
                filter === f ? "bg-brass text-ink" : "bg-line text-muted hover:text-paper"
              }`}
            >
              {f === "PENDING" ? "Pending only" : "All"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-fall">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nothing here right now.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-sm border rule">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-xs uppercase tracking-widest2 text-faint">
              <tr>
                <th className="px-4 py-3 font-normal">Client</th>
                <th className="px-4 py-3 font-normal">Type</th>
                <th className="px-4 py-3 font-normal">Amount</th>
                <th className="px-4 py-3 font-normal">Method</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Requested</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} className="border-t rule align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.user.name}</div>
                    <div className="text-xs text-muted">{t.user.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">{t.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}</td>
                  <td className="px-4 py-3 font-mono font-tabular">
                    {t.currency} {t.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {t.method}
                    {t.note && (
                      <div className="mt-1 max-w-xs text-xs text-brass-bright">{t.note}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-sm px-2 py-0.5 text-xs ${STATUS_CLASS[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {t.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => act(t.id, "APPROVED")}
                            disabled={busyId === t.id}
                            className="rounded-sm bg-brass/20 px-3 py-1.5 text-xs font-medium text-brass-bright hover:bg-brass/30 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => act(t.id, "REJECTED")}
                            disabled={busyId === t.id}
                            className="rounded-sm bg-fall/20 px-3 py-1.5 text-xs font-medium text-fall hover:bg-fall/30 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {t.status === "APPROVED" && (
                        <button
                          onClick={() => act(t.id, "COMPLETED")}
                          disabled={busyId === t.id}
                          className="rounded-sm bg-rise/20 px-3 py-1.5 text-xs font-medium text-rise hover:bg-rise/30 disabled:opacity-60"
                        >
                          Mark completed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
