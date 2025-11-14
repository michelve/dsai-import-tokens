# Import Guide

## Overview

The import functionality converts Design Tokens JSON files into Figma Variables and Collections. It handles complex scenarios including nested token structures, alias references, cross-collection dependencies, and multi-mode configurations.

## Import Process Flow

### Phase 1: Collection Processing

```
importTokens()
  ↓
Parse JSON
  ↓
For each collection:
  - Get or create variable collection
  - Configure modes
  - Process token tree
```

The import begins by parsing the JSON file and iterating through top-level collection objects. Each collection is either retrieved (if it exists) or created new in Figma.

### Phase 2: Mode Configuration

```
For each collection:
  ↓
Get mode names from JSON
  ↓
Rename first mode to match first JSON mode
  ↓
Create additional modes as needed
```

Figma collections always have at least one mode. The importer renames the first mode to match the first mode in the JSON, then creates any additional modes found in the token data.

### Phase 3: Token Tree Traversal

```
traverseTokens(tokens, path, collection, mode)
  ↓
For each key in token object:
  - Check if token definition ($value present)
  - If token: create variable
  - If group: recurse into children
```

The traversal function recursively walks the nested token structure, building up path strings separated by forward slashes. When a token definition is found (object with `$value` property), it creates or updates the corresponding Figma variable.

### Phase 4: Variable Creation

```
createVariable(tokenName, tokenData, collection, mode)
  ↓
Check if value is alias: {path.to.token}
  ↓
If alias: createVariableAlias()
If direct: Create variable with value
  ↓
Set additional properties:
  - description
  - scopes
  - codeSyntax
```

Each token becomes a Figma variable. The variable name uses forward slashes to represent hierarchy (e.g., `colors/brand/blue/500`). If the value is an alias reference, special handling defers resolution until after all variables are created.

### Phase 5: Alias Resolution

```
After all variables created:
  ↓
processAliases(deferredAliases)
  ↓
For each deferred alias:
  - Parse alias path
  - Search for target variable
  - Create alias binding
```

Alias resolution happens after all direct-value variables are created. This two-phase approach ensures that alias targets exist before attempting to bind references.

### Phase 6: Multi-Mode Value Assignment

```
For modes after first:
  ↓
setModeValues(tokens, collection, mode)
  ↓
For each variable:
  - Find corresponding token in mode data
  - Set mode-specific value or alias
```

After the first mode creates all variables, subsequent modes only need to set values for those existing variables. Each mode can have different values or alias targets for the same variable.

## Implementation Details

### Token Path Construction

Token paths are built during traversal by concatenating group names with forward slashes:

```javascript
// Input JSON structure:
{
  "colors": {
    "brand": {
      "blue": {
        "500": {
          "$value": "#0d6efd",
          "$type": "color"
        }
      }
    }
  }
}

// Resulting Figma variable name:
"colors/brand/blue/500"
```

### Alias Syntax Parsing

Alias references use brace syntax with dot separators:

```javascript
// Alias in JSON:
"$value": "{colors.brand.blue.500}"

// Parsing steps:
1. Remove braces: "colors.brand.blue.500"
2. Replace dots with slashes: "colors/brand/blue/500"
3. Search for variable with that name
```

### Cross-Collection References

Aliases can reference variables in other collections by prefixing the collection name:

```javascript
// Cross-collection alias:
"$value": "{Foundation.colors.brand.blue.500}"

// Resolution:
1. Extract collection name: "Foundation"
2. Find collection by name
3. Look for variable: "colors/brand/blue/500"
```

### Group Prefix Handling

Certain token paths receive automatic group prefixes for organizational clarity:

```javascript
// Special paths that get prefixed:
- "brand/*" → "colors/brand/*"
- "neutral/*" → "colors/neutral/*"
- "theme/*" → "colors/theme/*"

// Example:
Input path: "brand/blue/500"
Final variable name: "colors/brand/blue/500"
```

### Type Mapping

Token types are mapped to Figma variable types:

| Token Type | Figma Type | Notes |
|------------|------------|-------|
| `color` | `COLOR` | Hex or rgba format |
| `number` | `FLOAT` | Numeric values |
| `string` | `STRING` | Text values |
| `boolean` | `BOOLEAN` | true/false |

