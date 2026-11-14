# Cobertura real del inicio de partida, 1958-2025

Inventario del juego en `bf22a8f`: 68 años, 544 filas de país/año y 10771 filas de club/año. Se construye cada mundo de inicio sin jugar partidos ni cambiar la base. Los CSV contienen recuentos exactos, sin redondear porcentajes.

- `pais_y_anio.csv`: clubes del nivel 1, plantillas con al menos once jugadores reales, clubes sin ningún jugador real, sin portero real, con entrenador y total de jugadores de relleno.
- `club_y_anio.csv`: detalle por club; permite localizar cada hueco.
- `por_decada.csv`: suma de clubes-temporada por país y década, con cobertura de once real, portero y entrenador.

Estos son los clubes que construye el motor, no una certificación de las clasificaciones históricas. Alemania en 1958 incluye ligas regionales; Brasil también puede incluir grupos regionales. Cuando faltan ligas de un año, el motor puede utilizar clubes de un año anterior. Tener once jugadores reales no garantiza que estén cubiertas todas las posiciones; por eso el portero tiene una columna independiente.

## Algunos resultados que orientan el trabajo

| País, década | Clubes-temporada | Con once real | Sin portero real | Con entrenador |
| --- | ---: | ---: | ---: | ---: |
| España, 1980-89 | 186 | 133 | 30 | 186 |
| Italia, 1980-89 | 164 | 164 | 7 | 164 |
| Inglaterra, 1980-89 | 216 | 216 | 1 | 216 |
| Portugal, 1980-89 | 170 | 49 | 70 | 170 |
| Argentina, 1980-89 | 194 | 72 | 59 | 99 |
| Brasil, 1980-89 | 194 | 53 | 96 | 64 |
| Brasil, 2020-25 | 120 | 86 | 36 | 120 |

En 2025 siguen sin jugadores reales Estrela da Amadora, AVS, Barracas Central y Mirassol. Bayern, Lazio y otros clubes tienen suficientes jugadores de campo pero carecen de un portero real al construir la plantilla. Son huecos distintos y requieren fuentes distintas.

## Propuestas documentadas de porteros para 2025

En [datos_fuente/base/revision_porteros_2025](../../datos_fuente/base/revision_porteros_2025/README.md) hay seis pasos contrastados de jugadores existentes y siete jugadores ausentes con fuentes. Son propuestas pendientes de integración.

`impacto-propuestas.json` aplica **solo los seis pasos existentes a una copia en memoria**, con nombres y nacimientos exactos. Comprueba que los porteros aparecen en los clubes esperados. No modifica `datos/base.js` ni afirma que la corrección esté publicada. No se asignan niveles ni estadísticas nuevas.

Reproducción:

```sh
node pruebas/cobertura-inicios.js /tmp/cobertura.json --todos
python3 herramientas/revisar_porteros_2025.py
```

El primer comando puede tardar varios minutos. El segundo valida las seis identidades existentes, las siete ausencias y los nombres de club, y muestra el efecto de los pasos propuestos sobre el inicio de 2025. Si la base cambia, se deben revisar los resultados y las ausencias.
