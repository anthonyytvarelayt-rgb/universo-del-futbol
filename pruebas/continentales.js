// Todos los formatos históricos y las convocatorias de la partida.
// Uso: node pruebas/continentales.js
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { Motor, Mundo, BASE } = require('./cargar.js');
const datos = global.CONTINENTALES, C = global.Continentales;
const esperadoEuro = { 1960: 4, 1964: 4, 1968: 4, 1972: 4, 1976: 4, 1980: 8, 1984: 8, 1988: 8, 1992: 8, 1996: 16, 2000: 16, 2004: 16, 2008: 16, 2012: 16, 2016: 24, 2020: 24, 2024: 24 };
const esperadoAmerica = { 1959: [7, 5], 1963: [7], 1967: [6], 1975: [10], 1979: [10], 1983: [10], 1987: [10], 1989: [10], 1991: [10], 1993: [12], 1995: [12], 1997: [12], 1999: [12], 2001: [12], 2004: [12], 2007: [12], 2011: [12], 2015: [12], 2016: [16], 2019: [12], 2021: [10], 2024: [16] };
assert.equal(datos.length, 40);
assert.deepEqual(datos.filter((e) => e.competicion === 'EURO').map((e) => e.edicion), Object.keys(esperadoEuro).map(Number));
Object.entries(esperadoAmerica).forEach(([y, n]) => assert.deepEqual(datos.filter((e) => e.competicion === 'AMERICA' && e.edicion === +y).map((e) => Object.keys(e.equipos).length), n, 'Selecciones de América ' + y));

for (const ed of datos) {
  const paises = Object.keys(ed.equipos);
  if (ed.competicion === 'EURO') assert.equal(paises.length, esperadoEuro[ed.edicion]);
  assert.ok(ed.sede && ed.real.campeon && ed.real.subcampeon && ed.real.goleadores.length && ed.real.goles > 0);
  assert.ok(paises.includes(ed.real.campeon) && paises.includes(ed.real.subcampeon));
  Object.values(ed.equipos).forEach((e) => {
    assert.ok(e.jugadores.length >= 11, ed.id + ': ' + e.nombre);
    assert.equal(new Set(e.jugadores.map((j) => j.n)).size, e.jugadores.length);
    assert.ok(e.jugadores.some((j) => j.pos === 'POR'), ed.id + ': falta portero de ' + e.nombre);
  });
  for (const semilla of [7, 19, 83]) {
    const T = C.torneo(ed, { clubes: [], retirados: [] }, {}, semilla);
    assert.ok(paises.includes(T.campeon), ed.id + ': campeón');
    assert.ok(paises.includes(T.subcampeon) && T.subcampeon !== T.campeon);
    assert.ok(T.partidos.length > 0 && T.premios.botaOro);
    T.partidos.forEach((p) => { assert.notEqual(p.a, p.b); assert.ok(paises.includes(p.a) && paises.includes(p.b)); });
    T.fases.filter((f) => f.tipo === 'ko').forEach((f) => {
      assert.equal(new Set(f.cruces.flatMap((c) => [c.a, c.b])).size, f.cruces.length * 2, ed.id + ': cruce repetido en ' + f.nombre);
    });
    if (ed.formato === 'veinticuatro') {
      const grupo = new Map(T.fases[0].grupos.flatMap((g) => g.tabla.map((t) => [t.equipo, g.nombre])));
      T.fases[1].cruces.forEach((c) => assert.notEqual(grupo.get(c.a), grupo.get(c.b), ed.id + ': tercero contra su propio grupo'));
      assert.equal(T.partidos.length, 51);
    }
  }
}
console.log('bien: las 40 ediciones tienen sus selecciones y terminan con campeón (tres semillas)');

