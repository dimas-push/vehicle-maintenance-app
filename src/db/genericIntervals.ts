/**
 * Generic interval_km / interval_months applied to every scooter-category
 * vehicle type — both the seeded catalog models and any custom (user-typed)
 * brand/model, since we have no per-model research for the latter either.
 */
export const MAINTENANCE_ITEMS: { name: string; description: string }[] = [
  { name: "Engine oil", description: "Replace engine oil" },
  { name: "CVT/gear oil", description: "Replace CVT gearbox oil" },
  { name: "Spark plug", description: "Replace or inspect the spark plug" },
  { name: "Air filter", description: "Clean or replace the air filter" },
  { name: "Battery", description: "Check battery condition" },
  { name: "Front brake pads", description: "Inspect or replace front brake pads" },
  { name: "Rear brake pads", description: "Inspect or replace rear brake pads" },
  { name: "CVT drive belt", description: "Replace the CVT drive belt" },
  { name: "CVT rollers", description: "Inspect or replace CVT rollers" },
  { name: "Tires", description: "Check tire pressure and tread wear" },
];

export const GENERIC_INTERVALS: Record<string, { km: number | null; months: number | null }> = {
  "Engine oil": { km: 2000, months: 2 },
  "CVT/gear oil": { km: 8000, months: 6 },
  "Spark plug": { km: 8000, months: 6 },
  "Air filter": { km: 8000, months: 6 },
  Battery: { km: null, months: 24 },
  "Front brake pads": { km: 10000, months: null },
  "Rear brake pads": { km: 10000, months: null },
  "CVT drive belt": { km: 24000, months: null },
  "CVT rollers": { km: 24000, months: null },
  Tires: { km: 20000, months: null },
};
