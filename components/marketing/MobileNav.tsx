"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "#capabilities", label: "Capabilities" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#risk", label: "Risk disclosure" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-sm border rule"
      >
        <span
          className={`block h-px w-4 bg-paper transition ${open ? "translate-y-[3px] rotate-45" : ""}`}
        />
        <span
          className={`block h-px w-4 bg-paper transition ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-t rule bg-ink px-6 py-6">
          <nav className="flex flex-col gap-4 text-sm text-muted">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="hover:text-paper"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-6 flex items-center gap-4 border-t rule pt-6">
            <Link href="/login" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-paper">
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink transition hover:bg-brass-bright"
            >
              Open an account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
