import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaff, type Role } from "@/lib/permissions";

/**
 * Server-side guard for admin-only API routes/pages. Returns the session
 * if the caller is logged in AND holds any staff role (SUPER_ADMIN,
 * COMPLIANCE, FINANCE, SUPPORT), otherwise null. Never trust a role sent
 * from the client; this always re-checks against the signed session on
 * the server. For finer-grained checks (e.g. "only Finance can approve
 * payouts"), use requireRole() or the `can` helpers in lib/permissions.ts
 * inside the route itself.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaff(session.user.role)) return null;
  return session;
}

/** Like requireAdmin(), but restricted to a specific allow-list of roles. */
export async function requireRole(allowed: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !allowed.includes(session.user.role as Role)) return null;
  return session;
}
