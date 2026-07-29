import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Initial catalog data: 5 scooter models (trimmed down from a planned 23)
 * to speed up the MVP. The maintenance intervals below are general figures
 * used across brands (not per-model research with a confidence rating) —
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

const MAINTENANCE_ITEMS: { name: string; description: string }[] = [
  { name: "Engine oil", description: "Replace engine oil" },
  { name: "CVT/gear oil", description: "Replace CVT gearbox oil" },
  { name: "Spark plug", description: "Replace or inspect the spark plug" },
  { name: "Air filter", description: "Clean or replace the air filter" },
  { name: "Battery", description: "Check battery condition" },
  { name: "Front brake pads", description: "Inspect or replace front brake pads" },
  { name: "Rear brake pads", description: "Inspect or replace rear brake pads" },
  { name: "CVT drive belt", description: "Replace the CVT drive belt" },
  { name: "CVT rollers", description: "Inspect or replace CVT rollers" },
  { name: "Tires", description: "Check tire pressure and tread wear" },
];

// Generic interval_km / interval_months for all scooter types (MVP)
const GENERIC_INTERVALS: Record<string, { km: number | null; months: number | null }> = {
  "Engine oil": { km: 2000, months: 2 },
  "CVT/gear oil": { km: 8000, months: 6 },
  "Spark plug": { km: 8000, months: 6 },
  "Air filter": { km: 8000, months: 6 },
  Battery: { km: null, months: 24 },
  "Front brake pads": { km: 10000, months: null },
  "Rear brake pads": { km: 10000, months: null },
  "CVT drive belt": { km: 24000, months: null },
  "CVT rollers": { km: 24000, months: null },
  Tires: { km: 20000, months: null },
};

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
