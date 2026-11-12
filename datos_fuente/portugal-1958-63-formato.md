# Portugal 1958-59 a 1962-63: datos y reglas

## Archivos (todos en `datos/`)

| Archivo | Qué tiene |
| --- | --- |
| `portugal-1958-59-plantillas.csv` | 661 jugadores, 22-23 por club: Primeira Divisão (14 clubes, 309) y Segunda Divisão (16 clubes, 352). Columnas de España más `ficticio` (sí/no). **Solo 92 son reales**; 569 son inventados (Anthony lo eligió el 2026-10-23 porque no hay fuente accesible con las plantillas completas). |
| `portugal-clubes-1958-59.csv` | 39 clubes (los 30 de liga y los que suben o juegan la Taça después): ciudad, estadio de 1958, dos colores y prestigio. |
| `portugal-entrenadores-1958-59.csv` | Entrenadores reales de 5 clubes (Benfica, Oporto, Sporting, Belenenses, Braga). Del resto no hay dato. |
| `portugal-debutantes-1959-63.csv` | 50 jugadores reales que entran de 1959-60 a 1962-63 (41 cantera, 5 extranjeros, 4 que vuelven), casi todos en Benfica, Oporto y Sporting. Incluye a Eusébio (Benfica, 1960). Mismas columnas que Italia. |
| `portugal-ascensos-1959-63.csv` | Ascensos y descensos reales entre Primeira y Segunda de cada temporada, con datos del club. |
| `portugal-taca-1958-59-partidos.csv` | Los 49 partidos reales de la Taça de Portugal 1958-59 (ida y vuelta hasta semifinales; final Benfica 1-0 Oporto). |
| `scripts-portugal-1958-63/` | Scripts usados. Necesitan las páginas descargadas (no se pueden volver a ejecutar tal cual). |

## Cómo se hizo

- **Fuentes:** zerozero.pt (la única con todo) bloquea a la nube; ForaDeJogo ya no existe; Transfermarkt casi no tiene Portugal 1958. Se usó Wikipedia en inglés y portugués (fichas de jugador: años y partidos en cada club, selección), footballdatabase.eu (plantillas parciales de los grandes) y RSSSF (clasificaciones 1934-63). La Taça viene de la Wikipedia alemana.
- **Reales por club:** Sporting 23, Benfica 19, Oporto 16, Belenenses 6, Lusitano de Évora 6, Vitória de Setúbal 4, Académica 4, los demás 1-3. En Segunda solo 4 reales.
- **Partidos y goles (`liga`):** media por temporada de su etapa en el club según Wikipedia (no el dato exacto de 1958-59). Sin dato: 13 partidos.
- **Ficticios:** nombres portugueses comunes, edad 19-31, reparto de partidos para que cada club sume unos 26 × 11; nivel con la misma fórmula (sin internacionalidades) y techo con poco margen. Columna `ficticio = sí`.
- **Prestigio de clubes:** mismo método que España e Italia con el historial 1934-58 (ligas, Liga experimental 1935-38 a la mitad, Campeonato de Portugal 1922-38 y Taça, subcampeonatos, terceros, temporadas en Primeira y últimas cinco temporadas). Escala raíz cuadrada 250-860: Sporting 860, Benfica 849, Oporto 715, Belenenses 637, Académica 444 … Caldas 313; mínimo 300 para Segunda.
- **Nivel y techo:** la fórmula de España; las internacionalidades previas se reparten por años (1953-58). Techo con sus temporadas de titular 1959-72 según el club. Ajuste a mano: Eusébio 780/960 (debutante).
- **Mismo nombre que en la Copa de Europa:** se usa el nombre del CSV de la Copa cuando coincide la fecha de nacimiento (p. ej. "Coluna", "Águas", "Hernâni").
- **Jugadores que ya existen en otro país:** Seminario (Sporting 1959) ya está en Italia: la nota dice traspasar, no crear.

## Reglas de la época

- Primeira: 14 clubes, 26 jornadas, 2 puntos por victoria.
- Segunda real: dos zonas (Norte y Sur) de 14 y final entre campeones (1958-59: Atlético CP 3-0 Leixões). Aquí van los **16 clubes confirmados** en una sola liga; el resto de participantes no se pudo confirmar.
- Ascensos y descensos reales (ver CSV): 1958-59 suben 3 (Atlético, Leixões, Boavista) y bajan 3 (Barreirense, Caldas, Torreense); 1959-60 y 1960-61 dos y dos; 1961-62 tres y tres.
- Taça de Portugal: eliminatorias a ida y vuelta (con desempate si hace falta) hasta semifinales, final a partido único en el Estádio Nacional. En 1958-59 entran 12 de Primeira, 12 de Segunda y 2 de las islas o colonias (Marítimo y Ferroviário de Lourenço Marques, desde cuartos).
