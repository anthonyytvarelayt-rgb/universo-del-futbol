// Motor de partidos (alpha) — Universo del Fútbol
// Simula partidos por jugadas clave a partir del nivel (1-1000) de cada jugador.
(function (root) {
  'use strict';

  // Generador aleatorio con semilla, para poder repetir una partida.
  function rng(seed) {
    let a = seed >>> 0;
    const r = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    // Estado interno: rng(r.estado()) sigue exactamente donde lo dejó (para las fotos de la partida).
    r.estado = () => a;
    return r;
  }

  // Parámetros calibrados contra la Liga española 1958-59.
  const P = {
    ocasiones: 8.6,       // jugadas peligrosas por equipo y partido, antes de ajustar por fuerza
    ventajaLocal: 0.7,     // más ocasiones y puntería en casa
    escala: 380,           // cuánto pesa la diferencia de nivel (puntos de nivel por unidad logística)
    pTiroBase: 0.40,       // de cada jugada peligrosa, cuántas acaban en tiro a puerta
    pGolBase: 0.26,        // de cada tiro a puerta, cuántos son gol
    pAsistencia: 0.72,     // goles con asistencia
    pIntentoRegate: 0.5,   // jugadas en las que alguien encara a un rival
    extraRegate: 0.3,      // cuánto sube el tiro a puerta tras un regate exitoso
    pasesPartido: 600,     // pases intentados entre los dos equipos (aprox. para la época)
    balonParado: 2.4,      // córners y faltas peligrosas por equipo: no dependen tanto del nivel
    pGolParado: 0.12,
    pPenalti: 0.11,        // penaltis a favor por equipo y partido
    pGolPenalti: 0.74,
    pRoja: 0.0022,         // expulsiones por jugador y partido (raras en los 50)
    pLesion: 0.012,        // lesiones por jugador y partido
    unoMenos: 75,          // nivel que pierde un equipo por cada jugador de menos
    ruidoDia: 55,          // forma del día del equipo
    pesoMoral: 30,         // rachas: cuánto pesa el ánimo del equipo
    pesoFatiga: 200,       // nivel que se pierde con el depósito vacío
    pesoAtributo: 3,       // puntos de nivel que vale cada punto de atributo de más o de menos en su jugada
    expNivel: 2.0          // cuánto acaparan las jugadas los mejores del equipo
  };


  // Escala acordada con Anthony (1-1000) frente a la escala interna del motor. Arriba crece más deprisa:
  // cuanto más alto el nivel, más pesa cada punto. Misma tabla que motor/escala.py.
  const TABLA_ESCALA = [[1, 100], [100, 250], [230, 434], [380, 575], [450, 664], [520, 758], [580, 824], [630, 871], [690, 920], [760, 970], [850, 1040], [950, 1100], [1000, 1130]];
  function interpola(x, pares) {
    if (x <= pares[0][0]) return pares[0][1];
    for (let i = 1; i < pares.length; i++) if (x <= pares[i][0]) { const [a, fa] = pares[i - 1], [b, fb] = pares[i]; return fa + (fb - fa) * (x - a) / (b - a); }
    const [a, fa] = pares[pares.length - 2], [b, fb] = pares[pares.length - 1]; return fb + (fb - fa) * (x - b) / (b - a);
  }
  const escala = {
    interno: (n) => Math.round(interpola(n, TABLA_ESCALA)),
    mostrar: (i) => Math.max(1, Math.min(1000, Math.round(interpola(i, TABLA_ESCALA.map(([a, b]) => [b, a]))))),
    categoria: (n) => n >= 850 ? 'Mejor de la historia' : n >= 770 ? 'Leyenda' : n >= 700 ? 'Crack generacional' : n >= 640 ? 'Formidable histórico' : n >= 580 ? 'Crack' : n >= 500 ? 'Jugadorazo' : n >= 340 ? 'Titular de primera' : n >= 230 ? 'Segunda' : n >= 100 ? 'Categorías bajas' : 'Amateur'
  };

  // La época cambia el juego: más goles en los 30, menos con el catenaccio y el fútbol táctico, algo más hoy.
  // 1958 = 1 (ahí está calibrado). Igual con la ventaja de jugar en casa, que se ha ido reduciendo.
  // Ajustado con partidas largas (2026-11-11): la Liga daba 2,2-2,4 goles por partido en 1972-1990 y 2,5 después; lo real es 2,4-2,5 y 2,6-2,8.
  const GOLES_EPOCA = [[1930, 1.2], [1950, 1.08], [1958, 1], [1965, 0.92], [1975, 0.89], [1990, 0.86], [2000, 0.89], [2015, 0.94], [2026, 0.94]];
  const CASA_EPOCA = [[1930, 1.1], [1958, 1], [1980, 0.85], [2000, 0.72], [2020, 0.6], [2026, 0.65]];
  const golesEpoca = (anio) => interpola(anio || 1958, GOLES_EPOCA);
  const casaEpoca = (anio) => interpola(anio || 1958, CASA_EPOCA);
  const sig = (x) => 1 / (1 + Math.exp(-x));
  const media = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
  const normal = (r) => r() + r() + r() - 1.5;

  // Rol dentro de la posición: un extremo no juega como un delantero centro.
  // Si el dato no trae rol, se deduce: delantero que marca poco por partido = extremo.
  function rol(j) {
    if (j.rol) return j.rol;
    if (j.pos === 'DEL') return (j.pj >= 8 && j.g / j.pj < 0.3) ? 'EXT' : 'DC';
    return j.pos;
  }
  const pesoRol = (tabla) => (j) => tabla[rol(j)] || 0;
  const PESO_TIRO = pesoRol({ DC: 1.0, EXT: 0.55, MED: 0.45, DEF: 0.08, POR: 0 });
  // Quién remata: lo que marca su puesto, o más si sus goles reales dicen que marca como un delantero centro.
  const sube = (j) => j.gol && Math.min(1, j.gol) > PESO_TIRO(j);
  const TIRO = (j) => (sube(j) ? Math.min(1, j.gol) : PESO_TIRO(j));
  const FIN = (j) => (sube(j) ? Math.max(0.75, Math.min(1.6, Math.sqrt(j.gol))) : j.fin || 1);
  const PESO_PASE = pesoRol({ DC: 0.5, EXT: 0.9, MED: 1.0, DEF: 0.25, POR: 0.02 });
  const PESO_REGATE = pesoRol({ EXT: 1.0, DC: 0.45, MED: 0.4, DEF: 0.08, POR: 0 });
  const PESO_CORTE = pesoRol({ DEF: 1.0, MED: 0.55, DC: 0.1, EXT: 0.1, POR: 0 });
  const PESO_CABEZA = pesoRol({ DC: 1.0, DEF: 0.55, MED: 0.35, EXT: 0.3, POR: 0 });
  const PESO_BOTA = pesoRol({ EXT: 1.0, MED: 0.9, DC: 0.3, DEF: 0.2, POR: 0 });
  // ---- Los diez atributos (1-100): la FORMA del nivel ----
  // El nivel dice lo bueno que es; los atributos dicen en qué. Cada uno decide una jugada del partido y nada cuenta dos veces:
  // lo que un jugador tiene de más en una cosa lo tiene de menos en otra (la suma, con los pesos de su puesto, da cero).
  // La definición sale de sus goles reales (FIN) y la portería es el nivel del portero: esas dos solo se enseñan.
  const ATRIBUTOS = ['def', 'des', 'pas', 'vis', 'reg', 'vel', 'fis', 'dfs', 'aer', 'por'];
  const NOMBRE_ATRIBUTO = { def: 'Definición', des: 'Desmarque', pas: 'Pase', vis: 'Visión', reg: 'Regate', vel: 'Velocidad', fis: 'Físico', dfs: 'Defensa', aer: 'Juego aéreo', por: 'Portería' };
  // Lo normal de cada puesto, en puntos alrededor de su base.
  const FORMA = {
    DC: { def: 10, des: 9, pas: -6, vis: -6, reg: 0, vel: 2, fis: 3, dfs: -30, aer: 6, por: -70 },
    EXT: { def: -1, des: 3, pas: 3, vis: 2, reg: 10, vel: 10, fis: -6, dfs: -26, aer: -10, por: -70 },
    MED: { def: -9, des: -5, pas: 9, vis: 8, reg: 1, vel: -2, fis: 2, dfs: 0, aer: -5, por: -70 },
    DEF: { def: -26, des: -20, pas: -4, vis: -8, reg: -12, vel: 0, fis: 7, dfs: 11, aer: 7, por: -70 },
    POR: { def: -60, des: -55, pas: -18, vis: -12, reg: -40, vel: -15, fis: 2, dfs: -30, aer: 6, por: 10 }
  };
  // Qué pesa en cada puesto: con estos pesos se pone a cero la suma de lo que le sobra y le falta.
  const PESO_FORMA = {
    DC: { des: 0.35, reg: 0.1, vel: 0.15, fis: 0.1, aer: 0.15, pas: 0.1, vis: 0.05 },
    EXT: { reg: 0.3, vel: 0.2, pas: 0.15, vis: 0.15, des: 0.2 },
    MED: { pas: 0.3, vis: 0.25, dfs: 0.2, des: 0.1, reg: 0.1, fis: 0.05 },
    DEF: { dfs: 0.5, fis: 0.1, aer: 0.15, vel: 0.1, pas: 0.15 }
  };
  const DEL_JUEGO = ['des', 'pas', 'vis', 'reg', 'vel', 'fis', 'dfs', 'aer'];
  const baseAtributo = (niv) => 30 + escala.mostrar(niv) * 0.054;
  const azar = (txt) => { let h = 2166136261; for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
  const tope = (x, a, b) => Math.max(a, Math.min(b, x));
  const cacheForma = new WeakMap();
  // Lo que se aparta cada jugador de lo normal de su puesto, en su mejor momento.
  function formaDe(j) {
    const ro = rol(j);
    let c = cacheForma.get(j);
    if (c && c.ro === ro) return c.d;
    const d = {}, mano = typeof ATRIBUTOS_A_MANO !== 'undefined' && ATRIBUTOS_A_MANO[j.n];
    if (mano) {
      // Figura con atributos puestos a mano: cuenta la forma (en qué destaca), no si los números vienen altos o bajos.
      const b = baseAtributo(j.tec || j.niv);
      ATRIBUTOS.forEach((x, i) => { d[x] = mano[i] - (b + FORMA[ro][x]); });
      d.def = tope(d.def, -25, 25); d.por = ro === 'POR' ? tope(d.por, -8, 8) : 0;
    } else {
      // Los demás: una forma propia y fija (dos del mismo nivel no son iguales), inclinada por sus goles reales.
      ATRIBUTOS.forEach((x) => { d[x] = (azar(j.n + x) + azar(x + j.n) - 1) * 10; });
      const gp = j.gol != null ? j.gol * 0.45 : null;
      if (gp != null && ro === 'MED') { const t = tope((gp - 0.15) / 0.2, -0.6, 1); d.des += 9 * t; d.dfs -= 10 * t; d.vis += 2 * t; }
      if (gp != null && ro === 'DEF') d.aer += 6 * tope((gp - 0.04) / 0.08, -0.5, 1.5);
      if (gp != null && ro === 'EXT') d.des += 6 * tope((gp - 0.2) / 0.2, -1, 1);
      d.def = d.def * 0.4 + (FIN(j) - 1) * 45;
      d.por = ro === 'POR' ? d.por * 0.3 : 0;
    }
    const W = PESO_FORMA[ro];
    if (W) { let m = 0; for (const x in W) m += W[x] * d[x]; DEL_JUEGO.forEach((x) => { d[x] = tope(d[x] - m, -30, 30); }); }
    else DEL_JUEGO.forEach((x) => { d[x] = tope(d[x], -12, 12); });
    cacheForma.set(j, { ro, d });
    return d;
  }
  // Con los años se pierde velocidad y regate y se gana pase y visión; de joven, al revés.
  function formaHoy(j, anio) {
    const d = formaDe(j), nac = parseInt(String(j.nac || '').slice(0, 4), 10);
    const e = nac && anio ? anio - nac : 27;
    if (e > 22 && e <= 30) return d;
    const v = Object.assign({}, d);
    if (e > 30) { const k = Math.min(8, e - 30); v.vel -= 1.2 * k; v.reg -= 0.4 * k; v.vis += 0.8 * k; v.pas += 0.5 * k; v.des += 0.3 * k; }
    else { const k = Math.min(5, 23 - e); v.vel += 0.8 * k; v.reg += 0.4 * k; v.vis -= 0.8 * k; v.pas -= 0.4 * k; }
    return v;
  }
  // Los diez números que se enseñan en la ficha, con el nivel que tiene ese año.
  function atributos(j, anio) {
    const ro = rol(j), d = formaHoy(j, anio), b = baseAtributo(j.niv), r = {};
    ATRIBUTOS.forEach((x) => { r[x] = Math.round(tope(b + FORMA[ro][x] + d[x], 1, 99)); });
    return r;
  }

  const PASES_ROL = { POR: 0.45, DEF: 1.0, MED: 1.5, EXT: 0.8, DC: 0.65 };
  const ACIERTO_ROL = { POR: 0.58, DEF: 0.72, MED: 0.73, EXT: 0.65, DC: 0.62 };
  const VOLUMEN = {
    DC: { g: 0.021, a: 0.016, r: 0.001, c: 0, z: 0 },
    EXT: { g: 0.022, a: 0.018, r: 0.002, c: 0, z: 0 },
    MED: { g: 0.03, a: 0.02, r: 0.003, c: 0.003, z: 0, p: 0.0002 },
    DEF: { g: 0.04, a: 0.02, r: 0.002, c: 0.008, z: 0.03 },
    POR: { g: 0, a: 0, r: 0, c: 0, z: 0.04 }
  };

  // El juego de pase crece con los años: más pases por partido y más precisos (1958 ≈ 600 entre los dos; hoy ≈ 800 en esta escala).
  const pasesEpoca = (anio) => P.pasesPartido * (1 + Math.max(0, Math.min(67, (anio || 1958) - 1958)) * 0.0045);
  const aciertoEpoca = (anio) => Math.max(0, Math.min(67, (anio || 1958) - 1958)) * 0.0013;

  // Estilos de juego: cada uno cambia el equilibrio entre atacar y defender.
  const ESTILOS = {
    ofensivo: { at: 25, cr: 20, de: -20, ocas: 1.08, tiro: 1, pos: 0.1 },
    equilibrado: { at: 0, cr: 0, de: 0, ocas: 1, tiro: 1, pos: 0 },
    defensivo: { at: -20, cr: -15, de: 30, ocas: 0.88, tiro: 1, pos: -0.15 },
    contragolpe: { at: 10, cr: -25, de: 20, ocas: 0.85, tiro: 1.12, pos: -0.35 }
  };
  const NOMBRE_ESTILO = { ofensivo: 'Ofensivo', equilibrado: 'Equilibrado', defensivo: 'Defensivo', contragolpe: 'Al contragolpe' };

  // Estilo base del club: si el dato no lo trae, sale de dónde tiene la calidad su plantilla.
  // Se compara con el resto de la competición: ofensivo es quien tiene la delantera más fuerte que su defensa, más que los demás.
  function estiloBase(equipo) {
    return equipo.estilo || equipo.estiloEntrenador || equipo.estiloCalc || 'equilibrado';
  }
  function asignarEstilos(equipos) {
    const mejor = (e, pos, k) => media(e.jugadores.filter((j) => j.pos === pos).map((j) => j.niv).sort((a, b) => b - a).slice(0, k));
    const d = equipos.map((e) => mejor(e, 'DEL', 3) - mejor(e, 'DEF', 4));
    const m = media(d);
    equipos.forEach((e, i) => { if (!e.estiloCalc) e.estiloCalc = d[i] - m > 30 ? 'ofensivo' : d[i] - m < -30 ? 'defensivo' : 'equilibrado'; });
  }
  function fuerzaBruta(equipo) {
    return media(equipo.jugadores.map((j) => j.niv).sort((a, b) => b - a).slice(0, 11));
  }
  // Estilo del día: un equipo claramente inferior fuera de casa se cierra y sale a la contra.
  function estiloPartido(equipo, rival, casa) {
    const base = estiloBase(equipo);
    if (!casa && fuerzaBruta(rival) - fuerzaBruta(equipo) > 70) return 'contragolpe';
    return base;
  }

  // Alineación sencilla tipo WM: 1 portero, 4 defensas, 3 medios, 3 delanteros.
  function alineacion(equipo, fuera, nv) {
    const libres = equipo.jugadores.filter((j) => !fuera.has(j.n));
    const orden = (a, b) => nv(b) - nv(a);
    const por = libres.filter((j) => j.pos === 'POR').sort(orden);
    let resto = libres.filter((j) => j.pos !== 'POR');
    // Sin porteros disponibles se pone bajo palos un jugador de campo, que ya no puede ocupar otro puesto.
    const meta = por[0] || [...resto].sort(orden).reverse()[0];
    resto = resto.filter((j) => j !== meta);
    const toma = (pos, k) => resto.filter((j) => j.pos === pos).sort(orden).slice(0, k);
    let xi = [meta].concat(toma('DEF', 4), toma('MED', 3), toma('DEL', 3));
    xi = xi.filter(Boolean);
    const usados = new Set(xi.map((j) => j.n));
    const sobrantes = resto.filter((j) => !usados.has(j.n)).sort(orden);
    while (xi.length < 11 && sobrantes.length) xi.push(sobrantes.shift());
    // Si con las bajas no salen ni siete, se tira de los tocados antes que no presentarse.
    if (xi.length < 7) equipo.jugadores.filter((j) => !xi.includes(j)).sort(orden).slice(0, 7 - xi.length).forEach((j) => xi.push(j));
    return xi;
  }

  function fuerzas(xi, nv, D) {
    const g = P.pesoAtributo * 0.6, d = D || (() => 0);
    const m = (pos, f) => media(xi.filter((j) => j.pos === pos).map(f)) || 600;
    const p = xi.find((j) => j.pos === 'POR');
    const por = p ? nv(p) : 600;
    const crea = (j) => nv(j) + g * (d(j, 'pas') + d(j, 'vis')) / 2, quita = (j) => nv(j) + g * d(j, 'dfs');
    return {
      ataque: 0.5 * m('DEL', (j) => nv(j) + g * (d(j, 'des') + d(j, 'reg') + d(j, 'vel')) / 3) + 0.35 * m('MED', (j) => nv(j) + g * d(j, 'des')) + 0.15 * m('DEF', nv),
      defensa: 0.45 * m('DEF', quita) + 0.3 * m('MED', quita) + 0.25 * por,
      creacion: 0.55 * m('MED', crea) + 0.3 * m('DEL', crea) + 0.15 * m('DEF', (j) => nv(j) + g * d(j, 'pas'))
    };
  }

  // Lanzadores de penaltis, del mejor al peor: nivel, puesto y definición.
  const lanzadores = (xi, nv) => xi.filter((j) => j.pos !== 'POR').sort((a, b) => nv(b) * (TIRO(b) + 0.3) * Math.sqrt(FIN(b)) - nv(a) * (TIRO(a) + 0.3) * Math.sqrt(FIN(a)));
  // Tanda de penaltis (desde 1970): cinco cada uno y después muerte súbita.
  function tanda(r, xiA, xiB, nv) {
    const tA = lanzadores(xiA, nv), tB = lanzadores(xiB, nv);
    const pA = xiA.find((j) => j.pos === 'POR'), pB = xiB.find((j) => j.pos === 'POR');
    const marca = (l, por) => r() < 0.76 + ((nv(l) || 500) - (por ? nv(por) : 500)) / 2500;
    let a = 0, b = 0;
    for (let i = 0; i < 5; i++) {
      if (marca(tA[i % tA.length], pB)) a++;
      if (a > b + (5 - i)) break;
      if (marca(tB[i % tB.length], pA)) b++;
      if (b > a + (4 - i) || a > b + (4 - i)) break;
    }
    for (let i = 5; a === b && i < 40; i++) { if (marca(tA[i % tA.length], pB)) a++; if (marca(tB[i % tB.length], pA)) b++; }
    if (a === b) { if (r() < 0.5) a++; else b++; }
    return [a, b];
  }

  // Elige un jugador con peso según rol y nivel.
  function elige(r, xi, pesos, nv, excluir) {
    const cand = xi.filter((j) => j !== excluir);
    if (!cand.length) return xi[0];
    const pw = nv.pw || ((j) => Math.pow(Math.max(100, nv(j)) / 700, P.expNivel));
    const w = cand.map((j) => pesos(j) * pw(j));
    const tot = w.reduce((s, x) => s + x, 0);
    let x = r() * tot;
    for (let i = 0; i < cand.length; i++) { x -= w[i]; if (x <= 0) return cand[i]; }
    return cand[cand.length - 1];
  }

  // Un partido. Opciones: fuera (jugadores no disponibles por lado), nv (nivel efectivo del día),
  // moral por lado, neutral, duracion (1 = 90 minutos; 1/3 = prórroga), cambios permitidos.
  function partido(r, local, visita, opciones) {
    const o = Object.assign({ fueraL: new Set(), fueraV: new Set(), nv: (j) => j.niv, moral: [0, 0], neutral: false, duracion: 1, cambios: 0, xiL: null, xiV: null, anio: 1958, derbi: null, factorGoles: 1, riesgo: null, marcador: null }, opciones);
    // En campo neutral (finales, Mundial) el jugador frío rinde más: no le pesa el partido grande.
    if (o.neutral) { const base = o.nv; o.nv = (j) => base(j) + (j.car === 'frio' ? 12 : 0); }
    // Goles de la época y del carácter de la liga (catenaccio, fútbol inglés…), y ventaja de campo de la época.
    const fGoles = golesEpoca(o.anio) * (o.factorGoles || 1), vCasa = P.ventajaLocal * casaEpoca(o.anio);
    // Amarillas desde el Mundial de 1970.
    const hayAmarillas = o.anio >= 1970;
    // Derbi: más tensión, más expulsiones, más sorpresas y menos ventaja de jugar en casa.
    const tension = o.derbi ? { roja: 2.5, ruido: 1.4, casa: 0.7 } : { roja: 1, ruido: 1, casa: 1 };
    // El nivel del día no cambia durante el partido: se calcula una vez por jugador.
    const nvDia = new Map(), pot = new Map();
    const nv = (j) => { let v = nvDia.get(j); if (v === undefined) { v = o.nv(j); nvDia.set(j, v); } return v; };
    nv.pw = (j) => { let v = pot.get(j); if (v === undefined) { v = Math.pow(Math.max(100, nv(j)) / 700, P.expNivel); pot.set(j, v); } return v; };
    const formas = new Map();
    const D = (j, x) => { let v = formas.get(j); if (v === undefined) { v = formaHoy(j, o.anio); formas.set(j, v); } return v[x] || 0; };
    const GA = P.pesoAtributo;
    // Insignias ganadas en la partida (ver mundo.js): grado 1 a 4, o 0 si no la tiene.
    const gr = (j, id) => (j.ins && j.ins[id] != null ? j.ins[id] + 1 : 0);
    const minutos = 90 * o.duracion;
    const xiL = o.xiL || alineacion(local, o.fueraL, o.selL || nv), xiV = o.xiV || alineacion(visita, o.fueraV, o.selV || nv);
    // Rivales declarados (ver mundo.js): cuando se ven las caras, los dos se crecen.
    [[xiL, xiV], [xiV, xiL]].forEach(([mios, suyos]) => mios.forEach((j) => { if (j.rival && suyos.some((x) => x.n === j.rival)) { nvDia.set(j, nv(j) + 15); pot.delete(j); } }));
    const estilos = [estiloPartido(local, visita, true), estiloPartido(visita, local, o.neutral)];
    const st = new Map();
    const s = (j) => { if (!st.has(j)) st.set(j, { g: 0, a: 0, tiros: 0, ocas: 0, cortes: 0, paradas: 0, enc: 0, regates: 0, pases: 0, pasesOk: 0, pen: 0, penFallado: 0, roja: 0, amarilla: 0, lesion: 0, salida: minutos }); return st.get(j); };
    xiL.concat(xiV).forEach(s);
    const eventos = [];

    // Incidencias: lesiones y expulsiones. Sin cambios (hasta mediados de los 60) el equipo se queda con diez.
    // Quien empieza con menos de once (expulsados antes de una prórroga) lo nota desde el principio.
    const menos = [Math.max(0, 11 - xiL.length), Math.max(0, 11 - xiV.length)];
    // Cambios: por el lesionado entra un suplente de verdad (el mejor del banquillo, de su puesto si lo hay).
    const entran = [[], []];
    const suplente = (k, j) => {
      const eq = k ? visita : local, xi = k ? xiV : xiL, fuera = k ? o.fueraV : o.fueraL;
      if (entran[k].length >= o.cambios) return null;
      const cand = (eq.jugadores || []).filter((x) => !fuera.has(x.n) && !xi.includes(x) && !entran[k].includes(x));
      return cand.sort((a, b) => (b.pos === j.pos) - (a.pos === j.pos) || nv(b) - nv(a))[0] || null;
    };
    [xiL, xiV].forEach((xi, k) => xi.forEach((j) => {
      const e = s(j);
      // El jugador conflictivo ve más tarjetas.
      const duro = (rol(j) === 'DEF' ? 1.6 : rol(j) === 'POR' ? 0.3 : 1) * (j.car === 'conflictivo' ? 1.7 : 1);
      // Amarilla (desde 1970): unas tres por partido; la segunda amarilla es roja.
      if (hayAmarillas && r() < 0.13 * tension.roja * o.duracion * duro) {
        e.amarilla = 1; const min = Math.floor(r() * minutos) + 1; eventos.push({ min, tipo: 'amarilla', quien: j.n, lado: k });
        if (r() < 0.06) { e.roja = 1; e.salida = Math.min(minutos, min + 1 + Math.floor(r() * (minutos - min))); eventos.push({ min: e.salida, tipo: 'roja', quien: j.n, lado: k, segunda: true }); menos[k] += (minutos - e.salida) / minutos; return; }
      }
      const pR = P.pRoja * tension.roja * o.duracion * duro;
      // Lesiones: más con la edad y con el depósito vacío.
      if (r() < pR) { e.roja = 1; e.salida = Math.floor(r() * minutos) + 1; eventos.push({ min: e.salida, tipo: 'roja', quien: j.n, lado: k }); }
      else if (r() < P.pLesion * o.duracion * (o.riesgo ? o.riesgo(j) : 1) * Math.exp(-D(j, 'fis') / 50) * (1 - 0.12 * gr(j, 'hierro'))) {
        e.lesion = 1; e.salida = Math.floor(r() * minutos) + 1;
        const ev = { min: e.salida, tipo: 'lesion', quien: j.n, lado: k }; eventos.push(ev);
        const sup = suplente(k, j);
        if (sup) { e.sustituido = true; e.sup = sup; entran[k].push(sup); s(sup).entrada = e.salida; ev.entra = sup.n; return; }
      } else return;
      menos[k] += (minutos - e.salida) / minutos;
    }));

    const fL = fuerzas(xiL, nv, D), fV = fuerzas(xiV, nv, D);
    [fL, fV].forEach((f, k) => {
      const E = ESTILOS[estilos[k]];
      const d = normal(r) * P.ruidoDia * tension.ruido + o.moral[k] * P.pesoMoral - menos[k] * P.unoMenos;
      f.ataque += d + E.at; f.creacion += d + E.cr; f.defensa += d * 0.8 + E.de;
      f.E = E;
    });
    const goles = [0, 0];
    const casaL = o.neutral ? 0 : 1;
    const lados = [
      { xi: xiL, f: fL, rival: xiV, fr: fV, casa: casaL },
      { xi: xiV, f: fV, rival: xiL, fr: fL, casa: 0 }
    ];
    // En el campo en el minuto t: quien no se fue, y el suplente en el sitio del lesionado.
    // Si nadie de un equipo se fue antes del final, están todos todo el partido.
    const completo = new Map([xiL, xiV].map((xi) => [xi, xi.every((j) => st.get(j).salida >= minutos)]));
    const enCampo = (xi, t) => completo.get(xi) ? xi : xi.map((j) => { const e = st.get(j); return e.sustituido && e.salida <= t ? e.sup : j; }).filter((j) => st.get(j).salida > t);
    const portero = (xi, t) => enCampo(xi, t).find((j) => j.pos === 'POR') || enCampo(xi, t).find((j) => rol(j) === 'DEF') || xi[0];
    const gol = (k, t, autor, asist, tipo) => {
      goles[k]++; s(autor).g++;
      if (asist) s(asist).a++;
      eventos.push({ min: Math.max(1, Math.round(t)), tipo, quien: autor.n, asist: asist ? asist.n : null, lado: k });
    };

    // Se preparan las jugadas de los dos equipos y se juegan en orden de minuto: así el marcador del momento cuenta.
    // Quien gana de tres se relaja y quien pierde aprieta (menos goleadas absurdas, alguna remontada más).
    const plan = [];
    lados.forEach((lado, k) => {
      const dif = (lado.f.creacion - lado.fr.defensa) / P.escala + (lado.casa ? vCasa * tension.casa : -vCasa * tension.casa / 2);
      lado.dif = dif;
      const n = Math.max(1, Math.round((P.ocasiones * fGoles * Math.exp(0.35 * dif) * lado.f.E.ocas + (r() - 0.5) * 4) * o.duracion));
      for (let i = 0; i < n; i++) plan.push({ k, t: (i + r()) / n * minutos, tipo: 'abierta' });
      const np = Math.max(0, Math.round((P.balonParado * Math.sqrt(fGoles) + (r() - 0.5) * 1.6) * o.duracion));
      for (let i = 0; i < np; i++) plan.push({ k, t: r() * minutos, tipo: 'parado' });
      if (r() < P.pPenalti * o.duracion * Math.exp(0.3 * dif)) plan.push({ k, t: r() * minutos, tipo: 'pen' });
    });
    plan.sort((x, y) => x.t - y.t);
    const animo = (k) => { const v = goles[k] - goles[1 - k] + (o.marcador ? o.marcador[k] - o.marcador[1 - k] : 0); return v >= 3 ? 0.72 : v === 2 ? 0.88 : v <= -2 ? 1.08 : v === -1 ? 1.04 : 1; };
    const corta = (j) => PESO_CORTE(j) * Math.exp(D(j, 'dfs') / 40);
    plan.forEach(({ k, t, tipo }) => {
      const lado = lados[k];
      const mios = enCampo(lado.xi, t), suyos = enCampo(lado.rival, t), porRival = portero(lado.rival, t);
      if (!mios.length || !suyos.length) return;
      if (tipo === 'abierta') {
        // La definición sale de sus goles reales, que ya llevan dentro lo bueno que era su equipo y lo floja que era su liga;
        // aquí pesa a medias para no contarlo dos veces (el motor ya pone el equipo y los rivales).
        const tirador = elige(r, mios, (j) => TIRO(j) * Math.sqrt(FIN(j)) * Math.exp(D(j, 'des') / 40), nv);
        let creador = elige(r, mios, (j) => PESO_PASE(j) * Math.exp(D(j, 'vis') / 40), nv, tirador);
        let pTiro = P.pTiroBase * 2 * lado.f.E.tiro * sig((lado.f.ataque - lado.fr.defensa) / P.escala + (lado.casa ? vCasa : 0)) * animo(k);
        // Regate: alguien encara a un defensor. Si sale bien, la jugada mejora; si no, se pierde.
        if (r() < P.pIntentoRegate) {
          const reg = elige(r, mios, (j) => PESO_REGATE(j) * Math.exp(D(j, 'reg') / 40), nv), marca = elige(r, suyos, corta, nv);
          if (r() < sig((nv(reg) + GA * (0.65 * D(reg, 'reg') + 0.35 * D(reg, 'vel')) - nv(marca) - GA * (0.7 * D(marca, 'dfs') + 0.3 * D(marca, 'vel')) - 10 * gr(marca, 'muro')) / P.escala + 0.2)) {
            s(reg).regates++; pTiro = Math.min(0.95, pTiro * (1 + P.extraRegate));
            if (reg !== tirador && r() < 0.6) creador = reg;
          } else { s(marca).cortes++; return; }
        }
        s(creador).ocas++;
        // Un buen pase deja mejor el remate.
        pTiro = Math.min(0.95, pTiro * (1 + D(creador, 'pas') / 150 + 0.03 * gr(creador, 'mago')));
        if (r() > pTiro) { s(elige(r, suyos, corta, nv)).cortes++; return; }
        s(tirador).tiros++;
        if (r() < P.pGolBase * 2 * sig((nv(tirador) + 3 * gr(tirador, 'gol') - nv(porRival) - 10 * gr(porRival, 'muro')) / P.escala + 0.2 * Math.log(FIN(tirador)))) {
          s(porRival).enc++;
          gol(k, t, tirador, r() < P.pAsistencia ? creador : null, 'gol');
        } else s(porRival).paradas++;
      } else if (tipo === 'parado') {
        // Balón parado: córners y faltas. Pesa menos la diferencia de nivel, por eso hasta el colista marca.
        const remata = elige(r, mios, (j) => PESO_CABEZA(j) * Math.exp(D(j, 'aer') / 30), nv), saca = elige(r, mios, (j) => PESO_BOTA(j) * Math.exp(D(j, 'pas') / 40), nv, remata);
        s(saca).ocas++; s(remata).tiros++;
        if (r() < P.pGolParado * 2 * sig((nv(remata) + GA * (0.7 * D(remata, 'aer') + 0.3 * D(remata, 'fis')) - nv(porRival)) / (P.escala * 1.5))) { s(porRival).enc++; gol(k, t, remata, saca, 'gol'); }
        else s(porRival).paradas++;
      } else {
        // Penalti: lo tira el mejor lanzador en el campo (nivel, puesto y definición).
        const lanza = lanzadores(mios, nv)[0] || mios[0];
        const comete = elige(r, suyos, corta, nv);
        if (comete) s(comete).penCometido = 1;
        s(lanza).tiros++;
        if (r() < P.pGolPenalti + (nv(lanza) - nv(porRival)) / 2000) {
          s(porRival).enc++; s(lanza).pen++; gol(k, t, lanza, null, 'pen');
        } else { s(porRival).paradas++; s(porRival).penParado = 1; s(lanza).penFallado++; eventos.push({ min: Math.max(1, Math.round(t)), tipo: 'penFallado', quien: lanza.n, lado: k }); }
      }
    });

    // Pases: el equipo que crea mejor tiene más el balón; cada uno acierta según su nivel y la presión rival.
    const posL = sig((fL.creacion - fV.creacion) / P.escala + 0.1 + fL.E.pos - fV.E.pos);
    lados.forEach((lado, k) => {
      const total = pasesEpoca(o.anio) * o.duracion * (k === 0 ? posL : 1 - posL) * (0.9 + r() * 0.2);
      const w = lado.xi.map((j) => (PASES_ROL[rol(j)] || 0.8) * (nv(j) / 700) * (st.get(j).salida / minutos));
      const sw = w.reduce((a, b) => a + b, 0);
      lado.xi.forEach((j, i) => {
        const e = s(j), intentos = Math.round(total * w[i] / sw * (0.8 + r() * 0.4));
        const pOk = Math.max(0.4, Math.min(0.95, (ACIERTO_ROL[rol(j)] || 0.7) + aciertoEpoca(o.anio) + (nv(j) - lado.fr.defensa) / 3500 + D(j, 'pas') / 400));
        e.pases = intentos;
        e.pasesOk = Math.max(0, Math.min(intentos, Math.round(intentos * pOk + normal(r) * Math.sqrt(intentos * pOk * (1 - pOk)) * 2)));
      });
    });

    // Notas del partido (0 a 10, base 6).
    const notas = new Map();
    lados.forEach((lado, k) => {
      const gf = goles[k], gc = goles[1 - k];
      const res = gf > gc ? 0.35 : gf < gc ? -0.35 : 0;
      lado.xi.concat(entran[k]).forEach((j) => {
        const e = st.get(j);
        const ro = rol(j);
        let n = 6 + res + (r() - 0.5) * 0.6;
        n += (e.g - e.pen) * (ro === 'DC' || ro === 'EXT' ? 1.4 : 1.5) + e.pen * 0.8 + e.a * (ro === 'DC' ? 0.8 : 0.9) + e.tiros * 0.08;
        n += (e.pasesOk - e.pases * ((ACIERTO_ROL[ro] || 0.7) + aciertoEpoca(o.anio))) * 0.02 * 600 / pasesEpoca(o.anio);
        n += e.ocas * (ro === 'DC' ? 0.06 : ro === 'EXT' ? 0.08 : 0.1) + e.regates * (ro === 'EXT' ? 0.11 : 0.14);
        if (ro === 'POR') n += e.paradas * 0.22 - e.enc * 0.35 + (gc === 0 ? 0.7 : 0) + (e.penParado ? 0.8 : 0);
        if (ro === 'DEF') n += e.cortes * 0.24 + (gc === 0 ? 0.5 : 0) - gc * 0.15;
        if (ro === 'MED') n += e.cortes * 0.12;
        n -= e.penFallado * 0.6 + (e.penCometido ? 0.5 : 0) + e.roja * 2 + e.amarilla * 0.15;
        if (e.lesion) n = 6 + (n - 6) * (e.salida / minutos);
        notas.set(j, Math.max(2, Math.min(10, n)));
      });
    });
    eventos.sort((a, b) => a.min - b.min);
    // Quienes acaban el partido en el campo: son los que juegan la prórroga y tiran los penaltis.
    const acaban = (xi) => xi.map((j) => { const e = st.get(j); return e.sustituido ? e.sup : j; }).filter((j) => { const e = st.get(j); return !e.roja && !e.lesion; });
    return { goles, st, notas, xiL, xiV, supL: entran[0], supV: entran[1], finL: acaban(xiL), finV: acaban(xiV), eventos, estilos, derbi: o.derbi };
  }

  // Estado que dura toda la temporada: forma de cada jugador, cansancio, ánimo de cada equipo, bajas.
  function nuevoEstado(anio, derbis) {
    const mapa = new Map();
    (derbis || []).forEach((d) => { mapa.set(d.a + '|' + d.b, d.nombre); mapa.set(d.b + '|' + d.a, d.nombre); });
    return { derbis: mapa, banquillo: new Map(), anio: anio || 1958, forma: new Map(), energia: new Map(), moral: new Map(), bajas: new Map(), habitual: new Map(), amarillas: new Map() };
  }
  function edad(j, anio) {
    const y = parseInt(String(j.nac || '').slice(0, 4), 10);
    return y ? anio - y : 26;
  }
  function nivelDia(est) {
    return (j) => j.niv + (j.temp || 0) + (est.forma.get(j) || 0) - (1 - (est.energia.has(j) ? est.energia.get(j) : 1)) * P.pesoFatiga;
  }
  const fueraDe = (est, equipo) => new Set(equipo.jugadores.filter((j) => est.bajas.has(j)).map((j) => j.n));

  // Juega un partido con el estado de temporada y guarda todo en las estadísticas del registro.
  function jugarConEstado(r, est, local, visita, o, registro) {
    const nv = nivelDia(est);
    // Un entrenador que premia el rendimiento sienta a quien no está en forma, aunque sea una figura.
    const sel = (eq) => { const t = est.banquillo.get(eq); return t && t.actual.merito ? (j) => nv(j) + (est.forma.get(j) || 0) * 0.8 : nv; };
    // Riesgo de lesión: sube con la edad (desde los 30) y con el cansancio.
    const riesgo = (j) => (1 + Math.max(0, edad(j, est.anio) - 29) * 0.07) * (1 + (1 - (est.energia.has(j) ? est.energia.get(j) : 1)) * 2);
    const m = partido(r, local, visita, Object.assign({
      fueraL: fueraDe(est, local), fueraV: fueraDe(est, visita), nv, selL: sel(local), selV: sel(visita), anio: est.anio, riesgo,
      moral: [est.moral.get(local) || 0, est.moral.get(visita) || 0],
      derbi: est.derbis.get(local.nombre + '|' + visita.nombre) || null
    }, o));
    const [ga, gb] = m.goles;
    [[local, ga - gb, m.xiL.concat(m.supL), gb], [visita, gb - ga, m.xiV.concat(m.supV), ga]].forEach(([eq, d, xi, contra]) => {
      // Rachas: el ánimo sube con las victorias y baja con las derrotas, y se va olvidando.
      // Ganar un derbi pesa el doble en el ánimo.
      est.moral.set(eq, Math.max(-1, Math.min(1, 0.7 * (est.moral.get(eq) || 0) + 0.3 * Math.sign(d) * (m.derbi ? 2 : 1))));
      xi.forEach((j) => {
        const e = m.st.get(j), nota = m.notas.get(j);
        if (!registro.has(j)) registro.set(j, { j, eq, pj: 0, g: 0, a: 0, paradas: 0, ceros: 0, regates: 0, cortes: 0, pases: 0, pasesOk: 0, pen: 0, rojas: 0, amarillas: 0, lesiones: 0, enc: 0, sumaNota: 0 });
        const x = registro.get(j);
        // La prórroga es el mismo partido: suma lo que pase en ella, pero no cuenta como otro partido jugado.
        const cuenta = !o.prorroga || x.pj === 0;
        if (cuenta) { x.pj++; x.sumaNota += nota; }
        x.g += e.g; x.a += e.a; x.paradas += e.paradas; x.regates += e.regates; x.cortes += e.cortes;
        x.pases += e.pases; x.pasesOk += e.pasesOk; x.pen += e.pen; x.rojas += e.roja; x.amarillas += e.amarilla; x.lesiones += e.lesion; x.enc += e.enc;
        if (cuenta && (j.pos === 'POR' || j.pos === 'DEF') && contra === 0) x.ceros++;
        // Forma: un buen partido da confianza; se mezcla con algo de azar y se va olvidando.
        // Se compara con lo que suele rendir él, para que la racha sea suya y no la de su equipo.
        const habitual = est.habitual.has(j) ? est.habitual.get(j) : nota;
        est.habitual.set(j, 0.85 * habitual + 0.15 * nota);
        est.forma.set(j, Math.max(-80, Math.min(80, 0.8 * (est.forma.get(j) || 0) + (nota - habitual) * 8 + normal(r) * 14)));
        // Cansancio: jugar gasta, y gasta más a partir de los 30.
        const t = est.banquillo.get(eq);
        const gasto = (0.035 + Math.max(0, edad(j, est.anio) - 30) * 0.006) * (t && t.actual.fisico ? 0.85 : 1);
        est.energia.set(j, Math.max(0.3, (est.energia.has(j) ? est.energia.get(j) : 1) - gasto * ((e.salida - (e.entrada || 0)) / 90)));
        if (e.lesion) {
          // La mayoría son de una a tres semanas; alguna larga, y unas pocas graves (rodilla, rotura) de meses, más con la edad.
          const x2 = r(), grave = 0.03 + Math.max(0, edad(j, est.anio) - 30) * 0.008;
          const semanas = x2 < grave ? 15 + Math.floor(r() * 20) : x2 < 0.17 ? 4 + Math.floor(r() * 10) : 1 + Math.floor(r() * 3);
          est.bajas.set(j, semanas);
          const ev = m.eventos.find((v) => v.tipo === 'lesion' && v.quien === j.n); if (ev) ev.semanas = semanas;
        }
        // Sanciones: se apunta una semana de más porque la de este partido se descuenta al acabar la jornada.
        if (e.roja) est.bajas.set(j, 2 + (r() < 0.3 ? 1 : 0));
        // Cinco amarillas, un partido de sanción.
        if (e.amarilla && !e.roja) { const c = (est.amarillas.get(j) || 0) + 1; est.amarillas.set(j, c % 5); if (c % 5 === 0 && !est.bajas.has(j)) est.bajas.set(j, 2); }
      });
    });
    return m;
  }
  // Pasa una semana: bajas que se cumplen y descanso.
  function pasaSemana(est, equipos) {
    est.bajas.forEach((v, j) => (v <= 1 ? est.bajas.delete(j) : est.bajas.set(j, v - 1)));
    equipos.forEach((eq) => eq.jugadores.forEach((j) => { if (est.energia.has(j)) est.energia.set(j, Math.min(1, est.energia.get(j) + 0.03)); }));
  }
  const resumen = (m, local, visita) => ({ local: local.nombre, visita: visita.nombre, ga: m.goles[0], gb: m.goles[1], eventos: m.eventos, estilos: m.estilos, derbi: m.derbi });

  // Suma las estadísticas de varias competiciones y guarda el desglose de cada una (dónde marcó, dónde asistió…).
  const CAMPOS = ['pj', 'g', 'a', 'paradas', 'ceros', 'regates', 'cortes', 'pases', 'pasesOk', 'pen', 'rojas', 'amarillas', 'lesiones', 'enc', 'sumaNota'];
  function global(competiciones) {
    const tot = new Map();
    competiciones.forEach((c) => c.jugadores.forEach((x) => {
      if (!tot.has(x.j)) tot.set(x.j, Object.assign({ j: x.j, eq: x.eq, por: {} }, Object.fromEntries(CAMPOS.map((k) => [k, 0]))));
      const t = tot.get(x.j);
      CAMPOS.forEach((k) => (t[k] += x[k] || 0));
      t.por[c.nombre] = { pj: x.pj, g: x.g, a: x.a, regates: x.regates, pasesOk: x.pasesOk, ceros: x.ceros, enc: x.enc };
    }));
    const titulos = competiciones.map((c) => c.campeon).filter(Boolean);
    return notasTemporada(tot, titulos);
  }

  function notasTemporada(registro, campeon) {
    const campeones = [].concat(campeon);
    return [...registro.values()].map((x) => {
      const mediaNota = x.sumaNota / x.pj;
      // Cada rol suma por lo suyo: el extremo por regates y pases, el defensa por cortes y porterías a cero.
      const ro = rol(x.j), V = VOLUMEN[ro] || VOLUMEN.DC;
      const bruto = x.g * V.g + x.a * V.a + x.regates * V.r + x.cortes * V.c + x.ceros * V.z + x.pasesOk * (V.p || 0);
      // Hasta 1 cuenta entero; lo que pasa de ahí cuenta la mitad (una temporada de 60 goles tiene que notarse).
      const plus = Math.min(1.2, bruto <= 1 ? bruto : 1 + (bruto - 1) * 0.5) + campeones.filter((c) => c === x.eq).length * 0.15;
      const notaTemp = Math.min(10, mediaNota + plus * Math.min(1, x.pj / 25));
      return Object.assign(x, { nombre: x.j.n, pos: x.j.pos, rol: ro, club: x.eq.nombre, nota: mediaNota, notaTemp });
    });
  }

  // Calendario de liga a doble vuelta (método del círculo).
  function calendario(n) {
    // Con un número impar de equipos se añade un hueco: quien cae con él descansa esa jornada.
    const total = n, ids = [...Array(n % 2 ? n + 1 : n).keys()];
    n = ids.length;
    const rondas = [];
    for (let r = 0; r < n - 1; r++) {
      const ronda = [];
      for (let i = 0; i < n / 2; i++) {
        const a = ids[i], b = ids[n - 1 - i];
        if (a < total && b < total) ronda.push(r % 2 ? [b, a] : [a, b]);
      }
      rondas.push(ronda);
      ids.splice(1, 0, ids.pop());
    }
    return rondas.concat(rondas.map((ro) => ro.map(([a, b]) => [b, a])));
  }

  // Banquillos. Las bajas que no dependen de los resultados (una enfermedad) llegan en su fecha real;
  // los ceses dependen de cómo le vaya al equipo en la simulación, y entra el sustituto real si está libre.
  function ponerEntrenador(est, eq, i, jornada) {
    const nuevo = eq.entrenadores[i];
    const b = est.banquillo.get(eq) || { tramos: [] };
    if (b.tramos.length) b.tramos[b.tramos.length - 1].hasta = jornada - 1;
    b.i = i; b.actual = nuevo; b.desde = jornada;
    b.tramos.push({ nombre: nuevo.nombre, desde: jornada, hasta: null });
    // Un interino dura lo que duró en la realidad.
    b.finInterino = /^interino/.test(nuevo.nota || '') ? jornada + (nuevo.hasta - nuevo.desde) + 1 : null;
    est.banquillo.set(eq, b);
    eq.estiloEntrenador = nuevo.estilo || null;
  }
  const ocupado = (est, nombre, menos) => [...est.banquillo.entries()].some(([eq, b]) => eq !== menos && b.actual.nombre === nombre);
  function siguienteLibre(est, eq, desde) {
    for (let k = desde; k < eq.entrenadores.length; k++) if (!eq.entrenadores[k].fijo && !ocupado(est, eq.entrenadores[k].nombre, eq)) return k;
    return -1;
  }
  function revisarBanquillos(r, est, equipos, tabla, jornada, cambios) {
    const orden = [...tabla].sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc));
    const porNivel = [...equipos].sort((a, b) => fuerzaBruta(b) - fuerzaBruta(a));
    equipos.forEach((eq) => {
      const b = est.banquillo.get(eq);
      if (!b) return;
      const sale = b.actual.nombre;
      const cambiar = (i, motivo) => {
        ponerEntrenador(est, eq, i, jornada);
        if (motivo === 'cese') est.moral.set(eq, Math.min(1, (est.moral.get(eq) || 0) + 0.3));
        cambios.push({ jornada, club: eq.nombre, sale, entra: eq.entrenadores[i].nombre, motivo });
      };
      if (eq.entrenadores.every((x) => x.fijo)) {
        // Calendario real (p. ej. la enfermedad de Carniglia en el Madrid).
        const i = eq.entrenadores.findIndex((x) => jornada >= x.desde && jornada <= x.hasta);
        if (i >= 0 && eq.entrenadores[i].nombre !== sale) cambiar(i, i > 0 && eq.entrenadores[i].nombre === eq.entrenadores[0].nombre ? 'vuelve' : 'baja');
        return;
      }
      if (b.finInterino && jornada >= b.finInterino) {
        const k = siguienteLibre(est, eq, b.i + 1);
        if (k >= 0) cambiar(k, 'relevo');
        return;
      }
      if (jornada < 6 || jornada - b.desde < 5 || jornada > 28) return;
      const t = tabla.find((x) => x.equipo === eq);
      const puesto = orden.indexOf(t), esperado = porNivel.indexOf(eq);
      const derrotas = t.racha.slice(-4).filter((x) => x === 'P').length;
      const mal = (puesto >= equipos.length - 4 && derrotas >= 3) || (puesto - esperado >= 6 && derrotas >= 3);
      if (!mal || r() > 0.35) return;
      const k = siguienteLibre(est, eq, b.i + 1);
      if (k >= 0) cambiar(k, 'cese');
    });
  }

  function temporada(equipos, opciones) {
    const op = Object.assign({ semilla: Date.now() % 1e9, puntosVictoria: 2, alJugar: null, anio: 1958, cambios: 0, estado: null, derbis: [], factorGoles: 1 }, opciones);
    const r = rng(op.semilla);
    const est = op.estado || nuevoEstado(op.anio, op.derbis);
    asignarEstilos(equipos);
    const cambios = [];
    equipos.forEach((e) => {
      e.estiloEntrenador = null;
      if (e.entrenadores && e.entrenadores.length) ponerEntrenador(est, e, 0, 1);
    });
    const tabla = equipos.map((e) => ({ equipo: e, nombre: e.nombre, estilo: estiloBase(e), pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0, racha: [] }));
    const registro = new Map();
    const resultados = [];
    const cal = calendario(equipos.length);
    cal.forEach((ronda, jn) => {
      const resJornada = [];
      revisarBanquillos(r, est, equipos, tabla, jn + 1, cambios);
      // Último cuarto de liga: los que se juegan el descenso aprietan y los de media tabla sin nada en juego se relajan.
      if (jn >= cal.length * 0.75 && equipos.length >= 8) {
        const orden = [...tabla].sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc));
        orden.forEach((t, i) => {
          const m0 = est.moral.get(t.equipo) || 0;
          if (i >= orden.length - 4) est.moral.set(t.equipo, Math.max(m0, 0.25));
          else if (i >= 5 && i < orden.length - 6) est.moral.set(t.equipo, m0 * 0.8 - 0.05);
        });
      }
      ronda.forEach(([a, b]) => {
        const m = jugarConEstado(r, est, equipos[a], equipos[b], { cambios: op.cambios, factorGoles: op.factorGoles }, registro);
        const [ga, gb] = m.goles;
        const ta = tabla[a], tb = tabla[b];
        ta.pj++; tb.pj++; ta.gf += ga; ta.gc += gb; tb.gf += gb; tb.gc += ga;
        if (ga > gb) { ta.g++; tb.p++; ta.pts += op.puntosVictoria; ta.racha.push('G'); tb.racha.push('P'); }
        else if (ga < gb) { tb.g++; ta.p++; tb.pts += op.puntosVictoria; ta.racha.push('P'); tb.racha.push('G'); }
        else { ta.e++; tb.e++; ta.pts++; tb.pts++; ta.racha.push('E'); tb.racha.push('E'); }
        resJornada.push(resumen(m, equipos[a], equipos[b]));
      });
      pasaSemana(est, equipos);
      resultados.push(resJornada);
      if (op.alJugar) op.alJugar(jn + 1, resJornada);
    });
    tabla.sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf);
    tabla.forEach((t) => { const b = est.banquillo.get(t.equipo); t.entrenador = b ? b.actual.nombre : null; t.estilo = estiloBase(t.equipo); });
    const jugadores = notasTemporada(registro, tabla[0].equipo);
    const tramos = {};
    equipos.forEach((e) => { const b = est.banquillo.get(e); if (b) tramos[e.nombre] = b.tramos; });
    return { tabla, jugadores, resultados, estado: est, cambios, tramos };
  }

  // Copa por eliminatorias a ida y vuelta, final a partido único en campo neutral.
  // Era de 1959: sin goles fuera de casa ni penaltis; el empate se resuelve con partido de desempate.
  function copa(equipos, opciones) {
    const op = Object.assign({ semilla: Date.now() % 1e9, anio: 1959, cambios: 0, estado: null, alJugar: null, nombre: 'Copa', derbis: [], finalUnica: true, factorGoles: 1 }, opciones);
    // Reglas de desempate de la época: valor doble de los goles fuera desde 1966; prórroga y penaltis desde 1970.
    const golesFuera = op.golesFuera != null ? op.golesFuera : op.anio >= 1966 && op.anio <= 2021, penaltis = op.penaltis != null ? op.penaltis : op.anio >= 1971;
    const r = rng(op.semilla);
    const est = op.estado || nuevoEstado(op.anio, op.derbis);
    const registro = new Map();
    const rondas = [];
    asignarEstilos(equipos.filter((e) => (e.division || 1) === 1));
    asignarEstilos(equipos.filter((e) => (e.division || 1) !== 1));
    // Los de categoría más alta entran más tarde: la primera ronda la juegan los justos para cuadrar una potencia de 2.
    const orden = [...equipos].sort((a, b) => (a.division || 1) - (b.division || 1) || fuerzaBruta(b) - fuerzaBruta(a));
    let pot = 1; while (pot * 2 <= orden.length) pot *= 2;
    const juegan = orden.length === pot ? orden.length : 2 * (orden.length - pot);
    let esperan = orden.slice(0, orden.length - juegan);
    let vivos = orden.slice(orden.length - juegan);
    const barajar = (xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
    const juega = (a, b, o) => jugarConEstado(r, est, a, b, Object.assign({ cambios: op.cambios, factorGoles: op.factorGoles }, o), registro);
    // Una eliminatoria: ida y vuelta (o final única), desempate en campo neutral con prórroga si hace falta.
    const eliminatoria = (A, B, unica) => {
      const partidos = [];
      let ganador;
      if (unica) {
        let m = juega(A, B, { neutral: true }); partidos.push(resumen(m, A, B));
        let ga = m.goles[0], gb = m.goles[1];
        if (ga === gb) { m = juega(A, B, { neutral: true, duracion: 1 / 3, marcador: [ga, gb], prorroga: true, xiL: m.finL, xiV: m.finV }); partidos.push(Object.assign(resumen(m, A, B), { prorroga: true })); ga += m.goles[0]; gb += m.goles[1]; }
        if (ga === gb && penaltis) {
          const [pa, pb] = tanda(r, m.finL, m.finV, nivelDia(est));
          return { a: A.nombre, b: B.nombre, partidos, ganador: (pa > pb ? A : B).nombre, eq: pa > pb ? A : B, penaltis: `${pa}-${pb}` };
        }
        let intentos = 0;
        while (ga === gb && intentos++ < 2) { m = juega(A, B, { neutral: true }); partidos.push(Object.assign(resumen(m, A, B), { desempate: true })); ga = m.goles[0]; gb = m.goles[1]; }
        ganador = ga > gb ? A : ga < gb ? B : (r() < 0.5 ? A : B);
      } else {
        const ida = juega(A, B, {}); pasaSemana(est, [A, B]);
        const vuelta = juega(B, A, { marcador: [ida.goles[1], ida.goles[0]] }); pasaSemana(est, [A, B]);
        partidos.push(resumen(ida, A, B), resumen(vuelta, B, A));
        let gA = ida.goles[0] + vuelta.goles[1], gB = ida.goles[1] + vuelta.goles[0];
        if (golesFuera || penaltis) {
          // Gol fuera de casa: con el global igualado pasa quien marcó más en campo contrario.
          const fuera = () => [vuelta.goles[1] + (extra ? extra.goles[1] : 0), ida.goles[1]];
          let extra = null, fA, fB;
          if (gA === gB && golesFuera) { [fA, fB] = fuera(); if (fA !== fB) return { a: A.nombre, b: B.nombre, partidos, ganador: (fA > fB ? A : B).nombre, eq: fA > fB ? A : B, golesFuera: true }; }
          if (gA === gB && penaltis) {
            extra = juega(B, A, { duracion: 1 / 3, marcador: [gB, gA], prorroga: true, xiL: vuelta.finL, xiV: vuelta.finV });
            partidos.push(Object.assign(resumen(extra, B, A), { prorroga: true }));
            gA += extra.goles[1]; gB += extra.goles[0];
            if (gA === gB && golesFuera) { [fA, fB] = fuera(); if (fA !== fB) return { a: A.nombre, b: B.nombre, partidos, ganador: (fA > fB ? A : B).nombre, eq: fA > fB ? A : B, golesFuera: true }; }
            if (gA === gB) {
              const [pb, pa] = tanda(r, extra.finL, extra.finV, nivelDia(est));
              return { a: A.nombre, b: B.nombre, partidos, ganador: (pa > pb ? A : B).nombre, eq: pa > pb ? A : B, penaltis: `${pa}-${pb}` };
            }
          }
        }
        let intentos = 0;
        while (gA === gB && intentos++ < 3) {
          let m = juega(A, B, { neutral: true }); partidos.push(Object.assign(resumen(m, A, B), { desempate: true }));
          gA = m.goles[0]; gB = m.goles[1];
          if (gA === gB) { m = juega(A, B, { neutral: true, duracion: 1 / 3, prorroga: true, xiL: m.finL, xiV: m.finV }); partidos.push(Object.assign(resumen(m, A, B), { prorroga: true })); gA += m.goles[0]; gB += m.goles[1]; }
        }
        ganador = gA > gB ? A : gA < gB ? B : (r() < 0.5 ? A : B);
      }
      return { a: A.nombre, b: B.nombre, partidos, ganador: ganador.nombre, eq: ganador };
    };
    if (op.cuadro) {
      // Cuadro fijo (por ejemplo, el sorteo real): cada cruce nombra a dos clubes o a la eliminatoria de la que sale su rival.
      const porNombre = new Map(equipos.map((e) => [e.nombre, e]));
      const sale = new Map();
      const quien = (x) => (x == null ? null : sale.get(x) || porNombre.get(x) || null);
      op.cuadro.forEach((ro) => {
        const cruces = ro.cruces.map((c) => {
          const A = quien(c.a), B = quien(c.b);
          const x = A && B ? eliminatoria(A, B, c.final && op.finalUnica) : { a: (A || B).nombre, b: null, partidos: [], ganador: (A || B).nombre, eq: A || B, sinRival: c.sinRival || 'sin rival' };
          sale.set(c.id, x.eq);
          return Object.assign({ id: c.id, real: c.real, ganadorReal: c.ganadorReal, mismoCruce: !!(A && B) }, x, { eq: undefined });
        });
        rondas.push({ nombre: ro.nombre, cruces });
        if (op.alJugar) op.alJugar(rondas.length, rondas[rondas.length - 1]);
      });
      vivos = [sale.get(op.cuadro[op.cuadro.length - 1].cruces[0].id)];
      esperan = [];
    }
    // Fase de grupos (Liga de Campeones): grupos de 4 a doble vuelta; pasan los dos primeros a las eliminatorias.
    // Si sobran equipos, los más flojos juegan antes una ronda previa.
    // Fase de liga (Liga de Campeones desde 2024): 36 equipos en una sola tabla, ocho partidos cada uno contra ocho
    // rivales distintos. Los ocho primeros van a octavos; del 9.º al 24.º juegan una eliminatoria previa.
    const L = !op.cuadro && op.liga && equipos.length >= 24 ? Math.min(36, equipos.length - (equipos.length % 2)) : 0;
    if (L) {
      const eq = barajar([...equipos].sort((a, b) => fuerzaBruta(b) - fuerzaBruta(a)).slice(0, L));
      const tabla = eq.map((e) => ({ equipo: e, nombre: e.nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }));
      const crucesL = [];
      calendario(L).slice(0, 8).forEach((ronda) => {
        ronda.forEach(([a, b]) => {
          const m = juega(eq[a], eq[b], {});
          const [ga, gb] = m.goles, ta = tabla[a], tb = tabla[b];
          ta.pj++; tb.pj++; ta.gf += ga; ta.gc += gb; tb.gf += gb; tb.gc += ga;
          if (ga > gb) { ta.g++; tb.p++; ta.pts += 3; } else if (ga < gb) { tb.g++; ta.p++; tb.pts += 3; } else { ta.e++; tb.e++; ta.pts++; tb.pts++; }
          crucesL.push({ a: eq[a].nombre, b: eq[b].nombre, partidos: [resumen(m, eq[a], eq[b])], ganador: null, grupo: 'Fase de liga' });
        });
        pasaSemana(est, eq);
      });
      const t = [...tabla].sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf);
      rondas.push({ nombre: 'Fase de liga', liga: true, cruces: crucesL, grupos: [{ nombre: 'Fase de liga', tabla: t.map((x, i) => ({ nombre: x.nombre, pj: x.pj, g: x.g, e: x.e, p: x.p, gf: x.gf, gc: x.gc, pts: x.pts, pasa: i < 8, repesca: i >= 8 && i < 24 })) }] });
      if (op.alJugar) op.alJugar(rondas.length, rondas[rondas.length - 1]);
      const cruces = [], pasan = [];
      for (let i = 0; i < 8; i++) {
        const x = eliminatoria(t[23 - i].equipo, t[8 + i].equipo, false);
        cruces.push({ a: x.a, b: x.b, partidos: x.partidos, ganador: x.ganador, penaltis: x.penaltis, golesFuera: x.golesFuera });
        pasan.push(x.eq);
      }
      rondas.push({ nombre: 'Eliminatoria previa', cruces });
      if (op.alJugar) op.alJugar(rondas.length, rondas[rondas.length - 1]);
      vivos = t.slice(0, 8).map((x) => x.equipo).concat(pasan); esperan = [];
    }
    const G = !L && !op.cuadro && op.grupos ? [8, 4, 2].find((g) => g <= op.grupos && 4 * g <= equipos.length) : 0;
    if (G) {
      let porFuerza = [...equipos].sort((a, b) => fuerzaBruta(b) - fuerzaBruta(a)).slice(0, 8 * G);
      const k = porFuerza.length - 4 * G;
      if (k > 0) {
        const previa = barajar(porFuerza.slice(porFuerza.length - 2 * k)), cruces = [], pasan = [];
        for (let i = 0; i + 1 < previa.length; i += 2) {
          const x = eliminatoria(previa[i], previa[i + 1], false);
          cruces.push({ a: x.a, b: x.b, partidos: x.partidos, ganador: x.ganador, penaltis: x.penaltis, golesFuera: x.golesFuera });
          pasan.push(x.eq);
        }
        rondas.push({ nombre: 'Ronda previa', cruces });
        if (op.alJugar) op.alJugar(rondas.length, rondas[rondas.length - 1]);
        porFuerza = porFuerza.slice(0, porFuerza.length - 2 * k).concat(pasan).sort((a, b) => fuerzaBruta(b) - fuerzaBruta(a));
      }
      const bombos = [0, 1, 2, 3].map((b) => barajar(porFuerza.slice(b * G, (b + 1) * G)));
      const pv = op.anio >= 1996 ? 3 : 2;
      const grupos = [], crucesG = [];
      for (let g = 0; g < G; g++) {
        const eq = bombos.map((b) => b[g]);
        const tabla = eq.map((e) => ({ equipo: e, nombre: e.nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }));
        grupos.push({ nombre: 'Grupo ' + 'ABCDEFGH'[g], eq, tabla, pares: new Map() });
      }
      const JORNADAS = [[[0, 1], [2, 3]], [[2, 0], [3, 1]], [[0, 3], [1, 2]], [[1, 0], [3, 2]], [[0, 2], [1, 3]], [[3, 0], [2, 1]]];
      JORNADAS.forEach((jn) => {
        grupos.forEach((gr) => jn.forEach(([a, b]) => {
          const m = juega(gr.eq[a], gr.eq[b], {});
          const [ga, gb] = m.goles, ta = gr.tabla[a], tb = gr.tabla[b];
          ta.pj++; tb.pj++; ta.gf += ga; ta.gc += gb; tb.gf += gb; tb.gc += ga;
          if (ga > gb) { ta.g++; tb.p++; ta.pts += pv; } else if (ga < gb) { tb.g++; ta.p++; tb.pts += pv; } else { ta.e++; tb.e++; ta.pts++; tb.pts++; }
          const clave = Math.min(a, b) + '-' + Math.max(a, b);
          if (!gr.pares.has(clave)) { const c = { a: gr.eq[a].nombre, b: gr.eq[b].nombre, partidos: [], ganador: null, grupo: gr.nombre }; gr.pares.set(clave, c); crucesG.push(c); }
          gr.pares.get(clave).partidos.push(resumen(m, gr.eq[a], gr.eq[b]));
        }));
        pasaSemana(est, porFuerza);
      });
      const pasan = [];
      grupos.forEach((gr) => {
        const t = [...gr.tabla].sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf);
        pasan.push(t[0].equipo, t[1].equipo);
        gr.tabla = t.map((x, i) => ({ nombre: x.nombre, pj: x.pj, g: x.g, e: x.e, p: x.p, gf: x.gf, gc: x.gc, pts: x.pts, pasa: i < 2 }));
      });
      rondas.push({ nombre: 'Fase de grupos', cruces: crucesG, grupos: grupos.map((gr) => ({ nombre: gr.nombre, tabla: gr.tabla })) });
      if (op.alJugar) op.alJugar(rondas.length, rondas[rondas.length - 1]);
      vivos = pasan; esperan = [];
    }
    while (vivos.length + esperan.length > 1) {
      const total = vivos.length + esperan.length;
      const nombreRonda = vivos.length === 2 && !esperan.length ? 'Final' : total === 4 ? 'Semifinales' : total === 8 ? 'Cuartos de final' : total === 16 ? 'Octavos de final' : total === 32 && !esperan.length ? 'Dieciseisavos de final' : 'Primera ronda';
      const sorteo = barajar(vivos);
      const cruces = [];
      const pasan = [];
      for (let i = 0; i + 1 < sorteo.length; i += 2) {
        const x = eliminatoria(sorteo[i], sorteo[i + 1], nombreRonda === 'Final' && op.finalUnica);
        cruces.push({ a: x.a, b: x.b, partidos: x.partidos, ganador: x.ganador, penaltis: x.penaltis, golesFuera: x.golesFuera });
        pasan.push(x.eq);
      }
      rondas.push({ nombre: nombreRonda, cruces });
      if (op.alJugar) op.alJugar(rondas.length, rondas[rondas.length - 1]);
      vivos = pasan.concat(esperan); esperan = [];
    }
    const campeon = vivos[0];
    const jugadores = notasTemporada(registro, campeon);
    return { nombre: op.nombre, rondas, campeon: campeon.nombre, campeonEq: campeon, jugadores, estado: est };
  }

  // Premios del año con reglas de la época: Pichichi y Zamora salen solo de la Liga.
  function premios(liga, jugadoresAnio, anio) {
    const L = liga.jugadores;
    const mejor = (xs, f, minimo) => xs.filter((x) => x.pj >= (minimo || 1)).sort(f)[0] || null;
    const pjLiga = liga.tabla[0].pj;
    const zamora = mejor(L.filter((x) => x.pos === 'POR'), (a, b) => a.enc / a.pj - b.enc / b.pj || b.pj - a.pj, Math.ceil(pjLiga * 2 / 3));
    return {
      pichichi: mejor(L, (a, b) => b.g - a.g || a.pj - b.pj),
      zamora: zamora && Object.assign({ coef: zamora.enc / zamora.pj }, zamora),
      asistente: mejor(L, (a, b) => b.a - a.a || b.g - a.g),
      mejor: mejor(jugadoresAnio, (a, b) => b.notaTemp - a.notaTemp, 15),
      revelacion: mejor(jugadoresAnio.filter((x) => edad(x.j, anio) <= 21), (a, b) => b.notaTemp - a.notaTemp, 12),
      minZamora: Math.ceil(pjLiga * 2 / 3)
    };
  }

  // Hitos: tripletes, goleadas, remontadas y rachas. competiciones = [{ nombre, partidos: [resumen + etiqueta] }]
  function hitos(competiciones, tabla) {
    const tripletes = [], remontadas = [];
    let goleada = null, masGoles = null;
    competiciones.forEach((c) => c.partidos.forEach((m) => {
      const clubes = [m.local, m.visita];
      const porJugador = {};
      let marcador = [0, 0], peor = [0, 0];
      m.eventos.forEach((e) => {
        if (e.tipo !== 'gol' && e.tipo !== 'pen') return;
        const k = e.quien + '|' + e.lado;
        porJugador[k] = (porJugador[k] || 0) + 1;
        marcador[e.lado]++;
        peor[0] = Math.min(peor[0], marcador[0] - marcador[1]);
        peor[1] = Math.min(peor[1], marcador[1] - marcador[0]);
      });
      Object.entries(porJugador).forEach(([k, g]) => {
        if (g < 3) return;
        const [quien, lado] = k.split('|');
        tripletes.push({ quien, club: clubes[+lado], rival: clubes[1 - lado], goles: g, comp: c.nombre, etiqueta: m.etiqueta, ga: m.ga, gb: m.gb, local: m.local, visita: m.visita });
      });
      const dif = Math.abs(m.ga - m.gb), tot = m.ga + m.gb;
      if (!goleada || dif > Math.abs(goleada.ga - goleada.gb)) goleada = Object.assign({ comp: c.nombre }, m);
      if (!masGoles || tot > masGoles.ga + masGoles.gb) masGoles = Object.assign({ comp: c.nombre }, m);
      const gana = m.ga > m.gb ? 0 : m.gb > m.ga ? 1 : -1;
      if (gana >= 0 && peor[gana] <= -2) remontadas.push(Object.assign({ comp: c.nombre, equipo: clubes[gana], desventaja: -peor[gana] }, m));
    }));
    // Rachas de Liga: la más larga sin perder, ganando y perdiendo.
    const racha = (xs, ok) => { let mx = 0, act = 0; xs.forEach((x) => { act = ok(x) ? act + 1 : 0; mx = Math.max(mx, act); }); return mx; };
    const mejorRacha = (ok) => (tabla || []).map((t) => ({ club: t.nombre, n: racha(t.racha, ok) })).sort((a, b) => b.n - a.n)[0];
    tripletes.sort((a, b) => b.goles - a.goles);
    return {
      tripletes, remontadas, goleada, masGoles,
      invicto: mejorRacha((x) => x !== 'P'), victorias: mejorRacha((x) => x === 'G'), derrotas: mejorRacha((x) => x === 'P')
    };
  }

  const api = { golesEpoca, casaEpoca, tanda, escala, rng, partido, temporada, copa, global, premios, hitos, calendario, rol, estiloBase, fuerzaBruta, edad, NOMBRE_ESTILO, atributos, formaDe, ATRIBUTOS, NOMBRE_ATRIBUTO, nuevoEstado, jugarConEstado, pasaSemana, P };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Motor = api;
})(typeof self !== 'undefined' ? self : this);
