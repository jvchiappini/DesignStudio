# Parches y Composición — Blend modes, recortes y efectos de capas

Los "parches" son composiciones de formas e imágenes usando `mixBlendMode` y opacidades para lograr efectos de capas, recortes visuales y fusión de elementos.

---

## blend-modes-referencia

Tabla de modos de fusión disponibles:

| Valor | Efecto | Uso típico |
|---|---|---|
| `normal` | Sin fusión | Default |
| `multiply` | Oscurece (multiplica) | Sombras, overlays de color sobre imagen |
| `screen` | Aclara (invierte multiply) | Brillos, luces, halos |
| `overlay` | Contraste fuerte | Imágenes dramáticas, texturas |
| `darken` | Solo pasa los píxeles más oscuros | Efectos sutiles de oscurecimiento |
| `lighten` | Solo pasa los píxeles más claros | Brillos sutiles |
| `color-dodge` | Aclara extremadamente | Efectos de luz neón |
| `color-burn` | Oscurece extremadamente | Sombras dramáticas |
| `hard-light` | Overlay fuerte | Texturas sobre foto |
| `soft-light` | Overlay suave | Color sutil sobre imagen |
| `difference` | Invierte colores comunes | Recortes visuales, efectos psicodélicos |
| `exclusion` | Similar a difference, más suave | Recortes elegantes |
| `hue` | Solo tono | Color artistico |
| `saturation` | Solo saturación | Ajuste de vivacidad |
| `color` | Tono + saturación | Colorización de fotos |
| `luminosity` | Solo brillo | Luminancia artística |

---

## recorte-visual-circle

Simular un recorte circular usando `difference` + color base igual al contenedor:

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a">
  <!-- Forma base -->
  <shape x="340" y="760" w="400" h="400" shapeKind="circle"
    backgroundColor="#6c5ce7" />
  <!-- "Recorte" interior con difference -->
  <shape x="440" y="860" w="200" h="200" shapeKind="circle"
    backgroundColor="#0f0f1a" mixBlendMode="difference" />
</page>
```

---

## overlay-multiply

Shape de color sobre imagen — colorización brand:

```jsx
<image x="0" y="0" w="1080" h="1920" src="https://picsum.photos/1080/1920"
  imgBrightness="70" imgSaturation="80" />
<shape x="0" y="0" w="1080" h="1920" shapeKind="rect"
  backgroundColor="#6c5ce7" opacity="0.4" mixBlendMode="multiply" />
```

---

## overlay-screen-halo

Halo de luz blanco sobre imagen oscura:

```jsx
<image x="0" y="0" w="1080" h="1920" src="https://picsum.photos/1080/1920"
  imgBrightness="40" imgSaturation="60" />
<shape x="240" y="600" w="600" h="600" shapeKind="circle"
  fillGradient="radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 70%)"
  mixBlendMode="screen" />
```

---

## overlay-imagen-textura

Textura sobre imagen para look más editorial:

```jsx
<image x="0" y="0" w="1080" h="1920" src="https://picsum.photos/1080/1920" />
<page bgStyle="url(&quot;data:image/svg+xml,...noise...&quot;) center/cover"
  mixBlendMode="overlay" opacity="0.15" />
```

---

## decoracion-acento-linea

Líneas decorativas de acento — marca y estructura visual:

```jsx
<!-- Línea horizontal corta de acento (debajo de título) -->
<shape x="440" y="680" w="200" h="4" shapeKind="rect"
  backgroundColor="#6c5ce7" borderRadius="2" />

<!-- Línea vertical izquierda tipo quote -->
<shape x="60" y="200" w="4" h="120" shapeKind="rect"
  backgroundColor="#e94560" />

<!-- Línea doble decorativa -->
<shape x="200" y="400" w="680" h="2" shapeKind="rect"
  backgroundColor="rgba(255,255,255,0.2)" />
<shape x="200" y="408" w="680" h="1" shapeKind="rect"
  backgroundColor="rgba(255,255,255,0.08)" />
