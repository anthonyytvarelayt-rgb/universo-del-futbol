// La prensa describe hechos de la partida sin tocar el simulador ni el azar.
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const desde = app.indexOf('function declaraciones(V) {'), hasta = app.indexOf('// Entrenador del año:', desde);
assert.ok(desde >= 0 && hasta > desde);
const ctx = vm.createContext({
  cerradaV: (v) => v.cerrada !== false, premiosMundo: (v) => v.premios || {}, figurasDe: (v) => v.G || [],
  Mundo: { caracterDe: (j) => j.caracter || 'normal' }, nivel: (n) => n,
  sinApodo: (n) => String(n || '').replace(/ «.*»/, ''), artClubes: (s) => s,
  nombreEuropa: () => 'Copa de Europa', sueldosDe: (v) => v.sueldosTexto || [], precioTxt: (n) => `${n} millones`,
});
vm.runInContext(app.slice(desde, hasta), ctx);
const declara = (v) => JSON.parse(JSON.stringify(ctx.declaraciones(v)));
const base = () => ({ anio: 2000, temporada: '2000-01', objetivos: [], G: [], mercado: [], retiros: [] });
const objetivo = (club, entrenador, extra = {}) => ({ club, entrenador, puesto: 1, esperado: 2, prestigio: 800, pais: 'España', balance: 'superado', ...extra });
const jugador = (nombre, club, extra = {}) => ({ nombre, club, pj: 30, notaTemp: 8, j: {}, ...extra });
const congelar = (x) => { if (x && typeof x === 'object') { Object.values(x).forEach(congelar); Object.freeze(x); } return x; };

// Antes, siete jugadores bloqueaban a los técnicos. Ahora ambos tienen sitio incluso con muchas noticias.
const v = base(); v.europa = 'A';
v.R = { otros: [{ campeon: 'B', pais: 'Portugal' }, { campeon: 'C', pais: 'Francia' }] };
v.objetivos = [objetivo('A', 'Técnico A'), objetivo('B', 'Técnico B'), objetivo('C', 'Técnico C')];
v.G = Array.from({ length: 12 }, (_, i) => jugador('Jugador ' + i, 'Club ' + i));
v.premios = { ganadorMejor: v.G[0], nombreMejor: 'Balón de Oro', podio: v.G.slice(0, 3), goleador: { ...v.G[2], g: 40 } };
v.promesas = { resueltas: v.G.slice(3, 9).map((j) => ({ jugador: j.nombre, club: j.club, dt: 'Técnico anterior', dtHoy: 'Técnico actual', estado: 'rota', min: 100, pct: 5 })) };
v.mercado = [{ tipo: 'fichaje', jugador: 'Refuerzo', a: 'Destino', de: 'Origen', precio: 50 }];
const copia = JSON.stringify(v), ds = declara(congelar(v));
assert.ok(ds.length <= 8 && ds.length >= 6);
assert.equal(ds.filter((d) => d.rol === 'entrenador').length, 3);
assert.ok(ds.some((d) => d.rol === 'jugador'));
assert.equal(new Set(ds.map((d) => d.nombre)).size, ds.length);
assert.equal(new Set(ds.map((d) => d.frase)).size, ds.length);
const ligas = ds.filter((d) => d.rot === 'El título desde el banquillo');
assert.equal(new Set(ligas.map((d) => d.frase.replace(d.club, 'CLUB'))).size, ligas.length, 'Dos técnicos repiten la misma plantilla con otro club');
assert.equal(JSON.stringify(v), copia);
assert.deepEqual(declara(v), ds, 'Redibujar la pantalla cambia las declaraciones');
assert.deepEqual(declara({ ...v, cerrada: false }), []);

