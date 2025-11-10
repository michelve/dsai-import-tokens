# Design Token Format Specification

## Overview

This document describes the token format used by the DSAI Import Tokens plugin for importing and exporting design tokens between Figma and external systems.

## Token Structure

The plugin uses a hierarchical JSON structure that follows the Design Tokens Community Group specification with extensions for platform-specific metadata.

### Root Structure

```json
{
  "CollectionName": {
    "modes": {
      "ModeName": {
        "group": {
          "subgroup": {
            "tokenName": {
              "$value": "value",
              "$type": "type",
              "$description": "description",
              "$codeSyntax": {},
              "$scopes": [],
              "$extensions": {}
            }
          }
        }
      }
    }
  }
}
```

### Required Properties

#### `$value`
The actual value of the token. Can be a direct value or an alias reference.

**Direct Values:**
- Color: `"#ff0000"` or `"rgba(255, 0, 0, 1)"`
- Number: `16` or `1.5`
- String: `"Roboto"` or `"solid"`
- Boolean: `true` or `false`

**Alias References:**
- Format: `"{path.to.token}"` or `"{collection/group/token}"`
- Example: `"{colors.brand.blue.500}"`

#### `$type`
The data type of the token value.

Supported types:
- `color` - Maps to Figma COLOR variable
- `number` - Maps to Figma FLOAT variable
- `string` - Maps to Figma STRING variable
- `boolean` - Maps to Figma BOOLEAN variable

### Optional Properties

#### `$description`
Human-readable description of the token's purpose, usage guidelines, and constraints.

Example:
```json
"$description": "Primary theme color. Main brand color for primary CTAs, links, and key interactive elements. Use for primary buttons, active navigation, focus states. Verify 4.5:1 contrast on backgrounds."
```

#### `$codeSyntax`
Platform-specific code syntax for accessing the token in different environments.

Structure:
```json
"$codeSyntax": {
  "WEB": "var(--bs-primary)",
  "ANDROID": "R.color.primary",
  "iOS": "Color.primary"
}
```

Supported platforms:
- `WEB` - CSS custom property or SCSS variable
- `ANDROID` - Android resource reference
- `iOS` - Swift/SwiftUI reference

#### `$scopes`
Array of Figma scopes that define where the variable can be applied.

Supported scope values:
- `ALL_SCOPES` - Can be used anywhere (default)
- `ALL_FILLS` - Fill colors
- `FRAME_FILL` - Frame fills
- `SHAPE_FILL` - Shape fills
- `TEXT_FILL` - Text fills
- `STROKE_COLOR` - Stroke colors
- `EFFECT_COLOR` - Effect colors (shadows, glows)

Example:
```json
"$scopes": ["ALL_FILLS", "STROKE_COLOR"]
```

#### `$extensions`
Custom metadata for documentation, tooling, and platform-specific information.

Structure:
```json
"$extensions": {
  "docs": {
    "reference": "https://example.com/docs",
    "section": "Colors",
    "subsection": "Brand"
  },
  "platform": {
    "cssVariableName": "--color-primary",
    "scssVariableName": "$color-primary",
    "lightMode": true,
    "darkMode": false
  }
}
```

The extensions object can contain arbitrary nested data that will be preserved during import/export.

## Complete Token Example

```json
{
  "Foundation": {
    "modes": {
      "Light": {
        "colors": {
          "brand": {
            "blue": {
              "500": {
                "$value": "#0d6efd",
                "$type": "color",
                "$description": "Primary brand blue. Use for primary actions, links, and focus states. Maintains 4.5:1 contrast on white backgrounds.",
                "$codeSyntax": {
                  "WEB": "var(--bs-blue-500)",
                  "ANDROID": "R.color.blue_500",
                  "iOS": "Color.Brand.Blue.shade500"
                },
                "$scopes": [
                  "ALL_FILLS",
                  "STROKE_COLOR"
                ],
                "$extensions": {
                  "docs": {
                    "reference": "https://getbootstrap.com/docs/5.3/customize/color/#blue",
                    "section": "Customization",
                    "subsection": "Colors - Brand - Blue"
                  },
                  "platform": {
                    "cssVariableName": "--bs-blue-500",
                    "scssVariableName": "$blue-500",
                    "bootstrapVersion": "5.3"
                  }
                }
              }
            }
          },
          "theme": {
            "primary": {
              "$value": "{colors.brand.blue.500}",
              "$type": "color",
              "$description": "Primary theme color. References brand blue 500.",
              "$codeSyntax": {
                "WEB": "var(--bs-primary)"
              },
              "$scopes": ["ALL_FILLS", "STROKE_COLOR"]
            }
          }
        }
      },
      "Dark": {
        "colors": {
          "brand": {
            "blue": {
              "500": {
                "$value": "#0d6efd",
                "$type": "color"
              }
            }
          },
          "theme": {
            "primary": {
              "$value": "{colors.brand.blue.400}",
              "$type": "color",
              "$description": "Primary theme color in dark mode. Uses lighter shade for better contrast."
            }
          }
        }
      }
    }
  }
}
```

