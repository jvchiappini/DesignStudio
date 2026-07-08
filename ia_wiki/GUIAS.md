# Guías — Referencia completa del sistema de guías

Las guías son líneas de referencia invisibles para el usuario final que ayudan a alinear elementos con precisión matemática. La IA puede crear, gestionar y usar guías para construir layouts armónicos y consistentes.

> [!IMPORTANT]
> **RESTRICCIÓN CRÍTICA DE LA IA:** La IA tiene prohibido crear **guías globales** (sin pageId).
> Todas las guías que agregues deben ser locales a su página activa (utilizando el `pageId` respectivo). Puedes crear una **cantidad ilimitada de guías por página** (ej. definir márgenes izquierdos, derechos, tercios y centro simultáneamente) para construir grillas y layouts complejos.

---

## Guías en JSX

Para que las guías persistan al generar o modificar un proyecto mediante JSX, deben incluirse como hijos de `<config>`:

```jsx
<config pageGap="60" showGrid="false" snapToGrid="false" showRulers="true" guideMode="page">
  <guide id="ml" position="120" orientation="vertical" pageId="1" />
  <guide id="c1r" position="1200" orientation="vertical" pageId="1" />
  <guide position="400" orientation="horizontal" pageId="1" />
</config>
```

Reglas:
- `id`: opcional. Identificador único para anclar elementos (`leftAnchor="ml"`, `rightAnchor="c1r"`). Si no se provee, se genera uno automático.
- `position`: posición en px desde el borde izquierdo (vertical) o superior (horizontal) de la página
- `orientation`: `"vertical"` o `"horizontal"`
- `pageId`: **obligatorio**. Usa números (`"1"`, `"2"`, etc.) que el parser traduce automáticamente al ID real de cada página
- `showRulers="true"` en `<config>` es necesario para que las guías sean visibles en el editor

## Herramientas disponibles

| Tool | Uso |
|---|---|
| `add_guide` | Crea una guía horizontal o vertical en una posición px (obligatoriamente vinculada a la página activa) |
| `list_guides` | Lista todas las guías locales con sus IDs |
| `update_guide` | Mueve una guía a una nueva posición |
| `remove_guide` | Elimina una guía por ID |
| `clear_guides` | Borra todas las guías locales del lienzo |
| `snap_elements_to_guide` | Alinea elementos a una guía con anchor preciso |

---

## Orientaciones

- **`vertical`** → define una posición en el eje X. Controla alineación izquierda/centro/derecha.
- **`horizontal`** → define una posición en el eje Y. Controla alineación superior/centro/inferior.

---

## Anchor dinámico en JSX (`leftAnchor` / `rightAnchor` + offset)

Los elementos `<text>` pueden anclarse a guías verticales mediante los atributos `leftAnchor` y `rightAnchor`. Cuando la guía se mueve en el editor, los elementos anclados la siguen manteniendo su distancia relativa.

### El offset

Cada anchor guarda un **offset** — la distancia en px entre el borde del texto y la guía:

- `leftAnchorOffset`: distancia desde la guía `leftAnchor` al borde **izquierdo** del texto
- `rightAnchorOffset`: distancia desde la guía `rightAnchor` al borde **derecho** del texto

**Signo del offset:**
- **Positivo** → el borde del texto está a la **derecha** de la guía (el texto está "dentro" del margen)
- **Negativo** → el borde del texto está a la **izquierda** de la guía (el texto está "fuera" del margen)

**Cómo se calcula:**
- Al cargar JSX: se calcula automáticamente desde la posición del elemento si el atributo no está presente
- Al arrastrar el texto: se recalcula en tiempo real
- Se puede escribir explícitamente por la IA: `leftAnchorOffset="120"`
- Se edita manualmente en el panel derecho (campo "Distancia")
- El serializador lo persiste solo cuando es ≠ 0

### Reglas de comportamiento

