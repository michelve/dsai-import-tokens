# Quick Start Guide

## What You Have

A **modular Figma plugin** that can:
1. **Import** Design Tokens JSON → Figma Variables
2. **Export** All Figma Variables → Design Tokens JSON (single file)
3. **Send to Server** Transfer tokens to local HTTP server
4. **MCP Integration** AI-powered token operations
5. **Theme Generator** Create multi-mode collections from separate files

## File Organization

```text
src/          ← EDIT THESE FILES
  ├── main.js
  ├── import.js
  ├── export.js
  ├── server.js
  ├── mcp-client.js
  ├── utils.js
  └── ui.html

scripts/
  └── local-server.js  ← Run for HTTP server integration

code.js       ← AUTO-GENERATED (don't edit)
ui.html       ← AUTO-GENERATED (don't edit)
```

## Commands

```bash
# Install (first time only)
npm install

# Build plugin
npm run build

# Watch mode (auto-rebuild on file changes)
npm run watch
```

## Workflow

1. Edit files in `src/`
2. Run `npm run build`
3. Test in Figma
4. Repeat

## Testing in Figma

1. Open Figma Desktop App
2. Go to Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file
4. Run the plugin
5. Use any of the 5 tabs: Import, Export, Tools, Settings, MCP

## Key Features

### Import Tab

- Upload a `.json` token file
- Creates/updates variable collections
- Supports multiple modes (Light/Dark)
- Handles aliases and cross-references

### Export Tab

- Click "Export All Collections"
- Downloads all your variables as one JSON file
- Preserves modes, aliases, descriptions
- File is named with current date

### Tools Tab

- Theme Collection Generator
- Create collections from separate mode files (light.json, dark.json, etc.)
- Validates token structure
- Automated mode consolidation

### Settings Tab

- HTTP server integration
- Toggle "Connect to Local Server"
- Send theme to server with one click
- Server status monitoring

### MCP Tab

- AI integration controls
- Connect to MCP-compatible AI clients
- Real-time connection status
- Enable AI-powered token operations

## Common Tasks

### Add new functionality

1. Create/edit module in `src/`
2. Import it where needed
3. Run `npm run build`

### Debug

- Check browser console in Figma (Plugins → Development → Open Console)
- Add `console.log()` in your `src/` files
- Rebuild and test

### Start HTTP Server

```bash
npm run server
# or
node scripts/local-server.js
```

### Connect AI Client (MCP)

1. Configure your AI client (e.g., Claude Desktop) with MCP server settings
2. Open plugin MCP tab
3. Toggle connection ON
4. Use AI to manage tokens

## Important Rules

- **NEVER edit `code.js` or `ui.html` directly**
- **ALWAYS edit files in `src/` directory**
- **ALWAYS run `npm run build` after changes**

## Documentation

- **TOKEN_FORMAT.md** - Complete token format specification
- **IMPORT_GUIDE.md** - Detailed import process
- **EXPORT_GUIDE.md** - Export functionality
- **HTTP_SERVER.md** - HTTP server API reference
- **MCP_INTEGRATION.md** - AI integration guide
- **ARCHITECTURE.md** - System architecture
- **TROUBLESHOOTING.md** - Common issues and solutions
