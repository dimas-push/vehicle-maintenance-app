import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { getDb } from "../db";
import type { ScheduleStatus } from "../types/models";

const CHANNEL_ID = "maintenance-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function initNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Maintenance reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

interface DueScheduleRow {
  id: number;
  vehicle_id: number;
  status: ScheduleStatus;
  item_name: string;
  nickname: string;
}

/**
 * Sends a local notification for any schedule that just reached due_soon or
 * overdue and hasn't been notified at that severity yet. Call this after
 * recalculateSchedules() so reminders stay in sync with the latest status.
 */
export async function notifyDueSchedules(vehicleId: number): Promise<void> {
  if (Platform.OS === "web") return;

  const db = await getDb();
  const dueSchedules = await db.getAllAsync<DueScheduleRow>(
    `SELECT ms.id, ms.vehicle_id, ms.status, mi.name AS item_name, v.nickname
       FROM maintenance_schedules ms
       JOIN maintenance_items mi ON mi.id = ms.maintenance_item_id
       JOIN vehicles v ON v.id = ms.vehicle_id
      WHERE ms.vehicle_id = ? AND ms.status IN ('due_soon', 'overdue')`,
    vehicleId
  );

  for (const schedule of dueSchedules) {
    const existing = await db.getFirstAsync<{ notified_status: ScheduleStatus }>(
      "SELECT notified_status FROM reminders WHERE schedule_id = ?",
      schedule.id
    );

    // Already notified at this severity or worse — don't repeat the same alert.
    if (existing?.notified_status === schedule.status) continue;
    if (existing?.notified_status === "overdue" && schedule.status === "due_soon") continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: schedule.status === "overdue" ? "Maintenance overdue" : "Maintenance due soon",
        body: `${schedule.nickname}: ${schedule.item_name}`,
      },
      trigger: null,
    });

    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO reminders (vehicle_id, schedule_id, notified_status, notified_at, channel)
       VALUES (?, ?, ?, ?, 'push')
       ON CONFLICT (schedule_id) DO UPDATE SET
         notified_status = excluded.notified_status,
         notified_at = excluded.notified_at`,
      schedule.vehicle_id,
      schedule.id,
      schedule.status,
      now
    );
  }
}
