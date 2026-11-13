// Mundo (beta) — Universo del Fútbol
// Partida de varias temporadas sobre el motor: ligas, Copa, ascensos, carreras, mercado y récords.
(function (root) {
  'use strict';
  const Motor = root.Motor || (typeof require !== 'undefined' ? require('./motor.js') : null);
  const Epoca = root.Epoca || (typeof require !== 'undefined' ? require('./epoca.js') : null);

  const normal = (r) => r() + r() + r() - 1.5;
  const anioNac = (j) => parseInt(String(j.nac || '').slice(0, 4), 10) || 1932;
  const media = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
  const esFilial = (c) => /filial/i.test(c.nombre);
  const MATRIZ = { 'Condal (filial del Barcelona)': 'Barcelona', 'Basconia (filial del Bilbao)': 'Atlético Bilbao', 'Plus Ultra (filial del Real Madrid)': 'Real Madrid',
    'Mestalla (filial del Valencia)': 'Valencia', 'Sevilla Atlético (filial del Sevilla)': 'Sevilla' };
  // Récord real de goles en una Liga antes de 1958: Zarra, 38 en 1950-51.
  const RECORD_REAL_LIGA = { goles: 38, quien: 'Zarra', club: 'Atlético Bilbao', temporada: '1950-51' };

  // Perfil de carrera estable para cada jugador (precoz, normal o tardío), salvo que el dato lo traiga.
  const hashN = (s, sal) => { let h = sal || 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  // Carreras reales conocidas: perfil y ritmo de declive (1 normal; menos de 1 envejece despacio, más de 1 deprisa).
  const CARRERAS = {
    'Pelé': ['precoz', 0.9], 'Alfredo Di Stéfano': ['tardio', 0.45], 'Ferenc Puskás': ['tardio', 0.4], 'Stanley Matthews': ['tardio', 0.3],
    'Paco Gento': ['normal', 0.7], 'Garrincha': ['tardio', 1.6], 'Eusébio': ['normal', 1.2], 'Bobby Charlton': ['normal', 0.8],
    'Raymond Kopa': ['normal', 0.8], 'Uwe Seeler': ['normal', 0.8], 'Didi': ['tardio', 0.8], 'Nílton Santos': ['tardio', 0.5], 'Zizinho': ['tardio', 0.6],
    'Omar Sívori': ['precoz', 1.2], 'Just Fontaine': ['normal', 3], 'Gianni Rivera': ['precoz', 0.8], 'Dino Zoff': ['tardio', 0.35],
    'Denis Law': ['precoz', 1.2], 'Jimmy Greaves': ['precoz', 1.3], 'Fritz Walter': ['normal', 0.6], 'José Altafini': ['normal', 0.6],
    'George Best': ['precoz', 1.8], 'Lev Yashin': ['tardio', 0.5], 'Johan Cruyff': ['normal', 1], 'Franz Beckenbauer': ['normal', 0.7],
    'Gerd Müller': ['normal', 1.1], 'Diego Maradona': ['precoz', 1.2], 'Marco van Basten': ['precoz', 2.5], 'Roger Milla': ['tardio', 0.35],
    'Paolo Maldini': ['normal', 0.45], 'Ronaldo': ['precoz', 1.5], 'Ronaldo Nazário': ['precoz', 1.5], 'Ronaldinho': ['precoz', 1.6],
    'Kaká': ['precoz', 1.5], 'Adriano': ['precoz', 2.2], 'Adriano Leite Ribeiro': ['precoz', 2.2], 'Michael Owen': ['precoz', 1.8], 'Gianluigi Buffon': ['normal', 0.4],
    'Ryan Giggs': ['normal', 0.5], 'Zlatan Ibrahimović': ['tardio', 0.45], 'Luka Modrić': ['tardio', 0.45], 'Robert Lewandowski': ['tardio', 0.55],
    'Cristiano Ronaldo': ['tardio', 0.45], 'Lionel Messi': ['precoz', 0.7], 'Didier Drogba': ['tardio', 0.6], 'Jamie Vardy': ['tardio', 0.6],
    'Andrea Pirlo': ['tardio', 0.6], 'Xavi': ['normal', 0.7], 'Xavi Hernández': ['normal', 0.7], 'Andrés Iniesta': ['normal', 0.8], 'Kylian Mbappé': ['precoz', 1],
  };
  // ---------- Constantes: lo que este universo no puede cambiar (idea de Anthony) ----------
  // Las carreras las decide el motor, pero algunas cosas pasan siempre: Pelé es un crack desde los 17 y llega a los 1000 goles,
  // el Madrid de Di Stéfano manda, Messi y Cristiano son los mejores de su tiempo. Niveles en la escala que se ve (1-1000).
  // techo = mejor nivel; suelo = [edad, nivel mínimo] (entre edades se interpola); club + fiel = no sale de ese club hasta ese año;
  // retiro = no lo deja antes de esa edad; mundial = definición en los Mundiales; fin = definición mínima; elite = solo ficha por un grande.
  const CONSTANTES = {
    'Pelé': { techo: 1000, suelo: [[17, 920], [22, 960], [25, 1000], [30, 990], [34, 940], [37, 870]], club: 'Santos', fiel: 1977, retiro: 37, fin: 1.95, mundial: 1.75 },
    'Alfredo Di Stéfano': { techo: 960, suelo: [[28, 960], [33, 950], [35, 920], [37, 860], [39, 780]], club: 'Real Madrid', fiel: 1964, retiro: 38 },
    'Ferenc Puskás': { techo: 920, suelo: [[30, 920], [34, 900], [36, 860], [38, 780]], club: 'Real Madrid', fiel: 1966, retiro: 38, fin: 1.3 },
    'Paco Gento': { techo: 880, suelo: [[23, 850], [27, 880], [31, 870], [34, 820], [37, 740]], club: 'Real Madrid', fiel: 1971 },
    'Lionel Messi': { techo: 1000, suelo: [[18, 660], [20, 780], [22, 890], [24, 960], [26, 985], [31, 975], [34, 940], [37, 880]], elite: true },
    'Cristiano Ronaldo': { techo: 1000, suelo: [[19, 640], [21, 760], [23, 880], [25, 950], [27, 985], [33, 975], [36, 930], [39, 860]], elite: true, europa: 5 },
    'Kylian Mbappé': { techo: 970, suelo: [[18, 720], [20, 810], [23, 900], [26, 950], [30, 945]], elite: true, mundial: 1.7 },
  };
  // Clubes que mandan en una época: si al empezar la temporada no son los más fuertes de su liga (o de Europa hasta
  // el año 'europa'), su plantilla sube lo que falte (como mucho 'paso' por verano).
  const CLUBES_CONSTANTES = [{ club: 'Real Madrid', desde: 1953, hasta: 1969, margen: 40, europa: 1960, paso: 60 }];
  // Fuerza del once por puestos (1 portero, 4 defensas, 3 medios, 3 delanteros): diez delanteros buenos no hacen un equipo.
  const ONCE = { POR: 1, DEF: 4, MED: 3, DEL: 3 };
  const onceDe = (c) => Object.entries(ONCE).flatMap(([pos, k]) => { const xs = c.jugadores.filter((j) => j.pos === pos && !j.cedido).sort((a, b) => b.niv - a.niv).slice(0, k); while (xs.length < k) xs.push(null); return xs; });
  const fuerzaOnce = (c) => media(onceDe(c).map((j) => (j ? j.niv : 300)));
  function sueloDe(K, edad) {
    const s = K.suelo;
    if (!s || edad < s[0][0] || edad > s[s.length - 1][0]) return 0;
    for (let i = 1; i < s.length; i++) if (edad <= s[i][0]) return Motor.escala.interno(s[i - 1][1] + (s[i][1] - s[i - 1][1]) * (edad - s[i - 1][0]) / (s[i][0] - s[i - 1][0]));
    return 0;
  }
  // Se aplica al empezar cada temporada (M.anio = la que se va a jugar).
  function constantes(M) {
    M.clubes.forEach((c) => c.jugadores.forEach((j) => {
      const K = CONSTANTES[j.n];
      if (!K || j.relleno) return;
      j.cons = true;
      if (K.fin) j.fin = Math.max(j.fin || 0, K.fin);
      const s = sueloDe(K, M.anio - anioNac(j));
      if (s > j.niv) j.niv = s;
      j.tec = Math.max(j.tec || 0, j.niv, M.anio - anioNac(j) <= 27 ? Motor.escala.interno(K.techo) : 0);
    }));
    CLUBES_CONSTANTES.forEach((C) => {
      if (M.anio < C.desde || M.anio > C.hasta) return;
      const c = M.clubes.find((x) => x.nombre === C.club);
      if (!c || c.division !== 1) return;
      const rivales = M.clubes.filter((x) => x !== c && x.division === 1 && (M.anio <= C.europa || x.pais === c.pais));
      const meta = Math.max(...rivales.map(fuerzaOnce)) + C.margen;
      const once = onceDe(c).filter((j) => j && !j.cons);
      // Primero se tapan los agujeros del once (un portero o un defensa muy por debajo del resto) y luego sube todo lo que falte.
      once.forEach((j) => { if (j.niv < meta - 110) j.niv = Math.min(meta - 110, j.niv + 3 * C.paso); });
      const falta = Math.min(C.paso, (meta - fuerzaOnce(c)) * 11 / Math.max(1, once.length));
      once.forEach((j) => { if (falta > 0) j.niv = Math.min(1130, j.niv + falta); j.tec = Math.max(j.tec || 0, j.niv); });
    });
  }
  function perfil(j) {
    if (j.perfil) return j.perfil;
    if (CARRERAS[j.n]) return CARRERAS[j.n][0];
    const x = (hashN(j.n) % 100) / 100;
    return x < 0.3 ? 'precoz' : x < 0.75 ? 'normal' : 'tardio';
  }
  const PICO = { precoz: 26, normal: 27, tardio: 29 };
  // Cada jugador envejece por partes: el físico (velocidad, potencia) llega antes y cae rápido, la técnica aguanta
  // y la cabeza (lectura, colocación, experiencia) sigue mejorando hasta pasados los 30. Pesan distinto según el puesto,
  // y cada jugador lleva su propia mezcla: uno muy físico (Adriano) cae antes que uno de cabeza (Pirlo).
  const PARTES = { fis: { pico: -3, sube: 0.03, cae: 0.005 }, tec: { pico: -1, sube: 0.025, cae: 0.0025 }, men: { pico: 3, sube: 0.02, cae: 0.0015 } };
  const PESOS = { POR: [0.2, 0.35, 0.45], DEF: [0.4, 0.25, 0.35], MED: [0.3, 0.45, 0.25], EXT: [0.5, 0.35, 0.15], DEL: [0.4, 0.4, 0.2] };
  const curvas = new Map();
  // Nadie nace hecho: lo que un talento tiene por encima de un buen titular (700 en la escala del motor) lo gana con los años.
  const JUVENTUD = [[-10, 0.25], [-8, 0.42], [-6, 0.64], [-4, 0.84], [-2, 0.96], [0, 1]];
  function metaEdad(tec, cv, edad) {
    const base = tec * cv.F(edad), d = edad - cv.pico;
    if (base <= 700 || d >= 0) return base;
    let k = JUVENTUD[0][1];
    for (let i = 1; i < JUVENTUD.length; i++) if (d <= JUVENTUD[i][0]) { const [a, fa] = JUVENTUD[i - 1], [b, fb] = JUVENTUD[i]; k = d <= a ? fa : fa + (fb - fa) * (d - a) / (b - a); break; }
    return 700 + (base - 700) * k;
  }
  function curva(j) {
    const clave = j.n + '|' + j.pos + '|' + (j.rol || '');
    if (curvas.has(clave)) return curvas.get(clave);
    const h = hashN(j.n, 7), u = (k) => ((h >>> k) % 1000) / 1000;
    const pf = perfil(j), real = CARRERAS[j.n];
    // Ritmo de declive propio (0,6 a 1,5; los conocidos traen el suyo) y mezcla de partes con algo de azar estable.
    const ritmo = real ? real[1] : 0.6 + 0.9 * u(3) * u(11);
    const w0 = PESOS[j.rol === 'EXT' ? 'EXT' : j.pos] || PESOS.MED;
    let w = w0.map((x, i) => x * (0.75 + 0.5 * u(5 + i * 4)));
    const s = w[0] + w[1] + w[2]; w = w.map((x) => x / s);
    const pico = PICO[pf] + (j.pos === 'POR' ? 1 : 0);
    // Un tardío crece más despacio; un precoz explota antes y llega casi hecho a los 20.
    const sube = { precoz: 0.85, normal: 1, tardio: 1.2 }[pf];
    const parte = (p, edad) => {
      const P = PARTES[p], top = pico + P.pico;
      return edad <= top ? 1 - P.sube * sube * (top - edad) : 1 - P.cae * ritmo * Math.pow(edad - top, 1.7);
    };
    const bruto = (edad) => Math.max(0.3, w[0] * parte('fis', edad) + w[1] * parte('tec', edad) + w[2] * parte('men', edad));
    let mejor = 0, edadPico = pico;
    for (let e = 15; e <= 42; e++) { const v = bruto(e); if (v > mejor) { mejor = v; edadPico = e; } }
    const c = { perfil: pf, ritmo, pesos: w, pico: edadPico, F: (edad) => bruto(edad) / mejor };
    curvas.set(clave, c);
    return c;
  }
  const temporadaTxt = (anio) => `${anio}-${String((anio + 1) % 100).padStart(2, '0')}`;

  function nuevoMundo(d) {
    const clubes = d.primera.map((c) => Object.assign(c, { division: 1, grupo: 'Primera', pais: 'España' }))
      .concat(d.segunda.map((c) => Object.assign(c, { division: 2, pais: 'España' })));
    // Otras ligas: cada país trae sus divisiones (o grupos regionales) con su nivel.
    const paises = (d.paises || []).map((P) => {
      if (P.nacionales) NACIONALES[P.pais] = [P.pais].concat(P.nacionales);
      P.divisiones.forEach((dv) => dv.clubes.forEach((c) => { Object.assign(c, { division: dv.nivel, grupo: dv.nombre, pais: P.pais }); clubes.push(c); }));
      return { pais: P.pais, grupos: P.divisiones.map((dv) => ({ nombre: dv.nombre, nivel: dv.nivel, de: dv.de || null })), sube: P.sube || 2, final: P.final || null, copa: P.copa || null,
        ascensos: P.ascensos || {}, cupo: P.cupo || null, abajo: P.abajo || 'Tercera', estatales: !!P.estatales, rellenar: !!P.rellenar };
    });
    const vistosInicio = [];
    clubes.forEach((c) => c.jugadores.forEach((j) => {
      vistosInicio.push(j.n + '|' + j.nac);
      j.rol = Motor.rol(j);            // el rol se fija al empezar y ya no depende de sus goles
      j.carrera = [];
      j.inicio = { niv: j.niv, club: c.nombre };
      j.tecReal = j.tec || j.niv;      // sus mejores temporadas reales después de 1959
      j.nacion = j.pais || c.pais;     // para las reglas de extranjeros de cada país
    }));
    const debutantes = ((d.debutantes && d.debutantes.jugadores) || []).concat(...(d.paises || []).map((P) => P.debutantes || []));
    const M = {
      anio: d.anio || 1958, clubes, paises, relleno: !!d.relleno, retirados: [], libres: [], historia: [], fichajes: [],
      derbis: d.derbis || [],
      nacionDT: d.nacionDT || {},
      // Jugadores reales que entran después de 1958-59 y clubes que subieron de verdad desde Tercera.
      // Copa de Europa con datos reales (solo 1958-59 por ahora): clubes extranjeros y cuadro del sorteo real.
      europa: d.europa ? [].concat(d.europa) : [],
      debutantes, vistosInicio, ascensos: (d.debutantes && d.debutantes.ascensos) || {},
      records: { libro: [], liga: null, partido: null, equipoPts: null, equipoGoles: null }
    };
    constantes(M);
    return M;
  }

  // Una temporada completa: tres ligas, promoción y Copa.
  function jugarTemporada(M, semilla) {
    const est = Motor.nuevoEstado(M.anio, M.derbis);
    const primera = M.clubes.filter((c) => c.division === 1 && c.pais === 'España');
    const grupos = {};
    M.clubes.filter((c) => c.division === 2 && c.pais === 'España').forEach((c) => (grupos[c.grupo] = grupos[c.grupo] || []).push(c));
    M.clubes.forEach((c) => (c.estiloCalc = null));
    manoDelEntrenador(M);
    // El carácter se nota en el campo (tarjetas, partidos grandes): el motor lo lee de aquí.
    M.clubes.forEach((c) => c.jugadores.forEach((j) => { if (j.car === undefined) j.car = caracterDe(j); }));
    // Reglas de la época: puntos por victoria y cambios permitidos.
    const reg = Epoca.reglas('España', M.anio), fg = caracter('España', M.anio);
    const T = Motor.temporada(primera, { semilla, anio: M.anio, estado: est, derbis: M.derbis, puntosVictoria: reg.puntosVictoria, cambios: reg.cambios, factorGoles: fg });
    const seg = Object.keys(grupos).sort().map((g, i) => ({ grupo: g, T: Motor.temporada(grupos[g], { semilla: semilla + 11 + i, anio: M.anio, estado: est, derbis: M.derbis, puntosVictoria: reg.puntosVictoria, cambios: reg.cambios, factorGoles: fg }) }));

    // Promoción: 13.º y 14.º de Primera contra los segundos de cada grupo, a ida y vuelta.
    const n = T.tabla.length;
    // Sin Segunda en la partida (épocas con solo Primera) no hay descenso directo ni promoción: lo resuelve categorias().
    const bajan = seg.length ? T.tabla.slice(n - 2).map((t) => t.equipo) : [];
    const aspirantes = seg.map((s) => s.T.tabla.map((t) => t.equipo).filter((c) => !esFilial(c)));
    const suben = aspirantes.map((xs) => xs[0]).filter(Boolean);
    const segundos = aspirantes.map((xs) => xs[1]).filter(Boolean);
    const promos = [];
    [T.tabla[n - 4], T.tabla[n - 3]].forEach((t, i) => {
      const rival = segundos[i];
      if (!rival || !t) return;
      const C = Motor.copa([t.equipo, rival], { semilla: semilla + 31 + i, anio: M.anio + 1, estado: est, finalUnica: false, nombre: 'Promoción', cambios: reg.cambios });
      promos.push({ primera: t.equipo.nombre, segunda: rival.nombre, cruce: C.rondas[0].cruces[0], ganador: C.campeon, C });
    });
    // Un país que pasa de ligas regionales a una liga nacional (Alemania en 1963) la crea antes de empezar.
    M.paises.forEach((P) => unificar(M, P));
    // Las demás ligas de la partida, cada una con las reglas de su país en ese año.
    const otros = M.paises.map((P, i) => jugarPais(M, P, semilla + 1000 * (i + 1), est));
    // Copa de Europa: los clubes españoles de la partida contra los extranjeros reales, con el cuadro del sorteo real.
    let E = Epoca.hayCompeticion('Copa de Europa', M.anio) ? M.europa.find((x) => x.anio === M.anio) : null;
    // Sin datos del sorteo de ese año, la Copa de Europa se juega igual: los campeones de la partida, el vigente
    // y, de los países que no se juegan, el último club que tenemos de cada uno.
    if (!E && Epoca.hayCompeticion('Copa de Europa', M.anio)) E = europaSinDatos(M);
    let EU = null;
    if (E) {
      // Los españoles salen de la partida: el campeón de Liga del año anterior y el campeón de Europa vigente.
      // Si el vigente es extranjero y esa edición no lo trae, juega con la última plantilla real que tengamos de él.
      const prev = M.historia[M.historia.length - 1];
      // Plazas de cada país según el año: solo el campeón hasta 1996; después, hasta cuatro por liga (Liga de Campeones).
      const plazas = (pais) => Math.max(1, Epoca.plazasEuropa(pais, M.anio) || 1);
      let nombres = E.espanoles || [prev && prev.campeon, prev && prev.europa].concat(prev ? prev.R.T.tabla.slice(1, plazas('España')).map((t) => t.nombre) : []).filter(Boolean);
      // Si el campeón de Liga es también el vigente, España manda además a su subcampeón (como el Atlético en 1958-59).
      if (!E.espanoles && prev && prev.campeon === prev.europa) nombres = nombres.concat(prev.R.T.tabla[1].nombre);
      const vigente = prev && prev.europa;
      // Los que entraron solo porque el vigente real ocupó una plaza juegan solo si el vigente de la partida es ese club.
      const eqs = E.clubes.filter((c) => !c.siVigente || c.siVigente === vigente).map((c) => (M.clubes.includes(c) ? c : JSON.parse(JSON.stringify(c))));
      [...new Set(nombres)].forEach((n) => {
        if (eqs.some((c) => c.nombre === n)) return;
        const esp = M.clubes.find((c) => c.nombre === n);
        const fuera = !esp && M.europa.filter((x) => x.anio < M.anio).reverse().map((x) => x.clubes.find((c) => c.nombre === n)).find(Boolean);
        if (esp) eqs.push(esp); else if (fuera) eqs.push(JSON.parse(JSON.stringify(fuera)));
      });
      // Países que también se juegan en la partida: con el sorteo real (1958-59) juegan sus clubes de la partida;
      // después, en lugar de los participantes reales va el campeón de la partida.
      otros.forEach((o, i) => {
        const delPais = (c) => (PAIS_EUROPA[c.pais] || c.pais) === o.pais;
        eqs.forEach((c, k) => {
          const propio = delPais(c) && !M.clubes.includes(c) && M.clubes.find((x) => x.nombre === c.nombre && x.pais === o.pais);
          if (propio) eqs[k] = propio;
        });
        const ant = prev && prev.otros && prev.otros[i];
        if (NO_EUROPA.includes(o.pais)) return;
        if (E.cuadro || !ant || !ant.campeon) return;
        const reales = eqs.filter((c) => delPais(c) && c.nombre !== vigente);
        if (!reales.length && !E.sinDatos) return;
        reales.forEach((c) => eqs.splice(eqs.indexOf(c), 1));
        const van = [ant.campeon].concat(ant.campeon === vigente && ant.subcampeon ? [ant.subcampeon] : [], (ant.puestos || []).slice(1, plazas(o.pais)));
        van.forEach((n) => { const c = M.clubes.find((x) => x.nombre === n); if (c && !eqs.includes(c) && !eqs.some((x) => x.nombre === n)) eqs.push(c); });
      });
      // Los clubes de países que no se juegan salen de la última plantilla real que tenemos (años 60) y no envejecen:
      // sin datos de ese año no pueden pasar de aspirantes, por debajo del nivel medio de los clubes de la partida.
      if (E.sinDatos) {
        const mios = eqs.filter((c) => M.clubes.includes(c)).map((c) => Motor.fuerzaBruta(c)).sort((a, b) => a - b);
        const medio = mios.length ? mios[Math.floor(mios.length / 2)] : 0;
        const enJuego = new Set(); M.clubes.forEach((c) => c.jugadores.forEach((j) => enJuego.add(j.n)));
        if (medio) eqs.forEach((c) => {
          if (M.clubes.includes(c)) return;
          if (c.generado) return plantillaExtranjera(c, medio * c.generado * FUERA_RELATIVO, M.anio, enJuego);
          const delta = medio * (0.86 + 0.08 * ((hashN(c.nombre + M.anio, 3) % 1000) / 1000)) - Motor.fuerzaBruta(c);
          if (delta < 0) c.jugadores.forEach((j) => { j.niv += delta; });
        });
      }
      // Liga de Campeones: dos grupos desde 1991, cuatro desde 1994 y ocho desde 1999 (si hay equipos para llenarlos).
      const grupos = M.anio >= 1999 ? 8 : M.anio >= 1994 ? 4 : M.anio >= 1991 ? 2 : 0;
      // En Europa la diferencia de nivel pesa algo más que en la liga: los grandes se guardan lo mejor para estas noches.
      // Los Reyes de Europa se crecen en estas noches.
      const reyes = [];
      // Y hay quien nació para esta copa: la constante 'europa' (Cristiano, «Mr. Champions»).
      eqs.forEach((c) => c.jugadores.forEach((j) => { const K = !j.relleno && CONSTANTES[j.n]; const v = 4 * gradoDe(j, 'europa') + (K && K.europa ? 30 : 0) + (caracterDe(j) === 'frio' ? 10 : 0); if (v) { reyes.push([j, v]); j.temp = (j.temp || 0) + v; } }));
      // Y contagia a los suyos: con él en plenitud (22 a 37 años), todo su equipo sube un punto en Europa.
      eqs.forEach((c) => { const lider = c.jugadores.find((j) => !j.relleno && CONSTANTES[j.n] && CONSTANTES[j.n].europa && M.anio - anioNac(j) >= 22 && M.anio - anioNac(j) <= 37);
        if (!lider) return;
        // Cuantas menos lleva para su edad (el plan son cinco a los 33), más aprieta; con las cinco ganadas, se relaja.
        const edad = M.anio - anioNac(lider), van = lider.copasEuropa || 0, meta = CONSTANTES[lider.n].europa;
        const debe = Math.max(0, Math.min(meta, meta * (edad - 20) / 11) - van);
        const extra = van >= meta ? 8 : Math.min(160, 15 + 45 * debe);
        c.jugadores.forEach((j) => { reyes.push([j, extra]); j.temp = (j.temp || 0) + extra; }); });
      // La mística: hay camisetas que en esta copa pesan más (el Madrid sobre todo), y jugadores a los que se les da o se les resiste.
      eqs.forEach((c) => { const v = MISTICA_EUROPA[c.nombre]; if (v) c.jugadores.forEach((j) => { reyes.push([j, v]); j.temp = (j.temp || 0) + v; }); });
      eqs.forEach((c) => c.jugadores.forEach((j) => { const v = !j.relleno && NOCHES_EUROPA[j.n]; if (v) { reyes.push([j, v]); j.temp = (j.temp || 0) + v; } }));
      // Los entrenadores especialistas en eliminatorias sacan un punto más a los suyos en Europa.
      eqs.forEach((c) => { const dt = c.entrenadores && c.entrenadores[0], don = dt ? donDT(dt.nombre) : null, v = (manoDe(c) === 'ganador' ? 8 : 0) + (don === 'orejona' ? 14 : don === 'special' ? 8 : 0); if (v) c.jugadores.forEach((j) => { reyes.push([j, v]); j.temp = (j.temp || 0) + v; }); });
      const escalaLiga = Motor.P.escala;
      Motor.P.escala = escalaLiga * (M.anio >= 1992 ? CONTRASTE_EUROPA_HOY : CONTRASTE_EUROPA);
      try {
        EU = Motor.copa(eqs, { semilla: semilla + 61, anio: M.anio + 1, estado: est, nombre: E.nombre, cuadro: E.cuadro, cambios: reg.cambios, grupos, liga: M.anio >= 2024 });
      } finally { Motor.P.escala = escalaLiga; reyes.forEach(([j, v]) => { j.temp -= v; }); }
      if (EU.campeonEq) EU.campeonEq.jugadores.forEach((j) => { if (!j.relleno && CONSTANTES[j.n] && CONSTANTES[j.n].europa) j.copasEuropa = (j.copasEuropa || 0) + 1; });
      EU.goleadorReal = E.goleadorReal;
    }
    // Copa del Generalísimo: todos los clubes de Primera y Segunda.
    const C = Motor.copa(M.clubes.filter((c) => c.division <= 2 && c.pais === 'España'), { semilla: semilla + 41, anio: M.anio + 1, estado: est, nombre: Epoca.nombre('copa', 'España', M.anio) || 'Copa', derbis: M.derbis, cambios: reg.cambios, factorGoles: fg });
    // Con su propio estado de temporada: sus semanas no curan lesiones ni cansan de cara a la liga o al Mundial.
    const OC = otrasCopas(M, semilla, Motor.nuevoEstado(M.anio, M.derbis), { EU }, reg.cambios);
    const comps = [{ nombre: 'Liga', jugadores: T.jugadores, campeon: T.tabla[0].equipo }]
      .concat(seg.map((s) => ({ nombre: 'Segunda', jugadores: s.T.jugadores, campeon: s.T.tabla[0].equipo })))
      .concat(promos.map((p) => ({ nombre: 'Promoción', jugadores: p.C.jugadores })))
      .concat(EU ? [{ nombre: 'Europa', jugadores: EU.jugadores, campeon: EU.campeonEq }] : [])
      .concat(OC.UEFA ? [{ nombre: 'UEFA', jugadores: OC.UEFA.jugadores, campeon: OC.UEFA.campeonEq }] : [])
      .concat(OC.RECOPA ? [{ nombre: 'Recopa', jugadores: OC.RECOPA.jugadores, campeon: OC.RECOPA.campeonEq }] : [])
      .concat(OC.SUPER ? [{ nombre: 'Supercopa de Europa', jugadores: OC.SUPER.jugadores, campeon: OC.SUPER.campeonEq }] : [])
      .concat((OC.SUPERNAC || []).map((C) => ({ nombre: 'Supercopa', jugadores: C.jugadores, campeon: C.campeonEq })))
      .concat(OC.LIB ? [{ nombre: 'Libertadores', jugadores: OC.LIB.jugadores, campeon: OC.LIB.campeonEq }] : [])
      .concat(OC.INTER ? [{ nombre: 'Intercontinental', jugadores: OC.INTER.jugadores, campeon: OC.INTER.campeonEq }] : [])
      .concat([{ nombre: 'Copa', jugadores: C.jugadores, campeon: C.campeonEq }])
      .concat(...otros.map((o) => o.ligas.map((l) => ({ nombre: l.grupo, jugadores: l.T.jugadores, campeon: l.nivel === 1 ? l.T.tabla[0].equipo : null }))
        .concat(o.F ? [{ nombre: o.F.nombre, jugadores: o.F.jugadores, campeon: o.F.campeonEq }] : [])
        .concat(o.C ? [{ nombre: o.C.nombre, jugadores: o.C.jugadores, campeon: o.C.campeonEq }] : [])));
    const G = Motor.global(comps);
    // Premios de cada país con los jugadores de sus clubes (el mejor de España no puede ser uno de Italia).
    const dePais = (p) => G.filter((x) => x.eq.pais === p);
    const premios = Motor.premios(T, dePais('España'), M.anio + 1);
    // Con varias ligas arriba (Oberligen, estatales de Brasil) los premios del país se dan juntando a sus jugadores.
    otros.forEach((o) => {
      const top = o.ligas.filter((l) => l.nivel === 1);
      const liga = top.length === 1 ? top[0].T : { jugadores: top.flatMap((l) => l.T.jugadores), tabla: [{ pj: Math.min(...top.map((l) => l.T.tabla[0].pj)) }] };
      if (top.length) o.premios = Motor.premios(liga, dePais(o.pais), M.anio + 1);
    });
    // Ganar fuera también da nombre.
    [[OC.UEFA, 10], [OC.RECOPA, 10], [OC.SUPER, 3], [OC.LIB, 14], [OC.INTER, 5]].forEach(([X, v]) => { const c = X && M.clubes.find((y) => y === X.campeonEq); if (c) c.prestigio = Math.min(1000, c.prestigio + v); });
    return { anio: M.anio, reglas: reg, T, seg, promos, C, EU, UEFA: OC.UEFA || null, RECOPA: OC.RECOPA || null, SUPER: OC.SUPER || null, SUPERNAC: OC.SUPERNAC || [], LIB: OC.LIB || null, INTER: OC.INTER || null, G, premios, bajan, suben, est, otros };
  }

  // Carácter de cada liga frente a la media de su época: el catenaccio italiano desde los 60, el fútbol directo inglés y alemán.
  // Se interpola entre años (1 = media de la época; los goles de la época ya los pone el motor).
  const CARACTER = {
    Italia: [[1930, 0.97], [1958, 0.93], [1962, 0.82], [1975, 0.78], [1990, 0.86], [2005, 0.97], [2026, 1]],
    Inglaterra: [[1930, 1.06], [1970, 1.02], [2000, 1], [2026, 1.02]],
    Alemania: [[1930, 1.04], [1963, 1.08], [1990, 1.03], [2026, 1.05]],
    Francia: [[1930, 1], [1970, 0.97], [2000, 0.94], [2026, 0.98]],
    Portugal: [[1930, 1.02], [2026, 0.97]],
    Argentina: [[1930, 1.02], [1970, 0.95], [2000, 0.93], [2026, 0.93]],
    Brasil: [[1930, 1.03], [1980, 0.95], [2026, 0.95]],
    España: [[1930, 1], [2026, 1]]
  };
  function caracter(pais, anio) {
    const t = CARACTER[pais]; if (!t) return 1;
    if (anio <= t[0][0]) return t[0][1];
    for (let i = 1; i < t.length; i++) if (anio <= t[i][0]) { const [a, fa] = t[i - 1], [b, fb] = t[i]; return fa + (fb - fa) * (anio - a) / (b - a); }
    return t[t.length - 1][1];
  }

  const NO_EUROPA = ['Argentina', 'Brasil'];
  // Clubes de los países que no se juegan en la partida, para que la Copa de Europa no sea solo de seis ligas.
  // No tenemos sus plantillas: salen con jugadores de relleno (*) y una fuerza relativa a los campeones de la partida
  // (1 = como ellos). [club, país, fuerza normal, [desde, hasta, fuerza en sus mejores años]...]
  const EXTRANJEROS = [
    ['Ajax', 'Países Bajos', 0.92, [1966, 1973, 1.04], [1993, 1996, 1.01], [2017, 2019, 0.97]], ['Feyenoord', 'Países Bajos', 0.88, [1968, 1971, 1]],
    ['PSV Eindhoven', 'Países Bajos', 0.9, [1986, 1989, 1]], ['Celtic', 'Escocia', 0.88, [1965, 1971, 1.01]], ['Rangers', 'Escocia', 0.87],
    ['Anderlecht', 'Bélgica', 0.88, [1975, 1978, 0.95]], ['Brujas', 'Bélgica', 0.85, [1976, 1978, 0.96]],
    ['Estrella Roja', 'Yugoslavia', 0.88, [1989, 1991, 1.01]], ['Dinamo Zagreb', 'Yugoslavia', 0.83], ['Steaua Bucarest', 'Rumanía', 0.86, [1985, 1989, 1]],
    ['Dinamo Kiev', 'Unión Soviética', 0.88, [1974, 1976, 0.97], [1985, 1987, 0.97], [1997, 1999, 0.97]], ['Spartak Moscú', 'Unión Soviética', 0.86],
    ['Shakhtar Donetsk', 'Ucrania', 0.84, [2007, 2019, 0.91]], ['Zenit', 'Rusia', 0.84, [2007, 2015, 0.9]],
    ['Galatasaray', 'Turquía', 0.85, [1998, 2001, 0.95]], ['Fenerbahçe', 'Turquía', 0.84], ['Olympiacos', 'Grecia', 0.84], ['Panathinaikos', 'Grecia', 0.85, [1970, 1971, 0.96]],
    ['Sparta Praga', 'Checoslovaquia', 0.84], ['Austria de Viena', 'Austria', 0.83], ['Rapid de Viena', 'Austria', 0.83], ['Basilea', 'Suiza', 0.82],
    ['Copenhague', 'Dinamarca', 0.82], ['Rosenborg', 'Noruega', 0.82, [1995, 1999, 0.9]], ['IFK Göteborg', 'Suecia', 0.84, [1981, 1987, 0.93]], ['Malmö', 'Suecia', 0.82, [1978, 1979, 0.95]],
    ['CSKA Sofía', 'Bulgaria', 0.83], ['Ferencváros', 'Hungría', 0.83], ['Legia Varsovia', 'Polonia', 0.82]
  ];
  // Países que nacen más tarde (o dejan de existir): sus clubes solo entran en esos años.
  const EXTRANJERO_AÑOS = { 'Shakhtar Donetsk': [1992, 9999], 'Zenit': [1992, 9999], 'Copenhague': [1992, 9999], 'Spartak Moscú': [1955, 9999] };
  const fuerzaExtranjero = (x, anio) => { let f = x[2]; x.slice(3).forEach(([a, b, v]) => { if (anio >= a && anio <= b) f = v; }); return f; };
  // Jugadores reales de clubes de fuera de la partida, por años (herramientas/plantillas_fuera.py los saca de datos_fuente/fuera/).
  // [nombre, puesto, rol, desde, hasta, año de nacimiento, país]
  /*PLANTILLAS_FUERA*/
  const PLANTILLAS_FUERA = {
    "Ajax": [["Heinz Stuy","POR","POR",1965,1979,1945,"Países Bajos"],["Wim Suurbier","DEF","DEF",1965,1977,1945,"Países Bajos"],["Ruud Krol","DEF","DEF",1966,1979,1949,"Países Bajos"],["Barry Hulshoff","DEF","DEF",1966,1976,1946,"Países Bajos"],["Velibor Vasović","DEF","DEF",1966,1971,1939,"Yugoslavia"],["Horst Blankenburg","DEF","DEF",1970,1975,1947,"Alemania"],["Arie Haan","MED","MED",1969,1976,1948,"Países Bajos"],["Johan Neeskens","MED","MED",1970,1974,1951,"Países Bajos"],["Gerrie Mühren","MED","MED",1969,1975,1946,"Países Bajos"],["Sjaak Swart","DEL","EXT",1958,1972,1938,"Países Bajos"],["Johnny Rep","DEL","EXT",1972,1975,1951,"Países Bajos"],["Piet Keizer","DEL","EXT",1961,1975,1943,"Países Bajos"],["Johan Cruyff","DEL","DC",1964,1973,1947,"Países Bajos"],["Dick van Dijk","DEL","DC",1967,1973,1946,"Países Bajos"],["Edwin van der Sar","POR","POR",1990,1999,1970,"Países Bajos"],["Frank de Boer","DEF","DEF",1988,1999,1970,"Países Bajos"],["Danny Blind","DEF","DEF",1986,1999,1961,"Países Bajos"],["Frank Rijkaard","MED","MED",1987,1995,1962,"Países Bajos"],["Clarence Seedorf","MED","MED",1992,1995,1976,"Países Bajos"],["Edgar Davids","MED","MED",1991,1996,1973,"Países Bajos"],["Jari Litmanen","MED","MED",1991,1999,1971,"Finlandia"],["Marc Overmars","DEL","EXT",1992,1997,1973,"Países Bajos"],["Finidi George","DEL","EXT",1993,1996,1971,"Nigeria"],["Patrick Kluivert","DEL","DC",1994,1997,1976,"Países Bajos"]],
    "Anderlecht": [["Jean Trappeniers","POR","POR",1958,1971,1942,"Bélgica"],["Jacky Munaron","POR","POR",1977,1988,1956,"Bélgica"],["Georges Heylens","DEF","DEF",1958,1973,1941,"Bélgica"],["Jean Cornelis","DEF","DEF",1958,1971,1941,"Bélgica"],["Laurent Verbiest","DEF","DEF",1958,1968,1939,"Bélgica"],["Gilbert Van Binst","DEF","DEF",1972,1979,1951,"Bélgica"],["Hugo Broos","DEF","DEF",1971,1984,1952,"Bélgica"],["Morten Olsen","DEF","DEF",1980,1986,1949,"Dinamarca"],["Luka Peruzović","DEF","DEF",1979,1987,1952,"Yugoslavia"],["Pierre Hanon","MED","MED",1958,1966,1936,"Bélgica"],["Martin Lippens","MED","MED",1958,1967,1934,"Bélgica"],["Franky Vercauteren","DEL","EXT",1975,1986,1956,"Bélgica"],["Arie Haan","MED","MED",1974,1981,1948,"Países Bajos"],["Ludo Coeck","MED","MED",1972,1987,1955,"Bélgica"],["Juan Lozano","MED","MED",1981,1987,1955,"España"],["Enzo Scifo","MED","MED",1982,1986,1966,"Bélgica"],["Paul Van Himst","DEL","DC",1959,1972,1943,"Bélgica"],["Jan Mulder","DEL","DC",1964,1972,1945,"Países Bajos"],["Jef Jurion","MED","MED",1958,1967,1937,"Bélgica"],["Jacques Stockman","DEL","DC",1958,1967,1938,"Bélgica"],["Wilfried Puis","DEL","EXT",1962,1971,1943,"Bélgica"],["Rob Rensenbrink","DEL","EXT",1973,1978,1947,"Países Bajos"],["François Van der Elst","DEL","EXT",1976,1980,1954,"Bélgica"],["Erwin Vandenbergh","DEL","DC",1981,1986,1959,"Bélgica"]],
    "Celtic": [["Ronnie Simpson","POR","POR",1965,1971,1930,"Escocia"],["Evan Williams","POR","POR",1963,1971,1943,"Escocia"],["Jim Craig","DEF","DEF",1962,1975,1943,"Escocia"],["Danny McGrain","DEF","DEF",1967,1982,1950,"Escocia"],["Tommy Gemmell","DEF","DEF",1959,1973,1943,"Escocia"],["Billy McNeill","DEF","DEF",1958,1975,1940,"Escocia"],["John Clark","DEF","DEF",1959,1971,1941,"Escocia"],["Bobby Murdoch","MED","MED",1961,1976,1944,"Escocia"],["Bertie Auld","MED","MED",1958,1971,1938,"Escocia"],["George Connelly","MED","MED",1964,1978,1949,"Escocia"],["David Hay","MED","MED",1967,1974,1948,"Escocia"],["Jimmy Johnstone","DEL","EXT",1961,1979,1944,"Escocia"],["Bobby Lennox","DEL","EXT",1961,1974,1943,"Escocia"],["Willie Wallace","DEL","DC",1966,1971,1940,"Escocia"],["Stevie Chalmers","DEL","DC",1958,1971,1935,"Escocia"],["John Hughes","DEL","DC",1959,1971,1943,"Escocia"],["Lou Macari","MED","MED",1965,1977,1949,"Escocia"],["Kenny Dalglish","DEL","DC",1969,1977,1951,"Escocia"],["Henrik Larsson","DEL","DC",1997,2004,1971,"Suecia"]]
  };
  /*FIN_PLANTILLAS_FUERA*/
  // Plantilla de un club de fuera: primero sus jugadores reales de ese año (si los tenemos y no están ya jugando en
  // una liga de la partida), en los mejores sitios de su puesto; lo que falte, suplentes anónimos.
  function plantillaExtranjera(c, nivel, anio, enJuego) {
    const P = [['POR', 2], ['DEF', 5], ['MED', 4], ['DEL', 5]];
    const reales = (PLANTILLAS_FUERA[c.nombre] || []).filter((r) => anio >= r[3] && anio < r[4] && anio - r[5] >= 17 && !(enJuego && enJuego.has(r[0])));
    let k = 0;
    c.jugadores = P.flatMap(([pos, n]) => {
      const mios = reales.filter((r) => r[1] === pos).slice(0, n);
      return Array.from({ length: n }, (_, i) => {
        k++;
        const niv = Math.round(nivel * (1.05 - 0.035 * i) * (0.985 + 0.03 * ((hashN(c.nombre + anio, k) % 100) / 100)));
        const r = mios[i];
        if (r) return { n: r[0], pos, nac: `${r[5]}-07-01`, nacion: r[6], niv, tec: niv, pj: 0, g: 0, deFuera: true, rol: r[2] };
        return { n: `Suplente ${k} (${c.nombre})`, pos, nac: `${anio - 23 - (k % 9)}-01-01`, niv, tec: niv, pj: 0, g: 0, relleno: true, rol: pos === 'DEL' ? 'DC' : pos };
      });
    });
  }
  // ---------- Otras copas internacionales: UEFA / Europa League, Libertadores e Intercontinental ----------
  const SUDAMERICANOS = [['Peñarol', 'Uruguay', 0.92, [1960, 1968, 1.02], [1982, 1987, 0.97]], ['Nacional', 'Uruguay', 0.9, [1971, 1971, 1], [1980, 1988, 0.96]], ['Olimpia', 'Paraguay', 0.85, [1979, 1990, 0.95], [2002, 2002, 0.95]],
    ['Colo-Colo', 'Chile', 0.85, [1991, 1991, 0.97]], ['Universidad de Chile', 'Chile', 0.8], ['Universidad Católica', 'Chile', 0.8], ['Atlético Nacional', 'Colombia', 0.85, [1989, 1989, 0.97], [2016, 2016, 0.96]],
    ['América de Cali', 'Colombia', 0.86], ['Millonarios', 'Colombia', 0.8], ['Once Caldas', 'Colombia', 0.78, [2004, 2004, 0.95]], ['Cerro Porteño', 'Paraguay', 0.8], ['Barcelona SC', 'Ecuador', 0.8],
    ['LDU Quito', 'Ecuador', 0.8, [2008, 2008, 0.96]], ['Universitario', 'Perú', 0.78], ['Alianza Lima', 'Perú', 0.77], ['Sporting Cristal', 'Perú', 0.78], ['Bolívar', 'Bolivia', 0.75], ['Caracas', 'Venezuela', 0.7]];
  // Clasificados de un país por la tabla del año anterior (o por prestigio en la primera temporada), quitando a los que ya juegan otra copa.
  function clasificados(M, pais, cuantos, fuera) {
    const prev = M.historia[M.historia.length - 1];
    let nombres;
    if (!prev) nombres = M.clubes.filter((c) => c.pais === pais && c.division === 1).sort((a, b) => b.prestigio - a.prestigio).map((c) => c.nombre);
    else if (pais === 'España') nombres = prev.R.T.tabla.map((t) => t.nombre);
    else { const o = prev.otros.find((x) => x.pais === pais); nombres = o ? [o.campeon].concat(o.puestos || []) : []; if (o && o.puestos && o.puestos.length < 3) nombres = nombres.concat(M.clubes.filter((c) => c.pais === pais && c.division === 1).sort((a, b) => b.prestigio - a.prestigio).map((c) => c.nombre)); }
    const vistos = new Set(fuera);
    return [...new Set(nombres.filter(Boolean))].filter((n) => !vistos.has(n)).map((n) => M.clubes.find((c) => c.nombre === n && c.division === 1)).filter(Boolean).slice(0, cuantos);
  }
  const rellenoDeFuera = (M, lista, usados, cuantos, eqs, rebaja) => {
    const mios = eqs.map((c) => Motor.fuerzaBruta(c)).sort((a, b) => a - b), medio = mios.length ? mios[Math.floor(mios.length / 2)] : 700;
    const enJuego = new Set(); M.clubes.forEach((c) => c.jugadores.forEach((j) => enJuego.add(j.n)));
    return lista.filter((x) => { const [a, b] = EXTRANJERO_AÑOS[x[0]] || [0, 9999]; return !usados.has(x[0]) && M.anio >= a && M.anio <= b && !M.paises.some((P) => P.pais === x[1]) && x[1] !== 'España'; })
      .map((x) => ({ x, f: fuerzaExtranjero(x, M.anio), orden: fuerzaExtranjero(x, M.anio) + 0.08 * ((hashN(x[0] + M.anio, 9) % 100) / 100) })).sort((a, b) => b.orden - a.orden).slice(0, cuantos)
      .map(({ x, f }) => { const c = { nombre: x[0], pais: x[1], prestigio: Math.round(880 * f * rebaja), generado: f, entrenadores: [], jugadores: [] }; plantillaExtranjera(c, medio * f * rebaja, M.anio, enJuego); return c; });
  };
  const SUPERCOPA_DESDE = { España: 1982, Italia: 1988, Inglaterra: 1930, Alemania: 1987, Francia: 1955, Portugal: 1979 };
  const SUPERCOPA_NOMBRE = { España: 'Supercopa de España', Italia: 'Supercoppa Italiana', Inglaterra: 'Charity Shield', Alemania: 'Supercopa de Alemania', Francia: 'Supercopa de Francia', Portugal: 'Supertaça' };
  function otrasCopas(M, semilla, est, R, cambios) {
    const out = {};
    const enEuropa = new Set(R.EU ? R.EU.rondas.flatMap((ro) => ro.cruces.flatMap((c) => [c.a, c.b])).filter(Boolean) : []);
    // Recopa de Europa (1960-1999): los campeones de copa de la temporada anterior. Si el campeón ya juega la Copa de Europa, va el mejor de la liga que quede libre.
    const europeos = ['España'].concat(M.paises.map((P) => P.pais)).filter((p) => !NO_EUROPA.includes(p));
    const prev = M.historia[M.historia.length - 1];
    let deRecopa = [];
    if (M.anio >= 1960 && M.anio <= 1998) {
      deRecopa = europeos.map((p) => {
        const nombre = !prev ? null : p === 'España' ? prev.copa : (prev.otros.find((x) => x.pais === p) || {}).copa;
        const c = nombre && !enEuropa.has(nombre) ? M.clubes.find((x) => x.nombre === nombre && x.division === 1) : null;
        return c || clasificados(M, p, 1, enEuropa)[0];
      }).filter(Boolean);
      // Del resto de Europa, un tercio de los clubes (distinto cada año) llega como campeón de copa; los demás quedan para la UEFA.
      const total = deRecopa.length > 8 ? 32 : 16, turno = EXTRANJEROS.filter((x) => hashN(x[0] + M.anio, 5) % 3 === 0);
      if (deRecopa.length >= 2) deRecopa = deRecopa.concat(rellenoDeFuera(M, turno, enEuropa, total - deRecopa.length, deRecopa, 0.9));
      deRecopa.forEach((c) => enEuropa.add(c.nombre));
    }
    // Copa de la UEFA (desde 1971; Europa League desde 2009): los mejores de cada liga que no juegan la Copa de Europa.
    if (M.anio >= 1971) {
      const eqs = europeos.flatMap((p) => clasificados(M, p, ['España', 'Italia', 'Inglaterra', 'Alemania'].includes(p) ? 4 : 3, enEuropa));
      if (eqs.length >= 4) {
        const todos = eqs.concat(rellenoDeFuera(M, EXTRANJEROS, enEuropa, 32 - eqs.length, eqs, 0.95));
        out.UEFA = Motor.copa(todos, { semilla: semilla + 71, anio: M.anio + 1, estado: est, nombre: M.anio >= 2009 ? 'Europa League' : 'Copa de la UEFA', finalUnica: M.anio >= 1997, cambios });
      }
    }
    if (deRecopa.length >= 2) {
      out.RECOPA = Motor.copa(deRecopa, { semilla: semilla + 75, anio: M.anio + 1, estado: est, nombre: 'Recopa de Europa', finalUnica: true, cambios });
    }
    // Supercopa de Europa (desde 1973): el campeón de Europa contra el de la Recopa; desde 2000, contra el de la UEFA.
    const rival = out.RECOPA ? out.RECOPA.campeonEq : out.UEFA ? out.UEFA.campeonEq : null;
    if (M.anio >= 1973 && R.EU && R.EU.campeonEq && rival && rival !== R.EU.campeonEq) {
      out.SUPER = Motor.copa([R.EU.campeonEq, rival], { semilla: semilla + 77, anio: M.anio + 1, estado: est, nombre: 'Supercopa de Europa', finalUnica: true, penaltis: true, cambios });
    }
    // Supercopa de cada país: el campeón de liga contra el de copa del año anterior (si es el mismo, contra el segundo de la liga).
    out.SUPERNAC = [];
    if (prev) europeos.forEach((p, k) => {
      if (M.anio < (SUPERCOPA_DESDE[p] || 9999)) return;
      const o = p === 'España' ? { campeon: prev.campeon, copa: prev.copa, sub: prev.R && prev.R.T ? prev.R.T.tabla[1].nombre : null } : (() => { const x = prev.otros.find((y) => y.pais === p) || {}; return { campeon: x.campeon, copa: x.copa, sub: x.subcampeon }; })();
      const club = (n) => n && M.clubes.find((c) => c.nombre === n && c.pais === p);
      const A = club(o.campeon), B = club(o.copa && o.copa !== o.campeon ? o.copa : o.sub);
      if (!A || !B || A === B) return;
      const C = Motor.copa([A, B], { semilla: semilla + 83 + k, anio: M.anio + 1, estado: est, nombre: SUPERCOPA_NOMBRE[p] || 'Supercopa', finalUnica: true, penaltis: true, cambios });
      C.pais = p; out.SUPERNAC.push(C);
    });
    // Copa Libertadores (desde 1960): los mejores de Argentina y Brasil contra los grandes del resto de Sudamérica.
    if (M.anio >= 1960 && M.paises.some((P) => NO_EUROPA.includes(P.pais))) {
      const eqs = NO_EUROPA.filter((p) => M.paises.some((P) => P.pais === p)).flatMap((p) => clasificados(M, p, M.anio >= 2000 ? 5 : M.anio >= 1966 ? 3 : 2, []));
      if (eqs.length >= 2) {
        const total = M.anio >= 2000 ? 16 : 8;
        const todos = eqs.concat(rellenoDeFuera(M, SUDAMERICANOS, new Set(), Math.max(0, total - eqs.length), eqs, M.anio >= 1995 ? 0.9 : 1));
        out.LIB = Motor.copa(todos, { semilla: semilla + 73, anio: M.anio + 1, estado: est, nombre: 'Copa Libertadores', finalUnica: M.anio >= 2019, golesFuera: false, cambios });
      }
    }
    // Copa Intercontinental (Mundial de Clubes desde 2005): el campeón de Europa contra el de América, a un partido.
    if (R.EU && R.EU.campeonEq && out.LIB && out.LIB.campeonEq) {
      out.INTER = Motor.copa([R.EU.campeonEq, out.LIB.campeonEq], { semilla: semilla + 79, anio: M.anio + 1, estado: est, nombre: M.anio >= 2005 ? 'Mundial de Clubes' : 'Copa Intercontinental', finalUnica: true, penaltis: true, cambios });
    }
    return out;
  }

  function europaSinDatos(M) {
    const ultima = M.europa.filter((x) => x.anio < M.anio).sort((a, b) => b.anio - a.anio);
    const enPartida = new Set(M.paises.map((P) => P.pais).concat('España'));
    const porPais = new Map();
    ultima.forEach((ed) => ed.clubes.forEach((c) => { const p = PAIS_EUROPA[c.pais] || c.pais; if (!enPartida.has(p) && !porPais.has(p) && !c.siVigente) porPais.set(p, c); }));
    // Las plantillas reales que tenemos son de 1958-63: pasados cinco años ya no valen y entran los clubes de la lista.
    const viejas = !ultima.length || M.anio - ultima[0].anio > 5;
    const clubes = viejas ? [] : [...porPais.values()];
    // Hasta 1996 entra solo el campeón de cada país (uno por país, el más fuerte de esos años, con algo de turno);
    // después, los catorce mejores, que es más o menos lo que dejaban libres las grandes ligas.
    let fuera = EXTRANJEROS.filter((x) => {
      const [a, b] = EXTRANJERO_AÑOS[x[0]] || [0, 9999];
      return !(enPartida.has(x[1]) || M.anio < a || M.anio > b || clubes.some((c) => c.nombre === x[0]) || (!viejas && porPais.has(x[1])));
    }).map((x) => ({ x, f: fuerzaExtranjero(x, M.anio), orden: fuerzaExtranjero(x, M.anio) + 0.05 * ((hashN(x[0] + M.anio, 5) % 100) / 100) }))
      .sort((a, b) => b.orden - a.orden);
    // El campeón vigente defiende el título aunque no sea el campeón de su país.
    const vig = M.historia.length ? M.historia[M.historia.length - 1].europa : null;
    if (M.anio < 1997) { const visto = new Set(); fuera = fuera.filter(({ x }) => (!visto.has(x[1]) && visto.add(x[1])) || x[0] === vig); } else fuera = fuera.filter(({ x }, i) => i < 14 || x[0] === vig);
    fuera.forEach(({ x, f }) => clubes.push({ nombre: x[0], pais: x[1], prestigio: Math.round(900 * f), generado: f, entrenadores: [], jugadores: [] }));
    const prev = M.historia[M.historia.length - 1];
    let espanoles = null;
    if (!prev) {
      // Primera temporada de la partida sin datos: va el club de más prestigio de cada liga europea de la partida.
      const plazas = (pais) => Math.max(1, Epoca.plazasEuropa(pais, M.anio) || 1);
      espanoles = M.clubes.filter((c) => c.pais === 'España' && c.division === 1).sort((a, b) => b.prestigio - a.prestigio).slice(0, plazas('España')).map((c) => c.nombre);
      M.paises.filter((P) => !NO_EUROPA.includes(P.pais)).forEach((P) => {
        M.clubes.filter((x) => x.pais === P.pais && x.division === 1).sort((a, b) => b.prestigio - a.prestigio).slice(0, plazas(P.pais)).forEach((c) => clubes.push(c));
      });
    }
    return { anio: M.anio, nombre: Epoca.nombre('europa', null, M.anio) || 'Copa de Europa', clubes, espanoles, sinDatos: true };
  }

  // Un dato que cambia con los años: número fijo o { año: valor } (vale el último año que haya empezado).
  const porAnio = (x, anio) => { if (typeof x !== 'object' || x === null) return x; let v; Object.keys(x).map(Number).sort((a, b) => a - b).forEach((k) => { if (anio >= k) v = x[k]; }); return v; };
  // La Copa de Europa llama a algunos países de otra forma que las ligas.
  const PAIS_EUROPA = { RFA: 'Alemania' };

  // De ligas regionales a una liga nacional (Bundesliga, 1963): entran los mejores de cada región, repartidos según
  // la fuerza de cada una (de verdad: 5 del Oeste, 5 del Sur, 3 del Norte, 2 del Suroeste y 1 de Berlín);
  // las regionales quedan como segunda categoría y suben los dos mejores campeones.
  function unificar(M, P) {
    const reg = Epoca.reglas(P.pais, M.anio);
    const top = P.grupos.filter((g) => g.nivel === 1);
    if (P.estatales || !reg.clubes || !reg.liga || top.length < 2) return;
    const clubesDe = (g) => M.clubes.filter((c) => c.pais === P.pais && c.grupo === g.nombre && c.division === 1);
    // Puesto de cada club en la última temporada jugada (si la hay) y fuerza de su once.
    const prev = M.historia[M.historia.length - 1], ant = prev && prev.R && prev.R.otros.find((o) => o.pais === P.pais);
    const puesto = new Map();
    if (ant) ant.ligas.forEach((l) => l.T.tabla.forEach((t, i) => puesto.set(t.nombre, i)));
    const valor = (c) => Motor.fuerzaBruta(c) + (c.prestigio || 0) * 0.3 - (puesto.has(c.nombre) ? puesto.get(c.nombre) * 12 : 60);
    const peso = top.map((g) => { const cs = clubesDe(g).map(valor).sort((a, b) => b - a).slice(0, 6); return Math.max(1, cs.reduce((x, y) => x + Math.max(0, y), 0)); });
    const tot = peso.reduce((a, b) => a + b, 0);
    let cupo = peso.map((w) => Math.max(1, Math.floor(reg.clubes * w / tot)));
    while (cupo.reduce((a, b) => a + b, 0) < reg.clubes) { const i = peso.map((w, k) => w / tot * reg.clubes - cupo[k]).reduce((m, v, k, xs) => (v > xs[m] ? k : m), 0); cupo[i]++; }
    while (cupo.reduce((a, b) => a + b, 0) > reg.clubes) cupo[cupo.indexOf(Math.max(...cupo))]--;
    const regional = (n) => n.replace(/^Oberliga/, 'Regionalliga');
    // Lo que estaba debajo de las regionales (si se jugaba) baja un escalón y sale de la partida.
    const segundas = P.grupos.filter((g) => g.nivel >= 2);
    M.clubes.filter((c) => c.pais === P.pais && segundas.some((g) => g.nombre === c.grupo)).forEach((c) => { c.division = 3; c.grupo = P.abajo; });
    top.forEach((g, i) => {
      const cs = clubesDe(g).sort((a, b) => valor(b) - valor(a));
      cs.forEach((c, k) => { if (k < cupo[i]) { c.grupo = reg.liga; c.division = 1; } else { c.grupo = regional(g.nombre); c.division = 2; } });
    });
    P.grupos = [{ nombre: reg.liga, nivel: 1, de: null }].concat(top.map((g) => ({ nombre: regional(g.nombre), nivel: 2, de: reg.liga })));
    P.final = null; P.subenTotal = 2;
  }

  // Una temporada de otro país: sus ligas (una o varias regionales), la fase final si la hay y su copa.
  function jugarPais(M, P, semilla, est) {
    const reg = Epoca.reglas(P.pais, M.anio);
    const base = { pais: P.pais, reglas: reg, ligas: [], F: null, C: null, campeon: null, subcampeon: null, campeones: [] };
    // Sin liga nacional (Brasil antes de 1959) se juegan igual sus campeonatos estatales.
    if (!reg.hayLiga && !P.estatales) return base;
    // El nombre de la liga cambia con los años (First Division → Premier League en 1992) y, al empezar tarde, los clubes
    // llegan con el nombre del grupo de 1958 («Oberliga Nord» para toda la Bundesliga): si hay una sola Primera, lleva el nombre de la época.
    const conClubes = P.grupos.filter((g) => g.nivel === 1 && M.clubes.some((c) => c.pais === P.pais && c.grupo === g.nombre));
    if (reg.hayLiga && reg.liga && conClubes.length === 1 && conClubes[0].nombre !== reg.liga && !P.grupos.some((g) => g.nombre === reg.liga)) {
      const viejo = conClubes[0].nombre;
      M.clubes.forEach((c) => { if (c.pais === P.pais && c.grupo === viejo) c.grupo = reg.liga; });
      P.grupos.forEach((g) => { if (g.nombre === viejo) g.nombre = reg.liga; if (g.de === viejo) g.de = reg.liga; });
    }
    const op = (k) => ({ semilla: semilla + k, anio: M.anio, estado: est, derbis: M.derbis, puntosVictoria: reg.puntosVictoria, cambios: reg.cambios, factorGoles: caracter(P.pais, M.anio) });
    // Un grupo sin clubes ese año (formatos que cambian, como las zonas del Metropolitano argentino) no se juega.
    base.ligas = P.grupos.map((g, i) => ({ g, i, cs: M.clubes.filter((c) => c.pais === P.pais && c.grupo === g.nombre) })).filter((x) => x.cs.length > 1)
      .map(({ g, i, cs }) => ({ grupo: g.nombre, nivel: g.nivel, T: Motor.temporada(cs, op(7 * i + 3)) }));
    const top = base.ligas.filter((l) => l.nivel === 1);
    base.campeones = top.map((l) => ({ grupo: l.grupo, club: l.T.tabla[0].nombre }));
    if (top.length === 1) {
      base.campeon = top[0].T.tabla[0].nombre; base.subcampeon = top[0].T.tabla[1].nombre;
    } else if (P.final && top.length) {
      // Liga por regiones (Alemania antes de 1963): los primeros de cada grupo juegan la fase final.
      const eqs = top.flatMap((l) => l.T.tabla.slice(0, P.final.porGrupo || 2).map((t) => t.equipo));
      base.F = Motor.copa(eqs, { semilla: semilla + 51, anio: M.anio + 1, estado: est, nombre: P.final.nombre, finalUnica: true, cambios: reg.cambios });
      base.campeon = base.F.campeon;
      const fin = base.F.rondas[base.F.rondas.length - 1].cruces[0];
      base.subcampeon = fin ? [fin.a, fin.b].find((n) => n !== base.campeon) : null;
    }
    if (P.copa && (!P.copa.desde || M.anio >= P.copa.desde)) {
      base.C = Motor.copa(M.clubes.filter((c) => c.pais === P.pais && c.division <= 2), { semilla: semilla + 41, anio: M.anio + 1, estado: est, nombre: Epoca.nombre('copa', P.pais, M.anio) || P.copa.nombre, derbis: M.derbis, cambios: reg.cambios, factorGoles: caracter(P.pais, M.anio) });
    }
    // Brasil sin liga nacional: desde 1959 se juega la Taça Brasil entre los mejores de cada estatal (eliminatorias a
    // ida y vuelta) y su ganador es el campeón de Brasil, como lo reconoce la CBF desde 2010.
    if (!base.campeon && top.length > 1 && P.estatales && !base.C && reg.hayLiga) {
      const eqs = top.flatMap((l) => l.T.tabla.slice(0, 4).map((t) => t.equipo));
      base.C = Motor.copa(eqs, { semilla: semilla + 43, anio: M.anio + 1, estado: est, nombre: M.anio < 1971 ? 'Taça Brasil' : (reg.liga || 'Taça Brasil'), cambios: reg.cambios, factorGoles: caracter(P.pais, M.anio) });
    }
    if (!base.campeon && top.length > 1 && P.estatales && base.C) {
      base.campeon = base.C.campeon;
      const fin = base.C.rondas[base.C.rondas.length - 1].cruces[0];
      base.subcampeon = fin ? [fin.a, fin.b].find((n) => n !== base.campeon) : null;
      base.campeonPorCopa = true;
    }
    return base;
  }

  // Un club que sube poco después de empezar la partida trae a sus jugadores reales (el Milan de 1980 estaba en Serie B):
  // antes llegaba vacío, con suplentes inventados y el prestigio de un recién ascendido.
  function conPlantilla(M, c, a) {
    M.vistos = M.vistos || new Set(M.vistosInicio || []);
    (a.plantilla || []).forEach((x) => {
      const k = x.n + '|' + x.nac;
      if (M.vistos.has(k)) return;
      const j = Object.assign({}, x);
      j.rol = Motor.rol(j); j.carrera = []; j.inicio = { niv: j.niv, club: c.nombre }; j.tecReal = j.tec || j.niv; j.nacion = j.pais || c.pais;
      M.vistos.add(k); c.jugadores.push(j);
    });
  }
  // Cambia de categoría a los que bajan, suben o pierden la promoción.
  function categorias(M, R) {
    const mov = [];
    const baja = (c, grupo) => { c.division = 2; c.grupo = grupo; mov.push({ club: c.nombre, a: 'Segunda' }); };
    const sube = (c) => { const g = c.grupo; c.division = 1; c.grupo = 'Primera'; mov.push({ club: c.nombre, a: 'Primera' }); return g; };
    const huecos = R.suben.map((c) => sube(c));
    R.bajan.forEach((c, i) => baja(c, huecos[i] || 'Segunda Norte'));
    R.promos.forEach((p) => {
      if (p.ganador === p.segunda) {
        const s = M.clubes.find((c) => c.nombre === p.segunda), pr = M.clubes.find((c) => c.nombre === p.primera);
        const g = sube(s); baja(pr, g);
      }
    });
    // España sin Segunda en la partida: suben a Primera los que subieron de verdad ese verano y bajan por la cola los que
    // sobren para que la liga tenga los clubes que tuvo ese año (16, 18, 20, 22...). Si faltan, sube el de más prestigio de abajo.
    if (!R.seg.length) {
      const anioSig = M.anio + 1, objetivo = Epoca.reglas('España', anioSig).clubes || R.T.tabla.length;
      const llegan = [];
      (M.ascensos[anioSig] || []).forEach((a) => {
        let c = M.clubes.find((x) => x.nombre === a.nombre);
        if (!c) { c = { nombre: a.nombre, prestigio: a.prestigio, jugadores: [], entrenadores: [], division: 3, grupo: 'Tercera', pais: 'España', nuevo: true }; M.clubes.push(c); conPlantilla(M, c, a); }
        if (c.division !== 1 && llegan.length < objetivo - 4) llegan.push(c);
      });
      const cola = [...R.T.tabla].reverse().map((t) => t.equipo);
      const caen = cola.slice(0, Math.max(0, Math.min(cola.length - 4, R.T.tabla.length + llegan.length - objetivo)));
      caen.forEach((c) => { c.division = 3; c.grupo = 'Tercera'; mov.push({ club: c.nombre, a: 'Segunda' }); });
      const sube1 = (c) => { c.division = 1; c.grupo = 'Primera'; mov.push({ club: c.nombre, a: 'Primera' }); };
      llegan.forEach(sube1);
      const faltan = objetivo - (R.T.tabla.length - caen.length + llegan.length);
      if (faltan > 0) M.clubes.filter((c) => c.pais === 'España' && c.division === 3 && !caen.includes(c) && !MATRIZ[c.nombre]).sort((a, b) => b.prestigio - a.prestigio).slice(0, faltan).forEach(sube1);
    }
    // España con Segunda en la partida: la Primera crece o encoge cuando lo hizo de verdad (16 clubes hasta 1971, luego 18, 20, 22...).
    if (R.seg.length) {
      const objetivo = Epoca.reglas('España', M.anio + 1).clubes || 0;
      const enPrimera = () => M.clubes.filter((c) => c.pais === 'España' && c.division === 1);
      for (let puesto = 0; objetivo && enPrimera().length < objetivo && puesto < 8; puesto++) {
        R.seg.forEach((sg) => {
          const c = sg.T.tabla[puesto] && sg.T.tabla[puesto].equipo;
          const mat = c && MATRIZ[c.nombre] && M.clubes.find((x) => x.nombre === MATRIZ[c.nombre]);
          if (c && c.division === 2 && !mat && enPrimera().length < objetivo) sube(c);
        });
      }
      const cola = [...R.T.tabla].reverse().map((t) => t.equipo).filter((c) => c.division === 1);
      while (objetivo && enPrimera().length > objetivo && cola.length) baja(cola.shift(), R.seg[enPrimera().length % R.seg.length].grupo);
    }
    // Segunda ↔ Tercera: suben los clubes que subieron de verdad ese verano y bajan tantos como suben, por la cola de cada grupo.
    const nuevoAnio = M.anio + 1;
    const tercera = (c) => { mov.push({ club: c.nombre, a: 'Tercera', grupo: c.grupo }); c.division = 3; c.grupo = 'Tercera'; };
    R.seg.forEach((s) => {
      const llegan = [];
      (M.ascensos[nuevoAnio] || []).filter((a) => a.grupo === s.grupo).forEach((a) => {
        let c = M.clubes.find((x) => x.nombre === a.nombre);
        if (!c) { c = { nombre: a.nombre, prestigio: a.prestigio, jugadores: [], entrenadores: [], division: 3, grupo: 'Tercera', pais: 'España', nuevo: true }; M.clubes.push(c); conPlantilla(M, c, a); }
        if (c.division !== 3) return;
        // Un filial no puede jugar en la misma categoría que su primer equipo.
        const mat = MATRIZ[c.nombre] && M.clubes.find((x) => x.nombre === MATRIZ[c.nombre]);
        if (mat && mat.division === 2) return;
        llegan.push(c);
      });
      const cola = [...s.T.tabla].reverse().map((t) => t.equipo).filter((c) => c.division === 2 && c.grupo === s.grupo);
      llegan.forEach((c, i) => {
        if (!cola[i]) return;
        tercera(cola[i]);
        c.division = 2; c.grupo = s.grupo;
        mov.push({ club: c.nombre, a: 'Segunda', de: 'Tercera', grupo: s.grupo });
      });
    });
    // Si un primer equipo baja al grupo de su filial, el filial baja a Tercera y se salva el mejor de los que bajaban.
    M.clubes.filter((f) => MATRIZ[f.nombre] && f.division === 2).forEach((f) => {
      const mat = M.clubes.find((x) => x.nombre === MATRIZ[f.nombre]);
      if (!mat || mat.division !== 2) return;
      const s = R.seg.find((x) => x.grupo === f.grupo);
      const salvado = s && s.T.tabla.map((t) => t.equipo).find((c) => c.division === 3 && mov.some((m) => m.club === c.nombre && m.a === 'Tercera'));
      if (!salvado) return;
      tercera(f);
      salvado.division = 2; salvado.grupo = f.grupo;
      mov.splice(mov.findIndex((m) => m.club === salvado.nombre && m.a === 'Tercera'), 1);
    });
    // De la categoría de abajo (que no se juega) suben los que subieron de verdad; bajan tantos como suben, por la cola.
    function llegadas(P, liga, nivel) {
      const llegan = [];
      (P.ascensos[nuevoAnio] || []).filter((a) => !a.grupo || a.grupo === liga.grupo).forEach((a) => {
        let c = M.clubes.find((x) => x.nombre === a.nombre);
        if (!c) { c = { nombre: a.nombre, prestigio: a.prestigio, jugadores: [], entrenadores: [], division: 3, grupo: P.abajo, pais: P.pais, nuevo: true }; M.clubes.push(c); conPlantilla(M, c, a); }
        if (c.division === 3) llegan.push(c);
      });
      // Un histórico no desaparece en la categoría que no se juega (el Milan de 1980 estaba en Serie B): antes cae otro.
      const cola = [...liga.T.tabla].reverse().map((t) => t.equipo).filter((c) => c.division === nivel && c.grupo === liga.grupo).sort((a, b) => (a.prestigio >= 700) - (b.prestigio >= 700));
      llegan.forEach((c, k) => {
        if (!cola[k]) return;
        cola[k].division = 3; cola[k].grupo = P.abajo;
        mov.push({ club: cola[k].nombre, a: P.abajo, pais: P.pais, grupo: liga.grupo });
        c.division = nivel; c.grupo = liga.grupo;
        mov.push({ club: c.nombre, a: liga.grupo, de: P.abajo, pais: P.pais, sube: true });
      });
    }
    // Otros países: los primeros de cada grupo de segunda suben a su primera y bajan tantos como suben.
    M.paises.forEach((P, i) => {
      const o = R.otros[i];
      if (!o || !o.ligas.length) return;
      const top = o.ligas.filter((l) => l.nivel === 1);
      // Ligas por regiones sin segunda en la partida (Alemania): los que suben de verdad entran directamente en su grupo.
      top.filter((l) => !P.grupos.some((g) => g.nivel === 2 && (g.de === l.grupo || top.length === 1))).forEach((l) => llegadas(P, l, 1));
      if (P.subenTotal && top.length === 1) {
        // Varias regionales y pocas plazas: suben los mejores campeones (por puntos por partido) y bajan tantos como suben.
        const seg2 = o.ligas.filter((l) => l.nivel === 2 && l.T.tabla.length);
        const camps = seg2.map((l) => l.T.tabla[0]).sort((a, b) => b.pts / b.pj - a.pts / a.pj).slice(0, P.subenTotal);
        const destino = top[0];
        const bajan = [...destino.T.tabla].reverse().map((t) => t.equipo).filter((c) => c.grupo === destino.grupo).slice(0, camps.length);
        bajan.forEach((c, k) => { const g = seg2.find((l) => l.T.tabla.includes(camps[k])); c.division = 2; c.grupo = g ? g.grupo : seg2[0].grupo; mov.push({ club: c.nombre, a: c.grupo, pais: P.pais }); });
        camps.forEach((t) => { t.equipo.division = 1; t.equipo.grupo = destino.grupo; mov.push({ club: t.nombre, a: destino.grupo, pais: P.pais, sube: true }); });
        seg2.forEach((s) => llegadas(P, s, 2));
        return;
      }
      o.ligas.filter((l) => l.nivel === 2).forEach((s) => {
        const g = P.grupos.find((x) => x.nombre === s.grupo);
        const destino = top.find((l) => l.grupo === g.de) || (top.length === 1 ? top[0] : null);
        if (!destino) return;
        const suben = s.T.tabla.slice(0, porAnio(P.sube, M.anio)).map((t) => t.equipo);
        const bajan = [...destino.T.tabla].reverse().map((t) => t.equipo).filter((c) => c.grupo === destino.grupo).slice(0, suben.length);
        suben.forEach((c) => { c.division = 1; c.grupo = destino.grupo; mov.push({ club: c.nombre, a: destino.grupo, pais: P.pais, sube: true }); });
        bajan.forEach((c) => { c.division = 2; c.grupo = s.grupo; mov.push({ club: c.nombre, a: s.grupo, pais: P.pais }); });
        llegadas(P, s, 2);
      });
    });
    // Tamaño real de cada liga europea de una sola Primera: crece o encoge cuando lo hizo de verdad
    // (Bundesliga de 16 a 18 en 1965, Serie A de 16 a 18 en 1988 y a 20 en 2004, Premier de 22 a 20 en 1995).
    M.paises.forEach((P, i) => {
      const o = R.otros[i];
      const top = o && o.ligas.filter((l) => l.nivel === 1);
      const objetivo = Epoca.reglas(P.pais, nuevoAnio).clubes;
      if (!top || top.length !== 1 || NO_EUROPA.includes(P.pais) || !(objetivo >= 10 && objetivo <= 24)) return;
      const liga = top[0], enPrimera = () => M.clubes.filter((c) => c.pais === P.pais && c.division === 1 && c.grupo === liga.grupo);
      const seg2 = o.ligas.filter((l) => l.nivel === 2 && l.T.tabla.length);
      if (enPrimera().length < objetivo) {
        // Suben más: los siguientes de la segunda de la partida o, si no se juega, los de más prestigio de abajo.
        const cand = seg2.length ? Array.from({ length: 8 }, (_, k) => seg2.map((l) => l.T.tabla[k] && l.T.tabla[k].equipo)).flat().filter((c) => c && c.division === 2)
          : M.clubes.filter((c) => c.pais === P.pais && c.division === 3 && c.jugadores.length >= 11 && !MATRIZ[c.nombre]).sort((a, b) => b.prestigio - a.prestigio);
        cand.slice(0, objetivo - enPrimera().length).forEach((c) => { c.division = 1; c.grupo = liga.grupo; mov.push({ club: c.nombre, a: liga.grupo, pais: P.pais, sube: true }); });
      }
      const cola = [...liga.T.tabla].reverse().map((t) => t.equipo).filter((c) => c.division === 1 && c.grupo === liga.grupo);
      while (enPrimera().length > objetivo && cola.length) {
        const c = cola.shift();
        if (seg2.length) { c.division = 2; c.grupo = seg2[enPrimera().length % seg2.length].grupo; } else { c.division = 3; c.grupo = P.abajo; }
        mov.push({ club: c.nombre, a: c.grupo, pais: P.pais });
      }
    });
    return mov;
  }

  // ---- Insignias: se ganan jugando y cambian (un poco) cómo juega quien las tiene ----
  // Cada una cuenta algo que el jugador ha hecho en ESTA partida; al llegar a un corte sube de grado (bronce, plata, oro, excepcional).
  const GRADOS = ['bronce', 'plata', 'oro', 'excepcional'];
  const INSIGNIAS = {
    europa: { nombre: 'Rey de Europa', efecto: 'Se crece en las noches de Copa de Europa', cuenta: 'Copas de Europa ganadas', cortes: [1, 2, 3, 5] },
    bandera: { nombre: 'Bandera del club', efecto: 'Rinde más con el club de su vida', cuenta: 'temporadas seguidas de titular en su club', cortes: [8, 11, 14, 17] },
    goleador: { nombre: 'Goleador implacable', efecto: 'Define mejor', cuenta: 'temporadas de 30 goles', cortes: [2, 4, 6, 9] },
    mago: { nombre: 'Mago', efecto: 'Sus pases dejan solo al delantero', cuenta: 'temporadas de 15 asistencias', cortes: [2, 4, 6, 9] },
    muro: { nombre: 'Muro', efecto: 'Gana más duelos atrás', cuenta: 'temporadas de nota 7,9 como defensa o portero', cortes: [2, 4, 6, 9] },
    hierro: { nombre: 'Hombre de hierro', efecto: 'Se lesiona menos', cuenta: 'temporadas de 45 partidos', cortes: [5, 8, 11, 14] },
    prodigio: { nombre: 'Niño prodigio', efecto: 'Crece más deprisa', cuenta: 'temporadas de nota 7,3 antes de los 21', cortes: [1, 2, 3, 4] },
    eterno: { nombre: 'Eterno', efecto: 'Envejece más despacio', cuenta: 'temporadas de nota 7,2 pasados los 35', cortes: [1, 2, 3, 5] },
    gol: { nombre: 'Leyenda del gol', efecto: 'Su nombre ya asusta a los porteros', cuenta: 'goles en la partida', cortes: [250, 400, 600, 1000] },
    gracia: { nombre: 'Estado de gracia', efecto: 'Empieza la temporada lanzado (dura un año)', cuenta: 'temporada de nota 8,8', cortes: [1, 1, 1, 1], temporal: true }
  };
  function insignias(M, R, c, j, x, edad, novedades) {
    if (j.relleno) return;
    const n = j.cnt || (j.cnt = {}), ins = j.ins || (j.ins = {});
    const mas = (id, si) => { if (si) n[id] = (n[id] || 0) + 1; };
    const nota = x && x.pj >= 15 ? x.notaTemp : 0, pj = x ? x.pj : 0;
    mas('europa', R.EU && R.EU.campeon === c.nombre && pj >= 15);
    mas('goleador', x && x.g >= 30);
    mas('mago', x && x.a >= 15);
    mas('muro', (j.pos === 'DEF' || j.pos === 'POR') && nota >= 7.9);
    mas('hierro', pj >= 45);
    mas('prodigio', edad <= 20 && nota >= 7.3);
    mas('eterno', edad >= 36 && nota >= 7.2);
    n.gol = (n.gol || 0) + (x ? x.g : 0);
    let seguidas = 0;
    for (let i = j.carrera.length - 1; i >= 0 && j.carrera[i].club === c.nombre && !j.carrera[i].cedido && j.carrera[i].pj >= 25; i--) seguidas++;
    n.bandera = seguidas;
    if (seguidas < 8) delete ins.bandera;
    // Sin bucles: quien ya está en estado de gracia no puede encadenarlo con otro.
    const tenia = ins.gracia != null;
    delete ins.gracia;
    n.gracia = nota >= 8.8 && !tenia ? 1 : 0;
    Object.keys(INSIGNIAS).forEach((id) => {
      const I = INSIGNIAS[id], v = n[id] || 0;
      let g = -1;
      I.cortes.forEach((k, i) => { if (v >= k) g = i; });
      if (I.temporal) g = v ? 0 : -1;
      if (g < 0 || (ins[id] != null && ins[id] >= g)) return;
      ins[id] = g;
      if (id === 'goleador') j.fin = Math.min(1.7, (j.fin || 1) + 0.02);
      novedades.push({ tipo: 'insignia', jugador: j.n, club: c.nombre, id, grado: g, nombre: I.nombre, niv: Math.round(j.niv) });
    });
  }
  const gradoDe = (j, id) => (j.ins && j.ins[id] != null ? j.ins[id] + 1 : 0);
  // ---- Récords reales: cuando alguien los bate en la partida, es noticia ----
  const MARCAS_REALES = {
    temporada: [73, 'los 73 goles de Messi en 2011-12'],
    mundial: [13, 'los 13 goles de Just Fontaine en el Mundial de 1958'],
    europa: [5, 'las cinco Copas de Europa seguidas del Real Madrid (1956-60)'],
    ligas: { 'España': [5, 'las cinco Ligas seguidas del Real Madrid'], Italia: [9, 'los nueve scudetti seguidos de la Juventus'], Inglaterra: [4, 'las cuatro ligas seguidas del Manchester City'],
      Alemania: [11, 'las once Bundesligas seguidas del Bayern'], Francia: [7, 'las siete ligas seguidas del Lyon'], Portugal: [5, 'las cinco ligas seguidas del Oporto'] }
  };
  function marcas(M, R, novedades) {
    const m = M.marcas || (M.marcas = { mejor: {}, racha: {} });
    const bate = (id, valor, real, titulo, texto) => {
      if (valor <= real[0] || valor <= (m.mejor[id] || 0)) return;
      m.mejor[id] = valor;
      novedades.push({ tipo: 'record', titulo, texto: `${texto} Supera ${real[1]}.` });
    };
    const top = [...R.G].sort((a, b) => b.g - a.g)[0];
    if (top) bate('temporada', top.g, MARCAS_REALES.temporada, `${top.j.n} marca ${top.g} goles en una temporada`, `Nadie había marcado tanto en un año: ${top.g} goles con el ${top.eq.nombre}.`);
    const gm = R.MU && R.MU.premios && R.MU.premios.goleadores && R.MU.premios.goleadores[0];
    if (gm) bate('mundial', gm.g, MARCAS_REALES.mundial, `${gm.n || gm.nombre} marca ${gm.g} goles en un Mundial`, `Récord de goles en una sola Copa del Mundo.`);
    const racha = (id, campeon, real, que) => {
      if (!campeon) return;
      const x = m.racha[id];
      m.racha[id] = x && x.club === campeon ? { club: campeon, n: x.n + 1 } : { club: campeon, n: 1 };
      bate(id, m.racha[id].n, real, `${campeon} gana su ${m.racha[id].n}.ª ${que} seguida`, `Una racha que no se había visto nunca.`);
    };
    if (R.EU) racha('europa', R.EU.campeon, MARCAS_REALES.europa, 'Copa de Europa');
    [{ pais: 'España', campeon: R.T && R.T.tabla[0] && R.T.tabla[0].nombre }].concat(R.otros || []).forEach((o) => {
      const real = MARCAS_REALES.ligas[o.pais];
      racha('liga ' + o.pais, o.campeon, real || [99, '']);
      // Todo imperio cae: a partir de la cuarta liga seguida el campeón se acomoda un poco más cada año
      // (salvo los clubes que mandan por decreto en su época, como el Madrid de las cinco Copas).
      // En las cuatro grandes ligas cuenta además lo ganado en los últimos seis años, aunque no sea seguido:
      // quien lleva tres de seis empieza a relajarse y sus rivales a tenerle ganas.
      m.ultimas = m.ultimas || {};
      const u = (m.ultimas[o.pais] = (m.ultimas[o.pais] || []).concat(o.campeon || '').slice(-6));
      const x = m.racha['liga ' + o.pais];
      const cuenta = {}; u.forEach((n) => { if (n) cuenta[n] = (cuenta[n] || 0) + 1; });
      const grande = ['España', 'Inglaterra', 'Italia', 'Alemania'].includes(o.pais);
      Object.entries(cuenta).forEach(([club, w]) => {
        const seguida = x && x.club === club && x.n >= 4 ? Math.min(24, 6 * (x.n - 3)) : 0;
        const baja = Math.max(seguida, grande ? Math.min(60, 12 * (w - 2)) : 0);
        const c = baja > 0 && M.clubes.find((y) => y.nombre === club);
        if (c && !CLUBES_CONSTANTES.some((C) => C.club === c.nombre && M.anio + 1 >= C.desde && M.anio + 1 <= C.hasta)) c.jugadores.forEach((j) => { j.temp = (j.temp || 0) - baja; });
      });
    });
  }
  // Rivalidades: dos jugadores que pasan tres temporadas entre los tres mejores del mundo se vuelven rivales.
  // Desde entonces, cuando se enfrentan, los dos se crecen (ver motor.js).
  function rivalidades(M, R, novedades) {
    const d = M.duelos || (M.duelos = {});
    const top = R.G.filter((x) => x.pj >= 20 && x.j && !x.j.relleno).sort((a, b) => b.notaTemp - a.notaTemp).slice(0, 3);
    for (let i = 0; i < top.length; i++) for (let k = i + 1; k < top.length; k++) {
      const a = top[i], b = top[k], id = [a.j.n, b.j.n].sort().join('|');
      d[id] = (d[id] || 0) + 1;
      if (d[id] === 3 && !a.j.rival && !b.j.rival && a.eq !== b.eq) {
        a.j.rival = b.j.n; b.j.rival = a.j.n;
        novedades.push({ tipo: 'rivalidad', a: a.j.n, b: b.j.n, clubA: a.eq.nombre, clubB: b.eq.nombre });
      }
    }
  }
  // Lesión grave: de vez en cuando un jugador se rompe y pierde parte de lo que era. Al año siguiente algunos vuelven
  // como si nada y otros ya no son los mismos. Es raro, pero cambia carreras.
  function lesionGrave(M, c, j, x, edad, r, novedades) {
    if (j.relleno || j.cons) return;
    const sobra = Math.max(0, j.niv - 600);
    if (j.grave && j.grave.anio === M.anio) {
      // Un año después: ¿vuelve?
      if (r() < 0.45) { j.niv += j.grave.perdio * 0.9; j.grave.vuelve = true; novedades.push({ tipo: 'regreso', jugador: j.n, club: c.nombre, niv: Math.round(j.niv), edad, parte: j.grave.parte }); }
      else { j.tec = Math.min(j.tec || j.niv, j.niv + 15); novedades.push({ tipo: 'secuela', jugador: j.n, club: c.nombre, niv: Math.round(j.niv), antes: Math.round(j.niv + j.grave.perdio), edad, parte: j.grave.parte }); }
      return;
    }
    if (!x || x.pj < 10) return;
    // Quien ya se rompió una vez puede recaer años después (la rodilla de Ronaldo); nadie se rompe más de tres veces.
    const veces = (j.lesiones || []).length;
    if (j.grave && (M.anio < j.grave.anio + 1 || veces >= 3)) return;
    const p = 0.004 * (edad >= 30 ? 1.6 : 1) * (1 - 0.15 * gradoDe(j, 'hierro')) * (j.grave ? 2.5 : 1);
    if (r() >= p) return;
    const recae = !!j.grave, PARTES = [['la rodilla: rotura del ligamento cruzado', 8], ['la rodilla: rotura del ligamento cruzado', 9], ['el tendón de Aquiles', 9], ['la pierna: fractura de tibia y peroné', 8], ['el tobillo: fractura con rotura de ligamentos', 6], ['la rodilla: menisco y cartílago', 6], ['la espalda: hernia discal', 7], ['el pubis: una pubalgia que no cura', 6]];
    const [parte, meses] = recae ? [j.grave.parte, 8] : PARTES[hashN(j.n + M.anio, 71) % PARTES.length];
    (j.lesiones = j.lesiones || []).push({ temporada: temporadaTxt(M.anio), parte, meses, edad });
    const perdio = sobra * (0.12 + 0.18 * r()) + 10;
    j.niv -= perdio;
    j.grave = { anio: M.anio + 1, perdio: Math.round(perdio), edad, parte, meses };
    novedades.push({ tipo: 'lesion', jugador: j.n, club: c.nombre, niv: Math.round(j.niv + perdio), queda: Math.round(j.niv), edad, parte, meses, recae });
  }
  // Crecimiento, declive y retiros al terminar la temporada.
  function envejecer(M, R, r) {
    const pj = new Map(R.G.map((x) => [x.j, x]));
    const retiros = [], novedades = [];
    retiros.novedades = novedades;
    M.clubes.forEach((c) => {
      const mano = manoDe(c);
      c.jugadores = c.jugadores.filter((j) => {
        const x = pj.get(j);
        j.carrera.push({ temporada: temporadaTxt(M.anio), club: c.nombre, division: c.divJugada || c.division, pj: x ? x.pj : 0, g: x ? x.g : 0, a: x ? x.a : 0, nota: x ? +x.notaTemp.toFixed(2) : null, niv: Math.round(j.niv), cedido: !!j.cedido });
        if (j.selT) { j.carrera[j.carrera.length - 1].sel = j.selT; delete j.selT; }
        const edad = M.anio + 1 - anioNac(j);
        const cv = curva(j), pico = cv.pico, car = caracterDe(j);
        const minutos = Math.min(1, (x ? x.pj : 0) / 25);
        insignias(M, R, c, j, x, edad, novedades);
        if (edad <= pico) {
          // Crece hacia lo que le toca a su edad según su curva; jugar acelera, y un chaval sin minutos pierde algo de techo.
          const meta = metaEdad(j.tec || j.niv, cv, edad);
          const hueco = meta - j.niv;
          // Cómo le fue: la nota de la temporada (6,6 normal, 7,8 sobresaliente). Quien juega y rinde crece antes y puede
          // estirar su techo; quien no juega o rinde poco se queda corto. Su carrera depende de dónde está y de cómo le va.
          const rinde = x && x.pj >= 10 ? Math.max(0, Math.min(1, (x.notaTemp - 6.6) / 1.2)) : 0;
          if (!j.relleno && !j.cons && minutos >= 0.6) {
            const tope = Math.min(1130, (j.tecReal || j.tec || j.niv) * 1.02), suelo = (j.tecReal || j.tec || j.niv) * 0.95;
            j.tec = Math.max(suelo, Math.min(Math.max(tope, j.tec || 0), (j.tec || j.niv) * (1 + 0.012 * (rinde - 0.45))));
          }
          // Si ya va por delante de su curva (Pelé a los 17), no se le frena: solo el vaivén normal.
          j.niv += hueco > 0 ? hueco * (0.25 + 0.35 * minutos + 0.3 * rinde + 0.07 * gradoDe(j, 'prodigio')) * (edad <= 21 ? 1.2 : 1) + normal(r) * 10 : normal(r) * 6;
          if (edad <= 24 && minutos < 0.3 && !j.relleno && !j.cons) j.tec = (j.tec || j.niv) - r() * 12;
          // La joya inesperada: muy de vez en cuando un chaval que juega y rinde da un salto que nadie esperaba
          // y su techo se dispara. En la vida real fue uno más; en este universo puede acabar entre los mejores.
          // Los clubes de cantera sacan más a sus chavales: crecen un poco más deprisa y dan más sorpresas.
          const criado = politica(c) === 'cantera' && j.carrera.every((t) => t.club === c.nombre);
          if (criado && edad <= 23 && hueco > 0) j.niv += hueco * 0.08;
          // Y hay entrenadores que hacen mejores a los jóvenes (Cruyff, Wenger, Guardiola).
          if (mano === 'jovenes' && edad <= 23 && hueco > 0 && minutos >= 0.3) j.niv += hueco * 0.1;
          // Y la otra cara: la promesa que se queda en nada. De vez en cuando un chaval que apuntaba alto se estanca.
          if (edad <= 22 && !j.relleno && !j.cons && !j.joya && !j.estancado && (j.tec || 0) >= 860 && (j.tec || 0) - j.niv >= 60 && r() < (minutos < 0.4 ? 0.05 : 0.015)) {
            j.estancado = M.anio + 1;
            const antes = j.tec;
            j.tec = Math.max(j.niv + 10, j.tec * (0.88 + 0.06 * r()));
            novedades.push({ tipo: 'estancado', jugador: j.n, club: c.nombre, edad, niv: Math.round(j.niv), tec: Math.round(j.tec), antes: Math.round(antes) });
          }
          if (edad <= 21 && !j.relleno && !j.cons && !j.joya && !j.estancado && minutos >= 0.8 && rinde >= 0.3 && (j.tec || 0) >= 800 && (j.tec || 0) < 1000 && r() < (criado ? 0.03 : 0.015)) {
            j.joya = M.anio + 1;
            j.tec = Math.min(1090, (j.tec || j.niv) * (1.08 + 0.08 * r()));
            novedades.push({ tipo: 'joya', jugador: j.n, club: c.nombre, edad, niv: Math.round(j.niv), tec: Math.round(j.tec), real: Math.round(j.tecReal || 0) });
          }
        } else {
          // Cae lo que marca su curva ese año (físico antes, cabeza después), con algo de azar.
          // Si en la realidad siguió a su nivel después de 1959 (techo ≥ nivel de partida), envejece más despacio.
          const longevo = (j.tecReal || 0) >= (j.inicio ? j.inicio.niv : j.niv) ? 0.75 : 1;
          const caida = (j.tec || j.niv) * (cv.F(edad - 1) - cv.F(edad));
          // Quien se cuida dura más y quien vive de noche se apaga antes (salvo las carreras reales conocidas, que ya lo llevan dentro).
          const vida = CARRERAS[j.n] ? 1 : car === 'profesional' ? 0.8 : car === 'fiestero' ? 1.3 : 1;
          j.niv -= Math.max(0, caida) * longevo * vida * (0.7 + 0.6 * r()) * (1 - 0.1 * gradoDe(j, 'eterno'));
          // El cuerpo manda: desde los 37 (38 los porteros) cada año pesa más que el anterior, también a los longevos.
          const tarde = edad - (j.pos === 'POR' ? 37 : 36);
          if (tarde > 0) j.niv -= (j.tec || j.niv) * 0.012 * tarde * (0.6 + 0.4 * Math.min(1.5, cv.ritmo));
          j.tec = Math.min(j.tec || j.niv, j.niv + 20);
        }
        lesionGrave(M, c, j, x, edad, r, novedades);
        j.niv = Math.max(250, Math.min(1130, j.niv));
        // Estado de forma de la temporada que viene: hasta el mejor tiene un año flojo y un buen jugador, el año de su vida.
        j.temp = Math.round(normal(r) * (car === 'profesional' ? 14 : car === 'fiestero' ? 30 : 22)) + 5 * gradoDe(j, 'bandera') + 15 * gradoDe(j, 'gracia');
        // El que vive de noche tiene, de vez en cuando, un año perdido: llega fuera de forma y se nota toda la temporada.
        if (car === 'fiestero' && edad >= 24 && r() < 0.12) { j.temp -= 35; if (j.niv >= 800) novedades.push({ tipo: 'fiesta', jugador: j.n, club: c.nombre, niv: Math.round(j.niv), edad }); }
        // Retiro: casi nunca antes de los 32; los cracks aguantan más y los de nivel bajo lo dejan antes.
        const RETIRO = { 32: 0.03, 33: 0.06, 34: 0.12, 35: 0.22, 36: 0.35, 37: 0.5 };
        let p = edad <= 31 ? 0.005 : RETIRO[edad] || 0.7;
        if (j.niv < 550 && edad > 29) p += 0.15;
        if (j.niv > 800) p *= j.niv > 850 ? 0.35 : 0.5;
        // Una figura que sigue en lo más alto no lo deja antes de los 35.
        if (j.niv >= 850 && edad < 35) p = 0;
        // Quien sigue rindiendo (buena nota con minutos) casi nunca lo deja: Di Stéfano jugó hasta los 40.
        if (x && x.pj >= 15) p *= x.notaTemp >= 7.5 ? 0.1 : x.notaTemp >= 7 ? 0.4 : 1;
        if (j.niv >= 1000 && edad < 37) p = 0;
        // Sin edad tope: quien sigue siendo de los buenos y juega con buena nota puede seguir (Cristiano a los 41, Matthews a los 50).
        // A los demás, desde los 38 el retiro les llega cada año con más fuerza.
        const sigueArriba = x && x.pj >= 15 && x.notaTemp >= 7 && j.niv >= 880;  // escala interna: de 'crack' para arriba
        if (edad >= 38 && !sigueArriba) p = Math.max(p, Math.min(0.9, 0.3 + 0.15 * (edad - 38)));
        const K = CONSTANTES[j.n];
        if (K && !j.relleno && K.retiro && edad < K.retiro) p = 0;
        if (r() < p) { retiros.push({ j, club: c.nombre, edad }); M.retirados.push(Object.assign({ retiro: M.anio + 1, edad }, { n: j.n, carrera: j.carrera, pos: j.pos, nac: j.nac, nacion: j.nacion, ultimo: c.nombre })); return false; }
        return true;
      });
      // El vestuario: un líder veterano tira de todos, un equipo que lleva años junto se entiende de memoria,
      // y dos caracteres difíciles entre los titulares lo rompen.
      const once = c.jugadores.slice().sort((a, b) => b.niv - a.niv).slice(0, 13);
      const lideres = once.filter((j) => caracterDe(j) === 'lider' && M.anio + 1 - anioNac(j) >= 26).length;
      const dificiles = once.filter((j) => caracterDe(j) === 'conflictivo').length;
      const juntos = once.filter((j) => { let n = 0; for (let i = j.carrera.length - 1; i >= 0 && j.carrera[i].club === c.nombre; i--) n++; return n >= 3; }).length;
      const quim = (lideres ? 5 : 0) + (juntos >= 8 ? 4 : 0) - (dificiles >= 2 ? 9 : dificiles === 1 && !lideres ? 3 : 0);
      c.vestuario = quim >= 8 ? 'unido' : quim <= -6 ? 'roto' : 'normal';
      if (quim) c.jugadores.forEach((j) => { j.temp = (j.temp || 0) + quim; });
      if (c.vestuario === 'roto' && c.division === 1 && c.prestigio >= 760) novedades.push({ tipo: 'vestuario', club: c.nombre, nombres: once.filter((j) => caracterDe(j) === 'conflictivo').slice(0, 2).map((j) => j.n) });
    });
    M.libres = M.libres.filter((j) => {
      const edad = M.anio + 1 - anioNac(j);
      j.niv -= edad > 28 ? 15 : 0;
      // Sin edad tope también aquí: un libre que sigue siendo bueno espera equipo; los demás lo van dejando.
      const p = j.niv >= 850 ? 0.05 : edad > 29 ? 0.6 : 0.3;
      if (r() < p) { retiros.push({ j, club: 'sin club', edad }); M.retirados.push({ retiro: M.anio + 1, edad, n: j.n, carrera: j.carrera, pos: j.pos, nac: j.nac, nacion: j.nacion }); return false; }
      return true;
    });
    return retiros;
  }

  // Mercado de verano: vuelta de cedidos, filiales, fichajes por prestigio y necesidad, cesiones y libres.
  const IDEAL = { POR: 2, DEF: 7, MED: 6, DEL: 7 };
  const CUPO_EXTRANJEROS = 3, NIVEL_EXTRANJERO = 720;
  // Hasta 1991 (eliminatorias puras, pocos grandes) pesa algo más el nivel; después no hace falta: los grandes ya juntan a los mejores.
  const CONTRASTE_EUROPA = 0.75;
  // Los clubes de países que no se juegan, frente al campeón mediano de la partida.
  const FUERA_RELATIVO = 0.92;
  const QUIMICA = 28;
  const CONTRASTE_EUROPA_HOY = 1;
  const IDEAL_ONCE = { POR: 1, DEF: 4, MED: 3, DEL: 3 };
  // Cuánto fichaban fuera los clubes de cada país (aprox.): Italia y España atraían a las figuras; Francia algo;
  // Portugal, Argentina, Brasil y la Alemania semiamateur casi nada; Inglaterra, cerrada hasta 1978.
  const ATRACCION = { Italia: { 1946: 1 }, España: { 1950: 1 }, Francia: { 1950: 0.5 }, Portugal: { 1950: 0.15 }, Argentina: { 1950: 0.15 },
    Brasil: { 1950: 0.03, 1990: 0.3 }, Alemania: { 1950: 0.05, 1963: 0.15, 1990: 0.5, 1996: 0.9 }, Inglaterra: { 1950: 0.05, 1978: 0.2, 1992: 0.7, 1996: 1 } };
  // Quién cuenta como de casa: el propio país y, si los datos lo dicen, otros (en Inglaterra, escoceses, galeses e irlandeses).
  const NACIONALES = {};
  const extranjero = (j, pais) => {
    const casa = NACIONALES[pais] || [pais];
    return !String(j.nacion || pais).split('/').map((x) => x.trim()).some((x) => casa.includes(x));
  };
  // ---------- Lo que busca cada jugador y cómo ficha cada club ----------
  // Cada jugador quiere algo de su carrera y eso decide adónde va: no todos sueñan con lo mismo.
  const DESEOS = { titulos: 'Ganar títulos', dinero: 'El mejor contrato', casa: 'Su club de siempre', minutos: 'Jugar siempre', reto: 'Retos nuevos' };
  // Símbolos de un club: no cambian de camiseta en sus mejores años y jamás fichan por el rival.
  const EMBLEMAS = {
    'Raúl': 'Real Madrid', 'Iker Casillas': 'Real Madrid', 'Guti': 'Real Madrid', 'Emilio Butragueño': 'Real Madrid', 'Míchel': 'Real Madrid', 'Manuel Sanchís': 'Real Madrid', 'Francisco Gento': 'Real Madrid', 'Santillana': 'Real Madrid', 'Fernando Hierro': 'Real Madrid',
    'Carles Puyol': 'Barcelona', 'Xavi Hernández': 'Barcelona', 'Andrés Iniesta': 'Barcelona', 'Sergio Busquets': 'Barcelona', 'Lionel Messi': 'Barcelona', 'Pep Guardiola': 'Barcelona', 'Víctor Valdés': 'Barcelona', 'Gerard Piqué': 'Barcelona',
    'Fernando Torres': 'Atlético Madrid', 'Koke': 'Atlético Madrid', 'Adelardo': 'Atlético Madrid', 'Julen Guerrero': 'Atlético Bilbao', 'José Ángel Iribar': 'Atlético Bilbao',
    'Paolo Maldini': 'Milan', 'Franco Baresi': 'Milan', 'Gianni Rivera': 'Milan', 'Alessandro Costacurta': 'Milan', 'Javier Zanetti': 'Inter', 'Giuseppe Bergomi': 'Inter', 'Sandro Mazzola': 'Inter', 'Giacinto Facchetti': 'Inter',
    'Alessandro Del Piero': 'Juventus', 'Gaetano Scirea': 'Juventus', 'Giampiero Boniperti': 'Juventus', 'Claudio Marchisio': 'Juventus', 'Giorgio Chiellini': 'Juventus',
    'Francesco Totti': 'Roma', 'Daniele De Rossi': 'Roma', 'Giuseppe Giannini': 'Roma', 'Luigi Riva': 'Cagliari', 'Giancarlo Antognoni': 'Fiorentina', 'Marek Hamšík': 'Napoli',
    'Steven Gerrard': 'Liverpool', 'Jamie Carragher': 'Liverpool', 'Ryan Giggs': 'Manchester United', 'Paul Scholes': 'Manchester United', 'Gary Neville': 'Manchester United', 'Bobby Charlton': 'Manchester United',
    'Tony Adams': 'Arsenal', 'John Terry': 'Chelsea', 'Matthew Le Tissier': 'Southampton', 'Alan Shearer': 'Newcastle United', 'Billy Bremner': 'Leeds United', 'Bobby Moore': 'West Ham United', 'Ledley King': 'Tottenham Hotspur',
    'Thomas Müller': 'Bayern Múnich', 'Philipp Lahm': 'Bayern Múnich', 'Bastian Schweinsteiger': 'Bayern Múnich', 'Sepp Maier': 'Bayern Múnich', 'Gerd Müller': 'Bayern Múnich', 'Uwe Seeler': 'Hamburgo', 'Marco Reus': 'Borussia Dortmund', 'Michael Zorc': 'Borussia Dortmund', 'Wolfgang Overath': 'Colonia',
    'Eusébio': 'Benfica', 'Mário Coluna': 'Benfica', 'Rui Costa': 'Benfica', 'Vítor Baía': 'Oporto', 'João Pinto': 'Oporto',
    'Juan Román Riquelme': 'Boca Juniors', 'Martín Palermo': 'Boca Juniors', 'Ariel Ortega': 'River Plate', 'Enzo Francescoli': 'River Plate', 'Norberto Alonso': 'River Plate', 'Ricardo Bochini': 'Independiente', 'Diego Milito': 'Racing Club',
    'Zico': 'Flamengo', 'Rogério Ceni': 'São Paulo', 'Marcos': 'Palmeiras', 'Ademir da Guia': 'Palmeiras', 'Roberto Dinamite': 'Vasco da Gama', 'Rivellino': 'Corinthians', 'Garrincha': 'Botafogo', 'Nílton Santos': 'Botafogo'
  };
  function enemigosDe(M) {
    const enemigos = new Map();
    (M.derbis || []).forEach((d) => { if (DERBI_BLANDO.test(d.nombre)) return; [[d.a, d.b], [d.b, d.a]].forEach(([x, y]) => { if (!enemigos.has(x)) enemigos.set(x, new Set()); enemigos.get(x).add(y); }); });
    return enemigos;
  }
  // Plus en la Copa de Europa: clubes con mística y jugadores marcados por ella (para bien o para mal).
  const MISTICA_EUROPA = { 'Real Madrid': 11, 'Milan': 8, 'Liverpool': 7, 'Bayern Múnich': 4, 'Ajax': 4 };
  const NOCHES_EUROPA = { 'Filippo Inzaghi': 30, 'Raúl': 22, 'Sergio Ramos': 22, 'Clarence Seedorf': 18, 'Paolo Maldini': 15, 'Karim Benzema': 18, 'Luka Modrić': 15, 'Alfredo Di Stéfano': 20, 'Francisco Gento': 15, 'Andrés Iniesta': 12, 'Didier Drogba': 15, 'Steven Gerrard': 15,
    'Zlatan Ibrahimović': -30, 'Gianluigi Buffon': -15, 'Ronaldo': -12, 'Gabriel Batistuta': -10, 'Harry Kane': -12 };
  const DERBI_BLANDO = /^duelo|clásico argentino|clásico de Italia|Choc des|^derbi de Londres$|Der Klassiker|derbi del Sole|clásico de la Saudade|San-São|clásico alvinegro/;
  const DESEO_REAL = {
    'Cristiano Ronaldo': 'titulos', 'Zinedine Zidane': 'titulos', 'Kylian Mbappé': 'titulos', 'Luís Figo': 'dinero', 'Neymar': 'dinero', "Samuel Eto'o": 'dinero', 'David Beckham': 'reto',
    'Zlatan Ibrahimović': 'reto', 'Ronaldo': 'reto', 'Lionel Messi': 'casa', 'Luigi Riva': 'casa', 'Francesco Totti': 'casa', 'Paolo Maldini': 'casa', 'Carles Puyol': 'casa', 'Steven Gerrard': 'casa', 'Ryan Giggs': 'casa',
    'Paul Scholes': 'casa', 'Xavi Hernández': 'casa', 'Andrés Iniesta': 'casa', 'Raúl': 'casa', 'Iker Casillas': 'casa', 'Gianluigi Buffon': 'casa', 'Thomas Müller': 'casa', 'Alessandro Del Piero': 'casa',
    'Javier Zanetti': 'casa', 'Sergio Busquets': 'casa', 'Marco Reus': 'casa', 'Harry Kane': 'titulos', 'Erling Haaland': 'titulos', 'Thierry Henry': 'titulos', 'Kaká': 'titulos', 'Ronaldinho': 'reto',
    'Carlos Tevez': 'reto', 'Robert Lewandowski': 'titulos', 'Luis Suárez': 'titulos', 'Karim Benzema': 'titulos', 'Luka Modrić': 'titulos', 'Eden Hazard': 'reto', 'Paul Pogba': 'dinero', 'Gareth Bale': 'dinero'
  };
  // Carácter: cómo vive y cómo es en el vestuario. Cambia cuánto dura arriba, sus altibajos, las noches grandes y los líos con el club.
  const CARACTERES = { profesional: 'Profesional: se cuida y dura', fiestero: 'Vive de noche', lider: 'Líder del vestuario', conflictivo: 'Carácter difícil', frio: 'Se crece en las noches grandes', normal: '' };
  const CARACTER_REAL = {
    'Cristiano Ronaldo': 'profesional', 'Paolo Maldini': 'profesional', 'Javier Zanetti': 'profesional', 'Ryan Giggs': 'profesional', 'Luka Modrić': 'profesional', 'Robert Lewandowski': 'profesional', 'Raúl': 'profesional',
    'Gianluigi Buffon': 'profesional', 'Philipp Lahm': 'profesional', 'Dino Zoff': 'profesional', 'Stanley Matthews': 'profesional', 'Erling Haaland': 'profesional', 'Harry Kane': 'profesional', 'Karim Benzema': 'profesional',
    'Ronaldinho': 'fiestero', 'Adriano': 'fiestero', 'Adriano Leite Ribeiro': 'fiestero', 'George Best': 'fiestero', 'Garrincha': 'fiestero', 'Paul Gascoigne': 'fiestero', 'Romário': 'fiestero', 'Diego Maradona': 'fiestero',
    'Edmundo': 'fiestero', 'Antonio Cassano': 'fiestero', 'Ronaldo': 'fiestero', 'Neymar': 'fiestero', 'Wayne Rooney': 'fiestero', 'Sócrates': 'fiestero',
    'Franz Beckenbauer': 'lider', 'Carles Puyol': 'lider', 'Franco Baresi': 'lider', 'Roy Keane': 'lider', 'Steven Gerrard': 'lider', 'Sergio Ramos': 'lider', 'Bobby Moore': 'lider', 'Daniel Passarella': 'lider',
    'Lothar Matthäus': 'lider', 'Didier Deschamps': 'lider', 'Fernando Hierro': 'lider', 'Francesco Totti': 'lider', 'Iker Casillas': 'lider', 'Alfredo Di Stéfano': 'lider', 'Johan Cruyff': 'lider', 'Dunga': 'lider', 'Virgil van Dijk': 'lider',
    'Éric Cantona': 'conflictivo', 'Zlatan Ibrahimović': 'conflictivo', 'Mario Balotelli': 'conflictivo', 'Carlos Tevez': 'conflictivo', 'Nicolas Anelka': 'conflictivo', 'Hristo Stoichkov': 'conflictivo', 'Bernd Schuster': 'conflictivo',
    'Paolo Di Canio': 'conflictivo', 'Joey Barton': 'conflictivo', "Samuel Eto'o": 'conflictivo', 'Luis Suárez': 'conflictivo', 'Diego Costa': 'conflictivo', 'Omar Sívori': 'conflictivo',
    'Zinedine Zidane': 'frio', 'Pelé': 'frio', 'Lionel Messi': 'frio', 'Andrés Iniesta': 'frio', 'Gerd Müller': 'frio', 'Paolo Rossi': 'frio', 'Mario Kempes': 'frio', 'Filippo Inzaghi': 'frio', 'Kylian Mbappé': 'frio', 'Ferenc Puskás': 'frio',
    'Didier Drogba': 'frio', 'Gareth Bale': 'frio', 'Ángel Di María': 'frio', 'Xavi Hernández': 'frio', 'Kaká': 'profesional', 'Thierry Henry': 'profesional', 'David Beckham': 'profesional'
  };
  function caracterDe(j) {
    if (j.relleno) return 'normal';
    if (CARACTER_REAL[j.n]) return CARACTER_REAL[j.n];
    const x = hashN(j.n, 23) % 100;
    return x < 18 ? 'profesional' : x < 27 ? 'fiestero' : x < 37 ? 'lider' : x < 45 ? 'conflictivo' : x < 55 ? 'frio' : 'normal';
  }
  function deseo(j) {
    if (DESEO_REAL[j.n] && !j.relleno) return DESEO_REAL[j.n];
    const x = hashN(j.n, 13) % 100;
    return x < 30 ? 'titulos' : x < 50 ? 'dinero' : x < 64 ? 'casa' : x < 82 ? 'minutos' : 'reto';
  }
  // Sueldo que pide (en unidades: un titular normal de Primera pide 1). Crece muy deprisa por arriba, como en la realidad.
  // Precio de un traspaso, en millones de euros de hoy en día. La vara es el récord mundial de cada época
  // (Luis Suárez 1961, Cruyff 1973, Maradona 1984, Zidane 2001, Neymar 2017): un fichaje normal de figura (nivel 700-760) cuesta entre la cuarta parte y la mitad del récord de su año, y solo una leyenda en plenitud lo iguala o lo bate por poco.
  const RECORD_TRASPASO = [[1950, 0.05], [1957, 0.09], [1961, 0.2], [1968, 0.6], [1973, 1.2], [1975, 1.9], [1982, 5], [1984, 7.5], [1987, 8], [1990, 12], [1992, 16], [1996, 21], [1997, 27], [1998, 31], [1999, 49], [2000, 60], [2001, 77], [2009, 94], [2013, 100], [2016, 105], [2017, 222], [2030, 222]];
  const recordTraspaso = (anio) => {
    const i = Math.max(1, RECORD_TRASPASO.findIndex((x) => x[0] >= anio)), a = RECORD_TRASPASO[i < 0 ? RECORD_TRASPASO.length - 1 : i - 1], b = RECORD_TRASPASO[i < 0 ? RECORD_TRASPASO.length - 1 : i];
    if (a === b || anio <= a[0]) return a[1];
    return a[1] * Math.pow(b[1] / a[1], Math.min(1, (anio - a[0]) / (b[0] - a[0])));
  };
  const precio = (j, anio, motivo, comprador) => {
    if (motivo === 'gratis') return 0;
    const e = anio - anioNac(j), edad = e <= 23 ? 1.15 : e <= 27 ? 1 : e >= 34 ? 0.08 : [0.85, 0.7, 0.55, 0.42, 0.3, 0.18][e - 28];
    const v = recordTraspaso(anio) * Math.min(1.15, Math.exp((Motor.escala.mostrar(j.niv) - 850) / 110)) * edad * (motivo === 'lio' ? 0.7 : 1) * (j.relleno ? 0.5 : 1)
      * (comprador ? Math.max(0.05, Math.min(1, (comprador.prestigio - 400) / 350)) : 1); // un club modesto no paga lo que un grande
    return v >= 10 ? Math.round(v) : v >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
  };
  const sueldo = (j) => Math.exp((Motor.escala.mostrar(j.niv) - 620) / 130) * (j.relleno ? 0.5 : 1) * (deseo(j) === 'dinero' ? 1.2 : 1);
  // Dinero de cada liga en cada época y clubes con dueño rico: de ahí sale lo que cada club puede pagar.
  const DINERO_LIGA = { España: { 1950: 1 }, Italia: { 1950: 1, 2010: 0.9 }, Inglaterra: { 1950: 0.95, 1995: 1, 2008: 1.1 }, Alemania: { 1950: 0.9, 2000: 0.95 }, Francia: { 1950: 0.8 }, Portugal: { 1950: 0.7 }, Argentina: { 1950: 0.75, 1985: 0.55 }, Brasil: { 1950: 0.75, 1985: 0.6 } };
  const DUENOS_RICOS = { 'Chelsea': [2003, 90], 'Manchester City': [2008, 120], 'Paris Saint-Germain': [2011, 130], 'Newcastle United': [2021, 60], 'Inter': [1995, 70], 'Real Madrid': [2000, 40] };
  function presupuesto(c, anio) {
    const rico = DUENOS_RICOS[c.nombre] || c.duenoRico;
    const L = 560 + (c.prestigio - 500) * 0.5 * (porAnio(DINERO_LIGA[c.pais], anio) || 0.7) + (rico && anio >= rico[0] ? rico[1] : 0) - (c.division > 1 ? 60 : 0);
    const s = (n) => Math.exp((n - 620) / 130);
    return 0.7 * (11 * s(L) + 9 * s(L - 110));
  }
  // Cómo ficha cada club: unos compran figuras hechas, otros tiran de cantera, otros tienen ojeadores que encuentran jóvenes y los venden caros.
  const POLITICAS = { estrellas: 'Figuras hechas', cantera: 'Cantera', ojeadores: 'Ojeadores: compra joven y vende caro', normal: 'Según lo que necesita' };
  const POLITICA_REAL = { 'Real Madrid': 'estrellas', 'Barcelona': 'cantera', 'Atlético Bilbao': 'cantera', 'Ajax': 'cantera', 'Oporto': 'ojeadores', 'Benfica': 'ojeadores', 'Sporting de Portugal': 'ojeadores',
    'Borussia Dortmund': 'ojeadores', 'Mónaco': 'ojeadores', 'Udinese': 'ojeadores', 'Sevilla': 'ojeadores', 'Lille': 'ojeadores', 'Olympique de Lyon': 'ojeadores', 'Lyon': 'ojeadores', 'Southampton': 'ojeadores',
    'Villarreal': 'ojeadores', 'Atalanta': 'ojeadores', 'Real Sociedad': 'cantera', 'Bayern Múnich': 'estrellas', 'Chelsea': 'estrellas', 'Paris Saint-Germain': 'estrellas', 'Manchester City': 'estrellas',
    'Juventus': 'estrellas', 'Milan': 'estrellas', 'Inter': 'estrellas', 'Manchester United': 'estrellas', 'River Plate': 'ojeadores', 'Boca Juniors': 'ojeadores', 'Santos': 'cantera', 'São Paulo': 'ojeadores' };
  // Presidentes y dueños reales, con su manera de llevar el club: [desde, hasta, nombre, estilo].
  const ESTILOS_PRESIDENTE = { galactico: 'Galáctico: quiere a las estrellas y las paga', impaciente: 'Impaciente: despide entrenadores con facilidad', paciente: 'Paciente: respalda a su entrenador', tacano: 'Vendedor: hace caja con sus figuras',
    derrochador: 'Derrochador: gasta lo que no tiene', ojeador: 'Ojeador: compra joven y vende caro', cantera: 'Apuesta por la cantera', normal: '' };
  const PRESIDENTES = {
    'Real Madrid': [[1943, 1978, 'Santiago Bernabéu', 'galactico'], [1978, 1985, 'Luis de Carlos', 'paciente'], [1985, 1995, 'Ramón Mendoza', 'normal'], [1995, 2000, 'Lorenzo Sanz', 'impaciente'], [2000, 2006, 'Florentino Pérez', 'galactico'], [2006, 2009, 'Ramón Calderón', 'impaciente'], [2009, 2040, 'Florentino Pérez', 'galactico']],
    'Barcelona': [[1953, 1961, 'Francesc Miró-Sans', 'derrochador'], [1961, 1968, 'Enric Llaudet', 'tacano'], [1969, 1977, 'Agustí Montal', 'galactico'], [1978, 2000, 'Josep Lluís Núñez', 'tacano'], [2000, 2003, 'Joan Gaspart', 'derrochador'], [2003, 2010, 'Joan Laporta', 'cantera'], [2010, 2014, 'Sandro Rosell', 'normal'], [2014, 2020, 'Josep Maria Bartomeu', 'derrochador'], [2021, 2040, 'Joan Laporta', 'derrochador']],
    'Atlético Madrid': [[1964, 1980, 'Vicente Calderón', 'paciente'], [1987, 2003, 'Jesús Gil', 'impaciente'], [2003, 2040, 'Enrique Cerezo', 'paciente']],
    'Valencia': [[1994, 1997, 'Paco Roig', 'derrochador'], [2004, 2008, 'Juan Soler', 'derrochador'], [2014, 2040, 'Peter Lim', 'tacano']],
    'Sevilla': [[2002, 2013, 'José María del Nido', 'ojeador'], [2013, 2023, 'José Castro', 'ojeador']],
    'Real Betis': [[1992, 2010, 'Manuel Ruiz de Lopera', 'impaciente']],
    'Deportivo de La Coruña': [[1988, 2014, 'Augusto César Lendoiro', 'derrochador']],
    'Villarreal': [[1997, 2040, 'Fernando Roig', 'paciente']],
    'Milan': [[1954, 1963, 'Andrea Rizzoli', 'galactico'], [1986, 2017, 'Silvio Berlusconi', 'galactico'], [2018, 2022, 'Paolo Scaroni', 'ojeador']],
    'Inter': [[1955, 1968, 'Angelo Moratti', 'galactico'], [1968, 1984, 'Ivanoe Fraizzoli', 'paciente'], [1984, 1995, 'Ernesto Pellegrini', 'normal'], [1995, 2013, 'Massimo Moratti', 'galactico'], [2016, 2024, 'Steven Zhang', 'tacano']],
    'Juventus': [[1955, 1962, 'Umberto Agnelli', 'galactico'], [1971, 1990, 'Giampiero Boniperti', 'paciente'], [1994, 2006, 'Antonio Giraudo y Luciano Moggi', 'ojeador'], [2010, 2022, 'Andrea Agnelli', 'galactico']],
    'Napoli': [[1969, 1993, 'Corrado Ferlaino', 'galactico'], [2004, 2040, 'Aurelio De Laurentiis', 'tacano']],
    'Roma': [[1979, 1991, 'Dino Viola', 'paciente'], [1993, 2008, 'Franco Sensi', 'galactico'], [2012, 2020, 'James Pallotta', 'tacano']],
    'Lazio': [[1992, 2003, 'Sergio Cragnotti', 'derrochador'], [2004, 2040, 'Claudio Lotito', 'tacano']],
    'Fiorentina': [[1990, 2002, 'Vittorio Cecchi Gori', 'derrochador']], 'Parma': [[1990, 2004, 'Calisto Tanzi', 'derrochador']], 'Palermo': [[2002, 2018, 'Maurizio Zamparini', 'impaciente']], 'Sampdoria': [[1979, 1993, 'Paolo Mantovani', 'paciente']],
    'Manchester United': [[1965, 1980, 'Louis Edwards', 'paciente'], [1980, 2002, 'Martin Edwards', 'paciente'], [2005, 2040, 'la familia Glazer', 'tacano']],
    'Chelsea': [[1982, 2003, 'Ken Bates', 'normal'], [2003, 2022, 'Roman Abramóvich', 'impaciente'], [2022, 2040, 'Todd Boehly', 'derrochador']],
    'Manchester City': [[2008, 2040, 'el jeque Mansour', 'galactico']], 'Tottenham Hotspur': [[2001, 2040, 'Daniel Levy', 'tacano']], 'Arsenal': [[1983, 2013, 'Peter Hill-Wood', 'paciente'], [2018, 2040, 'Stan Kroenke', 'paciente']],
    'Liverpool': [[1973, 1990, 'John Smith', 'paciente'], [1991, 2007, 'David Moores', 'paciente'], [2010, 2040, 'John W. Henry', 'ojeador']], 'Leeds United': [[1997, 2003, 'Peter Ridsdale', 'derrochador']], 'Newcastle United': [[1992, 2007, 'John Hall', 'galactico'], [2007, 2021, 'Mike Ashley', 'tacano']],
    'Blackburn Rovers': [[1991, 2000, 'Jack Walker', 'galactico']], 'Watford': [[2012, 2040, 'la familia Pozzo', 'impaciente']],
    'Bayern Múnich': [[1962, 1979, 'Wilhelm Neudecker', 'paciente'], [1979, 2009, 'Uli Hoeneß', 'paciente'], [2009, 2021, 'Karl-Heinz Rummenigge', 'paciente']], 'Borussia Dortmund': [[1986, 2004, 'Gerd Niebaum', 'derrochador'], [2005, 2040, 'Hans-Joachim Watzke', 'ojeador']], 'Hamburgo': [[2003, 2011, 'Bernd Hoffmann', 'impaciente']],
    'Marsella': [[1986, 1994, 'Bernard Tapie', 'galactico'], [1997, 2009, 'Robert Louis-Dreyfus', 'normal']], 'Lyon': [[1987, 2023, 'Jean-Michel Aulas', 'ojeador']], 'Paris Saint-Germain': [[1978, 1991, 'Francis Borelli', 'normal'], [1991, 1998, 'Michel Denisot', 'normal'], [2011, 2040, 'Nasser Al-Khelaïfi', 'galactico']], 'Mónaco': [[1975, 2003, 'Jean-Louis Campora', 'ojeador'], [2011, 2040, 'Dmitri Rybolóvlev', 'ojeador']], 'Saint-Étienne': [[1961, 1982, 'Roger Rocher', 'paciente']],
    'Oporto': [[1982, 2024, 'Jorge Nuno Pinto da Costa', 'ojeador']], 'Benfica': [[1994, 1997, 'Manuel Damásio', 'derrochador'], [1997, 2000, 'João Vale e Azevedo', 'derrochador'], [2003, 2021, 'Luís Filipe Vieira', 'ojeador']], 'Sporting de Portugal': [[2013, 2018, 'Bruno de Carvalho', 'impaciente']],
    'Boca Juniors': [[1960, 1980, 'Alberto J. Armando', 'galactico'], [1995, 2007, 'Mauricio Macri', 'paciente']], 'River Plate': [[1936, 1968, 'Antonio Vespucio Liberti', 'galactico'], [2001, 2009, 'José María Aguilar', 'derrochador'], [2013, 2021, "Rodolfo D'Onofrio", 'paciente']], 'Independiente': [[2014, 2022, 'Hugo Moyano', 'normal']],
    'Santos': [[1955, 1971, 'Athiê Jorge Coury', 'paciente']], 'Corinthians': [[1961, 1971, 'Wadih Helu', 'impaciente'], [1972, 1981, 'Vicente Matheus', 'impaciente'], [1993, 2007, 'Alberto Dualib', 'derrochador']], 'Flamengo': [[2013, 2018, 'Eduardo Bandeira de Mello', 'paciente'], [2019, 2040, 'Rodolfo Landim', 'galactico']], 'Palmeiras': [[2017, 2021, 'Maurício Galiotte', 'paciente'], [2022, 2040, 'Leila Pereira', 'paciente']], 'Vasco da Gama': [[2001, 2008, 'Eurico Miranda', 'impaciente']]
  };
  const presidenteDe = (c, anio) => { const t = (PRESIDENTES[c.nombre] || []).filter((x) => x[0] <= anio && anio <= x[1]).pop(); return t ? { nombre: t[2], estilo: t[3], desde: t[0] } : null; };
  const estiloPresi = (c, anio) => { const p = presidenteDe(c, anio); return p ? p.estilo : 'normal'; };
  function politica(c) {
    if (c.presidente && c.presidente.estilo === 'ojeador') return 'ojeadores';
    if (c.presidente && c.presidente.estilo === 'cantera') return 'cantera';
    if (c.presidente && c.presidente.estilo === 'galactico' && c.prestigio >= 780) return 'estrellas';
    if (POLITICA_REAL[c.nombre]) return POLITICA_REAL[c.nombre];
    const x = hashN(c.nombre, 17) % 100;
    return c.prestigio >= 860 ? 'estrellas' : x < 22 ? 'ojeadores' : x < 36 ? 'cantera' : 'normal';
  }
  const MOTIVOS = { titulos: 'quiere ganar títulos', dinero: 'le ofrecen el mejor contrato', reto: 'busca un reto nuevo', minutos: 'quería jugar más', apuro: 'su club necesitaba vender', ojeadores: 'lo descubrieron sus ojeadores', lio: 'acabó mal con su club', gratis: 'llega gratis: se le acababa el contrato', talonario: 'pagaron lo que pedía su club' };

  // ---------- Economía: la caja de cada club, en millones de euros de la época ----------
  // Entra dinero por taquilla, televisión y patrocinio (según el nombre del club y lo rica que es su liga), por premios
  // y por vender jugadores; sale por sueldos, gastos del club y fichajes. Quien no tiene caja ni crédito, no compra.
  const euros = (unidades, anio) => unidades * recordTraspaso(anio) / 22;
  const ingresosDe = (c, anio) => 1.5 * euros(presupuesto(c, anio), anio);
  const cajaDe = (c, anio) => { if (c.caja == null) c.caja = 0.3 * ingresosDe(c, anio); return c.caja; };
  const creditoDe = (c, anio) => ({ derrochador: 1.2, galactico: 0.8, tacano: 0.2 }[estiloPresi(c, anio)] || 0.5) * ingresosDe(c, anio);
  const redondo = (v) => Math.round(v * 100) / 100;
  function cuentas(M, R) {
    const anio = M.anio + 1, U = recordTraspaso(anio), premios = new Map(), premio = (c, v) => { if (c) premios.set(c, (premios.get(c) || 0) + v * U); };
    const club = (n) => n && M.clubes.find((c) => c.nombre === n);
    [R.T].concat(...R.otros.map((o) => o.ligas.filter((l) => l.nivel === 1).map((l) => l.T))).filter((t) => t && t.tabla).forEach((t) => t.tabla.slice(0, 4).forEach((x, i) => premio(x.equipo, [0.1, 0.05, 0.03, 0.02][i] * (porAnio(DINERO_LIGA[x.equipo.pais], anio) || 0.7))));
    const grande = M.anio >= 1992 ? 1 : 0.35;   // la Liga de Campeones reparte mucho más que la vieja Copa de Europa
    if (R.EU) { premio(R.EU.campeonEq, 0.3 * grande); const f = R.EU.rondas[R.EU.rondas.length - 1].cruces[0]; if (f) premio(club(f.a === R.EU.campeon ? f.b : f.a), 0.12 * grande); }
    [[R.UEFA, 0.08], [R.RECOPA, 0.06], [R.LIB, 0.06], [R.INTER, 0.03], [R.SUPER, 0.02], [R.C, 0.03]].forEach(([C, v]) => { if (C && C.campeonEq) premio(C.campeonEq, v); });
    R.otros.forEach((o) => { if (o.C && o.C.campeonEq) premio(o.C.campeonEq, 0.03); });
    // Dueños: el día que llega el dinero es noticia, y de vez en cuando un millonario compra un club mediano y lo cambia todo.
    M.presidentesNuevos = [];
    M.clubes.forEach((c) => { const antes = c.presidente && c.presidente.nombre; c.presidente = presidenteDe(c, anio); if (c.presidente && c.presidente.nombre !== antes && c.presidente.desde === anio && c.division === 1) M.presidentesNuevos.push({ club: c.nombre, nombre: c.presidente.nombre, estilo: c.presidente.estilo, sale: antes || null }); });
    M.duenosNuevos = [];
    const rd = Motor.rng(anio * 977 + 3);
    if (anio >= 1998 && rd() < 0.07) {
      const cand = M.clubes.filter((c) => c.division === 1 && ['Inglaterra', 'Italia', 'España', 'Francia', 'Alemania', 'Portugal'].includes(c.pais) && c.prestigio >= 520 && c.prestigio <= 720 && !DUENOS_RICOS[c.nombre] && !c.duenoRico);
      if (cand.length) { const c = cand[Math.floor(rd() * cand.length)]; c.duenoRico = [anio, 60 + Math.round(60 * rd())]; }
    }
    M.clubes.forEach((c) => {
      cajaDe(c, anio);
      const rico = DUENOS_RICOS[c.nombre] || c.duenoRico;
      if (rico && rico[0] === anio && c.division <= 2) { c.caja += 1.2 * ingresosDe(c, anio); c.prestigio = Math.min(1000, c.prestigio + 15); if (!(c.presidente && c.presidente.desde === anio)) M.duenosNuevos.push({ club: c.nombre, pais: c.pais, inventado: !DUENOS_RICOS[c.nombre] }); }
      const ing = ingresosDe(c, anio), pr = premios.get(c) || 0, dueno = rico && anio >= rico[0] ? 0.12 * U : 0;
      const sal = euros(c.jugadores.reduce((t, j) => t + sueldo(j), 0), anio), gastos = Math.max(ing - sal - 0.08 * ing, Math.min(0.46 * ing, ing - sal + 0.1 * ing));   // el club gasta lo que ingresa: gana o pierde como mucho una décima parte al año
      c.caja += ing + pr + dueno - sal - gastos;
      // El dinero no se guarda para siempre: lo que sobra de un año de ingresos se va en estadio, cantera y deudas viejas.
      let obras = 0; if (c.caja > 0.8 * ing) { obras = 0.5 * (c.caja - 0.8 * ing); c.caja -= obras; }
      // La deuda no crece sin fin: pasado cierto punto el club se refinancia (y pierde nombre por ello).
      const tope = -1.5 * ing; if (c.caja < tope) { c.caja = tope * 0.6; c.prestigio = Math.max(250, c.prestigio - 12); c.rescate = anio; }
      c.finanzas = { anio, ingresos: redondo(ing), premios: redondo(pr), dueno: redondo(dueno), sueldos: redondo(sal), gastos: redondo(gastos), obras: redondo(obras), compras: 0, ventas: 0 };
    });
  }
  function mercado(M, r) {
    const nuevoAnio = M.anio + 1;
    const log = [];
    const porNombre = new Map(M.clubes.map((c) => [c.nombre, c]));
    const mover = (j, de, a, tipo, motivo) => {
      de.jugadores = de.jugadores.filter((x) => x !== j);
      a.jugadores.push(j);
      masas.delete(de); masas.delete(a);
      j.contrato = nuevoAnio + duracion(j);
      const pago = tipo === 'fichaje' ? precio(j, nuevoAnio, motivo, a) : 0;
      if (pago) { cajaDe(a, nuevoAnio); cajaDe(de, nuevoAnio); a.caja -= pago; de.caja += pago; if (a.finanzas) a.finanzas.compras = redondo(a.finanzas.compras + pago); if (de.finanzas) de.finanzas.ventas = redondo(de.finanzas.ventas + pago); }
      const ex = tipo === 'fichaje' && !j.relleno && enemigos.has(a.nombre) ? (enemigos.get(a.nombre).has(de.nombre) ? de.nombre : Object.keys(pasado(j, a)).sort((x, y) => pasado(j, a)[y] - pasado(j, a)[x])[0]) : null;
      log.push(Object.assign({ temporada: temporadaTxt(nuevoAnio), jugador: j.n, pos: j.pos, niv: Math.round(j.niv), de: de.nombre, a: a.nombre, tipo }, ex ? { traicion: ex, directa: ex === de.nombre } : {}, tipo === 'fichaje' ? { precio: pago, edad: nuevoAnio - anioNac(j) } : {}, motivo ? { motivo: MOTIVOS[motivo] || motivo } : {}));
    };
    // Contratos: más largos cuanto más joven.
    const duracion = (j) => { const e = nuevoAnio - anioNac(j); return (e <= 23 ? 5 : e <= 28 ? 4 : e <= 31 ? 3 : 2) - (hashN(j.n + nuevoAnio, 31) % 2); };
    // Sueldos: lo que ya paga cada club y lo que puede pagar. Nadie ficha a quien no puede pagar.
    const masas = new Map();
    const masa = (c) => { let v = masas.get(c); if (v === undefined) { v = c.jugadores.reduce((t, x) => t + sueldo(x), 0); masas.set(c, v); } return v; };
    const puedePagar = (c, j, gratis) => masa(c) + sueldo(j) <= presupuesto(c, nuevoAnio) * 1.05 && (gratis || precio(j, nuevoAnio, undefined, c) <= cajaDe(c, nuevoAnio) + creditoDe(c, nuevoAnio));
    const aniosEn = (j, c) => { let n = 0; for (let i = j.carrera.length - 1; i >= 0 && j.carrera[i].club === c.nombre; i--) n++; return n; };
    const jugo = new Map();
    if (M.historia.length) M.historia[M.historia.length - 1].G.forEach((x) => jugo.set(x.j, x.pj));
    // El de «su club de siempre» no se mueve en cuanto lleva tres años; el que quiere jugar se va si no juega.
    // El que acaba de llegar no se vuelve a ir al verano siguiente (Thuram y Vieri un año en el Bayern), salvo que no juegue o haya lío.
    const recienLlegado = (j, v) => v.division === 1 && aniosEn(j, v) === 1 && j.carrera.length > 1 && !sinMinutos(j) && !lios.has(j);
    // Rivalidades: nadie pasa porque sí al enemigo. Un símbolo de la casa (canterano con tres años, o seis temporadas en el club)
    // no lo hace nunca; el resto solo de tarde en tarde y con motivo (peleado, sin jugar, recién llegado, o pasando antes por otro club).
    const enemigos = enemigosDe(M);
    const pasado = (j, c) => { const riv = enemigos.get(c.nombre), n = {}; if (!riv) return n; j.carrera.forEach((t) => { if (riv.has(t.club) && !t.cedido) n[t.club] = (n[t.club] || 0) + 1; }); if (EMBLEMAS[j.n] && riv.has(EMBLEMAS[j.n])) n[EMBLEMAS[j.n]] = 9; return n; };
    const traicion = (j, v, c) => {
      if (j.relleno || !enemigos.has(c.nombre)) return false;
      const n = pasado(j, c); if (v && enemigos.get(c.nombre).has(v.nombre)) n[v.nombre] = Math.max(n[v.nombre] || 0, 1);
      const casa = (j.inicio && j.inicio.club) || (j.carrera[0] || {}).club;
      return Object.keys(n).some((x) => {
        const a = n[x];
        if ((x === casa && a >= 3) || a >= 6) return true;
        if (v && v.nombre === x) return !((lios.has(j) || sinMinutos(j) || a <= 1) && hashN(j.n + nuevoAnio, 53) % 5 === 0);
        let fuera = 0; for (let i = j.carrera.length - 1; i >= 0 && j.carrera[i].club !== x; i--) fuera++;
        return !(a <= 3 && fuera >= 2 && hashN(j.n + c.nombre, 59) % 3 === 0);
      });
    };
    // Los emblemas de un club no se van mientras están en edad de jugar arriba (luego, si acaso, a despedirse lejos; nunca al rival).
    const emblema = (j, v) => EMBLEMAS[j.n] === v.nombre && nuevoAnio - anioNac(j) <= 33 && !lios.has(j);
    const atado = (j, v) => emblema(j, v) || (deseo(j) === 'casa' && v.division === 1 && aniosEn(j, v) >= 3) || recienLlegado(j, v);
    // El de carácter difícil acaba mal con su club de vez en cuando, y entonces sale aunque el club no quiera.
    const lios = new Set();
    M.clubes.forEach((c) => { if (c.division === 1) c.jugadores.forEach((j) => { if (caracterDe(j) === 'conflictivo' && !j.cons && nuevoAnio - anioNac(j) >= 22 && aniosEn(j, c) >= 2 && r() < 0.15) lios.add(j); }); });
    // Una figura que sobra en su puesto (el cuarto delantero de nivel, el segundo portero de nivel) también quiere irse a jugar.
    const clubDe = new Map(); M.clubes.forEach((c) => c.jugadores.forEach((j) => clubDe.set(j, c)));
    const sobra = (j) => { const c = clubDe.get(j); if (!c || j.relleno || Motor.escala.mostrar(j.niv) < 650 || nuevoAnio - anioNac(j) < 23) return false;
      return c.jugadores.filter((x) => x.pos === j.pos && !x.cedido && x.niv > j.niv).length >= IDEAL_ONCE[j.pos] + (j.pos === 'POR' ? 0 : 0); };
    const sinMinutos = (j) => (deseo(j) === 'minutos' && nuevoAnio - anioNac(j) >= 22 && (jugo.get(j) || 0) < 14) || sobra(j);
    // Y un club no amontona figuras del mismo puesto: con el once y un recambio de nivel parecido, no entra otro más.
    const tapon = (j, c) => c.jugadores.filter((x) => x.pos === j.pos && !x.cedido && x.niv >= j.niv - 45).length >= IDEAL_ONCE[j.pos] + 1;
    // 1. Vuelven los cedidos.
    M.clubes.forEach((c) => c.jugadores.filter((j) => j.cedido).forEach((j) => {
      const dueno = porNombre.get(j.cedido);
      j.cedido = null;
      if (dueno && dueno !== c) mover(j, c, dueno, 'vuelve de cesión');
    }));
    // 2. Debutantes reales de este año, en su club de verdad (estén en la categoría que estén en la partida).
    const deNuevo = M.debutantes.filter((d) => d.debut === nuevoAnio);
    if (!M.vistos) { M.vistos = new Set(M.vistosInicio || []); }
    const clave = (n, nac) => n + '|' + nac, buscados = new Set(deNuevo.map((d) => clave(d.nombre, d.nac)));
    const dondeEsta = new Map();
    M.clubes.forEach((x) => x.jugadores.forEach((j) => { const k = clave(j.n, j.nac); if (buscados.has(k) && !dondeEsta.has(k)) dondeEsta.set(k, x); }));
    deNuevo.forEach((d) => {
      const c = porNombre.get(d.club) || M.clubes.find((x) => x.nombre === d.club);
      if (!c) return;
      // Un escocés o un galés en Inglaterra no es extranjero, aunque los datos lo marquen así.
      if (d.tipo === 'extranjero' && extranjero({ nacion: d.pais || c.pais }, c.pais) && !Epoca.reglas(c.pais, nuevoAnio).extranjerosNuevos) return;
      // Paso de respaldo: solo vale si el jugador aún no ha entrado en la partida (su primer club real no se juega).
      if (d.respaldo && M.vistos.has(clave(d.nombre, d.nac))) return;
      // Si ya está en la partida (en otro país), es un traspaso real: se mueve, no se crea otro igual.
      const ya = dondeEsta.get(clave(d.nombre, d.nac));
      if (ya) { if (ya !== c) { const j = ya.jugadores.find((x) => x.n === d.nombre && x.nac === d.nac); j.cedido = null; mover(j, ya, c, 'fichaje'); dondeEsta.set(clave(d.nombre, d.nac), c); } return; }
      const libreYa = M.libres.find((j) => j.n === d.nombre && j.nac === d.nac);
      if (libreYa) { M.libres = M.libres.filter((j) => j !== libreYa); c.jugadores.push(libreYa); dondeEsta.set(clave(libreYa.n, libreYa.nac), c); log.push({ temporada: temporadaTxt(nuevoAnio), jugador: libreYa.n, pos: libreYa.pos, niv: Math.round(libreYa.niv), de: 'sin club', a: c.nombre, tipo: 'libre' }); return; }
      const j = { n: d.nombre, completo: d.completo, pos: d.pos, nac: d.nac, pais: d.pais, nacion: d.pais || c.pais, niv: d.niv, tec: d.tec, tecReal: d.tec, pj: 0, g: 0, carrera: [], inicio: { niv: d.niv, club: c.nombre }, debut: nuevoAnio };
      // Los que llegan durante la partida traen también su definición (antes se perdía y Messi remataba como un medio cualquiera).
      M.vistos.add(clave(d.nombre, d.nac));
      if (d.fin) j.fin = d.fin;
      if (d.gol) j.gol = d.gol;
      j.rol = d.rol || Motor.rol(j);
      c.jugadores.push(j);
      dondeEsta.set(clave(j.n, j.nac), c);
      log.push({ temporada: temporadaTxt(nuevoAnio), jugador: j.n, pos: j.pos, niv: j.niv, tec: j.tec, extranjero: d.tipo === 'extranjero', de: d.tipo === 'extranjero' ? (d.pais || 'extranjero') : d.tipo === 'regresa' ? 'vuelve' : 'cantera', a: c.nombre, tipo: 'debut' });
    });
    // 3. Los filiales suben a sus mejores jóvenes al primer equipo.
    Object.entries(MATRIZ).forEach(([f, m]) => {
      const fil = porNombre.get(f), mat = porNombre.get(m);
      if (!fil || !mat) return;
      const corte = mat.jugadores.map((j) => j.niv).sort((a, b) => b - a)[15] || 700;
      fil.jugadores.filter((j) => nuevoAnio - anioNac(j) <= 23 && j.niv >= corte - 20).forEach((j) => mover(j, fil, mat, 'sube del filial'));
    });
    // 4. Fichajes: los clubes con más prestigio eligen primero.
    // El mercado se mueve más con los años: poco hasta 1980, bastante después y mucho desde la ley Bosman (1996),
    // cuando las figuras cambian de club y de país con facilidad y los comunitarios dejan de contar como extranjeros.
    const fluidez = nuevoAnio >= 1996 ? 1 : nuevoAnio >= 1980 ? 0.4 : 0;
    const orden = [...M.clubes].filter((c) => !esFilial(c) && c.division <= 2).sort((a, b) => (b.prestigio + r() * 150) - (a.prestigio + r() * 150));  // el más grande no siempre llega primero: sin eso, un club encadenaba 18 ligas
    const fichados = new Set();
    const ventas = new Map();
    // Un club vende como mucho tres jugadores por verano y nunca se queda corto en un puesto.
    // Los de Tercera no juegan en la partida: venden sin esos límites.
    const puedeVender = (v, pos) => v.division === 3 || ((ventas.get(v) || 0) < 3 && v.jugadores.filter((x) => x.pos === pos && !x.cedido).length > IDEAL[pos]);
    // Fichar en otro país: solo jugadores de nivel, si las reglas de la época dejan entrar extranjeros y queda cupo.
    const abierto = {};
    const puedeEntrar = (j, comprador) => {
      if (tapon(j, comprador)) return false;
      if (!extranjero(j, comprador.pais)) return true;
      if (comprador.nombre === 'Atlético Bilbao') return false;  // solo jugadores de casa
      if (!(comprador.pais in abierto)) abierto[comprador.pais] = Epoca.reglas(comprador.pais, nuevoAnio).extranjerosNuevos;
      const P = M.paises.find((x) => x.pais === comprador.pais);
      // Desde 1996 (Bosman) el cupo de extranjeros ya no frena a nadie: los grandes tienen quince o veinte.
      const cupo = fluidez === 1 ? 99 : (P && P.cupo && porAnio(P.cupo[comprador.division], nuevoAnio)) || CUPO_EXTRANJEROS;
      return abierto[comprador.pais] && comprador.jugadores.filter((x) => extranjero(x, comprador.pais)).length < cupo;
    };
    // El campeón se conforma y los grandes que no ganaron se refuerzan más: así ninguna racha dura veinte años.
    const prevH = M.historia[M.historia.length - 1];
    const campeones = new Set(prevH ? [prevH.campeon].concat((prevH.otros || []).map((o) => o.campeon)).filter(Boolean) : []);
    // Un grande no refuerza a un rival directo de su liga, y desde 1996 los clubes de élite se quitan figuras entre países
    // (Zidane de la Juventus al Madrid) aunque el vendedor tenga tanto nombre como el comprador.
    const vende = (v, comprador, fuera) => v.division === 3
      || (v.pais === comprador.pais ? comprador.prestigio >= v.prestigio + (v.prestigio >= 750 ? 150 : 40)
        : comprador.prestigio >= v.prestigio + 40 || (fluidez === 1 && fuera && comprador.prestigio >= 820 && comprador.prestigio >= v.prestigio - 60));
    // Quien ya es claramente el más fuerte de su liga no ficha ese verano: no lo necesita (y así no se escapa del todo).
    const fuerzas = new Map(M.clubes.filter((c) => c.division === 1).map((c) => [c, fuerzaOnce(c)]));
    const sobrado = (c) => {
      if (!fuerzas.has(c)) return false;
      let otro = 0;
      fuerzas.forEach((f, x) => { if (x !== c && x.pais === c.pais && f > otro) otro = f; });
      if (fuerzas.get(c) < otro + 25) return false;
      // Mandar en casa no basta: desde los 90, quien arrasa en su liga pero tiene por delante a tres o más clubes
      // de Europa sigue fichando para competir fuera (el Bayern, el PSG, el Oporto).
      if (nuevoAnio >= 1992 && !NO_EUROPA.includes(c.pais)) { let mejores = 0; fuerzas.forEach((f, x) => { if (!NO_EUROPA.includes(x.pais) && f > fuerzas.get(c)) mejores++; }); if (mejores >= 3) return false; }
      return true;
    };
    // Constantes: una leyenda no sale de su club mientras dura su época, y las de 'elite' solo fichan por un grande.
    const seVende = (j, v, comprador) => !traicion(j, v, comprador) && seVende0(j, v, comprador);
    const seVende0 = (j, v, comprador) => { const K = CONSTANTES[j.n]; return !K || j.relleno || (!(K.club === v.nombre && nuevoAnio <= K.fiel) && (!K.elite || ((grandes.length ? grandes.includes(comprador) : comprador.prestigio >= 800) && !comprador.jugadores.some((x) => x.cons)))); };
    // Las leyendas 'elite' (Cristiano, Mbappé) no se quedan en una liga menor: en cuanto son figuras mundiales
    // (nivel 900) se las lleva uno de los clubes más fuertes de las grandes ligas. En cuál acaban lo decide la partida.
    const LIGAS_GRANDES = ['España', 'Inglaterra', 'Italia', 'Alemania'];
    const grandes = [...fuerzas.keys()].filter((c) => LIGAS_GRANDES.includes(c.pais) && c.prestigio >= 760).sort((a, b) => fuerzas.get(b) - fuerzas.get(a)).slice(0, 6);
    if (grandes.length) M.clubes.forEach((v) => v.jugadores.slice().forEach((j) => {
      const K = CONSTANTES[j.n];
      if (!K || !K.elite || j.relleno || j.niv < Motor.escala.interno(900) || (LIGAS_GRANDES.includes(v.pais) && v.prestigio >= 750)) return;
      // Mejor a un grande que no tenga ya a otra leyenda: Mbappé no se junta con Messi.
      const sinLeyenda = grandes.filter((g) => !g.jugadores.some((x) => x.cons));
      const destinos = (sinLeyenda.length ? sinLeyenda : grandes).filter((g) => !traicion(j, v, g));
      if (!destinos.length) return;
      const a = destinos[Math.floor(r() * Math.min(4, destinos.length))];
      j.cedido = null; fichados.add(j); mover(j, v, a, 'fichaje');
    }));
    // Contratos (desde 1996, con la ley Bosman): cuando se acaba, el jugador decide. Casi todos renuevan; el que no,
    // se va gratis a un club donde sea titular. Antes de 1996 el club retenía al jugador y esto no existía.
    if (fluidez === 1) {
      const gratis = new Map();
      let totalGratis = 0;
      const titularEn = (c, j) => { const xs = c.jugadores.filter((x) => x.pos === j.pos && !x.cedido).map((x) => x.niv).sort((a, b) => b - a); const n = IDEAL_ONCE[j.pos]; return xs.length < n ? 0 : xs[n - 1]; };
      M.clubes.filter((v) => v.division <= 2).forEach((v) => v.jugadores.slice().forEach((j) => {
        if (j.contrato == null) j.contrato = nuevoAnio + 1 + (hashN(j.n, 31) % 4);
        if (j.contrato > nuevoAnio || j.cedido || j.debut === nuevoAnio) return;
        const K = CONSTANTES[j.n], edad = nuevoAnio - anioNac(j), quiere = deseo(j);
        const renueva = () => { j.contrato = nuevoAnio + duracion(j); if (!j.relleno && j.niv >= 820) log.push({ temporada: temporadaTxt(nuevoAnio), jugador: j.n, pos: j.pos, niv: Math.round(j.niv), de: v.nombre, a: v.nombre, tipo: 'renovación', hasta: j.contrato }); };
        if (j.relleno || (K && (K.club === v.nombre && nuevoAnio <= K.fiel)) || j.cons || v.division !== 1 || edad < 21) return renueva();
        // Renovar: depende de lo que busca, de si juega y de cómo le fue al club.
        let p = quiere === 'casa' ? 0.99 : 0.95;
        if (sinMinutos(j) || (jugo.get(j) || 0) < 10) p -= 0.3;
        if (quiere === 'titulos' && !campeones.has(v.nombre) && v.balance !== 'superado') p -= 0.04;
        if (quiere === 'dinero' && masa(v) > presupuesto(v, nuevoAnio)) p -= 0.12;
        if (quiere === 'reto' && aniosEn(j, v) >= 4) p -= 0.08;
        if (lios.has(j)) p -= 0.4;
        if (v.balance === 'superado') p += 0.03;
        // A sus figuras el club las renueva antes de que llegue el día: solo se escapan gratis muy de vez en cuando.
        const tercero = v.jugadores.map((x) => x.niv).sort((a, b) => b - a)[2] || 0;
        if (j.niv >= tercero && !lios.has(j)) p = Math.max(p, 0.985);
        if (totalGratis >= 30 || r() < p) return renueva();
        const mia = fuerzas.get(v) || 0;
        const destinos = [...fuerzas.keys()].filter((c) => c !== v && !esFilial(c) && (gratis.get(c) || 0) < 1 && j.niv > titularEn(c, j) + 5 && puedeEntrar(j, c) && seVende(j, v, c) && puedePagar(c, j, true)
          && (!NO_EUROPA.includes(c.pais) || !extranjero(j, c.pais)) && (c.pais === v.pais || j.niv >= NIVEL_EXTRANJERO)
          // Se va gratis a algo mejor, o a algo parecido si lo que quiere es jugar, dinero o cambiar de aires.
          && (fuerzas.get(c) > mia + 5 || ((sinMinutos(j) || quiere !== 'titulos') && fuerzas.get(c) > mia - 40)))
          .map((c) => ({ c, gana: fuerzas.get(c) + 0.2 * c.prestigio + 80 * r() + (quiere === 'dinero' ? 30 * Math.log(presupuesto(c, nuevoAnio) / Math.max(1, masa(c))) : 0) + (quiere === 'reto' && c.pais !== v.pais ? 40 : 0) }))
          .sort((a, b) => b.gana - a.gana);
        if (!destinos.length) return renueva();
        const c = destinos[0].c;
        totalGratis++;
        gratis.set(c, (gratis.get(c) || 0) + 1); fichados.add(j);
        mover(j, v, c, 'fichaje', 'gratis');
      }));
    }
    // Las figuras se juntan en los grandes (desde 1980, y del todo desde 1996). Sin esto, con los años los mejores del
    // mundo quedaban repartidos por cincuenta clubes (De Bruyne en el Auxerre, Neymar toda su carrera en el Santos), los
    // grandes se desinflaban y cualquiera ganaba la Champions. Cada verano, los mejores jugadores del mundo que no están
    // en un club de élite reciben la oferta de uno donde serían titulares; cuanto mejor el jugador, más probable.
    if (fluidez > 0) {
      const europeos = [...fuerzas.keys()].filter((c) => !NO_EUROPA.includes(c.pais));
      // La élite son los veinte clubes europeos de más prestigio: no solo los cinco gigantes, también los Valencia, Roma o Dortmund de cada época.
      const elite = europeos.filter((c) => c.prestigio >= 640).sort((a, b) => b.prestigio - a.prestigio).slice(0, 20);
      const esElite = new Set(elite), llegadas = new Map();
      const estrellas = [];
      M.clubes.forEach((v) => v.jugadores.forEach((j) => { if (!j.relleno && !j.cedido && j.debut !== nuevoAnio && nuevoAnio - anioNac(j) <= 31 && nuevoAnio - anioNac(j) >= 18) estrellas.push({ j, v }); }));
      estrellas.sort((a, b) => b.j.niv - a.j.niv);
      const N = Math.round(40 + 110 * fluidez);
      // Subir desde un club de élite: a uno claramente más fuerte de su liga, o de una liga menor a un grande de las cuatro grandes.
      const sube = (c, v) => (LIGAS_GRANDES.includes(c.pais) && !LIGAS_GRANDES.includes(v.pais)) ? c.prestigio >= v.prestigio - 60 && fuerzas.get(c) > (fuerzas.get(v) || 0) - 15 : fuerzas.get(c) > (fuerzas.get(v) || 0) + 20 && c.prestigio >= v.prestigio - 20;
      estrellas.slice(0, N).forEach(({ j, v }, k) => {
        if (fichados.has(j)) return;
        // Dentro de la élite también se sube: del Saint-Étienne a la Juventus, del Gladbach al Bayern. Cuesta más y solo hacia un club claramente mayor.
        // (Desde 1996 no hace falta: el mercado libre ya mueve a las figuras entre grandes, y sumarlo creaba dinastías de diez Champions.)
        const yaElite = esElite.has(v);
        const quiere = deseo(j);
        const K0 = CONSTANTES[j.n];
        if (atado(j, v)) return;
        // Hoy, entre clubes de élite solo se mueve quien tiene un motivo: ganar más títulos, cambiar de aires o que no juega.
        const inquieto = yaElite && fluidez === 1 && nuevoAnio - anioNac(j) >= 23 && ((quiere === 'titulos' && aniosEn(j, v) >= 2 && !campeones.has(v.nombre)) || (quiere === 'reto' && aniosEn(j, v) >= 4) || (quiere === 'dinero' && aniosEn(j, v) >= 3));
        if (yaElite && fluidez === 1 && !lios.has(j) && !(inquieto && r() < (K0 && K0.elite ? 0.6 : 0.3))) return;
        const K = CONSTANTES[j.n];
        if (K && K.club === v.nombre && nuevoAnio <= K.fiel) return;
        // Cuanto más arriba en la lista, menos tarda en salir: el número 1 se va casi seguro, el 100 una vez de cada cuatro.
        if (r() > (0.9 - 0.55 * k / N) * (0.5 + 0.5 * fluidez) * (yaElite ? 0.7 : 1)) return;
        const titular = (c) => { const xs = c.jugadores.filter((x) => x.pos === j.pos && !x.cedido).map((x) => x.niv).sort((a, b) => b - a); const n = IDEAL_ONCE[j.pos]; return xs.length < n ? 0 : xs[n - 1]; };
        const destinos = elite.filter((c) => c !== v && (llegadas.get(c) || 0) < 2 && !sobrado(c) && j.niv > titular(c) + 5 && puedeEntrar(j, c) && seVende(j, v, c) && puedePagar(c, j)
          && (!inquieto || lios.has(j) || (quiere === 'titulos' ? fuerzas.get(c) > (fuerzas.get(v) || 0) + 15 : quiere === 'reto' ? c.pais !== v.pais && c.prestigio >= v.prestigio - 80 : presupuesto(c, nuevoAnio) > presupuesto(v, nuevoAnio) * 1.1))
          // Las figuras de fuera van a las ligas que de verdad las traían en cada época (Italia y España; Inglaterra, casi ninguna hasta los 90).
          && (!extranjero(j, c.pais) || r() < (porAnio(ATRACCION[c.pais], nuevoAnio) || 0.3))
          && (inquieto || lios.has(j) || (yaElite ? sube(c, v) : fuerzas.get(c) > (fuerzas.get(v) || 0)))).map((c) => ({ c, gana: j.niv - titular(c) + 0.3 * (c.prestigio - 700) + 120 * r()
            // Cada uno elige según lo que busca: el que quiere títulos mira al más fuerte, el del contrato al que más paga, el de los retos a otro país.
            + (quiere === 'titulos' ? 1.5 * (fuerzas.get(c) - (fuerzas.get(v) || 0)) : quiere === 'dinero' ? 25 * Math.log(presupuesto(c, nuevoAnio) / Math.max(1, masa(c))) + 0.2 * (c.prestigio - 700) : quiere === 'reto' && c.pais !== v.pais ? 60 : 0) })).sort((a, b) => b.gana - a.gana);
        if (!destinos.length) return;
        const c = destinos[0].c;
        llegadas.set(c, (llegadas.get(c) || 0) + 1); fichados.add(j);
        mover(j, v, c, 'fichaje', lios.has(j) ? 'lio' : quiere === 'titulos' || quiere === 'dinero' || quiere === 'reto' ? quiere : undefined);
      });
      // El talonario: de vez en cuando (no cada verano) un grande con la caja llena paga lo que le piden por una figura
      // de un club menor. Como mucho uno en todo el mercado, y solo si el jugador mejora de verdad su once.
      if (fluidez > 0) {
        let golpes = 0;
        const gal = (c) => estiloPresi(c, nuevoAnio) === 'galactico';
        elite.filter((c) => cajaDe(c, nuevoAnio) > (gal(c) ? 0.15 : 0.6) * ingresosDe(c, nuevoAnio) && (llegadas.get(c) || 0) < (gal(c) ? 2 : 1) && !sobrado(c)).sort((a, b) => gal(b) - gal(a) || b.caja / ingresosDe(b, nuevoAnio) - a.caja / ingresosDe(a, nuevoAnio)).forEach((c) => {
          if (golpes >= 1 || r() > (gal(c) ? 0.5 : 0.22)) return;
          const titular = (j) => { const xs = c.jugadores.filter((x) => x.pos === j.pos && !x.cedido).map((x) => x.niv).sort((a, b) => b - a); const n = IDEAL_ONCE[j.pos]; return xs.length < n ? 0 : xs[n - 1]; };
          const cand = estrellas.find(({ j, v }) => !fichados.has(j) && v !== c && v.prestigio <= c.prestigio - (gal(c) ? 0 : 60) && !atado(j, v) && j.niv > titular(j) + 15 && Motor.escala.mostrar(j.niv) >= 660 && nuevoAnio - anioNac(j) <= 29
            && !(CONSTANTES[j.n] && CONSTANTES[j.n].club === v.nombre && nuevoAnio <= CONSTANTES[j.n].fiel) && puedeEntrar(j, c) && seVende(j, v, c) && puedePagar(c, j));
          if (!cand) return;
          golpes++; llegadas.set(c, (llegadas.get(c) || 0) + 1); fichados.add(cand.j);
          mover(cand.j, cand.v, c, 'fichaje', 'talonario');
        });
      }
    }
    // Antes de 1980 no había mercado internacional, pero dentro de cada país las figuras sí acababan en un grande:
    // Rivera del Alessandria al Milan, Amancio del Deportivo al Madrid. Sin esto se pasaban la carrera en un club menor.
    if (fluidez === 0) {
      const cand = [], llegan = new Map();
      M.clubes.forEach((v) => { if (v.division === 1 && v.prestigio >= 650) return; v.jugadores.forEach((j) => { const e = nuevoAnio - anioNac(j); if (!j.relleno && !j.cedido && !j.cons && j.debut !== nuevoAnio && e >= 19 && e <= 29 && Motor.escala.mostrar(j.niv) >= 700) cand.push({ j, v }); }); });
      cand.sort((a, b) => b.j.niv - a.j.niv).slice(0, 15).forEach(({ j, v }) => {
        if (fichados.has(j) || (deseo(j) === 'casa' && v.division === 1) || r() > 0.5) return;
        const titularEn = (c) => { const xs = c.jugadores.filter((x) => x.pos === j.pos && !x.cedido).map((x) => x.niv).sort((a, b) => b - a); const n = IDEAL_ONCE[j.pos]; return xs.length < n ? 0 : xs[n - 1]; };
        const destinos = M.clubes.filter((c) => c !== v && c.pais === v.pais && c.division === 1 && c.prestigio >= Math.max(700, v.prestigio + 80) && !esFilial(c) && !sobrado(c) && !(llegan.get(c) > 0) && j.niv > titularEn(c) + 5 && seVende(j, v, c))
          .sort((a, b) => b.prestigio - a.prestigio).slice(0, 5);
        if (!destinos.length) return;
        const c = destinos[Math.floor(r() * destinos.length)];
        llegan.set(c, 1); fichados.add(j);
        mover(j, v, c, 'fichaje');
      });
    }
    // Un club con proyecto no se desarma: los que acabaron arriba el año pasado retienen mejor a sus figuras,
    // y más a los que se hicieron en casa. Sin esto el Liverpool de Shankly o el Leeds de Revie se quedaban sin equipo
    // antes de llegar a serlo, y un solo grande (el United) se llevaba a todos.
    const arriba = new Set();
    if (prevH && prevH.R) [prevH.R.T].concat((prevH.R.otros || []).flatMap((o) => (o.ligas || []).filter((l) => l.nivel === 1).map((l) => l.T))).filter(Boolean).forEach((T) => T.tabla.slice(0, 5).forEach((t) => arriba.add(t.nombre)));
    const deCasa = (j, v) => j.carrera.length > 0 && j.carrera.every((t) => t.club === v.nombre) && nuevoAnio - anioNac(j) <= 28;
    // Antes de los 80 los traspasos eran pocos: los clubes retenían a sus jugadores y un equipo se hacía en años.
    const calma = 0.4 + 0.6 * Math.min(1, fluidez * 2.5);
    // Un club que paga más de lo que ingresa tiene que vender: sus rivales lo saben y le compran a quien antes no soltaba.
    const apuros = new Set(fluidez > 0 ? M.clubes.filter((c) => c.division === 1 && (masa(c) > presupuesto(c, nuevoAnio) * 1.15 || cajaDe(c, nuevoAnio) < -0.35 * ingresosDe(c, nuevoAnio) || (estiloPresi(c, nuevoAnio) === 'tacano' && hashN(c.nombre + nuevoAnio, 9) % 2 === 0))) : []);
    orden.forEach((comprador) => {
      let compras = 0, figuras = 0;
      if (sobrado(comprador)) return;
      const pol = fluidez > 0 ? politica(comprador) : 'normal';
      const tope = Math.max(1, (fluidez > 0 ? 2 : 1) + (fluidez === 1 ? 1 : 0) + (campeones.has(comprador.nombre) ? -1 : comprador.prestigio >= 800 ? 1 : 0) + (pol === 'cantera' ? -1 : 0) + (comprador.balance === 'fracaso' && comprador.prestigio >= 650 ? 1 : 0));
      for (let vuelta = 0; vuelta < 3 + fluidez + 1 && compras < tope; vuelta++) {
        // El puesto más flojo del once respecto a la media del club.
        const xi = (pos, k) => comprador.jugadores.filter((j) => j.pos === pos && !j.cedido).map((j) => j.niv).sort((a, b) => b - a).slice(0, k);
        const huecos = { POR: xi('POR', 1), DEF: xi('DEF', 4), MED: xi('MED', 3), DEL: xi('DEL', 3) };
        const mediaClub = media(Object.values(huecos).flat());
        const pos = Object.keys(huecos).sort((a, b) => (media(huecos[a]) || 0) - (media(huecos[b]) || 0))[0];
        const umbral = Math.max(huecos[pos].length ? Math.min(...huecos[pos]) : 0, mediaClub - 40) + 25;
        // Mirar fuera es una decisión del club, no de cada jugador: los países que casi no fichaban fuera casi nunca lo hacen.
        // Los clubes con ojeadores miran fuera mucho más, y buscan al joven que va para figura antes que al ya hecho.
        const ojea = pol === 'ojeadores' && vuelta < 2;
        const mirarFuera = comprador.division === 1 && r() < (porAnio(ATRACCION[comprador.pais], nuevoAnio) || 0.3) * (pol === 'ojeadores' ? 2 : 1);
        // Primero los clubes que pueden vender (más rápido que mirar a todos los jugadores del mundo).
        const cand = M.clubes.filter((v) => v !== comprador && !esFilial(v) && MATRIZ[v.nombre] !== comprador.nombre
            && (v.pais === comprador.pais || mirarFuera) && puedeVender(v, pos))
          .flatMap((v) => v.jugadores.filter((j) => j.pos === pos && !j.cedido && j.debut !== nuevoAnio && !fichados.has(j) && seVende(j, v, comprador) && nuevoAnio - anioNac(j) <= (ojea ? 23 : 30)
            && (ojea ? j.tec >= umbral + 30 && j.niv >= umbral - 60 : j.niv >= umbral) && !atado(j, v) && puedePagar(comprador, j)
            // Además de lo de siempre, sale quien no juega y quiere jugar, y los caros de un club en apuros (nunca a un rival directo mayor).
            && (vende(v, comprador, mirarFuera) || (sinMinutos(j) && comprador.prestigio >= v.prestigio - 200) || (apuros.has(v) && v.pais !== comprador.pais && comprador.prestigio >= v.prestigio - 150 && sueldo(j) >= 2))
            // Argentina y Brasil solo traen de fuera a los suyos que vuelven: una figura europea no se va a jugar allí.
            && (v.pais === comprador.pais || (j.niv >= NIVEL_EXTRANJERO && puedeEntrar(j, comprador) && (!NO_EUROPA.includes(comprador.pais) || !extranjero(j, comprador.pais))))).map((j) => ({ j, v })))
          .sort((a, b) => (ojea ? b.j.tec - a.j.tec : b.j.niv - a.j.niv));
        const tercera = new Map(), titular = new Map();
        const elegido = cand.find(({ j, v }) => {
          // Un club no suelta fácil a una de sus tres figuras; irse a otro país cuesta más.
          if (!tercera.has(v)) tercera.set(v, v.jugadores.map((x) => x.niv).sort((a, b) => b - a).slice(0, 3).pop());
          const figura = j.niv >= tercera.get(v);
          if (sinMinutos(j)) return r() < 0.7;
          // Un titular no se va a un equipo claramente peor que el suyo (Ronaldo no deja el Inter por un club de media tabla).
          if (v.division === 1 && fuerzas.has(v) && fuerzas.has(comprador) && fuerzas.get(comprador) < fuerzas.get(v) - 10 && j.niv >= (titular.get(v) || (titular.set(v, v.jugadores.map((x) => x.niv).sort((a, b) => b - a)[10] || 0), titular.get(v)))) return false;
          // Una figura por verano y club, como mucho: nadie se lleva a medio campeonato de golpe.
          if (figura && figuras >= 1) return false;
          const apego = (figura ? (arriba.has(v.nombre) ? 0.4 : 1) * (deCasa(j, v) ? 0.5 : 1) : 1) * (apuros.has(v) && sueldo(j) >= 2 ? 2 : 1) * (deseo(j) === 'casa' ? 0.4 : 1) * (lios.has(j) ? 3 : 1) * (v.balance === 'superado' ? 0.6 : 1);
          return r() < (figura ? (comprador.prestigio - v.prestigio > 150 ? 0.3 + 0.4 * fluidez : 0.15 + 0.3 * fluidez) : 0.6) * apego * calma * (v.pais === comprador.pais ? 1 : 0.35 + 0.45 * fluidez);
        });
        if (!elegido) continue;
        if (elegido.j.niv >= tercera.get(elegido.v)) figuras++;
        fichados.add(elegido.j);
        ventas.set(elegido.v, (ventas.get(elegido.v) || 0) + 1);
        // Los ojeadores a veces aciertan de pleno y a veces se equivocan: el chaval resulta mejor o peor de lo que parecía.
        if (ojea && !elegido.j.cons && !elegido.j.relleno) { const u = r(); if (u < 0.2) elegido.j.tec = Math.max(elegido.j.niv + 5, elegido.j.tec * 0.94); else if (u > 0.85) elegido.j.tec = Math.min(1090, elegido.j.tec * 1.05); }
        mover(elegido.j, elegido.v, comprador, 'fichaje', lios.has(elegido.j) ? 'lio' : sinMinutos(elegido.j) ? 'minutos' : ojea ? 'ojeadores' : apuros.has(elegido.v) && sueldo(elegido.j) >= 2 ? 'apuro' : undefined);
        compras++;
      }
    });
    // 5. Cesiones: jóvenes sin minutos en clubes grandes van a jugar a un club menor.
    const minutos = new Map();
    M.historia.length && M.historia[M.historia.length - 1].G.forEach((x) => minutos.set(x.j, x.pj));
    M.clubes.filter((c) => c.prestigio >= 700).forEach((c) => {
      const corte = c.jugadores.map((j) => j.niv).sort((a, b) => b - a)[13] || 0;
      c.jugadores.filter((j) => j.debut !== nuevoAnio && nuevoAnio - anioNac(j) <= 21 && j.niv < corte && (minutos.get(j) || 0) < 8 && j.tec > j.niv + 40).forEach((j) => {
        const destino = M.clubes.filter((d) => d !== c && d.pais === c.pais && !esFilial(d) && d.division <= 2 && d.prestigio < c.prestigio - 150 && !(enemigos.get(c.nombre) || new Set()).has(d.nombre) && d.jugadores.filter((x) => x.pos === j.pos).length < IDEAL[j.pos] + 1)
          .sort(() => r() - 0.5)[0];
        if (!destino) return;
        mover(j, c, destino, 'cesión');
        j.cedido = c.nombre;
      });
    });
    // 6. Plantillas: los que sobran quedan libres; a los cortos se les completa con libres.
    M.clubes.forEach((c) => {
      while (c.jugadores.length > 28) {
        const peor = c.jugadores.filter((j) => !j.cedido).sort((a, b) => a.niv - b.niv)[0];
        c.jugadores = c.jugadores.filter((j) => j !== peor);
        M.libres.push(peor);
        log.push({ temporada: temporadaTxt(nuevoAnio), jugador: peor.n, pos: peor.pos, niv: Math.round(peor.niv), de: c.nombre, a: 'sin club', tipo: 'baja' });
      }
    });
    // A los cortos se les completa con libres y, si no hay, con jugadores de los clubes de Tercera.
    const terceras = M.clubes.filter((c) => c.division === 3 && c.pais === 'España');
    const rellenaPais = new Set(M.paises.filter((P) => P.rellenar).map((P) => P.pais));
    M.clubes.filter((c) => c.division <= 2).forEach((c) => {
      Object.entries(IDEAL).forEach(([pos, k]) => {
        while (c.jugadores.filter((j) => j.pos === pos).length < k - 1) {
          // Los libres se quedan en su país: nadie cruza la frontera para ser suplente.
          const libre = M.libres.filter((j) => j.pos === pos && !extranjero(j, c.pais) && !traicion(j, null, c)).sort((a, b) => b.niv - a.niv)[0];
          if (libre) {
            M.libres = M.libres.filter((j) => j !== libre);
            c.jugadores.push(libre);
            log.push({ temporada: temporadaTxt(nuevoAnio), jugador: libre.n, pos, niv: Math.round(libre.niv), de: 'sin club', a: c.nombre, tipo: 'libre' });
            continue;
          }
          // Sin libres: España tira de Tercera; los demás países, de los clubes que bajaron a la categoría que no se juega
          // y, si no basta, de los clubes de su país con gente de sobra en ese puesto.
          const abajo = M.clubes.filter((v) => v !== c && v.pais === c.pais && v.division === 3);
          const sobra = M.clubes.filter((v) => v !== c && v.pais === c.pais && v.division <= 2 && v.jugadores.filter((x) => x.pos === pos).length >= k);
          // De abajo, el mejor; de los que tienen de sobra, su suplente más flojo (nadie regala a una figura).
          const de = (vs, peor) => vs.flatMap((v) => v.jugadores.filter((j) => j.pos === pos && !j.cedido).map((j) => ({ j, v }))).sort((a, b) => (peor ? a.j.niv - b.j.niv : b.j.niv - a.j.niv))[0];
          const t = c.pais === 'España' ? de(terceras) : de(abajo) || de(sobra, true);
          if (t) { mover(t.j, t.v, c, 'fichaje'); continue; }
          // Último recurso, solo si la partida o el país lo permiten: un suplente anónimo de nivel bajo (clubes sin plantilla real completa).
          // (Antes solo se hacía en países con relleno; con plantillas de Wikidata un club recién ascendido puede llegar vacío a cualquier liga.)
          const base = Math.min(...c.jugadores.map((j) => j.niv), 300 + 0.4 * c.prestigio) - 20;
          const n = c.jugadores.filter((j) => j.relleno).length + 1;
          c.jugadores.push({ n: `Suplente ${n} (${c.nombre})`, pos, nac: `${nuevoAnio - 24}-01-01`, nacion: c.pais, niv: base, tec: base, tecReal: base, pj: 0, g: 0, carrera: [], inicio: { niv: base, club: c.nombre }, rol: pos === 'DEL' ? 'DC' : pos, relleno: true });
        }
      });
    });
    return log;
  }

  // Prestigio: sube con los títulos y con quedar por encima de lo esperado; baja al revés.
  function prestigio(M, R) {
    const ajusta = (c, d) => (c.prestigio = Math.max(250, Math.min(1000, Math.round(c.prestigio + d))));
    const tabla = (T) => T.tabla.forEach((t, i) => {
      const esperado = [...T.tabla].sort((a, b) => b.equipo.prestigio - a.equipo.prestigio).indexOf(t);
      ajusta(t.equipo, (esperado - i) * 3 + (i === 0 ? 15 : 0));
    });
    tabla(R.T); R.seg.forEach((s) => tabla(s.T));
    R.otros.forEach((o) => o.ligas.forEach((l) => tabla(l.T)));
    const copas = [R.C].concat(R.otros.map((o) => o.C)).filter(Boolean);
    copas.forEach((C) => { const c = M.clubes.find((x) => x.nombre === C.campeon); if (c) ajusta(c, 10); });
    R.otros.filter((o) => o.F).forEach((o) => { const c = M.clubes.find((x) => x.nombre === o.F.campeon); if (c) ajusta(c, 15); });
    const campeonEuropa = R.EU && M.clubes.find((c) => c.nombre === R.EU.campeon);
    if (campeonEuropa) ajusta(campeonEuropa, 25);
    // Con los años el prestigio se acerca un poco a su valor de siempre.
    // Pero ese valor de siempre también se mueve, despacio: diez años buenos hacen grande a un club y diez malos lo encogen.
    // Los gigantes de cada época tienen un suelo también durante la partida (algo por debajo del de salida):
    // el Liverpool que sube en 1962 o el Bayern que llega en 1965 se hacen grandes aunque empezaran abajo.
    M.clubes.forEach((c) => { if (c.division !== 1) return; const suelo = porAnio(GIGANTES[c.nombre], M.anio + 1); if (suelo && c.prestigio < 0.92 * suelo) { c.prestigio = Math.round(Math.min(0.92 * suelo, c.prestigio + 45)); c.prestigioBase = Math.max(c.prestigioBase || 0, c.prestigio); } });
    M.clubes.forEach((c) => { c.prestigioBase = c.prestigioBase || c.prestigio; c.prestigioBase += (c.prestigio - c.prestigioBase) * 0.12; ajusta(c, (c.prestigioBase - c.prestigio) * 0.1); });
  }

  // Libro de récords de la partida, con el contexto del récord real.
  function records(M, R) {
    const temp = temporadaTxt(M.anio), libro = M.records;
    const nota = (texto) => libro.libro.push({ temporada: temp, texto });
    const top = [...R.T.jugadores].sort((a, b) => b.g - a.g)[0];
    if (top && (!libro.liga || top.g > libro.liga.g)) {
      const antes = libro.liga;
      libro.liga = { g: top.g, quien: top.nombre, club: top.club, temporada: temp };
      if (antes) nota(`${top.nombre} (${top.club}) bate el récord de goles en una Liga de la partida: ${top.g} (antes ${antes.quien}, ${antes.g}).`);
      if (top.g > RECORD_REAL_LIGA.goles) nota(`${top.nombre} supera el récord real de ${RECORD_REAL_LIGA.quien} (${RECORD_REAL_LIGA.goles} goles en ${RECORD_REAL_LIGA.temporada}).`);
    }
    const ev = R.T.resultados.flat();
    ev.forEach((m) => {
      const cuenta = {};
      m.eventos.filter((e) => e.tipo === 'gol' || e.tipo === 'pen').forEach((e) => { cuenta[e.quien + '|' + e.lado] = (cuenta[e.quien + '|' + e.lado] || 0) + 1; });
      Object.entries(cuenta).forEach(([k, g]) => {
        if (!libro.partido || g > libro.partido.g) {
          const [quien, lado] = k.split('|');
          if (libro.partido && g >= 5) nota(`${quien} marca ${g} goles en un partido de Liga (${m.local} ${m.ga}-${m.gb} ${m.visita}).`);
          libro.partido = { g, quien, club: +lado === 0 ? m.local : m.visita, temporada: temp, partido: `${m.local} ${m.ga}-${m.gb} ${m.visita}` };
        }
      });
    });
    const camp = R.T.tabla[0];
    if (!libro.equipoPts || camp.pts > libro.equipoPts.pts) { if (libro.equipoPts) nota(`${camp.nombre} hace la mejor Liga de la partida: ${camp.pts} puntos.`); libro.equipoPts = { pts: camp.pts, club: camp.nombre, temporada: temp }; }
    const gol = [...R.T.tabla].sort((a, b) => b.gf - a.gf)[0];
    if (!libro.equipoGoles || gol.gf > libro.equipoGoles.gf) libro.equipoGoles = { gf: gol.gf, club: gol.nombre, temporada: temp };
  }

  // Suelo de prestigio de los clubes grandes de siempre, por época (solo al empezar la partida).
  const GIGANTES = {
    'Real Madrid': 820, 'Barcelona': 800, 'Atlético Madrid': 720, 'Atlético Bilbao': { 1930: 700, 1990: 640 }, 'Valencia': 660,
    'Juventus': 820, 'Milan': 800, 'Inter': 800, 'Roma': 680, 'Napoli': 660, 'Bayern Múnich': { 1968: 760, 1975: 820 }, 'Borussia Dortmund': { 1990: 700 },
    'Manchester United': 800, 'Liverpool': { 1964: 760, 1975: 800 }, 'Arsenal': 740, 'Tottenham Hotspur': 680, 'Everton': { 1930: 680, 1995: 600 }, 'Chelsea': { 1955: 640, 2003: 780 }, 'Manchester City': { 2008: 780 },
    'Benfica': 740, 'Oporto': { 1980: 720 }, 'Sporting de Portugal': 680, 'Paris Saint-Germain': { 1990: 680, 2011: 800 }, 'Marsella': { 1970: 680 },
    'Boca Juniors': 720, 'River Plate': 720, 'Flamengo': 680, 'Santos': { 1958: 720, 1975: 640 }, 'São Paulo': 660, 'Corinthians': 660, 'Palmeiras': 660
  };
  // ---------- Directivas: cada club se marca un objetivo según su nombre dentro de su liga ----------
  const OBJETIVOS = { titulo: 'Ganar la liga', europa: 'Acabar entre los primeros', media: 'Temporada tranquila', salvarse: 'Salvarse' };
  // puestoNombre: su puesto en la liga si se ordenara por prestigio (0 el de más nombre); n: clubes de la liga.
  function objetivoDe(puestoNombre, n, prest) {
    if (puestoNombre <= 1 && prest >= 760) return 'titulo';
    if (puestoNombre < Math.max(4, Math.round(n * 0.3))) return 'europa';
    if (puestoNombre >= n - 5) return 'salvarse';
    return 'media';
  }
  // Cómo acabó respecto al objetivo: 'superado', 'cumplido', 'cerca' o 'fracaso'.
  function balanceDe(obj, puesto, n) {
    const arriba = Math.max(4, Math.round(n * 0.3));
    if (obj === 'titulo') return puesto === 0 ? 'cumplido' : puesto <= 1 ? 'cerca' : 'fracaso';
    if (obj === 'europa') return puesto === 0 ? 'superado' : puesto < arriba ? 'cumplido' : puesto < n * 0.55 ? 'cerca' : 'fracaso';
    if (obj === 'media') return puesto < arriba ? 'superado' : puesto < n - 4 ? 'cumplido' : puesto < n - 3 ? 'cerca' : 'fracaso';
    return puesto < n / 2 ? 'superado' : puesto < n - 3 ? 'cumplido' : 'fracaso';
  }
  function objetivos(M, R) {
    const T = [R.T].concat(...R.otros.map((o) => o.ligas.filter((l) => l.nivel === 1).map((l) => l.T))).filter((t) => t && t.tabla);
    const lista = [];
    M.clubes.forEach((c) => { c.balance = null; });
    T.forEach((t) => {
      const n = t.tabla.length, nombre = [...t.tabla].sort((a, b) => b.equipo.prestigio - a.equipo.prestigio);
      t.tabla.forEach((x, i) => {
        const obj = objetivoDe(nombre.indexOf(x), n, x.equipo.prestigio), bal = balanceDe(obj, i, n);
        x.equipo.balance = bal;
        const dt = x.equipo.entrenadores && x.equipo.entrenadores[0];
        lista.push({ club: x.equipo.nombre, pais: x.equipo.pais, objetivo: obj, puesto: i + 1, balance: bal, prestigio: x.equipo.prestigio, esperado: nombre.indexOf(x) + 1, entrenador: dt ? dt.nombre : null, aniosDT: dt ? dt.anios || 0 : 0 });
      });
    });
    return lista;
  }

  // Entrenadores de época: los grandes técnicos de la historia. Entran en la partida el año en que empezaron a entrenar
  // (si ya colgaron las botas) y es la partida la que decide dónde: los clubes grandes eligen primero.
  // [nacimiento, año en que empezó, categoría (3 leyenda, 2 grande), estilo, país]
  const MAESTROS = {
    'Helenio Herrera': [1910, 1948, 3, 'defensivo', 'Argentina'], 'Béla Guttmann': [1899, 1945, 2, 'ofensivo', 'Hungría'], 'Matt Busby': [1909, 1945, 3, 'ofensivo', 'Escocia'], 'Bill Shankly': [1913, 1949, 3, 'ofensivo', 'Escocia'],
    'Nereo Rocco': [1912, 1947, 2, 'defensivo', 'Italia'], 'Miguel Muñoz': [1922, 1959, 2, 'equilibrado', 'España'], 'Hennes Weisweiler': [1919, 1958, 2, 'ofensivo', 'Alemania'], 'Don Revie': [1927, 1961, 2, 'equilibrado', 'Inglaterra'],
    'Ernst Happel': [1925, 1962, 3, 'ofensivo', 'Austria'], 'Rinus Michels': [1928, 1965, 3, 'ofensivo', 'Países Bajos'], 'Brian Clough': [1935, 1965, 3, 'contragolpe', 'Inglaterra'], 'Telê Santana': [1931, 1969, 2, 'ofensivo', 'Brasil'],
    'Udo Lattek': [1935, 1970, 2, 'equilibrado', 'Alemania'], 'Bob Paisley': [1919, 1974, 3, 'equilibrado', 'Inglaterra'], 'Giovanni Trapattoni': [1939, 1974, 3, 'defensivo', 'Italia'], 'Alex Ferguson': [1941, 1974, 3, 'ofensivo', 'Escocia'],
    'Luis Aragonés': [1938, 1974, 2, 'contragolpe', 'España'], 'Jupp Heynckes': [1945, 1979, 2, 'equilibrado', 'Alemania'], 'Luiz Felipe Scolari': [1948, 1982, 2, 'defensivo', 'Brasil'], 'Ottmar Hitzfeld': [1949, 1983, 3, 'equilibrado', 'Alemania'],
    'Arsène Wenger': [1949, 1984, 2, 'ofensivo', 'Francia'], 'Johan Cruyff': [1947, 1985, 3, 'ofensivo', 'Países Bajos'], 'Arrigo Sacchi': [1946, 1985, 3, 'ofensivo', 'Italia'], 'Marcello Lippi': [1948, 1985, 3, 'equilibrado', 'Italia'],
    'Carlos Bianchi': [1949, 1985, 2, 'equilibrado', 'Argentina'], 'Marcelo Bielsa': [1955, 1990, 2, 'ofensivo', 'Argentina'], 'Fabio Capello': [1946, 1991, 3, 'defensivo', 'Italia'], 'Louis van Gaal': [1951, 1991, 2, 'ofensivo', 'Países Bajos'],
    'Vicente del Bosque': [1950, 1994, 2, 'equilibrado', 'España'], 'Carlo Ancelotti': [1959, 1995, 3, 'equilibrado', 'Italia'], 'Rafael Benítez': [1960, 1995, 2, 'defensivo', 'España'], 'José Mourinho': [1963, 2000, 3, 'contragolpe', 'Portugal'],
    'Roberto Mancini': [1964, 2001, 2, 'equilibrado', 'Italia'], 'Jürgen Klopp': [1967, 2001, 3, 'ofensivo', 'Alemania'], 'Massimiliano Allegri': [1967, 2004, 2, 'defensivo', 'Italia'], 'Unai Emery': [1971, 2004, 2, 'equilibrado', 'España'],
    'Diego Simeone': [1970, 2006, 2, 'defensivo', 'Argentina'], 'Antonio Conte': [1969, 2006, 2, 'defensivo', 'Italia'], 'Pep Guardiola': [1971, 2008, 3, 'ofensivo', 'España'], 'Luis Enrique': [1970, 2008, 2, 'ofensivo', 'España'],
    'Thomas Tuchel': [1973, 2009, 2, 'equilibrado', 'Alemania'], 'Zinedine Zidane': [1972, 2016, 2, 'equilibrado', 'Francia'], 'Hansi Flick': [1965, 2019, 2, 'ofensivo', 'Alemania'], 'Mikel Arteta': [1982, 2019, 2, 'ofensivo', 'España'],
    'Xabi Alonso': [1981, 2022, 2, 'ofensivo', 'España']
  };
  // La mano de cada uno: unos hacen crecer a los jóvenes y otros son especialistas en ganar eliminatorias.
  const MANOS = { jovenes: 'Hace crecer a los jóvenes', ganador: 'Especialista en eliminatorias' };
  const MANO = {};
  ['Johan Cruyff', 'Arsène Wenger', 'Matt Busby', 'Pep Guardiola', 'Jürgen Klopp', 'Marcelo Bielsa', 'Rinus Michels', 'Louis van Gaal', 'Alex Ferguson', 'Telê Santana', 'Mikel Arteta', 'Xabi Alonso', 'Bill Shankly', 'Luis Enrique', 'Hennes Weisweiler'].forEach((n) => { MANO[n] = 'jovenes'; });
  ['José Mourinho', 'Carlo Ancelotti', 'Zinedine Zidane', 'Ernst Happel', 'Bob Paisley', 'Helenio Herrera', 'Fabio Capello', 'Giovanni Trapattoni', 'Marcello Lippi', 'Ottmar Hitzfeld', 'Jupp Heynckes', 'Diego Simeone', 'Brian Clough', 'Vicente del Bosque', 'Béla Guttmann', 'Arrigo Sacchi', 'Rafael Benítez', 'Unai Emery', 'Carlos Bianchi', 'Luiz Felipe Scolari'].forEach((n) => { MANO[n] = 'ganador'; });
  const manoDe = (c) => { const e = c && c.entrenadores && c.entrenadores[0]; return e ? MANO[e.nombre] || null : null; };
  const MAESTRO_JUGADOR = { 'Luis Enrique': 'Luis Enrique Martínez García' };
  const maestro = (nombre) => (MAESTROS[nombre] ? MAESTROS[nombre][2] : 0);
  // Constantes de entrenadores: lo que hace único a cada uno, pase lo que pase en la partida.
  const DONES_DT = {
    special: 'Gana allá donde va y arma polémica en cada competición',
    tactico: 'Monstruo táctico: su equipo domina la liga',
    resucita: 'Revive a cualquier equipo: cuanto más hundido está el club, más lo levanta',
    eterno: 'Dinastía: nadie lo echa y rehace el equipo una y otra vez',
    orejona: 'Rey de la Copa de Europa: en esas noches su equipo es otro',
    muro: 'Hace competir a un equipo modesto contra los gigantes',
    loco: 'Primer año deslumbrante; después el equipo se le agota'
  };
  const CONSTANTES_DT = {
    'José Mourinho': 'special', 'Helenio Herrera': 'special',
    'Pep Guardiola': 'tactico', 'Johan Cruyff': 'tactico', 'Arrigo Sacchi': 'tactico', 'Rinus Michels': 'tactico',
    'Jürgen Klopp': 'resucita', 'Brian Clough': 'resucita', 'Bill Shankly': 'resucita',
    'Alex Ferguson': 'eterno', 'Matt Busby': 'eterno',
    'Carlo Ancelotti': 'orejona', 'Zinedine Zidane': 'orejona', 'Bob Paisley': 'orejona',
    'Diego Simeone': 'muro', 'Marcelo Bielsa': 'loco'
  };
  const donDT = (nombre) => CONSTANTES_DT[nombre] || null;
  const DESTINO_DT = { 'José Mourinho': 'Real Madrid' };
  // Cuánto sube (o baja) su equipo esta temporada por la constante del entrenador. 'anios' = temporadas ya cumplidas en el club.
  function extraDon(c, e) {
    const don = donDT(e.nombre), anios = e.anios || 0;
    if (don === 'special') return e.nombre === 'José Mourinho' ? 22 : 14;   // Mourinho es una bestia: gana en cualquier parte
    if (don === 'tactico') return 10;
    if (don === 'resucita') return c.prestigio < 700 ? 22 : c.prestigio < 820 ? 16 : 5;
    if (don === 'muro') return c.prestigio < 860 ? 13 : 3;
    if (don === 'loco') return anios === 0 ? 14 : anios >= 2 ? -6 : 0;
    if (don === 'eterno') return 4;
    return 0;
  }
  // Un gran entrenador hace mejor a su equipo: toda la plantilla rinde un punto más mientras él está.
  function manoDelEntrenador(M) {
    // Química: los que llevan años jugando juntos se entienden de memoria (tres temporadas en el club, y más con seis).
    M.clubes.forEach((c) => { if (c.quimicaAnio === M.anio) return; c.quimicaAnio = M.anio; c.jugadores.forEach((j) => { if (j.relleno) return; let k = 0; for (let i = j.carrera.length - 1; i >= 0 && j.carrera[i].club === c.nombre; i--) k++; if (k >= 3) j.temp = (j.temp || 0) + (k >= 6 ? 5 : 3); }); });
    M.clubes.forEach((c) => {
      const e = c.entrenadores && c.entrenadores[0], n = e ? maestro(e.nombre) : 0;
      if (!n || c.manoAnio === M.anio) return;
      c.manoAnio = M.anio;
      const don = extraDon(c, e);
      c.jugadores.forEach((j) => { j.temp = (j.temp || 0) + 6 * n + don; });
      // Quien revive a un club también le devuelve el nombre.
      if (donDT(e.nombre) === 'resucita' && c.prestigio < 820) c.prestigio = Math.min(820, c.prestigio + 10);
    });
  }
  // En verano: se jubilan los mayores, llegan los nuevos técnicos de época, se despide a quien falló y los clubes sin
  // banquillo (o con ganas de algo mejor) eligen, primero los de más nombre.
  function resumenBanquillos(M, T, conBanquillo, campeonEU, titulos) {
    const anio = M.anio + 1, log = [];
    const r = Motor.rng(anio * 131 + 7);
    const activos = new Set(); M.clubes.forEach((c) => c.jugadores.forEach((j) => activos.add(j.n))); M.libres.forEach((j) => activos.add(j.n));
    M.maestrosVistos = M.maestrosVistos || [];
    const enClub = new Set(); M.clubes.forEach((c) => { if (c.entrenadores && c.entrenadores[0]) enClub.add(c.entrenadores[0].nombre); });
    // Banquillos y rivalidades: quien hizo carrera en un club (dos años o más), fue su símbolo como jugador o sueña con él no entrena al enemigo.
    const enemigos = enemigosDe(M);
    M.dtPasado = M.dtPasado || {};
    const pasoPor = (e, c) => { if (!e) return; const h = M.dtPasado[e.nombre] = M.dtPasado[e.nombre] || {}; h[c.nombre] = Math.max(h[c.nombre] || 0, (e.anios || 0) + 1); };
    const vetoDT = (x, c) => { const riv = enemigos.get(c.nombre); if (!riv || !x || !x.nombre) return false;
      const h = M.dtPasado[x.nombre] || {};
      return riv.has(DESTINO_DT[x.nombre]) || riv.has(x.casa) || riv.has(EMBLEMAS[MAESTRO_JUGADOR[x.nombre] || x.nombre]) || riv.has(x.vieneDe) || [...riv].some((k) => (h[k] || 0) >= 2); };
    const ficha = (nombre) => { const m = MAESTROS[nombre]; return { nombre, nac: `${m[0]}-01-01`, nacion: m[4], pais: m[4], estilo: m[3], desde: 1, hasta: 30, fijo: false, nota: null }; };
    Object.keys(MAESTROS).forEach((nombre) => {
      const m = MAESTROS[nombre];
      if (M.maestrosVistos.includes(nombre) || m[1] > anio || anio - m[0] > 64) return;
      if (enClub.has(nombre)) { M.maestrosVistos.push(nombre); return; }
      if (activos.has(nombre) || activos.has(MAESTRO_JUGADOR[nombre])) return;   // sigue jugando: ya entrenará
      M.maestrosVistos.push(nombre);
      if (!M.parados.some((e) => e.nombre === nombre)) M.parados.push(ficha(nombre));
    });
    // Las leyendas vuelven: una figura retirada en la partida aparece años después como entrenador (como mucho una nueva por verano).
    M.exJugadoresDT = M.exJugadoresDT || [];
    const leyenda = (M.retirados || []).filter((x) => !x.relleno && x.nac && anio - x.retiro >= 2 && anio - x.retiro <= 9 && !MAESTROS[x.n] && !Object.values(MAESTRO_JUGADOR).includes(x.n) && !M.exJugadoresDT.includes(x.n)
      && Math.max(0, ...(x.carrera || []).map((t) => Motor.escala.mostrar(t.niv || 0))) >= 780 && (x.carrera || []).length >= 4)
      .sort((a, b) => hashN(a.n + anio, 13) - hashN(b.n + anio, 13))[0];
    if (leyenda && r() < 0.3) {
      M.exJugadoresDT.push(leyenda.n);
      const clubes = {}; leyenda.carrera.forEach((t) => { clubes[t.club] = (clubes[t.club] || 0) + 1; });
      const casa = Object.keys(clubes).sort((a, b) => clubes[b] - clubes[a])[0];
      M.parados.push({ nombre: leyenda.n, nac: leyenda.nac, nacion: leyenda.nacion, pais: leyenda.nacion, estilo: leyenda.pos === 'DEF' || leyenda.pos === 'POR' ? 'defensivo' : leyenda.pos === 'DEL' ? 'ofensivo' : 'equilibrado', desde: 1, hasta: 30, fijo: false, nota: null, exJugador: true, casa });
    }
    const edadDe = (e) => { const n = parseInt(String(e.nac || (MAESTROS[e.nombre] ? MAESTROS[e.nombre][0] : '')).slice(0, 4), 10); return n ? anio - n : null; };
    const puestos = new Map();
    T.forEach((t) => { if (!t || !t.tabla) return; const esp = [...t.tabla].sort((a, b) => b.equipo.prestigio - a.equipo.prestigio); t.tabla.forEach((x, i) => puestos.set(x.equipo, { puesto: i, esperado: esp.indexOf(x), n: t.tabla.length })); });
    // Los grandes eligen antes, pero no siempre el más grande: si no, el mejor club se quedaba siempre con el mejor técnico.
    const turno = new Map(M.clubes.map((c) => [c, c.prestigio + 220 * r()]));
    const primera = M.clubes.filter((c) => c.division === 1 && !c.generado).sort((a, b) => turno.get(b) - turno.get(a));
    const deja = (c, motivo) => { const e = c.entrenadores[0]; c.entrenadores = []; pasoPor(e, c); const ed = edadDe(e); if (motivo !== 'se jubila' && !(ed && ed > 68) && (ed || anio - (e.desdeAnio || anio) < 18)) M.parados.push(Object.assign({}, e, { fijo: false, nota: null, vieneDe: c.nombre })); return e.nombre; };
    primera.forEach((c) => {
      const e = c.entrenadores && c.entrenadores[0];
      if (!e) return;
      e.anios = (e.anios || 0) + 1;
      e.desdeAnio = e.desdeAnio || anio;
      const ed = edadDe(e), p = puestos.get(c);
      const don = donDT(e.nombre);
      // El de la dinastía se queda hasta que él quiera (se jubila pasados los 70).
      if (don === 'eterno') { if (ed && ed >= 71 && r() < 0.5) log.push({ club: c.nombre, sale: deja(c, 'se jubila'), motivo: 'se jubila' }); return; }
      if (ed && ed >= 66 && r() < (ed >= 70 ? 0.7 : 0.25)) { log.push({ club: c.nombre, sale: deja(c, 'se jubila'), motivo: 'se jubila' }); return; }
      // Fin de ciclo: pocos banquillos duran más de cuatro o cinco años, y menos si no se gana.
      const gano = (p && p.puesto === 0) || campeonEU === c.nombre;
      // Crédito: lo que gana un entrenador le compra tiempo. Los títulos del año suman y lo de años atrás pesa cada vez menos.
      // Quien acaba de ganar no se va ni lo echan; con crédito alto se le perdona un mal año (o dos).
      const ganado = ((titulos && titulos.get(c.nombre)) || 0) + (p && p.puesto === 0 ? 3 : 0);
      e.credito = 0.6 * (e.credito || 0) + ganado;
      e.titulos = (e.titulos || 0) + (ganado ? 1 : 0);
      // Nadie es eterno salvo los de la dinastía: pasados siete años, el propio técnico decide un día cerrar su etapa (aunque le vaya bien).
      if (e.anios >= 7 && ganado < 5 && r() < 0.1 + 0.03 * (e.anios - 7)) { log.push({ club: c.nombre, sale: deja(c, 'cierra su etapa'), motivo: `cierra su etapa tras ${e.anios} años`, anios: e.anios, adios: true }); return; }
      if (ganado) return;
      const aguante = Math.max(0.1, 1 - e.credito / 4) * ({ impaciente: 1.6, paciente: 0.55 }[estiloPresi(c, anio)] || 1);   // con un triplete reciente (crédito ~5) casi no hay despido posible
      if (e.anios >= 3 && c.balance !== 'superado' && r() < (0.12 + 0.07 * (e.anios - 3)) * aguante * (DESTINO_DT[e.nombre] === c.nombre ? 0.25 : 1)) { log.push({ club: c.nombre, sale: deja(c, 'fin de ciclo'), motivo: 'fin de ciclo' }); return; }
      if (!p || p.puesto === 0) return;
      // Despido: muy por debajo de lo que se esperaba; a un técnico de época se le aguanta algo más.
      const fallo = p.puesto - p.esperado;
      if ((c.balance === 'fracaso' && r() < (maestro(e.nombre) ? 0.5 : 0.75) * aguante) || (fallo >= 5 + maestro(e.nombre) && r() < 0.5 * aguante)) log.push({ club: c.nombre, sale: deja(c, 'despedido'), motivo: 'despedido', puesto: p.puesto + 1 });
    });
    // Fichar: cada club sin banquillo elige al mejor que haya libre; un grande puede quitarle su técnico a uno menor.
    primera.forEach((c) => {
      const e = c.entrenadores && c.entrenadores[0], tengo = e ? maestro(e.nombre) : 0;
      if (e && (tengo >= 2 || c.prestigio < 800 || (e.credito || 0) >= 1 || (e.anios || 0) < 2)) return;
      const sudaca = (pais) => NO_EUROPA.includes(pais);
      // Hasta los 90 casi nadie entrenaba fuera de su país, salvo los trotamundos de siempre; Inglaterra, solo británicos hasta 1996.
      const casa = (p) => (p === 'Escocia' || p === 'Gales' || p === 'Irlanda del Norte' ? 'Inglaterra' : p);
      const puedeIr = (x) => { const p = casa(x.nacion || x.pais); if (p === c.pais) return true; if (sudaca(p) !== sudaca(c.pais)) return ['Argentina'].includes(p) && !sudaca(c.pais) && c.pais !== 'Inglaterra' && maestro(x.nombre) > 0 && anio < 1996 ? true : false;
        if (c.pais === 'Inglaterra') return anio >= 1996; return anio >= 1990 || ['Hungría', 'Austria', 'Países Bajos', 'Yugoslavia'].includes(p); };
      const libres = M.parados.filter((x) => (maestro(x.nombre) > tengo || (!e && !tengo)) && x.vieneDe !== c.nombre && !vetoDT(x, c) && puedeIr(x) && (c.prestigio >= 620 || maestro(x.nombre) < 3)).sort((a, b) => (b.casa === c.nombre) - (a.casa === c.nombre) || maestro(b.nombre) - maestro(a.nombre) || !!b.exJugador - !!a.exJugador || (b.pais === c.pais) - (a.pais === c.pais) || hashN(a.nombre + anio, 5) - hashN(b.nombre + anio, 5));
      let nuevo = libres[0], de = null;
      if (!nuevo && c.prestigio >= 820 && r() < 0.35) {
        const v = primera.filter((x) => x !== c && !(enemigos.get(c.nombre) || new Set()).has(x.nombre) && !vetoDT(x.entrenadores && x.entrenadores[0], c) && puedeIr(x.entrenadores && x.entrenadores[0] ? x.entrenadores[0] : {}) && x.prestigio <= c.prestigio - 100 && x.entrenadores && x.entrenadores[0] && maestro(x.entrenadores[0].nombre) > Math.max(1, tengo) && (x.entrenadores[0].anios || 0) >= 2 && (x.entrenadores[0].credito || 0) < 3)
          .sort((a, b) => maestro(b.entrenadores[0].nombre) - maestro(a.entrenadores[0].nombre) || b.prestigio - a.prestigio)[0];
        if (v) { nuevo = v.entrenadores[0]; de = v; pasoPor(nuevo, v); v.entrenadores = []; }
      }
      if (!nuevo) return;
      const sale = e ? deja(c, 'relevo') : null;
      M.parados = M.parados.filter((x) => x.nombre !== nuevo.nombre);
      c.entrenadores = [Object.assign({}, nuevo, { desde: 1, hasta: 30, fijo: false, nota: null, anios: 0, credito: 0 })];
      log.push(Object.assign({ club: c.nombre, sale, entra: nuevo.nombre, de: de ? de.nombre : null, motivo: de ? 'fichado' : 'llega' }, nuevo.exJugador ? { leyenda: true, casa: nuevo.casa === c.nombre } : {}));
    });
    // El ego de cada uno tira hacia un club: Mourinho quiere el banquillo más grande del mundo, el del Real Madrid.
    Object.keys(DESTINO_DT).forEach((nombre) => {
      const c = M.clubes.find((x) => x.nombre === DESTINO_DT[nombre] && x.division === 1); if (!c) return;
      const actual = c.entrenadores && c.entrenadores[0];
      if (actual && actual.nombre === nombre) return;
      const donde = primera.find((x) => x.entrenadores && x.entrenadores[0] && x.entrenadores[0].nombre === nombre), libre = M.parados.find((x) => x.nombre === nombre);
      if (!donde && !libre) return;
      // Va si está libre, o si ya lleva dos años donde está; el club lo llama si su entrenador no es una leyenda en racha.
      if (donde && ((donde.entrenadores[0].anios || 0) < 2 || (donde.entrenadores[0].credito || 0) >= 3)) return;
      if (vetoDT(donde ? donde.entrenadores[0] : libre, c) || (donde && (enemigos.get(c.nombre) || new Set()).has(donde.nombre))) return;
      if (donde) pasoPor(donde.entrenadores[0], donde);
      if (actual && maestro(actual.nombre) >= 3 && c.balance !== 'fracaso' && (actual.anios || 0) < 4) return;
      if (actual && (actual.credito || 0) >= 3) return;
      if (r() > (c.balance === 'fracaso' ? 0.9 : 0.55)) return;
      const nuevo = donde ? donde.entrenadores[0] : libre;
      const sale = actual ? deja(c, 'relevo') : null;
      if (donde) donde.entrenadores = [];
      M.parados = M.parados.filter((x) => x.nombre !== nombre);
      c.entrenadores = [Object.assign({}, nuevo, { desde: 1, hasta: 30, fijo: false, nota: null, anios: 0, credito: 0 })];
      log.push({ club: c.nombre, sale, entra: nombre, de: donde ? donde.nombre : null, motivo: donde ? 'fichado' : 'llega', ego: true });
    });
    M.banquillosVerano = log;
  }

  // Después de 1958-59 no hay datos de entrenadores: cada club mantiene al último, y los que se quedan sin banquillo
  // van a una bolsa de parados. Un club que cesa a su entrenador ficha a uno de esa bolsa (antes, del mismo país).
  function banquillos(M, R) {
    M.parados = M.parados || [];
    const T = [R.T].concat(R.seg.map((s) => s.T), ...R.otros.map((o) => o.ligas.map((l) => l.T)));
    const todos = new Map();
    M.clubes.forEach((c) => (c.entrenadores || []).forEach((e) => todos.set(e.nombre, Object.assign({ pais: c.pais }, e))));
    const conBanquillo = new Set();
    T.forEach((t) => Object.entries(t.tramos || {}).forEach(([club, tr]) => {
      const c = M.clubes.find((x) => x.nombre === club);
      const ultimo = c && c.entrenadores && c.entrenadores.find((e) => e.nombre === tr[tr.length - 1].nombre);
      tr.slice(0, -1).forEach((x) => { if (todos.has(x.nombre) && x.nombre !== tr[tr.length - 1].nombre) M.parados.push(Object.assign({}, todos.get(x.nombre), { fijo: false, nota: null, vieneDe: club })); });
      if (ultimo) { c.entrenadores = [Object.assign({}, ultimo, { desde: 1, hasta: 30, fijo: false, nota: null })]; conBanquillo.add(ultimo.nombre); }
    }));
    // La bolsa: sin repetidos, sin los que ya entrenan y sin los muy mayores; como mucho 40.
    const vistos = new Set();
    M.parados = M.parados.filter((e) => { /* sin año de nacimiento conocido no se inventa la edad: deja la bolsa a los veinte años de quedar libre por primera vez */ const nacido = parseInt(String(e.nac || '').slice(0, 4), 10) || null; e.libreDesde = e.libreDesde || M.anio; const viejo = nacido ? M.anio + 1 - nacido > 68 : M.anio - e.libreDesde > 20; if (vistos.has(e.nombre) || conBanquillo.has(e.nombre) || viejo) return false; vistos.add(e.nombre); return true; }).sort((a, b) => (maestro(a.nombre) ? 1 : 0) - (maestro(b.nombre) ? 1 : 0)).slice(-40);
    // Títulos del año por club, para el crédito de cada entrenador: Copa de Europa 4, liga 3, otras copas internacionales 2, copa nacional 1.
    const titulos = new Map(), suma = (n, v) => { if (n) titulos.set(n, (titulos.get(n) || 0) + v); };
    suma(R.EU && R.EU.campeon, 4);
    [R.UEFA, R.RECOPA, R.LIB, R.INTER].forEach((C) => suma(C && C.campeon, 2));
    suma(R.SUPER && R.SUPER.campeon, 1);
    suma(R.C && R.C.campeon, 1); R.otros.forEach((o) => suma(o.C && o.C.campeon, 1));
    resumenBanquillos(M, T, conBanquillo, R.EU && R.EU.campeon, titulos);
    // Cada club con banquillo tiene detrás tres candidatos de la bolsa por si lo cesan: primero los de su país.
    M.clubes.filter((c) => c.division <= 2 && c.entrenadores && c.entrenadores.length === 1).forEach((c) => {
      const cand = M.parados.slice().sort((a, b) => (b.pais === c.pais) - (a.pais === c.pais)).slice(0, 3);
      c.entrenadores = c.entrenadores.concat(cand.map((e) => Object.assign({}, e, { desde: 1, hasta: 30, fijo: false })));
    });
  }

  // ---------- Mundial: cada cuatro años, al acabar la temporada ----------
  // Juegan las selecciones que fueron de verdad a ese Mundial, con su formato real (mundial/mundial.js), pero con los
  // jugadores de la partida: cada selección elige a los mejores de su país que juegan en las ligas de la partida y
  // completa la lista con su convocatoria real (los que juegan en ligas que no están en la partida).
  const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const ALIAS_NACION = { rfa: 'alemania', 'alemania federal': 'alemania', 'alemania occidental': 'alemania', urss: 'union sovietica', 'estados unidos de america': 'estados unidos', holanda: 'paises bajos', 'corea del sur': 'corea del sur' };
  const nacionClave = (s) => ALIAS_NACION[sinTildes(s)] || sinTildes(s);
  // Las selecciones tienen vida: un seleccionador con nombre (el mejor técnico libre del país, o el de más cartel) y
  // los que se quedan fuera de la lista teniendo nivel para ir.
  function vidaSeleccion(M, T) {
    if (!T || !T.convocados) return;
    const tecnicos = (M.parados || []).map((e) => ({ e, libre: 1 })).concat(M.clubes.filter((c) => c.division === 1 && c.entrenadores && c.entrenadores[0]).map((c) => ({ e: c.entrenadores[0], libre: 0, club: c.nombre })));
    const clave = (e) => nacionClave(String(e.nacion || (M.nacionDT || {})[e.nombre] || (MAESTROS[e.nombre] || [])[4] || '').split('/')[0].trim());
    T.seleccionadores = {}; const fuera = [];
    Object.keys(T.convocados).forEach((eq) => {
      const k = nacionClave(eq);
      const t = tecnicos.filter((x) => clave(x.e) === k).sort((a, b) => (b.libre - a.libre) * 1.5 + maestro(b.e.nombre) - maestro(a.e.nombre) || hashN(a.e.nombre + T.anio, 3) - hashN(b.e.nombre + T.anio, 3))[0];
      if (t) T.seleccionadores[eq] = t.e.nombre;
      const van = new Set(T.convocados[eq].map((x) => x[0]));
      M.clubes.forEach((c) => c.jugadores.forEach((j) => { if (j.relleno || van.has(j.n) || Motor.escala.mostrar(j.niv) < 680) return; const ns = String(j.nacion || '').split(/\s*\/\s*/).map(nacionClave); if ((j.sel && j.sel.pais ? nacionClave(j.sel.pais) : ns[0]) === k) fuera.push([j.n, eq, Math.round(Motor.escala.mostrar(j.niv)), c.nombre]); }));
    });
    T.ausentes = fuera.sort((a, b) => b[2] - a[2]).slice(0, 5);
  }
  function jugarMundial(M, semilla, R) {
    if (typeof Mundial === 'undefined' || typeof MUNDIALES === 'undefined' || !MUNDIALES) return null;
    const anio = M.anio + 1, ed = MUNDIALES.find((e) => e.anio === anio);
    if (!ed) return null;
    const porNacion = new Map(), refs = new Map();
    // Quien arrastra una lesión de más de un mes al acabar la temporada se pierde el Mundial.
    const estados = R ? [R.T].concat((R.otros || []).flatMap((o) => (o.ligas || []).map((l) => l.T))).map((T) => T && T.estado).filter(Boolean) : [];
    const lesionado = (j) => estados.some((e) => (e.bajas.get(j) || 0) > 4);
    // Doble nacionalidad: juega con la selección con la que ya jugó; si no, con la primera de las suyas que esté en este Mundial.
    const enMundial = new Set(Object.values(ed.equipos).map((E) => nacionClave(E.nombre)));
    const seleccionDe = (j) => {
      if (j.sel && j.sel.pais) return nacionClave(j.sel.pais);
      const ns = String(j.nacion).split(/\s*\/\s*/).map(nacionClave);
      return ns.find((k) => enMundial.has(k)) || ns[0];
    };
    const limpio = (n) => sinTildes(String(n).replace(/\s*\(.*\)\s*$/, ''));
    const mismaPersona = (x, y) => {
      const n = limpio(x.n), m = limpio(y.n);
      return n === m || (Math.abs((y.nac || 0) - (x.nac || 0)) <= 1
        && (m.endsWith(' ' + n) || n.endsWith(' ' + m) || m.split(' ').pop() === n.split(' ').pop()));
    };
    const retirados = new Set(M.retirados.map((x) => limpio(x.n)));
    const bajas = M.clubes.flatMap((c) => c.jugadores).filter(lesionado)
      .map((j) => ({ n: j.n, nac: anioNac(j), seleccion: seleccionDe(j) }));
    const nombresBajas = new Set(bajas.map((j) => limpio(j.n)));
    M.clubes.forEach((c) => c.jugadores.forEach((j) => {
      if (j.relleno || !j.nacion || lesionado(j)) return;
      const k = seleccionDe(j);
      if (!porNacion.has(k)) porNacion.set(k, []);
      porNacion.get(k).push({ j, club: c.nombre });
    }));
    const equipos = {};
    Object.entries(ed.equipos).forEach(([clave, E]) => {
      const bajasSeleccion = bajas.filter((j) => j.seleccion === nacionClave(E.nombre));
      const mios = (porNacion.get(nacionClave(E.nombre)) || []).map(({ j, club }) => {
        const K = CONSTANTES[j.n];
        const ref = E.nombre + '|' + j.n;
        refs.set(ref, j);
        return { ref, n: j.n, pos: j.pos, nac: anioNac(j), edad: anio - anioNac(j), caps: (j.sel && j.sel.pj) || 0, club, niv: Motor.escala.mostrar(j.niv), figura: Motor.escala.mostrar(j.niv) >= 800,
          // Constante de Mundial: hay jugadores que en un Mundial son otra cosa (Pelé, Mbappé).
          fin: Math.max(j.fin || 1, (K && K.mundial) || 0), rol: j.rol, gol: j.gol };
      });
      const nombres = new Set(mios.map((x) => limpio(x.n)));
      const mismo = (x) => nombres.has(limpio(x.n)) || mios.some((y) => mismaPersona(x, y));
      // La lista histórica tampoco puede recuperar a un retirado o lesionado de la partida.
      const todos = mios.concat(E.jugadores.filter((x) => !mismo(x) && !retirados.has(limpio(x.n))
        && !nombresBajas.has(limpio(x.n)) && !bajasSeleccion.some((j) => mismaPersona(x, j))));
      const lista = [];
      ['POR', 'DEF', 'MED', 'DEL'].forEach((pos) => {
        const cupo = Math.max(pos === 'POR' ? 2 : 4, E.jugadores.filter((x) => x.pos === pos).length);
        lista.push(...todos.filter((x) => x.pos === pos).sort((a, b) => b.niv - a.niv).slice(0, cupo));
      });
      equipos[clave] = { nombre: E.nombre, elo: E.elo, jugadores: lista };
    });
    const T = Mundial.torneo(Object.assign({}, ed, { equipos }), { semilla });
    // Los partidos y goles con la selección cuentan en la carrera de cada jugador de la partida.
    T.jugadores.forEach((x) => {
      const j = x.ref && refs.get(x.ref);
      if (!j) return;
      j.selT = { pj: x.pj, g: x.g, mundial: anio, pais: x.eq };
      j.sel = j.sel || { pj: 0, g: 0, mundiales: 0, titulos: 0 };
      j.sel.pj += x.pj; j.sel.g += x.g; j.sel.mundiales++; j.sel.pais = x.eq;
      if (x.eq === T.campeon) j.sel.titulos++;
    });
    const mia = (x) => !!(x && x.ref);
    T.partidos.forEach((p) => { delete p.xi; });
    T.jugadores = T.jugadores.filter((x) => x.g > 0 || mia(x)).map((x) => Object.assign(x, { mio: mia(x) }));
    T.real = ed.real && ed.real.campeon && ((ed.equipos[ed.real.campeon] || {}).nombre || ed.real.campeon);
    T.convocados = Object.fromEntries(Object.values(equipos).map((E) => [E.nombre, E.jugadores.map((x) => [x.n, x.pos, x.niv, x.ref ? 1 : 0])]));
    return T;
  }

  // Juega la temporada en curso (ligas, promoción y copas) sin tocar todavía las plantillas.
  function jugar(M, semilla) {
    const R = jugarTemporada(M, semilla);
    const resumen = {
      temporada: temporadaTxt(M.anio), anio: M.anio, R, G: R.G,
      campeon: R.T.tabla[0].nombre, copa: R.C.campeon, europa: R.EU ? R.EU.campeon : null, uefa: R.UEFA ? R.UEFA.campeon : null, recopa: R.RECOPA ? R.RECOPA.campeon : null, supercopa: R.SUPER ? R.SUPER.campeon : null, supercopas: (R.SUPERNAC || []).map((C) => ({ pais: C.pais, nombre: C.nombre, campeon: C.campeon })), libertadores: R.LIB ? R.LIB.campeon : null, intercontinental: R.INTER ? R.INTER.campeon : null, pichichi: R.premios.pichichi, zamora: R.premios.zamora, mejor: R.premios.mejor,
      otros: R.otros.map((o) => ({ pais: o.pais, liga: o.reglas.liga, campeon: o.campeon, subcampeon: o.subcampeon, puestos: (() => { const top = o.ligas.filter((l) => l.nivel === 1); return top.length === 1 && top[0].T ? top[0].T.tabla.slice(0, 8).map((t) => t.nombre) : []; })(), campeones: o.campeones, copa: o.C ? o.C.campeon : null, pichichi: o.premios ? o.premios.pichichi : null }))
    };
    const MU = jugarMundial(M, semilla + 5, R);
    if (MU) { R.MU = MU; resumen.mundial = MU.campeon; }
    if (typeof Continentales !== 'undefined') Continentales.jugar(M, semilla + 11, R);
    [R.MU, R.EURO].concat(R.AMERICA || []).filter(Boolean).forEach((T) => vidaSeleccion(M, T));
    M.historia.push(resumen);
    return resumen;
  }

  // Verano: récords, ascensos y descensos, prestigio, banquillos, edad, retiros y mercado; después empieza el año siguiente.
  function verano(M, resumen, r) {
    const R = resumen.R;
    records(M, R);
    // La categoría en la que se jugó esta temporada se apunta antes de los ascensos y descensos.
    M.clubes.forEach((c) => { c.divJugada = c.division; });
    resumen.objetivos = objetivos(M, R);
    resumen.movimientos = categorias(M, R);
    prestigio(M, R);
    // La directiva lo nota: superar el objetivo da nombre al club y fracasar se lo quita.
    M.clubes.forEach((c) => { if (c.balance === 'superado') c.prestigio = Math.min(1000, c.prestigio + 6); else if (c.balance === 'fracaso') c.prestigio = Math.max(250, c.prestigio - 6); });
    banquillos(M, R);
    resumen.banquillos = M.banquillosVerano || [];
    resumen.retiros = envejecer(M, R, r);
    resumen.novedades = resumen.retiros.novedades;
    marcas(M, R, resumen.novedades);
    rivalidades(M, R, resumen.novedades);
    cuentas(M, R);
    resumen.mercado = mercado(M, r);
    resumen.duenos = M.duenosNuevos || [];
    resumen.presidentes = M.presidentesNuevos || [];
    resumen.finanzas = M.clubes.filter((c) => c.division === 1 && c.finanzas).map((c) => Object.assign({ club: c.nombre, pais: c.pais, caja: redondo(c.caja), rescate: c.rescate === M.anio + 1 }, c.finanzas));
    M.fichajes.push(...resumen.mercado);
    // El año del vestuario: cada club tiene temporadas en las que todo sale y otras en las que nada funciona,
    // con la misma plantilla. Sin esto el más fuerte ganaba veinte ligas de veintidós.
    M.clubes.forEach((c) => {
      const fijo = CLUBES_CONSTANTES.some((C) => C.club === c.nombre && M.anio + 1 >= C.desde && M.anio + 1 <= C.hasta);
      c.quimica = fijo ? 0 : Math.round(normal(r) * QUIMICA);
      c.jugadores.forEach((j) => { j.temp = (j.temp || 0) + c.quimica; });
    });
    M.anio++;
    constantes(M);
    return resumen;
  }

  function avanzar(M, semilla, r) {
    return verano(M, jugar(M, semilla), r);
  }

  function partida(datos, opciones) {
    const op = Object.assign({ semilla: 7, temporadas: 5, alAvanzar: null }, opciones);
    const M = nuevoMundo(datos);
    const r = Motor.rng(op.semilla * 7 + 3);
    for (let k = 0; k < op.temporadas; k++) {
      const res = avanzar(M, op.semilla * 1000 + k * 97, r);
      if (op.alAvanzar) op.alAvanzar(res, M);
    }
    return M;
  }

  // ---------- Base única: los datos de la partida para la temporada en que se empiece ----------
  // B = motor/base.json (montada por motor/base.py desde datos/base/). Devuelve lo mismo que leía nuevoMundo.
  // Paso de carrera: [club, país, desde, hasta, partidos, goles, nivel, nota, orden].
  const TIPOS_LLEGADA = ['debuta', 'cantera', 'extranjero', 'regresa'];
  const MINIMO_RELLENO = { POR: 2, DEF: 5, MED: 4, DEL: 4 };
  // Nivel que tendría un jugador a una edad, sabiendo su mejor nivel (sube hasta su pico y luego cae como en envejecer).
  function nivelEdad(j, anio) {
    const nac = parseInt(String(j.nac || '').slice(0, 4), 10);
    if (!nac) return j.max;
    return Math.max(300, metaEdad(j.max, curva(j), anio - nac));
  }
  function desdeBase(B, anio) {
    const cfg = new Map(B.paises.map((P) => [P.pais, P]));
    const filas = B.ligas.filter((x) => x[1] === anio && x[6] !== 'campeón real');
    // Si de un país no hay tabla de esa temporada (la que está en curso, o un año sin liga normal), se juega con los
    // clubes de la temporada anterior: mejor una liga con los clubes del año pasado que un país entero fuera de la partida.
    if (anio >= 1964) B.paises.forEach((P) => {
      if (filas.some((x) => x[0] === P.pais)) return;
      for (let atras = 1; atras <= 2; atras++) {
        const antes = B.ligas.filter((x) => x[0] === P.pais && x[1] === anio - atras && x[6] !== 'campeón real');
        if (antes.length) { antes.forEach((x) => { const y = x.slice(); y[1] = anio; y[5] = null; filas.push(y); }); break; }
      }
    });
    // Dónde juega cada uno esa temporada: el último paso que la cubre (sin "hasta", hasta que empieza el siguiente).
    const plantillas = new Map(), llegadas = [];
    B.jugadores.forEach((j) => {
      const c = j.carrera;
      c.forEach((p, i) => {
        // Último paso sin "hasta": se da por retirado a los 36 (los datos no siempre dicen cuándo lo dejó).
        const nac = parseInt(String(j.nac || '').slice(0, 4), 10);
        const hasta = p[3] != null ? p[3] : i + 1 < c.length ? Math.max(p[2], c[i + 1][2] - 1) : nac ? Math.max(p[2], nac + 36) : Infinity;
        if (p[2] <= anio && anio <= hasta && (!plantillas.has(j) || plantillas.get(j)[2] < p[2])) plantillas.set(j, p);  // dos clubes el mismo año: el primero de los datos
        // Llegan más tarde: su primer club, o un paso que los datos marcan como llegada real.
        if (p[2] > anio && (i === 0 || TIPOS_LLEGADA.includes(p[7]))) llegadas.push({ j, p });
        // Los demás pasos quedan de respaldo: si su primer club no se juega (Jennings empezó en el Watford de Cuarta), entra en el siguiente.
        else if (p[2] > anio && B.clubes[p[0]]) llegadas.push({ j, p, respaldo: true });
      });
    });
    const ficha = (j, p, niv) => {
      const x = { n: j.n, pos: j.pos, nac: j.nac, niv: Math.round(niv), tec: j.max, pj: p[2] === anio && p[4] != null ? p[4] : 0, g: p[2] === anio && p[5] != null ? p[5] : 0 };
      if (j.nacion && j.nacion !== (B.clubes[p[0]] || {}).pais) x.pais = j.nacion;
      if (j.completo) x.completo = j.completo;
      if (j.ficticio) x.relleno = true;
      if (j.rol) x.rol = j.rol;
      // Definición: goles reales por partido frente a lo normal de su puesto. Un goleador nato (Bican, Müller)
      // remata más y marca más que otro de su mismo nivel. Solo con 30+ partidos de datos.
      let pj = 0, g = 0;
      j.carrera.forEach((q) => { if (q[4] > 0 && q[5] != null) { pj += q[4]; g += q[5]; } });
      const normal = { DEL: 0.45, MED: 0.15, DEF: 0.04 }[j.pos];
      if (normal && pj >= 30) x.fin = +Math.max(0.75, Math.min(1.4, Math.pow(g / pj / normal, 0.5))).toFixed(2);
      // Olfato de gol absoluto, frente a un delantero centro normal (0,45 por partido): un extremo o un media punta que
      // marca como un nueve (Cristiano, Messi) remata como un nueve, juegue donde juegue.
      if (j.pos !== 'POR' && pj >= 30) x.gol = +(g / pj / 0.45).toFixed(2);
      return x;
    };
    const porClub = new Map();
    const ord = (p) => (p[8] != null ? p[8] : 1e9);  // los pasos de Wikidata no traen orden: van detrás, en el orden de la base (mejor nivel primero)
    [...plantillas].sort((a, b) => ord(a[1]) - ord(b[1])).forEach(([j, p]) => {
      if (!porClub.has(p[0])) porClub.set(p[0], []);
      porClub.get(p[0]).push(ficha(j, p, p[2] === anio && p[6] != null ? p[6] : nivelEdad(j, anio)));
    });
    // Prestigio: el medido cerca de ese año; si no, el palmarés de las 20 temporadas anteriores en ligas.csv
    // (puesto en Primera, más los títulos, pesando más lo reciente), de 450 a 900 dentro de su país; sin historia, el de su categoría.
    const historia = new Map();
    B.ligas.filter((x) => x[1] < anio && x[1] >= anio - 20 && x[2] === 1 && x[5]).forEach((x) => {
      const n = B.ligas.filter((y) => y[0] === x[0] && y[1] === x[1] && y[2] === 1 && y[3] === x[3]).length || 16;
      const peso = 1 - (anio - x[1]) / 25;
      historia.set(x[4], (historia.get(x[4]) || 0) + peso * ((n - x[5] + 1) / n + (x[5] === 1 ? 1.5 : 0)));
    });
    const mejorPais = {};
    historia.forEach((v, k) => { const p = (B.clubes[k] || {}).pais; mejorPais[p] = Math.max(mejorPais[p] || 0, v); });
    // El palmarés se mide dentro de cada país, pero no todas las ligas valen lo mismo: ganar en Francia o Portugal
    // en 2000 no da el nombre que da ganar en Italia o España. Cada país pesa según la fuerza de sus cuatro mejores plantillas.
    const top4 = {};
    filas.filter((x) => x[2] === 1).forEach((x) => (top4[x[0]] = top4[x[0]] || []).push(Motor.fuerzaBruta({ jugadores: porClub.get(x[4]) || [] })));
    Object.keys(top4).forEach((p) => (top4[p] = media(top4[p].sort((a, b) => b - a).slice(0, 4))));
    const mejorLiga = Math.max(...Object.values(top4), 601);
    const pesoLiga = (p) => (top4[p] ? Math.max(0.55, Math.min(1, Math.sqrt(Math.max(0, top4[p] - 600) / (mejorLiga - 600)))) : 0.7);
    const prestigioMedido = (nombre, nivel) => {
      const c = B.clubes[nombre] || {};
      if (c.prestigio != null && Math.abs((c.prestigioAnio || anio) - anio) <= 3) return c.prestigio;
      if (historia.has(nombre)) return Math.round(450 + 450 * pesoLiga(c.pais) * historia.get(nombre) / mejorPais[c.pais]);
      return nivel === 1 ? 560 : 450;  // sin historia reciente en Primera: un recién llegado, no un club medio
    };
    // Un gigante lo es aunque lleve años sin ganar: su afición, su estadio y su dinero le dan un suelo (el Barça de 1980).
    const prestigio = (nombre, nivel) => Math.max(prestigioMedido(nombre, nivel), nivel === 1 ? porAnio(GIGANTES[nombre], anio) || 0 : 0);
    // Un club que sube más adelante llega como recién ascendido: su prestigio medido solo vale si es de esos años
    // (antes entraba con el de 1958 y el Wolverhampton o el Núremberg fichaban en 2005 como campeones de Europa).
    const prestigioSube = (nombre, t) => { const c = B.clubes[nombre] || {}; return c.prestigio != null && Math.abs((c.prestigioAnio || 1958) - t) <= 3 ? c.prestigio : 480; };
    const tecnicos = (nombre) => (B.entrenadores || []).filter((t) => t.club === nombre && t.desde <= anio && anio <= (t.hasta != null ? t.hasta : t.desde)).map((t) => {
      const x = { nombre: t.nombre, nac: t.nac, desde: t.jDesde || 1, hasta: t.jHasta || 99 };
      ['nota', 'fisico', 'merito', 'estilo', 'fijo'].forEach((k) => { if (t[k]) x[k] = t[k]; });
      return x;
    });
    const club = (nombre, nivel) => {
      const c = { nombre, prestigio: prestigio(nombre, nivel), entrenadores: tecnicos(nombre), jugadores: porClub.get(nombre) || [] };
      if ((B.clubes[nombre] || {}).id) c.id = B.clubes[nombre].id;
      return c;
    };
    // Clubes sin plantilla real completa: suplentes anónimos marcados (mismo criterio que motor/paises.py).
    // Suelo del relleno en una división: un suplente anónimo no puede ser mucho peor que los jugadores reales de esa
    // categoría (antes salían clubes de Oberliga con media de Tercera y Seeler marcaba 68 goles).
    const sueloDe = (clubes) => {
      const xs = clubes.flatMap((c) => c.jugadores.filter((j) => !j.relleno).map((j) => j.niv)).sort((a, b) => a - b);
      return xs.length >= 15 ? xs[Math.floor(xs.length * 0.3)] - 30 : 0;
    };
    const rellenar = (c, suelo) => {
      if (c.jugadores.length >= 14 && c.jugadores.some((j) => j.pos === 'POR')) return;
      const reales = c.jugadores.map((j) => j.niv);
      const base = Math.max(suelo || 0, reales.length ? Math.min(...reales) - 20 : 280 + 0.4 * c.prestigio);
      let k = 0;
      Object.entries(MINIMO_RELLENO).forEach(([pos, n]) => {
        while (c.jugadores.filter((j) => j.pos === pos).length < n || (pos === 'DEL' && c.jugadores.length < 16)) {
          k++;
          c.jugadores.push({ n: `Suplente ${k} (${c.nombre})`, pos, nac: `${anio - 28 + (k % 7)}-01-01`, niv: Math.trunc(base - 10 * (k % 3)), tec: Math.trunc(base), pj: 0, g: 0, relleno: true });
        }
      });
    };
    const debutante = ({ j, p, respaldo }) => Object.assign(ficha(j, p, p[6] != null ? p[6] : nivelEdad(j, p[2])), { nombre: j.n, club: p[0], debut: p[2], tipo: TIPOS_LLEGADA.includes(p[7]) ? p[7] : 'debuta' }, respaldo ? { respaldo: true } : {});
    // Clubes que entran desde abajo (lo que no se juega): filas marcadas, o la diferencia entre dos temporadas completas.
    const completas = (pais, t) => B.ligas.filter((x) => x[0] === pais && x[1] === t && !x[6]);
    const ascensos = (pais) => {
      const r = {};
      B.ligas.filter((x) => x[0] === pais && x[1] > anio && /^sube/.test(x[6])).forEach((x) => (r[x[1]] = r[x[1]] || []).push(Object.assign({ nombre: x[4], prestigio: prestigioSube(x[4], x[1]) }, x[3] ? { grupo: x[3] } : {})));
      for (let t = anio + 1; t <= 2026; t++) {
        const a = completas(pais, t - 1), b = completas(pais, t);
        if (a.length < 8 || b.length < 8 || r[t]) continue;
        const antes = new Set(a.map((x) => x[4]));
        const nuevos = b.filter((x) => !antes.has(x[4]));
        if (nuevos.length) r[t] = nuevos.map((x) => Object.assign({ nombre: x[4], prestigio: prestigioSube(x[4], x[1]) }, x[3] ? { grupo: x[3] } : {}));
      }
      // Los que suben en los primeros años traen su nombre de siempre y, si estaban fuera al empezar, su plantilla real.
      const enJuego = new Set(filas.map((x) => x[4]));
      Object.entries(r).forEach(([t, lista]) => lista.forEach((x) => {
        if (+t <= anio + 6 && historia.has(x.nombre)) x.prestigio = Math.max(x.prestigio, Math.round(0.92 * prestigio(x.nombre, 1)));
        if (+t <= anio + 3 && !enJuego.has(x.nombre) && porClub.has(x.nombre)) x.plantilla = porClub.get(x.nombre);
      }));
      return r;
    };
    const campeonesReales = (pais) => {
      const r = {};
      B.ligas.filter((x) => x[0] === pais && x[2] === 1 && x[5] === 1).forEach((x) => { if (!r[x[1]] || !x[3]) r[x[1]] = x[4]; });
      return r;
    };
    const d = { anio, primera: [], segunda: [], paises: [], nacionDT: Object.fromEntries((B.entrenadores || []).filter((t) => t.nacion).map((t) => [t.nombre, t.nacion])), derbis: B.derbis || [], europa: (B.europa || []).filter((e) => e.anio >= anio), debutantes: { jugadores: [], ascensos: {} }, info: { clubes: B.clubes, derbis: B.derbis || [] } };
    const nombreDiv = (P, nivel, grupo) => grupo || (P.divisiones.find((x) => x[1] === nivel) || [String(nivel)])[0];
    B.paises.forEach((P) => {
      const mias = filas.filter((x) => x[0] === P.pais);
      const deb = llegadas.filter(({ p }) => (B.clubes[p[0]] || {}).pais === P.pais).sort((a, b) => ord(a.p) - ord(b.p)).map(debutante);
      if (P.espana) {
        mias.forEach((x) => (x[2] === 1 ? d.primera : d.segunda).push(Object.assign(club(x[4], x[2]), x[2] === 2 ? { division: 2, grupo: x[3] } : {})));
        const sP = sueloDe(d.primera), sS = sueloDe(d.segunda);
        d.primera.concat(d.segunda).forEach((c) => { if (c.jugadores.length < 13 || !c.jugadores.some((j) => j.pos === 'POR')) rellenar(c, c.division === 2 ? sS : sP); });
        d.debutantes = { jugadores: deb, ascensos: ascensos(P.pais) };
        return;
      }
      if (!mias.length) return;
      const divisiones = [];
      mias.forEach((x) => {
        const nombre = nombreDiv(P, x[2], x[3]);
        let dv = divisiones.find((v) => v.nombre === nombre);
        if (!dv) divisiones.push((dv = { nombre, nivel: x[2], clubes: [] }));
        dv.clubes.push(club(x[4], x[2]));
      });
      // Con relleno en el país se completan todas las plantillas cortas; en los demás, solo las que no llegan a 13 (no se podría jugar).
      divisiones.forEach((dv) => { const suelo = sueloDe(dv.clubes); dv.clubes.forEach((c) => { if (P.rellenar || c.jugadores.length < 13 || !c.jugadores.some((j) => j.pos === 'POR')) rellenar(c, suelo); }); });
      d.paises.push({ pais: P.pais, sube: P.sube, copa: P.copa || null, final: P.final || null, abajo: P.abajo, cupo: P.cupo || null, ascensos: ascensos(P.pais),
        real: campeonesReales(P.pais), estatales: !!P.estatales, rellenar: !!P.rellenar, nacionales: P.nacionales, divisiones, debutantes: deb });
    });
    return d;
  }

  const api = { PRESIDENTES, ESTILOS_PRESIDENTE, presidenteDe, DONES_DT, CONSTANTES_DT, donDT, MANOS, MANO, OBJETIVOS, objetivoDe, balanceDe, maestro, caracterDe, CARACTERES, deseo, sueldo, precio, recordTraspaso, euros, ingresosDe, creditoDe, presupuesto, politica, DESEOS, POLITICAS, desdeBase, nivelEdad, curva, nuevoMundo, jugarTemporada, jugar, verano, avanzar, partida, perfil, temporadaTxt, RECORD_REAL_LIGA, INSIGNIAS, GRADOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Mundo = api;
})(typeof self !== 'undefined' ? self : this);
