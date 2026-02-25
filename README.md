# mcp-geocoder

MCP server for geocoding via [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org). Address-to-coordinates, reverse geocoding, place search, and distance calculation. No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `geocode` | Address/place name → lat/lng coordinates |
| `reverse_geocode` | Lat/lng → address with configurable detail level |
| `search_places` | Search for places, landmarks, POIs |
| `lookup_osm` | Look up specific OpenStreetMap objects |
| `calculate_distance` | Haversine distance between two points (km/mi/m) |

## Install

```bash
npm install
npm run build
```

## Usage with Claude Desktop

```json
{
  "mcpServers": {
    "geocoder": {
      "command": "node",
      "args": ["/path/to/mcp-geocoder/dist/index.js"]
    }
  }
}
```

## Rate Limits

Nominatim requires max 1 request/second. Enforced automatically.

## No API Key Required

Uses the free Nominatim public instance. For heavy usage, consider self-hosting.

## License

MIT
