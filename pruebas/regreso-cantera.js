// Recorre un verano real con un veterano libre y una cantera con margen para inscribirlo.
const assert = require('node:assert/strict');
const { Mundo, BASE } = require('./cargar');
const M = Mundo.nuevoMundo(Mundo.desdeBase(BASE, 1958));
const club = M.clubes.find((c) => c.nombre === 'Real Madrid');
const V = Mundo.jugar(M, 7000);
club.jugadores.forEach((j) => { j.salario = 0.0001; });
const veterano = {
  n: 'Veterano de prueba', nacion: 'España', pos: 'DEF', nac: '1925-01-01',
  niv: 1020, tec: 1040, origen: club.nombre, carrera: [{ club: 'Otro club', temporada: '1957-58' }]
};
M.libres.push(veterano);
Mundo.verano(M, V, () => 0.99);
assert.ok(club.jugadores.includes(veterano));
assert.ok(!M.libres.includes(veterano));
assert.ok(V.mercado.some((x) => x.jugador === veterano.n && x.a === club.nombre && x.tipo === 'libre'));
assert.ok(V.dinamica.some((x) => x.tipo === 'regreso' && x.jugador === veterano.n && x.club === club.nombre && x.desde === null));
assert.equal(veterano.salario, Mundo.euros(Mundo.sueldo(veterano), 1959) * 0.84);
console.log('Regreso al origen: vuelve una sola vez con sueldo reducido, dentro del mercado de verano.');
