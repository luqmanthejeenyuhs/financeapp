import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import StatCard from "@/components/dashboard/StatCard";

export default async function AdminOverview() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role;

  const [userCount, pendingKyc, pendingTx, staffCount] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.kycSubmission.count({ where: { status: "PENDING" } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: { not: "CLIENT" } } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium">Admin overview</h1>
      <p className="mt-1 text-sm text-muted">Everything that needs your attention, in one place.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total clients" value={String(userCount)} />
        <StatCard
          label="Pending verifications"
          value={String(pendingKyc)}
          tone={pendingKyc > 0 ? "fall" : "default"}
        />
        <StatCard
          label="Pending wallet requests"
          value={String(pendingTx)}
          tone={pendingTx > 0 ? "fall" : "default"}
        />
        <StatCard label="Staff accounts" value={String(staffCount)} />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {can.reviewKyc(role) && (
          <Link href="/admin/kyc" className="rounded-sm border rule bg-panel p-6 transition hover:border-brass/50">
            <h2 className="font-display text-lg font-medium">Verification queue</h2>
            <p className="mt-1 text-sm text-muted">
              Review submitted ID documents and approve or reject each client.
            </p>
            {pendingKyc > 0 && <p className="mt-3 text-sm text-brass-bright">{pendingKyc} waiting for review →</p>}
          </Link>
        )}

        {can.reviewPayouts(role) && (
          <Link href="/admin/wallet" className="rounded-sm border rule bg-panel p-6 transition hover:border-brass/50">
            <h2 className="font-display text-lg font-medium">Wallet requests</h2>
            <p className="mt-1 text-sm text-muted">
              Requests the risk engine flagged for review — everything else auto-clears. Approve, reject, or mark
              completed.
            </p>
            {pendingTx > 0 && <p className="mt-3 text-sm text-brass-bright">{pendingTx} waiting for review →</p>}
          </Link>
        )}

        {can.viewUsers(role) && (
          <Link
            href="/admin/users"
            className="rounded-sm border rule bg-panel p-6 transition hover:border-brass/50 md:col-span-2"
          >
            <h2 className="font-display text-lg font-medium">Users</h2>
            <p className="mt-1 text-sm text-muted">
              Every client — verification status, broker connection, bot status, account standing, and full history.
            </p>
          </Link>
        )}

        {can.manageSettings(role) && (
          <Link href="/admin/settings" className="rounded-sm border rule bg-panel p-6 transition hover:border-brass/50">
            <h2 className="font-display text-lg font-medium">Risk settings</h2>
            <p className="mt-1 text-sm text-muted">
              Global daily deposit/withdrawal limits and the high-value alarm tier the risk engine uses.
            </p>
          </Link>
        )}

        {can.viewAuditLog(role) && (
          <Link href="/admin/audit-log" className="rounded-sm border rule bg-panel p-6 transition hover:border-brass/50">
            <h2 className="font-display text-lg font-medium">Audit log</h2>
            <p className="mt-1 text-sm text-muted">Every admin and automated action, append-only.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
