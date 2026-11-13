// Base única con la carrera de cada jugador: de ella sale el mundo de la temporada en que empieza la partida.
const BASE = window.BASE_DATOS;
// Años en que se puede empezar: solo los que el motor da por jugables (aniosJugables); hasta entonces, 1958.
const ANIOS = (BASE && BASE.aniosJugables && BASE.aniosJugables.length ? BASE.aniosJugables : [1958]);
// Lo que la página necesita del año de inicio (colores de los clubes, ligas de cada país, Copa de Europa); cambia al empezar otra partida.
// Por defecto se empieza en 1958-59, la temporada con más datos revisados.
const ANIO_DEFECTO = ANIOS.includes(1958) ? 1958 : ANIOS[0];
let anioInicio = ANIO_DEFECTO, INFO, PAISES, EUROPA, CUADRO_REAL, PRENSA;
function cargarAnio(anio) {
  const D = Mundo.desdeBase(BASE, anio);
  anioInicio = anio;
  INFO = D.info; PAISES = D.paises; EUROPA = D.europa || [];
  PAISES.forEach((P) => Object.assign(INFO.clubes, P.info || {}));
  // Cruces reales de las ediciones con sorteo real, para comparar.
  CUADRO_REAL = new Map(EUROPA.filter((e) => e.cuadro).flatMap((e) => e.cuadro.flatMap((r) => r.cruces).map((c) => [e.anio + '|' + c.id, c])));
  PRENSA = Cronica.crear(INFO);
  ficticios = null;
}
const REALIDAD = {
  '1958-59': { liga: 'Barcelona', copa: 'Barcelona', europa: 'Real Madrid', pichichi: 'Di Stéfano (23)' },
  '1959-60': { liga: 'Barcelona', copa: 'Atlético Madrid', europa: 'Real Madrid', pichichi: 'Puskás (26)' },
  '1960-61': { liga: 'Real Madrid', copa: 'Atlético Madrid', europa: 'Benfica', pichichi: 'Puskás (28)' },
  '1961-62': { liga: 'Real Madrid', copa: 'Real Madrid', europa: 'Benfica', pichichi: 'Seminario (25)' },
  '1962-63': { liga: 'Real Madrid', copa: 'Barcelona', europa: 'Milan', pichichi: 'Puskás (26)' }
};
// Las temporadas de la partida: desde el año elegido hasta el último jugable.
let TEMPORADAS = 5;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const corto = (n) => Cronica.apellido(n);
const copia = (x) => JSON.parse(JSON.stringify(x));
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lista = (xs) => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1]);
const escudo = (club) => { const c = INFO.clubes[club]; return c ? `<span class="escudo" style="background:linear-gradient(90deg, ${c.c1} 50%, ${c.c2} 50%)" aria-hidden="true"></span>` : '<span class="escudo" aria-hidden="true"></span>'; };
// Niveles a la vista en la escala acordada (1-1000); el motor usa por dentro su escala interna.
const nivel = (i) => Motor.escala.mostrar(i);
const sinApodo = (n) => String(n).replace(/\s*\(.*\)/, '');
const marcadorCruce = (c) => (c.b ? c.partidos.map((m) => `${m.ga}-${m.gb}${m.prorroga ? ' (pró.)' : m.desempate ? ' (des.)' : ''}`).join(' · ')
  + (c.penaltis ? ` · pen. ${c.penaltis}` : c.golesFuera ? ' · goles fuera' : '') : 'pasa sin jugar');
// Jugadores inventados para completar plantillas sin datos (marcados en los CSV o creados por el motor): llevan un asterisco.
let ficticios = null;
const esFicticio = (n) => (ficticios ||= new Set(PAISES.flatMap((P) => P.divisiones.flatMap((d) => d.clubes.flatMap((c) => c.jugadores.filter((j) => j.relleno).map((j) => j.n)))))).has(n) || /^Suplente \d+ \(/.test(n);

// ---------- Estado de la partida ----------
// La partida avanza paso a paso: pretemporada, 30 jornadas con las rondas europeas en su mes, promoción,
// Copa, cierre de temporada y verano. Al acabar el verano empieza la temporada siguiente.
// La simulación va por delante en segundo plano: mientras se ve una temporada ya se calculan su verano y la siguiente.
let M = null, semilla, numPartida = 0;
let S = null;          // temporada en curso (resumen de Mundo.jugar)
let pasos = [], iPaso = 0, k = 0;
let teletipo = [], cerradas = [];
let jugando = false, temporizador = null, fin = false, ocupado = false;
let verK = null;
const nuevoEn = new Set();

// ---------- Simulador en segundo plano ----------
// El motor corre en un trabajador aparte para que la página no se congele; si el navegador no lo deja, corre aquí mismo.

function cuerpoSimulador(ambito) {
  let W = null, rr = null, sem = 0, ultimo = null;
  return (msg, responder) => {
    const Motor = ambito.Motor, Mundo = ambito.Mundo;
    // El mundo viaja sin su historia (la página guarda la suya) para que cada mensaje no crezca con los años.
    const foto = () => Object.assign({}, W, { historia: [] });
    if (msg.tipo === 'iniciar') { sem = msg.semilla; W = Mundo.nuevoMundo(Mundo.desdeBase(msg.base, msg.anio)); rr = Motor.rng(sem * 7 + 3); return; }
    // Foto del mundo al empezar una temporada, y vuelta a ella: recuperar no obliga a repetir la partida entera.
    // (nuevoMundo se llama igual al restaurar porque prepara las reglas de nacionalidad de cada país.)
    if (msg.tipo === 'restaurar') { sem = msg.semilla; Mundo.nuevoMundo(Mundo.desdeBase(msg.base, msg.anio)); W = msg.W; rr = Motor.rng(msg.rr); return; }
    if (msg.tipo === 'foto') { responder({ tipo: 'foto', k: msg.k, W, rr: rr.estado() }); return; }
    if (msg.tipo === 'jugar') {
      const fuerza = {}, cracks = new Set();
      W.clubes.forEach((c) => { fuerza[c.nombre] = Motor.fuerzaBruta(c); c.jugadores.filter((j) => j.niv >= 860).forEach((j) => cracks.add(j.n)); });
      ultimo = Mundo.jugar(W, sem * 1000 + msg.k * 97);
      Object.assign(ultimo, { fuerza, cracks, semilla: sem + msg.k });
      responder({ tipo: 'temporada', k: msg.k, S: ultimo, M: foto() });
    } else if (msg.tipo === 'verano') {
      Mundo.verano(W, ultimo, rr);
      // Lo que se queda en la historia del trabajador: solo lo que usa el año siguiente.
      responder({ tipo: 'verano', k: msg.k, S: ultimo, M: foto() });
    }
  };
}
let sim = null, generacion = 0;
const listos = new Map(), esperas = new Map();
function crearSimulador() {
  const gen = ++generacion;
  const recibir = (d) => {
    if (gen !== generacion) return;
    const clave = d.tipo + d.k;
    if (esperas.has(clave)) { esperas.get(clave)(d); esperas.delete(clave); } else listos.set(clave, d);
  };
  try {
    // En la página de un solo archivo el código va dentro de cada etiqueta; en el sitio por archivos, el trabajador los importa por su dirección.
    const fuentes = ['src-motor', 'src-atributos', 'src-epoca', 'src-mundial', 'src-mundiales', 'src-mundo'].map((id) => $(id)).filter(Boolean).map((el) => (el.src ? `importScripts(${JSON.stringify(el.src)});` : el.textContent)).join('\n;\n');
    const codigo = `${fuentes}\n;const atender = (${cuerpoSimulador.toString()})(self);\nself.onmessage = (e) => atender(e.data, (x) => self.postMessage(x));`;
    const w = new Worker(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));
    w.onmessage = (e) => recibir(e.data);
    // Si el simulador se para, se dice y se ofrece recuperar la partida guardada en vez de esperar para siempre.
    w.onerror = () => {
      if (gen !== generacion) return;
      const aviso = 'El simulador se ha parado. <button type="button" class="nombre" onclick="location.reload()">Recuperar la partida</button>';
      $('fechaTxt').innerHTML = aviso;
      if ($('cargando') && !$('cargando').hidden) $('cargando').innerHTML = aviso;
    };
    return { enviar: (m) => w.postMessage(m), cerrar: () => w.terminate() };
  } catch (e) {
    const atender = cuerpoSimulador(window);
    const cola = [];
    let corriendo = false;
    const siguiente = () => {
      if (!cola.length) { corriendo = false; return; }
      corriendo = true;
      const m = cola.shift();
      setTimeout(() => { atender(m, (x) => recibir(copia2(x))); siguiente(); }, 0);
    };
    return { enviar: (m) => { cola.push(m); if (!corriendo) siguiente(); }, cerrar: () => (cola.length = 0) };
  }
}
// Copia que conserva las referencias compartidas, como hace el trabajador.
const copia2 = (x) => (typeof structuredClone === 'function' ? structuredClone(x) : x);
const obtener = (tipo, kk) => new Promise((res) => {
  const clave = tipo + kk;
  if (listos.has(clave)) { const d = listos.get(clave); listos.delete(clave); res(d); } else esperas.set(clave, res);
});
// Pide el verano de esta temporada y la temporada siguiente, para tenerlos listos antes de llegar.
function adelantar(kk) {
  sim.enviar({ tipo: 'verano', k: kk });
  if (kk + 1 < TEMPORADAS) { sim.enviar({ tipo: 'foto', k: kk + 1 }); sim.enviar({ tipo: 'jugar', k: kk + 1 }); }
}

async function nuevaPartida(guardada) {
  parar();
  if (sim) sim.cerrar();
  listos.clear(); esperas.clear();
  numPartida = guardada ? guardada.numPartida || 1 : numPartida + 1;
  semilla = guardada ? guardada.semilla : numPartida === 1 ? 7 : (Date.now() % 1e6);
  k = 0; teletipo = []; cerradas = []; fin = false; S = null; M = null; verJ = null;
  ocupado = true; pintarMandos();
  $('fechaTxt').textContent = guardada ? 'Recuperando tu partida…' : 'Preparando la partida…';
  sim = crearSimulador();
  cargarAnio(guardada ? guardada.anio || 1958 : anioElegido());
  TEMPORADAS = Math.max(1, ANIOS[ANIOS.length - 1] - anioInicio + 1);
  // Con una foto de esta partida se empieza en su temporada; sin ella, desde el principio.
  const f = guardada ? await leerFoto() : null;
  if (f && f.semilla === semilla && f.numPartida === numPartida && f.anio === anioInicio && f.k > 0 && f.k <= guardada.k) {
    k = f.k; cerradas = f.cerradas; teletipo = f.teletipo;
    sim.enviar({ tipo: 'restaurar', semilla, base: BASE, anio: anioInicio, W: f.W, rr: f.rr });
  } else sim.enviar({ tipo: 'iniciar', semilla, base: BASE, anio: anioInicio });
  sim.enviar({ tipo: 'jugar', k });
  await empezarTemporada(k);
  // Partida guardada: se vuelve a jugar en silencio hasta el punto donde se dejó (el motor da siempre lo mismo con la misma semilla).
  if (guardada) {
    while (!fin && (k < guardada.k || (k === guardada.k && iPaso < guardada.iPaso))) await avanzar(true);
    nota(paso(), 'Partida recuperada: sigues donde lo dejaste.');
  }
  ocupado = false;
  pintar();
}

async function empezarTemporada(kk) {
  const d = await obtener('temporada', kk);
  S = d.S; M = d.M; S.veranoHecho = false;
  if (kk > 0) { const antes = { cerradas: cerradas.slice(), teletipo: teletipo.slice() }; obtener('foto', kk).then((f) => guardarFoto(Object.assign(f, antes))); }
  pasos = calendario(S);
  iPaso = 0; verJ = null;
  adelantar(kk);
  nota(pasos[0], titularDe(pasos[0]).titular);
}

// Las rondas de Europa caen en su mes (otoño, invierno, primavera); la final, antes de la de Copa.
function calendario(S) {
  const p = [{ tipo: 'pre' }];
  const EU = S.R.EU, nEU = EU ? EU.rondas.length : 0;
  const huecos = nEU > 1 ? Array.from({ length: nEU - 1 }, (_, i) => Math.round(5 + i * (23 / Math.max(1, nEU - 2)))) : [];
  for (let j = 1; j <= 30; j++) {
    p.push({ tipo: 'jornada', j });
    huecos.forEach((h, i) => { if (h === j) p.push({ tipo: 'europa', ronda: i, j }); });
  }
  if (S.R.promos.length) p.push({ tipo: 'promocion' });
  const nC = S.R.C.rondas.length;
  for (let i = 0; i < nC; i++) {
    if (i === nC - 1 && nEU) p.push({ tipo: 'europa', ronda: nEU - 1 });
    p.push({ tipo: 'copa', ronda: i });
  }
  p.push({ tipo: 'cierre' }, { tipo: 'verano' });
  return p;
}

// Fecha aproximada de cada paso: la Liga empezaba a mediados de septiembre y la Copa iba en mayo y junio.
function fechaDe(p) {
  const anio = S.anio;
  const dia = (d) => { const f = new Date(Date.UTC(anio, 8, 14) + d * 864e5); return `${f.getUTCDate()} de ${MESES[f.getUTCMonth()]} de ${f.getUTCFullYear()}`; };
  if (p.tipo === 'pre') return `Septiembre de ${anio} · pretemporada`;
  if (p.tipo === 'jornada') return `Jornada ${p.j} · ${dia((p.j - 1) * 7)}`;
  if (p.tipo === 'europa') return p.j ? `${nombreEuropa(S)} · ${dia((p.j - 1) * 7 + 3)}` : `Final de la ${nombreEuropa(S)} · junio de ${anio + 1}`;
  if (p.tipo === 'promocion') return `Promoción · mayo de ${anio + 1}`;
  if (p.tipo === 'copa') return `${S.R.C.nombre} · ${p.ronda >= S.R.C.rondas.length - 2 ? 'junio' : 'mayo'} de ${anio + 1}`;
  if (p.tipo === 'cierre') return `Fin de temporada · junio de ${anio + 1}`;
  return `Verano de ${anio + 1}`;
}
const fechaCorta = (p) => (p.tipo === 'jornada' ? `J${p.j}` : { pre: 'Inicio', europa: 'Europa', promocion: 'Promoción', copa: 'Copa', cierre: 'Cierre', verano: 'Verano' }[p.tipo]);

// Lo que ya se sabe en el paso actual.
const paso = () => pasos[iPaso];
const jornadasVistas = () => pasos.slice(0, iPaso + 1).filter((p) => p.tipo === 'jornada').length;
const rondasVistas = (tipo) => pasos.slice(0, iPaso + 1).filter((p) => p.tipo === tipo).length;
const temporadaCerrada = () => pasos.slice(0, iPaso + 1).some((p) => p.tipo === 'cierre');

// Un paso adelante. "callado" sirve para recuperar una partida sin pintar cada paso.
async function avanzar(callado) {
  if (fin || !S) return;
  if (iPaso + 1 >= pasos.length) {
    cerradas.push(S);
    if (k + 1 >= TEMPORADAS) { fin = true; parar(); nota({ tipo: 'verano' }, `Fin de la partida: ${TEMPORADAS} temporadas jugadas.`); if (!callado) { pintar(); guardar(); } return; }
    k++;
    if (!callado) $('fechaTxt').textContent = 'Simulando la temporada…';
    await empezarTemporada(k);
    if (!callado) { pintar(); guardar(); }
    return;
  }
  iPaso++;
  const p = paso();
  if (p.tipo === 'verano' && !S.veranoHecho) {
    if (!callado) $('fechaTxt').textContent = 'Llega el verano…';
    const d = await obtener('verano', k);
    // El verano trae el mundo de después: edades, retiros, fichajes y ascensos.
    Object.assign(S, { movimientos: d.S.movimientos, retiros: d.S.retiros, mercado: d.S.mercado, novedades: d.S.novedades, veranoHecho: true });
    M = d.M;
  }
  // Al cerrar la temporada, el teletipo da los campeones de todas las ligas.
  if (p.tipo === 'cierre') {
    (S.otros || []).forEach((o) => {
      const c = o.campeon || o.campeones.map((x) => `${x.club} (${x.grupo})`).join(', ');
      if (c) nota(p, `${o.pais}: ${c}, ${o.campeon ? 'campeón' : 'campeones'} de ${o.liga || 'liga'}.`);
    });
    if (S.europa) nota(p, `Copa de Europa: ${S.europa}.`);
  }
  nota(p, titularDe(p).titular);
  // El cierre y el verano van juntos: la temporada se para con el resumen mundial ya completo.
  if (p.tipo === 'cierre') return avanzar(callado);
  if (callado) return;
  marcarNuevo({ jornada: ['comp'], europa: ['comp'], copa: ['comp'], promocion: ['comp'], verano: ['hoy', 'historia'] }[p.tipo] || []);
  pintar();
  if (p.tipo === 'pre' || p.tipo === 'verano' || iPaso % 6 === 0) guardar();
}

function nota(p, texto) {
  teletipo.unshift({ cuando: fechaCorta(p), texto, temporada: S.temporada });
  if (teletipo.length > 80) teletipo.length = 80;
}

// ---------- Reproducción ----------
// Semana: un paso. Mes: cuatro. Temporada: sigue sola y se para en los momentos grandes (finales) y al terminar.
// El paso a la temporada siguiente lo da siempre un botón.
let modo = 'temporada', meta = 0, rapido = false;
const finDeTemporada = () => !!S && !fin && paso() && paso().tipo === 'verano';
const hayOtra = () => k + 1 < TEMPORADAS;
const esFinal = (p) => (p.tipo === 'europa' && S.R.EU && p.ronda === S.R.EU.rondas.length - 1) || (p.tipo === 'copa' && p.ronda === S.R.C.rondas.length - 1);
function alResumen() { seccion = 'hoy'; verK = null; nuevoEn.delete('hoy'); window.scrollTo({ top: 0 }); }
async function tic() {
  if (!jugando) return;
  await avanzar();
  if (!jugando) return;
  if (finDeTemporada() || fin) { parar(); alResumen(); pintar(); return; }
  if (esFinal(paso()) || (modo === 'mes' && iPaso >= meta)) { parar(); return; }
  temporizador = setTimeout(tic, (paso().tipo === 'pre' ? 1200 : 600) / (rapido && modo === 'temporada' ? 3 : 1));
}
function jugar(m) {
  if (fin || ocupado || finDeTemporada()) return;
  // Volver a tocar Temporada mientras juega cambia la velocidad (normal / ×3).
  if (jugando && m === 'temporada' && modo === 'temporada') { rapido = !rapido; pintarMandos(); return; }
  clearTimeout(temporizador);
  modo = m || 'temporada'; meta = iPaso + 4;
  jugando = true; pintarMandos(); temporizador = setTimeout(tic, 150);
}
function parar() { const estaba = jugando; jugando = false; clearTimeout(temporizador); pintarMandos(); if (estaba) guardar(); }
async function pasoAMano() {
  if (ocupado || finDeTemporada()) return;
  if (jugando) parar();
  ocupado = true; pintarMandos();
  await avanzar();
  ocupado = false;
  if (finDeTemporada()) alResumen();
  pintar();
}
// Juega en silencio lo que queda de temporada y abre la edición especial.
async function saltarAlFinal() {
  if (ocupado || fin || finDeTemporada()) return;
  parar(); ocupado = true; pintarMandos();
  $('fechaTxt').textContent = 'Jugando el resto de la temporada…';
  while (!fin && !finDeTemporada()) await avanzar(true);
  ocupado = false;
  marcarNuevo(['comp', 'historia']);
  alResumen();
  pintar(); guardar();
}
// El único paso que cruza de una temporada a otra; la nueva empieza en pausa.
async function siguienteTemporada() {
  if (ocupado || !finDeTemporada() || !hayOtra()) return;
  ocupado = true; verK = null; pintarMandos();
  await avanzar();
  ocupado = false;
  seccion = 'hoy';
  pintar();
}

// ---------- Guardar la partida ----------
// Se guarda solo la semilla y el punto de la partida: con eso el motor rehace todo igual.
// Va en el espacio privado de cada persona en la página; si no está disponible, en este navegador.
const CLAVE = 'universo-futbol-beta-partida';
let almacen = null;
async function prepararAlmacen() {
  try {
    if (!window.claude || !window.claude.use) return null;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    const id = db && user ? await user.id() : null;
    return id ? db.doc('data/users/' + id + '/partida') : null;
  } catch (e) { return null; }
}
let ultimoGuardado = '';
async function guardar() {
  if (!S) return;
  const datos = { version: 24, semilla, numPartida, anio: anioInicio, k, iPaso, temporada: S.temporada, cuando: new Date().toISOString() };
  const clave = `${semilla}|${k}|${iPaso}`;
  if (clave === ultimoGuardado) return;
  ultimoGuardado = clave;
  let ok = false;
  if (almacen) { try { await almacen.set(datos); ok = true; } catch (e) { ok = false; } }
  if (!ok) { try { localStorage.setItem(CLAVE, JSON.stringify(datos)); ok = true; } catch (e) { ok = false; } }
  if (!ok) ultimoGuardado = '';  // no se pudo: se vuelve a intentar en este mismo punto
  $('guardado').textContent = ok ? `Guardada · ${S.temporada}` : '';
}
async function leerGuardada() {
  if (almacen) { try { const d = await almacen.get(); if (d.exists) return d.data(); } catch (e) { /* sigue con el navegador */ } }
  try { const x = localStorage.getItem(CLAVE); return x ? JSON.parse(x) : null; } catch (e) { return null; }
}
// La foto del mundo de la última temporada empezada va en este navegador (IndexedDB): es grande para la base de datos.
// Si falta o no coincide, la partida se recupera repitiéndola como antes.
function fotos(modo, hacer) {
  return new Promise((res) => {
    try {
      const pet = indexedDB.open('universo-futbol', 1);
      pet.onupgradeneeded = () => pet.result.createObjectStore('fotos');
      pet.onerror = () => res(null);
      pet.onsuccess = () => {
        try {
          const tx = pet.result.transaction('fotos', modo), r = hacer(tx.objectStore('fotos'));
          tx.oncomplete = () => res(r && r.result !== undefined ? r.result : null);
          tx.onerror = tx.onabort = () => res(null);
        } catch (e) { res(null); }
      };
    } catch (e) { res(null); }
  });
}
const guardarFoto = (f) => fotos('readwrite', (st) => st.put({ semilla, numPartida, anio: anioInicio, k: f.k, W: f.W, rr: f.rr, cerradas: f.cerradas, teletipo: f.teletipo }, 'ultima'));
const leerFoto = () => fotos('readonly', (st) => st.get('ultima'));
async function borrarGuardada() {
  await fotos('readwrite', (st) => st.delete('ultima'));
  if (almacen) { try { await almacen.delete(); } catch (e) { /* nada */ } }
  try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
}

// ---------- Titulares por paso ----------
function tablaHasta(T, n, puntos) {
  const t = {};
  T.tabla.forEach((x) => (t[x.nombre] = { nombre: x.nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0, racha: [] }));
  const pv = puntos || (S && S.R.reglas && S.R.reglas.puntosVictoria) || 2;
  T.resultados.slice(0, n).flat().forEach((m) => {
    const a = t[m.local], b = t[m.visita];
    a.pj++; b.pj++; a.gf += m.ga; a.gc += m.gb; b.gf += m.gb; b.gc += m.ga;
    if (m.ga > m.gb) { a.g++; b.p++; a.pts += pv; a.racha.push('G'); b.racha.push('P'); }
    else if (m.ga < m.gb) { b.g++; a.p++; b.pts += pv; a.racha.push('P'); b.racha.push('G'); }
    else { a.e++; b.e++; a.pts++; b.pts++; a.racha.push('E'); b.racha.push('E'); }
  });
// Con todo igualado (antes de empezar) van por orden alfabético: el orden de llegada delataría la clasificación final.
  return Object.values(t).sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || x.nombre.localeCompare(y.nombre, 'es'));
}
const esEspanol = (n) => M.clubes.some((c) => c.nombre === n && c.pais === 'España');
const enPartida = (n) => M.clubes.some((c) => c.nombre === n);
const divisionDe = (n) => (M.clubes.find((c) => c.nombre === n) || {}).division || 1;