| `leftAnchor` | `rightAnchor` | Efecto al mover la guía |
|---|---|---|
| `"g1"` | — | El texto se desliza completo: `el.x = g1.position + leftAnchorOffset` |
| — | `"g1"` | El texto se desliza completo: `el.x = (g1.position + rightAnchorOffset) - el.width` |
| `"g1"` | `"g2"` (distintas) | El texto se redimensiona: cada borde sigue a su guía manteniendo su offset |
| `"g1"` | `"g1"` | El texto se desliza completo (ambos bordes anclados a la misma guía) |

### Ejemplos en JSX

**Offset cero (borde alineado exactamente con la guía):**
```jsx
<config pageGap="60" showRulers="true" guideMode="page">
  <guide id="margin-left" position="120" orientation="vertical" pageId="1" />
  <guide id="margin-right" position="2360" orientation="vertical" pageId="1" />
</config>

<page width="2480" height="3508" bgColor="#0f0f1a">
  <text x="120" y="340" w="2240" h="400"
    leftAnchor="margin-left" rightAnchor="margin-right">
    DESIGN
  </text>
</page>
```
El offset no se escribe (es 0). El parser lo calcula automáticamente. Arrastrar el texto actualiza el offset.

**Offset no cero (texto centrado dentro de los márgenes):**
```jsx
<config pageGap="60" showRulers="true" guideMode="page">
  <guide id="margin-left" position="120" orientation="vertical" pageId="1" />
  <guide id="margin-right" position="2360" orientation="vertical" pageId="1" />
</config>

<page width="2480" height="3508" bgColor="#0f0f1a">
  <text x="240" y="340" w="2000" h="400" fontSize="120"
    fontFamily="Playfair Display, serif" color="#ffffff"
    leftAnchor="margin-left" leftAnchorOffset="120"
    rightAnchor="margin-right" rightAnchorOffset="-120">
    TÍTULO CENTRADO
  </text>
</page>
```
El borde izquierdo del texto está 120px a la derecha de `margin-left` (offset +120). El borde derecho está 120px a la izquierda de `margin-right` (offset -120). Al mover cualquiera de los márgenes, el título mantiene sus "aires" laterales de 120px — la distancia desde la guía al borde del texto no cambia.

### Reglas para la IA

1. **Siempre asigna `leftAnchor`/`rightAnchor` con el `id` de una guía existente** en la misma página
2. **Omite `leftAnchorOffset`/`rightAnchorOffset` cuando sea 0** (se calcula solo)
3. **Escríbelos explícitamente solo cuando el offset sea ≠ 0**, para casos como textos centrados dentro de un área o elementos desplazados de la guía
4. **El `id` de la guía debe ser único** en todo el proyecto. Usa sufijos por página: `margin-left-p1`, `margin-left-p2`, etc.

---

## Anchor — Tabla de referencia

El parámetro `anchor` en `snap_elements_to_guide` decide **qué punto del elemento** se alinea a la guía:

### Guía vertical (eje X)

| anchor | Posición del elemento que toca la guía | Cálculo |
|---|---|---|
| `left` | Borde izquierdo | `el.x = guide.position` |
| `center` | Centro horizontal | `el.x = guide.position − el.width / 2` |
| `right` | Borde derecho | `el.x = guide.position − el.width` |

### Guía horizontal (eje Y)

| anchor | Posición del elemento que toca la guía | Cálculo |
|---|---|---|
| `top` | Borde superior | `el.y = guide.position` |
| `middle` | Centro vertical | `el.y = guide.position − el.height / 2` |
| `bottom` | Borde inferior | `el.y = guide.position − el.height` |

---

## Presets de guías para tamaños comunes

### Historia Instagram / TikTok (1080×1920)

```
Márgenes seguros:
  vertical   60px  → borde izquierdo seguro
  vertical  1020px → borde derecho seguro
  horizontal  80px → borde superior seguro
  horizontal 1840px→ borde inferior seguro

Regla de tercios:
  vertical   360px (1/3 ancho)
  vertical   720px (2/3 ancho)
  horizontal 640px (1/3 alto)
  horizontal 1280px(2/3 alto)

Centro exacto:
  vertical   540px
  horizontal 960px

Ratio áureo (φ ≈ 61.8%):
  vertical   668px
  horizontal 1186px
```

