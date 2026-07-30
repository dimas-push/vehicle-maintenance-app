import { computeEconomySegments } from "./fuelEconomy";
import type { FuelLog } from "../types/models";

let nextId = 1;
beforeEach(() => {
  nextId = 1;
});

function log(overrides: Partial<FuelLog>): FuelLog {
  return {
    id: nextId++,
    vehicle_id: 1,
    filled_at_km: 0,
    filled_at_date: "2026-01-01",
    volume_liters: 10,
    cost: null,
    full_tank: 1,
    notes: null,
    ...overrides,
  };
}

describe("computeEconomySegments", () => {
  it("returns no segments for an empty log list", () => {
    expect(computeEconomySegments([])).toEqual([]);
  });

  it("returns no segments when there's only one full-tank fill-up", () => {
    const logs = [log({ filled_at_km: 1000, filled_at_date: "2026-01-10" })];
    expect(computeEconomySegments(logs)).toEqual([]);
  });

  it("pairs two consecutive full-tank fill-ups into one segment", () => {
    // Logs come in newest-first, matching listFuelLogs' ORDER BY.
    const logs = [
      log({ filled_at_km: 1500, filled_at_date: "2026-01-20", volume_liters: 12 }),
      log({ filled_at_km: 1000, filled_at_date: "2026-01-10", volume_liters: 10 }),
    ];
    expect(computeEconomySegments(logs)).toEqual([
      { fromKm: 1000, toKm: 1500, distanceKm: 500, volumeLiters: 12, toDate: "2026-01-20" },
    ]);
  });

  it("keeps the chain across a partial fill without attributing its volume to either segment", () => {
    const logs = [
      log({ filled_at_km: 2000, filled_at_date: "2026-01-30", volume_liters: 11, full_tank: 1 }),
      log({ filled_at_km: 1600, filled_at_date: "2026-01-22", volume_liters: 5, full_tank: 0 }),
      log({ filled_at_km: 1000, filled_at_date: "2026-01-10", volume_liters: 10, full_tank: 1 }),
    ];
    expect(computeEconomySegments(logs)).toEqual([
      { fromKm: 1000, toKm: 2000, distanceKm: 1000, volumeLiters: 11, toDate: "2026-01-30" },
    ]);
  });

  it("ignores partial fills before the first full tank instead of starting a chain from them", () => {
    const logs = [
      log({ filled_at_km: 1500, filled_at_date: "2026-01-20", volume_liters: 12, full_tank: 1 }),
      log({ filled_at_km: 1200, filled_at_date: "2026-01-15", volume_liters: 4, full_tank: 0 }),
      log({ filled_at_km: 1000, filled_at_date: "2026-01-10", volume_liters: 10, full_tank: 1 }),
    ];
    expect(computeEconomySegments(logs)).toEqual([
      { fromKm: 1000, toKm: 1500, distanceKm: 500, volumeLiters: 12, toDate: "2026-01-20" },
    ]);
  });

  it("produces one segment per consecutive full-tank pair across three or more fill-ups", () => {
    const logs = [
      log({ filled_at_km: 3000, filled_at_date: "2026-02-01", volume_liters: 13, full_tank: 1 }),
      log({ filled_at_km: 2000, filled_at_date: "2026-01-20", volume_liters: 12, full_tank: 1 }),
      log({ filled_at_km: 1000, filled_at_date: "2026-01-10", volume_liters: 10, full_tank: 1 }),
    ];
    expect(computeEconomySegments(logs)).toEqual([
      { fromKm: 1000, toKm: 2000, distanceKm: 1000, volumeLiters: 12, toDate: "2026-01-20" },
      { fromKm: 2000, toKm: 3000, distanceKm: 1000, volumeLiters: 13, toDate: "2026-02-01" },
    ]);
  });
});
