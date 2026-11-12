# España: Primera División, 1930–2026

Entrega completa de las clasificaciones finales de España desde 1930–31 hasta 2025–26: **93 temporadas disputadas, 1.622 filas y 63 clubes distintos**. No falta ninguna temporada disputada del intervalo. Este paquete amplía y contiene el bloque 1930–1939 entregado anteriormente.

## Qué importar

`ligas_espana_1930_2026.csv` es el consolidado. Tiene exactamente estas columnas:

```text
pais,temporada,division,grupo,club,posicion
```

Los diez CSV por década son particiones del consolidado. Importar **el consolidado o las particiones**, nunca ambos, para evitar duplicados. UTF-8, separador coma, sin BOM. `temporada` es el año inicial de la edición. Por ello, la edición terminada en 2026 se registra como `2025`.

1936–37, 1937–38 y 1938–39 no se disputaron y no tienen filas. La edición 2026–27 está en curso a la fecha de revisión, 23 de octubre de 2026: se registra su estado en `cobertura.csv`, sin inventar posiciones finales ni usar la tabla provisional como definitiva. El paquete no proporciona todavía los participantes de esa edición.

## Archivos auxiliares

- `cobertura.csv`: estado de cada temporada, número de clubes, campeón y URL de la fuente de la clasificación.
- `equivalencias_clubes.csv`: cada variante encontrada en las fuentes y la clave utilizada en el CSV.
- `clubes_sin_ficha.csv`: 20 identidades ausentes del base.json recibido. Es una lista de pendientes, no una tabla clubes.csv completa. Ciudad, colores, fundación y estadio requieren recopilación posterior.
- `validacion.json`: recuentos y resultados de la revisión estructural.
- `validar.py`: comprobación reproducible, sin dependencias externas. Ejecutar `python3 validar.py` desde cualquier directorio.

## Fuentes y alcance del contraste

Clasificaciones: Rec.Sport.Soccer Statistics Foundation (RSSSF). Para 1930–1999 se utilizaron los archivos históricos por décadas, preparados por José Vicente Tejedor Carnicero. Para 2000–2025 se utilizaron las páginas de cada edición. Las URLs exactas están asociadas a cada temporada en `cobertura.csv`.

Índice: https://www.rsssf.org/tabless/spanhist.html

Los 93 campeones se cruzaron automáticamente con el documento de palmarés https://www.rsssf.org/tabless/spanchamp.html . Es otro documento de la misma organización, no una verificación independiente de toda la tabla. La revisión estructural no demuestra por sí sola la exactitud histórica de cada puesto.

Para 1986–87 se consultó además la explicación del área de historia del Cádiz CF: https://www.cadizcf.com/noticias/resena-historica-la-liguilla-de-la-muerte . Para el cierre de 2025–26 se consultaron https://www.rsssf.org/tabless/span2026.html y https://en.wikipedia.org/wiki/2025%E2%80%9326_in_Spanish_football . Estado actual de la competición: https://www.laliga.com/en-GB/laliga-easports/standing . Consulta: 23 de octubre de 2026.

## Identidades y compatibilidad

Se mantienen las claves de la base entregada: Athletic Club → `Atlético Bilbao`, Racing → `Real Santander`, Sporting → `Real Gijón`, Espanyol → `Español`, Girona → `Gerona`. Son claves estables; no indican el nombre oficial usado en cada época. Donostia se agrupa con Real Sociedad y Atlético Aviación con Atlético Madrid. El Alicante CF de 1941–42 corresponde al cambio de nombre de Hércules documentado por la fuente; se normaliza únicamente en ese contexto.

No se fusionan entidades diferentes: `Málaga` conserva la identidad de CD Málaga de la base y `Málaga CF` es otra clave. `AD Almería` y `UD Almería` se mantienen separadas del `Atlético Almería` preexistente. `Real Burgos` es distinto de `Burgos`. El Condal conserva la clave heredada `Condal (filial del Barcelona)` por compatibilidad; ese texto no debe usarse para inferir automáticamente su condición de filial en todas las temporadas históricas.

Si Opus decide modernizar las claves, debe hacerlo conjuntamente en clubes, ligas, jugadores/carreras y cualquier referencia del motor.

## Formatos que el motor debe tratar

- Tamaños: 10, 12, 14, 16, 18, 20 y 22 equipos según la temporada. Se comprobó el número esperado en todas las ediciones.
- 1986–87: se conserva la clasificación final por los tres grupos tras 44 partidos, en puestos nacionales 1–18. No se utiliza la clasificación de la primera fase. El campo grupo queda vacío porque no eran zonas geográficas y se suministra una clasificación nacional consolidada. Cádiz figura 18.º y Racing 17.º, pero **descendió Racing tras una liguilla adicional**. No deducir mecánicamente el descenso de esa temporada a partir del último puesto.
- 1995–96 y 1996–97: 22 clubes; desde 1997–98, 20.
- Puestos empatados a puntos se conservan en el orden publicado. No se reordenaron por diferencia de goles.

## Revisión ejecutada e integración

Se verificaron las seis columnas, el intervalo completo de temporadas, los tamaños por época, los puestos consecutivos sin repeticiones, un campeón por edición, los nombres sin duplicar por temporada y las equivalencias de identidad. Durante la extracción también se comprobaron los partidos jugados y que victorias + empates + derrotas coincidieran con ese total, para detectar errores al separar nombres y cifras. Esas estadísticas no se incorporan al CSV solicitado.

El ZIP original y el motor no se han modificado. La entrega no incluye jugadores, carreras ni fichas completas de clubes, y no implica que ya se pueda jugar 1930–2026.

Para integrar: combinar por `(pais,temporada,division,grupo,club)`, completar/actualizar la posición de filas existentes, insertar las faltantes y conservar otras divisiones y países. El CSV existente tiene una columna adicional `nota`: preservarla al actualizar filas y usarla vacía en las nuevas. No reemplazar todo `datos/base/ligas.csv` por el consolidado español ni añadir de nuevo el bloque 1930–1939. Resolver las fichas pendientes, regenerar base.json y probar los cambios de formato y años sin competición.

El ámbito de esta entrega es **ligas.csv de España**. Los otros siete países, clubes.csv y jugadores/carreras no están incluidos.
