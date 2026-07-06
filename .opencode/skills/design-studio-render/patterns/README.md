# Background CSS Patterns

Pure-CSS pattern generators. No images required. Use these values in the `bgStyle` attribute of `<page>` or `<shape>` elements.

## How to Use

1. Pick a pattern file
2. Choose your colors and size
3. Construct the full CSS value
4. Assign to `bgStyle`

## Pattern Files

| File | CSS Technique | Parameters |
|------|---------------|------------|
| `checkerboard.md` | `repeating-conic-gradient` | 2 colors + cell size |
| `dots.md` | `radial-gradient` | 1 color + spacing + dot size |
| `stripes.md` | `repeating-linear-gradient` | 2 colors + angle + widths |
| `grid.md` | dual `repeating-linear-gradient` | 1 color + cell size + line width |
| `crosshatch.md` | dual angled `repeating-linear-gradient` | 1 color + cell size + line width |

## Combining Patterns with Other Layers

Patterns work as the FIRST (bottom) layer in `bgStyle`. Combine with gradients or images:

```
bgStyle="PATTERN_CSS, linear-gradient(135deg, rgba(COLOR1,0.5), rgba(COLOR2,0.5))"
bgStyle="PATTERN_CSS, url(IMAGE_URL) center/cover no-repeat"
bgStyle="PATTERN_CSS, linear-gradient(...), url(...) center/cover no-repeat"
```

## Full Page Example

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 40px 40px">
  <text x="60" y="60" w="960" h="80">Content</text>
</page>
```
