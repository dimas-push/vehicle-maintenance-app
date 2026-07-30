import { aggregateMonthlyCost } from "./costTrend";

describe("aggregateMonthlyCost", () => {
  it("returns an empty array when there is nothing to aggregate", () => {
    expect(aggregateMonthlyCost([])).toEqual([]);
  });

  it("buckets a single source by calendar month", () => {
    const result = aggregateMonthlyCost([
      { date: "2026-01-05", cost: 10 },
      { date: "2026-01-20", cost: 5 },
      { date: "2026-02-01", cost: 7 },
    ]);
    expect(result).toEqual([
      { month: "2026-01", total: 15 },
      { month: "2026-02", total: 7 },
    ]);
  });

  it("combines multiple sources into the same month bucket", () => {
    const maintenance = [{ date: "2026-03-10", cost: 65 }];
    const fuel = [{ date: "2026-03-15", cost: 20 }];
    const expenses = [{ date: "2026-03-01", cost: 5 }];
    expect(aggregateMonthlyCost(maintenance, fuel, expenses)).toEqual([{ month: "2026-03", total: 90 }]);
  });

  it("ignores entries with a null cost instead of treating them as zero-cost noise", () => {
    const result = aggregateMonthlyCost([
      { date: "2026-01-05", cost: null },
      { date: "2026-01-06", cost: 10 },
    ]);
    expect(result).toEqual([{ month: "2026-01", total: 10 }]);
  });

  it("sorts months chronologically regardless of input order", () => {
    const result = aggregateMonthlyCost([
      { date: "2026-05-01", cost: 1 },
      { date: "2025-12-01", cost: 2 },
      { date: "2026-01-01", cost: 3 },
    ]);
    expect(result.map((p) => p.month)).toEqual(["2025-12", "2026-01", "2026-05"]);
  });
});
