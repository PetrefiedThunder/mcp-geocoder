# mcp-geocoder

Geocode addresses to coordinates and reverse geocode coordinates to addresses.

> **Free API** — No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `geocode` | Convert an address or place name to latitude/longitude coordinates. |
| `reverse_geocode` | Convert latitude/longitude coordinates to an address. |
| `search_places` | Search for places, landmarks, or points of interest by name and/or type. |
| `lookup_osm` | Look up a specific OpenStreetMap object by type and ID. |
| `calculate_distance` | Calculate the straight-line distance between two coordinates (Haversine formula). |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-geocoder.git
cd mcp-geocoder
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

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

## Usage with npx

```bash
npx mcp-geocoder
```

## License

Apache-2.0
