# Architecture — Design Studio

## Principios

1. **100% Client-Side**: Todo el renderizado de video ocurre en el navegador del usuario. Sin servidores de compilación.
2. **JSX es el idioma**: Los agentes IA generan código React declarativo, no JSON.
3. **Tiempo descendente**: El frame actual baja por React Context. Cada componente lo usa para calcular su estado visual.
4. **Composicional**: Timeline → Sequence → Animated/Texto/Img. Componentes anidables.

## Flujo de Render

```
User/AI Code (string JSX)
    │
    ▼
Compiler (compileFromString.ts)
    │  Usa Function() + React.createElement
    │  Componentes pre-registrados en registry.ts
    ▼
React Tree montado en <TimeContext.Provider>
    │
    ▼
TimelineController (requestAnimationFrame loop)
    │  setFrame(n) → TimeContext se actualiza
    │  ↓ todos los primitives re-renderizan con nuevo frame
    ▼
Preview DOM en pantalla
    │
    ▼ (cuando se exporta)
Renderer:
  canvasRecorder.ts → html-to-image captura cada frame
  webmEncoder.ts    → webm-writer codifica frames → .webm
  pngExporter.ts    → frame individual → PNG
```

## Módulos

| Módulo | Responsabilidad |
|--------|----------------|
| `engine/` | Loop de tiempo, TimeContext, hooks, interpolaciones |
| `components/` | Primitivas del DSL |
| `compiler/` | Compila JSX string, sandbox de validación |
| `renderer/` | Captura DOM, encoding video, exportación |
| `store/` | Estado UI local (Zustand) |
| `hooks/` | Hooks de alto nivel (player, export) |

## Convenciones

- `frame` = número entero, 0-indexed
- `localFrame` = frame relativo dentro de un Sequence
- `fps` = frames por segundo (típicamente 30)
- `durationInFrames` = duración total en frames
