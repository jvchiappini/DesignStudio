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
| `autoFitSize` | boolean | — | Si se incluye, el texto se redimensiona automáticamente para ajustarse al ancho del contenedor (`w`). Se recalcula en tiempo real al redimensionar la caja y al activar la opción en el panel derecho. Usa canvas `measureText` con margen de 4px de seguridad para evitar cortes sub-pixel. |
| `fontFamily` | string | `"system-ui, sans-serif"` | CSS font-family. Recomendadas: `"Poppins, sans-serif"`, `"Inter, sans-serif"`, `"Oswald, sans-serif"`, `"Playfair Display, serif"`, `"Montserrat, sans-serif"`, `"Roboto, sans-serif"`, `"system-ui, sans-serif"` |
| `fontWeight` | number | 400 | Peso: 100 (thin), 300 (light), 400 (normal), 500 (medium), 600 (semi-bold), 700 (bold), 800 (extra-bold), 900 (black) |
| `fontStyle` | string | `"normal"` | `"normal"` o `"italic"` |
| `color` | string | `"#ffffff"` | Color del texto en hex. Sobre fondos oscuros usa `#ffffff`. Sobre fondos claros usa `#1a1a2e`. |

#### `autoFitSize` — Ajuste automático al contenedor

```jsx
<text x="100" y="100" w="600" h="100" fontSize="64" fontWeight="700"
  fontFamily="Oswald, sans-serif" color="#ffffff"
  textAlign="center" autoFitSize="true">
  TÍTULO QUE SE AJUSTA
</text>
```

Al incluir `autoFitSize="true"`, el motor calcula el font-size óptimo usando búsqueda binaria con canvas `measureText` para que el texto quepa exactamente dentro del ancho `w` del contenedor. La palabra más larga del texto determina el límite superior, y se añaden 4px de margen por palabra para evitar diferencias de renderizado sub-pixel. El tamaño se actualiza en tiempo real al redimensionar la caja desde el editor.

### Alineación horizontal (`textAlign`)

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `textAlign` | string | `"left"` (implícito) | `"left"`, `"center"`, `"right"` |

Controla cómo se alinea el texto dentro del ancho (`w`) de la caja.

**Comportamiento detallado:**

- **`"left"`**: El texto comienza desde el borde izquierdo (más padding). Ideal para párrafos, cuerpos de texto, etiquetas, descripciones. El borde derecho queda irregular (ragged right). Úsalo cuando el texto tenga más de 2 líneas.

- **`"center"`**: Cada línea se centra dentro de la caja. Ideal para títulos, encabezados, textos cortos (1-3 líneas), CTAs, textos decorativos. Es el más usado en diseños de redes sociales.

- **`"right"`**: El texto se alinea al borde derecho. Úsalo para fechas, firmas, textos en esquinas, diseños asimétricos, créditos, o cuando la composición visual lo requiera.

**Combinaciones y casos de borde:**

| `textAlign` | Efecto visual | `alignItems` (contenedor flex) | Mejor para |
|-------------|---------------|-------------------------------|------------|
| `"left"` | Alineado a la izquierda | `flex-start` | Párrafos, tarjetas, descripciones |
| `"center"` | Centrado | `center` | Títulos, CTAs, diseños simétricos |
| `"right"` | Alineado a la derecha | `flex-end` | Fechas, créditos, esquinas |

**Con `letterSpacing` negativo:** `textAlign` distribuye el espacio entre caracteres simétricamente. Con `left` el texto empuja hacia la izquierda, con `center` se mantiene centrado incluso con espaciado negativo.

**Con `textIndent`:** Solo afecta a la primera línea. Con `"left"` la sangría empuja la primera línea hacia la derecha. Con `"center"` o `"right"` no tiene efecto visual perceptible.

**Con `textTransform="uppercase"`:** El texto transformado puede ser más ancho. `textAlign` maneja correctamente el nuevo ancho en los tres modos.

### Alineación vertical (`verticalAlign`)

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `verticalAlign` | string | `"middle"` | `"top"`, `"middle"`, `"bottom"` |

Controla cómo se posiciona verticalmente el bloque de texto dentro del alto (`h`) de la caja, considerando el padding interno.

