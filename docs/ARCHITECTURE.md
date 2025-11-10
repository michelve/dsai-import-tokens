# DSAI Import Tokens - Plugin Architecture

## ✅ What We Built

A **modular Figma plugin** with:
- **Import functionality**: Import Design Tokens JSON files into Figma variables
- **Export functionality**: Export all Figma variable collections to a single JSON file
- **Modular architecture**: Source code split into logical modules
- **Build system**: Automatic bundling of all modules into a single `code.js` file

## 📁 Project Structure

```
plugin/dsai-import-tokens/
├── src/                        # Source files (EDIT THESE)
│   ├── main.js                # Plugin entry point - handles UI messages
│   ├── import.js              # Import tokens functionality
│   ├── export.js              # Export tokens functionality  
│   ├── utils.js               # Shared utility functions
│   └── ui.html                # Plugin UI with tabs
│
├── code.js                     # ⚠️ AUTO-GENERATED - DO NOT EDIT
├── ui.html                     # ⚠️ AUTO-GENERATED - DO NOT EDIT
│
├── manifest.json               # Plugin manifest
├── build.js                    # Build/bundler script
├── package.json                # NPM configuration
├── .gitignore                  # Git ignore rules
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

## 📦 Module Breakdown

### `src/main.js`
- Plugin entry point
- Shows UI
- Routes messages to import/export modules
- Error handling

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

### `src/utils.js`
- Shared utility functions
- `isAlias()` - Checks if value is an alias reference
- `parseColor()` - Converts color strings to Figma RGB format
- `mapScopes()` - Maps scope names to Figma enums
- `colorToHex()` - Converts Figma RGB to hex string
- `resolveAliasPath()` - Resolves variable ID to token path

### `src/ui.html`
- Two-tab interface (Import/Export)
- File upload for import
- One-click export with auto-download
- Status messages and progress feedback
- Download functionality for exported tokens

## 🎯 Plugin Features

### Import
- ✅ Upload JSON token file
- ✅ Creates/updates variable collections
- ✅ Supports multiple modes (Light, Dark, etc.)
- ✅ Handles aliases with `{collection.group.token}` syntax
- ✅ Cross-collection references
- ✅ Preserves descriptions and extensions
- ✅ Sets code syntax per platform (WEB, ANDROID, iOS)
- ✅ Configures scopes (fills, strokes, effects)

### Export
- ✅ Export all collections at once
- ✅ Generates valid Design Tokens JSON
- ✅ Preserves all modes
- ✅ Maintains alias references
- ✅ Includes metadata (descriptions, scopes, code syntax)
- ✅ Auto-downloads as timestamped file
- ✅ Supports all variable types

## 🔄 Typical Workflow

### For Developers

1. Make changes in `src/` files
2. Run `npm run build`
3. Test in Figma
4. Commit `src/` files to git (not `code.js`/`ui.html`)

### For Users

1. Open plugin in Figma
2. **Import**: Upload JSON → Click Import
3. **Export**: Click Export → File downloads automatically

## 📝 Adding New Features

### Example: Add a new utility function

1. **Edit `src/utils.js`:**
```javascript
export function myNewFunction() {
  // your code
}
```

2. **Import in module that needs it:**
```javascript
// In src/import.js or src/export.js
import { myNewFunction } from './utils.js';

// Use it
myNewFunction();
```

3. **Build:**
```bash
npm run build
```

### Example: Add a new export format

1. Create `src/exporters/scss-exporter.js`
2. Import in `src/export.js`
3. Add UI button/option in `src/ui.html`
4. Update `src/main.js` to handle new message type
5. Build

## 🧪 Testing

1. **Load plugin in Figma Desktop**
2. **Test import**: Use `tokens/combined.tokens.json`
3. **Test export**: Click export, verify downloaded JSON
4. **Test reimport**: Import the exported file
5. **Verify**: Check variables match original

## 🎨 Token Format

The plugin uses the [Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) format:

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

## 🚨 Important Notes

- ⚠️ `code.js` and `ui.html` are **generated files** - never edit directly
- ✅ Always edit files in the `src/` directory
- 🔄 Run `npm run build` after changes
- 📁 Only commit `src/` files to version control
- 🎯 The plugin works in both Figma design mode and Dev Mode

## 📚 Next Steps

- Add more export formats (SCSS, CSS, JS)
- Add validation for token structure
- Add batch operations
- Add undo/redo support
- Add selective export (specific collections)
- Add import preview before applying

---

**Built with:** Node.js, Figma Plugin API, vanilla JavaScript
**License:** MIT
