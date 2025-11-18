# Figma Variable Scope Mapping Guide

## Overview

This guide documents the complete mapping between design token `$scopes` values and Figma's official `VariableScope` API. All scopes are sourced directly from `@figma/plugin-typings` version 1.119.0.

## Complete Scope Reference

### 1. General Scope

| Token Scope | Figma VariableScope | Description | Use Cases |
|-------------|---------------------|-------------|-----------|
| `ALL_SCOPES` | `ALL_SCOPES` | Variable can be used in any context | Default scope when none specified |

### 2. Color/Fill Scopes

| Token Scope | Figma VariableScope | Description | Use Cases |
|-------------|---------------------|-------------|-----------|
| `ALL_FILLS` | `ALL_FILLS` | Any fill property | Color tokens that apply to all fill types |
| `FRAME_FILL` | `FRAME_FILL` | Frame background fills | Container/layout backgrounds |
| `SHAPE_FILL` | `SHAPE_FILL` | Shape object fills | Vector shapes, rectangles, circles |
| `TEXT_FILL` | `TEXT_FILL` | Text color | Typography colors, body text, headings |

### 3. Stroke Scopes

| Token Scope | Figma VariableScope | Description | Use Cases |
|-------------|---------------------|-------------|-----------|
| `STROKE_COLOR` | `STROKE_COLOR` | Stroke/border color | Border colors, dividers, outlines |
| `STROKE_FLOAT` | `STROKE_FLOAT` | Stroke weight/width | Border thickness, stroke width values |

**Note:** The alias `STROKE` → `STROKE_COLOR` is supported for backward compatibility.

### 4. Effect Scopes

| Token Scope | Figma VariableScope | Description | Use Cases |
|-------------|---------------------|-------------|-----------|
| `EFFECT_COLOR` | `EFFECT_COLOR` | Effect colors | Shadow colors, glow colors |
| `EFFECT_FLOAT` | `EFFECT_FLOAT` | Effect numeric values | Blur radius, shadow spread, opacity |

### 5. Layout/Geometry Scopes

| Token Scope | Figma VariableScope | Description | Use Cases |
|-------------|---------------------|-------------|-----------|
| `TEXT_CONTENT` | `TEXT_CONTENT` | Text string content | Dynamic text, placeholders |
| `CORNER_RADIUS` | `CORNER_RADIUS` | Border radius values | Rounded corners, button radii |
| `WIDTH_HEIGHT` | `WIDTH_HEIGHT` | Width and height dimensions | Component sizes, fixed dimensions |
| `GAP` | `GAP` | Auto-layout gap spacing | Spacing between auto-layout children |
| `OPACITY` | `OPACITY` | Opacity values (0-1) | Transparency, disabled states |

### 6. Typography Scopes

| Token Scope | Figma VariableScope | Description | Use Cases |
|-------------|---------------------|-------------|-----------|
| `FONT_FAMILY` | `FONT_FAMILY` | Font family name | "Roboto", "Inter", "SF Pro" |
| `FONT_STYLE` | `FONT_STYLE` | Font style | "italic", "normal" |
| `FONT_WEIGHT` | `FONT_WEIGHT` | Font weight (100-900) | Bold, semi-bold, light |
| `FONT_SIZE` | `FONT_SIZE` | Font size in pixels | Heading sizes, body text sizes |
| `LINE_HEIGHT` | `LINE_HEIGHT` | Line height | Leading, vertical rhythm |
| `LETTER_SPACING` | `LETTER_SPACING` | Letter spacing (tracking) | Character spacing, tight/loose tracking |
| `PARAGRAPH_SPACING` | `PARAGRAPH_SPACING` | Spacing between paragraphs | Vertical spacing after paragraphs |
| `PARAGRAPH_INDENT` | `PARAGRAPH_INDENT` | First line paragraph indent | Text indentation |

## Usage Examples

### Color Token with Multiple Fill Scopes

```json
{
  "colors": {
    "brand": {
      "primary": {
        "$type": "color",
        "$value": "#0d6efd",
        "$description": "Primary brand color",
        "$scopes": ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"]
      }
    }
  }
}
```

