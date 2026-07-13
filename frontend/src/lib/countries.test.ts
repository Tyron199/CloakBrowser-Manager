import { describe, it, expect } from "vitest";
import { COUNTRIES, countryFlag, countryLabel, countryName } from "./countries";

describe("countries", () => {
  it("lists unique sorted country codes", () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    const names = COUNTRIES.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("resolves names and flags", () => {
    expect(countryName("US")).toBe("United States");
    expect(countryName("gb")).toBe("United Kingdom");
    expect(countryFlag("US")).toBe("🇺🇸");
    expect(countryLabel("DE")).toContain("Germany");
  });
});
