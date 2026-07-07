# Text — Referencia completa del elemento `<text>`

## Atributos del `<text>`

### Posición y tamaño

| Atributo | Tipo | Default | Obligatorio | Descripción |
|----------|------|---------|-------------|-------------|
| `x` | number | — | Sí | Posición izquierda en px desde el borde izquierdo de la página |
| `y` | number | — | Sí | Posición superior en px desde el borde superior de la página |
| `w` | number | — | Sí | Ancho de la caja de texto en px |
| `h` | number | — | Sí | Alto de la caja de texto en px |

### Contenido

El contenido textual va como hijo del elemento `<text>`, no como atributo.

```jsx
<text x="100" y="100" w="400" h="80" fontSize="32" color="#ffffff">
  Contenido del texto aquí
</text>
```

Para saltos de línea, usa saltos de línea literales:
```jsx
<text x="100" y="100" w="400" h="120" fontSize="32">
  Línea uno
  Línea dos
  Línea tres
</text>
```

### Tipografía

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `fontSize` | number | 32 | Tamaño de fuente en px. Mínimo 8. |
| `fontFamily` | string | `"system-ui, sans-serif"` | CSS font-family. Recomendadas: `"Poppins, sans-serif"`, `"Inter, sans-serif"`, `"Oswald, sans-serif"`, `"Playfair Display, serif"`, `"Montserrat, sans-serif"`, `"Roboto, sans-serif"`, `"system-ui, sans-serif"` |
| `fontWeight` | number | 400 | Peso: 100 (thin), 300 (light), 400 (normal), 500 (medium), 600 (semi-bold), 700 (bold), 800 (extra-bold), 900 (black) |
| `fontStyle` | string | `"normal"` | `"normal"` o `"italic"` |
| `color` | string | `"#ffffff"` | Color del texto en hex. Sobre fondos oscuros usa `#ffffff`. Sobre fondos claros usa `#1a1a2e`. |

### Alineación

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `textAlign` | string | `"center"` | `"left"`, `"center"`, `"right"` |
| `verticalAlign` | string | `"middle"` | `"top"`, `"middle"`, `"bottom"` |

### Espaciado

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `letterSpacing` | number | 0 | Interletraje en px. Usa 2-4 para títulos, 6-10 para efecto expandido. |
| `lineHeight` | number | 1.2 | Multiplicador de altura de línea. 1.0 apretado, 1.5 cómodo, 2.0 suelto. |
| `wordSpacing` | number | 0 | Espaciado entre palabras en px. |
| `textIndent` | number | 0 | Sangría de primera línea en px. |

### Transformación y decoración

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `textTransform` | string | `"none"` | `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` |
| `textDecoration` | string | `"none"` | `"none"`, `"underline"`, `"line-through"` |
| `fontVariant` | string | `"normal"` | `"normal"`, `"small-caps"` |

### Borde de texto (stroke)

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `textStrokeColor` | string | — | Color del borde en cada letra. Mejora legibilidad sobre fondos complejos. |
| `textStrokeWidth` | number | 0 | Grosor en px. 1-3 sutil, 4+ bold. |

Uso típico para legibilidad sobre imágenes:
```jsx
<text x="60" y="60" w="960" h="120" fontSize="64" fontWeight="700"
  color="#ffffff" textAlign="center"
  textStrokeColor="#000000" textStrokeWidth="3">
  Texto sobre imagen
</text>
```

### Fondo de texto

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `textBgColor` | string | — | Color de fondo detrás del texto. Usa hex con alpha: `"#00000044"` para semitransparente. |

### Degradado de texto

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `textGradient` | string | CSS gradient completo. Ej: `"linear-gradient(135deg, #ff6b6b, #4ecdc4)"` |
| `textGradientColors` | string | Colores separados por coma para UI: `"#ff6b6b,#4ecdc4"` |

```jsx
<text x="100" y="100" w="500" h="80" fontSize="48" fontWeight="800"
  textAlign="center"
  textGradient="linear-gradient(135deg, #ff6b6b, #4ecdc4)">
  Texto Degradado
</text>
```

### Sombra de texto

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `shadowColor` | string | `"#000000"` | Color de la sombra |
| `shadowBlur` | number | 0 | Difuminado en px |
| `shadowOffsetX` | number | 0 | Desplazamiento horizontal en px |
| `shadowOffsetY` | number | 4 | Desplazamiento vertical en px |

Efectos comunes:
- **Glow**: `shadowColor="#6c5ce7" shadowBlur="30" shadowOffsetY="0"`
- **Profundidad**: `shadowColor="#000000" shadowBlur="15" shadowOffsetX="5" shadowOffsetY="5"`
- **Sombra suave**: `shadowColor="rgba(0,0,0,0.3)" shadowBlur="20" shadowOffsetY="8"`

### Sombras múltiples

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `textShadows` | string | JSON string con array de sombras. Cada sombra tiene: color, blur, offsetX, offsetY. Reemplaza la sombra simple cuando está presente. |

```jsx
<text x="100" y="100" w="500" h="80" fontSize="44" fontWeight="900"
  color="#ffffff" textAlign="center"
  textShadows='[{"color":"#6c5ce7","blur":25,"offsetX":0,"offsetY":0},{"color":"#e94560","blur":15,"offsetX":5,"offsetY":5}]'>
  MÚLTIPLES SOMBRAS
</text>
```

