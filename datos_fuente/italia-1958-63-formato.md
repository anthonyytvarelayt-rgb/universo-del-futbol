# Italia 1958-59 a 1962-63: datos y reglas

## Archivos (todos en `datos/`)

| Archivo | Qué tiene |
| --- | --- |
| `italia-1958-59-plantillas.csv` | 834 jugadores: Serie A (18 clubes, 392) y Serie B (20 clubes, 442). Mismas columnas que España: division, club, nombre, pos, nac, pais, liga ("partidos / goles"; porteros con 0 goles), nivel, techo. |
| `italia-clubes-1958-59.csv` | Los 38 clubes: ciudad, estadio, dos colores y prestigio. |
| `italia-entrenadores-1958-59.csv` | 59 tramos de entrenador (Serie A y B) con jornadas y fechas reales. Columnas como España más `division` al principio. |
| `italia-debutantes-1959-63.csv` | 741 jugadores que entran de 1959-60 a 1962-63: 588 de cantera, 62 extranjeros y 91 que vuelven. Columnas de plantillas más debut (año de la temporada, 1959 = 1959-60), tipo (cantera/extranjero/regresa) y nota. |
| `italia-ascendidos-serie-c-1959-63.csv` | Clubes que suben de Serie C a Serie B cada temporada, con estadio, colores y prestigio. |
| `italia-coppa-italia-1958-59-partidos.csv` | Los 79 partidos reales de la Coppa Italia 1958-59 (ronda, fecha, resultado, prórroga). |
| `scripts-italia-1958-63/` | Scripts usados. Necesitan las páginas descargadas, así que no se pueden volver a ejecutar tal cual. |

## Cómo se hizo

- **Fuente de plantillas:** Transfermarkt (partidos, goles, minutos, fecha de nacimiento y nacionalidades). Tiene las dos divisiones completas desde 1950. Los minutos de esa época son estimados (partidos × 90).
- **Prestigio de clubes:** mismo método que España, calculado con el historial hasta 1957-58: títulos de liga (los de antes de 1929 pesan menos), Coppa Italia (antes de 1940 pesa 0,4), subcampeonatos y terceros puestos, temporadas en A y en B, puestos de las últimas cinco temporadas y finales europeas (Fiorentina 1957, Milan 1958). Escala con raíz cuadrada de 250 a 950: Juventus 950, Inter 883, Milan 868, Bologna 826, Torino 808 … Lecco 250. Los clubes que suben de Serie C sin historia tienen un mínimo de 300.
- **Nivel:** la fórmula de España: 300 + 0,45 × prestigio, ±60 según minutos (sobre 34 partidos en A y 38 en B), +6 por partido con la selección en las cinco temporadas anteriores (máximo 25), extra para delanteros por goles, −30 a menores de 20 años y bajada desde los 33. Los extranjeros de los que no se encontró su selección reciben +40, como en los debutantes de España.
- **Techo:** la regla de España (media de sus tres mejores temporadas reales de titular en Serie A en los 13 años siguientes, según el club, más sus partidos con la selección), limitado por la edad.
- **Internacionalidades:** Italia, de las convocatorias anuales en Transfermarkt. Selecciones extranjeras, de la Wikipedia italiana (se comprueba el año de nacimiento) o, si falta, de Transfermarkt con un reparto estimado por años.
- **Mismo nombre que en la Copa de Europa:** los 12 jugadores de Juventus que ya estaban en `copa-europa-1958-59-plantillas.csv` llevan el mismo nombre, nivel y techo (por ejemplo "Karl Erik Palmer"). Los de Milan y Juventus de la Copa 1959-63 llevan el mismo nombre ("Pepe Schiaffino", "Bruno Nicolé", "Alessandro Salvadore", "Morales Benítez").
- **Jugadores que ya existen en otro país:** 11 extranjeros de los debutantes ya están en los archivos de España o de la Copa de Europa (Luis Suárez, Del Sol, Peiró, Santisteban, Seminario, Greaves, Kostić…). La nota lo dice: el motor no debe crearlos de nuevo, sino traspasarlos.
- **Ajustes a mano (12):** como Vavá en España. Techo de figuras jóvenes que la regla no puede alcanzar (pasa poco de 890): Rivera 950, Zoff 930, Mazzola 920, Facchetti 915, Corso 880, Bulgarelli 860, Albertosi 845. Nivel de cracks: Altafini 860/920 (para cuadrar con la Copa 1959-60), Angelillo 905/915 (récord de 33 goles pero luego bajó), Luis Suárez 890/900, Law 870/900, Greaves 860/880. El motivo va en la nota de cada uno (en plantillas no hay columna de nota).

## Reglas de la época

**Liga**
- Serie A: 18 clubes, 34 jornadas. Serie B: 20 clubes, 38 jornadas. 2 puntos por victoria.
- Empates en puntos: se comparte el puesto. Si el empate decide el título, un ascenso o un descenso, se juega un partido de desempate en campo neutral (no se usa diferencia de goles).
- Ascensos y descensos, comprobados con las plantillas reales:

