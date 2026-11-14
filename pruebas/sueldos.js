// Contratos persistentes: importes nominales, contabilidad y decisiones con causas.
const assert = require('node:assert/strict');
const { Mundo, Motor } = require('./cargar.js');
const jugador = (n, nivel, nac = '1981-01-01') => ({ n, nac, pos: 'MED', niv: Motor.escala.interno(nivel), carrera: [], nacion: 'España' });
const club = (nombre, jugadores, prestigio = 850) => ({ nombre, jugadores, prestigio, pais: 'España', division: 1, entrenadores: [] });
const hechos = () => ({ peticiones: [], renovaciones: [], ajustes: [], veteranos: [] });
{
  const c = club('Inicio', [jugador('Titular inicial', 700)]);
  const M = Mundo.nuevoMundo({ anio: 2000, primera: [c], segunda: [] });
  assert.ok(M.clubes[0].jugadores[0].salario > 0);
  assert.ok(M.clubes[0].jugadores[0].contrato > M.anio);
}
{
  const j = jugador('Contrato joven', 600); Mundo.firmarSueldo(j, 2000, 2005);
  const firmado = j.salario;
  j.niv = Motor.escala.interno(760);
  assert.equal(Mundo.sueldoFirmado(j, 2004), firmado, 'El progreso y la inflación no suben el sueldo firmado');
  assert.ok(Mundo.euros(Mundo.sueldo(j), 2004) > firmado);
  j.niv = Motor.escala.interno(500);
  assert.equal(Mundo.sueldoFirmado(j, 2010), firmado, 'Un veterano conserva la cantidad nominal');
  Mundo.firmarSueldo(j, 2010, 2012);
  assert.ok(j.salario < firmado); assert.equal(j.contrato, 2012);
  const sinContrato = jugador('Lectura', 620), foto = JSON.stringify(sinContrato);
  Mundo.sueldoFirmado(sinContrato, 2000);
  assert.equal(JSON.stringify(sinContrato), foto, 'Consultar la ficha no firma ni modifica el jugador');
}
{
  const j = jugador('Joven con minutos', 590); Mundo.firmarSueldo(j, 1999, 2004);
  const c = club('Club con margen', [j]), M = { anio: 2000, clubes: [c] };
  const R = { G: [{ j, min: 1800 }] }, H = hechos();
  j.niv = Motor.escala.interno(720);
  Mundo.revisarSueldos(M, R, H);
  assert.equal(H.peticiones.length, 1); assert.equal(H.peticiones[0].estado, 'aceptada');
  assert.equal(j.salario, H.peticiones[0].pide); assert.ok(j.contrato > 2001);
  const sinMinutos = jugador('Joven sin minutos', 590); Mundo.firmarSueldo(sinMinutos, 1999, 2004);
  sinMinutos.niv = Motor.escala.interno(740); c.jugadores = [sinMinutos];
  const H2 = hechos(); Mundo.revisarSueldos(M, { G: [] }, H2); assert.equal(H2.peticiones.length, 0);
  c.jugadores = [j]; c.caja = -Mundo.ingresosDe(c, 2001);
  Mundo.firmarSueldo(j, 1999, 2006); j.niv = Motor.escala.interno(820);
  const anterior = j.salario, H3 = hechos(); Mundo.revisarSueldos(M, R, H3);
  assert.equal(H3.peticiones[0].estado, 'pendiente'); assert.equal(j.salario, anterior);
  Mundo.firmarSueldo(j, 2001); assert.equal(j.revisionSalarial, undefined, 'Una firma nueva resuelve la petición anterior');
}
{
  const j = jugador('Cobra lo pactado', 850); Mundo.firmarSueldo(j, 2000, 2004);
  const c = club('Contabilidad', [j]), M = { anio: 2000, clubes: [c] };
  j.niv = Motor.escala.interno(500);
  Mundo.cuentas(M, { T: { tabla: [] }, otros: [] });
  assert.equal(c.finanzas.sueldos, Math.round(j.salario * 100) / 100);
  const jubilado = jugador('Retirado al terminar', 800); Mundo.firmarSueldo(jubilado, 2000);
  const pagado = j.salario + jubilado.salario;
  Mundo.cuentas(M, { T: { tabla: [] }, otros: [] }, new Map([[c, pagado]]));
  assert.equal(c.finanzas.sueldos, Math.round(pagado * 100) / 100, 'El cierre paga también al que se retira ese verano');
  assert.ok(c.finanzas.gastos >= 0);
}
{
  const clubes = Array.from({ length: 12 }, (_, i) => club('Club ' + i, [], 700));
  const c = clubes[11], j = jugador('Nómina alta', 850); Mundo.firmarSueldo(j, 2000);
  j.salario = Mundo.euros(Mundo.presupuesto(c, 2001) * 1.2, 2001); c.jugadores = [j];
  const tabla = clubes.map((c) => ({ nombre: c.nombre, equipo: c }));
  const R = { T: { tabla }, EU: { rondas: [{ cruces: [{ a: c.nombre, b: clubes[0].nombre }] }] } };
  const M = { anio: 2000, clubes, paises: [], historia: [{ campeon: clubes[0].nombre, R, otros: [], europa: clubes[1].nombre }] };
  const H = Mundo.prepararSueldos(M, R);
  assert.equal(H.ajustes.length, 1); assert.equal(H.ajustes[0].club, c.nombre);
  assert.ok(Mundo.limiteSueldos(c, 2001) < Mundo.presupuesto(c, 2001));
  assert.equal(Mundo.limiteSueldos(c, 2002), Mundo.presupuesto(c, 2002), 'El recorte no dura eternamente');
  R.T.tabla = [tabla[11], ...tabla.slice(0, 11)]; M.historia[0].campeon = c.nombre;
  assert.equal(Mundo.prepararSueldos(M, R).ajustes.length, 0, 'Seguir clasificado evita el recorte');
}
console.log('Sueldos: contratos, progresión, peticiones, cuentas y pérdida de Europa bien');
