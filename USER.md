# USER.md — Contexto del Usuario

## Nombre / Rol
- Por definir (usuario de design-studio)

## Objetivo
Construir design-studio: un motor de diseño visual en web que permita:
- Crear composiciones visuales animadas (imagen y video) 100% en el navegador
- Exportar frames estáticos (PNG) y videos (.webm)
- Recibir código JSX generado por agentes IA y ejecutarlo en caliente

## Preferencias
- Sin servidor: todo el renderizado es client-side
- El DSL es React declarativo, no JSON
- TypeScript estricto
- Preparado para integrarse en un Monorepo Turborepo en el futuro

## Stack aprobado
- Vite 8, React 19, TypeScript 6.0 strict, Zustand 5, html-to-image, webm-writer

## Notas
- No usar librerías externas de edición de video (FFmpeg.wasm, etc.)
- No usar Node.js en runtime
- No generar documentación sin pedido explícito
