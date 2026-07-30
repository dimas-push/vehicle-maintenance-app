import { getDb } from "../db";
import type { FuelType, Transmission, Vehicle, VehicleClass } from "../types/models";

export interface NewVehicleInput {
  vehicle_type_id: number;
  nickname: string;
  plate_number?: string | null;
  vin?: string | null;
  purchase_date?: string | null;
  current_km: number;
  photo_uri?: string | null;
}

export interface VehicleWithClass extends Vehicle {
  vehicle_class: VehicleClass;
}

export async function listVehicles(): Promise<VehicleWithClass[]> {
  const db = await getDb();
  return db.getAllAsync<VehicleWithClass>(
    `SELECT v.*, vt.vehicle_class
       FROM vehicles v
       JOIN vehicle_types vt ON vt.id = v.vehicle_type_id
      ORDER BY v.created_at DESC`
  );
}

export async function getVehicle(id: number): Promise<VehicleWithClass | null> {
  const db = await getDb();
  return db.getFirstAsync<VehicleWithClass>(
    `SELECT v.*, vt.vehicle_class
       FROM vehicles v
       JOIN vehicle_types vt ON vt.id = v.vehicle_type_id
      WHERE v.id = ?`,
    id
  );
}

export async function createVehicle(input: NewVehicleInput): Promise<Vehicle> {
  const db = await getDb();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO vehicles
       (vehicle_type_id, nickname, plate_number, vin, purchase_date, current_km, current_km_updated_at, photo_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.vehicle_type_id,
    input.nickname,
    input.plate_number ?? null,
    input.vin ?? null,
    input.purchase_date ?? null,
    input.current_km,
    now,
    input.photo_uri ?? null
  );

  const vehicle = await getVehicle(result.lastInsertRowId);
  if (!vehicle) throw new Error("Failed to create the new vehicle");
  return vehicle;
}

export interface VehicleDetailsInput {
  nickname: string;
  plate_number?: string | null;
  vin?: string | null;
  year?: number | null;
  color?: string | null;
  engine_size?: string | null;
  transmission?: Transmission | null;
  fuel_type?: FuelType | null;
}

export async function updateVehicleDetails(
  vehicleId: number,
  input: VehicleDetailsInput
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE vehicles
        SET nickname = ?, plate_number = ?, vin = ?, year = ?, color = ?,
            engine_size = ?, transmission = ?, fuel_type = ?
      WHERE id = ?`,
    input.nickname,
    input.plate_number ?? null,
    input.vin ?? null,
    input.year ?? null,
    input.color ?? null,
    input.engine_size ?? null,
    input.transmission ?? null,
    input.fuel_type ?? null,
    vehicleId
  );
}

export async function updateVehiclePhoto(vehicleId: number, photoUri: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE vehicles SET photo_uri = ? WHERE id = ?", photoUri, vehicleId);
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
