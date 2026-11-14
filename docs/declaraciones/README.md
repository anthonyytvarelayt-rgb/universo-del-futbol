# Declaraciones con contexto y voz para los entrenadores

## Problemas encontrados

El límite anterior de siete intervenciones se llenaba antes de llegar a los técnicos y a varias noticias relevantes. La selección dependía del orden de los bloques, sin reservar espacio por papel ni evitar que dos personas dijeran lo mismo. Algunas citas añadían hechos que el juego no sabía: sueños infantiles por un club, causas físicas de retirada o acusaciones del segundo del premio sin tener en cuenta su carácter.

También había noticias de entrenadores que daban por ciertas agresiones, protestas arbitrales o una guerra de vestuario únicamente por el tipo de técnico. El primer puesto de una regional alemana podía acabar convertido en una celebración de campeonato nacional. Al cambiar de entrenador, un jugador podía agradecer al nuevo la palabra que había dado el anterior.

## Cambios

- Hasta ocho voces, con espacio inicial para tres entrenadores cuando hay hechos y protagonistas suficientes. No se rellenan los huecos inventando noticias.
- Prioridad a retiradas, conflictos documentados y promesas; una intervención por persona y un máximo de dos por tema.
- Sin citas idénticas ni reutilización de una misma variante dentro del tema en la misma temporada. Las variantes rotan por año de forma estable; abrir de nuevo la pantalla no cambia las frases.
- Los entrenadores hablan de campeonatos registrados, resultados, ceses, dimisiones y compromisos de minutos. Su nombre abre la ficha de entrenador.
- El segundo del premio solo expresa un desacuerdo fuerte si su carácter lo permite. Los fichajes no afirman haber soñado desde niños con el destino; las retiradas no inventan causas médicas.
- La celebración nacional usa al campeón registrado, incluida la Taça Brasil cuando decide el título, y no el primer puesto de un grupo regional.
- Las noticias de técnicos dejan de inventar incidentes específicos por su carácter. La comparación entre dos estilos cuenta la clasificación, sin convertirla automáticamente en una pelea.
- Las noticias de promesas distinguen entre el técnico que prometió y el que dio los minutos.

Las frases siguen siendo simuladas con plantillas: no son un sistema de conversación libre ni tienen memoria nueva de declaraciones entre temporadas. El contexto y los protagonistas salen de los hechos ya guardados. No cambian el motor, los resultados, los datos ni la versión de guardado.

## Pruebas

`node --check js/app.js` y `node pruebas/declaraciones.js`: correctos. La prueba nueva está incluida en `node pruebas/auditoria.js` (todo bien). Comprueba reparto de voces, duplicados, estabilidad, rotación entre años, cambio de técnico, salidas, retiradas, personalidad del segundo, campeones regionales/nacionales y ausencia de incidentes inventados.

El recorrido real en Chromium termina 1958, 1959, 2000 y 2001, en ordenador y móvil. En cada temporada aparecen ocho voces, tres de entrenadores. Verifica nombres enlazados a fichas de técnico, ausencia de desbordamiento, estabilidad al recalcular las declaraciones y conservación de la semilla y de la posición de la partida. Sin errores JavaScript.

- [Registro de las declaraciones y comprobaciones](comprobacion.json)
- [1958 en ordenador](declaraciones-1958-0.jpg) · [1959 en ordenador](declaraciones-1958-1.jpg)
- [2000 en móvil](declaraciones-2000-0.jpg) · [2001 en móvil](declaraciones-2000-1.jpg)

Para repetirlo en un entorno con Playwright y Chromium: `node pruebas/navegador-declaraciones.cjs docs/declaraciones`.
