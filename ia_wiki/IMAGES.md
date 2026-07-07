# Images — Referencia completa del elemento `<image>`

## Visión general

Las imágenes se representan con el elemento `<image>`. Es un elemento independiente (no un tipo de `<figure>`).

```jsx
<image x="100" y="100" w="500" h="500"
  src="https://picsum.photos/500/500" />
```

## Atributos de imagen

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `src` | string | REQUERIDO | URL de la imagen. Puede ser HTTP/HTTPS, data URI o blob URL |
| `x` | number | — | Posición izquierda en px |
| `y` | number | — | Posición superior en px |
| `w` | number | — | Ancho en px |
| `h` | number | — | Alto en px |

### Filtros CSS

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `imgBrightness` | number | 100 | Brillo en %. 0=negro total, 100=normal, 200=muy brillante |
| `imgContrast` | number | 100 | Contraste en %. 0=gris sólido, 100=normal, 200=alto contraste |
| `imgSaturation` | number | 100 | Saturación en %. 0=blanco y negro, 100=normal, 200=súper saturado |
| `imgBlur` | number | 0 | Desenfoque Gaussian en px. 5 = sutil, 15+=muy borroso |

### Recorte (crop)

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `cropX` | number | 0 | Desplazamiento horizontal del recorte desde la izquierda (px) |
| `cropY` | number | 0 | Desplazamiento vertical del recorte desde arriba (px) |
| `cropW` | number | w | Ancho del área de recorte (px). Por defecto igual al ancho del elemento |
| `cropH` | number | h | Alto del área de recorte (px). Por defecto igual al alto del elemento |

### Atributos visuales compartidos

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `rotation` | number | 0 | Rotación en grados. Positivo = horario |
| `opacity` | number | 1 | 0 (invisible) a 1 (opaco) |
| `zIndex` | number | auto | Orden de apilamiento |
| `mixBlendMode` | string | `"normal"` | multiply, screen, overlay, darken, lighten, color-dodge, etc. |
| `flipH` | bool | false | Espejo horizontal |
| `flipV` | bool | false | Espejo vertical |
| `locked` | bool | false | Bloquea edición |
| `hidden` | bool | false | Oculta elemento |
| `shadowColor` | string | `"#000000"` | Color de sombra (box-shadow) |
| `shadowBlur` | number | 0 | Difuminado de sombra en px |
| `shadowOffsetX` | number | 0 | Desplazamiento horizontal de sombra |
| `shadowOffsetY` | number | 4 | Desplazamiento vertical de sombra |
| `clipMask` | string | — | Clip CSS: `"circle:50% at center"`, `"polygon:50% 0%, 0% 100%, 100% 100%"` |
| `borderRadius` | number | 0 | Radio de esquina redondeada |

## Combinaciones de filtros

| Efecto | Atributos | Uso típico |
|--------|-----------|------------|
| **Monocromo / B&N** | `imgSaturation="0" imgContrast="110"` | Fotos artísticas, fondos sutiles |
| **Vibrante** | `imgSaturation="150" imgBrightness="110" imgContrast="120"` | Thumbnails, posts llamativos |
| **Moody / Oscuro** | `imgBrightness="60" imgContrast="130" imgSaturation="80"` | Fondos dramáticos, storytelling |
| **Sobre-expuesto** | `imgBrightness="140" imgContrast="80"` | Looks etéreos, dreamy |
| **Fondo borroso** | `imgBlur="10" imgBrightness="80"` | Capas de fondo, depth of field |
| **Alto contraste** | `imgContrast="160" imgSaturation="130"` | Posters, portadas |
| **Tono frío** | `imgSaturation="70" imgBrightness="90"` | Looks invernales, técnicos |

## Overlays y superposiciones

Coloca un shape semitransparente encima de la imagen con `mixBlendMode`:

```jsx
<image x="0" y="0" w="1080" h="1920" src="https://picsum.photos/1080/1920"
  imgBrightness="70" imgSaturation="80" />
<shape x="0" y="0" w="1080" h="1920" shapeKind="rect"
  backgroundColor="#667eea" opacity="0.3" mixBlendMode="multiply" />
<shape x="0" y="0" w="1080" h="1920" shapeKind="rect"
  fillGradient="linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)" />
```

