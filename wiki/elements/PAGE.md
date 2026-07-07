# Page — Design Studio Editor

## Visión General

El elemento `<page>` es el contenedor raíz de cada lienzo en el editor. Un proyecto contiene una o más páginas, cada una con su propio tamaño, color de fondo, capas de fondo y elementos hijos.

En el JSX del editor, `<page>` envuelve todos los elementos (`<text>`, `<figure>`, etc.) y define el área visible de trabajo.

---

## Índice

1. [Arquitectura](#arquitectura)
2. [El elemento `<page>` en JSX](#el-elemento-page-en-jsx)
3. [Formato de Datos (Page)](#formato-de-datos-page)
4. [Propiedades del Page](#propiedades-del-page)
   - [Dimensiones](#dimensiones)
   - [Fondo](#fondo)
   - [Nombre](#nombre)
5. [Sistema de Capas de Fondo](#sistema-de-capas-de-fondo)
   - [Tipos de Capa](#tipos-de-capa)
   - [Propiedades Comunes](#propiedades-comunes)
   - [Propiedades por Tipo](#propiedades-por-tipo)
   - [Orden de Capas](#orden-de-capas)
6. [Páginas Múltiples y Carousel](#páginas-múltiples-y-carousel)
   - [Page Gap](#page-gap)
   - [Navegación](#navegación)
7. [Integración en la UI](#integración-en-la-ui)
8. [Renderizado en Canvas](#renderizado-en-canvas)
9. [Exportación JSX](#exportación-jsx)
10. [Parseo al Abrir](#parseo-al-abrir)
11. [Ejemplos](#ejemplos)

---

## Arquitectura

| Capa | Archivo | Propósito |
|------|---------|-----------|
| **Type** | `src/editor/utils/types.ts` | Interfaz `Page` y `BackgroundLayer` |
| **Store** | `src/editor/store/editorStore.ts` | Estado global: lista de páginas, página activa, CRUD |
| **UI — Sidebar** | `src/editor/components/panels/LeftSidebar.tsx` | Pestaña "Páginas" con miniatura, rename, reordenar |
| **UI — Fondo** | `src/editor/components/tools/BackgroundLayerEditor.tsx` | Editor de capas de fondo multicapa |
| **Canvas** | `src/editor/components/canvas/EditorCanvas.tsx` | Renderiza páginas con gap entre ellas |
| **JSX Serializer** | `src/editor/utils/jsxSerializer.ts` | Genera `<page>` en la exportación |
| **JSX Parser** | `src/editor/utils/jsxParser.ts` | Lee `<page>` al importar |

```
Store (pages[])
  │
  ├── LeftSidebar → pestaña "Páginas" (navegar, renombrar, +/−)
  ├── BackgroundLayerEditor → updatePage(bgLayers) / updateElement(bgLayers)
  ├── EditorCanvas → renderiza cada página con <div data-page-bg>
  └── jsxSerializer → <page width="..." height="..." bgColor="...">
```

---

## El elemento `<page>` en JSX

En la exportación/importación JSX, cada página se representa como:

```jsx
<project>
  <config pageGap="40" />
  <page width="1080" height="1920" bgColor="#1a1a2e" name="Portada">
    <text x="100" y="100" w="400" h="80" ...>contenido</text>
    <figure x="200" y="300" w="300" h="300" type="rect" ... />
  </page>
  <page width="1080" height="1920" bgColor="#2a1a2e" name="Interior">
    ...
  </page>
</project>
```

Las páginas se renderizan horizontalmente (carousel) con un gap configurable.

---

## Formato de Datos (Page)

```ts
interface Page {
  id: string;           // ID único, generado con genPageId()
  name: string;         // Nombre visible en la UI
  width: number;        // Ancho en px
  height: number;       // Alto en px
  bgColor: string;      // Color base (hex, siempre presente)
  bgLayers?: BackgroundLayer[];  // Capas de fondo adicionales (multicapa)
}
```

Propiedades por defecto de una página nueva:

```ts
{
  id: "page_1_1700000000000",
  name: "Página 1",
  width: 1080,
  height: 1920,
  bgColor: "#1a1a2e",
}
```

---

## Propiedades del Page

### Dimensiones

Cada página tiene su propio tamaño. El canvas se adapta automáticamente:

| Propiedad | Default | Descripción |
|-----------|---------|-------------|
| `width` | 1080 | Ancho en px |
| `height` | 1920 | Alto en px |

Se pueden cambiar desde:
- **Presets**: Botón "Añadir página" → selector de presets (IG Story, Post IG, Landscape, A4, etc.)
- **Panel de páginas**: Edición inline de width/height por página
- **Canvas**: Handles de redimensionamiento en los bordes de página (esquinas)

Al redimensionar, las páginas mantienen su propio tamaño independientemente — no están vinculadas.

**Presets disponibles** (`CANVAS_PRESETS` en `src/editor/utils/types.ts`):

| Label | Width | Height | Uso típico |
|-------|-------|--------|------------|
| Historia IG | 1080 | 1920 | Instagram Stories / Reels |
| Post IG | 1080 | 1080 | Instagram Feed |
| Landscape | 1920 | 1080 | YouTube / Video horizontal |
| Cuadrado | 1080 | 1080 | Genérico cuadrado |
| A4 | 2480 | 3508 | Impresión A4 (300dpi) |
| Poster | 1920 | 2880 | Póster vertical |
| Banner Web | 1200 | 600 | Banner publicitario |
| Thumbnail | 1280 | 720 | YouTube Thumbnail |
| Logo | 500 | 500 | Logo cuadrado |

### Fondo

Cada página tiene un color base (`bgColor`) y opcionalmente capas de fondo superpuestas (`bgLayers`).

**Color base**: Se renderiza como `backgroundColor` del contenedor. Se elige con un color picker en la pestaña "Fondo" de la barra lateral. Si es `"transparent"`, se muestra un checkerboard visual (puramente decorativo, no se exporta).

**Capas de fondo**: Ver [Sistema de Capas de Fondo](#sistema-de-capas-de-fondo).

### Nombre

Cada página tiene un nombre editable desde la pestaña "Páginas" en la barra lateral. Se usa para identificación visual y se exporta como atributo `name` en JSX.

---

## Sistema de Capas de Fondo

Las capas de fondo son un sistema **multicapa** basado en CSS que permite combinar colores, degradados, imágenes y patrones en un orden visual apilado. Cada capa tiene su propia opacidad, modo de fusión y propiedades específicas según su tipo.

Están disponibles tanto en páginas (`Page.bgLayers`) como en elementos shape (`DesignElement.bgLayers`).

### Tipos de Capa

| Tipo | Propósito | Propiedades Clave |
|------|-----------|-------------------|
| `color` | Color sólido | `color`, `opacity` |
| `gradient` | Degradado lineal, radial o cónico | `gradientKind`, `gradientAngle`, `gradientStops`, `gradientPosition` |
| `image` | Imagen de fondo | `src`, `imageSize`, `imagePosition`, `imageRepeat`, `imageAttachment` |
| `pattern` | Patrón CSS generativo | `patternKind`, `patternColor1`, `patternColor2`, `patternSize` |

### Propiedades Comunes

Todas las capas comparten estas propiedades:

```ts
interface BackgroundLayer {
  id: string;           // ID único (generado automáticamente)
  type: "color" | "gradient" | "image" | "pattern";
  enabled: boolean;     // Si está visible (toggle ◉/◌)
  opacity?: number;     // 0.0 – 1.0 (CSS opacity)
  blendMode?: string;   // Modo de fusión CSS
}
```

**Modos de Fusión Soportados**:

| Valor CSS | Nombre en UI | Efecto |
|-----------|-------------|--------|
| `normal` | Normal | Sin fusión |
| `multiply` | Multiplicar | Oscurece combinando colores |
| `screen` | Pantalla | Aclara combinando colores |
| `overlay` | Superponer | Contraste aumentado |
| `darken` | Oscurecer | Toma el color más oscuro |
| `lighten` | Aclarar | Toma el color más claro |
| `color-dodge` | Subexponer | Aclara intensamente |
| `color-burn` | Sobreexponer | Oscurece intensamente |

### Propiedades por Tipo

#### Color

Capa sólida simple. Se renderiza como `background: #rrggbb`.

```ts
{
  type: "color",
  enabled: true,
  color: "#4f46e5",    // Color hex
  opacity: 1,          // Si opacity < 1 → rgba()
}
```

**UI**: Color picker nativo (`<input type="color">`).

---

#### Gradiente

Soporta tres tipos de degradado CSS:

**Lineal:**
```ts
{
  type: "gradient",
  gradientKind: "linear",
  gradientAngle: 135,           // 0° – 360°
  gradientStops: [
    { color: "#667eea", position: 0 },
    { color: "#764ba2", position: 100 }
  ],
}
```
Genera: `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

**Radial:**
```ts
{
  type: "gradient",
  gradientKind: "radial",
  gradientPosition: "center",   // center | top left | top right | bottom left | bottom right
  gradientStops: [...],
}
```
Genera: `background: radial-gradient(circle at center, ...)`

**Cónico:**
```ts
{
  type: "gradient",
  gradientKind: "conic",
  gradientAngle: 0,             // Ángulo de inicio 0° – 360°
  gradientPosition: "center",
  gradientStops: [...],
}
```
Genera: `background: conic-gradient(from 0deg at center, ...)`

**Stops (Paradas de Color)**:
- Mínimo 2 stops, máximo 6
- Cada stop tiene `color` (hex) y `position` (0% – 100%)
- Se añaden con el botón "+ Añadir"
- Se eliminan con ✕ (solo si hay más de 2)
- La posición se ajusta con sliders

---

#### Imagen

Capa de imagen de fondo con control CSS completo.

```ts
{
  type: "image",
  src: "https://ejemplo.com/fondo.jpg",
  imageSize: "cover",           // cover | contain | auto
  imagePosition: "center",      // center | top | bottom | left | right | top left
  imageRepeat: "no-repeat",     // no-repeat | repeat | repeat-x | repeat-y
  imageAttachment: "scroll",    // scroll | fixed
}
```

Genera: `background: url("...") center / cover no-repeat scroll`

| Propiedad | CSS Equivalente | Opciones |
|-----------|----------------|----------|
| `imageSize` | `background-size` | `cover`, `contain`, `auto` |
| `imagePosition` | `background-position` | Posiciones predefinidas |
| `imageRepeat` | `background-repeat` | Control de repetición |
| `imageAttachment` | `background-attachment` | `scroll` / `fixed` |

---

#### Patrón

Genera patrones CSS repetitivos sin imágenes externas.

```ts
{
  type: "pattern",
  patternKind: "checkerboard",  // checkerboard | dots | stripes | grid | crosshatch
  patternColor1: "#ffffff",     // Color principal
  patternColor2: "#000000",     // Color secundario
  patternSize: 20,              // Tamaño en px (4 – 100)
}
```

| patternKind | Nombre en UI | CSS Generado |
|-------------|-------------|-------------|
| `checkerboard` | Ajedrez | `repeating-conic-gradient(#fff 0% 25%, #000 0% 50%) 0 0 / 40px 40px` |
| `dots` | Puntos | `radial-gradient(#fff 2px, transparent 2px) 0 0 / 20px 20px` |
| `stripes` | Rayas | `repeating-linear-gradient(45deg, #fff, #fff 2px, #000 2px, #000 20px)` |
| `grid` | Cuadrícula | Dos `repeating-linear-gradient` superpuestos |
| `crosshatch` | Trama | Dos `repeating-linear-gradient` (45° y -45°) superpuestos |

### Orden de Capas

Las capas se renderizan en el orden de la lista. **La primera capa en la lista aparece arriba** (más cercana al viewer). Esto sigue la convención CSS donde el primer fondo listado se pinta encima.

```
[0] Capa de imagen    ← Se ve encima
[1] Capa de degradado ← Capa intermedia
[2] Capa de color     ← Al fondo
```

La UI permite reordenar con botones ▲ (sube) y ▼ (baja).

---

## Páginas Múltiples y Carousel

El editor soporta múltiples páginas que se muestran en un carrusel horizontal dentro del canvas.

### Page Gap

Espacio horizontal entre páginas, configurable desde `<config pageGap="..." />` en JSX (por defecto 0).

Cada página se posiciona en el canvas según su índice y el gap:

```
offset[i] = sum(pages[0..i-1].width) + i * pageGap
```

### Navegación

- **Click en página**: Cambia la página activa (la que recibe nuevos elementos)
- **Pestaña "Páginas"** en LeftSidebar: Lista de páginas con nombre, miniatura, reordenar, añadir, eliminar
- **Atajos**: Desde la UI se puede navegar con los botones ◀ ▶
- **BottomBar**: Muestra "Página X de Y"

### CRUD de Páginas

| Acción | Store | Descripción |
|--------|-------|-------------|
| Añadir | `addPage()` | Crea página con tamaño del preset activo |
| Eliminar | `removePage(id)` | Elimina página y sus elementos (mínimo 1 página) |
| Activar | `setActivePage(index)` | Cambia la página activa |
| Actualizar | `updatePage(id, updates)` | Cambia tamaño, nombre, color, bgLayers |

---

## Integración en la UI

### Pestaña "Páginas" (LeftSidebar)

```
┌─────────────────────────────┐
│ Páginas                     │
│ ┌───┐ ┌───┐ ┌───┐ ┌─────┐ │
│ │ 1 │ │ 2 │ │ 3 │ │ +   │ │
│ │ P1│ │ P2│ │ P3│ │Añad.│ │
│ └───┘ └───┘ └───┘ └─────┘ │
│ ───────────────────────── │
│ Página seleccionada:       │
│ Nombre: [Portada    ]     │
│ W: [1080] H: [1920]       │
│ ┌───────────────────────┐ │
│ │ 🖌 Color de fondo     │ │
│ └───────────────────────┘ │
└─────────────────────────────┘
```

### Pestaña "Fondo" (LeftSidebar)

Permite editar:
1. **Color base de página**: Selector de color rápido + botón "Transparente" + colores predefinidos
2. **Capas de fondo adicionales**: El `BackgroundLayerEditor` completo

El color base se renderiza como `backgroundColor` separado. Si hay capas activas, se combinan como CSS `background: <capas>, <colorBase>`.

---

## Renderizado en Canvas

En `EditorCanvas.tsx`, cada página se renderiza como:

```tsx
{pages.map((page, i) => {
  const isActive = i === activePageIndex;
  const isTransparent = !page.bgColor || page.bgColor === "transparent";
  const pageStart = offsets[i];

  return (
    <div
      key={page.id}
      data-page-id={page.id}
      style={{
        position: "absolute",
        left: pageStart + gapShift(pageStart),
        top: 0,
        width: page.width,
        height: page.height,
        backgroundColor: isTransparent ? undefined : page.bgColor,
        ...(hasActiveLayers(page.bgLayers) ? {
          background: layersToBackground(page.bgLayers) + (page.bgColor ? `, ${page.bgColor}` : ""),
        } : {}),
      }}
    >
      {/* elementos de la página */}
    </div>
  );
})}
```

El gap visual entre páginas se calcula con `gapShift()`: cada página se desplaza `i * pageGap` píxeles a la derecha.

---

## Exportación JSX

Cada página se serializa como un elemento `<page>`:

```tsx
<page width="1080" height="1920" bgColor="#1a1a2e"
  bgStyle="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
  <!-- elementos -->
</page>
```

**Atributos exportados**:

| Atributo | Siempre | Descripción |
|----------|---------|-------------|
| `width` | Sí | Ancho de página |
| `height` | Sí | Alto de página |
| `bgColor` | Sí | Color base (hex) |
| `name` | Solo si distinto | Nombre de página |
| `bgStyle` | Solo si hay capas | CSS background completo de las capas |

Los elementos se ordenan por `zIndex` ascendente y se agrupan dentro de su página según su coordenada X global.

---

## Parseo al Abrir

Al importar un archivo `.jsx`, el parser (`jsxParser.ts`):

1. Lee cada `<page>` y extrae `width`, `height`, `bgColor`, `name`
2. Si existe `bgStyle`, el atributo se guarda como texto CSS en el elemento — actualmente se parsea como string, no se descompone en capas individuales
3. Los elementos hijos se asignan a cada página según su coordenada X relativa (offset por página)
4. El `<config>` global provee `pageGap` y otras opciones

---

## Ejemplos

### Ejemplo 1: Página simple con gradiente + patrón

```jsx
<project>
  <config pageGap="40" />
  <page width="1080" height="1920" bgColor="#1a1a2e"
    bgStyle="linear-gradient(135deg, #667eea 0%, #764ba2 100%), repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, transparent 0% 50%) 0 0 / 40px 40px">
    <text x="100" y="100" w="400" h="80" fontSize="48" color="#ffffff" textAlign="center">
      Fondo con capas
    </text>
  </page>
</project>
```

### Ejemplo 2: Múltiples páginas

```jsx
<project>
  <config pageGap="60" />
  <page width="1080" height="1920" bgColor="#1a1a2e" name="Portada">
    <text x="200" y="600" w="600" h="120" fontSize="72" fontWeight="900" textAlign="center">
      Título
    </text>
  </page>
  <page width="1080" height="1920" bgColor="#2a1a2e" name="Contenido">
    <text x="100" y="100" w="400" h="60" fontSize="32">
      Contenido
    </text>
  </page>
</project>
```

### Ejemplo 3: Shape con capas de fondo

```jsx
<project>
  <config />
  <page width="1080" height="1920" bgColor="#1a1a2e">
    <figure x="100" y="100" w="500" h="500" type="rect" borderWidth="4" borderColor="#ffffff"
      bgStyle="linear-gradient(135deg, rgba(108,92,231,0.8) 0%, rgba(233,69,96,0.8) 100%), repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)" />
  </page>
</project>
```

---

## Notas Técnicas

- Las páginas existentes en el proyecto se persisten en `localStorage` con el resto del estado
- `carouselWidth` y `carouselHeight` se calculan automáticamente al cambiar páginas o gap
- El checkerboard de página transparente (cuando no hay capas ni color) es puramente visual y no se exporta
- Los patrones se generan 100% con CSS, sin imágenes externas
- Los gradientes cónicos requieren Chrome 69+, Firefox 83+, Safari 12.1+
- El modo de fusión por capa usa `background-blend-mode` (no confundir con `mix-blend-mode`)
- La exportación a PNG/JPG/WebP captura el CSS `background` renderizado, incluyendo patrones y degradados