## Naming Conventions

### Collection Names
- Use PascalCase or Title Case
- Example: `Foundation`, `Components`, `Semantic`

### Mode Names
- Use PascalCase or Title Case
- Common: `Light`, `Dark`, `HighContrast`

### Token Paths
- Use forward slashes `/` as separators in Figma variable names
- Automatically converted from dot notation in aliases
- Example Figma name: `colors/brand/blue/500`
- Example alias reference: `{colors.brand.blue.500}`

### Token Names
- Use lowercase with hyphens or numbers
- Examples: `primary`, `blue-500`, `spacing-md`

## Alias Resolution

### Within Same Collection
Aliases are resolved using the hierarchical path structure.

```json
"reference": {
  "$value": "{colors.brand.blue.500}",
  "$type": "color"
}
```

### Cross-Collection References
The plugin searches all collections to resolve aliases.

```json
"semantic-primary": {
  "$value": "{Foundation.colors.brand.blue.500}",
  "$type": "color"
}
```

### Path Resolution Rules
1. Braces are removed: `{token}` becomes `token`
2. Dots are converted to slashes: `colors.brand.blue` becomes `colors/brand/blue`
3. If no collection prefix is found, the current collection context is used
4. Group prefixes are automatically added for `brand/`, `neutral/`, `theme/` paths

## Multi-Mode Support

### Mode Structure
Each collection can have multiple modes (e.g., Light/Dark themes).

```json
{
  "Collection": {
    "modes": {
      "Light": {
        "token": {
          "$value": "#ffffff",
          "$type": "color"
        }
      },
      "Dark": {
        "token": {
          "$value": "#000000",
          "$type": "color"
        }
      }
    }
  }
}
```

### Mode Processing Order
1. First mode creates all variables
2. Subsequent modes only set values for existing variables
3. Aliases can reference different tokens in different modes

## Import Behavior

### Collection Management
- Existing collections are updated
- New collections are created
- Collection names must match exactly

### Mode Management
- Existing modes are renamed to match
- Additional modes are created
- Extra modes in Figma are not removed

### Variable Management
- Variables are created or updated by name
- Variable names use forward slash `/` as hierarchy separator
- Duplicate names within a collection are not allowed

### Alias Processing
- Direct values are processed first
- Aliases are processed after all direct values are created
- Cross-collection aliases are resolved across all collections
- Unresolvable aliases are skipped with warnings

## Export Behavior

### Output Structure
Exports match the input format with all metadata preserved.

### Value Formatting
- Colors: Exported as hex strings (`#rrggbb` or `rgba(r,g,b,a)`)
- Numbers: Exported as numeric values
- Strings: Exported as string values
- Booleans: Exported as boolean values
- Aliases: Exported as reference strings with braces and dots

### Metadata Preservation
- Descriptions are exported to `$description`
- Scopes are exported to `$scopes` array
- Code syntax is exported to `$codeSyntax` object
- All metadata is preserved during round-trip import/export

## Validation Rules

### Required Validations
1. All tokens must have `$value` and `$type`
2. Collection must have at least one mode
3. Mode must have at least one token group
4. Token paths must be valid (no special characters except `/`)

### Type Validations
- Color values must be valid hex or rgba format
- Number values must be numeric
- Alias values must reference existing tokens
- Scope values must be from supported list

### Best Practices
1. Use descriptive token names
2. Include usage guidelines in descriptions
3. Define scopes to prevent misuse
4. Document platform syntax in codeSyntax
5. Use extensions for custom metadata
6. Keep token hierarchies shallow (3-4 levels max)
7. Use semantic naming for theme tokens
8. Document contrast ratios in color descriptions
