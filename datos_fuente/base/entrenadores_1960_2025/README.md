# Entrenadores de inicio, 1960–2025

Entrega parcial de datos. Fecha de consulta: 13 de noviembre de 2026. **8.942 de 10.320 clubes-temporada documentados (86,65 %)**. Quedan **1.378 huecos** y **95 entradas con nacionalidad o nacimiento incompletos**. No es una base histórica completa ni una entrega lista para publicar: hay bloqueos del cargador que requieren la intervención de Claude.

## Cobertura por país y década

Cada celda muestra **con entrenador / clubes-temporada de referencia**; los años son los de inicio de la temporada. 2020–25 tiene seis años.

| País | 1960–69 | 1970–79 | 1980–89 | 1990–99 | 2000–09 | 2010–19 | 2020–25 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Alemania | 313/344 | 180/180 | 180/180 | 182/182 | 180/180 | 180/180 | 108/108 | 1323/1354 |
| Argentina | 93/181 | 119/197 | 95/194 | 122/199 | 190/198 | 237/238 | 136/140 | 992/1347 |
| Brasil | 61/257 | 66/206 | 64/194 | 68/206 | 104/216 | 128/200 | 88/120 | 579/1399 |
| España | 160/160 | 178/178 | 186/186 | 204/204 | 200/200 | 200/200 | 120/120 | 1248/1248 |
| Francia | 191/192 | 200/200 | 200/200 | 194/194 | 196/196 | 200/200 | 114/114 | 1295/1296 |
| Inglaterra | 220/220 | 220/220 | 216/216 | 208/208 | 200/200 | 200/200 | 120/120 | 1384/1384 |
| Italia | 174/174 | 160/160 | 164/164 | 180/180 | 192/192 | 200/200 | 120/120 | 1190/1190 |
| Portugal | 73/140 | 85/158 | 140/170 | 182/182 | 172/172 | 171/172 | 108/108 | 931/1102 |

El universo inicial son las 10.266 combinaciones distintas de país, club y temporada de Primera presentes en `ligas.csv`, sin las filas con nota. Se añaden los **54 participantes reales de 2025–26 de Alemania, Francia y Portugal**: esas tres ligas faltan en el CSV del juego, pero sí existen en las fuentes. Sus primeros partidos y participantes están en [objetivos_fuera_ligas.csv](objetivos_fuera_ligas.csv). No se modifican las ligas ni sus resultados. En Alemania, 1960–62 incluye las Oberligas que el juego representa como Primera.

Argentina no tiene filas de Primera de inicio 2020 en `ligas.csv`. Esa ausencia no se presenta como cobertura completa: haría falta definir cómo representar en la partida la temporada y la Copa Diego Armando Maradona de ese año. No se inventan participantes ni una liga en el archivo de entrenadores.

## Archivos y reproducción

- [inicios.csv](inicios.csv): una fila por club-temporada incorporada, con identidad del entrenador, nacimiento si consta, fecha de referencia, criterio, período publicado y enlaces.
- [huecos.csv](huecos.csv) y [huecos_por_club.md](huecos_por_club.md): los 1.378 pendientes, con años, motivo y fuentes intentadas. Brasil: 820; Argentina: 355; Portugal: 171; Alemania: 31; Francia: 1.
- [metadatos_pendientes.csv](metadatos_pendientes.csv): las 95 asignaciones documentadas cuyos datos personales siguen incompletos. Un vacío significa «sin dato corroborado», no una nacionalidad deducida del club.
- [candidatos_sin_inicio_verificado.csv](candidatos_sin_inicio_verificado.csv): 336 candidatos brasileños apartados. No se montan ni se cuentan como cobertura; una coincidencia en enero o el primer nombre de una lista anual no prueba por sí sola quién abrió la edición.
- [clubes_fuente.csv](clubes_fuente.csv): equivalencias e identificadores del proveedor, incluidas las variantes históricas de clubes homónimos. Un identificador no asegura cobertura de todos sus años; cada asignación efectiva está en `inicios.csv`.
- [rasgos.csv](rasgos.csv): estilos y exigencia física documentados, con su justificación. Solo se aplican a los clubes y períodos indicados. No se extrapola el estilo de 1958 a toda una carrera. El criterio de sentar a quien no rinde queda vacío en los datos nuevos cuando no hay evidencia.
- [cobertura.csv](cobertura.csv): la tabla anterior en formato reutilizable.
- [bloqueos_integracion.csv](bloqueos_integracion.csv): los datos de los dos Arsenal que el cargador todavía confunde.

