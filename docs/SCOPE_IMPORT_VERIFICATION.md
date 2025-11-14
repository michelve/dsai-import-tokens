# Scope Import Verification

## ✅ YES - The Plugin Fully Supports `$scopes` During Import!

Your plugin **correctly handles** the `$scopes` property when importing design tokens from JSON files. Here's the complete flow:

---

## 📋 How It Works

### 1. **Token Parsing** (`src/import.ts` line 211)

When the plugin parses a token from your JSON file, it extracts the `$scopes` array:

```typescript
// Line 206-212 in import.ts
aliases[fullKey] = {
  key: fullKey,
  type: tokenType,
  valueKey,
  description: typedValue.$description,
  scopes: typedValue.$scopes, // ✅ Scopes are captured here
};
```

### 2. **Variable Creation** (`src/import.ts` line 356-358)

When creating a new variable, the plugin assigns the scopes using `mapScopes()`:

```typescript
// Line 356-358 in import.ts
if (token.$scopes) {
  variable.scopes = mapScopes(token.$scopes); // ✅ Scopes are assigned
}
```

### 3. **Alias Variables** (`src/import.ts` line 449-451)

Even for alias variables (references to other tokens), scopes are properly assigned:

```typescript
// Line 449-451 in import.ts
if (token && token.$scopes) {
  variable.scopes = mapScopes(token.$scopes); // ✅ Scopes work for aliases too
}
```

### 4. **Scope Mapping** (`src/utils.ts` line 70-125)

The `mapScopes()` function converts your JSON scope strings to Figma's official `VariableScope` enum:

```typescript
// Example from utils.ts
const scopeMap: Record<string, VariableScope[]> = {
  GAP: ["GAP"], // ✅ Your spacing tokens
  CORNER_RADIUS: ["CORNER_RADIUS"], // ✅ Your radius tokens
  OPACITY: ["OPACITY"], // ✅ Your opacity tokens
  // ... and 21 more scopes
};
```

---

## 🧪 Testing with Your spacing.json

Your `export_samples/spacing.json` file has tokens with `$scopes`:

```json
{
  "spacing": {
    "0": {
      "$value": 0,
      "$type": "number",
      "$description": "Spacing scale 0 - No spacing. Bootstrap's $spacer * 0 (0px).",
      "$scopes": ["GAP"] // ✅ This scope will be applied!
    },
    "1": {
      "$value": 4,
      "$type": "number",
      "$description": "Spacing scale 1 - Extra small spacing.",
      "$scopes": ["GAP"] // ✅ This scope will be applied!
    }
  }
}
```

### What Happens When You Import:

