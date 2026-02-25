#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const USER_AGENT = "mcp-geocoder/1.0.0";
const RATE_LIMIT_MS = 1100; // Nominatim requires max 1 req/sec

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<any> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Geocoder error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

const NOMINATIM = "https://nominatim.openstreetmap.org";

const server = new McpServer({
  name: "mcp-geocoder",
  version: "1.0.0",
});

server.tool(
  "geocode",
  "Convert an address or place name to latitude/longitude coordinates.",
  {
    address: z.string().describe("Address or place name (e.g. '1600 Pennsylvania Ave, Washington DC')"),
    limit: z.number().min(1).max(10).default(1),
  },
  async ({ address, limit }) => {
    const params = new URLSearchParams({
      q: address,
      format: "jsonv2",
      limit: String(limit),
      addressdetails: "1",
    });
    const data = await rateLimitedFetch(`${NOMINATIM}/search?${params}`);
    const results = data.map((r: any) => ({
      lat: r.lat,
      lon: r.lon,
      displayName: r.display_name,
      type: r.type,
      category: r.category,
      importance: r.importance,
      address: r.address,
      boundingBox: r.boundingbox,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "reverse_geocode",
  "Convert latitude/longitude coordinates to an address.",
  {
    lat: z.number().describe("Latitude"),
    lon: z.number().describe("Longitude"),
    zoom: z.number().min(0).max(18).default(18).describe("Detail level (0=country, 10=city, 18=building)"),
  },
  async ({ lat, lon, zoom }) => {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      zoom: String(zoom),
      format: "jsonv2",
      addressdetails: "1",
    });
    const data = await rateLimitedFetch(`${NOMINATIM}/reverse?${params}`);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          lat: data.lat,
          lon: data.lon,
          displayName: data.display_name,
          address: data.address,
          type: data.type,
          category: data.category,
        }, null, 2),
      }],
    };
  }
);

server.tool(
  "search_places",
  "Search for places, landmarks, or points of interest by name and/or type.",
  {
    query: z.string().describe("Place name or type (e.g. 'Eiffel Tower', 'hospitals in Berlin')"),
    countryCode: z.string().optional().describe("ISO 3166-1 alpha-2 country code to limit results (e.g. 'us', 'gb', 'de')"),
    limit: z.number().min(1).max(50).default(10),
  },
  async ({ query, countryCode, limit }) => {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: String(limit),
      addressdetails: "1",
    });
    if (countryCode) params.set("countrycodes", countryCode.toLowerCase());

    const data = await rateLimitedFetch(`${NOMINATIM}/search?${params}`);
    const results = data.map((r: any) => ({
      lat: r.lat,
      lon: r.lon,
      displayName: r.display_name,
      type: r.type,
      category: r.category,
      importance: r.importance,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "lookup_osm",
  "Look up a specific OpenStreetMap object by type and ID.",
  {
    osmType: z.enum(["N", "W", "R"]).describe("OSM type: N=node, W=way, R=relation"),
    osmId: z.number().describe("OSM ID number"),
  },
  async ({ osmType, osmId }) => {
    const params = new URLSearchParams({
      osm_ids: `${osmType}${osmId}`,
      format: "jsonv2",
      addressdetails: "1",
    });
    const data = await rateLimitedFetch(`${NOMINATIM}/lookup?${params}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "calculate_distance",
  "Calculate the straight-line distance between two coordinates (Haversine formula).",
  {
    lat1: z.number().describe("Latitude of point 1"),
    lon1: z.number().describe("Longitude of point 1"),
    lat2: z.number().describe("Latitude of point 2"),
    lon2: z.number().describe("Longitude of point 2"),
    unit: z.enum(["km", "mi", "m"]).default("km"),
  },
  async ({ lat1, lon1, lat2, lon2, unit }) => {
    const R_KM = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let distance = R_KM * c;

    if (unit === "mi") distance *= 0.621371;
    else if (unit === "m") distance *= 1000;

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          from: { lat: lat1, lon: lon1 },
          to: { lat: lat2, lon: lon2 },
          distance: Math.round(distance * 100) / 100,
          unit,
        }, null, 2),
      }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
