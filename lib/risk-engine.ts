import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export type RiskDecision = {
  decision: "AUTO_APPROVE" | "REVIEW";
  reasons: string[];
};

/**
 * Decides whether a deposit/withdrawal can be auto-approved or needs a
 * human in the Finance queue. This is what makes the platform "almost
 * fully autonomous" day-to-day — small, low-risk requests clear
 * instantly; anything unusual gets routed to a person with the reasons
 * already attached, instead of silently going through.
 *
 * Note: "auto-approve" here means the app's own PENDING → COMPLETED
 * status flow and calls the (currently mock) payment provider. It does
 * not bypass the fact that no real money-movement is wired up yet — see
 * lib/payments/provider.ts.
 */
export async function evaluateTransaction(params: {
  userId: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
}): Promise<RiskDecision> {
  const { userId, type, amount } = params;
  const reasons: string[] = [];

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getSettings(),
  ]);

  if (!user) return { decision: "REVIEW", reasons: ["User not found"] };

  if (amount >= settings.highValueAlarmTier) {
    reasons.push(`Amount ${amount} is at or above the high-value alarm tier (${settings.highValueAlarmTier}).`);
  }

  const effectiveLimit =
    type === "DEPOSIT"
      ? user.maxDailyDeposit ?? settings.maxDailyDeposit
      : user.maxDailyWithdrawal ?? settings.maxDailyWithdrawal;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayTotal = await prisma.transaction.aggregate({
    where: {
      userId,
      type,
      status: { in: ["APPROVED", "COMPLETED"] },
      createdAt: { gte: startOfDay },
    },
    _sum: { amount: true },
  });

  const runningTotal = (todayTotal._sum.amount ?? 0) + amount;
  if (runningTotal > effectiveLimit) {
    reasons.push(
      `Exceeds daily ${type.toLowerCase()} limit (${runningTotal} > ${effectiveLimit} for today, across all requests).`
    );
  }

  return { decision: reasons.length === 0 ? "AUTO_APPROVE" : "REVIEW", reasons };
}
