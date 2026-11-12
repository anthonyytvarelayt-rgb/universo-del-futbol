# Copa de Europa 1959-60 a 1962-63 — datos para la beta

Mismo formato y misma escala que la edición 1958-59 (ver copa-europa-1958-59-formato.md).

## Archivos
- `copa-europa-1959-63-plantillas.csv`: 1.417 filas (jugador × temporada) de los clubes extranjeros. Columnas iguales que 1958-59 más `temporada` delante: temporada, club, pais_club, nombre, pos, nac, pais, pj_copa, goles_copa, intern_antes, intern_total, nivel, techo, fuente, dudas.
- `copa-europa-1959-63-participantes.csv`: 114 participantes reales (27, 28, 29 y 30 por edición) con país, cómo entró (`entrada`), prestigio del club, partidos jugados y si hay alineaciones.
- `scripts-copa-europa-1959-63/`: los scripts que generan todo (descarga UEFA, cruce con Wikidata, cálculo).

## Quién entra
- Todos los participantes fueron campeones de su liga salvo: ŁKS Łódź 1959-60 (campeón de 1958), Legia e IFK Malmö 1960-61 (líderes en primavera, acabaron 2.º), B 1913 Odense e IFK Göteborg 1961-62 (líderes en primavera, 3.º), Sporting 1961-62 (2.º; Benfica era campeón de liga y vigente), Fredrikstad 1962-63 (líder en el parón, 3.º) y Benfica 1962-63 (campeón vigente). Fuente: Wikipedia (páginas de cada edición) y RSSSF.
- España: Real Madrid y Barcelona aparecen en la lista solo como referencia. En la partida, el campeón de Liga español y el campeón vigente de la Copa salen de la simulación; sus plantillas son las del motor.
- Si el campeón vigente simulado no es el real, el club real que entró como vigente (Benfica 1962-63) no debería entrar, y el país recupera su plaza normal. Benfica 1961-62 entró como campeón de Portugal, así que entra siempre.
- Retirados sin jugar (sin plantilla): KuPS 1959-60, Glenavon y CCA Bucarest 1960-61. Malta (Hibernians, Floriana) y Albania (Partizani) debutan en 1961-62 y 1962-63.

## Cómo se calcularon nivel y techo
- Alineaciones completas de los 224 partidos en la API oficial de UEFA (match.uefa.com). Plantillas = quienes jugaron en la Copa (11-17 por club, cortas igual que en 1958-59).
- Nivel: la misma fórmula que 1958-59, comprobada contra ese CSV: 300 + 0,45 × prestigio + 120 × (proporción de partidos − 0,5) + 6 × peso de la selección × internacionalidades previas (máx. 25) + para delanteros 140 × goles/(partidos + 6) × proporción; −30 si tiene menos de 20 años, −20 por año pasados los 33.
- Internacionalidades y carrera: Wikidata (842 filas con ficha). `intern_antes` = las de los 5 años previos a la temporada, repartidas según las fechas de su etapa en la selección (aproximado). Sin ficha: techo solo por edad, marcado en `dudas`.
- Techo: la carrera posterior en Wikidata (clubes en los 13 años siguientes, con prestigio aproximado por nombre) + internacionalidades totales, con el mismo margen por edad.
- Prestigio de clubes nuevos puesto a mano en la escala de 1958-59 (Milan 920-930, Benfica 860 → 950 tras sus títulos, Tottenham 920, Malta 380).
- 44 valores a mano para cracks a los que la fórmula no hace justicia con pocos partidos (Sívori, Eusébio, Masopust, Altafini, Seeler, Greaves, Rivera, Coluna...). El motivo va en `dudas`.
- Tres posiciones corregidas a mano (Seeler delantero, Germano defensa, Baxter medio).

## Jugadores repetidos
214 filas son jugadores que ya estaban en el CSV de 1958-59 (mismo nombre, p. ej. "Omar Sívori"; `dudas` dice su club y valores de entonces). Un mismo jugador también puede salir en varias temporadas de este archivo. Cada fila es una foto de esa temporada: si el motor ya tiene al jugador por una edición anterior, puede quedarse con su valor evolucionado y usar este solo como referencia.

## Pendiente
- Suplentes de sus ligas (las plantillas solo llevan a quienes jugaron la Copa).
- Fechas, sedes y cruces de cada ronda: están en la API de UEFA y en RSSSF (rsssf.org/ec/ec196061.html, etc.) si el motor quiere empezar con los cruces reales.
