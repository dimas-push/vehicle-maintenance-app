import { getDb } from "../db";
import type { OdometerReading } from "../types/models";

export async function listOdometerReadings(vehicleId: number): Promise<OdometerReading[]> {
  const db = await getDb();
  return db.getAllAsync<OdometerReading>(
    "SELECT * FROM odometer_readings WHERE vehicle_id = ? ORDER BY km DESC, id DESC",
    vehicleId
  );
}

export async function recordOdometerReading(
  vehicleId: number,
  km: number,
  photoUri?: string | null
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO odometer_readings (vehicle_id, km, recorded_at, photo_uri) VALUES (?, ?, ?, ?)",
    vehicleId,
    km,
    new Date().toISOString(),
    photoUri ?? null
  );
}
