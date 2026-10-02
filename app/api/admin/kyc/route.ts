import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { can } from "@/lib/permissions";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!can.reviewKyc(session.user.role)) {
    return NextResponse.json({ error: "Only Compliance or Super Admin can view verifications." }, { status: 403 });
  }

  const submissions = await prisma.kycSubmission.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ submissions });
}
