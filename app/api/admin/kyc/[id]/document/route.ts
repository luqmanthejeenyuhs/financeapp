import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { can } from "@/lib/permissions";

/**
 * Streams a submitted KYC document back to an admin for review. Documents
 * are stored outside /public (see app/api/kyc/route.ts) specifically so
 * they can't be fetched by URL without going through this admin-gated
 * route.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!can.reviewKyc(session.user.role)) {
    return NextResponse.json({ error: "Only Compliance or Super Admin can view documents." }, { status: 403 });
  }

  const submission = await prisma.kycSubmission.findUnique({ where: { id: params.id } });
  if (!submission?.documentPath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Guard against a path escaping the uploads directory.
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const resolved = path.resolve(submission.documentPath);
  if (!resolved.startsWith(uploadsRoot)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const bytes = await readFile(resolved);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `inline; filename="${path.basename(resolved)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}
