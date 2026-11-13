# Eurocopa y Copa América

`ediciones.json` contiene las 17 Eurocopas de 1960–2024 y las 23 Copas América
de 1959–2024. Incluye participantes, sede, grupos, campeón, subcampeón,
goleadores empatados y enlaces a las fuentes. Los resultados reales son solo
referencias para la marca ≠: no intervienen al resolver partidos.

`plantillas.csv` contiene 9.465 registros jugador/edición, repartidos entre
451 selecciones/edición. No son 9.465 personas distintas. Las identidades
proceden de FootballSquads y RSSSF; los nombres y nacimientos que coinciden
con BASE se normalizan a la identidad del juego. No se inventan nacimientos.

## Rehacer los datos

Desde la raíz del repositorio:

```sh
python3 herramientas/continentales.py
node pruebas/continentales.js
```

El generador no descarga páginas ni necesita paquetes de Python. Lee los CSV,
la base y los perfiles del Mundial existentes. Escribe `datos/continentales.js`
y `cobertura.csv`. Los formatos y cuadros están en el generador para que los
resultados puedan cambiar con la partida sin modificar los grupos de origen.

Los jugadores que ya están en la partida usan su nivel actual y sus bajas.
Para los externos, el generador usa el perfil de BASE con la curva de edad
del juego; si falta, interpola los niveles de los Mundiales cercanos (hasta
cuatro años de distancia). Si tampoco existe ese perfil, asigna una
estimación de 520. Hay 943 registros con referencia del Mundial y 4.028 con
esa estimación. Estos niveles son parámetros del juego, no datos históricos
verificados ni nuevas valoraciones a mano de figuras.

## Cobertura incompleta

Todas las ediciones tienen participantes, sede, campeón, subcampeón y
goleador reales. Ninguna edición queda desactivada. Cada selección tiene al
menos once personas documentadas y un portero.

Estas ediciones usan listas y alineaciones históricas parciales, en lugar de
una convocatoria final completa con todos sus datos:

| Torneo | Ediciones |
| --- | --- |
| Eurocopa | 1960, 1964, 1968, 1972, 1976 |
| Copa América | Las dos de 1959; 1963, 1967, 1975, 1979, 1983, 1987, 1989, 1991, 1993, 1995, 1997, 1999, 2001 |

En esas listas faltan nacimientos y algunas posiciones se deducen de las
alineaciones o del perfil ya presente en la base. La Eurocopa de 1980 tiene
además dos nacimientos vacíos en la fuente: Vassilios Konstantinou y Anthimos
Kapsis. Hay 1.915 registros sin nacimiento en total. `cobertura.csv` da los
recuentos por edición; un cero de nacimiento en el archivo generado significa
desconocido, no un nacimiento real en el año cero.

La selección de externos es un respaldo histórico para ligas no simuladas;
los jugadores activos de la partida pueden sustituir a los convocados reales
por nivel. Un lesionado largo o retirado no vuelve mediante ese respaldo.
El partido, la prórroga y los penaltis se resuelven con el mismo módulo del
Mundial. Como en ese módulo, la prórroga es de treinta minutos: no se modelan
el gol de oro/plata ni los criterios disciplinarios de los desempates modernos.

## Fuentes

- [RSSSF: Copa América, todas las ediciones](https://www.rsssf.org/tabless/sachampfull.html).
- [RSSSF: Eurocopas](https://www.rsssf.org/tablese/eurochamp.html).
- [FootballSquads: selecciones y convocatorias por torneo](https://www.footballsquads.co.uk/national.htm).
- [CONMEBOL: ediciones, sedes y campeones](https://copaamerica.com/es/novedades/todas-ediciones-conmebol-copa-america-campeones-sedes-mejores-jugadores).
- [UEFA: evolución del formato](https://www.uefa.com/multimediafiles/Download/competitions/General/02/63/51/33/2635133_DOWNLOAD.pdf).

Cada fila del CSV conserva su enlace de origen. Los cuadros de mejores
terceros de las Eurocopas de 24 equipos y de la Copa América 2019 siguen sus
tablas de asignación; las Copas América anteriores que asignaban por puesto
en la tabla de terceros conservan ese orden.