### Post cuadrado Instagram (1080×1080)

```
Márgenes: vertical 60px, vertical 1020px, horizontal 60px, horizontal 1020px
Tercios:  vertical 360px, vertical 720px, horizontal 360px, horizontal 720px
Centro:   vertical 540px, horizontal 540px
```

### Thumbnail YouTube (1280×720)

```
Márgenes: vertical 60px, vertical 1220px, horizontal 40px, horizontal 680px
Centro:   vertical 640px, horizontal 360px
Tercios:  vertical 427px, vertical 853px, horizontal 240px, horizontal 480px
```

### Banner Web (1200×600)

```
Márgenes: vertical 80px, vertical 1120px, horizontal 40px, horizontal 560px
Centro:   vertical 600px, horizontal 300px
```

---

## Workflow de guías — Paso a paso

Puedes crear varias guías a la vez y luego alinear tus elementos de manera coordinada. Por ejemplo:

### Caso 1: Layout en Grid con márgenes y centro
1. Define las guías de la página activa:
   - `add_guide(orientation="vertical", position=60)`   -> Margen izquierdo
   - `add_guide(orientation="vertical", position=540)`  -> Centro vertical
   - `add_guide(orientation="vertical", position=1020)` -> Margen derecho
2. Llama a `list_guides` para obtener los IDs únicos de cada guía creada.
3. Snappea los elementos:
   - Títulos y CTAs: `snap_elements_to_guide(guideId=[ID_guia_540], anchor="center")`
   - Logotipos o iconos a la izquierda: `snap_elements_to_guide(guideId=[ID_guia_60], anchor="left")`
   - Textos de pie o botones de redes sociales a la derecha: `snap_elements_to_guide(guideId=[ID_guia_1020], anchor="right")`

### Caso 2: Centrado perfecto (Centro Horizontal y Vertical)
1. Agrega las dos guías de centro:
   - `add_guide(orientation="vertical", position=540)`
   - `add_guide(orientation="horizontal", position=960)`
2. Llama a `list_guides` para obtener sus IDs.
3. Snappea la caja contenedora a ambas guías consecutivamente:
   - `snap_elements_to_guide(guideId=ID_guia_540, elementIds=[box_id], anchor="center")`
   - `snap_elements_to_guide(guideId=ID_guia_960, elementIds=[box_id], anchor="middle")`

---

## Composición armónica — Reglas de diseño

Cuando el usuario pide un diseño "armónico", "equilibrado" o "profesional":

1. **Siempre usa márgenes**: mínimo 60px en desktop, 80px en verticales.
2. **Aplica la regla de tercios**: coloca el sujeto principal en los puntos de intersección.
3. **Alinea por familia**: todos los títulos tienen el mismo X de inicio; todos los cuerpos también (puedes alinearlos consecutivamente).
4. **Consistencia vertical**: usa un ritmo tipográfico.
5. **Un solo eje central vertical**: define la guía de 540px y centra el contenido principal.

---

## Errores comunes a evitar

| Error | Solución |
|---|---|
| Usar `snap_elements_to_guide` sin llamar primero a `list_guides` | SIEMPRE llamar a `list_guides` antes para obtener el `guideId` real |
| Intentar usar guías globales sin pageId | Las guías globales no son soportadas para la IA. Siempre asocia tus guías al ID de la página activa. |
| Usar `anchor="left"` en una guía horizontal | Para guías horizontales usar `top`, `middle` o `bottom` |
| No especificar `anchor` | Si no se especifica, el tool usa `left` para vertical y `top` para horizontal |
| Crear guías sin usar `snap` | Las guías sin snap no alinean nada — siempre completar el workflow |
