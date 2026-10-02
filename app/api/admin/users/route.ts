import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { can } from "@/lib/permissions";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!can.viewUsers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      fundsFrozen: true,
      createdAt: true,
      kyc: { select: { status: true } },
      brokerAccount: { select: { environment: true } },
      botSetting: { select: { enabled: true } },
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
