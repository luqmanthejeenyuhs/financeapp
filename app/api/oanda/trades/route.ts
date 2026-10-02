import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOpenTrades } from "@/lib/oanda";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brokerAccount = await prisma.brokerAccount.findUnique({ where: { userId } });
  if (!brokerAccount) return NextResponse.json({ trades: [] });

  try {
    const env = brokerAccount.environment === "live" ? "live" : "practice";
    const trades = await getOpenTrades(env, brokerAccount.accountId);
    return NextResponse.json({ trades });
  } catch (err) {
    return NextResponse.json(
      { trades: [], error: err instanceof Error ? err.message : "OANDA request failed" },
      { status: 502 }
    );
  }
}
