# Stripes Pattern

```
repeating-linear-gradient(ANGLEdeg, #COLOR1, #COLOR1 WIDTHpx, #COLOR2 WIDTHpx, #COLOR2 TOTALpx)
```

## Parameters

| Variable | Description | Example |
|----------|-------------|---------|
| ANGLE | Stripe angle in degrees | `45` |
| COLOR1 | First stripe color | `#6c5ce7` |
| COLOR2 | Second stripe color | `#2d1b69` |
| WIDTH | Stripe 1 width in px | `2` |
| TOTAL | Total pattern width (stripe1 + stripe2) | `8` |

## Examples

Diagonal stripes (45deg):
```
repeating-linear-gradient(45deg, #6c5ce7, #6c5ce7 2px, #2d1b69 2px, #2d1b69 8px)
```

Horizontal stripes:
```
repeating-linear-gradient(0deg, #e94560, #e94560 3px, #2d1b69 3px, #2d1b69 12px)
```

Vertical stripes:
```
repeating-linear-gradient(90deg, #3b82f6, #3b82f6 2px, transparent 2px, transparent 20px)
```

Wide stripes:
```
repeating-linear-gradient(45deg, #1a1a2e, #1a1a2e 20px, #16213e 20px, #16213e 40px)
```

## In Context

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-linear-gradient(45deg, #1a1a2e, #1a1a2e 2px, #16213e 2px, #16213e 8px), linear-gradient(135deg, rgba(108,92,231,0.3), rgba(233,69,96,0.3))">
  <text x="60" y="60" w="960" h="80">Stripes Background</text>
</page>
```