| Temporada | Bajan de A | Suben de B | Bajan de B | Suben de C |
| --- | --- | --- | --- | --- |
| 1958-59 | 2 (Triestina, Torino) | 2 (Atalanta, Palermo) | 2 (Vigevano, Prato) | 2 (Catanzaro, Mantova) |
| 1959-60 | 3 (Palermo, Alessandria, Genoa) | 3 (Torino, Lecco, Catania) | 3 (Modena, Taranto, Cagliari) | 3 (Pro Patria, Prato, Foggia) |
| 1960-61 | 3 (Napoli, Lazio, Bari) | 3 (Venezia, Palermo, Mantova) | 3 (Triestina, Marzotto, Foggia) | 3 (Modena, Cosenza, Lucchese) |
| 1961-62 | 3 (Lecco, Udinese, Padova) | 3 (Modena, Napoli, Genoa) | 3 (Reggiana, Novara, Prato) | 3 (Triestina, Cagliari, Foggia) |
| 1962-63 | 3 (Venezia, Napoli, Palermo) | 3 (Messina, Lazio, Bari) | 3 (Como, Sambenedettese, Lucchese) | 3 (Varese, Potenza, Prato) |

  Regla para el motor: en 1958-59, dos que bajan y dos que suben en cada frontera; desde 1959-60, tres. La Serie C tenía 2 grupos en 1958-59 (sube el campeón de cada uno) y 3 desde 1959-60.

**Extranjeros y oriundos**
- Lo documentado: en mayo de 1953 el gobierno (el llamado "veto Andreotti") cortó la llegada de profesionales extranjeros. Después se volvió a abrir con límites, porque siguieron llegando (Hamrin 1956, Charles y Sívori 1957, Altafini 1958). En 1965 se cerró la puerta a fichajes del extranjero y en 1966, tras perder con Corea del Norte, el cierre se hizo fijo hasta 1980. Los que ya estaban en Italia pudieron seguir.
- Oriundos: sudamericanos de familia italiana con pasaporte italiano. Contaban como italianos y podían jugar con Italia (Sívori, Angelillo, Altafini, Maschio). En 1962 la FIFA prohibió jugar con dos selecciones.
- Lo que se ve en los datos reales (jugadores sin pasaporte italiano que jugaron al menos un partido): en Serie A, máximo 2 por club en 1958-59, 3 en 1959-60 y 1960-61, y 4 en 1961-62 y 1962-63 (llegan Suárez, Law, Greaves, Hitchens, Haller). En Serie B, máximo 1 por club (2 en 1962-63).
- No encontré el texto exacto del reglamento de esos años. **Propuesta para el motor** (sale de lo observado): Serie A hasta 3 extranjeros por plantilla hasta 1960-61 y hasta 4 desde 1961-62; Serie B, 1 (2 desde 1962-63); los oriundos cuentan como italianos; desde 1965-66 no se fichan extranjeros nuevos de fuera.

**Coppa Italia 1958-59**
- Eliminatorias a partido único, con prórroga si hay empate. Empezó el 31 de agosto de 1958, cuando aún se jugaba la edición de 1958.
- 1.ª ronda: solo Serie C, por cercanía (20 partidos; el Pordenone pasó sin jugar). 2.ª ronda: entra la Serie B (20 partidos). 3.ª ronda: entra la Serie A (15 partidos; el Alessandria fue repescado tras perder). 4.ª ronda: 8 partidos.
- Octavos: los 8 ganadores más los 8 que llegaron a octavos en la Coppa 1958 (Bologna, Milan, Fiorentina, Sampdoria, Juventus, Lazio, Padova y Marzotto Valdagno). Sorteo libre y fechas a gusto de los clubes (de enero a mayo de 1959). Cuartos en junio, semifinales el 6 de septiembre de 1959.
- Final: 13 de septiembre de 1959 en San Siro, Inter 1-4 Juventus. También hubo partido por el tercer puesto: Genoa 2-1 Venezia.
- El campeón de liga va a la Copa de Europa. El de Copa iría a la Recopa, que empieza en 1960-61.

## Dudas y límites

- Los minutos son estimados. Si un jugador no tiene minutos reales, la diferencia entre titular y suplente se nota menos que en España.
- La Serie B sale más baja que la Segunda española (media 472 contra 512) porque sus clubes tienen menos prestigio en la escala. La Serie A queda parecida a Primera (608 contra 625).
- 7 jugadores de plantillas y 4 debutantes no tienen fecha de nacimiento. 18 extranjeros llevan el extra de extranjero porque no se encontró su selección.
- Los "regresa" solo miran desde 1950, que es lo que hay en la fuente. Un jugador que jugó antes de 1950 y vuelve sale como cantera.
- Entrenadores: en Italia era común el par entrenador más director técnico. Se pone como entrenador al director técnico (Viani en Milan, Czeizler en Fiorentina, Cesarini en Juventus) y el otro va en dudas. Estilo con fuente solo para Rocco, Viani, Bernardini y Foni; el resto "sin dato fiable". Marzotto Valdagno: Wikipedia pone el segundo tramo hasta la 34.ª, se supone que es hasta la 38.ª. Modena sale de la página de temporada del club.
- Colores y algunos estadios de clubes pequeños están puestos a mano (Vigevano y Cosenza son los menos seguros). Monza: Wikipedia dice "Città di Monza", pero ese estadio es de 1988; en 1958 jugaba en el Gino Alfonso Sada.
- Prestigio en la Copa de Europa: aquel hilo puso a mano Juventus 900 y Milan 920-930. Aquí, calculado con el historial, Juventus 950 y Milan 868.
