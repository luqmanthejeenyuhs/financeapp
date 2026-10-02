import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountSummary, getOpenTrades } from "@/lib/oanda";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/ui/EmptyState";

export default async function DashboardOverview() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id as string;

  const [user, brokerAccount, kyc] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.brokerAccount.findUnique({ where: { userId } }),
    prisma.kycSubmission.findUnique({ where: { userId } }),
  ]);

  let summary: Awaited<ReturnType<typeof getAccountSummary>> | null = null;
  let trades: Awaited<ReturnType<typeof getOpenTrades>> = [];
  let oandaError: string | null = null;

  if (brokerAccount) {
    try {
      const env = brokerAccount.environment === "live" ? "live" : "practice";
      [summary, trades] = await Promise.all([
        getAccountSummary(env, brokerAccount.accountId),
        getOpenTrades(env, brokerAccount.accountId),
      ]);
    } catch (err) {
      oandaError = err instanceof Error ? err.message : "Couldn't reach OANDA.";
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium">Welcome back, {user?.name?.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted">Here&rsquo;s where your account stands right now.</p>

      {kyc?.status !== "APPROVED" && (
        <div className="mt-6 rounded-sm border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-brass-bright">
          {kyc?.status === "PENDING"
            ? "Your identity verification is under review."
            : "Verify your identity to connect a broker account and unlock deposits."}
        </div>
      )}

      {!brokerAccount ? (
        <div className="mt-8">
          <EmptyState
            title="No broker account connected"
            body="Connect your OANDA account to see live balance, open positions, and let the bot trade on your behalf."
            actionHref="/dashboard/settings"
            actionLabel="Connect account"
          />
        </div>
      ) : oandaError ? (
        <div className="mt-8 rounded-sm border border-fall/40 bg-fall/10 p-6 text-sm text-fall">
          Couldn&rsquo;t load live account data: {oandaError}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Balance" value={`${summary!.currency} ${Number(summary!.balance).toLocaleString()}`} />
            <StatCard
              label="Unrealized P/L"
              value={`${Number(summary!.unrealizedPL) >= 0 ? "+" : ""}${Number(summary!.unrealizedPL).toFixed(2)}`}
              tone={Number(summary!.unrealizedPL) >= 0 ? "rise" : "fall"}
            />
            <StatCard label="Open positions" value={String(summary!.openPositionCount)} />
            <StatCard label="Margin available" value={Number(summary!.marginAvailable).toLocaleString()} />
          </div>

          <div className="mt-10">
            <h2 className="font-display text-lg font-medium">Open trades</h2>
            {trades.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No open positions right now.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-sm border rule">
                <table className="w-full text-left text-sm">
                  <thead className="bg-panel text-xs uppercase tracking-widest2 text-faint">
                    <tr>
                      <th className="px-4 py-3 font-normal">Instrument</th>
                      <th className="px-4 py-3 font-normal">Units</th>
                      <th className="px-4 py-3 font-normal">Price</th>
                      <th className="px-4 py-3 font-normal">Unrealized P/L</th>
                      <th className="px-4 py-3 font-normal">Opened</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t) => (
                      <tr key={t.id} className="border-t rule font-mono">
                        <td className="px-4 py-3">{t.instrument}</td>
                        <td className="px-4 py-3 font-tabular">{t.currentUnits}</td>
                        <td className="px-4 py-3 font-tabular">{t.price}</td>
                        <td className={`px-4 py-3 font-tabular ${Number(t.unrealizedPL) >= 0 ? "text-rise" : "text-fall"}`}>
                          {t.unrealizedPL}
                        </td>
                        <td className="px-4 py-3 text-muted">{new Date(t.openTime).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
