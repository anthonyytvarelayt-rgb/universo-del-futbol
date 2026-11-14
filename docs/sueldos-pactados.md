# Sueldos pactados

Paso 4 sobre `2889ca2`. La versión de guardado pasa de 68 a 69: las decisiones de mercado cambian y las partidas anteriores no se reconstruyen con esta versión. Entrega para revisión de Claude, sin fusionar.

## Reglas

- `sueldo(j)` conserva su significado anterior: demanda salarial, en unidades de presupuesto. `j.salario` guarda el importe anual firmado, en millones de euros nominales de la simulación. `salarioAnio` y `salarioNivel` recuerdan cuándo y a qué nivel firmó. `j.contrato` conserva el vencimiento.
- La cantidad nominal no cambia por edad, rendimiento, deseo ni inflación. Se pacta otra al fichar o renovar. Al empezar se distribuyen los vencimientos entre dos y cinco años sin añadir sorteos.
- Cesión, regreso y subida del filial conservan sueldo y vencimiento. Durante una cesión, el club que tiene al jugador paga el sueldo completo. Los libres y debutantes firman al incorporarse.
- Las cuentas capturan la nómina antes del envejecimiento y los retiros del verano. Pagar lo firmado incluye a quien se retira al terminar. Los otros gastos nunca son negativos; se mantienen los estabilizadores económicos existentes.
- Un joven de hasta 25 años, con al menos 900 minutos, nivel visible mínimo 580, progreso mínimo de 45 puntos desde la firma y demanda al menos un 50 % mayor puede pedir mejorar el contrato. Se tramita una petición por club y verano. Se acepta si cabe en la nómina y la caja; si no, queda pendiente, con revisión como pronto dos años después. Un fichaje o nueva firma resuelve la petición anterior.
- Antes de Bosman los contratos vencidos se renuevan en el mismo club; después se conserva el sistema existente de decisiones y salidas gratuitas.
- Desde 1992, un club que venía jugando en Europa, pierde toda clasificación continental y mantiene una nómina superior al 85 % de su presupuesto recibe un objetivo salarial del 85 % durante la temporada siguiente. Se calculan las plazas de las competiciones existentes, incluida UEFA y Recopa. No se resta retrospectivamente dinero ya ingresado.
- El mercado reconoce lo que se paga de verdad. Busca hasta dos ventas adicionales para un ajuste continental pendiente, respetando constantes, rivalidades, puestos, cupos y capacidad de pago del comprador. Si no hay comprador válido, la obligación continúa y la noticia lo explica. No se cancelan contratos para cuadrar el presupuesto.

Los hechos quedan en `resumen.sueldos`: peticiones, renovaciones destacadas, veteranos caros y ajustes continentales con ventas y nómina final. La interfaz reutiliza esos hechos para noticias, declaraciones y texto exportado. Las fichas muestran sueldo firmado, demanda actual, firma y vencimiento; abrirlas no modifica el mundo.

## Comparación de equilibrio

Mismas semillas y datos antes/después; doce temporadas por partida. «Grandes» observados: Real Madrid, Barcelona, Milan, Inter, Juventus, Bayern Múnich, Manchester United, Liverpool, Chelsea, Arsenal, Boca Juniors y River Plate.

| Inicio / semilla | Campeones de liga española, antes → después | Campeones europeos distintos, antes → después | Refinanciaciones de grandes, antes → después |
| --- | --- | --- | --- |
| 1958 / 5 | Bilbao 4, Barcelona 5, Madrid 3 → Bilbao 4, Barcelona 3, Madrid 5 | 3 → 7 | 0 → 0 |
| 2000 / 7 | Madrid 10, Barcelona 2 → Madrid 5, Barcelona 7 | 7 → 6 | 0 → 0 |

No hubo cajas no finitas ni otros gastos negativos. Son dos muestras concretas: permiten comparar el cambio, no garantizan el equilibrio de todas las semillas ni de partidas ilimitadas. En 1958 Europa todavía conserva una concentración histórica; esta entrega no recalibra las competiciones.

## Comprobaciones

- `node --check js/mundo.js` y `node --check js/app.js`.
- `node pruebas/sueldos.js`, incorporada a la auditoría: persistencia nominal, inicio de contratos, renovación, peticiones con y sin minutos, falta de caja, nóminas, retiros y clasificación europea.
- `node pruebas/auditoria.js`, `node pruebas/famosos.js`.
- `node pruebas/partida.js 1958 12 5` y `node pruebas/partida.js 2000 12 7`.
- Navegador: dos temporadas desde 1958 verificadas, con ficha, controles manuales y contrato idéntico tras recargar. La prueba desde 2000 y sus capturas están pendientes al abrir el borrador del PR.

No se modifican `js/motor.js`, datos ni reglas de `CLAUDE.md`. Los dibujos tácticos quedan para otro PR.
