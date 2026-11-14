# Porteros reales al iniciar 2025: datos contrastados para integración

Revisión de `bf22a8f`, 14 de noviembre de 2026. Estos archivos son propuestas de datos con fuentes leídas; no los carga el montador actual. La integración debe resolver las identidades y los tramos existentes antes de volver a generar la base.

- `carreras_confirmadas.csv`: **6 filas** de jugadores que ya existen en la base. Nombres y nacimientos coinciden exactamente; también los nombres de club. Acreditan presencia en el club durante 2025. `hasta=2025` delimita la cobertura revisada, **no afirma una retirada ni salida en 2025**. Partidos, goles y nivel quedan vacíos: no se trasladan estadísticas acumuladas en 2026 a la temporada de 2025.
- `faltan_en_la_base.csv`: **7 jugadores** ausentes, comprobados por nombre, fecha y búsqueda de las otras identidades de esa fecha. Las fuentes dan sus nombres, nacimientos, posición y club. `desde` es la fecha del vínculo recogida por la ficha; para una carrera completa habrá que añadir los préstamos y pasos intermedios. Por ejemplo, Moritz Nicolas tiene varios préstamos entre 2019 y 2023.
- `discrepancias_goles.csv`: **1 discrepancia contrastada**, sin aplicar una corrección. Wikidata y el volcado local atribuyen a Ivan Provedel 21 goles en 21 partidos con Modena; la ficha de Wikipedia registra 21 partidos y 0 goles para ese paso. La cifra sospechosa ya está en Wikidata: no la produjo una pérdida del signo al importar.

## Dos causas distintas

Manuel Neuer sí está en la base como portero y con su paso por Bayern desde 2011, abierto. La interpretación del último paso sin final lo corta al alcanzar 36 años: `1986+36=2022`. Por eso no aparece al empezar 2025. La ficha oficial del Bayern da fecha de firma 1 de julio de 2011 y contrato hasta 30 de junio de 2027; su biografía mantiene el vínculo desde 2011. La fuente no respalda cortar su presencia en 2022.

Sven Ulreich tiene su regreso al Bayern en 2021, pero la base lo termina en 2024. La fuente revisada mantiene su segundo paso desde 2021. Ivan Provedel, Dominik Greif, Michael Zetterer y Timo Horn tienen carreras incompletas: faltan los pasos de club indicados en el CSV.

La integración de los seis pasos existentes y de los siete jugadores ausentes permitiría cubrir porteros reales en Bayern, Lazio, Como, Pisa, Lille, Lyon, Friburgo, Eintracht, Mönchengladbach, Bochum y Angers. Esa cobertura aún no se presenta como implementada ni medida: hay que montar los datos y repetir el inventario.

## Fuentes consultadas

La ficha oficial del Bayern para Neuer y las fichas de Wikipedia enlazadas en cada fila. Se leyeron sus tablas de carrera y nacimientos. Para Provedel se contrastó también el JSON de Wikidata (`Special:EntityData/Q18600395.json`) y el volcado bruto `jug/lote091.csv`.

No se han completado los demás porteros y clubes sin información. Tampoco se han cambiado los 601 tramos de porteros que el inventario señaló por una tasa de goles anómala: esa señal es una prioridad de revisión y no prueba que las 601 filas sean erróneas.

La prueba `python3 herramientas/revisar_porteros_2025.py` validó las seis identidades y siete ausencias y aplicó los seis pasos a una copia en memoria: Bayern pasa de cero a dos porteros reales; Lazio, Lyon, Eintracht y Bochum pasan de cero a uno. El efecto medido está en `docs/cobertura-inicios/impacto-propuestas.json`. No se guardó esa copia como base del juego.

## Integrado (14 de noviembre de 2026, Claude)

Las seis carreras y los siete ausentes ya están en `datos_fuente/expansion/wikidata/` y en `datos/base.js`. Provedel en el Módena queda con 0 goles. `herramientas/base.py` cuenta además los clubes del último año conocido de cada país para los años siguientes (Francia no tiene aún la clasificación de 2025). `herramientas/revisar_porteros_2025.py` era la comprobación previa y ya no pasa, porque los ausentes están dentro.
