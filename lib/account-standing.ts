type StandingUser = { status: string; fundsFrozen: boolean };

/**
 * Soft ban disables trading and withdrawals but the person can still log
 * in, view their account, and deposit. Fund freezing blocks all money
 * movement (deposit and withdrawal) but doesn't touch trading directly —
 * in practice a frozen account should also have its bot disabled by an
 * admin, but this is enforced here regardless as a second layer.
 * Hard ban is rejected earlier, at login (see lib/auth.ts).
 */
export function tradingBlockReason(user: StandingUser): string | null {
  if (user.status === "soft_banned") {
    return "Trading is disabled on this account pending verification. Contact support.";
  }
  if (user.fundsFrozen) {
    return "This account is under compliance review and trading is paused. Contact support.";
  }
  return null;
}

export function withdrawalBlockReason(user: StandingUser): string | null {
  if (user.status === "soft_banned") {
    return "Withdrawals are disabled on this account pending verification. Contact support.";
  }
  if (user.fundsFrozen) {
    return "Funds on this account are frozen pending compliance review. Contact support.";
  }
  return null;
}

export function depositBlockReason(user: StandingUser): string | null {
  if (user.fundsFrozen) {
    return "This account is frozen pending compliance review and can't accept deposits right now.";
  }
  return null;
}
