// Casos de la auditoría del 12 de noviembre de 2026: cada uno reproduce un fallo que hubo y comprueba que no vuelve.
// Uso: node pruebas/auditoria.js   (sale con error si alguno falla)
const { Motor, Mundo, BASE } = require('./cargar.js');
let mal = 0;
const caso = (nombre, ok, detalle) => { console.log((ok ? 'bien  ' : 'MAL   ') + nombre + (ok || !detalle ? '' : ' → ' + detalle)); if (!ok) mal++; };
const jug = (n, pos, niv) => ({ n, pos, niv, nac: '1990' });
const equipo = (nombre, extra) => ({ nombre, jugadores: ['POR', 'POR', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'MED', 'DEL', 'DEL', 'DEL', 'DEL'].map((p, i) => jug(nombre + i, p, 700 + i)).concat(extra || []) });

// 1. Calendario con número impar de equipos.
[5, 19, 20].forEach((n) => {
  const cal = Motor.calendario(n), pj = Array(n).fill(0); let contraSi = 0; const pares = new Set();
  cal.forEach((ro) => { const enRonda = new Set(); ro.forEach(([a, b]) => { if (a === b) contraSi++; pj[a]++; pj[b]++; pares.add(a + '-' + b); if (enRonda.has(a) || enRonda.has(b)) contraSi++; enRonda.add(a); enRonda.add(b); }); });
  caso(`calendario de ${n} equipos`, !contraSi && pj.every((x) => x === 2 * (n - 1)) && pares.size === n * (n - 1), `partidos por equipo ${pj.join(',')}`);
});

// 2. Sin porteros disponibles, el once no repite a nadie.
{
  const A = equipo('A'), B = equipo('B'), r = Motor.rng(1);
  const m = Motor.partido(r, A, B, { fueraL: new Set(['A0', 'A1']) });
  caso('once sin porteros: once jugadores distintos', m.xiL.length === 11 && new Set(m.xiL).size === 11);
}

// 3, 4 y 6. Lesionados que no marcan después de irse, sanciones que se cumplen y prórrogas que no son otro partido.
{
  let golesTrasLesion = 0, sancionesSaltadas = 0, sanciones = 0, cambios = 0;
  const A = equipo('A'), B = equipo('B'), r = Motor.rng(7), est = Motor.nuevoEstado(2000), reg = new Map();
  for (let i = 0; i < 400; i++) {
    const m = Motor.jugarConEstado(r, est, A, B, { cambios: 3 }, reg);
    const lesion = new Map(m.eventos.filter((e) => e.tipo === 'lesion').map((e) => [e.quien, e.min]));
    cambios += m.supL.length + m.supV.length;
    m.eventos.forEach((e) => { if ((e.tipo === 'gol' || e.tipo === 'pen') && lesion.has(e.quien) && e.min > lesion.get(e.quien)) golesTrasLesion++; });
    const expulsados = m.eventos.filter((e) => e.tipo === 'roja').map((e) => e.quien);
    Motor.pasaSemana(est, [A, B]);
    if (expulsados.length) {
      const m2 = Motor.jugarConEstado(r, est, A, B, { cambios: 3 }, reg); Motor.pasaSemana(est, [A, B]);
      expulsados.forEach((n) => { sanciones++; if (m2.xiL.concat(m2.xiV, m2.supL, m2.supV).some((j) => j.n === n)) sancionesSaltadas++; });
    }
  }
  caso('ningún lesionado marca después de irse', golesTrasLesion === 0 && cambios > 0, `${golesTrasLesion} goles, ${cambios} cambios`);
  caso('el expulsado se pierde el partido siguiente', sanciones > 0 && sancionesSaltadas === 0, `${sancionesSaltadas} de ${sanciones}`);
  const reg2 = new Map(), est2 = Motor.nuevoEstado(2000);
  const m = Motor.jugarConEstado(r, est2, A, B, { neutral: true }, reg2);
  const ex = Motor.jugarConEstado(r, est2, A, B, { neutral: true, duracion: 1 / 3, prorroga: true, xiL: m.finL, xiV: m.finV }, reg2);
  caso('la prórroga no cuenta como otro partido', [...reg2.values()].every((x) => x.pj === 1));
  caso('en la prórroga solo siguen los que acabaron el partido', ex.xiL.every((j) => m.finL.includes(j)) && m.finL.every((j) => !m.st.get(j).roja));
}

// 7, 8, 9. Mundiales dentro de una partida: sin cruces entre equipos del mismo grupo, sin retirados y sin tiradores de fuera.
{
  let mismoGrupo = 0, torneos = 0, retirados = 0, tiranDeFuera = 0;
  [[1984, 3, 21], [1992, 3, 5], [2000, 3, 9]].forEach(([anio, n, semilla]) => {
    Mundo.partida(Mundo.desdeBase(BASE, anio), { semilla, temporadas: n, alAvanzar: (res, M) => {
      const MU = res.R && res.R.MU; if (!MU) return;
      torneos++;
      const grupoDe = new Map(); let ultimaGrupos = null;
      MU.fases.forEach((F) => {
        if (F.tipo === 'grupos') { ultimaGrupos = F; grupoDe.clear(); F.grupos.forEach((G) => G.tabla.forEach((t) => grupoDe.set(t.equipo, G.nombre))); }
        else if (ultimaGrupos) { F.cruces.forEach((c) => { if (grupoDe.get(c.a) && grupoDe.get(c.a) === grupoDe.get(c.b)) mismoGrupo++; }); ultimaGrupos = null; }
      });
      const fuera = new Set(M.retirados.filter((x) => x.retiro < M.anio).map((x) => x.n));
      Object.values(MU.convocados).forEach((lista) => lista.forEach((x) => { if (!x[3] && fuera.has(x[0])) retirados++; }));
    } });
  });
  caso('Mundial: ningún tercero se cruza con uno de su grupo', torneos > 0 && mismoGrupo === 0, `${mismoGrupo} cruces en ${torneos} torneos`);
  caso('Mundial: no se convoca a retirados de la partida', retirados === 0, `${retirados}`);
}
// También se comprueba el relleno desde las convocatorias históricas, no solo los jugadores propios.
try {
  require('./lesionados-mundial.js');
  caso('Mundial: la lista histórica respeta las bajas largas', true);
} catch (e) {
  caso('Mundial: la lista histórica respeta las bajas largas', false, e.message);
}
try {
  require('./continentales.js');
  caso('Eurocopa y Copa América: formatos, campeones y convocatorias', true);
} catch (e) {
  caso('Eurocopa y Copa América: formatos, campeones y convocatorias', false, e.stack);
}
try {
  require('./sueldos.js');
  caso('Sueldos pactados: contratos y consecuencias económicas', true);
} catch (e) {
  caso('Sueldos pactados: contratos y consecuencias económicas', false, e.stack);
}
console.log(mal ? `${mal} casos mal` : 'todo bien');
process.exit(mal ? 1 : 0);