Overlay de color con degradado (útil para legibilidad de texto):
```jsx
<image x="0" y="0" w="1080" h="1920"
  src="https://picsum.photos/1080/1920"
  imgBrightness="60" />
<shape x="0" y="0" w="1080" h="1920" shapeKind="rect"
  fillGradient="linear-gradient(0deg, rgba(15,15,26,0.9) 0%, transparent 50%, transparent 100%)" />
```

## Imagen de fondo vía bgStyle

También puedes usar imágenes como fondo de página:

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="url(https://picsum.photos/1080/1920) center/cover no-repeat" />
```

Con overlay de degradado sobre la imagen de fondo:
```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 100%),
           url(https://picsum.photos/1080/1920) center/cover no-repeat" />
```

## Placeholders con picsum.photos

Usa `https://picsum.photos/ANCHO/ALTO` para imágenes placeholder de cualquier tamaño:

```jsx
<image x="60" y="60" w="960" h="540"
  src="https://picsum.photos/960/540" />
```

Para una imagen diferente cada vez (evitar caché), añade `?random=N`:
```jsx
<image x="60" y="60" w="400" h="400"
  src="https://picsum.photos/400/400?random=1" />
<image x="500" y="60" w="400" h="400"
  src="https://picsum.photos/400/400?random=2" />
```

## Ejemplos

### Imagen con bordes redondeados
```jsx
<image x="60" y="60" w="960" h="540"
  src="https://picsum.photos/960/540"
  borderRadius="24" />
```

### Imagen con recorte circular (clipMask)
```jsx
<image x="100" y="100" w="300" h="300"
  src="https://picsum.photos/300/300"
  clipMask="circle:50% at center" />
```

### Imagen con recorte poligonal
```jsx
<image x="100" y="100" w="300" h="300"
  src="https://picsum.photos/300/300"
  clipMask="polygon:50% 0%, 0% 100%, 100% 100%" />
```

### Imagen full-bleed como fondo de página
```jsx
<page width="1080" height="1920" bgColor="#0f0f1a">
  <image x="0" y="0" w="1080" h="1920"
    src="https://picsum.photos/1080/1920"
    imgBrightness="50" imgSaturation="80" />
  <text x="60" y="800" w="960" h="120" fontSize="64" fontWeight="700"
    color="#ffffff" textAlign="center"
    textStrokeColor="#000000" textStrokeWidth="3">
    Texto sobre imagen
  </text>
</page>
```

### Galería de imágenes (grid)
```jsx
<project>
  <config />
  <page width="1080" height="1920" bgColor="#0f0f1a">
    <image x="60" y="60" w="480" h="480"
      src="https://picsum.photos/480/480?random=1" />
    <image x="560" y="60" w="480" h="480"
      src="https://picsum.photos/480/480?random=2" />
    <image x="60" y="560" w="480" h="480"
      src="https://picsum.photos/480/480?random=3" />
    <image x="560" y="560" w="480" h="480"
      src="https://picsum.photos/480/480?random=4" />
  </page>
</project>
```

### Imagen con sombra
```jsx
<image x="100" y="100" w="400" h="400"
  src="https://picsum.photos/400/400"
  shadowColor="#000000" shadowBlur="30" shadowOffsetX="10" shadowOffsetY="10" />
```

### Imagen con espejo (flip)
```jsx
<image x="100" y="100" w="400" h="400"
  src="https://picsum.photos/400/400"
  flipH="true" />
```

### Tarjeta con imagen
```jsx
<shape x="60" y="60" w="460" h="520" shapeKind="rect"
  backgroundColor="#1e1e2e" borderRadius="16" />
<image x="80" y="80" w="420" h="280"
  src="https://picsum.photos/420/280"
  imgBrightness="90" imgSaturation="120"
  borderRadius="12" />
<text x="80" y="380" w="420" h="40" fontSize="20" fontWeight="700"
  color="#ffffff">Título de tarjeta</text>
<text x="80" y="420" w="420" h="60" fontSize="13" color="#a0a0b0"
  verticalAlign="top">Descripción aquí.</text>
```
