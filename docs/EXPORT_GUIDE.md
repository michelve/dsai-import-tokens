# Export Guide

## Overview

The export functionality converts Figma Variables and Collections into Design Tokens JSON format. It preserves all metadata including descriptions, scopes, code syntax, and extensions while converting Figma's internal structure into the standardized token format.

## Export Process Flow

### Phase 1: Collection Selection

The export can operate in two modes:

**Single File Export:**
All collections are combined into one JSON file with each collection as a top-level key.

**Separate Files Export:**
Each collection is exported to its own JSON file named after the collection.

### Phase 2: Collection Processing

```
For each collection:
  ↓
getAllVariables(collection)
  ↓
processCollection(collection, variables)
  ↓
Build modes structure
  ↓
Convert each variable to token format
```

### Phase 3: Variable Conversion

```
For each variable:
  ↓
variableToToken(variable, collection)
  ↓
Extract properties:
  - $value (direct or alias)
  - $type
  - $description
  - $codeSyntax
  - $scopes
  - $extensions
```

## Implementation Details

### Variable Retrieval

All variable types are retrieved from the collection:

```javascript
function getAllVariables(collection) {
  return [
    ...collection.variableIds.map(id => figma.variables.getVariableById(id)),
    ...figma.variables.getLocalVariables('COLOR'),
    ...figma.variables.getLocalVariables('FLOAT'),
    ...figma.variables.getLocalVariables('STRING'),
    ...figma.variables.getLocalVariables('BOOLEAN')
  ].filter(variable => variable && variable.variableCollectionId === collection.id);
}
```

This ensures all variables belonging to the collection are captured, regardless of type.

### Path Structure Generation

Variable names in Figma use forward slashes as separators. These are converted to nested object structures:

```javascript
// Figma variable name:
"colors/brand/blue/500"

// Becomes nested structure:
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
```

The path is split on forward slashes and nested objects are created for each segment.

### Mode Structure

Each collection can have multiple modes. The export creates a modes object:

```javascript
{
  "CollectionName": {
    "modes": {
      "Light": {
        // All tokens for Light mode
      },
      "Dark": {
        // All tokens for Dark mode
      }
    }
  }
}
```

Each mode contains the complete token tree with mode-specific values.

### Value Extraction

Values are extracted from the variable's `valuesByMode` property:

```javascript
const modeValue = variable.valuesByMode[modeId];

if (typeof modeValue === 'object' && modeValue.type === 'VARIABLE_ALIAS') {
  // Handle alias
  token.$value = resolveAliasPath(modeValue.id, collection);
} else {
  // Handle direct value
  token.$value = formatValue(modeValue, variable.resolvedType);
}
```

### Type Mapping

Figma variable types are mapped to token types:

| Figma Type | Token Type |
|------------|------------|
| `COLOR` | `color` |
| `FLOAT` | `number` |
| `STRING` | `string` |
| `BOOLEAN` | `boolean` |

```javascript
function getTokenType(figmaType) {
  const typeMap = {
    'COLOR': 'color',
    'FLOAT': 'number',
    'STRING': 'string',
    'BOOLEAN': 'boolean'
  };
  return typeMap[figmaType] || 'string';
}
```

### Value Formatting

Values are formatted based on their type:

#### Color Formatting

Figma RGB objects are converted to hex strings:

```javascript
function formatValue(value, type) {
  if (type === 'COLOR') {
    const r = Math.round(value.r * 255);
    const g = Math.round(value.g * 255);
    const b = Math.round(value.b * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

// Example:
{ r: 0.050980, g: 0.431373, b: 0.992157 } → "#0d6efd"
```

#### Number Formatting

Numbers are exported as numeric values:

```javascript
if (type === 'FLOAT') {
  return value; // 16, 1.5, etc.
}
```

#### String Formatting

Strings are exported as-is:

```javascript
if (type === 'STRING') {
  return value; // "Roboto", "solid", etc.
}
```

#### Boolean Formatting

Booleans are exported as-is:

```javascript
if (type === 'BOOLEAN') {
  return value; // true, false
}
```

### Alias Resolution

When a value is an alias reference, it is converted to the token path format:

