export interface CostEntry {
  date: string; // ISO date
  cost: number | null;
}

export interface MonthlyCostPoint {
  month: string; // "YYYY-MM"
  total: number;
}

/**
 * Buckets costs from any number of sources (maintenance records, fuel logs,
 * misc expenses — normalize each to {date, cost} at the call site) into one
 * combined total per calendar month, sorted oldest first.
 */
export function aggregateMonthlyCost(...sources: CostEntry[][]): MonthlyCostPoint[] {
  const totals = new Map<string, number>();

  for (const source of sources) {
    for (const entry of source) {
      if (entry.cost == null) continue;
      const month = entry.date.slice(0, 7);
      totals.set(month, (totals.get(month) ?? 0) + entry.cost);
    }
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}
