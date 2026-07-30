import { getDb } from "../db";
import type { VehicleRecall } from "../types/models";

export interface RecallInput {
  campaign_number: string;
  component: string;
  summary: string;
  consequence: string | null;
  remedy: string | null;
  report_received_date: string | null;
}

export async function listRecallsForVehicle(vehicleId: number): Promise<VehicleRecall[]> {
  const db = await getDb();
  return db.getAllAsync<VehicleRecall>(
    "SELECT * FROM vehicle_recalls WHERE vehicle_id = ? ORDER BY report_received_date DESC",
    vehicleId
  );
}

/** Replaces the cached recall list wholesale and stamps when the check ran. */
export async function replaceRecallsForVehicle(vehicleId: number, recalls: RecallInput[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM vehicle_recalls WHERE vehicle_id = ?", vehicleId);
    for (const recall of recalls) {
      await db.runAsync(
        `INSERT INTO vehicle_recalls
           (vehicle_id, campaign_number, component, summary, consequence, remedy, report_received_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (vehicle_id, campaign_number) DO NOTHING`,
        vehicleId,
        recall.campaign_number,
        recall.component,
        recall.summary,
        recall.consequence,
        recall.remedy,
        recall.report_received_date
      );
    }
    await db.runAsync("UPDATE vehicles SET recalls_checked_at = ? WHERE id = ?", new Date().toISOString(), vehicleId);
  });
}
