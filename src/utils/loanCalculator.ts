import type { VehicleLoan } from "../types/models";

export interface LoanSummary {
  payoffDate: string; // ISO date
  monthsRemaining: number;
  estimatedBalance: number;
  isPaidOff: boolean;
}

/** monthly_payment × months remaining — ignores interest amortization. */
export function summarizeLoan(loan: VehicleLoan, now = new Date()): LoanSummary {
  const start = new Date(loan.start_date);
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const monthsRemaining = Math.max(0, loan.term_months - monthsElapsed);

  const payoff = new Date(start);
  payoff.setMonth(payoff.getMonth() + loan.term_months);

  return {
    payoffDate: payoff.toISOString().slice(0, 10),
    monthsRemaining,
    estimatedBalance: monthsRemaining * loan.monthly_payment,
    isPaidOff: monthsRemaining <= 0,
  };
}
