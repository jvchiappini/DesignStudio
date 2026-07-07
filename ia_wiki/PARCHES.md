# Parches — Referencia completa de figuras recortadas

Los parches son figuras con recortes transparentes. El `<project>` soporta elementos `<patch>` como un alias semántico para figuras compuestas con recortes.

## Sintaxis

```jsx
<project>
  <config />
  <patch x="0" y="0" w="1080" h="1920">
    {children}
  </patch>
</project>
```

## Ejemplos

### Círculo con recorte interior
```jsx
<figure x="100" y="100" w="300" h="300" type="circle"
  backgroundColor="#6c5ce7" />
<figure x="200" y="200" w="100" h="100" type="circle"
  backgroundColor="transparent" mixBlendMode="difference" />
```

### Parche rectangular con múltiples recortes
```jsx
<figure x="50" y="50" w="500" h="500" type="rect"
  backgroundColor="#2a2a3e" borderRadius="16" />
<figure x="80" y="80" w="100" h="100" type="circle"
  backgroundColor="transparent" mixBlendMode="difference" />
<figure x="200" y="80" w="100" h="100" type="circle"
  backgroundColor="transparent" mixBlendMode="difference" />
```

Nota: Los parches se implementan usando `mixBlendMode="difference"` con color de fondo idéntico al contenedor para crear recortes visuales. No hay un componente `<patch>` nativo — es un patrón compositivo.
