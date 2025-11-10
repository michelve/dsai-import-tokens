# DSAI Import Tokens - Plugin Architecture

## Overview

A **modular Figma plugin** with comprehensive token management capabilities:
- **Import functionality**: Import Design Tokens JSON files into Figma variables
- **Export functionality**: Export all Figma variable collections to a single JSON file
- **HTTP Server Integration**: Send tokens to external applications via local HTTP server
- **MCP Integration**: AI-powered token operations via Model Context Protocol
- **Theme Collection Generator**: Automated collection creation from multi-mode tokens
- **Modular architecture**: Source code split into logical modules
- **Build system**: Automatic bundling of all modules into a single `code.js` file

## Project Structure

```
dsai-import-tokens/
├── src/                        # Source files (EDIT THESE)
│   ├── main.js                # Plugin entry point - handles UI messages
│   ├── import.js              # Import tokens functionality
│   ├── export.js              # Export tokens functionality
│   ├── server.js              # HTTP server integration
│   ├── mcp-client.js          # MCP WebSocket client and tools
│   ├── utils.js               # Shared utility functions
│   └── ui.html                # Plugin UI with 5 tabs
│
├── scripts/                    # Development and runtime scripts
│   ├── local-server.js        # HTTP server for receiving tokens
│   └── received-tokens/       # Directory for received token files
│
├── build/                      # Build output directory
│   └── dsai-import-tokens/    # Bundled plugin for distribution
│       ├── code.js            # Bundled JavaScript
│       ├── ui.html            # UI file
│       └── manifest.json      # Plugin manifest
│
├── docs/                       # Documentation
│   ├── TOKEN_FORMAT.md        # Complete token format specification
│   ├── IMPORT_GUIDE.md        # Detailed import process guide
│   ├── EXPORT_GUIDE.md        # Export functionality guide
│   ├── HTTP_SERVER.md         # HTTP server API reference
│   ├── MCP_INTEGRATION.md     # MCP integration guide
│   ├── API_REFERENCE.md       # Function-level API documentation
│   ├── TROUBLESHOOTING.md     # Common issues and solutions
│   ├── ARCHITECTURE.md        # This file
│   └── QUICKSTART_REMOTE.md   # Quick start for remote features
│
├── code.js                     # ⚠️ AUTO-GENERATED - DO NOT EDIT
├── ui.html                     # ⚠️ AUTO-GENERATED - DO NOT EDIT
├── manifest.json               # Plugin manifest
├── build.js                    # Build/bundler script
├── package.json                # NPM configuration
└── README.md                   # User documentation
```

## 🚀 Development Workflow

### Initial Setup

```bash
cd plugin/dsai-import-tokens
npm install
```

### Building

**Build once:**
```bash
npm run build
```

**Watch mode (auto-rebuild on changes):**
```bash
npm run watch
```

**Dev mode (build + watch):**
```bash
npm run dev
```

### Making Changes

