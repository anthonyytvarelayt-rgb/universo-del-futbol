# Pedidos para DeepSeek, GPT (Astra chat) y Qwen

Copia cada texto tal cual y sube lo que devuelvan como archivo .csv (no pegado en el chat).

| Encargo | Quién | Hecho | Siguiente pedido |
| --- | --- | --- | --- |
| Primera de los otros 7 países | DeepSeek | Italia 1929-2025; Inglaterra 1930-2025 menos 1957. Hechas por mí con engsoccerdata: Alemania 1963-2024, Francia 1933-2024 (falta 1932 y 1994), Portugal 1994-2024 | Portugal 1934-1993 por décadas; luego Argentina, Brasil, Alemania 1930-1962 |
| Jugadores y carreras de España | GPT | 1930-1939 (49 jugadores) | 1930-1939 otra vez: "otros 100, de los clubes que faltan (Valencia, Español, Racing…)"; luego 1940-1949 |
| Entrenadores de España | Qwen (antes Gemini) | 1930-1939 | 1940-1949 |
| Segunda de España | DeepSeek (después de las ligas) | 1929-1935 menos 1932 y 1933 | 1932 y 1933; luego 1940-1949 |
| Clubes de España | DeepSeek | terminado | — |

## DeepSeek: Primera de los otros 7 países

Un pedido por país y década (Italia 1930-1939, Italia 1940-1949… hasta 2020-2025). Orden: Italia, Inglaterra, Alemania, Francia, Portugal, Argentina, Brasil. Cambia lo que va entre corchetes:

```
Necesito datos reales y comprobables de fútbol. País: [Italia]. Temporadas: [1930 a 1939].
Dame en un bloque CSV, sin texto alrededor, la clasificación final de la primera división de cada temporada con estas columnas exactas:
pais,temporada,division,grupo,club,posicion
- pais en español (Italia, Inglaterra, Alemania, Francia, Portugal, Argentina, Brasil).
- temporada = año en que empieza (1958 = 1958-59; en ligas de año natural, el año).
- division = 1. grupo = vacío, salvo que la liga se jugara por zonas o regiones: entonces el nombre de la zona (por ejemplo Oberliga Süd, Campeonato Paulista).
- posicion = puesto final (1 = campeón). Si no se jugó (guerra), no pongas filas de ese año.
- Usa siempre el mismo nombre para el mismo club en todas las temporadas.
- No inventes nada: si no estás seguro de una temporada, sáltala y dime al final cuáles faltan.
```

Notas por país (añádelas al final del texto cuando toque):
- Alemania: hasta 1962 no había liga nacional; pon las Oberligen (o Gauligen antes de 1945) como grupos. Desde 1963, Bundesliga. Desde 1991 entran los clubes del Este.
- Brasil: hasta 1970 pon el Campeonato Paulista y el Carioca como grupos; desde 1971, el Brasileirão.
- Argentina: año natural hasta 1984; si hay dos torneos en un año (Apertura/Clausura, Metropolitano/Nacional), pon cada uno como grupo.


## GPT (Astra chat): jugadores y carreras de España, por décadas

Ahora lo hace todo **GPT (Astra chat)**: 1930-1939, 1940-1949, … hasta 2020-2025.

Un pedido por década, cambiando lo que va entre corchetes.

```
Necesito datos reales y comprobables de fútbol. País: [España]. Década: [1930-1939].
Dame dos bloques CSV, sin texto alrededor.
Bloque 1, jugadores importantes que jugaron en la primera división de ese país en esa década (hasta 150: internacionales, figuras y titulares de los clubes grandes), con columnas exactas:
nombre,nombre_completo,nacimiento,nacionalidad,posicion,nivel_max,fuente
- nacimiento AAAA-MM-DD; posicion POR, DEF, MED o DEL.
- nivel_max de 400 a 1000 en su mejor momento: 1000 Pelé/Maradona/Messi, 900 Balón de Oro, 800 titular de una selección grande, 700 titular en Primera, 600 Primera modesta.
- fuente = enlace a su página de Wikipedia.
Bloque 2, la carrera completa de esos mismos jugadores, un club por fila:
nombre,nacimiento,club,pais,desde,hasta,partidos,goles
- desde/hasta = temporadas (año en que empieza: 1958 = 1958-59); partidos y goles de liga, vacíos si no los sabes.
- Para los clubes españoles usa estos nombres: Atlético Bilbao (Athletic Club), Real Santander (Racing), Real Gijón (Sporting), Español (Espanyol), Gerona (Girona).
- Solo jugadores que existieron de verdad y con su fecha de nacimiento real. Si dudas de un dato, déjalo vacío; si dudas del jugador, no lo pongas.
```

---

## DeepSeek (después de las ligas): Segunda División de España

Un pedido por década (1929-1939, 1940-1949, … hasta 2020-2025):

```
Necesito datos reales y comprobables de fútbol. País: España. Temporadas: [1929 a 1939].
Dame en un bloque CSV, sin texto alrededor, la clasificación final de la Segunda División de cada temporada con estas columnas exactas:
pais,temporada,division,grupo,club,posicion
- temporada = año en que empieza (1958 = 1958-59).
- division = 2. grupo = vacío si era un solo grupo; si iba por grupos, el nombre del grupo (Grupo Norte, Grupo Sur, Grupo 1…), con la posición dentro de su grupo.
- posicion = puesto final en la liga regular (1 = campeón del grupo). No pongas fases de ascenso.
- Usa estos nombres de club: Atlético Bilbao (Athletic Club), Real Santander (Racing), Real Gijón (Sporting), Español (Espanyol), Gerona (Girona). Los filiales, con su nombre y "(filial del X)", p. ej. "Castilla (filial del Real Madrid)".
- Si no se jugó, no pongas filas de ese año. No inventes nada: si no estás seguro de una temporada, sáltala y dime al final cuáles faltan.
```

---

## Qwen (antes Gemini): entrenadores de España

Un pedido por década (1930-1939, … hasta 2020-2025):

```
Necesito datos reales y comprobables de fútbol. País: España. Década: [1930-1939].
Dame en un bloque CSV, sin texto alrededor, los entrenadores de cada club de la Primera División de España en esa década, un periodo por fila, con estas columnas exactas:
nombre,nacionalidad,club,pais,desde,hasta,estilo,nota
- desde/hasta = temporadas (año en que empieza: 1958 = 1958-59). Si alguien entrenó dos veces al mismo club, dos filas.
- pais = España.
- estilo = ofensivo, equilibrado o defensivo, solo si está documentado; si no, vacío.
- nota = una frase con algo documentado de su forma de trabajar (disciplina, juego, títulos), o vacío.
- Usa estos nombres de club: Atlético Bilbao (Athletic Club), Real Santander (Racing), Real Gijón (Sporting), Español (Espanyol), Gerona (Girona).
- Solo entrenadores reales. Si dudas de un dato, déjalo vacío; si dudas de un periodo, no lo pongas.
```
