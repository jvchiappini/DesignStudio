# Checkerboard Pattern

```
repeating-conic-gradient(#COLOR1 0% 25%, #COLOR2 0% 50%) SIZEpx SIZEpx
```

## Parameters

| Variable | Description | Example |
|----------|-------------|---------|
| COLOR1 | Dark cell color | `#1a1a2e` |
| COLOR2 | Light cell color | `#16213e` |
| SIZE | Cell size in px | `40` |

## Examples

Classic dark checkerboard:
```
repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 40px 40px
```

Large cells:
```
repeating-conic-gradient(#2a2a40 0% 25%, #1a1a2e 0% 50%) 80px 80px
```

Colorful:
```
repeating-conic-gradient(#6c5ce7 0% 25%, #a29bfe 0% 50%) 30px 30px
```

Mini checkerboard (pixel-like):
```
repeating-conic-gradient(#333344 0% 25%, #222233 0% 50%) 10px 10px
```

## In Context

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 40px 40px, linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))">
  <text x="60" y="60" w="960" h="80">Checkerboard Background</text>
</page>
```
