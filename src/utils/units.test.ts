import { economyValue } from "./units";

describe("economyValue", () => {
  it("computes distance per volume in km/liters when no conversion is needed", () => {
    expect(economyValue(100, 5, "km", "liters")).toBe(20);
  });

  it("converts both distance and volume before dividing", () => {
    // 100 km ≈ 62.14 mi, 5 L ≈ 1.32 gal → ≈ 47 mi/gal
    const result = economyValue(100, 5, "mi", "gallons");
    expect(result).not.toBeNull();
    expect(result as number).toBeCloseTo(47.05, 1);
  });

  it("returns null instead of dividing by zero when volume is 0", () => {
    expect(economyValue(100, 0, "km", "liters")).toBeNull();
  });
});
