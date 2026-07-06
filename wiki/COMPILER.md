# Compiler — Design Studio

## Propósito
Compilar código JSX generado por agentes IA en elementos React montables.

## API

```ts
compileFromString(code: string): React.ReactElement | null
```

## Cómo funciona

1. El string JSX se envuelve en una función fabricada con `new Function()`
2. Se inyectan `React` y el `primitiveRegistry` como argumentos
3. Los nombres de componentes (Timeline, Sequence, etc.) se desestructuran del registry
4. Si la compilación falla, retorna null y logea warning

## Registry

Los componentes primitivos se registran en `registry.ts`:

```ts
export const primitiveRegistry = {
  Timeline,
  Sequence,
  Animated,
  Texto,
  Img,
  AbsoluteFill,
};
```

## Sandbox

`CompilerSandbox` usa un Web Worker para validar sintaxis sin riesgo de bloqueo del hilo principal.

## Limitaciones actuales
- No soporta imports ni módulos externos
- Solo componentes del registry están disponibles
- Sin TypeScript runtime (el código debe ser JSX puro)
