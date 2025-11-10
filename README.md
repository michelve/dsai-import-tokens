# DSAI Import Tokens Plugin

A comprehensive Figma plugin for importing, exporting, and managing design tokens in the W3C Design Tokens Community Group format with AI integration capabilities.

## Overview

The DSAI Import Tokens plugin bridges the gap between Figma's Variables system and external design token workflows. It provides bidirectional synchronization, preserving all metadata including descriptions, scopes, code syntax references, and custom extensions.

## Features

### Core Functionality

- Bidirectional Token Sync: Import JSON tokens to Figma Variables and export Variables to JSON format
- Complete Format Support: Full implementation of Design Tokens Community Group specification
- Multi-Mode Support: Handle multiple modes (Light/Dark themes) with mode-specific values
- Alias Resolution: Smart handling of token references including cross-collection dependencies
- Metadata Preservation: Round-trip preservation of descriptions, scopes, code syntax, and extensions

### Variable Types

- Color: Hex and RGBA format support with automatic conversion
- Number: Float values for spacing, sizing, and numeric properties
- String: Text values for fonts, names, and categorical data
- Boolean: True/false flags for feature toggles

### Advanced Features

- Nested Token Structure: Hierarchical organization with unlimited depth
- Cross-Collection References: Resolve aliases across multiple collections
- Platform-Specific Code Syntax: Store WEB, ANDROID, and iOS code references
- Custom Extensions: Preserve custom metadata for documentation and tooling
- Scope Management: Define where variables can be applied (fills, strokes, effects)

### Integration Options

- HTTP Server: Local server for external tool integration
- MCP Protocol: AI-assisted token management via Claude Desktop, Cursor, or compatible clients
- UI Export: Direct export from plugin interface
- Batch Operations: Process multiple collections simultaneously

## Installation

### Prerequisites

- Figma Desktop App or Figma in browser
- Node.js 14 or higher (for development and HTTP server)
- npm or yarn package manager

### Plugin Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Import to Figma: Plugins > Development > Import plugin from manifest
5. Navigate to `build/dsai-import-tokens/manifest.json`

## Quick Start

### Importing Design Tokens

1. Prepare a JSON file in Design Tokens format (see docs/TOKEN_FORMAT.md)
2. Open the plugin in Figma
3. Navigate to the "Import" tab
4. Click "Choose File" and select your JSON file
5. Click "Import Tokens"

### Exporting Design Tokens

1. Create variables and collections in Figma
2. Open the plugin
3. Navigate to the "Export" tab
4. Choose export format (Single file or Separate files)
5. Click "Export Tokens"

### Using HTTP Server

1. Start the local server: `npm run server`
2. In the plugin, go to "Settings" tab
3. Enable "Remote Connection"
4. Click "Send Theme to Server"
5. Tokens are saved to `scripts/received-tokens/theme.json`

### Using MCP Integration

1. Configure AI client (see docs/MCP_INTEGRATION.md)
2. In the plugin, go to "MCP" tab
3. Enable "MCP Server"
4. Use natural language commands in AI client to query tokens

## Documentation

### Comprehensive Guides

- TOKEN_FORMAT.md - Complete token format specification with examples
- IMPORT_GUIDE.md - Detailed import process documentation
- EXPORT_GUIDE.md - Export functionality and format preservation
- HTTP_SERVER.md - HTTP server API reference and integration
- MCP_INTEGRATION.md - AI integration setup and usage
- API_REFERENCE.md - Complete API documentation

### Architecture Documentation

- ARCHITECTURE.md - System architecture and design decisions
- QUICKSTART.md - Quick start guide for common workflows
- QUICKSTART_REMOTE.md - Remote connection setup guide
- REMOTE_API_TESTING.md - API testing procedures

## Project Structure

```
dsai-import-tokens/
├── src/                    # Source code
│   ├── main.js            # Plugin entry point
│   ├── import.js          # Token import logic
│   ├── export.js          # Token export logic
│   ├── server.js          # HTTP server integration
│   ├── mcp-client.js      # MCP WebSocket client
│   ├── utils.js           # Shared utilities
│   └── ui.html            # Plugin user interface
├── scripts/               # External scripts
│   ├── local-server.js    # HTTP server implementation
│   └── received-tokens/   # Server output directory
├── docs/                  # Documentation
├── build/                 # Build output
├── build.js               # Build script
├── package.json           # Project configuration
└── manifest.json          # Source manifest
```

## Development

### Available Scripts

- `npm run build` - Build plugin for production
- `npm run watch` - Watch for changes and rebuild automatically
- `npm run dev` - Build and start watch mode
- `npm run server` - Start local HTTP server on port 8947

### Development Workflow

1. Make changes in `src/` directory
2. Run `npm run watch` to auto-rebuild
3. Reload plugin in Figma
4. Test changes

### ES5 Compatibility

Figma's plugin sandbox uses an older JavaScript engine. Avoid optional chaining, nullish coalescing, and modern syntax. Use ES5-compatible alternatives.

## Token Format

### Basic Structure

```json
{
  "CollectionName": {
    "modes": {
      "Light": {
        "colors": {
          "primary": {
            "$value": "#0d6efd",
            "$type": "color",
            "$description": "Primary brand color",
            "$codeSyntax": {
              "WEB": "var(--bs-primary)"
            },
            "$scopes": ["ALL_FILLS"]
          }
        }
      }
    }
  }
}
```

See docs/TOKEN_FORMAT.md for complete specification.

## License

MIT License
