import { DEFAULT_THRESHOLDS, estimateNextDue, type DueSoonThresholds } from "./maintenanceCalculator";

const THRESHOLDS: DueSoonThresholds = { kmThreshold: 300, daysThreshold: 14 };

describe("estimateNextDue", () => {
  describe("km interval only", () => {
    it("computes dueKm from the last recorded km when a record exists", () => {
      const result = estimateNextDue(
        {
          intervalKm: 5000,
          intervalMonths: null,
          lastDoneKm: 12000,
          lastDoneDate: null,
          currentKm: 12100,
          currentDate: new Date("2026-01-01T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.dueKm).toBe(17000);
      expect(result.dueDate).toBeNull();
    });

    it("assumes 0 as the baseline when there's no service history yet", () => {
      const result = estimateNextDue(
        {
          intervalKm: 5000,
          intervalMonths: null,
          lastDoneKm: null,
          lastDoneDate: null,
          currentKm: 100,
          currentDate: new Date("2026-01-01T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.dueKm).toBe(5000);
    });

    it("is overdue once current km passes dueKm", () => {
      const result = estimateNextDue(
        {
          intervalKm: 5000,
          intervalMonths: null,
          lastDoneKm: 0,
          lastDoneDate: null,
          currentKm: 5001,
          currentDate: new Date("2026-01-01T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.status).toBe("overdue");
    });

    it("is due_soon when remaining km falls within the threshold", () => {
      const result = estimateNextDue(
        {
          intervalKm: 5000,
          intervalMonths: null,
          lastDoneKm: 0,
          lastDoneDate: null,
          currentKm: 4800, // remaining = 200
          currentDate: new Date("2026-01-01T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.status).toBe("due_soon");
    });

    it("treats exactly-at-threshold remaining km as due_soon (boundary inclusive)", () => {
      const result = estimateNextDue(
        {
          intervalKm: 5000,
          intervalMonths: null,
          lastDoneKm: 0,
          lastDoneDate: null,
          currentKm: 4700, // remaining = 300 == threshold
          currentDate: new Date("2026-01-01T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.status).toBe("due_soon");
    });

    it("is ontrack when remaining km is comfortably above the threshold", () => {
      const result = estimateNextDue(
        {
          intervalKm: 5000,
          intervalMonths: null,
          lastDoneKm: 0,
          lastDoneDate: null,
          currentKm: 1000,
          currentDate: new Date("2026-01-01T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.status).toBe("ontrack");
    });
  });

  describe("date interval only", () => {
    it("computes dueDate by adding the interval to the last service date", () => {
      const result = estimateNextDue(
        {
          intervalKm: null,
          intervalMonths: 6,
          lastDoneKm: null,
          lastDoneDate: "2026-01-15",
          currentKm: 0,
          currentDate: new Date("2026-01-20T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.dueDate).toBe("2026-07-15");
      expect(result.dueKm).toBeNull();
    });

    it("falls back to currentDate as the baseline when there's no service history", () => {
      const result = estimateNextDue(
        {
          intervalKm: null,
          intervalMonths: 3,
          lastDoneKm: null,
          lastDoneDate: null,
          currentKm: 0,
          currentDate: new Date("2026-01-01T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.dueDate).toBe("2026-04-01");
    });

    it("is overdue once the due date has passed", () => {
      const result = estimateNextDue(
        {
          intervalKm: null,
          intervalMonths: 1,
          lastDoneKm: null,
          lastDoneDate: "2026-01-01", // due 2026-02-01
          currentKm: 0,
          currentDate: new Date("2026-03-01T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.status).toBe("overdue");
    });

    it("is due_soon within the day threshold", () => {
      const result = estimateNextDue(
        {
          intervalKm: null,
          intervalMonths: 1,
          lastDoneKm: null,
          lastDoneDate: "2026-01-01", // due 2026-02-01, 7 days from currentDate
          currentKm: 0,
          currentDate: new Date("2026-01-25T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.status).toBe("due_soon");
    });

    it("is ontrack well before the due date", () => {
      const result = estimateNextDue(
        {
          intervalKm: null,
          intervalMonths: 6,
          lastDoneKm: null,
          lastDoneDate: "2026-01-01",
          currentKm: 0,
          currentDate: new Date("2026-01-15T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.status).toBe("ontrack");
    });
  });

  describe("combined km and date intervals", () => {
    it("uses the worse status when km is overdue but the date is still on track", () => {
      const result = estimateNextDue(
        {
          intervalKm: 5000,
          intervalMonths: 12,
          lastDoneKm: 0,
          lastDoneDate: "2026-01-01",
          currentKm: 5500, // km overdue
          currentDate: new Date("2026-02-01T00:00:00.000Z"), // date ontrack
        },
        THRESHOLDS
      );
      expect(result.status).toBe("overdue");
    });

    it("uses the worse status when the date is overdue but km is still on track", () => {
      const result = estimateNextDue(
        {
          intervalKm: 5000,
          intervalMonths: 1,
          lastDoneKm: 0,
          lastDoneDate: "2026-01-01", // due 2026-02-01
          currentKm: 100, // km ontrack
          currentDate: new Date("2026-03-01T00:00:00.000Z"), // date overdue
        },
        THRESHOLDS
      );
      expect(result.status).toBe("overdue");
    });

    it("is ontrack only when both km and date are comfortably ahead", () => {
      const result = estimateNextDue(
        {
          intervalKm: 5000,
          intervalMonths: 12,
          lastDoneKm: 0,
          lastDoneDate: "2026-01-01",
          currentKm: 100,
          currentDate: new Date("2026-02-01T00:00:00.000Z"),
        },
        THRESHOLDS
      );
      expect(result.status).toBe("ontrack");
    });
  });

  it("returns nulls and ontrack when the item has neither a km nor a month interval", () => {
    const result = estimateNextDue(
      {
        intervalKm: null,
        intervalMonths: null,
        lastDoneKm: null,
        lastDoneDate: null,
        currentKm: 500,
        currentDate: new Date("2026-01-01T00:00:00.000Z"),
      },
      THRESHOLDS
    );
    expect(result).toEqual({ dueKm: null, dueDate: null, status: "ontrack" });
  });

  it("uses DEFAULT_THRESHOLDS when no thresholds argument is passed", () => {
    const result = estimateNextDue({
      intervalKm: 5000,
      intervalMonths: null,
      lastDoneKm: 0,
      lastDoneDate: null,
      currentKm: 4700, // remaining = 300 == DEFAULT_DUE_SOON_KM_THRESHOLD
      currentDate: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(result.status).toBe("due_soon");
    expect(DEFAULT_THRESHOLDS.kmThreshold).toBe(300);
  });
});
