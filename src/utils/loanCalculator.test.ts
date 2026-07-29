import { summarizeLoan } from "./loanCalculator";
import type { VehicleLoan } from "../types/models";

function loan(overrides: Partial<VehicleLoan>): VehicleLoan {
  return {
    id: 1,
    vehicle_id: 1,
    lender: "Test Bank",
    monthly_payment: 100,
    start_date: "2026-01-01",
    term_months: 12,
    notes: null,
    ...overrides,
  };
}

describe("summarizeLoan", () => {
  it("has the full term remaining right at the start date", () => {
    const summary = summarizeLoan(loan({}), new Date("2026-01-01T00:00:00.000Z"));
    expect(summary.monthsRemaining).toBe(12);
    expect(summary.estimatedBalance).toBe(1200);
    expect(summary.isPaidOff).toBe(false);
    expect(summary.payoffDate).toBe("2027-01-01");
  });

  it("counts down months remaining as time passes", () => {
    const summary = summarizeLoan(loan({}), new Date("2026-07-01T00:00:00.000Z"));
    expect(summary.monthsRemaining).toBe(6);
    expect(summary.estimatedBalance).toBe(600);
    expect(summary.isPaidOff).toBe(false);
  });

  it("marks the loan paid off exactly on the payoff date, not one month after", () => {
    const summary = summarizeLoan(loan({}), new Date("2027-01-01T00:00:00.000Z"));
    expect(summary.monthsRemaining).toBe(0);
    expect(summary.isPaidOff).toBe(true);
    expect(summary.estimatedBalance).toBe(0);
  });

  it("clamps months remaining to zero instead of going negative long after the term ends", () => {
    const summary = summarizeLoan(loan({}), new Date("2028-06-01T00:00:00.000Z"));
    expect(summary.monthsRemaining).toBe(0);
    expect(summary.estimatedBalance).toBe(0);
    expect(summary.isPaidOff).toBe(true);
  });

  it("scales the estimated balance with the monthly payment amount", () => {
    const summary = summarizeLoan(
      loan({ monthly_payment: 410, term_months: 60 }),
      new Date("2026-01-01T00:00:00.000Z")
    );
    expect(summary.monthsRemaining).toBe(60);
    expect(summary.estimatedBalance).toBe(24600);
  });

  it("defaults to the current date when now isn't provided", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-01T00:00:00.000Z"));
    const summary = summarizeLoan(loan({}));
    expect(summary.monthsRemaining).toBe(6);
    jest.useRealTimers();
  });
});
