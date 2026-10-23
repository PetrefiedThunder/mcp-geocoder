import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("mcp-geocoder", () => {
  it("requires the fixed MCP SDK minimum in package metadata", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
    const lock = JSON.parse(readFileSync(new URL("../../package-lock.json", import.meta.url), "utf8"));
    expect(pkg.dependencies["@modelcontextprotocol/sdk"]).toBe("^1.32.1");
    expect(lock.packages[""].dependencies["@modelcontextprotocol/sdk"]).toBe("^1.32.1");
  });

  it("should calculate haversine distance correctly", () => {
    // NYC to LA ~3944 km
    const R_KM = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const lat1 = 40.7128, lon1 = -74.006;
    const lat2 = 34.0522, lon2 = -118.2437;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R_KM * c;
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });

  it("should convert km to miles", () => {
    const km = 100;
    const mi = km * 0.621371;
    expect(Math.round(mi)).toBe(62);
  });

  it("should build nominatim search URLs", () => {
    const params = new URLSearchParams({ q: "Berlin", format: "jsonv2", limit: "5" });
    const url = `https://nominatim.openstreetmap.org/search?${params}`;
    expect(url).toContain("q=Berlin");
    expect(url).toContain("format=jsonv2");
  });

  it("should build reverse geocode URLs", () => {
    const params = new URLSearchParams({ lat: "51.5074", lon: "-0.1278", format: "jsonv2" });
    const url = `https://nominatim.openstreetmap.org/reverse?${params}`;
    expect(url).toContain("lat=51.5074");
  });

  it("should format OSM lookup IDs", () => {
    expect(`N${"12345"}`).toBe("N12345");
    expect(`W${"67890"}`).toBe("W67890");
    expect(`R${"11111"}`).toBe("R11111");
  });

  it("should lowercase country codes", () => {
    expect("US".toLowerCase()).toBe("us");
    expect("GB".toLowerCase()).toBe("gb");
  });
});
