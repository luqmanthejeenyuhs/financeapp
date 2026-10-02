import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id as string;

  const [trades, transactions] = await Promise.all([
    prisma.botTrade.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium">History</h1>
      <p className="mt-1 text-sm text-muted">Every bot trade and wallet request on your account.</p>

      <section className="mt-8">
        <h2 className="font-display text-lg font-medium">Bot trades</h2>
        {trades.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No bot trades yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-sm border rule">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs uppercase tracking-widest2 text-faint">
                <tr>
                  <th className="px-4 py-3 font-normal">Instrument</th>
                  <th className="px-4 py-3 font-normal">Side</th>
                  <th className="px-4 py-3 font-normal">Units</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-t rule font-mono">
                    <td className="px-4 py-3">{t.instrument}</td>
                    <td className={`px-4 py-3 ${t.side === "buy" ? "text-rise" : "text-fall"}`}>
                      {t.side.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-tabular">{t.units}</td>
                    <td className="px-4 py-3 text-muted">{t.status}</td>
                    <td className="px-4 py-3 text-muted">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium">Wallet requests</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No wallet requests yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-sm border rule">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs uppercase tracking-widest2 text-faint">
                <tr>
                  <th className="px-4 py-3 font-normal">Type</th>
                  <th className="px-4 py-3 font-normal">Amount</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t rule font-mono">
                    <td className="px-4 py-3">{t.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}</td>
                    <td className="px-4 py-3 font-tabular">
                      {t.currency} {t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted">{t.status}</td>
                    <td className="px-4 py-3 text-muted">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
