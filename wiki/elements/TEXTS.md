# Text System — Design Studio Editor

## Visión General

El editor dispone de un sistema de texto completo con tipografía avanzada, soporte para Google Fonts (120+ fuentes), fuentes personalizadas (TTF/OTF/WOFF/WOFF2), degradados en texto, borde (stroke), sombra, versalitas, espaciado preciso, alineación horizontal y vertical, escalado de caracteres independiente, y conversión a SVG vectorial editable.

---

## Índice

1. [Arquitectura](#arquitectura)
2. [Propiedades de Texto](#propiedades-de-texto)
3. [Fuentes](#fuentes)
   - [Fuentes del Sistema](#fuentes-del-sistema)
   - [Google Fonts](#google-fonts)
   - [Fuentes Personalizadas](#fuentes-personalizadas)
   - [Fuentes desde URL](#fuentes-desde-url)
4. [Editor en Canvas](#editor-en-canvas)
   - [Doble Click para Editar](#doble-click-para-editar)
   - [Atajos de Teclado](#atajos-de-teclado)
   - [Textarea vs Visual](#textarea-vs-visual)
5. [Panel de Propiedades (RightPanel)](#panel-de-propiedades-rightpanel)
   - [Contenido](#contenido)
   - [Fuente](#fuente)
   - [Estilo](#estilo)
   - [Espaciado](#espaciado)
   - [Decoración](#decoración)
   - [Degradado](#degradado)
   - [Alineación](#alineación)
   - [Fuentes Personalizadas](#fuentes-personalizadas-1)
   - [Exportar como SVG](#exportar-como-svg)
6. [Nuevas Propiedades](#nuevas-propiedades)
   - [Padding Interno](#padding-interno)
   - [Outline Externo](#outline-externo)
   - [Múltiples Sombras](#múltiples-sombras)
   - [Desbordamiento](#desbordamiento)
7. [Renderizado en Canvas](#renderizado-en-canvas)
8. [Sombra de Texto](#sombra-de-texto)
9. [Exportación JSX](#exportación-jsx)
10. [Conversión a SVG Vectorial](#conversión-a-svg-vectorial)
11. [Formato de Datos](#formato-de-datos)
12. [Ejemplos Completos](#ejemplos-completos)

---

## Arquitectura

| Capa | Archivo | Propósito |
|------|---------|-----------|
| **Type** | `src/editor/types.ts` | Interfaz `DesignElement` — propiedades `text*` |
| **UI** | `src/editor/RightPanel.tsx` → `TextFields` | Panel de propiedades completo |
| **Canvas Edit** | `src/editor/EditorCanvas.tsx` | Doble-click → textarea superpuesto para edición inline |
| **Render** | `src/editor/renderElement.tsx` | Convierte propiedades a CSS, maneja stroke/gradient |
| **Font Loader** | `src/hooks/useFontLoader.ts` | Carga fuentes personalizadas (archivo/URL) |
| **Google Fonts** | `src/editor/googleFonts.ts` | Lista de 120+ fuentes + inyección dinámica `<link>` |
| **Text→SVG** | `src/hooks/useTextToPaths.ts` | Convierte texto a paths SVG con opentype.js |
| **SVG→Paths** | `src/utils/svgTextToPaths.ts` | Utilidades para convertir texto SVG a paths |

```
User escribe texto
    ↓
TextFields (RightPanel) actualiza store → updateElement()
    ↓
EditorCanvas re-renderiza con renderElementContent()
    ↓
CSS: font-family, font-size, color, text-shadow, etc.
```

---

## Propiedades de Texto

Todas las propiedades de texto residen en el objeto `DesignElement`:

```ts
interface DesignElement {
  // ... propiedades comunes (x, y, width, height, rotation, opacity, zIndex)

  // === Contenido ===
  text?: string;

  // === Tipografía ===
  fontSize?: number;          // px, default 32
  fontFamily?: string;        // CSS font-family, default "system-ui, sans-serif"
  fontWeight?: number;        // 100–900, default 400
  fontStyle?: "normal" | "italic";
  color?: string;             // hex, default "#ffffff"

  // === Alineación ===
  textAlign?: "left" | "center" | "right";     // default "center"
  verticalAlign?: "top" | "middle" | "bottom"; // default "middle"

  // === Espaciado ===
  letterSpacing?: number;     // px, default 0
  lineHeight?: number;        // unitless multiplier, default 1.2
  wordSpacing?: number;       // px, default 0
  textIndent?: number;        // px, default 0

  // === Transformación ===
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: "none" | "underline" | "line-through";
  fontVariant?: "normal" | "small-caps";

  // === Decoración ===
  textStrokeColor?: string;   // hex, CSS -webkit-text-stroke-color
  textStrokeWidth?: number;   // px, CSS -webkit-text-stroke-width
  textBgColor?: string;       // hex (incl. alpha, e.g. #00000088)

  // === Escala de caracteres ===
  charScaleX?: number;        // %, default 100
  charScaleY?: number;        // %, default 100

  // === Degradado de texto ===
  textGradient?: string;      // CSS gradient value
  textGradientColors?: string[]; // color stops for UI

  // === Padding interno ===
  textPaddingLeft?: number;      // px, default 4
  textPaddingRight?: number;     // px, default 4
  textPaddingTop?: number;       // px, default 4
  textPaddingBottom?: number;    // px, default 4

  // === Outline externo ===
  textOutlineColor?: string;     // hex, CSS outline-color
  textOutlineWidth?: number;     // px, CSS outline-width, default 0

  // === Múltiples sombras ===
  textShadows?: TextShadow[];    // Array de sombras, cada una: { color, blur, offsetX, offsetY }

  // === Desbordamiento ===
  textOverflow?: "hidden" | "visible" | "ellipsis" | "clip"; // default "hidden"

  // === Guide anchors ===
  leftAnchor?: string;
  leftAnchorOffset?: number;
  rightAnchor?: string;
  rightAnchorOffset?: number;
  topAnchor?: string;
  topAnchorOffset?: number;
  bottomAnchor?: string;
  bottomAnchorOffset?: number;

  // === Sombra (compartida con otros tipos) ===
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}
```

---

## Fuentes

El editor soporta tres categorías de fuentes:

### Fuentes del Sistema

Fuentes nativas del sistema operativo, organizadas en grupos:

| Grupo | Fuentes |
|-------|---------|
| **Sans-serif** | Inter, System UI, Arial, Arial Black, Helvetica, Verdana, Trebuchet MS, Segoe UI, Tahoma, Century Gothic, Calibri, Candara, Futura, Gill Sans, Impact, Comic Sans |
| **Serif** | Times New Roman, Georgia, Garamond, Book Antiqua, Palatino, Lucida Bright |
| **Monoespaciadas** | Courier New, Lucida Console |

Se renderizan inmediatamente sin necesidad de descarga.

### Google Fonts

Más de 120 fuentes de Google Fonts cargadas bajo demanda sin API key.

**Mecanismo**: Al seleccionar una fuente Google, se inyecta un `<link>` dinámico:
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap" rel="stylesheet">
```

Cada fuente solo se carga una vez (controlado por `Set<string>` interno).

**Lista completa** (120+ fuentes):

`Roboto`, `Open Sans`, `Montserrat`, `Lato`, `Poppins`, `Inter`, `Oswald`, `Raleway`, `Nunito`, `Ubuntu`, `Playfair Display`, `Merriweather`, `PT Sans`, `Noto Sans`, `Quicksand`, `Work Sans`, `Rubik`, `Fira Sans`, `Source Sans Pro`, `Titillium Web`, `Mukta`, `Exo 2`, `Josefin Sans`, `Dosis`, `Hind`, `Catamaran`, `Karla`, `Barlow`, `Inconsolata`, `Crimson Text`, `Libre Baskerville`, `Lora`, `EB Garamond`, `DM Sans`, `DM Serif Display`, `DM Serif Text`, `Heebo`, `Nanum Gothic`, `Noto Serif`, `PT Serif`, `Abril Fatface`, `Alfa Slab One`, `Anton`, `Archivo Black`, `Bebas Neue`, `Bitter`, `Bree Serif`, `Cabin`, `Cairo`, `Chakra Petch`, `Comfortaa`, `Concert One`, `Cormorant Garamond`, `Courgette`, `Crete Round`, `Didact Gothic`, `Domine`, `Economica`, `Fira Sans Condensed`, `Fira Sans Extra Condensed`, `Frank Ruhl Libre`, `Fredoka One`, `Gloria Hallelujah`, `Great Vibes`, `Hind Siliguri`, `Josefin Slab`, `Jost`, `Kalam`, `Kanit`, `Kaushan Script`, `Lemonada`, `Libre Franklin`, `Lobster`, `Lobster Two`, `Luckiest Guy`, `Manrope`, `Marcellus`, `Maven Pro`, `Monda`, `Monoton`, `Mulish`, `Neuton`, `Norican`, `Old Standard TT`, `Orbitron`, `Oxygen`, `Pacifico`, `Padauk`, `Passion One`, `Pathway Gothic One`, `Patua One`, `Philosopher`, `Play`, `Prompt`, `Prosto One`, `Rajdhani`, `Red Hat Display`, `Righteous`, `Rokkitt`, `Saira`, `Saira Condensed`, `Saira Extra Condensed`, `Saira Semi Condensed`, `Sarabun`, `Sedgwick Ave`, `Signika`, `Six Caps`, `Slabo 27px`, `Spartan`, `Staatliches`, `Tajawal`, `Teko`, `Tenor Sans`, `Trirong`, `Ultra`, `Varela Round`, `Volkhov`, `Yanone Kaffeesatz`, `Yeseva One`, `ZCOOL QingKe HuangYou`

### Fuentes Personalizadas

Se pueden subir archivos de fuente directamente:

**Formatos aceptados**: `.ttf`, `.otf`, `.woff`, `.woff2`

**Cómo funciona**:
1. Usuario selecciona archivo → `FileReader` lo convierte a `dataUrl`
2. Se crea un `FontFace` con `new FontFace(name, url(dataUrl))`
3. Se añade a `document.fonts`
4. La fuente se persiste en `localStorage` (clave `design-studio-fonts`)

Las fuentes cargadas aparecen en el grupo "Personalizadas" del selector de fuentes.

### Fuentes desde URL

Dos tipos de URL soportadas:

| Tipo | Ejemplo | Mecanismo |
|------|---------|-----------|
| **Google Fonts CSS** | `https://fonts.googleapis.com/css2?family=Roboto:...` | Extrae el nombre, inyecta `<link>` |
| **Archivo directo** | `https://ejemplo.com/fuente.ttf` | Descarga, convierte a `dataUrl`, crea `FontFace` |

---

## Editor en Canvas

### Doble Click para Editar

1. Usuario hace doble-click en un elemento de texto
2. `handleDoubleClick` se dispara:
   - `stopPropagation()` evita que el canvas maneje el evento
   - `requestAnimationFrame(() => textarea.focus())` posiciona el cursor
   - Se crea un `<textarea>` superpuesto exactamente sobre el texto
   - El texto visual se oculta con `opacity: 0`
3. El textarea mantiene `caret-color` visible para que el cursor se vea

**Comportamiento especial**:
- Click dentro del textarea **no** llama a `selectElement` (no sale del modo edición)
- Doble-click con texto ya en edición retorna temprano (no resetea)
- El textarea usa `ref` para acceso directo al DOM

### Atajos de Teclado

| Combinación | Acción |
|-------------|--------|
| `Ctrl+Enter` | Guarda el texto y sale de edición |
| `Escape` | Cancela la edición (restaura texto original) |
| Click fuera | Guarda el texto (`onBlur`) |

### Textarea vs Visual

Durante la edición:
- El **textarea** captura input del usuario (ocupa el mismo espacio que el texto)
- El **texto visual** se oculta con `opacity: 0, pointerEvents: none`
- Al guardar, el texto visual actualiza su contenido y `opacity` vuelve a 1
- `paddingTop` se calcula para mantener el centrado vertical

```
Estado normal:           Estado edición:
┌──────────────────┐    ┌──────────────────┐
│  Texto visible   │    │  [opacity: 0]    │
│                  │    │  ┌─ textarea ──┐ │
│                  │    │  │ editando... │ │
│                  │    │  └─────────────┘ │
└──────────────────┘    └──────────────────┘
```

---

## Panel de Propiedades (RightPanel)

Al seleccionar un elemento de texto, el RightPanel muestra las siguientes secciones:

### Contenido

```
┌─────────────────────────────┐
│ Contenido                   │
│ ┌─────────────────────────┐ │
│ │ Texto multilínea        │ │
│ │ editable aquí...        │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

Textarea con `resize: vertical` para editar el contenido textual.

### Fuente

| Control | Propiedad | Valores |
|---------|-----------|---------|
| Selector de fuente | `fontFamily` | Desplegable agrupado: Sistema > Serif > Mono > Personalizadas > Google Fonts |
| Tamaño | `fontSize` | Numérico, min 8px |
| Color | `color` | Color picker hex |

El selector de fuente muestra cada fuente renderizada con su propia tipografía (preview visual). Al seleccionar una Google Font, se inyecta automáticamente el `<link>` CSS.

### Estilo

**Botones de acción rápida**:
| Botón | Propiedad | Efecto |
|-------|-----------|--------|
| **B** (bold) | `fontWeight` | Toggle 400 ↔ 700 |
| *I* (italic) | `fontStyle` | Toggle normal ↔ italic |
| <u>U</u> (underline) | `textDecoration` | Toggle none ↔ underline |
| <s>S</s> (strikethrough) | `textDecoration` | Toggle none ↔ line-through |
| Aa (small caps) | `fontVariant` | Toggle normal ↔ small-caps |

**Selectores desplegables**:
| Control | Propiedad | Opciones |
|---------|-----------|----------|
| Peso | `fontWeight` | Thin(100) → Black(900), 9 niveles |
| Transformar | `textTransform` | Normal, MAYÚSCULAS, minúsculas, Capitalizar |

### Espaciado

| Control | Propiedad | Rango/Step |
|---------|-----------|------------|
| Interletraje | `letterSpacing` | step 0.5px |
| Altura línea | `lineHeight` | step 0.1, min 0.5 |
| Esp. palabras | `wordSpacing` | step 0.5px |
| Sangría | `textIndent` | step 1px |
| Escala X % | `charScaleX` | min 10% |
| Escala Y % | `charScaleY` | min 10% |

El escalado de caracteres (`charScaleX`, `charScaleY`) se aplica mediante CSS `transform: scaleX() scaleY()` sobre el contenedor de texto, permitiendo estirar o comprimir el texto horizontal/verticalmente sin cambiar el tamaño de la caja.

### Decoración

| Control | Propiedad |
|---------|-----------|
| Borde texto color | `textStrokeColor` (color picker) |
| Borde texto grosor | `textStrokeWidth` (numérico, step 0.5, min 0) |
| Fondo texto | `textBgColor` (color picker con alpha) |

El borde de texto usa CSS `-webkit-text-stroke`:
```css
-webkit-text-stroke: 2px #000000;
paint-order: stroke fill;
```

### Degradado

| Control | Propiedad |
|---------|-----------|
| Color 1 / Color 2 | `textGradientColors[0]`, `textGradientColors[1]` |
| Presets | 5 combinaciones predefinidas + botón ✕ para quitar |

Se genera un `linear-gradient(135deg, color1, color2)` que se aplica con:
```css
background: linear-gradient(...);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### Alineación

**Horizontal** (botones):
| Botón | Propiedad |
|-------|-----------|
| ≡ | `textAlign: "left"` |
| ≡ | `textAlign: "center"` |
| ≡ | `textAlign: "right"` |

**Vertical** (botones):
| Botón | Propiedad |
|-------|-----------|
| ⊤ | `verticalAlign: "top"` |
| ⟂ | `verticalAlign: "middle"` |
| ⊥ | `verticalAlign: "bottom"` |

La alineación vertical se implementa con CSS Flexbox:
```css
display: flex;
flex-direction: column;
justify-content: flex-start | center | flex-end;
```

### Fuentes Personalizadas

```
┌─────────────────────────────┐
│ Fuentes personalizadas      │
│ ┌─────────────────────────┐ │
│ │ 📁 Subir fuente (TTF/..)│ │
│ └─────────────────────────┘ │
│ ┌─────────────────┐ ┌────┐ │
│ │ URL de Google   │ │Carg│ │
│ │ Fonts o .ttf    │ │  ar│ │
│ └─────────────────┘ └────┘ │
│ │ MiFuente.ttf         ✕ │ │
│ │ OtraFuente.otf       ✕ │ │
└─────────────────────────────┘
```

- Subida local: `loadCustomFont(file)` → `FileReader` → `FontFace` → persist
- URL: `loadFontFromUrl(url)` → detecta automáticamente si es Google Fonts CSS o archivo directo
- Fuentes cargadas se listan con botón ✕ para eliminar

### Exportar como SVG

Convierte el texto a paths SVG vectoriales usando `opentype.js`:

```ts
const svg = await convertToSvgPaths(el);
// → el elemento se transforma a type: "svg", svgContent: "<svg>..."
```

**Proceso**:
1. `convertToSvgPaths()` usa `opentype.js` para cargar la fuente y convertir cada glifo a path SVG
2. El elemento se transforma: `type: "svg"`, todas las propiedades de texto se limpian
3. El SVG resultante se puede editar como paths en el canvas
4. Ideal para exportación a PDF/imprenta donde las fuentes deben estar incrustadas

**Advertencia**: La conversión es irreversible. El texto ya no es editable como texto.

---

## Nuevas Propiedades

### Padding Interno

Controla el espacio interno entre el borde del elemento y el texto. Se compone de 4 valores individuales:

| Control | Propiedad | Default |
|---------|-----------|---------|
| Izquierdo | `textPaddingLeft` | 4px |
| Derecho | `textPaddingRight` | 4px |
| Superior | `textPaddingTop` | 4px |
| Inferior | `textPaddingBottom` | 4px |

Se aplica como CSS `padding` shorthand:
```
padding: top right bottom left;
```

**Ejemplo JSX:**
```jsx
<text x="100" y="100" w="400" h="100"
  textPaddingLeft="20" textPaddingRight="20"
  textPaddingTop="10" textPaddingBottom="10">
  Texto con padding amplio
</text>
```

El padding se respeta durante la edición inline (textarea) para que el texto editado se vea idéntico al renderizado.

---

### Outline Externo

Aplica un contorno decorativo **fuera** del elemento de texto, a diferencia del `textStroke` que va sobre el texto mismo.

| Control | Propiedad | Default |
|---------|-----------|---------|
| Color | `textOutlineColor` | `#6c5ce7` |
| Grosor | `textOutlineWidth` | 0px (desactivado) |

Se aplica como CSS `outline`:
```css
outline: 2px solid #6c5ce7;
outline-offset: 0;
```

**Diferencias con text-stroke:**
| Característica | text-stroke | outline |
|---------------|-------------|---------|
| Se aplica sobre | El texto (las letras) | El contenedor completo |
| Apariencia | Borde en cada letra | Rectángulo alrededor del elemento |
| Grosor útil | Hasta ~5px | Cualquier valor |
| Se exporta como | `textStrokeColor` / `textStrokeWidth` | `textOutlineColor` / `textOutlineWidth` |

**Ejemplo JSX:**
```jsx
<text x="100" y="100" w="400" h="60"
  fontSize="32" color="#ffffff" textAlign="center"
  textOutlineColor="#6c5ce7" textOutlineWidth="3">
  Texto con outline
</text>
```

---

### Múltiples Sombras

Permite añadir hasta 6 sombras de texto independientes, cada una con su propio color, difuminado y desplazamiento. Reemplazan la sombra única del panel Sombra cuando están definidas.

```ts
interface TextShadow {
  color: string;    // Color hex
  blur: number;     // Difuminado en px
  offsetX: number;  // Desplazamiento horizontal en px
  offsetY: number;  // Desplazamiento vertical en px
}

// En DesignElement:
textShadows?: TextShadow[];
```

Se renderizan como CSS `text-shadow` múltiple:
```css
text-shadow: 2px 2px 4px rgba(0,0,0,0.5),
             0px 0px 10px #6c5ce7,
             -2px -2px 4px rgba(255,255,255,0.3);
```

**UI en RightPanel:**
- Lista expandible de sombras (cada una colapsable dentro de un recuadro)
- Cada sombra tiene: color picker, blur, offsetX, offsetY
- Botón "+ Añadir sombra" (máx 6)
- Botón "✕" para eliminar individual
- Botón "Quitar todas las sombras"

**Reglas:**
- Si `textShadows` tiene elementos, se usa en vez de la sombra simple (`shadowColor/shadowBlur/...`)
- Si `textShadows` está vacío o undefined, se usa la sombra simple como fallback
- Sombras con `blur: 0` se omiten del CSS

**Render en código:**
```ts
function textShadowStyle(el: DesignElement): CSSProperties {
  if (el.textShadows && el.textShadows.length > 0) {
    const css = el.textShadows
      .filter((s) => s.color && s.blur > 0)
      .map((s) => `${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.color}`)
      .join(", ");
    return css ? { textShadow: css } : {};
  }
  // fallback a sombra simple...
}
```

**Ejemplo JSX (3 sombras):**
```jsx
<text x="100" y="100" w="500" h="80"
  fontSize="48" fontWeight="900" color="#ffffff" textAlign="center"
  textShadows='[{"color":"#6c5ce7","blur":20,"offsetX":0,"offsetY":0},{"color":"#e94560","blur":10,"offsetX":4,"offsetY":4},{"color":"#000000","blur":5,"offsetX":-2,"offsetY":-2}]'>
  Múltiples Sombras
</text>
```

**Importante**: En JSX las sombras se serializan como JSON string porque JSX no soporta arrays nativamente. El parser JSX las convierte de vuelta con `JSON.parse()`.

---

### Desbordamiento

Controla cómo se comporta el texto cuando excede el tamaño de su contenedor:

| Modo | Valor | CSS aplicado | Comportamiento |
|------|-------|-------------|----------------|
| Ocultar | `"hidden"` | `overflow: hidden` | El texto que excede se recorta |
| Visible | `"visible"` | `overflow: visible` | El texto se sale de la caja |
| ... | `"ellipsis"` | `overflow: hidden; white-space: nowrap; text-overflow: ellipsis` | Se corta con puntos suspensivos en una sola línea |
| Clip | `"clip"` | `overflow: hidden` | Igual que hidden (corta sin puntos) |

**Selector en UI:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Ocultar    │   Visible    │     ...      │    Clip      │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Ejemplo JSX (ellipsis):**
```jsx
<text x="100" y="100" w="300" h="40"
  fontSize="20" color="#ffffff"
  textOverflow="ellipsis">
  Texto muy largo que se cortará con puntos suspensivos...
</text>
```

**Nota**: El modo `ellipsis` fuerza `white-space: nowrap` (texto en una sola línea). Si necesitas múltiples líneas con cortes, usa `"hidden"` o ajusta el tamaño del contenedor.

---

## Renderizado en Canvas

El renderizado en `renderElement.tsx` (`case "text"`) genera el siguiente CSS:

```tsx
const textStyle: CSSProperties = {
  // Posición y transformación
  position: "absolute",
  left: el.x, top: el.y,
  width: el.width, height: el.height,
  transform: `scaleX(${flipH}) scaleY(${flipV}) rotate(${rotation}deg)`,
  opacity: el.opacity,
  zIndex: el.zIndex,

  // Tipografía
  fontSize: el.fontSize,
  fontFamily: el.fontFamily,
  fontWeight: el.fontWeight,
  fontStyle: el.fontStyle,
  color: el.color,
  lineHeight: el.lineHeight ?? 1.2,
  letterSpacing: el.letterSpacing ?? 0,

  // Alineación (Flexbox)
  display: "flex",
  flexDirection: "column",
  justifyContent: verticalAlign,     // flex-start | center | flex-end
  alignItems: textAlign,              // flex-start | center | flex-end

  // Texto multilínea
  padding: `${textPaddingTop}px ${textPaddingRight}px ${textPaddingBottom}px ${textPaddingLeft}px`,
  whiteSpace: textOverflow === "ellipsis" ? "nowrap" : "pre-wrap",
  wordBreak: textOverflow === "ellipsis" ? "break-all" : "break-word",
  overflow: textOverflow === "visible" ? "visible" : "hidden",
  textOverflow: textOverflow === "ellipsis" ? "ellipsis" : undefined,

  // Decoración
  textDecoration: el.textDecoration,
  textTransform: el.textTransform,
  textIndent: el.textIndent,
  wordSpacing: el.wordSpacing,
  fontVariant: el.fontVariant,

  // Fondo de texto
  ...(el.textBgColor ? { backgroundColor: el.textBgColor } : {}),

  // Outline externo
  ...(el.textOutlineWidth && el.textOutlineColor ? {
    outline: `${el.textOutlineWidth}px solid ${el.textOutlineColor}`,
    outlineOffset: 0,
  } : {}),

  // Stroke (borde de texto)
  ...(el.textStrokeColor && el.textStrokeWidth > 0 ? {
    WebkitTextStroke: `${textStrokeWidth}px ${textStrokeColor}`,
    paintOrder: "stroke fill",
  } : {}),

  // Degradado
  ...(el.textGradient ? {
    background: textGradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } : {}),

  // Sombra (múltiple o simple)
  ...(textShadows.length > 0 ? {
    textShadow: textShadows.filter(s => s.color && s.blur > 0)
      .map(s => `${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.color}`).join(", "),
  } : (el.shadowColor && el.shadowBlur > 0 ? {
    textShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`,
  } : {})),
};
```

---

## Sombra de Texto

El texto soporta dos sistemas de sombra:

### Sombra Simple (Compartida)

Usa las propiedades comunes `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY` (compartidas con shapes que usan `box-shadow`):

```ts
if (el.type === "text") {
  return {
    textShadow: `${el.shadowOffsetX ?? 0}px ${el.shadowOffsetY ?? 4}px ${el.shadowBlur}px ${el.shadowColor}`,
  };
}
```

Propiedades:
| Campo | Default | Descripción |
|-------|---------|-------------|
| `shadowColor` | `#000000` | Color de la sombra |
| `shadowBlur` | 0 | Difuminado en px |
| `shadowOffsetX` | 0 | Desplazamiento horizontal en px |
| `shadowOffsetY` | 4 | Desplazamiento vertical en px |

Se configura desde el panel derecho en la sección "Sombra" (compartida con todos los tipos de elemento).

### Múltiples Sombras (Texto exclusivo)

Cuando se define `textShadows[]`, este array reemplaza la sombra simple. Cada sombra tiene su propio color, blur y offset:

```ts
interface TextShadow {
  color: string;    // Color hex
  blur: number;     // px
  offsetX: number;  // px
  offsetY: number;  // px
}

// Render:
textShadow: shadows.map(s => `${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.color}`).join(", ");
```

Ver sección [Múltiples Sombras](#múltiples-sombras) para más detalles.

---

## Exportación JSX

Al exportar un proyecto a `.jsx`, los textos se serializan como:

```jsx
<text x="100" y="100" w="400" h="80"
  fontSize="48"
  fontFamily="Roboto, sans-serif"
  fontWeight="700"
  fontStyle="italic"
  color="#e94560"
  textAlign="center"
  opacity="0.9"
  rotation="5">
  Contenido del texto
</text>
```

**Reglas de exportación**:
- `fontWeight` solo se exporta si ≠ 400 (normal)
- `fontStyle` solo se exporta si ≠ "normal"
- `textAlign` se exporta siempre
- `opacity` se exporta solo si ≠ 1
- `rotation` se exporta solo si ≠ 0
- Propiedades con valor `undefined` o `null` no se exportan
- El contenido textual escapa `"` como `&quot;`
- Las propiedades de espaciado, decoración, sombra, stroke, degradado, escala, etc. se exportan solo si tienen valor

Propiedades exportables: `fontSize`, `fontFamily`, `fontWeight`, `fontStyle`, `color`, `textAlign`, `letterSpacing`, `lineHeight`, `textDecoration`, `textTransform`, `textIndent`, `wordSpacing`, `fontVariant`, `verticalAlign`, `charScaleX`, `charScaleY`, `opacity`, `rotation`, `textStrokeColor`, `textStrokeWidth`, `textBgColor`, `textGradient`, `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`, `bgStyle`, `textPaddingLeft`, `textPaddingRight`, `textPaddingTop`, `textPaddingBottom`, `textOutlineColor`, `textOutlineWidth`, `textShadows`, `textOverflow`, `leftAnchor`, `leftAnchorOffset`, `rightAnchor`, `rightAnchorOffset`, `topAnchor`, `topAnchorOffset`, `bottomAnchor`, `bottomAnchorOffset`.

---

## Conversión a SVG Vectorial

El flujo de conversión texto → SVG usa `opentype.js`:

```
Texto editable (DesignElement.text)
    │
    ▼
convertToSvgPaths(el)  [useTextToPaths.ts]
    │  Carga la fuente con opentype.js
    │  Convierte cada carácter a path SVG
    │  Construye un elemento <svg> con todos los paths
    ▼
DesignElement transformado:
  type: "svg"
  svgContent: "<svg viewBox='...'> <path d='...'/> ... </svg>"
  isSvgPath: true
  text: undefined
  (todas las propiedades de texto se limpian)
    │
    ▼
PathEditor.tsx permite editar paths en canvas
```

**Cuándo usarlo**:
- Exportación a PDF/imprenta
- Necesidad de editar paths individuales
- Animación de paths (morphing)
- Compatibilidad con sistemas que no tienen la fuente instalada

---

## Formato de Datos

### En DesignElement (texto)

```ts
// Ejemplo completo de elemento texto
{
  id: "el_1_1700000000000",
  type: "text",
  x: 100, y: 100,
  width: 400, height: 100,
  rotation: 0,
  opacity: 1,
  zIndex: 1,

  // Contenido
  text: "Hola Mundo",

  // Tipografía
  fontSize: 48,
  fontFamily: "Poppins, sans-serif",
  fontWeight: 700,
  fontStyle: "normal",
  color: "#ffffff",

  // Alineación
  textAlign: "center",
  verticalAlign: "middle",

  // Espaciado
  letterSpacing: 2,
  lineHeight: 1.2,
  wordSpacing: 0,
  textIndent: 0,

  // Estilo
  textTransform: "none",
  textDecoration: "underline",
  fontVariant: "small-caps",

  // Decoración
  textStrokeColor: "#000000",
  textStrokeWidth: 2,
  textBgColor: "#00000044",

  // Escala
  charScaleX: 100,
  charScaleY: 100,

  // Degradado
  textGradient: "linear-gradient(135deg, #ff6b6b, #4ecdc4)",
  textGradientColors: ["#ff6b6b", "#4ecdc4"],

  // Padding interno
  textPaddingLeft: 4,
  textPaddingRight: 4,
  textPaddingTop: 4,
  textPaddingBottom: 4,

  // Outline externo
  textOutlineColor: "#6c5ce7",
  textOutlineWidth: 3,

  // Múltiples sombras
  textShadows: [
    { color: "#6c5ce7", blur: 20, offsetX: 0, offsetY: 0 },
    { color: "#000000", blur: 10, offsetX: 4, offsetY: 4 },
  ],

  // Desbordamiento
  textOverflow: "ellipsis",

  // Sombra
  shadowColor: "#000000",
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
}
```

### Persistencia

Todas las propiedades de texto se persisten automáticamente en `localStorage` mediante la función `persist()` del store de Zustand, invocada tras cada `updateElement()`.

---

## Ejemplos Completos

### Ejemplo 1: Texto básico centrado

```jsx
<text x="200" y="300" w="600" h="100"
  fontSize="64" fontFamily="Inter, sans-serif"
  fontWeight="700" color="#ffffff" textAlign="center">
  Título Principal
</text>
```

### Ejemplo 2: Texto con degradado y sombra

```jsx
<text x="100" y="100" w="400" h="80"
  fontSize="48" fontFamily="Poppins, sans-serif"
  fontWeight="800" textAlign="center"
  textGradient="linear-gradient(135deg, #ff6b6b, #4ecdc4)"
  shadowColor="#000000" shadowBlur="15" shadowOffsetY="8">
  Texto Degradado
</text>
```

### Ejemplo 3: Texto con borde (stroke) y fondo

```jsx
<text x="100" y="100" w="400" h="80"
  fontSize="48" fontFamily="Montserrat, sans-serif"
  fontWeight="900" color="#ffffff" textAlign="center"
  textStrokeColor="#000000" textStrokeWidth="3"
  textBgColor="#00000066"
  letterSpacing="4"
  textTransform="uppercase">
  STROKE TEXT
</text>
```

### Ejemplo 4: Texto con espaciado y escala

```jsx
<text x="100" y="100" w="600" h="80"
  fontSize="36" fontFamily="Roboto, sans-serif"
  color="#e94560" textAlign="left"
  letterSpacing="8"
  wordSpacing="12"
  charScaleX="150"
  textTransform="uppercase">
  ESPACIADO EXTREMO
</text>
```

### Ejemplo 5: Texto vertical con versalitas

```jsx
<text x="100" y="100" w="60" h="400"
  fontSize="24" fontFamily="Playfair Display, serif"
  color="#ffffff" textAlign="center"
  verticalAlign="middle"
  fontVariant="small-caps"
  lineHeight="2">
  Texto Vertical
</text>
```

### Ejemplo 6: Padding interno personalizado

```jsx
<text x="100" y="100" w="400" h="120"
  fontSize="20" fontFamily="Inter, sans-serif"
  color="#ffffff" textAlign="left" verticalAlign="top"
  textBgColor="#1e1e2e"
  textPaddingLeft="24" textPaddingRight="16"
  textPaddingTop="16" textPaddingBottom="12">
  Texto con padding interno asimétrico:
  izquierdo 24px, derecho 16px,
  superior 16px, inferior 12px.
</text>
```

### Ejemplo 7: Outline externo decorativo

```jsx
<text x="100" y="100" w="400" h="60"
  fontSize="32" fontFamily="Montserrat, sans-serif"
  fontWeight="700" color="#ffffff" textAlign="center"
  textOutlineColor="#6c5ce7" textOutlineWidth="4">
  Outline Decorativo
</text>
```

### Ejemplo 8: Múltiples sombras de texto

```jsx
<text x="50" y="50" w="500" h="80"
  fontSize="44" fontWeight="900" color="#ffffff" textAlign="center"
  textShadows='[{"color":"#6c5ce7","blur":25,"offsetX":0,"offsetY":0},{"color":"#e94560","blur":15,"offsetX":5,"offsetY":5},{"color":"#000000","blur":4,"offsetX":-3,"offsetY":-3}]'>
  GLOW + SOMBRA + PROFUNDIDAD
</text>
```

### Ejemplo 9: Desbordamiento con ellipsis

```jsx
<text x="100" y="100" w="250" h="40"
  fontSize="18" fontFamily="system-ui, sans-serif"
  color="#ffffff" textBgColor="#333"
  textOverflow="ellipsis">
  Este texto es muy largo y se cortará con puntos suspensivos porque no cabe en 250px
</text>
```

### Ejemplo 10: Todo combinado — texto cinematográfico

```jsx
<text x="50" y="50" w="600" h="100"
  fontSize="48" fontFamily="Oswald, sans-serif"
  fontWeight="700" color="#ffffff" textAlign="center"
  letterSpacing="4" textTransform="uppercase"
  textOutlineColor="#000000" textOutlineWidth="2"
  textPaddingLeft="20" textPaddingRight="20"
  textShadows='[{"color":"#6c5ce7","blur":30,"offsetX":0,"offsetY":0},{"color":"#000000","blur":8,"offsetX":3,"offsetY":3}]'>
  TÍTULO CINEMATOGRÁFICO
</text>
```

### Guide Anchors (topAnchor / bottomAnchor)

El sistema de anchors se ha extendido al eje vertical. Ahora los textos pueden anclarse tanto horizontal como verticalmente usando guías.

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `leftAnchor` | string | — | ID de guía **vertical** para el borde izquierdo |
| `leftAnchorOffset` | number | 0 | Distancia desde la guía al borde izquierdo |
| `rightAnchor` | string | — | ID de guía **vertical** para el borde derecho |
| `rightAnchorOffset` | number | 0 | Distancia desde la guía al borde derecho |
| `topAnchor` | string | — | ID de guía **horizontal** para el borde superior |
| `topAnchorOffset` | number | 0 | Distancia desde la guía al borde superior |
| `bottomAnchor` | string | — | ID de guía **horizontal** para el borde inferior |
| `bottomAnchorOffset` | number | 0 | Distancia desde la guía al borde inferior |

**Comportamiento:**
- `leftAnchor` + `rightAnchor` → definen `x` y `width` automáticamente
- `topAnchor` + `bottomAnchor` → definen `y` y `height` automáticamente
- Al mover una guía, todos los elementos anclados a ella se actualizan manteniendo su offset
- Al arrastrar un elemento anclado en el canvas, los offsets se recalculan en tiempo real
- Si se elimina una guía, los anchors que la referencian se limpian automáticamente

**Ejemplo JSX con los 4 anchors:**
```jsx
<text leftAnchor="p1-margen-izq" rightAnchor="p1-margen-der"
  topAnchor="p1-titulo-top" bottomAnchor="p1-titulo-bottom"
  autoFitSize="true" fontWeight="800" color="#ffffff">
  Título anclado en los 4 lados
</text>
```

### Ejemplo 11: Múltiples estilos decorativos

```jsx
<text x="50" y="50" w="500" h="200"
  fontSize="42" fontFamily="Lobster, cursive"
  color="#f093fb" textAlign="center"
  textDecoration="underline"
  fontStyle="italic"
  textTransform="capitalize"
  textStrokeColor="#f5576c" textStrokeWidth="1"
  letterSpacing="1.5"
  lineHeight="1.6"
  shadowColor="#f5576c" shadowBlur="20" shadowOffsetY="0">
  Estilo Decorativo
  Con Múltiples Capas
</text>
```

---

## Notas Técnicas

- El texto usa `whiteSpace: "pre-wrap"` para respetar saltos de línea literales en el contenido; modo `ellipsis` fuerza `white-space: nowrap` (una sola línea)
- `word-break: break-word` evita desbordamiento horizontal con palabras largas; modo `ellipsis` usa `word-break: break-all`
- El padding interno por defecto es de 4px en todos los lados (`textPaddingLeft/Right/Top/Bottom`)
- El padding se aplica como CSS `padding` shorthand: `top right bottom left`
- El degradado de texto usa `background-clip: text` (requiere `-webkit-background-clip` para compatibilidad)
- El stroke de texto usa `-webkit-text-stroke` (soportado en todos los navegadores modernos)
- El outline externo usa CSS `outline` con `outline-offset: 0` (diferente del text-stroke que va sobre las letras)
- Las sombras múltiples (`textShadows[]`) reemplazan la sombra simple cuando están definidas; si el array está vacío se usa la sombra simple como fallback
- Las sombras con `blur: 0` se omiten del CSS `text-shadow`
- En JSX, `textShadows` se serializa como JSON string; el parser lo convierte de vuelta con `JSON.parse()`
- Google Fonts se cargan con los pesos 300–900 en regular e italic (no todas las fuentes tienen todos los pesos)
- Las fuentes personalizadas se almacenan como `dataUrl` en localStorage (puede ocupar espacio significativo)
- La conversión a SVG requiere que la fuente esté cargada y disponible en `document.fonts`
- Al hacer doble-click para editar, el textarea usa `caret-color` del color del texto para consistencia visual
