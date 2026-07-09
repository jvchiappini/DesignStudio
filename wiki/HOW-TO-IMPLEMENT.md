# Cómo implementar una nueva propiedad o tipo de elemento en Design Studio

Esta guía documenta el proceso completo para añadir una nueva propiedad a un tipo existente, o crear un nuevo tipo de elemento. Sigue estos pasos en orden para garantizar que la propiedad funcione correctamente en todas las capas del sistema.

La arquitectura actual centraliza la lógica específica por tipo en **Behaviors** (`src/core/behaviors/`) y la lógica de resolución de anchors en **AnchorService** (`src/core/services/`). Los parsers y serializadores delegan en estos servicios.

---

## Índice de archivos a modificar

| # | Archivo | Propósito |
|---|---------|-----------|
| 1 | `src/editor/utils/types.ts` | Definición del tipo TypeScript |
| 2 | `src/core/behaviors/<Type>Behavior.ts` | Parseo, serialización, validación y defaults |
| 3 | `src/core/behaviors/BehaviorRegistry.ts` | Registrar nuevo tipo de elemento |
| 4 | `src/core/services/AnchorService.ts` | Lógica de resolución de anchors (si aplica) |
| 5 | `src/editor/store/editorStore.ts` | Store de Zustand y creación de elementos |
| 6 | `src/editor/utils/renderElement.tsx` | Renderizado visual (si aplica) |
| 7 | `src/editor/components/canvas/EditorCanvas.tsx` | Interacción en canvas (si aplica) |
| 8 | `src/editor/components/canvas/GuideOverlay.tsx` | Overlay de guías (si aplica) |
| 9 | `src/editor/ai/applyPatchTool.ts` | Validación en `apply_patch` XML |
| 10 | `src/editor/ai/systemPrompt.ts` | Prompt del sistema para la IA |
| 11 | `src/editor/ai/toolRegistry.ts` | Herramientas de IA (si aplica) |
| 12 | `src/editor/ai/jsxApplicator.ts` | Aplicador de proyectos JSX |
| 13 | `ia_wiki/*.md` | Wiki para la IA |
| 14 | `wiki/elements/*.md` | Wiki para humanos |

---

## Caso A: Nueva propiedad en un tipo existente

### Paso 1: Types (`src/editor/utils/types.ts`)

Añade la propiedad al interface `DesignElement`:

```typescript
leftAnchor?: string;
leftAnchorOffset?: number;
autoFitSize?: boolean;
```

**Convenciones:**
- Propiedades de texto: prefijo `text` + nombre (`textPaddingLeft`, `textStrokeColor`)
- Propiedades de imagen: prefijo `img` (`imgBrightness`, `imgContrast`)
- Propiedades de shape: nombre directo (`borderRadius`, `fillGradient`)
- Anchors: nombre descriptivo + `Anchor`/`AnchorOffset`

### Paso 2: Behavior (`src/core/behaviors/<Type>Behavior.ts`)

Cada tipo de elemento encapsula su lógica en un archivo Behavior. Modifica el Behavior correspondiente:

#### 2a. Parseo en el método `parse()`

```typescript
parse(ctx: ParseContext, id: string): DesignElement {
    const { el, startX, elementCount } = ctx;
    return {
        // ...propiedades existentes...
        miPropiedad: el.getAttribute("miPropiedad") || "default",
        miPropiedadNumerica: hasAttr(el, "miPropiedadNumerica")
            ? numAttr(el, "miPropiedadNumerica")
            : undefined,
    } as DesignElement;
}
```

Helpers disponibles desde `parseHelpers.ts`:
- `numAttr(el, "attr", default)` — número con default
- `strAttr(el, "attr")` — string opcional → `T | undefined`
- `boolAttr(el, "attr", default)` — booleano
- `hasAttr(el, "attr")` — verifica presencia
- `parseClipMask(raw)` — parsea `"type:value"` → ClipMask

#### 2b. Serialización en el método `serialize()`

```typescript
serialize(el: DesignElement, ctx: SerializeContext): string {
    const { rx, llmMode } = ctx;
    // Usa los helpers `a()`, `ab()`, `q()` de parseHelpers:
    return (
        `    <${el.type} id=${q(el.id)}` +
        // ...atributos comunes...
        a("miPropiedad", el.miPropiedad, "default") +  // omitido si = default
        a("miPropiedadNumerica", el.miPropiedadNumerica, 0) +
        ` />\n`
    );
}
```

