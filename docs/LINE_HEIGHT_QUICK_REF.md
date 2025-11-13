# Line Height Quick Reference
**Fast lookup for designers and developers**

## 📊 The Scale (All values in 4pt increments)

```
┌─────────────┬───────┬────────┬──────────────────┬──────────┬─────────────────────────┐
│ Token       │ Value │ Ratio  │ Bootstrap Var    │ WCAG AA  │ Use For                 │
├─────────────┼───────┼────────┼──────────────────┼──────────┼─────────────────────────┤
│ xs          │ 16px  │ 1.0    │ (custom)         │ ⚠️ NO    │ Badges, tags            │
│ sm          │ 20px  │ 1.25   │ $line-height-sm  │ ⚠️ NO    │ Buttons, forms          │
│ tight       │ 20px  │ 1.2    │ $headings-lh     │ ✅ Yes*  │ H1-H6, headings         │
│ base        │ 24px  │ 1.5    │ $line-height-base│ ✅ YES   │ Body text (DEFAULT)     │
│ relaxed     │ 28px  │ 1.75   │ (custom)         │ ✅ YES   │ Long articles           │
│ lg          │ 32px  │ 2.0    │ $line-height-lg  │ ✅ YES   │ Lead text, callouts     │
│ display-sm  │ 48px  │ 1.2    │ $display-lh      │ ✅ Yes*  │ Display 4-6 (40px font) │
│ display-md  │ 60px  │ 1.2    │ (custom)         │ ✅ Yes*  │ Display 2-3 (50px font) │
│ display-lg  │ 76px  │ 1.2    │ (custom)         │ ✅ Yes*  │ Display 1 (64px font)   │
└─────────────┴───────┴────────┴──────────────────┴──────────┴─────────────────────────┘

* Headings/display text can use tighter ratios (1.2) - only body text needs 1.5 minimum
```

---

## 🎯 Common Pairings (Font Size → Line Height)

### Body Text
```
12px → base (24px) = 2.0 ratio   ✅ (generous)
14px → base (24px) = 1.71 ratio  ✅ (great)
16px → base (24px) = 1.5 ratio   ✅ (perfect - Bootstrap default)
18px → relaxed (28px) = 1.56     ✅ (comfortable)
20px → lg (32px) = 1.6 ratio     ✅ (spacious)
```

### Headings (Standard)
```
16px → tight (20px) = 1.25 ratio  ✅ (h6)
20px → tight (20px) = 1.0 ratio   ⚠️ (use 24px instead)
24px → 28px = 1.17 ratio          ✅ (h4)
32px → 40px = 1.25 ratio          ✅ (h2)
40px → display-sm (48px) = 1.2    ✅ (h1)
```

### Display Fonts (Hero)
```
40px → display-sm (48px) = 1.2    ✅ (Display 6)
48px → display-md (60px) = 1.25   ✅ (Display 4)
56px → display-md (60px) = 1.07   ⚠️ (too tight - use 68px)
64px → display-lg (76px) = 1.19   ✅ (Display 1)
80px → 96px = 1.2 ratio           ✅ (Hero - create custom)
```

---

## 🚦 Decision Tree

```
START: What kind of text are you styling?
│
├─ Body text / Paragraphs?
│  └─ Use: base (24px) = 1.5 ratio ✅
│
├─ Long articles / Documentation?
│  └─ Use: relaxed (28px) = 1.75 ratio ✅✅
│
├─ Headings (H1-H6)?
│  ├─ Small headings (16-24px)? → tight (20px) or base (24px)
│  └─ Large headings (32-40px)? → display-sm (48px)
│
├─ Display fonts / Hero text?
│  ├─ 40-48px? → display-sm (48px)
│  ├─ 48-56px? → display-md (60px)
│  └─ 64px+? → display-lg (76px)
│
├─ Buttons / Form controls?
│  └─ Use: sm (20px) = 1.25 ratio ⚠️ (not body text)
│
└─ Badges / Tags / Compact UI?
   └─ Use: xs (16px) = 1.0 ratio ⚠️ (not body text)
```

---

## ⚡ Figma Workflow

