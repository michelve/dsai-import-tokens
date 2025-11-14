# Hex to Variables - Quick Start Guide

## What is This?

A new feature in your DSAI Import Tokens plugin that automatically finds hardcoded hex color values in your Figma designs and maps them to existing variables.

## How to Use

### Step 1: Open Plugin
1. In Figma, open your design
2. Run the DSAI Import Tokens plugin
3. Navigate to the **Tools** tab

### Step 2: Scan for Hex Values
1. Choose your scan scope:
   - **Current Page Only** - Fast, scans just the active page
   - **All Pages** - Comprehensive, scans entire document
2. Click **"Scan for Hex Values"**

### Step 3: Review Matches
A modal will appear showing:
- Hex color → Variable name mappings
- Color swatches for visual confirmation
- Number of layers each mapping will affect

Example:
```
☑ #FF0000 → colors/brand/red (12 layers)
☑ #0066CC → colors/primary/blue (8 layers)
☐ #F5F5F5 → colors/neutral/gray-50 (24 layers)
```

### Step 4: Select Mode
Choose which mode to use for matching:
- Light (Default)
- Dark
- Or any custom modes you have

### Step 5: Apply Mappings
1. Check/uncheck the mappings you want
2. Click **"Apply Selected Mappings"**
3. Done! Variables are now bound to your layers

## What Gets Scanned?

✅ **Fill colors** - Shapes, frames, rectangles, etc.
✅ **Stroke colors** - Border colors on any element
✅ **Text colors** - Including multi-color text ranges

⏭️ **Already bound colors are skipped** - No duplicate work!

## Use Cases

### 1. Clean Up Imported Designs
**Scenario**: You received a design file with hardcoded colors
```
Before: 45 layers with #FF0000
After:  45 layers using colors/brand/red variable
```

### 2. Adopt Design System
**Scenario**: Existing design needs to use new design tokens
```
1. Import design system variables
2. Scan all pages
3. Apply mappings
4. Design now uses design system!
```

### 3. Standardize Colors
**Scenario**: Multiple designers used slightly different reds
```
1. Scan finds all red variations
2. Review which ones match your variable
3. Apply to standardize
```

## Tips & Best Practices

### 🚀 Performance
- Start with "Current Page" for quick tests
- Use "All Pages" for final cleanup
- Large documents may take longer to scan

### ✅ Before Applying
- Review the preview carefully
- Check color swatches match expectations
- Deselect any non-standard colors
- Choose the correct mode (Light/Dark)

### 🔍 What to Look For
- High layer counts indicate widely-used colors
- Unknown hex values may need new variables created
- Review text color changes carefully

### ⚡ Quick Workflow
```
1. Scan Current Page
2. Apply obvious matches
3. Move to next page
4. Repeat until done
```

## Understanding the Results

### Success Message
```
✅ Successfully applied 23 mapping(s)
```
All selected mappings were applied successfully.

### Partial Success
```
✅ Applied 20 mapping(s) with 3 error(s)
```
Most mappings worked, but some failed. Check console for details.

### No Matches Found
```
⚠️ No hardcoded hex values found matching existing variables
```
Either:
- All colors already use variables (great!)
- No matching variables exist (may need to create them)
- No colors in the scanned area

## Troubleshooting

### "No matches found" but I see hardcoded colors
- **Check**: Do you have color variables in your document?
- **Check**: Are the hex values exact matches?
- **Solution**: Create variables for those colors first

### Some mappings failed
- **Reason**: Nodes may have been deleted during scan
- **Reason**: Text fonts couldn't be loaded
- **Solution**: Re-run scan and try again

### Scan is taking too long
- **Solution**: Try "Current Page" instead of "All Pages"
- **Solution**: Scan specific pages one at a time

### Wrong colors are being mapped
- **Check**: Are you using the correct mode (Light/Dark)?
- **Solution**: Deselect incorrect mappings before applying

## Next Steps

After applying mappings:
1. Review your design visually
2. Check that colors look correct
3. Test in different modes (if applicable)
4. Document any new variables needed

## Future Enhancements

Coming soon:
- Fuzzy matching for similar colors
- Batch progress indicators
- Undo/history tracking
- Report generation for unmapped colors

## Need Help?

- Check the full documentation: `HEX_TO_VARIABLES_FEATURE.md`
- Review your concept document: `.idea/hex-to-variables.md`
- Contact DSAI team for support

---

**Remember**: This feature only works with **color variables**. Other variable types (numbers, strings, etc.) are not scanned.

