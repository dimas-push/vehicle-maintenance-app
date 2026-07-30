import type { VehicleClass } from "../types/models";

/**
 * Generic interval_km / interval_months applied to catalog and custom
 * vehicle types alike, split by vehicle class since a scooter and a car
 * share only some maintenance items (engine oil, tires, brake pads) and
 * otherwise need entirely different ones (CVT belt vs. timing belt). These
 * are general figures, not per-model research with a confidence rating —
 * re-check them against the manufacturer's manual before citing them as a
 * final reference in a report.
 */
interface IntervalItem {
  name: string;
  description: string;
  km: number | null;
  months: number | null;
}

const MOTORCYCLE_ITEMS: IntervalItem[] = [
  { name: "Engine oil", description: "Replace engine oil", km: 2000, months: 2 },
  { name: "CVT/gear oil", description: "Replace CVT gearbox oil", km: 8000, months: 6 },
  { name: "Spark plug", description: "Replace or inspect the spark plug", km: 8000, months: 6 },
  { name: "Air filter", description: "Clean or replace the air filter", km: 8000, months: 6 },
  { name: "Battery", description: "Check battery condition", km: null, months: 24 },
  { name: "Front brake pads", description: "Inspect or replace front brake pads", km: 10000, months: null },
  { name: "Rear brake pads", description: "Inspect or replace rear brake pads", km: 10000, months: null },
  { name: "CVT drive belt", description: "Replace the CVT drive belt", km: 24000, months: null },
  { name: "CVT rollers", description: "Inspect or replace CVT rollers", km: 24000, months: null },
  { name: "Tires", description: "Check tire pressure and tread wear", km: 20000, months: null },
];

const CAR_ITEMS: IntervalItem[] = [
  { name: "Engine oil", description: "Replace engine oil and filter", km: 8000, months: 6 },
  { name: "Air filter", description: "Replace the engine air filter", km: 24000, months: 12 },
  { name: "Cabin air filter", description: "Replace the cabin/pollen air filter", km: 24000, months: 12 },
  { name: "Spark plug", description: "Replace spark plugs", km: 48000, months: 36 },
  { name: "Front brake pads", description: "Inspect or replace front brake pads", km: 40000, months: null },
  { name: "Rear brake pads", description: "Inspect or replace rear brake pads", km: 60000, months: null },
  { name: "Brake fluid", description: "Flush and replace brake fluid", km: null, months: 24 },
  { name: "Coolant", description: "Flush and replace engine coolant/antifreeze", km: 80000, months: 60 },
  { name: "Transmission fluid", description: "Replace transmission fluid", km: 60000, months: null },
  { name: "Timing belt", description: "Replace timing belt, if equipped (many newer engines use a timing chain instead)", km: 100000, months: 60 },
  { name: "Battery", description: "Check battery condition", km: null, months: 36 },
  { name: "Tires", description: "Rotate and check tread wear", km: 40000, months: null },
  { name: "Wiper blades", description: "Replace wiper blades", km: null, months: 12 },
];

const ITEMS_BY_CLASS: Record<VehicleClass, IntervalItem[]> = {
  motorcycle: MOTORCYCLE_ITEMS,
  car: CAR_ITEMS,
};

export function intervalsForClass(vehicleClass: VehicleClass): IntervalItem[] {
  return ITEMS_BY_CLASS[vehicleClass];
}

/** Every item across both classes, deduped by name, for seeding the shared maintenance_items catalog. */
export function allMaintenanceItems(): { name: string; description: string }[] {
  const byName = new Map<string, string>();
  for (const item of [...MOTORCYCLE_ITEMS, ...CAR_ITEMS]) {
    if (!byName.has(item.name)) byName.set(item.name, item.description);
  }
  return [...byName.entries()].map(([name, description]) => ({ name, description }));
}
