/**
 * Payment provider interface. IMPORTANT: nothing in this file moves real
 * money. Handling client deposits/withdrawals for a forex brokerage
 * requires a licensed payment processor or banking partner, segregated
 * client-money account arrangements, and (depending on jurisdiction)
 * money-transmission licensing — that's a compliance/legal integration,
 * not something this scaffold can set up for you.
 *
 * This interface just defines the shape so you can plug in a real
 * provider (Stripe, a banking partner's API, a crypto processor, etc.)
 * later without changing the rest of the app. Until then, MockProvider
 * only ever creates a PENDING Transaction row for an admin to review.
 */

export interface DepositRequest {
  userId: string;
  amount: number;
  currency: string;
  method: string;
}

export interface WithdrawalRequest {
  userId: string;
  amount: number;
  currency: string;
  method: string;
}

export interface PaymentProvider {
  initiateDeposit(req: DepositRequest): Promise<{ reference: string }>;
  initiateWithdrawal(req: WithdrawalRequest): Promise<{ reference: string }>;
}

export class MockProvider implements PaymentProvider {
  async initiateDeposit(req: DepositRequest) {
    return { reference: `MOCK-DEP-${Date.now()}` };
  }

  async initiateWithdrawal(req: WithdrawalRequest) {
    return { reference: `MOCK-WD-${Date.now()}` };
  }
}

export const paymentProvider: PaymentProvider = new MockProvider();
