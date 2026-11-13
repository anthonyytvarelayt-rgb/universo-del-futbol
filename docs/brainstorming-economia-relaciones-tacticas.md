# Universo del fútbol: economía, relaciones, declaraciones, tácticas y rendimiento

Revisión original: 13 de noviembre de 2026, `main` en `83d702c`. Actualización de estado y prioridades: `main` en `68b0221`, después de la respuesta de Claude trasladada por Anthony. Esta entrega es de documentación y no modifica el juego. Se parte de su funcionamiento actual: los clubes, entrenadores y jugadores toman decisiones dentro de la simulación y el usuario sigue la historia.

**Estado actual:** el fallo económico posterior a 2030 está corregido en `68b0221`. Se comprobó de nuevo la función exportada para 2025, 2030, 2031 y 2040: devuelve 222 millones en los cuatro casos. Las demás propuestas de este informe son trabajo futuro.

**Reparto recomendado:** Claude empieza por minutos y promesa de minutos con declaraciones. Codex deja disponible este informe para la revisión posterior. Esta recomendación organiza el trabajo; no presupone que esas funciones ya estén implementadas.

## La propuesta central

Conectar las decisiones económicas, las personas y el fútbol mediante consecuencias que se puedan seguir durante varias temporadas. La noticia debe permitir entender qué ocurrió, quién decidió y por qué importa. La historia continúa cuando cambia la situación.

Ejemplo hipotético de una partida:

> Un club ofrece a su delantero un proyecto para competir en Europa. Queda fuera de la competición y pierde ingresos previstos. Mantiene los salarios comprometidos, así que vende a su mejor pasador. El delantero recibe menos ocasiones y reclama refuerzos. El entrenador intenta resolverlo con un cambio de plan y una oportunidad para un joven. La afición y la directiva valoran lo que sucede a continuación.

Cada paso necesita una causa registrada en la partida. El éxito del joven, el resultado del próximo partido y la continuidad del delantero quedan abiertos a la simulación.

## Lo que ya existe y lo que falta conectar

| Área | Base actual verificada | Oportunidad principal |
| --- | --- | --- |
| Economía | Caja, crédito, sueldos calculados, precios por época, ingresos, premios, dueños, contratos, ventas por apuros y refinanciación. | Compromisos económicos persistentes y causas concretas de ingresos y gastos. |
| Relaciones | Carácter, deseos, líderes, convivencia, vestuario unido/roto, rivalidades, choques con el entrenador y maestros. | Confianza entre personas, compromisos y recuerdos que evolucionen. |
| Declaraciones | Plantillas según premios, carácter, mercado, fracaso y retiro; se muestran al cerrar la temporada. | Intervenciones durante la temporada, continuidad y seguimiento de lo dicho. |
| Tácticas | Cuatro estilos con efectos reales en ataque, defensa, creación y posesión; atributos, adaptación visitante y selección por forma. | Dibujos, tareas y respuestas al marcador que aprovechen la plantilla. |
| Rendimiento | Goles, asistencias, pases, cortes, regates, paradas, notas por rol, energía y forma. | Minutos acumulados, contexto, continuidad y evaluación de funciones más concretas. |

Las canteras y los maestros reales incorporados en el último cambio se presentan en fichas e historias. Su incorporación no convierte automáticamente esa información histórica en relaciones activas de la partida.

## Hallazgos que condicionan el diseño

### Fallo de escala económica futura: corregido

En la revisión original, `recordTraspaso` buscaba el tramo de su tabla y aplicaba `Math.max(1, findIndex(...))`. Después del último año, la búsqueda devolvía `-1` y terminaba usando el primer tramo. El [cambio `68b0221`](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/commit/68b0221) conserva correctamente la última referencia cuando se supera el último año.

Sondas ejecutadas sobre la función exportada, antes y después de la corrección:

| Año | Antes, millones | Corregido, millones |
| --- | ---: | ---: |
| 2025 | 222 | 222 |
| 2030 | 222 | 222 |
| 2031 | 0,09 | 222 |
| 2040 | 0,09 | 222 |

