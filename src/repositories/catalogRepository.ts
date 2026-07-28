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
