"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("That email or password isn't right.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-lg font-medium tracking-tight">
          Kestrel<span className="text-brass">Capital</span>FX
        </Link>

        <h1 className="mt-8 font-display text-2xl font-medium">Log in</h1>
        <p className="mt-2 text-sm text-muted">Access your account and bot dashboard.</p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-sm border rule bg-panel px-3 py-2 text-paper outline-none focus-visible:border-brass"
            />
          </label>

          {error && <p className="text-sm text-fall">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-sm bg-brass px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-brass-bright disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          No account yet?{" "}
          <Link href="/register" className="text-brass hover:text-brass-bright">
            Open one
          </Link>
        </p>
      </div>
    </main>
  );
}
