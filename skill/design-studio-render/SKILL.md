---
name: design-studio-render
description: >
  Generate perfect visual designs using Design Studio's JSX DSL. 
  Activates when user asks to create a design, poster, banner, social media 
  graphic, flyer, thumbnail, logo, UI mockup, or any visual composition. 
  Covers text, image, shape, svg, backgrounds, typography, gradients, 
  crop, outlines, padding, overflows, and composition best practices.
  Outputs valid JSX ONLY — no explanations, no markdown wrappers.
license: MIT
compatibility: opencode, claude
metadata:
  audience: developers
  workflow: design
  format: jsx
---

# Design Studio Render Skill

Generate production-ready JSX designs for the Design Studio editor. Every visual element — text, image, shape, SVG, background — is represented as a declarative JSX tag with attributes.

## Output Rules

- Output **only valid JSX**. No explanations, no markdown wrappers, no ``` fences.
- Use double quotes for ALL attribute values.
- Self-close empty elements: `<page />` not `<page></page>`.
- Always wrap in `<project>`.
- Always include `<config>` with at minimum `pageGap`, `showGrid`, `snapToGrid`.
- Add `xmlns="http://www.w3.org/2000/svg"` to `<svg>` elements.

## Quick Start — Minimum Viable Project

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="false" />
  <page width="1080" height="1080" bgColor="#0f0f1a">
    <text x="60" y="60" w="960" h="80" fontSize="48" fontFamily="Inter, sans-serif"
      fontWeight="700" color="#ffffff" textAlign="center">
      Hola Mundo
    </text>
    <image x="200" y="200" w="680" h="680" src="https://picsum.photos/680/680" />
  </page>
</project>
```

---

# Element Reference

## `<config>`

Mandatory first child of `<project>`. Controls editor behavior.

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| pageGap | number | 40 | Gap between pages in px |
| showGrid | bool | false | Show/hide grid overlay |
| snapToGrid | bool | false | Snap elements to grid |
| gridSize | number | 20 | Grid cell size in px |
| showRulers | bool | false | Show rulers |
| guideMode | string | "global" | Guide mode: "global" or "page" |
| zoom | number | 1 | Canvas zoom level |

## `<page>`

A single canvas/slide. Multiple `<page>` elements create a multi-page project.

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| width | number | REQUIRED | Page width in px |
| height | number | REQUIRED | Page height in px |
| bgColor | string | "#ffffff" | Background color (hex). Use `#00000000` for transparent |
| name | string | — | Page name/label |

**Background with layers** — see Background Layers section below.

## `<text>`

Text elements with full typography control.

### Required
| Attribute | Description |
|-----------|-------------|
| x | Left position in px |
| y | Top position in px |
| w | Width in px |
| h | Height in px |
| fontSize | Font size in px (min 8) |

### Typography
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| fontFamily | string | "system-ui, sans-serif" | CSS font-family. Use Google Fonts: "Poppins, sans-serif", "Roboto, sans-serif", "Playfair Display, serif", "Oswald, sans-serif", "Montserrat, sans-serif", "Inter, sans-serif" |
| fontWeight | number | 400 | 100–900. Use 300 for light, 400 normal, 600 semi-bold, 700 bold, 900 black |
| fontStyle | string | "normal" | "normal" or "italic" |
| color | string | "#ffffff" | Text color in hex |

### Alignment
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| textAlign | string | "center" | "left", "center", "right" |
| verticalAlign | string | "middle" | "top", "middle", "bottom" |

### Spacing
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| letterSpacing | number | 0 | Inter-letter spacing in px |
| lineHeight | number | 1.2 | Multiplier. 1.0 tight, 1.5 comfortable, 2.0 loose |
| wordSpacing | number | 0 | Word spacing in px |
| textIndent | number | 0 | First-line indent in px |

### Transform & Decoration
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| textTransform | string | "none" | "none", "uppercase", "lowercase", "capitalize" |
| textDecoration | string | "none" | "none", "underline", "line-through" |
| fontVariant | string | "normal" | "normal", "small-caps" |

### Text Stroke (border on letters)
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| textStrokeColor | string | — | Color for text stroke. Good for readability on complex backgrounds |
| textStrokeWidth | number | 0 | Stroke width in px. Use 1–3 for subtle, 4+ for bold outline |

### Text Background
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| textBgColor | string | — | Background behind text. Use hex with alpha: "#00000044" for semi-transparent |

### Gradient Text
| Attribute | Type | Description |
|-----------|------|-------------|
| textGradient | string | CSS gradient value e.g. "linear-gradient(135deg, #ff6b6b, #4ecdc4)" |
| textGradientColors | string | Comma-separated hex colors for the gradient UI: "#ff6b6b,#4ecdc4" |