Esa referencia interviene en precios, conversión de sueldos, ingresos y premios. El fallo queda resuelto con la conservación de la última referencia disponible. Cualquier evolución económica futura adicional debe tener una regla explícita; el índice empleado por una partida futura no es un dato histórico real.

### El sueldo funciona como demanda recalculada

Hay fecha de vencimiento del contrato, pero `sueldo(j)` depende del nivel actual y del deseo del jugador. Las cuentas suman esa función sobre la plantilla. Una prueba con el mismo jugador sintético y el mismo vencimiento dio 1,85 unidades para nivel visible 700 y 3,99 para nivel 800.

Para modelar negociaciones, diferencias salariales, promesas y veteranos caros, conviene separar **sueldo firmado**, **sueldo que pide** y **vencimiento**. El contrato vigente conserva obligaciones hasta que hay un evento que las modifica.

### El precio depende mucho del comprador

Otro ensayo mantuvo jugador, edad, año y nivel, cambiando solo el prestigio del comprador: el precio pasó de 4,4 a 15 millones. Es una decisión del modelo actual, no una prueba de que el mercado permita siempre explotar esa diferencia.

La propuesta es separar valoración, precio pedido, oferta y acuerdo. La riqueza del comprador puede influir en la negociación; el vendedor conserva sus propios límites y motivos para aceptar.

### Las cuentas tienen estabilizadores fuertes

Los ingresos ordinarios salen principalmente de presupuesto, prestigio, país y bonificación de estadio. El ajuste de otros gastos acota el resultado ordinario, antes de premios y aportes del dueño, aproximadamente entre una pérdida del 10 % y una ganancia del 8 % de los ingresos. La refinanciación reduce la deuda negativa y resta prestigio.

Son mecanismos de equilibrio. Una economía más explicable necesita sustituirlos gradualmente por costes, inversiones y compromisos persistentes, midiendo que el mundo siga siendo jugable.

El dinero descontado como `obras` se registra en finanzas; en el código revisado esa variable no genera por sí misma una mejora persistente de instalaciones. Actualmente los efectos de los estadios y las canteras proceden de otras reglas.

### El partido conoce minutos; la temporada no los acumula

Las entradas y salidas permiten calcular cuánto participa cada jugador en el partido. El registro anual acumula partidos y acciones, pero no un total de minutos. Lo confirmé en los resultados de las dos temporadas de diagnóstico.

Esto limita la comparación de suplentes y titulares, el cálculo por 90 minutos y las futuras promesas de participación. La alineación base busca un portero, cuatro defensas, tres medios y tres delanteros; los cuatro estilos no cambian ese reparto por sí solos.

## 1. Economía: clubes con una estrategia reconocible

### Posibilidades para desarrollar por etapas

Los sueldos pactados tienen prioridad en la siguiente fase económica. La separación detallada de ingresos y las demás ampliaciones quedan como opciones posteriores.

- **Salarios firmados y renovaciones:** un joven puede rendir por encima de su contrato y pedir una mejora; un veterano conserva un salario alto aunque pierda protagonismo. Las primas se pagan cuando se cumple su condición.
- **Ingresos separados:** entradas y abonos; televisión y competición; patrocinio y actividad comercial; premios. El apoyo de la afición es relativamente estable, mientras que resultados y clasificación continental afectan con distinta velocidad a cada partida.
- **Deuda con recorrido:** préstamos con devolución y coste; aportes del dueño identificados; ventas para resolver vencimientos. Una refinanciación debe dejar una obligación o una condición visible.
- **Inversiones que permanezcan:** mejoras de instalaciones, formación o captación con coste, plazo y efecto acotado. Una obra anunciada tiene seguimiento hasta su inauguración.
- **Negociación con dos partes:** el club comprador compara necesidad y coste; el vendedor compara necesidad de caja, importancia deportiva y alternativas. Las operaciones pueden avanzar, caer o cerrarse.

### Historias que produciría

Un club formador reinvierte una gran venta y tarda años en recoger el resultado. Un club con salarios de Champions necesita reducir plantilla tras dos temporadas sin clasificarse. Un presidente ambicioso contrata una estrella que el entrenador no había pedido. Un dueño financia un proyecto con condiciones y luego exige resultados.