```

---

## decoracion-puntos-patron

Puntos decorativos de fondo en una esquina:

```jsx
<!-- Cluster de puntos esquina superior derecha -->
<shape x="880" y="60"  w="5" h="5" shapeKind="circle" backgroundColor="#6c5ce7" opacity="0.6" />
<shape x="910" y="60"  w="5" h="5" shapeKind="circle" backgroundColor="#6c5ce7" opacity="0.6" />
<shape x="940" y="60"  w="5" h="5" shapeKind="circle" backgroundColor="#6c5ce7" opacity="0.6" />
<shape x="880" y="90"  w="5" h="5" shapeKind="circle" backgroundColor="#6c5ce7" opacity="0.4" />
<shape x="910" y="90"  w="5" h="5" shapeKind="circle" backgroundColor="#6c5ce7" opacity="0.4" />
<shape x="940" y="90"  w="5" h="5" shapeKind="circle" backgroundColor="#6c5ce7" opacity="0.4" />
<shape x="880" y="120" w="5" h="5" shapeKind="circle" backgroundColor="#6c5ce7" opacity="0.2" />
<shape x="910" y="120" w="5" h="5" shapeKind="circle" backgroundColor="#6c5ce7" opacity="0.2" />
<shape x="940" y="120" w="5" h="5" shapeKind="circle" backgroundColor="#6c5ce7" opacity="0.2" />
```

---

## decoracion-circulo-grande-fondo

Círculo grande semitransparente como elemento de composición:

```jsx
<!-- Círculo de acento de fondo (detrás del contenido) -->
<shape x="-200" y="-200" w="800" h="800" shapeKind="circle"
  backgroundColor="#6c5ce7" opacity="0.08" />

<!-- Círculo outline decorativo -->
<shape x="700" y="1400" w="500" h="500" shapeKind="circle"
  backgroundColor="transparent"
  borderColor="rgba(255,255,255,0.06)" borderWidth="2" />
```

---

## tag-badge

Etiqueta / badge flotante sobre contenido:

```jsx
<!-- Badge "NUEVO" -->
<shape x="80" y="200" w="120" h="36" shapeKind="rect"
  backgroundColor="#e94560" borderRadius="18" />
<text x="80" y="200" w="120" h="36" fontSize="13" fontWeight="700"
  fontFamily="Inter, sans-serif" color="#ffffff"
  textAlign="center" verticalAlign="middle"
  letterSpacing="2" textTransform="uppercase">
  NUEVO
</text>
```

---

## separador-seccion

Separadores visuales entre secciones de contenido:

```jsx
<!-- Línea con círculo central -->
<shape x="60" y="500" w="440" h="1" shapeKind="rect"
  backgroundColor="rgba(255,255,255,0.15)" />
<shape x="519" y="494" w="12" h="12" shapeKind="circle"
  backgroundColor="#6c5ce7" />
<shape x="580" y="500" w="440" h="1" shapeKind="rect"
  backgroundColor="rgba(255,255,255,0.15)" />

<!-- Línea con degradado que desaparece en los extremos -->
<shape x="60" y="600" w="960" h="1" shapeKind="rect"
  fillGradient="linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0.2) 80%, transparent)" />
```

---

## numero-seccion

Número de sección grande como elemento decorativo de fondo:

```jsx
<text x="800" y="100" w="240" h="200" fontSize="180" fontWeight="900"
  fontFamily="Poppins, sans-serif" color="rgba(108,92,231,0.08)"
  textAlign="center" verticalAlign="top">01</text>
```

---

## forma-clip-avanzada

Formas recortadas con clipMask para composiciones no rectangulares:

```jsx
<!-- Imagen recortada en trapecio -->
<image x="0" y="0" w="1080" h="800" src="https://picsum.photos/1080/800"
  clipMask="polygon:0% 0%, 100% 0%, 100% 80%, 0% 100%" />

<!-- Shape hexagonal -->
<shape x="200" y="200" w="300" h="300" shapeKind="rect"
  backgroundColor="#6c5ce7"
  clipMask="polygon:50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%" />
```