### Text Shadow
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| shadowColor | string | "#000000" | Shadow color |
| shadowBlur | number | 0 | Blur radius in px |
| shadowOffsetX | number | 0 | Horizontal offset in px |
| shadowOffsetY | number | 4 | Vertical offset in px |

### Multiple Text Shadows (NEW)
| Attribute | Type | Description |
|-----------|------|-------------|
| textShadows | string | JSON array of shadow objects. EACH shadow has: color, blur, offsetX, offsetY. Must be valid JSON string inside the attribute. Replaces single shadow when present. |

Example:
```jsx
<text x="100" y="100" w="500" h="80" fontSize="44" fontWeight="900"
  color="#ffffff" textAlign="center"
  textShadows='[{"color":"#6c5ce7","blur":25,"offsetX":0,"offsetY":0},{"color":"#e94560","blur":15,"offsetX":5,"offsetY":5}]'>
  MULTIPLE SHADOWS
</text>
```

### Padding (NEW)
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| textPaddingLeft | number | 4 | Internal left padding in px |
| textPaddingRight | number | 4 | Internal right padding in px |
| textPaddingTop | number | 4 | Internal top padding in px |
| textPaddingBottom | number | 4 | Internal bottom padding in px |

Use asymmetrical padding for visual hierarchy:
```jsx
<text x="60" y="60" w="400" h="120" fontSize="20" color="#ffffff"
  textAlign="left" verticalAlign="top"
  textBgColor="#1e1e2e"
  textPaddingLeft="24" textPaddingRight="16"
  textPaddingTop="16" textPaddingBottom="12">
  Text with asymmetric padding
</text>
```

### Outline (NEW)
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| textOutlineColor | string | — | Color of the decorative outline around the text box |
| textOutlineWidth | number | 0 | Width of outline in px. 0 = disabled |

```jsx
<text x="100" y="100" w="400" h="60" fontSize="32" fontWeight="700"
  color="#ffffff" textAlign="center"
  textOutlineColor="#6c5ce7" textOutlineWidth="4">
  OUTLINED TEXT
</text>
```

### Overflow (NEW)
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| textOverflow | string | "hidden" | "hidden" (clip), "visible" (overflow), "ellipsis" (... with nowrap), "clip" |

- Use `"ellipsis"` for single-line text that must truncate with `...`
- Use `"visible"` for intentional overflow effects
- Use `"hidden"` (default) for clean clipping

```jsx
<text x="100" y="100" w="250" h="40" fontSize="16" color="#ffffff"
  textBgColor="#333" textOverflow="ellipsis">
  Very long text that will be truncated with ellipsis because it does not fit
</text>
```

### Character Scale
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| charScaleX | number | 100 | Horizontal stretch in %. 200 = double width |
| charScaleY | number | 100 | Vertical stretch in %. 200 = double height |

### Guide Anchors (RECOMMENDED)
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| leftAnchor | string | — | ID of the vertical guide this element's left edge attaches to |
| leftAnchorOffset | number | 0 | Offset in px from the guide to the element's left edge (positive = right of guide) |
| rightAnchor | string | — | ID of the vertical guide this element's right edge attaches to |
| rightAnchorOffset | number | 0 | Offset in px from the guide to the element's right edge (positive = right of guide) |

When an element has anchors, its position is calculated as `guide.position + pageOffset + offset`. Moving the guide automatically moves all anchored elements. **Always use anchors for text elements** instead of raw `x` coordinates — this ensures layout consistency and makes the design responsive to page/guide changes.

```jsx
<text leftAnchor="ml-text-start" leftAnchorOffset="0"
  rightAnchor="ml-text-end" rightAnchorOffset="0"
  y="200" w="auto" h="60" fontSize="28" fontWeight="700" color="#ffffff">
  Anchored text
</text>
```

For centered elements, use symmetric offsets:
```jsx
<text leftAnchor="ml-center" leftAnchorOffset="-240"
  rightAnchor="ml-center" rightAnchorOffset="240"
  y="200" w="auto" h="60" fontSize="28" fontWeight="700" color="#ffffff">
  Centered anchored text
</text>
```

---