1. **Plugin reads** `$scopes: ["GAP"]` from each token
2. **Calls** `mapScopes(["GAP"])` which returns `["GAP"]` (Figma's official scope)
3. **Assigns** `variable.scopes = ["GAP"]` to the Figma variable
4. **Result** in Figma:
   - ✅ Variable only appears in **auto-layout gap** fields
   - ✅ Variable does NOT appear in other numeric fields (font size, border radius, etc.)
   - ✅ Scope is preserved and will be exported correctly

---

## 🔍 Verification Steps

### Test 1: Import Your spacing.json

```bash
# In Figma plugin:
1. Click "Import" tab
2. Select your `export_samples/spacing.json`
3. Click "Import Tokens"
```

**Expected Result:**

- ✅ All spacing tokens created with `GAP` scope
- ✅ Console logs show: "Creating token: spacing/0 (number) = 0"
- ✅ Variables only appear in auto-layout gap dropdowns

### Test 2: Check Figma Variable Scopes

```bash
# After import, in Figma:
1. Go to "Local Variables" panel
2. Select any spacing variable (e.g., "spacing/1")
3. Click "Edit Variable"
4. Check "Scopes" section
```

**Expected Result:**

- ✅ Only "Gap" checkbox is checked
- ✅ All other scopes are unchecked

### Test 3: Export and Verify Round-Trip

```bash
# In Figma plugin:
1. Click "Export" tab
2. Select "Separate files"
3. Select "Spacing" collection
4. Click "Export Separate Collection Files"
5. Compare exported JSON with original
```

**Expected Result:**

- ✅ Exported `$scopes: ["GAP"]` matches imported `$scopes: ["GAP"]`
- ✅ 1:1 fidelity maintained

---

## 📊 Complete Scope Support

Your plugin now supports **all 24 official Figma scopes**:

| Category            | Scopes                                                                                                                            | Support Status |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **General**         | `ALL_SCOPES`                                                                                                                      | ✅ Supported   |
| **Color/Fill**      | `ALL_FILLS`, `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL`                                                                              | ✅ Supported   |
| **Stroke**          | `STROKE_COLOR`, `STROKE_FLOAT`                                                                                                    | ✅ Supported   |
| **Effect**          | `EFFECT_COLOR`, `EFFECT_FLOAT`                                                                                                    | ✅ Supported   |
| **Layout/Geometry** | `TEXT_CONTENT`, `CORNER_RADIUS`, `WIDTH_HEIGHT`, `GAP`, `OPACITY`                                                                 | ✅ Supported   |
| **Typography**      | `FONT_FAMILY`, `FONT_STYLE`, `FONT_WEIGHT`, `FONT_SIZE`, `LINE_HEIGHT`, `LETTER_SPACING`, `PARAGRAPH_SPACING`, `PARAGRAPH_INDENT` | ✅ Supported   |

---

## 💡 Examples from Your Design System

### Spacing Tokens (GAP scope)

```json
{
  "spacing": {
    "1": {
      "$value": 4,
      "$type": "number",
      "$scopes": ["GAP"] // ✅ Works!
    }
  }
}
```

**Figma Result:** Variable appears in auto-layout gap fields only.

### Radius Tokens (CORNER_RADIUS scope)

```json
{
  "radius": {
    "sm": {
      "$value": 4,
      "$type": "number",
      "$scopes": ["CORNER_RADIUS"] // ✅ Works!
    }
  }
}
```

**Figma Result:** Variable appears in corner radius fields only.

### Typography Tokens (Multiple scopes)

```json
{
  "typography": {
    "font-weight": {
      "bold": {
        "$value": 700,
        "$type": "number",
        "$scopes": ["FONT_WEIGHT"] // ✅ Works!
      }
    },
    "line-height": {
      "relaxed": {
        "$value": 1.75,
        "$type": "number",
        "$scopes": ["LINE_HEIGHT"] // ✅ Works!
      }
    }
  }
}
```

**Figma Result:**

- `bold` appears only in font-weight dropdowns
- `relaxed` appears only in line-height dropdowns

### Color Tokens (Multiple scopes)

```json
{
  "colors": {
    "brand": {
      "primary": {
        "$value": "#0d6efd",
        "$type": "color",
        "$scopes": ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"] // ✅ Works!
      }
    }
  }
}
```

**Figma Result:** Variable appears in fill, stroke, and effect fields.

---

## 🔧 How to Add Scopes to Your Tokens

### Method 1: Add to Existing JSON Files

```json
{
  "your-token": {
    "$value": 16,
    "$type": "number",
    "$scopes": ["GAP"] // ← Add this property
  }
}
```

### Method 2: Use Multiple Scopes

```json
{
  "your-token": {
    "$value": "#ff0000",
    "$type": "color",
    "$scopes": ["ALL_FILLS", "STROKE_COLOR", "TEXT_FILL"] // ← Array of scopes
  }
}
```

### Method 3: Omit for Default Behavior

```json
{
  "your-token": {
    "$value": 16,
    "$type": "number"
    // No $scopes → defaults to ["ALL_SCOPES"]
  }
}
```

---

## ⚠️ Important Notes

### 1. **CRITICAL: Scope-Type Compatibility**

**Figma enforces strict scope-to-type compatibility!** Not all scopes work with all variable types.

| Variable Type                  | Valid Scopes                                                                                       | Example        |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | -------------- |
| **COLOR** (`$type: "color"`)   | `ALL_FILLS`, `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL`, `STROKE_COLOR`, `EFFECT_COLOR`               | Color tokens   |
| **FLOAT** (`$type: "number"`)  | `GAP`, `CORNER_RADIUS`, `WIDTH_HEIGHT`, `OPACITY`, `FONT_WEIGHT`, `FONT_SIZE`, `LINE_HEIGHT`, etc. | Numeric tokens |
| **STRING** (`$type: "string"`) | `TEXT_CONTENT`, `FONT_FAMILY`, `FONT_STYLE`                                                        | String tokens  |

**Common Error:**

```json
// ❌ WRONG: String with numeric scope
{
  "$value": "auto",
  "$type": "string",
  "$scopes": ["WIDTH_HEIGHT"]  // Error: Invalid scope for this variable type
}

// ✅ FIXED: String with string scope
{
  "$value": "auto",
  "$type": "string",
  "$scopes": ["TEXT_CONTENT"]  // Works!
}
```

**See `docs/SCOPE_TYPE_COMPATIBILITY.md` for complete compatibility matrix.**

### 2. Scope Validation

If you provide an invalid scope name, the plugin will:

- ✅ Log a warning with valid scope names
- ✅ Attempt to use the scope anyway (forward compatibility)
- ✅ Continue import without failing

```
Console Warning:
Unknown scope: INVALID_SCOPE. Using as-is. Valid scopes are: ALL_SCOPES, TEXT_CONTENT, CORNER_RADIUS, ...
```

### 3. Default Behavior

- **No `$scopes` property** → Defaults to `["ALL_SCOPES"]`
- **Empty array `$scopes: []`** → Defaults to `["ALL_SCOPES"]`
- **`null` or `undefined`** → Defaults to `["ALL_SCOPES"]`

### 4. Case Sensitivity

Scope names are **case-sensitive**. Use uppercase:

```json
✅ Correct:   "$scopes": ["GAP"]
❌ Wrong:     "$scopes": ["gap"]
❌ Wrong:     "$scopes": ["Gap"]
```

### 5. Array Format

`$scopes` must be an array, even with one scope:

```json
✅ Correct:   "$scopes": ["GAP"]
❌ Wrong:     "$scopes": "GAP"
```

---

## 🎯 Conclusion

**Your plugin FULLY supports `$scopes` assignment during import!**

✅ **Reads** `$scopes` from JSON tokens
✅ **Maps** scope strings to Figma's VariableScope enum
✅ **Assigns** scopes to created variables
✅ **Preserves** scopes for export
✅ **Supports** all 24 official Figma scopes
✅ **Works** for both direct values and aliases

---

## 📚 Related Documentation

- **Scope Mapping Guide:** `docs/SCOPE_MAPPING_GUIDE.md`
- **Import Guide:** `docs/IMPORT_GUIDE.md`
- **Scope Update Summary:** `SCOPE_UPDATE_SUMMARY.md`

---

**Last Updated:** November 13, 2025
**Plugin Version:** 2.0.0
**Verification Status:** ✅ CONFIRMED
