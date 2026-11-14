# El palco: rediseño de Universo del fútbol

La partida gana una entrada propia, una noticia protagonista junto al marcador y fichas con jerarquía de cartas. Todo sigue en español y el calendario conserva sus controles manuales.

## Revisión antes de cambiar código

Se jugó una temporada completa en ordenador (1440 × 1000, 1958) y móvil (390 × 844, 2000). Las capturas de `antes/` registran esta revisión. Los problemas principales eran una portada poco expresiva, titulares comprimidos en mayúsculas, exceso de cajas de peso similar, navegación muy ancha y poco espacio para distinguir atributos, noticias y marcadores. La revisión no encontró errores de consola ni desbordamientos en esos dos recorridos previos.

## Criterio visual

- Inicio con ilustración original de estadio y balón (`css/estadio.svg`), época visible y continuar partida destacado. Las épocas disponibles aparecen primero.
- Noticia principal junto a un marcador con escudos; en pretemporada aparecen los próximos encuentros. Noticias secundarias más compactas.
- Navegación lateral reducida en ordenador, controles de tiempo en la cabecera desde 1200 px y barra inferior en móvil.
- Una escala tipográfica con Outfit para títulos, Barlow para lectura y Barlow Condensed para cifras; colores de ERAS, superficies oscuras e iluminación marfil en tema claro.
- Tablas, atributos, palmarés y grandes momentos con una jerarquía común. Las fichas conservan sus acciones y contenido.
- Foco de teclado visible y transiciones desactivadas con `prefers-reduced-motion`.

Sin compilación ni paquetes nuevos. Outfit se carga desde el proveedor de fuentes ya utilizado, con alternativas locales. El estadio es un SVG propio, sin peticiones a servicios de imágenes.

## Capturas comparativas

| Pantalla | Ordenador antes | Ordenador después | Móvil antes | Móvil después |
| --- | --- | --- | --- | --- |
| Inicio | [Antes](antes/ordenador-inicio.jpg) | [Después](despues/ordenador-inicio.jpg) | [Antes](antes/movil-inicio.jpg) | [Después](despues/movil-inicio.jpg) |
| Hoy | [Antes](antes/ordenador-hoy.jpg) | [Después](despues/ordenador-hoy.jpg) | [Antes](antes/movil-hoy.jpg) | [Después](despues/movil-hoy.jpg) |
| Competiciones | [Antes](antes/ordenador-competiciones.jpg) | [Después](despues/ordenador-competiciones.jpg) | [Antes](antes/movil-competiciones.jpg) | [Después](despues/movil-competiciones.jpg) |
| Jugador | [Antes](antes/ordenador-jugador.jpg) | [Después](despues/ordenador-jugador.jpg) | [Antes](antes/movil-jugador.jpg) | [Después](despues/movil-jugador.jpg) |
| Club | [Antes](antes/ordenador-club.jpg) | [Después](despues/ordenador-club.jpg) | [Antes](antes/movil-club.jpg) | [Después](despues/movil-club.jpg) |
| Historia | [Antes](antes/ordenador-historia.jpg) | [Después](despues/ordenador-historia.jpg) | [Antes](antes/movil-historia.jpg) | [Después](despues/movil-historia.jpg) |
| Fin de temporada | [Antes](antes/ordenador-fin.jpg) | [Después](despues/ordenador-fin.jpg) | [Antes](antes/movil-fin.jpg) | [Después](despues/movil-fin.jpg) |

También se incluyen [tema claro en ordenador](despues/ordenador-claro.jpg), [tema claro en móvil](despues/movil-claro.jpg), [continuar partida](despues/ordenador-continuar.jpg) y [pretemporada](despues/ordenador-pretemporada.jpg).

## Comprobaciones

- `node --check js/app.js`: correcto.
- `node pruebas/auditoria.js`: **todo bien**, salida en [auditoria.txt](auditoria.txt).
- Navegador Chromium: dos temporadas desde 1958 y dos desde 2000; 289 vistas de competiciones, fichas de jugador y club, seguimiento, comparación, Historia, guardado y recuperación. Sin errores de consola ni desbordamientos en el recorrido. Se comprobó que la temporada no avanzaba sin pulsar un control. [Registro](navegador.txt).
- Mismos cierres de primera temporada antes y después con semilla 7: Barcelona / Real Madrid (1958), Barcelona / Juventus (2000). Los estados registrados coinciden exactamente. [Antes](antes/comprobacion.json) · [Después](despues/comprobacion.json).
- 50 vistas en 10 anchuras, de 320 a 1920 px: sin desbordamientos ni controles de cabecera solapados. [Detalle](responsivo.json).
- 49 pares de colores principales en seis épocas y ambos temas: contraste mínimo **5,01:1**. Esta medición cubre los pares documentados, no certifica cada píxel de la interfaz. [Detalle](contraste.json).
- Movimiento reducido: duración de animación calculada de 0 s.

El recorrido se puede reproducir con `node docs/diseno-partida/verificar.cjs despues` en un entorno que disponga de Playwright y Chromium (`/usr/bin/chromium`). No son dependencias del juego. Sobrescribe las capturas y el JSON de después.

La comparación usa la base congelada `3ab4fc2`. El cambio paralelo de Claude para las finales del Madrid (`450d462`) no está incluido en estas mediciones. Solo cambian CSS, el SVG, HTML y las funciones de presentación `pintarInicio`, `pintarHoy` y `pintarMandos`. No cambian el motor, los datos, los resultados ni la versión de guardado de esta base (84).
