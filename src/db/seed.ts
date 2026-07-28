import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Data katalog awal: 5 motor matic (disederhanakan dari rencana 23 model)
 * untuk mempercepat MVP. Interval perawatan di bawah adalah angka umum yang
 * dipakai lintas merek (bukan hasil riset per-model dengan confidence level) —
 * validasi ulang ke buku manual masing-masing sebelum dipakai sebagai acuan
 * final di laporan.
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
  { name: "Oli mesin", description: "Ganti oli mesin" },
  { name: "Oli gardan/CVT", description: "Ganti oli gardan (girboks CVT)" },
  { name: "Busi", description: "Ganti atau cek busi" },
  { name: "Filter udara", description: "Bersihkan/ganti filter udara" },
  { name: "Aki", description: "Cek kondisi aki" },
  { name: "Kampas rem depan", description: "Cek/ganti kampas rem depan" },
  { name: "Kampas rem belakang", description: "Cek/ganti kampas rem belakang" },
  { name: "Van belt (CVT)", description: "Ganti van belt CVT" },
  { name: "Roller CVT", description: "Cek/ganti roller CVT" },
  { name: "Ban", description: "Cek tekanan dan keausan ban" },
];

// interval_km / interval_months generik untuk semua tipe matic (MVP)
const GENERIC_INTERVALS: Record<string, { km: number | null; months: number | null }> = {
  "Oli mesin": { km: 2000, months: 2 },
  "Oli gardan/CVT": { km: 8000, months: 6 },
  Busi: { km: 8000, months: 6 },
  "Filter udara": { km: 8000, months: 6 },
  Aki: { km: null, months: 24 },
  "Kampas rem depan": { km: 10000, months: null },
  "Kampas rem belakang": { km: 10000, months: null },
  "Van belt (CVT)": { km: 24000, months: null },
  "Roller CVT": { km: 24000, months: null },
  Ban: { km: 20000, months: null },
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
        "INSERT OR IGNORE INTO vehicle_types (brand_id, name, category) VALUES (?, ?, 'matic')",
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