This allows the color to be used for:
- ✅ Frame backgrounds
- ✅ Shape fills
- ✅ Text colors
- ✅ Border colors
- ✅ Shadow colors

### Typography Token with Specific Scopes

```json
{
  "typography": {
    "font-weight": {
      "bold": {
        "$type": "number",
        "$value": 700,
        "$description": "Bold font weight",
        "$scopes": ["FONT_WEIGHT"]
      }
    },
    "line-height": {
      "relaxed": {
        "$type": "number",
        "$value": 1.75,
        "$description": "Relaxed line height for body text",
        "$scopes": ["LINE_HEIGHT"]
      }
    }
  }
}
```

### Layout Token with Geometry Scopes

```json
{
  "radius": {
    "md": {
      "$type": "number",
      "$value": 8,
      "$description": "Medium border radius",
      "$scopes": ["CORNER_RADIUS"]
    }
  },
  "spacing": {
    "gap": {
      "md": {
        "$type": "number",
        "$value": 16,
        "$description": "Medium auto-layout gap",
        "$scopes": ["GAP"]
      }
    }
  }
}
```

### Effect Token with Numeric Values

```json
{
  "effects": {
    "shadow": {
      "blur": {
        "$type": "number",
        "$value": 8,
        "$description": "Shadow blur radius",
        "$scopes": ["EFFECT_FLOAT"]
      },
      "color": {
        "$type": "color",
        "$value": "rgba(0, 0, 0, 0.15)",
        "$description": "Shadow color",
        "$scopes": ["EFFECT_COLOR"]
      }
    }
  }
}
```

## Default Behavior

### When `$scopes` is Omitted

If a token doesn't include the `$scopes` property, the plugin assigns `ALL_SCOPES` by default:

```json
{
  "colors": {
    "neutral": {
      "500": {
        "$type": "color",
        "$value": "#6c757d"
        // No $scopes specified → defaults to ["ALL_SCOPES"]
      }
    }
  }
}
```

### When `$scopes` is Empty Array

An empty `$scopes` array is treated as `ALL_SCOPES`:

```json
{
  "$scopes": []
  // Equivalent to ["ALL_SCOPES"]
}
```

## Scope Validation

### Valid Scope Names

The plugin validates scope names against Figma's official `VariableScope` enum. Valid scopes include:

```typescript
type VariableScope =
  | 'ALL_SCOPES'
  | 'TEXT_CONTENT'
  | 'CORNER_RADIUS'
  | 'WIDTH_HEIGHT'
  | 'GAP'
  | 'ALL_FILLS'
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'STROKE_FLOAT'
  | 'EFFECT_FLOAT'
  | 'EFFECT_COLOR'
  | 'OPACITY'
  | 'FONT_FAMILY'
  | 'FONT_STYLE'
  | 'FONT_WEIGHT'
  | 'FONT_SIZE'
  | 'LINE_HEIGHT'
  | 'LETTER_SPACING'
  | 'PARAGRAPH_SPACING'
  | 'PARAGRAPH_INDENT'
```

### Unknown Scopes

