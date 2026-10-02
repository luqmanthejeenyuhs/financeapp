"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bot", label: "Trading bot" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/kyc", label: "Verification" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/settings", label: "Settings" },
];

function SidebarNav({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <nav className="mt-10 flex flex-1 flex-col gap-1">
      {LINKS.map((link) => {
        const active = link.href === "/dashboard" ? pathname === link.href : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`rounded-sm px-3 py-2 text-sm transition ${
              active ? "bg-line text-paper" : "text-muted hover:bg-line/60 hover:text-paper"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — the sidebar itself is off-canvas below md */}
      <div className="flex items-center justify-between border-b rule bg-panel/40 px-4 py-4 md:hidden">
        <Link href="/" className="font-display text-base font-medium tracking-tight">
          Kestrel<span className="text-brass">Capital</span>FX
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-sm border rule"
        >
          <span className="block h-px w-4 bg-paper" />
          <span className="block h-px w-4 bg-paper" />
        </button>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 -translate-x-full flex-col border-r rule bg-ink px-4 py-6 transition-transform duration-200 md:static md:z-auto md:w-56 md:translate-x-0 md:bg-panel/40 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="px-2 font-display text-base font-medium tracking-tight">
            Kestrel<span className="text-brass">Capital</span>FX
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-muted hover:text-paper md:hidden"
          >
            ✕
          </button>
        </div>

        <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />

        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="mb-1 rounded-sm border border-brass/40 bg-brass/10 px-3 py-2 text-sm text-brass-bright hover:bg-brass/20"
          >
            Admin panel →
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-sm px-3 py-2 text-left text-sm text-muted hover:bg-line/60 hover:text-paper"
        >
          Log out
        </button>
      </aside>
    </>
  );
}
