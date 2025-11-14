# Scope Mapper Feature Documentation

## Overview

The **Scope Mapper** is a powerful tool that automatically maps hardcoded design property values (radius, spacing, padding, strokes, typography) to existing Figma variables. This tool complements the Hex Mapper by handling non-color properties.

## Supported Properties

### Layout Properties

#### Border Radius
- **Corner Radius** - Uniform corner radius
- **Top Left Radius** - Individual corner radius
- **Top Right Radius** - Individual corner radius
- **Bottom Left Radius** - Individual corner radius
- **Bottom Right Radius** - Individual corner radius

#### Auto Layout
- **Gap/Spacing (itemSpacing)** - Space between auto layout items
- **Padding Top** - Top padding in auto layout frames
- **Padding Right** - Right padding in auto layout frames
- **Padding Bottom** - Bottom padding in auto layout frames
- **Padding Left** - Left padding in auto layout frames

#### Strokes
- **Stroke Weight** - Border/stroke width

### Typography Properties

#### Sizing
- **Font Size** - Text size in pixels
- **Line Height** - Line spacing
- **Letter Spacing** - Character spacing
- **Paragraph Spacing** - Space between paragraphs

#### Font Attributes
- **Font Family** - Font family name
- **Font Weight** - Font weight (100-900)

## How It Works

### Scanning Process

1. **Variable Collection**
   - Retrieves all FLOAT and STRING variables from the document
   - Maps numeric values (for sizing, spacing, radius properties)
   - Maps string values (for font families)
   - Identifies both primitive variables and aliases

2. **Node Traversal**
   - Based on selected scope (Current Page, Current Selection, All Pages)
   - Finds all nodes with relevant properties
   - Processes frames, shapes, text nodes, and components

3. **Property Extraction**
   - Checks each property type on each node
   - Skips properties already bound to variables
   - Records property value and node ID

4. **Matching Logic**
   - Matches extracted property values against variable values
   - Handles exact numeric matching
   - Handles exact string matching for font properties
   - Creates mapping entries for matches

### Application Process

1. **User Selection**
   - Modal displays all found mappings
   - User can select/deselect specific mappings
   - Multiple variable options shown if available
   - User can choose between primitive variables and aliases

2. **Variable Binding**
   - Uses `node.setBoundVariable(property, variable)` API
   - Binds selected variables to corresponding node properties
   - Verifies property value matches before binding
   - Reports success and error counts

## User Interface

### Scope Selector

```
[ Current Page ▼ ] [Scan & Map]
```

Three scope options:
- **Current Page** - Scans only the active page
- **Current Selection** - Scans only selected nodes
- **All Pages** - Scans entire document

### Mapping Modal

```
Property to Variable Mappings

Found 12 properties matching existing variables (5 types)

☑ Corner Radius • 8px → spacing/radius-sm
  └ 24 layer(s) will be updated

☑ Gap/Spacing • 16px → spacing/gap-md
  [dropdown if multiple variables]
  └ 18 layer(s) will be updated

☑ Font Size • 14px → typography/body/size
  └ 42 layer(s) will be updated

[Cancel] [Apply Selected Mappings]
```

### Variable Selector

When multiple variables match the same value:

```
Gap/Spacing • 16px → spacing/gap-md

[Select Variable ▼]
├ spacing/gap-md (primitive)      ← Selected by default
└ semantic/spacing/default → spacing/gap-md
```

## Implementation Details

### File Structure

#### `src/scopeMapping.ts`

Main logic file containing:

```typescript
// Core types
export interface PropertyMapping {
  propertyType: PropertyType;
  currentValue: string | number;
  variableId: string;
  variableName: string;
  variableOptions: VariableOption[];
  nodeCount: number;
  nodeIds: string[];
}

export type PropertyType =
  | 'cornerRadius'
  | 'topLeftRadius'
  | 'topRightRadius'
  | 'bottomLeftRadius'
  | 'bottomRightRadius'
  | 'itemSpacing'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'strokeWeight'
  | 'fontSize'
  | 'lineHeight'
  | 'letterSpacing'
  | 'paragraphSpacing'
  | 'fontFamily'
  | 'fontWeight';

// Core functions
export async function scanForProperties(
  scope: 'current' | 'all' | 'selection'
): Promise<{ mappings: PropertyMapping[]; propertyTypes: PropertyType[]; }>

export async function applyPropertyMappings(
  mappings: PropertyMapping[]
): Promise<{ appliedCount: number; errorCount: number; }>
```