```javascript
function resolveAliasPath(variableId, currentCollection) {
  const targetVariable = figma.variables.getVariableById(variableId);
  if (!targetVariable) return null;
  
  const targetCollection = figma.variables.getVariableCollectionById(
    targetVariable.variableCollectionId
  );
  
  let path = targetVariable.name.replace(/\//g, '.');
  
  // Add collection prefix if different collection
  if (targetCollection.id !== currentCollection.id) {
    path = `${targetCollection.name}.${path}`;
  }
  
  return `{${path}}`;
}

// Example:
Variable ID → Variable name "colors/brand/blue/500" → "{colors.brand.blue.500}"
```

### Description Extraction

Variable descriptions are exported to the `$description` property:

```javascript
if (variable.description) {
  token.$description = variable.description;
}
```

### Code Syntax Extraction

Platform-specific code syntax is read from variable metadata:

```javascript
if (variable.codeSyntax) {
  token.$codeSyntax = {};
  
  if (variable.codeSyntax.WEB) {
    token.$codeSyntax.WEB = variable.codeSyntax.WEB;
  }
  if (variable.codeSyntax.ANDROID) {
    token.$codeSyntax.ANDROID = variable.codeSyntax.ANDROID;
  }
  if (variable.codeSyntax.iOS) {
    token.$codeSyntax.iOS = variable.codeSyntax.iOS;
  }
}

// Example output:
"$codeSyntax": {
  "WEB": "var(--bs-primary)",
  "ANDROID": "R.color.primary",
  "iOS": "Color.primary"
}
```

### Scope Extraction

Figma scopes are converted to scope strings:

```javascript
if (variable.scopes && variable.scopes.length > 0) {
  token.$scopes = variable.scopes.map(scope => {
    const scopeMap = {
      'ALL_SCOPES': 'ALL_SCOPES',
      'ALL_FILLS': 'ALL_FILLS',
      'FRAME_FILL': 'FRAME_FILL',
      'SHAPE_FILL': 'SHAPE_FILL',
      'TEXT_FILL': 'TEXT_FILL',
      'STROKE_COLOR': 'STROKE_COLOR',
      'EFFECT_COLOR': 'EFFECT_COLOR'
    };
    return scopeMap[scope];
  });
}

// Example output:
"$scopes": ["ALL_FILLS", "STROKE_COLOR"]
```

### Extensions Extraction

Extension metadata is read from variable properties and parsed from JSON strings:

```javascript
if (variable.extensions) {
  token.$extensions = {};
  
  for (const [key, value] of Object.entries(variable.extensions)) {
    try {
      // Extensions are stored as JSON strings
      token.$extensions[key] = JSON.parse(value);
    } catch (e) {
      // If not JSON, store as-is
      token.$extensions[key] = value;
    }
  }
}

// Example output:
"$extensions": {
  "docs": {
    "reference": "https://example.com",
    "section": "Colors"
  },
  "platform": {
    "cssVariableName": "--bs-primary"
  }
}
```

## Export Modes

### Single File Export

All collections are combined into one JSON file:

```javascript
function exportTokens(collections, mode = 'single') {
  if (mode === 'single') {
    const allTokens = {};
    
    for (const collection of collections) {
      const variables = getAllVariables(collection);
      allTokens[collection.name] = processCollection(collection, variables);
    }
    
    return JSON.stringify(allTokens, null, 2);
  }
}

// Output structure:
{
  "Foundation": {
    "modes": { ... }
  },
  "Components": {
    "modes": { ... }
  }
}
```

### Separate Files Export

Each collection is exported to its own file:

```javascript
function exportTokens(collections, mode = 'separate') {
  if (mode === 'separate') {
    const files = [];
    
    for (const collection of collections) {
      const variables = getAllVariables(collection);
      const tokens = {
        [collection.name]: processCollection(collection, variables)
      };
      
      files.push({
        name: `${collection.name}.json`,
        content: JSON.stringify(tokens, null, 2)
      });
    }
    
    return files;
  }
}

// Output: Multiple files
// - Foundation.json
// - Components.json
// - Semantic.json
```

## Complete Conversion Example

### Figma Variable Input

```
Collection: Foundation
Mode: Light

Variable:
  Name: colors/brand/blue/500
  Type: COLOR
  Value: { r: 0.050980, g: 0.431373, b: 0.992157 }
  Description: "Primary brand blue"
  Scopes: [ALL_FILLS, STROKE_COLOR]
  Code Syntax:
    WEB: "var(--bs-blue-500)"
    ANDROID: "R.color.blue_500"
  Extensions:
    docs: '{"reference":"https://example.com"}'
```

