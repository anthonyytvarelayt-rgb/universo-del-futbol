// Los porteros son participantes de la tanda y todos tiran antes de repetir.
const assert = require('node:assert/strict');
const { Motor } = require('./cargar.js');
const equipo = (prefijo, cuantos = 11) => Array.from({ length: cuantos }, (_, i) => ({ n: prefijo + i, pos: i === 0 ? 'POR' : i < 5 ? 'DEF' : i < 8 ? 'MED' : 'DEL', niv: 700 }));
function tirosDe(A, B) {
  const turnos = []; let actual = null;
  const nv = (j) => { if (actual) actual.push(j.n); return j.niv; };
  // Todos aciertan, así la tanda recorre varias vueltas de lanzadores.
  const r = () => { if (actual?.length) turnos.push(actual); actual = []; return 0; };
  const resultado = Motor.tanda(r, A, B, nv);
  return { resultado, A: turnos.filter((_, i) => i % 2 === 0).map((x) => x[0]), B: turnos.filter((_, i) => i % 2 === 1).map((x) => x[0]) };
}
for (const cantidad of [11, 7]) {
  const A = equipo('A', cantidad), B = equipo('B', cantidad), tiros = tirosDe(A, B);
  for (const [nombre, jugadores] of [['A', A], ['B', B]]) {
    const primera = tiros[nombre].slice(0, cantidad);
    assert.equal(new Set(primera).size, cantidad, `Nadie repite antes de tirar los ${cantidad} participantes`);
    assert.deepEqual(new Set(primera), new Set(jugadores.map((j) => j.n)), 'Tiran todos los presentes, incluido el portero');
    assert.equal(tiros[nombre][cantidad], tiros[nombre][0], 'La segunda vuelta conserva el orden');
    assert.ok(tiros[nombre].every((n) => jugadores.some((j) => j.n === n)), 'Nunca lanza alguien ajeno a los presentes');
  }
  assert.notEqual(tiros.resultado[0], tiros.resultado[1]);
}
// Función pública: con un único participante, el portero sigue siendo un lanzador válido.
assert.doesNotThrow(() => tirosDe(equipo('A', 1), equipo('B', 1)));
console.log('Penaltis: porteros, turnos y participantes presentes bien');