**Comportamiento detallado:**

- **`"top"`**: El texto comienza desde el borde superior (después del `textPaddingTop`). El espacio sobrante queda en la parte inferior. Úsalo cuando:
  - El texto puede crecer hacia abajo (múltiples líneas dinámicas)
  - Tienes una caja grande y el texto debe comenzar arriba
  - Combinas con `textPaddingTop` para controlar el margen superior exacto

- **`"middle"`** (default): El texto se centra verticalmente dentro de la caja (después de aplicar padding). El espacio sobrante se distribuye equitativamente arriba y abajo. Úsalo cuando:
  - Tienes textos de 1-2 líneas en cajas proporcionadas
  - Quieres centrado vertical perfecto
  - El diseño requiere simetría vertical

- **`"bottom"`**: El texto se posiciona en la parte inferior (después del `textPaddingBottom`). Úsalo cuando:
  - El texto debe anclarse abajo (subtítulos, atribuciones)
  - Tienes una imagen arriba y texto abajo en la misma caja
  - Quieres un efecto de "línea de fondo"

**Implementación técnica:**
La caja de texto usa flexbox con `flexDirection: "column"`. `verticalAlign` controla `justifyContent`:
- `"top"` → `justifyContent: "flex-start"`
- `"middle"` → `justifyContent: "center"`
- `"bottom"` → `justifyContent: "flex-end"`

El padding se aplica al contenedor flex. El contenido textual es un único hijo flex que se posiciona según `justifyContent`.

### Interacción entre `textAlign` y `verticalAlign`

Ambos ejes son independientes. Cualquier combinación funciona:

| Combinación | Efecto visual |
|-------------|---------------|
| `textAlign="left"` + `verticalAlign="top"` | Texto anclado en esquina superior izquierda. Ideal para paneles de información. |
| `textAlign="center"` + `verticalAlign="middle"` | Texto perfectamente centrado en ambos ejes. El más usado para títulos. |
| `textAlign="right"` + `verticalAlign="bottom"` | Texto anclado en esquina inferior derecha. Ideal para marcas de agua, créditos, firmas. |
| `textAlign="center"` + `verticalAlign="top"` | Título centrado horizontalmente pero pegado arriba. Bueno para encabezados de sección. |
| `textAlign="left"` + `verticalAlign="bottom"` | Texto alineado a la izquierda pero pegado abajo. Útil en pies de tarjeta. |
| `textAlign="right"` + `verticalAlign="top"` | Texto a la derecha pegado arriba. Bueno para "leer más" o enlaces. |

### Interacción con padding

El padding se resta ANTES de aplicar la alineación:

```jsx
<text x="60" y="60" w="400" h="120" fontSize="20" color="#ffffff"
  textAlign="center" verticalAlign="middle"
  textPaddingLeft="40" textPaddingRight="40"
  textPaddingTop="20" textPaddingBottom="20">
  Texto centrado con padding generoso
</text>
```

En este ejemplo:
- El texto solo ocupa 320px de ancho (400 - 40 - 40)
- La alineación vertical calcula el centro dentro de 80px de alto (120 - 20 - 20)
- El texto queda visualmente centrado con aire alrededor

### Interacción con `lineHeight`

`lineHeight` afecta cómo se ve la alineación vertical:

- **Con `verticalAlign="top"`**: `lineHeight` controla el espacio entre líneas. La primera línea siempre comienza en el top (después del padding). Líneas subsiguientes se apilan debajo.

- **Con `verticalAlign="middle"`**: Si `lineHeight` es grande (2.0+) y el texto es multi-línea, el bloque de texto podría verse desplazado visualmente hacia arriba porque el centro se calcula sobre el alto total del contenido, no sobre la primera línea. Para texto multi-línea con `verticalAlign="middle"`, usa `lineHeight` entre 1.0 y 1.5 para resultados predecibles.

- **Con `verticalAlign="bottom"`**: `lineHeight` empuja hacia arriba desde el borde inferior. Con `lineHeight` grande, la última línea se separa del borde inferior aparente.

### Alineación con `textOverflow="ellipsis"`

