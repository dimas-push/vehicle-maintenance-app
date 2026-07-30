import { getVehicleTypeWithBrandName } from "../repositories/catalogRepository";
import { getVehicle } from "../repositories/vehicleRepository";
import { replaceRecallsForVehicle } from "../repositories/recallRepository";
import { parseNhtsaDate } from "../utils/nhtsaDate";

interface NhtsaRecallResult {
  NHTSACampaignNumber: string;
  Component: string;
  Summary: string;
  Consequence: string | null;
  Remedy: string | null;
  ReportReceivedDate: string | null;
}

interface NhtsaResponse {
  Count: number;
  Message: string;
  results: NhtsaRecallResult[];
}

/**
 * Looks up open recalls for a vehicle from NHTSA's free public API (no key
 * required) by make/model/year, caches the result locally, and returns how
 * many were found. Coverage is US-market only — non-US models (most of this
 * app's motorcycle catalog included) will legitimately come back empty.
 */
export async function checkRecallsForVehicle(vehicleId: number): Promise<number> {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) throw new Error("Vehicle not found.");
  if (!vehicle.year) {
    throw new Error("Add this vehicle's year first — recalls are looked up by make, model, and year.");
  }

  const typeInfo = await getVehicleTypeWithBrandName(vehicle.vehicle_type_id);
  if (!typeInfo) throw new Error("Vehicle type not found.");

  const params = new URLSearchParams({
    make: typeInfo.brandName,
    model: typeInfo.typeName,
    modelYear: String(vehicle.year),
  });

  const response = await fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Recall lookup failed (${response.status}). Try again later.`);
  }
  const data: NhtsaResponse = await response.json();

  await replaceRecallsForVehicle(
    vehicleId,
    data.results.map((r) => ({
      campaign_number: r.NHTSACampaignNumber,
      component: r.Component,
      summary: r.Summary,
      consequence: r.Consequence,
      remedy: r.Remedy,
      report_received_date: parseNhtsaDate(r.ReportReceivedDate),
    }))
  );

  return data.results.length;
}
