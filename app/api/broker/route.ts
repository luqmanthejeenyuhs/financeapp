import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  return session?.user.id;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brokerAccount = await prisma.brokerAccount.findUnique({ where: { userId } });
  return NextResponse.json({ brokerAccount });
}

const schema = z.object({
  accountId: z.string().min(3, "That doesn't look like a valid OANDA account id"),
  environment: z.enum(["practice", "live"]),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kyc = await prisma.kycSubmission.findUnique({ where: { userId } });
  if (kyc?.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Identity verification must be approved before connecting a live broker account." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const brokerAccount = await prisma.brokerAccount.upsert({
    where: { userId },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });

  return NextResponse.json({ brokerAccount }, { status: 201 });
}
