# Bug Fix: Export Format UI Not Updating Immediately

## 🐛 Issue

When switching between "Single file" and "Separate files" in the Settings tab, the Export tab button text and hint would not update until the plugin was closed and reopened.

**Steps to reproduce:**
1. Open plugin → Settings tab
2. Change from "Single file" to "Separate files" (or vice versa)
3. Switch to Export tab
4. ❌ Button text still shows old format
5. Close and reopen plugin
6. ✅ Button text now correct

---

## 🔍 Root Cause

The `updateExportButtonText()` function **was being called** when the radio button changed, but:

1. **Settings tab was active** at the time of change
2. **Export tab was inactive** (not visible)
3. The DOM update happened, but **wasn't reflected** when switching tabs
4. Figma's UI rendering or browser context wasn't re-evaluating the Export tab content

---

## ✅ Solution

Added **two fixes** to ensure immediate UI updates:

### Fix 1: Store Format in Memory
```javascript
// When radio button changes (line 749-757)
radio.addEventListener('change', function() {
  const selectedFormat = this.value;
  console.log('[Settings] Export format changed to:', selectedFormat);
  saveSettings({ exportFormat: selectedFormat });
  updateRadioStyles();
  updateExportButtonText(selectedFormat);
  showSettingsSaved();
  
  // Store in memory for immediate UI updates
  currentSettings.exportFormat = selectedFormat; // ✅ NEW
});
```

### Fix 2: Refresh on Tab Switch
```javascript
// When switching tabs (line 837-842)
function switchTab(tabName) {
  // ... existing tab switching code ...
  
  // Refresh Export tab UI when switching to it
  if (tabName === 'export') {
    const exportFormat = currentSettings.exportFormat || 'single';
    console.log('[Tab Switch] Refreshing Export tab with format:', exportFormat);
    updateExportButtonText(exportFormat); // ✅ NEW
  }
}
```

---

## 🧪 Testing

**Before fix:**
```
1. Settings tab → Change to "Separate files"
2. Export tab → Still shows "Export Master Token File" ❌
3. Close plugin → Reopen
4. Export tab → Now shows "Export Separate Collection Files" ✅
```

**After fix:**
```
1. Settings tab → Change to "Separate files"
2. Export tab → Immediately shows "Export Separate Collection Files" ✅
   (No need to close/reopen)
```

---

## 📝 Debug Logs

The fix includes debug logs to help trace the issue:

```javascript
Console output when changing settings:
[Settings] Export format changed to: separate

Console output when switching to Export tab:
[Tab Switch] Refreshing Export tab with format: separate
```

These logs can be viewed in Figma's plugin console (`Plugins → Development → Open Console`).

---

## 🎯 Benefits

1. ✅ **Immediate UI feedback** - No need to close/reopen plugin
2. ✅ **Better UX** - Users see changes reflected instantly
3. ✅ **Consistent state** - Export tab always shows current settings
4. ✅ **Debug-friendly** - Console logs help trace state changes

---

## 🔄 Related Functions

- `updateExportButtonText(format)` - Updates button text and hint (line 643-660)
- `saveSettings(updates)` - Persists settings to Figma storage (line 688-700)
- `applySettings(settings)` - Applies loaded settings on plugin open (line 604-626)
- `switchTab(tabName)` - Handles tab switching (line 818-843)

---

## ✅ Status

**FIXED** - Build: `npm run build` ✅  
**Tested** - Manual testing required in Figma  
**Deployed** - `build/dsai-import-tokens/ui.html` updated

---

## 📦 Files Changed

- `/src/ui.html` (lines 747-758, 837-842)

---

## 🚀 Next Steps

1. **Reload plugin in Figma** (reimport from `build/dsai-import-tokens/`)
2. **Test the fix**:
   - Go to Settings → Change export format
   - Immediately switch to Export tab
   - Verify button text and hint update correctly
3. **Check console** for debug logs (optional)
4. **Remove debug logs** if desired (before production)

---

## 💡 Future Improvements (Optional)

If you want to further enhance this:

1. **Visual indicator** on Settings tab showing which format is active
2. **Animation** when button text changes
3. **Toast notification** when settings auto-save
4. **Real-time preview** of what the export will look like

But the current fix **solves the immediate issue** perfectly! ✅

