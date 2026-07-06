# DesignStudio

Editor visual de diseño multipropósito con canvas interactivo, exportación multi-formato, Auto Layout, capas, guías, iconos, QR, máscaras, recorte con curvas Bezier y panel de chat con herramientas IA.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Estilos | Tailwind CSS 3 + CSS Modules |
| Estado | Zustand 5 |
| Exportación | html-to-image |
| Fuentes | Google Fonts (vía CSS dinámico, sin API key) |
| QR | API qrserver.com |
| Formas SVG | Opentype.js (texto a path) |

## Funcionalidades

### Editor visual
- **Canvas multipágina** con carrusel de páginas, zoom y pan
- **Elementos**: Texto, imagen, formas (rectángulo, círculo, triángulo, estrella, línea), SVG
- **Selección múltiple** con teclas Shift/Ctrl
- **Redimensionar, rotar, mover** con snap a guías y grid
- **Auto Layout**: direcciones row/column, gap, padding, align, justify, wrap
- **Capas** con reordenación drag & drop, visibilidad y bloqueo
- **Guías** globales y por página, reglas

### Propiedades de texto
- Google Fonts (100+ fuentes) + fuentes personalizadas (TTF/OTF/WOFF)
- Tamaño, peso, estilo, interletraje, altura de línea, alineación
- Color, gradiente, fondo de texto, transformación (uppercase, etc.)
- Decoración (subrayado, tachado), variante (small-caps), sangría
- **Padding asimétrico** (top/right/bottom/left)
- **Outline** de caja (color + ancho)
- **Múltiples sombras** (hasta 6) con offset, blur y color
- **Overflow**: visible, hidden, clip, ellipsis

### Propiedades de formas
- Fondo sólido o gradiente (lineal/radial/cónico)
- Borde (color, ancho, estilo)
- Bordes redondeados individuales (TL/TR/BR/BL)

### Propiedades de imagen
- URL o subida desde archivo
- Filtros: brillo, contraste, saturación, blur
- Recorte rectangular visual con handles

### Clip / Máscara
- Recorte rectangular con handles drag
- **Clip-path CSS** con presets (círculo, óvalo, rombo, hexágono, triángulo, estrella)
- **Editor visual Bezier**: clic para agregar puntos, drag para ajustar curvas, cerrar path
- Soporte para `circle()`, `ellipse()`, `polygon()`, `inset()`, `path()`

### Capas de fondo
- Múltiples capas por página: color sólido, gradiente, imagen, patrón (checkerboard, dots, stripes, grid, crosshatch)
- Opacidad y blend mode por capa

### Iconos y QR
- **50 iconos** Feather-style con drag-to-canvas e inserción por clic
- **Generador QR**: input de texto/URL, preview, añadir al canvas

### Exportación
- PNG, JPG, WebP, PDF
- Selección de páginas (individual, rango, todas)
- Escala personalizada

### Chat IA
- Panel lateral resizable (drag para ajustar ancho, 200–800px)
- **14 herramientas IA**: estado del canvas, seleccionar, eliminar, mover, redimensionar, cambiar texto, color, crear texto/formas, opacidad, imagen, duplicar, listar tools
- Comandos por chat: `estado`, `tools`, `seleccionar [id]`, `eliminar [id]`, `mover [id] [x] [y]`
- Arquitectura extensible para integrar LLMs reales

### Skill para IA
- **SKILL.md** en `.opencode/skills/` y `.claude/skills/` para OpenCode y Claude Code
- 7 proyectos de ejemplo (red social, thumbnail, story, tarjeta, poster, banner, logo)
- 20 paletas de color, 5 patrones CSS, 12 font pairings, 6 patrones de componentes

## Instalación

```bash
npm install
npm run dev
```

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila TypeScript y construye para producción |
| `npm run preview` | Previsualiza la build de producción |

## Estructura del proyecto

```
src/
├── App.tsx                  # Punto de entrada
├── editor/
│   ├── types.ts             # Interfaces y tipos
│   ├── editorStore.ts       # Estado global (Zustand)
│   ├── EditorCanvas.tsx     # Canvas interactivo
│   ├── LeftSidebar.tsx      # Barra lateral izquierda
│   ├── RightPanel.tsx       # Panel de propiedades derecho
│   ├── TopBar.tsx           # Barra superior
│   ├── BottomBar.tsx        # Barra inferior
│   ├── CropOverlay.tsx      # Overlay de recorte
│   ├── CropPreviewOverlay.tsx # Preview de recorte para IA
│   ├── BezierPathEditor.tsx  # Editor visual de curvas Bezier
│   ├── ChatPanel.tsx        # Panel de chat con IA
│   ├── renderElement.tsx    # Renderizado de elementos
│   ├── cropUtils.ts         # Utilidades de recorte
│   ├── googleFonts.ts       # Carga de Google Fonts
│   ├── icons.ts             # 50 iconos SVG
│   ├── IconPicker.tsx       # Selector de iconos
│   ├── QRGenerator.tsx      # Generador QR
│   ├── LayoutEditor.tsx     # Editor de Auto Layout
│   ├── BackgroundLayerEditor.tsx
│   ├── backgroundUtils.ts
│   ├── PathEditor.tsx       # Editor de subpaths
│   ├── GridOverlay.tsx      # Overlay de grid
│   ├── GuideOverlay.tsx     # Overlay de guías
│   ├── RulerOverlay.tsx     # Reglas
│   └── ai/                  # Infraestructura IA
│       ├── index.ts
│       ├── aiToolTypes.ts
│       ├── aiContextBuilder.ts
│       └── toolRegistry.ts  # 14 herramientas IA
├── hooks/
│   ├── useExport.ts         # Exportación multi-formato
│   ├── useFontLoader.ts     # Carga de fuentes
│   └── useTextToPaths.ts    # Texto a paths SVG
└── utils/
    └── svgTextToPaths.ts
```

## Licencia

MIT
