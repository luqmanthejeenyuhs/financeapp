"use client";

import { useEffect, useState } from "react";

type Settings = { maxDailyDeposit: number; maxDailyWithdrawal: number; highValueAlarmTier: number };

const FIELDS: { key: keyof Settings; label: string; help: string }[] = [
  {
    key: "maxDailyDeposit",
    label: "Max daily deposit",
    help: "Per-client, per-day. Requests over this go to the wallet review queue.",
  },
  {
    key: "maxDailyWithdrawal",
    label: "Max daily withdrawal",
    help: "Per-client, per-day. Requests over this go to the wallet review queue.",
  },
  {
    key: "highValueAlarmTier",
    label: "High-value alarm tier",
    help: "Any single request at or above this amount always goes to review, regardless of daily totals.",
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        setDraft(
          Object.fromEntries(Object.entries(data.settings).map(([k, v]) => [k, String(v)]))
        );
      });
  }, []);

  async function save() {
    setError(null);
    setMessage(null);
    const payload: Record<string, number> = {};
    for (const f of FIELDS) {
      const raw = draft[f.key];
      const num = Number(raw);
      if (!raw || Number.isNaN(num) || num <= 0) {
        setError(`${f.label} must be a positive number.`);
        return;
      }
      payload[f.key] = num;
    }

    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save settings.");
      return;
    }
    setSettings(data.settings);
    setMessage("Saved. These take effect immediately for every new request.");
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-medium">Risk settings</h1>
      <p className="mt-1 text-sm text-muted">
        These are the thresholds the autonomous risk engine uses to decide what auto-clears versus what lands in
        the wallet review queue. Individual clients can also get their own override on their user page.
      </p>

      {!settings ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium">{f.label}</label>
              <p className="mt-0.5 text-xs text-muted">{f.help}</p>
              <input
                type="number"
                min={1}
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                className="mt-2 w-48 rounded-sm border rule bg-ink px-3 py-2 text-sm text-paper outline-none focus-visible:border-brass"
              />
            </div>
          ))}

          {error && <p className="text-sm text-fall">{error}</p>}
          {message && <p className="text-sm text-rise">{message}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="w-fit rounded-sm bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}
    </div>
  );
}
