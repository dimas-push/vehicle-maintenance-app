import { statusFromExpiry } from "./documentStatus";

const THRESHOLD = 14;

describe("statusFromExpiry", () => {
  it("is overdue once the expiry date has passed", () => {
    const status = statusFromExpiry("2026-01-01", THRESHOLD, new Date("2026-02-01T00:00:00.000Z"));
    expect(status).toBe("overdue");
  });

  it("is overdue on the expiry date itself", () => {
    const status = statusFromExpiry("2026-01-01T00:00:00.000Z", THRESHOLD, new Date("2026-01-01T00:00:00.000Z"));
    expect(status).toBe("overdue");
  });

  it("is due_soon within the day threshold", () => {
    const status = statusFromExpiry("2026-02-01", THRESHOLD, new Date("2026-01-25T00:00:00.000Z"));
    expect(status).toBe("due_soon");
  });

  it("treats exactly-at-threshold days remaining as due_soon (boundary inclusive)", () => {
    const status = statusFromExpiry("2026-01-15", THRESHOLD, new Date("2026-01-01T00:00:00.000Z"));
    expect(status).toBe("due_soon");
  });

  it("is ontrack well before the expiry date", () => {
    const status = statusFromExpiry("2026-07-01", THRESHOLD, new Date("2026-01-01T00:00:00.000Z"));
    expect(status).toBe("ontrack");
  });

  it("defaults now to the current date when not passed", () => {
    // A document that expired decades ago is overdue regardless of when the test runs.
    const status = statusFromExpiry("2000-01-01", THRESHOLD);
    expect(status).toBe("overdue");
  });
});
