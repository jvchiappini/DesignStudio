# Design Studio — Memory

## Project
Editor visual de diseño con canvas multiuso, exportación JSX/PNG/JPG/WebP, capas, guías y configuración por página.

## Implemented

### Core
- Canvas con zoom, pan, múltiples páginas con gap
- Elementos: texto, imagen, shape (rect/circle/triangle/star/line), SVG
- Redimensionar con handles, rotar, mover, alinear, distribuir
- Cuadrícula, snapping, reglas, guías (globales y por página)
- Historial de deshacer/rehacer
- Portapapeles (copiar/pegar/duplicar)

### Texto
- Editor en canvas con doble click, Ctrl+Enter guardar, Escape cancelar
- Google Fonts (120+ fuentes) + carga dinámica sin API key
- Fuentes personalizadas: subir TTF/OTF/WOFF/WOFF2 + cargar por URL
- Selector de fuente con preview (dropdown custom)
- Tamaño, color, peso, estilo, alineación, interlineado, tracking, etc.
- Sombra de texto, stroke, gradient text, versalitas
- Convertir texto a SVG vectorial (opentype.js)

### Imagen
- Filtros: brillo, contraste, saturación, desenfoque (CSS filter)
- Subir desde archivo, URL remota

### Shapes
- Relleno sólido + degradado lineal/radial con 2 stops
- Borde con color y grosor
- Radio de esquina global + individual (TL/TR/BR/BL)
- Modos de fusión (12 modos CSS mix-blend-mode)

### Capas
- Panel con lista ordenada por z-index
- Toggle visibilidad 👁, candado 🔒
- Flechas ▲▼ para subir/bajar una posición
- Bring to front / send to back / bring forward / send backward

### Exportación
- Formato JSX (humano + IA) con `<project>`, `<config>`, `<page>`, `<guide>`
- PNG (transparente si la hoja no tiene fondo), JPG, WebP
- Escala 1x–4x, selección de páginas (all, rangos, exclusión)
- Captura individual por página clonada (html-to-image)
- Loading overlay durante exportación

### Proyecto
- Abrir archivos .jsx, .designstudio, .json
- Nombre editable, persistencia en localStorage
- Múltiples páginas con presets + tamaño personalizado

## Implemented Recently
- Auto-save: persist en localStorage después de cada acción
- Zoom 1:1 en BottomBar
- Menú contextual: clic derecho con Copiar/Pegar/Duplicar/Eliminar/Traer al frente/Enviar al fondo
- Panel de capas mejorado: visibilidad 👁, candado 🔒, flechas ▲▼ de orden, elementos ocultos/bloqueados
- Filtros de imagen: brillo, contraste, saturación, desenfoque
- Esquinas individuales: radio TL/TR/BR/BL en shapes
- Degradados lineal/radial en shapes con 2 stops
- Modos de fusión (12 modos CSS mix-blend-mode)
- Lock aspect ratio con Shift al redimensionar
- Selección múltiple: Shift+click para seleccionar varios elementos
- Mover selección múltiple: arrastrar un elemento seleccionado mueve todos juntos
- Estilos de borde: Solid/Dashed/Dotted en shapes
- Recorte de imagen (crop UI): overlay con handles, aplicar/cancelar, cropping real con canvas
- Pegar estilos: copiar/pegar formato (fuente, color, bordes, relleno, sombra, etc.) entre elementos desde menú contextual
- Sistema completo de fondos multicapa: `BackgroundLayer` type con color, gradiente (lineal/radial/cónico), imagen, patrón (ajedrez/puntos/rayas/cuadrícula/trama)
- Editor de capas de fondo en RightPanel (shapes) y sidebar Background (páginas)
- `BackgroundLayerEditor` con add/remove/reorder, preview, toggle, expand/colapsar por capa
- Editor de paradas de gradiente con hasta 6 stops, posición por slider
- Patrones CSS: checkerboard, dots, stripes, grid, crosshatch configurables
- Opacidad y blend mode por capa de fondo
- Export JSX con atributo `bgStyle` con CSS `background` completo

### Nuevas propiedades de texto
- Padding interno individual (izquierdo, derecho, superior, inferior)
- Outline decorativo externo con color y grosor
- Múltiples sombras de texto (hasta 6, con color/blur/offsetX/offsetY)
- Modos de desbordamiento: hidden, visible, ellipsis (...), clip
- UI completa en RightPanel para padding, outline, overflow, sombras múltiples
- Render con padding dinámico, outline CSS, text-shadow múltiple, text-overflow

## Pending High Priority
- Selección múltiple con caja: arrastrar en canvas vacío para seleccionar varios elementos con marquesina

## Pending Medium Priority
- Panel de historial: lista visual de deshacer/rehacer

## Pending Low Priority
- Biblioteca de iconos (Feather, Lucide, etc.)
- Generador de QR
- Máscaras / clipping

## Decisiones técnicas
- Zustand para estado global
- html-to-image para exportación
- Tailwind CSS para estilos
- Google Fonts sin API key (CSS dinámico)
- Formato JSX propio para guardar proyectos
- DOMParser nativo para parsear JSX