### Criterios de equilibrio

El sistema debe reconocer diferencias por país y época, mantener vías de recuperación y evitar que cada título garantice una superioridad cada vez mayor. Las cuentas muestran estimaciones propias de la simulación; las fuentes históricas solo respaldan los datos que realmente contienen.

## 2. Relaciones: confianza con motivos y memoria

Empezaría por vínculos concretos: jugador–entrenador, capitán–grupo y entrenador–directiva. Las parejas de jugadores relevantes pueden incorporarse cuando exista una historia que justifique guardarlas.

- **Confianza profesional:** oportunidades concedidas, papel táctico, continuidad y respuestas del jugador.
- **Compromisos:** minutos, posición, renovación o un proyecto deportivo, con condición, plazo y revisión.
- **Apoyo de la directiva:** resultados respecto a recursos disponibles, ventas impuestas y decisiones anteriores.
- **Relaciones que cambian:** un suplente puede ganarse al técnico; una discusión puede resolverse; un capitán puede ayudar a reconstruir el grupo.
- **Memoria entre clubes:** el técnico que dio una oportunidad, el compañero con quien funcionaba una sociedad, una salida con desacuerdo y un reencuentro posterior.

La personalidad influye en la respuesta sin decidir por sí sola todo el comportamiento. Las lesiones y sanciones se tienen en cuenta al evaluar compromisos de participación. El juego distingue exigencia deportiva, rivalidad competitiva y conflicto personal.

Para mantener el sistema manejable, se guardan las relaciones que tienen acontecimientos relevantes. En la interfaz se muestran las pocas que están explicando la situación actual.

Las relaciones históricas documentadas aportan contexto inicial. Los vínculos creados por lo sucedido en la partida tienen su propio registro y fecha. Haber sido jugador de un técnico no demuestra por sí solo amistad ni acuerdo permanente.

## 3. Declaraciones: voces que tengan algo concreto que decir

Las declaraciones actuales son fundamentalmente reacciones al cierre de temporada. Su límite de cinco y el orden fijo de selección favorecen algunas categorías sobre otras.

Propondría un sistema editorial con:

1. **Un motivo verificable:** una suplencia prolongada, una renovación, una derrota importante, una lesión o una oferta registrada.
2. **Una intención:** respaldar, reclamar, asumir responsabilidad, prometer o cerrar un conflicto.
3. **Una voz:** tono sobrio, conciliador, ambicioso o provocador, con variación de expresiones.
4. **Un seguimiento:** se cumple, se incumple, se rectifica o cambia la situación.

Ejemplo hipotético: un entrenador respalda públicamente a un delantero después de varios partidos sin marcar. Más adelante, una noticia puede recuperar ese respaldo si el jugador responde o si pierde el puesto. El resultado sigue abierto.

Conviene seleccionar noticias por relevancia, novedad y diversidad de protagonistas. Una promesa sin resolver puede reaparecer; un mismo reproche no necesita repetirse cada jornada.

Las declaraciones pertenecen a **la crónica de esta partida**. Los datos históricos y las citas reales, si se incorporan, llevan su procedencia. Afirmaciones sobre la infancia o la afición de alguien necesitan una base documental o un antecedente explícito de la partida.

La decisión que origina la declaración se calcula una vez en el mundo. El texto la representa. Abrir la noticia, volver a una ficha o exportar un resumen conserva lo sucedido.

## 4. Tácticas: planes que se vean en el campo

Hay una base útil: los estilos ya modifican el partido y los atributos ya participan en sus jugadas. La siguiente capa sería combinar **dibujo, tareas y plan**.

### Dibujos y tareas

Introducir un catálogo pequeño de sistemas, disponible según época y plantilla. Distinguir paulatinamente lateral y central; pivote, interior y mediapunta; extremo, segundo delantero y nueve. Cada futbolista tiene familiaridad con sus tareas y puede adaptarse con tiempo y condiciones.

### Planes con ventajas y costes

