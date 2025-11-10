# Quick Start Guide

## What You Have

A **modular Figma plugin** that can:
1. ✅ **Import** Design Tokens JSON → Figma Variables
2. ✅ **Export** All Figma Variables → Design Tokens JSON (single file)

## File Organization

```
src/          ← EDIT THESE FILES
  ├── main.js
  ├── import.js
  ├── export.js
  ├── utils.js
  └── ui.html

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
5. Use Import or Export tab

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

## Common Tasks

### Add new functionality
1. Create/edit module in `src/`
2. Import it where needed
3. Run `npm run build`

### Debug
- Check browser console in Figma (Plugins → Development → Open Console)
- Add `console.log()` in your `src/` files
- Rebuild and test

## Important Rules

⚠️ **NEVER edit `code.js` or `ui.html` directly**
✅ **ALWAYS edit files in `src/` directory**
🔄 **ALWAYS run `npm run build` after changes**

---

For more details, see `ARCHITECTURE.md`
