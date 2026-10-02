import { prisma } from "@/lib/prisma";

type AuditEntry = {
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Writes one row to the immutable audit log. Nothing in the app exposes an
 * update or delete for AuditLog — this is intentionally append-only so it
 * stays trustworthy even against a compromised or rogue staff account.
 * Call this from every admin action and every automated (system) decision
 * that touches money, KYC status, or account standing.
 */
export async function logAudit(entry: AuditEntry) {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      reason: entry.reason,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
    },
  });
}

export const SYSTEM_ACTOR = { actorId: null, actorName: "System", actorRole: "SYSTEM" } as const;