## `<image>`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| x | number | REQUIRED | Left position in px |
| y | number | REQUIRED | Top position in px |
| w | number | REQUIRED | Width in px |
| h | number | REQUIRED | Height in px |
| src | string | REQUIRED | Image URL. Use https://picsum.photos/WIDTH/HEIGHT for placeholders |
| imgBrightness | number | 100 | CSS filter brightness %. 0 = black, 100 = normal, 200 = bright |
| imgContrast | number | 100 | CSS filter contrast %. 0 = gray, 100 = normal, 200 = high |
| imgSaturation | number | 100 | CSS filter saturate %. 0 = B&W, 100 = normal, 200 = vivid |
| imgBlur | number | 0 | CSS filter blur in px |
| cropX | number | 0 | Crop left offset in px |
| cropY | number | 0 | Crop top offset in px |
| cropW | number | — | Crop width in px. Leave unset or match element w for no crop |
| cropH | number | — | Crop height in px. Leave unset or match element h for no crop |

### Image Filters — Quick Reference

For **desaturated/monochrome** look: `imgSaturation="0" imgContrast="110"`
For **bright/vibrant** look: `imgSaturation="150" imgBrightness="110" imgContrast="120"`
For **dark/moody** look: `imgBrightness="60" imgContrast="130" imgSaturation="80"`
For **soft/blurred background**: `imgBlur="10" imgBrightness="80"`

---

## `<shape>`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| x | number | REQUIRED | Left position in px |
| y | number | REQUIRED | Top position in px |
| w | number | REQUIRED | Width in px |
| h | number | REQUIRED | Height in px |
| shapeKind | string | REQUIRED | "rect", "circle", "triangle", "star", "line" |
| backgroundColor | string | "#cccccc" | Fill color in hex |
| borderColor | string | — | Border color |
| borderWidth | number | 0 | Border width in px |
| borderStyle | string | "solid" | "solid", "dashed", "dotted" |
| borderRadius | number | 0 | Corner radius in px (rect only) |
| borderRadiusTL | number | — | Top-left corner radius (overrides borderRadius) |
| borderRadiusTR | number | — | Top-right corner radius |
| borderRadiusBR | number | — | Bottom-right corner radius |
| borderRadiusBL | number | — | Bottom-left corner radius |
| fillGradient | string | — | CSS gradient e.g. "linear-gradient(90deg, #ff6b6b, #4ecdc4)" |
| fillGradientColors | string | — | Comma-separated hex: "#ff6b6b,#4ecdc4" |

### Gradient Fills (Shapes)

Use instead of backgroundColor for richer fills:

```jsx
<shape x="100" y="100" w="400" h="400" shapeKind="rect"
  fillGradient="linear-gradient(135deg, #667eea, #764ba2)"
  borderRadius="20" />
```

| Gradient Style | CSS Value | Best For |
|----------------|-----------|----------|
| Linear | `linear-gradient(ANGLEdeg, COLOR1, COLOR2)` | General purpose |
| Radial | `radial-gradient(circle at center, COLOR1, COLOR2)` | Spotlight / glow effects |

```jsx
<shape x="100" y="100" w="400" h="400" shapeKind="circle"
  fillGradient="radial-gradient(circle at center, #43e97b, #38f9d7)" />
```

---

## `<svg>`

For custom SVG vector graphics:

| Attribute | Type | Description |
|-----------|------|-------------|
| x | number | Left position in px |
| y | number | Top position in px |
| w | number | Width in px |
| h | number | Height in px |
| svgContent | string | **REQUIRED**. Full `<svg>` element markup. Must include `xmlns="http://www.w3.org/2000/svg"` and `viewBox` |

```jsx
<svg x="100" y="100" w="100" h="100"
  svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#6c5ce7" /></svg>' />
```

---

## `<guide>`

Define alignment guides inside `<config>` for precise layout:

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| id | string | REQUIRED | Unique identifier (use descriptive names, not page-based). Must be globally unique across all pages |
| orientation | string | REQUIRED | "vertical" or "horizontal" |
| position | number | REQUIRED | Position in px from the page's left (vertical) or top (horizontal) edge |
| pageId | string | — | Page this guide belongs to. Omit for all-page guides (deprecated — always specify page-local) |

```jsx
<config pageGap="40" showGrid="false" snapToGrid="false">
  <guide id="ml-cover-text-start" orientation="vertical" position="60" />
  <guide id="ml-cover-text-end" orientation="vertical" position="500" />
  <guide id="ml-cover-center" orientation="vertical" position="280" />
  <guide id="ml-cover-top" orientation="horizontal" position="60" />
  <guide id="ml-cover-bottom" orientation="horizontal" position="1020" />
</config>
```

## Guides and Anchor System — Complete Reference

Guides + anchors = declarative, responsive layout system. Every text element should attach to vertical guides instead of using raw `x` coordinates.

### Architecture

