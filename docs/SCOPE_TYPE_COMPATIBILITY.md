# Figma Scope-Type Compatibility Guide

## ⚠️ Critical: Variable Type Restrictions

Figma enforces **strict scope-to-type compatibility**. Not all scopes work with all variable types. Using an incompatible scope will cause this error:

```
Error: in set_scopes: Invalid scope for this variable type
```

---

## 📊 Complete Compatibility Matrix

### COLOR Variables (`$type: "color"`)

| Scope | Compatible? | Use Case |
|-------|------------|----------|
| `ALL_SCOPES` | ✅ Yes | Any context |
| `ALL_FILLS` | ✅ Yes | Any fill property |
| `FRAME_FILL` | ✅ Yes | Frame backgrounds |
| `SHAPE_FILL` | ✅ Yes | Shape fills |
| `TEXT_FILL` | ✅ Yes | Text colors |
| `STROKE_COLOR` | ✅ Yes | Border/stroke colors |
| `EFFECT_COLOR` | ✅ Yes | Shadow/glow colors |
| All others | ❌ No | Invalid |

**Example:**
```json
{
  "colors": {
    "brand": {
      "primary": {
        "$value": "#0d6efd",
        "$type": "color",
        "$scopes": ["ALL_FILLS", "STROKE_COLOR", "TEXT_FILL"]  // ✅ Valid
      }
    }
  }
}
```

---

### FLOAT Variables (`$type: "number"`)

| Scope | Compatible? | Use Case |
|-------|------------|----------|
| `ALL_SCOPES` | ✅ Yes | Any context |
| `CORNER_RADIUS` | ✅ Yes | Border radius |
| `WIDTH_HEIGHT` | ✅ Yes | Dimensions |
| `GAP` | ✅ Yes | Auto-layout gap |
| `STROKE_FLOAT` | ✅ Yes | Stroke width |
| `EFFECT_FLOAT` | ✅ Yes | Blur, spread |
| `OPACITY` | ✅ Yes | Opacity (0-1) |
| `FONT_WEIGHT` | ✅ Yes | Font weight (100-900) |
| `FONT_SIZE` | ✅ Yes | Font size (px) |
| `LINE_HEIGHT` | ✅ Yes | Line height |
| `LETTER_SPACING` | ✅ Yes | Letter spacing |
| `PARAGRAPH_SPACING` | ✅ Yes | Paragraph spacing |
| `PARAGRAPH_INDENT` | ✅ Yes | Paragraph indent |
| Color/Fill scopes | ❌ No | Only for COLOR type |
| `TEXT_CONTENT` | ❌ No | Only for STRING type |
| `FONT_FAMILY` | ❌ No | Only for STRING type |
| `FONT_STYLE` | ❌ No | Only for STRING type |

**Example:**
```json
{
  "spacing": {
    "gap-md": {
      "$value": 16,
      "$type": "number",
      "$scopes": ["GAP"]  // ✅ Valid
    }
  },
  "radius": {
    "sm": {
      "$value": 4,
      "$type": "number",
      "$scopes": ["CORNER_RADIUS"]  // ✅ Valid
    }
  },
  "typography": {
    "font-weight": {
      "bold": {
        "$value": 700,
        "$type": "number",
        "$scopes": ["FONT_WEIGHT"]  // ✅ Valid
      }
    }
  }
}
```

---

### STRING Variables (`$type: "string"`)

| Scope | Compatible? | Use Case |
|-------|------------|----------|
| `ALL_SCOPES` | ✅ Yes | Any context |
| `TEXT_CONTENT` | ✅ Yes | Text content |
| `FONT_FAMILY` | ✅ Yes | Font family names |
| `FONT_STYLE` | ✅ Yes | Font styles (italic, normal) |
| All numeric scopes | ❌ No | Only for FLOAT type |
| All color scopes | ❌ No | Only for COLOR type |

**Example:**
```json
{
  "typography": {
    "font-family": {
      "sans": {
        "$value": "Inter",
        "$type": "string",
        "$scopes": ["FONT_FAMILY"]  // ✅ Valid
      }
    }
  },
  "spacing": {
    "auto": {
      "$value": "auto",
      "$type": "string",
      "$scopes": ["TEXT_CONTENT"]  // ✅ Valid (not WIDTH_HEIGHT!)
    }
  }
}
```

---

### BOOLEAN Variables (`$type: "boolean"`)