- Presión alta: posibilidad de recuperar antes, mayor gasto físico y espacio detrás de la primera presión.
- Bloque bajo: protección de zonas próximas al área y menor facilidad para avanzar o sostener ataques.
- Ataque por bandas: más importancia de velocidad, regate, centros y remate; necesita ocupación del área.
- Juego por dentro: importancia del pase, la visión y los apoyos, con riesgo ante pérdidas centrales.
- Juego directo: búsqueda del delantero y de segundas jugadas; depende de sus características y de la compañía.

### Ajustes durante el partido

El entrenador puede sustituir por cansancio o por necesidad táctica, proteger una ventaja, buscar un gol, reforzar una zona o responder a una expulsión. El margen de cambios respeta la época. Adaptarse al rival no significa conocer el resultado de antemano.

Una explicación breve debe salir de decisiones y jugadas registradas: quién cambió de función, por qué entró un suplente y qué situaciones generó el plan. Las tácticas necesitan pruebas de equilibrio para que ninguna sea siempre la mejor elección.

## 5. Rendimiento: contar bien lo que hace cada jugador

El motor ya reconoce aportaciones de defensas, medios y porteros. El primer avance sería acumular minutos y separar cinco lecturas:

- **Capacidad:** nivel y atributos.
- **Estado actual:** forma y energía.
- **Participación:** minutos, titularidades y entradas desde el banquillo.
- **Función:** qué le pide el entrenador y cuánto encaja con ella.
- **Producción y continuidad:** acciones, regularidad y contexto de los rivales.

Con minutos se pueden presentar cifras por 90, conservando también los totales y el tamaño de la muestra. Una buena actuación breve no equivale a sostener un rendimiento durante toda la temporada.

Más adelante se podrían registrar acciones adicionales que requiera el modelo táctico: progresión, recuperaciones en zonas concretas, pérdidas y ocasiones de distinta calidad. Solo deben mostrarse métricas que el motor calcule; una cifra de goles esperados exige modelar y guardar las probabilidades de las ocasiones.

Un joven puede adaptarse, un veterano cambiar de función y un jugador tener un año excelente sin que cada efecto se convierta en una subida permanente de potencial. La nota y los premios deben evaluarse también por rol, minutos y contexto competitivo.

## Una pantalla que conectaría todo: «Cómo hemos llegado aquí»

En una crisis o un gran momento, ofrecer tres o cuatro hechos enlazados: una venta importante, un cambio de entrenador, un compromiso y la evolución posterior. Es una forma de hacer visibles los sistemas sin obligar al usuario a interpretar muchas tablas.

También serviría para seguir una sociedad de jugadores, el regreso de un canterano, un discípulo que se enfrenta a su maestro o el cambio de función de una leyenda veterana. La cronología se construye con hechos de la partida.

## Orden de implementación recomendado tras la respuesta de Claude

| Paso | Alcance | Qué permitiría comprobar |
| --- | --- | --- |
| 1 | Acumular minutos de cada jugador. | Participación fiable sin cambiar el sorteo ni los resultados de los partidos. |
| 2 | Promesa de minutos con declaraciones y seguimiento. | Una historia completa: anuncio, participación observada y resolución. |
| 3 | Confianza jugador–entrenador y entrenador–directiva, guardando las relaciones relevantes. | Consecuencias comprensibles y persistentes con un coste de memoria controlado. |
| 4 | Sueldos pactados, demanda salarial y renovación. | Obligaciones persistentes, veteranos caros y jóvenes que piden mejorar su contrato. |
| 5 | Dibujos tácticos por época, introducidos y medidos por separado. | Variedad deportiva sin perder el equilibrio de goles y competiciones. |

La separación detallada de ingresos por afición, televisión y patrocinio, así como otras ampliaciones económicas, queda para después. Las ideas completas se conservan en el apartado de economía como posibilidades futuras.

### Primera entrega: minutos