### Token Output

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
                "$description": "Primary brand blue",
                "$codeSyntax": {
                  "WEB": "var(--bs-blue-500)",
                  "ANDROID": "R.color.blue_500"
                },
                "$scopes": [
                  "ALL_FILLS",
                  "STROKE_COLOR"
                ],
                "$extensions": {
                  "docs": {
                    "reference": "https://example.com"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Usage Examples

### Export All Collections

```javascript
// Get all collections
const collections = figma.variables.getLocalVariableCollections();

// Export to single file
const json = exportTokens(collections, 'single');

// Save or send
figma.ui.postMessage({
  type: 'export-complete',
  content: json
});
```

### Export Specific Collection

```javascript
// Get one collection
const collection = figma.variables.getVariableCollectionById(collectionId);

// Export
const json = exportTokens([collection], 'single');
```

### Export with UI

```javascript
// In plugin code
figma.ui.onmessage = (msg) => {
  if (msg.type === 'export') {
    const collections = figma.variables.getLocalVariableCollections();
    const json = exportTokens(collections, 'single');
    
    figma.ui.postMessage({
      type: 'export-complete',
      content: json
    });
  }
};

// In UI
parent.postMessage({
  pluginMessage: { type: 'export' }
}, '*');
```

### Export to HTTP Server

```javascript
// Get all collections
const collections = figma.variables.getLocalVariableCollections();

// Process for export
const allTokens = {};
for (const collection of collections) {
  const variables = getAllVariables(collection);
  allTokens[collection.name] = processCollection(collection, variables);
}

// Send to server
fetch('http://localhost:8947/send-theme', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ theme: allTokens })
});
```

### Export via MCP

```javascript
// MCP command handler
case 'export_theme':
  const collections = figma.variables.getLocalVariableCollections();
  const allTokens = {};
  
  for (const collection of collections) {
    const variables = getAllVariables(collection);
    allTokens[collection.name] = processCollectionForExport(collection, variables);
  }
  
  return {
    success: true,
    theme: allTokens
  };
```

## Output Format Validation

### Required Properties

All exported tokens have:

- `$value` - Never null or undefined
- `$type` - Always valid type string

### Optional Properties

Included only if present in Figma:

- `$description` - If variable has description
- `$codeSyntax` - If variable has code syntax metadata
- `$scopes` - If variable has non-default scopes
- `$extensions` - If variable has extension metadata

### JSON Formatting

Exported JSON is formatted with 2-space indentation:

```javascript
JSON.stringify(tokens, null, 2)
```

This produces human-readable output suitable for version control.

## Performance Considerations

### Large Collections

For collections with thousands of variables:

1. Variables are retrieved once per collection
2. Mode iteration is optimized
3. Path building uses efficient string operations
4. Nested structures are built incrementally

### Memory Usage

The export process maintains:

1. Variable array per collection
2. Nested token structure in memory
3. Final JSON string

Peak memory usage occurs during JSON stringification.

### Network Export

When sending to HTTP server or MCP client:

1. JSON is serialized once
2. Transmission is asynchronous
3. Large payloads may require chunking

## Best Practices

### Export Frequency

1. Export after significant changes
2. Use version control for exported JSON
3. Compare diffs to verify changes

### File Organization

1. Use single file for small token sets
2. Use separate files for large multi-collection systems
3. Name files descriptively

### Metadata Maintenance

1. Keep descriptions current
2. Update code syntax for all platforms
3. Review scopes periodically
4. Clean up unused extensions

### Version Control

1. Commit exported JSON files
2. Review diffs before committing
3. Use meaningful commit messages
4. Tag releases

## Troubleshooting

### Missing Variables

If variables don't appear in export:

- Verify variable belongs to collection
- Check variable type is supported
- Ensure collection is selected for export

### Incorrect Values

If exported values are wrong:

- Check mode is correct
- Verify alias references resolve
- Confirm value format is valid

### Missing Metadata

If descriptions or scopes are missing:

- Verify metadata exists in Figma variable
- Check export code includes metadata extraction
- Ensure metadata format is correct

### Large File Sizes

If exported JSON is too large:

- Use separate file export mode
- Consider splitting collections
- Remove unnecessary extensions
- Compress JSON for transmission

### Formatting Issues

If JSON structure is incorrect:

- Validate JSON syntax
- Check nested structure depth
- Verify collection/mode names
- Ensure token names are valid
