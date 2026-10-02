import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { can } from "@/lib/permissions";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!can.viewAuditLog(session.user.role)) {
    return NextResponse.json({ error: "Only Compliance or Super Admin can view the audit log." }, { status: 403 });
  }

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ entries });
}

// Deliberately no PATCH/DELETE here or anywhere else in the app — the
// audit log is append-only. See lib/audit.ts.
