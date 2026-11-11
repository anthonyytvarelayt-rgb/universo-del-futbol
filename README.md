# Universo del fútbol

Simulador de la historia del fútbol que se juega en el navegador. Eliges una época entre 1958 y 2025 y miras otra historia: los jugadores reales aparecen en su año y su país, pero sus carreras las decide el motor.

**Jugar:** https://anthonyytvarelayt-rgb.github.io/universo-del-futbol/

## Qué tiene

- Ligas de España, Italia, Inglaterra, Alemania, Francia, Portugal, Argentina y Brasil, con el tamaño real de cada año.
- Unos 40.000 jugadores reales, con fichajes, envejecimiento y retiros.
- Copa de Europa y Liga de Campeones con fase de grupos.
- Mundial cada cuatro años con los jugadores de la partida.
- Constantes: cosas que este universo no cambia (Pelé llega a los 1000 goles, el Madrid de Di Stéfano manda, Messi y Cristiano son los mejores de su tiempo).

La partida se guarda sola en el navegador donde juegas.

## Cómo está hecho

| Carpeta | Qué hay |
| --- | --- |
| `index.html`, `css/` | La página y sus estilos |
| `js/motor.js` | El motor de partidos |
| `js/mundo.js` | Temporadas, mercado, edad, Europa, constantes y Mundial |
| `js/epoca.js` | Reglas y formatos de cada año |
| `js/mundial.js` | El torneo del Mundial |
| `js/cronica.js`, `js/app.js` | Las noticias y la pantalla |
| `datos/` | Jugadores, clubes, ligas y Mundiales |
| `herramientas/` | Programas que montan `datos/base.js` a partir de las tablas de `herramientas/datos_base/` |
| `pruebas/` | Partidas enteras sin navegador |

No hay nada que instalar ni que compilar: es un sitio de archivos sueltos.

## Probar sin navegador

```
node pruebas/partida.js 2000 25 4 "Cristiano Ronaldo" "Lionel Messi"
```

Juega 25 temporadas desde 2000 con la semilla 4 y dice quién ganó cada cosa y cuántos goles marcaron esos jugadores. Tarda unos dos segundos por temporada.
