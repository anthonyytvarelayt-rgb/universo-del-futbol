# Repetición de fallos y conservación de informes parciales

El barrido nocturno sobre `cbf3627` hizo **319 intentos**, de los que **318 terminaron las doce temporadas**. Registró 3816 temporadas completas en los JSON. Cincuenta partidas terminadas señalaron reapariciones o identidades duplicadas y otra se interrumpió sin generar JSON. El resumen anterior llamaba erróneamente «partidas terminadas» a los 319 intentos.

La interrupción fue `1970`, semilla `27`, en la temporada 1979-80: la Supercopa portuguesa enfrentó a Benfica (18 jugadores en plantilla) y Belenenses (0). La tanda recibió un once vacío y lanzó `TypeError` al calcular el nivel de un lanzador inexistente. Este caso ya termina en `bf22a8f`; no se presenta como un bloqueo vigente.

Claude corrigió las reapariciones y las identidades repetidas en la versión 75 y validó tres semillas. Esta revisión repite sobre **`bf22a8f`** todos los 51 intentos que habían salido con error, incluido el que se interrumpió. La base del juego se mantiene fija durante la repetición para no mezclar revisiones.

## Cambios del comprobador

- `contratos-partida.js` guarda el progreso al terminar cada temporada. Si aparece una excepción, conserva ese progreso y la traza y sale con error.
- El barrido distingue intentos, partidas completas y partidas interrumpidas. Un fallo sin JSON no cuenta como partida completa.
- Elimina el JSON anterior de un caso antes de repetirlo, para que una interrupción no se confunda con un éxito antiguo. Conserva el código de salida, la señal y el final del log cuando no hay informe.
- `--casos=archivo.json` permite repetir solo los casos fallidos de un informe anterior. Valida que año y semilla sean enteros antes de crear rutas. Se respeta la fecha límite si se proporciona además de la lista de casos.
- Los avisos deduplican los tipos de fallo sin depender de su orden.

Reproducción de la repetición:

```sh
node pruebas/barrido-contratos.cjs /tmp/repeticion --casos=/ruta/al/resumen-anterior.json
```

## Pruebas de resistencia

`node pruebas/barrido-resistencia.js`, incorporada a `auditoria.js`, comprueba con fallos controlados:

1. Se rechaza un año que contiene una ruta antes de crear archivos.
2. Un hijo que termina sin JSON se registra como interrupción y conserva el mensaje del log.
3. Un JSON antiguo de éxito no se utiliza como resultado de la nueva ejecución fallida.
4. Una excepción después de una temporada conserva esa temporada, sus comprobaciones y la traza.

La prueba pasa, igual que la auditoría completa. Las inyecciones actúan únicamente en procesos de prueba; no modifican los archivos ni funciones del juego publicado.

Esta entrega no cambia `js/`, datos ni versión de guardado. Los informes de la repetición se adjuntan al terminar todos los casos; sus resultados no se extrapolan a todas las semillas posibles.

## Resultado final

Los **51 casos pasan** en `bf22a8f`: **612 temporadas**, **15414064 comprobaciones**, **198861 nóminas**, **24437 cesiones** y **21740 regresos**. No hubo excepciones, incumplimientos de las invariantes ni refinanciaciones. Se incluye el caso 1970/12/27 que antes interrumpía el barrido.

El informe completo se conserva en `repeticion.json` y el resumen de cada caso en `casos.csv`. Esto confirma la corrección en las semillas antes fallidas; no equivale a repetir los otros 268 intentos del barrido original ni a validar todas las semillas futuras. Las modificaciones de `main` posteriores a `bf22a8f` no se mezclan con esta medición.