- Contar el tiempo efectivo de titulares y suplentes, con límites coherentes con la duración del encuentro.
- Terminar la participación cuando hay lesión, expulsión o sustitución; empezar la del suplente cuando entra.
- Sumar la prórroga al tiempo jugado y mantener un solo partido disputado por ese encuentro.
- Acumular el dato en estadísticas, historial y presentaciones que lo necesiten, sin introducir sorteos nuevos en el cálculo de resultados.
- Comprobar que la misma semilla mantiene marcadores, goleadores y campeones cuando el cambio solo añade contadores.

### Primera historia: la promesa de minutos

Un vínculo concreto entre un entrenador y un jugador, con fecha de anuncio, período de evaluación y condición comprensible. La participación se valora considerando los partidos en los que el jugador estuvo disponible. Las lesiones y sanciones requieren un criterio explícito para evitar un incumplimiento automático por ausencia forzada.

La declaración inicial utiliza únicamente los hechos conocidos en su fecha. El seguimiento y la resolución aparecen cuando corresponde en la cronología de la partida. Cambiar de club o de entrenador exige resolver explícitamente qué pasa con el compromiso.

El texto refleja un acontecimiento persistente: abrir una noticia varias veces conserva su estado y no vuelve a aplicar efectos. La interfaz puede recuperar la declaración inicial cuando llega la resolución.

Esta historia conecta participación, oportunidades, declaraciones y memoria. La primera versión puede completarse antes de ampliar la economía o los dibujos tácticos.

## Verificación y límites de esta revisión

Se ejecutaron una temporada completa desde 1958 y otra desde 2000, ambas con semilla 7, mediante el cargador de pruebas de Node. Terminaron sin excepción; produjeron 214 y 151 registros financieros de clubes de Primera, respectivamente. En ambas se comprobó que el agregado de jugadores no contiene minutos acumulados. Las sondas de precios, sueldos y años posteriores a 2030 se ejecutaron aparte con datos de prueba.

Son diagnósticos acotados. No se hizo una prueba visual del navegador en esta revisión ni un estudio estadístico de todas las economías, estilos o épocas. El comportamiento de precios según comprador se presenta como una decisión de diseño observada. El fallo posterior a 2030 fue reproducido en la revisión original y su corrección se comprobó directamente sobre `68b0221`; esas sondas no sustituyen un estudio de partidas largas tras la corrección.

Al implementar, habría que comprobar, entre otros casos:

- Continuidad económica al cruzar 2030 y escenarios largos desde distintas épocas.
- Transferencias con el mismo pago y cobro; aportes, préstamos y subvenciones identificados.
- Salarios persistentes y consecuencias de vencimientos e inversiones.
- Minutos correctos para suplentes, lesiones, expulsiones y prórrogas.
- Compromisos que consideran disponibilidad por lesión y sanción.
- Noticias con personas, clubes y hechos válidos en la fecha en que aparecen.
- Mismos resultados al repetir la semilla; lectura de pantallas sin efectos sobre el mundo.
- Equilibrio entre estilos y diversidad de campeones durante muchas temporadas y semillas.

Los cambios futuros que alteren resultados necesitan las pruebas habituales del repositorio y la actualización de la versión de guardado al integrarlos. Esta revisión conserva intactos el motor, los datos y las partidas.

## Referencias del código revisado

Los enlaces siguientes apuntan al código de la revisión original, `83d702c`. La corrección económica posterior está identificada y enlazada en su apartado.

- [Precios, referencia monetaria y sueldos](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/blob/83d702c/js/mundo.js#L1069).
- [Ingresos, cuentas y refinanciación](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/blob/83d702c/js/mundo.js#L1166).
- [Convivencia y vestuario](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/blob/83d702c/js/mundo.js#L963).
- [Contratos y renovaciones](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/blob/83d702c/js/mundo.js#L1373).
- [Conflicto entre estrella y entrenador](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/blob/83d702c/js/mundo.js#L1848).
- [Declaraciones](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/blob/83d702c/js/app.js#L1305).
- [Estilos y alineación](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/blob/83d702c/js/motor.js#L174).
- [Notas y estadísticas de los jugadores](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/blob/83d702c/js/motor.js#L433).
- [Participación, energía y forma durante la temporada](https://github.com/anthonyytvarelayt-rgb/universo-del-futbol/blob/83d702c/js/motor.js#L476).
