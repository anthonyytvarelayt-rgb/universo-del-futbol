// Reproducción de sistemas elegidos fuera de sus propios límites de época.
// Uso: node pruebas/dibujos-epoca.js
// Sale con error mientras elegirDibujo no respete DIBUJOS[...].desde/hasta.
const { Motor } = require('./cargar.js');
let fallos = 0;
const ejemplos = [];
for (const anio of [1958, 1962, 1963, 1964, 1978, 1979, 1980, 1984, 1986, 1998, 2025]) {
  for (let i = 0; i < 100; i++) {
    // Una plantilla equilibrada permite aislar la selección por época sin datos históricos ni sorteos.
    const c = { nombre: 'Club ' + i, pais: 'España', jugadores: ['POR', ...Array(5).fill('DEF'), ...Array(5).fill('MED'), ...Array(5).fill('DEL')].map((pos, k) => ({ n: 'Jugador ' + k, pos, niv: 700 })) };
    const nombre = Motor.elegirDibujo(c, anio, 'Entrenador ' + i), d = Motor.DIBUJOS[nombre];
    if (!d || anio < d.desde || anio > d.hasta) {
      fallos++;
      if (ejemplos.length < 10) ejemplos.push({ anio, club: c.nombre, dibujo: nombre, desde: d?.desde, hasta: d?.hasta });
    }
  }
}
console.log(JSON.stringify({ elecciones: 1100, fallos, ejemplos }, null, 2));
process.exitCode = fallos ? 1 : 0;
