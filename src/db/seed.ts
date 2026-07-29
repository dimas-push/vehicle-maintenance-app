import type { SQLiteDatabase } from "expo-sqlite";
import type { VehicleCategory, VehicleClass } from "../types/models";
import { allMaintenanceItems, intervalsForClass } from "./genericIntervals";

/**
 * Initial catalog data — a small, recognizable starting set rather than an
 * exhaustive database. Motorcycles: 5 scooter models (trimmed down from a
 * planned 23). Cars: 5 widely-known US-market models added when the app's
 * audience expanded beyond motorcycle-only markets. Users whose vehicle
 * isn't listed can still add it via the "not listed" wizard flow.
 */
const BRANDS = ["Honda", "Yamaha", "Toyota", "Ford", "Tesla"] as const;

const VEHICLE_TYPES: {
  brand: string;
  name: string;
  vehicleClass: VehicleClass;
  category: VehicleCategory;
}[] = [
  { brand: "Honda", name: "Beat", vehicleClass: "motorcycle", category: "scooter" },
  { brand: "Honda", name: "Vario 125", vehicleClass: "motorcycle", category: "scooter" },
  { brand: "Honda", name: "PCX160", vehicleClass: "motorcycle", category: "scooter" },
  { brand: "Yamaha", name: "NMAX", vehicleClass: "motorcycle", category: "scooter" },
  { brand: "Yamaha", name: "Mio", vehicleClass: "motorcycle", category: "scooter" },
  { brand: "Toyota", name: "Camry", vehicleClass: "car", category: "sedan" },
  { brand: "Honda", name: "Civic", vehicleClass: "car", category: "sedan" },
  { brand: "Honda", name: "CR-V", vehicleClass: "car", category: "suv" },
  { brand: "Ford", name: "F-150", vehicleClass: "car", category: "truck" },
  { brand: "Tesla", name: "Model 3", vehicleClass: "car", category: "electric" },
];

export async function seedCatalog(db: SQLiteDatabase): Promise<void> {
  const alreadySeeded = await db.getFirstAsync<{ id: number }>("SELECT id FROM brands LIMIT 1");
  if (alreadySeeded) return;

  await db.withTransactionAsync(async () => {
    for (const brand of BRANDS) {
      await db.runAsync("INSERT OR IGNORE INTO brands (name) VALUES (?)", brand);
    }

    for (const type of VEHICLE_TYPES) {
      const brandRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM brands WHERE name = ?",
        type.brand
      );
      if (!brandRow) continue;
      await db.runAsync(
        "INSERT OR IGNORE INTO vehicle_types (brand_id, name, vehicle_class, category) VALUES (?, ?, ?, ?)",
        brandRow.id,
        type.name,
        type.vehicleClass,
        type.category
      );
    }

    for (const item of allMaintenanceItems()) {
      await db.runAsync(
        "INSERT OR IGNORE INTO maintenance_items (name, description) VALUES (?, ?)",
        item.name,
        item.description
      );
    }

    const allTypes = await db.getAllAsync<{ id: number; vehicle_class: VehicleClass }>(
      "SELECT id, vehicle_class FROM vehicle_types"
    );
    const allItems = await db.getAllAsync<{ id: number; name: string }>(
      "SELECT id, name FROM maintenance_items"
    );
    const itemIdByName = new Map(allItems.map((i) => [i.name, i.id]));

    for (const type of allTypes) {
      for (const interval of intervalsForClass(type.vehicle_class)) {
        const itemId = itemIdByName.get(interval.name);
        if (!itemId) continue;
        await db.runAsync(
          `INSERT OR IGNORE INTO maintenance_intervals
             (vehicle_type_id, maintenance_item_id, interval_km, interval_months)
           VALUES (?, ?, ?, ?)`,
          type.id,
          itemId,
          interval.km,
          interval.months
        );
      }
    }
  });
}