### Value Parsing

#### Color Values

Colors are parsed from hex or rgba string format into Figma's RGB object format:

```javascript
// Hex format:
"#0d6efd" → { r: 0.050980, g: 0.431373, b: 0.992157 }

// RGBA format:
"rgba(13, 110, 253, 1)" → { r: 0.050980, g: 0.431373, b: 0.992157 }

// RGB components are normalized to 0-1 range
```

#### Number Values

Numbers are used directly as float values:

```javascript
"$value": 16 → 16.0
"$value": 1.5 → 1.5
```

#### String Values

Strings are used as-is:

```javascript
"$value": "Roboto" → "Roboto"
"$value": "solid" → "solid"
```

#### Boolean Values

Booleans are used directly:

```javascript
"$value": true → true
"$value": false → false
```

### Scope Assignment

The `$scopes` array maps to Figma variable scopes:

```javascript
// Input scopes array:
"$scopes": ["ALL_FILLS", "STROKE_COLOR"]

// Maps to Figma scope enums:
[
  VariableScope.ALL_FILLS,
  VariableScope.STROKE_COLOR
]

// Complete list of supported scope strings (from Figma's official VariableScope API):

// General:
- "ALL_SCOPES"           // Variable can be used anywhere

// Color/Fill Scopes:
- "ALL_FILLS"            // Any fill property
- "FRAME_FILL"           // Frame background fills
- "SHAPE_FILL"           // Shape fills
- "TEXT_FILL"            // Text color

// Stroke Scopes:
- "STROKE_COLOR"         // Stroke color
- "STROKE_FLOAT"         // Stroke weight/width (numeric)

// Effect Scopes:
- "EFFECT_COLOR"         // Effect colors (shadows, glows)
- "EFFECT_FLOAT"         // Effect values (blur radius, spread)

// Layout/Geometry Scopes:
- "TEXT_CONTENT"         // Text string content
- "CORNER_RADIUS"        // Border radius values
- "WIDTH_HEIGHT"         // Width and height dimensions
- "GAP"                  // Auto-layout gap spacing
- "OPACITY"              // Opacity values (0-1)

// Typography Scopes:
- "FONT_FAMILY"          // Font family name
- "FONT_STYLE"           // Font style (italic, normal)
- "FONT_WEIGHT"          // Font weight (100-900)
- "FONT_SIZE"            // Font size
- "LINE_HEIGHT"          // Line height
- "LETTER_SPACING"       // Letter spacing (tracking)
- "PARAGRAPH_SPACING"    // Spacing between paragraphs
- "PARAGRAPH_INDENT"     // First line paragraph indent
```

### Extension Metadata

The `$extensions` object is stored recursively in Figma's variable metadata:

```javascript
// Input extensions:
"$extensions": {
  "docs": {
    "reference": "https://example.com",
    "section": "Colors"
  }
}

// Stored as variable metadata with formatted JSON:
variable.extensions = {
  "docs": '{"reference":"https://example.com","section":"Colors"}'
}
```

Extensions are stored as formatted JSON strings to preserve structure when round-tripping through export/import cycles.

### Code Syntax Storage

Platform-specific code syntax is stored in variable metadata:

```javascript
// Input code syntax:
"$codeSyntax": {
  "WEB": "var(--bs-primary)",
  "ANDROID": "R.color.primary"
}

// Stored in variable metadata:
variable.codeSyntax = {
  "WEB": "var(--bs-primary)",
  "ANDROID": "R.color.primary"
}
```

## Error Handling

### Missing Required Properties

Tokens without `$value` or `$type` are skipped:

```javascript
if (!tokenData.$value || !tokenData.$type) {
  console.warn(`Skipping invalid token: ${tokenName}`);
  return;
}
```

### Unresolvable Aliases

If an alias target cannot be found, the variable is skipped:

```javascript
if (!targetVariable) {
  console.warn(`Could not resolve alias: ${aliasPath}`);
  return;
}
```

### Invalid Color Format

Malformed color strings fall back to black:

```javascript
function parseColor(colorString) {
  // Parse hex or rgba
  // If parsing fails, return { r: 0, g: 0, b: 0 }
}
```

