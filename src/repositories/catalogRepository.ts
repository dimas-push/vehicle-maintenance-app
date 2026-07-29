import { getDb } from "../db";
import type { Brand, MaintenanceInterval, VehicleType } from "../types/models";

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
      WHERE b.name = ? AND vt.name = ?`,
    brandName,
    typeName
  );
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
