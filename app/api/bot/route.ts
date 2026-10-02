import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runBotForUser } from "@/lib/bot-engine";
import { tradingBlockReason } from "@/lib/account-standing";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [botSetting, trades] = await Promise.all([
    prisma.botSetting.findUnique({ where: { userId: user.id } }),
    prisma.botTrade.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return NextResponse.json({ botSetting, trades });
}

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  instrument: z.string().optional(),
  riskPercent: z.number().min(0.1).max(5).optional(),
  maxOpenTrades: z.number().int().min(1).max(10).optional(),
});

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (parsed.data.enabled) {
    const blockReason = tradingBlockReason(user);
    if (blockReason) return NextResponse.json({ error: blockReason }, { status: 403 });
  }

  const botSetting = await prisma.botSetting.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: { userId: user.id, ...parsed.data },
  });

  return NextResponse.json({ botSetting });
}

/**
 * Manually triggers one bot cycle for the signed-in user — useful for
 * testing. In production, call runBotForUser() from a scheduled job
 * instead of relying on someone hitting this endpoint.
 */
export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blockReason = tradingBlockReason(user);
  if (blockReason) return NextResponse.json({ error: blockReason }, { status: 403 });

  try {
    const result = await runBotForUser(user.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bot run failed" },
      { status: 500 }
    );
  }
}