Desde la raíz del repositorio:

```sh
python3 herramientas/entrenadores.py --montar
python3 herramientas/base.py
python3 herramientas/entrenadores.py
node pruebas/auditoria.js
node pruebas/famosos.js
node pruebas/partida.js 2000 12 7
```

`--montar` usa únicamente estos CSV, sin red ni dependencias nuevas. Conserva los registros anteriores fuera del ámbito del encargo, incluidos los relevos de 1958–59; sustituye las asignaciones de Primera comprendidas en el encargo y agrupa años consecutivos con el mismo entrenador y metadatos. Es idempotente. Los intervalos de `entrenadores.csv` indican **temporadas que empiezan con ese entrenador**, no una afirmación de empleo ininterrumpido entre dos fechas diarias. La evidencia de cada año permanece en `inicios.csv`.

La comprobación valida el reparto completo entre inicios y huecos, duplicados, clubes presentes en la base, enlaces, edades plausibles, nombres y nacimientos de `MAESTROS`, ausencia de `fijo` en los datos nuevos y traslado de los campos al archivo compilado. Los datos nuevos no programan ceses ni fuerzan nombramientos en veranos posteriores: las carreras durante la partida siguen en manos del motor.

## Cómo se elige al entrenador inicial

La fuente principal son los historiales de técnicos de [WorldFootball](https://www.worldfootball.net/), consultados a través de su proveedor público HS Data. Se cruza cada período con el primer partido de la edición cuando está disponible. Cuando dos técnicos comparten el mes, se consulta la alineación de ese primer partido; si la fuente no resuelve la identidad, queda un hueco. Se excluyen las secciones de asistentes, preparadores y categorías inferiores. Cuando el proveedor también mezcla funciones dentro de «Manager», se exige una selección unívoca o una cronología alternativa.

No todas las filas tienen la misma precisión. **El campo `criterio` es parte de la evidencia**, y evita presentar una aproximación temporal como una fecha comprobada:

| Criterio | Clubes-temporada |
|---|---:|
| historial y primer partido de liga | 7567 |
| historial y apertura general estatal; no consta la primera fecha del club | 352 |
| historial y apertura general de la liga; no consta la primera fecha del club | 268 |
| técnico de la alineación del primer partido de liga | 232 |
| primer técnico del año en cronología anual; sin atribuir fecha diaria | 132 |
| historial: mismo técnico todo el año | 98 |
| intervalo de la cronología que cubre el inicio; precisión conservada | 97 |
| BDFutbol: técnico con jornada 1 en la tabla de entrenadores | 54 |
| historial y primer partido del club en RSSSF | 44 |
| historial y apertura general nacional, anterior al estatal; no consta la primera fecha del club | 42 |
| historial: mismo técnico durante julio-octubre | 39 |
| historial: mismo técnico durante enero-abril; apertura estatal preliminar del año anterior | 7 |
| intervalo Wikidata, respetando la precisión de sus fechas | 6 |
| ficha de temporada o primer partido contrastado individualmente | 4 |

Las fechas de los historiales principales tienen precisión mensual. «Historial y primer partido» significa que en el mes del estreno consta un único técnico, no que se haya obtenido su contrato con precisión diaria. Las filas «alineación del primer partido» sí proceden de la ficha de ese encuentro. En 132 casos argentinos antiguos la evidencia es una cronología anual ordenada: se conserva el primer técnico publicado para ese año, sin convertirlo en un nombramiento de 1 de enero. Esos casos pueden requerir contraste adicional si aparece una fecha de apertura o de cese más precisa.

Cuando únicamente se conoce la apertura general del campeonato, el archivo lo indica y conserva el enlace; no la presenta como el primer partido concreto del club. En otros casos solo se acepta al técnico que cubre íntegramente el año, o la ventana de apertura julio–octubre en Europa. Los días y meses desconocidos permanecen vacíos.

**Brasil:** antes de 1971 se usa el campeonato regional que figura en la partida, con primeras fechas del club cuando se pueden leer en RSSSF. Después se contrasta el comienzo estatal y el nacional conocido, usando el anterior; sin fecha estatal fiable solo se incorporan períodos suficientemente documentados. Se respeta el año real cuando una fase preliminar empieza en diciembre del año anterior. Los siete casos sin fecha individual que proceden de esas preliminares exigen un mismo técnico durante enero–abril y están identificados como tales. En 2021 se distingue la edición de 2020 que acabó tarde de la campaña de 2021. Por ejemplo, São Paulo 2021 queda con Hernán Crespo, no con Fernando Diniz; Santos 2021 permanece pendiente en vez de asignarle automáticamente a Cuca por estar allí en enero.

Otros contrastes: [BDFutbol](https://www.bdfutbol.com/) para el entrenador con jornada 1, cronologías de clubes y sus anexos en Wikipedia, [RSSSF Brasil](https://www.rsssfbrasil.com/), y seis intervalos de Wikidata con precisión conservada e identidad de técnico de fútbol corroborada. Los enlaces biográficos pueden proceder del propio historial: no significan que se haya leído individualmente cada ficha. Los datos nunca se deducen de la nacionalidad de la liga.

Se distingue FC Nancy de AS Nancy, Toulouse histórico del actual, Troyes AF del actual, Freiburger FC de SC Freiburg, Caxias RS de Caxias SC y Belenenses de B-SAD desde 2018. El nacimiento de Béla Guttmann se contrasta como **1899** con [Connecting Portuguese History](https://connectingportuguesehistory.org/items/show/39), corrigiendo el 1900 del proveedor y coincidiendo con `MAESTROS`.

## Bloqueos que debe resolver Claude

1. **Arsenal de Inglaterra y Arsenal de Argentina.** `mundo.js`, en `desdeBase`, selecciona técnicos solo con `t.club === nombre`, sin país. `base.py` conserva ahora `pais` además de la nacionalidad del entrenador, pero el consumidor todavía no lo usa. En 2015, `Mundo.desdeBase(BASE, 2015)` entrega **«Martín Palermo / Arsène Wenger» a ambos Arsenal**. Son dos asignaciones de datos correctas, pero una integración incorrecta: no se debe publicar este PR sin que el cargador reciba y compare el país de la liga al construir cada club. `BASE.clubes['Arsenal'].pais` tampoco sirve para resolverlo, porque ese diccionario ya tiene una única entrada para ambos clubes. Las 86 entradas de los dos Arsenal están separadas en el archivo de bloqueos.
2. **Tres ligas de 2025–26 ausentes.** Se entregan sus 54 entrenadores y participantes reales en el CSV adicional; la pantalla no podrá usarlos hasta que se incorporen las ligas de Alemania, Francia y Portugal a los datos de competiciones. No se tocan esos archivos en esta entrega.
3. **Paris FC en 1966.** El club fue fundado en 1969. La fila de la liga del juego requiere revisar su identidad. Se deja sin entrenador en vez de sustituirlo silenciosamente por Racing de París.
4. **Datos históricos pendientes.** Los 1.378 huecos están listados por club y año; no se rellenan copiando al último entrenador conocido. En Argentina también queda sin identificación unívoca «San Luis». Algunas filas antiguas de Italia representan clubes que en el año de inicio indicado estaban en Serie B: se conserva el año del juego y se documenta el entrenador de ese club en ese año, sin corregir las ligas fuera de este encargo.

La ampliación de entrenadores puede cambiar resultados al rehacer una partida con la misma semilla. No se modifica ningún archivo `js/` ni la versión de guardado. La coordinación de esa versión antes de publicar corresponde a Claude, junto con la corrección de Arsenal.

## Validación

Los resultados exactos de la entrega están en [validacion.md](validacion.md). Además de las tres pruebas pedidas, se comprueba que el JSON de la base solo cambia en `entrenadores`, que las temporadas anteriores ajenas al encargo permanecen idénticas y que el montaje se puede repetir sin cambios.
