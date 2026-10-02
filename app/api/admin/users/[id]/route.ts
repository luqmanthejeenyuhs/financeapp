import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!can.viewUsers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      fundsFrozen: true,
      maxDailyDeposit: true,
      maxDailyWithdrawal: true,
      createdAt: true,
      kyc: true,
      brokerAccount: true,
      botSetting: true,
      transactions: { orderBy: { createdAt: "desc" } },
      botTrades: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user });
}

/**
 * Handles three distinct kinds of updates from the user detail page, each
 * gated by its own permission so e.g. Support can't quietly grant itself
 * admin access:
 *   - role change            → SUPER_ADMIN only
 *   - account standing change → SUPER_ADMIN or COMPLIANCE
 *   - per-user limit override → SUPER_ADMIN or FINANCE
 * Every change is written to the audit log.
 */
const schema = z.object({
  role: z.enum(["CLIENT", "SUPER_ADMIN", "COMPLIANCE", "FINANCE", "SUPPORT"]).optional(),
  status: z.enum(["active", "soft_banned", "banned"]).optional(),
  fundsFrozen: z.boolean().optional(),
  standingReason: z.string().max(500).optional(),
  maxDailyDeposit: z.number().nonnegative().nullable().optional(),
  maxDailyWithdrawal: z.number().nonnegative().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  const actor = {
    actorId: session.user.id,
    actorName: session.user.name ?? session.user.email ?? "Unknown",
    actorRole: session.user.role,
  };

  if (data.role !== undefined) {
    if (!can.manageRoles(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can change roles." }, { status: 403 });
    }
    if (params.id === session.user.id && data.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "You can't remove your own Super Admin access." }, { status: 400 });
    }
    updates.role = data.role;
    await logAudit({ ...actor, action: "user.role_change", targetType: "User", targetId: target.id, reason: `${target.role} → ${data.role}` });
  }

  if (data.status !== undefined || data.fundsFrozen !== undefined) {
    if (!can.manageAccountStanding(session.user.role)) {
      return NextResponse.json({ error: "Only Compliance or Super Admin can change account standing." }, { status: 403 });
    }
    if (data.status !== undefined) {
      updates.status = data.status;
      await logAudit({
        ...actor,
        action: `user.status.${data.status}`,
        targetType: "User",
        targetId: target.id,
        reason: data.standingReason,
      });
    }
    if (data.fundsFrozen !== undefined) {
      updates.fundsFrozen = data.fundsFrozen;
      await logAudit({
        ...actor,
        action: data.fundsFrozen ? "user.funds_frozen" : "user.funds_unfrozen",
        targetType: "User",
        targetId: target.id,
        reason: data.standingReason,
      });
    }
  }

  if (data.maxDailyDeposit !== undefined || data.maxDailyWithdrawal !== undefined) {
    if (!can.manageSettings(session.user.role)) {
      return NextResponse.json({ error: "Only Finance or Super Admin can set limit overrides." }, { status: 403 });
    }
    if (data.maxDailyDeposit !== undefined) updates.maxDailyDeposit = data.maxDailyDeposit;
    if (data.maxDailyWithdrawal !== undefined) updates.maxDailyWithdrawal = data.maxDailyWithdrawal;
    await logAudit({
      ...actor,
      action: "user.limit_override",
      targetType: "User",
      targetId: target.id,
      metadata: { maxDailyDeposit: data.maxDailyDeposit, maxDailyWithdrawal: data.maxDailyWithdrawal },
    });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updates,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      fundsFrozen: true,
      maxDailyDeposit: true,
      maxDailyWithdrawal: true,
    },
  });

  return NextResponse.json({ user });
}
