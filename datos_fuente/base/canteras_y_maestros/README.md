# Canteras y maestros de entrenadores

Consulta: **13 de noviembre de 2026**. Entradas: `lista_para_astra.csv`, `clubes.csv`, `alias.csv`, `entrenadores.csv` y `MAESTROS` de `js/mundo.js`. Los nombres y nacimientos de la lista de jugadores se conservan literalmente.

## Cobertura real

| Archivo | Filas de datos | Cobertura |
| --- | ---: | --- |
| [`canteras.csv`](../canteras.csv) | 343 | 343 de 1.499 jugadores distintos, con los siete campos completos |
| [`canteras_huecos.csv`](../canteras_huecos.csv) | 1.156 | Todos los demás jugadores, con motivo y datos parciales disponibles |
| [`maestros_entrenadores.csv`](../maestros_entrenadores.csv) | 727 | 220 de los 311 nombres solicitados; 42 de los 45 de MAESTROS |
| [`entrenadores_cobertura.csv`](entrenadores_cobertura.csv) | 311 | Selección, recuento de relaciones y pendientes para cada nombre |

La lista de jugadores tiene **1.500 filas**: `Kylian Mbappé,1998-12-20` está repetido. Se entrega una fila para esa identidad. Entre los 1.156 huecos se conservan 1.025 clubes de formación y 877 años de llegada; son datos parciales para revisión, sujetos al motivo de cada fila. La entrega de canteras completas es **343/1.499**, no 1.500/1.500.

Las 727 relaciones se reparten en **692 `jugador_de`, 32 `ayudante_de` y 3 `discipulo`**. Quedan **91 nombres sin relación corroborada**, enumerados en el archivo de cobertura mediante `relaciones=0`. Los tres MAESTROS pendientes son **Béla Guttmann, Helenio Herrera y Luiz Felipe Scolari**. Un hueco significa falta de corroboración en esta investigación.

## Criterios de los datos

- **Cantera:** último club juvenil documentado antes del paso al fútbol profesional. Se usa el nombre exacto de `clubes.csv` cuando existe; para los demás, su nombre habitual. El país indica la ubicación del club con la denominación territorial actual; se distinguen Inglaterra, Escocia y Gales. Las fronteras históricas requieren un tratamiento posterior.
- **Llegada:** año documentado de incorporación a esa cantera. Los intervalos con inicio desconocido, como `0000–2018` o `–1963`, quedan pendientes.
- **Debut:** primer partido **oficial del primer equipo del club de formación**, según la aclaración de Anthony. Por ejemplo: Messi, Barcelona, 2000, 2004; Raúl González Blanco, Real Madrid, 1992, 1994; Cristiano Ronaldo, Sporting de Portugal, 1997, 2002. Contrato, filial, amistoso, primera titularidad y regreso al club se revisan por separado. Una temporada como `1997–98` requiere corroborar el año natural del partido.
- **Huecos:** conservan la misma clave exacta de jugador y nacimiento, añaden `motivo` y `nacimiento_fuente`, y dejan el debut sin rellenar. Incluyen fechas no corroboradas, discrepancias de nacimiento, identificaciones pendientes y referencias a debuts en otros equipos. La ausencia de un debut confirmado no demuestra que el jugador nunca debutara.
- **Selección de entrenadores:** se cuentan los triples distintos `(pais, club, año)` cubiertos por cada nombre de `entrenadores.csv`, con ambos extremos incluidos. Se evita duplicar una misma temporada de club cuando aparecen varios intervalos. Desempate por nombre literal en orden alfabético de Python. El corte de los 300 está en ocho clubes-temporada; su unión con los 45 MAESTROS da 311 nombres.
- **Períodos de relaciones:** intersección anual de las etapas documentadas del jugador o ayudante y del técnico. Se descuentan cesiones y se distinguen filiales, categorías juveniles, selecciones olímpicas y absolutas. Los cruces apoyados únicamente en un mismo año de cambio se omiten, salvo narración fechada explícita. Se mantienen los mandatos separados aunque compartan año de cambio.
- **Influencia reconocida:** `discipulo` exige palabras públicas del propio entrenador. Las tres filas proceden de testimonios de Guardiola, Klopp y Sacchi; club y fechas quedan vacíos porque esas declaraciones no delimitan un período laboral. Las otras relaciones tienen club y período.

`Artur Jorge` aparece en la entrada con nacimientos de 1946 y 1972, y `Carlos Alberto` con 1939 y 1944. Quedan pendientes: el formato de relaciones no permite distinguir esas personas. También se conserva para revisión la discrepancia de nacimiento de Roger Machado Marques y Emerson Sheik en la lista de jugadores. No se cambian las claves para forzar coincidencias.

## Fuentes

Cada fila completa enlaza sus fuentes mediante URLs separadas por ` | `. La base de consulta son las biografías de **Wikipedia**, con sus apartados de carrera juvenil, partidos de debut y trayectoria técnica. **Wikidata** se usa para identificar perfiles y corroborar el país del club (`P17`); las introducciones de los clubes permiten precisar los territorios británicos. Los archivos de entrada seleccionan las personas; no sirven por sí solos como prueba de una relación.

Se añadieron contrastes directos de [FC Barcelona](https://www.fcbarcelona.com/en/football/first-team/news/3246834/lamine-yamal-record-breaking-debut/featured), [AC Milan](https://www.acmilan.com/en/club/legends/player/paolo-maldini), [Manchester City](https://www.mancity.com/news/first-team/first-team-news/2019/december/mikel-arteta-arsenal-man-city), [Scottish FA](https://www.scottishfa.co.uk/en/news/sir-alex-remembers-unique-and-humble-stein), [FIFA](https://inside.fifa.com/de/tournaments/mens/worldcup/qatar2022/news/flick-wird-neuer-bundestrainer), [UEFA](https://www.uefa.com/uefachampionsleague/news/0251-0e99b793052b-0e2923afccd6-1000--jurgen-klopp-hoping-for-third-time-lucky-as-final-looms/), [Fluminense](https://fluminense.com.br/noticia/no-dia-16-de-outubro-de-1907-nascia-zeze-moreira), [Relevo](https://www.relevo.com/futbol/arrigo-sacchi-20240308135515-nt.html) y [Svenska Dagbladet](https://www.svd.se/a/GyPrEQ/sa-var-sven-goran-svennis-erikssons-liv). Las URLs concretas utilizadas en cada caso están en la columna `fuente`.

## Comprobación

Desde la raíz del repositorio:

```sh
python3 datos_fuente/base/canteras_y_maestros/validar.py
```

Comprueba cabeceras, claves exactas, unicidad, reparto de todos los jugadores entre completos y huecos, cronología, fuentes, alias conocidos, selección de los 300 y MAESTROS y recuentos de cobertura. La comprobación estructural complementa la revisión documental de las fuentes. Estos CSV quedan pendientes de integración por Claude.
