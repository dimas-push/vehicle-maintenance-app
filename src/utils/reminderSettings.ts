import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_DUE_SOON_DAYS_THRESHOLD,
  DEFAULT_DUE_SOON_KM_THRESHOLD,
  type DueSoonThresholds,
} from "./maintenanceCalculator";

const KM_KEY = "due_soon_km_threshold";
const DAYS_KEY = "due_soon_days_threshold";

export async function getReminderThresholds(): Promise<DueSoonThresholds> {
  const [kmRaw, daysRaw] = await Promise.all([
    AsyncStorage.getItem(KM_KEY),
    AsyncStorage.getItem(DAYS_KEY),
  ]);
  const kmThreshold = kmRaw != null ? Number(kmRaw) : DEFAULT_DUE_SOON_KM_THRESHOLD;
  const daysThreshold = daysRaw != null ? Number(daysRaw) : DEFAULT_DUE_SOON_DAYS_THRESHOLD;
  return {
    kmThreshold: Number.isFinite(kmThreshold) && kmThreshold > 0 ? kmThreshold : DEFAULT_DUE_SOON_KM_THRESHOLD,
    daysThreshold:
      Number.isFinite(daysThreshold) && daysThreshold > 0 ? daysThreshold : DEFAULT_DUE_SOON_DAYS_THRESHOLD,
  };
}

export async function setReminderThresholds(thresholds: DueSoonThresholds): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KM_KEY, String(thresholds.kmThreshold)),
    AsyncStorage.setItem(DAYS_KEY, String(thresholds.daysThreshold)),
  ]);
}