function titularDe(p) {
  const R = S.R;
  if (p.tipo === 'pre') {
    const fav = R.T.tabla.map((t) => t.nombre).sort((a, b) => S.fuerza[b] - S.fuerza[a]).slice(0, 3);
    const eu = R.EU ? R.EU.rondas[0].cruces.flatMap((c) => [c.a, c.b]).filter((x) => x && esEspanol(x)) : [];
    return {
      titular: `Arranca la Liga ${S.temporada}`,
      entradilla: `${mayus(PRENSA.el(fav[0]))}, ${PRENSA.el(fav[1])} y ${PRENSA.el(fav[2])} salen como favoritos. ${R.EU ? `En la Copa de Europa juegan ${lista(eu.length ? eu : ['los campeones'])}.` : ''}`,
      breves: [
        { titular: 'Primera', texto: `${R.T.tabla.length} clubes, ${R.T.resultados.length} jornadas. Bajan dos y el 13.º y el 14.º van a la promoción.` },
        { titular: 'Segunda', texto: 'Dos grupos, Norte y Sur. Sube el campeón de cada uno.' }
      ].concat(cerradas.length ? [{ titular: 'Viene de', texto: `El campeón vigente es ${PRENSA.el(cerradas[cerradas.length - 1].campeon)}.` }] : [])
    };
  }
  if (p.tipo === 'jornada') {
    // La portada cuenta las mismas jornadas que enseña la tabla: una liga de 38 avanza algo más de una por paso.
    const T = R.T, tot = T.resultados.length, n = Math.round(p.j * tot / 30), n0 = Math.round((p.j - 1) * tot / 30);
    return PRENSA.portada({ res: T.resultados.slice(n0, n).flat(), antes: tablaHasta(T, n0), despues: tablaHasta(T, n), n, total: tot, puntos: (R.reglas && R.reglas.puntosVictoria) || 2, fuerza: S.fuerza, cracks: S.cracks, semilla: S.semilla, cambios: (T.cambios || []).filter((c) => c.jornada > n0 && c.jornada <= n) });
  }
  if (p.tipo === 'europa' || p.tipo === 'copa') {
    const C = p.tipo === 'europa' ? R.EU : R.C, ro = C.rondas[p.ronda];
    const nombre = p.tipo === 'europa' ? nombreEuropa(S) : 'Copa';
    if (ro.nombre === 'Final') return PRENSA.finalCopa(C);
    if (ro.grupos) {
      const lideres = ro.grupos.map((g) => g.tabla[0].nombre), fuera = ro.grupos.flatMap((g) => g.tabla.slice(2).map((t) => t.nombre));
      const esp = ro.grupos.flatMap((g) => g.tabla.filter((t) => esEspanol(t.nombre)).map((t) => `${PRENSA.el(t.nombre)} ${t.pasa ? 'pasa' : 'cae'} (${g.nombre}, ${t.pts} puntos)`));
      return { titular: `${nombre}: acaba la fase de grupos`, entradilla: `Pasan como primeros ${lista(lideres)}. ${esp.length ? mayus(esp.join('; ')) + '.' : ''}`,
        breves: fuera.slice(0, 3).map((n) => ({ titular: `${mayus(PRENSA.el(n))}, eliminado en la fase de grupos`, texto: '' })) };
    }
    const cr = ro.cruces.filter((c) => c.b);
    // Lo que más importa: los españoles en Europa; en la Copa, las sorpresas de los de abajo.
    const interes = p.tipo === 'europa'
      ? cr.filter((c) => esEspanol(c.a) || esEspanol(c.b))
      : cr.filter((c) => divisionDe(c.ganador) > divisionDe(c.ganador === c.a ? c.b : c.a));
    const frase = (c) => { const pierde = c.ganador === c.a ? c.b : c.a; return `${mayus(PRENSA.el(c.ganador))} elimina ${PRENSA.al(pierde)} (${marcadorCruce(c)})`; };
    const top = interes[0] || cr[0];
    return {
      titular: top ? `${nombre}: ${frase(top).replace(/ \(.*\)$/, '')}` : `${nombre}: ${ro.nombre.toLowerCase()}`,
      entradilla: `${ro.nombre}. ${(interes.length ? interes : cr).concat(cr.filter((c) => !interes.includes(c))).slice(0, 4).map(frase).join('. ')}.`,
      breves: interes.slice(1, 4).map((c) => ({ titular: frase(c).replace(/ \(.*\)$/, ''), texto: marcadorCruce(c) }))
    };
  }
  if (p.tipo === 'promocion') {
    return {
      titular: 'Promoción: se deciden las plazas de Primera',
      entradilla: R.promos.map((x) => `${mayus(PRENSA.el(x.ganador))} ${x.ganador === x.primera ? 'se salva ante' : 'sube a costa'} ${x.ganador === x.primera ? PRENSA.el(x.segunda) : PRENSA.del(x.primera)}`).join('. ') + '.',
      breves: R.promos.map((x) => ({ titular: `${x.primera} – ${x.segunda}`, texto: x.cruce.partidos.map((m) => `${m.ga}-${m.gb}`).join(' · ') }))
    };
  }
  if (p.tipo === 'cierre') {
    const pr = R.premios;
    return {
      titular: `${mayus(PRENSA.el(S.campeon))}, campeón de Liga ${S.temporada}`,
      entradilla: `Copa para ${PRENSA.el(S.copa)}${S.europa ? `, Copa de Europa para ${PRENSA.el(S.europa)}` : ''}. Pichichi: ${pr.pichichi.nombre} con ${pr.pichichi.g} goles.`,
      breves: [
        pr.mejor && { titular: 'Mejor jugador', texto: `${pr.mejor.nombre} (${pr.mejor.club}), nota ${pr.mejor.notaTemp.toFixed(2)}` },
        pr.zamora && { titular: 'Zamora', texto: `${pr.zamora.nombre}, ${pr.zamora.enc} goles en ${pr.zamora.pj} partidos` },
        pr.revelacion && { titular: 'Revelación', texto: `${pr.revelacion.nombre} (${pr.revelacion.club})` },
        { titular: 'Bajan', texto: R.bajan.map((c) => c.nombre).join(' y ') },
        ...(S.otros || []).filter((o) => o.campeon || o.campeones.length).map((o) => ({ titular: `Campeón en ${o.pais}`, texto: o.campeon || o.campeones.map((x) => `${x.club} (${x.grupo})`).join(', ') }))
      ].filter(Boolean)
    };
  }
  // Verano
  const mer = S.mercado || [];
  const fich = mer.filter((x) => x.tipo === 'fichaje').sort((a, b) => b.niv - a.niv);
  const ini = (j) => (j.inicio ? j.inicio.niv : j.niv);
  const ret = (S.retiros || []).sort((a, b) => ini(b.j) - ini(a.j));
  const deb = mer.filter((x) => x.tipo === 'debut').sort((a, b) => b.tec - a.tec);
  const suben = (S.movimientos || []).filter((m) => m.a === 'Primera').map((m) => m.club);
  const gordo = fich[0], adios = ret[0];
  return {
    titular: adios && ini(adios.j) >= 850 ? `Se retira ${adios.j.n}` : gordo ? `${gordo.jugador} ficha por ${PRENSA.el(gordo.a)}` : `Verano de ${S.anio + 1}`,
    entradilla: `${fich.length} fichajes, ${ret.length} retiros y ${deb.length} debutantes. ${gordo ? `El fichaje del verano: ${gordo.jugador}, ${PRENSA.del(gordo.de)} ${PRENSA.al(gordo.a)}.` : ''}`,
    breves: [
      suben.length && { titular: 'Suben a Primera', texto: suben.join(', ') },
      adios && { titular: 'Se retira', texto: `${adios.j.n}, a los ${adios.edad} años` },
      deb.length && { titular: 'Debutan', texto: deb.slice(0, 3).map((x) => `${x.jugador} (${x.a})`).join(', ') }
    ].filter(Boolean)
  };
}


// ---------- Lo que pasó de verdad (marca ≠) ----------
// Nunca se pone al lado: solo una marca pequeña donde la partida se separa de la realidad; al tocarla, lo real.
// Copa de Europa: campeón real por año de inicio de la temporada.
const EUROPA_REAL = (() => {
  const r = {}, pon = (desde, hasta, club) => { for (let a = desde; a <= hasta; a++) r[a] = club; };
  pon(1955, 1959, 'Real Madrid'); pon(1960, 1961, 'Benfica'); pon(1962, 1962, 'Milan'); pon(1963, 1964, 'Inter'); pon(1965, 1965, 'Real Madrid');
  pon(1966, 1966, 'Celtic'); pon(1967, 1967, 'Manchester United'); pon(1968, 1968, 'Milan'); pon(1969, 1969, 'Feyenoord'); pon(1970, 1972, 'Ajax');
  pon(1973, 1975, 'Bayern Múnich'); pon(1976, 1977, 'Liverpool'); pon(1978, 1979, 'Nottingham Forest'); pon(1980, 1980, 'Liverpool'); pon(1981, 1981, 'Aston Villa');
  pon(1982, 1982, 'Hamburgo'); pon(1983, 1983, 'Liverpool'); pon(1984, 1984, 'Juventus'); pon(1985, 1985, 'Steaua de Bucarest'); pon(1986, 1986, 'Oporto');
  pon(1987, 1987, 'PSV Eindhoven'); pon(1988, 1989, 'Milan'); pon(1990, 1990, 'Estrella Roja'); pon(1991, 1991, 'Barcelona'); pon(1992, 1992, 'Marsella');
  pon(1993, 1993, 'Milan'); pon(1994, 1994, 'Ajax'); pon(1995, 1995, 'Juventus'); pon(1996, 1996, 'Borussia Dortmund'); pon(1997, 1997, 'Real Madrid');
  pon(1998, 1998, 'Manchester United'); pon(1999, 1999, 'Real Madrid'); pon(2000, 2000, 'Bayern Múnich'); pon(2001, 2001, 'Real Madrid'); pon(2002, 2002, 'Milan');
  pon(2003, 2003, 'Oporto'); pon(2004, 2004, 'Liverpool'); pon(2005, 2005, 'Barcelona'); pon(2006, 2006, 'Milan'); pon(2007, 2007, 'Manchester United');
  pon(2008, 2008, 'Barcelona'); pon(2009, 2009, 'Inter'); pon(2010, 2010, 'Barcelona'); pon(2011, 2011, 'Chelsea'); pon(2012, 2012, 'Bayern Múnich');
  pon(2013, 2013, 'Real Madrid'); pon(2014, 2014, 'Barcelona'); pon(2015, 2017, 'Real Madrid'); pon(2018, 2018, 'Liverpool'); pon(2019, 2019, 'Bayern Múnich');
  pon(2020, 2020, 'Chelsea'); pon(2021, 2021, 'Real Madrid'); pon(2022, 2022, 'Manchester City'); pon(2023, 2023, 'Real Madrid'); pon(2024, 2024, 'Paris Saint-Germain');
  return r;
})();
// Filas reales de liga de la base: [país, año, nivel, grupo, club, puesto, marca].
let REAL_LIGAS = null;
function filasReales(pais, anio) {
  if (!REAL_LIGAS) { REAL_LIGAS = new Map(); ((BASE && BASE.ligas) || []).forEach((x) => { const kk = x[0] + '|' + x[1]; if (!REAL_LIGAS.has(kk)) REAL_LIGAS.set(kk, []); REAL_LIGAS.get(kk).push(x); }); }
  return REAL_LIGAS.get(pais + '|' + anio) || [];
}
const puestoReal = (pais, anio, club) => { const x = filasReales(pais, anio).find((f) => f[4] === club && f[5]); return x ? x[5] : null; };
function campeonRealDe(pais, anio) {
  const xs = filasReales(pais, anio).filter((x) => x[2] === 1 && x[5] === 1);
  if (!xs.length) return null;
  const nacional = xs.find((x) => !x[3] || x[6] === 'campeón real');
  // Varias ligas regionales sin campeón nacional marcado: no hay con qué comparar.
  return nacional ? nacional[4] : xs.length === 1 ? xs[0][4] : null;
}
// Club real de un jugador en un año. Un último paso sin fecha de salida solo vale tres años: después no se sabe.
let JUG_REAL = null;
function clubReal(nombre, anio) {
  JUG_REAL ||= new Map(((BASE && BASE.jugadores) || []).map((j) => [j.n, j]));
  const j = JUG_REAL.get(nombre);
  if (!j) return null;
  let r = null;
  j.carrera.forEach((p, i) => {
    const hasta = p[3] != null ? p[3] : i + 1 < j.carrera.length ? j.carrera[i + 1][2] - 1 : p[2] + 3;
    if (p[2] <= anio && anio <= hasta) r = p[0];
  });
  return r;
}
const marcaDif = (real) => `<button type="button" class="dif" data-real="${esc(real)}" aria-label="Diferente a la realidad: ver qué pasó de verdad">≠</button>`;
const marcaSi = (sim, real) => (real && sim && real !== sim ? marcaDif(`De verdad: ${real}`) : '');
// Lo que la partida cambió de la historia en una temporada terminada. "grande" sale como noticia en Hoy.
const cacheDifs = new WeakMap();
function divergencias(V) {
  if (cacheDifs.has(V)) return cacheDifs.get(V);
  const xs = [];
  const eu = EUROPA_REAL[V.anio];
  if (V.europa && eu && V.europa !== eu) xs.push({ grande: true, titulo: `${V.europa} gana la ${nombreEuropa(V)} ${V.temporada}`, real: `De verdad la ganó el ${eu}.` });
  paisesDe(V).forEach((pais) => {
    const c = campeonDe(V, pais), real = campeonRealDe(pais, V.anio);
    if (c.campeon && real && c.campeon !== real) xs.push({ grande: ['España', 'Italia', 'Inglaterra'].includes(pais), titulo: `${c.campeon}, campeón de ${nombreLiga(V, pais)} ${V.temporada}`, real: `De verdad fue campeón el ${real}.` });
  });
  (V.mercado || []).filter((x) => x.tipo === 'fichaje' && nivel(x.niv) >= 560).forEach((x) => {
    const real = clubReal(x.jugador, V.anio + 1);
    if (real && real !== x.a) xs.push({ grande: nivel(x.niv) >= 640, titulo: `${x.jugador} deja el ${x.de} y ficha por el ${x.a} (${V.anio + 1})`, real: real === x.de ? `De verdad siguió en el ${x.de}.` : `De verdad jugó en el ${real}.`, jugador: x.jugador });
  });
  if (V.veranoHecho) cacheDifs.set(V, xs);
  return xs;
}

// ---------- Qué temporada se mira ----------
// verK = null sigue la temporada en curso; un número mira una temporada ya terminada (todo a la vista).
const temporadas = () => cerradas.concat(S && !cerradas.includes(S) ? [S] : []);
const VT = () => { const ts = temporadas(); return verK != null && ts[verK] ? ts[verK] : S; };
const cerradaV = (V) => V !== S || temporadaCerrada();
const rondasV = (V, tipo) => (V === S ? rondasVistas(tipo) : tipo === 'copa' ? V.R.C.rondas.length : V.R.EU ? V.R.EU.rondas.length : 0);
// Jornadas ya vistas de una liga: va al ritmo del calendario español (las de 34 o 42 jornadas, en proporción).
const vistasDe = (T, V) => (!T ? 0 : (V || S) === S ? Math.round(jornadasVistas() * T.resultados.length / 30) : T.resultados.length);
function selTemp() {
  const ts = temporadas();
  if (ts.length < 2) return '';
  const i = verK == null ? ts.length - 1 : verK;
  return `<select class="desplegable" data-accion="temporada" aria-label="Temporada">${ts.map((t, j) => `<option value="${j}"${j === i ? ' selected' : ''}>${t.temporada}${t === S && !temporadaCerrada() ? ' · en juego' : ''}</option>`).join('')}</select>`;
}

// ---------- Datos de cada país en una temporada ----------
const valorAnio = (x, anio) => { if (typeof x !== 'object' || x === null) return x; let v; Object.keys(x).map(Number).sort((a, b) => a - b).forEach((kk) => { if (anio >= kk) v = x[kk]; }); return v; };
const paisesDe = (V) => ['España'].concat((V.R.otros || []).map((o) => o.pais));
const otroEn = (V, pais) => (V.R.otros || []).find((o) => o.pais === pais);
const configPais = (pais) => (M.paises || []).find((p) => p.pais === pais);
const clubDe = (n) => M.clubes.find((c) => c.nombre === n);
const paisClub = (n) => (clubDe(n) || {}).pais;
// Las ligas de un país; "clave" es el nombre con el que cuentan sus partidos en las cifras de cada jugador.
function ligasDe(V, pais) {
  if (pais === 'España') return [{ grupo: 'Primera', nivel: 1, T: V.R.T, clave: 'Liga' }].concat(V.R.seg.map((s) => ({ grupo: s.grupo, nivel: 2, T: s.T, clave: 'Segunda' })));
  const o = otroEn(V, pais);
  return o ? o.ligas.map((l) => ({ grupo: l.grupo, nivel: l.nivel, T: l.T, clave: l.grupo })) : [];
}
const copaDe = (V, pais) => (pais === 'España' ? V.R.C : (otroEn(V, pais) || {}).C || null);
const reglasDe = (V, pais) => (pais === 'España' ? V.R.reglas : (otroEn(V, pais) || {}).reglas) || {};
const nombreLiga = (V, pais) => reglasDe(V, pais).liga || (pais === 'España' ? 'Primera División' : 'Liga');
const clavesTop = (V, pais) => ligasDe(V, pais).filter((l) => l.nivel === 1).map((l) => l.clave);
const golesLiga = (x, claves) => claves.reduce((s, kk) => s + ((x.por[kk] || {}).g || 0), 0);
function campeonDe(V, pais) {
  if (pais === 'España') return { campeon: V.campeon, sub: V.R.T.tabla[1].nombre, campeones: [] };
  const o = otroEn(V, pais) || {};
  return { campeon: o.campeon, sub: o.subcampeon, campeones: o.campeones || [] };
}
const mejorDe = (xs, f, minimo) => xs.filter((x) => x.pj >= (minimo || 1)).sort(f)[0] || null;
// Premios de un país: los del motor si su liga es única; si va por grupos, se calculan con sus ligas de arriba.
function premiosDe(V, pais) {
  const P = pais === 'España' ? V.R.premios : (otroEn(V, pais) || {}).premios;
  const claves = clavesTop(V, pais);
  const G = V.G.filter((x) => x.eq && x.eq.pais === pais);
  const pich = mejorDe(G.filter((x) => claves.some((kk) => x.por[kk])), (a, b) => golesLiga(b, claves) - golesLiga(a, claves) || a.pj - b.pj);
  return {
    pichichi: P && P.pichichi ? P.pichichi : pich && { nombre: pich.nombre, club: pich.club, g: golesLiga(pich, claves) },
    zamora: P ? P.zamora : null,
    mejor: P && P.mejor ? P.mejor : mejorDe(G, (a, b) => b.notaTemp - a.notaTemp, 15)
  };
}
// Jugadores de clubes de la partida que jugaron en una liga de primer nivel (los de Segunda no entran en las listas).
function figurasDe(V, pais) {
  const claves = Object.fromEntries(paisesDe(V).map((p) => [p, clavesTop(V, p)]));
  return V.G.filter((x) => x.eq && (!pais || x.eq.pais === pais) && (claves[x.eq.pais] || []).some((kk) => x.por[kk]));
}
const nombreEuropa = (V) => (V.R && V.R.EU && V.R.EU.nombre) || Epoca.nombre('europa', null, V.anio) || 'Copa de Europa';
// Para los premios de época: ligas fuera de Europa, nacionalidades no europeas y grandes ligas (Bota de Oro con coeficiente).
const NO_EUROPA_LIGA = ['Argentina', 'Brasil'];
const NO_EUROPEOS = /Brasil|Argentina|Uruguay|Paraguay|Chile|Per[uú]|Colombia|Bolivia|Ecuador|Venezuela|M[eé]xico|Estados Unidos|Canad[aá]|Costa Rica|Honduras|Jamaica|Camer[uú]n|Nigeria|Ghana|Senegal|Costa de Marfil|Marruecos|Argelia|T[uú]nez|Egipto|Mal[ií]|Guinea|Congo|Sud[aá]frica|Liberia|Jap[oó]n|Corea|China|Australia|Ir[aá]n|Arabia/;
const GRANDES_LIGAS = ['España', 'Italia', 'Inglaterra', 'Alemania', 'Francia'];
// Los premios de una temporada terminada no cambian: se calculan una vez.
const cachePremios = new WeakMap();
function premiosMundo(V) {
  if (V !== S && cachePremios.has(V)) return cachePremios.get(V);
  const G = figurasDe(V);
  const r = {
    mejor: mejorDe(G, (a, b) => b.notaTemp - a.notaTemp, 15),
    goleador: mejorDe(G, (a, b) => b.g - a.g || a.pj - b.pj),
    asistente: mejorDe(G, (a, b) => b.a - a.a || b.g - a.g),
    portero: mejorDe(G.filter((x) => x.pos === 'POR'), (a, b) => a.enc / a.pj - b.enc / b.pj || b.pj - a.pj, 20),
    revelacion: mejorDe(G.filter((x) => Motor.edad(x.j, V.anio + 1) <= 21), (a, b) => b.notaTemp - a.notaTemp, 12)
  };
  // Los premios de verdad que existen ese año (Balón de Oro desde 1956, Bota de Oro desde 1967…), con sus reglas de entonces.
  const enEuropa = (x) => !NO_EUROPA_LIGA.includes(x.eq.pais), europeo = (x) => !x.j || !x.j.nacion || !NO_EUROPEOS.test(x.j.nacion);
  const porNota = (a, b) => b.notaTemp - a.notaTemp, joven = (x) => Motor.edad(x.j, V.anio + 1) <= 21;
  const goles = (x) => x.g * (V.anio >= 1996 && GRANDES_LIGAS.includes(x.eq.pais) ? 2 : V.anio >= 1996 ? 1.5 : 1);
  // El Balón de Oro no es solo la nota: pesan los títulos. Ganar la Copa de Europa, la liga o el Mundial sube al
  // candidato; así el mejor del mundo no gana dieciséis seguidos si su equipo no gana nada.
  const R = V.R || {}, ligas = new Set([R.T && R.T.tabla[0] && R.T.tabla[0].nombre].concat((R.otros || []).map((o) => o.campeon)).filter(Boolean));
  const finalEU = R.EU && cerradaV(V) ? R.EU.rondas[R.EU.rondas.length - 1].cruces[0] : null;
  const sel = (n) => sinTildes(n || '').replace('alemania federal', 'alemania').replace('rfa', 'alemania');
  const MU = R.MU && cerradaV(V) ? R.MU : null;
  // Porteros y defensas casi nunca lo ganan: necesitan un año mucho mejor que el de los atacantes.
  const merito = (x) => x.notaTemp - (x.pos === 'POR' ? 0.5 : x.pos === 'DEF' ? 0.25 : 0)
    + (ligas.has(x.eq.nombre) && cerradaV(V) ? 0.2 : 0)
    + (finalEU ? (R.EU.campeon === x.eq.nombre ? 0.45 : (finalEU.a === x.eq.nombre || finalEU.b === x.eq.nombre) ? 0.15 : 0) : 0)
    + (MU && x.j && x.j.nacion ? (sel(MU.campeon) === sel(x.j.nacion) ? 0.5 : sel(MU.subcampeon) === sel(x.j.nacion) ? 0.15 : 0) : 0);
  const porMerito = (a, b) => merito(b) - merito(a);
  const calc = {
    balon: (q) => mejorDe(G.filter((x) => q === 'europeos' ? europeo(x) && enEuropa(x) : q === 'club europeo' ? enEuropa(x) : true), porMerito, 15),
    bota: () => mejorDe(G.filter(enEuropa), (a, b) => goles(b) - goles(a) || a.pj - b.pj),
    fifa: () => mejorDe(G, porMerito, 15), onze: () => mejorDe(G.filter(enEuropa), porNota, 15),
    golden: () => mejorDe(G.filter((x) => enEuropa(x) && joven(x)), porNota, 12), kopa: () => r.revelacion, yashin: () => r.portero
  };
  const linea = { bota: (j) => `${j.g} goles${V.anio >= 1996 ? ` · ${goles(j)} puntos` : ''}`, yashin: (j) => `${j.enc} goles en ${j.pj} partidos` };
  r.oficiales = Epoca.premios(V.anio).filter((p) => calc[p.id]).map((p) => ({ nombre: p.nombre, nota: p.nota, j: calc[p.id](p.quien), linea: linea[p.id] || ((j) => `nota ${j.notaTemp.toFixed(2)}`) })).filter((x) => x.j);
  r.nombreMejor = (Epoca.premios(V.anio).find((p) => p.id === 'balon' || p.id === 'fifa') || {}).nombre || 'Mejor jugador del mundo';
  r.ganadorMejor = (r.oficiales.find((x) => x.nombre === r.nombreMejor) || {}).j || r.mejor;
  cachePremios.set(V, r);
  return r;
}
// Ascensos y descensos de la primera categoría de un país.
function ascensosDe(V, pais) {
  const mov = V.movimientos || [], nombres = (xs) => xs.map((m) => m.club);
  if (pais === 'España') return { suben: nombres(mov.filter((m) => m.a === 'Primera' && !m.pais)), bajan: nombres(mov.filter((m) => m.a === 'Segunda' && !m.de && !m.pais)) };
  const xs = mov.filter((m) => m.pais === pais), P = configPais(pais) || {};
  if (ligasDe(V, pais).some((l) => l.nivel === 2)) return { suben: nombres(xs.filter((m) => m.sube && !m.de)), bajan: nombres(xs.filter((m) => !m.sube && m.a !== P.abajo)) };
  return { suben: nombres(xs.filter((m) => m.de)), bajan: nombres(xs.filter((m) => !m.sube)) };
}
// Goles y asistencias de unas ligas en lo que va de temporada.
function golesEnMarcha(V, filtro, ligasFiltro) {
  const t = new Map();
  paisesDe(V).filter((p) => !filtro || p === filtro).forEach((pais) => ligasDe(V, pais).filter((l) => (ligasFiltro ? ligasFiltro.includes(l.grupo) : l.nivel === 1)).forEach((l) => {
    l.T.resultados.slice(0, vistasDe(l.T, V)).flat().forEach((m) => m.eventos.forEach((e) => {
      if (e.tipo !== 'gol' && e.tipo !== 'pen') return;
      const club = e.lado === 0 ? m.local : m.visita;
      const suma = (quien, campo) => { const key = quien + '|' + club; const x = t.get(key) || { nombre: quien, club, pais, g: 0, a: 0 }; x[campo]++; t.set(key, x); };
      suma(e.quien, 'g'); if (e.asist) suma(e.asist, 'a');
    }));
  }));
  return [...t.values()];
}