Cuando se usa `textOverflow="ellipsis"`:
- El texto se fuerza a `whiteSpace: "nowrap"` (una sola línea)
- `textAlign` sigue funcionando: los puntos suspensivos aparecen al final del texto alineado
- `verticalAlign="middle"` centra la única línea verticalmente — ideal para listas o feeds
- `verticalAlign="top"` es útil cuando hay múltiples elementos de texto alineados por su parte superior

```jsx
<text x="100" y="100" w="250" h="40" fontSize="16" color="#ffffff"
  textAlign="left" verticalAlign="middle"
  textOverflow="ellipsis">
  Texto muy largo que se cortará con puntos suspensivos
</text>
```

### Alineación con `textStroke`

El stroke (borde de letra) NO afecta la alineación. Se dibuja sobre la geometría existente del texto. Un `textStrokeWidth` grande (5px+) NO desplaza el texto ni cambia su alineación.

### Guía rápida por caso de uso

| Situación | `textAlign` | `verticalAlign` | `lineHeight` sugerido | Ejemplo |
|-----------|-------------|-----------------|----------------------|---------|
| Título principal centrado | `"center"` | `"middle"` | 1.0-1.1 | Portadas, slides |
| Título centrado pegado arriba | `"center"` | `"top"` | 1.0-1.1 | Encabezados de sección |
| Párrafo de cuerpo | `"left"` | `"top"` | 1.5-1.8 | Descripciones, artículos |
| Subtítulo o metadata | `"left"` | `"top"` | 1.2-1.4 | Tarjetas, feeds |
| CTA / Botón | `"center"` | `"middle"` | 1.0 | Botones, pills |
| Marca de agua | `"right"` | `"bottom"` | 1.0 | Esquina inferior derecha |
| Fecha / Autor | `"right"` | `"top"` | 1.2 | Cabeceras de artículo |
| Créditos / Footer | `"center"` | `"bottom"` | 1.4 | Pie de página, cierre |
| Texto vertical (poco común) | `"center"` | `"middle"` | 2.0+ | Diseños editoriales |
| Texto en badge/chip | `"center"` | `"middle"` | 1.0 | Tags, etiquetas |

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

### ⚠️ TEXTO RECORTADO: Causas y soluciones

**Problema:** El texto se ve parcialmente recortado/truncado aunque no se use `textOverflow="ellipsis"`.

**Causa raíz:** La caja del texto (`h` + padding) es más pequeña que el espacio que realmente ocupa el contenido. El `textOverflow` por defecto es `"hidden"`, lo que recorta silenciosamente cualquier excedente. El texto NUNCA ajusta automáticamente el tamaño de su contenedor.

#### Fórmula para calcular el alto mínimo necesario

```
h_mínima = (fontSize × lineHeight × número_de_líneas) + textPaddingTop + textPaddingBottom
```

Donde `número_de_líneas` depende del ancho `w`, el `fontSize` y el contenido real.

**Ejemplo concreto de recorte:**

```jsx
<!-- ❌ RECORTADO: h insuficiente -->
<text x="60" y="600" w="500" h="100" fontSize="28" lineHeight="1.6"
  color="#ffffff" textAlign="left" verticalAlign="top"
  textPaddingTop="16" textPaddingBottom="16">
  Línea 1: Introducción al tema
  Línea 2: Desarrollo del concepto
  Línea 3: Conclusión del párrafo
</text>
```

Cálculo:
- Alto del texto: 28px × 1.6 × 3 líneas = 134.4px
- Padding total: 16 + 16 = 32px
- Alto necesario: 134.4 + 32 = **166.4px**
- Alto actual (`h`): **100px** ← ¡66px de recorte!

```jsx
<!-- ✅ CORREGIDO: h = 180px suficiente -->
<text x="60" y="600" w="500" h="180" fontSize="28" lineHeight="1.6"
  color="#ffffff" textAlign="left" verticalAlign="top"
  textPaddingTop="16" textPaddingBottom="16">
  Línea 1: Introducción al tema
  Línea 2: Desarrollo del concepto
  Línea 3: Conclusión del párrafo
</text>
```

#### Casos donde el recorte es más sutil