Los helpers `a()`/`ab()` omiten el atributo cuando el valor es `undefined`, `null` o igual al default, manteniendo el JSX limpio.

#### 2c. Validación en `validate()` (opcional)

```typescript
validate(el: DesignElement): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];
    if (!el.miPropiedad) errors.push({ field: "miPropiedad", message: "..." });
    return errors;
}
```

#### 2d. Defaults en `createDefault()`

Ya existen valores por defecto para cada tipo. Si la nueva propiedad necesita un valor distinto de `undefined`, añádelo al objeto default.

### Paso 3: AnchorService (si la propiedad es un anchor)

Si la propiedad referencia una guía (como `leftAnchor`, `topAnchor`, etc.), añade lógica en `AnchorService.ts`:

1. **`resolveElement(el)`** — recalcular x/y/w/h desde el anchor
2. **`defaultOffsets(el)`** — asignar 0 si el offset no está definido
3. **`offsetOnDrag(el, pageOff)`** — recalcular offset tras arrastrar
4. **`onGuideMove(el, guideId, delta, orientation)`** — actualizar al mover guía
5. **`clearGuideRefs(el, guideId)`** — limpiar referencia al eliminar guía

### Paso 4: Store — creación de elementos

Los métodos `addText`, `addImage`, `addShape`, `addSvg` usan `getBehavior(type).createDefault()`. Si tu propiedad tiene valores por defecto específicos, pásalos como overrides:

```typescript
addText: (overrides) => {
    const el = getBehavior("text").createDefault({
        id: genId(), x: pageX + 60, zIndex: nextZIndex(elements),
        miPropiedad: "valor",
        ...overrides,
    }) as DesignElement;
    // ...
}
```

Si la propiedad afecta posición/tamaño, actualiza `recalculateAnchoredPositions()` (o la lógica correspondiente).

### Paso 5: Renderer (`renderElement.tsx`)

Si la propiedad tiene representación visual, añade CSS en el case `switch(el.type)` correspondiente:

```typescript
case "text": {
    const textStyle: CSSProperties = {
        ...base,
        ...(el.miPropiedad ? { algunaPropiedadCSS: el.miPropiedad } : {}),
    };
    return { style: textStyle, content: <>{el.text}</> };
}
```

### Pasos 6-14: Mismos que en el checklist

---

## Caso B: Nuevo tipo de elemento

### Paso 1: Types — añadir el tipo al union type

En `src/editor/utils/types.ts`:
```typescript
export type ElementType = "text" | "image" | "shape" | "svg" | "miTipo";
```

### Paso 2: Crear Behavior (`src/core/behaviors/MiTipoBehavior.ts`)

Crea un nuevo archivo implementando `ElementBehavior<DesignElement>`:

```typescript
import type { DesignElement } from "../../editor/utils/types";
import type { ElementBehavior, ParseContext, SerializeContext } from "./ElementBehavior";
import { numAttr, strAttr, hasAttr, boolAttr, a, ab, q } from "./parseHelpers";

export const MiTipoBehavior: ElementBehavior<DesignElement> = {
  type: "miTipo",

  parse(ctx: ParseContext, id: string): DesignElement {
    const { el, startX, elementCount } = ctx;
    return {
      id, type: "miTipo" as const,
      x: numAttr(el, "x") + startX, y: numAttr(el, "y"),
      width: numAttr(el, "w", 100), height: numAttr(el, "h", 100),
      rotation: numAttr(el, "rotation", 0), opacity: numAttr(el, "opacity", 1),
      zIndex: hasAttr(el, "zIndex") ? numAttr(el, "zIndex") : elementCount + 1,
      mixBlendMode: strAttr(el, "mixBlendMode"),
      flipH: boolAttr(el, "flipH", false) || undefined,
      flipV: boolAttr(el, "flipV", false) || undefined,
      locked: boolAttr(el, "locked", false) || undefined,
      hidden: boolAttr(el, "hidden", false) || undefined,
      groupId: strAttr(el, "groupId"),
      // ...propiedades específicas del tipo...
    } as DesignElement;
  },

  serialize(el: DesignElement, ctx: SerializeContext): string {
    const { rx, llmMode } = ctx;
    return (
      `    <miTipo id=${q(el.id)}` +
      a("x", rx) + a("y", el.y) + a("w", el.width) + a("h", el.height) +
      a("rotation", el.rotation, 0) +
      a("opacity", el.opacity !== undefined && el.opacity !== 1 ? el.opacity : undefined) +
      a("zIndex", el.zIndex) +
      a("mixBlendMode", el.mixBlendMode, "normal") +
      ab("flipH", el.flipH, false) + ab("flipV", el.flipV, false) +
      ab("locked", el.locked, false) + ab("hidden", el.hidden, false) +
      a("groupId", el.groupId) +
      // ...propiedades específicas...
      ` />\n`
    );
  },

  render(): any {
    return { style: {}, content: null };
  },

  validate(el: DesignElement): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];
    // ...validaciones...
    return errors;
  },

  createDefault(overrides?: Partial<DesignElement>): DesignElement {
    return {
      id: `miTipo_${Date.now()}`, type: "miTipo",
      x: 60, y: 60, width: 300, height: 300,
      rotation: 0, opacity: 1, zIndex: 1,
      ...overrides,
    } as DesignElement;
  },
};
```

