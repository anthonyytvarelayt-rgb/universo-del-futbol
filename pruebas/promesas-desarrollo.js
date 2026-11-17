const assert = require('node:assert/strict');
const { Motor, Mundo, BASE } = require('./cargar');

const temporadas = [2000, 2001, 2002].map((anio, i) => ({
  temporada: Mundo.temporadaTxt(anio), partidosClub: 40, baja: 0, min: 720 + 180 * i, niv: 717 + i * 5
}));
const joven = { n: 'Promesa de prueba', tec: 924, tecReal: 924, niv: 727, carrera: temporadas };
const evaluar = (extra = {}, edad = 23) => Mundo.desarrolloJoven({ ...joven, ...extra }, edad);
assert.deepEqual(evaluar(), { tipo: 'desarrollo-lento', temporadas: 3, porcentaje: 25 });
assert.equal(evaluar({ carrera: temporadas.slice(1) }), null, 'Dos temporadas no bastan');
assert.equal(evaluar({}, 20), null, 'No etiquetar a un adolescente');
assert.equal(evaluar({ carrera: temporadas.map((x, i) => i === 1 ? { ...x, baja: 12 } : x) }), null);
assert.equal(evaluar({ carrera: temporadas.map((x, i) => i === 2 ? { ...x, lesionLarga: true } : x) }), null);
assert.equal(evaluar({ carrera: temporadas.map((x, i) => i === 1 ? { ...x, partidosClub: 0 } : x) }), null);
assert.equal(evaluar({ carrera: temporadas.map((x, i) => i === 0 ? { ...x, temporada: '1999-00' } : x) }), null);
assert.equal(evaluar({ carrera: temporadas.map((x, i) => i === 2 ? { ...x, niv: 765 } : x) }), null);
assert.equal(evaluar({ carrera: temporadas.map((x, i) => i === 2 ? { ...x, min: 1300 } : x) }), null);
assert.equal(evaluar({ frenoFormacion: true }), null, 'No repetir el aviso estando activo');
assert.equal(evaluar({ tecReal: Motor.escala.interno(780) }), null);
assert.deepEqual(evaluar({
  frenoFormacion: true, carrera: temporadas.map((x, i) => i === 2 ? { ...x, min: 2250 } : x)
}), { tipo: 'desarrollo-reactivado' });
assert.deepEqual(evaluar({
  frenoFormacion: true, carrera: temporadas.map((x, i) => i === 2 ? { ...x, niv: 790 } : x)
}), { tipo: 'desarrollo-reactivado' });
for (const n of ['Pelé', 'Garrincha', 'Zinedine Zidane', 'Lionel Messi']) {
  const real = BASE.jugadores.find((j) => j.n === n);
  assert.ok(real, n);
  assert.equal(evaluar({ n, tecReal: real.max }), null, n + ' no debe sufrir el castigo de formación');
}
console.log('Promesas: figuras protegidas, tres temporadas evaluables y desarrollo recuperable');