| Scope | Compatible? | Use Case |
|-------|------------|----------|
| `ALL_SCOPES` | ✅ Yes | Any context |
| All specific scopes | ❌ No | Limited use in Figma |

**Note:** Boolean variables are rarely used in Figma and have limited scope support.

---

## 🚨 Common Errors and Fixes

### Error 1: String with Numeric Scope

**❌ WRONG:**
```json
{
  "spacing": {
    "auto": {
      "$value": "auto",
      "$type": "string",
      "$scopes": ["WIDTH_HEIGHT"]  // ❌ WIDTH_HEIGHT only works with numbers!
    }
  }
}
```

**✅ FIXED:**
```json
{
  "spacing": {
    "auto": {
      "$value": "auto",
      "$type": "string",
      "$scopes": ["TEXT_CONTENT"]  // ✅ TEXT_CONTENT works with strings
    }
  }
}
```

---

### Error 2: Number with Color Scope

**❌ WRONG:**
```json
{
  "spacing": {
    "gap-md": {
      "$value": 16,
      "$type": "number",
      "$scopes": ["ALL_FILLS"]  // ❌ ALL_FILLS only works with colors!
    }
  }
}
```

**✅ FIXED:**
```json
{
  "spacing": {
    "gap-md": {
      "$value": 16,
      "$type": "number",
      "$scopes": ["GAP"]  // ✅ GAP works with numbers
    }
  }
}
```

---

### Error 3: Number with String Scope

**❌ WRONG:**
```json
{
  "typography": {
    "font-weight": {
      "bold": {
        "$value": 700,
        "$type": "number",
        "$scopes": ["FONT_FAMILY"]  // ❌ FONT_FAMILY only works with strings!
      }
    }
  }
}
```

**✅ FIXED:**
```json
{
  "typography": {
    "font-weight": {
      "bold": {
        "$value": 700,
        "$type": "number",
        "$scopes": ["FONT_WEIGHT"]  // ✅ FONT_WEIGHT works with numbers
      }
    }
  }
}
```

---

### Error 4: Color with Numeric Scope

**❌ WRONG:**
```json
{
  "colors": {
    "brand": {
      "primary": {
        "$value": "#0d6efd",
        "$type": "color",
        "$scopes": ["GAP"]  // ❌ GAP only works with numbers!
      }
    }
  }
}
```

**✅ FIXED:**
```json
{
  "colors": {
    "brand": {
      "primary": {
        "$value": "#0d6efd",
        "$type": "color",
        "$scopes": ["ALL_FILLS"]  // ✅ ALL_FILLS works with colors
      }
    }
  }
}
```

---

## 🎯 Quick Reference: Scope by Token Type

### For Colors (`$type: "color"`)

**Use these scopes:**
```
✅ ALL_SCOPES
✅ ALL_FILLS
✅ FRAME_FILL
✅ SHAPE_FILL
✅ TEXT_FILL
✅ STROKE_COLOR
✅ EFFECT_COLOR
```

---

### For Numbers (`$type: "number"`)

**Use these scopes:**
```
✅ ALL_SCOPES
✅ CORNER_RADIUS      (border radius)
✅ WIDTH_HEIGHT       (dimensions)
✅ GAP                (auto-layout spacing)
✅ STROKE_FLOAT       (stroke width)
✅ EFFECT_FLOAT       (blur, spread)
✅ OPACITY            (0-1 transparency)
✅ FONT_WEIGHT        (100-900)
✅ FONT_SIZE          (px)
✅ LINE_HEIGHT        (unitless or px)
✅ LETTER_SPACING     (tracking)
✅ PARAGRAPH_SPACING  (spacing after)
✅ PARAGRAPH_INDENT   (first line indent)
```

---

### For Strings (`$type: "string"`)

**Use these scopes:**
```
✅ ALL_SCOPES
✅ TEXT_CONTENT       (text strings)
✅ FONT_FAMILY        (font names)
✅ FONT_STYLE         (italic, normal)
```

---

## 📝 Best Practices

### 1. Match Type to Scope

Always ensure your `$type` matches the scope category:

```json
// ✅ GOOD: Number with numeric scope
{
  "$value": 16,
  "$type": "number",
  "$scopes": ["GAP"]
}

// ✅ GOOD: String with string scope
{
  "$value": "Inter",
  "$type": "string",
  "$scopes": ["FONT_FAMILY"]
}

// ✅ GOOD: Color with color scope
{
  "$value": "#ff0000",
  "$type": "color",
  "$scopes": ["ALL_FILLS"]
}
```