### Paso 3: Registrar en BehaviorRegistry

En `src/core/behaviors/BehaviorRegistry.ts`:

```typescript
import { MiTipoBehavior } from "./MiTipoBehavior";

const behaviors: ElementBehavior[] = [
  TextBehavior,
  ImageBehavior,
  ShapeBehavior,
  SvgBehavior,
  MiTipoBehavior,  // ← añadir aquí
];
```

Además, añade el mapeo de tag → type en `parseElement()`:

```typescript
if (tag === "miTipo") type = "miTipo";
```

Eso es todo. El parser, serializer, y store ya usan BehaviorRegistry — ningún otro archivo necesita cambios para soportar el nuevo tipo.

### Paso 4: Renderer (`renderElement.tsx`)

Añade un nuevo `case "miTipo":` en el switch de `renderElementContent()`.

### Pasos 5+: Continuar con el checklist

---

## Resumen del flujo de datos (arquitectura actual)

```
AI escribe JSX con nueva propiedad/tipo
    ↓
Baja hacia jsxParser.ts
    ↓ parseElement() delega en BehaviorRegistry
    ↓ Behavior.parse() extrae atributos del DOM
    ↓ AnchorService.resolveElement() recalcula (si aplica)
    ↓
editorStore.ts guarda en el estado de Zustand
    ↓
renderElement.tsx renderiza visualmente en el canvas
    ↓
Usuario interactúa (arrastra, redimensiona)
    ↓
EditorCanvas.tsx recalcula offsets vía AnchorService
    ↓
jsxSerializer.ts serializa de vuelta a JSX
    ↓ serializeElement() delega en BehaviorRegistry
    ↓ Behavior.serialize() produce el JSX
    ↓
IA lee el JSX actualizado y continúa
```

## Checklist de implementación

- [ ] Types: propiedad/tipo añadido a `DesignElement`/`ElementType`
- [ ] Behavior: `parse()` lee el atributo del DOM
- [ ] Behavior: `serialize()` escribe el atributo a JSX
- [ ] Behavior: `validate()` verifica la propiedad (si aplica)
- [ ] Behavior: `createDefault()` incluye valor por defecto (si aplica)
- [ ] BehaviorRegistry: nuevo tipo registrado (solo para nuevos tipos)
- [ ] AnchorService: lógica de resolución/offsets (solo para anchors)
- [ ] Store: lógica de recalculo (si aplica)
- [ ] Store: limpieza de referencias (si aplica)
- [ ] Renderer: representación visual (si aplica)
- [ ] EditorCanvas: interacción de usuario (si aplica)
- [ ] GuideOverlay: integración con guías (si aplica)
- [ ] applyPatchTool: validación de atributos
- [ ] systemPrompt: documentación para la IA
- [ ] toolRegistry: herramientas de IA (si aplica)
- [ ] jsxApplicator: post-procesamiento (si aplica)
- [ ] ia_wiki: documentación para IA
- [ ] wiki/elements: documentación para humanos
