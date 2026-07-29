import { getDb } from "../db";
import type { FuelLog } from "../types/models";

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

export interface EconomySegment {
  fromKm: number;
  toKm: number;
  distanceKm: number;
  volumeLiters: number;
  toDate: string;
}

/**
 * Pairs of consecutive full-tank fill-ups, oldest first, each yielding one
 * distance/volume segment for an economy calculation. A partial fill breaks
 * the chain (its volume isn't attributed to either neighboring segment)
 * since it doesn't represent a complete consumption cycle.
 */
export function computeEconomySegments(logsNewestFirst: FuelLog[]): EconomySegment[] {
  const logs = [...logsNewestFirst].reverse(); // oldest first
  const segments: EconomySegment[] = [];
  let lastFullTank: FuelLog | null = null;

  for (const log of logs) {
    if (!lastFullTank) {
      if (log.full_tank) lastFullTank = log;
      continue;
    }
    if (!log.full_tank) continue; // partial fill: skip, don't break the chain's next segment

    segments.push({
      fromKm: lastFullTank.filled_at_km,
      toKm: log.filled_at_km,
      distanceKm: log.filled_at_km - lastFullTank.filled_at_km,
      volumeLiters: log.volume_liters,
      toDate: log.filled_at_date,
    });
    lastFullTank = log;
  }

  return segments;
}
