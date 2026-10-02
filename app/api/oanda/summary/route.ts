import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountSummary } from "@/lib/oanda";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brokerAccount = await prisma.brokerAccount.findUnique({ where: { userId } });
  if (!brokerAccount) {
    return NextResponse.json({ connected: false }, { status: 200 });
  }

  try {
    const env = brokerAccount.environment === "live" ? "live" : "practice";
    const summary = await getAccountSummary(env, brokerAccount.accountId);
    return NextResponse.json({ connected: true, summary });
  } catch (err) {
    return NextResponse.json(
      { connected: true, error: err instanceof Error ? err.message : "OANDA request failed" },
      { status: 502 }
    );
  }
}
