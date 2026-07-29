import { formatVehicleSpecs } from "./vehicleSpecs";

const EMPTY = { year: null, color: null, engine_size: null, transmission: null, fuel_type: null };

describe("formatVehicleSpecs", () => {
  it("returns an empty string when no spec fields are set", () => {
    expect(formatVehicleSpecs(EMPTY)).toBe("");
  });

  it("joins every set field in a fixed order, separated by bullets", () => {
    expect(
      formatVehicleSpecs({
        year: 2022,
        color: "Blue",
        engine_size: "150cc",
        transmission: "automatic",
        fuel_type: "gasoline",
      })
    ).toBe("2022 • Blue • 150cc • Automatic • Gasoline");
  });

  it("skips unset fields instead of leaving gaps or stray separators", () => {
    expect(formatVehicleSpecs({ ...EMPTY, color: "Red", fuel_type: "electric" })).toBe("Red • Electric");
  });

  it("formats a lone year with no other fields", () => {
    expect(formatVehicleSpecs({ ...EMPTY, year: 2019 })).toBe("2019");
  });
});