1. **Guides** are defined in `<config>` with a unique `id`, `orientation`, `position`, and `pageId`.
2. **Anchors** on `<text>` elements (`leftAnchor`, `rightAnchor`) reference guide IDs.
3. **Offsets** (`leftAnchorOffset`, `rightAnchorOffset`) express distance from guide to element edge.
4. **Position is derived** at parse time: `element.x = guide.position + pageOffset + offset`.

### Best Practices

- **Always use anchors for text elements.** Never set raw `x` on text — always use `leftAnchor` + `leftAnchorOffset`.
- **Use two anchors** for fixed-width elements: `leftAnchor` + `rightAnchor` with matching offsets.
- **Use one anchor + offset** for edge-aligned elements: `leftAnchor` with positive offset moves it right from the guide.
- **Use symmetric offsets for centering**: `leftAnchor="center-guide" leftAnchorOffset="-240" rightAnchor="center-guide" rightAnchorOffset="240"`.
- **Guide IDs must be globally unique** across the entire project. Use descriptive prefixes like `ml-` (magazine left), `mr-` (magazine right), `cv-` (cover), `pg-` (page), etc.
- **All guides must be page-local** (always set `pageId`). Global guides (no pageId) are deprecated.
- **Do not create guides inside `<page>` elements.** Guides only go in `<config>`.

### Naming Convention

Use descriptive, globally unique guide IDs:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `ml-` | Magazine left page | `ml-text-start`, `ml-center` |
| `mr-` | Magazine right page | `mr-text-end`, `mr-guide` |
| `cv-` | Cover | `cv-title-center`, `cv-margin-left` |
| `pg-` | General page | `pg-content-start`, `pg-margin-right` |

### Complete Example

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="false">
    <guide id="cv-left" orientation="vertical" position="60" />
    <guide id="cv-right" orientation="vertical" position="1020" />
    <guide id="cv-center" orientation="vertical" position="540" />
    <guide id="cv-top" orientation="horizontal" position="60" />
    <guide id="cv-bottom" orientation="horizontal" position="1020" />
  </config>
  <page width="1080" height="1080" bgColor="#0f0f1a">
    <text leftAnchor="cv-left" leftAnchorOffset="0"
      rightAnchor="cv-right" rightAnchorOffset="0"
      y="60" w="auto" h="80" fontSize="36" fontWeight="700"
      color="#ffffff" textAlign="center">
      Anchored Content
    </text>
    <text leftAnchor="cv-center" leftAnchorOffset="-200"
      rightAnchor="cv-center" rightAnchorOffset="200"
      y="200" w="auto" h="60" fontSize="24" color="#a0a0b0"
      textAlign="center">
      Centered with symmetric offsets
    </text>
  </page>
</project>
```

# Background Layers System

Pages and shapes support multi-layer backgrounds via `bgStyle` attribute. This generates CSS `background` property with multiple layers.

## `bgStyle` Format

The value is a CSS `background` property value. Multiple layers are comma-separated:

```
bgStyle="layer1, layer2, layer3"
```

Each layer renders bottom-to-top (first layer = bottom, last layer = top / closest).

### Solid Color Layer
```
bgStyle="linear-gradient(135deg, #667eea, #764ba2)"
```

### Pattern Layers

All patterns are pure CSS — no images required.

| Pattern | CSS | Parameters |
|---------|-----|------------|
| Checkerboard | `repeating-conic-gradient(#COLOR1 0% 25%, #COLOR2 0% 50%) SIZEpx SIZEpx` | 2 colors + size |
| Dots | `radial-gradient(#COLOR1 1.5px, transparent 1.5px) SIZEpx SIZEpx` | 1 color + size |
| Stripes | `repeating-linear-gradient(45deg, #COLOR1, #COLOR1 2px, #COLOR2 2px, #COLOR2 8px)` | 2 colors |
| Grid | `repeating-linear-gradient(0deg, transparent, transparent SIZEpx, #COLOR SIZEpx, #COLOR calc(SIZEpx + 1px)), repeating-linear-gradient(90deg, transparent, transparent SIZEpx, #COLOR SIZEpx, #COLOR calc(SIZEpx + 1px))` | 1 color + size |
| Crosshatch | `repeating-linear-gradient(45deg, transparent, transparent SIZEpx, #COLOR SIZEpx, #COLOR calc(SIZEpx + 1px)), repeating-linear-gradient(-45deg, transparent, transparent SIZEpx, #COLOR SIZEpx, #COLOR calc(SIZEpx + 1px))` | 1 color + size |

### Gradient Layers
```
bgStyle="linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #667eea 100%)"
bgStyle="radial-gradient(circle at 30% 40%, #f093fb 0%, #f5576c 100%)"
```

### Image Layers
```
bgStyle="url(https://example.com/image.jpg) center/cover no-repeat"
```

### Combined Layers
```
bgStyle="linear-gradient(135deg, rgba(102,126,234,0.8), rgba(118,75,162,0.8)), url(https://picsum.photos/1080/1080) center/cover no-repeat"
```

### Full Background Example (Page)

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 40px 40px, linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3))">
  <text x="60" y="60" w="960" h="80">Content on patterned background</text>
