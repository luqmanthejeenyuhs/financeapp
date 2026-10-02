"use client";

import { useEffect, useState } from "react";

type Entry = {
  id: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  reason: string | null;
  metadata: string | null;
  createdAt: string;
};

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-log")
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium">Audit log</h1>
      <p className="mt-1 max-w-lg text-sm text-muted">
        Every admin action and every automated risk-engine decision, in order. This log is append-only — nothing in
        the app can edit or delete an entry once it's written. Showing the most recent 500.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nothing logged yet.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {entries.map((e) => (
            <div key={e.id} className="rounded-sm border rule bg-panel px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-brass-bright">{e.action}</span>
                <span className="text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-muted">
                {e.actorName} <span className="text-faint">({e.actorRole})</span>
                {e.targetType && (
                  <>
                    {" "}
                    → {e.targetType}
                    {e.targetId ? ` #${e.targetId.slice(0, 8)}` : ""}
                  </>
                )}
              </div>
              {e.reason && <div className="mt-1 text-xs text-muted">Reason: {e.reason}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
