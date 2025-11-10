# DSAI Import Tokens Plugin

A Figma plugin to import and export Design System tokens.

## Development

### Project Structure

```
plugin/dsai-import-tokens/
├── src/                    # Source files (modular)
│   ├── main.js            # Entry point
│   ├── import.js          # Import functionality
│   ├── export.js          # Export functionality
│   ├── utils.js           # Shared utilities
│   └── ui.html            # UI source
├── code.js                # Built plugin code (auto-generated)
├── ui.html                # Built UI (auto-generated)
├── manifest.json          # Plugin manifest
├── build.js               # Build script
└── package.json           # NPM configuration
```

### Setup

1. Install dependencies:
```bash
npm install
```

### Build

Build once:
```bash
npm run build
```

Watch for changes (auto-rebuild):
```bash
npm run watch
```

Or run dev mode (build + watch):
```bash
npm run dev
```

### Adding New Features

1. Edit files in the `src/` directory
2. Run `npm run build` to bundle into `code.js`
3. Test in Figma

**Important:** Never edit `code.js` or `ui.html` directly - they are auto-generated!

## Features

### Import Tokens
- Import Design Tokens JSON files
- Creates Figma variable collections
- Supports multiple modes (Light/Dark)
- Handles aliases and references

### Export Tokens
- Export all variable collections
- Generates Design Tokens JSON format
- Preserves modes, aliases, and metadata
- Downloads as a single file

## Usage

1. Open the plugin in Figma
2. Choose Import or Export tab
3. For Import: Select a JSON file and click "Import Tokens"
4. For Export: Click "Export All Collections" to download all tokens
