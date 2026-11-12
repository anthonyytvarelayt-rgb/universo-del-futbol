# Traspaso a Astra: jugadores v2 (2026-10-24)

Claude se queda sin uso unos días. Astra hace el trabajo pesado. Al volver, Claude lo revisa, lo conecta al motor y calibra.

## 1. Qué cambia (diseño acordado)
- **Capacidad histórica C (1-1000)** = columna `nivel_nuevo`. Lo bueno que llega a ser en su mejor momento, desde su rol: incluye goles y rendimiento contra rivales fuertes. Títulos solo son contexto.
- **Definición (1-100)** = columna `definicion`. Capacidad absoluta de convertir. Kane ~97 con C ~760.
- **10 atributos (1-100)** en `atributos.csv`: definición (ya va en la lista, no repetir), desmarque, pase, vision, regate, velocidad, fisico, defensa, aereo, porteria. Son la FORMA de C: dónde es bueno y dónde no. Cada uno decide una acción del partido; nada cuenta dos veces. Un especialista excepcional no debe quedar por debajo de un jugador completo sin nada brillante.
- **perfil_edad**: precoz / normal / tardio (cuándo llega a su pico).
- **Media de temporada (1-100, tipo FIFA)**: la calcula Claude, Astra NO la rellena.
- **Insignias**: no existen aún en el código. Seis familias:
  - personal (predisposición real, se activa si rinde en el juego: Mr. Champions CR7)
  - en_desarrollo (latente en un joven: Crack precoz Pelé)
  - ganable (cualquiera, por logro: Gigante de los Mundiales)
  - temporal (racha, estado de gracia, bloqueo)
  - trayectoria (leyenda del club, bandera)
  - asociacion (dos o tres jugadores juntos: Xavi-Iniesta)
  Cada insignia necesita: accion, situacion, efecto por grado (bronce/plata/oro/excepcional, en % sobre la acción), regla para ganarla y perderla, tope. Límites: máximo 2 insignias por acción, ninguna más de +15 %, sin bucles (no ayuda a ganarse a sí misma). Las constantes (Pelé 1000 goles, Mr. Champions) son insignias personales bloqueadas.
  Ejemplo Gigante de los Mundiales: ganable; tiro/regate/nota en fase final del Mundial; bronce +4 %, plata +7 %, oro +10 %, excepcional +13 % a la conversión; bronce = 4 goles o nota 7,5 en un Mundial, oro = 8 goles en dos Mundiales o 5 con título, excepcional = 12+; latente en Mbappé, Pelé, Klose, Müller, Ronaldo; no se regala el futuro.

## 2. Reglas
- `lista_para_astra.csv`: NO añadir columnas. Rellenar solo nivel_nuevo, definicion y, si hace falta, nota.
- Lo demás va en los archivos aparte de esta carpeta, unidos por nombre + nacimiento (copiar tal cual de la lista).
- Evaluar a cada jugador por separado; las categorías describen, no deciden.
- No subir ni bajar números para compensar fallos del motor.
- Cima ya fijada por Anthony: Pelé, Messi, Cristiano 1000; Maradona, Di Stéfano 950; Cruyff 920; Beckenbauer, Ronaldo 900; Mbappé, Zidane, Puskás 880. Olise por encima de Foden.
- Entregar en .csv (o .zip), con cabecera, coma como separador, UTF-8.

## 3. Orden de trabajo
1. **Muestra de 30** (primero, antes de los 1.500): rellenar lista + atributos + insignias de: Di Stéfano, Pelé, Garrincha, Puskás, Yashin, Eusébio, Beckenbauer, Cruyff, Gerd Müller, Bican, Dixie Dean, Maradona, Baresi, Van Basten, Romário, Zidane, Ronaldo, Xavi, Busquets, Messi, Cristiano, Neymar, Lewandowski, Kane, Mbappé, Haaland, Olise, Foden, un central normal de los 60 y un lateral normal de los 2000 (elige tú).
2. **Catálogo de insignias**: 40-60 en `insignias_catalogo.csv`, con las seis familias.
3. **Los 1.500**: misma forma. Si no da tiempo, priorizar por wikipedias (más alto primero).

## 4. Archivos
- `lista_para_astra.csv`: 1.500 jugadores (en este zip).
- `motor_explicado_para_astra.md`: cómo funciona el motor hoy.
- `atributos.csv`, `insignias_catalogo.csv`, `insignias_jugador.csv`: plantillas vacías con cabecera.
- Diseño completo (para Anthony): https://claude.ai/artifact/92k2W9jWNjnvSTTHMBc2Ac

## 5. Dudas abiertas (Anthony decide; si no dice nada, vale lo marcado)
- 10 atributos (marcado) o 6.
- Astra rellena atributos de los 1.500 (marcado) o solo C y definición.
- Mostrar media de temporada en la ficha (marcado: sí).
- Muestra de 30 primero (marcado: sí).
