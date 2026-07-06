# Crosshatch Pattern

Uses two angled `repeating-linear-gradient` functions for a diagonal crosshatch effect.

```
repeating-linear-gradient(45deg, transparent, transparent SIZEpx, #COLOR SIZEpx, #COLOR calc(SIZEpx + 1px)),
repeating-linear-gradient(-45deg, transparent, transparent SIZEpx, #COLOR SIZEpx, #COLOR calc(SIZEpx + 1px))
```

## Parameters

| Variable | Description | Example |
|----------|-------------|---------|
| SIZE | Spacing between lines in px | `20` |
| COLOR | Line color | `#2a2a40` |

## Examples

Standard crosshatch:
```
repeating-linear-gradient(45deg, transparent, transparent 19px, #2a2a40 19px, #2a2a40 20px),
repeating-linear-gradient(-45deg, transparent, transparent 19px, #2a2a40 19px, #2a2a40 20px)
```

Dense crosshatch:
```
repeating-linear-gradient(45deg, transparent, transparent 9px, #333355 9px, #333355 10px),
repeating-linear-gradient(-45deg, transparent, transparent 9px, #333355 9px, #333355 10px)
```

Wide crosshatch:
```
repeating-linear-gradient(45deg, transparent, transparent 29px, #2a2a40 29px, #2a2a40 30px),
repeating-linear-gradient(-45deg, transparent, transparent 29px, #2a2a40 29px, #2a2a40 30px)
```

## In Context

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-linear-gradient(45deg, transparent, transparent 19px, #2a2a40 19px, #2a2a40 20px), repeating-linear-gradient(-45deg, transparent, transparent 19px, #2a2a40 19px, #2a2a40 20px), linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))">
  <text x="60" y="60" w="960" h="80">Crosshatch Background</text>
</page>
```
