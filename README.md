# DSAI Import Tokens Plugin

A comprehensive Figma plugin for importing, exporting, and managing design tokens in the W3C Design Tokens Community Group format, specifically designed for the DSAI (Design System AI) design library and system.

## Overview

The DSAI Import Tokens plugin bridges the gap between Figma's Variables system and the DSAI design library workflows. It provides bidirectional synchronization, preserving all metadata including descriptions, scopes, code syntax references, and custom extensions. While technically capable of working with any design tokens, this plugin is specifically built and optimized for use with the DSAI design system.

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
- UI Export: Direct export from plugin interface
- Batch Operations: Process multiple collections simultaneously

## ✅ Status

**Production Ready!** - See [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md) for full status.

- ✅ Figma standards compliant
- ✅ Enhanced error handling with validation
- ✅ Comprehensive documentation (16 files)
- ✅ Ready for internal use

## Installation

**Quick Installation:** See [INSTALLATION.md](INSTALLATION.md) for detailed guide.

### Prerequisites

- Figma Desktop App (required for development plugins)
- Node.js 14 or higher (for development and HTTP server)
- npm or yarn package manager

### Plugin Installation

1. Clone the repository (or get the `build/` folder)
2. Install dependencies: `npm install` (only for development)
3. Build the plugin: `npm run build`
4. Import to Figma: **Plugins > Development > Import plugin from manifest**
5. Select: `build/dsai-import-tokens/manifest.json`

**For team distribution:** Share the `build/dsai-import-tokens/` folder - no build step needed!

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

## Documentation

### 🌟 Start Here

- **[INSTALLATION.md](INSTALLATION.md)** - Quick installation guide for team members
- **[DEPLOYMENT_DECISION.md](DEPLOYMENT_DECISION.md)** - Choose your deployment path
- **[PROJECT_COMPLETE.md](PROJECT_COMPLETE.md)** - Full project status and overview
- **[STANDARDS_SUMMARY.md](STANDARDS_SUMMARY.md)** - Figma standards compliance

### 📖 User Guides

- **[docs/QUICKSTART.md](docs/QUICKSTART.md)** - Quick start guide
- **[docs/IMPORT_GUIDE.md](docs/IMPORT_GUIDE.md)** - Detailed import instructions
- **[docs/EXPORT_GUIDE.md](docs/EXPORT_GUIDE.md)** - Export functionality guide
- **[docs/TOKEN_FORMAT.md](docs/TOKEN_FORMAT.md)** - Token format specification
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### 👨‍💻 Developer Documentation

- **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API documentation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture
- **[docs/HTTP_SERVER.md](docs/HTTP_SERVER.md)** - HTTP server integration
- **[docs/QUICKSTART_REMOTE.md](docs/QUICKSTART_REMOTE.md)** - Remote connection setup
- **[ERROR_HANDLING_QUICK_WINS.md](ERROR_HANDLING_QUICK_WINS.md)** - Error handling implementation
- **[docs/ERROR_HANDLING_IMPROVEMENTS.md](docs/ERROR_HANDLING_IMPROVEMENTS.md)** - Advanced patterns
- **[docs/FIGMA_STANDARDS_COMPLIANCE.md](docs/FIGMA_STANDARDS_COMPLIANCE.md)** - Full technical compliance report

## Project Structure

```
dsai-import-tokens/
├── src/                    # Source code
│   ├── main.js            # Plugin entry point
│   ├── import.js          # Token import logic
│   ├── export.js          # Token export logic
│   ├── server.js          # HTTP server integration
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

**All Rights Reserved**

This plugin is private and proprietary. It may not be copied, modified, distributed, or shared without explicit permission. This software is provided for internal use with the DSAI design system only.

© 2025. All rights reserved.
