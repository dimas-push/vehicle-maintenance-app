import { getDb } from "../db";
import type { ExpenseCategory, MiscExpense } from "../types/models";

export interface NewExpenseInput {
  vehicle_id: number;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes?: string | null;
  photo_uri?: string | null;
}

export async function listExpensesForVehicle(vehicleId: number): Promise<MiscExpense[]> {
  const db = await getDb();
  return db.getAllAsync<MiscExpense>(
    "SELECT * FROM misc_expenses WHERE vehicle_id = ? ORDER BY expense_date DESC, id DESC",
    vehicleId
  );
}

export async function createExpense(input: NewExpenseInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO misc_expenses (vehicle_id, category, amount, expense_date, notes, photo_uri)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.vehicle_id,
    input.category,
    input.amount,
    input.expense_date,
    input.notes ?? null,
    input.photo_uri ?? null
  );
}

export async function deleteExpense(expenseId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM misc_expenses WHERE id = ?", expenseId);
}
