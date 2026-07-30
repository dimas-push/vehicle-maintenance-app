import type { FuelLog } from "../types/models";

export interface EconomySegment {
  fromKm: number;
  toKm: number;
  distanceKm: number;
  volumeLiters: number;
  toDate: string;
}

/**
 * Pairs of consecutive full-tank fill-ups, oldest first, each yielding one
 * distance/volume segment for an economy calculation. A partial fill breaks
 * the chain (its volume isn't attributed to either neighboring segment)
 * since it doesn't represent a complete consumption cycle.
 */
export function computeEconomySegments(logsNewestFirst: FuelLog[]): EconomySegment[] {
  const logs = [...logsNewestFirst].reverse(); // oldest first
  const segments: EconomySegment[] = [];
  let lastFullTank: FuelLog | null = null;

  for (const log of logs) {
    if (!lastFullTank) {
      if (log.full_tank) lastFullTank = log;
      continue;
    }
    if (!log.full_tank) continue; // partial fill: skip, don't break the chain's next segment

    segments.push({
      fromKm: lastFullTank.filled_at_km,
      toKm: log.filled_at_km,
      distanceKm: log.filled_at_km - lastFullTank.filled_at_km,
      volumeLiters: log.volume_liters,
      toDate: log.filled_at_date,
    });
    lastFullTank = log;
  }

  return segments;
}
