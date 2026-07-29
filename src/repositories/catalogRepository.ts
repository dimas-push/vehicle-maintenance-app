import { getDb } from "../db";
import type { Brand, MaintenanceInterval, VehicleClass, VehicleType } from "../types/models";
import { intervalsForClass } from "../db/genericIntervals";

export async function listBrandsByClass(vehicleClass: VehicleClass): Promise<Brand[]> {
  const db = await getDb();
  return db.getAllAsync<Brand>(
    `SELECT DISTINCT b.*
       FROM brands b
       JOIN vehicle_types vt ON vt.brand_id = b.id
      WHERE vt.vehicle_class = ?
      ORDER BY b.name`,
    vehicleClass
  );
}

export async function listVehicleTypesByBrand(
  brandId: number,
  vehicleClass: VehicleClass
): Promise<VehicleType[]> {
  const db = await getDb();
  return db.getAllAsync<VehicleType>(
    "SELECT * FROM vehicle_types WHERE brand_id = ? AND vehicle_class = ? ORDER BY name",
    brandId,
    vehicleClass
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
 * intervals used for the catalog models, so scheduling still works. A brand
 * like Honda can have both motorcycle and car types under the same row —
 * only the vehicle_type is class-specific.
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

const DEFAULT_CATEGORY: Record<VehicleClass, VehicleType["category"]> = {
  motorcycle: "scooter",
  car: "sedan",
};

export async function findOrCreateVehicleType(
  brandId: number,
  typeName: string,
  vehicleClass: VehicleClass
): Promise<VehicleType> {
  const db = await getDb();
  const trimmed = typeName.trim();
  const existing = await db.getFirstAsync<VehicleType>(
    "SELECT * FROM vehicle_types WHERE brand_id = ? AND name = ? COLLATE NOCASE AND vehicle_class = ?",
    brandId,
    trimmed,
    vehicleClass
  );
  if (existing) return existing;

  const category = DEFAULT_CATEGORY[vehicleClass];
  const result = await db.runAsync(
    "INSERT INTO vehicle_types (brand_id, name, vehicle_class, category) VALUES (?, ?, ?, ?)",
    brandId,
    trimmed,
    vehicleClass,
    category
  );
  const vehicleTypeId = result.lastInsertRowId;

  const items = await db.getAllAsync<{ id: number; name: string }>(
    "SELECT id, name FROM maintenance_items"
  );
  const itemIdByName = new Map(items.map((i) => [i.name, i.id]));

  for (const interval of intervalsForClass(vehicleClass)) {
    const itemId = itemIdByName.get(interval.name);
    if (!itemId) continue;
    await db.runAsync(
      `INSERT INTO maintenance_intervals (vehicle_type_id, maintenance_item_id, interval_km, interval_months)
       VALUES (?, ?, ?, ?)`,
      vehicleTypeId,
      itemId,
      interval.km,
      interval.months
    );
  }

  return { id: vehicleTypeId, brand_id: brandId, name: trimmed, vehicle_class: vehicleClass, category };
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
