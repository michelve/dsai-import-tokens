# Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when using the DSAI Import Tokens plugin. Issues are organized by category for quick reference.

## Import Issues

### Tokens Not Importing

**Symptom:** Import button does nothing or no variables are created in Figma.

**Possible Causes:**

1. Invalid JSON format
2. Missing required properties
3. Incorrect file structure
4. Browser file reading issues

**Solutions:**

Validate JSON syntax:
```powershell
# Use Node.js to validate
node -e "JSON.parse(require('fs').readFileSync('tokens.json', 'utf8'))"
```

Check for required properties:
- Every token must have `$value` and `$type`
- Collection must have `modes` object
- At least one mode must be present

Verify file structure matches specification in TOKEN_FORMAT.md.

Try importing with a minimal test file:
```json
{
  "Test": {
    "modes": {
      "Light": {
        "color": {
          "$value": "#0d6efd",
          "$type": "color"
        }
      }
    }
  }
}
```

### Aliases Not Resolving

**Symptom:** Variables created but alias references don't work.

**Possible Causes:**

1. Incorrect alias syntax
2. Target variable doesn't exist
3. Circular reference
4. Cross-collection reference not found

**Solutions:**

Verify alias format uses braces and dots:
```json
{
  "$value": "{colors.brand.blue.500}",
  "$type": "color"
}
```

Ensure target variable exists in token file before the alias.

Check for circular references:
```json
{
  "a": {
    "$value": "{b}",
    "$type": "color"
  },
  "b": {
    "$value": "{a}",
    "$type": "color"
  }
}
```

For cross-collection references, include collection name:
```json
{
  "$value": "{Foundation.colors.brand.blue.500}",
  "$type": "color"
}
```

### Variables Created with Wrong Type

**Symptom:** Variables import but have incorrect type in Figma.

**Possible Causes:**

1. `$type` value doesn't match supported types
2. Value format doesn't match type
3. Type case sensitivity issue

**Solutions:**

Use only supported type values:
- `color` (not `Color` or `colours`)
- `number` (not `Number` or `float`)
- `string` (not `String` or `text`)
- `boolean` (not `Boolean` or `bool`)

Ensure value format matches type:
```json
{
  "color-token": {
    "$value": "#0d6efd",
    "$type": "color"
  },
  "number-token": {
    "$value": 16,
    "$type": "number"
  },
  "string-token": {
    "$value": "Roboto",
    "$type": "string"
  },
  "boolean-token": {
    "$value": true,
    "$type": "boolean"
  }
}
```

### Colors Import as Black

**Symptom:** Color tokens import but display as black in Figma.

**Possible Causes:**

1. Invalid hex format
2. Malformed rgba format
3. Color value is string instead of actual color

**Solutions:**

Use valid hex format:
- `#rrggbb` (6 characters)
- `#rrggbbaa` (8 characters with alpha)
- Must start with `#`

Use valid rgba format:
```json
{
  "$value": "rgba(13, 110, 253, 1)",
  "$type": "color"
}
```

Avoid common mistakes:
```json
// Wrong
"$value": "0d6efd"  // Missing #
"$value": "#0d6"     // Too short
"$value": "blue"     // Named colors not supported

// Right
"$value": "#0d6efd"
```

### Modes Not Creating

**Symptom:** Only one mode (Light) is created regardless of token data.

**Possible Causes:**

1. Mode structure incorrect
2. Mode names missing
3. Only first mode has tokens

**Solutions:**

Ensure all modes have same token structure:
```json
{
  "Collection": {
    "modes": {
      "Light": {
        "color": {
          "$value": "#ffffff",
          "$type": "color"
        }
      },
      "Dark": {
        "color": {
          "$value": "#000000",
          "$type": "color"
        }
      }
    }
  }
}
```

Verify mode names are valid strings without special characters.

## Export Issues

### Export Produces Empty Output

**Symptom:** Export button works but file is empty or contains empty collections.

**Possible Causes:**

1. No variables exist in Figma file
2. Variables not in collections
3. Export format not selected

**Solutions:**

Verify variables exist:
- Open Figma's Variables panel (Local variables)
- Check that collections contain variables

