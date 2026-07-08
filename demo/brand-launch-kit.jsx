<project>
  <config pageGap="60" showGrid="false" snapToGrid="true" gridSize="20" showRulers="false" guideMode="page">
    <guide position="80" orientation="vertical" pageId="page_1" />
    <guide position="540" orientation="vertical" pageId="page_1" />
    <guide position="1000" orientation="vertical" pageId="page_1" />
    <guide position="120" orientation="horizontal" pageId="page_1" />
    <guide position="300" orientation="horizontal" pageId="page_1" />
    <guide position="880" orientation="horizontal" pageId="page_1" />
    <guide position="1840" orientation="horizontal" pageId="page_1" />
    <guide position="80" orientation="vertical" pageId="page_2" />
    <guide position="540" orientation="vertical" pageId="page_2" />
    <guide position="1000" orientation="vertical" pageId="page_2" />
    <guide position="80" orientation="horizontal" pageId="page_2" />
    <guide position="200" orientation="horizontal" pageId="page_2" />
    <guide position="80" orientation="vertical" pageId="page_3" />
    <guide position="360" orientation="vertical" pageId="page_3" />
    <guide position="640" orientation="vertical" pageId="page_3" />
    <guide position="80" orientation="horizontal" pageId="page_3" />
    <guide position="200" orientation="horizontal" pageId="page_3" />
    <guide position="480" orientation="horizontal" pageId="page_3" />
    <guide position="760" orientation="horizontal" pageId="page_3" />
    <guide position="80" orientation="vertical" pageId="page_4" />
    <guide position="540" orientation="vertical" pageId="page_4" />
    <guide position="80" orientation="horizontal" pageId="page_4" />
    <guide position="200" orientation="horizontal" pageId="page_4" />
    <guide position="80" orientation="vertical" pageId="page_5" />
    <guide position="540" orientation="vertical" pageId="page_5" />
    <guide position="80" orientation="horizontal" pageId="page_5" />
    <guide position="200" orientation="horizontal" pageId="page_5" />
  </config>

  <!-- ========================================================================
       PAGINA 1: PORTADA (1080x1920)
       Instagram Story - Hero branding con degradado y tipografia bold
       ======================================================================== -->
  <page width="1080" height="1920" bgColor="#070714" name="Portada">

    <!-- Fondo base - zIndex 0 -->
    <shape x="0" y="0" w="1080" h="1920" shapeKind="rect" zIndex="0"
      bgStyle="radial-gradient(ellipse at 50% 8%, rgba(99,102,241,0.25) 0%, transparent 50%),
               radial-gradient(ellipse at 80% 85%, rgba(236,72,153,0.12) 0%, transparent 40%),
               radial-gradient(ellipse at 20% 70%, rgba(52,211,153,0.08) 0%, transparent 35%)" />

    <!-- Grid de puntos - zIndex 1 -->
    <shape x="0" y="0" w="1080" h="1920" shapeKind="rect" zIndex="1"
      bgStyle="radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px) 24px 24px"
      mixBlendMode="overlay" />

    <!-- Barra superior decorativa - zIndex 2 -->
    <shape x="0" y="0" w="1080" h="4" shapeKind="rect" zIndex="2"
      fillGradient="linear-gradient(90deg, #6366f1, #ec4899, #34d399, #fbbf24)" />

    <!-- Circulos decorativos detras del texto - zIndex 3 -->
    <shape x="340" y="300" w="400" h="400" shapeKind="circle" zIndex="3"
      borderColor="rgba(99,102,241,0.15)" borderWidth="1" opacity="0.4" />
    <shape x="290" y="250" w="500" h="500" shapeKind="circle" zIndex="3"
      borderColor="rgba(52,211,153,0.08)" borderWidth="2" borderStyle="dashed" opacity="0.25" />

    <!-- Marca - zIndex 10 -->
    <text x="80" y="100" w="400" h="36" fontSize="11" fontWeight="700" zIndex="10"
      fontFamily="Inter, sans-serif" color="#6366f1"
      textTransform="uppercase" letterSpacing="8">
      NEXUS STUDIO
    </text>
    <shape x="80" y="128" w="32" h="3" shapeKind="rect" zIndex="10" backgroundColor="#6366f1" opacity="0.8" />

    <!-- Hero principal - zIndex 20 con autoFitSize -->
    <text x="80" y="340" w="920" h="320" fontSize="88" fontWeight="900" zIndex="20"
      fontFamily="Poppins, sans-serif" color="#ffffff"
      textGradient="linear-gradient(135deg, #ffffff 35%, #c4b5fd)"
      textStrokeColor="#070714" textStrokeWidth="2"
      letterSpacing="-2" lineHeight="1.05" autoFitSize="true">
      CREAMOS EL
      FUTURO DEL
      DISENO
    </text>

    <!-- Subtitulo - zIndex 20 -->
    <text x="80" y="700" w="640" h="60" fontSize="15" fontWeight="400" zIndex="20"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.5)" lineHeight="1.6" letterSpacing="0.3">
      Una plataforma integral para disenadores que buscan llevar sus ideas mas alla. Sin limites. Sin compromisos.
    </text>

    <!-- Divisor - zIndex 15 -->
    <shape x="80" y="800" w="920" h="1" shapeKind="line" zIndex="15"
      borderColor="rgba(255,255,255,0.06)" borderWidth="1" />

    <!-- CTA buttons - zIndex 50 -->
    <shape x="80" y="850" w="200" h="52" shapeKind="rect" zIndex="50"
      backgroundColor="#6366f1" borderRadius="26" />
    <text x="80" y="850" w="200" h="52" fontSize="12" fontWeight="700" zIndex="51"
      fontFamily="Inter, sans-serif" color="#ffffff"
      textAlign="center" verticalAlign="middle" textTransform="uppercase" letterSpacing="2">
      COMENZAR
    </text>

    <shape x="300" y="850" w="200" h="52" shapeKind="rect" zIndex="50"
      borderColor="rgba(255,255,255,0.15)" borderWidth="1" borderRadius="26" backgroundColor="transparent" />
    <text x="300" y="850" w="200" h="52" fontSize="12" fontWeight="600" zIndex="51"
      fontFamily="Inter, sans-serif" color="#ffffff"
      textAlign="center" verticalAlign="middle" textTransform="uppercase" letterSpacing="2">
      VER MAS
    </text>

    <!-- Stats bar - zIndex 5 -->
    <shape x="0" y="1830" w="1080" h="90" shapeKind="rect" zIndex="5" backgroundColor="rgba(255,255,255,0.02)" />
    <text x="120" y="1840" w="240" h="70" fontSize="11" fontWeight="400" zIndex="6"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.3)" textAlign="center" verticalAlign="middle">
      500+ PROYECTOS
    </text>
    <text x="420" y="1840" w="240" h="70" fontSize="11" fontWeight="400" zIndex="6"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.3)" textAlign="center" verticalAlign="middle">
      80 PAISES
    </text>
    <text x="720" y="1840" w="240" h="70" fontSize="11" fontWeight="400" zIndex="6"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.3)" textAlign="center" verticalAlign="middle">
      25 PREMIOS
    </text>
    <shape x="380" y="1855" w="1" h="40" shapeKind="line" zIndex="5"
      borderColor="rgba(255,255,255,0.05)" borderWidth="1" />
    <shape x="680" y="1855" w="1" h="40" shapeKind="line" zIndex="5"
      borderColor="rgba(255,255,255,0.05)" borderWidth="1" />
  </page>

  <!-- ========================================================================
       PAGINA 2: SERVICIOS (1080x1350)
       Tres pilares de servicio con cards
       ======================================================================== -->
  <page width="1080" height="1350" bgColor="#0c0c24" name="Servicios">

    <!-- Fondo - zIndex 0 -->
    <shape x="0" y="0" w="1080" h="1350" shapeKind="rect" zIndex="0"
      bgStyle="radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.08) 0%, transparent 45%),
               radial-gradient(ellipse at 100% 100%, rgba(236,72,153,0.06) 0%, transparent 40%)" />

    <!-- Header - zIndex 10 -->
    <text x="80" y="80" w="920" h="22" fontSize="10" fontWeight="600" zIndex="10"
      fontFamily="Inter, sans-serif" color="#6366f1" textTransform="uppercase" letterSpacing="6">
      SERVICIOS
    </text>
    <text x="80" y="120" w="800" h="70" fontSize="34" fontWeight="800" zIndex="10"
      fontFamily="Poppins, sans-serif" color="#ffffff" letterSpacing="-0.5" lineHeight="1.2">
      Soluciones completas
    </text>
    <shape x="80" y="175" w="40" h="3" shapeKind="rect" zIndex="10" backgroundColor="#6366f1" />

    <!-- Card 1 - zIndex 10 -->
    <shape x="80" y="230" w="290" h="330" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(99,102,241,0.04)" borderRadius="20"
      borderColor="rgba(99,102,241,0.12)" borderWidth="1" />
    <svg x="110" y="265" w="36" h="36" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>' />
    <text x="110" y="320" w="240" h="24" fontSize="16" fontWeight="700" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Diseno UX/UI
    </text>
    <text x="110" y="355" w="240" h="100" fontSize="11" fontWeight="400" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.45)" lineHeight="1.7">
      Interfaces intuitivas y experiencias de usuario memorables. Investigacion, prototipado y validacion con usuarios reales.
    </text>
    <text x="110" y="490" w="240" h="36" fontSize="10" fontWeight="600" zIndex="11"
      fontFamily="Inter, sans-serif" color="#6366f1" verticalAlign="middle">
      + 30 proyectos
    </text>

    <!-- Card 2 -->
    <shape x="395" y="230" w="290" h="330" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(236,72,153,0.04)" borderRadius="20"
      borderColor="rgba(236,72,153,0.12)" borderWidth="1" />
    <svg x="425" y="265" w="36" h="36" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="1.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' />
    <text x="425" y="320" w="240" h="24" fontSize="16" fontWeight="700" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Branding
    </text>
    <text x="425" y="355" w="240" h="100" fontSize="11" fontWeight="400" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.45)" lineHeight="1.7">
      Identidad visual completa: logotipos, paletas de color, tipografia y guias de marca coherentes.
    </text>
    <text x="425" y="490" w="240" h="36" fontSize="10" fontWeight="600" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ec4899" verticalAlign="middle">
      + 50 marcas
    </text>

    <!-- Card 3 -->
    <shape x="710" y="230" w="290" h="330" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(52,211,153,0.04)" borderRadius="20"
      borderColor="rgba(52,211,153,0.12)" borderWidth="1" />
    <svg x="740" y="265" w="36" h="36" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="1.5"><path d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-7.2A3.5 3.5 0 008 11.5 3.5 3.5 0 003 15z"/></svg>' />
    <text x="740" y="320" w="240" h="24" fontSize="16" fontWeight="700" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Desarrollo Web
    </text>
    <text x="740" y="355" w="240" h="100" fontSize="11" fontWeight="400" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.45)" lineHeight="1.7">
      Sitios web y aplicaciones con tecnologias modernas. Rendimiento, accesibilidad y SEO.
    </text>
    <text x="740" y="490" w="240" h="36" fontSize="10" fontWeight="600" zIndex="11"
      fontFamily="Inter, sans-serif" color="#34d399" verticalAlign="middle">
      + 80 sitios
    </text>

    <!-- CTA section - zIndex 20 -->
    <shape x="80" y="620" w="920" h="580" shapeKind="rect" zIndex="20"
      backgroundColor="rgba(255,255,255,0.015)" borderRadius="24"
      borderColor="rgba(255,255,255,0.04)" borderWidth="1" />

    <text x="120" y="680" w="840" h="70" fontSize="28" fontWeight="800" zIndex="21"
      fontFamily="Poppins, sans-serif" color="#ffffff" textAlign="center" letterSpacing="-0.5" lineHeight="1.3">
      Listos para transformar tu vision
    </text>
    <text x="180" y="780" w="720" h="50" fontSize="13" fontWeight="400" zIndex="21"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.4)" textAlign="center" lineHeight="1.6">
      Agenda una llamada gratuita y descubre como podemos ayudarte.
    </text>

    <!-- CTA Button - zIndex 30 -->
    <shape x="380" y="900" w="320" h="50" shapeKind="rect" zIndex="30" backgroundColor="#6366f1" borderRadius="25" />
    <text x="380" y="900" w="320" h="50" fontSize="13" fontWeight="700" zIndex="31"
      fontFamily="Inter, sans-serif" color="#ffffff"
      textAlign="center" verticalAlign="middle" textTransform="uppercase" letterSpacing="2">
      AGENDAR CITA
    </text>

    <!-- Trust bar - zIndex 15 -->
    <text x="120" y="1040" w="840" h="20" fontSize="10" fontWeight="500" zIndex="15"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.2)" textAlign="center" textTransform="uppercase" letterSpacing="4">
      Confian en nosotros
    </text>
    <text x="140" y="1080" w="180" h="28" fontSize="14" fontWeight="700" zIndex="15"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.25)" textAlign="center" verticalAlign="middle">
      Google
    </text>
    <text x="340" y="1080" w="180" h="28" fontSize="14" fontWeight="700" zIndex="15"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.25)" textAlign="center" verticalAlign="middle">
      Spotify
    </text>
    <text x="540" y="1080" w="180" h="28" fontSize="14" fontWeight="700" zIndex="15"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.25)" textAlign="center" verticalAlign="middle">
      Figma
    </text>
    <text x="740" y="1080" w="180" h="28" fontSize="14" fontWeight="700" zIndex="15"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.25)" textAlign="center" verticalAlign="middle">
      Notion
    </text>
  </page>

  <!-- ========================================================================
       PAGINA 3: PORTFOLIO (1080x1080)
       Showcase de proyectos en grid 2x2
       ======================================================================== -->
  <page width="1080" height="1080" bgColor="#08081a" name="Portfolio">

    <!-- Fondo - zIndex 0 -->
    <shape x="0" y="0" w="1080" h="1080" shapeKind="rect" zIndex="0"
      bgStyle="repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(255,255,255,0.01) 49px, rgba(255,255,255,0.01) 50px),
               repeating-linear-gradient(-90deg, transparent, transparent 49px, rgba(255,255,255,0.01) 49px, rgba(255,255,255,0.01) 50px)"
      mixBlendMode="overlay" />

    <!-- Header - zIndex 10 -->
    <text x="80" y="70" w="920" h="20" fontSize="10" fontWeight="600" zIndex="10"
      fontFamily="Inter, sans-serif" color="#6366f1" textTransform="uppercase" letterSpacing="6">
      PROYECTOS
    </text>
    <text x="80" y="105" w="600" h="60" fontSize="30" fontWeight="800" zIndex="10"
      fontFamily="Poppins, sans-serif" color="#ffffff" letterSpacing="-0.5" lineHeight="1.2" autoFitSize="true">
      Nuestro trabajo
    </text>
    <shape x="80" y="155" w="40" h="3" shapeKind="rect" zIndex="10" backgroundColor="#6366f1" />

    <!-- Project 1 - zIndex 10 -->
    <shape x="80" y="210" w="440" h="390" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(99,102,241,0.03)" borderRadius="20"
      borderColor="rgba(99,102,241,0.08)" borderWidth="1" />
    <shape x="100" y="230" w="400" h="200" shapeKind="rect" zIndex="11"
      backgroundColor="rgba(99,102,241,0.06)" borderRadius="12" />
    <text x="100" y="455" w="400" h="22" fontSize="15" fontWeight="700" zIndex="12"
      fontFamily="Inter, sans-serif" color="#ffffff">
      E-Commerce Platform
    </text>
    <text x="100" y="485" w="400" h="45" fontSize="11" fontWeight="400" zIndex="12"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.4)" lineHeight="1.6">
      Plataforma con IA para recomendaciones personalizadas y analitica en tiempo real.
    </text>
    <shape x="100" y="545" w="75" h="24" shapeKind="rect" zIndex="12"
      backgroundColor="rgba(99,102,241,0.12)" borderRadius="12" />
    <text x="100" y="545" w="75" h="24" fontSize="9" fontWeight="600" zIndex="13"
      fontFamily="Inter, sans-serif" color="#6366f1" textAlign="center" verticalAlign="middle">
      Web App
    </text>
    <shape x="185" y="545" w="80" h="24" shapeKind="rect" zIndex="12"
      backgroundColor="rgba(52,211,153,0.12)" borderRadius="12" />
    <text x="185" y="545" w="80" h="24" fontSize="9" fontWeight="600" zIndex="13"
      fontFamily="Inter, sans-serif" color="#34d399" textAlign="center" verticalAlign="middle">
      React
    </text>

    <!-- Project 2 -->
    <shape x="560" y="210" w="440" h="390" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(236,72,153,0.03)" borderRadius="20"
      borderColor="rgba(236,72,153,0.08)" borderWidth="1" />
    <shape x="580" y="230" w="400" h="200" shapeKind="rect" zIndex="11"
      backgroundColor="rgba(236,72,153,0.06)" borderRadius="12" />
    <text x="580" y="455" w="400" h="22" fontSize="15" fontWeight="700" zIndex="12"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Fitness App
    </text>
    <text x="580" y="485" w="400" h="45" fontSize="11" fontWeight="400" zIndex="12"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.4)" lineHeight="1.6">
      Aplicacion mobile con gamificacion, planes personalizados y red social.
    </text>
    <shape x="580" y="545" w="75" h="24" shapeKind="rect" zIndex="12"
      backgroundColor="rgba(236,72,153,0.12)" borderRadius="12" />
    <text x="580" y="545" w="75" h="24" fontSize="9" fontWeight="600" zIndex="13"
      fontFamily="Inter, sans-serif" color="#ec4899" textAlign="center" verticalAlign="middle">
      Mobile
    </text>
    <shape x="665" y="545" w="65" h="24" shapeKind="rect" zIndex="12"
      backgroundColor="rgba(251,191,36,0.12)" borderRadius="12" />
    <text x="665" y="545" w="65" h="24" fontSize="9" fontWeight="600" zIndex="13"
      fontFamily="Inter, sans-serif" color="#fbbf24" textAlign="center" verticalAlign="middle">
      Flutter
    </text>

    <!-- Project 3 -->
    <shape x="80" y="640" w="440" h="360" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(52,211,153,0.03)" borderRadius="20"
      borderColor="rgba(52,211,153,0.08)" borderWidth="1" />
    <shape x="100" y="660" w="400" h="170" shapeKind="rect" zIndex="11"
      backgroundColor="rgba(52,211,153,0.06)" borderRadius="12" />
    <text x="100" y="855" w="400" h="22" fontSize="15" fontWeight="700" zIndex="12"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Dashboard Analytics
    </text>
    <text x="100" y="885" w="400" h="45" fontSize="11" fontWeight="400" zIndex="12"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.4)" lineHeight="1.6">
      Panel de control con visualizacion de datos en tiempo real y exportacion.
    </text>
    <shape x="100" y="945" w="80" h="24" shapeKind="rect" zIndex="12"
      backgroundColor="rgba(52,211,153,0.12)" borderRadius="12" />
    <text x="100" y="945" w="80" h="24" fontSize="9" fontWeight="600" zIndex="13"
      fontFamily="Inter, sans-serif" color="#34d399" textAlign="center" verticalAlign="middle">
      Data Viz
    </text>
    <shape x="190" y="945" w="70" h="24" shapeKind="rect" zIndex="12"
      backgroundColor="rgba(99,102,241,0.12)" borderRadius="12" />
    <text x="190" y="945" w="70" h="24" fontSize="9" fontWeight="600" zIndex="13"
      fontFamily="Inter, sans-serif" color="#6366f1" textAlign="center" verticalAlign="middle">
      D3.js
    </text>

    <!-- Project 4 -->
    <shape x="560" y="640" w="440" h="360" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(251,191,36,0.03)" borderRadius="20"
      borderColor="rgba(251,191,36,0.08)" borderWidth="1" />
    <shape x="580" y="660" w="400" h="170" shapeKind="rect" zIndex="11"
      backgroundColor="rgba(251,191,36,0.06)" borderRadius="12" />
    <text x="580" y="855" w="400" h="22" fontSize="15" fontWeight="700" zIndex="12"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Branding Corporativo
    </text>
    <text x="580" y="885" w="400" h="45" fontSize="11" fontWeight="400" zIndex="12"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.4)" lineHeight="1.6">
      Sistema completo de identidad visual con guias de marca y assets digitales.
    </text>
    <shape x="580" y="945" w="75" h="24" shapeKind="rect" zIndex="12"
      backgroundColor="rgba(251,191,36,0.12)" borderRadius="12" />
    <text x="580" y="945" w="75" h="24" fontSize="9" fontWeight="600" zIndex="13"
      fontFamily="Inter, sans-serif" color="#fbbf24" textAlign="center" verticalAlign="middle">
      Branding
    </text>
    <shape x="665" y="945" w="70" h="24" shapeKind="rect" zIndex="12"
      backgroundColor="rgba(236,72,153,0.12)" borderRadius="12" />
    <text x="665" y="945" w="70" h="24" fontSize="9" fontWeight="600" zIndex="13"
      fontFamily="Inter, sans-serif" color="#ec4899" textAlign="center" verticalAlign="middle">
      Figma
    </text>
  </page>

  <!-- ========================================================================
       PAGINA 4: EQUIPO (1080x1400)
       Team members + valores
       ======================================================================== -->
  <page width="1080" height="1400" bgColor="#0c0c24" name="Equipo">

    <!-- Fondo - zIndex 0 -->
    <shape x="0" y="0" w="1080" h="1400" shapeKind="rect" zIndex="0"
      bgStyle="linear-gradient(180deg, rgba(99,102,241,0.05) 0%, transparent 35%, transparent 70%, rgba(52,211,153,0.03) 100%)" />

    <!-- Header - zIndex 10 -->
    <text x="80" y="80" w="920" h="20" fontSize="10" fontWeight="600" zIndex="10"
      fontFamily="Inter, sans-serif" color="#6366f1" textTransform="uppercase" letterSpacing="6">
      EQUIPO
    </text>
    <text x="80" y="115" w="700" h="65" fontSize="32" fontWeight="800" zIndex="10"
      fontFamily="Poppins, sans-serif" color="#ffffff" letterSpacing="-0.5" lineHeight="1.2">
      Conoce a los fundadores
    </text>
    <shape x="80" y="170" w="40" h="3" shapeKind="rect" zIndex="10" backgroundColor="#6366f1" />

    <!-- Team 1 - zIndex 10 -->
    <shape x="80" y="230" w="440" h="180" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.015)" borderRadius="20"
      borderColor="rgba(255,255,255,0.04)" borderWidth="1" />
    <svg x="110" y="265" w="64" h="64" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#6366f1"/><circle cx="32" cy="25" r="11" fill="#fff" opacity="0.9"/><ellipse cx="32" cy="49" rx="18" ry="12" fill="#fff" opacity="0.9"/></svg>' />
    <text x="195" y="270" w="295" h="20" fontSize="16" fontWeight="700" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Sofia Martinez
    </text>
    <text x="195" y="295" w="295" h="16" fontSize="11" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="#6366f1">
      CEO &amp; Fundadora
    </text>
    <text x="110" y="340" w="380" h="50" fontSize="11" fontWeight="400" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.4)" lineHeight="1.6">
      Disenadora con mas de 15 anos de experiencia en branding y producto. Ex-Google, ex-Apple.
    </text>

    <!-- Team 2 -->
    <shape x="560" y="230" w="440" h="180" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.015)" borderRadius="20"
      borderColor="rgba(255,255,255,0.04)" borderWidth="1" />
    <svg x="590" y="265" w="64" h="64" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#ec4899"/><circle cx="32" cy="25" r="11" fill="#fff" opacity="0.9"/><ellipse cx="32" cy="49" rx="18" ry="12" fill="#fff" opacity="0.9"/></svg>' />
    <text x="675" y="270" w="295" h="20" fontSize="16" fontWeight="700" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Carlos Ruiz
    </text>
    <text x="675" y="295" w="295" h="16" fontSize="11" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ec4899">
      CTO &amp; Co-Fundador
    </text>
    <text x="590" y="340" w="380" h="50" fontSize="11" fontWeight="400" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.4)" lineHeight="1.6">
      Ingeniero especializado en sistemas distribuidos e inteligencia artificial. Ex-Meta, ex-Spotify.
    </text>

    <!-- Team 3 -->
    <shape x="80" y="450" w="440" h="180" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.015)" borderRadius="20"
      borderColor="rgba(255,255,255,0.04)" borderWidth="1" />
    <svg x="110" y="485" w="64" h="64" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#34d399"/><circle cx="32" cy="25" r="11" fill="#fff" opacity="0.9"/><ellipse cx="32" cy="49" rx="18" ry="12" fill="#fff" opacity="0.9"/></svg>' />
    <text x="195" y="490" w="295" h="20" fontSize="16" fontWeight="700" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Ana Guerrero
    </text>
    <text x="195" y="515" w="295" h="16" fontSize="11" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="#34d399">
      Directora Creativa
    </text>
    <text x="110" y="560" w="380" h="50" fontSize="11" fontWeight="400" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.4)" lineHeight="1.6">
      Directora de arte con experiencia en campanas globales para marcas Fortune 500.
    </text>

    <!-- Team 4 -->
    <shape x="560" y="450" w="440" h="180" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.015)" borderRadius="20"
      borderColor="rgba(255,255,255,0.04)" borderWidth="1" />
    <svg x="590" y="485" w="64" h="64" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#fbbf24"/><circle cx="32" cy="25" r="11" fill="#fff" opacity="0.9"/><ellipse cx="32" cy="49" rx="18" ry="12" fill="#fff" opacity="0.9"/></svg>' />
    <text x="675" y="490" w="295" h="20" fontSize="16" fontWeight="700" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Diego Rivas
    </text>
    <text x="675" y="515" w="295" h="16" fontSize="11" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="#fbbf24">
      Lead Developer
    </text>
    <text x="590" y="560" w="380" h="50" fontSize="11" fontWeight="400" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.4)" lineHeight="1.6">
      Desarrollador full-stack con experiencia en React, Node.js y cloud-native.
    </text>

    <!-- Separator - zIndex 5 -->
    <shape x="80" y="690" w="920" h="1" shapeKind="line" zIndex="5" borderColor="rgba(255,255,255,0.04)" borderWidth="1" />

    <!-- Valores - zIndex 10 -->
    <text x="80" y="740" w="920" h="35" fontSize="22" fontWeight="700" zIndex="10"
      fontFamily="Inter, sans-serif" color="#ffffff" textAlign="center">
      Nuestros valores
    </text>

    <shape x="140" y="810" w="180" h="120" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.015)" borderRadius="14"
      borderColor="rgba(255,255,255,0.04)" borderWidth="1" />
    <text x="230" y="840" w="30" h="24" fontSize="20" fontWeight="800" zIndex="11"
      fontFamily="Inter, sans-serif" color="#6366f1" textAlign="center">
      01
    </text>
    <text x="155" y="875" w="150" h="40" fontSize="10" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.5)" textAlign="center" lineHeight="1.5">
      Innovacion constante y excelencia
    </text>

    <shape x="340" y="810" w="180" h="120" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.015)" borderRadius="14"
      borderColor="rgba(255,255,255,0.04)" borderWidth="1" />
    <text x="430" y="840" w="30" h="24" fontSize="20" fontWeight="800" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ec4899" textAlign="center">
      02
    </text>
    <text x="355" y="875" w="150" h="40" fontSize="10" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.5)" textAlign="center" lineHeight="1.5">
      Colaboracion y trabajo en equipo
    </text>

    <shape x="540" y="810" w="180" h="120" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.015)" borderRadius="14"
      borderColor="rgba(255,255,255,0.04)" borderWidth="1" />
    <text x="630" y="840" w="30" h="24" fontSize="20" fontWeight="800" zIndex="11"
      fontFamily="Inter, sans-serif" color="#34d399" textAlign="center">
      03
    </text>
    <text x="555" y="875" w="150" h="40" fontSize="10" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.5)" textAlign="center" lineHeight="1.5">
      Compromiso con la calidad
    </text>

    <shape x="740" y="810" w="180" h="120" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.015)" borderRadius="14"
      borderColor="rgba(255,255,255,0.04)" borderWidth="1" />
    <text x="830" y="840" w="30" h="24" fontSize="20" fontWeight="800" zIndex="11"
      fontFamily="Inter, sans-serif" color="#fbbf24" textAlign="center">
      04
    </text>
    <text x="755" y="875" w="150" h="40" fontSize="10" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.5)" textAlign="center" lineHeight="1.5">
      Transparencia total
    </text>

    <!-- CTA Footer - zIndex 20 -->
    <shape x="0" y="1000" w="1080" h="400" shapeKind="rect" zIndex="20"
      bgStyle="linear-gradient(180deg, transparent, rgba(99,102,241,0.06))" />
    <text x="140" y="1060" w="800" h="55" fontSize="26" fontWeight="800" zIndex="21"
      fontFamily="Poppins, sans-serif" color="#ffffff" textAlign="center" letterSpacing="-0.5" lineHeight="1.3">
      Quieres formar parte del equipo?
    </text>
    <text x="200" y="1140" w="680" h="35" fontSize="12" fontWeight="400" zIndex="21"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.35)" textAlign="center">
      Estamos buscando talento excepcional. Revisa nuestras vacantes.
    </text>
    <shape x="390" y="1220" w="300" h="46" shapeKind="rect" zIndex="30"
      backgroundColor="transparent" borderRadius="23" borderColor="#6366f1" borderWidth="1" />
    <text x="390" y="1220" w="300" h="46" fontSize="12" fontWeight="600" zIndex="31"
      fontFamily="Inter, sans-serif" color="#6366f1"
      textAlign="center" verticalAlign="middle" textTransform="uppercase" letterSpacing="2">
      VER VACANTES
    </text>
  </page>

  <!-- ========================================================================
       PAGINA 5: CONTACTO (1080x1200)
       Formulario de contacto y footer
       ======================================================================== -->
  <page width="1080" height="1200" bgColor="#050510" name="Contacto">

    <!-- Fondo - zIndex 0 -->
    <shape x="0" y="0" w="1080" h="1200" shapeKind="rect" zIndex="0"
      bgStyle="radial-gradient(ellipse at 25% 15%, rgba(99,102,241,0.08) 0%, transparent 40%),
               radial-gradient(ellipse at 75% 85%, rgba(236,72,153,0.05) 0%, transparent 35%)" />

    <!-- Particulas decorativas - zIndex 1 -->
    <shape x="900" y="70" w="5" h="5" shapeKind="circle" zIndex="1" backgroundColor="#6366f1" opacity="0.2" />
    <shape x="100" y="150" w="3" h="3" shapeKind="circle" zIndex="1" backgroundColor="#34d399" opacity="0.15" />
    <shape x="950" y="320" w="7" h="7" shapeKind="circle" zIndex="1" backgroundColor="#ec4899" opacity="0.1" />
    <shape x="80" y="500" w="4" h="4" shapeKind="circle" zIndex="1" backgroundColor="#fbbf24" opacity="0.12" />
    <shape x="960" y="650" w="6" h="6" shapeKind="circle" zIndex="1" backgroundColor="#6366f1" opacity="0.15" />
    <shape x="180" y="800" w="3" h="3" shapeKind="circle" zIndex="1" backgroundColor="#34d399" opacity="0.1" />

    <!-- Header - zIndex 10 -->
    <text x="80" y="80" w="920" h="20" fontSize="10" fontWeight="600" zIndex="10"
      fontFamily="Inter, sans-serif" color="#6366f1" textTransform="uppercase" letterSpacing="6">
      CONTACTO
    </text>
    <text x="80" y="125" w="800" h="90" fontSize="42" fontWeight="800" zIndex="10"
      fontFamily="Poppins, sans-serif" color="#ffffff" lineHeight="1.1" letterSpacing="-1.5" autoFitSize="true">
      Hagamos realidad tu proyecto
    </text>
    <shape x="80" y="200" w="40" h="3" shapeKind="rect" zIndex="10" backgroundColor="#6366f1" />

    <!-- Descripcion - zIndex 10 -->
    <text x="80" y="250" w="600" h="55" fontSize="13" fontWeight="400" zIndex="10"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.45)" lineHeight="1.7">
      Cuentanos sobre tu idea y te responderemos en menos de 24 horas.
    </text>

    <!-- Contacto info - zIndex 10 -->
    <svg x="80" y="360" w="20" h="20" zIndex="10"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>' />
    <text x="115" y="360" w="500" h="20" fontSize="13" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff" verticalAlign="middle">
      hola@nexusstudio.com
    </text>

    <svg x="80" y="400" w="20" h="20" zIndex="10"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="1.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>' />
    <text x="115" y="400" w="500" h="20" fontSize="13" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff" verticalAlign="middle">
      +1 (555) 987-6543
    </text>

    <svg x="80" y="440" w="20" h="20" zIndex="10"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="1.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' />
    <text x="115" y="440" w="500" h="20" fontSize="13" fontWeight="500" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff" verticalAlign="middle">
      Miami, FL 33101
    </text>

    <!-- Redes sociales - zIndex 10 -->
    <text x="80" y="520" w="920" h="16" fontSize="9" fontWeight="600" zIndex="10"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.25)" textTransform="uppercase" letterSpacing="5">
      Redes sociales
    </text>

    <shape x="80" y="555" w="40" h="40" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.02)" borderRadius="10" borderColor="rgba(255,255,255,0.05)" borderWidth="1" />
    <svg x="90" y="565" w="20" h="20" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>' />

    <shape x="132" y="555" w="40" h="40" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.02)" borderRadius="10" borderColor="rgba(255,255,255,0.05)" borderWidth="1" />
    <svg x="142" y="565" w="20" h="20" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' />

    <shape x="184" y="555" w="40" h="40" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.02)" borderRadius="10" borderColor="rgba(255,255,255,0.05)" borderWidth="1" />
    <svg x="194" y="565" w="20" h="20" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>' />

    <shape x="236" y="555" w="40" h="40" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.02)" borderRadius="10" borderColor="rgba(255,255,255,0.05)" borderWidth="1" />
    <svg x="246" y="565" w="20" h="20" zIndex="11"
      svgContent='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>' />

    <!-- Separator - zIndex 5 -->
    <shape x="80" y="640" w="920" h="1" shapeKind="line" zIndex="5" borderColor="rgba(255,255,255,0.04)" borderWidth="1" />

    <!-- Newsletter form - zIndex 10 -->
    <text x="80" y="690" w="920" h="22" fontSize="15" fontWeight="700" zIndex="10"
      fontFamily="Inter, sans-serif" color="#ffffff">
      Suscribete al boletin
    </text>
    <text x="80" y="718" w="600" h="16" fontSize="10" fontWeight="400" zIndex="10"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.3)">
      Recibe recursos exclusivos y novedades.
    </text>

    <shape x="80" y="760" w="460" h="44" shapeKind="rect" zIndex="10"
      backgroundColor="rgba(255,255,255,0.025)" borderRadius="10" borderColor="rgba(255,255,255,0.06)" borderWidth="1" />
    <text x="100" y="760" w="380" h="44" fontSize="11" fontWeight="400" zIndex="11"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.15)" verticalAlign="middle">
      tu@email.com
    </text>
    <shape x="560" y="760" w="150" h="44" shapeKind="rect" zIndex="10" backgroundColor="#6366f1" borderRadius="10" />
    <text x="560" y="760" w="150" h="44" fontSize="11" fontWeight="700" zIndex="11"
      fontFamily="Inter, sans-serif" color="#ffffff"
      textAlign="center" verticalAlign="middle" textTransform="uppercase" letterSpacing="1.5">
      SUSCRIBIRSE
    </text>

    <!-- Footer legal - zIndex 5 -->
    <shape x="0" y="900" w="1080" h="300" shapeKind="rect" zIndex="5" backgroundColor="rgba(255,255,255,0.01)" />
    <text x="80" y="940" w="300" h="26" fontSize="12" fontWeight="700" zIndex="6"
      fontFamily="Inter, sans-serif" color="#ffffff">
      NEXUS STUDIO
    </text>
    <text x="80" y="970" w="300" h="35" fontSize="9" fontWeight="400" zIndex="6"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.18)" lineHeight="1.6">
      2026 Nexus Studio. Todos los derechos reservados.
      Disenando el futuro, un pixel a la vez.
    </text>
    <text x="600" y="960" w="180" h="16" fontSize="10" fontWeight="500" zIndex="6"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.25)" textAlign="right">
      Privacidad
    </text>
    <text x="600" y="982" w="180" h="16" fontSize="10" fontWeight="500" zIndex="6"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.25)" textAlign="right">
      Terminos
    </text>
    <text x="600" y="1004" w="180" h="16" fontSize="10" fontWeight="500" zIndex="6"
      fontFamily="Inter, sans-serif" color="rgba(255,255,255,0.25)" textAlign="right">
      Cookies
    </text>
  </page>
</project>
