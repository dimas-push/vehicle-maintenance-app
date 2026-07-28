import { getDb } from "../db";
import type { MaintenanceSchedule } from "../types/models";
import { estimateNextDue } from "../utils/maintenanceCalculator";
import { getVehicle } from "./vehicleRepository";

export async function listSchedulesForVehicle(vehicleId: number): Promise<
  (MaintenanceSchedule & { item_name: string })[]
> {
  const db = await getDb();
  return db.getAllAsync<MaintenanceSchedule & { item_name: string }>(
    `SELECT ms.*, mi.name AS item_name
       FROM maintenance_schedules ms
       JOIN maintenance_items mi ON mi.id = ms.maintenance_item_id
      WHERE ms.vehicle_id = ?
      ORDER BY ms.status DESC, ms.due_km ASC`,
    vehicleId
  );
}

/**
 * Hitung ulang semua jadwal perawatan sebuah kendaraan berdasarkan interval
 * katalog dan riwayat terakhir, lalu simpan hasilnya. Dipanggil setelah km
 * di-update atau setelah sebuah perawatan dicatat selesai.
 */
export async function recalculateSchedules(vehicleId: number): Promise<void> {
  const db = await getDb();
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) throw new Error(`Kendaraan ${vehicleId} tidak ditemukan`);

  const intervals = await db.getAllAsync<{
    maintenance_item_id: number;
    interval_km: number | null;
    interval_months: number | null;
  }>(
    "SELECT maintenance_item_id, interval_km, interval_months FROM maintenance_intervals WHERE vehicle_type_id = ?",
    vehicle.vehicle_type_id
  );

  const now = new Date();
  const nowIso = now.toISOString();

  await db.withTransactionAsync(async () => {
    for (const interval of intervals) {
      const lastRecord = await db.getFirstAsync<{ done_at_km: number; done_at_date: string }>(
        `SELECT done_at_km, done_at_date FROM maintenance_records
          WHERE vehicle_id = ? AND maintenance_item_id = ?
          ORDER BY done_at_date DESC LIMIT 1`,
        vehicleId,
        interval.maintenance_item_id
      );

      const estimate = estimateNextDue({
        intervalKm: interval.interval_km,
        intervalMonths: interval.interval_months,
        lastDoneKm: lastRecord?.done_at_km ?? null,
        lastDoneDate: lastRecord?.done_at_date ?? null,
        currentKm: vehicle.current_km,
        currentDate: now,
      });

      await db.runAsync(
        `INSERT INTO maintenance_schedules
           (vehicle_id, maintenance_item_id, due_km, due_date, status, last_calculated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (vehicle_id, maintenance_item_id) DO UPDATE SET
           due_km = excluded.due_km,
           due_date = excluded.due_date,
           status = excluded.status,
           last_calculated_at = excluded.last_calculated_at`,
        vehicleId,
        interval.maintenance_item_id,
        estimate.dueKm,
        estimate.dueDate,
        estimate.status,
        nowIso
      );
    }
  });
}

export async function recordMaintenanceDone(
  vehicleId: number,
  maintenanceItemId: number,
  doneAtKm: number,
  doneAtDate: string,
  notes?: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO maintenance_records
       (vehicle_id, maintenance_item_id, done_at_km, done_at_date, notes)
     VALUES (?, ?, ?, ?, ?)`,
    vehicleId,
    maintenanceItemId,
    doneAtKm,
    doneAtDate,
    notes ?? null
  );
  await recalculateSchedules(vehicleId);
}
