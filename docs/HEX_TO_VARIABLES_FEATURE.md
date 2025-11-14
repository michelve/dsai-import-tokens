# Hex to Variables Mapping Feature

## Overview

This feature enables automatic mapping and binding of hardcoded hex color values to existing Figma variables. It scans your design for hex values that match your variable library and applies variable bindings to replace hardcoded colors.

## Location

**Tools Tab** > **Map Hex to Variables** section

## User Workflow

1. **Open the plugin** and navigate to the Tools tab
2. **Select scan scope**: Choose between "Current Page Only" or "All Pages"
3. **Click "Scan for Hex Values"** to analyze your design
4. **Review matches** in the modal that appears, showing:
   - Hex value → Variable name mappings
   - Number of layers affected by each mapping
   - Color swatches for visual confirmation
5. **Select mode** from the dropdown (default: Light)
6. **Check/uncheck** mappings you want to apply
7. **Click "Apply Selected Mappings"** to bind variables

## Features

### Scan Scope
- **Current Page**: Fast scanning of only the active page
- **All Pages**: Comprehensive scan of the entire document

### Color Detection
The feature scans and maps colors from:
- ✅ Fill colors (shapes, frames, etc.)
- ✅ Stroke colors
- ✅ Text colors (including text ranges with different colors)

### Smart Filtering
- Only finds colors that are **NOT** already bound to variables
- Only suggests mappings where matching variables exist
- Supports multiple modes (Light, Dark, etc.)

### Preview Modal
- Visual color swatches for easy identification
- Checkbox selection for granular control
- Shows impact (number of layers per mapping)
- Mode selector for multi-mode collections

## Technical Implementation

### Files Created/Modified

#### New Files
- **`src/hexMapping.ts`**: Core scanning and mapping logic
  - `scanForHexValues()`: Scans pages for hardcoded colors
  - `applyHexMappings()`: Applies variable bindings to nodes
  - Helper functions for fills, strokes, and text processing

#### Modified Files
- **`src/main.ts`**: Added message handlers for:
  - `scan-hex-values`: Triggers the scan operation
  - `apply-hex-mappings`: Applies selected mappings
- **`src/ui.html`**: Added:
  - New Tools tab section with scan controls
  - Modal UI for displaying and selecting mappings
  - CSS styles for modal and mapping items
  - JavaScript handlers for scan and apply operations

### Key Functions

#### Scanning
```typescript
scanForHexValues(scope: 'current' | 'all'): Promise<{
  mappings: HexMapping[];
  modes: string[];
}>
```
- Retrieves all color variables from the document
- Scans specified pages for hardcoded colors
- Matches hex values to variables
- Returns mappings sorted by usage count

#### Applying
```typescript
applyHexMappings(mappings: HexMapping[], mode: string): Promise<{
  appliedCount: number;
  errorCount: number;
}>
```
- Processes each mapping
- Binds variables to fills, strokes, and text colors
- Returns success/error counts

### Data Structure

```typescript
interface HexMapping {
  hex: string;           // Hex color value (e.g., "#FF0000")
  variableId: string;    // Figma variable ID
  variableName: string;  // Variable path (e.g., "colors/brand/red")
  nodeCount: number;     // Number of affected layers
  nodeIds: string[];     // Array of layer IDs
}
```

## TODO Items & Future Enhancements

### Current TODOs in Code
1. **Refine logic for mapping colors for strokes** (`hexMapping.ts:137`)
   - Consider stroke-specific variable scopes
   - Handle stroke weight and style combinations

2. **Refine logic for mapping colors for text** (`hexMapping.ts:143`)
   - Handle mixed-color text ranges
   - Consider text-specific variable scopes

3. **Enhancement: Fuzzy matching for hex values** (`hexMapping.ts:422`)
   - Match similar but not exact colors
   - Use color distance algorithms (Delta E)
   - Suggest closest variable for non-matching hex values
   - Implementation example:
     ```typescript
     function findClosestVariable(targetHex: string, variables: Variable[], tolerance: number = 10): Variable | null {
       // Calculate color distance using Delta E or RGB distance
       // Return closest match within tolerance
     }
     ```

### Future Feature Ideas
1. **Batch operations progress indicator**
   - Show progress bar for large scans
   - Allow cancellation of long-running operations

2. **Undo/History tracking**
   - Store original state before applying mappings
   - Provide "Undo Mappings" button

3. **Mapping presets**
   - Save frequently used mapping configurations
   - Quick apply for common scenarios

4. **Report generation**
   - Export list of unmapped hex values
   - Suggest new variables to create

5. **Selective node type scanning**
   - Allow users to choose which types to scan (fills only, text only, etc.)
   - Improve performance for targeted operations

6. **Variable collection filtering**
   - Only match against specific collections
   - Useful for large projects with multiple design systems

## Usage Examples

### Example 1: Clean up a design after import
A designer receives a design file from another team that has hardcoded colors:
1. Open plugin → Tools tab
2. Scan "Current Page"
3. Review 15 hex values → 8 match existing variables
4. Select all and apply
5. Result: 45 layers now use variables instead of hardcoded values

### Example 2: Retroactive variable adoption
An existing design needs to adopt the new design system:
1. Import variables from design system tokens
2. Scan "All Pages"
3. Review matches across entire document
4. Deselect any non-standard colors
5. Apply to standardize colors across all pages

## Benefits

- **Reduces manual work**: No need to manually reassign colors
- **Maintains consistency**: Ensures colors align with design system
- **Retroactive updates**: Apply variables to existing designs
- **Zero code impact**: Uses native Figma variable bindings
- **Auditable**: Preview shows exact changes before applying

## Error Handling

The feature includes comprehensive error handling for:
- Missing variables
- Deleted nodes
- Text font loading failures
- Permission issues

Errors are reported with:
- User-friendly notifications
- Detailed console logs for debugging
- Success/error counts in results

## Testing Checklist

- [x] Build succeeds without errors
- [x] Codacy analysis passes (complexity warnings are acceptable)
- [x] UI elements render correctly in Tools tab
- [x] Modal opens with scan results
- [x] Mode selector populates correctly
- [ ] Scan finds hardcoded colors (requires Figma testing)
- [ ] Apply successfully binds variables (requires Figma testing)
- [ ] Error handling works for edge cases (requires Figma testing)

## Notes

- Default mode is always "Light" as specified in requirements
- The feature skips colors already bound to variables (nothing to do)
- Scanning can take time on large documents with many pages
- Text color mapping requires font loading which may slow down the scan

## Architecture Alignment

This feature follows the existing plugin structure:
- Uses established patterns from export/import features
- Leverages existing utilities (`colorToHex`, message handlers)
- Maintains separation of concerns (UI, logic, types)
- Follows TypeScript best practices
- Integrates with existing settings and state management