// Una baja o un retirado no pueden volver por la lista histórica de externos.
for (const competicion of ['EURO', 'AMERICA']) {
  const ed = datos.find((e) => e.competicion === competicion && e.edicion === 2024);
  const pais = competicion === 'EURO' ? 'España' : 'Argentina';
  const rival = competicion === 'EURO' ? 'Portugal' : 'Brasil';
  const x = ed.equipos[pais].jugadores.find((j) => j.pos === 'DEL');
  const jugador = { ...x, nac: String(x.nac), nacion: pais + ' / ' + rival, niv: Motor.escala.interno(1000) };
  const M = { clubes: [{ nombre: 'Club de prueba', jugadores: [jugador] }], retirados: [] };
  const estado = Motor.nuevoEstado(2024), R = { T: { estado } };
  const nombres = () => Object.values(C.convocar(ed, M, R).equipos).flatMap((e) => e.jugadores.map((j) => j.n));
  estado.bajas.set(jugador, 28);
  assert.ok(!nombres().includes(x.n), competicion + ': lesionado largo');
  estado.bajas.set(jugador, 4);
  assert.ok(nombres().includes(x.n), competicion + ': baja corta convocable');
  jugador.sel = { pais: rival };
  const equipos = C.convocar(ed, M, R).equipos;
  assert.ok(!equipos[pais].jugadores.some((j) => j.n === x.n));
  assert.ok(equipos[rival].jugadores.some((j) => j.n === x.n && j.ref), 'Respetar la selección ya elegida');
  M.clubes = []; M.retirados = [jugador];
  assert.ok(!nombres().includes(x.n), competicion + ': retirado');
}
console.log('bien: bajas largas, retirados y doble nacionalidad en ambas competiciones');

// Dos ediciones en el mismo año conservan ambos resultados y acumulan las estadísticas.
{
  const ed = datos.find((e) => e.id === 'america-1959-argentina');
  const x = ed.equipos.Brasil.jugadores.find((j) => j.n === 'Pelé');
  assert.ok(x);
  const j = { ...x, nac: '1940', nacion: 'Brasil', niv: Motor.escala.interno(1000) };
  const M = { anio: 1958, clubes: [{ nombre: 'Santos', jugadores: [j] }], retirados: [] }, R = {};
  C.jugar(M, 5, R);
  assert.equal(R.AMERICA.length, 2);
  assert.equal(j.selT.torneos.length, 2);
  assert.equal(j.selT.pj, j.selT.torneos.reduce((s, t) => s + t.pj, 0));
  assert.equal(j.selT.g, j.selT.torneos.reduce((s, t) => s + t.g, 0));
  assert.equal(j.sel.pj, j.selT.pj);
  assert.equal(C.bonus([{ campeon: 'Brasil', jugadores: [{ n: 'Pelé', eq: 'Brasil', mio: true, pj: 2 }] }], 'Pelé'), .25);
  assert.equal(C.bonus([{ campeon: 'Brasil', jugadores: [{ n: 'Pelé', eq: 'Brasil', mio: false, pj: 2 }] }], 'Pelé'), 0);
  const fuera = {};
  C.jugar({ ...M, anio: 2020 }, 5, fuera);
  assert.equal(fuera.EURO.edicion, 2020);
  assert.equal(fuera.EURO.anio, 2021);
  assert.equal(fuera.AMERICA[0].edicion, 2021);
}
console.log('bien: dos Copas América en 1959, Euro 2020 en 2021 y bonus de medio Mundial');

// Compartir el reglamento no debe alterar las ediciones del Mundial existentes.
const hashes = { 1958: 'ee2d53925612871caed1a189e7c0817f2e275597198fd3ee5c88047267848db1', 1982: '9e09a7eca6a4451e121c0b0a9cda0d0bcb945c1a71f07dd3a21ab4aa83ba6d79', 2006: '382ead72e5b80442c0f6db30b73d985cd4356117c8aae6798f840847029ca1a5', 2022: '4b8d903244d809dc1ea457f4bd8f717429686fb77035a29da9c599670c535ef1' };
// La muestra original se tomó con el módulo aislado, sin las tablas de atributos del cargador.
const aislados = JSON.parse(execFileSync(process.execPath, ['-e', `
  const fs=require('fs'),crypto=require('crypto');
  global.Motor=require('./js/motor'); const W=require('./js/mundial');
  const eds=JSON.parse(fs.readFileSync('datos/mundiales.js','utf8').replace('self.MUNDIALES = ','').replace(/;\\s*$/,''));
  process.stdout.write(JSON.stringify(Object.fromEntries([1958,1982,2006,2022].map(y=>[y,
    crypto.createHash('sha256').update(JSON.stringify(W.torneo(eds.find(e=>e.anio===y),{semilla:19}))).digest('hex')]))));
`], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }));
assert.deepEqual(aislados, hashes, 'Los Mundiales existentes no cambian');
console.log('bien: Mundiales de 1958, 1982, 2006 y 2022 conservan exactamente sus resultados');
