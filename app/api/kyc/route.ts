import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  return session?.user.id;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kyc = await prisma.kycSubmission.findUnique({ where: { userId } });
  return NextResponse.json({ kyc });
}

/**
 * Stores the uploaded document on local disk under /uploads — fine for
 * local development, but most production hosts (Vercel included) don't
 * offer persistent disk. Swap this for an object-storage upload (S3, R2,
 * etc.) — and ideally a real KYC/AML verification vendor (Sumsub, Onfido,
 * Persona...) rather than manual review — before handling real clients.
 */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const fullName = form.get("fullName")?.toString();
  const dateOfBirth = form.get("dateOfBirth")?.toString();
  const country = form.get("country")?.toString();
  const documentType = form.get("documentType")?.toString();
  const file = form.get("document") as File | null;

  if (!fullName || !dateOfBirth || !country || !documentType || !file) {
    return NextResponse.json({ error: "All fields and a document are required." }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "uploads", userId);
  await mkdir(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filePath = path.join(uploadsDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  const kyc = await prisma.kycSubmission.upsert({
    where: { userId },
    update: {
      status: "PENDING",
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      country,
      documentType,
      documentPath: filePath,
      submittedAt: new Date(),
      rejectReason: null,
    },
    create: {
      userId,
      status: "PENDING",
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      country,
      documentType,
      documentPath: filePath,
    },
  });

  return NextResponse.json({ kyc }, { status: 201 });
}
