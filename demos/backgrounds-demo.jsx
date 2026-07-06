<project>
  <config pageGap="40" showGrid="false" snapToGrid="false" />

  <!-- ================================================================
    PÁGINA 1: Degradados
    Muestra los tres tipos de degradado: lineal, radial y cónico
  ================================================================ -->
  <page width="1080" height="1920" bgColor="#0f0f1a"
    bgStyle="linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)">

    <text x="60" y="80" w="960" h="70" fontSize="42" fontFamily="system-ui, sans-serif" fontWeight="700" color="#ffffff" textAlign="center">
      🎨 Sistema de Fondos — Degradados
    </text>
    <text x="60" y="150" w="960" h="30" fontSize="14" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.5)" textAlign="center">
      Lineal · Radial · Cónico — Cada rectángulo usa bgStyle
    </text>

    <!-- Lineal -->
    <text x="60" y="240" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Degradado Lineal
    </text>
    <figure x="60" y="280" w="300" h="200" type="rect" borderRadius="12"
      bgStyle="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
    <figure x="390" y="280" w="300" h="200" type="rect" borderRadius="12"
      bgStyle="linear-gradient(45deg, #f093fb 0%, #f5576c 100%)" />
    <figure x="720" y="280" w="300" h="200" type="rect" borderRadius="12"
      bgStyle="linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)" />

    <!-- Radial -->
    <text x="60" y="540" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Degradado Radial
    </text>
    <figure x="60" y="580" w="300" h="200" type="rect" borderRadius="12"
      bgStyle="radial-gradient(circle at center, #667eea 0%, #764ba2 100%)" />
    <figure x="390" y="580" w="300" h="200" type="rect" borderRadius="12"
      bgStyle="radial-gradient(circle at top left, #43e97b 0%, #38f9d7 100%)" />
    <figure x="720" y="580" w="300" h="200" type="rect" borderRadius="12"
      bgStyle="radial-gradient(circle at bottom right, #f093fb 0%, #f5576c 100%)" />

    <!-- Cónico -->
    <text x="60" y="840" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Degradado Cónico
    </text>
    <figure x="60" y="880" w="300" h="200" type="rect" borderRadius="100"
      bgStyle="conic-gradient(from 0deg at center, #ff6b6b, #4ecdc4, #45b7d1, #ff6b6b)" />
    <figure x="390" y="880" w="300" h="200" type="rect" borderRadius="12"
      bgStyle="conic-gradient(from 45deg at center, #667eea, #764ba2, #e94560, #667eea)" />
    <figure x="720" y="880" w="300" h="200" type="rect" borderRadius="12"
      bgStyle="conic-gradient(from 90deg at center, #f093fb, #f5576c, #4facfe, #f093fb)" />

    <!-- Múltiples stops -->
    <text x="60" y="1140" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Múltiples Stops
    </text>
    <figure x="60" y="1180" w="960" h="100" type="rect" borderRadius="8"
      bgStyle="linear-gradient(90deg, #ff0000 0%, #ff8800 20%, #ffff00 40%, #00ff00 60%, #0088ff 80%, #8800ff 100%)" />
    <figure x="60" y="1320" w="960" h="100" type="rect" borderRadius="8"
      bgStyle="linear-gradient(90deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #e94560 100%)" />
  </page>

  <!-- ================================================================
    PÁGINA 2: Patrones
    Muestra los 5 tipos de patrón CSS generativo
  ================================================================ -->
  <page width="1080" height="1920" bgColor="#ffffff">

    <text x="60" y="80" w="960" h="70" fontSize="42" fontFamily="system-ui, sans-serif" fontWeight="700" color="#1a1a2e" textAlign="center">
      🔲 Patrones CSS Generativos
    </text>
    <text x="60" y="150" w="960" h="30" fontSize="14" fontFamily="system-ui, sans-serif" color="rgba(0,0,0,0.5)" textAlign="center">
      Sin imágenes externas — 100% CSS
    </text>

    <!-- Checkerboard -->
    <text x="60" y="240" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#6c5ce7">
      Ajedrez (checkerboard)
    </text>
    <figure x="60" y="280" w="400" h="250" type="rect" borderRadius="8"
      bgStyle="repeating-conic-gradient(#6c5ce7 0% 25%, #a29bfe 0% 50%) 0 0 / 40px 40px" />
    <figure x="500" y="280" w="400" h="250" type="rect" borderRadius="8"
      bgStyle="repeating-conic-gradient(#e94560 0% 25%, #ff6b6b 0% 50%) 0 0 / 20px 20px" />

    <!-- Dots -->
    <text x="60" y="590" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#6c5ce7">
      Puntos (dots)
    </text>
    <figure x="60" y="630" w="400" h="250" type="rect" borderRadius="8" backgroundColor="#f8f9fa"
      bgStyle="radial-gradient(#6c5ce7 3px, transparent 3px) 0 0 / 30px 30px" />
    <figure x="500" y="630" w="400" h="250" type="rect" borderRadius="8" backgroundColor="#f8f9fa"
      bgStyle="radial-gradient(#e94560 2px, transparent 2px) 0 0 / 15px 15px" />

    <!-- Stripes -->
    <text x="60" y="940" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#6c5ce7">
      Rayas (stripes)
    </text>
    <figure x="60" y="980" w="960" h="80" type="rect" borderRadius="8"
      bgStyle="repeating-linear-gradient(45deg, #6c5ce7, #6c5ce7 4px, transparent 4px, transparent 20px)" />
    <figure x="60" y="1100" w="960" h="80" type="rect" borderRadius="8"
      bgStyle="repeating-linear-gradient(-45deg, #e94560, #e94560 2px, transparent 2px, transparent 16px)" />
    <figure x="60" y="1220" w="960" h="80" type="rect" borderRadius="8"
      bgStyle="repeating-linear-gradient(0deg, #10b981, #10b981 3px, transparent 3px, transparent 24px)" />

    <!-- Grid -->
    <text x="60" y="1360" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#6c5ce7">
      Cuadrícula (grid)
    </text>
    <figure x="60" y="1400" w="400" h="250" type="rect" borderRadius="8" backgroundColor="#f0f0ff"
      bgStyle="repeating-linear-gradient(0deg, #6c5ce7, #6c5ce7 1px, transparent 1px, transparent 30px), repeating-linear-gradient(90deg, #6c5ce7, #6c5ce7 1px, transparent 1px, transparent 30px)" />

    <!-- Crosshatch -->
    <text x="60" y="1710" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#6c5ce7">
      Trama (crosshatch)
    </text>
    <figure x="60" y="1750" w="400" h="150" type="rect" borderRadius="8" backgroundColor="#1a1a2e"
      bgStyle="repeating-linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 1px, transparent 1px, transparent 20px)" />
  </page>

  <!-- ================================================================
    PÁGINA 3: Imágenes + Capas Múltiples + Blend Modes
  ================================================================ -->
  <page width="1080" height="1920" bgColor="#1a1a2e">

    <text x="60" y="80" w="960" h="70" fontSize="42" fontFamily="system-ui, sans-serif" fontWeight="700" color="#ffffff" textAlign="center">
      🖼 Imágenes y Capas Múltiples
    </text>

    <!-- Imagen de fondo -->
    <text x="60" y="200" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Imagen + Degradado (múltiples capas CSS)
    </text>
    <figure x="60" y="240" w="960" h="400" type="rect" borderRadius="12"
      bgStyle="linear-gradient(135deg, rgba(108,92,231,0.6) 0%, rgba(233,69,96,0.6) 100%), repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, transparent 0% 50%) 0 0 / 40px 40px, #1a1a2e" />

    <!-- Blend modes -->
    <text x="60" y="700" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Blend Modes sobre degradado
    </text>
    <figure x="60" y="740" w="220" h="220" type="rect" borderRadius="12"
      bgStyle="linear-gradient(135deg, #667eea, #764ba2)">
      <!-- Nota: Los blend-modes requieren capas de fondo o imágenes -->
    </figure>
    <figure x="310" y="740" w="220" h="220" type="rect" borderRadius="12"
      bgStyle="linear-gradient(135deg, #f093fb, #f5576c)" />
    <figure x="560" y="740" w="220" h="220" type="rect" borderRadius="12"
      bgStyle="linear-gradient(135deg, #4facfe, #00f2fe)" />

    <!-- Gradiente + Patrón combinado -->
    <text x="60" y="1020" w="960" h="24" fontSize="16" fontFamily="system-ui, sans-serif" fontWeight="600" color="#a78bfa">
      Combinaciones Avanzadas
    </text>
    <figure x="60" y="1060" w="960" h="120" type="rect" borderRadius="8"
      bgStyle="repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px), linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />

    <figure x="60" y="1220" w="960" h="120" type="rect" borderRadius="8"
      bgStyle="radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), repeating-conic-gradient(rgba(108,92,231,0.3) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px, #0f0f1a" />

    <!-- Tarjeta final -->
    <figure x="60" y="1400" w="960" h="300" type="rect" borderRadius="16"
      borderWidth="1" borderColor="rgba(255,255,255,0.1)"
      bgStyle="linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%), #16213e">
      <text x="120" y="1480" w="840" h="40" fontSize="24" fontFamily="system-ui, sans-serif" fontWeight="700" color="#ffffff">
        🌈 Sistema de Fondos Multicapa
      </text>
      <text x="120" y="1540" w="840" h="60" fontSize="14" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.6)">
        Este proyecto demuestra las capacidades del sistema de fondos del editor.
        Cada fondo se compone de capas CSS apiladas que se exportan como bgStyle.
      </text>
      <text x="120" y="1620" w="840" h="40" fontSize="12" fontFamily="system-ui, sans-serif" color="rgba(255,255,255,0.3)">
        Design Studio — Background System Demo · Julio 2026
      </text>
    </figure>
  </page>
</project>
