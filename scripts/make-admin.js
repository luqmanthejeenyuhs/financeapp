/**
 * One-time bootstrap: promotes a user to a staff role by email.
 *
 * Usage:
 *   npm run make-admin -- someone@example.com
 *   npm run make-admin -- someone@example.com COMPLIANCE
 *
 * Role defaults to SUPER_ADMIN if omitted. Valid roles: SUPER_ADMIN,
 * COMPLIANCE, FINANCE, SUPPORT.
 *
 * This is the only step that needs the command line — the people you're
 * setting this up for should never need to run this. Register the account
 * normally at /register first, then run this once against that email to
 * grant it a staff role. After that, all further admin actions happen
 * through the /admin panel in the browser.
 */
const { PrismaClient } = require("@prisma/client");

const VALID_ROLES = ["SUPER_ADMIN", "COMPLIANCE", "FINANCE", "SUPPORT"];
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const role = (process.argv[3] || "SUPER_ADMIN").toUpperCase();

  if (!email) {
    console.error("Usage: npm run make-admin -- someone@example.com [ROLE]");
    console.error(`Valid roles: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }
  if (!VALID_ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Valid roles: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    console.error(`No user found with email "${email}". Register the account at /register first.`);
    process.exit(1);
  }

  if (user.role === role) {
    console.log(`${email} is already ${role}.`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`Done — ${email} is now ${role}. Log in and visit /admin.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
