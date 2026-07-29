import AsyncStorage from "@react-native-async-storage/async-storage";

export type DistanceUnit = "km" | "mi";

const STORAGE_KEY = "distance_unit";
const KM_PER_MILE = 1.609344;

export async function getUnitPreference(): Promise<DistanceUnit> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored === "mi" ? "mi" : "km";
}

export async function setUnitPreference(unit: DistanceUnit): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, unit);
}

/** Converts a value stored in km (the canonical DB unit) to the display unit. */
export function kmToDisplay(km: number, unit: DistanceUnit): number {
  return unit === "mi" ? km / KM_PER_MILE : km;
}

/** Converts a value typed by the user in the display unit back to km for storage. */
export function displayToKm(value: number, unit: DistanceUnit): number {
  return unit === "mi" ? value * KM_PER_MILE : value;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  const value = Math.round(kmToDisplay(km, unit));
  return `${value.toLocaleString("en-US")} ${unit}`;
}
