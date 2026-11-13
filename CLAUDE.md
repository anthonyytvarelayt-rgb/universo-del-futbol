# Universo del fútbol: reglas para trabajar aquí

Anthony es el dueño. Habla español y no programa: explícale todo en español, sin jerga, y entrégale siempre algo que funcione al abrir el enlace.

## Reglas del juego que no se tocan

- Jugadores reales siempre. El relleno solo donde no hay datos, marcado con asterisco, y nunca en un club grande.
- Pelé, Messi y Cristiano son el nivel 1000 (escala visible 1-1000; el motor usa una escala interna hasta 1180, ver `Motor.escala`).
- Las carreras las decide el motor, salvo las `CONSTANTES` de `js/mundo.js`.
- La temporada nunca pasa sola a la siguiente: hace falta que el jugador pulse el botón.
- Lo real no se pone al lado del resultado: una marca ≠ pequeña que al tocarla dice qué pasó de verdad.
- No hay edad tope de retiro.

Plan de etapas y reparto con otras IA: ver `PLAN.md`.

## Código

- Sitio de archivos sueltos, sin compilación. `index.html` carga `js/*.js` y `datos/*.js` con etiquetas `<script>`; el simulador corre en un Worker que importa esos mismos archivos por su dirección (ver `crearSimulador` en `js/app.js`).
- `datos/base.js` lo monta `herramientas/base.py`. No se edita a mano.
- Atributos: `datos/atributos.js` lo monta `herramientas/atributos.py` desde `datos_fuente/base/atributos.csv` (figuras a mano). El resto los calcula `formaDe` en `js/motor.js`. Los atributos son la forma del nivel: no suben ni bajan el nivel total.
- Canteras y maestros reales: `datos/canteras.js` lo monta `herramientas/canteras.py` desde `datos_fuente/base/canteras.csv` y `maestros_entrenadores.csv`. Solo se enseñan (fichas e historias); no cambian resultados.
- Promesa de minutos: `nuevasPromesas` y `resolverPromesas` en `js/mundo.js` (estado en `M.promesas` y `j.promesas`); los textos salen de `promesasDe` en `js/app.js`. Los minutos se cuentan en `jugarConEstado` de `js/motor.js` (`min`, `tit`, `baja`).
- La partida guardada es semilla + posición y se rehace al abrir. Si un cambio altera los resultados del motor, sube `version` en `guardar` y en la lectura de `js/app.js`.
- Antes de subir un cambio del motor: `node pruebas/partida.js <año> <temporadas> <semilla>` desde al menos dos épocas, y abrir la página en un navegador.