**1. `verticalAlign="middle"` con padding y texto grande:**
```jsx
<!-- h parece suficiente pero el centrado + padding roba espacio -->
<text x="60" y="60" w="400" h="80" fontSize="36" lineHeight="1.2"
  color="#ffffff" textAlign="center" verticalAlign="middle"
  textPaddingTop="20" textPaddingBottom="20">
  Título
</text>
```
- Texto: 36px × 1.2 × 1 línea = 43.2px
- Padding: 20 + 20 = 40px
- Necesario: 83.2px
- `h` = 80px → 3.2px de recorte (la última línea o el borde inferior se corta)

→ Solución: `h="100"` o reducir padding a `textPaddingTop="12"` `textPaddingBottom="12"`

**2. Múltiples líneas con `lineHeight` grande:**
```jsx
<text x="60" y="300" w="400" h="120" fontSize="18" lineHeight="2.0"
  color="#a0a0b0" textAlign="left" verticalAlign="top">
  Línea 1
  Línea 2
  Línea 3
  Línea 4
</text>
```
- Texto: 18px × 2.0 × 4 líneas = 144px
- Padding: 4 + 4 = 8px
- Necesario: 152px
- `h` = 120px → recorte severo

→ Solución: reducir `lineHeight` a `1.5` o aumentar `h` a `160`

**3. Texto con `textTransform="uppercase"`:**
Las mayúsculas ocupan más espacio vertical que las minúsculas (tienen ascendentes completos). Si el `h` se calculó para minúsculas, al aplicar `textTransform="uppercase"` el texto puede recortarse.

**4. Texto con `fontWeight="bold"` (800-900):**
Las fuentes en negrita pueden tener ascendentes/descendentes ligeramente más grandes, ocupando más espacio vertical del estimado.

#### Tu responsabilidad como IA

**SIEMPRE debes calcular `h` correctamente.** No adivines. Usa la fórmula:

```
h = (fontSize × lineHeight × líneas_estimadas) + paddingTop + paddingBottom + 10px_de_margen
```

- Para texto de 1 línea: `h = fontSize × lineHeight + paddingTop + paddingBottom + 10`
- Para texto de 2 líneas: `h = fontSize × lineHeight × 2 + paddingTop + paddingBottom + 10`
- Para texto de 3+ líneas: igual pero multiplicando por el número de líneas

**Regla empírica rápida por `fontSize` (1 línea, `lineHeight="1.2"`, padding 4px):**

| fontSize | `h` mínimo |
|----------|-----------|
| 12-16 | 30-40 |
| 18-24 | 50-70 |
| 28-36 | 70-90 |
| 40-56 | 90-130 |
| 64-72 | 120-150 |
| 80-96 | 150-200 |

Para múltiples líneas, multiplica por el número de líneas y suma padding.

**Para `verticalAlign="middle"`** necesitas 2-4px extras porque el centrado puede dejar el texto 1-2px desplazado dentro de la caja.

#### Cómo depurar texto recortado

1. **Aumenta `h` en 20-40px** y verifica si el texto completo aparece.
2. **Reduce `textPaddingTop` y `textPaddingBottom`** a 4px cada uno para maximizar el espacio útil.
3. **Usa `lineHeight` más ajustado** (1.0-1.2 para títulos, 1.4-1.6 para cuerpo).
4. **Si nada funciona, usa `textOverflow="visible"`** (el texto desbordará la caja pero no se recortará). Úsalo solo si estás seguro de que el desbordamiento no arruina el diseño.
5. **Renderiza la página con `render_preview`** para ver visualmente si el texto se corta.

#### Resumen visual de causas de recorte

| Causa | Síntoma | Solución |
|-------|---------|----------|
| `h` muy pequeño | Texto cortado en borde inferior | Aumentar `h` |
| Padding excesivo | Texto comprimido, poco espacio | Reducir padding |
| `lineHeight` muy alto | Líneas separadas que no caben | Reducir `lineHeight` |
| `fontSize` muy grande | Texto gigante en caja chica | Reducir fontSize o aumentar h |
| `verticalAlign="top"` con poco h | Borde inferior corta última línea | Aumentar h |
| `verticalAlign="bottom"` con poco h | Borde superior corta primera línea | Aumentar h |
| `verticalAlign="middle"` con h justo | Ambos bordes cortan simétricamente | Aumentar h 10-20px |
| Múltiples líneas inesperadas | El texto real tiene + líneas de las estimadas | Contar líneas, ajustar h |

