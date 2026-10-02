import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectReason: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!can.reviewKyc(session.user.role)) {
    return NextResponse.json({ error: "Only Compliance or Super Admin can review verifications." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { status, rejectReason } = parsed.data;
  if (status === "REJECTED" && !rejectReason) {
    return NextResponse.json({ error: "A reason is required when rejecting." }, { status: 400 });
  }

  const existing = await prisma.kycSubmission.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submission = await prisma.kycSubmission.update({
    where: { id: params.id },
    data: {
      status,
      rejectReason: status === "REJECTED" ? rejectReason : null,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name ?? session.user.email ?? "Unknown",
    actorRole: session.user.role,
    action: `kyc.${status.toLowerCase()}`,
    targetType: "KycSubmission",
    targetId: submission.id,
    reason: rejectReason,
    metadata: { userId: existing.userId },
  });

  return NextResponse.json({ submission });
}
