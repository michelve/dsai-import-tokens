# Hex Mapper: Current Selection Scope Enhancement

## Overview

Added "Current Selection" scope option to the Hex to Variables mapper, allowing users to scan and map only selected nodes instead of entire pages or the whole document.

## Feature Details

### Scope Options

The hex mapper now supports three scope options:

1. **Current Page** - Scans only the active page
2. **Current Selection** - ⭐ NEW - Scans only selected nodes (frames, groups, layers)
3. **All Pages** - Scans the entire document

### Use Cases

- **Targeted Updates**: Map colors within specific components or sections
- **Group/Frame Focus**: Work on isolated design system components
- **Performance**: Faster scanning for large documents by limiting scope
- **Precision**: Update only what you intend to change

## Implementation

### UI Changes (`src/ui.html`)

Added new option to the scope selector:

```html
<select id="scanScope" class="tool-select">
  <option value="current">Current Page</option>
  <option value="selection">Current Selection</option>
  <option value="all">All Pages</option>
</select>
```

Updated status messaging to display "selection" when scanning selected nodes.

### Backend Changes (`src/hexMapping.ts`)

#### Updated Function Signature

```typescript
export async function scanForHexValues(
  scope: 'current' | 'all' | 'selection'
): Promise<{
  mappings: HexMapping[];
  modes: string[];
}>
```

#### Selection Handling Logic

When `scope === 'selection'`:

1. Gets current page selection via `figma.currentPage.selection`
2. Validates that nodes are selected (throws error if empty)
3. Processes each selected node and all its children recursively
4. Error message: "No nodes selected. Please select frames, groups, or layers to scan."

#### New Helper Function

Added `scanNodeAndChildren()` to recursively process selected nodes:

```typescript
async function scanNodeAndChildren(
  node: SceneNode,
  nodeColorMap: Map<string, NodeColorInfo[]>
): Promise<void>
```

This function:
- Processes the selected node itself
- Recursively processes all children if the node has them
- Uses `findAll()` to traverse descendants
- Scans for fills, strokes, and text colors in all nodes

## User Workflow

### Example: Update Colors in a Specific Component

1. **Select** the frame/group containing your component
2. **Choose** "Current Selection" from the scope dropdown
3. **Click** "Scan & Map"
4. **Review** the found hex values in the modal
5. **Choose** variable options if multiple exist
6. **Apply** the mappings

### Multiple Selection Support

Users can select multiple nodes simultaneously:
- Multiple frames
- Multiple groups
- Mix of different node types

All selected nodes and their children will be scanned.

## Error Handling

### No Selection Error

If user chooses "Current Selection" but has nothing selected:

```
Error: No nodes selected. Please select frames, groups, or layers to scan.
```

The UI displays this in the status area and re-enables the scan button.

## Technical Details

### Recursive Scanning

The `scanNodeAndChildren` function handles nested structures:

1. Process the parent node
2. For each child:
   - Find all descendants with colors
   - Process the child node
   - Process all descendants

This ensures complete coverage of:
- Nested frames
- Groups within groups
- Component instances
- All child layers

### Performance Considerations

- Selection scope is typically faster than page/document scanning
- Processes only the subset of nodes in the selection tree
- Same color matching and variable binding logic as other scopes

## Code Quality

### Codacy Analysis Results

✅ **No new issues introduced**

Existing complexity warnings (already accepted):
- `applyHexMappings`: complexity 13 (limit 8)
- `applyTextMapping`: complexity 10 (limit 8)

These are from the initial hex mapper implementation and were previously accepted.

## Future Enhancements

Potential improvements for selection scope:

- [ ] Selection count indicator in UI ("X nodes selected")
- [ ] Disable selection option when nothing is selected
- [ ] Visual feedback showing which nodes will be scanned
- [ ] Option to include/exclude specific node types in selection
- [ ] Selection preview before scanning

## Related Documentation

- [Hex to Variables Feature](./HEX_TO_VARIABLES_FEATURE.md) - Main feature documentation
- [Hex to Variables Quickstart](./HEX_TO_VARIABLES_QUICKSTART.md) - User guide
- [Variable Selector Enhancement](./VARIABLE_SELECTOR_ENHANCEMENT.md) - Multiple variable options

## Version History

- **v1.2.0** (2025-11-14): Added "Current Selection" scope option
- **v1.1.0** (2025-11-13): Added variable selector for multiple options
- **v1.0.0** (2025-11-13): Initial hex mapper release

