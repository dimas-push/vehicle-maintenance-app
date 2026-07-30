import { getDb } from "../db";
import type { VehicleLoan } from "../types/models";
export { summarizeLoan } from "../utils/loanCalculator";
export type { LoanSummary } from "../utils/loanCalculator";

export interface LoanInput {
  lender?: string | null;
  monthly_payment: number;
  start_date: string;
  term_months: number;
  notes?: string | null;
}

export async function getLoanForVehicle(vehicleId: number): Promise<VehicleLoan | null> {
  const db = await getDb();
  return db.getFirstAsync<VehicleLoan>(
    "SELECT * FROM vehicle_loans WHERE vehicle_id = ? ORDER BY id DESC LIMIT 1",
    vehicleId
  );
}

/** A vehicle has at most one loan — replaces any existing row (schema now also enforces this via UNIQUE(vehicle_id)). */
export async function setLoanForVehicle(vehicleId: number, input: LoanInput): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM vehicle_loans WHERE vehicle_id = ?", vehicleId);
    await db.runAsync(
      `INSERT INTO vehicle_loans (vehicle_id, lender, monthly_payment, start_date, term_months, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      vehicleId,
      input.lender ?? null,
      input.monthly_payment,
      input.start_date,
      input.term_months,
      input.notes ?? null
    );
  });
}

export async function deleteLoan(loanId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM vehicle_loans WHERE id = ?", loanId);
}