### Type Mismatches

If a token type doesn't match Figma's expectations, the variable uses a default type:

```javascript
// Unknown types default to STRING
const figmaType = tokenTypeMap[tokenData.$type] || "STRING";
```

## Usage Examples

### Basic Import

```javascript
// From UI: User selects file
figma.ui.postMessage({
  type: 'file-selected',
  content: fileContent
});

// In plugin code:
importTokens(JSON.parse(fileContent));
```

### Programmatic Import

```javascript
const tokenData = {
  "MyCollection": {
    "modes": {
      "Light": {
        "colors": {
          "primary": {
            "$value": "#0d6efd",
            "$type": "color",
            "$description": "Primary color"
          }
        }
      }
    }
  }
};

importTokens(tokenData);
```

### Multi-Mode Import

```javascript
const multiModeData = {
  "Theme": {
    "modes": {
      "Light": {
        "background": {
          "$value": "#ffffff",
          "$type": "color"
        }
      },
      "Dark": {
        "background": {
          "$value": "#000000",
          "$type": "color"
        }
      }
    }
  }
};

importTokens(multiModeData);
```

### Import with Aliases

```javascript
const aliasData = {
  "Foundation": {
    "modes": {
      "Light": {
        "colors": {
          "blue": {
            "500": {
              "$value": "#0d6efd",
              "$type": "color"
            }
          },
          "primary": {
            "$value": "{colors.blue.500}",
            "$type": "color"
          }
        }
      }
    }
  }
};

importTokens(aliasData);
```

### Cross-Collection Import

```javascript
const crossCollectionData = {
  "Foundation": {
    "modes": {
      "Light": {
        "colors": {
          "blue": {
            "500": {
              "$value": "#0d6efd",
              "$type": "color"
            }
          }
        }
      }
    }
  },
  "Components": {
    "modes": {
      "Light": {
        "button": {
          "primary": {
            "$value": "{Foundation.colors.blue.500}",
            "$type": "color"
          }
        }
      }
    }
  }
};

importTokens(crossCollectionData);
```

## Performance Considerations

### Large Token Sets

For token files with thousands of variables:

1. Traversal is depth-first, minimizing memory usage
2. Alias resolution is deferred to second pass
3. Mode values are set incrementally

### Collection Updates

Updating existing collections is efficient:

1. Existing variables are updated in place
2. New variables are added
3. Removed variables remain in Figma (not deleted)

### Memory Usage

The import process maintains several data structures:

1. `deferredAliases` array for two-phase resolution
2. `variablesByName` map for quick lookups
3. `modesByCollection` map for multi-mode assignment

## Best Practices

### File Organization

1. Group related tokens in hierarchical structures
2. Keep token depth reasonable (3-4 levels)
3. Use consistent naming conventions

### Alias Usage

1. Define base values first in token file
2. Reference base values with aliases for semantic tokens
3. Avoid circular alias references
4. Use descriptive alias paths

### Mode Configuration

1. Define all modes in first collection
2. Use consistent mode names across collections
3. Provide values for all modes when possible

### Metadata

1. Include descriptions for clarity
2. Define appropriate scopes to prevent misuse
3. Document platform syntax for developers
4. Use extensions for custom tooling data

### Error Prevention

1. Validate JSON structure before import
2. Check for duplicate token names
3. Verify alias paths are valid
4. Test with small datasets first

## Troubleshooting

### Variables Not Created

Check that:
- Token has `$value` and `$type` properties
- Token type is valid (color, number, string, boolean)
- Value format matches type (e.g., hex for colors)

### Aliases Not Resolving

Verify that:
- Target variable exists in token file
- Alias path syntax is correct: `{path.to.token}`
- Cross-collection references include collection name
- No circular references exist

### Modes Not Created

Ensure that:
- Mode name is valid (no special characters)
- Mode structure matches expected format
- All modes have same token structure

### Scopes Not Applied

Confirm that:
- Scope strings match supported values
- Scopes are in array format: `["ALL_FILLS"]`
- Scopes are appropriate for variable type

### Extensions Not Preserved

Check that:
- Extensions object is valid JSON
- No circular references in extensions
- Extensions are not excessively large
