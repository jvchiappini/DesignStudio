# Ejemplos — Plantillas y composiciones completas

## 1. Post de Instagram (1080×1080)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="true" />
  <page width="1080" height="1080" bgColor="#0f0f1a"
    bgStyle="radial-gradient(ellipse at 30% 20%, rgba(102,126,234,0.3) 0%, transparent 60%),
             radial-gradient(ellipse at 70% 80%, rgba(233,69,96,0.2) 0%, transparent 60%)">

    <shape x="60" y="60" w="960" h="960" shapeKind="rect"
      borderColor="rgba(255,255,255,0.05)" borderWidth="1" borderRadius="24" />

    <image x="80" y="80" w="920" h="520" src="https://picsum.photos/920/520"
      imgBrightness="80" imgSaturation="110" imgContrast="115" borderRadius="16" />

    <text x="80" y="640" w="920" h="120" fontSize="52" fontWeight="800"
      fontFamily="Poppins, sans-serif" color="#ffffff"
      textGradient="linear-gradient(135deg, #667eea, #764ba2)"
      letterSpacing="-1">
      Título Impactante
    </text>

    <text x="80" y="760" w="920" h="60" fontSize="20" fontWeight="400"
      fontFamily="Inter, sans-serif" color="#a0a0b0" lineHeight="1.6"
      textTransform="uppercase" letterSpacing="4">
      DESCRIPCIÓN DEL POST
    </text>

    <image x="80" y="860" w="48" h="48" src="https://picsum.photos/200/200?random=1"
      borderRadius="24" />

    <text x="148" y="860" w="400" h="48" fontSize="14" fontWeight="600"
      fontFamily="Inter, sans-serif" color="#ffffff" verticalAlign="middle"
      textAlign="left">@nombredeusuario</text>
  </page>
</project>
```

## 2. Historia de Instagram (1080×1920)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="true" />
  <page width="1080" height="1920" bgColor="#1a1a2e"
    bgStyle="radial-gradient(ellipse at 50% 30%, rgba(102,126,234,0.4) 0%, transparent 60%),
             repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 40px 40px">

    <image x="0" y="0" w="1080" h="1920" src="https://picsum.photos/1080/1920"
      imgBrightness="50" imgBlur="4" mixBlendMode="overlay" />

    <text x="80" y="600" w="920" h="200" fontSize="72" fontWeight="900"
      fontFamily="Oswald, sans-serif" color="#ffffff" textAlign="center"
      textTransform="uppercase" letterSpacing="4"
      textStrokeColor="#000000" textStrokeWidth="3"
      shadowColor="#000000" shadowBlur="30" shadowOffsetY="10">
      NUEVO<br/>LANZAMIENTO
    </text>

    <text x="160" y="840" w="760" h="80" fontSize="22" fontWeight="400"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.8)"
      textAlign="center" lineHeight="1.6"
      shadowColor="#000000" shadowBlur="15" shadowOffsetY="5">
      Descubre lo que hemos estado construyendo
    </text>

    <shape x="440" y="1000" w="200" h="56" shapeKind="rect"
      backgroundColor="#6c5ce7" borderRadius="28" />

    <text x="440" y="1000" w="200" h="56" fontSize="16" fontWeight="700"
      fontFamily="Inter, sans-serif" color="#ffffff" textAlign="center"
      verticalAlign="middle" letterSpacing="2" textTransform="uppercase">
      SABER MÁS
    </text>
  </page>
</project>
```

## 3. Banner Web (1200×600)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="true" />
  <page width="1200" height="600" bgColor="#0f0f1a">

    <image x="0" y="0" w="1200" h="600" src="https://picsum.photos/1200/600"
      imgBrightness="60" imgContrast="120" imgSaturation="80" mixBlendMode="overlay" />

    <shape x="0" y="0" w="1200" h="600" shapeKind="rect"
      fillGradient="linear-gradient(90deg, rgba(15,15,26,0.8) 0%, transparent 100%)" />

    <text x="80" y="160" w="700" h="100" fontSize="44" fontWeight="800"
      fontFamily="Poppins, sans-serif" color="#ffffff" textAlign="left"
      letterSpacing="-0.5">
      Grandes Ideas<br/>Comienzan Aquí
    </text>

    <text x="80" y="280" w="600" h="60" fontSize="18" fontWeight="400"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.7)"
      textAlign="left" verticalAlign="top" lineHeight="1.5">
      Crea diseños impresionantes en minutos
    </text>

    <shape x="80" y="380" w="180" h="50" shapeKind="rect"
      backgroundColor="#6c5ce7" borderRadius="25" />

    <text x="80" y="380" w="180" h="50" fontSize="15" fontWeight="700"
      fontFamily="Inter, sans-serif" color="#ffffff" textAlign="center"
      verticalAlign="middle" letterSpacing="1" textTransform="uppercase">
      EMPEZAR
    </text>

    <shape x="290" y="380" w="180" h="50" shapeKind="rect"
      backgroundColor="transparent" borderColor="rgba(255,255,255,0.3)"
      borderWidth="1.5" borderRadius="25" />

    <text x="290" y="380" w="180" h="50" fontSize="15" fontWeight="600"
      fontFamily="Inter, sans-serif" color="#ffffff" textAlign="center"
      verticalAlign="middle" letterSpacing="1" textTransform="uppercase">
      VER MÁS
    </text>
  </page>
