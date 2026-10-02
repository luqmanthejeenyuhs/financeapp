import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit, SYSTEM_ACTOR } from "@/lib/audit";

/**
 * Autonomous compliance sweep: soft-bans any active account that registered
 * more than 48h ago and never got its KYC approved. This is what the app's
 * README/setup docs call the "48-hour KYC" rule — it only runs when
 * something calls this endpoint, so it needs an external scheduler.
 *
 * This route is not on the auth middleware matcher (there's no logged-in
 * admin session when a scheduler calls it) — instead it's protected by a
 * shared secret. Set CRON_SECRET in your .env and call this URL with
 * `Authorization: Bearer <CRON_SECRET>` on a schedule, e.g.:
 *   - Vercel Cron (vercel.json) if you deploy there
 *   - Windows Task Scheduler running `curl` on your own server
 *   - Any uptime/cron SaaS (cron-job.org, EasyCron, etc.) hitting this URL
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const candidates = await prisma.user.findMany({
    where: {
      status: "active",
      role: "CLIENT",
      createdAt: { lt: cutoff },
      OR: [{ kyc: null }, { kyc: { status: { in: ["UNSUBMITTED", "PENDING"] } } }],
    },
    select: { id: true, email: true },
  });

  for (const user of candidates) {
    await prisma.user.update({ where: { id: user.id }, data: { status: "soft_banned" } });
    await logAudit({
      ...SYSTEM_ACTOR,
      action: "user.status.soft_banned",
      targetType: "User",
      targetId: user.id,
      reason: "Automated: KYC not completed within 48 hours of registration",
    });
  }

  return NextResponse.json({ softBanned: candidates.length });
}
