# Grid Pattern

Uses two overlapping `repeating-linear-gradient` functions for horizontal + vertical lines.

```
repeating-linear-gradient(0deg, transparent, transparent SIZEx, #COLOR SIZEx, #COLOR calc(SIZE + LINE)),
repeating-linear-gradient(90deg, transparent, transparent SIZEx, #COLOR SIZEx, #COLOR calc(SIZE + LINE))
```

## Parameters

| Variable | Description | Example |
|----------|-------------|---------|
| SIZE | Cell size (subtract line width) | `19` |
| LINE | Line width in px | `1` |
| COLOR | Line color | `#2a2a40` |

## Examples

Blueprint grid:
```
repeating-linear-gradient(0deg, transparent, transparent 19px, #2a2a40 19px, #2a2a40 20px),
repeating-linear-gradient(90deg, transparent, transparent 19px, #2a2a40 19px, #2a2a40 20px)
```

Wide grid:
```
repeating-linear-gradient(0deg, transparent, transparent 39px, #333355 39px, #333355 40px),
repeating-linear-gradient(90deg, transparent, transparent 39px, #333355 39px, #333355 40px)
```

Mini grid:
```
repeating-linear-gradient(0deg, transparent, transparent 9px, #1a1a2e 9px, #1a1a2e 10px),
repeating-linear-gradient(90deg, transparent, transparent 9px, #1a1a2e 9px, #1a1a2e 10px)
```

## In Context

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-linear-gradient(0deg, transparent, transparent 19px, #2a2a40 19px, #2a2a40 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #2a2a40 19px, #2a2a40 20px)">
  <text x="60" y="60" w="960" h="80">Grid Background</text>
</page>
```
