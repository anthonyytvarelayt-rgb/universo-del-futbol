# Francia 1958-59 (y 1959-63): qué hay y cómo se hizo

## Archivos (todos en datos/)
- `francia-1958-59-plantillas.csv`: 859 jugadores reales (420 de Division 1, 439 de Division 2), solo los que jugaron algún partido. Columnas iguales a España: division, club, nombre, pos, nac, pais, liga, nivel, techo.
- `francia-1958-59-plantillas-detalle.csv`: lo mismo más internacionalidades (antes de sept. 1958 y totales), ficha de Wikipedia usada, fuente y notas.
- `francia-clubes-1958-59.csv`: 40 clubes (club, ciudad, estadio, color1, color2, prestigio).
- `francia-entrenadores-1958-59.csv`: 45 tramos de entrenador (Lens, Lille, Metz, Roubaix-Tourcoing cambiaron a mitad de temporada).
- `francia-debutantes-1959-63.csv`: 162 jugadores que entran en Division 1/2 entre 1959-60 y 1962-63 (cantera, extranjero, regresa). Columnas de plantillas + debut, tipo, temporada, internacionalidades, fuente, nota.
- `francia-ascensos-1959-63.csv`: ascensos y descensos reales (4 y 4 cada año).
- `francia-clasificaciones-reales-1958-63.csv`: clasificación final real de Division 1 de 1958-59 a 1962-63 (para comparar con lo simulado).
- `francia-coupe-de-france-1958-59-partidos.csv`: Coupe de France desde octavos (campeón real: Le Havre, de Division 2, ganó a Sochaux en el desempate de la final).
- Scripts en `scripts-francia-1958-63/` (necesitan las páginas descargadas, no se pueden volver a ejecutar tal cual).

## Fuentes
- Plantillas, partidos, goles, minutos, fechas de nacimiento y entrenadores: footballdatabase.eu (una página por club). Ojo: esa web solo deja ver unas 50 páginas al día sin cuenta, por eso no se usó para las temporadas siguientes.
- Clasificaciones 1932-1963, palmarés de liga y de Coupe de France: pari-et-gagne.com.
- Carreras e internacionalidades: ficha (infobox) de la Wikipedia francesa. La tienen 453 de 859 jugadores (88 % de los titulares de Division 1, la mitad en Division 2).
- Debutantes: Wikidata (jugadores con fecha de alta en un club francés entre 1959 y 1962) + su ficha de Wikipedia.

## Cómo se calculó
- Prestigio de clubes: mismo método que España (títulos de liga, Copas con peso 0,4 antes de 1940, subcampeonatos, podios, temporadas en primera, puestos de las últimas 5 temporadas, Copa de Europa) con raíz cuadrada. Reims arriba con 880, igual que en el CSV de la Copa de Europa. Mínimo 330 para un club de Division 1 (Limoges, recién ascendido sin historia).
- Nivel: fórmula de España (prestigio, minutos, internacionalidades, goles por partido para delanteros, edad). Diferencia: para el nivel se mezcla el prestigio del club con su puesto real en 1958-59 (mitad y mitad), porque Lille y Marsella tenían mucho palmarés pero bajaron ese año. Después se ajusta para que el titular medio sea 700 en Division 1 y 600 en Division 2, como en España.
- Techo: regla de España (mejores 3 temporadas como titular en un club de primera en los 13 años siguientes + partidos con la selección). Sin ficha de Wikipedia, techo solo por edad.
- Los 16 jugadores del Reims que salen en el CSV de la Copa de Europa 1958-59 llevan exactamente el mismo nombre, posición, nivel y techo. Nombres de Niza, Mónaco y Reims también igualados con el CSV de Copa de Europa 1959-63. Kopa y Rial (vuelven de España) usan sus valores del CSV de España.
- A mano: Cisowski 900/900 (máximo goleador, por debajo de Fontaine 915).

## Puntos flojos
- "liga" incluye todos los partidos oficiales de la temporada (liga + copas + Copa de Europa), no solo liga.
- País: el de footballdatabase.eu, que da la nacionalidad deportiva posterior (varios nacidos en Argelia, Marruecos, Camerún, etc. eran franceses en 1958).
- Debutantes: solo 162 (Wikidata no tiene a todos); en los debutantes "liga" es la media por temporada de su etapa en el club, no la temporada exacta.
- Colores/estadio sin confirmar: Toulouse, Nancy, Limoges, Alès, Stade Français, Forbach, Roubaix-Tourcoing, CA Paris, Béziers, Montpellier, Perpignan, Aix, Besançon, Sète.
- Coupe de France: faltan las rondas antes de octavos y las fechas (salvo la final).
- La regla de techo infravalora a figuras de clubes medianos (pasa igual en España), p. ej. Bosquier.
