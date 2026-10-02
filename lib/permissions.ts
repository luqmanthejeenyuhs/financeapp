/**
 * Role-based access control for the admin back-office.
 *
 * Deliberately no single "admin can do everything" account for day-to-day
 * use — SUPER_ADMIN exists for the founder(s), and it's the only role that
 * can create other admins or edit roles. Everyone else gets exactly the
 * access their function needs. See prisma/schema.prisma for the role list
 * on User.role.
 */

export type Role = "CLIENT" | "SUPER_ADMIN" | "COMPLIANCE" | "FINANCE" | "SUPPORT";

export const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "COMPLIANCE", "FINANCE", "SUPPORT"];

export function isStaff(role: string): boolean {
  return STAFF_ROLES.includes(role as Role);
}

export const can = {
  /** Approve/reject KYC submissions. */
  reviewKyc: (role: string) => ["SUPER_ADMIN", "COMPLIANCE"].includes(role),
  /** Approve/reject/complete deposit & withdrawal requests. */
  reviewPayouts: (role: string) => ["SUPER_ADMIN", "FINANCE"].includes(role),
  /** Edit global risk limits and per-user overrides. */
  manageSettings: (role: string) => ["SUPER_ADMIN", "FINANCE"].includes(role),
  /** Soft-ban / hard-ban / freeze or reinstate a user's account. */
  manageAccountStanding: (role: string) => ["SUPER_ADMIN", "COMPLIANCE"].includes(role),
  /** View the user directory and individual user detail pages. */
  viewUsers: (role: string) => isStaff(role),
  /** Promote/demote staff roles. SUPER_ADMIN only — see file header. */
  manageRoles: (role: string) => role === "SUPER_ADMIN",
  /** View the immutable audit log. */
  viewAuditLog: (role: string) => ["SUPER_ADMIN", "COMPLIANCE"].includes(role),
};

export const ROLE_LABELS: Record<Role, string> = {
  CLIENT: "Client",
  SUPER_ADMIN: "Super Admin",
  COMPLIANCE: "Compliance",
  FINANCE: "Finance",
  SUPPORT: "Support",
};