</page>
```

### Full Background Example (Shape)

```jsx
<shape x="100" y="100" w="400" h="400" shapeKind="rect" borderRadius="20"
  bgStyle="repeating-linear-gradient(45deg, #6c5ce7, #6c5ce7 2px, #a29bfe 2px, #a29bfe 8px), linear-gradient(135deg, rgba(108,92,231,0.5), rgba(162,155,254,0.5))" />
```

---

# Common Attributes (All Elements)

These work on text, image, shape, and svg.

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| x | number | REQUIRED | Left position in px (from left edge of page) |
| y | number | REQUIRED | Top position in px (from top edge of page) |
| w | number | REQUIRED | Width of the element box in px |
| h | number | REQUIRED | Height of the element box in px |
| rotation | number | 0 | Rotation in degrees. Positive = clockwise |
| opacity | number | 1 | 0 (invisible) to 1 (fully opaque). Use 0.3–0.5 for watermarks |
| zIndex | number | auto | Stacking order. Higher = on top. Omit for auto |
| mixBlendMode | string | "normal" | CSS mix-blend-mode. Options: "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion" |
| flipH | bool | false | Flip horizontally |
| flipV | bool | false | Flip vertically |
| locked | bool | false | Prevent user from moving/resizing |
| hidden | bool | false | Hide element (still takes space) |

### Shadow (Box/Text)
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| shadowColor | string | "#000000" | Shadow color (box-shadow for shapes/images, text-shadow for text) |
| shadowBlur | number | 0 | Blur radius in px |
| shadowOffsetX | number | 0 | Horizontal offset in px |
| shadowOffsetY | number | 4 | Vertical offset in px |

For **glow effect**: `shadowColor="#6c5ce7" shadowBlur="30" shadowOffsetY="0"`
For **depth/pop**: `shadowColor="#000000" shadowBlur="15" shadowOffsetX="5" shadowOffsetY="5"`
For **soft shadow**: `shadowColor="rgba(0,0,0,0.3)" shadowBlur="20" shadowOffsetY="8"`

---

# Design Principles & Best Practices

## Composition

### The Golden Rule of Spacing
- **Padding**: Always add at least 40px margin from page edges. Never place content at x=0 or y=0.
- **Element spacing**: 20–40px between related elements, 60–80px between sections.
- **Consistency**: Use multiples of 20px for all positioning (x, y, width, height).

### Visual Hierarchy
1. **Hero text**: Largest (48–72px), boldest (700–900), centered at top third
2. **Subtitle**: Medium (24–36px), lighter (300–400), 40–60px below hero
3. **Body**: Small (14–20px), regular weight (400), aligned consistently
4. **CTA / accent**: Contrasting color, different weight, with background shape

### Color Scheme Rules
- **Background**: Dark (#0f0f1a, #1a1a2e, #0a0a23) or light (#f8f9fa, #ffffff, #f0f0f5)
- **Text on dark**: White (#ffffff) or light gray (#e2e8f0, #cbd5e1)
- **Text on light**: Dark (#1a1a2e, #2d3436, #333333)
- **Accent**: One vibrant color (#6c5ce7 purple, #e94560 red, #4ecdc4 teal, #ff6b6b coral, #10b981 green)
- **Maximum 3 colors** per design + background + white text

### Typography Pairing
| Use Case | Font | Weight |
|----------|------|--------|
| Bold hero title | "Oswald, sans-serif" | 700 |
| Elegant title | "Playfair Display, serif" | 700 |
| Modern title | "Poppins, sans-serif" | 700–900 |
| Clean subtitle | "Inter, sans-serif" | 300–400 |
| Body text | "system-ui, sans-serif" | 400 |
| Monospace / code | "Courier New, monospace" | 400 |

## Layout Patterns

### Full-bleed Image with Overlay
```jsx
<image x="0" y="0" w="1080" h="1080"
  src="https://picsum.photos/1080/1080"
  imgBrightness="60" />
<text x="60" y="400" w="960" h="120" fontSize="64" fontWeight="700"
  color="#ffffff" textAlign="center" verticalAlign="middle"
  textStrokeColor="#000000" textStrokeWidth="2">
  Overlay Title
</text>
```

### Card Layout
```jsx
<shape x="60" y="200" w="460" h="500" shapeKind="rect"
  backgroundColor="#1e1e2e" borderRadius="16" />