</project>
```

## 4. Thumbnail YouTube (1280×720)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="true" />
  <page width="1280" height="720" bgColor="#0a0a23">

    <image x="0" y="0" w="1280" h="720" src="https://picsum.photos/1280/720"
      imgBrightness="70" imgContrast="130" imgSaturation="150" />

    <text x="60" y="200" w="1160" h="200" fontSize="84" fontWeight="900"
      fontFamily="Oswald, sans-serif" color="#ffffff" textAlign="center"
      textTransform="uppercase" letterSpacing="2"
      textStrokeColor="#000000" textStrokeWidth="4"
      shadowColor="#000000" shadowBlur="40" shadowOffsetY="10">
      TÍTULO ÉPICO
    </text>

    <shape x="60" y="560" w="240" h="60" shapeKind="rect"
      backgroundColor="#e94560" borderRadius="6" />

    <text x="60" y="560" w="240" h="60" fontSize="24" fontWeight="800"
      fontFamily="Inter, sans-serif" color="#ffffff" textAlign="center"
      verticalAlign="middle" letterSpacing="1">
      VER AHORA ▶
    </text>
  </page>
</project>
```

## 5. Poster / Flyer (1920×2880)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="true" />
  <page width="1920" height="2880" bgColor="#0f0f1a">

    <image x="0" y="0" w="1920" h="2880" src="https://picsum.photos/1920/2880"
      imgBrightness="50" imgSaturation="80" mixBlendMode="overlay" />

    <text x="160" y="800" w="1600" h="200" fontSize="96" fontWeight="900"
      fontFamily="Playfair Display, serif" color="#ffffff" textAlign="center"
      letterSpacing="2">
      Gran Evento
    </text>

    <text x="160" y="1020" w="1600" h="80" fontSize="28" fontWeight="300"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.6)"
      textAlign="center" letterSpacing="8" textTransform="uppercase">
      15·JUL·2026 · AUDITORIO PRINCIPAL
    </text>

    <shape x="860" y="1200" w="200" h="3" shapeKind="rect"
      backgroundColor="#6c5ce7" />

    <text x="160" y="1280" w="1600" h="100" fontSize="22" fontWeight="400"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.8)"
      textAlign="center" lineHeight="1.8">
      Una experiencia única que transformará tu perspectiva.<br/>
      Conferencistas internacionales, talleres prácticos y networking.
    </text>

    <shape x="760" y="1480" w="400" h="64" shapeKind="rect"
      backgroundColor="#6c5ce7" borderRadius="32" />

    <text x="760" y="1480" w="400" h="64" fontSize="20" fontWeight="700"
      fontFamily="Inter, sans-serif" color="#ffffff" textAlign="center"
      verticalAlign="middle" letterSpacing="3" textTransform="uppercase">
      RESERVAR LUGAR
    </text>
  </page>
</project>
```

## 6. Logo / Brand Kit (500×500)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="true" />
  <page width="500" height="500" bgColor="#0f0f1a">

    <svg x="150" y="100" w="200" h="200"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6c5ce7"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' />

    <text x="100" y="360" w="300" h="60" fontSize="36" fontWeight="900"
      fontFamily="Poppins, sans-serif" color="#ffffff" textAlign="center"
      letterSpacing="-0.5">
      Marca
    </text>

    <text x="100" y="420" w="300" h="30" fontSize="13" fontWeight="400"
      fontFamily="Inter, sans-serif" color="#6c5ce7" textAlign="center"
      letterSpacing="6" textTransform="uppercase">
      BRAND STUDIO
    </text>
  </page>
</project>
```

