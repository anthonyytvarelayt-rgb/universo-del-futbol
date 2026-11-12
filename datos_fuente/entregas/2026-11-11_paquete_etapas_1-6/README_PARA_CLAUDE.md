# Entrega Completa de Datos y Motor (Etapas 1 a 6) - Universo del Fútbol

Este paquete contiene todas las tablas CSV verificadas y el módulo de código JavaScript para integrar las Etapas 1 a 6 del plan en el repositorio `universo-del-futbol`.

## Archivos incluidos en este ZIP:

1. **`motor_etapas_1_3_6.js` (Etapas 1, 3 y 6 - Código):**
   - `POSICIONES_CORREGIDAS_FIGURAS`: Diccionario con las posiciones reales de las grandes figuras (ej. Lionel Messi -> `ED`, Cristiano Ronaldo -> `EI`).
   - `esFichajeValido(jugador, clubDestino, prestigioClubDestino)`: Filtro para bloquear fichajes irreales de figuras vigentes a clubes de bajo prestigio (evita casos como Sergio Ramos al Numancia).
   - `calcularAtributosPorFormula(jugador)`: Calcula automáticamente los 6 atributos (`ritmo`, `tiro`, `pase`, `regate`, `defensa`, `fisico`) según posición y nivel para los 40.392 jugadores de la base cuando no tienen atributos manuales.
   - `calcularImpactoPartido(jugador, contexto)`: Aplica los 6 atributos y los bonos de las insignias en el motor de simulación.
   - `ejecutarPruebasAutomaticas(jugadores, transferenciasPrueba)`: Test suite de la Etapa 1 para verificar posiciones, nacionalidades y bloqueo de traspasos absurdos.

2. **`etapa_2_y_3_figuras_1930_2026_niveles_y_atributos.csv` (Etapas 2 y 3 - 170 figuras):**
   - Columnas: `decada,nombre_jugador,nacionalidad,año_nacimiento,posicion_exacta,nivel_maximo_1000,club_referencia,notas_verificacion,ritmo_o_reflejos,tiro_o_estirada,pase_o_posicionamiento,regate_o_juego_pies,defensa_o_mando_area,fisico,insignias`
   - Incluye las figuras de 1930 a 2026 con Pelé, Messi y Cristiano en nivel 1000, sus 6 atributos (1-99) y sus insignias asignadas.

3. **`etapa_3_catalogo_insignias.csv` (Etapa 3 - 27 insignias):**
   - Columnas: `codigo_insignia,categoria,efecto_en_motor`
   - Catálogo completo de insignias ofensivas, de creación, defensivas, de mentalidad y de portero.

4. **`pedido_4_plantillas_copa_europa.csv` (Etapa 4 - 113 jugadores):**
   - Columnas: `club,pais_club,epoca_temporadas,nombre_jugador,nacionalidad,año_nacimiento,posicion,rol_historico`
   - Plantillas históricas reales de SL Benfica, Celtic FC, AFC Ajax, FC Porto y RSC Anderlecht en Copa de Europa / Champions League para eliminar jugadores de relleno.

5. **`pedido_5_entrenadores_espana_1964_2025.csv` y `pedido_5_entrenadores_7_ligas_1964_2025.csv` (Etapa 4 - 208 etapas de entrenadores):**
   - Columnas: `club,pais_liga,año_inicio,año_fin,nombre_entrenador,nacionalidad,año_nacimiento`
   - Cobertura de los banquillos históricos de España, Italia, Inglaterra, Alemania, Francia, Portugal, Argentina y Brasil (1964-2025).

6. **`etapa_4_eurocopa_copa_america_libertadores.csv` y `etapa_4_recopa_y_copa_uefa_1961_2025.csv` (Etapa 4 - Competiciones internacionales):**
   - Historial completo de campeones, subcampeones, sedes y figuras de Eurocopa (1960-2024), Copa América (1959-2024), Copa Libertadores, Recopa de Europa (1961-1999) y Copa de la UEFA / Europa League (1972-2025).

7. **`etapa_5_clasificaciones_faltantes_1930_1953.csv` y `pedido_7_plantillas_1930_1957.csv` (Etapa 5 - Épocas 1930-1957):**
   - Clasificaciones históricas de Primera División que faltaban en la base: Francia (1930-1932), Portugal (1935-1948), Argentina (1930-1949), Brasil (1930-1949) y Alemania (1930-1953), más plantillas históricas de 1930 a 1957.

8. **`etapa_6_estilos_y_personalidades.csv` (Etapa 6 - Estilos tácticos y carácter):**
   - Columnas: `tipo_entidad,nombre,estilo_o_arquetipo,efecto_en_partidos_y_carrera`
   - Estilos de juego para clubes históricos, entrenadores y los 5 arquetipos de personalidad para jugadores.
