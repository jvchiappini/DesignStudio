# DSL Reference — Design Studio

## Filosofía
El DSL es React declarativo puro. El "frame actual" baja por React Context.
Cada componente usa `useCurrentFrame()` para calcular su estilo animado.

## Componentes Primitivos

### `<Timeline>`
Contenedor raíz. Provee el contexto de tiempo a todos los hijos.

```tsx
<Timeline
  fps={30}              // frames por segundo
  durationInFrames={150} // duración total
  width={1080}          // ancho del canvas
  height={1920}         // alto del canvas
>
  {/* hijos */}
</Timeline>
```

### `<Sequence>`
Segmento temporal. Solo monta hijos si el frame actual está en `[from, from+duration)`.
Ajusta el contexto para que los hijos reciban `localFrame = frame - from`.

```tsx
<Sequence from={30} durationInFrames={60}>
  {/* visible del frame 30 al 89, localFrame 0-59 */}
</Sequence>
```

### `<Animated>`
Interpola propiedades visuales entre `from` y `to` durante toda su duración.

```tsx
<Animated
  from={{ x: -200, opacity: 0 }}
  to={{ x: 0, opacity: 1 }}
  easing="easeInOut"
>
  <div>contenido</div>
</Animated>
```

Propiedades animables: `x`, `y`, `opacity`, `scale`, `rotate`.

### `<Texto>`
Contenedor de texto con fade-in/fade-out.

```tsx
<Texto fadeIn={20} fadeOut={15} style={{ fontSize: 48, color: 'white' }}>
  ¡Oferta!
</Texto>
```

### `<Img>`
Imagen con lazy loading y placeholder.

```tsx
<Img
  src="https://ejemplo.com/imagen.png"
  placeholderColor="#eee"
  style={{ width: 200, height: 200 }}
/>
```

### `<AbsoluteFill>`
Ocupa el 100% del canvas padre. Ideal para fondos.

```tsx
<AbsoluteFill style={{ backgroundColor: '#0a0a23' }} />
```

## Hooks

```ts
useCurrentFrame(): number
  // Devuelve el frame actual (o localFrame dentro de Sequence)

useFrameInfo(): { frame, fps, durationInFrames }
  // Devuelve el objeto FrameInfo completo
```

## Interpolación

```ts
interpolate(
  frame: number,
  inputRange: [number, number],
  outputRange: [number, number],
  easing?: EasingFn
): number
```

Easing functions disponibles: `linear`, `easeIn`, `easeOut`, `easeInOut`.

## Ejemplo Completo

```tsx
<Timeline fps={30} durationInFrames={150} width={1080} height={1920}>
  <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }} />

  <Sequence from={0} durationInFrames={60}>
    <Texto fadeIn={15} style={{ fontSize: 64, color: '#e94560' }}>
      ¡Imperdible!
    </Texto>
  </Sequence>

  <Sequence from={30} durationInFrames={90}>
    <Animated from={{ x: 200, opacity: 0 }} to={{ x: 0, opacity: 1 }}>
      <Img src="https://via.placeholder.com/400" />
    </Animated>
  </Sequence>
</Timeline>
```
