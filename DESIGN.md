# Design

## Color palette

Strategy: **Full palette — FIFA WC 2026 official brand colors, used simultaneously.**

Reference: "FIFA World Cup 2026 official brand identity — six-color stripe, sunburst navy, ultra-bold condensed type. Not restrained, not monochrome. Every brand color earns its place."

| Token | Value | Usage |
|---|---|---|
| `--wc-red` | `oklch(49% 0.22 25)` | Primary CTA, Group Stage, live state |
| `--wc-blue` | `oklch(40% 0.21 260)` | Leaderboard, group tabs, info |
| `--wc-cyan` | `oklch(77% 0.13 206)` | Accent type, knock-out highlights |
| `--wc-purple` | `oklch(42% 0.20 300)` | Third place, profile badges |
| `--wc-green` | `oklch(65% 0.22 140)` | Success state, Round of 16 |
| `--wc-yellow` | `oklch(88% 0.18 95)` | Final, gold rank, your-score banner |
| `--wc-gold` | `oklch(72% 0.14 80)` | Exact score chip, gold medal |
| `--wc-navy` | `oklch(14% 0.05 260)` | Dark background, nav, landing |
| `--wc-navy-panel` | `oklch(18% 0.06 260)` | Dark panel surface |
| `--wc-cream` | `oklch(96% 0.01 90)` | Light background |
| `--wc-ink` | `oklch(12% 0.03 260)` | Near-black ink on light |
| `--wc-white` | `oklch(99% 0.005 90)` | Pure panel / text on dark |

### Hex fallbacks (for non-OKLCH CSS)

```
--wc-red:    #E8192C
--wc-blue:   #1144CC
--wc-cyan:   #00C8E8
--wc-purple: #7B2CBF
--wc-green:  #2CB82A
--wc-yellow: #FFC800
--wc-gold:   #C9A427
--wc-navy:   #071A40
--wc-navy-panel: #0D2254
--wc-cream:  #F4F1EB
--wc-ink:    #0A0A18
--wc-white:  #FDFCFA
```

## Typography

**Event display**: Big Shoulders Display, weight 900. Ultra-condensed, uppercase, aggressive — matches FWC2026 Event Typeface from brand guidelines. Line-height 0.88.

**Body / labels**: Noto Sans — explicitly listed as supporting typeface in FIFA WC 2026 brand guidelines. Weight 400–800.

**Numerics / mono**: JetBrains Mono, weight 700–800. Tabular numerals for scores and points.

### Scale

```
display-hero:  clamp(64px, 18cqw, 180px) — landing headline
display-lg:    clamp(40px, 11cqw, 90px)  — screen titles
display-md:    clamp(28px, 7cqw, 56px)   — card headings
body-lg:       18px / 1.5
body-md:       14px / 1.5
label:         11–13px / 800 weight / 0.06–0.1em tracking
mono-lg:       24–30px — live scores
mono-sm:       10–12px — metadata
```

All display elements: `text-transform: uppercase`.

## Elevation / borders

Neo-brutalist system — no soft shadows, no blur.

```
--shadow-sm:  3px 3px 0 0 var(--wc-ink)
--shadow-md:  5px 5px 0 0 var(--wc-ink)
--shadow-lg:  8px 8px 0 0 var(--wc-ink)
```

Borders: `3px solid var(--wc-ink)` for cards. `2px solid` for inline chips. No border-radius anywhere.

On dark surfaces: shadow color switches to `#000000`.

## Stage color system

```
Group Stage:    --wc-blue   (#1144CC)
Round of 32:    --wc-green  (#2CB82A)
Round of 16:    #066030  (deep green)
Quarter-finals: --wc-red    (#E8192C)
Semi-finals:    --wc-gold   (#C9A427)
Third-place:    --wc-purple (#7B2CBF)
Final:          --wc-yellow (#FFC800) with black text
```

## Background patterns

### WC26 six-color stripe
```css
height: 5px;
background: linear-gradient(90deg,
  #E8192C 0% 16.66%, #FFC800 16.66% 33.33%,
  #2CB82A 33.33% 50%, #1144CC 50% 66.66%,
  #00C8E8 66.66% 83.33%, #7B2CBF 83.33% 100%
);
```

### Sunburst (landing page bg)
```css
background: conic-gradient(from 0deg at 50% 50%,
  #071A40 0deg 11.25deg, #0A2050 11.25deg 22.5deg,
  /* ... 32 alternating segments */
);
```

### Diagonal hatch (dark sections texture)
```css
background-image: repeating-linear-gradient(
  45deg,
  rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px,
  transparent 1px, transparent 12px
);
```

## Components

### Navigation (always dark regardless of theme)
- Background: `#040F26`
- Border-bottom: `3px solid #000`
- WC26 stripe immediately above or below
- Tab buttons: each with own stage color when active (matches=red, leaderboard=blue, profile=green)
- Logo: "WC" in red block + "26" + "PREDICTOR" label

### Match cards
- Header band uses stage color, white text, 11px heavy uppercase stage name
- Team names: Noto Sans 800, uppercase
- Score: JetBrains Mono 800 24px
- Hard border + offset shadow
- PREDICT → chip in red when no prediction

### Score stepper
- Hard borders, no radius
- Active value: stage color background, white text
- Buttons: panel bg, heavy weight +/−

### Landing hero
- Full dark navy (#071A40) regardless of theme
- Sunburst conic gradient behind everything
- Ghost "26" decal (outline text, very low opacity) behind hero type
- Stacked display type: PREDICT / THE WORLD / CUP 26.
- White / cyan / red color split across words
- Six-color stripe as horizontal separator

## Motion

Entrance: `slideUp 0.5s cubic-bezier(0.34, 1.0, 0.64, 1)` staggered per element.
Buttons: translate on press (translate 4px 4px, reduce shadow).
Cards: translate(-2px, -2px) on hover, shadow grows.
No spring/bounce/elastic. No layout animation.
Score stepper value: `scale(1.15)` bump on change, cubic-bezier settle.

## Themes

**Default: dark.** Sports apps belong in the stadium. Dark is the match.

Light theme: cream bg (#F4F1EB), white panels, dark ink. Nav stays dark regardless.

`data-theme="dark"` is the default HTML attribute.
