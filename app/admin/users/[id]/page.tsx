"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { can, ROLE_LABELS, type Role } from "@/lib/permissions";

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "soft_banned" | "banned";
  fundsFrozen: boolean;
  maxDailyDeposit: number | null;
  maxDailyWithdrawal: number | null;
  createdAt: string;
  kyc: { status: string; fullName: string | null; country: string | null; submittedAt: string } | null;
  brokerAccount: { environment: string; accountId: string; provider: string } | null;
  botSetting: { enabled: boolean; instrument: string; riskPercent: number; maxOpenTrades: number } | null;
  transactions: { id: string; type: string; amount: number; currency: string; status: string; createdAt: string }[];
  botTrades: { id: string; instrument: string; side: string; units: number; status: string; createdAt: string }[];
};

const STAFF_ROLE_OPTIONS: Role[] = ["CLIENT", "SUPPORT", "FINANCE", "COMPLIANCE", "SUPER_ADMIN"];

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const myRole = (session?.user?.role ?? "CLIENT") as Role;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [limits, setLimits] = useState({ maxDailyDeposit: "", maxDailyWithdrawal: "" });

  function load() {
    setLoading(true);
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user ?? null);
        if (data.user) {
          setLimits({
            maxDailyDeposit: data.user.maxDailyDeposit != null ? String(data.user.maxDailyDeposit) : "",
            maxDailyWithdrawal: data.user.maxDailyWithdrawal != null ? String(data.user.maxDailyWithdrawal) : "",
          });
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "That didn't work.");
      return false;
    }
    load();
    router.refresh();
    return true;
  }

  async function changeRole(nextRole: Role) {
    if (!confirm(`Change this user's role to ${ROLE_LABELS[nextRole]}?`)) return;
    await patch({ role: nextRole });
  }

  async function setStanding(status: "active" | "soft_banned" | "banned") {
    if (status !== "active" && !reason.trim()) {
      setError("Add a reason before applying a restriction.");
      return;
    }
    if (!confirm(`Set this account's status to "${status}"?`)) return;
    await patch({ status, standingReason: reason.trim() || undefined });
    setReason("");
  }

  async function toggleFreeze(next: boolean) {
    if (next && !reason.trim()) {
      setError("Add a reason before freezing funds.");
      return;
    }
    if (!confirm(next ? "Freeze this user's funds?" : "Unfreeze this user's funds?")) return;
    await patch({ fundsFrozen: next, standingReason: reason.trim() || undefined });
    setReason("");
  }

  async function saveLimits() {
    const body: Record<string, number | null> = {};
    body.maxDailyDeposit = limits.maxDailyDeposit.trim() === "" ? null : Number(limits.maxDailyDeposit);
    body.maxDailyWithdrawal = limits.maxDailyWithdrawal.trim() === "" ? null : Number(limits.maxDailyWithdrawal);
    await patch(body);
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) return <p className="text-sm text-fall">User not found.</p>;

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-muted hover:text-paper">
        ← All users
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-faint">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <div className="mb-2 text-xs uppercase tracking-widest2 text-faint">{ROLE_LABELS[user.role]}</div>
          {can.manageRoles(myRole) ? (
            <select
              value={user.role}
              onChange={(e) => changeRole(e.target.value as Role)}
              disabled={busy}
              className="rounded-sm border rule bg-ink px-3 py-2 text-sm text-paper outline-none focus-visible:border-brass disabled:opacity-60"
            >
              {STAFF_ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-fall">{error}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-sm border rule bg-panel p-5">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest2 text-faint">Verification</h2>
          {user.kyc ? (
            <div className="mt-3 space-y-1 text-sm">
              <div>Status: <span className="text-paper">{user.kyc.status}</span></div>
              <div>Name on file: {user.kyc.fullName ?? "—"}</div>
              <div>Country: {user.kyc.country ?? "—"}</div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Not submitted.</p>
          )}
        </div>

        <div className="rounded-sm border rule bg-panel p-5">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest2 text-faint">Broker account</h2>
          {user.brokerAccount ? (
            <div className="mt-3 space-y-1 text-sm">
              <div>Provider: {user.brokerAccount.provider}</div>
              <div>Environment: {user.brokerAccount.environment}</div>
              <div className="font-mono">{user.brokerAccount.accountId}</div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No broker account connected.</p>
          )}
        </div>

        <div className="rounded-sm border rule bg-panel p-5">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest2 text-faint">Trading bot</h2>
          {user.botSetting ? (
            <div className="mt-3 space-y-1 text-sm">
              <div>Status: {user.botSetting.enabled ? "Enabled" : "Off"}</div>
              <div>Instrument: {user.botSetting.instrument}</div>
              <div>Risk per trade: {user.botSetting.riskPercent}%</div>
              <div>Max open trades: {user.botSetting.maxOpenTrades}</div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Not configured.</p>
          )}
        </div>
      </div>

      {can.manageAccountStanding(myRole) && (
        <div className="mt-8 rounded-sm border rule bg-panel p-5">
          <h2 className="font-display text-lg font-medium">Account standing</h2>
          <p className="mt-1 text-sm text-muted">
            Soft ban blocks trading and withdrawals but the person can still log in and view their account. Hard ban
            blocks login entirely. Freezing funds blocks all deposits and withdrawals independent of ban status.
          </p>

          <input
            type="text"
            placeholder="Reason (required for restrictions, logged to the audit trail)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-4 w-full max-w-md rounded-sm border rule bg-ink px-3 py-2 text-sm text-paper outline-none focus-visible:border-brass"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setStanding("active")}
              disabled={busy || user.status === "active"}
              className="rounded-sm bg-rise/20 px-3 py-1.5 text-xs font-medium text-rise hover:bg-rise/30 disabled:opacity-40"
            >
              Set active
            </button>
            <button
              onClick={() => setStanding("soft_banned")}
              disabled={busy || user.status === "soft_banned"}
              className="rounded-sm bg-brass/20 px-3 py-1.5 text-xs font-medium text-brass-bright hover:bg-brass/30 disabled:opacity-40"
            >
              Soft-ban
            </button>
            <button
              onClick={() => setStanding("banned")}
              disabled={busy || user.status === "banned"}
              className="rounded-sm bg-fall/20 px-3 py-1.5 text-xs font-medium text-fall hover:bg-fall/30 disabled:opacity-40"
            >
              Hard-ban
            </button>
            <button
              onClick={() => toggleFreeze(!user.fundsFrozen)}
              disabled={busy}
              className="rounded-sm border rule px-3 py-1.5 text-xs font-medium text-muted hover:border-fall/50 hover:text-fall"
            >
              {user.fundsFrozen ? "Unfreeze funds" : "Freeze funds"}
            </button>
          </div>
        </div>
      )}

      {can.manageSettings(myRole) && (
        <div className="mt-8 rounded-sm border rule bg-panel p-5">
          <h2 className="font-display text-lg font-medium">Limit overrides</h2>
          <p className="mt-1 text-sm text-muted">
            Leave blank to use the global risk settings. Set a value to override for this client only — e.g. a
            trusted VIP with a higher daily withdrawal limit.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-muted">Max daily deposit</label>
              <input
                type="number"
                placeholder="Global default"
                value={limits.maxDailyDeposit}
                onChange={(e) => setLimits((l) => ({ ...l, maxDailyDeposit: e.target.value }))}
                className="mt-1 block w-40 rounded-sm border rule bg-ink px-3 py-2 text-sm text-paper outline-none focus-visible:border-brass"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Max daily withdrawal</label>
              <input
                type="number"
                placeholder="Global default"
                value={limits.maxDailyWithdrawal}
                onChange={(e) => setLimits((l) => ({ ...l, maxDailyWithdrawal: e.target.value }))}
                className="mt-1 block w-40 rounded-sm border rule bg-ink px-3 py-2 text-sm text-paper outline-none focus-visible:border-brass"
              />
            </div>
          </div>
          <button
            onClick={saveLimits}
            disabled={busy}
            className="mt-4 rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
          >
            Save overrides
          </button>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-lg font-medium">Wallet history</h2>
        {user.transactions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No transactions.</p>
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
                {user.transactions.map((t) => (
                  <tr key={t.id} className="border-t rule font-mono">
                    <td className="px-4 py-3">{t.type}</td>
                    <td className="px-4 py-3 font-tabular">
                      {t.currency} {t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{t.status}</td>
                    <td className="px-4 py-3 text-muted">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-medium">Recent bot trades</h2>
        {user.botTrades.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No bot activity.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-sm border rule">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs uppercase tracking-widest2 text-faint">
                <tr>
                  <th className="px-4 py-3 font-normal">Instrument</th>
                  <th className="px-4 py-3 font-normal">Side</th>
                  <th className="px-4 py-3 font-normal">Units</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {user.botTrades.map((t) => (
                  <tr key={t.id} className="border-t rule font-mono">
                    <td className="px-4 py-3">{t.instrument}</td>
                    <td className="px-4 py-3">{t.side}</td>
                    <td className="px-4 py-3 font-tabular">{t.units}</td>
                    <td className="px-4 py-3">{t.status}</td>
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