<image x="80" y="220" w="420" h="280"
  src="https://picsum.photos/420/280" imgBrightness="90" imgSaturation="120"
  borderRadius="12" />
<text x="80" y="520" w="420" h="40" fontSize="18" fontWeight="700"
  color="#ffffff">Card Title</text>
<text x="80" y="560" w="420" h="60" fontSize="13" color="#a0a0b0"
  verticalAlign="top">Card description text here.</text>
```

### Split Layout (Left Text / Right Image)
```jsx
<text x="60" y="60" w="480" h="600" fontSize="42" fontWeight="700"
  color="#ffffff" textAlign="left" verticalAlign="middle"
  letterSpacing="2" textTransform="uppercase">
  LEFT SIDE
  TEXT CONTENT
</text>
<image x="600" y="60" w="420" h="600"
  src="https://picsum.photos/420/600" />
```

### Centered Composition with Background Shape
```jsx
<shape x="140" y="200" w="800" h="600" shapeKind="rect"
  backgroundColor="#1e1e2e" borderRadius="24" />
<text x="200" y="300" w="680" h="80" fontSize="48" fontWeight="700"
  color="#ffffff" textAlign="center">
  Centered Design
</text>
<text x="200" y="400" w="680" h="40" fontSize="18" color="#a0a0b0"
  textAlign="center">
  Perfectly balanced composition
</text>
```

### Gradient Background with Text Shadow
```jsx
<shape x="0" y="0" w="1080" h="1080" shapeKind="rect"
  fillGradient="linear-gradient(135deg, #667eea, #764ba2)" />
<text x="60" y="400" w="960" h="120" fontSize="64" fontWeight="900"
  color="#ffffff" textAlign="center"
  shadowColor="#000000" shadowBlur="30" shadowOffsetY="10"
  letterSpacing="4" textTransform="uppercase">
  GRADIENT DREAM
</text>
```

### Neon Glow (Multiple Shadows + Outline)
```jsx
<text x="60" y="400" w="960" h="120" fontSize="64" fontWeight="900"
  color="#ffffff" textAlign="center"
  textOutlineColor="#6c5ce7" textOutlineWidth="3"
  textShadows='[{"color":"#6c5ce7","blur":30,"offsetX":0,"offsetY":0},{"color":"#e94560","blur":15,"offsetX":6,"offsetY":6}]'
  letterSpacing="6" textTransform="uppercase">
  NEON TITLE
</text>
```

### Pattern Background Page
```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 30px 30px">
  <text x="60" y="60" w="960" h="80" fontSize="36" fontWeight="700"
    color="#ffffff" textAlign="center">
    Pattern Background
  </text>
