import type { FuelType, Transmission } from "../types/models";

export const TRANSMISSION_LABEL: Record<Transmission, string> = {
  manual: "Manual",
  automatic: "Automatic",
  cvt: "CVT",
  dct: "DCT",
  other: "Other",
};

export const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
  other: "Other",
};

interface VehicleSpecFields {
  year: number | null;
  color: string | null;
  engine_size: string | null;
  transmission: Transmission | null;
  fuel_type: FuelType | null;
}

/** One-line summary of the optional spec fields, e.g. "2022 • Blue • 150cc • Automatic • Gasoline". */
export function formatVehicleSpecs(vehicle: VehicleSpecFields): string {
  const parts = [
    vehicle.year != null ? String(vehicle.year) : null,
    vehicle.color,
    vehicle.engine_size,
    vehicle.transmission ? TRANSMISSION_LABEL[vehicle.transmission] : null,
    vehicle.fuel_type ? FUEL_TYPE_LABEL[vehicle.fuel_type] : null,
  ].filter((part): part is string => !!part);
  return parts.join(" • ");
}
