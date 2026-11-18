// Reproduce los veranos de Seminario, Szymaniak y Chinesinho y cruza importes con las cuentas.
const assert = require('node:assert/strict');
const { BASE, Mundo } = require('./cargar.js');
let operaciones = 0;
Mundo.partida(Mundo.desdeBase(BASE, 1958), {
  semilla: 7,
  temporadas: 5,
  alAvanzar(res) {
    const destinos = new Set(), compras = new Map(), ventas = new Map();
    const suma = (mapa, club, precio) => mapa.set(club, (mapa.get(club) || 0) + precio);
    for (const f of res.mercado.filter((x) => x.tipo === 'fichaje')) {
      const ficha = JSON.stringify([f.jugador, f.edad]);
      assert.ok(!destinos.has(ficha), `${f.jugador}: más de un fichaje en el verano de ${res.anio + 1}`);
      destinos.add(ficha);
      suma(compras, f.a, f.precio);
      suma(ventas, f.de, f.precio);
      operaciones++;
    }
    for (const c of res.finanzas) {
      assert.ok(Math.abs(c.compras - (compras.get(c.club) || 0)) < 0.005, `${c.club}: compras en ${res.anio + 1}`);
      assert.ok(Math.abs(c.ventas - (ventas.get(c.club) || 0)) < 0.005, `${c.club}: ventas en ${res.anio + 1}`);
    }
  }
});
assert.ok(operaciones > 0);
console.log(`Mercado 1959–1963: ${operaciones} fichajes, sin reventas en el mismo verano y con balances conciliados`);
