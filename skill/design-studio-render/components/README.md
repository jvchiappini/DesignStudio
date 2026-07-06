# Reusable UI Components

Pre-built JSX snippets for common UI elements. Each file is a pattern you compose into a page.

## How to Use

1. Load the component file
2. Customize coordinates, colors, text, and content
3. Place into your `<page>` layout
4. Adjust `x`, `y` to position correctly

## Adjusting Coordinates

Each component has placeholder coordinates. When composing a page:

- Add 40px+ margins from page edges
- Stack components vertically with 20-60px gaps
- Use `x` and `y` to position relative to other elements

## Available Components

| File | What it produces | Default Size |
|------|-----------------|--------------|
| `card.jsx` | Rounded rect + image + title + description | 460×420 |
| `cta-button.jsx` | Pill-shaped rect + centered text | 280×56 |
| `badge.jsx` | Small rounded rect with text | 120×32 |
| `section-header.jsx` | Big title + thin subtitle + divider line | 700×140 |
| `overlay.jsx` | Full-bleed image with dark gradient overlay | full page |
| `divider.jsx` | Thin line shape, optionally with gradient | 200×2 |
