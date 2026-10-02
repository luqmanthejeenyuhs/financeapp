import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentProvider } from "@/lib/payments/provider";
import { evaluateTransaction } from "@/lib/risk-engine";
import { depositBlockReason, withdrawalBlockReason } from "@/lib/account-standing";
import { logAudit, SYSTEM_ACTOR } from "@/lib/audit";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ transactions });
}

const schema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAWAL"]),
  amount: z.number().positive().max(1_000_000),
  currency: z.string().default("USD"),
  method: z.string().default("bank_transfer"),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kyc = await prisma.kycSubmission.findUnique({ where: { userId: user.id } });
  if (kyc?.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Identity verification must be approved before you can deposit or withdraw." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { type, amount, currency, method } = parsed.data;

  const blockReason = type === "DEPOSIT" ? depositBlockReason(user) : withdrawalBlockReason(user);
  if (blockReason) return NextResponse.json({ error: blockReason }, { status: 403 });

  // Autonomous risk engine: small, low-risk requests clear instantly;
  // anything unusual (high value, over the daily limit) is routed to the
  // Finance queue with the reasons attached instead of an admin having to
  // review every single request. See lib/risk-engine.ts.
  const { decision, reasons } = await evaluateTransaction({ userId: user.id, type, amount });

  if (decision === "AUTO_APPROVE") {
    const { reference } =
      type === "DEPOSIT"
        ? await paymentProvider.initiateDeposit({ userId: user.id, amount, currency, method })
        : await paymentProvider.initiateWithdrawal({ userId: user.id, amount, currency, method });

    const transaction = await prisma.transaction.create({
      data: { userId: user.id, type, amount, currency, method, reference, status: "COMPLETED" },
    });

    await logAudit({
      ...SYSTEM_ACTOR,
      action: "transaction.auto_approve",
      targetType: "Transaction",
      targetId: transaction.id,
      reason: "Within risk engine auto-approval thresholds",
      metadata: { type, amount, currency, userId: user.id },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      type,
      amount,
      currency,
      method,
      status: "PENDING",
      note: `[risk engine] Flagged for review: ${reasons.join(" ")}`,
    },
  });

  await logAudit({
    ...SYSTEM_ACTOR,
    action: "transaction.flag_for_review",
    targetType: "Transaction",
    targetId: transaction.id,
    reason: reasons.join(" "),
    metadata: { type, amount, currency, userId: user.id },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
