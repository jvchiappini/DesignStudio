# Fondos — Referencia de técnicas de fondo

## Fondo con degradado múltiple (mesh gradient)

Usa `bgStyle` con múltiples degradados superpuestos:

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="radial-gradient(ellipse at 20% 50%, rgba(102,126,234,0.4) 0%, transparent 50%),
           radial-gradient(ellipse at 80% 20%, rgba(118,75,162,0.4) 0%, transparent 50%),
           radial-gradient(ellipse at 50% 80%, rgba(233,69,96,0.3) 0%, transparent 50%)">
```

## Fondo con ruido / textura

Superponer una capa SVG semitransparente sobre un fondo sólido:

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E&quot;),
           linear-gradient(135deg, #667eea, #764ba2)">
```

## Fondo tipo "glassmorphism"

Usa rectángulos semitransparentes con blur:

```jsx
<figure x="100" y="200" w="400" h="300" type="rect"
  backgroundColor="rgba(255,255,255,0.05)"
  borderColor="rgba(255,255,255,0.1)" borderWidth="1"
  borderRadius="20" />
```

## Fondo con patrón de grid

Para fondos técnicos o de cuaderno:

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px),
           repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px)">
```

## Fondo cinematográfico (bars)

Para video o cine:

```jsx
<figure x="0" y="0" w="1080" h="240" type="rect" backgroundColor="#000000" />
<figure x="0" y="1680" w="1080" h="240" type="rect" backgroundColor="#000000" />
```

## Fondo con partículas / estrellas

Usa múltiples figuras pequeñas:

```jsx
<figure x="200" y="150" w="3" h="3" type="circle" backgroundColor="#ffffff" opacity="0.8" />
<figure x="500" y="300" w="2" h="2" type="circle" backgroundColor="#ffffff" opacity="0.5" />
<figure x="800" y="100" w="4" h="4" type="circle" backgroundColor="#ffffff" opacity="0.6" />
```

Para un cielo estrellado completo, distribuye 15-25 puntos aleatoriamente.

## Fondo animado (gradient rotatorio)

```jsx
<page width="1080" height="1920" bgColor="#0f0f1a"
  bgStyle="linear-gradient(135deg, #667eea, #764ba2, #e94560, #4ecdc4)">
```
