import { getDb } from "../db";
import type { FuelLog } from "../types/models";
export { computeEconomySegments } from "../utils/fuelEconomy";
export type { EconomySegment } from "../utils/fuelEconomy";

export interface NewFuelLogInput {
  vehicle_id: number;
  filled_at_km: number;
  filled_at_date: string;
  volume_liters: number;
  cost?: number | null;
  full_tank: boolean;
  notes?: string | null;
}

export async function listFuelLogs(vehicleId: number): Promise<FuelLog[]> {
  const db = await getDb();
  return db.getAllAsync<FuelLog>(
    "SELECT * FROM fuel_logs WHERE vehicle_id = ? ORDER BY filled_at_km DESC, id DESC",
    vehicleId
  );
}

export async function createFuelLog(input: NewFuelLogInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO fuel_logs (vehicle_id, filled_at_km, filled_at_date, volume_liters, cost, full_tank, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.vehicle_id,
    input.filled_at_km,
    input.filled_at_date,
    input.volume_liters,
    input.cost ?? null,
    input.full_tank ? 1 : 0,
    input.notes ?? null
  );
}

export async function deleteFuelLog(fuelLogId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM fuel_logs WHERE id = ?", fuelLogId);
}
