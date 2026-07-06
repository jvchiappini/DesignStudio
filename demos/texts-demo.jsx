<project>
  <config pageGap="40" showGrid="false" snapToGrid="false" />

  <!-- ================================================================
    PÁGINA 1: Tipografía básica — Fuentes del sistema y tamaños
  ================================================================ -->
  <page width="1080" height="1920" bgColor="#0f0f1a">

    <text x="60" y="60" w="960" h="70" fontSize="42" fontFamily="system-ui, sans-serif" fontWeight="700" color="#ffffff" textAlign="center">
      ✏️ Sistema de Texto — Tipografía Básica
    </text>
    <text x="60" y="130" w="960" h="24" fontSize="13" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.4)" textAlign="center">
      Fuentes del sistema · Tamaños · Pesos · Estilos
    </text>

    <!-- Tamaños -->
    <text x="60" y="220" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Tamaños de fuente
    </text>
    <text x="60" y="270" w="960" h="24" fontSize="12" color="rgba(255,255,255,0.6)">Tamaño 12px</text>
    <text x="60" y="310" w="960" h="28" fontSize="16" color="#ffffff">Tamaño 16px — Cuerpo de texto normal</text>
    <text x="60" y="360" w="960" h="36" fontSize="24" color="#e2e8f0">Tamaño 24px — Subtítulo</text>
    <text x="60" y="420" w="960" h="48" fontSize="36" color="#cbd5e1">Tamaño 36px — Título sección</text>
    <text x="60" y="490" w="960" h="60" fontSize="48" color="#a78bfa">Tamaño 48px — Título principal</text>
    <text x="60" y="580" w="960" h="80" fontSize="64" fontWeight="800" color="#6c5ce7">Tamaño 64px — Gran título</text>

    <!-- Pesos -->
    <text x="60" y="720" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Pesos de fuente (Inter/System UI)
    </text>
    <text x="60" y="770" w="960" h="28" fontSize="18" fontWeight="100" color="#ffffff">Thin 100 — Muy ligero</text>
    <text x="60" y="810" w="960" h="28" fontSize="18" fontWeight="300" color="#ffffff">Light 300 — Ligero</text>
    <text x="60" y="850" w="960" h="28" fontSize="18" fontWeight="400" color="#ffffff">Normal 400 — Regular</text>
    <text x="60" y="890" w="960" h="28" fontSize="18" fontWeight="500" color="#ffffff">Medium 500 — Medio</text>
    <text x="60" y="930" w="960" h="28" fontSize="18" fontWeight="600" color="#ffffff">Semi Bold 600 — Seminegrita</text>
    <text x="60" y="970" w="960" h="28" fontSize="18" fontWeight="700" color="#ffffff">Bold 700 — Negrita</text>
    <text x="60" y="1010" w="960" h="28" fontSize="18" fontWeight="900" color="#ffffff">Black 900 — Máxima</text>

    <!-- Estilos -->
    <text x="60" y="1100" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Estilos
    </text>
    <text x="60" y="1145" w="960" h="30" fontSize="20" fontStyle="normal" color="#ffffff">Normal — Estándar</text>
    <text x="60" y="1190" w="960" h="30" fontSize="20" fontStyle="italic" color="#ffffff">Italic — Cursiva</text>
    <text x="60" y="1235" w="960" h="30" fontSize="20" textDecoration="underline" color="#ffffff">Underline — Subrayado</text>
    <text x="60" y="1280" w="960" h="30" fontSize="20" textDecoration="line-through" color="#ffffff">Line-through — Tachado</text>
    <text x="60" y="1325" w="960" h="30" fontSize="20" fontVariant="small-caps" color="#ffffff">Small Caps — Versalitas</text>

    <!-- Serif -->
    <text x="60" y="1410" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Fuentes Serif
    </text>
    <text x="60" y="1455" w="960" h="36" fontSize="28" fontFamily="Times New Roman, serif" fontStyle="italic" color="#ffffff">
      Times New Roman — La clásica serif
    </text>
    <text x="60" y="1510" w="960" h="36" fontSize="28" fontFamily="Georgia, serif" color="#ffffff">
      Georgia — Serif moderna para pantalla
    </text>
    <text x="60" y="1565" w="960" h="36" fontSize="28" fontFamily="Garamond, serif" color="#ffffff">
      Garamond — Elegancia tradicional
    </text>

    <!-- Mono -->
    <text x="60" y="1650" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Fuentes Monoespaciadas
    </text>
    <text x="60" y="1695" w="960" h="32" fontSize="20" fontFamily="Courier New, monospace" color="#10b981">
      Courier New: console.log("hello world");
    </text>
    <text x="60" y="1745" w="960" h="32" fontSize="20" fontFamily="Lucida Console, monospace" color="#10b981">
      Lucida Console: const fn = () => {};
    </text>
  </page>

  <!-- ================================================================
    PÁGINA 2: Alineación y espaciado
  ================================================================ -->
  <page width="1080" height="1920" bgColor="#0f0f1a">

    <text x="60" y="60" w="960" h="70" fontSize="42" fontFamily="system-ui, sans-serif" fontWeight="700" color="#ffffff" textAlign="center">
      📐 Alineación y Espaciado
    </text>

    <!-- Alineación horizontal -->
    <text x="60" y="180" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Alineación horizontal
    </text>

    <text x="60" y="230" w="400" h="50" fontSize="16" textAlign="left" color="#ffffff" textBgColor="#1e1e2e">
      Izquierda (left)
    </text>
    <text x="60" y="300" w="400" h="50" fontSize="16" textAlign="center" color="#ffffff" textBgColor="#1e1e2e">
      Centro (center)
    </text>
    <text x="60" y="370" w="400" h="50" fontSize="16" textAlign="right" color="#ffffff" textBgColor="#1e1e2e">
      Derecha (right)
    </text>

    <!-- Alineación vertical -->
    <text x="60" y="480" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Alineación vertical
    </text>
    <text x="60" y="530" w="200" h="100" fontSize="14" verticalAlign="top" textAlign="center" color="#ffffff" textBgColor="#1e1e2e">Top</text>
    <text x="280" y="530" w="200" h="100" fontSize="14" verticalAlign="middle" textAlign="center" color="#ffffff" textBgColor="#1e1e2e">Middle</text>
    <text x="500" y="530" w="200" h="100" fontSize="14" verticalAlign="bottom" textAlign="center" color="#ffffff" textBgColor="#1e1e2e">Bottom</text>

    <!-- Interletraje -->
    <text x="60" y="700" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Interletraje (letter-spacing)
    </text>
    <text x="60" y="750" w="960" h="32" fontSize="20" letterSpacing="0" color="#ffffff">Normal — 0px</text>
    <text x="60" y="800" w="960" h="32" fontSize="20" letterSpacing="2" color="#ffffff">Interletraje 2px — Espaciado medio</text>
    <text x="60" y="850" w="960" h="32" fontSize="20" letterSpacing="5" color="#e94560">Interletraje 5px — Muy separado</text>
    <text x="60" y="900" w="960" h="32" fontSize="20" letterSpacing="10" fontWeight="700" color="#6c5ce7">Interletraje 10px — EXTREMO</text>

    <!-- Altura de línea -->
    <text x="60" y="1000" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Altura de línea (line-height)
    </text>
    <text x="60" y="1050" w="400" h="80" fontSize="16" lineHeight="1" color="#ffffff" textBgColor="#1e1e2e">
      Line height 1.0
       Muy apretado
    </text>
    <text x="480" y="1050" w="400" h="80" fontSize="16" lineHeight="1.5" color="#ffffff" textBgColor="#1e1e2e">
      Line height 1.5
      Cómodo de leer
    </text>
    <text x="60" y="1160" w="400" h="100" fontSize="16" lineHeight="2" color="#ffffff" textBgColor="#1e1e2e">
      Line height 2.0
      Muy espaciado
      Ideal para poco texto
    </text>

    <!-- Transformación -->
    <text x="60" y="1320" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Transformación de texto
    </text>
    <text x="60" y="1370" w="960" h="36" fontSize="24" textTransform="uppercase" color="#ffffff">transform: uppercase — mayúsculas</text>
    <text x="60" y="1420" w="960" h="36" fontSize="24" textTransform="lowercase" color="#ffffff">TRANSFORM: LOWERCASE — MINÚSCULAS</text>
    <text x="60" y="1470" w="960" h="36" fontSize="24" textTransform="capitalize" color="#ffffff">transform: capitalize — cada palabra</text>

    <!-- Escala de caracteres -->
    <text x="60" y="1570" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Escala de caracteres
    </text>
    <text x="60" y="1620" w="960" h="40" fontSize="28" charScaleX="100" charScaleY="100" color="#ffffff">Normal 100% × 100%</text>
    <text x="60" y="1680" w="960" h="40" fontSize="28" charScaleX="200" charScaleY="100" color="#6c5ce7">Escala X 200% — Ancho</text>
    <text x="60" y="1740" w="960" h="60" fontSize="28" charScaleX="100" charScaleY="200" color="#e94560">Escala Y 200% — Alto</text>
  </page>

  <!-- ================================================================
    PÁGINA 3: Decoración, degradados y sombras
  ================================================================ -->
  <page width="1080" height="1920" bgColor="#0f0f1a">

    <text x="60" y="60" w="960" h="70" fontSize="42" fontFamily="system-ui, sans-serif" fontWeight="700" color="#ffffff" textAlign="center">
      🎨 Decoración y Efectos
    </text>

    <!-- Stroke -->
    <text x="60" y="200" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Borde de texto (text-stroke)
    </text>
    <text x="60" y="260" w="960" h="60" fontSize="40" fontWeight="900" color="#ffffff" textStrokeColor="#000000" textStrokeWidth="3">
      Stroke de 3px negro
    </text>
    <text x="60" y="350" w="960" h="60" fontSize="40" fontWeight="900" color="#ff6b6b" textStrokeColor="#6c5ce7" textStrokeWidth="2">
      Stroke colorido 2px
    </text>
    <text x="60" y="440" w="960" h="60" fontSize="40" fontWeight="900" color="#ffffff" textStrokeColor="#000000" textStrokeWidth="5">
      Stroke grueso 5px
    </text>

    <!-- Fondo de texto -->
    <text x="60" y="560" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Fondo de texto
    </text>
    <text x="60" y="610" w="960" h="40" fontSize="24" color="#ffffff" textBgColor="#6c5ce7" textAlign="center">
      Texto con fondo sólido
    </text>
    <text x="60" y="680" w="960" h="40" fontSize="24" color="#ffffff" textBgColor="#e9456088" textAlign="center">
      Texto con fondo semitransparente #e9456088
    </text>

    <!-- Degradados -->
    <text x="60" y="800" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Degradado de texto
    </text>

    <text x="60" y="860" w="960" h="60" fontSize="44" fontWeight="800" textAlign="center"
      textGradient="linear-gradient(135deg, #ff6b6b, #4ecdc4)">
      Rosa → Verde Agua
    </text>
    <text x="60" y="950" w="960" h="60" fontSize="44" fontWeight="800" textAlign="center"
      textGradient="linear-gradient(135deg, #667eea, #764ba2)">
      Púrpura degradado
    </text>
    <text x="60" y="1040" w="960" h="60" fontSize="44" fontWeight="800" textAlign="center"
      textGradient="linear-gradient(135deg, #f093fb, #f5576c)">
      Rosa → Coral
    </text>
    <text x="60" y="1130" w="960" h="60" fontSize="44" fontWeight="800" textAlign="center"
      textGradient="linear-gradient(135deg, #4facfe, #00f2fe)">
      Celeste degradado
    </text>
    <text x="60" y="1220" w="960" h="60" fontSize="44" fontWeight="800" textAlign="center"
      textGradient="linear-gradient(135deg, #43e97b, #38f9d7)">
      Verde degradado
    </text>

    <!-- Sombra -->
    <text x="60" y="1360" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Sombra de texto
    </text>
    <text x="60" y="1420" w="960" h="60" fontSize="40" fontWeight="800" color="#ffffff" textAlign="center"
      shadowColor="#6c5ce7" shadowBlur="20" shadowOffsetY="0">
      Sombra de neón
    </text>
    <text x="60" y="1520" w="960" h="60" fontSize="40" fontWeight="800" color="#ffffff" textAlign="center"
      shadowColor="#000000" shadowBlur="10" shadowOffsetX="5" shadowOffsetY="5">
      Sombra de profundidad
    </text>
    <text x="60" y="1620" w="960" h="60" fontSize="40" fontWeight="800" color="#e94560" textAlign="center"
      shadowColor="#ff6b6b" shadowBlur="30" shadowOffsetY="0">
      Efecto glow rojo
    </text>
    <text x="60" y="1720" w="960" h="60" fontSize="40" fontWeight="800" color="#10b981" textAlign="center"
      shadowColor="#10b981" shadowBlur="30" shadowOffsetY="0">
      Efecto glow verde
    </text>
  </page>

  <!-- ================================================================
    PÁGINA 4: Texto en JSX — Demo de exportación
  ================================================================ -->
  <page width="1080" height="1920" bgColor="#0f0f1a">

    <text x="60" y="60" w="960" h="70" fontSize="42" fontFamily="system-ui, sans-serif" fontWeight="700" color="#ffffff" textAlign="center">
      📦 Composición Completa
    </text>
    <text x="60" y="130" w="960" h="24" fontSize="13" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.4)" textAlign="center">
      Múltiples estilos combinados en una sola composición
    </text>

    <!-- Título principal con degradado + sombra -->
    <text x="60" y="250" w="960" h="100" fontSize="64" fontWeight="900" textAlign="center"
      fontFamily="Poppins, sans-serif"
      textGradient="linear-gradient(135deg, #667eea, #e94560)"
      shadowColor="#667eea" shadowBlur="30" shadowOffsetY="0"
      letterSpacing="2">
      TÍTULO ESPECTACULAR
    </text>

    <!-- Subtítulo con stroke -->
    <text x="60" y="390" w="960" h="60" fontSize="28" fontWeight="300" textAlign="center"
      fontFamily="Inter, sans-serif"
      color="#ffffff" fontStyle="italic"
      textStrokeColor="#6c5ce7" textStrokeWidth="1"
      letterSpacing="4"
      textTransform="uppercase">
      Subtítulo con borde y espaciado
    </text>

    <!-- Cuerpo de texto alineado a la izquierda -->
    <text x="140" y="520" w="800" h="200" fontSize="18" fontFamily="system-ui, sans-serif"
      color="rgba(255,255,255,0.85)" textAlign="left"
      lineHeight="1.8" verticalAlign="top">
      Este es un bloque de texto que demuestra múltiples propiedades funcionando juntas. 
      Usa interletraje estándar, altura de línea cómoda (1.8) y alineación izquierda.

      El texto respeta los saltos de línea gracias a white-space: pre-wrap.
    </text>

    <!-- Cita con fondo y borde izquierdo (simulado) -->
    <text x="140" y="780" w="800" h="80" fontSize="22" fontFamily="Georgia, serif"
      fontStyle="italic" color="#a78bfa" textAlign="left" verticalAlign="middle"
      textBgColor="#1e1e2e">
      "El diseño es donde la ciencia y el arte se rompen."
    </text>

    <!-- Etiquetas decorativas -->
    <text x="140" y="920" w="140" h="36" fontSize="13" fontFamily="system-ui, sans-serif"
      fontWeight="700" color="#ffffff" textAlign="center" verticalAlign="middle"
      textBgColor="#6c5ce7" textTransform="uppercase" letterSpacing="2">
      Diseño
    </text>
    <text x="300" y="920" w="140" h="36" fontSize="13" fontFamily="system-ui, sans-serif"
      fontWeight="700" color="#ffffff" textAlign="center" verticalAlign="middle"
      textBgColor="#e94560" textTransform="uppercase" letterSpacing="2">
      Tipografía
    </text>
    <text x="460" y="920" w="140" h="36" fontSize="13" fontFamily="system-ui, sans-serif"
      fontWeight="700" color="#ffffff" textAlign="center" verticalAlign="middle"
      textBgColor="#10b981" textTransform="uppercase" letterSpacing="2">
      Color
    </text>

    <!-- Ejemplo de código -->
    <text x="140" y="1040" w="800" h="100" fontSize="14" fontFamily="Courier New, monospace"
      color="#10b981" textAlign="left" verticalAlign="top" lineHeight="1.6"
      textBgColor="#1a1a2e">
      {/* Código de ejemplo */}
      const title = "Hello World";
      const styles = {
        fontFamily: "Inter, sans-serif",
        fontSize: 48,
        color: "#ffffff",
      };
    </text>

    <!-- Footer con espaciado extremo -->
    <text x="60" y="1780" w="960" h="40" fontSize="12" fontFamily="system-ui, sans-serif"
      color="rgba(255,255,255,0.3)" textAlign="center" letterSpacing="8" textTransform="uppercase">
      Design Studio — Text System Demo · Julio 2026
    </text>
  </page>

  <!-- ================================================================
    PÁGINA 5: Padding, Outline, Múltiples sombras y Overflow
  ================================================================ -->
  <page width="1080" height="1920" bgColor="#0f0f1a">

    <text x="60" y="60" w="960" h="70" fontSize="42" fontFamily="system-ui, sans-serif" fontWeight="700" color="#ffffff" textAlign="center">
      📦 Padding · Outline · Sombras · Overflow
    </text>
    <text x="60" y="130" w="960" h="24" fontSize="13" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.4)" textAlign="center">
      Nuevas propiedades internas y decorativas
    </text>

    <!-- Padding -->
    <text x="60" y="210" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Padding Interno Personalizado
    </text>
    <text x="60" y="260" w="400" h="100" fontSize="16" fontFamily="Inter, sans-serif" color="#ffffff" textAlign="left" verticalAlign="top"
      textBgColor="#1e1e2e"
      textPaddingLeft="24" textPaddingRight="16" textPaddingTop="16" textPaddingBottom="12">
      Padding asimétrico:
      izq 24px, der 16px,
      sup 16px, inf 12px
    </text>
    <text x="500" y="260" w="400" h="100" fontSize="16" fontFamily="Inter, sans-serif" color="#ffffff" textAlign="center"
      textBgColor="#1e1e2e"
      textPaddingLeft="40" textPaddingRight="40" textPaddingTop="30" textPaddingBottom="10">
      Padding raro
      mucho espacio arriba
      poco abajo
    </text>

    <!-- Outline -->
    <text x="60" y="420" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Outline Externo Decorativo
    </text>
    <text x="60" y="470" w="400" h="60" fontSize="24" fontFamily="Oswald, sans-serif" fontWeight="700" color="#ffffff" textAlign="center"
      textOutlineColor="#6c5ce7" textOutlineWidth="4">
      Outline Morado
    </text>
    <text x="500" y="470" w="400" h="60" fontSize="24" fontFamily="Oswald, sans-serif" fontWeight="700" color="#ffffff" textAlign="center"
      textOutlineColor="#e94560" textOutlineWidth="3">
      Outline Rojo
    </text>
    <text x="60" y="560" w="400" h="60" fontSize="24" fontFamily="Oswald, sans-serif" fontWeight="700" color="#10b981" textAlign="center"
      textOutlineColor="#10b981" textOutlineWidth="6">
      Outline Verde 6px
    </text>

    <!-- Múltiples sombras -->
    <text x="60" y="700" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Múltiples Sombras de Texto
    </text>
    <text x="60" y="770" w="960" h="80" fontSize="44" fontWeight="900" color="#ffffff" textAlign="center"
      textShadows='[{"color":"#6c5ce7","blur":25,"offsetX":0,"offsetY":0},{"color":"#e94560","blur":15,"offsetX":5,"offsetY":5},{"color":"#000000","blur":4,"offsetX":-3,"offsetY":-3}]'>
      GLOW + SOMBRA + PROFUNDIDAD
    </text>
    <text x="60" y="880" w="960" h="80" fontSize="36" fontWeight="800" color="#ffffff" textAlign="center"
      textShadows='[{"color":"#4ecdc4","blur":20,"offsetX":0,"offsetY":0},{"color":"#ff6b6b","blur":20,"offsetX":0,"offsetY":0}]'>
      Neón Rosa + Cian
    </text>
    <text x="60" y="990" w="960" h="60" fontSize="28" fontWeight="700" color="#f5f5f5" textAlign="center"
      textShadows='[{"color":"#333333","blur":2,"offsetX":2,"offsetY":2},{"color":"#555555","blur":4,"offsetX":4,"offsetY":4},{"color":"#777777","blur":6,"offsetX":6,"offsetY":6},{"color":"#999999","blur":8,"offsetX":8,"offsetY":8}]'>
      Sombra Escalonada 4 Capas
    </text>

    <!-- Overflow -->
    <text x="60" y="1120" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Modos de Desbordamiento
    </text>

    <text x="60" y="1170" w="960" h="24" fontSize="12" color="rgba(255,255,255,0.5)" fontFamily="system-ui, sans-serif">
      Cada texto tiene 250px de ancho y 36px de alto. El contenido es el mismo en todos.
    </text>

    <!-- hidden -->
    <text x="60" y="1220" w="250" h="36" fontSize="16" color="#ffffff" textBgColor="#1e1e2e" textOverflow="hidden">
      Modo hidden: Este texto es muy largo y se va a cortar sin puntos suspensivos
    </text>
    <text x="68" y="1220" w="234" h="36" fontSize="10" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.3)"
      textAlign="right" verticalAlign="bottom">
      hidden
    </text>

    <!-- visible -->
    <text x="330" y="1220" w="250" h="36" fontSize="16" color="#ffffff" textBgColor="#1e1e2e" textOverflow="visible">
      Modo visible: Este texto es muy largo y se sale del contenedor
    </text>
    <text x="340" y="1220" w="234" h="36" fontSize="10" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.3)"
      textAlign="right" verticalAlign="bottom">
      visible
    </text>

    <!-- ellipsis -->
    <text x="600" y="1220" w="250" h="36" fontSize="16" color="#ffffff" textBgColor="#1e1e2e" textOverflow="ellipsis">
      Modo ellipsis: Este texto es muy largo y se corta con puntos...
    </text>
    <text x="610" y="1220" w="234" h="36" fontSize="10" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.3)"
      textAlign="right" verticalAlign="bottom">
      ellipsis
    </text>

    <!-- clip -->
    <text x="60" y="1300" w="250" h="36" fontSize="16" color="#ffffff" textBgColor="#1e1e2e" textOverflow="clip">
      Modo clip: Este texto es muy largo y se corta sin puntos igual que hidden
    </text>
    <text x="68" y="1300" w="234" h="36" fontSize="10" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.3)"
      textAlign="right" verticalAlign="bottom">
      clip
    </text>

    <!-- Combinación completa -->
    <text x="60" y="1440" w="960" h="30" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Composición Completa — Todo combinado
    </text>

    <!-- Caja de título con outline + múltiples sombras + padding -->
    <text x="60" y="1500" w="960" h="120" fontSize="52" fontFamily="Oswald, sans-serif"
      fontWeight="700" color="#ffffff" textAlign="center"
      letterSpacing="6" textTransform="uppercase"
      textOutlineColor="#6c5ce7" textOutlineWidth="3"
      textPaddingLeft="20" textPaddingRight="20"
      textShadows='[{"color":"#6c5ce7","blur":30,"offsetX":0,"offsetY":0},{"color":"#e94560","blur":15,"offsetX":6,"offsetY":6},{"color":"#000000","blur":5,"offsetX":-4,"offsetY":-4}]'>
      TÍTULO CINEMATOGRÁFICO
    </text>

    <!-- Subtítulo con padding + overflow ellipsis -->
    <text x="60" y="1660" w="960" h="40" fontSize="18" fontFamily="Inter, sans-serif"
      fontWeight="400" color="rgba(255,255,255,0.7)" textAlign="center"
      textPaddingLeft="16" textPaddingRight="16"
      textOverflow="ellipsis">
      Este es un subtítulo muy largo que probablemente no quepa en una sola línea y se cortará con puntos suspensivos porque así lo determinó el diseñador
    </text>

    <!-- Footer con padding extremo -->
    <text x="60" y="1800" w="960" h="40" fontSize="12" fontFamily="system-ui, sans-serif"
      color="rgba(255,255,255,0.3)" textAlign="center" letterSpacing="8" textTransform="uppercase"
      textPaddingLeft="40" textPaddingRight="40">
      Design Studio — Text System Demo · Julio 2026
    </text>
  </page>
</project>