Ensure variables are properly organized:
- Variables must be in a collection
- Collections must have at least one mode

Select export format in Settings tab before exporting.

### Exported Values Are Wrong

**Symptom:** Export succeeds but values don't match Figma.

**Possible Causes:**

1. Wrong mode being exported
2. Alias not resolving correctly
3. Value conversion error

**Solutions:**

Check which modes are exported:
- All modes are included in export
- Verify you're looking at the correct mode in the output

For aliases, check that the alias path is correct:
```json
{
  "$value": "{colors.brand.blue.500}",
  "$type": "color"
}
```

Compare color values:
- Exported colors are in hex format
- RGB values are converted: `{ r: 0.05, g: 0.43, b: 0.99 }` becomes `#0d6efd`

### Missing Metadata in Export

**Symptom:** Descriptions, scopes, or code syntax not in exported JSON.

**Possible Causes:**

1. Metadata not set in Figma variables
2. Export code not including metadata
3. Plugin version outdated

**Solutions:**

Verify metadata exists in Figma:
- Check variable descriptions in Variables panel
- Verify scopes are set
- Confirm code syntax is in variable properties

Rebuild plugin:
```powershell
npm run build
```

Reload plugin in Figma.

Check exported JSON structure matches TOKEN_FORMAT.md specification.

### Large Export Fails

**Symptom:** Plugin hangs or crashes when exporting many variables.

**Possible Causes:**

1. Too many variables (thousands)
2. Memory limitations
3. Complex nested structures

**Solutions:**

Export collections separately instead of all at once.

Use separate files export mode to reduce memory usage.

Try exporting in batches:
1. Create temporary collections
2. Move variables to temporary collections
3. Export one collection at a time

## HTTP Server Issues

### Connection Failed

**Symptom:** "Failed to connect to server" message in plugin.

**Possible Causes:**

1. Server not running
2. Wrong port configuration
3. Firewall blocking connection

**Solutions:**

Verify server is running:
```powershell
npm run server
```

Check server output shows:
```
Local server running on http://localhost:8947
```

Test connection manually:
```powershell
curl http://localhost:8947/status
```

If port is in use, specify different port:
```powershell
$env:PORT = 3000
node scripts/local-server.js
```

Update plugin Settings tab with matching port.

Check firewall allows localhost connections on the port.

### Theme Not Saving

**Symptom:** Server receives request but file is not created.

**Possible Causes:**

1. Directory permissions
2. Disk space full
3. Invalid file path

**Solutions:**

Check `scripts/received-tokens/` directory exists.

Verify write permissions:
```powershell
Test-Path -Path "scripts/received-tokens" -PathType Container
```

Create directory if missing:
```powershell
New-Item -Path "scripts/received-tokens" -ItemType Directory
```

Check available disk space.

Review server console for error messages.

### Server Crashes on Receive

**Symptom:** Server stops responding when receiving tokens.

**Possible Causes:**

1. Invalid JSON in request
2. Extremely large payload
3. Memory exhaustion

**Solutions:**

Reduce payload size by exporting fewer collections.

Increase Node.js memory limit:
```powershell
node --max-old-space-size=4096 scripts/local-server.js
```

Check server logs for specific error messages.

Restart server and try again.

## UI Issues

### Plugin Window Too Small

**Symptom:** Content is cut off or requires scrolling.

**Solutions:**

Resize plugin window by dragging edges.

Plugin default size is 400x500 pixels.

Close and reopen plugin to reset size.

### Tabs Not Switching

**Symptom:** Clicking tabs doesn't change visible content.

**Solutions:**

Reload plugin:
1. Close plugin window
2. Reopen from Plugins menu

Clear browser cache if using Figma in browser.

Check browser console for JavaScript errors.

Rebuild plugin:
```powershell
npm run build
```

### File Upload Not Working

**Symptom:** "Choose File" button does nothing.

**Solutions:**

Try different file selection method:
1. Click "Choose File"
2. Use keyboard to navigate file picker
3. Press Enter to select file

Verify file is valid JSON with .json extension.

Try dragging file onto input field (if supported).

Check browser console for errors.

### Progress Indicator Stuck

