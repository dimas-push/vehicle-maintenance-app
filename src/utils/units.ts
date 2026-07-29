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

export type VolumeUnit = "liters" | "gallons";

const VOLUME_STORAGE_KEY = "volume_unit";
const LITERS_PER_GALLON = 3.785411784; // US gallon

export async function getVolumeUnitPreference(): Promise<VolumeUnit> {
  const stored = await AsyncStorage.getItem(VOLUME_STORAGE_KEY);
  return stored === "gallons" ? "gallons" : "liters";
}

export async function setVolumeUnitPreference(unit: VolumeUnit): Promise<void> {
  await AsyncStorage.setItem(VOLUME_STORAGE_KEY, unit);
}

/** Converts a value stored in liters (the canonical DB unit) to the display unit. */
export function litersToDisplay(liters: number, unit: VolumeUnit): number {
  return unit === "gallons" ? liters / LITERS_PER_GALLON : liters;
}

/** Converts a value typed by the user in the display unit back to liters for storage. */
export function displayToLiters(value: number, unit: VolumeUnit): number {
  return unit === "gallons" ? value * LITERS_PER_GALLON : value;
}

export function formatVolume(liters: number, unit: VolumeUnit): string {
  const value = litersToDisplay(liters, unit);
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${unit === "gallons" ? "gal" : "L"}`;
}

/** Fuel economy as distance-per-volume (higher is better) in whichever units are selected. */
export function formatEconomy(
  distanceKm: number,
  volumeLiters: number,
  distanceUnit: DistanceUnit,
  volumeUnit: VolumeUnit
): string {
  if (volumeLiters <= 0) return "—";
  const distance = kmToDisplay(distanceKm, distanceUnit);
  const volume = litersToDisplay(volumeLiters, volumeUnit);
  const economy = distance / volume;
  const distanceLabel = distanceUnit === "mi" ? "mi" : "km";
  const volumeLabel = volumeUnit === "gallons" ? "gal" : "L";
  return `${economy.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${distanceLabel}/${volumeLabel}`;
}