### Padding interno

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `textPaddingLeft` | number | 4 | Padding interno izquierdo en px |
| `textPaddingRight` | number | 4 | Padding interno derecho en px |
| `textPaddingTop` | number | 4 | Padding interno superior en px |
| `textPaddingBottom` | number | 4 | Padding interno inferior en px |

```jsx
<text x="60" y="60" w="400" h="120" fontSize="20" color="#ffffff"
  textAlign="left" verticalAlign="top"
  textBgColor="#1e1e2e"
  textPaddingLeft="24" textPaddingRight="16"
  textPaddingTop="16" textPaddingBottom="12">
  Texto con padding asimétrico
</text>
```

### Outline externo

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `textOutlineColor` | string | — | Color del contorno decorativo alrededor de la caja de texto |
| `textOutlineWidth` | number | 0 | Grosor del outline en px. 0 = desactivado. |

```jsx
<text x="100" y="100" w="400" h="60" fontSize="32" fontWeight="700"
  color="#ffffff" textAlign="center"
  textOutlineColor="#6c5ce7" textOutlineWidth="4">
  TEXTO CON OUTLINE
</text>
```

### Escala de caracteres

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `charScaleX` | number | 100 | Estiramiento horizontal en %. 200 = doble ancho |
| `charScaleY` | number | 100 | Estiramiento vertical en %. 200 = doble alto |

### Desbordamiento

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `textOverflow` | string | `"hidden"` | `"hidden"` (recorta), `"visible"` (desborda), `"ellipsis"` (corta con ...), `"clip"` (recorta) |

```jsx
<text x="100" y="100" w="250" h="40" fontSize="16" color="#ffffff"
  textOverflow="ellipsis">
  Texto muy largo que se cortará con puntos suspensivos porque no cabe en 250px
</text>
```

### Sombra de elementos (compartida con figures)

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `shadowColor` | string | `"#000000"` | Color de sombra (text-shadow para texto) |
| `shadowBlur` | number | 0 | Difuminado en px |
| `shadowOffsetX` | number | 0 | Desplazamiento horizontal en px |
| `shadowOffsetY` | number | 4 | Desplazamiento vertical en px |

### Atributos comunes compartidos

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `rotation` | number | 0 | Rotación en grados. Positivo = horario |
| `opacity` | number | 1 | 0 (invisible) a 1 (opaco). 0.3-0.5 para marcas de agua |
| `zIndex` | number | auto | Orden de apilamiento. Mayor = encima |
| `mixBlendMode` | string | `"normal"` | Modo de fusión CSS: multiply, screen, overlay, darken, lighten, etc. |
| `flipH` | bool | false | Espejo horizontal |
| `flipV` | bool | false | Espejo vertical |
| `locked` | bool | false | Bloquea edición |
| `hidden` | bool | false | Oculta el elemento |

## Ejemplos de texto

### Texto básico centrado
```jsx
<text x="200" y="300" w="680" h="100" fontSize="64" fontWeight="700"
  fontFamily="Inter, sans-serif" color="#ffffff" textAlign="center">
  Título Principal
</text>
```

### Texto con stroke (legible sobre imágenes)
```jsx
<text x="60" y="400" w="960" h="120" fontSize="64" fontWeight="900"
  color="#ffffff" textAlign="center"
  textStrokeColor="#000000" textStrokeWidth="3"
  shadowColor="#000000" shadowBlur="20" shadowOffsetY="8">
  OVERLAY TEXT
</text>
```

### Texto con degradado + glow
```jsx
<text x="60" y="400" w="960" h="120" fontSize="64" fontWeight="900"
  color="#ffffff" textAlign="center"
  textGradient="linear-gradient(135deg, #ff6b6b, #4ecdc4)"
  shadowColor="#4ecdc4" shadowBlur="30" shadowOffsetY="0">
  GRADIENT GLOW
</text>
```

### Texto con padding y fondo
```jsx
<text x="60" y="60" w="500" h="100" fontSize="28" fontWeight="600"
  color="#ffffff" textAlign="left" verticalAlign="middle"
  textBgColor="#6c5ce7"
  textPaddingLeft="24" textPaddingRight="24"
  textPaddingTop="12" textPaddingBottom="12">
  Botón con padding
</text>
```

### Título cinematográfico
```jsx
<text x="60" y="400" w="960" h="120" fontSize="64" fontWeight="900"
  color="#ffffff" textAlign="center"
  textOutlineColor="#6c5ce7" textOutlineWidth="3"
  textShadows='[{"color":"#6c5ce7","blur":30,"offsetX":0,"offsetY":0},{"color":"#e94560","blur":15,"offsetX":6,"offsetY":6}]'
  letterSpacing="6" textTransform="uppercase">
  TÍTULO ÉPICO
</text>
```

### Texto vertical con versalitas
```jsx
<text x="100" y="100" w="60" h="400" fontSize="24"
  fontFamily="Playfair Display, serif" color="#ffffff"
  textAlign="center" verticalAlign="middle"
  fontVariant="small-caps" lineHeight="2">
  Texto Vertical
</text>
```

### Tarjeta con texto
```jsx
<text x="80" y="520" w="420" h="40" fontSize="18" fontWeight="700"
  color="#ffffff">Título de tarjeta</text>
<text x="80" y="560" w="420" h="60" fontSize="13" color="#a0a0b0"
  verticalAlign="top">Descripción de la tarjeta aquí.</text>
```
