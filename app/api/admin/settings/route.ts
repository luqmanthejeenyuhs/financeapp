import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { can } from "@/lib/permissions";
import { getSettings, setSetting, SETTINGS_DEFAULTS } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

const schema = z.object({
  maxDailyDeposit: z.number().positive().optional(),
  maxDailyWithdrawal: z.number().positive().optional(),
  highValueAlarmTier: z.number().positive().optional(),
});

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!can.manageSettings(session.user.role)) {
    return NextResponse.json({ error: "Only Finance or Super Admin can edit risk settings." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  for (const key of Object.keys(SETTINGS_DEFAULTS) as (keyof typeof SETTINGS_DEFAULTS)[]) {
    const value = parsed.data[key];
    if (value !== undefined) await setSetting(key, value);
  }

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name ?? session.user.email ?? "Unknown",
    actorRole: session.user.role,
    action: "settings.update",
    targetType: "GlobalSetting",
    metadata: parsed.data,
  });

  const settings = await getSettings();
  return NextResponse.json({ settings });
}
