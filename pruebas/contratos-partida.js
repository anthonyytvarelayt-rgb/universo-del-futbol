// Revisión integrada sobre partidas reales. No modifica el motor ni añade sorteos.
// Uso: node pruebas/contratos-partida.js <año> <temporadas> <semilla> [informe.json]
const assert = require('node:assert/strict'), fs = require('fs');
const { Mundo, Motor, BASE } = require('./cargar.js');
const inicio = Number(process.argv[2] || 2000), temporadas = Number(process.argv[3] || 12), semilla = Number(process.argv[4] || 7);
assert.ok(Number.isInteger(inicio) && Number.isInteger(temporadas) && temporadas > 0 && Number.isInteger(semilla));
const M = Mundo.nuevoMundo(Mundo.desdeBase(BASE, inicio)), r = Motor.rng(semilla * 7 + 3);
const informe = { inicio, temporadas, semilla, comprobaciones: 0, temporadasCompletadas: 0, fallos: [], muestras: [], liga: {}, europa: {}, refinanciaciones: [], contratos: 0, cesiones: 0, regresos: 0, nominas: 0 };
const clave = (j) => j.n + '|' + j.nac;
const comprobar = (ok, tipo, dato) => {
  informe.comprobaciones++;
  if (!ok) { if (!informe.fallos.includes(tipo)) informe.fallos.push(tipo); if (informe.muestras.length < 25) informe.muestras.push({ temporada: M.anio, tipo, ...dato }); }
};
const europeos = (R) => new Set([R.EU, R.UEFA, R.RECOPA].filter(Boolean).flatMap((C) => (C.rondas || []).flatMap((ro) => ro.cruces.flatMap((x) => [x.a, x.b]))));
let ajusteAnterior = [];
for (let k = 0; k < temporadas; k++) {
  const antes = new Map(), nominas = new Map(), retirados = new Set(M.retirados.map(clave));
  M.clubes.forEach((c) => {
    nominas.set(c, c.jugadores.reduce((s, j) => s + Mundo.sueldoFirmado(j, M.anio), 0));
    c.jugadores.forEach((j) => antes.set(j, { club: c.nombre, salario: j.salario, hasta: j.contrato, firma: j.salarioAnio }));
  });
  const S = Mundo.jugar(M, semilla * 1000 + k * 97), enEuropa = europeos(S.R);
  ajusteAnterior.forEach((x) => comprobar(!enEuropa.has(x.club), 'recorte a un club que sí juega Europa', { club: x.club }));
  Mundo.verano(M, S, r);
  ajusteAnterior = S.sueldos.ajustes;
  M.retirados.forEach((j) => retirados.add(clave(j)));
  const mercado = S.mercado || [], peticiones = S.sueldos.peticiones;
  const vistos = new Set();
  M.clubes.forEach((c) => {
    comprobar(Number.isFinite(c.caja), 'caja no finita', { club: c.nombre });
    if (c.finanzas) {
      comprobar(c.finanzas.gastos >= 0 && c.finanzas.sueldos >= 0, 'gastos negativos', { club: c.nombre });
      if (nominas.has(c)) {
        informe.nominas++;
        comprobar(Math.abs(c.finanzas.sueldos - Math.round(nominas.get(c) * 100) / 100) < 0.000001, 'nómina distinta de los contratos al empezar', { club: c.nombre, esperado: nominas.get(c), real: c.finanzas.sueldos });
      }
    }
    if (c.rescate === M.anio) informe.refinanciaciones.push({ club: c.nombre, temporada: S.temporada, division: c.division });
    c.jugadores.forEach((j) => {
      const id = clave(j), a = antes.get(j);
      comprobar(!vistos.has(id), 'jugador repetido en dos plantillas', { jugador: id }); vistos.add(id);
      comprobar(!retirados.has(id), 'retirado que reaparece', { jugador: id });
      comprobar(Number.isFinite(j.salario) && j.salario > 0 && j.contrato > M.anio, 'contrato inválido o vencido', { jugador: id, club: c.nombre, salario: j.salario, hasta: j.contrato });
      if (!a) return;
      informe.contratos++;
      const fichaje = mercado.some((m) => m.jugador === j.n && m.tipo === 'fichaje');
      const libre = mercado.some((m) => m.jugador === j.n && m.tipo === 'libre');
      const mejora = peticiones.some((x) => x.jugador === j.n && x.estado === 'aceptada');
      if (a.hasta > M.anio && !fichaje && !libre && !mejora) {
        comprobar(j.salario === a.salario && j.contrato === a.hasta && j.salarioAnio === a.firma, 'contrato vigente modificado sin firma', { jugador: id, antes: a, despues: { salario: j.salario, hasta: j.contrato, firma: j.salarioAnio } });
      }
    });
  });
  informe.cesiones += mercado.filter((m) => m.tipo === 'cesión').length;
  informe.regresos += mercado.filter((m) => m.tipo === 'vuelve de cesión').length;
  informe.liga[S.campeon] = (informe.liga[S.campeon] || 0) + 1;
  if (S.europa) informe.europa[S.europa] = (informe.europa[S.europa] || 0) + 1;
  informe.temporadasCompletadas++;
  console.log(`${S.temporada}: ${S.campeon} / ${S.europa}; fallos: ${informe.fallos.join(', ') || 'ninguno'}`);
}
if (process.argv[5]) fs.writeFileSync(process.argv[5], JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify(informe));
process.exitCode = informe.fallos.length ? 1 : 0;
