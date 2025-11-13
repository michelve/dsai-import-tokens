# Quick Installation Guide

**For DSAI Team Members**

---

## Prerequisites

- Figma Desktop App (macOS or Windows)
- Access to the plugin build folder

---

## Installation Steps (2 minutes)

### Step 1: Get the Plugin Files

You need the `build/dsai-import-tokens/` folder. This contains:
```
build/dsai-import-tokens/
├── code.js         (plugin code)
├── manifest.json   (plugin configuration)
└── ui.html         (user interface)
```

### Step 2: Install in Figma

1. **Open Figma Desktop App**

2. **Go to Plugins Menu**
   - Click on **Plugins** in the top menu
   - Select **Development** → **Import plugin from manifest...**

3. **Select Manifest File**
   - Navigate to: `build/dsai-import-tokens/`
   - Select: `manifest.json`
   - Click **Open**

4. **Done!** ✅

The plugin is now installed and ready to use!

---

## How to Use

### Opening the Plugin

**Method 1: Via Menu**
- Go to: **Plugins** → **DSAI Import Tokens** → **Import/Export Tokens**

**Method 2: Quick Search**
- Press: `Cmd+/` (Mac) or `Ctrl+/` (Windows)
- Type: "DSAI" or "Import Tokens"
- Press Enter

**Method 3: Right-Click** (After first use)
- Right-click on any page
- Look for **Import/Export Tokens** button in the context menu

### Quick Actions

**Import Tokens:**
1. Open plugin
2. Go to **Import** tab
3. Click **Choose File**
4. Select your JSON token file
5. Click **Import Tokens**

**Export Tokens:**
1. Open plugin
2. Go to **Export** tab
3. Choose format (single file or separate files)
4. Click **Export Tokens**
5. Save the downloaded file(s)

**Parameter Commands** (Advanced):
- **Export Specific Collection:** 
  - Run: `Export Collection` command
  - Enter collection name
  
- **Send to Server:** 
  - Run: `Send to Server` command
  - Enter collection name

---

## Troubleshooting

### Plugin Not Showing Up?
- Make sure you used **Figma Desktop App** (not browser)
- Check you imported from **Development** menu, not "Plugins"
- Try closing and reopening Figma

### Import Fails?
- Check JSON file format (see docs/TOKEN_FORMAT.md)
- Ensure file is valid JSON
- Look for error message which will tell you what's wrong

### Export Shows "No Collections"?
- Create some variables first in Figma
- Go to: **Local variables** panel (right sidebar)
- Create at least one collection with variables

### Server Won't Start?
- Check port isn't already in use (default: 8947)
- Try a different port in Settings
- Port must be between 1024-65535

---

## Documentation

Full documentation available in the `docs/` folder:

- **QUICKSTART.md** - Getting started guide
- **IMPORT_GUIDE.md** - Detailed import instructions
- **EXPORT_GUIDE.md** - Detailed export instructions
- **TOKEN_FORMAT.md** - Token file format specification
- **HTTP_SERVER.md** - Local server for remote IDE integration
- **TROUBLESHOOTING.md** - Common issues and solutions
- **API_REFERENCE.md** - Complete API documentation

---

## Need Help?

1. Check the error message - they're designed to be helpful!
2. Read **docs/TROUBLESHOOTING.md**
3. Contact DSAI team lead
4. Check **docs/API_REFERENCE.md** for technical details

---

## Updating the Plugin

When a new version is released:

1. Get the updated `build/dsai-import-tokens/` folder
2. **No need to uninstall** - just re-import
3. In Figma: **Plugins** → **Development** → **Import plugin from manifest**
4. Select the new `manifest.json`
5. Figma will automatically update

**Tip:** Figma auto-reloads the plugin when the files change!

---

## Uninstalling

If you need to remove the plugin:

1. **Plugins** → **Development** → **Remove plugin manifest...**
2. Select: **DSAI Import Tokens**
3. Confirm removal

---

## Tips & Tricks

### 💡 Keyboard Shortcut
After first use, the plugin appears in your recent plugins:
- Mac: `Option+Cmd+P` then type "DSAI"
- Windows: `Alt+Ctrl+P` then type "DSAI"

### 💡 Dark Mode
The plugin automatically matches your Figma theme (light/dark)

### 💡 Preview Mode
Use the **Preview** tab to see token structure without exporting

### 💡 Server Mode
Enable in **Settings** for remote IDE integration (port 8947 by default)

### 💡 Quick Export
Right-click menu (after first use) gives you quick access

---

## System Requirements

- **Figma Desktop App** (Required for development plugins)
  - Mac: macOS 10.13 or later
  - Windows: Windows 10 or later
  - Linux: Not supported (use browser for viewing only)

- **Disk Space:** ~500 KB

- **Network:** Only needed for server mode (local only)

---

## Frequently Asked Questions

**Q: Can I use this in Figma browser?**  
A: No. Development plugins require the desktop app.

**Q: Will this work in FigJam?**  
A: No. This plugin is for Figma files only (design and dev mode).

**Q: Can multiple people use it at once?**  
A: Yes! Each team member installs independently.

**Q: Where is data stored?**  
A: Plugin settings in Figma's client storage. Tokens are not stored.

**Q: Is it safe?**  
A: Yes. Network access is localhost-only. No external connections.

**Q: Can I modify the plugin?**  
A: Yes! Source code is in `src/` folder. Run `npm run build` after changes.

---

**Ready to use!** 🚀

Open Figma and start importing/exporting your design tokens!

