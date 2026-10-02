import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "COMPLETED"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!can.reviewPayouts(session.user.role)) {
    return NextResponse.json({ error: "Only Finance or Super Admin can review wallet requests." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, note } = parsed.data;
  const transaction = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      status,
      note: note ? `${existing.note ? existing.note + "\n" : ""}[admin] ${note}` : existing.note,
    },
  });

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name ?? session.user.email ?? "Unknown",
    actorRole: session.user.role,
    action: `transaction.${status.toLowerCase()}`,
    targetType: "Transaction",
    targetId: transaction.id,
    reason: note,
    metadata: { userId: existing.userId, amount: existing.amount, type: existing.type },
  });

  return NextResponse.json({ transaction });
}
