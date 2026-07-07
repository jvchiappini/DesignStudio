# Page — Referencia completa del elemento `<page>`

## Atributos del `<page>`

| Atributo | Tipo | Default | Obligatorio | Descripción |
|----------|------|---------|-------------|-------------|
| `width` | number | — | Sí | Ancho en px. Define el tamaño horizontal del lienzo. |
| `height` | number | — | Sí | Alto en px. Define el tamaño vertical del lienzo. |
| `bgColor` | string | `"#ffffff"` | No | Color de fondo en hex. Usar colores sólidos sin alpha. Para fondos oscuros usa `#0f0f1a`, `#1a1a2e`, `#0a0a23`. Para claros usa `#f8f9fa`, `#ffffff`, `#f0f0f5`. |
| `name` | string | — | No | Nombre visible de la página en la UI. |
| `bgStyle` | string | — | No | CSS `background` multilinea. Capas separadas por coma. La primera capa es la superior, la última la inferior. |

## Presets de tamaño comunes

| Nombre | width | height | Uso |
|--------|-------|--------|-----|
| Historia IG | 1080 | 1920 | Instagram Stories / Reels / TikTok |
| Post IG | 1080 | 1080 | Instagram Feed / Facebook |
| Landscape | 1920 | 1080 | YouTube Thumbnail / Video horizontal |
| Banner Web | 1200 | 600 | Banner publicitario |
| Thumbnail | 1280 | 720 | YouTube / Video |
| Poster | 1920 | 2880 | Póster / Presentación |
| Logo | 500 | 500 | Brand identity |
| A4 | 2480 | 3508 | Impresión |

## `bgStyle` — Capas de fondo multicapa

El atributo `bgStyle` acepta cualquier valor CSS `background` válido. Las capas se separan por coma. Útil para combinar colores, degradados, patrones e imágenes.

### Capa de color sólido
```
bgStyle="linear-gradient(135deg, #667eea, #764ba2)"
```

### Capa de degradado
```
bgStyle="linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #667eea 100%)"
bgStyle="radial-gradient(circle at 30% 40%, #f093fb 0%, #f5576c 100%)"
bgStyle="conic-gradient(from 0deg at center, #667eea, #764ba2)"
```

### Capa de imagen
```
bgStyle="url(https://ejemplo.com/imagen.jpg) center/cover no-repeat"
```

### Patrones CSS sin imágenes

**Checkerboard**:
```
repeating-conic-gradient(#COLOR1 0% 25%, #COLOR2 0% 50%) TAMAÑOpx TAMAÑOpx
```
Ej: `repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 40px 40px`

**Puntos**:
```
radial-gradient(#COLOR 1.5px, transparent 1.5px) TAMAÑOpx TAMAÑOpx
```
Ej: `radial-gradient(rgba(255,255,255,0.1) 1.5px, transparent 1.5px) 20px 20px`

**Rayas diagonales**:
```
repeating-linear-gradient(45deg, #COLOR1, #COLOR1 2px, #COLOR2 2px, #COLOR2 8px)
```
Ej: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`

**Cuadrícula**:
```
repeating-linear-gradient(0deg, transparent, transparent TAMAÑOpx, #COLOR TAMAÑOpx, #COLOR calc(TAMAÑOpx + 1px)), repeating-linear-gradient(90deg, transparent, transparent TAMAÑOpx, #COLOR TAMAÑOpx, #COLOR calc(TAMAÑOpx + 1px))
```

**Trama cruzada**:
```
repeating-linear-gradient(45deg, transparent, transparent TAMAÑOpx, #COLOR TAMAÑOpx, #COLOR calc(TAMAÑOpx + 1px)), repeating-linear-gradient(-45deg, transparent, transparent TAMAÑOpx, #COLOR TAMAÑOpx, #COLOR calc(TAMAÑOpx + 1px))
```

### Capas combinadas (múltiples)
```
bgStyle="LINEAR_GRADIENT, URL_IMAGEN center/cover no-repeat"
bgStyle="repeating-conic-gradient(...) SIZEpx SIZEpx, linear-gradient(135deg, rgba(COLOR,0.3), rgba(COLOR,0.3))"
```

## Ejemplos de página

### Página básica
```jsx
<page width="1080" height="1920" bgColor="#0f0f1a">
  <text x="60" y="60" w="960" h="80">Contenido</text>
</page>
```

### Página con fondo degradado + patrón
```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="linear-gradient(180deg, #667eea 0%, #764ba2 100%)">
  <text x="60" y="60" w="960" h="80">Fondo degradado</text>
</page>
```

### Página con patrón checkerboard
```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 40px 40px">
  <text x="60" y="60" w="960" h="80">Fondo con patrón</text>
</page>
```

### Página con capas múltiples
```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-conic-gradient(rgba(26,26,46,0.5) 0% 25%, rgba(22,33,62,0.5) 0% 50%) 40px 40px, linear-gradient(135deg, rgba(102,126,234,0.4), rgba(118,75,162,0.4)), url(https://picsum.photos/1080/1920) center/cover no-repeat">
  <text x="60" y="800" w="960" h="120">Fondo multicapa</text>
</page>
```

### Múltiples páginas (proyecto completo)
```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="true" />
  <page width="1080" height="1920" bgColor="#1a1a2e" name="Portada">
    <text x="200" y="600" w="680" h="120" fontSize="72" fontWeight="900"
      color="#ffffff" textAlign="center">Título</text>
  </page>
  <page width="1080" height="1920" bgColor="#2a1a2e" name="Contenido">
    <text x="60" y="60" w="960" h="60" fontSize="32" color="#ffffff">Contenido</text>
  </page>
</project>
```