#### Helper Functions

```typescript
// Scanning helpers
scanPageForProperties(page, nodePropertyMap)
scanNodeAndChildren(node, nodePropertyMap)
processNodeProperties(node, nodePropertyMap)
processTextProperties(node, nodePropertyMap)
addPropertyInfo(nodePropertyMap, propertyType, value, nodeId)

// Application helper
applyPropertyBinding(node, propertyType, variable, currentValue)
```

### UI Components

#### HTML (`src/ui.html`)

- Sub-tab button for "Scope Mapper"
- Tool content section with scope selector
- Property mapping modal with variable selectors
- Status display area

#### JavaScript Functions

```javascript
// Modal management
openPropertyMappingModal(mappings, propertyTypes)
closePropertyMappingModal()
applyPropertyMappings()

// Formatting
formatPropertyType(propertyType)  // "cornerRadius" → "Corner Radius"
formatPropertyValue(value, type)  // 16 → "16px"
```

### Message Flow

```
UI → Plugin:
- scan-property-values { scope }
- apply-property-mappings { mappings }

Plugin → UI:
- property-scan-complete { mappings, propertyTypes }
- property-scan-error { error }
- property-mappings-applied { appliedCount, errorCount }
- property-mappings-error { error }
```

## API Usage

### Figma Plugin API Methods

#### Variable Binding

```typescript
// Bind variable to property
node.setBoundVariable(
  'cornerRadius',  // property name
  variable         // Variable object
);
```

#### Supported Property Names

**Layout Properties:**
- `cornerRadius`, `topLeftRadius`, `topRightRadius`, `bottomLeftRadius`, `bottomRightRadius`
- `itemSpacing`
- `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`
- `strokeWeight`

**Text Properties:**
- `fontSize`
- `lineHeight`
- `letterSpacing`
- `paragraphSpacing`
- `fontFamily`
- `fontWeight`

#### Checking Bound Variables

```typescript
// Check if property is already bound
if (!node.boundVariables?.cornerRadius) {
  // Property is not bound to a variable
}
```

### Variable Types

#### FLOAT Variables

Used for numeric properties:
- Radius values
- Spacing/padding values
- Stroke weights
- Font sizes, line heights, spacing

#### STRING Variables

Used for font properties:
- Font family names
- Font weight styles

## User Workflow Examples

### Example 1: Map Corner Radius

**Scenario:** Convert hardcoded 8px corner radius to variable

1. Select frames with 8px corner radius
2. Choose "Current Selection" scope
3. Click "Scan & Map"
4. Modal shows: "Corner Radius • 8px → spacing/radius-sm"
5. Verify selection and click "Apply Selected Mappings"
6. ✓ Applied 24 mappings

### Example 2: Map Typography

**Scenario:** Bind text sizes to typography variables

1. Navigate to page with text elements
2. Choose "Current Page" scope
3. Click "Scan & Map"
4. Modal shows:
   - Font Size • 14px → typography/body/size
   - Font Size • 16px → typography/heading/small
   - Line Height • 20px → typography/body/lineHeight
5. Select desired mappings
6. Apply and verify

### Example 3: Map Auto Layout Spacing

**Scenario:** Convert hardcoded gaps and padding to spacing tokens

1. Select component with auto layout
2. Choose "Current Selection" scope
3. Click "Scan & Map"
4. Modal shows:
   - Gap/Spacing • 16px → spacing/gap-md
   - Padding Top • 12px → spacing/padding-sm
   - Padding Left • 12px → spacing/padding-sm
5. Choose between primitive or semantic variables if needed
6. Apply mappings

## Error Handling

### Selection Error

```
Error: No nodes selected. Please select frames, groups, or layers to scan.
```

**Solution:** Select at least one node before using "Current Selection" scope.

### No Variables Found

```
Error: No variables found in this document
```

