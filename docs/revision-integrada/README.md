# Revisión de contratos y tácticas integradas

Base del juego: `5ea74fe`, posterior a la fusión de los sueldos y a la incorporación de dibujos tácticos. Se añaden pruebas y evidencias; no se modifica código del juego, datos ni versión de guardado. Coordinación con Claude en la [incidencia #12](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/issues/12).

## Lo comprobado

| Inicio | Temporadas | Semilla | Comprobaciones | Contratos seguidos | Cesiones / regresos | Nóminas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1958 | 12 | 5 | 357899 | 87174 | 586 / 511 | 4583 |
| 1980 | 12 | 9 | 206214 | 48832 | 376 / 341 | 2830 |
| 2000 | 12 | 7 | 265369 | 62602 | 490 / 437 | 2775 |
| 2025 | 20 | 11 | 226573 | 54343 | 19 / 18 | 3280 |

La tabla se acompaña de los JSON originales en `resultados/`. Sus contadores son observaciones, no estimaciones de cobertura total del juego.

En estas 56 temporadas no se detectó cambio de un contrato vigente sin una firma, nómina distinta de los contratos al empezar, contrato inválido, retirado reincorporado, jugador duplicado en plantillas, caja no finita ni gasto negativo. Tampoco hubo refinanciaciones de ningún club, incluidas divisiones inferiores. Los ajustes por perder Europa se comprobaron contra la participación efectiva de la temporada siguiente. La última temporada de cada partida no tiene una temporada siguiente para contrastar ese punto.

`pruebas/contratos-partida.js` usa el mismo avance y las mismas semillas que `Mundo.partida`; no añade sorteos al juego. El cierre de nóminas se contrasta con una captura anterior al verano, para incluir a quienes se retiran. El control de contrato admite fichajes, incorporaciones como libre, vencimientos y mejoras pactadas; los demás movimientos conservan los términos anteriores.

Se comprobaron también la auditoría general (`todo bien`) y los 113 famosos (`113 bien`).

## Navegador

`pruebas/navegador-contratos.cjs` abre su propio servidor local y juega dos temporadas desde 1958 y dos desde 2000. Comprueba que:

- Fichas, noticias y declaraciones no cambian contratos, caja ni resultados al consultarlas.
- El guardado reconstruye los mismos contratos, caja, hechos salariales y campeones.
- La temporada espera al botón.
- La ficha funciona a 390 px sin desbordamiento horizontal.

Esta ejecución terminó sin errores JavaScript ni solicitudes fallidas. Chromium se configura para aceptar el certificado del entorno de pruebas; ese ajuste no cambia la web. Hay capturas reales de escritorio y móvil y un informe JSON.

Requiere Playwright y Chromium disponibles en el entorno de pruebas. No instala dependencias en el juego:

```sh
node pruebas/navegador-contratos.cjs /tmp/contratos-navegador
```

## Hallazgo reproducido: dibujos fuera de su intervalo

`node pruebas/dibujos-epoca.js` comprueba 1100 elecciones sobre plantillas equilibradas. **Falla actualmente en 42 elecciones**: el 4-4-2 aparece antes de 1964 y el 4-2-4 después de 1978, contraviniendo los límites del propio catálogo `DIBUJOS`. No se presenta ese catálogo como una afirmación histórica sobre la invención de los sistemas.

También se reprodujo con plantillas reales: en 1962, 22 clubes de Primera eligen 4-4-2, entre ellos Venezia, Burnley, Nottingham Forest y Blackpool. Las opciones de época no se filtran por `desde/hasta`; validar solo el favorito del técnico no evita la selección posterior de una opción inválida.

La reproducción queda como comando independiente y no se añade a la auditoría general mientras el fallo siga abierto. Claude tiene la explicación y los ejemplos en #12. Este PR no modifica el motor ni pretende resolver el fallo.

## Segundo hallazgo al ampliar la semilla

La primera prueba del barrido (`1958`, doce temporadas, semilla `1`) detectó un retirado que vuelve a una plantilla: **Rafael Santos, 1942-06-17**, aparece como activo desde el cierre de 1962-63 aunque ya figuraba entre los retirados al empezar esa temporada. La misma identidad sigue activa en años siguientes. No apareció en la muestra inicial de 56 temporadas.

Reproducción:

```sh
node pruebas/contratos-partida.js 1958 12 1 /tmp/retirado.json
```

El comando debe salir con error mientras se mantenga el fallo. El informe completo queda en `resultados/1958-semilla-1.json`. Se comunicó a Claude en #12; este PR incorpora la detección, no una corrección del mercado.

## Barrido automático

`pruebas/barrido-contratos.cjs` permite ampliar la muestra sin tocar el mundo ni consumir llamadas al modelo. Cada partida utiliza una época y semilla distintas, con doce temporadas. Conserva informes por partida, un resumen JSON y un resumen Markdown. Se limita a dos formas de ejecución:

```sh
# Una pasada de ocho épocas, semilla 1; sin publicar en GitHub:
node pruebas/barrido-contratos.cjs /tmp/barrido

# Empezar nuevas partidas hasta la fecha indicada; la última termina antes de cerrar:
node pruebas/barrido-contratos.cjs /tmp/barrido 2026-11-14T11:00:00Z
```

Un tercer argumento opcional, número de incidencia, publica allí el resultado final usando la autenticación de `gh`. Los fallos nuevos generan como máximo cinco avisos diferenciados. Anthony ha autorizado la coordinación en GitHub; el barrido de esta sesión utiliza #12. No hace commits, no fusiona ramas, no despliega cambios y mantiene fija la revisión inicial para que los casos sean reproducibles.

El límite previsto para esta sesión es el 14 de noviembre a las 05:00 de America/Chicago (11:00 UTC). La ejecución automática depende de que el entorno permanezca disponible. Sus resultados posteriores aún no forman parte de las 56 temporadas verificadas de este informe.
