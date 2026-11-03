# Design System: Minimalist Modern Grayscale

<!-- impeccable:design-schema 1 -->

## Direction & Atmosphere

Una interfaz limpia, moderna y luminosa en escala de grises. Diseñada con un enfoque de diseño destilado (*distilled minimalism*): elimina el ruido visual, los resplandores artificiales y la sobrecarga decorativa en favor de la claridad, la tipografía equilibrada y la facilidad de uso. El contenido y la interactividad en tiempo real son los verdaderos protagonistas.

## Palette

```
Fondo General (Page):       #F8FAFC (Blanco roto / Slate ultraligero)
Superficie (Cards/Header):  #FFFFFF (Blanco puro)
Superficie Muted:           #F1F5F9 (Gris suave neutro)
Borde Sutil:                #E2E8F0 (Delimitador claro)
Borde Medio / Foco:         #CBD5E1 (Gris neutro de control)

Texto Primario:             #0F172A (Grafito profundo / Slate 900, contraste > 15:1)
Texto Secundario:           #334155 (Gris carbón / Slate 700, contraste > 7:1)
Texto Muted:                #475569 (Gris medio / Slate 600, contraste > 4.5:1)

Acento Primario:            #0F172A (Botones y estados activos sólidos)
Acento Hover:               #1E293B (Transición en reposo)
Acento Suave:               #E2E8F0 / #CBD5E1 (Chips y tags de bajo contraste intencional)
```

## Typography

- **Cuerpo y Títulos:** `'Sora', sans-serif` (400, 500, 600, 700) — Tipografía geométrica, contemporánea y ergonómica.
- **Sellos y Código:** `'Fira Code', monospace` (400, 500) — Legibilidad monoespaciada para la secuencia de sellos.
- **Kanjis Shinobi:** `'Shojumaru', cursive, serif` — Caligrafía tradicional para la alerta de jutsu activado.

### Escala Jerárquica
- **H1 (Título de App):** `1.55rem` (24.8px) / `font-weight: 700` / `letter-spacing: -0.02em`
- **H2 (Sección / Modal):** `1.4rem` (22.4px) / `font-weight: 700`
- **H3 (Nombre de Técnica):** `0.98rem` (15.68px) / `font-weight: 600`
- **Cuerpo General:** `15px` / `line-height: 1.6`
- **Etiquetas y Código:** `12px` – `13px` / `piso mínimo legal cumplido`

## Layout & Materials

- **Superficies Planas:** Ausencia de degradados ruidosos, sombras neón o resplandores artificiales.
- **Divisores Limpios:** La lista lateral utiliza separadores horizontales de 1px (`#E2E8F0`) en lugar de tarjetas anidadas.
- **Viewport de Pantalla:** Marco de cámara con bordes redondeados (`12px`) y barra de telemetría inferior acoplada con fondo translúcido blanco.
- **Botones Tipo Pill / Outline:** Botones de prueba sobrios con bordes finos y cambios sutiles de fondo en hover.

## Motion & Micro-interacciones

- **Transiciones:** Curva exponencial limpia `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Duración:** `150ms` para estados interactivos, `300ms` para la aparición de la alerta de jutsu.