## 7. Múltiples páginas (proyecto completo)

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="true" />
  <page width="1080" height="1920" bgColor="#1a1a2e" name="Portada">
    <image x="0" y="0" w="1080" h="1920" src="https://picsum.photos/1080/1920"
      imgBrightness="50" imgBlur="3" mixBlendMode="overlay" />
    <text x="80" y="600" w="920" h="160" fontSize="72" fontWeight="900"
      fontFamily="Poppins, sans-serif" color="#ffffff" textAlign="center"
      textTransform="uppercase" letterSpacing="4"
      textStrokeColor="#000000" textStrokeWidth="3">
      PRESENTACIÓN
    </text>
    <text x="80" y="780" w="920" h="60" fontSize="22" fontWeight="300"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.6)"
      textAlign="center" letterSpacing="6" textTransform="uppercase">
      2026 · PROYECTO
    </text>
  </page>
  <page width="1080" height="1920" bgColor="#16213e" name="Contenido">
    <image x="80" y="80" w="920" h="520" src="https://picsum.photos/920/520" borderRadius="16"
      imgBrightness="80" imgContrast="120" />
    <text x="80" y="640" w="920" h="120" fontSize="48" fontWeight="700"
      fontFamily="Poppins, sans-serif" color="#ffffff">
      Sección Uno
    </text>
    <text x="80" y="760" w="920" h="120" fontSize="18" fontWeight="400"
      fontFamily="Inter, sans-serif" color="#a0a0b0" lineHeight="1.8"
      verticalAlign="top">
      Contenido descriptivo de la sección. Explica el concepto, los detalles y los resultados esperados del proyecto.
    </text>
  </page>
  <page width="1080" height="1920" bgColor="#1a1a2e" name="Cierre">
    <text x="80" y="800" w="920" h="120" fontSize="52" fontWeight="700"
      fontFamily="Playfair Display, serif" color="#ffffff" textAlign="center">
      Gracias
    </text>
    <text x="80" y="960" w="920" h="60" fontSize="18" fontWeight="400"
      fontFamily="Inter, sans-serif" color="#6c5ce7" textAlign="center"
      letterSpacing="4" textTransform="uppercase">
      CONTACTO@EJEMPLO.COM
    </text>
  </page>
</project>
```

## 8. Tarjetas de producto

```jsx
<project>
  <config pageGap="40" showGrid="false" snapToGrid="true" />
  <page width="1080" height="1920" bgColor="#0f0f1a">

    <text x="80" y="80" w="920" h="60" fontSize="28" fontWeight="700"
      fontFamily="Poppins, sans-serif" color="#ffffff">Productos</text>

    <!-- Tarjeta 1 -->
    <shape x="80" y="180" w="440" h="520" shapeKind="rect"
      backgroundColor="#1e1e2e" borderRadius="16" />
    <image x="100" y="200" w="400" h="300" src="https://picsum.photos/400/300?random=1" borderRadius="12" />
    <text x="100" y="520" w="400" h="40" fontSize="20" fontWeight="700"
      fontFamily="Poppins, sans-serif" color="#ffffff">Producto Uno</text>
    <text x="100" y="560" w="400" h="40" fontSize="14" fontWeight="400"
      fontFamily="Inter, sans-serif" color="#a0a0b0">Categoría</text>
    <text x="100" y="620" w="400" h="40" fontSize="22" fontWeight="700"
      fontFamily="Inter, sans-serif" color="#6c5ce7">$49.99</text>

    <!-- Tarjeta 2 -->
    <shape x="560" y="180" w="440" h="520" shapeKind="rect"
      backgroundColor="#1e1e2e" borderRadius="16" />
    <image x="580" y="200" w="400" h="300" src="https://picsum.photos/400/300?random=2" borderRadius="12" />
    <text x="580" y="520" w="400" h="40" fontSize="20" fontWeight="700"
      fontFamily="Poppins, sans-serif" color="#ffffff">Producto Dos</text>
    <text x="580" y="560" w="400" h="40" fontSize="14" fontWeight="400"
      fontFamily="Inter, sans-serif" color="#a0a0b0">Categoría</text>
    <text x="580" y="620" w="400" h="40" fontSize="22" fontWeight="700"
      fontFamily="Inter, sans-serif" color="#6c5ce7">$79.99</text>
  </page>
</project>
```
