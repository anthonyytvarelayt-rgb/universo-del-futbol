# Todos los presentes participan en la tanda

Base actualizada: `d8996f8`, versión de guardado 82. Se propone versión 83 porque pueden cambiar tandas largas y los resultados posteriores.

La selección de lanzadores eliminaba al portero. Con once jugadores presentes, los diez de campo repetían en el undécimo lanzamiento sin que hubiera tirado el portero. La corrección incluye a todos los presentes en la ordenación existente por nivel, puesto y definición. Se copia el array para conservar el orden del once. No incorpora suplentes ni jugadores que hayan abandonado el campo.

La prueba fuerza una tanda larga en la que todos aciertan, registra quién lanza y comprueba que los once participantes tiren antes de repetir. Se repite con siete jugadores y con un único portero como caso límite de la función pública. La prueba falla antes del cambio (`10 !== 11`) y pasa después. Se incorpora a la auditoría general.

Referencia de la regla de turnos: [IFAB, regla 10, tanda de penaltis](https://www.theifab.com/laws/latest/determining-the-outcome-of-a-match/). Esta entrega se limita a la participación del portero; la igualación de efectivos requiere una revisión aparte que respete las reglas de cada época.

## Comprobación

- Sintaxis de `motor.js` y `app.js`: bien.
- `node pruebas/penaltis-turnos.js`: bien.
- `node pruebas/auditoria.js`: todo bien.
- `node pruebas/famosos.js`: 113/113.
- `node pruebas/partida.js 1958 12 5`: termina; seis ligas Barcelona, tres Real Madrid y tres Bilbao. Ocho campeones europeos distintos.
- `node pruebas/partida.js 2000 12 7`: termina; siete ligas Barcelona y cinco Real Madrid. Cuatro campeones europeos distintos.
- Navegador: dos temporadas desde 1958 y dos desde 2000, sin errores JS/red. Misma reconstrucción del guardado y controles manuales. Informe en `navegador.json`. La comprobación de la tanda se realiza en la prueba dirigida; no se presenta la navegación como una reproducción visual de una tanda de once lanzamientos.

El antiguo bloqueo del barrido 1970/12/27 era diferente: llegaba un equipo con cero jugadores a la tanda. Esa partida ya termina en `bf22a8f`; esta modificación no pretende resolver los equipos vacíos.

Coordinación con Claude: [#12](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/issues/12). Sin modificaciones de datos ni de `mundo.js`.
