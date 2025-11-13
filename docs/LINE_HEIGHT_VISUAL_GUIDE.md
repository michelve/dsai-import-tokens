# Line Height Visual Guide
**See the ratios in action**

## 📊 Visual Scale Comparison

```
Font Size: 16px (Base)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

xs (16px)     The quick brown fox jumps
              1.0 ratio - Too tight! ⚠️

sm (20px)     The quick brown fox jumps
              
              1.25 ratio - Compact ⚠️

tight (20px)  The quick brown fox jumps
              
              1.25 ratio - For headings only ✅

base (24px)   The quick brown fox jumps
              
              
              1.5 ratio - Perfect for body text! ✅

relaxed (28px) The quick brown fox jumps
               
               
               
               1.75 ratio - Great for long reads ✅✅

lg (32px)     The quick brown fox jumps
              
              
              
              
              2.0 ratio - Spacious and scannable ✅✅
```

---

## 🎯 Side-by-Side: Bootstrap vs Your System

```
┌─────────────────────────────┬──────────────────────────────┐
│ Bootstrap (Relative)        │ Your System (Absolute 4pt)   │
├─────────────────────────────┼──────────────────────────────┤
│ $line-height-sm: 1.25       │ sm: 20px (1.25 for 16px)     │
│ $line-height-base: 1.5      │ base: 24px (1.5 for 16px)    │
│ $line-height-lg: 2          │ lg: 32px (2.0 for 16px)      │
│ $headings-line-height: 1.2  │ tight: 20px (1.2 for 16px)   │
│ $display-line-height: 1.2   │ display-*: 48/60/76px (1.2)  │
│                             │                              │
│ (no equivalent)             │ xs: 16px (1.0 - UI only)     │
│ (no equivalent)             │ relaxed: 28px (1.75 - a11y)  │
│ (no equivalent)             │ display-md: 60px (50px font) │
│ (no equivalent)             │ display-lg: 76px (64px font) │
└─────────────────────────────┴──────────────────────────────┘
```

---

## 📏 Real-World Typography Scale

### Scenario 1: Blog Article

```
┌────────────────────────────────────────────────────────────┐
│ H1 (40px) → display-sm (48px)                             │
│ Building Accessible Typography Systems                     │
│                                                            │
│ H2 (32px) → 40px                                          │
│ Why Line Height Matters                                    │
│                                                            │
│ Body (16px) → base (24px) ✅                              │
│ Line height is one of the most important aspects of        │
│ typography for readability. WCAG 2.1 requires a minimum    │
│ of 1.5 for body text to ensure comfortable reading.        │
│                                                            │
│ H3 (24px) → tight (20px) or base (24px)                  │
│ Bootstrap Integration                                      │
│                                                            │
│ Body (16px) → base (24px) ✅                              │
│ Our system maps perfectly to Bootstrap's variables...      │
│                                                            │
│ Caption (14px) → sm (20px) = 1.43 ratio                   │
│ Photo by John Doe on Unsplash                             │
└────────────────────────────────────────────────────────────┘
```

### Scenario 2: Landing Page Hero

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│ Hero (64px) → display-lg (76px) = 1.19 ratio ✅           │
│ Design Tokens                                              │
│ Made Simple                                                │
│                                                            │
│ Subtitle (24px) → lg (32px) = 1.33 ratio ✅               │
│ Import, export, and manage your design system              │
│ with Figma variables and W3C token standards               │
│                                                            │
│ [Button Text (16px) → sm (20px) = 1.25]                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Scenario 3: Dashboard Card

```
┌────────────────────────────────────────────┐
│ Card Title (18px) → base (24px) = 1.33 ✅ │
│ User Statistics                            │
│                                            │
│ Metric Label (12px) → xs (16px) = 1.33    │
│ ACTIVE USERS                               │
│                                            │
│ Metric Value (32px) → 40px = 1.25 ✅      │
│ 1,234                                      │
│                                            │
│ Body (14px) → base (24px) = 1.71 ✅       │
│ 12% increase from last week. Keep up      │
│ the great work!                            │
│                                            │
│ [Button (14px) → sm (20px) = 1.43]        │
└────────────────────────────────────────────┘
```

---

## 🔍 Zoom In: How 4pt Grid Works

```
Your line height values on the 4pt grid:

0px    4    8    12   16   20   24   28   32   36   40   44   48   ...   60   ...   76
│      │    │    │    │    │    │    │    │    │    │    │    │         │         │
                      xs   sm   base rel  lg                    d-sm     d-md     d-lg
                      ↑    ↑    ↑    ↑    ↑                     ↑        ↑        ↑
                      16   20   24   28   32                    48       60       76

All multiples of 4 ✅
```

### Why 4pt Scale?

1. **Consistency**: All spacing aligns perfectly
2. **Flexibility**: Easy to create intermediate values if needed (36, 40, 44, etc.)
3. **Scalability**: Works at any screen size
4. **Figma-native**: Figma's default grid system

---

## 📐 The Math Behind Display Line Heights

Display fonts need special attention because they're much larger:

