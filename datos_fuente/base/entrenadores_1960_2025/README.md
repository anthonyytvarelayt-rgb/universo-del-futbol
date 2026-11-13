# Entrenadores de inicio, 1960–2025

Datos todavía incompletos. Consulta: 13 de noviembre de 2026. **9.138 de 10.320 clubes-temporada documentados (88,55 %)**; **1.182 huecos** y **142 asignaciones con nacimiento o nacionalidad pendientes**. Una entrada documentada tiene fuente; no significa que todas las fuentes hayan sido verificadas individualmente ni que cada desacuerdo histórico esté resuelto.

Esta ampliación parte de `main` **ae33cb6**, que ya incluye la primera entrega del [PR #6](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/pull/6). Añade **201 inicios**, contrasta y corrige asignaciones anteriores y aparta **cinco perfiles de identidad o rol sin confirmar**. No cambia `js/`, ligas, jugadores ni la versión de guardado.

## Cobertura por país y década

Cada celda indica **con entrenador / clubes-temporada de referencia**. El año es el de inicio del curso; 2020–25 tiene seis años. **Portugal está cubierto desde 1970 y Brasil desde 2020** dentro del universo del archivo. La base histórica completa sigue pendiente.

| País | 1960–69 | 1970–79 | 1980–89 | 1990–99 | 2000–09 | 2010–19 | 2020–25 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Alemania | 320/344 | 180/180 | 180/180 | 182/182 | 180/180 | 180/180 | 108/108 | 1330/1354 |
| Argentina | 101/181 | 124/197 | 99/194 | 119/199 | 190/198 | 237/238 | 136/140 | 1006/1347 |
| Brasil | 61/257 | 66/206 | 64/194 | 68/206 | 104/216 | 128/200 | 120/120 | 611/1399 |
| España | 160/160 | 178/178 | 186/186 | 204/204 | 200/200 | 200/200 | 120/120 | 1248/1248 |
| Francia | 191/192 | 200/200 | 200/200 | 194/194 | 196/196 | 200/200 | 114/114 | 1295/1296 |
| Inglaterra | 220/220 | 220/220 | 216/216 | 208/208 | 200/200 | 200/200 | 120/120 | 1384/1384 |
| Italia | 174/174 | 160/160 | 164/164 | 180/180 | 192/192 | 200/200 | 120/120 | 1190/1190 |
| Portugal | 112/140 | 158/158 | 170/170 | 182/182 | 172/172 | 172/172 | 108/108 | 1074/1102 |

El universo son las **10.266** combinaciones distintas de país, club y temporada de Primera de `ligas.csv`, sin filas con nota, más los **54 participantes reales de 2025–26 de Alemania, Francia y Portugal**. Esas tres ligas faltan en el CSV del juego: sus entrenadores se preparan en los datos, pero la pantalla no podrá usarlos hasta que se incorporen las competiciones. [objetivos_fuera_ligas.csv](objetivos_fuera_ligas.csv) documenta los participantes y primeros partidos. No se añaden ligas ni resultados aquí.

Alemania 1960–62 incluye las Oberligas que representa el juego. Argentina no tiene filas de Primera de inicio 2020 en `ligas.csv`; no se cuenta esa ausencia como cobertura completa. Haría falta definir la representación de la liga y la Copa Diego Armando Maradona de ese año.

## Qué se entrega

- [inicios.csv](inicios.csv): identidad, país del entrenador si consta, nacimiento, criterio, período y fuentes de cada asignación.
- [huecos.csv](huecos.csv) y [huecos_por_club.md](huecos_por_club.md): **1.182 pendientes** con club, años, motivo y fuentes intentadas. Alemania: 24; Argentina: 341; Brasil: 788; Francia: 1; Portugal: 28.
- [cobertura.csv](cobertura.csv): tabla por país y década, regenerada por la comprobación.
- [cambios_respecto_main.csv](cambios_respecto_main.csv): **337 filas nuevas, retiradas o modificadas** respecto de ae33cb6, con nombres, nacimientos, nacionalidades y fuentes antes/después. Incluye 201 altas y 107 cambios de nombre, parte de ellos equivalencias de un mismo técnico.
- [asignaciones_retiradas_por_identidad.csv](asignaciones_retiradas_por_identidad.csv): cinco asignaciones argentinas de la entrega anterior que apuntaban a fichas de jugadores o técnicos de 19–21 años; se apartan hasta corroborar al responsable y vuelven a la lista de huecos.
- [metadatos_pendientes.csv](metadatos_pendientes.csv): **142 entradas** con país o nacimiento sin corroborar. No se deduce la nacionalidad del club ni del lugar de nacimiento.
- [contraste_bdf.csv](contraste_bdf.csv): **269 diferencias** del contraste de **6.203** fichas de temporada con BDFutbol. Incluye alias posibles, fechas personales, relevos, licencias, aplazamientos y una dirección compartida. **No es una lista de errores confirmados** y no se aplica como sustitución automática. 221 filas requieren precisar el responsable o su cronología; otras 33 tienen discrepancias personales. Los demás casos llevan su explicación.
- [portugal_1960_1989_fuente.csv](portugal_1960_1989_fuente.csv): los **468 participantes reales** de esas ediciones y sus listas de técnicos en orden; cinco registros, de AD Sanjoanense y Seixal FC, no tienen identidad/alias incorporado y no se montan.
- [portugal_participantes_discrepantes.csv](portugal_participantes_discrepantes.csv): **31 clubes-temporada de los años sesenta que figuran en la liga del juego y no en la edición real**. Son 28 de los huecos portugueses y tres filas para las que ya se conocía el técnico del club, aunque su categoría requiere corrección aparte. No se empareja arbitrariamente un club erróneo con uno ausente.
- [brasil_2020_2025_aperturas.csv](brasil_2020_2025_aperturas.csv): veinte casos modernos que distinguen edición, interino, plantilla alternativa y responsable del primer equipo.
- [candidatos_sin_inicio_verificado.csv](candidatos_sin_inicio_verificado.csv): **315 candidatos brasileños todavía apartados**; una coincidencia en enero o ser el primer nombre de una lista anual no demuestra quién abrió la edición. Se retiran de esta cola los clubes-temporada ya confirmados.
- [clubes_fuente.csv](clubes_fuente.csv), [identidades_verificadas.csv](identidades_verificadas.csv) y [rasgos.csv](rasgos.csv): equivalencias de clubes, separación de los Arsenal y rasgos documentados. No se infieren estilos ni exigencia física o de rendimiento cuando faltan fuentes.

## Criterio histórico y precisión

La fuente principal son los historiales de WorldFootball, consultados a través de su proveedor público HS Data. Se cruza el período mensual con el primer partido de la edición cuando está disponible. Cuando hay varios nombres, se busca la ficha del primer encuentro, una cronología ordenada o una fuente del club. Incluso una ficha de partido puede mezclar al responsable, su auxiliar y el técnico que aporta la licencia; por eso no se sustituye un nombre únicamente por aparecer en ella.

BDFutbol se usa como contraste, **no como autoridad automática de «jornada 1 = primer partido»**: en España e Italia en 2011 la huelga aplazó esa jornada, que se disputó después del inicio cronológico. Se mantienen **Gregorio Manzano en el Atlético de Madrid y Gian Piero Gasperini en el Inter** al abrir aquellos cursos. En otros casos hay que distinguir al técnico con licencia del responsable efectivo, especialmente en Francia.

Las listas estacionales de [Arquivos da Bola](https://arquivista.wordpress.com/) identifican los relevos portugueses por jornadas; se contrastan casos problemáticos con archivos de los clubes, Wiki Sporting, RTP y biografías. Por ejemplo, se conserva **António Oliveira en el Sporting de 1982**, en lugar de atribuir la temporada al adjunto Marinho Mateus por una lista estadística. El archivo no se toma como prueba del nacimiento de una persona homónima.

Boca aporta **19 inicios** antes pendientes mediante la ficha del primer partido de la competición representada en [Historia de Boca](https://historiadeboca.com.ar/). En las temporadas que cruzan años se consulta la edición que empieza en el año del juego, no la que termina ese año. Wormatia aporta sus tres inicios de 1960–62 mediante el archivo oficial de entrenadores; BC Augsburg y Eintracht Trier se contrastan con crónicas y publicaciones históricas.

Se corrigen, entre otros, **Boškov en Sampdoria 1986–91, Trapattoni en Fiorentina 1998–99, Hodgson en Inter 1996, Setién en Betis 2017–18 y Garitano en Leganés 2017**, distinguiéndolos de auxiliares. Las fuentes concretas figuran junto a cada cambio.

En una dirección compartida se almacena una persona real y se conservan ambos nombres en el período cuando se ha ampliado la fila: **Martini/Messera en Gimnasia 2021, Torres/Bastos en Estoril 1978–79 y Haroldo de Campos/Raul Oliveira en Leixões 1974**. No se crea un entrenador ficticio concatenando los dos nombres. Liverpool 1998 ya conserva a uno de sus codirectores, Gérard Houllier; el club confirma la colaboración con Roy Evans. El conjunto Wiesinger/Reutershahn de Núremberg 2013 se señala en el contraste.

**Brasil:** antes de 1971 se usa el regional representado, con primeras fechas del club de RSSSF cuando se pueden obtener. Después se cruza el comienzo estatal y nacional conocido y se conserva el anterior; donde no consta el primer partido individual se declara esa precisión. Se respeta el año real de las preliminares que empiezan en diciembre. En 2021 se separa la edición de 2020 que terminó tarde de la campaña nueva.

Para una apertura con juveniles durante la pretemporada de los profesionales se conserva al **titular que ya trabaja con el primer equipo**: por ejemplo, Pepa en Sport 2025 y Paulo Sousa en Flamengo 2022; el otro banquillo se explica en el período. Si no había titular en funciones se registra al **interino que abrió la edición**: Iubel en Cuiabá 2021–22, Lucas Gonçalves en Atlético Mineiro 2021 o Carlos Leiria en Botafogo 2025. **Santos 2021** queda con **Marcelo Fernandes**: Holan estaba contratado y en la grada, pero la crónica confirma que aún no había asumido. Esta convención queda visible en `criterio` y en el CSV de aperturas.

Hay fichas personales erróneas incluso en los proveedores. **Alberto Gomes de Académica 1961 nació en 1915**, no en 1943. Fernando Ferreira de Riopele 1977 no es el técnico nacido en 1957; Fernando Pires de Nacional 1989 no es Fanã; Eduardo Gonzalez de Feirense 1977 no se identifica con Chato González. Estos tres nacimientos permanecen vacíos. Cinco asignaciones argentinas con perfiles de 19–21 años se apartan por identidad o rol sin confirmar, sin sustituirlos por un nombre supuesto. Se distinguen los Artur Jorge de 1946/1972 y los António Oliveira de 1952/1982, sin trasladar la ficha del homónimo. El año de Guttmann es **1899**, corroborado por [Connecting Portuguese History](https://connectingportuguesehistory.org/items/show/39) y `MAESTROS`.

João Pedro Sousa se identifica como portugués con una biografía explícita: nacer en Luanda no permite atribuirle automáticamente nacionalidad angoleña.

No todas las filas tienen la misma precisión. En los historiales mensuales, «historial y primer partido» significa que consta un técnico único en ese mes, no que se conozca su contrato por día. Una cronología anual ordenada conserva ese criterio, sin inventar el 1 de enero. Los períodos de `entrenadores.csv` son **temporadas que empiezan con ese entrenador**, no una afirmación de empleo diario ininterrumpido.

| Criterio | Clubes-temporada |
|---|---:|
| historial y primer partido de liga | 7482 |
| historial y apertura general estatal; no consta la primera fecha del club | 352 |
| historial y apertura general de la liga; no consta la primera fecha del club | 267 |
| técnico de la alineación del primer partido de liga | 223 |
| archivo de la temporada: primer técnico de la lista de relevos por jornadas | 178 |
| primer técnico del año en cronología anual; sin atribuir fecha diaria | 131 |
| historial: mismo técnico todo el año | 98 |
| intervalo de la cronología que cubre el inicio; precisión conservada | 96 |
| BDFutbol: técnico con jornada 1 en la tabla de entrenadores | 83 |
| historial y primer partido del club en RSSSF | 44 |
| historial y apertura general nacional, anterior al estatal; no consta la primera fecha del club | 42 |
| historial: mismo técnico durante julio-octubre | 39 |
| Historia de Boca: DT de la ficha del primer partido del campeonato representado | 19 |
| responsable del primer equipo: contrastado con historia del club o federación | 18 |
| estreno estatal del club: entrenador confirmado por crónica o presentación oficial | 12 |
| archivo del club o cronología de la temporada: entrenador que abrió el curso | 7 |
| interino responsable de abrir la edición, antes de asumir el nuevo titular | 7 |
| titular del primer equipo; apertura alternativa documentada | 7 |
| historial: mismo técnico durante enero-abril; apertura estatal preliminar del año anterior | 7 |
| intervalo Wikidata, respetando la precisión de sus fechas | 6 |
| estreno del club confirmado por crónica o presentación | 6 |
| biografía: intervalo de entrenador que cubre la apertura, con precisión conservada | 5 |
| ficha de temporada o primer partido contrastado individualmente | 4 |
| codirección: primer técnico de la lista; ambos nombres constan en el período | 3 |
| codirección: primer nombre del comunicado; el otro técnico consta en el período | 1 |
| responsable del primer equipo confirmado por historia de la temporada; se distingue del adjunto | 1 |

## Reproducción y validación

```sh
python3 herramientas/entrenadores.py --montar
python3 herramientas/base.py
python3 herramientas/entrenadores.py
node pruebas/auditoria.js
node pruebas/famosos.js
node pruebas/partida.js 2000 12 7
```

El montaje es local, sin red ni dependencias nuevas. Conserva los registros exteriores al encargo, incluidos los relevos de 1958–59, y agrupa años consecutivos con el mismo técnico y metadatos. Se comprobó su idempotencia. Los datos no fuerzan ceses ni nombramientos durante los veranos de la partida: esos relevos siguen en manos del motor.

La comprobación valida inicios/huecos, duplicados, clubes, fuentes, edades plausibles, nombres y nacimientos de `MAESTROS`, ausencia de identidades compuestas y de `fijo` en los datos nuevos, y correspondencia con la compilación. Incluye regresiones de aplazamientos, auxiliares y homónimos. Las tres pruebas pedidas pasan sobre ae33cb6 más esta ampliación; los resultados y límites están en [validacion.md](validacion.md).

## Pendientes de integración

Los **1.182 huecos**, las **142 entradas personales incompletas** y los desacuerdos de fuentes siguen explícitos. No se rellenan copiando el último técnico conocido. Además de las tres ligas de 2025–26 ausentes y los participantes portugueses antiguos, **Paris FC en 1966** requiere corregir su identidad: se fundó en 1969. En Argentina sigue sin identificarse unívocamente «San Luis». Algunas filas antiguas de Italia representan clubes que en ese inicio estaban en Serie B; se conserva el club y año del juego y no se corrigen sus ligas desde este encargo.

`main` ya separa el Arsenal argentino como «Arsenal de Sarandí»: en 2015 se comprobaron **Wenger en Inglaterra y Martín Palermo en Argentina**. Se conservan las equivalencias históricas de Nancy, Toulouse, Troyes, Friburgo, Caxias y Belenenses/B-SAD.

La ampliación puede cambiar resultados al rehacer una partida. No se toca la versión de guardado; Claude debe coordinarla antes de publicar estos datos. El PR de ampliación permanece en borrador y no se presenta como cobertura histórica completa.
