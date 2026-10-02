import { prisma } from "@/lib/prisma";
import { getAccountSummary, getCandles, placeMarketOrder } from "@/lib/oanda";

/**
 * A deliberately simple example strategy (fast/slow moving-average
 * crossover) so the platform has something real to run out of the box.
 * This is NOT investment advice and has not been backtested — treat it as
 * a starting point, and only ever point it at a "practice" environment
 * until you've validated it and taken independent compliance advice.
 */
function movingAverage(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(values.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function generateSignal(closes: number[]): "buy" | "sell" | "hold" {
  const fast = movingAverage(closes, 10);
  const slow = movingAverage(closes, 30);
  if (fast === null || slow === null) return "hold";

  const prevFast = movingAverage(closes.slice(0, -1), 10);
  const prevSlow = movingAverage(closes.slice(0, -1), 30);
  if (prevFast === null || prevSlow === null) return "hold";

  const crossedUp = prevFast <= prevSlow && fast > slow;
  const crossedDown = prevFast >= prevSlow && fast < slow;

  if (crossedUp) return "buy";
  if (crossedDown) return "sell";
  return "hold";
}

/**
 * Runs one check-and-maybe-trade cycle for a single user. Call this from
 * /api/bot/run — wire that endpoint to a scheduler (Vercel Cron, a
 * server-side cron job, etc.) at whatever interval matches your
 * granularity. It does nothing unless the user's BotSetting.enabled = true.
 */
export async function runBotForUser(userId: string) {
  const [botSetting, brokerAccount] = await Promise.all([
    prisma.botSetting.findUnique({ where: { userId } }),
    prisma.brokerAccount.findUnique({ where: { userId } }),
  ]);

  if (!botSetting?.enabled || !brokerAccount) {
    return { ran: false, reason: "Bot disabled or no broker account connected" };
  }

  const env = brokerAccount.environment === "live" ? "live" : "practice";

  const [candles, summary] = await Promise.all([
    getCandles(env, botSetting.instrument, 60, "H1"),
    getAccountSummary(env, brokerAccount.accountId),
  ]);

  const closes = candles.filter((c) => c.complete).map((c) => parseFloat(c.mid.c));
  const signal = generateSignal(closes);

  if (signal === "hold") {
    return { ran: true, signal, traded: false };
  }

  const openTrades = await prisma.botTrade.count({
    where: { userId, status: { in: ["submitted", "filled"] } },
  });
  if (openTrades >= botSetting.maxOpenTrades) {
    return { ran: true, signal, traded: false, reason: "maxOpenTrades reached" };
  }

  // Position size from riskPercent of current balance — a simplistic
  // fixed-fractional sizing model, not accounting for stop distance/pip
  // value. Replace with real position sizing before going live.
  const balance = parseFloat(summary.balance);
  const riskAmount = balance * (botSetting.riskPercent / 100);
  const units = Math.max(1, Math.round(riskAmount * 100));
  const signedUnits = signal === "buy" ? units : -units;

  const order = await placeMarketOrder(env, brokerAccount.accountId, botSetting.instrument, signedUnits);

  await prisma.botTrade.create({
    data: {
      userId,
      instrument: botSetting.instrument,
      side: signal,
      units,
      reason: `MA crossover (10/30, H1): ${signal === "buy" ? "fast crossed above slow" : "fast crossed below slow"}`,
      oandaOrderId: order?.orderFillTransaction?.id ?? order?.orderCreateTransaction?.id ?? null,
      status: order?.orderFillTransaction ? "filled" : "submitted",
    },
  });

  return { ran: true, signal, traded: true };
}