// El segundo no acusa al ganador si su carácter no lo justifica.
const podio = { ...base(), G: [jugador('Ganador', 'A'), jugador('Segundo', 'B')], premios: { ganadorMejor: { nombre: 'Ganador', club: 'A' }, nombreMejor: 'Balón de Oro', podio: [{ nombre: 'Ganador', club: 'A' }, { nombre: 'Segundo', club: 'B' }] } };
for (let anio = 2000; anio < 2010; anio++) {
  const d = declara({ ...podio, anio }).find((x) => x.nombre === 'Segundo');
  assert.ok(d && !/mi temporada fue mejor|no habrá discusión|robado/.test(d.frase));
}
// El premio y el mercado no borran una promesa rota del mismo jugador.
const conflicto = { ...base(), G: [jugador('Figura', 'A')], premios: { ganadorMejor: { nombre: 'Figura', club: 'A' }, nombreMejor: 'Balón de Oro' }, promesas: { resueltas: [{ jugador: 'Figura', club: 'A', dt: 'Antes', dtHoy: 'Después', estado: 'rota', pct: 10, min: 300 }] } };
assert.equal(declara(conflicto).filter((x) => x.nombre === 'Figura').length, 1);
assert.equal(declara(conflicto)[0].rot, 'Promesa incumplida');
// Un cambio de técnico no hace que el nuevo agradezca la palabra del antiguo.
const cumplida = { ...base(), promesas: { resueltas: [{ jugador: 'Joven', club: 'A', dt: 'Anterior', dtHoy: 'Nuevo', estado: 'cumplida', pct: 70, min: 2100 }] } };
for (let anio = 2000; anio < 2006; anio++) {
  const d = declara({ ...cumplida, anio })[0];
  assert.match(d.txt, /promesa era de Anterior; los minutos llegaron con Nuevo/);
  assert.doesNotMatch(d.frase, /dio su palabra|prometió/);
}
// Nada de inventar sueños infantiles ni causas médicas para una retirada.
const fichaje = { ...base(), mercado: [{ tipo: 'fichaje', jugador: 'Nuevo', a: 'A', de: 'B', precio: 20 }] };
const retiro = { ...base(), retiros: [{ j: { n: 'Veterano', carrera: [{ niv: 800 }] }, edad: 35, club: 'A' }] };
for (let anio = 2000; anio < 2008; anio++) {
  assert.doesNotMatch(declara({ ...fichaje, anio })[0].frase, /desde niño|soñaba/);
  assert.doesNotMatch(declara({ ...retiro, anio })[0].frase, /cuerpo|lesión/);
}
// Dimisiones, ceses y balances respetan lo registrado; no se inventan éxitos ni víctimas.
const tecnico = { ...base(), objetivos: [objetivo('Fracaso', 'Cese', { puesto: 10, balance: 'fracaso' })], banquillos: [{ club: 'Fracaso', sale: 'Cese', motivo: 'despedido', puesto: 10 }, { club: 'Otro', sale: 'Dimite', dimite: true, vendido: 'Estrella', puesto: 9 }] };
const dt = declara(tecnico);
assert.equal(dt.filter((d) => d.nombre === 'Cese').length, 1);
assert.equal(dt.find((d) => d.nombre === 'Cese').rot, 'Después del cese');
assert.match(dt.find((d) => d.nombre === 'Dimite').txt, /dimitir/);
assert.ok(!dt.some((d) => d.rot === 'El banquillo campeón'));
const sinTitulos = declara({ ...base(), objetivos: [objetivo('Normal', 'Entrenador', { puesto: 5, esperado: 5, balance: 'cumplido' })] });
assert.deepEqual(sinTitulos, []);
// Quien ha salido no jura permanencia, y los retirados no hacen planes como jugadores en activo.
const movido = { ...base(), objetivos: [objetivo('A', 'Técnico', { puesto: 10, balance: 'fracaso' })], G: [jugador('Saliente', 'A')], mercado: [{ tipo: 'fichaje', jugador: 'Saliente', a: 'B', de: 'A', precio: 1 }] };
assert.ok(!declara(movido).some((d) => d.rot === 'Autocrítica en el vestuario'));
// El mismo suceso cambia de redacción entre años, sin guardar estado ni consumir azar.
for (const caso of [fichaje, retiro, podio, cumplida]) {
  const anterior = declara(caso), siguiente = declara({ ...caso, anio: caso.anio + 1 });
  anterior.forEach((d) => assert.notEqual(d.frase, siguiente.find((x) => x.nombre === d.nombre).frase));
}
// El primero regional no se convierte en campeón nacional; Brasil puede decidir su título por copa.
const regional = { ...base(), objetivos: [objetivo('Regional', 'Regional DT', { pais: 'Alemania' })], R: { otros: [{ pais: 'Alemania', campeon: 'Nacional', ligas: [{ nivel: 1 }, { nivel: 1 }] }] } };
assert.ok(!declara(regional).some((d) => d.rot === 'El título desde el banquillo'));
const brasil = { ...base(), objetivos: [objetivo('Campeón', 'Campeón DT', { pais: 'Brasil', puesto: 3 })], R: { otros: [{ pais: 'Brasil', campeon: 'Campeón', campeonPorCopa: true, C: { nombre: 'Taça Brasil' } }] } };
const nacional = declara(brasil)[0];
assert.equal(nacional.rot, 'El título desde el banquillo');
assert.match(nacional.txt, /Taça Brasil/);
assert.doesNotMatch(nacional.frase, /regularidad|liga/);
// Ser polémico no demuestra agresiones, protestas arbitrales ni una guerra de vestuario.
const noticias = vm.createContext({ cerradaV: () => true, esc: (s) => s, sinApodo: (s) => s, temporadas: () => [],
  nombreEuropa: () => 'Copa de Europa', OTRAS_COPAS: [], paisesDe: () => [],
  Mundo: { donDT: (n) => n === 'Polemista' ? 'special' : 'tactico' } });
const inicioNoticias = app.indexOf('const POLEMICAS = [');
vm.runInContext(app.slice(inicioNoticias, app.indexOf('// Declaraciones:', inicioNoticias)), noticias);
for (let anio = 2000; anio < 2030; anio++) {
  const temporada = { ...base(), anio, temporada: `${anio}-${anio + 1}`, objetivos: [objetivo('A', 'Polemista', { puesto: 7, balance: 'fracaso' }), objetivo('B', 'Táctico', { puesto: 3 })] };
  const texto = JSON.stringify(noticias.noticiasDT(temporada));
  assert.doesNotMatch(texto, /dedos en el ojo|carga contra los árbitros|guerra abierta|no le dirige la palabra|lo que hemos ganado|ruedas de prensa cruzadas/);
  assert.match(texto, /acaba 3/);
}
// El texto compartido de las noticias tampoco confunde al técnico que prometió con el que dio minutos.
vm.runInContext(app.slice(app.indexOf('function promesasDe(V) {'), app.indexOf('// Los importes firmados')), ctx);
for (let anio = 2000; anio < 2010; anio++) {
  const noticia = ctx.promesasDe({ ...cumplida, anio, temporada: `${anio}-${anio + 1}` })[0];
  assert.doesNotMatch(noticia.frase, /míster me dio su palabra/);
}
console.log('Declaraciones: reparto de voces, contexto, ausencia de duplicados, rotación y estabilidad correctos');
