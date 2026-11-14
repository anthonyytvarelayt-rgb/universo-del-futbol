# Fotos compatibles y ligadas a la partida que las pidió

La copia rápida del mundo en IndexedDB no llevaba versión. Al recuperar la partida se validaban semilla, número, año y posición, pero se podía aceptar una foto de una versión anterior. Además, esos datos se leían de variables globales cuando terminaba de abrirse IndexedDB: cambiar de partida durante la espera podía etiquetar una foto con otra identidad.

Se añade la versión a la foto, se comprueba antes de restaurarla y se captura su identidad al solicitar el guardado. Las fotos antiguas sin versión se descartan; la partida se reconstruye con la semilla y la posición guardadas, usando la recuperación que ya existía. Los metadatos de la partida no se borran.

La versión se centraliza en `VERSION_GUARDADO`. Esta entrega conserva la 82 de `main` en `d8996f8`, pues no cambia el motor ni los resultados. Al fusionar otra modificación que cambie resultados se incrementará esa única constante. El PR de penaltis #14 propone la 83: al combinar ambas entregas se debe conservar 83.

## Reproducción y prueba

`node pruebas/fotos-guardado.cjs /tmp/fotos-guardado` inicia una partida desde 2000, alcanza una foto de 2001 y comprueba:

1. Una foto de versión distinta no se utiliza.
2. Una foto sin versión no se utiliza.
3. Una foto compatible sí se utiliza, para evitar que la prueba pase simplemente desactivando la caché.
4. En los tres casos se conservan campeones, tabla, clubes, niveles, contratos y caja tras recuperar la partida.
5. Una apertura diferida de IndexedDB conserva semilla, número de partida y año de la solicitud original.

El mundo permanece dentro de IndexedDB durante la prueba, conservando sus Map y Set. Una marca de prueba permite comprobar si se utilizó la foto; no modifica atributos ni resultados.

Antes del cambio fallan las comprobaciones de foto incompatible, foto sin versión e identidad. Después pasan las siete comprobaciones, sin errores JavaScript. Los informes originales están en `antes.json` y `despues.json`. La prueba final se repitió tras actualizar la rama a `d8996f8` y versión 82.

Requiere Playwright y Chromium en el entorno de pruebas; no instala dependencias en el juego. La sintaxis de `js/app.js` también se comprobó con Node.