1. ✅ Edit files in `src/` directory
2. ✅ Run `npm run build` to bundle
3. ✅ Test in Figma
4. ❌ **NEVER** edit `code.js` or `ui.html` directly (they're auto-generated!)

## 🔧 How the Build System Works

The `build.js` script:
1. Reads `src/main.js` (entry point)
2. Recursively follows all `import` statements
3. Combines all modules into a single file
4. Removes `import`/`export` statements
5. Outputs bundled `code.js`
6. Copies `src/ui.html` to `ui.html`

### Module Resolution

The bundler resolves ES6 imports:
```javascript
import { functionName } from './module.js';
```

And combines them into a single file for Figma (which doesn't support ES6 modules).

## Module Breakdown

### `src/main.js`

- Plugin entry point
- Shows UI with 5 tabs
- Routes messages to appropriate modules (import, export, server, mcp)
- Error handling and message coordination

### `src/import.js`

- Imports Design Tokens JSON
- Creates Figma variable collections
- Handles modes (Light/Dark/etc.)
- Processes aliases and references
- Supports cross-collection references
- Sets descriptions, scopes, and code syntax

### `src/export.js`

- Exports all Figma variable collections
- Converts to Design Tokens JSON format
- Preserves modes, aliases, metadata
- Handles all variable types (color, number, string, boolean)
- Sends data to UI for download

### `src/server.js`

- HTTP server integration module
- Sends tokens to local HTTP server on port 8947
- POST /send-theme endpoint integration
- POST /send-collection endpoint integration
- Server status checking functionality
- Handles communication between plugin and external applications

### `src/mcp-client.js`

- MCP WebSocket client implementation
- Bridge between plugin and AI clients
- Five MCP tools: importTokens, exportTokens, listCollections, getCollection, createCollection
- Connection management and status monitoring
- Real-time bidirectional communication

### `src/utils.js`

- Shared utility functions
- `isAlias()` - Checks if value is an alias reference
- `parseColor()` - Converts color strings to Figma RGB format
- `mapScopes()` - Maps scope names to Figma enums
- `colorToHex()` - Converts Figma RGB to hex string
- `resolveAliasPath()` - Resolves variable ID to token path

### `src/ui.html`

- Five-tab interface (Import, Export, Tools, Settings, MCP)
- **Import Tab**: File upload for token import with status feedback
- **Export Tab**: One-click export with auto-download
- **Tools Tab**: Theme Collection Generator for multi-mode token creation
- **Settings Tab**: HTTP server integration with send-to-server functionality
- **MCP Tab**: AI integration controls and connection status
- Status messages and progress feedback
- Download functionality for exported tokens

## Plugin Features

### Import

- Upload JSON token file
- Creates/updates variable collections
- Supports multiple modes (Light, Dark, etc.)
- Handles aliases with `{collection.group.token}` syntax
- Cross-collection references
- Preserves descriptions and extensions
- Sets code syntax per platform (WEB, ANDROID, iOS)
- Configures scopes (fills, strokes, effects)

### Export

- Export all collections at once
- Generates valid Design Tokens JSON
- Preserves all modes
- Maintains alias references
- Includes metadata (descriptions, scopes, code syntax)
- Auto-downloads as timestamped file
- Supports all variable types

### HTTP Server Integration

- Local HTTP server receives tokens from plugin
- POST endpoints for sending theme and individual collections
- File persistence in `scripts/received-tokens/` directory
- Server status monitoring from Settings tab
- One-click send from plugin to server

### MCP Integration

- WebSocket bridge between plugin and MCP-compatible AI clients
- Five MCP tools: import, export, list collections, get collection, create collection
- Real-time connection status monitoring
- AI-powered token operations and automation
- Compatible with Claude Desktop and other MCP clients

### Theme Collection Generator

- Automated creation of theme collections from multi-mode tokens
- Parses mode-specific token files (e.g., light.json, dark.json)
- Consolidates into single collection with proper mode structure
- Validates token structure and types
- Available in Tools tab

## Typical Workflow

### For Developers

1. Make changes in `src/` files
2. Run `npm run build`
3. Test in Figma
4. Commit `src/` files to git (not `code.js`/`ui.html`)

### For Users

1. Open plugin in Figma
2. **Import**: Upload JSON → Click Import
3. **Export**: Click Export → File downloads automatically
4. **Send to Server**: Configure server in Settings tab → Click "Send Theme to Server"
5. **MCP Integration**: Connect AI client → Use AI-powered token operations
6. **Theme Generator**: Use Tools tab to create multi-mode collections

## Adding New Features

### Example: Add a new utility function

1. Edit `src/utils.js`:

```javascript
export function myNewFunction() {
  // your code
}
```

2. Import in module that needs it:

```javascript
// In src/import.js or src/export.js
import { myNewFunction } from './utils.js';

// Use it
myNewFunction();
```

3. Build:

```bash
npm run build
```

### Example: Add a new export format

1. Create `src/exporters/scss-exporter.js`
2. Import in `src/export.js`
3. Add UI button/option in `src/ui.html`
4. Update `src/main.js` to handle new message type
5. Build

## Testing

1. Load plugin in Figma Desktop
2. Test import: Use token JSON files
3. Test export: Click export, verify downloaded JSON
4. Test reimport: Import the exported file
5. Test HTTP server: Start local server, send theme from Settings tab
6. Test MCP: Connect AI client, run token operations via AI
7. Verify: Check variables match original

## Token Format

The plugin uses the Design Tokens Community Group format:

```json
{
  "CollectionName": {
    "modes": {
      "Light": {
        "colors": {
          "primary": {
            "$value": "#0066ff",
            "$type": "color",
            "$description": "Primary brand color"
          },
          "secondary": {
            "$value": "{colors.primary}",
            "$type": "color"
          }
        }
      },
      "Dark": {
        "colors": {
          "primary": {
            "$value": "#3399ff",
            "$type": "color"
          }
        }
      }
    }
  }
}
```

## Important Notes

- `code.js` and `ui.html` are generated files - never edit directly
- Always edit files in the `src/` directory
- Run `npm run build` after changes
- Only commit `src/` files to version control
- The plugin works in both Figma design mode and Dev Mode
- HTTP server runs on port 8947 by default
- MCP WebSocket server runs on port 3000 by default

## Next Steps

- Add more export formats (SCSS, CSS, JS)
- Add validation for token structure
- Add batch operations
- Add undo/redo support
- Add selective export (specific collections)
- Add import preview before applying
- Enhance MCP tool capabilities
- Add more theme generator templates
