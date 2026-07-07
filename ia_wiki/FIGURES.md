# Shapes y SVG — Referencia completa

## `<shape>` — Elemento de forma geométrica

### shapeKind

| Valor | Descripción | bgStyle | border | borderRadius |
|-------|-------------|---------|--------|--------------|
| `rect` | Rectángulo | Sí | Sí | Sí |
| `circle` | Círculo | No | Sí | No |
| `triangle` | Triángulo | No | No | No |
| `star` | Estrella | No | No | No |
| `line` | Línea | No | Sí | No |

### Atributos de shape

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `shapeKind` | string | `"rect"` | `"rect"`, `"circle"`, `"triangle"`, `"star"`, `"line"` |
| `x` | number | — | Posición izquierda en px |
| `y` | number | — | Posición superior en px |
| `w` | number | — | Ancho en px |
| `h` | number | — | Alto en px |
| `backgroundColor` | string | `"#cccccc"` | Color de relleno en hex |
| `fillGradient` | string | — | CSS gradient para relleno. Ej: `"linear-gradient(90deg, #ff6b6b, #4ecdc4)"` |
| `fillGradientColors` | string | — | Colores separados por coma: `"#ff6b6b,#4ecdc4"` |
| `borderColor` | string | — | Color del borde |
| `borderWidth` | number | 0 | Grosor del borde en px |
| `borderStyle` | string | `"solid"` | `"solid"`, `"dashed"`, `"dotted"` |
| `borderRadius` | number | 0 | Radio de esquina en px (solo rect) |
| `borderRadiusTL` | number | — | Radio esquina superior izquierda |
| `borderRadiusTR` | number | — | Radio esquina superior derecha |
| `borderRadiusBR` | number | — | Radio esquina inferior derecha |
| `borderRadiusBL` | number | — | Radio esquina inferior izquierda |
| `clipMask` | string | — | Clip CSS: `"circle:50% at center"`, `"polygon:50% 0%, 0% 100%, 100% 100%"` |
| `bgStyle` | string | — | CSS background multicapa |
| `layout` | string | — | JSON string con auto-layout |
| `rotation` | number | 0 | Rotación en grados |
| `opacity` | number | 1 | 0-1 |
| `zIndex` | number | auto | Orden de apilamiento |
| `mixBlendMode` | string | `"normal"` | multiply, screen, overlay, etc. |
| `flipH` | bool | false | Espejo horizontal |
| `flipV` | bool | false | Espejo vertical |
| `locked` | bool | false | Bloquea edición |
| `hidden` | bool | false | Oculta elemento |
| `shadowColor` | string | `"#000000"` | Color de sombra (box-shadow) |
| `shadowBlur` | number | 0 | Difuminado de sombra en px |
| `shadowOffsetX` | number | 0 | Desplazamiento horizontal de sombra |
| `shadowOffsetY` | number | 4 | Desplazamiento vertical de sombra |

### Efectos de sombra

- **Glow**: `shadowColor="#6c5ce7" shadowBlur="30" shadowOffsetY="0"`
- **Profundidad**: `shadowColor="#000000" shadowBlur="15" shadowOffsetX="5" shadowOffsetY="5"`
- **Sombra suave**: `shadowColor="rgba(0,0,0,0.3)" shadowBlur="20" shadowOffsetY="8"`

### Auto Layout

Atributo `layout` acepta JSON string:

```json
{
  "direction": "row" | "column",
  "gap": number,
  "padding": number,
  "align": "flex-start" | "center" | "flex-end" | "stretch",
  "justify": "flex-start" | "center" | "flex-end" | "space-between" | "space-around",
  "wrap": bool
}
```

```jsx
<shape x="50" y="50" w="700" h="200" shapeKind="rect"
  backgroundColor="#2a2a3e"
  layout='{"direction":"row","gap":16,"padding":20,"align":"center","justify":"space-around","wrap":false}' />
```

## `<svg>` — Elemento SVG

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `svgContent` | string | REQUIRED. Markup `<svg>` completo. Debe incluir `xmlns` y `viewBox`. |

```jsx
<svg x="100" y="100" w="80" h="80"
  svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>' />
```

## Ejemplos

### Rectángulo con borde punteado
```jsx
<shape x="100" y="100" w="300" h="200" shapeKind="rect"
  backgroundColor="#1e1e2e"
  borderColor="#6c5ce7" borderWidth="3" borderStyle="dashed" />
```

### Rectángulo con bordes redondeados individuales
```jsx
<shape x="50" y="50" w="300" h="200" shapeKind="rect"
  backgroundColor="#4f46e5"
  borderColor="#ffffff" borderWidth="2"
  borderRadiusTL="30" borderRadiusTR="0"
  borderRadiusBR="30" borderRadiusBL="0" />
```

### Círculo con glow
```jsx
<shape x="100" y="100" w="200" h="200" shapeKind="circle"
  backgroundColor="#e94560"
  shadowColor="#e94560" shadowBlur="30" />
```

### Rectángulo con degradado de relleno
```jsx
<shape x="100" y="100" w="400" h="400" shapeKind="rect"
  fillGradient="linear-gradient(135deg, #667eea, #764ba2)"
  borderRadius="20" />
```

### Círculo con degradado radial
```jsx
<shape x="100" y="100" w="400" h="400" shapeKind="circle"
  fillGradient="radial-gradient(circle at center, #43e97b, #38f9d7)" />
```

### Clip mask círculo
```jsx
<shape x="100" y="100" w="300" h="300" shapeKind="rect"
  backgroundColor="#6c5ce7"
  clipMask="circle:50% at center" />
```

### Clip mask polígono (triángulo)
```jsx
<shape x="100" y="100" w="300" h="300" shapeKind="rect"
  backgroundColor="#e94560"
  clipMask="polygon:50% 0%, 0% 100%, 100% 100%" />
```

### Tarjeta (shape + texto + imagen)
```jsx
<shape x="60" y="200" w="460" h="500" shapeKind="rect"
  backgroundColor="#1e1e2e" borderRadius="16" />
<image x="80" y="220" w="420" h="280"
  src="https://picsum.photos/420/280" imgBrightness="90" imgSaturation="120" />
<text x="80" y="520" w="420" h="40" fontSize="18" fontWeight="700"
  color="#ffffff">Título de tarjeta</text>
<text x="80" y="560" w="420" h="60" fontSize="13" color="#a0a0b0"
  verticalAlign="top">Descripción de tarjeta aquí.</text>
```

### CTA Button (shape + texto)
```jsx
<shape x="390" y="620" w="300" h="56" shapeKind="rect"
  backgroundColor="#6c5ce7" borderRadius="28" />
<text x="390" y="620" w="300" h="56" fontSize="18" fontWeight="700"
  color="#ffffff" textAlign="center" verticalAlign="middle"
  letterSpacing="2" textTransform="uppercase">
  BOTÓN CTA
</text>
```

### Línea divisoria
```jsx
<shape x="60" y="200" w="960" h="4" shapeKind="line"
  backgroundColor="#6c5ce7" opacity="0.5" />
```

### Estrella decorativa
```jsx
<shape x="100" y="100" w="100" h="100" shapeKind="star"
  backgroundColor="#ffd700" />
```