// ---------- Piezas ----------
const colorClub = (n) => { const c = INFO.clubes[n]; return c ? `<span class="color" style="background:linear-gradient(90deg, ${c.c1} 50%, ${c.c2} 50%)" aria-hidden="true"></span>` : '<span class="color" aria-hidden="true"></span>'; };
const botonClub = (n) => `<button type="button" class="club" data-c="${esc(n)}">${colorClub(n)}<span>${esc(n)}</span></button>`;
const nombreJ = (n) => `<button type="button" class="nombre" data-j="${esc(n)}">${esc(n)}</button>${esFicticio(n) ? '<span title="Jugador inventado: no hay datos de esta plantilla">*</span>' : ''}`;
const premio = (titulo, j, linea) => (j ? `<div class="premio"><span>${titulo}</span><b>${nombreJ(j.nombre)}</b><small>${esc(j.club)}${paisClub(j.club) ? ' (' + esc(paisClub(j.club)) + ')' : ''} · ${linea(j)}</small></div>` : '');
const cachorro = (txt) => txt; // texto tal cual (para que se lea igual en el código que en la página)
const goleadorFila = (j, i, cifra, extra) => `<div class="goleador"><span class="n">${i + 1}</span><span class="quien">${nombreJ(j.nombre)}<small>${esc(j.club)}${extra ? ' · ' + extra : ''}</small></span><span class="cifra">${cifra}</span></div>`;
function incidencias(m) {
  return m.eventos.filter((e) => e.tipo === 'gol' || e.tipo === 'pen' || e.tipo === 'roja').map((e) =>
    e.tipo === 'roja' ? `roja a ${esc(corto(e.quien))} ${e.min}'` : `${esc(corto(e.quien))} ${e.min}'${e.tipo === 'pen' ? ' (p)' : ''}`).join(', ');
}
// Cada partido se puede abrir en su hoja: se guarda una referencia por número.
const PARTIDOS = new Map();
let numP = 0;
const regP = (m, comp) => { while (!m._id || (PARTIDOS.has(m._id) && PARTIDOS.get(m._id).m !== m)) m._id = ++numP; PARTIDOS.set(m._id, { m, comp }); return m._id; };
const selloDerbi = (m) => (m.derbi ? `<span class="sello">${esc(m.derbi)}</span> ` : '');
const partidos = (ms, comp) => ms.map((m) => `<button type="button" class="partido" data-partido="${regP(m, comp)}"><span>${esc(m.local)}</span><b>${m.ga}-${m.gb}</b><span>${esc(m.visita)}</span></button><div class="goles-partido">${selloDerbi(m)}${incidencias(m) || 'Sin goles'}</div>`).join('');
function fichaPartido(id) {
  const x = PARTIDOS.get(id);
  if (!x) return '<div class="vacio">Partido no encontrado.</div>';
  const m = x.m, ico = { gol: '⚽', pen: '⚽', roja: '🟥', amarilla: '🟨', lesion: '✚', penFallado: '✗' };
  const txt = (e) => e.tipo === 'gol' ? `${nombreJ(e.quien)}${e.asist ? `<small> asist. ${esc(corto(e.asist))}</small>` : ''}` : e.tipo === 'pen' ? `${nombreJ(e.quien)} <small>de penalti</small>` : e.tipo === 'roja' ? `${nombreJ(e.quien)} <small>expulsado</small>` : e.tipo === 'amarilla' ? `${nombreJ(e.quien)} <small>amarilla</small>` : e.tipo === 'lesion' ? `${nombreJ(e.quien)} <small>se lesiona${e.semanas ? ` · ${e.semanas} semana${e.semanas > 1 ? 's' : ''} de baja` : ''}</small>` : `${nombreJ(e.quien)} <small>falla un penalti</small>`;
  const ev = (m.eventos || []).filter((e) => ico[e.tipo]).map((e) => `<div class="evento ${e.lado ? 'visita' : ''}"><span class="min">${e.min}'</span><span>${ico[e.tipo]}</span><span>${txt(e)}</span></div>`).join('');
  const est = (m.estilos || []).map((k) => Motor.NOMBRE_ESTILO[k] || k);
  const gana = m.ga > m.gb ? m.local : m.gb > m.ga ? m.visita : null;
  return `<div class="arriba"><div><div class="sub">${esc(x.comp || 'Partido')}${m.derbi ? ' · ' + esc(m.derbi) : ''}</div><h1>${gana ? `Gana el ${esc(gana)}` : 'Empate'}</h1></div><div class="botones-hoja"><button type="button" class="redondo" data-cerrar aria-label="Cerrar">✕</button></div></div>`
    + `<div class="marcador"><div>${botonClub(m.local)}${est[0] ? `<small>${esc(est[0])}</small>` : ''}</div><b>${m.ga}-${m.gb}</b><div>${botonClub(m.visita)}${est[1] ? `<small>${esc(est[1])}</small>` : ''}</div></div>`
    + cronologia(m)
    + `<div class="eventos">${ev || '<div class="vacio">Sin goles ni incidencias.</div>'}</div>`
    + caraACara(m);
}
// Línea del partido: los goles de cada equipo en su minuto.
function cronologia(m) {
  const ev = (m.eventos || []).filter((e) => e.tipo === 'gol' || e.tipo === 'pen' || e.tipo === 'roja');
  if (!ev.length) return '';
  const fin = Math.max(90, ...ev.map((e) => e.min));
  const marca = (e) => `<span class="${e.tipo === 'roja' ? 'roja' : 'gol'}" style="left:${(100 * e.min / fin).toFixed(1)}%" title="${esc(corto(e.quien))} ${e.min}'"></span>`;
  return `<div class="cronologia" aria-hidden="true"><div class="pista">${ev.filter((e) => !e.lado).map(marca).join('')}</div><div class="medio"><span>0'</span><span>45'</span><span>${fin}'</span></div><div class="pista">${ev.filter((e) => e.lado).map(marca).join('')}</div></div>`;
}
// Todo lo que se han jugado estos dos clubes en la partida.
function caraACara(m0) {
  const a = m0.local, b = m0.visita, xs = [];
  for (const x of todosPartidos()) if (x.m !== m0 && ((x.m.local === a && x.m.visita === b) || (x.m.local === b && x.m.visita === a))) xs.push(x);
  if (!xs.length) return `<div class="palmares"><span class="rotulo">Cara a cara en la partida</span><div><span class="vacio">Es el primer partido entre ellos.</span><span></span></div></div>`;
  let ga = 0, e = 0, gb = 0;
  xs.forEach(({ m }) => { const fa = m.local === a ? m.ga : m.gb, fb = m.local === a ? m.gb : m.ga; if (fa > fb) ga++; else if (fa < fb) gb++; else e++; });
  return `<div class="palmares"><span class="rotulo">Cara a cara en la partida</span><div class="h2h"><span><b>${ga}</b> ${esc(corto(a))}</span><span><b>${e}</b> empates</span><span><b>${gb}</b> ${esc(corto(b))}</span></div>${xs.slice(-6).reverse().map(({ m, V, comp }) => `<button type="button" class="fila-btn" data-partido="${regP(m, comp + ' ' + V.temporada)}"><span>${esc(m.local)} – ${esc(m.visita)} <small>${esc(comp)} ${V.temporada}</small></span><span>${m.ga}-${m.gb}</span></button>`).join('')}</div>`;
}
function cruces(ro) {
  const club = (n, c) => `<span class="${c.ganador === n ? 'gana' : ''}">${esc(n)}</span>`;
  // Fase de grupos: la tabla de cada grupo y debajo sus partidos (ida · vuelta).
  if (ro.grupos) return ro.grupos.map((g) => `<div class="grupo"><h4>${esc(g.nombre)}</h4><table class="tabla mini"><thead><tr><th></th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>Pts</th></tr></thead><tbody>${g.tabla.map((t, i) => `<tr class="${t.pasa ? 'pasa' : ''}"><td>${i + 1}</td><td>${esc(t.nombre)}</td><td>${t.pj}</td><td>${t.g}</td><td>${t.e}</td><td>${t.p}</td><td>${t.gf}</td><td>${t.gc}</td><td><b>${t.pts}</b></td></tr>`).join('')}</tbody></table>${ro.cruces.filter((c) => c.grupo === g.nombre).map((c) => `<div class="cruce"><span>${esc(c.a)} – ${esc(c.b)}</span><span>${marcadorCruce(c)}</span></div>`).join('')}</div>`).join('');
  return ro.cruces.map((c) => `<div class="cruce"><span>${club(c.a, c)}${c.b ? ` – ${club(c.b, c)}` : ''}</span><span>${marcadorCruce(c)}</span></div>`).join('');
}

