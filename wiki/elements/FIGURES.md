# Figures — Design Studio Editor

## Visión General

Los elementos figure (formas, imágenes, SVG) se representan en JSX como `<figure>` y cubren los tipos `shape`, `image` y `svg` del `DesignElement`. Los textos se cubren en [TEXTS.md](./TEXTS.md).

---

## Índice

1. [El elemento `<figure>` en JSX](#el-elemento-figure-en-jsx)
2. [Shape](#shape)
   - [Tipos de Shape](#tipos-de-shape)
   - [Propiedades de Shape](#propiedades-de-shape)
   - [Relleno y Borde](#relleno-y-borde)
   - [Bordes Redondeados](#bordes-redondeados)
   - [Capas de Fondo](#capas-de-fondo)
   - [Sombra](#sombra)
3. [Imagen](#imagen)
   - [Ajustes de Imagen](#ajustes-de-imagen)
   - [Recorte (Crop)](#recorte-crop)
4. [SVG](#svg)
   - [Incrustado](#incrustado)
   - [Iconos](#iconos)
   - [Paths desde Texto](#paths-desde-texto)
5. [Clip Mask](#clip-mask)
6. [Auto Layout](#auto-layout)
7. [Propiedades Compartidas](#propiedades-compartidas)
8. [Renderizado en Canvas](#renderizado-en-canvas)
9. [Exportación JSX](#exportación-jsx)
10. [Ejemplos](#ejemplos)

---

## El elemento `<figure>` en JSX

En la exportación JSX, todos los tipos no-texto se serializan como `<figure>`:

```jsx
<figure x="100" y="100" w="300" h="300" type="rect"
  backgroundColor="#4f46e5"
  borderColor="#ffffff" borderWidth="4"
  borderRadius="20" />
```

| Atributo | Uso |
|----------|-----|
| `type` | `rect`, `circle`, `triangle`, `star`, `line` |
| `x`, `y`, `w`, `h` | Posición y tamaño |
| `src` | Para imágenes |
| `svgContent` | Para SVG inline |

---

## Shape

### Tipos de Shape

| shapeKind | JSX `type` | Descripción |
|-----------|-----------|-------------|
| `rect` | `rect` | Rectángulo (soporta bgLayers, border, borderRadius) |
| `circle` | `circle` | Círculo (CSS `border-radius: 50%`) |
| `triangle` | `triangle` | Triángulo (CSS border trick) |
| `star` | `star` | Estrella (SVG inline generado) |
| `line` | `line` | Línea horizontal |

Los tipos `circle`, `triangle`, `star`, `line` **no** soportan capas de fondo (`bgLayers`).

### Propiedades de Shape

```ts
interface DesignElement {
  // shape
  shapeKind?: "rect" | "circle" | "triangle" | "star" | "line";

  // fill
  backgroundColor?: string;      // Color sólido
  fillGradient?: string;         // CSS gradient
  fillGradientColors?: string[]; // Stops para UI

  // border
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted";

  // border radius
  borderRadius?: number;         // Todos los lados
  borderRadiusTL?: number;       // Top-Left individual
  borderRadiusTR?: number;       // Top-Right individual
  borderRadiusBR?: number;       // Bottom-Right individual
  borderRadiusBL?: number;       // Bottom-Left individual

  // multi-layer backgrounds
  bgLayers?: BackgroundLayer[];

  // shadow (box-shadow)
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}
```

### Relleno y Borde

**Relleno**: Se define con `backgroundColor` (color sólido) o `fillGradient` (degradado). Si hay capas de fondo activas, se usa `layersToBackground()` en vez del color sólido.

**Borde**: `borderColor` + `borderWidth` + `borderStyle`. El estilo soporta `"solid"`, `"dashed"`, `"dotted"`.

```tsx
// Rectángulo con borde punteado
<figure x="100" y="100" w="300" h="200" type="rect"
  backgroundColor="#1e1e2e"
  borderColor="#6c5ce7" borderWidth="3" borderStyle="dashed" />
```

### Bordes Redondeados

Soporta borderRadius uniforme o individual por esquina:

```tsx
// Radio uniforme
<figure x="100" y="100" w="200" h="200" type="rect"
  backgroundColor="#4f46e5" borderRadius="20" />

// Radios individuales (TL, TR, BR, BL)
<figure x="400" y="100" w="200" h="200" type="rect"
  backgroundColor="#e94560"
  borderRadiusTL="40" borderRadiusTR="0"
  borderRadiusBR="20" borderRadiusBL="0" />
```

### Capas de Fondo

Los shapes `rect` pueden usar el sistema multicapa:

```ts
bgLayers?: BackgroundLayer[];  // Array de capas (ver PAGE.md → Sistema de Capas)
```

Se renderiza como:

```ts
const bgLayersCss = hasActiveLayers(el.bgLayers)
  ? layersToBackground(el.bgLayers)
  : (el.fillGradient ?? el.backgroundColor);
```

Útil para patrones, gradientes compuestos, imágenes de fondo.

### Sombra

Los shapes usan CSS `box-shadow`:

```ts
shadowColor: "#000000",
shadowBlur: 15,
shadowOffsetX: 0,
shadowOffsetY: 8,
```

```css
box-shadow: 0px 8px 15px #000000;
```

---

## Imagen

Las imágenes se importan desde archivos locales o URLs y se renderizan con la etiqueta `<img>`.

### Ajustes de Imagen

Cada imagen soporta ajustes CSS nativos:

| Propiedad | CSS | Efecto |
|-----------|-----|--------|
| `imgBrightness` (0–200) | `filter: brightness()` | Brillo |
| `imgContrast` (0–200) | `filter: contrast()` | Contraste |
| `imgSaturation` (0–200) | `filter: saturate()` | Saturación |
| `imgBlur` (0–50) | `filter: blur()` | Desenfoque |

```tsx
<figure x="100" y="100" w="400" h="400" type="rect"
  src="https://ejemplo.com/foto.jpg"
  imgBrightness="110" imgContrast="120" imgSaturation="80" />
```

### Recorte (Crop)

Las imágenes pueden recortarse sin modificar el archivo original.

**Rectangular**:
```ts
cropX?: number;   // Offset X de recorte
cropY?: number;   // Offset Y de recorte
cropW?: number;   // Ancho de recorte
cropH?: number;   // Alto de recorte
```

Se renderiza cambiando `object-position` y `object-view-box` (CSS):

```css
object-position: -${cropX}px -${cropY}px;
object-view-box: inset(${cropY}px ${cropX + cropW}px ${cropY + cropH}px ${cropX}px);
```

**Bezier / Path**: Se puede recortar con un path Bezier arbitrario usando `CropOverlay.tsx`. El recorte se aplica como `clip-path` CSS.

---

## SVG

### Incrustado

SVGs se guardan como string inline:

```ts
svgContent?: string;  // "<svg viewBox='...'> <path d='...'/> ... </svg>"
```

Se renderizan con `dangerouslySetInnerHTML` dentro de un `<div>` que escala al tamaño del elemento.

### Iconos

El editor incluye una librería de iconos SVG precargados (`IconPicker.tsx`). Al seleccionar un icono, se crea un elemento `type: "svg"` con el `svgContent` del icono.

Los iconos se renderizan como SVG escalado al tamaño del elemento, centrados con `viewBox`.

### Paths desde Texto

El texto se puede convertir a paths SVG vectoriales (irreversible):

1. Botón "Exportar como SVG" en el panel de propiedades de texto
2. `useTextToPaths.ts` usa `opentype.js` para convertir cada glifo a path
3. El elemento se transforma a `type: "svg"`, todas las propiedades de texto se limpian
4. El SVG resultante se edita con `PathEditor`

---

## Clip Mask

Cualquier elemento puede tener un clip/mask que oculta partes del contenido:

```ts
interface ClipMask {
  type: "circle" | "ellipse" | "polygon" | "inset" | "path";
  value: string;  // Valor CSS para clip-path
}
```

Ejemplos:
- `circle: 50% at center` → Círculo
- `ellipse: 50% 50% at center` → Elipse
- `polygon: 50% 0%, 0% 100%, 100% 100%` → Triángulo
- `inset: 10% 20%` → Rectángulo interno
- `path: M0,0 L100,0 L50,100 Z` → Path arbitrario

En JSX se exporta como atributo `clipMask`:

```jsx
<figure x="100" y="100" w="300" h="300" type="rect"
  backgroundColor="#4f46e5"
  clipMask="circle:50% at center" />
```

El recorte (crop) también puede ser bezier:
```ts
cropPreview: {
  mode: "bezier",
  bezierPath: "M...Z",
}
```

---

## Auto Layout

Los elementos pueden organizarse automáticamente con el sistema de auto-layout:

```ts
interface LayoutConfig {
  direction: "row" | "column";
  gap: number;
  padding: number;
  align: "flex-start" | "center" | "flex-end" | "stretch";
  justify: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  wrap: boolean;
}
```

Se asigna con `element.layout` y los hijos se referencian con `element.parentId`.

En JSX:
```jsx
<figure x="100" y="100" w="600" h="400" type="rect"
  layout='{"direction":"row","gap":16,"padding":20,"align":"center","justify":"center","wrap":false}'
  backgroundColor="#2a2a3e" />
```

---

## Propiedades Compartidas

Todas las figuras comparten:

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `opacity` | number | 1 | Opacidad del elemento |
| `rotation` | number | 0 | Rotación en grados |
| `flipH` | boolean | false | Espejo horizontal |
| `flipV` | boolean | false | Espejo vertical |
| `mixBlendMode` | string | — | Modo de fusión CSS |
| `locked` | boolean | false | Bloquea edición |
| `hidden` | boolean | false | Oculta el elemento |
| `zIndex` | number | auto | Orden de apilamiento |
| `groupId` | string | — | Pertenencia a grupo |

---

## Renderizado en Canvas

Cada tipo se renderiza en `renderElement.tsx`:

| type | Renderizado |
|------|-------------|
| `rect` | `<div>` con backgroundColor/bgLayers + border + borderRadius + boxShadow |
| `circle` | `<div>` con `borderRadius: 50%` + backgroundColor |
| `triangle` | `<div>` con CSS border trick (triángulo puro) |
| `star` | `<div>` con SVG inline generado (polígono de 5 puntas) |
| `line` | `<div>` con borde horizontal + rotación |
| `image` | `<img>` con src + ajustes + crop |
| `svg` | `<div>` con `dangerouslySetInnerHTML={svgContent}` |

Todas comparten:
- Posición absoluta (`left`, `top`, `width`, `height`)
- Transformación (`scaleX`, `scaleY`, `rotate`)
- Opacidad y zIndex
- Clip mask (`clip-path: ...`)
- Sombra (`box-shadow` o `filter: drop-shadow`)

---

## Exportación JSX

Los elementos se serializan con `serializeElement()` en `jsxSerializer.ts`:

```tsx
<figure x="100" y="100" w="300" h="300" type="rect"
  backgroundColor="#4f46e5"
  borderColor="#ffffff" borderWidth="4"
  opacity="0.9"
  rotation="5" />
```

Las imágenes incluyen `src`:
```tsx
<figure x="100" y="100" w="400" h="400" type="rect"
  src="data:image/..." />
```

Los SVG incluyen `svgContent` escapado:
```tsx
<figure x="100" y="100" w="80" h="80" type="rect"
  svgContent="<svg viewBox='0 0 24 24'>...</svg>" />
```

---

## Ejemplos

### Shape con bordes individuales

```jsx
<figure x="50" y="50" w="300" h="200" type="rect"
  backgroundColor="#4f46e5"
  borderColor="#ffffff" borderWidth="2"
  borderRadiusTL="30" borderRadiusTR="0"
  borderRadiusBR="30" borderRadiusBL="0" />
```

### Círculo con sombra

```jsx
<figure x="100" y="100" w="200" h="200" type="circle"
  backgroundColor="#e94560"
  shadowColor="#e94560" shadowBlur="30" />
```

### Imagen con ajustes

```jsx
<figure x="50" y="50" w="500" h="500" type="rect"
  src="https://ejemplo.com/foto.jpg"
  imgBrightness="120" imgContrast="110"
  imgSaturation="90" imgBlur="2" />
```

### SVG icono

```jsx
<figure x="100" y="100" w="80" h="80" type="rect"
  svgContent="<svg viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M12 8v8M8 12h8'/></svg>" />
```

### Clip mask path

```jsx
<figure x="100" y="100" w="300" h="300" type="rect"
  backgroundColor="#6c5ce7"
  clipMask="polygon:50% 0%, 0% 100%, 100% 100%" />
```

### Auto layout row

```jsx
<figure x="50" y="50" w="700" h="200" type="rect"
  backgroundColor="#2a2a3e"
  layout='{"direction":"row","gap":12,"padding":16,"align":"center","justify":"space-around","wrap":false}' />
```

---

## Notas Técnicas

- Triangle usa CSS `border` trick (triángulo equilátero basado en width/height)
- Star genera un SVG inline con `<polygon points="...">` de 5 puntas
- Line es un `<div>` horizontal con borde y rotación aplicada
- Las imágenes se importan como `dataUrl` o URL externa
- SVG incrustado se renderiza con `dangerouslySetInnerHTML` y se escala al contenedor
- El crop bezier se aplica como `clip-path: path(...)` en CSS
- Auto-layout se implementa con CSS Flexbox, seteando `display: flex` en el contenedor
- `mixBlendMode` se aplica con CSS `mix-blend-mode` (diferente de `background-blend-mode` en capas)
