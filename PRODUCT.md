# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Reclutadores técnicos, líderes de ingeniería, desarrolladores y entusiastas de anime y tecnología que buscan una experiencia inmersiva, elegante y de alto impacto que demuestre maestría en visión por computadora e interfaces gráficas en el navegador.

## Product Purpose

Demostrar en tiempo real cómo la visión por computadora y los efectos visuales acelerados por hardware pueden integrarse en la web sin servidores intermedios. Permite al usuario ejecutar sellos de manos ninja tradicionales frente a su cámara web y desatar jutsus emblemáticos (Katon, Chidori, Rasengan, Kage Bunshin) con VFX reactivos a 60 FPS, funcionando como una pieza central de portafolio técnico e interactivo.

## Positioning

Detector de jutsus con visión por computadora 100% en el cliente (WebRTC + MediaPipe Tasks Vision + WebGL/Canvas 2D), con procesamiento local privado a 60 FPS sin latencia de red ni requerimientos de instalación. Combina precisión matemática en la detección articular de falanges con una estética moderna, limpia y avanzada de grado profesional.

## Operating Context

Navegadores web modernos de escritorio y portátiles con soporte para WebRTC y aceleración por GPU. Accesible directamente vía GitHub Pages o mediante enlaces directos desde el ecosistema PortfolioChess (`portfoliochess.pages.dev`). Incluye modo de simulación asistida para entornos corporativos o dispositivos sin cámara web activa.

## Capabilities and Constraints

- Captura de video en tiempo real vía WebRTC (`navigator.mediaDevices.getUserMedia`).
- Seguimiento esqueletal de 21 puntos clave por mano con MediaPipe Tasks Vision en WebAssembly.
- Clasificador geométrico in-browser basado en distancias euclidianas y ángulos de falanges (`Serpiente`, `Carnero`, `Tigre`, `Palma Abierta`, `Sello de Cruz`).
- Máquina de estados finitos (FSM) con decaimiento temporal para reconocimiento fluido de combos.
- Renderizador de partículas VFX superpuesto en Canvas/WebGL a 60 FPS (fuego volumétrico, chispas eléctricas, torbellino de chakra y humo de clonación).
- Simulador de respaldo integrado con disparadores manuales para demostraciones sin cámara.
- Procesamiento 100% privado en el cliente; ningún flujo de video o fotograma sale del dispositivo.
- Código complementario de investigación y algoritmos en Python (`src/`) con OpenCV y Pygame.

## Brand Commitments

- **Nombre:** Naruto Jutsu Detector.
- **Tono y Dirección Visual:** Moderno, elegante, avanzado y limpio. Estilo HUD tecnológico / shinobi contemporáneo con contrastes refinados, tipografía técnica nítida y jerarquía clara, evitando sobrecargas infantiles o saturación visual descuidada.
- **Ecosistema:** Integración y navegación fluida con PortfolioChess (`https://portfoliochess.pages.dev`) y repositorio oficial en GitHub (`https://github.com/LuisMonGP/naruto-jutsu-detector`).

## Evidence on Hand

- Aplicación web funcional en `docs/index.html`, `docs/css/style.css` y `docs/js/app.js`.
- Prototipo y suite algorítmica local en Python en `src/` (`hand_tracker.py`, `seal_classifier.py`, `jutsu_fsm.py`, `main.py`).
- Pruebas unitarias de sellos en `tests/test_seals.py`.
- URL de despliegue en vivo en GitHub Pages: `https://luismongp.github.io/naruto-jutsu-detector/`.

## Product Principles

1. **Gratificación y Fluidez Inmediata:** Del primer clic al reconocimiento de sellos y activación de jutsus en menos de 5 segundos; respuesta visual instantánea a 60 FPS.
2. **Elegancia y Precisión Técnica:** Diseño visual moderno, pulcro y avanzado que honra la temática shinobi con sobriedad y sofisticación técnica, destacando la maestría del código y la interfaz.
3. **Privacidad Garantizada por Arquitectura:** Procesamiento estrictamente local y transparente para el usuario en todo momento.
4. **Demostrabilidad Resiliente:** Toda técnica debe poder explorarse y auditarse visualmente aun en ausencia de cámara o en entornos restringidos gracias al panel de simulación interactivo.

## Accessibility & Inclusion

- Contraste visual elevado en la telemetría del HUD, insignias de sellos y banners de estado.
- Controles interactivos con foco visible y soporte de navegación por teclado.
- Modos accesibles con respeto a preferencias del sistema (`prefers-reduced-motion`) para transiciones no esenciales de UI.
