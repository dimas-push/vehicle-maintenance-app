import { getDb } from "../db";
import type { Vehicle } from "../types/models";

export interface NewVehicleInput {
  vehicle_type_id: number;
  nickname: string;
  plate_number?: string | null;
  purchase_date?: string | null;
  current_km: number;
}

export async function listVehicles(): Promise<Vehicle[]> {
  const db = await getDb();
  return db.getAllAsync<Vehicle>("SELECT * FROM vehicles ORDER BY created_at DESC");
}

export async function getVehicle(id: number): Promise<Vehicle | null> {
  const db = await getDb();
  return db.getFirstAsync<Vehicle>("SELECT * FROM vehicles WHERE id = ?", id);
}

export async function createVehicle(input: NewVehicleInput): Promise<Vehicle> {
  const db = await getDb();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO vehicles
       (vehicle_type_id, nickname, plate_number, purchase_date, current_km, current_km_updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.vehicle_type_id,
    input.nickname,
    input.plate_number ?? null,
    input.purchase_date ?? null,
    input.current_km,
    now
  );

  const vehicle = await getVehicle(result.lastInsertRowId);
  if (!vehicle) throw new Error("Failed to create the new vehicle");
  return vehicle;
}

export async function updateCurrentKm(vehicleId: number, currentKm: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE vehicles SET current_km = ?, current_km_updated_at = ? WHERE id = ?",
    currentKm,
    new Date().toISOString(),
    vehicleId
  );
}

export async function deleteVehicle(vehicleId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM vehicles WHERE id = ?", vehicleId);
}
