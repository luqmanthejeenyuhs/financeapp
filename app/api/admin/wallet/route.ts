import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { can } from "@/lib/permissions";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!can.reviewPayouts(session.user.role)) {
    return NextResponse.json({ error: "Only Finance or Super Admin can view wallet requests." }, { status: 403 });
  }

  const transactions = await prisma.transaction.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ transactions });
}
