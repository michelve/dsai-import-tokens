# Line Height System Guide
**Accessibility-Compliant Typography for Figma + Bootstrap**

## 📐 Overview

This line height system solves three key challenges:

1. **Figma Limitation**: No percentage support (only absolute pixel values)
2. **Bootstrap Compatibility**: Maps to Bootstrap's relative ratios
3. **WCAG AA Compliance**: Meets 1.5 minimum for body text
4. **4pt Grid System**: All values align to 4pt scale

---

## 🎯 The Complete Line Height Scale

| Token | Value | Ratio | Bootstrap | WCAG | Use Case |
|-------|-------|-------|-----------|------|----------|
| `xs` | 16px | 1.0 | Custom | ⚠️ Not for body | Badges, tags, compact UI |
| `sm` | 20px | 1.25 | `$line-height-sm` | ⚠️ Below AA | Buttons, form controls |
| `tight` | 20px | 1.2-1.25 | `$headings-line-height` | ✅ For headings | h1-h6, display fonts |
| `base` | 24px | 1.5 | `$line-height-base` | ✅ AA compliant | Body text, paragraphs |
| `relaxed` | 28px | 1.75 | Custom | ✅✅ Enhanced | Long-form content |
| `lg` | 32px | 2.0 | `$line-height-lg` | ✅✅ Excellent | Lead text, callouts |
| `display-sm` | 48px | 1.2 | `$display-line-height` | ✅ For display | Display 4-6 (40px font) |
| `display-md` | 60px | 1.2 | Custom | ✅ For display | Display 2-3 (48-56px font) |
| `display-lg` | 76px | 1.2 | Custom | ✅ For display | Display 1 (64px font) |

---

## 💡 How to Use in Figma

### Body Text (Default)
```
Font Size: 16px
Line Height: lineHeight.base (24px)
Ratio: 1.5 → WCAG AA ✅
```

### Headings (H1-H6)
```
Font Size: 24-40px
Line Height: lineHeight.tight (20px) for small headings
              OR scale up for larger headings
Ratio: ~1.2-1.25 → Visually balanced ✅
```

### Display Fonts (Hero, Landing Pages)
```
Font Size: 40px → Line Height: display-sm (48px)
Font Size: 56px → Line Height: display-md (60px)
Font Size: 64px → Line Height: display-lg (76px)
Ratio: 1.2 → Visual impact ✅
```

### Long-Form Content (Articles, Documentation)
```
Font Size: 16-18px
Line Height: lineHeight.relaxed (28px)
Ratio: 1.75 → Enhanced readability ✅
```

### Compact UI (Buttons, Forms)
```
Font Size: 14-16px
Line Height: lineHeight.sm (20px)
Ratio: 1.25 → Space-efficient ⚠️ (not for body text)
```

---

## 🚨 Important Notes

### WCAG AA Requirements
- **Body text MUST use 1.5 minimum** → Use `base`, `relaxed`, or `lg`
- **Headings can use tighter leading** → `tight` is fine for large text
- **Never use `xs` or `sm` for paragraph text** → Accessibility violation

### Bootstrap Mapping
```scss
// Your Figma tokens map to Bootstrap like this:
$line-height-sm: 1.25;      → lineHeight.sm (20px)
$line-height-base: 1.5;     → lineHeight.base (24px)
$line-height-lg: 2;         → lineHeight.lg (32px)
$headings-line-height: 1.2; → lineHeight.tight (20px)
$display-line-height: 1.2;  → lineHeight.display-* (48-76px)
```

### 4pt Grid Adherence
All values are multiples of 4:
- ✅ 16, 20, 24, 28, 32, 48, 60, 76
- This ensures perfect alignment with your spacing system

---

## 📊 Real-World Examples

### Example 1: Blog Post
```
Heading (H1): 40px / lineHeight.display-sm (48px) = 1.2 ratio
Subheading (H2): 32px / 40px = 1.25 ratio
Body: 16px / lineHeight.base (24px) = 1.5 ratio ✅
Caption: 14px / lineHeight.sm (20px) = 1.43 ratio
```

### Example 2: Landing Page Hero
```
Hero Title: 64px / lineHeight.display-lg (76px) = 1.19 ratio
Subtitle: 24px / 32px = 1.33 ratio
CTA Button: 16px / lineHeight.sm (20px) = 1.25 ratio
```

### Example 3: Dashboard UI
```
Card Title: 20px / 24px = 1.2 ratio
Body Text: 14px / lineHeight.base (24px) = 1.71 ratio ✅
Button: 14px / lineHeight.sm (20px) = 1.43 ratio
Badge: 12px / lineHeight.xs (16px) = 1.33 ratio
```

---

## 🎨 Figma Variable Usage

When creating text styles in Figma:

1. **Set Font Size** from `fontSize` tokens (14, 16, 18, etc.)
2. **Set Line Height** from `lineHeight` tokens (20, 24, 28, etc.)
3. **Figma will show it as a pixel value** (e.g., "24")
4. **Your export will preserve metadata** showing the equivalent ratio (e.g., "1.5")

### Why This Works
- Figma uses **absolute values** internally
- Bootstrap uses **relative ratios** in CSS
- Your `$extensions` metadata bridges the gap
- When exporting to CSS, you can convert back to ratios

---

## 🔄 Converting to CSS

Your build system can convert these back to Bootstrap's relative values:

```scss
// From Figma token (absolute):
lineHeight.base = 24px

// To Bootstrap SCSS (relative):
$line-height-base: 1.5;

// In CSS:
body {
  font-size: 16px;
  line-height: 1.5; // = 24px computed
}
```

The `platform.ratio` in `$extensions` tells your build system the intended ratio.

---

## ✅ Validation Checklist

Before using these line heights, verify:

- [ ] Body text uses `base` (1.5) or higher → WCAG AA ✅
- [ ] Headings use `tight` or appropriate display size
- [ ] Display fonts (>40px) use `display-*` tokens
- [ ] Buttons/UI use `sm` (not body text)
- [ ] All values are multiples of 4px
- [ ] Ratios map to Bootstrap variables

---

## 🚀 Import to Figma

1. **Save your `typography.json`**
2. **Open your Figma plugin** (DSAI Import Tokens v2)
3. **Go to Import tab**
4. **Select `typography.json`**
5. **Click "Import Tokens"**
6. **Create text styles** using the new variables:
   - Set line height by selecting the variable
   - Figma will show the pixel value
   - Metadata preserves the ratio for export

---

## 📚 References

- [Bootstrap Typography](https://getbootstrap.com/docs/5.3/content/typography/)
- [WCAG 2.1 - Text Spacing (1.4.12)](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html)
- [Material Design - Line Height](https://m2.material.io/design/typography/understanding-typography.html#type-properties)
- [Figma Variables Best Practices](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)

---

## 🎉 Summary

You now have:
- ✅ **9 line height tokens** (xs → display-lg)
- ✅ **WCAG AA compliance** for body text (1.5 minimum)
- ✅ **Bootstrap compatibility** (maps to all Bootstrap ratios)
- ✅ **4pt grid alignment** (16, 20, 24, 28, 32, 48, 60, 76)
- ✅ **Display font support** (separate tokens for large headings)
- ✅ **Figma-compatible** (absolute pixel values)
- ✅ **Export-ready** (metadata preserves ratios)

**Your typography system is now production-ready!** 🚀

