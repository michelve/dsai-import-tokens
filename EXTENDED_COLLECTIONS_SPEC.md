# Extended Variable Collections Support

## Feature Overview

Figma's **Extended Variable Collections** (Enterprise plan only) enables multi-brand design systems by allowing collections to inherit from a parent collection while overriding specific values.

**Figma Documentation**: https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection

---

## Current Status: ❌ Not Supported

The plugin currently handles regular variable collections but does not detect, export, or import extended collections.

---

## Implementation Plan

### Phase 1: Export Support

#### Task 1.1: Detect Extended Collections
- [ ] Check `collection.isExtension` property when iterating collections
- [ ] Retrieve `parentVariableCollectionId` for extended collections
- [ ] Access `variableOverrides` to get only overridden values

#### Task 1.2: Update Export Format
- [ ] Add new properties to exported JSON:
  ```json
  {
    "CollectionName": {
      "$extension": {
        "isExtended": true,
        "parentCollectionKey": "VariableCollectionId:123:456",
        "parentCollectionName": "Parent Collection Name"
      },
      "modes": {
        "ModeName": {
          "$parentModeId": "123:0",
          "colors": {
            "primary": {
              "$value": "#FF0000",
              "$type": "color",
              "$override": true
            }
          }
        }
      }
    }
  }
  ```

#### Task 1.3: Export Only Overrides
- [ ] For extended collections, export only `variableOverrides` values
- [ ] Mark overridden values with `$override: true` flag
- [ ] Include parent reference information for import resolution

### Phase 2: Import Support

#### Task 2.1: Detect Extended Collection Format
- [ ] Check for `$extension` property in imported JSON
- [ ] Validate parent collection exists (local or library)

#### Task 2.2: Create Extended Collections
- [ ] Use `collection.extend(name)` for local parent collections
- [ ] Use `figma.variables.extendLibraryCollectionByKeyAsync(key, name)` for library parents
- [ ] Handle Enterprise plan requirement gracefully with user notification

#### Task 2.3: Apply Overrides
- [ ] Set only the overridden variable values
- [ ] Use `setValueForMode()` on the extended collection's variables

### Phase 3: UI Updates

#### Task 3.1: Export UI
- [ ] Add indicator for extended collections in collection list
- [ ] Option to export extended collections separately or with parent
- [ ] Show parent collection name in UI

#### Task 3.2: Import UI
- [ ] Detect and display extended collection info during import preview
- [ ] Warn if parent collection is not found
- [ ] Show which values will be overridden

---

## API Reference

### Detection
```typescript
// Check if collection is extended
const isExtended = collection.isExtension; // boolean

// Get parent collection ID (only for extended collections)
const parentId = (collection as ExtendedVariableCollection).parentVariableCollectionId;

// Get overrides
const overrides = (collection as ExtendedVariableCollection).variableOverrides;
// Returns: { [variableId: string]: { [extendedModeId: string]: VariableValue } }
```

### Creation
```typescript
// Extend a local collection
const extendedCollection = parentCollection.extend("Brand A");

// Extend a library collection
const extendedCollection = await figma.variables.extendLibraryCollectionByKeyAsync(
  collectionKey,
  "Brand A"
);
```

### Mode Mapping
Extended collection modes include `parentModeId`:
```typescript
interface ExtendedMode {
  modeId: string;
  name: string;
  parentModeId: string; // ID of the parent mode
}
```

---

## Type Definitions to Add

```typescript
// src/types.ts additions

export interface ExtendedCollectionMetadata {
  isExtended: true;
  parentCollectionKey: string;
  parentCollectionName: string;
}

export interface ExtendedTokenCollection extends TokenCollection {
  $extension: ExtendedCollectionMetadata;
}

export interface ExtendedTokenValue extends TokenValue {
  $override?: boolean;
}

export interface ExtendedModeData {
  $parentModeId: string;
  [key: string]: TokenValue | TokenGroup | string;
}
```

---

## Edge Cases & Considerations

1. **Enterprise Plan Requirement**
   - Feature is Enterprise-only
   - Plugin should detect and notify users gracefully
   - Fallback: treat as regular collection if extension fails

2. **Parent Collection Not Found**
   - Import should warn user
   - Option to import as regular collection instead
   - Store parent key for future resolution

3. **Library vs Local Parents**
   - Different APIs for each
   - Need to resolve collection keys properly
   - Handle unpublished library scenarios

4. **Nested Extensions**
   - Clarify if Figma supports extending extended collections
   - Handle multi-level inheritance if applicable

5. **Mode Mapping**
   - Extended modes must map to parent modes
   - Handle deleted parent modes gracefully

---

## Testing Checklist

- [ ] Export regular collection (no regression)
- [ ] Export extended collection with overrides
- [ ] Export extended collection without overrides
- [ ] Import extended collection with existing parent
- [ ] Import extended collection with missing parent
- [ ] Import extended collection from library parent
- [ ] Round-trip: export then import extended collection
- [ ] Non-Enterprise plan error handling
- [ ] UI displays extended collection indicators correctly

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add extended collection types |
| `src/export.ts` | Detect and export extended collections |
| `src/import.ts` | Create extended collections on import |
| `src/ui.html` | Add UI indicators and options |
| `src/main.ts` | Handle extended collection messages |

---

## Priority: Medium

This feature is useful for Enterprise users managing multi-brand design systems. Implementation can be done incrementally, starting with export support.

## Estimated Effort: 2-3 days

- Phase 1 (Export): 1 day
- Phase 2 (Import): 1 day  
- Phase 3 (UI): 0.5 day
- Testing: 0.5 day
