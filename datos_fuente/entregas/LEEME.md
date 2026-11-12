# Entregas de otras IA

Cada entrega se guarda aquí tal cual llegó, en una carpeta con su fecha. Nada de aquí está dentro del juego hasta que pasa la revisión.

## 2026-11-11_paquete_etapas_1-6 (lo trajo Anthony; autor: otra IA, sin acceso al motor)

| Archivo | Veredicto | Uso |
| --- | --- | --- |
| pedido_4_plantillas_copa_europa.csv | Bueno (113 jugadores reales de Benfica, Celtic, Ajax, Oporto, Anderlecht) | Entra en el juego: sustituye relleno en esos clubes |
| pedido_5_entrenadores_*.csv | Aceptable, solo clubes grandes, con huecos | Entra para los clubes grandes |
| etapa_4_*.csv (Eurocopa, Copa América, Libertadores, Recopa, UEFA) | Útil como referencia de campeones reales | Se usará cuando existan esas competiciones |
| etapa_2_y_3_figuras…csv | No sirve tal cual: niveles inflados (Xavi 975; rompe la cima fijada por Anthony: Maradona 950, Cruyff 920…) y atributos sacados de una fórmula por puesto (66 perfiles para 180 jugadores) | Solo la posición exacta |
| etapa_3_catalogo_insignias.csv | Borrador de ideas | Punto de partida del catálogo |
| etapa_5_clasificaciones…csv | No sirve: solo 3 primeros (hace falta la tabla entera) y mezcla datos inventados (Francia no tenía liga en 1930-31; Brasil no tenía campeón nacional) | No entra |
| pedido_7_plantillas_1930_1957.csv | Muy poco (55 jugadores) | Semilla para la etapa 5 |
| etapa_6_estilos…csv | Borrador de ideas | Etapa 6 |
| motor_etapas_1_3_6.js | No se integra: no conoce el motor (escalas y nombres de campos distintos); la etapa 1 ya está hecha | Ninguno |

## 2026-11-11_chatgpt_150_figuras_1958-69 (ChatGPT, pedido 1 del plan)

150 figuras con posición exacta, secundarias y fuente por jugador. Sin año de nacimiento.
- **Posiciones: buenas.** Aplicadas a los 109 que ya están en la base (59 líneas en base/correcciones.csv: 17 cambios de puesto y el rol extremo/delantero centro). Las posiciones finas (MCO, LIB, SD…) se guardan aquí para la etapa 3; el motor hoy solo distingue POR, DEF, MED, DEL-centro y DEL-extremo.
- **Niveles: no entran.** Todos entre 885 y 1000 (Nobby Stiles 885, Di Stéfano y Cruyff 990): no usa la escala del juego ni la cima fijada por Anthony (Maradona y Di Stéfano 950, Cruyff 920, Beckenbauer 900, Puskás 880, Eusébio 860, Charlton 800, Banks 720). Sirve el orden, no el número. Hay que pedirlo otra vez con la tabla de anclas (expansion/wikidata/figuras_a_mano.csv, 777 figuras ya valoradas).
- 41 nombres no están en la base porque jugaron fuera de los 8 países (Yashin, Masopust, Spencer…): correcto; solo harían falta para Mundiales y clubes de fuera.
