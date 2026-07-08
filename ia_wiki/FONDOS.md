# Fondos — Referencia completa de técnicas de fondo

## fondo-mesh-gradient

Múltiples degradados radiales superpuestos para profundidad visual:

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="radial-gradient(ellipse at 20% 50%, rgba(102,126,234,0.4) 0%, transparent 50%),
           radial-gradient(ellipse at 80% 20%, rgba(118,75,162,0.4) 0%, transparent 50%),
           radial-gradient(ellipse at 50% 80%, rgba(233,69,96,0.3) 0%, transparent 50%)" />
```

**Receta:** Varía los porcentajes del `at X% Y%` para diferentes focos de luz.

---

## fondo-aurora

Efecto aurora boreal — colores naturales en capas muy suaves:

```jsx
<page width="1080" height="1920" bgColor="#0a0f1e"
  bgStyle="radial-gradient(ellipse at 0% 50%, rgba(0,255,200,0.15) 0%, transparent 60%),
           radial-gradient(ellipse at 100% 30%, rgba(120,80,255,0.2) 0%, transparent 55%),
           radial-gradient(ellipse at 50% 100%, rgba(0,180,255,0.12) 0%, transparent 50%),
           linear-gradient(180deg, #0a0f1e 0%, #0d1b2e 100%)" />
```

---

## fondo-duotone

Efecto duotono: un color de sombra y un color de luz sobre imagen:

```jsx
<page width="1080" height="1080" bgColor="#0f0f1a">
  <image x="0" y="0" w="1080" h="1080" src="https://picsum.photos/1080/1080"
    imgSaturation="0" imgContrast="120" imgBrightness="60" />
  <shape x="0" y="0" w="1080" h="1080" shapeKind="rect"
    fillGradient="linear-gradient(135deg, rgba(102,126,234,0.7), rgba(118,75,162,0.5))"
    mixBlendMode="color" />
</page>
```

---

## fondo-noise-textura

Textura de ruido/grano sobre gradiente:

```jsx
<page width="1080" height="1920" bgColor="#1a1a2e"
  bgStyle="url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E&quot;),
           linear-gradient(135deg, #1a1a2e, #2d1b4e)" />
```

---

## fondo-glassmorphism

Panel de vidrio esmerilado sobre fondo oscuro:

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="radial-gradient(ellipse at 30% 30%, rgba(102,126,234,0.3) 0%, transparent 60%)">
  <!-- Panel glassmorphism -->
  <shape x="80" y="200" w="920" h="600" shapeKind="rect"
    backgroundColor="rgba(255,255,255,0.04)"
    borderColor="rgba(255,255,255,0.12)" borderWidth="1"
    borderRadius="24" />
</page>
```

---

## fondo-grid-tecnico

Cuadrícula técnica estilo blueprint / cuaderno:

```jsx
<page width="1080" height="1920" bgColor="#0c1420"
  bgStyle="repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px),
           repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px)" />
```

---

## fondo-puntos

Patrón de puntos sutiles — muy elegante en oscuro:

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px) 24px 24px" />
```

---

## fondo-rayas-diagonales

Rayas diagonales para fondos dinámicos:

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.03) 12px, rgba(255,255,255,0.03) 24px)" />
```

---

## fondo-checkerboard

Patrón tablero de ajedrez discreto:

```jsx
<page width="1080" height="1920" bgColor="#1a1a2e"
  bgStyle="repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 40px 40px" />
```

---

## fondo-cinematico-bars

Barras negras de cine (letterbox) — para thumbnails dramáticos:

```jsx
<shape x="0" y="0" w="1080" h="220" shapeKind="rect" backgroundColor="#000000" />
<shape x="0" y="1700" w="1080" h="220" shapeKind="rect" backgroundColor="#000000" />
```

---

## fondo-estrellas

Cielo estrellado — distribuir 20+ puntos con opacidades variadas:

```jsx
<shape x="140" y="80"  w="3" h="3" shapeKind="circle" backgroundColor="#ffffff" opacity="0.9" />
<shape x="320" y="200" w="2" h="2" shapeKind="circle" backgroundColor="#ffffff" opacity="0.5" />
<shape x="680" y="140" w="4" h="4" shapeKind="circle" backgroundColor="#ffffff" opacity="0.7" />
<shape x="900" y="320" w="2" h="2" shapeKind="circle" backgroundColor="#ffffff" opacity="0.6" />
<shape x="200" y="480" w="3" h="3" shapeKind="circle" backgroundColor="#c0c0ff" opacity="0.8" />
<!-- Repetir con coordenadas variadas para cubrir el canvas -->
```

---

## fondo-degradado-lineal

Degradados lineales: los más versátiles.

```jsx
<!-- Vertical oscuro a color -->
bgStyle="linear-gradient(180deg, #0f0f1a 0%, #6c5ce7 100%)"

<!-- Diagonal clásico -->
bgStyle="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"

<!-- Horizontal bicolor suave -->
bgStyle="linear-gradient(90deg, #0f0f1a 40%, #1e1a3a 100%)"

<!-- Sunset -->
bgStyle="linear-gradient(180deg, #0f0f1a 0%, #e94560 50%, #ffd700 100%)"

<!-- Océano -->
bgStyle="linear-gradient(135deg, #0f2027, #203a43, #2c5364)"

<!-- Neón profundo -->
bgStyle="linear-gradient(135deg, #1a0533, #0d1b4b)"
```

---

## fondo-degradado-radial

Degradados radiales — para efectos de luz/foco:

```jsx
<!-- Foco central -->
bgStyle="radial-gradient(ellipse at center, #1a1a3e 0%, #0f0f1a 70%)"

<!-- Foco esquina superior izquierda -->
bgStyle="radial-gradient(ellipse at 0% 0%, #6c5ce7 0%, #0f0f1a 60%)"

<!-- Luz de estudio -->
bgStyle="radial-gradient(circle at 50% 30%, rgba(200,200,255,0.08) 0%, transparent 60%), #0f0f1a"
```

---

## paletas-color-recomendadas

### Dark Premium (fondos oscuros elegantes)
```
Base:      #0f0f1a   (negro azulado)
Variante:  #1a1a2e   (azul muy oscuro)
Variante:  #16213e   (azul marino)
Acento:    #6c5ce7   (púrpura)
Acento2:   #e94560   (rojo coral)
Texto:     #ffffff, rgba(255,255,255,0.7)
```

### Ocean Night
```
Base:      #0a0f1e
Acento:    #00c9ff, #92fe9d
Texto:     #ffffff
```

### Sunset Vibes
```
Base:      #1a0533
Acento:    #ff6b6b, #ffd700, #ff8e53
Texto:     #ffffff
```

### Minimal Light
```
Base:      #f8f9fa
Variante:  #ffffff
Acento:    #4f46e5
Texto:     #111827, #6b7280
```

### Tech / Blueprint
```
Base:      #0c1420
Grid:      rgba(0,200,255,0.07)
Acento:    #00c8ff
Texto:     #e2f4ff
```

---

## overlay-sobre-imagen

Siempre añadir overlay para legibilidad del texto sobre fotos:

```jsx
<!-- Imagen de fondo -->
<image x="0" y="0" w="1080" h="1920" src="https://picsum.photos/1080/1920"
  imgBrightness="55" imgSaturation="80" />

<!-- Degradado inferior para texto (el más común) -->
<shape x="0" y="0" w="1080" h="1920" shapeKind="rect"
  fillGradient="linear-gradient(0deg, rgba(15,15,26,0.92) 0%, rgba(15,15,26,0.4) 40%, transparent 70%)" />

<!-- Color brand overlay (opcional para duotono) -->
<shape x="0" y="0" w="1080" h="1920" shapeKind="rect"
  backgroundColor="#6c5ce7" opacity="0.2" mixBlendMode="multiply" />
```
