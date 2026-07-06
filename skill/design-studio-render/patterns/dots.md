# Dots Pattern

```
radial-gradient(#COLOR 1.5px, transparent 1.5px) SPACINGpx SPACINGpx
```

## Parameters

| Variable | Description | Example |
|----------|-------------|---------|
| COLOR | Dot color | `#6c5ce7` |
| SPACING | Distance between dots + dot size | `20` |

For larger dots, increase the pixel radius:
```
radial-gradient(#COLOR 3px, transparent 3px) 30px 30px
```

## Examples

Small dots:
```
radial-gradient(#6c5ce7 1.5px, transparent 1.5px) 20px 20px
```

Large dots:
```
radial-gradient(#6c5ce7 4px, transparent 4px) 40px 40px
```

Dense dots:
```
radial-gradient(#a0a0b8 1px, transparent 1px) 10px 10px
```

## In Context

```jsx
<page width="1080" height="1080" bgColor="#0f0f1a"
  bgStyle="radial-gradient(#6c5ce7 2px, transparent 2px) 24px 24px">
  <text x="60" y="60" w="960" h="80">Dots Background</text>
</page>
```