**Solution:** Create number or string variables before using the scope mapper.

### No Matches Found

```
No hardcoded properties found matching existing variables
```

**Reasons:**
- All properties already bound to variables
- No property values match variable values
- Selected scope contains no applicable nodes

**Solutions:**
- Adjust scope to include more nodes
- Create variables with matching values
- Check that nodes have the expected property values

### Property Binding Errors

Individual binding errors are caught and reported:
- Node not found
- Property value changed before application
- Invalid variable type for property

## Performance Considerations

### Scanning Speed

- **Current Page**: Fast (100-1000 nodes typically)
- **Current Selection**: Very fast (focused subset)
- **All Pages**: Slower for large documents (1000+ nodes)

### Optimization Tips

1. Use "Current Selection" for targeted updates
2. Process one component/section at a time
3. For large documents, work page-by-page instead of "All Pages"

## Limitations

### Current Implementation

1. **Exact Matching Only**
   - Only matches exact property values to variable values
   - No fuzzy matching or rounding
   - Future enhancement: configurable tolerance

2. **Single Mode**
   - Always uses first mode for variable matching
   - Future enhancement: mode selector like Hex Mapper

3. **Font Weight Mapping**
   - Maps common font weight names to numbers (Regular → 400)
   - May not handle all font style variations
   - Future enhancement: expanded font style mapping

4. **Text Property Limitations**
   - Only processes non-mixed text properties
   - Mixed font properties are skipped
   - Future enhancement: range-based text property mapping

### Figma API Constraints

1. **Read-only Properties**
   - Some properties cannot be bound to variables (e.g., rotation, opacity in some contexts)
   - API limitations determine what can be bound

2. **Variable Scope Compatibility**
   - Variable scopes must match property types
   - FLOAT variables for numeric properties
   - STRING variables for text properties

## Future Enhancements

### Planned Features

- [ ] **Fuzzy Matching** - Match similar values with configurable tolerance
- [ ] **Mode Selection** - Choose which variable mode to use for matching
- [ ] **Batch Operations** - Apply multiple property types at once
- [ ] **Property Filters** - Show/hide specific property types in results
- [ ] **Preview Mode** - Highlight nodes that will be affected before applying
- [ ] **Undo Support** - Ability to revert applied mappings
- [ ] **Property Groups** - Group related properties (e.g., all padding as one item)
- [ ] **Mixed Property Support** - Handle text with mixed styling
- [ ] **Property Statistics** - Show distribution of property values
- [ ] **Export Mappings** - Save mapping configurations for reuse

### Possible Extensions

- **Opacity Mapping** - Map opacity values to variables
- **Effect Properties** - Map shadow blur, spread to variables
- **Dimension Properties** - Map width/height to size variables
- **Boolean Properties** - Map visibility, locked state
- **Blend Mode Mapping** - Map blend modes to variables (if API supports)

## Troubleshooting

### Modal Doesn't Appear

**Check:**
- Any matches found? (Status shows "No matches found")
- Console errors? (Open DevTools)
- Variables exist in document?

### Mappings Don't Apply

**Check:**
- Properties already bound? (Scan skips bound properties)
- Node deleted/moved since scan?
- Correct variable type for property?
- Variable still exists?

### Wrong Variable Selected

**Fix:**
- Use variable selector dropdown in modal
- Choose preferred variable (primitive vs alias)
- Re-scan if needed after changes

### Performance Issues

**Solutions:**
- Use smaller scopes (Current Selection vs All Pages)
- Process in batches
- Close other Figma files
- Restart plugin if needed

## Related Documentation

- [Hex to Variables Feature](./HEX_TO_VARIABLES_FEATURE.md) - Color mapping tool
- [Scope Type Compatibility](./SCOPE_TYPE_COMPATIBILITY.md) - Variable scope reference
- [Variable Selector Enhancement](./VARIABLE_SELECTOR_ENHANCEMENT.md) - Multiple variable handling

## Version History

- **v1.0.0** (2025-11-14): Initial Scope Mapper release
  - Support for 17 property types
  - Current Page, Current Selection, All Pages scopes
  - Variable selector for multiple options
  - Primitive and alias variable support

