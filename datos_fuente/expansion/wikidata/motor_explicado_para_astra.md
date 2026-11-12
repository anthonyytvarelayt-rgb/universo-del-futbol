# Cómo funciona el motor del simulador (para Astra)

El motor simula cada partido como 30-40 jugadas clave. No hay atributos sueltos (velocidad, pase…): cada jugador tiene un **nivel** (1-1000) y, desde ahora, una **definición** (1-100). Todo lo demás sale de ahí, de su puesto y del contexto.

## 0. Escala interna
El nivel que ves (1-1000) se traduce a un valor interno que crece más deprisa arriba, para que cada punto pese más cuanto más alto estás:

| Nivel | 100 | 230 | 380 | 450 | 520 | 580 | 630 | 690 | 760 | 850 | 950 | 1000 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Interno | 250 | 434 | 575 | 664 | 758 | 824 | 871 | 920 | 970 | 1040 | 1130 | 1180 |

Todas las fórmulas de abajo usan el valor interno (V).

## 1. Dónde interviene el NIVEL
**a) Fuerza del equipo.** Se elige un once (1 POR, 4 DEF, 3 MED, 3 DEL, los mejores de cada puesto) y se calculan tres medias:
- ataque = 0,50·DEL + 0,35·MED + 0,15·DEF
- defensa = 0,45·DEF + 0,30·MED + 0,25·POR
- creación = 0,55·MED + 0,30·DEL + 0,15·DEF

**b) Cuántas ocasiones tiene cada equipo.** ocasiones ≈ 8,6 × e^(0,35·(creación propia − defensa rival)/380) × factor de época, ± azar. Un equipo 100 puntos internos mejor crea ~10 % más ocasiones.

**c) Si la ocasión acaba en tiro.** p(tiro) = 0,8 × sigmoide((ataque − defensa rival)/380 + ventaja de local).

**d) Quién protagoniza cada jugada.** Se sortea entre los once con peso = peso del puesto × (V/700)². Un jugador de V 1180 (Messi) pesa ~2,8; uno de V 870 pesa ~1,5. Así las figuras acaparan las jugadas.
Peso del puesto para TIRAR: delantero centro 1,0 · extremo 0,55 · medio 0,45 · defensa 0,08 · portero 0.

**e) Si el tiro es gol.** p(gol) = 0,52 × sigmoide((V tirador − V portero)/380 + 0,2·ln(definición)).

**f) Regates, pases, cortes.** Regate: sigmoide((V regateador − V defensor)/380 + 0,2). Acierto de pase según puesto, época y (V − defensa rival)/3500.

**g) Nota del partido** (0-10) según puesto: goles, asistencias, regates, pases, cortes, paradas.

## 2. Dónde interviene la DEFINICIÓN
Hasta hoy la definición sale sola de los goles reales por partido de cada jugador, comparados con lo normal de su puesto (DEL 0,45 goles/partido, MED 0,15, DEF 0,04), y queda como un factor de 0,75 a 1,4 (1 = normal). Con tu columna 1-100, 50 equivaldrá a 1,0, 100 a ~1,4 y 1 a ~0,75.

Actúa en DOS sitios:
1. **Quién tira:** el peso para ser el tirador se multiplica por √definición. Un 1,4 tira ~18 % más que uno normal.
2. **Convertir:** suma 0,2·ln(definición) dentro de la sigmoide del gol.

No cambia la fuerza del equipo ni cuántas ocasiones hay. Pesa "a medias" a propósito: los goles reales ya llevan dentro lo bueno que era su equipo y lo floja que era su liga, y eso el motor ya lo pone aparte.

## 3. Otros factores
- **Puesto:** pesos distintos para tirar, pasar, regatear, cortar, cabecear y sacar faltas.
- **Compañeros:** cuantas más ocasiones crea el equipo, más tiros tiene el delantero. Un goleador en un equipo dominante marca mucho más.
- **Rival:** su defensa y su portero.
- **Táctica:** cada equipo es ofensivo, equilibrado, defensivo o de contragolpe, según su fuerza frente al resto de la liga. Cada liga tiene además su carácter (más o menos goles).
- **Local:** ventaja que baja con la época (1958 = 1; 2020 = 0,6).
- **Época:** factor de goles (1930: 1,2 · 1958: 1 · 1975: 0,83 · 1990: 0,8 · 2026: 0,9).
- **Forma:** cada jugador tiene una forma de −80 a +80 puntos que cambia según sus notas. Cansancio: hasta −200 con el depósito vacío. Ánimo del equipo por rachas.
- **Partido:** forma del día del equipo (azar ±55), derbis (más tensión y sorpresa), expulsiones, lesiones y cambios según la época.
- **Edad:** curva propia por jugador (precoz, normal o tardío; físico, técnica y cabeza envejecen a distinto ritmo). El nivel que pides es el de su mejor momento. El motor lo baja de joven y de veterano.
- **Penaltis:** p = 0,74 + (V lanzador − V portero)/2000. Balón parado: menos dependiente del nivel.

## 4. Resultados absurdos que hemos visto
- **Fama en vez de calidad:** con la fórmula automática Morata salía por encima de Cruyff, porque se usó la fama en Wikipedia. Por eso pedimos niveles a mano.
- **Goleadores sin contexto:** Harry Kane no es tan buen futbolista como Ronaldo Nazário o Zidane, pero mete 40-50 por temporada. Si solo hubiera nivel, para que marcara eso habría que subirle a ~850 y jugaría como una leyenda en todo lo demás. Con la definición separada: nivel ~760 y definición ~97. Lo mismo pasa con Lewandowski, Gerd Müller, Bican o Dixie Dean.
- **Calibración en pruebas:**
  - 1958-59, España: con la escala nueva Di Stéfano llegó una vez a 53 goles en 46 partidos (todas las competiciones); en la realidad fueron ~23 en Liga.
  - Uwe Seeler llegó a 50 en 30 partidos de la Oberliga Nord.
  - Una vez Kopa salió mejor jugador que Di Stéfano.
- **Objetivos de goles por temporada en liga:** ~1000 = 40-60 · ~800 = 30-40 · ~600 = 20-30 · titular normal (~420) = 8-12 · goleador nato de ~600 en un equipo dominante = 40-50.
