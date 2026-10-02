"use client";

import { useEffect, useState } from "react";

type Kyc = {
  status: "UNSUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  fullName?: string;
  rejectReason?: string;
} | null;

export default function KycPage() {
  const [kyc, setKyc] = useState<Kyc>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/kyc")
      .then((r) => r.json())
      .then((data) => setKyc(data.kyc))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/kyc", { method: "POST", body: formData });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Couldn't submit your verification.");
      return;
    }
    setKyc(data.kyc);
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-medium">Identity verification</h1>
      <p className="mt-1 text-sm text-muted">
        Required before you can connect a live broker account or move funds.
      </p>

      {kyc?.status === "PENDING" && (
        <div className="mt-6 rounded-sm border border-brass/40 bg-brass/10 p-4 text-sm text-brass-bright">
          Your documents are under review. We&rsquo;ll update this page once
          it&rsquo;s complete.
        </div>
      )}

      {kyc?.status === "APPROVED" && (
        <div className="mt-6 rounded-sm border border-rise/40 bg-rise/10 p-4 text-sm text-rise">
          Verified — you&rsquo;re all set to connect a broker account and
          deposit.
        </div>
      )}

      {kyc?.status === "REJECTED" && (
        <div className="mt-6 rounded-sm border border-fall/40 bg-fall/10 p-4 text-sm text-fall">
          Your last submission was rejected{kyc.rejectReason ? `: ${kyc.rejectReason}` : "."} Please resubmit below.
        </div>
      )}

      {(kyc?.status === "UNSUBMITTED" || kyc?.status === "REJECTED") && (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 rounded-sm border rule bg-panel p-6">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Full legal name</span>
            <input
              name="fullName"
              required
              className="rounded-sm border rule bg-ink px-3 py-2 text-paper outline-none focus-visible:border-brass"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Date of birth</span>
            <input
              type="date"
              name="dateOfBirth"
              required
              className="rounded-sm border rule bg-ink px-3 py-2 text-paper outline-none focus-visible:border-brass"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Country of residence</span>
            <input
              name="country"
              required
              className="rounded-sm border rule bg-ink px-3 py-2 text-paper outline-none focus-visible:border-brass"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Document type</span>
            <select
              name="documentType"
              required
              className="rounded-sm border rule bg-ink px-3 py-2 text-paper outline-none focus-visible:border-brass"
            >
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="drivers_license">Driver&rsquo;s license</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Upload document</span>
            <input
              type="file"
              name="document"
              accept="image/*,.pdf"
              required
              className="rounded-sm border rule bg-ink px-3 py-2 text-paper file:mr-3 file:rounded-sm file:border-0 file:bg-line file:px-3 file:py-1 file:text-paper"
            />
          </label>

          {error && <p className="text-sm text-fall">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 self-start rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </form>
      )}
    </div>
  );
}