```
Font Size  ×  Ratio (1.2)  =  Line Height  →  Rounded to 4pt
─────────────────────────────────────────────────────────────
40px       ×  1.2          =  48px         →  48px ✅ (display-sm)
48px       ×  1.2          =  57.6px       →  60px ✅ (display-md)
56px       ×  1.2          =  67.2px       →  60px ⚠️ (too tight - use 68px)
64px       ×  1.2          =  76.8px       →  76px ✅ (display-lg)
80px       ×  1.2          =  96px         →  96px ✅ (create custom if needed)
```

**Why we created 3 separate display tokens:**
- `display-sm (48px)`: For 40px fonts (Display 4-6)
- `display-md (60px)`: For 48-52px fonts (Display 2-3)
- `display-lg (76px)`: For 64px+ fonts (Display 1, Hero)

---

## 🎨 Color-Coded Status

```
🟢 GREEN (Safe for all text)
├─ base (24px)      → 1.5 ratio  ✅ WCAG AA
├─ relaxed (28px)   → 1.75 ratio ✅✅ Enhanced
└─ lg (32px)        → 2.0 ratio  ✅✅ Excellent

🟡 YELLOW (Headings/Display only)
├─ tight (20px)     → 1.2-1.25 ratio  ✅ For large text
├─ display-sm (48px) → 1.2 ratio      ✅ For 40px+ fonts
├─ display-md (60px) → 1.2 ratio      ✅ For 48px+ fonts
└─ display-lg (76px) → 1.2 ratio      ✅ For 64px+ fonts

🔴 RED (UI elements only - NOT body text)
├─ xs (16px)        → 1.0 ratio  ⚠️ Badges/tags only
└─ sm (20px)        → 1.25 ratio ⚠️ Buttons/forms only
```

---

## 📱 Responsive Font Pairing Examples

### Mobile (320-767px)

```
H1: 32px → 40px line height (1.25 ratio) ✅
H2: 28px → 32px line height (1.14 ratio) ⚠️ Use 36px instead
H3: 24px → base (24px) line height (1.0 ratio) ⚠️ Use 28px
Body: 14px → base (24px) line height (1.71 ratio) ✅✅ Great!
Small: 12px → xs (16px) line height (1.33 ratio) ✅ OK for captions
```

### Tablet (768-1023px)

```
H1: 40px → display-sm (48px) line height (1.2 ratio) ✅
H2: 32px → 40px line height (1.25 ratio) ✅
H3: 24px → 28px line height (1.17 ratio) ✅
Body: 16px → base (24px) line height (1.5 ratio) ✅ Perfect
Small: 14px → sm (20px) line height (1.43 ratio) ✅
```

### Desktop (1024px+)

```
H1: 48px → display-md (60px) line height (1.25 ratio) ✅
H2: 40px → display-sm (48px) line height (1.2 ratio) ✅
H3: 32px → 40px line height (1.25 ratio) ✅
Body: 18px → relaxed (28px) line height (1.56 ratio) ✅✅
Small: 14px → sm (20px) line height (1.43 ratio) ✅
```

### Large Desktop (1440px+)

```
Hero: 64px → display-lg (76px) line height (1.19 ratio) ✅
H1: 56px → display-md (60px) line height (1.07 ratio) ⚠️ Use 68px
H2: 40px → display-sm (48px) line height (1.2 ratio) ✅
Body: 18px → relaxed (28px) line height (1.56 ratio) ✅✅
Lead: 20px → lg (32px) line height (1.6 ratio) ✅✅
```

---

## 🧮 Custom Calculations

Need a line height not in the system? Calculate it:

```
Step 1: Determine your font size
        Example: 22px

Step 2: Choose appropriate ratio
        For body text: 1.5 (minimum)
        For headings: 1.2-1.25
        For display: 1.2

Step 3: Calculate
        22px × 1.5 = 33px

Step 4: Round to nearest 4pt
        33px → 32px or 36px
        (Use 36px to stay above 1.5 ratio)

Step 5: Verify ratio
        36px ÷ 22px = 1.64 ✅ Above 1.5 minimum
```

---

## ✅ Before You Import

Double-check your `typography.json`:

```bash
# Validate JSON syntax
✅ No syntax errors

# Check token count
✅ 9 line height tokens (xs → display-lg)

# Verify 4pt alignment
✅ All values: 16, 20, 24, 28, 32, 48, 60, 76

# Confirm Bootstrap mapping
✅ sm, base, lg, tight, display-* all mapped

# Accessibility check
✅ base (24px) = 1.5 ratio for 16px font
✅ relaxed (28px) = 1.75 ratio
✅ lg (32px) = 2.0 ratio
```

---

## 🚀 Ready to Import!

Your enhanced typography system includes:

- ✅ **9 line height tokens** (comprehensive coverage)
- ✅ **WCAG AA compliance** (1.5 minimum for body)
- ✅ **Bootstrap compatibility** (all core variables mapped)
- ✅ **4pt grid alignment** (perfect spacing system)
- ✅ **Display font support** (3 dedicated tokens for large text)
- ✅ **Accessibility metadata** (WCAG compliance documented)
- ✅ **Usage guidelines** (clear descriptions for each token)

**Import your `typography.json` into Figma and start designing!** 🎨

