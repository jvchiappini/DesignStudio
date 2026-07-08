# Shapes y SVG — Referencia completa

## tipos-de-shape

| Valor | Descripción | bgStyle | border | borderRadius |
|-------|-------------|---------|--------|--------------| 
| `rect` | Rectángulo | Sí | Sí | Sí |
| `circle` | Círculo | No | Sí | No |
| `triangle` | Triángulo | No | No | No |
| `star` | Estrella | No | No | No |
| `line` | Línea | No | Sí | No |

---

## atributos-del-shape

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

---

## efectos-de-sombra

- **Glow**: `shadowColor="#6c5ce7" shadowBlur="30" shadowOffsetY="0"`
- **Profundidad**: `shadowColor="#000000" shadowBlur="15" shadowOffsetX="5" shadowOffsetY="5"`
- **Sombra suave**: `shadowColor="rgba(0,0,0,0.3)" shadowBlur="20" shadowOffsetY="8"`
- **Glow rojo**: `shadowColor="#e94560" shadowBlur="40" shadowOffsetY="0"`
- **Glow dorado**: `shadowColor="#ffd700" shadowBlur="25" shadowOffsetY="0"`

---

## auto-layout

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

---

## elemento-svg

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `svgContent` | string | REQUIRED. Markup `<svg>` completo. Debe incluir `xmlns` y `viewBox`. |

```jsx
<svg x="100" y="100" w="80" h="80"
  svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>' />
```

---

## ejemplos-shapes-basicos

### Rectángulo con borde punteado
```jsx
<shape x="100" y="100" w="300" h="200" shapeKind="rect"
  backgroundColor="#1e1e2e"
  borderColor="#6c5ce7" borderWidth="3" borderStyle="dashed" />
```

### Rectángulo con bordes asimétricos
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

### Línea divisoria
```jsx
<shape x="60" y="200" w="960" h="4" shapeKind="line"
  backgroundColor="#6c5ce7" opacity="0.5" />
```

---

## tarjeta-estandar

Card completa con imagen, texto, CTA:
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

---

## cta-button

Botón CTA (shape relleno + shape outline):
```jsx
<!-- Botón primario -->
<shape x="390" y="620" w="300" h="56" shapeKind="rect"
  backgroundColor="#6c5ce7" borderRadius="28" />
<text x="390" y="620" w="300" h="56" fontSize="18" fontWeight="700"
  color="#ffffff" textAlign="center" verticalAlign="middle"
  letterSpacing="2" textTransform="uppercase">
  BOTÓN CTA
</text>

<!-- Botón outline secundario -->
<shape x="390" y="700" w="300" h="56" shapeKind="rect"
  backgroundColor="transparent"
  borderColor="rgba(255,255,255,0.4)" borderWidth="1.5" borderRadius="28" />
<text x="390" y="700" w="300" h="56" fontSize="18" fontWeight="600"
  color="#ffffff" textAlign="center" verticalAlign="middle"
  letterSpacing="2" textTransform="uppercase">
  VER MÁS
</text>
```

---

## neon-glow-shape

Efecto neón con doble sombra:
```jsx
<!-- Borde brillante + sombra de glow -->
<shape x="200" y="200" w="680" h="80" shapeKind="rect"
  backgroundColor="transparent"
  borderColor="#00ffcc" borderWidth="2" borderRadius="8"
  shadowColor="#00ffcc" shadowBlur="20" shadowOffsetY="0" />
<text x="200" y="200" w="680" h="80" fontSize="32" fontWeight="700"
  fontFamily="Inter, sans-serif" color="#00ffcc"
  textAlign="center" verticalAlign="middle"
  shadowColor="#00ffcc" shadowBlur="15" shadowOffsetY="0">
  GLOW TEXT
</text>
```

---

## progress-bar

Barra de progreso (track + fill):
```jsx
<!-- Track fondo -->
<shape x="80" y="400" w="920" h="8" shapeKind="rect"
  backgroundColor="rgba(255,255,255,0.1)" borderRadius="4" />
<!-- Fill de progreso (p.ej. 70%) -->
<shape x="80" y="400" w="644" h="8" shapeKind="rect"
  fillGradient="linear-gradient(90deg, #6c5ce7, #e94560)" borderRadius="4" />
```

---

## avatar-con-ring

Avatar circular con anillo de color:
```jsx
<!-- Ring exterior -->
<shape x="196" y="196" w="248" h="248" shapeKind="circle"
  fillGradient="linear-gradient(135deg, #6c5ce7, #e94560)" />
<!-- Separador blanco -->
<shape x="200" y="200" w="240" h="240" shapeKind="circle"
  backgroundColor="#0f0f1a" />
<!-- Imagen de avatar -->
<image x="206" y="206" w="228" h="228"
  src="https://picsum.photos/228/228?random=1"
  clipMask="circle:50% at center" />
```

---

## grid-iconos

Iconos SVG en grid 3×2:
```jsx
<!-- Fila 1 -->
<shape x="80" y="300" w="80" h="80" shapeKind="circle" backgroundColor="#1e1e2e" />
<svg x="100" y="320" w="40" h="40"
  svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6c5ce7"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>' />

<shape x="200" y="300" w="80" h="80" shapeKind="circle" backgroundColor="#1e1e2e" />
<svg x="220" y="320" w="40" h="40"
  svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e94560"><circle cx="12" cy="12" r="10"/></svg>' />

<shape x="320" y="300" w="80" h="80" shapeKind="circle" backgroundColor="#1e1e2e" />
<svg x="340" y="320" w="40" h="40"
  svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4ecdc4"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' />
```

---

## forma-3d-card-efecto

Efecto de tarjeta con pseudo-profundidad:
```jsx
<!-- Sombra/fondo de profundidad -->
<shape x="76" y="216" w="460" h="500" shapeKind="rect"
  backgroundColor="#3b2d7e" borderRadius="16" />
<!-- Card principal -->
<shape x="60" y="200" w="460" h="500" shapeKind="rect"
  backgroundColor="#1e1e2e" borderRadius="16"
  shadowColor="rgba(0,0,0,0.4)" shadowBlur="20" shadowOffsetY="8" />
```

---

## clip-mask-avanzado

Formas con clip-path avanzado:

```jsx
<!-- Hexágono -->
<shape x="200" y="200" w="300" h="300" shapeKind="rect"
  backgroundColor="#6c5ce7"
  clipMask="polygon:50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%" />

<!-- Rombo -->
<shape x="200" y="200" w="300" h="300" shapeKind="rect"
  backgroundColor="#e94560"
  clipMask="polygon:50% 0%, 100% 50%, 50% 100%, 0% 50%" />

<!-- Flecha derecha -->
<shape x="100" y="200" w="400" h="100" shapeKind="rect"
  backgroundColor="#4ecdc4"
  clipMask="polygon:0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%" />

<!-- Pentágono -->
<shape x="200" y="200" w="300" h="300" shapeKind="rect"
  backgroundColor="#ffd700"
  clipMask="polygon:50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%" />
```