### Step 1: Import Typography Tokens
```bash
1. Open plugin: DSAI Import Tokens v2
2. Select: typography.json
3. Import → Creates 9 lineHeight variables
```

### Step 2: Create Text Styles
```
Text Style: Body / Regular
├─ Font: Inter
├─ Size: 16px (from fontSize.base)
└─ Line Height: 24px (from lineHeight.base) ✅
```

### Step 3: Apply to Designs
```
Select text → Apply style → Done!
```

---

## 🔢 Math Helper

**To calculate ratio from pixel values:**
```
Ratio = Line Height ÷ Font Size

Examples:
24px ÷ 16px = 1.5   ✅ WCAG AA compliant
20px ÷ 16px = 1.25  ⚠️ Below AA (ok for UI, not body)
48px ÷ 40px = 1.2   ✅ Good for headings
```

**To calculate line height from ratio:**
```
Line Height = Font Size × Ratio

Examples:
16px × 1.5 = 24px   ✅ (base)
18px × 1.75 = 31.5px → Round to 32px (lg) ✅
64px × 1.2 = 76.8px → Use 76px (display-lg) ✅
```

---

## 🎨 Bootstrap SCSS Mapping

```scss
// Bootstrap Default Variables → Your Figma Tokens

$line-height-sm: 1.25;      // → lineHeight.sm (20px)
$line-height-base: 1.5;     // → lineHeight.base (24px) ✅ Default
$line-height-lg: 2;         // → lineHeight.lg (32px)

$headings-line-height: 1.2; // → lineHeight.tight (20px)
$display-line-height: 1.2;  // → lineHeight.display-* (48/60/76px)

// Your Custom Additions
// (not in Bootstrap, but accessibility-recommended)
$line-height-xs: 1.0;       // → lineHeight.xs (16px) - Use sparingly
$line-height-relaxed: 1.75; // → lineHeight.relaxed (28px) - Long-form
```

---

## ✅ Accessibility Checklist

```
☐ All body text uses base (1.5) or higher
☐ All paragraph text uses base (1.5) or higher
☐ All long-form content uses relaxed (1.75) or higher
☐ Headings use tight (1.2) or higher
☐ Buttons/UI can use sm (1.25) - NOT for body text
☐ Badges/tags can use xs (1.0) - NOT for body text
☐ No body text uses ratios below 1.5
☐ All values align to 4pt grid
```

---

## 🚨 Common Mistakes

❌ **WRONG**: Using `sm` (20px) for body text
```
Font: 16px, Line Height: sm (20px) = 1.25 ratio
❌ WCAG fail - too tight for body text
```

✅ **RIGHT**: Using `base` (24px) for body text
```
Font: 16px, Line Height: base (24px) = 1.5 ratio
✅ WCAG AA compliant
```

---

❌ **WRONG**: Using `base` (24px) for 64px display font
```
Font: 64px, Line Height: base (24px) = 0.375 ratio
❌ Text overlaps - way too tight
```

✅ **RIGHT**: Using `display-lg` (76px) for 64px font
```
Font: 64px, Line Height: display-lg (76px) = 1.19 ratio
✅ Perfect for hero headings
```

---

## 📱 Responsive Considerations

Your line heights are **fixed pixel values**, so they work consistently across all viewports. Bootstrap's approach:

```scss
// Bootstrap uses relative line heights (unitless)
// They scale automatically with font size changes

// Your approach: Fixed pixels
// Pair with specific font sizes for each breakpoint

// Example:
Mobile (320px):
  Font: 14px → Line Height: base (24px) = 1.71 ✅

Tablet (768px):
  Font: 16px → Line Height: base (24px) = 1.5 ✅

Desktop (1200px):
  Font: 18px → Line Height: relaxed (28px) = 1.56 ✅
```

---

## 🎉 You're Ready!

**Import your enhanced `typography.json` and start designing with:**
- ✅ 9 carefully calibrated line heights
- ✅ WCAG AA compliance
- ✅ Bootstrap compatibility
- ✅ 4pt grid alignment
- ✅ Display font support

**Questions?** Check `LINE_HEIGHT_GUIDE.md` for the full documentation.

