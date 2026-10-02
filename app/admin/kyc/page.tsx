"use client";

import { useEffect, useState } from "react";

type Submission = {
  id: string;
  status: "UNSUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  fullName: string | null;
  dateOfBirth: string | null;
  country: string | null;
  documentType: string | null;
  documentPath: string | null;
  rejectReason: string | null;
  submittedAt: string;
  user: { id: string; name: string; email: string };
};

const STATUS_CLASS: Record<string, string> = {
  APPROVED: "bg-rise/20 text-rise",
  REJECTED: "bg-fall/20 text-fall",
  PENDING: "bg-brass/20 text-brass-bright",
  UNSUBMITTED: "bg-line text-muted",
};

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/kyc")
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id: string, status: "APPROVED" | "REJECTED") {
    setError(null);
    const rejectReason = rejectDraft[id]?.trim();
    if (status === "REJECTED" && !rejectReason) {
      setError("Add a reason before rejecting.");
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/kyc/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectReason }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Couldn't update that submission.");
      return;
    }
    load();
  }

  const visible = submissions.filter((s) => (filter === "PENDING" ? s.status === "PENDING" : true));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium">Verification queue</h1>
          <p className="mt-1 text-sm text-muted">Review submitted documents and approve or reject each client.</p>
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
        <div className="mt-6 flex flex-col gap-4">
          {visible.map((s) => (
            <div key={s.id} className="rounded-sm border rule bg-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{s.user.name}</div>
                  <div className="text-sm text-muted">{s.user.email}</div>
                </div>
                <span className={`rounded-sm px-2 py-0.5 text-xs ${STATUS_CLASS[s.status]}`}>{s.status}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-widest2 text-faint">Full name</div>
                  <div className="mt-1">{s.fullName ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest2 text-faint">Date of birth</div>
                  <div className="mt-1">{s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest2 text-faint">Country</div>
                  <div className="mt-1">{s.country ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest2 text-faint">Document type</div>
                  <div className="mt-1">{s.documentType ?? "—"}</div>
                </div>
              </div>

              {s.documentPath && (
                <a
                  href={`/api/admin/kyc/${s.id}/document`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm text-brass hover:text-brass-bright"
                >
                  View uploaded document ↗
                </a>
              )}

              {s.status === "REJECTED" && s.rejectReason && (
                <p className="mt-3 text-sm text-fall">Rejected: {s.rejectReason}</p>
              )}

              {s.status === "PENDING" && (
                <div className="mt-5 flex flex-col gap-3 border-t rule pt-4 md:flex-row md:items-center">
                  <input
                    type="text"
                    placeholder="Reason (required if rejecting)"
                    value={rejectDraft[s.id] ?? ""}
                    onChange={(e) => setRejectDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                    className="flex-1 rounded-sm border rule bg-ink px-3 py-2 text-sm text-paper outline-none focus-visible:border-brass"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(s.id, "APPROVED")}
                      disabled={busyId === s.id}
                      className="rounded-sm bg-rise/20 px-4 py-2 text-sm font-medium text-rise hover:bg-rise/30 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => act(s.id, "REJECTED")}
                      disabled={busyId === s.id}
                      className="rounded-sm bg-fall/20 px-4 py-2 text-sm font-medium text-fall hover:bg-fall/30 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
