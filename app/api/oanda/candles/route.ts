import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCandles } from "@/lib/oanda";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brokerAccount = await prisma.brokerAccount.findUnique({ where: { userId } });
  if (!brokerAccount) return NextResponse.json({ candles: [] });

  const { searchParams } = new URL(req.url);
  const instrument = searchParams.get("instrument") ?? "EUR_USD";

  try {
    const env = brokerAccount.environment === "live" ? "live" : "practice";
    const candles = await getCandles(env, instrument, 60, "H1");
    return NextResponse.json({ candles });
  } catch (err) {
    return NextResponse.json(
      { candles: [], error: err instanceof Error ? err.message : "OANDA request failed" },
      { status: 502 }
    );
  }
}
