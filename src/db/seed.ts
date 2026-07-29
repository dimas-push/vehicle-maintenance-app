import type { SQLiteDatabase } from "expo-sqlite";
import { GENERIC_INTERVALS, MAINTENANCE_ITEMS } from "./genericIntervals";

/**
 * Initial catalog data: 5 scooter models (trimmed down from a planned 23)
 * to speed up the MVP. The maintenance intervals are general figures used
 * across brands (not per-model research with a confidence rating) —
 * re-check them against each manufacturer's manual before citing them as a
 * final reference in a report.
 */
const BRANDS = ["Honda", "Yamaha"] as const;

const VEHICLE_TYPES: { brand: string; name: string }[] = [
  { brand: "Honda", name: "Beat" },
  { brand: "Honda", name: "Vario 125" },
  { brand: "Honda", name: "PCX160" },
  { brand: "Yamaha", name: "NMAX" },
  { brand: "Yamaha", name: "Mio" },
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
        "INSERT OR IGNORE INTO vehicle_types (brand_id, name, category) VALUES (?, ?, 'scooter')",
        brandRow.id,
        type.name
      );
    }

    for (const item of MAINTENANCE_ITEMS) {
      await db.runAsync(
        "INSERT OR IGNORE INTO maintenance_items (name, description) VALUES (?, ?)",
        item.name,
        item.description
      );
    }

    const allTypes = await db.getAllAsync<{ id: number }>("SELECT id FROM vehicle_types");
    const allItems = await db.getAllAsync<{ id: number; name: string }>(
      "SELECT id, name FROM maintenance_items"
    );

    for (const type of allTypes) {
      for (const item of allItems) {
        const interval = GENERIC_INTERVALS[item.name];
        if (!interval) continue;
        await db.runAsync(
          `INSERT OR IGNORE INTO maintenance_intervals
             (vehicle_type_id, maintenance_item_id, interval_km, interval_months)
           VALUES (?, ?, ?, ?)`,
          type.id,
          item.id,
          interval.km,
          interval.months
        );
      }
    }
  });
}
