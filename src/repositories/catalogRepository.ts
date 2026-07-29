import { getDb } from "../db";
import type { Brand, MaintenanceInterval, VehicleType } from "../types/models";
import { GENERIC_INTERVALS } from "../db/genericIntervals";

export async function listBrands(): Promise<Brand[]> {
  const db = await getDb();
  return db.getAllAsync<Brand>("SELECT * FROM brands ORDER BY name");
}

export async function listVehicleTypesByBrand(brandId: number): Promise<VehicleType[]> {
  const db = await getDb();
  return db.getAllAsync<VehicleType>(
    "SELECT * FROM vehicle_types WHERE brand_id = ? ORDER BY name",
    brandId
  );
}

export async function getVehicleType(vehicleTypeId: number): Promise<VehicleType | null> {
  const db = await getDb();
  return db.getFirstAsync<VehicleType>(
    "SELECT * FROM vehicle_types WHERE id = ?",
    vehicleTypeId
  );
}

export async function getVehicleTypeWithBrandName(
  vehicleTypeId: number
): Promise<{ brandName: string; typeName: string } | null> {
  const db = await getDb();
  return db.getFirstAsync<{ brandName: string; typeName: string }>(
    `SELECT b.name AS brandName, vt.name AS typeName
       FROM vehicle_types vt
       JOIN brands b ON b.id = vt.brand_id
      WHERE vt.id = ?`,
    vehicleTypeId
  );
}

export async function findVehicleTypeByNames(
  brandName: string,
  typeName: string
): Promise<VehicleType | null> {
  const db = await getDb();
  return db.getFirstAsync<VehicleType>(
    `SELECT vt.*
       FROM vehicle_types vt
       JOIN brands b ON b.id = vt.brand_id
      WHERE b.name = ? COLLATE NOCASE AND vt.name = ? COLLATE NOCASE`,
    brandName,
    typeName
  );
}

/**
 * Used when the user's vehicle isn't in the seeded catalog. Reuses an
 * existing brand/type by case-insensitive name match if one already exists
 * (e.g. a second custom "Kawasaki Ninja" doesn't create a duplicate row),
 * otherwise creates it and seeds it with the same generic maintenance
 * intervals used for the catalog models, so scheduling still works.
 */
export async function findOrCreateBrand(name: string): Promise<Brand> {
  const db = await getDb();
  const trimmed = name.trim();
  const existing = await db.getFirstAsync<Brand>(
    "SELECT * FROM brands WHERE name = ? COLLATE NOCASE",
    trimmed
  );
  if (existing) return existing;

  const result = await db.runAsync("INSERT INTO brands (name) VALUES (?)", trimmed);
  return { id: result.lastInsertRowId, name: trimmed };
}

export async function findOrCreateVehicleType(brandId: number, typeName: string): Promise<VehicleType> {
  const db = await getDb();
  const trimmed = typeName.trim();
  const existing = await db.getFirstAsync<VehicleType>(
    "SELECT * FROM vehicle_types WHERE brand_id = ? AND name = ? COLLATE NOCASE",
    brandId,
    trimmed
  );
  if (existing) return existing;

  const result = await db.runAsync(
    "INSERT INTO vehicle_types (brand_id, name, category) VALUES (?, ?, 'scooter')",
    brandId,
    trimmed
  );
  const vehicleTypeId = result.lastInsertRowId;

  const items = await db.getAllAsync<{ id: number; name: string }>(
    "SELECT id, name FROM maintenance_items"
  );
  for (const item of items) {
    const interval = GENERIC_INTERVALS[item.name];
    if (!interval) continue;
    await db.runAsync(
      `INSERT INTO maintenance_intervals (vehicle_type_id, maintenance_item_id, interval_km, interval_months)
       VALUES (?, ?, ?, ?)`,
      vehicleTypeId,
      item.id,
      interval.km,
      interval.months
    );
  }

  return { id: vehicleTypeId, brand_id: brandId, name: trimmed, category: "scooter" };
}

export async function findMaintenanceItemByName(
  name: string
): Promise<{ id: number; name: string } | null> {
  const db = await getDb();
  return db.getFirstAsync<{ id: number; name: string }>(
    "SELECT id, name FROM maintenance_items WHERE name = ?",
    name
  );
}

export async function listIntervalsByVehicleType(
  vehicleTypeId: number
): Promise<(MaintenanceInterval & { item_name: string })[]> {
  const db = await getDb();
  return db.getAllAsync<MaintenanceInterval & { item_name: string }>(
    `SELECT mi.*, mit.name AS item_name
       FROM maintenance_intervals mi
       JOIN maintenance_items mit ON mit.id = mi.maintenance_item_id
      WHERE mi.vehicle_type_id = ?`,
    vehicleTypeId
  );
}