If you provide an unknown scope name, the plugin will:
1. Log a warning to the console with the list of valid scopes
2. Attempt to use the value as-is (in case it's a new Figma scope)
3. Continue processing without failing

```javascript
// Console warning example:
Unknown scope: INVALID_SCOPE. Using as-is. Valid scopes are: ALL_SCOPES, TEXT_CONTENT, CORNER_RADIUS, ...
```

## Best Practices

### 1. Be Specific When Possible

Instead of using `ALL_SCOPES` for everything, be specific about where tokens should be used:

**❌ Too Broad:**
```json
{
  "border-width": {
    "$value": 2,
    "$scopes": ["ALL_SCOPES"]  // Can be applied to any property
  }
}
```

**✅ Better:**
```json
{
  "border-width": {
    "$value": 2,
    "$scopes": ["STROKE_FLOAT"]  // Only for stroke widths
  }
}
```

### 2. Group Related Scopes

For colors that serve multiple purposes, group all applicable scopes:

```json
{
  "colors": {
    "semantic": {
      "error": {
        "$value": "#dc3545",
        "$scopes": [
          "ALL_FILLS",      // Can be used as background
          "TEXT_FILL",      // Can be used as text color
          "STROKE_COLOR",   // Can be used as border
          "EFFECT_COLOR"    // Can be used in shadows
        ]
      }
    }
  }
}
```

### 3. Use Single Scopes for Typography

Typography tokens typically have single, specific scopes:

```json
{
  "typography": {
    "font-size": {
      "body": {
        "$value": 16,
        "$scopes": ["FONT_SIZE"]  // Only for font size
      }
    },
    "font-weight": {
      "normal": {
        "$value": 400,
        "$scopes": ["FONT_WEIGHT"]  // Only for font weight
      }
    }
  }
}
```

### 4. Match Token Type to Scope

Ensure your token `$type` matches the scope:

| Token Type | Compatible Scopes |
|------------|-------------------|
| `color` | `ALL_FILLS`, `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL`, `STROKE_COLOR`, `EFFECT_COLOR` |
| `number` | `STROKE_FLOAT`, `EFFECT_FLOAT`, `CORNER_RADIUS`, `WIDTH_HEIGHT`, `GAP`, `OPACITY`, `FONT_WEIGHT`, `FONT_SIZE`, `LINE_HEIGHT`, `LETTER_SPACING`, `PARAGRAPH_SPACING`, `PARAGRAPH_INDENT` |
| `string` | `TEXT_CONTENT`, `FONT_FAMILY`, `FONT_STYLE` |

## Migration from Old Scopes

If you're upgrading from an older version of this plugin that only supported 7 scopes, here's how to migrate:

### Old Scope → New Scopes Mapping

| Old Scope (Limited) | New Equivalent | Additional Options |
|---------------------|----------------|-------------------|
| `ALL_SCOPES` | `ALL_SCOPES` | _(unchanged)_ |
| `ALL_FILLS` | `ALL_FILLS` | Or use specific: `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL` |
| `STROKE_COLOR` | `STROKE_COLOR` | Also consider: `STROKE_FLOAT` for widths |
| `EFFECT_COLOR` | `EFFECT_COLOR` | Also consider: `EFFECT_FLOAT` for blur/spread |
| _(missing)_ | `CORNER_RADIUS` | **NEW** - for border radius |
| _(missing)_ | `WIDTH_HEIGHT` | **NEW** - for dimensions |
| _(missing)_ | `GAP` | **NEW** - for auto-layout spacing |
| _(missing)_ | `OPACITY` | **NEW** - for transparency |
| _(missing)_ | `FONT_FAMILY` | **NEW** - for font families |
| _(missing)_ | `FONT_WEIGHT` | **NEW** - for font weights |
| _(missing)_ | `FONT_SIZE` | **NEW** - for font sizes |
| _(missing)_ | `LINE_HEIGHT` | **NEW** - for line heights |
| _(missing)_ | All other typography scopes | **NEW** - see Typography Scopes table |

### Example Migration

**Before (Limited Scopes):**
```json
{
  "font-weight": {
    "bold": {
      "$value": 700,
      "$scopes": ["ALL_SCOPES"]  // Had to use ALL_SCOPES
    }
  }
}
```

**After (Full Scopes):**
```json
{
  "font-weight": {
    "bold": {
      "$value": 700,
      "$scopes": ["FONT_WEIGHT"]  // Can now be specific!
    }
  }
}
```

## Official Figma Documentation

For the latest updates to the `VariableScope` API, refer to:
- [Figma Plugin API - Variables](https://www.figma.com/plugin-docs/api/Variable/)
- [Figma Plugin Typings](https://github.com/figma/plugin-typings)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2024 | Added 20 new scopes (typography, layout, geometry) |
| 1.0.0 | 2023 | Initial 7 scopes (fills, stroke, effect) |

---

**Last Updated:** November 13, 2025
**Plugin Version:** 2.0.0
**Figma Plugin Typings:** 1.119.0