</page>
```

### Multi-layer Background (Gradient + Pattern + Image)
```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-conic-gradient(rgba(26,26,46,0.5) 0% 25%, rgba(22,33,62,0.5) 0% 50%) 40px 40px, linear-gradient(135deg, rgba(102,126,234,0.4), rgba(118,75,162,0.4)), url(https://picsum.photos/1080/1920) center/cover no-repeat">
  <text x="60" y="800" w="960" h="120" fontSize="64" fontWeight="700"
    color="#ffffff" textAlign="center"
    textStrokeColor="#000000" textStrokeWidth="2"
    shadowColor="#000000" shadowBlur="20" shadowOffsetY="8">
    Layered Background
  </text>
</page>
```

---

# Element Sizing Quick Reference

| Context | Width | Height | Notes |
|---------|-------|--------|-------|
| Full page | 1080 | 1920 | Instagram Story / Reels |
| Square post | 1080 | 1080 | Instagram Feed / Facebook |
| Landscape | 1920 | 1080 | YouTube Thumbnail / Banner |
| Banner | 1200 | 600 | Web banner / header |
| Thumbnail | 1280 | 720 | YouTube / Video |
| Poster | 1920 | 2880 | Print / presentation |
| Logo | 500 | 500 | Brand identity |
| A4 | 2480 | 3508 | Print document |

---

# Common Patterns — Copy-Paste Ready

## Social Media Post (1080×1080)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="false" />
  <page width="1080" height="1080" bgColor="#0f0f1a">
    <image x="0" y="0" w="1080" h="1080"
      src="https://picsum.photos/1080/1080"
      imgBrightness="50" imgBlur="4" />
    <text x="60" y="380" w="960" h="120" fontSize="64" fontWeight="900"
      color="#ffffff" textAlign="center"
      textStrokeColor="#000000" textStrokeWidth="3"
      shadowColor="#000000" shadowBlur="20" shadowOffsetY="8"
      letterSpacing="3">
      POST TITLE
    </text>
    <text x="60" y="520" w="960" h="60" fontSize="22" fontWeight="300"
      color="#e2e8f0" textAlign="center"
      textStrokeColor="#000000" textStrokeWidth="1">
      Subtitle or description here
    </text>
    <shape x="390" y="620" w="300" h="56" shapeKind="rect"
      backgroundColor="#6c5ce7" borderRadius="28">
    </shape>
    <text x="390" y="620" w="300" h="56" fontSize="18" fontWeight="700"
      color="#ffffff" textAlign="center" verticalAlign="middle"
      letterSpacing="2" textTransform="uppercase">
      CTA BUTTON
    </text>
  </page>
</project>
```

## YouTube Thumbnail (1280×720)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="false" />
  <page width="1280" height="720" bgColor="#0a0a23">
    <image x="0" y="0" w="1280" h="720"
      src="https://picsum.photos/1280/720"
      imgBrightness="50" imgContrast="130" imgSaturation="150" />
    <text x="40" y="200" w="800" h="160" fontSize="72" fontWeight="900"
      color="#ffffff" textAlign="left"
      textStrokeColor="#000000" textStrokeWidth="4"
      shadowColor="#000000" shadowBlur="25" shadowOffsetY="10"
      textTransform="uppercase" letterSpacing="2">
      BIG BOLD
      HEADLINE
    </text>
    <shape x="40" y="440" w="240" h="60" shapeKind="rect"
      backgroundColor="#e94560" borderRadius="8" />
    <text x="40" y="440" w="240" h="60" fontSize="22" fontWeight="700"
      color="#ffffff" textAlign="center" verticalAlign="middle"
      textTransform="uppercase" letterSpacing="2">
      WATCH NOW
    </text>
    <text x="1040" y="600" w="200" h="80" fontSize="48" fontWeight="900"
      color="#e94560" textAlign="center"
      textStrokeColor="#000000" textStrokeWidth="3"
      shadowColor="#000000" shadowBlur="15" shadowOffsetY="5">
      10:32
    </text>
  </page>
</project>
```

## Instagram Story (1080×1920)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="false" />
  <page width="1080" height="1920" bgColor="#0f0f1a"
    bgStyle="linear-gradient(180deg, #667eea 0%, #764ba2 100%)">
    <text x="60" y="400" w="960" h="160" fontSize="72" fontWeight="900"
      color="#ffffff" textAlign="center"
      letterSpacing="4" textTransform="uppercase"
      shadowColor="rgba(0,0,0,0.4)" shadowBlur="30" shadowOffsetY="10">
      STORY
      TITLE
    </text>
    <text x="60" y="600" w="960" h="60" fontSize="24" fontWeight="300"
      color="rgba(255,255,255,0.8)" textAlign="center"
      letterSpacing="8" textTransform="uppercase">
      SWIPE UP TO LEARN MORE
    </text>
    <shape x="390" y="720" w="300" h="6" shapeKind="rect"
      backgroundColor="#ffffff" borderRadius="3" opacity="0.5" />
    <text x="60" y="1600" w="960" h="40" fontSize="14" fontWeight="300"
      color="rgba(255,255,255,0.4)" textAlign="center"
      letterSpacing="6" textTransform="uppercase">
      @yourhandle
    </text>
  </page>
</project>
```

---

# Anti-patterns (NEVER do these)

| Anti-pattern | Why | Correct |
|---|---|---|
| Place text at x="0" y="0" | No breathing room | Use x="40" minimum, y="40" minimum |
| Forget `fontFamily` on text | Defaults to system-ui, looks generic | Always specify a font |
| Multiple text elements overlapping | Unreadable, hard to edit | Use separate positions or a single text with newlines |
| bgColor with alpha like "#ffffff88" on pages | Pages don't support alpha, use solid hex | Use solid bgColor, or add transparency via bgStyle |
| Missing `xmlns` on SVG content | SVG won't render | Always include `xmlns="http://www.w3.org/2000/svg"` |
| Very long text without textOverflow="ellipsis" | Text bleeds out or gets clipped without warning | Set explicit overflow mode |
| Using CSS `box-shadow` in attributes | Not supported | Use `shadowColor`, `shadowBlur`, etc. |
| Setting w/h smaller than 10px | Elements become unusable | Minimum 20px for text, 50px for images |
| Multiple pages with same name | Confusing UI | Give each page a unique `name` |
| Complex gradients without `bgStyle` | Single gradient only | Use `fillGradient` for shapes, `bgStyle` for multi-layer |

# Resource Directories

This skill ships with supplementary files in subdirectories. 
Read the relevant files when you need inspiration, patterns, or ready-to-use components.

---

## `examples/` — Full Project Templates

Complete `.jsx` files you can use directly or adapt. Each file is a self-contained project.

| File | Format | Description |
|------|--------|-------------|
| `social-media-post.jsx` | 1080×1080 | Square Instagram/Facebook post with image, overlay, CTA |
| `youtube-thumbnail.jsx` | 1280×720 | Clickable thumbnail headline, watch button, duration |
| `instagram-story.jsx` | 1080×1920 | Vertical story with gradient, title, swipe-up, branding |
| `business-card.jsx` | 600×340 | Minimal business card with name, role, contact, logo |
| `event-poster.jsx` | 1080×1920 | Event flyer with date, venue, headline, ticket CTA |
| `web-banner.jsx` | 1200×600 | Marketing banner with headline, subtext, action button |
| `logo-design.jsx` | 500×500 | Brand mark with icon + logotype, multiple variants |

**Usage:** Load the whole file with `read` when the user's request matches the format, then adapt coordinates and content.

---

## `palettes/` — Color Palettes

Pre-curated color schemes organized by mood. Each file contains palettes with hex codes and usage guidance.

| File | Mood | Best for |
|------|------|----------|
| `dark-elegant.md` | Premium, luxury, night | Fashion, tech, events |
| `light-clean.md` | Minimal, airy, professional | Corporate, SaaS, editorial |
| `vibrant-playful.md` | Energetic, fun, youthful | Social media, gaming, entertainment |
| `minimal-corporate.md` | Trustworthy, restrained, B2B | Business, finance, consulting |

**Usage:** Search for "palette" in the file to find a scheme, then extract the hex values.

---

## `patterns/` — Background CSS Patterns

Pure-CSS pattern generators with parameters. Use for page backgrounds, shape fills, and decorative layers.

| File | Pattern | CSS Technique |
|------|---------|---------------|
| `checkerboard.md` | Checkerboard / chessboard | `repeating-conic-gradient` |
| `dots.md` | Polka dots / scatter | `radial-gradient` |
| `stripes.md` | Diagonal / horizontal / vertical stripes | `repeating-linear-gradient` |
| `grid.md` | Square grid / blueprint | Dual `repeating-linear-gradient` |
| `crosshatch.md` | Crosshatch / diagonal grid | Dual angled `repeating-linear-gradient` |

**Usage:** Load the pattern file, choose your colors and size, construct the full CSS value, and assign it to `bgStyle`.

---

## `typography/` — Font & Typography Guide

Curated font recommendations, pairings, and size hierarchies.

| File | Content |
|------|---------|
| `pairings.md` | 12 curated font pairings with mood notes |
| `google-fonts.md` | Top 50 Google Fonts organized by category (sans, serif, display, handwriting, mono) |
| `sizing.md` | Size hierarchies for different media (mobile, social, print, web) |

**Usage:** For any text element, pick a pairing from `pairings.md` and a size scale from `sizing.md`.

---

## `components/` — Reusable UI Component Templates

Pre-built JSX snippets for common UI elements. Each file is a pattern you compose into a page.

| File | Component | What it produces |
|------|-----------|-----------------|
| `card.jsx` | Content Card | Rounded rect + image + title + description |
| `cta-button.jsx` | Call-to-Action Button | Pill-shaped rect + centered text |
| `badge.jsx` | Badge / Tag | Small rounded rect with text |
| `section-header.jsx` | Section Header | Big title + thin subtitle + optional divider line |
| `overlay.jsx` | Image Overlay | Full-bleed image with dark gradient overlay |
| `divider.jsx` | Decorative Divider | Thin line shape, optionally with gradient |

**Usage:** Load the component file and customize coordinates, colors, and content to fit your page.

---

# Checklist — Before You Output

- [ ] Wrapped in `<project>`? 
- [ ] `<config>` is present with at minimum pageGap, showGrid, snapToGrid?
- [ ] All coordinates are multiples of 20?
- [ ] Text has 40px+ margin from page edges?
- [ ] fontFamily is specified on every text element?
- [ ] Anchors used on ALL text elements? (Never use raw `x` — use `leftAnchor` + `leftAnchorOffset` instead)
- [ ] Guide IDs are globally unique?
- [ ] fontSize is appropriate (never below 10px for text)?
- [ ] Double quotes used on all attribute values?
- [ ] Self-closing tags for empty elements?
- [ ] No markdown fences, no explanations, just JSX?
- [ ] bgColor is solid hex (no alpha)?
- [ ] If SVG, xmlns is included?
- [ ] Did you check `examples/`, `palettes/`, `patterns/`, `typography/`, `components/` for ready-made resources?
