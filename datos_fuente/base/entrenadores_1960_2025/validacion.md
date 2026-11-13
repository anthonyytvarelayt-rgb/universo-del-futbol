# Validación de la ampliación

Base de revisión: **ae33cb6** de `main`, que ya incluye la primera entrega. Comprobaciones ejecutadas el 13 de noviembre de 2026, tras montar los datos de esta ampliación.

| Comprobación | Resultado |
|---|---|
| `python3 herramientas/base.py` | Código 0; 5917 intervalos de entrenadores compilados |
| `python3 herramientas/entrenadores.py` | Código 0; 9.138/10.320 documentados, 1.182 huecos y 142 entradas con metadatos incompletos |
| `node pruebas/auditoria.js` | Código 0; «todo bien», incluidas Eurocopa y Copa América |
| `node pruebas/famosos.js` | Código 0; 113 bien, 0 mal, 0 no están |
| `node pruebas/partida.js 2000 12 7` | Código 0; doce temporadas completadas |
| Inicios reales con `Mundo.desdeBase` | Trece comprobaciones de nombre y nacimiento, desde 1961 hasta 2025; todas pasan |
| Repetir `--montar` | Mismo SHA-256 de `entrenadores.csv` antes y después |
| Comparar el JSON con ae33cb6 | Solo cambia la clave `entrenadores`; ligas, clubes, jugadores y años idénticos |
| Expandir los intervalos de origen y comparar fuera del encargo | Mismos registros y campos originales; conservados 293 intervalos exteriores, incluidos relevos de 1958–59 |
| `git diff --check` | Sin errores |
| Diferencias en `js/` frente a ae33cb6 | Ninguna; versión de guardado intacta |

## Salida de la partida pedida

```text
Mundial 2002: Brasil (final ante Italia), goleador Raúl con 7
Mundial 2006: Italia (final ante España), goleador Michael Owen con 7
Mundial 2010: Argentina (final ante Uruguay), goleador Cristiano Ronaldo con 7
Ligas de España: Barcelona 7, Real Madrid 5
Copas de Europa: Juventus 4, Real Madrid 4, Bayern Múnich 1, Liverpool 1, Barcelona 1, Manchester United 1
```

Estos son resultados observados de la semilla solicitada; no se fuerza ningún campeón mediante los CSV de entrenadores. Al cambiar los datos puede cambiar el resultado de una partida reconstruida. La versión de guardado debe coordinarla Claude antes de publicar.

## Integración de nombres y nacimientos

Se cargó la base mediante el mismo cargador de las pruebas (`pruebas/cargar.js`), se creó cada inicio con `Mundo.desdeBase(BASE, año)` y se comprobó con `assert.equal` el nombre y el nacimiento del primer entrenador de los trece clubes siguientes:

```text
1961 Portugal: Académica → Alberto Gomes (1915)
1969 Inglaterra: Manchester United → Wilf McGuinness (1937)
1982 Portugal: Sporting de Portugal → António Oliveira (1952)
1988 Italia: Sampdoria → Vujadin Boškov (1931)
1998 Italia: Fiorentina → Giovanni Trapattoni (1939)
2011 España: Atlético Madrid → Gregorio Manzano (1956)
2011 Italia: Inter → Gian Piero Gasperini (1958)
2015 Inglaterra: Arsenal → Arsène Wenger (1949)
2015 Argentina: Arsenal de Sarandí → Martín Palermo (1973)
2021 Brasil: Santos → Marcelo Fernandes (1971)
2022 Brasil: Cuiabá → Luiz Fernando Iubel (1989)
2024 Brasil: Cuiabá → António Oliveira (1982)
2025 Brasil: Sport → Pepa (1980)
```

La prueba distingue la primera jornada cronológica de la numerada como 1 en los cursos con huelga, y no traslada el nacimiento de António Oliveira de 1952 al de 1982. También conserva la separación de los dos Arsenal publicada en `main`.

`herramientas/entrenadores.py` valida además los homónimos de Riopele 1977, Nacional 1989 y Feirense 1977, cuyos nacimientos se dejan vacíos; la identidad de Alberto Gomes de Académica 1961; las direcciones compartidas sin nombres compuestos ficticios; y las correspondencias entre fuente, CSV montado y archivo compilado. El control de edad aparta fichas menores de 22 años hasta corroborar una eventual excepción; cinco asignaciones argentinas se retiraron por identidad o rol sin confirmar. La nacionalidad de João Pedro Sousa se comprueba como portuguesa, sin deducirla de su nacimiento en Luanda. No consulta la red.

## Alcance

Las pruebas comprueban la integridad de la compilación y que el juego sigue ejecutándose. **No certifican la exactitud histórica de cada fuente**. Los 1.182 huecos, 142 filas personales incompletas y 269 diferencias del contraste BDFutbol se conservan explícitos. De esas diferencias, muchas son nominales, de licencia, de fecha o de dirección compartida; no se presentan como errores confirmados.

Portugal está documentado desde 1970 y Brasil desde 2020 dentro del universo del archivo. No se declaran jugables las tres ligas de 2025–26 que faltan en `ligas.csv`, aunque se entregan sus 54 entrenadores. Las 31 discrepancias de participantes portugueses de los años sesenta se documentan sin modificar competiciones.

La ampliación se entrega en borrador y no se presenta como cobertura histórica completa.
