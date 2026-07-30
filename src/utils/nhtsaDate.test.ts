import { parseNhtsaDate } from "./nhtsaDate";

describe("parseNhtsaDate", () => {
  it("converts a DD/MM/YYYY date to ISO YYYY-MM-DD", () => {
    expect(parseNhtsaDate("28/05/2020")).toBe("2020-05-28");
  });

  it("returns null for null input", () => {
    expect(parseNhtsaDate(null)).toBeNull();
  });

  it("returns null for an unrecognized format instead of guessing", () => {
    expect(parseNhtsaDate("2020-05-28")).toBeNull();
    expect(parseNhtsaDate("not a date")).toBeNull();
    expect(parseNhtsaDate("")).toBeNull();
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseNhtsaDate("  01/12/1999  ")).toBe("1999-12-01");
  });
});
