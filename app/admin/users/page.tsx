"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  fundsFrozen: boolean;
  createdAt: string;
  kyc: { status: string } | null;
  brokerAccount: { environment: string } | null;
  botSetting: { enabled: boolean } | null;
  _count: { transactions: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
  }, [users, q]);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium">Users</h1>
      <p className="mt-1 text-sm text-muted">{users.length} total clients.</p>

      <input
        type="text"
        placeholder="Search by name or email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-4 w-full max-w-sm rounded-sm border rule bg-ink px-3 py-2 text-sm text-paper outline-none focus-visible:border-brass"
      />

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No matches.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-sm border rule">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-xs uppercase tracking-widest2 text-faint">
              <tr>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Role</th>
                <th className="px-4 py-3 font-normal">Standing</th>
                <th className="px-4 py-3 font-normal">Verification</th>
                <th className="px-4 py-3 font-normal">Broker</th>
                <th className="px-4 py-3 font-normal">Bot</th>
                <th className="px-4 py-3 font-normal">Transactions</th>
                <th className="px-4 py-3 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t rule hover:bg-line/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-brass-bright">
                      {u.name}
                    </Link>
                    <div className="text-xs text-muted">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "CLIENT" ? (
                      <span className="text-muted">Client</span>
                    ) : (
                      <span className="rounded-sm bg-brass/20 px-2 py-0.5 text-xs text-brass-bright">{u.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.status === "active" && !u.fundsFrozen && <span className="text-muted">Active</span>}
                    {u.status === "soft_banned" && (
                      <span className="rounded-sm bg-brass/20 px-2 py-0.5 text-xs text-brass-bright">Soft-banned</span>
                    )}
                    {u.status === "banned" && (
                      <span className="rounded-sm bg-fall/20 px-2 py-0.5 text-xs text-fall">Banned</span>
                    )}
                    {u.fundsFrozen && (
                      <span className="ml-1 rounded-sm bg-fall/20 px-2 py-0.5 text-xs text-fall">Frozen</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{u.kyc?.status ?? "UNSUBMITTED"}</td>
                  <td className="px-4 py-3 text-muted">{u.brokerAccount ? u.brokerAccount.environment : "—"}</td>
                  <td className="px-4 py-3 text-muted">{u.botSetting?.enabled ? "Enabled" : "Off"}</td>
                  <td className="px-4 py-3 font-mono font-tabular">{u._count.transactions}</td>
                  <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