### Sombra de elementos (compartida con figures)

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `shadowColor` | string | `"#000000"` | Color de sombra (text-shadow para texto) |
| `shadowBlur` | number | 0 | Difuminado en px |
| `shadowOffsetX` | number | 0 | Desplazamiento horizontal en px |
| `shadowOffsetY` | number | 4 | Desplazamiento vertical en px |

### Anclaje a guías (Guide Anchors)

Los elementos `<text>` pueden anclarse a guías verticales Y horizontales. Cuando la guía se mueve, el elemento la sigue manteniendo la distancia (offset) entre su borde y la guía.

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `leftAnchor` | string | — | ID de la guía **vertical** a la que se ancla el borde izquierdo del texto. |
| `leftAnchorOffset` | number | _calculado_ | Distancia en px desde la guía `leftAnchor` al borde izquierdo del texto. |
| `rightAnchor` | string | — | ID de la guía **vertical** a la que se ancla el borde derecho del texto. |
| `rightAnchorOffset` | number | _calculado_ | Distancia en px desde la guía `rightAnchor` al borde derecho del texto. |
| `topAnchor` | string | — | ID de la guía **horizontal** a la que se ancla el borde superior del texto. |
| `topAnchorOffset` | number | _calculado_ | Distancia en px desde la guía `topAnchor` al borde superior del texto. |
| `bottomAnchor` | string | — | ID de la guía **horizontal** a la que se ancla el borde inferior del texto. |
| `bottomAnchorOffset` | number | _calculado_ | Distancia en px desde la guía `bottomAnchor` al borde inferior del texto. |

**Comportamiento al mover una guía anclada (horizontal/X):**

| `leftAnchor` | `rightAnchor` | Efecto en X |
|---|---|---|
| `"g1"` | — | El texto se desliza completo: `el.x = g1.position + leftAnchorOffset` |
| — | `"g1"` | El texto se desliza completo: `el.x = (g1.position + rightAnchorOffset) - el.width` |
| `"g1"` | `"g2"` (distintas) | El texto se redimensiona horizontalmente |
| `"g1"` | `"g1"` | El texto se desliza completo |

**Comportamiento al mover una guía anclada (vertical/Y):**

| `topAnchor` | `bottomAnchor` | Efecto en Y |
|---|---|---|
| `"g1"` | — | El texto se desliza completo: `el.y = g1.position + topAnchorOffset` |
| — | `"g1"` | El texto se desliza completo: `el.y = (g1.position + bottomAnchorOffset) - el.height` |
| `"g1"` | `"g2"` (distintas) | El texto se redimensiona verticalmente |
| `"g1"` | `"g1"` | El texto se desliza completo |

**El offset:**

- Se **calcula automáticamente** al cargar JSX si no se especifica explícitamente
- Se **recalcula** al arrastrar el texto en el editor (panel derecho o canvas)
- Se puede **editar manualmente** en el panel derecho (campo "Distancia")
- La IA puede escribirlo explícitamente en JSX: `leftAnchorOffset="120"`
- El serializador solo lo persiste cuando es distinto de cero

**Ejemplo con los cuatro anchors + autoFitSize (recomendado):**
```jsx
<text leftAnchor="p1-margen-izq" rightAnchor="p1-margen-der"
  topAnchor="p1-titulo-top" bottomAnchor="p1-titulo-bottom"
  autoFitSize="true" fontWeight="800" fontFamily="Oswald, sans-serif" color="#ffffff">
  DESIGN
</text>
```
El sistema calcula automáticamente x, y, width, height y fontSize desde las guías.

**Ejemplo con offsets (sangrías interiores):**
```jsx
<text leftAnchor="ml-p1" leftAnchorOffset="120"
  rightAnchor="mr-p1" rightAnchorOffset="-120"
  topAnchor="mt-p1" topAnchorOffset="40"
  bottomAnchor="mb-p1" bottomAnchorOffset="-40"
  autoFitSize="true" fontWeight="400" fontFamily="Playfair Display, serif" color="#ffffff">
  Texto con márgenes interiores en los 4 lados
</text>
```

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
