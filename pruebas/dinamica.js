// Regresión de los umbrales y relaciones donde los casos pueden tardar años en aparecer.
const assert = require('node:assert/strict');
const { Motor } = require('./cargar');
const D = require('../js/dinamica.js');

const j = (n, pos, niv, edad, otros = {}) => ({ n, pos, niv, nac: String(2000 - edad), ...otros });
const equipo = (nombre, jugadores) => ({ nombre, jugadores, pais: 'Inglaterra', division: 1 });
const joven = j('Joven', 'DEF', 710, 22, { inicio: { club: 'A' } });
const veterano = j('Veterano', 'POR', 800, 35, { origen: 'A' });
const rival = j('Titular joven', 'POR', 790, 23);
assert.equal(D.relevoPorteria(equipo('A', [veterano]), 2000), veterano);
assert.equal(D.relevoPorteria(equipo('A', [veterano, rival]), 2000), null);
assert.equal(D.retorno(equipo('A', [rival]), veterano, 'A', 2000, true), false);
assert.equal(D.retorno(equipo('A', []), veterano, 'A', 2000, false), false);
assert.equal(D.retorno(equipo('A', []), veterano, 'A', 2000, true), true);

for (const [jugador, tipo] of [[joven, 'jovenes'], [veterano, 'veteranos'], [{ ...joven, cedido: 'C' }, 'cedidos']]) {
  const x = D.perfilAscenso(equipo('A', [jugador]), new Map([[jugador, { min: 750 }]]), 2000);
  assert.equal(x.tipo, tipo);
}

const lista = [
  { n: 'Veterano1', pos: 'DEF', edad: 36, niv: 820 },
  { n: 'Veterano2', pos: 'DEF', edad: 33, niv: 806 },
  { n: 'Veterano3', pos: 'DEF', edad: 31, niv: 800 },
  { n: 'Cerca', pos: 'DEF', edad: 22, niv: 795 },
  { n: 'Lejos', pos: 'DEF', edad: 20, niv: 740 }
];
assert.deepEqual(D.convocados(lista, 3, 2000).map((x) => x.n), ['Veterano1', 'Veterano2', 'Cerca']);
assert.deepEqual(D.convocados(lista.filter((x) => x.n !== 'Cerca'), 3, 2000).map((x) => x.n), ['Veterano1', 'Veterano2', 'Veterano3']);
assert.equal(D.estadoGeneracion([['Defensa', 'DEF', 795, 1, 23]], { DEF: ['Veterano1', 'Veterano2', 'Veterano3'] }).cambios[0].salidas.length, 3);
const rico = equipo('Rico', []), medio = equipo('Medio', []), ascendido = equipo('Ascendido', []);
ascendido.division = 2;
const ing = (c) => c === rico ? 90 : 30;
assert.equal(D.repartirTV([rico, medio], 1991, ing).size, 0);
const tv = D.repartirTV([rico, medio, ascendido], 1992, ing);
assert.equal(tv.size, 2);
assert.ok(tv.get(medio) > 0 && tv.get(rico) < 0 && Math.abs(tv.get(medio) + tv.get(rico)) < 1e-10);
assert.equal(D.porcentajeReserva({ caja: 1, presidente: { estilo: 'tacano' } }, 2000), 0.4);
assert.equal(D.porcentajeReserva({ caja: 1, presidente: { estilo: 'ojeador' } }, 2000), 0);

const tabla = ['A', 'B', 'C', 'D'].map((nombre) => ({ nombre, dibujo: '3-5-2' }));
assert.equal(D.tendencia(tabla, [{ club: 'B', esperado: 10 }], 1983), null);
assert.equal(D.tendencia(tabla, [{ club: 'B', esperado: 10 }], 1990).dibujo, '3-5-2');
const plantilla = ['POR', 'POR', 'DEF', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'DEL', 'DEL', 'DEL'].map((pos, i) => j('A' + i, pos, 820, 25));
const A = equipo('A', plantilla), B = equipo('B', plantilla.map((x) => ({ ...x, n: 'B' + x.n })));
A.dibujo = B.dibujo = '4-3-3';
assert.equal(D.prioridadTecnico(equipo('C', plantilla.filter((x) => x.pos !== 'DEF')), { nombre: 'Técnico' }).pos, 'DEF');

// El reto de portería solo cambia la alineación tras el alta y usa un titular que sí está disponible.
const [primero, segundo] = plantilla;
primero.niv = 838;
segundo.niv = 820;
const estado = Motor.nuevoEstado(2000);
estado.relevos.set(primero, { eq: A, suplente: segundo, confirmado: true, partidos: 3, nota: 23, regreso: 0 });
const partido = Motor.jugarConEstado(Motor.rng(8), estado, A, B, { cambios: 0 }, new Map());
assert.ok(partido.xiL.includes(segundo) && !partido.xiL.includes(primero));
assert.deepEqual(estado.cambiosPuesto[0], { club: 'A', titular: primero.n, suplente: segundo.n, partidos: 3 });

const conectados = plantilla.map((x) => x.pos === 'MED' || x.pos === 'DEL' ? { ...x, niv: 1125 } : { ...x });
const encuentro = Motor.partido(Motor.rng(7), { ...A, jugadores: conectados }, B, { anio: 2000 });
assert.ok(encuentro.enlaces.some((x) => x.lado === 0 && x.aporte > 0 && x.aporte <= 8));
console.log('Dinámica: televisión, reserva, cantera, ascensos, sucesión, selección, técnicos y alineaciones bien');
