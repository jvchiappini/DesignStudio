# Background System — Design Studio Editor

## Visión General

El editor cuenta con un sistema de fondos **multicapa** basado en CSS, que permite combinar colores, degradados, imágenes y patrones en un orden visual apilado. Cada capa tiene su propia opacidad, modo de fusión y propiedades específicas según su tipo.

## Índice

1. [Arquitectura](#arquitectura)
2. [Tipos de Capa](#tipos-de-capa)
3. [Propiedades Comunes](#propiedades-comunes)
4. [Propiedades por Tipo](#propiedades-por-tipo)
   - [Color](#color)
   - [Gradiente](#gradiente)
   - [Imagen](#imagen)
   - [Patrón](#patrón)
5. [Orden de Capas](#orden-de-capas)
6. [Integración en la UI](#integración-en-la-ui)
   - [Páginas (Sidebar → Fondo)](#páginas-sidebar--fondo)
   - [Shapes (RightPanel → Relleno de fondo)](#shapes-rightpanel--relleno-de-fondo)
7. [Exportación JSX](#exportación-jsx)
8. [Formato de Datos](#formato-de-datos)
9. [Renderizado en Canvas](#renderizado-en-canvas)
10. [Ejemplos](#ejemplos)

---

## Arquitectura

El sistema se compone de tres partes:

| Capa | Archivo | Propósito |
|------|---------|-----------|
| **Type** | `src/editor/types.ts` | Interfaz `BackgroundLayer` y campo `bgLayers` en `Page` y `DesignElement` |
| **Utils** | `src/editor/backgroundUtils.ts` | Funciones `layerToCss()`, `layersToBackground()`, `createDefaultLayer()` |
| **UI** | `src/editor/BackgroundLayerEditor.tsx` | Componente React para editar la lista de capas |
| **Render** | `src/editor/renderElement.tsx` | Aplica las capas como CSS `background` en shapes |
| **Canvas** | `src/editor/EditorCanvas.tsx` | Aplica las capas como CSS `background` en páginas |

```
User Action → BackgroundLayerEditor → store.updatePage() / store.updateElement()
                                          ↓
                                    EditorCanvas / renderElement
                                          ↓
                                    CSS background: ... en el DOM
```

---

## Tipos de Capa

Cada capa tiene un `type` que determina su comportamiento visual y qué propiedades están disponibles:

| Tipo | Propósito | Propiedades Clave |
|------|-----------|-------------------|
| `color` | Color sólido | `color`, `opacity` |
| `gradient` | Degradado lineal, radial o cónico | `gradientKind`, `gradientAngle`, `gradientStops`, `gradientPosition` |
| `image` | Imagen de fondo | `src`, `imageSize`, `imagePosition`, `imageRepeat`, `imageAttachment` |
| `pattern` | Patrón CSS generativo | `patternKind`, `patternColor1`, `patternColor2`, `patternSize` |

---

## Propiedades Comunes

Todas las capas comparten estas propiedades:

```ts
interface BackgroundLayer {
  id: string;           // ID único (generado automáticamente)
  type: "color" | "gradient" | "image" | "pattern";
  enabled: boolean;     // Si está visible (toggle ◉/◌)
  opacity?: number;     // 0.0 – 1.0 (CSS opacity)
  blendMode?: string;   // Modo de fusión CSS (ver tabla abajo)
}
```

### Modos de Fusión Soportados

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

---

## Propiedades por Tipo

### Color

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

### Gradiente

Soporta tres tipos de degradado CSS:

#### Lineal
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

#### Radial
```ts
{
  type: "gradient",
  gradientKind: "radial",
  gradientPosition: "center",   // center | top left | top right | bottom left | bottom right
  gradientStops: [...],
}
```
Genera: `background: radial-gradient(circle at center, ...)`

#### Cónico
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

#### Stops (Paradas de Color)

- Mínimo 2 stops, máximo 6
- Cada stop tiene `color` (hex) y `position` (0% – 100%)
- Se añaden con el botón "+ Añadir"
- Se eliminan con ✕ (solo si hay más de 2)
- La posición se ajusta con sliders
- La previsualización en la UI muestra el degradado horizontal en tiempo real

---

### Imagen

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
| `imageSize` | `background-size` | `cover` — Cubre todo el contenedor<br>`contain` — Cabe dentro<br>`auto` — Tamaño original |
| `imagePosition` | `background-position` | Posiciones predefinidas (centro, esquinas, lados) |
| `imageRepeat` | `background-repeat` | Control de repetición |
| `imageAttachment` | `background-attachment` | `scroll` — Se mueve con el contenido<br>`fixed` — Fijo (parallax) |

---

### Patrón

Genera patrones CSS repetitivos sin necesidad de imágenes externas.

```ts
{
  type: "pattern",
  patternKind: "checkerboard",  // checkerboard | dots | stripes | grid | crosshatch
  patternColor1: "#ffffff",     // Color principal
  patternColor2: "#000000",     // Color secundario
  patternSize: 20,              // Tamaño en px (4 – 100)
}
```

#### Tipos de Patrón

| patternKind | Nombre en UI | CSS Generado |
|-------------|-------------|-------------|
| `checkerboard` | Ajedrez | `repeating-conic-gradient(#fff 0% 25%, #000 0% 50%) 0 0 / 40px 40px` |
| `dots` | Puntos | `radial-gradient(#fff 2px, transparent 2px) 0 0 / 20px 20px` |
| `stripes` | Rayas | `repeating-linear-gradient(45deg, #fff, #fff 2px, #000 2px, #000 20px)` |
| `grid` | Cuadrícula | Dos `repeating-linear-gradient` superpuestos (horizontal + vertical) |
| `crosshatch` | Trama | Dos `repeating-linear-gradient` (45° y -45°) superpuestos |

---

## Orden de Capas

Las capas se renderizan en el orden de la lista. **La primera capa en la lista aparece arriba** (más cercana al viewer). Esto sigue la convención CSS donde el primer fondo listado se pinta encima.

```
[0] Capa de imagen    ← Se ve encima
[1] Capa de degradado ← Capa intermedia
[2] Capa de color     ← Al fondo
```

La UI permite reordenar con los botones ▲ (sube) y ▼ (baja).

---

## Integración en la UI

### Páginas (Sidebar → Fondo)

La pestaña "Fondo" (`◉`) en la barra lateral izquierda ahora incluye:

1. **Color base de página**: Selector de color rápido + botón "Transparente" + colores predefinidos
2. **Capas de fondo adicionales**: El `BackgroundLayerEditor` completo

El color base se renderiza como `backgroundColor` separado. Si hay capas activas, se combinan como CSS `background: <capas>, <colorBase>`.

### Shapes (RightPanel → Relleno de fondo)

En el panel derecho, al seleccionar un shape:

1. **Color sólido rápido**: Input color para cambiar `backgroundColor` al instante
2. **Capas avanzadas**: El `BackgroundLayerEditor` para composiciones multicapa

El renderizado de shapes usa `hasActiveLayers(el.bgLayers)` para decidir:
- Si hay capas → `background: layersToBackground(el.bgLayers)`
- Si no → `background: el.fillGradient ?? el.backgroundColor`

---

## Exportación JSX

Cuando exportas un proyecto a formato `.jsx`, las capas de fondo se exportan como el atributo `bgStyle` con el valor CSS `background` completo.

### Página

```jsx
<page width="1080" height="1920" bgColor="#1a1a2e"
  bgStyle="linear-gradient(135deg, #667eea 0%, #764ba2 100%), url(https://ejemplo.com/fondo.jpg) center / cover no-repeat, #1a1a2e">
```

### Elemento

```jsx
<figure x="100" y="100" w="300" h="300" type="rect"
  bgStyle="repeating-conic-gradient(#fff 0% 25%, #000 0% 50%) 0 0 / 40px 40px" />
```

### Parseo al Abrir

Al abrir un archivo `.jsx`, el atributo `bgStyle` se lee como texto CSS. Actualmente se guarda como string en el elemento, pero el sistema de capas nativo permite editar cada capa individualmente.

---

## Formato de Datos

### En Page

```ts
interface Page {
  id: string;
  name: string;
  width: number;
  height: number;
  bgColor: string;        // Color base (siempre presente)
  bgLayers?: BackgroundLayer[];  // Capas adicionales
}
```

### En DesignElement

```ts
interface DesignElement {
  // ... otras propiedades
  backgroundColor?: string;    // Color sólido simple (legacy)
  fillGradient?: string;      // Gradiente (legacy)
  fillGradientColors?: string[];
  bgLayers?: BackgroundLayer[];  // Sistema nuevo multicapa
}
```

### Serialización (localStorage)

Las capas se persisten automáticamente en `localStorage` con cada cambio a través de la función `persist()` del store.

---

## Renderizado en Canvas

### Página

En `EditorCanvas.tsx`, el div `[data-page-bg]` renderiza:

```tsx
style={{
  backgroundColor: isTransparent ? undefined : page.bgColor,
  ...(isTransparent ? { backgroundImage: /* checkerboard */ } : {}),
  ...(hasActiveLayers(page.bgLayers) ? {
    background: layersToBackground(page.bgLayers) + (bgColor ? `, ${bgColor}` : ""),
  } : {}),
}}
```

### Shape (rect)

En `renderElement.tsx`:

```tsx
const bgLayersCss = hasActiveLayers(el.bgLayers)
  ? layersToBackground(el.bgLayers)
  : (el.fillGradient ? ... : el.backgroundColor);

shapeStyle.background = bgLayersCss;
```

**Nota**: Solo shapes de tipo `rect` soportan `bgLayers` actualmente. Triangle, star y line usan CSS alternativo (border trick, SVG, etc.) y no renderizan capas de fondo.

---

## Ejemplos

### Ejemplo 1: Página con gradiente + patrón

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

### Ejemplo 2: Shape con patrón checkerboard

```jsx
<project>
  <config />
  <page width="1080" height="1920" bgColor="#ffffff">
    <figure x="200" y="200" w="300" h="300" type="rect"
      bgStyle="repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 0 0 / 40px 40px" />
    <figure x="600" y="200" w="300" h="300" type="rect"
      bgStyle="radial-gradient(#4f46e5 2px, transparent 2px) 0 0 / 20px 20px" />
  </page>
</project>
```

### Ejemplo 3: Múltiples capas en shape

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

- Los patrones se generan 100% con CSS, sin imágenes ni SVGs externos
- Los gradientes cónicos usan la función CSS `conic-gradient()` (soporte en Chrome 69+, Firefox 83+, Safari 12.1+)
- El modo de fusión por capa usa `background-blend-mode` (no confundir con `mix-blend-mode` que se aplica al elemento completo)
- La exportación a PNG/JPG/WebP captura el CSS `background` renderizado, incluyendo patrones y degradados
- El checkerboard de página transparente (cuando no hay capas) es puramente visual y no se exporta