// Todos los partidos ya jugados de la partida (ligas, copas y Copa de Europa), para buscar cara a cara y tripletes.
function* todosPartidos() {
  for (const V of temporadas()) {
    for (const pais of paisesDe(V)) {
      for (const l of ligasDe(V, pais)) { const n = vistasDe(l.T, V); for (let i = 0; i < n; i++) for (const m of l.T.resultados[i]) yield { m, V, comp: l.nivel === 1 ? nombreLiga(V, pais) : l.grupo }; }
      const C = copaDe(V, pais);
      if (C) {
        const n = cerradaV(V) ? C.rondas.length : pais === 'España' ? rondasVistas('copa') : Math.round(rondasVistas('copa') * C.rondas.length / Math.max(1, S.R.C.rondas.length));
        for (const ro of C.rondas.slice(0, n)) for (const c of ro.cruces) for (const m of c.partidos || []) if (m.local) yield { m, V, comp: C.nombre };
      }
    }
    const EU = V.R.EU;
    if (EU) { const n = cerradaV(V) ? EU.rondas.length : rondasVistas('europa'); for (const ro of EU.rondas.slice(0, n)) for (const c of ro.cruces) for (const m of c.partidos || []) if (m.local) yield { m, V, comp: 'Copa de Europa' }; }
  }
}
// Color de un club para líneas de gráficos (si el primero es casi blanco, el segundo).
const colorLinea = (n, i) => { const c = INFO.clubes[n] || {}, claro = (h) => /^#?[EFef][0-9A-Fa-f]/.test(String(h || '').replace('#', '')); return c.c1 && !claro(c.c1) ? c.c1 : c.c2 && !claro(c.c2) ? c.c2 : ['#9E2A1F', '#1F5E9E', '#2F7A3E', '#B07A12', '#6A3D9A', '#555'][i % 6]; };
// Gráfico de líneas sencillo en SVG. invertir: el 1 arriba (posiciones).
function grafLineas(series, maxY, invertir, etiquetaY) {
  const W = 600, H = 220, iz = 28, de = 135, ar = 10, ab = 22, nX = Math.max(...series.map((x) => x.v.length));
  if (nX < 2) return '<div class="vacio">Hace falta más de una jornada.</div>';
  const X = (i) => iz + i * (W - iz - de) / (nX - 1), Y = (v) => ar + (invertir ? (v - 1) / Math.max(1, maxY - 1) : 1 - v / Math.max(1, maxY)) * (H - ar - ab);
  const ejes = [invertir ? 1 : 0, invertir ? maxY : maxY].map((v) => `<text x="${iz - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`).join('');
  const lin = series.map((sr) => `<polyline fill="none" stroke="${sr.color}" stroke-width="2.5" stroke-linejoin="round" points="${sr.v.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}"/><circle cx="${X(sr.v.length - 1)}" cy="${Y(sr.v[sr.v.length - 1])}" r="3.5" fill="${sr.color}"/>`).join('');
  // Etiquetas al final de cada línea, separadas para que no se pisen.
  const fin = series.map((sr) => ({ sr, y: Y(sr.v[sr.v.length - 1]) })).sort((a, b) => a.y - b.y);
  fin.forEach((f, i) => { if (i && f.y - fin[i - 1].y < 13) f.y = fin[i - 1].y + 13; });
  const etq = fin.map((f) => `<text x="${X(nX - 1) + 8}" y="${f.y + 4}" fill="${f.sr.color}" class="etq">${esc((f.sr.club ? f.sr.nombre : corto(f.sr.nombre)).slice(0, 18))}</text>`).join('');
  return `<svg class="grafico-lineas" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(etiquetaY)}"><line x1="${iz}" y1="${H - ab}" x2="${W - de}" y2="${H - ab}" class="eje"/>${ejes}<text x="${iz}" y="${H - 6}">J1</text><text x="${W - de}" y="${H - 6}" text-anchor="end">J${nX}</text>${lin}${etq}</svg>`;
}

// ---------- Seguidos ★ (en este navegador) ----------
const CLAVE_SIGUES = 'universo-futbol-sigues';
let sigues = [];
try { sigues = JSON.parse(localStorage.getItem(CLAVE_SIGUES) || '[]'); } catch (e) { sigues = []; }
if (!Array.isArray(sigues)) sigues = [];
const siguiendo = (tipo, n) => sigues.some((x) => x.tipo === tipo && x.n === n);
function alternarSigue(tipo, n) {
  sigues = siguiendo(tipo, n) ? sigues.filter((x) => !(x.tipo === tipo && x.n === n)) : sigues.concat([{ tipo, n }]);
  try { localStorage.setItem(CLAVE_SIGUES, JSON.stringify(sigues)); } catch (e) { /* solo en esta visita */ }
}

// ---------- Pintar ----------
let seccion = 'hoy';
function pintar() {
  pintarMandos();
  if (!S) return;
  $('cargando').hidden = true;
  if (verK != null && !temporadas()[verK]) verK = null;
  $('temporadaTxt').textContent = S.temporada; ponerEra(S.anio);
  $('progresoBar').style.width = `${Math.round(100 * ((fin || finDeTemporada()) ? 1 : Math.min(1, jornadasVistas() / 30)))}%`;
  $('fechaTxt').textContent = fin ? 'Fin de la partida' : finDeTemporada() ? `Temporada terminada · verano de ${S.anio + 1}` : fechaDe(paso());
  document.querySelectorAll('#navegar button').forEach((b) => {
    if (b.dataset.s === seccion) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    b.classList.toggle('nuevo', nuevoEn.has(b.dataset.s));
  });
  ['hoy', 'comp', 'mundo', 'historia'].forEach((s) => ($('s-' + s).hidden = s !== seccion));
  ({ hoy: pintarHoy, comp: pintarComp, mundo: pintarMundo, historia: pintarHistoria })[seccion]();
  plegar($('s-' + seccion));
}
// Las listas largas de las tarjetas enseñan las 5 primeras filas y un botón para ver todo (se recuerda lo abierto).
const abiertas = new Set();
function plegar(raiz) {
  if (!raiz) return;
  raiz.querySelectorAll('.columnas > .caja').forEach((caja) => {
    const filas = [...caja.children].filter((x) => x.matches('.resultado, .goleador, .momento'));
    const rot = caja.querySelector('.rotulo'), clave = rot ? rot.textContent.replace(/\d+/g, '') : '';
    if (filas.length <= 6 || abiertas.has(clave) || caja.querySelector('.ver-todo')) return;
    const max = caja.classList.contains('lideres') ? 8 : 5;
    if (filas.length <= max + 1) return;
    filas.slice(max).forEach((f) => f.classList.add('plegado'));
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ver-todo'; b.textContent = `Ver todo (${filas.length})`;
    b.addEventListener('click', () => { abiertas.add(clave); filas.forEach((f) => f.classList.remove('plegado')); b.remove(); });
    caja.appendChild(b);
  });
}
function marcarNuevo(xs) { xs.forEach((x) => { if (x !== seccion) nuevoEn.add(x); }); }

// Mandos de tiempo: una semana, un mes, la temporada entera (se para sola en los momentos grandes) y pausa.
function pintarMandos() {
  const t = $('tiempo');
  if (!S || ocupado && !jugando) {
    t.innerHTML = `<button type="button" class="grande" disabled>${S ? 'Simulando…' : 'Preparando…'}</button>`;
    return;
  }
  if (fin || (finDeTemporada() && !hayOtra())) { t.innerHTML = `<button type="button" class="grande" disabled>Fin de la partida · ${TEMPORADAS} temporadas</button>`; return; }
  if (finDeTemporada()) { t.innerHTML = `<button type="button" class="grande" data-tiempo="siguiente">▶ Empezar la temporada ${Mundo.temporadaTxt(S.anio + 1)}</button>`; return; }
  const b = (id, txt, activo) => `<button type="button" data-tiempo="${id}" aria-pressed="${activo}">${txt}</button>`;
  t.innerHTML = b('semana', 'Semana', false) + b('mes', 'Mes', jugando && modo === 'mes') + b('temporada', jugando && modo === 'temporada' && rapido ? 'Temp. ×3' : 'Temporada', jugando && modo === 'temporada') + b('fin', '⏭ Final', false) + b('pausa', 'Pausa', !jugando);
}

// ---------- Hoy: el periódico de la época ----------
// Las grandes noticias de la semana en todas las ligas: goleadas, tripletes, líderes nuevos.
function historiasSemana() {
  const V = S, out = [], n30 = jornadasVistas();
  paisesDe(V).forEach((pais) => {
    const top = ligasDe(V, pais).filter((l) => l.nivel === 1);
    top.forEach((l) => {
      const T = l.T, n = vistasDe(T, V), nAntes = Math.round((n30 - 1) * T.resultados.length / 30);
      if (!n || n === nAntes || paso().tipo !== 'jornada') return;
      const pv = reglasDe(V, pais).puntosVictoria;
      const etiqueta = top.length > 1 ? l.grupo : nombreLiga(V, pais);
      T.resultados.slice(nAntes, n).flat().forEach((m) => {
        const porJ = {};
        m.eventos.forEach((e) => { if (e.tipo === 'gol' || e.tipo === 'pen') porJ[e.quien] = (porJ[e.quien] || 0) + 1; });
        Object.entries(porJ).forEach(([q, g]) => {
          if (siguiendo('j', q)) out.push({ peso: 9 + g, seccion: '★ Sigues', titular: `${q} marca ${g === 1 ? 'un gol' : g + ' goles'}`, texto: `${m.local} ${m.ga}-${m.gb} ${m.visita}.`, jugador: q });
          if (g < 3) return;
          const club = m.eventos.find((e) => e.quien === q).lado === 0 ? m.local : m.visita;
          out.push({ peso: 4 + g * 2 + (S.cracks.has(q) ? 6 : 0), seccion: etiqueta, titular: `${q} marca ${['', '', '', 'tres', 'cuatro', 'cinco', 'seis'][g] || g} goles con el ${club}`, texto: `${m.local} ${m.ga}-${m.gb} ${m.visita}.`, jugador: q });
        });
        [m.local, m.visita].filter((c) => siguiendo('c', c)).forEach((c) => {
          const gf = c === m.local ? m.ga : m.gb, gc = c === m.local ? m.gb : m.ga;
          out.push({ peso: 6, seccion: '★ Sigues', titular: `${c}: ${gf > gc ? 'victoria' : gf < gc ? 'derrota' : 'empate'} ${gf}-${gc}`, texto: `${m.local} ${m.ga}-${m.gb} ${m.visita}.` });
        });
        const dif = Math.abs(m.ga - m.gb);
        if (dif >= 4) {
          const gana = m.ga > m.gb ? m.local : m.visita, pierde = gana === m.local ? m.visita : m.local;
          out.push({ peso: dif * 1.5 + ((S.fuerza[pierde] || 0) > (S.fuerza[gana] || 0) ? 4 : 0), seccion: etiqueta, titular: `${gana} golea al ${pierde}`, texto: `${m.local} ${m.ga}-${m.gb} ${m.visita}.` });
        }
      });
      const antes = tablaHasta(T, nAntes, pv), despues = tablaHasta(T, n, pv);
      const resto = (k2) => T.resultados.length - k2, mat = (tb, k2) => tb.length > 1 && tb[0].pts - tb[1].pts > resto(k2) * (pv || 2);
      if (mat(despues, n) && !mat(antes, nAntes)) out.push({ peso: 16, seccion: etiqueta, titular: `¡${despues[0].nombre}, campeón${resto(n) ? ` a falta de ${resto(n)} ${resto(n) === 1 ? 'jornada' : 'jornadas'}` : ''}!`, texto: `${despues[0].pts} puntos, ${despues[0].pts - despues[1].pts} más que el ${despues[1].nombre}. Ya nadie le alcanza.` });
      if (nAntes > 0 && antes[0].nombre !== despues[0].nombre) {
        const cae = despues.findIndex((x) => x.nombre === antes[0].nombre) + 1;
        out.push({ peso: 8, seccion: etiqueta, titular: `${despues[0].nombre}, nuevo líder`, texto: `${despues[0].pts} puntos tras la jornada ${n}. El ${antes[0].nombre} cae al ${cae}.º puesto.` });
      }
    });
  });
  return out.sort((a, b) => b.peso - a.peso);
}
function pintarHoy() {
  const p = paso(), V = S;
  const cab = (derecha) => `<div class="cabecera-diario" title="Atajos: espacio juega o para, → una semana, M un mes, F al final, 1-4 secciones"><div class="nombre">La semana en el mundo</div><div class="bajo"><span>${esc(fechaDe(p).split(' · ').pop())}</span><span>${esc(derecha)}</span></div></div>`;
  if (finDeTemporada() || fin) { $('s-hoy').innerHTML = cab('Edición especial') + edicionEspecial(V); return; }
  const t = titularDe(p);
  const mundo = historiasSemana();
  // Portada: lo más grande de la semana; la crónica española entra como una noticia más.
  const espana = { peso: p.tipo === 'jornada' ? 7 : 20, seccion: p.tipo === 'jornada' ? 'Primera División' : p.tipo === 'europa' ? nombreEuropa(S) : p.tipo === 'copa' ? S.R.C.nombre : 'La temporada', titular: t.titular, texto: t.entradilla || '' };
  const todas = [espana].concat(mundo).sort((a, b) => b.peso - a.peso);
  const lead = todas[0], resto = todas.slice(1, 7);
  const breves = resto.map((x) => `<div class="breve"><span class="rotulo rojo">${esc(x.seccion)}</span><b>${esc(x.titular)}</b><span>${esc(x.texto)}</span></div>`).join('')
    + (t.breves || []).slice(0, lead === espana ? 3 : 0).map((b) => `<div class="breve"><span class="rotulo">España</span><b>${esc(b.titular)}</b><span>${esc(b.texto)}</span></div>`).join('');
  // Pichichi del mundo en lo que va de año.
  const goles = golesEnMarcha(V).sort((a, b) => b.g - a.g).slice(0, 5);
  // Resultados grandes: los partidos de la semana entre los clubes más fuertes.
  const grandes = [];
  if (p.tipo === 'jornada') paisesDe(V).forEach((pais) => ligasDe(V, pais).filter((l) => l.nivel === 1).forEach((l) => {
    const n = vistasDe(l.T, V), nAntes = Math.round((jornadasVistas() - 1) * l.T.resultados.length / 30);
    l.T.resultados.slice(nAntes, n).flat().forEach((m) => grandes.push({ m, pais, peso: Math.min(S.fuerza[m.local] || 0, S.fuerza[m.visita] || 0) }));
  }));
  const res = p.tipo === 'jornada'
    ? grandes.sort((a, b) => b.peso - a.peso).slice(1, 7).map(({ m, pais }) => `<button type="button" class="resultado fila-btn" data-partido="${regP(m, pais)}"><span>${selloDerbi(m)}${esc(m.local)} – ${esc(m.visita)}<small>${esc(pais)}</small></span><b>${m.ga}-${m.gb}</b></button>`).join('')
    : (p.tipo === 'europa' || p.tipo === 'copa') ? cruces((p.tipo === 'europa' ? S.R.EU : S.R.C).rondas[p.ronda]) : '<div class="vacio">Sin partidos esta semana.</div>';
  // Líderes de cada liga.
  const lideres = paisesDe(V).map((pais) => {
    const top = ligasDe(V, pais).filter((l) => l.nivel === 1);
    if (!top.length) return '';
    return top.map((l) => { const n = vistasDe(l.T, V), f = tablaHasta(l.T, n, reglasDe(V, pais).puntosVictoria)[0]; return n ? `<div class="resultado"><span>${botonClub(f.nombre)}<small>${esc(top.length > 1 ? l.grupo : pais)}</small></span><b>${f.pts}</b></div>` : ''; }).join('');
  }).join('');
  // El partido de la semana: el de los dos clubes más fuertes.
  const pds = grandes[0];
  const destacado = pds ? `<button type="button" class="destacado" data-partido="${regP(pds.m, pds.pais)}"><span class="rotulo">Partido de la semana · ${esc(pds.pais)}${pds.m.derbi ? ' · ' + esc(pds.m.derbi) : ''}</span><span class="marcador-mini"><span>${esc(pds.m.local)}</span><b>${pds.m.ga}-${pds.m.gb}</b><span>${esc(pds.m.visita)}</span></span><small>${incidencias(pds.m) || 'Sin goles'} · toca para ver la hoja</small></button>` : '';
  $('s-hoy').innerHTML = cab(p.tipo === 'jornada' ? `Jornada ${p.j}` : fechaCorta(p))
    + `<article class="noticia noticia-principal"><span class="rotulo rojo">${esc(lead.seccion)}</span><h1 class="titulo">${esc(lead.titular)}</h1><p>${esc(lead.texto)}</p></article>`
    + `<div class="actualidad">${destacado}<div class="breves">${breves}</div></div>`
    + `<div class="columnas">${crackSemana(grandes)}${carteleraHtml(V)}${pronosticosHtml()}${seguidosHtml()}${rachasHtml(V)}
        <div class="caja"><span class="rotulo">Resultados grandes</span>${res}</div>
        <div class="caja lideres"><span class="rotulo">Líderes</span>${lideres || '<div class="vacio">Las ligas aún no han empezado.</div>'}</div>
        <div class="caja"><span class="rotulo">Goleadores del mundo</span>${goles.length ? goles.map((j, i) => goleadorFila(j, i, j.g, esc(j.pais))).join('') : '<div class="vacio">Todavía no hay goles.</div>'}</div>
      </div>`;
}
// El jugador de la semana: goles y asistencias en los partidos de primera de esta jornada.
function crackSemana(grandes) {
  const t = new Map();
  grandes.forEach(({ m, pais }) => m.eventos.forEach((e) => {
    const suma = (q, pts, campo, lado) => { const kk = q; const x = t.get(kk) || { nombre: q, club: lado === 0 ? m.local : m.visita, pais, g: 0, a: 0, pts: 0, m }; x.pts += pts; x[campo]++; t.set(kk, x); };
    if (e.tipo === 'gol' || e.tipo === 'pen') { suma(e.quien, 3, 'g', e.lado); if (e.asist) suma(e.asist, 1.5, 'a', e.lado); }
  }));
  const x = [...t.values()].sort((a, b) => b.pts - a.pts || (S.cracks.has(b.nombre) ? 1 : 0) - (S.cracks.has(a.nombre) ? 1 : 0))[0];
  if (!x) return '';
  return `<div class="caja"><span class="rotulo">Crack de la semana</span><div class="crack"><span class="estrella" aria-hidden="true">★</span><span><b>${nombreJ(x.nombre)}</b><small>${esc(x.club)} · ${esc(x.pais)}</small><small>${x.g ? `${x.g} ${x.g === 1 ? 'gol' : 'goles'}` : ''}${x.g && x.a ? ' y ' : ''}${x.a ? `${x.a} ${x.a === 1 ? 'asistencia' : 'asistencias'}` : ''} · <button type="button" class="nombre" data-partido="${regP(x.m, x.pais)}">${esc(x.m.local)} ${x.m.ga}-${x.m.gb} ${esc(x.m.visita)}</button></small></span></div></div>`;
}
// Lo que viene: los partidos grandes de la próxima jornada.
function carteleraHtml(V) {
  if (finDeTemporada()) return '';
  const xs = [];
  paisesDe(V).forEach((pais) => ligasDe(V, pais).filter((l) => l.nivel === 1).forEach((l) => {
    const n = vistasDe(l.T, V); if (n >= l.T.resultados.length) return;
    l.T.resultados[n].forEach((m) => xs.push({ m, pais, peso: Math.min(S.fuerza[m.local] || 0, S.fuerza[m.visita] || 0) + (m.derbi ? 1e6 : 0) }));
  }));
  const top = xs.sort((a, b) => b.peso - a.peso).slice(0, 5);
  return top.length ? `<div class="caja"><span class="rotulo">Lo que viene</span>${top.map(({ m, pais }) => `<div class="resultado"><span>${selloDerbi(m)}${esc(m.local)} – ${esc(m.visita)}<small>${esc(pais)}</small></span><b>vs</b></div>`).join('')}</div>` : '';
}
// Pronósticos: eliges el campeón de cada liga hasta la jornada 10 y al final se ve cuántos acertaste.
const CLAVE_PRON = 'universo-futbol-pronosticos';
let pron = {};
try { pron = JSON.parse(localStorage.getItem(CLAVE_PRON) || '{}') || {}; } catch (e) { pron = {}; }
// Son opcionales: vienen apagados, se encienden en el inicio y se quitan desde su propia caja.
const CLAVE_PRON_ON = 'universo-futbol-pronosticos-on';
let pronOn = false;
try { pronOn = localStorage.getItem(CLAVE_PRON_ON) === 'si'; } catch (e) { pronOn = false; }
function ponerPron(si) { pronOn = !!si; try { localStorage.setItem(CLAVE_PRON_ON, pronOn ? 'si' : 'no'); } catch (e) { /* solo en esta visita */ } }
const clavePron = (V) => `${semilla}|${numPartida}|${V.temporada}`;
const paisesPron = (V) => paisesDe(V).filter((p) => ligasDe(V, p).filter((l) => l.nivel === 1).length === 1);
function guardarPron(pais, club) {
  const kk = clavePron(S); pron[kk] = Object.assign({}, pron[kk], { [pais]: club });
  if (!club) delete pron[kk][pais];
  try { localStorage.setItem(CLAVE_PRON, JSON.stringify(pron)); } catch (e) { /* solo en esta visita */ }
}
function pronosticosHtml() {
  if (!pronOn) return '';
  const V = S, mis = pron[clavePron(V)] || {}, abierto = jornadasVistas() < 10;
  if (!abierto && !Object.keys(mis).length) return '';
  const filas = paisesPron(V).map((pais) => {
    const L = ligasDe(V, pais).find((l) => l.nivel === 1);
    const clubes = L.T.tabla.map((t) => t.nombre).sort((a, b) => (S.fuerza[b] || 0) - (S.fuerza[a] || 0));
    return `<div class="resultado"><span>${esc(pais)}</span>${abierto ? `<select class="desplegable chico" data-accion="pron" data-pais="${esc(pais)}" aria-label="Campeón de ${esc(pais)}"><option value="">Elige…</option>${clubes.map((c) => `<option${mis[pais] === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>` : `<b>${esc(mis[pais] || '–')}</b>`}</div>`;
  }).join('');
  return `<div class="caja"><span class="rotulo">Tus pronósticos · ¿quién gana cada liga?<button type="button" class="copiar" data-quitar-pron style="float:right;margin:0;min-height:28px;padding:0 10px;font-size:12px">Quitar</button></span>${filas}<p class="nota-pie">${abierto ? 'Puedes cambiarlos hasta la jornada 10.' : 'Cerrados. Al final de la temporada verás cuántos acertaste.'}</p></div>`;
}
function resultadoPron(V) {
  const mis = pron[clavePron(V)];
  if (!pronOn || !mis || !Object.keys(mis).length) return '';
  const filas = Object.entries(mis).map(([pais, club]) => { const c = campeonDe(V, pais).campeon; return `<div class="resultado"><span>${esc(pais)}<small>dijiste ${esc(club)}${c ? ` · ganó ${esc(c)}` : ''}</small></span><b class="${c === club ? 'bien' : 'mala'}">${c === club ? '✓' : '✗'}</b></div>`; });
  const ok = Object.entries(mis).filter(([pais, club]) => campeonDe(V, pais).campeon === club).length;
  // Total de la partida, con todas las temporadas terminadas.
  let tot = 0, de = 0;
  cerradas.concat(cerradas.includes(V) ? [] : [V]).forEach((W) => { const x = pron[clavePron(W)] || {}; Object.entries(x).forEach(([pais, club]) => { de++; if (campeonDe(W, pais).campeon === club) tot++; }); });
  return `<div class="caja"><span class="rotulo">Tus pronósticos: ${ok} de ${Object.keys(mis).length}</span>${filas.join('')}<p class="nota-pie">En toda la partida llevas ${tot} aciertos de ${de}.</p></div>`;
}
// Rachas de las ligas de primera: invictos, victorias seguidas y goleadores que no fallan.
function rachasHtml(V) {
  const xs = [];
  paisesDe(V).forEach((pais) => ligasDe(V, pais).filter((l) => l.nivel === 1).forEach((l) => {
    const n = vistasDe(l.T, V); if (n < 4) return;
    const donde = ligasDe(V, pais).filter((x) => x.nivel === 1).length > 1 ? l.grupo : pais;
    tablaHasta(l.T, n, reglasDe(V, pais).puntosVictoria).forEach((t) => {
      const r = t.racha, cola = (f) => { let c = 0; for (let i = r.length - 1; i >= 0 && f(r[i]); i--) c++; return c; };
      const inv = cola((x) => x !== 'P'), vic = cola((x) => x === 'G'), der = cola((x) => x === 'P');
      if (vic >= 5) xs.push({ peso: vic * 2, club: t.nombre, txt: `${vic} victorias seguidas`, donde });
      else if (inv >= 8) xs.push({ peso: inv, club: t.nombre, txt: `${inv} partidos sin perder`, donde });
      if (der >= 5) xs.push({ peso: der * 1.5, club: t.nombre, txt: `${der} derrotas seguidas`, donde, mala: true });
    });
    const seguidas = new Map();
    l.T.resultados.slice(0, n).forEach((jor) => {
      const marcan = new Set();
      jor.forEach((m) => m.eventos.forEach((e) => { if (e.tipo === 'gol' || e.tipo === 'pen') marcan.add(e.quien + '|' + (e.lado ? m.visita : m.local)); }));
      [...seguidas.keys()].forEach((kk) => { if (!marcan.has(kk)) seguidas.delete(kk); });
      marcan.forEach((kk) => seguidas.set(kk, (seguidas.get(kk) || 0) + 1));
    });
    seguidas.forEach((c, kk) => { if (c >= 4) { const [q, club] = kk.split('|'); xs.push({ peso: c * 2.2, jugador: q, club, txt: `marca en ${c} jornadas seguidas`, donde }); } });
  }));
  const top = xs.sort((a, b) => b.peso - a.peso).slice(0, 7);
  return `<div class="caja"><span class="rotulo">Rachas</span>${top.length ? top.map((x) => `<div class="resultado"><span><span>${x.jugador ? nombreJ(x.jugador) : botonClub(x.club)}<small>${x.jugador ? esc(x.club) + ' · ' : ''}${esc(x.donde)}</small></span></span><b class="${x.mala ? 'mala' : ''}">${esc(x.txt)}</b></div>`).join('') : '<div class="vacio">Aún no hay rachas que contar.</div>'}</div>`;
}
function seguidosHtml() {
  const V = S;
  const filas = sigues.map((x) => {
    if (x.tipo === 'c') {
      const c = clubDe(x.n); if (!c) return '';
      const l = ligasDe(V, c.pais).find((l) => l.T.tabla.some((t) => t.nombre === x.n));
      let dato = '';
      if (l) { const tb = tablaHasta(l.T, vistasDe(l.T, V), reglasDe(V, c.pais).puntosVictoria), i = tb.findIndex((t) => t.nombre === x.n); dato = `${i + 1}.º · ${tb[i].pts} pts`; }
      return `<button type="button" class="ficha-btn" data-c="${esc(x.n)}"><span>${esc(x.n)}</span><span>${dato}</span></button>`;
    }
    const g = golesEnMarcha(V).find((y) => y.nombre === x.n), b = buscarJugador(x.n);
    const dato = b && !b.activo ? 'retirado' : `${g ? g.g : 0} goles${b ? ' · ' + esc(b.club) : ''}`;
    return `<button type="button" class="ficha-btn" data-j="${esc(x.n)}"><span>${esc(x.n)}</span><span>${dato}</span></button>`;
  }).join('');
  return `<div class="caja"><span class="rotulo">Sigues ★</span>${filas || '<div class="vacio">Toca ★ en la ficha de un jugador o un club para seguirlo aquí.</div>'}</div>`;
}
// Al terminar la temporada: el resumen mundial, con la historia que cambió como noticia.
function edicionEspecial(V) {
  const EU = V.R.EU, fEU = EU && EU.rondas[EU.rondas.length - 1].cruces[0];
  const difs = divergencias(V), grandes = difs.filter((d) => d.grande);
  const cartel = `<div class="cartel"><span class="trofeo-edicion" aria-hidden="true">🏆</span><span class="rotulo">Temporada ${V.temporada} · el salón de la gloria</span><span>${esc(nombreEuropa(V))} ${V.temporada}</span><b>${EU ? esc(EU.campeon) + marcaSi(EU.campeon, EUROPA_REAL[V.anio]) : 'No se jugó'}</b>${fEU && fEU.b ? `<small>Final: ${esc(fEU.a)} – ${esc(fEU.b)}, ${marcadorCruce(fEU)}</small>` : ''}</div>`;
  const campeones = paisesDe(V).map((pais) => {
    const c = campeonDe(V, pais), C = copaDe(V, pais), pr = premiosDe(V, pais), real = campeonRealDe(pais, V.anio);
    const quien = c.campeon ? botonClub(c.campeon) + marcaSi(c.campeon, real) : c.campeones.length ? c.campeones.map((x) => botonClub(x.club)).join(' ') + (real && !c.campeones.some((x) => real.includes(x.club)) ? marcaDif(`De verdad: ${real}`) : '') : 'sin liga';
    return `<div class="resultado"><span><span>${quien}<small>${esc(pais)} · ${esc(nombreLiga(V, pais))}${C ? ` · ${esc(C.nombre)}: ${esc(C.campeon)}` : ''}${pr.pichichi ? ` · goleador: ${esc(pr.pichichi.nombre)} (${pr.pichichi.g})` : ''}</small></span></span></div>`;
  }).join('');
  const pm = premiosMundo(V);
  const podio = `<div class="podio"><article><span class="rotulo">España · campeón de Liga</span><h2>${botonClub(V.campeon)}${marcaSi(V.campeon, campeonRealDe('España', V.anio))}</h2><p>${esc(nombreLiga(V, 'España'))} · ${V.temporada}</p></article>${pm.ganadorMejor ? `<article class="podio-oro"><span class="rotulo">${esc(pm.nombreMejor)}</span><h2>${nombreJ(pm.ganadorMejor.nombre)}</h2><p>${esc(pm.ganadorMejor.club)} · la temporada de una leyenda</p></article>` : ''}</div>`;
  const premios = [
    ...pm.oficiales.map((x) => premio(x.nombre, x.j, x.linea)),
    pm.oficiales.length ? '' : premio('Mejor jugador del mundo', pm.mejor, (j) => `nota ${j.notaTemp.toFixed(2)}`),
    premio('Máximo goleador', pm.goleador, (j) => `${j.g} goles`),
    premio('Más asistencias', pm.asistente, (j) => `${j.a} asistencias`),
    premio('Mejor portero', pm.portero, (j) => `${j.enc} goles en ${j.pj} partidos`),
    premio('Revelación (21 o menos)', pm.revelacion, (j) => `nota ${j.notaTemp.toFixed(2)}`)
  ].join('');
  let verano = '';
  if (V.veranoHecho) {
    const mer = V.mercado || [], ini = (j) => (j.inicio ? j.inicio.niv : j.niv);
    const fich = mer.filter((x) => x.tipo === 'fichaje').sort((a, b) => b.niv - a.niv).slice(0, 8);
    const ret = (V.retiros || []).filter((x) => ini(x.j) >= 780).sort((a, b) => ini(b.j) - ini(a.j)).slice(0, 5);
    const deb = mer.filter((x) => x.tipo === 'debut').sort((a, b) => b.tec - a.tec).slice(0, 5);
    const difJ = (x) => { const d = difs.find((y) => y.jugador === x.jugador); return d ? marcaDif(d.real) : ''; };
    verano = `<div class="caja"><span class="rotulo">Fichajes del verano</span>${fich.length ? fich.map((x) => `<div class="resultado"><span><span>${nombreJ(x.jugador)}${difJ(x)}<small>${esc(x.de)} → ${esc(x.a)}</small></span></span><b>${nivel(x.niv)}</b></div>`).join('') : '<div class="vacio">Ninguno.</div>'}</div>
      <div class="caja homenajes"><span class="rotulo">El último aplauso · se retiran</span>${ret.length ? ret.map((x) => `<div class="resultado"><span><span>${nombreJ(x.j.n)}<small>${x.edad} años · ${esc(x.club)}</small></span></span></div>`).join('') : '<div class="vacio">Ninguna figura.</div>'}
      <span class="rotulo" style="margin-top:8px">Debutan</span>${deb.map((x) => `<div class="resultado"><span><span>${nombreJ(x.jugador)}<small>${esc(x.a)} · techo ${nivel(x.tec)}</small></span></span></div>`).join('')}</div>`;
  }
  const noticias = grandes.slice(0, 4).map((d) => `<article class="noticia"><div class="arriba"><span class="rotulo rojo">La historia cambia</span>${marcaDif(d.real)}</div><h2 class="titulo medio">${esc(d.titulo)}</h2></article>`).join('');
  return cartel + podio + mundialCaja(V) + `<button type="button" class="copiar" data-copiar="${cerradas.indexOf(V)}">📋 Copiar el resumen de la temporada</button>` + noticias + sorpresasHtml(V) + `<div class="caja"><span class="rotulo">Campeones de ${V.temporada}</span>${campeones}</div>`
    + `<div class="caja"><span class="rotulo">Premios mundiales</span><div class="premios">${premios}</div></div>`
    + `<div class="columnas">${verano}${resultadoPron(V)}${seguidosHtml()}</div>`;
}

// Lo que nadie esperaba: las joyas que explotan y las insignias que se ganan jugando.
const GRADO_TXT = ['bronce', 'plata', 'oro', 'excepcional'];
function sorpresasHtml(V) {
  const nov = V.veranoHecho ? V.novedades || [] : [];
  const joyas = nov.filter((x) => x.tipo === 'joya').sort((a, b) => b.tec - a.tec).slice(0, 3).map((x) => `<article class="noticia"><div class="arriba"><span class="rotulo rojo">La joya inesperada</span>${marcaDif(`De verdad su mejor nivel fue ${nivel(x.real)}`)}</div><h2 class="titulo medio">${nombreJ(x.jugador)} explota en el ${esc(x.club)}</h2><p>Tiene ${x.edad} años y nivel ${nivel(x.niv)}, pero esta temporada ha dado un salto que nadie vio venir. Los ojeadores ya hablan de un techo de ${nivel(x.tec)}. En este universo su carrera puede ser otra.</p></article>`).join('');
  const graves = nov.filter((x) => x.tipo === 'lesion' && x.niv >= 870).sort((a, b) => b.niv - a.niv).slice(0, 2).map((x) => `<article class="noticia"><span class="rotulo rojo">Lesión grave</span><h2 class="titulo medio">${nombreJ(x.jugador)} se rompe</h2><p>El jugador del ${esc(x.club)}, de ${x.edad} años, estará meses parado. Tenía nivel ${nivel(x.niv)} y vuelve con ${nivel(x.queda)}. Dentro de un año se sabrá si recupera lo que era.</p></article>`).join('');
  const vueltas = nov.filter((x) => x.tipo === 'regreso' && x.niv >= 850).sort((a, b) => b.niv - a.niv).slice(0, 2).map((x) => `<article class="noticia"><span class="rotulo rojo">El regreso</span><h2 class="titulo medio">${nombreJ(x.jugador)} vuelve a ser el que era</h2><p>Un año después de su lesión grave, el jugador del ${esc(x.club)} ha recuperado su nivel: ${nivel(x.niv)}.</p></article>`).join('');
  const records = nov.filter((x) => x.tipo === 'record').map((x) => `<article class="noticia hito-record"><span class="rotulo rojo">Récord histórico</span><h2 class="titulo medio">${esc(x.titulo)}</h2><p>${esc(x.texto)}</p></article>`).join('');
  const duelos = nov.filter((x) => x.tipo === 'rivalidad').map((x) => `<article class="noticia"><span class="rotulo rojo">Nace una rivalidad</span><h2 class="titulo medio">${nombreJ(x.a)} contra ${nombreJ(x.b)}</h2><p>Llevan tres temporadas entre los tres mejores del mundo, uno en el ${esc(x.clubA)} y otro en el ${esc(x.clubB)}. Desde hoy, cuando se enfrenten, los dos jugarán por encima de su nivel.</p></article>`).join('');
  const peso = (x) => x.grado * 1000 + (x.id === 'bandera' || x.id === 'hierro' ? -400 : 0) + x.niv;
  const ins = nov.filter((x) => x.tipo === 'insignia' && (x.grado >= 1 || x.niv >= 870)).sort((a, b) => peso(b) - peso(a)).slice(0, 10);
  const caja = ins.length ? `<div class="caja"><span class="rotulo">Insignias ganadas esta temporada</span>${ins.map((x) => `<div class="resultado"><span><span>${nombreJ(x.jugador)}<small>${esc(x.club)} · ${esc(Mundo.INSIGNIAS[x.id].efecto)}</small></span></span><span class="insignia g${x.grado}">${esc(x.nombre)}${Mundo.INSIGNIAS[x.id].temporal ? '' : ' · ' + GRADO_TXT[x.grado]}</span></div>`).join('')}</div>` : '';
  return records + duelos + joyas + graves + vueltas + caja;
}
function insigniasHtml(j) {
  const ids = Object.keys(j.ins || {});
  if (!ids.length && !j.joya && !j.grave && !j.rival) return '';
  const chips = ids.sort((a, b) => j.ins[b] - j.ins[a]).map((id) => { const I = Mundo.INSIGNIAS[id]; return `<span class="insignia g${j.ins[id]}" title="${esc(I.efecto)}. ${j.cnt && j.cnt[id] != null ? j.cnt[id] + ' ' + esc(I.cuenta) : ''}"><b>${esc(I.nombre)}</b> ${I.temporal ? '' : GRADO_TXT[j.ins[id]]}<small>${esc(I.efecto)}</small></span>`; }).join('');
  const joya = j.joya ? `<span class="insignia g2"><b>Joya inesperada</b> ${j.joya}<small>Explotó en ${j.joya}: en la vida real no llegó tan alto</small></span>` : '';
  const grave = j.grave ? `<span class="insignia"><b>Lesión grave</b> ${j.grave.anio}<small>${j.grave.vuelve ? 'Volvió a su nivel un año después' : 'Se rompió a los ' + j.grave.edad + ' años'}</small></span>` : '';
  return `<div><span class="rotulo">Marcado por esta partida</span><div class="insignias">${joya}${j.rival ? `<span class="insignia g2"><b>Rival: ${esc(j.rival)}</b><small>Se crece cuando se enfrentan</small></span>` : ''}${chips}${grave}</div></div>`;
}

// ---------- Figuras: goles, asistencias, regates, pases y nota (de un país o del mundo) ----------
let figStat = 'g';
const STATS = [['g', 'Goles'], ['a', 'Asistencias'], ['r', 'Regates'], ['p', 'Pases'], ['nota', 'Nota']];
function figurasHtml(V, pais) {
  const pills = (xs) => `<div class="pildoras" role="group" aria-label="Estadística">${xs.map(([id, txt]) => `<button type="button" data-stat="${id}" aria-pressed="${id === figStat}">${txt}</button>`).join('')}</div>`;
  if (!cerradaV(V)) {
    if (!['g', 'a'].includes(figStat)) figStat = 'g';
    const campo = figStat;
    const xs = golesEnMarcha(V, pais).filter((x) => x[campo] > 0).sort((a, b) => b[campo] - a[campo] || b.g - a.g).slice(0, 15);
    return pills(STATS.slice(0, 2)) + (xs.length ? xs.map((j, i) => goleadorFila(j, i, j[campo], pais ? '' : esc(j.pais))).join('') : '<div class="vacio">Todavía no ha empezado la liga.</div>')
      + `<p class="nota-pie">En lo que va de temporada, ligas de primera. Regates, pases, notas y premios, al terminar la temporada.</p>`;
  }
  const G = figurasDe(V, pais);
  let xs, valor, ley;
  if (figStat === 'g') { xs = [...G].sort((a, b) => b.g - a.g || a.pj - b.pj); valor = (j) => j.g; ley = 'Goles en todas las competiciones.'; }
  else if (figStat === 'a') { xs = [...G].sort((a, b) => b.a - a.a || b.g - a.g); valor = (j) => j.a; ley = 'Asistencias en todas las competiciones.'; }
  else if (figStat === 'r') { xs = [...G].sort((a, b) => b.regates - a.regates); valor = (j) => j.regates; ley = 'Regates exitosos.'; }
  else if (figStat === 'p') { xs = [...G].sort((a, b) => b.pasesOk - a.pasesOk); valor = (j) => `${j.pasesOk} <small>${Math.round(100 * j.pasesOk / Math.max(1, j.pases))}%</small>`; ley = 'Pases completados (y acierto).'; }
  else { xs = G.filter((j) => j.pj >= 15).sort((a, b) => b.notaTemp - a.notaTemp); valor = (j) => j.notaTemp.toFixed(2); ley = 'Nota del año, mínimo 15 partidos.'; }
  const campo = { g: 'g', a: 'a', r: 'regates', p: 'pasesOk', nota: 'pj' }[figStat];
  const donde = (j) => Object.entries(j.por || {}).filter(([, v]) => v[campo] > 0).map(([kk, v]) => `${kk} ${v[campo]}`).join(' · ');
  let premios;
  if (pais) {
    const pr = premiosDe(V, pais);
    premios = [
      premio(pais === 'España' ? 'Pichichi' : 'Máximo goleador', pr.pichichi, (j) => `${j.g} goles en liga`),
      premio(pais === 'España' ? 'Zamora' : 'Portero menos goleado', pr.zamora, (j) => `${j.enc} goles en ${j.pj} partidos`),
      premio('Mejor jugador', pr.mejor, (j) => `nota ${j.notaTemp.toFixed(2)}`)
    ].join('');
  } else {
    const pm = premiosMundo(V);
    premios = [
      ...pm.oficiales.map((x) => premio(x.nombre, x.j, x.linea)),
      pm.oficiales.length ? '' : premio('Mejor jugador del mundo', pm.mejor, (j) => `nota ${j.notaTemp.toFixed(2)}`),
      premio('Máximo goleador', pm.goleador, (j) => `${j.g} goles`),
      premio('Más asistencias', pm.asistente, (j) => `${j.a} asistencias`),
      premio('Mejor portero', pm.portero, (j) => `${j.enc} goles en ${j.pj} partidos`),
      premio('Revelación (21 o menos)', pm.revelacion, (j) => `nota ${j.notaTemp.toFixed(2)}`)
    ].join('');
  }
  return (premios ? `<span class="rotulo">Premios ${V.temporada}</span><div class="premios" style="margin:6px 0 12px">${premios}</div>` : '') + onceIdeal(G, pais ? `Once ideal de ${nombreLiga(V, pais)}` : 'Once ideal del mundo') + pills(STATS)
    + xs.slice(0, 15).map((j, i) => goleadorFila(j, i, valor(j), `${pais ? '' : esc(j.eq.pais) + ' · '}${donde(j)}`)).join('')
    + `<p class="nota-pie">${ley} Jugadores de primera división.</p>`;
}

// El once de la temporada: 1-4-3-3 por nota, mínimo 15 partidos.
function onceIdeal(G, titulo) {
  const usados = new Set(), coge = (pos, n) => G.filter((x) => x.pos === pos && x.pj >= 15 && !usados.has(x)).sort((a, b) => b.notaTemp - a.notaTemp).slice(0, n).map((x) => (usados.add(x), x));
  const lineas = [coge('DEL', 3), coge('MED', 3), coge('DEF', 4), coge('POR', 1)];
  if (!lineas[3].length) return '';
  const chip = (x) => `<button type="button" class="en-campo" data-j="${esc(x.nombre)}"><b>${esc(corto(x.nombre))}</b><small>${esc(x.club)} · ${x.notaTemp.toFixed(1).replace('.', ',')}</small></button>`;
  return `<span class="rotulo">${esc(titulo)}</span><div class="campo">${lineas.map((l) => `<div class="linea">${l.map(chip).join('')}</div>`).join('')}</div>`;
}

// Resumen en texto para pegarlo en un chat o una nota.
function copiarResumen(btn) {
  const V = cerradas[+btn.dataset.copiar] || S, pm = premiosMundo(V), out = [`⚽ Universo del fútbol · temporada ${V.temporada}`];
  if (V.europa) out.push(`🏆 Copa de Europa: ${V.europa}${EUROPA_REAL[V.anio] && EUROPA_REAL[V.anio] !== V.europa ? ` (de verdad: ${EUROPA_REAL[V.anio]})` : ''}`);
  paisesDe(V).forEach((pais) => { const c = campeonDe(V, pais), pr = premiosDe(V, pais); const quien = c.campeon || c.campeones.map((x) => x.club).join(' y '); if (quien) out.push(`• ${pais}: ${quien}${pr.pichichi ? ` · goleador ${pr.pichichi.nombre} (${pr.pichichi.g})` : ''}`); });
  if (pm.ganadorMejor) out.push(`⭐ ${pm.nombreMejor}: ${pm.ganadorMejor.nombre} (${pm.ganadorMejor.club})`);
  if (pm.goleador) out.push(`🥇 Máximo goleador: ${pm.goleador.nombre}, ${pm.goleador.g} goles`);
  const texto = out.join('\n');
  const listo = () => { btn.textContent = '✓ Copiado'; setTimeout(() => { btn.textContent = '📋 Copiar el resumen de la temporada'; }, 2000); };
  try { navigator.clipboard.writeText(texto).then(listo, () => { window.prompt('Copia el resumen:', texto); }); } catch (e) { window.prompt('Copia el resumen:', texto); }
}

// ---------- Competiciones ----------
let compPais = 'España', compSel = 'Primera', compVista = 'tabla';
function pintarComp() {
  const V = VT(), paises = paisesDe(V);
  if (!paises.includes(compPais)) compPais = 'España';
  const ligas = ligasDe(V, compPais), C = copaDe(V, compPais);
  const opciones = ligas.map((l) => [l.grupo, l.grupo]).concat(C ? [['copa', C.nombre]] : [], V.R.EU ? [['europa', nombreEuropa(V)]] : [], V.R.MU && cerradaV(V) ? [['mundial', 'Mundial ' + V.R.MU.anio]] : []);
  if (!opciones.some((o) => o[0] === compSel)) compSel = opciones.length ? opciones[0][0] : '';
  const esCopa = compSel === 'copa' || compSel === 'europa' || compSel === 'mundial';
  const vistas = esCopa ? [['tabla', 'Cuadro'], ['gol', 'Goleadores']] : [['tabla', 'Tabla'], ['res', 'Partidos'], ['gol', 'Goles'], ['fig', 'Figuras'], ['datos', 'Datos']];
  if (!vistas.some((v) => v[0] === compVista)) compVista = 'tabla';
  const cab = `<div class="selectores">
      <div class="fila-sel"><h1>Competiciones</h1><span style="display:flex;gap:8px;flex-wrap:wrap">${selTemp()}<select class="desplegable" data-accion="pais" aria-label="País">${paises.map((p) => `<option${p === compPais ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select></span></div>
      <div class="pildoras" role="group" aria-label="Competición">${opciones.map(([id, txt]) => `<button type="button" data-comp="${esc(id)}" aria-pressed="${id === compSel}">${esc(txt)}</button>`).join('')}</div>
      <div class="segmento" role="group" aria-label="Vista" style="grid-template-columns: repeat(${vistas.length}, minmax(0, 1fr))">${vistas.map(([id, txt]) => `<button type="button" data-vista="${id}" aria-pressed="${id === compVista}">${txt}</button>`).join('')}</div>
    </div>`;
  let cuerpo;
  if (!opciones.length) cuerpo = `<div class="vacio">Esta temporada no hay liga en ${esc(compPais)}.</div>`;
  else if (compSel === 'mundial') cuerpo = mundialHtml(V, compVista === 'gol');
  else if (esCopa) cuerpo = compVista === 'gol' ? goleadoresCopa(V) : cuadroCopa(V);
  else {
    const L = ligas.find((l) => l.grupo === compSel);
    cuerpo = compVista === 'tabla' ? tablaLiga(V, L) : compVista === 'res' ? resultadosLiga(V, L) : compVista === 'fig' ? figurasHtml(V, compPais) : compVista === 'datos' ? datosLiga(V, L) : goleadoresLiga(V, L);
  }
  $('s-comp').innerHTML = cab + cuerpo;
}
// ---------- Mundial ----------
// El Mundial se juega al acabar la temporada (cada cuatro años) con las selecciones que fueron de verdad,
// pero con los jugadores de la partida. Los que no juegan en las ligas de la partida salen de su convocatoria real.
const mundialCampeon = (T) => `${esc(T.campeon)}${T.real && T.anio < 2026 && T.real !== T.campeon ? marcaDif(`De verdad lo ganó ${T.real}`) : ''}`;
function mundialCaja(V) {
  const T = V.R && V.R.MU;
  if (!T) return '';
  const P = T.premios, mios = T.jugadores.filter((x) => x.mio && x.g > 0).sort((a, b) => b.g - a.g).slice(0, 5);
  return `<div class="caja mundial"><span class="rotulo">Mundial ${T.anio} · ${esc(T.sede)}</span>
    <div class="crack"><span class="estrella" aria-hidden="true">🏆</span><span><b>${mundialCampeon(T)}</b><small>Campeón del mundo${T.subcampeon ? ` · final ante ${esc(T.subcampeon)}` : ''}</small></span></div>
    ${P.botaOro ? `<div class="resultado"><span><span>${nombreJ(P.botaOro.n)}<small>Bota de Oro · ${esc(P.botaOro.eq)}</small></span></span><span>${P.botaOro.g} goles</span></div>` : ''}
    ${P.balonOro ? `<div class="resultado"><span><span>${nombreJ(P.balonOro.n)}<small>Mejor jugador · ${esc(P.balonOro.eq)}</small></span></span><span>${String(P.balonOro.nota).replace('.', ',')}</span></div>` : ''}
    ${mios.length ? `<p class="nota-pie">De tus ligas: ${mios.map((x) => `${esc(x.n)} (${x.g})`).join(', ')}.</p>` : ''}
    <button type="button" class="nombre" data-ir-mundial>Ver el Mundial entero</button></div>`;
}
function mundialHtml(V, goles) {
  const T = V.R.MU;
  if (goles) return `<div class="caja"><span class="rotulo">Goleadores del Mundial ${T.anio}</span>${T.premios.goleadores.map((x, i) => `<div class="goleador"><span class="n">${i + 1}</span><span class="quien">${nombreJ(x.n)}<small>${esc(x.eq)} · ${x.pj} partidos</small></span><b>${x.g}</b></div>`).join('')}</div>`;
  const marcador = (p) => `${p.ga}-${p.gb}${p.prorroga ? ' (pró.)' : ''}${p.penaltis ? ` · pen. ${Array.isArray(p.penaltis) ? p.penaltis.slice(0, 2).join('-') : p.penaltis}` : ''}`;
  const fases = [...T.fases].reverse().map((F) => {
    if (F.tipo === 'grupos') return `<div class="ronda"><h3>${esc(F.nombre)}</h3>${F.grupos.map((g) => `<div class="grupo"><h4>${esc(g.nombre)}</h4><table class="tabla mini"><thead><tr><th></th><th>Selección</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>Pts</th></tr></thead><tbody>${g.tabla.map((t, i) => `<tr><td>${i + 1}</td><td>${esc(t.equipo)}</td><td>${t.pj}</td><td>${t.g}</td><td>${t.e}</td><td>${t.p}</td><td>${t.gf}</td><td>${t.gc}</td><td><b>${t.pts}</b></td></tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
    const ps = T.partidos.filter((p) => p.fase === F.nombre);
    return `<div class="ronda"><h3>${esc(F.nombre)}</h3>${ps.map((p) => { const c = (F.cruces || []).find((x) => (x.a === p.a && x.b === p.b) || (x.a === p.b && x.b === p.a)) || {}; return `<div class="cruce"><span><span class="${c.ganador === p.a ? 'gana' : ''}">${esc(p.a)}</span> – <span class="${c.ganador === p.b ? 'gana' : ''}">${esc(p.b)}</span></span><span>${marcador(p)}</span></div>`; }).join('')}</div>`;
  }).join('');
  const conv = Object.entries(T.convocados || {}).filter(([, v]) => v.some((x) => x[3])).sort((a, b) => b[1].filter((x) => x[3]).length - a[1].filter((x) => x[3]).length).slice(0, 8)
    .map(([pais, v]) => `<details class="convocatoria"><summary>${esc(pais)} <small>${v.filter((x) => x[3]).length} de tus ligas</small></summary><p>${v.map((x) => `${esc(x[0])}${x[3] ? '' : '°'} <small>${POS[x[1]] ? POS[x[1]].slice(0, 3) : x[1]} ${x[2]}</small>`).join(' · ')}</p></details>`).join('');
  return `<div class="caja mundial"><span class="rotulo">Mundial ${T.anio} · ${esc(T.sede)}</span><div class="crack"><span class="estrella" aria-hidden="true">🏆</span><span><b>${mundialCampeon(T)}</b><small>Campeón del mundo${T.subcampeon ? ` · subcampeón ${esc(T.subcampeon)}` : ''}</small></span></div></div>`
    + fases + (conv ? `<div class="caja"><span class="rotulo">Convocatorias</span>${conv}<p class="nota-pie">° = jugador de la convocatoria real, porque juega en una liga que no está en la partida.</p></div>` : '');
}
function mundialesHistoria() {
  const ms = temporadas().filter((V) => V.R && V.R.MU && cerradaV(V)).map((V) => V.R.MU);
  if (!ms.length) return '';
  return `<div class="caja"><span class="rotulo">Mundiales</span>${ms.reverse().map((T) => `<div class="resultado"><span><span><b>${mundialCampeon(T)}</b><small>${T.anio} · ${esc(T.sede)}${T.subcampeon ? ` · final ante ${esc(T.subcampeon)}` : ''}${T.premios.botaOro ? ` · goleador: ${esc(T.premios.botaOro.n)} (${T.premios.botaOro.g})` : ''}</small></span></span></div>`).join('')}</div>`;
}
// Tabla solo con los partidos en casa ('l') o fuera ('v').
function tablaLado(T, n, pv, lado) {
  const t = {};
  T.tabla.forEach((x) => (t[x.nombre] = { nombre: x.nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0, racha: [] }));
  T.resultados.slice(0, n).flat().forEach((m) => {
    const yo = lado === 'l' ? t[m.local] : t[m.visita], gf = lado === 'l' ? m.ga : m.gb, gc = lado === 'l' ? m.gb : m.ga;
    yo.pj++; yo.gf += gf; yo.gc += gc;
    if (gf > gc) { yo.g++; yo.pts += pv; yo.racha.push('G'); } else if (gf < gc) { yo.p++; yo.racha.push('P'); } else { yo.e++; yo.pts++; yo.racha.push('E'); }
  });
  return Object.values(t).sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || x.nombre.localeCompare(y.nombre, 'es'));
}
const formaHtml = (racha) => `<span class="forma" aria-label="Últimos partidos: ${racha.slice(-5).join(' ')}">${racha.slice(-5).map((r) => `<i class="${r}">${r}</i>`).join('')}</span>`;
let ladoTabla = 't';
function tablaLiga(V, L) {
  const T = L.T, n = vistasDe(T, V), pv0 = reglasDe(V, compPais).puntosVictoria || 2, final = n === T.resultados.length;
  const filas = ladoTabla === 't' ? tablaHasta(T, n, pv0) : tablaLado(T, n, pv0, ladoTabla);
  const movs = V.veranoHecho ? V.movimientos || [] : [];
  const anioReal = V.anio;
  const filasHtml = filas.map((t, i) => {
    const real = puestoReal(compPais, anioReal, t.nombre);
    // Solo se marca lo que llama la atención: el campeón que no fue, o un puesto muy lejos del real.
    const dif = final && real && ((real === 1) !== (i === 0) || Math.abs(real - (i + 1)) >= 5) ? marcaDif(`Puesto real: ${real}.º`) : '';
    const m = movs.find((x) => x.club === t.nombre && (compPais === 'España' ? !x.pais : x.pais === compPais));
    const cls = final && i === 0 && L.nivel === 1 ? 'camp' : m && (m.a === 'Segunda' || m.a === 'Tercera' || (m.pais && !m.sube)) && !m.de ? 'baja' : '';
    return `<tr class="${ladoTabla === 't' ? cls : ''}"><td>${i + 1}</td><td>${botonClub(t.nombre)}${ladoTabla === 't' ? dif : ''}</td><td>${t.pj}</td><td class="extra">${t.g}</td><td class="extra">${t.e}</td><td class="extra">${t.p}</td><td>${t.gf - t.gc > 0 ? '+' : ''}${t.gf - t.gc}</td><td class="pts">${t.pts}</td><td class="col-forma">${formaHtml(t.racha)}</td></tr>`;
  }).join('');
  const rg = reglasDe(V, compPais);
  const lados = `<div class="pildoras chicas" role="group" aria-label="Partidos">${[['t', 'Total'], ['l', 'En casa'], ['v', 'Fuera']].map(([id, tx]) => `<button type="button" data-lado="${id}" aria-pressed="${id === ladoTabla}">${tx}</button>`).join('')}</div>`;
  const queda = T.resultados.length - n, mate = !final && filas.length > 1 && ladoTabla === 't' && filas[0].pts - filas[1].pts > queda * pv0;
  return lados + (mate ? `<div class="aviso">🏆 ${esc(filas[0].nombre)} ya es campeón matemático: le quedan ${queda} ${queda === 1 ? 'jornada' : 'jornadas'} y saca ${filas[0].pts - filas[1].pts} puntos.</div>` : '') + `<div style="overflow-x:auto"><table class="tabla"><thead><tr><th style="text-align:left">#</th><th>Club</th><th>PJ</th><th class="extra">G</th><th class="extra">E</th><th class="extra">P</th><th>DG</th><th>Pts</th><th class="col-forma">Forma</th></tr></thead><tbody>${filasHtml}</tbody></table></div>
    <p class="nota-pie">${n ? `Tras la jornada ${n} de ${T.resultados.length}.` : 'Todavía no ha empezado.'} ${rg.puntosVictoria ? `${rg.puntosVictoria} puntos por victoria.` : ''} ≠ marca un puesto que no se parece al real; al tocarlo, dice el real.${M.clubes.some((c) => c.pais === compPais && c.jugadores.some((j) => j.relleno)) ? ' Los nombres con * son jugadores inventados para completar plantillas sin datos.' : ''}</p>`
    + faseFinal(V);
}
function faseFinal(V) {
  const o = compPais === 'España' ? null : otroEn(V, compPais);
  if (compPais === 'España' && compSel === 'Primera' && (V !== S || rondasVistas('promocion')) && V.R.promos.length)
    return `<div class="ronda"><h3>Promoción</h3>${V.R.promos.map((x) => `<div class="cruce"><span><span class="${x.ganador === x.primera ? 'gana' : ''}">${esc(x.primera)}</span> – <span class="${x.ganador === x.segunda ? 'gana' : ''}">${esc(x.segunda)}</span></span><span>${x.cruce.partidos.map((m) => `${m.ga}-${m.gb}`).join(' · ')}</span></div>`).join('')}</div>`;
  if (o && o.F && cerradaV(V)) return `<div class="ronda"><h3>${esc(o.F.nombre)}</h3></div>` + [...o.F.rondas].reverse().map((ro) => `<div class="ronda"><h3>${esc(ro.nombre)}</h3>${cruces(ro)}</div>`).join('');
  return '';
}
let verJ = null;
function resultadosLiga(V, L) {
  const T = L.T, nV = vistasDe(T, V);
  if (!nV) return '<div class="vacio">Todavía no ha empezado.</div>';
  const n = verJ == null ? nV : Math.max(1, Math.min(verJ, nV));
  const comp = `${L.nivel === 1 ? nombreLiga(V, compPais) : L.grupo} · jornada ${n}`;
  const prox = n === nV && nV < T.resultados.length ? `<div class="ronda"><h3>Próxima jornada (${nV + 1})</h3>${T.resultados[nV].map((m) => `<div class="cruce"><span>${esc(m.local)} – ${esc(m.visita)}</span><span>${m.derbi ? '<span class="sello">derbi</span>' : ''}</span></div>`).join('')}</div>` : '';
  return `<div class="navj"><button type="button" data-j-nav="-1" aria-label="Jornada anterior"${n <= 1 ? ' disabled' : ''}>◀</button><b>Jornada ${n}</b><button type="button" data-j-nav="1" aria-label="Jornada siguiente"${n >= nV ? ' disabled' : ''}>▶</button></div>` + partidos(T.resultados[n - 1], comp) + `<p class="nota-pie">Toca un partido para ver su hoja.</p>` + prox;
}
// Datos de la liga: medias, extremos y dos gráficos (carrera por el título y por ser máximo goleador).
function datosLiga(V, L) {
  const T = L.T, n = vistasDe(T, V), pv = reglasDe(V, compPais).puntosVictoria || 2;
  if (n < 2) return '<div class="vacio">Hacen falta al menos dos jornadas.</div>';
  const ms = T.resultados.slice(0, n).flat(), goles = ms.reduce((s2, m) => s2 + m.ga + m.gb, 0);
  const loc = ms.filter((m) => m.ga > m.gb).length, emp = ms.filter((m) => m.ga === m.gb).length, vis = ms.length - loc - emp;
  const goleada = ms.slice().sort((a, b) => Math.abs(b.ga - b.gb) - Math.abs(a.ga - a.gb) || (b.ga + b.gb) - (a.ga + a.gb))[0];
  const masGoles = ms.slice().sort((a, b) => (b.ga + b.gb) - (a.ga + a.gb))[0];
  const tb = tablaHasta(T, n, pv);
  const ataque = tb.slice().sort((a, b) => b.gf - a.gf)[0], defensa = tb.slice().sort((a, b) => a.gc - b.gc)[0], empates = tb.slice().sort((a, b) => b.e - a.e)[0];
  const rojas = ms.reduce((s2, m) => s2 + m.eventos.filter((e) => e.tipo === 'roja').length, 0);
  const pct = (x) => Math.round(100 * x / ms.length);
  const dato = (t, v, extra) => `<div class="dato"><small>${t}</small><b>${v}</b>${extra ? `<span>${extra}</span>` : ''}</div>`;
  // Carrera por el título: puesto de los seis primeros jornada a jornada.
  const top = tb.slice(0, 6).map((x) => x.nombre);
  const pos = top.map((c, i) => ({ nombre: c, club: true, color: colorLinea(c, i), v: [] }));
  for (let j = 1; j <= n; j++) { const t = tablaHasta(T, j, pv); pos.forEach((sr) => sr.v.push(t.findIndex((x) => x.nombre === sr.nombre) + 1)); }
  // Carrera del máximo goleador: goles acumulados de los cinco primeros.
  const gl = golesEnMarcha(V, compPais, [L.grupo]).sort((a, b) => b.g - a.g).slice(0, 5);
  const series = gl.map((x, i) => ({ nombre: x.nombre, color: ['#9E2A1F', '#1F5E9E', '#2F7A3E', '#B07A12', '#6A3D9A'][i], v: [] }));
  const acum = new Map(gl.map((x) => [x.nombre + '|' + x.club, 0]));
  for (let j = 0; j < n; j++) {
    T.resultados[j].forEach((m) => m.eventos.forEach((e) => { const kk = e.quien + '|' + (e.lado ? m.visita : m.local); if ((e.tipo === 'gol' || e.tipo === 'pen') && acum.has(kk)) acum.set(kk, acum.get(kk) + 1); }));
    gl.forEach((x, i) => series[i].v.push(acum.get(x.nombre + '|' + x.club)));
  }
  return `<div class="datos">${dato('Goles por partido', (goles / ms.length).toFixed(2).replace('.', ','), `${goles} en ${ms.length} partidos`)}
    ${dato('Gana el de casa', pct(loc) + '%', `empates ${pct(emp)}% · fuera ${pct(vis)}%`)}
    ${dato('Mayor goleada', `${goleada.ga}-${goleada.gb}`, `${esc(goleada.local)} – ${esc(goleada.visita)}`)}
    ${dato('Más goles en un partido', masGoles.ga + masGoles.gb, `${esc(masGoles.local)} ${masGoles.ga}-${masGoles.gb} ${esc(masGoles.visita)}`)}
    ${dato('Mejor ataque', ataque.gf, esc(ataque.nombre))}
    ${dato('Mejor defensa', defensa.gc, `goles en contra · ${esc(defensa.nombre)}`)}
    ${dato('Más empates', empates.e, esc(empates.nombre))}
    ${dato('Expulsiones', rojas, `una cada ${rojas ? Math.round(ms.length / rojas) : '–'} partidos`)}</div>
    <span class="rotulo" style="margin-top:14px">La carrera por el título · puesto jornada a jornada</span>${grafLineas(pos, tb.length, true, 'Puesto de los seis primeros en cada jornada')}
    ${series.length ? `<span class="rotulo" style="margin-top:14px">La carrera del máximo goleador · goles acumulados</span>${grafLineas(series, Math.max(1, ...series.map((x) => x.v[x.v.length - 1])), false, 'Goles acumulados de los cinco primeros')}` : ''}`;
}
function goleadoresLiga(V, L) {
  let xs;
  if (cerradaV(V)) {
    const clave = L.clave;
    xs = V.G.filter((x) => x.eq && x.eq.pais === compPais && x.por[clave] && (compPais !== 'España' || x.eq.grupo === L.grupo || L.nivel === 1)).map((x) => ({ nombre: x.nombre, club: x.club, g: x.por[clave].g, a: x.por[clave].a }));
  } else xs = golesEnMarcha(V, compPais, [L.grupo]);
  xs = xs.filter((x) => x.g > 0).sort((a, b) => b.g - a.g || b.a - a.a).slice(0, 20);
  return xs.length ? xs.map((j, i) => goleadorFila(j, i, j.g, `${j.a} asist.`)).join('') : '<div class="vacio">Todavía no hay goles.</div>';
}
function copaSel(V) { return compSel === 'europa' ? V.R.EU : copaDe(V, compPais); }
function rondasCopaVistas(V, C) {
  if (cerradaV(V)) return C.rondas.length;
  if (compSel === 'europa') return rondasVistas('europa');
  return compPais === 'España' ? rondasVistas('copa') : Math.round(rondasVistas('copa') * C.rondas.length / S.R.C.rondas.length);
}
function cuadroCopa(V) {
  const C = copaSel(V); if (!C) return '<div class="vacio">No se juega esta temporada.</div>';
  const n = rondasCopaVistas(V, C);
  if (!n) return `<div class="vacio">${compSel === 'europa' ? 'Empieza en otoño.' : 'Empieza en primavera, al terminar la liga.'}</div>`;
  const real = compSel === 'europa' ? EUROPA_REAL[V.anio] : null;
  const acabada = n === C.rondas.length;
  return (acabada ? `<div class="cartel"><span>Campeón</span><b>${esc(C.campeon)}${marcaSi(C.campeon, real)}</b></div>` : '')
    + C.rondas.slice(0, n).reverse().map((ro) => `<div class="ronda"><h3>${esc(ro.nombre)}</h3>${cruces(ro)}</div>`).join('');
}
function goleadoresCopa(V) {
  const C = copaSel(V); if (!C) return '<div class="vacio">No se juega esta temporada.</div>';
  const g = new Map();
  C.rondas.slice(0, rondasCopaVistas(V, C)).forEach((ro) => ro.cruces.forEach((c) => c.partidos.forEach((m) => (m.eventos || []).forEach((e) => {
    if (e.tipo !== 'gol' && e.tipo !== 'pen') return;
    const club = e.lado === 0 ? m.local : m.visita, kk = e.quien + '|' + club;
    g.set(kk, { nombre: e.quien, club, g: (g.get(kk) || { g: 0 }).g + 1 });
  }))));
  const xs = [...g.values()].sort((a, b) => b.g - a.g).slice(0, 15);
  return xs.length ? xs.map((j, i) => goleadorFila(j, i, j.g)).join('') : '<div class="vacio">Sin goles todavía.</div>';
}

// ---------- Mundo: el buscador ----------
let busq = '', busqTipo = 'j', busqPais = 'Todos', busqPos = 'Todas';
const sinTildes = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const POS = { POR: 'Portero', DEF: 'Defensa', MED: 'Centrocampista', DEL: 'Delantero' };
function pintarMundo() {
  const paises = paisesDe(S);
  const cab = `<div class="buscador">
      <label class="rotulo" for="busq">Busca un jugador, un club o un entrenador</label>
      <input type="search" id="busq" value="${esc(busq)}" placeholder="Pelé, Di Stéfano, Benfica…" autocomplete="off">
      <div class="pildoras" role="group" aria-label="Qué buscar">${[['j', 'Jugadores'], ['c', 'Clubes'], ['e', 'Entrenadores'], ['pr', 'Promesas'], ['ley', 'Salón de la fama']].map(([id, txt]) => `<button type="button" data-btipo="${id}" aria-pressed="${id === busqTipo}">${txt}</button>`).join('')}</div>
      <div class="fila-sel" style="justify-content:flex-start">
        <select class="desplegable" data-accion="bpais" aria-label="País">${['Todos'].concat(paises).map((p) => `<option value="${esc(p)}"${p === busqPais ? ' selected' : ''}>${p === 'Todos' ? 'Todos los países' : esc(p)}</option>`).join('')}</select>
        ${busqTipo === 'j' || busqTipo === 'pr' ? `<select class="desplegable" data-accion="bpos" aria-label="Puesto">${['Todas'].concat(Object.keys(POS)).map((p) => `<option value="${p}"${p === busqPos ? ' selected' : ''}>${p === 'Todas' ? 'Todos los puestos' : POS[p]}</option>`).join('')}</select>` : ''}
      </div>
    </div>
    ${comparaCon ? `<div class="aviso">⚖ Elige otro jugador para compararlo con <b>${esc(comparaCon)}</b>. <button type="button" class="nombre" data-comparar-fin>Cancelar</button></div>` : ''}
    <div id="figMundo"></div>
    <div class="resultados-busq" id="resBusq"></div>`;
  if (!$('busq')) $('s-mundo').innerHTML = cab;
  else {
    // Sin borrar lo que se está escribiendo: solo se rehacen los filtros y la lista.
    const foco = document.activeElement === $('busq');
    const valor = $('busq').value;
    $('s-mundo').innerHTML = cab;
    $('busq').value = valor;
    if (foco) { $('busq').focus(); $('busq').setSelectionRange(valor.length, valor.length); }
  }
  pintarResultados();
}
function pintarResultados() {
  const q = sinTildes(busq.trim()), okPais = (p) => busqPais === 'Todos' || p === busqPais;
  let filas = [];
  if (busqTipo === 'j') {
    const xs = [];
    M.clubes.forEach((c) => { if (okPais(c.pais)) c.jugadores.forEach((j) => xs.push({ j, club: c.nombre, pais: c.pais })); });
    filas = xs.filter((x) => (busqPos === 'Todas' || x.j.pos === busqPos) && (!q || sinTildes(x.j.n).includes(q)) && !/^Suplente \d+ \(/.test(x.j.n))
      .sort((a, b) => b.j.niv - a.j.niv).slice(0, 40)
      .map((x) => `<button type="button" data-j="${esc(x.j.n)}"><span><b>${esc(x.j.n)}${x.j.relleno ? '*' : ''}</b><small>${esc(POS[x.j.pos] || x.j.pos)} · ${esc(x.club)} · ${esc(x.pais)} · ${Motor.edad(x.j, S.anio + 1)} años</small></span><span class="nv">${nivel(x.j.niv)}${flecha(x.j)}<small>${esc(Motor.escala.categoria(nivel(x.j.niv)))}</small></span></button>`);
    if (q && filas.length < 40) {
      M.retirados.filter((j) => sinTildes(j.n).includes(q)).slice(0, 10).forEach((j) => filas.push(`<button type="button" data-j="${esc(j.n)}"><span><b>${esc(j.n)}</b><small>Retirado en ${j.retiro} con ${j.edad} años</small></span><span class="nv"></span></button>`));
    }
  } else if (busqTipo === 'c') {
    // Sin búsqueda: el ranking mundial de clubes por la media de sus once mejores.
    filas = M.clubes.filter((c) => okPais(c.pais) && c.division <= 2 && (!q || sinTildes(c.nombre).includes(q))).map((c) => ({ c, f: fuerzaClub(c) })).sort((a, b) => b.f - a.f).slice(0, 60)
      .map(({ c, f }, i) => `<button type="button" data-c="${esc(c.nombre)}"><span><b>${q ? '' : `<span class="puesto">${i + 1}</span>`}${colorClub(c.nombre)} ${esc(c.nombre)}</b><small>${esc(c.pais)} · ${esc(c.grupo || '')} · prestigio ${c.prestigio}</small></span><span class="nv">${f}<small>media del once</small></span></button>`);
  } else if (busqTipo === 'pr') {
    const xs = [];
    M.clubes.forEach((c) => { if (okPais(c.pais)) c.jugadores.forEach((j) => { if (Motor.edad(j, S.anio + 1) <= 21 && j.tec && !j.relleno) xs.push({ j, club: c.nombre, pais: c.pais }); }); });
    filas = xs.filter((x) => (busqPos === 'Todas' || x.j.pos === busqPos) && (!q || sinTildes(x.j.n).includes(q))).sort((a, b) => b.j.tec - a.j.tec).slice(0, 40)
      .map((x) => `<button type="button" data-j="${esc(x.j.n)}"><span><b>${esc(x.j.n)}</b><small>${esc(POS[x.j.pos] || x.j.pos)} · ${esc(x.club)} · ${Motor.edad(x.j, S.anio + 1)} años · hoy ${nivel(x.j.niv)}</small></span><span class="nv">${nivel(x.j.tec)}<small>techo</small></span></button>`);
  } else if (busqTipo === 'ley') {
    filas = M.retirados.filter((j) => (!q || sinTildes(j.n).includes(q)) && (j.carrera || []).length).map((j) => ({ j, top: Math.max(...j.carrera.map((t) => t.niv || 0)), g: j.carrera.reduce((s2, t) => s2 + t.g, 0), pj: j.carrera.reduce((s2, t) => s2 + t.pj, 0) }))
      .sort((a, b) => b.top - a.top || b.g - a.g).slice(0, 40)
      .map((x) => `<button type="button" data-j="${esc(x.j.n)}"><span><b>${esc(x.j.n)}</b><small>Retirado en ${x.j.retiro} con ${x.j.edad} años · ${x.g} goles en ${x.pj} partidos en la partida</small></span><span class="nv">${nivel(x.top)}<small>su mejor nivel</small></span></button>`);
    if (!filas.length && !q) filas = ['<div class="vacio">Aquí entran los jugadores que se retiran durante la partida. Juega una temporada entera.</div>'];
  } else {
    filas = M.clubes.filter((c) => okPais(c.pais) && c.division <= 2 && (c.entrenadores || []).length).map((c) => ({ t: entrenadorHoy(c), c }))
      .filter((x) => !q || sinTildes(x.t.nombre).includes(q)).sort((a, b) => a.c.division - b.c.division || b.c.prestigio - a.c.prestigio).slice(0, 60)
      .map((x) => `<button type="button" data-e="${esc(x.t.nombre)}" data-ec="${esc(x.c.nombre)}"><span><b>${esc(sinApodo(x.t.nombre))}</b><small>${esc(x.c.nombre)} · ${esc(x.c.pais)}</small></span><span class="nv"></span></button>`);
  }
  const fm = $('figMundo');
  if (fm) fm.innerHTML = !q && busqTipo === 'j' ? `<div class="caja" style="margin-bottom:14px"><div class="fila-sel"><span class="rotulo">Figuras ${busqPais === 'Todos' ? 'del mundo' : 'de ' + esc(busqPais)} · ${esc(S.temporada)}</span></div>${figurasHtml(S, busqPais === 'Todos' ? null : busqPais)}</div><span class="rotulo">Los mejores por nivel</span>` : '';
  $('resBusq').innerHTML = filas.length ? filas.join('') : '<div class="vacio">No encuentro nada con ese nombre. Prueba sin tildes o con el apellido.</div>';
}

// Cuánto ha cambiado el nivel desde su última temporada terminada.
const flecha = (j) => { const c = j.carrera || []; if (!c.length || c[c.length - 1].niv == null) return ''; const d = nivel(j.niv) - nivel(c[c.length - 1].niv); return Math.abs(d) < 3 ? '' : `<i class="flecha ${d > 0 ? 'sube' : 'baja'}" title="Cambio desde ${c[c.length - 1].temporada}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</i>`; };
const fuerzaClub = (c) => { const ns = c.jugadores.map((j) => j.niv).sort((a, b) => b - a).slice(0, 11); return ns.length ? nivel(ns.reduce((a, b) => a + b, 0) / ns.length) : 0; };

// ---------- Fichas: la hoja que sube ----------
function buscarJugador(nombre) {
  for (const c of M.clubes) { const j = c.jugadores.find((x) => x.n === nombre); if (j) return { j, club: c.nombre, pais: c.pais, activo: true }; }
  const libre = M.libres.find((x) => x.n === nombre); if (libre) return { j: libre, club: 'sin club', activo: true };
  const ret = M.retirados.find((x) => x.n === nombre); if (ret) return { j: ret, club: null, activo: false, retiro: ret };
  return null;
}
let fichaAbierta = null;
function abrirFicha(f) {
  fichaAbierta = f;
  // Tira de colores arriba de la hoja: el club de la ficha, el del jugador o los dos del partido.
  const cs = (n) => INFO.clubes[n] || null;
  let tira = null;
  if (f.tipo === 'c') tira = cs(f.n);
  else if (f.tipo === 'j') { const x = buscarJugador(f.n); tira = x && cs(x.club); }
  else if (f.tipo === 'p') { const x = PARTIDOS.get(f.id); if (x && cs(x.m.local) && cs(x.m.visita)) tira = { c1: cs(x.m.local).c1, c2: cs(x.m.visita).c1 }; }
  else if (f.club) tira = cs(f.club);
  const tiraHtml = tira ? `<div class="tira" aria-hidden="true" style="background:linear-gradient(90deg, ${tira.c1} 0 50%, ${tira.c2} 50% 100%)"></div>` : '';
  $('hoja').innerHTML = tiraHtml + '<div class="asa" aria-hidden="true"></div>' + (f.tipo === 'j' ? fichaJugador(f.n) : f.tipo === 'c' ? fichaClub(f.n) : f.tipo === 'p' ? fichaPartido(f.id) : fichaEntrenador(f.n, f.club));
  $('hojaFondo').hidden = false;
  $('hoja').scrollTop = 0;
  const cerrar = $('hoja').querySelector('[data-cerrar]'); if (cerrar) cerrar.focus();
}
function cerrarFicha() { $('hojaFondo').hidden = true; fichaAbierta = null; }
const botonesHoja = (tipo, n) => `<div class="botones-hoja"><button type="button" class="redondo" data-seguir="${tipo}" data-n="${esc(n)}" aria-pressed="${siguiendo(tipo, n)}" aria-label="${siguiendo(tipo, n) ? 'Dejar de seguir' : 'Seguir'}">★</button><button type="button" class="redondo" data-cerrar aria-label="Cerrar">✕</button></div>`;
// Lo que ganó en la partida, temporada a temporada, con el club en que estaba.
// El entrenador de hoy: el que se sienta en el banquillo en la jornada que se está viendo (no el último de la lista, que puede ser un relevo futuro).
function entrenadorHoy(c) {
  const lista = c.entrenadores || [];
  if (!lista.length) return null;
  const l = S && ligasDe(S, c.pais).find((x) => x.T.tabla.some((t) => t.nombre === c.nombre));
  const tr = l && l.T.tramos && l.T.tramos[c.nombre];
  if (tr && tr.length) {
    const n = Math.max(1, vistasDe(l.T, S)), hoy = tr.find((x) => x.desde <= n && (x.hasta == null || x.hasta >= n)) || tr[0];
    return lista.find((x) => x.nombre === hoy.nombre) || { nombre: hoy.nombre };
  }
  return lista[0];
}
function palmaresDe(club, jugador, crudo) {
  const out = [];
  temporadas().filter(cerradaV).forEach((V) => {
    const cl = club || ((buscarJugador(jugador) || {}).j || { carrera: [] }).carrera.filter((t) => t.temporada === V.temporada).map((t) => t.club).pop();
    if (!cl) return;
    const pais = paisClub(cl) || 'España', c = campeonDe(V, pais), C = copaDe(V, pais);
    // El campeón nacional es uno; ganar una regional o un estatal es otro título, con su nombre.
    if (c.campeon === cl) out.push([nombreLiga(V, pais), V.temporada]);
    c.campeones.filter((x) => x.club === cl).forEach((x) => { if (c.campeon !== cl || x.grupo) out.push([c.campeon && x.grupo ? x.grupo : nombreLiga(V, pais), V.temporada]); });
    // Si el campeón nacional sale de la copa (Taça Brasil), es un solo trofeo.
    if (C && C.campeon === cl && !(otroEn(V, pais) || {}).campeonPorCopa) out.push([C.nombre, V.temporada]);
    if (V.europa === cl) out.push([nombreEuropa(V), V.temporada]);
    if (jugador) {
      const pm = premiosMundo(V), pp = premiosDe(V, pais);
      if (pm.oficiales.length) pm.oficiales.forEach((x) => { if (x.j.nombre === jugador) out.push([x.nombre, V.temporada, 1]); });
      else if (pm.mejor && pm.mejor.nombre === jugador) out.push(['Mejor jugador del mundo', V.temporada, 1]);
      if (pp.pichichi && pp.pichichi.nombre === jugador) out.push([`Máximo goleador de ${nombreLiga(V, pais)}`, V.temporada, 1]);
    }
  });
  if (crudo) return out;
  // Agrupa los mismos títulos: "Copa de Europa · 1958-59, 1959-60".
  const g = new Map(); out.forEach(([t, a]) => g.set(t, (g.get(t) || []).concat(a)));
  return [...g].map(([t, as]) => `<div><span>${esc(t)}${as.length > 1 ? ` (${as.length})` : ''}</span><span>${as.join(', ')}</span></div>`).join('');
}
// Comparador: se elige un jugador, luego otro, y salen cara a cara.
let comparaCon = null;
function cifrasJ(n) {
  const x = buscarJugador(n); if (!x) return null;
  const j = x.j, c = j.carrera || [], pj = c.reduce((s2, t) => s2 + t.pj, 0), g = c.reduce((s2, t) => s2 + t.g, 0);
  const notas = c.filter((t) => t.nota != null && t.pj >= 10).map((t) => t.nota);
  return { n, activo: x.activo, nivel: x.activo ? nivel(j.niv) : Math.max(0, ...c.map((t) => nivel(t.niv || 0))), techo: j.tec ? nivel(j.tec) : null, edad: x.activo ? Motor.edad(j, S.anio + 1) : x.retiro.edad, pj, g, gpp: pj ? g / pj : 0, nota: notas.length ? Math.max(...notas) : null, titulos: palmaresDe(null, n, true).filter((x) => !x[2]).length, club: x.club || 'retirado' };
}
function comparar(a, b) {
  const A = cifrasJ(a), B = cifrasJ(b); if (!A || !B) return '';
  const fila = (t, va, vb, fmt, menos) => { const ga = va != null && vb != null && (menos ? va < vb : va > vb), gb = va != null && vb != null && (menos ? vb < va : vb > va); return `<tr><td class="${ga ? 'gana' : ''}">${va == null ? '–' : fmt(va)}</td><th>${t}</th><td class="${gb ? 'gana' : ''}">${vb == null ? '–' : fmt(vb)}</td></tr>`; };
  const id = (v) => v, dec = (v) => v.toFixed(2).replace('.', ','), un = (v) => v.toFixed(1).replace('.', ',');
  return `<div class="comparador"><div class="fila-sel"><span class="rotulo">Cara a cara</span><button type="button" class="nombre" data-comparar-fin>Quitar</button></div><table><thead><tr><th>${nombreJ(A.n)}<small>${esc(A.club)}</small></th><th></th><th>${nombreJ(B.n)}<small>${esc(B.club)}</small></th></tr></thead><tbody>
    ${fila(A.activo ? 'Nivel hoy' : 'Mejor nivel', A.nivel, B.nivel, id)}${fila('Techo', A.techo, B.techo, id)}${fila('Edad', A.edad, B.edad, id, true)}${fila('Partidos', A.pj, B.pj, id)}${fila('Goles', A.g, B.g, id)}${fila('Goles por partido', A.gpp, B.gpp, dec)}${fila('Mejor nota de un año', A.nota, B.nota, un)}${fila('Títulos', A.titulos, B.titulos, id)}</tbody></table><p class="nota-pie">Cifras de la partida (desde ${Mundo.temporadaTxt(anioInicio)}).</p></div>`;
}
// Tripletes y récords personales del jugador en la partida.
function memorables(n, carrera) {
  const xs = [];
  for (const { m, V, comp } of todosPartidos()) {
    let g = 0, lado = 0;
    for (const e of m.eventos || []) if ((e.tipo === 'gol' || e.tipo === 'pen') && e.quien === n) { g++; lado = e.lado; }
    if (g >= 2) xs.push({ m, V, comp, g, club: lado ? m.visita : m.local });
  }
  const mejorTemp = carrera.slice().sort((a, b) => b.g - a.g)[0];
  const maxP = xs.slice().sort((a, b) => b.g - a.g)[0];
  const rec = [];
  if (mejorTemp && mejorTemp.g) rec.push(`<div><span>Mejor temporada</span><span>${mejorTemp.g} goles · ${mejorTemp.temporada} · ${esc(mejorTemp.club)}</span></div>`);
  if (maxP) rec.push(`<div><span>Más goles en un partido</span><span>${maxP.g} · ${esc(maxP.m.local)} ${maxP.m.ga}-${maxP.m.gb} ${esc(maxP.m.visita)}</span></div>`);
  const trip = xs.filter((x) => x.g >= 3);
  if (trip.length) rec.push(`<div><span>Tripletes o más</span><span>${trip.length}</span></div>`);
  const lista = trip.slice(-5).reverse().map((x) => `<button type="button" class="fila-btn" data-partido="${regP(x.m, x.comp + ' ' + x.V.temporada)}"><span>${x.g} goles · ${esc(x.m.local)} ${x.m.ga}-${x.m.gb} ${esc(x.m.visita)}</span><span>${esc(x.comp)} ${x.V.temporada}</span></button>`).join('');
  return rec.length ? `<div class="palmares"><span class="rotulo">Récords personales y partidos memorables</span>${rec.join('')}${lista}</div>` : '';
}
function compartirFicha(btn) {
  const n = btn.dataset.compartir, A = cifrasJ(n); if (!A) return;
  const x = buscarJugador(n), titulos = palmaresDe(null, n, true).map(([t, a]) => `${t} ${a}`).join(', ');
  const texto = `⚽ ${n} · ${A.club}${A.activo ? ` · nivel ${A.nivel} (${Motor.escala.categoria(A.nivel)})` : ''}\n${A.g} goles en ${A.pj} partidos en la partida${titulos ? `\n🏆 ${titulos}` : ''}`;
  const listo = () => { btn.textContent = '✓ Copiada'; setTimeout(() => { btn.textContent = '📋 Copiar ficha'; }, 2000); };
  try { navigator.clipboard.writeText(texto).then(listo, () => window.prompt('Copia la ficha:', texto)); } catch (e) { window.prompt('Copia la ficha:', texto); }
  return x;
}
// Puesto del jugador en el mundo, en su puesto y en su país (por nivel).
function rankingDe(j, pais) {
  const todos = M.clubes.flatMap((c) => c.jugadores.map((y) => ({ y, pais: c.pais }))).sort((a, b) => b.y.niv - a.y.niv);
  const pos = (f) => todos.filter(f).findIndex((x) => x.y === j) + 1;
  const g = pos(() => true), p = pos((x) => x.y.pos === j.pos), n = pos((x) => x.pais === pais);
  const plural = { POR: 'porteros', DEF: 'defensas', MED: 'centrocampistas', DEL: 'delanteros' }[j.pos] || 'de su puesto';
  return g ? `<div class="ranking"><span><b>N.º ${g}</b> del mundo</span><span><b>N.º ${p}</b> de los ${plural}</span><span><b>N.º ${n}</b> en ${esc(pais)}</span></div>` : '';
}
function fichaJugador(n) {
  const x = buscarJugador(n);
  if (!x) return `<div class="arriba"><h1>${esc(n)}</h1>${botonesHoja('j', n)}</div><div class="vacio">No juega en ninguna de las ligas de la partida.</div>`;
  const j = x.j, carrera = j.carrera || [];
  const anioNac = parseInt(String(j.nac || '').slice(0, 4), 10);
  const sub = x.activo ? `${esc(x.club)}${x.pais ? ' · ' + esc(x.pais) : ''} · ${esc(POS[j.pos] || j.pos || '')}${anioNac ? ` · ${S.anio + 1 - anioNac} años` : ''}` : `Retirado en ${x.retiro.retiro} con ${x.retiro.edad} años`;
  const real = x.activo ? clubReal(n, S.anio) : null;
  const difClub = real && x.club !== 'sin club' && real !== x.club ? marcaDif(`De verdad, en ${S.temporada} jugaba en el ${real}`) : '';
  const nv = x.activo ? nivel(j.niv) : null, techo = j.tec ? nivel(j.tec) : null;
  // Gráfico: el nivel de cada temporada jugada y el de hoy.
  const puntos = carrera.map((t) => ({ y: t.temporada.slice(2, 4), v: nivel(t.niv) }));
  if (x.activo && !carrera.some((t) => t.temporada === S.temporada)) puntos.push({ y: S.temporada.slice(2, 4), v: nv, ahora: true });
  const ult = puntos.slice(-12);
  const grafico = ult.length ? `<div><span class="rotulo">Carrera, nivel por temporada</span><div class="grafico" style="margin-top:8px">${ult.map((p) => `<div class="${p.ahora ? 'ahora' : ''}"><span>${p.v}</span><i style="height:${Math.max(4, Math.round(p.v / 1000 * 80))}px"></i></div>`).join('')}</div><div class="ejes">${ult.map((p) => `<span>${p.y}</span>`).join('')}</div></div>` : '';
  // Cifras de la temporada que se juega (si ya terminó, todas las competiciones).
  let cif = { g: 0, a: 0, nota: null };
  if (cerradaV(S)) { const gx = S.G.find((y) => y.nombre === n); if (gx) cif = { g: gx.g, a: gx.a, nota: gx.pj >= 5 ? gx.notaTemp : null }; }
  else { const gx = golesEnMarcha(S).find((y) => y.nombre === n); if (gx) cif = { g: gx.g, a: gx.a, nota: null }; }
  const tot = carrera.reduce((s, t) => ({ pj: s.pj + t.pj + (t.sel ? t.sel.pj : 0), g: s.g + t.g + (t.sel ? t.sel.g : 0) }), { pj: 0, g: 0 });
  const sel = carrera.filter((t) => t.sel).map((t) => t.sel);
  const selTxt = sel.length ? `<div><span>🌍 ${esc(sel[0].pais)} en ${sel.length === 1 ? 'el Mundial' : 'los Mundiales'} de ${lista(sel.map((x) => x.mundial))}</span><span>${sel.reduce((a, x) => a + x.g, 0)} goles en ${sel.reduce((a, x) => a + x.pj, 0)} partidos</span></div>` : '';
  const ROL = { POR: 'Portero', DEF: 'Defensa', MED: 'Centrocampista', EXT: 'Extremo', DC: 'Delantero centro' };
  const rasgos = [];
  if (j.rol && ROL[j.rol]) rasgos.push(`<span class="fuerte">${ROL[j.rol]}</span>`);
  if (j.fin >= 1.15) rasgos.push('<span>Gran definidor</span>'); else if (j.fin && j.fin <= 0.85) rasgos.push('<span>Poco gol para su puesto</span>');
  try { const pf = Mundo.perfil(j); if (pf === 'precoz') rasgos.push('<span>Precoz</span>'); else if (pf === 'tardio' || pf === 'tardío') rasgos.push('<span>Madura tarde</span>'); } catch (e) { /* sin perfil */ }
  if (techo && nv && techo - nv >= 80) rasgos.push('<span class="oro">Promesa: le queda mucho por crecer</span>');
  if (j.relleno || esFicticio(n)) rasgos.push('<span>Jugador inventado (sin datos de su plantilla)</span>');
  const palm = palmaresDe(null, n);
  return `<div class="carta-identidad"><div class="carta-emblema" aria-hidden="true"><span>${x.activo ? nv : '★'}</span><small>${esc(POS[j.pos] || j.pos || 'Leyenda')}</small><b>${esc(n.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join(''))}</b></div><div class="arriba"><div><span class="rotulo">${x.activo ? 'Carta de jugador' : 'El legado'}</span><h1>${esc(n)}</h1><div class="sub">${sub}${difClub}</div>${j.completo ? `<div class="sub">${esc(j.completo)}</div>` : ''}</div>${botonesHoja('j', n)}</div></div>`
    + (x.activo ? rankingDe(j, x.pais) : '')
    + (x.activo ? `<div class="niveles"><div class="nivel-hoy"><span>NIVEL HOY</span><b>${nv}</b><small>${techo ? `techo ${techo}` : ''}</small></div><div class="categoria"><span>CATEGORÍA</span><b>${esc(Motor.escala.categoria(nv))}</b><small>escala 1-1000</small></div></div>` : '')
    + (x.activo ? atributosHtml(j) + insigniasHtml(j) : '')
    + `<div class="cifras"><div><small>Goles ${S.temporada}</small><b>${cif.g}</b></div><div><small>Asist.</small><b>${cif.a}</b></div><div><small>${cif.nota != null ? 'Nota' : 'En la partida'}</small><b>${cif.nota != null ? cif.nota.toFixed(1).replace('.', ',') : `${tot.g} g / ${tot.pj} pj`}</b></div></div>`
    + (comparaCon && comparaCon !== n ? comparar(comparaCon, n) : '')
    + `<div class="acciones-ficha"><button type="button" class="copiar" data-comparar="${esc(n)}">⚖ Comparar</button><button type="button" class="copiar" data-compartir="${esc(n)}">📋 Copiar ficha</button></div>`
    + grafico
    + memorables(n, carrera)
    + (rasgos.length ? `<div><span class="rotulo">Estilo y rasgos</span><div class="rasgos" style="margin-top:6px">${rasgos.join('')}</div></div>` : '')
    + `<div class="palmares"><span class="rotulo">Palmarés en esta partida</span>${selTxt}${palm || (selTxt ? '' : '<div><span class="vacio">Todavía sin títulos.</span><span></span></div>')}</div>`
    + (carrera.length ? `<div class="palmares"><span class="rotulo">Temporadas</span>${carrera.slice().reverse().map((t) => `<div><span>${t.temporada} · ${esc(t.club)}${t.cedido ? ' (cedido)' : ''}</span><span>${t.pj} pj · ${t.g} g${t.nota != null ? ' · ' + t.nota.toFixed(1).replace('.', ',') : ''}</span></div>`).join('')}</div>` : '');
}
// Los diez atributos del jugador hoy: en qué es bueno y en qué no (el portero enseña los suyos).
function atributosHtml(j) {
  const at = Motor.atributos(j, S.anio + 1), por = j.pos === 'POR';
  const cuales = por ? ['por', 'aer', 'fis', 'vel', 'pas', 'vis'] : Motor.ATRIBUTOS.filter((x) => x !== 'por');
  const mano = typeof ATRIBUTOS_A_MANO !== 'undefined' && ATRIBUTOS_A_MANO[j.n];
  return `<div class="panel-atributos"><span class="rotulo">Atributos${mano ? '' : ' (calculados con su puesto y sus goles reales)'}</span><div class="atributos">${cuales.map((x) => `<div><span>${Motor.NOMBRE_ATRIBUTO[x]}</span><i><b style="width:${at[x]}%" class="${at[x] >= 85 ? 'alto' : at[x] < 50 ? 'bajo' : ''}"></b></i><em>${at[x]}</em></div>`).join('')}</div></div>`;
}
function formaClub(l, n, pais) {
  const nV = vistasDe(l.T, S), t = tablaHasta(l.T, nV, reglasDe(S, pais).puntosVictoria).find((x) => x.nombre === n);
  const ult = l.T.resultados.slice(0, nV).flat().filter((m) => m.local === n || m.visita === n).slice(-5).reverse();
  const prox = nV < l.T.resultados.length ? l.T.resultados[nV].find((m) => m.local === n || m.visita === n) : null;
  if (!ult.length && !prox) return '';
  return `<div class="palmares"><span class="rotulo">Forma ${t && t.racha.length ? formaHtml(t.racha) : ''}</span>${ult.map((m) => `<button type="button" class="fila-btn" data-partido="${regP(m, l.grupo)}"><span>${esc(m.local)} – ${esc(m.visita)}</span><span>${m.ga}-${m.gb}</span></button>`).join('')}${prox ? `<div><span>Próximo: ${esc(prox.local)} – ${esc(prox.visita)}</span><span>jornada ${nV + 1}</span></div>` : ''}</div>`;
}
// Puesto final de cada temporada terminada.
function historialClub(n, pais) {
  const filas = temporadas().filter(cerradaV).map((V) => {
    const l = ligasDe(V, pais).find((x) => x.T.tabla.some((t) => t.nombre === n));
    if (!l) return `<div><span>${V.temporada}</span><span>sin liga</span></div>`;
    const i = tablaHasta(l.T, l.T.resultados.length, reglasDe(V, pais).puntosVictoria).findIndex((t) => t.nombre === n) + 1;
    return `<div><span>${V.temporada} · ${esc(l.nivel === 1 && ligasDe(V, pais).filter((x) => x.nivel === 1).length === 1 ? nombreLiga(V, pais) : l.grupo)}</span><span>${i === 1 && l.nivel === 1 ? '🏆 ' : ''}${i}.º</span></div>`;
  });
  return filas.length ? `<div class="palmares"><span class="rotulo">Temporada a temporada</span>${filas.reverse().join('')}</div>` : '';
}
// Máximos goleadores del club en la partida (también los que ya se fueron o se retiraron).
function goleadoresClub(n) {
  const suma = new Map();
  M.clubes.flatMap((c) => c.jugadores).concat(M.libres, M.retirados).forEach((j) => (j.carrera || []).forEach((t) => { if (t.club === n && t.g) suma.set(j.n, (suma.get(j.n) || 0) + t.g); }));
  const xs = [...suma].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return xs.length ? `<div class="palmares"><span class="rotulo">Sus máximos goleadores en la partida</span>${xs.map(([q, g]) => `<div><span>${nombreJ(q)}</span><span>${g} goles</span></div>`).join('')}</div>` : '';
}
function fichaClub(n) {
  const c = clubDe(n), info = INFO.clubes[n] || {};
  if (!c) return `<div class="arriba"><h1>${esc(n)}</h1>${botonesHoja('c', n)}</div><div class="vacio">Este club no juega en la partida.</div>`;
  const l = ligasDe(S, c.pais).find((x) => x.T.tabla.some((t) => t.nombre === n));
  let puesto = '';
  if (l) { const tb = tablaHasta(l.T, vistasDe(l.T, S), reglasDe(S, c.pais).puntosVictoria), i = tb.findIndex((t) => t.nombre === n); puesto = `${i + 1}.º en ${l.grupo === 'Primera' ? 'Primera' : l.grupo} · ${tb[i].pts} pts`; }
  const real = l ? puestoReal(c.pais, S.anio, n) : null;
  const t = entrenadorHoy(c);
  const plantilla = c.jugadores.slice().sort((a, b) => b.niv - a.niv);
  const palm = palmaresDe(n, null);
  return `<div class="carta-identidad carta-club"><div class="carta-emblema emblema-club" aria-hidden="true">${escudo(n)}<small>CLUB</small></div><div class="arriba"><div><div class="sub">${esc(c.pais)} · ${esc(c.grupo || '')}${info.estadio ? ' · ' + esc(info.estadio) : ''}</div><h1>${info.c1 ? `<span class="escudo" aria-hidden="true" style="background:linear-gradient(90deg, ${info.c1} 50%, ${info.c2} 50%)"></span>` : ''}${esc(n)}</h1></div>${botonesHoja('c', n)}</div></div>`
    + `<div class="cifras"><div><small>Puesto</small><b>${puesto ? puesto.split(' ')[0] : '–'}</b></div><div><small>Prestigio</small><b>${c.prestigio}</b></div><div><small>Entrenador</small><b style="font-size:14px">${t ? (`<button type="button" class="nombre" data-e="${esc(t.nombre)}" data-ec="${esc(n)}">${esc(sinApodo(t.nombre))}</button>`) : '–'}</b></div></div>`
    + (puesto ? `<div class="sub">${esc(puesto)}${real && real !== +puesto.split('.')[0] ? marcaDif(`Puesto real al final: ${real}.º`) : ''}</div>` : '')
    + (l ? formaClub(l, n, c.pais) : '')
    + `<div class="palmares"><span class="rotulo">Palmarés en esta partida</span>${palm || '<div><span class="vacio">Todavía sin títulos.</span><span></span></div>'}</div>`
    + historialClub(n, c.pais)
    + goleadoresClub(n)
    + `<div class="palmares"><span class="rotulo">Plantilla</span>${plantilla.map((j) => `<div><span>${nombreJ(j.n)} <small>${esc(POS[j.pos] || j.pos)}</small></span><span>${nivel(j.niv)}</span></div>`).join('')}</div>`;
}
function fichaEntrenador(n, club) {
  const c = clubDe(club), t = c && (c.entrenadores || []).find((x) => x.nombre === n);
  const rasgos = [];
  if (t && t.estilo) rasgos.push(`<span class="fuerte">${esc(Motor.NOMBRE_ESTILO[t.estilo] || t.estilo)}</span>`);
  if (t && t.fisico) rasgos.push('<span>Exige mucho físico</span>');
  if (t && t.merito) rasgos.push('<span>Sienta a quien no rinde</span>');
  if (t && t.fijo) rasgos.push('<span>Intocable en el banquillo</span>');
  const nac = t && t.nac ? parseInt(String(t.nac).slice(0, 4), 10) : null;
  const palm = palmaresDe(club, null);
  return `<div class="arriba"><div><div class="sub">Entrenador · ${esc(club)}${nac ? ` · ${S.anio + 1 - nac} años` : ''}</div><h1>${esc(sinApodo(n))}</h1></div><div class="botones-hoja"><button type="button" class="redondo" data-cerrar aria-label="Cerrar">✕</button></div></div>`
    + `<div><span class="rotulo">Estilo</span><div class="rasgos" style="margin-top:6px">${rasgos.join('') || '<span>Sin rasgos documentados</span>'}</div></div>`
    + `<div class="palmares"><span class="rotulo">Títulos de su club en la partida</span>${palm || '<div><span class="vacio">Todavía sin títulos.</span><span></span></div>'}</div>`
    + `<div><button type="button" class="ficha-btn" data-c="${esc(club)}"><span>Ver el ${esc(club)}</span><span>→</span></button></div>`;
}

// ---------- Historia ----------
let histPais = 'España';
const ERAS = [
  { nombre: 'Los pioneros', desde: 1930, hasta: 1949, color: '#A0703C', figuras: 'Meazza · Zamora · Leônidas · Mundiales de Uruguay e Italia' },
  { nombre: 'Di Stéfano y la Copa de Europa', desde: 1950, hasta: 1957, color: '#7A5CC8', figuras: 'Puskás · Di Stéfano · Kubala · el Milagro de Berna' },
  { nombre: 'Llega Pelé', desde: 1958, hasta: 1969, color: '#1F9D55', figuras: 'Pelé, 17 años · el Madrid de las cinco Copas · Eusébio' },
  { nombre: 'Fútbol total', desde: 1970, hasta: 1985, color: '#DD6A1F', figuras: 'Cruyff · Beckenbauer · Müller · debuta Maradona' },
  { nombre: 'Maradona y el Milan', desde: 1986, hasta: 1999, color: '#2B86CF', figuras: 'Maradona · Van Basten · Ronaldo Nazário · la ley Bosman' },
  { nombre: 'Messi y Cristiano', desde: 2000, hasta: 2026, color: '#C2255C', figuras: 'Zidane · Ronaldinho · Messi · Cristiano · Mbappé' }
];
const eraDe = (anio) => ERAS.find((e) => anio >= e.desde && anio <= e.hasta) || ERAS[0];
// El color de la época tiñe toda la página y su nombre sale en el panel.
function ponerEra(anio) {
  const e = eraDe(anio);
  document.documentElement.style.setProperty('--rojo', e.color);
  $('eraTxt').textContent = e.nombre;
}
// Cuadrícula de campeones: una fila por país, una columna por temporada, con los colores del club.
function mapaCampeones(ts) {
  const paises = paisesDe(ts[ts.length - 1]);
  const celda = (club) => { if (!club) return '<td class="vacia">–</td>'; const c = INFO.clubes[club] || {}; return `<td><button type="button" class="chip-club" data-c="${esc(club)}" title="${esc(club)}" style="background:${c.c1 || '#888'};color:${c.c2 || '#fff'};border-color:${c.c2 || '#fff'}">${esc(club.replace(/^(Real|Club|FC|AC|SC|CF|Sporting de|Atlético|Stade de|Racing de) /, '').slice(0, 3).toUpperCase())}</button></td>`; };
  const movil = ['Europa'].concat(paises).map((p) => `<details><summary>${esc(p)}</summary>${ts.map((V) => { const c = p === 'Europa' ? [V.europa].filter(Boolean) : campeonDe(V, p).campeon ? [campeonDe(V, p).campeon] : campeonDe(V, p).campeones.map((x) => x.club); return `<div><span>${V.temporada}</span><span>${c.length ? c.map(botonClub).join(' ') : '–'}</span></div>`; }).join('')}</details>`).join('');
  return `<div class="caja" style="margin:18px 0"><span class="rotulo">Mapa de campeones</span><div class="mapa-movil">${movil}</div><div class="mapa-escritorio" style="overflow-x:auto"><table class="mapa"><thead><tr><th></th>${ts.map((V) => `<th>${V.temporada.slice(2)}</th>`).join('')}</tr></thead><tbody>
    <tr><th>Europa</th>${ts.map((V) => celda(V.europa)).join('')}</tr>
    ${paises.map((p) => `<tr><th>${esc(p)}</th>${ts.map((V) => { const c = campeonDe(V, p); return celda(c.campeon || (c.campeones[0] || {}).club); }).join('')}</tr>`).join('')}</tbody></table></div><p class="nota-pie">Toca un escudo para ver el club.</p></div>`;
}
// Mejor jugador del mundo y máximo goleador de cada temporada.
function premiosPorAnio(ts) {
  return `<div class="caja"><span class="rotulo">Premios de cada año</span><table class="tabla"><thead><tr><th style="text-align:left">Año</th><th>Mejor del mundo</th><th>Goleador</th></tr></thead><tbody>${ts.slice().reverse().map((V) => { const pm = premiosMundo(V); return `<tr><td>${V.temporada}</td><td>${pm.ganadorMejor ? `${nombreJ(pm.ganadorMejor.nombre)}${pm.nombreMejor !== 'Mejor jugador del mundo' ? ` <small>${esc(pm.nombreMejor)}</small>` : ''}` : '–'}</td><td>${pm.goleador ? `${nombreJ(pm.goleador.nombre)} <small>${pm.goleador.g}</small>` : '–'}</td></tr>`; }).join('')}</tbody></table></div>`;
}
// Diario de la partida: todo lo que fue pasando, lo último primero.
function diarioHtml() {
  const xs = teletipo.slice(0, 40);
  return xs.length ? `<details class="diario"><summary><span class="rotulo">Diario de la partida</span> <small>${teletipo.length} entradas</small></summary>${xs.map((x) => `<div class="resultado"><span>${esc(x.texto)}<small>${esc(x.temporada)} · ${esc(x.cuando)}</small></span></div>`).join('')}</details>` : '';
}
// Tabla de todos los años de la partida en la primera de un país.
function clasificacionHistorica(ts) {
  const t = new Map();
  ts.forEach((V) => ligasDe(V, histPais).filter((l) => l.nivel === 1).forEach((l) => {
    tablaHasta(l.T, l.T.resultados.length, reglasDe(V, histPais).puntosVictoria).forEach((x, i) => {
      const y = t.get(x.nombre) || { nombre: x.nombre, temp: 0, pj: 0, pts: 0, gf: 0, tit: 0 };
      y.temp++; y.pj += x.pj; y.pts += x.pts; y.gf += x.gf; if (i === 0 && campeonDe(V, histPais).campeon === x.nombre) y.tit++;
      t.set(x.nombre, y);
    });
  }));
  const xs = [...t.values()].sort((a, b) => b.pts - a.pts).slice(0, 12);
  return `<div class="caja"><span class="rotulo">Clasificación histórica · ${esc(histPais)}</span>${xs.length ? `<table class="tabla"><thead><tr><th style="text-align:left">#</th><th>Club</th><th>Temp.</th><th>Ligas</th><th>Pts</th></tr></thead><tbody>${xs.map((x, i) => `<tr><td>${i + 1}</td><td>${botonClub(x.nombre)}</td><td>${x.temp}</td><td>${x.tit || ''}</td><td class="pts">${x.pts}</td></tr>`).join('')}</tbody></table>` : '<div class="vacio">Sin liga de primera.</div>'}</div>`;
}
// Los clubes con más títulos de la partida en todo el mundo.
function palmaresClubes(ts) {
  const t = new Map(), suma = (club, campo) => { if (!club) return; const y = t.get(club) || { club, eu: 0, liga: 0, copa: 0 }; y[campo]++; t.set(club, y); };
  ts.forEach((V) => { suma(V.europa, 'eu'); paisesDe(V).forEach((p) => { suma(campeonDe(V, p).campeon, 'liga'); const C = copaDe(V, p); if (C) suma(C.campeon, 'copa'); }); });
  const xs = [...t.values()].sort((a, b) => (b.eu * 3 + b.liga * 2 + b.copa) - (a.eu * 3 + a.liga * 2 + a.copa)).slice(0, 12);
  return `<div class="caja"><span class="rotulo">Palmarés mundial de clubes</span><table class="tabla"><thead><tr><th style="text-align:left">#</th><th>Club</th><th>Europa</th><th>Ligas</th><th>Copas</th></tr></thead><tbody>${xs.map((x, i) => `<tr><td>${i + 1}</td><td>${botonClub(x.club)}</td><td>${x.eu || ''}</td><td>${x.liga || ''}</td><td>${x.copa || ''}</td></tr>`).join('')}</tbody></table></div>`;
}
// Goles de toda la partida, en todos los clubes, de activos y retirados.
function goleadoresHistoricos() {
  const xs = M.clubes.flatMap((c) => c.jugadores.map((j) => ({ j, club: c.nombre, activo: true }))).concat(M.libres.map((j) => ({ j, club: 'sin club', activo: true })), M.retirados.map((j) => ({ j, club: 'retirado', activo: false })))
    .map((x) => Object.assign(x, { g: (x.j.carrera || []).reduce((s2, t) => s2 + t.g, 0), pj: (x.j.carrera || []).reduce((s2, t) => s2 + t.pj, 0) }))
    .filter((x) => x.g > 0).sort((a, b) => b.g - a.g).slice(0, 12);
  return `<div class="caja"><span class="rotulo">Goleadores históricos de la partida</span>${xs.map((x, i) => goleadorFila({ nombre: x.j.n, club: x.club }, i, x.g, `${x.pj} partidos`)).join('') || '<div class="vacio">Todavía no hay goles.</div>'}</div>`;
}
// Un capítulo solo se abre con el verano del año terminado en nueve ya visto.
// Se reconstruye del archivo de la partida: no añade estado ni modifica resultados.
function libroDecadas(ts) {
  const finales = ts.filter((V) => V.anio % 10 === 9 && V.veranoHecho).slice().reverse();
  if (!finales.length) return '';
  const parrafo = (texto) => `<p>${esc(texto)}</p>`;
  const contar = (xs) => {
    const cuenta = new Map();
    xs.filter(Boolean).forEach((n) => cuenta.set(n, (cuenta.get(n) || 0) + 1));
    return [...cuenta].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
  };
  const dominio = (xs, titulo) => {
    const orden = contar(xs);
    if (!orden.length) return `${titulo}: no se disputó en los años recogidos.`;
    const lideres = orden.filter((x) => x[1] === orden[0][1]);
    return `${titulo}: ${lista(lideres.map(([n]) => n))} ${lideres.length > 1 ? 'compartieron el mando' : 'mandó'} con ${orden[0][1]} títulos. El palmarés quedó así: ${orden.map(([n, t]) => `${n} (${t})`).join(', ')}.`;
  };
  return `<section class="libro-decadas" aria-label="El libro de la década"><h2>El libro de la década</h2>${finales.map((finDecada) => {
    const desde = finDecada.anio - 9;
    const anos = ts.filter((V) => V.anio >= desde && V.anio <= finDecada.anio);
    const paises = [...new Set(anos.flatMap(paisesDe))];
    const jugadores = new Map();
    anos.forEach((V) => figurasDe(V).forEach((x) => {
      const j = jugadores.get(x.nombre) || { nombre: x.nombre, g: 0, pj: 0, nota: 0, valoradas: 0 };
      j.g += x.g; j.pj += x.pj;
      if (x.pj >= 15 && Number.isFinite(x.notaTemp)) { j.nota += x.notaTemp * x.pj; j.valoradas += x.pj; }
      jugadores.set(x.nombre, j);
    }));
    const todos = [...jugadores.values()];
    const mejores = todos.filter((j) => j.valoradas).sort((a, b) => b.nota / b.valoradas - a.nota / a.valoradas || b.valoradas - a.valoradas || a.nombre.localeCompare(b.nombre, 'es')).slice(0, 3);
    const goleadores = todos.filter((j) => j.g > 0).sort((a, b) => b.g - a.g || a.nombre.localeCompare(b.nombre, 'es'));
    const maximos = goleadores.filter((j) => j.g === goleadores[0].g);
    const novedades = anos.flatMap((V) => (V.novedades || []).map((x) => ({ ...x, temporada: V.temporada })));
    const joyas = novedades.filter((x) => x.tipo === 'joya').sort((a, b) => (b.tec - b.real) - (a.tec - a.real) || b.tec - a.tec);
    const sorpresa = joyas[0];
    const mundiales = anos.filter((V) => V.R.MU).map((V) => `${V.R.MU.anio}: ${V.R.MU.campeon}`);
    const sucesos = [
      ['insignia', 'Las insignias', (x) => `${x.jugador} ganó ${x.nombre} (${GRADO_TXT[x.grado] || 'sin grado'}, ${x.club})`],
      ['joya', 'Las joyas', (x) => `${x.jugador} despegó en el ${x.club} a los ${x.edad} años`],
      ['lesion', 'Las lesiones graves', (x) => `${x.jugador}, del ${x.club}, cayó de nivel ${nivel(x.niv)} a ${nivel(x.queda)}`],
      ['rivalidad', 'Las rivalidades', (x) => `${x.a} (${x.clubA}) y ${x.b} (${x.clubB}) iniciaron su duelo`],
      ['regreso', 'Los regresos', (x) => `${x.jugador} recuperó su nivel en el ${x.club}`]
    ].map(([tipo, titulo, relatar]) => {
      // De las insignias solo las grandes (oro y excepcional): las demás son cientos por década.
      const xs = novedades.filter((x) => x.tipo === tipo && (tipo !== 'insignia' || x.grado >= 2) && (tipo !== 'lesion' || x.niv >= 870));
      return `<details class="decada-sucesos"><summary>${titulo} · ${xs.length}</summary>${xs.length ? anos.map((V) => {
        const noticias = xs.filter((x) => x.temporada === V.temporada);
        return noticias.length ? parrafo(`${V.temporada}: ${noticias.map(relatar).join('; ')}.`) : '';
      }).join('') : parrafo('No se registraron en estos años.')}</details>`;
    }).join('');
    return `<details class="decada"><summary><span class="rotulo">Crónica de ${desde}–${finDecada.anio + 1}</span><strong>Los años ${desde}</strong><span>${anos[0].temporada} — ${finDecada.temporada}</span></summary><article class="decada-pagina">
      ${parrafo(`Así se escribió esta década en tu partida: ${anos.length} temporadas, de ${anos[0].temporada} a ${finDecada.temporada}.${anos.length < 10 ? ' Es un capítulo parcial: la partida comenzó con la década ya en marcha.' : ''}`)}
      <h3>Los dueños del balón</h3>${paises.map((p) => parrafo(dominio(anos.flatMap((V) => {
        const c = campeonDe(V, p); return c.campeon ? [c.campeon] : c.campeones.map((x) => x.club);
      }), p))).join('')}
      ${parrafo(dominio(anos.map((V) => V.europa), 'Copa de Europa'))}
      ${parrafo(mundiales.length ? `Los Mundiales coronaron a estas selecciones: ${mundiales.join('; ')}.` : 'No se disputaron Mundiales en los años recogidos.')}
      <h3>Los nombres de la década</h3>
      ${parrafo(mejores.length ? `Los tres mejores por nota media ponderada por partidos fueron ${lista(mejores.map((j, i) => `${i + 1}. ${j.nombre} (${(j.nota / j.valoradas).toFixed(2)})`))}.` : 'No hay notas suficientes para elegir a los tres mejores.')}
      ${parrafo(maximos.length ? `${lista(maximos.map((j) => j.nombre))} ${maximos.length > 1 ? 'compartieron el primer puesto goleador' : 'fue el máximo goleador'} con ${maximos[0].g} goles.` : 'No se registraron goles.')}
      <p class="nota-pie">Se cuentan jugadores de ligas de primera y sus goles con clubes. La nota usa temporadas con al menos 15 partidos; los empates se ordenan por partidos valorados.</p>
      <h3>La mayor sorpresa</h3>${parrafo(sorpresa ? `${sorpresa.jugador} fue la joya que más se alejó de su techo real: irrumpió en el ${sorpresa.club} en ${sorpresa.temporada}, a los ${sorpresa.edad} años. Su techo en la partida llegó a ${nivel(sorpresa.tec)}. Así se elige la sorpresa de este capítulo.` : 'No se registraron joyas inesperadas: esta década no tiene una mayor sorpresa entre las novedades.')}
      <h3>Las huellas que quedaron</h3>${sucesos}
    </article></details>`;
  }).join('')}</section>`;
}
function pintarHistoria() {
  const ts = temporadas().filter(cerradaV);
  // La era la marca quien domina la partida: cada Copa de Europa vale tres ligas.
  const puntos = new Map();
  ts.forEach((V) => { if (V.europa) puntos.set(V.europa, (puntos.get(V.europa) || 0) + 3); paisesDe(V).forEach((p) => { const c = campeonDe(V, p).campeon; if (c) puntos.set(c, (puntos.get(c) || 0) + 1); }); });
  const dom = [...puntos].sort((a, b) => b[1] - a[1])[0];
  const era = eraDe(S ? S.anio : anioInicio);
  let colorEra = 'var(--rojo)', titulo = era.nombre, subt = `La partida empieza en ${Mundo.temporadaTxt(anioInicio)}. Los colores cambiarán con quien domine.`;
  if (dom) {
    const info = INFO.clubes[dom[0]] || {};
    const claro = (h) => /^#?[EFef][0-9A-Fa-f]/.test(String(h || '').replace('#', '')) ;
    colorEra = info.c1 && !claro(info.c1) ? info.c1 : info.c2 || 'var(--rojo)';
    const eu = ts.filter((V) => V.europa === dom[0]).length, ligas = ts.filter((V) => paisesDe(V).some((p) => campeonDe(V, p).campeon === dom[0])).length;
    titulo = `La era del ${dom[0]}`;
    subt = `${eu ? `${eu} ${eu === 1 ? 'Copa' : 'Copas'} de Europa` : ''}${eu && ligas ? ' y ' : ''}${ligas ? `${ligas} ${ligas === 1 ? 'liga' : 'ligas'}` : ''} en ${ts.length} ${ts.length === 1 ? 'temporada' : 'temporadas'}.`;
  }
  const paises = S ? paisesDe(S) : ['España'];
  if (!paises.includes(histPais)) histPais = 'España';
  const filas = ts.map((V) => {
    const c = campeonDe(V, histPais), real = campeonRealDe(histPais, V.anio);
    const liga = c.campeon ? esc(c.campeon) + marcaSi(c.campeon, real) : c.campeones.length ? c.campeones.map((x) => esc(x.club)).join(', ') : '–';
    return `<tr><td><button type="button" class="nombre" data-ver="${temporadas().indexOf(V)}">${V.temporada}</button></td><td>${liga}</td><td>${V.europa ? esc(V.europa) + marcaSi(V.europa, EUROPA_REAL[V.anio]) : '–'}</td></tr>`;
  }).join('');
  const R = M.records, recs = [];
  if (R.liga) recs.push(`<div class="record"><span>RÉCORD DE GOLES EN UNA LIGA</span><b>${esc(R.liga.quien)}, ${R.liga.g} goles (${esc(R.liga.temporada)})</b>${marcaDif(`Récord real de la época: ${Mundo.RECORD_REAL_LIGA.quien}, ${Mundo.RECORD_REAL_LIGA.goles} en ${Mundo.RECORD_REAL_LIGA.temporada}`)}</div>`);
  if (R.equipoPts) recs.push(`<div class="record"><span>MÁS PUNTOS EN UNA LIGA ESPAÑOLA</span><b>${esc(R.equipoPts.club)}, ${R.equipoPts.pts} puntos</b><small>${esc(R.equipoPts.temporada)}</small></div>`);
  if (R.equipoGoles) recs.push(`<div class="record"><span>MÁS GOLES DE UN EQUIPO EN UNA LIGA ESPAÑOLA</span><b>${esc(R.equipoGoles.club)}, ${R.equipoGoles.gf} goles</b><small>${esc(R.equipoGoles.temporada)}</small></div>`);
  if (R.partido) recs.push(`<div class="record"><span>GOLES EN UN PARTIDO</span><b>${esc(R.partido.quien)}, ${R.partido.g} goles</b><small>${esc(R.partido.partido)}, ${esc(R.partido.temporada)}</small></div>`);
  const momentos = ts.slice().reverse().flatMap((V) => divergencias(V)).slice(0, 15);
  $('s-historia').innerHTML = `<div class="era-cab" style="border-bottom-color:${colorEra}"><div class="rotulo" style="color:${colorEra === 'var(--rojo)' ? 'var(--rojo-txt)' : 'var(--gris)'}">${Mundo.temporadaTxt(anioInicio)} — hoy</div><h1>${esc(titulo)}</h1><p>${esc(subt)}</p></div>`
    + `<div class="columnas"><div class="caja"><div class="fila-sel"><span class="rotulo">Campeones</span><select class="desplegable" data-accion="hpais" aria-label="Liga">${paises.map((p) => `<option${p === histPais ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select></div>
        ${ts.length ? `<table class="campeones"><thead><tr><th>Año</th><th>${esc(histPais)}</th><th>Europa</th></tr></thead><tbody>${filas}</tbody></table><p class="nota-pie">Toca un año para ver ese año en Competiciones.</p>` : '<div class="vacio">La primera temporada todavía se está jugando.</div>'}</div>
      <div class="caja">${recs.join('') || '<div class="vacio">Los récords se apuntan al terminar cada temporada.</div>'}
        <span class="rotulo" style="margin-top:8px">Momentos que cambiaron la historia</span>
        ${momentos.length ? momentos.map((m) => `<div class="momento"><b>${esc(m.titulo)}</b>${marcaDif(m.real)}</div>`).join('') : '<div class="vacio">De momento, la historia va como fue.</div>'}</div></div>`
    + libroDecadas(ts)
    + mundialesHistoria()
    + (ts.length ? mapaCampeones(ts) + `<div class="columnas">${clasificacionHistorica(ts)}${palmaresClubes(ts)}${goleadoresHistoricos()}${premiosPorAnio(ts)}</div>` : '')
    + diarioHtml();
}

// ---------- Inicio: la línea del tiempo ----------
let anioSel = ANIO_DEFECTO, hayGuardada = false;
const anioElegido = () => anioSel;
function pintarInicio() {
  // Se elige una época, no un año: la partida arranca en la primera temporada de la época que tenga datos.
  const sel = eraDe(anioSel);
  $('eras').innerHTML = ERAS.map((e) => {
    const primero = ANIOS.find((a) => a >= e.desde && a <= e.hasta);
    return `<button type="button" class="era" data-era="${esc(e.nombre)}" style="--e:${e.color}" aria-pressed="${e === sel}"${primero == null ? ' disabled' : ''}><span class="anios-era">${e.desde}–${String(Math.min(e.hasta, 2026)).slice(2)}</span><b>${esc(e.nombre)}</b><small>${esc(e.figuras)}</small><span class="estado">${primero == null ? 'Próximamente' : `Empieza en ${Mundo.temporadaTxt(primero)}`}</span></button>`;
  }).join('');
  ponerEra(anioSel);
  $('empezar').textContent = `Empezar en ${Mundo.temporadaTxt(anioSel)}${hayGuardada ? ' (nueva partida)' : ''}`;
  $('seguirPartida').hidden = !hayGuardada;
  if (hayGuardada && S) $('seguirPartida').textContent = `Seguir mi partida (${S.temporada} · ${eraDe(S.anio).nombre})`;
  try { $('constantes').checked = localStorage.getItem('universo-futbol-constantes') !== 'no'; } catch (e) { /* por defecto encendido */ }
  $('pronosticos').checked = pronOn;
}
function abrirInicio() { pintarInicio(); $('inicio').hidden = false; $('cargando').hidden = true; window.scrollTo({ top: 0 }); }

// ---------- Eventos ----------
document.addEventListener('click', async (e) => {
  const dif = e.target.closest('.dif');
  if (dif) { const abierta = dif.classList.toggle('abierta'); dif.textContent = abierta ? '≠ ' + dif.dataset.real : '≠'; return; }
  const tb = e.target.closest('[data-tiempo]');
  if (tb) { const t = tb.dataset.tiempo; if (t === 'siguiente') siguienteTemporada(); else if (t === 'semana') pasoAMano(); else if (t === 'pausa') parar(); else if (t === 'fin') saltarAlFinal(); else jugar(t); return; }
  const nav = e.target.closest('#navegar button[data-s]');
  if (nav) { nav.blur(); seccion = nav.dataset.s; nuevoEn.delete(seccion); cerrarFicha(); pintar(); window.scrollTo({ top: 0 }); return; }
  if (e.target === $('hojaFondo') || e.target.closest('[data-cerrar]')) { cerrarFicha(); return; }
  if (e.target.closest('[data-quitar-pron]')) { ponerPron(false); pintarHoy(); return; }
  const sg = e.target.closest('[data-seguir]');
  if (sg) { alternarSigue(sg.dataset.seguir, sg.dataset.n); abrirFicha(fichaAbierta); if (seccion === 'hoy') pintarHoy(); return; }
  const pt = e.target.closest('[data-partido]');
  if (pt) { abrirFicha({ tipo: 'p', id: +pt.dataset.partido }); return; }
  const cmpF = e.target.closest('[data-comparar-fin]');
  if (cmpF) { comparaCon = null; if (fichaAbierta) abrirFicha(fichaAbierta); if (seccion === 'mundo') pintarMundo(); return; }
  const cmp = e.target.closest('[data-comparar]');
  if (cmp) { comparaCon = cmp.dataset.comparar; cerrarFicha(); seccion = 'mundo'; busqTipo = 'j'; pintar(); window.scrollTo({ top: 0 }); if ($('busq')) $('busq').focus(); return; }
  const cmt = e.target.closest('[data-compartir]');
  if (cmt) { compartirFicha(cmt); return; }
  const cp = e.target.closest('[data-copiar]');
  if (cp) { copiarResumen(cp); return; }
  const lv = e.target.closest('[data-lado]');
  if (lv) { ladoTabla = lv.dataset.lado; pintarComp(); return; }
  const j = e.target.closest('[data-j]');
  if (j && !j.closest('.anios')) { abrirFicha({ tipo: 'j', n: j.dataset.j }); return; }
  const c = e.target.closest('[data-c]');
  if (c) { abrirFicha({ tipo: 'c', n: c.dataset.c }); return; }
  const en = e.target.closest('[data-e]');
  if (en) { abrirFicha({ tipo: 'e', n: en.dataset.e, club: en.dataset.ec }); return; }
  if (e.target.closest('[data-ir-mundial]')) { compSel = 'mundial'; compVista = 'tabla'; verJ = null; const b = document.querySelector('#navegar button[data-s="comp"]'); if (b) b.click(); pintarComp(); return; }
  const comp = e.target.closest('[data-comp]');
  if (comp) { compSel = comp.dataset.comp; verJ = null; pintarComp(); return; }
  const vista = e.target.closest('[data-vista]');
  if (vista) { compVista = vista.dataset.vista; pintarComp(); return; }
  const jn = e.target.closest('[data-j-nav]');
  if (jn) { const L = ligasDe(VT(), compPais).find((l) => l.grupo === compSel), nV = vistasDe(L.T, VT()); verJ = Math.max(1, Math.min(nV, (verJ == null ? nV : verJ) + +jn.dataset.jNav)); if (verJ >= nV) verJ = null; pintarComp(); return; }
  const st = e.target.closest('[data-stat]');
  if (st) { figStat = st.dataset.stat; if (seccion === 'comp') pintarComp(); else pintarResultados(); return; }
  const bt = e.target.closest('[data-btipo]');
  if (bt) { busqTipo = bt.dataset.btipo; pintarMundo(); return; }
  const ver = e.target.closest('[data-ver]');
  if (ver) { const i = +ver.dataset.ver; verK = temporadas()[i] === S ? null : i; seccion = 'comp'; pintar(); window.scrollTo({ top: 0 }); return; }
  const era = e.target.closest('[data-era]');
  if (era && !era.disabled) { const e = ERAS.find((x) => x.nombre === era.dataset.era), a = e && ANIOS.find((y) => y >= e.desde && y <= e.hasta); if (a != null) { anioSel = a; pintarInicio(); } return; }
  const an = e.target.closest('[data-anio]');
  if (an && !an.disabled) { anioSel = +an.dataset.anio; pintarInicio(); return; }
});
document.addEventListener('change', (e) => {
  const a = e.target.dataset && e.target.dataset.accion;
  if (a === 'temporada') { const i = +e.target.value; verK = temporadas()[i] === S ? null : i; verJ = null; pintar(); }
  else if (a === 'pais') { compPais = e.target.value; compSel = ''; verJ = null; pintarComp(); }
  else if (a === 'bpais') { busqPais = e.target.value; pintarMundo(); }
  else if (a === 'bpos') { busqPos = e.target.value; pintarMundo(); }
  else if (a === 'hpais') { histPais = e.target.value; pintarHistoria(); }
  else if (a === 'pron') guardarPron(e.target.dataset.pais, e.target.value);
  else if (e.target.id === 'pronosticos') ponerPron(e.target.checked);
  else if (e.target.id === 'constantes') { try { localStorage.setItem('universo-futbol-constantes', e.target.checked ? 'si' : 'no'); } catch (x) { /* nada */ } }
});
document.addEventListener('input', (e) => { if (e.target.id === 'busq') { busq = e.target.value; pintarResultados(); } });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('hojaFondo').hidden) { cerrarFicha(); return; }
  // Atajos: espacio juega o para, → una semana, M un mes, F al final, Intro la temporada siguiente, 1-4 las secciones.
  if (e.ctrlKey || e.metaKey || e.altKey || !S || !$('inicio').hidden || !$('hojaFondo').hidden) return;
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName || '') || (e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter'))) return;
  const k2 = e.key.toLowerCase();
  if (k2 === ' ') { e.preventDefault(); if (jugando) parar(); else jugar('temporada'); }
  else if (k2 === 'arrowright') pasoAMano();
  else if (k2 === 'm') jugar('mes');
  else if (k2 === 'f') saltarAlFinal();
  else if (k2 === 'enter' && finDeTemporada()) siguienteTemporada();
  else if ('1234'.includes(k2) && k2) { seccion = ['hoy', 'comp', 'mundo', 'historia'][+k2 - 1]; nuevoEn.delete(seccion); cerrarFicha(); pintar(); }
});
$('nueva').addEventListener('click', () => { parar(); abrirInicio(); });
$('seguirPartida').addEventListener('click', () => { $('inicio').hidden = true; if (S) ponerEra(S.anio); pintar(); });
$('empezar').addEventListener('click', async () => {
  $('inicio').hidden = true; $('cargando').hidden = false;
  await borrarGuardada(); ultimoGuardado = '';
  seccion = 'hoy'; verK = null; compPais = 'España'; compSel = 'Primera';
  hayGuardada = true;
  nuevaPartida();
});

// Tema claro u oscuro a mano (si no se elige, el del sistema).
function ponerTema(t) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const oscuro = t ? t === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  $('tema').textContent = oscuro ? '☀️' : '🌙';
  $('tema').setAttribute('aria-label', oscuro ? 'Poner tema claro' : 'Poner tema oscuro');
}
// Sin elección guardada, el juego se abre en oscuro.
try { ponerTema(localStorage.getItem('universo-futbol-tema') || 'dark'); } catch (e) { ponerTema('dark'); }
$('tema').addEventListener('click', () => {
  const oscuro = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const t = oscuro ? 'light' : 'dark';
  ponerTema(t);
  try { localStorage.setItem('universo-futbol-tema', t); } catch (e) { /* nada */ }
});

// Al abrir: si hay una partida guardada, se sigue donde se dejó; si no, se elige el año.
(async () => {
  pintarMandos();
  almacen = await Promise.race([prepararAlmacen(), new Promise((res) => setTimeout(() => res(null), 4000))]);
  const g = await leerGuardada();
  if (g && g.version === 24) { hayGuardada = true; nuevaPartida(g); }
  else abrirInicio();
})();

// Con una ficha abierta, el tabulador no sale de ella.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || $('hojaFondo').hidden) return;
  const xs = [...$('hoja').querySelectorAll('button, a[href], input, select, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
  if (!xs.length) return;
  const primero = xs[0], ultimo = xs[xs.length - 1], dentro = $('hoja').contains(document.activeElement);
  if (!dentro || (e.shiftKey && document.activeElement === primero)) { e.preventDefault(); (e.shiftKey ? ultimo : primero).focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
});
