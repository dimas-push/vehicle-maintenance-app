import { getDb } from "../db";
import type { MaintenanceRecord, MaintenanceSchedule } from "../types/models";
import { estimateNextDue } from "../utils/maintenanceCalculator";
import { getReminderThresholds } from "../utils/reminderSettings";
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
 * Recalculates every maintenance schedule for a vehicle based on the catalog
 * intervals and the latest service history, then saves the result. Called
 * after the odometer is updated or after a maintenance task is marked done.
 */
export async function recalculateSchedules(vehicleId: number): Promise<void> {
  const db = await getDb();
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) throw new Error(`Vehicle ${vehicleId} not found`);

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
  const thresholds = await getReminderThresholds();

  await db.withTransactionAsync(async () => {
    for (const interval of intervals) {
      const lastRecord = await db.getFirstAsync<{ done_at_km: number; done_at_date: string }>(
        `SELECT done_at_km, done_at_date FROM maintenance_records
          WHERE vehicle_id = ? AND maintenance_item_id = ?
          ORDER BY done_at_date DESC LIMIT 1`,
        vehicleId,
        interval.maintenance_item_id
      );

      const estimate = estimateNextDue(
        {
          intervalKm: interval.interval_km,
          intervalMonths: interval.interval_months,
          lastDoneKm: lastRecord?.done_at_km ?? null,
          lastDoneDate: lastRecord?.done_at_date ?? null,
          currentKm: vehicle.current_km,
          currentDate: now,
        },
        thresholds
      );

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

export async function listMaintenanceRecords(vehicleId: number): Promise<
  (MaintenanceRecord & { item_name: string; shop_name: string | null })[]
> {
  const db = await getDb();
  return db.getAllAsync<MaintenanceRecord & { item_name: string; shop_name: string | null }>(
    `SELECT mr.*, mi.name AS item_name, ss.name AS shop_name
       FROM maintenance_records mr
       JOIN maintenance_items mi ON mi.id = mr.maintenance_item_id
       LEFT JOIN service_shops ss ON ss.id = mr.shop_id
      WHERE mr.vehicle_id = ?
      ORDER BY mr.done_at_date DESC, mr.id DESC`,
    vehicleId
  );
}

export interface RecordMaintenanceDoneInput {
  vehicleId: number;
  maintenanceItemId: number;
  doneAtKm: number;
  doneAtDate: string;
  notes?: string | null;
  cost?: number | null;
  photoUri?: string | null;
  shopId?: number | null;
}

export async function recordMaintenanceDone(input: RecordMaintenanceDoneInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO maintenance_records
       (vehicle_id, maintenance_item_id, done_at_km, done_at_date, notes, cost, photo_uri, shop_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.vehicleId,
    input.maintenanceItemId,
    input.doneAtKm,
    input.doneAtDate,
    input.notes ?? null,
    input.cost ?? null,
    input.photoUri ?? null,
    input.shopId ?? null
  );
  await recalculateSchedules(input.vehicleId);
}

/** Suppresses notifications for this schedule until the given date (or clears the snooze if null). */
export async function snoozeSchedule(scheduleId: number, untilDate: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE maintenance_schedules SET snoozed_until = ? WHERE id = ?", untilDate, scheduleId);
}