---

### 2. Use ALL_SCOPES as Fallback

If you're unsure, `ALL_SCOPES` works with all types:

```json
{
  "$value": 16,
  "$type": "number",
  "$scopes": ["ALL_SCOPES"]  // ✅ Safe fallback
}
```

---

### 3. Test Before Committing

Always test imports with a small sample file first:

```bash
1. Create test file with new scopes
2. Import in Figma plugin
3. Check for errors
4. Verify variables appear in correct fields
5. Then update main token files
```

---

### 4. Document Token Purpose

Use clear descriptions to indicate intended scope:

```json
{
  "spacing": {
    "gap-md": {
      "$value": 16,
      "$type": "number",
      "$description": "Medium auto-layout gap - for spacing between flex children",
      "$scopes": ["GAP"]  // Clear: this is for auto-layout gaps
    }
  }
}
```

---

## 🔍 Debugging Scope Errors

### Step 1: Check Error Message

```
Error creating token spacing/auto: in set_scopes: Invalid scope for this variable type
                      ↑                                    ↑
                Token name                        The scope doesn't match type
```

### Step 2: Identify Token Type

Look at the `$type` field:
- `"color"` → Use color scopes
- `"number"` → Use numeric scopes
- `"string"` → Use string scopes

### Step 3: Match Compatible Scope

Refer to the compatibility matrix above and choose a valid scope.

### Step 4: Update and Re-import

Fix the scope in your JSON file and import again.

---

## 📋 Complete Scope-Type Rules

### Rule 1: Color Scopes → COLOR Variables Only

```
ALL_FILLS, FRAME_FILL, SHAPE_FILL, TEXT_FILL, STROKE_COLOR, EFFECT_COLOR
→ Only work with $type: "color"
```

### Rule 2: Numeric Scopes → FLOAT Variables Only

```
CORNER_RADIUS, WIDTH_HEIGHT, GAP, STROKE_FLOAT, EFFECT_FLOAT, OPACITY,
FONT_WEIGHT, FONT_SIZE, LINE_HEIGHT, LETTER_SPACING, PARAGRAPH_SPACING, PARAGRAPH_INDENT
→ Only work with $type: "number"
```

### Rule 3: String Scopes → STRING Variables Only

```
TEXT_CONTENT, FONT_FAMILY, FONT_STYLE
→ Only work with $type: "string"
```

### Rule 4: ALL_SCOPES → Works with Any Type

```
ALL_SCOPES
→ Works with color, number, string, boolean
```

---

## 🧪 Testing Your Tokens

### Test File: `test-scope-compatibility.json`

```json
{
  "Test Collection": {
    "modes": {
      "Base": {
        "colors": {
          "test-color": {
            "$value": "#ff0000",
            "$type": "color",
            "$scopes": ["ALL_FILLS"]
          }
        },
        "numbers": {
          "test-gap": {
            "$value": 16,
            "$type": "number",
            "$scopes": ["GAP"]
          },
          "test-radius": {
            "$value": 8,
            "$type": "number",
            "$scopes": ["CORNER_RADIUS"]
          },
          "test-weight": {
            "$value": 700,
            "$type": "number",
            "$scopes": ["FONT_WEIGHT"]
          }
        },
        "strings": {
          "test-font": {
            "$value": "Inter",
            "$type": "string",
            "$scopes": ["FONT_FAMILY"]
          },
          "test-text": {
            "$value": "auto",
            "$type": "string",
            "$scopes": ["TEXT_CONTENT"]
          }
        }
      }
    }
  }
}
```

**Expected Result:** All tokens import successfully with correct scopes.

---

## 🎓 Summary

| Variable Type | Valid Scopes | Invalid Scopes |
|---------------|--------------|----------------|
| **COLOR** | Color/fill scopes | Numeric scopes, String scopes |
| **FLOAT** | Numeric scopes | Color scopes, String scopes |
| **STRING** | String scopes | Color scopes, Most numeric scopes |
| **BOOLEAN** | ALL_SCOPES only | Most specific scopes |

**Key Takeaway:** Always match your `$type` to compatible scopes from the matrix above!

---

**Last Updated:** November 13, 2025
**Plugin Version:** 2.0.0
**Figma API Version:** 1.119.0





