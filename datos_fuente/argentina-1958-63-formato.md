# Argentina 1958-63: formato, fuentes y dudas

## Formato real
- Temporada por año natural: la "1958-59" del simulador es el campeonato de **1958** (23 de marzo a 28 de diciembre), dos ruedas, 30 fechas, 2 puntos por victoria.
- Durante el Mundial de Suecia (abril a julio) la liga se paró tras 3 fechas y se jugó la **Copa Suecia** (torneo oficial de la AFA, solo ese año): dos grupos de 8 a ida y vuelta, desempate y final. Ganó **Atlanta** 3-1 a Racing; la final se jugó el 29/04/1960. Partidos en `argentina-copa-suecia-1958-partidos.csv` (RSSSF). De 1959 a 1963 no hubo copa nacional (la Copa Argentina empieza en 1969).
- Descenso por promedios, 1 sube de la Primera B. Clubes por año: 1958-1961 16, 1962 15, 1963 14, 1964 vuelven a ser 16. Ver `argentina-ascensos-1959-63.csv` (año = temporada en que ya juega en Primera) y `argentina-descensos-1958-63.csv`.
- Campeones reales: 1958 Racing, 1959 San Lorenzo, 1960 Independiente, 1961 Racing, 1962 Boca, 1963 Independiente.

## Fuentes
- Plantillas, partidos y goles de cada jugador, y alineaciones de todos los partidos: anuarios "Fútbol Argentino: Crónicas y Estadísticas" (AFA, Colussi/Guris/Kurhy) de 1957 a 1963, en historical-lineups.com (`.../uploads/2019/11/<año>.pdf`).
- Posición: el puesto más repetido en las alineaciones (arquero POR; zagueros y medios laterales DEF; centrojás e insiders MED; punteros y centrodelantero DEL). Sin alineación: la posición de BDFA.
- Nacimiento y nacionalidad: BDFA (bdfa.com.ar), si no Wikidata. **Unos 6 de cada 10 jugadores no tienen fecha en ninguna de las dos**: llevan el año "(estimado)" (debut en BDFA menos 20 años, o 25 si ya jugaba en 1957). Es lo más flojo del paquete.
- Entrenadores 1958: anexos de entrenadores de Wikipedia (10 de 16 clubes). 1959-63: el "DT" que firma cada alineación del anuario (`argentina-entrenadores-1959-63.csv`, con partidos dirigidos y orden).
- Prestigio: mismo método que España con datos: títulos profesionales 1931-57 (x3), amateurs (x1,2), ligas regionales de Rosario y Santa Fe (x0,45), podios, temporadas en Primera 1931-57 y puestos 1953-57; escala 250-985 con raíz cuadrada (River 985, Boca 911, Racing 819 … San Telmo 250).

## Nivel y techo
- Fórmula de España: 300 + 0,45 x prestigio + minutos (partidos/30) + selección + goles (para delanteros e insiders) + edad. Selección: 3 por partido hasta 50, porque Argentina jugaba el doble de partidos que España.
- Calibración: +50 a todos, porque la escala de prestigio argentina incluye a la Primera B y tiene el suelo más bajo; así el titular medio queda como en España (Racing 819 y River 802 de media de titulares; Newell's 523 el más bajo).
- Techo: sus mejores temporadas reales 1959-71 (Primera argentina con 15 o más partidos, y ligas extranjeras de BDFA) + partidos con la selección.

## Lo que falta o hay que decidir
- **Primera B 1958 no tiene plantillas**: no hay fuente con sus jugadores (BDFA solo tiene unos pocos por club). Los 18 clubes están en `argentina-clubes-primera-b-1958.csv`, fuera del CSV de clubes para que el conversor no salte el país. Los que suben (Ferro, Chacarita, Los Andes, Quilmes, Banfield) traen su plantilla real del año en que suben dentro de los debutantes.
- 7 jugadores de la liga de 1958 ya están en las plantillas europeas de 1958-59 (Calvanese en Genoa; Sánchez Lage, Madinabeytia, Bayo, Rojas, Gómez y Sande en España). Se dejaron fuera de Argentina para que no existan dos veces; están en `argentina-1958-59-plantillas-detalle.csv` con la marca "excluido".
- Los que se van a Europa después (Griffa, Manfredini, Héctor de Bourgoing, Merighi, Aramendi, Osvaldo Cruz a Brasil, Rafael Santos) llevan el mismo nombre y fecha que en los CSV de esos países.
- Debutantes: "cantera" incluye a los que llegan de la Primera B o del interior (columna procedencia), porque esas categorías no se simulan.
