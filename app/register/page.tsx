"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard/kyc");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-lg font-medium tracking-tight">
          Kestrel<span className="text-brass">Capital</span>FX
        </Link>

        <h1 className="mt-8 font-display text-2xl font-medium">Open an account</h1>
        <p className="mt-2 text-sm text-muted">
          You&rsquo;ll need to complete identity verification before you can
          deposit or connect a broker account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Full name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-sm border rule bg-panel px-3 py-2 text-paper outline-none focus-visible:border-brass"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-sm border rule bg-panel px-3 py-2 text-paper outline-none focus-visible:border-brass"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-sm border rule bg-panel px-3 py-2 text-paper outline-none focus-visible:border-brass"
            />
            <span className="text-xs text-faint">At least 8 characters.</span>
          </label>

          {error && <p className="text-sm text-fall">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-sm bg-brass px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-brass-bright disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brass hover:text-brass-bright">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
