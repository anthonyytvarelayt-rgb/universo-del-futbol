// Mide casos que sí suceden durante la partida y verifica que las crónicas se apoyen en sus datos.
const assert = require('node:assert/strict');
const { Mundo, BASE } = require('./cargar');
require('./dinamica');
const args = process.argv.slice(2).map(Number);
const recorridos = args.length ? Array.from({ length: args.length / 2 }, (_, i) => args.slice(2 * i, 2 * i + 2)) : [[1958, 6], [2000, 7], [2018, 4]];
const casos = {}, ejemplos = {}, cuenta = (tipo, dato, n = 1) => {
  casos[tipo] = (casos[tipo] || 0) + n;
  if (!ejemplos[tipo]) ejemplos[tipo] = dato;
};
let jugadas = 0;
for (const [inicio, temporadas] of recorridos) {
  assert.ok(temporadas >= 1 && inicio >= 1958);
  Mundo.partida(Mundo.desdeBase(BASE, inicio), {
    semilla: 7, temporadas,
    alAvanzar(V, M) {
      jugadas++;
      const mov = V.mercado.filter((x) => x.tipo === 'fichaje');
      const ids = new Set(mov.map((f) => JSON.stringify([f.jugador, f.edad])));
      assert.equal(ids.size, mov.length, 'Fichaje doble tras el mercado');
      for (const f of mov) {
        if (f.reemplaza != null) {
          const origen = V.mercado[f.reemplaza];
          assert.ok(origen && origen.de === f.a && origen.pos === f.pos && origen.tipo === 'fichaje');
          cuenta('cadena', f);
        }
        if (f.reputacion) cuenta('reputacion', f);
      }
      const tv = new Map(), clubes = new Map(M.clubes.map((c) => [c.nombre, c]));
      for (const c of V.finanzas) {
        assert.ok(Number.isFinite(c.caja + c.gastos + c.tv + c.continental + c.gastoContinental));
        assert.ok(c.reserva >= 0 && c.reserva <= Math.max(0, c.caja), 'Reserva fuera de la caja');
        tv.set(c.pais, (tv.get(c.pais) || 0) + c.tv);
        if (c.tv) cuenta('television', { club: c.club, pais: c.pais, tv: c.tv });
        if (c.reserva) cuenta('reserva', { club: c.club, reserva: c.reserva });
        if (c.partidosContinental) {
          assert.ok(c.continental >= 0 && c.gastoContinental >= 0);
          cuenta('carga', { club: c.club, pj: c.partidosContinental, ingresos: c.continental, coste: c.gastoContinental });
        }
      }
      for (const [pais, diferencia] of tv) assert.ok(Math.abs(diferencia) < 0.2, `El fondo de ${pais} no se conserva (redondeo)`);
      for (const x of V.dinamica) {
        cuenta(x.tipo, x);
        if (x.tipo === 'sucesion') {
          assert.ok(mov.some((f) => f.jugador === x.sustituto && f.a === x.club && f.pos === 'POR'));
          assert.ok(clubes.get(x.club).jugadores.some((j) => j.n === x.titular && j.pos === 'POR'));
        }
        if (x.tipo === 'regreso') assert.ok(V.mercado.some((f) => f.jugador === x.jugador && f.a === x.club &&
          (x.desde ? f.tipo === 'fichaje' && f.de === x.desde : f.tipo === 'libre' && f.de === 'sin club')));
        if (x.tipo === 'prioridad') assert.notEqual(x.pedida, x.comprada);
        if (x.tipo === 'vestuario') assert.ok(x.afectados.length >= 2);
      }
      for (const copa of [V.R.MU, V.R.EURO].concat(V.R.AMERICA || []).filter(Boolean)) {
        for (const g of copa.relevosGeneracion || []) cuenta('generacion', g);
      }
      for (const copa of [V.R.EU, V.R.LIB].filter(Boolean)) {
        const balance = V.objetivos.find((x) => x.club === copa.campeon);
        if (balance) assert.equal(balance.balance, 'superado');
      }
      console.log(V.temporada, V.campeon, V.europa || '—', Object.keys(casos).map((k) => `${k}:${casos[k]}`).join(' '));
    }
  });
}
console.log(JSON.stringify({ jugadas, casos, ejemplos }, null, 2));