**Symptom:** "Importing..." or "Exporting..." message doesn't clear.

**Solutions:**

Wait for operation to complete (may take time for large files).

If stuck after 30 seconds, reload plugin.

Check Figma desktop console for errors.

Reduce token file size and try again.

## Build Issues

### Build Fails with Syntax Error

**Symptom:** `npm run build` produces error messages.

**Solutions:**

Check Node.js version:
```powershell
node --version
```

Requires Node.js 14 or higher.

Install dependencies:
```powershell
npm install
```

Clear node_modules and reinstall:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

Check for syntax errors in source files:
```powershell
npm run build 2>&1 | Select-String "error"
```

### Watch Mode Not Detecting Changes

**Symptom:** `npm run watch` runs but doesn't rebuild on file save.

**Solutions:**

Stop watch mode (Ctrl+C) and restart.

Verify file is saved (check file timestamp).

Try manual build:
```powershell
npm run build
```

Check file is in `src/` directory.

Use dev mode instead:
```powershell
npm run dev
```

### Build Output Missing Files

**Symptom:** Build succeeds but `build/` directory incomplete.

**Solutions:**

Clean build directory:
```powershell
Remove-Item -Recurse -Force build
npm run build
```

Verify build.js script runs without errors.

Check manifest.json and ui.html exist in root.

Ensure all source files are in `src/` directory.

## Performance Issues

### Import Very Slow

**Symptom:** Import takes minutes to complete.

**Possible Causes:**

1. Thousands of tokens in file
2. Complex nested structures
3. Many cross-collection aliases

**Solutions:**

Split large token files into smaller collections.

Import collections one at a time.

Reduce nesting depth where possible.

Simplify alias references.

### Export Very Slow

**Symptom:** Export takes minutes or hangs.

**Possible Causes:**

1. Thousands of variables in Figma
2. Many collections
3. Complex metadata

**Solutions:**

Export collections separately instead of all at once.

Remove unnecessary metadata before export.

Use separate files export mode.

Close other Figma plugins during export.

### Plugin Becomes Unresponsive

**Symptom:** Plugin UI freezes or stops responding.

**Solutions:**

Close and reopen plugin.

Restart Figma application.

Check system memory usage.

Reduce number of variables in file.

Try smaller batch operations.

## Error Messages

### "Collection not found"

**Cause:** Collection ID is invalid or collection was deleted.

**Solution:** Verify collection exists in Figma's Variables panel and use correct ID.

### "Variable not found"

**Cause:** Variable ID is invalid or variable was deleted.

**Solution:** Verify variable exists and use correct ID from Figma.

### "Invalid token data"

**Cause:** Token object missing required properties or has invalid structure.

**Solution:** Verify token has `$value` and `$type` properties. Check TOKEN_FORMAT.md for correct structure.

### "Alias target not found"

**Cause:** Alias references a variable that doesn't exist.

**Solution:** Ensure alias target exists in token file and path is correct.

### "Server connection refused"

**Cause:** Cannot connect to HTTP server.

**Solution:** Start server with `npm run server`. Verify port configuration.

## Getting Help

If issues persist after trying these solutions:

1. Check Figma plugin console for error messages
2. Review documentation in docs/ directory
3. File an issue on GitHub with:
   - Detailed description of problem
   - Steps to reproduce
   - Error messages
   - Plugin version
   - Figma version
   - Operating system

## Preventive Measures

### Before Importing

1. Validate JSON syntax
2. Check required properties exist
3. Test with small sample file first
4. Backup existing Figma variables

### Before Exporting

1. Verify variables exist in Figma
2. Check metadata is complete
3. Test export with one collection first
4. Ensure sufficient disk space

### Regular Maintenance

1. Keep plugin updated
2. Rebuild after code changes
3. Clear old files from received-tokens/
4. Version control token JSON files
5. Document custom extensions
6. Review and clean up unused variables

## Debug Mode

Enable debug logging in browser console:

1. Open Figma
2. Press F12 to open DevTools
3. Go to Console tab
4. Run: `localStorage.debug = 'dsai:*'`
5. Reload plugin

This enables detailed logging for troubleshooting.
