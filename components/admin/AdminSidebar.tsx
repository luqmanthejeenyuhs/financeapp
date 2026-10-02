"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { can, ROLE_LABELS, type Role } from "@/lib/permissions";

function navLinks(role: Role) {
  const links = [{ href: "/admin", label: "Overview" }];
  if (can.reviewKyc(role)) links.push({ href: "/admin/kyc", label: "Verification queue" });
  if (can.reviewPayouts(role)) links.push({ href: "/admin/wallet", label: "Wallet requests" });
  if (can.viewUsers(role)) links.push({ href: "/admin/users", label: "Users" });
  if (can.manageSettings(role)) links.push({ href: "/admin/settings", label: "Risk settings" });
  if (can.viewAuditLog(role)) links.push({ href: "/admin/audit-log", label: "Audit log" });
  return links;
}

function SidebarNav({
  role,
  pathname,
  onNavigate,
}: {
  role: Role;
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const links = navLinks(role);
  return (
    <nav className="mt-10 flex flex-1 flex-col gap-1">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === link.href : pathname?.startsWith(link.href);
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

export default function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b rule bg-panel/40 px-4 py-4 md:hidden">
        <Link href="/admin" className="font-display text-base font-medium tracking-tight">
          Kestrel<span className="text-brass">Capital</span>FX
          <span className="ml-2 rounded-sm bg-brass/20 px-1.5 py-0.5 text-[10px] uppercase tracking-widest2 text-brass-bright">
            {ROLE_LABELS[role]}
          </span>
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
          <Link href="/admin" className="px-2 font-display text-base font-medium tracking-tight">
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
        <div className="mt-1 px-2 text-[11px] uppercase tracking-widest2 text-brass">{ROLE_LABELS[role]}</div>

        <SidebarNav role={role} pathname={pathname} onNavigate={() => setOpen(false)} />

        <Link
          href="/dashboard"
          className="rounded-sm px-3 py-2 text-left text-sm text-muted hover:bg-line/60 hover:text-paper"
        >
          ← Back to client dashboard
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-1 rounded-sm px-3 py-2 text-left text-sm text-muted hover:bg-line/60 hover:text-paper"
        >
          Log out
        </button>
      </aside>
    </>
  );
}
