// Eurocopa y Copa América: selecciones reales con los jugadores disponibles de la partida.
(function (root) {
  'use strict';
  const Motor = root.Motor || (typeof require !== 'undefined' ? require('./motor.js') : null);
  const Mundial = root.Mundial || (typeof require !== 'undefined' ? require('./mundial.js') : null);
  const limpio = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s*\(.*\)\s*$/, '').trim();
  const ALIAS = { rfa: 'alemania', 'alemania federal': 'alemania', 'alemania occidental': 'alemania', urss: 'union sovietica',
    holanda: 'paises bajos', 'republica federal de alemania': 'alemania', 'estados unidos de america': 'estados unidos',
    cei: 'comunidad de estados independientes' };
  const clave = (s) => ALIAS[limpio(s)] || limpio(s);
  const anioNac = (j) => parseInt(String(j.nac || '').slice(0, 4), 10) || 0;
  const sovieticas = new Set(['rusia', 'ucrania', 'bielorrusia', 'georgia', 'armenia', 'azerbaiyan', 'kazajistan', 'uzbekistan', 'moldavia', 'lituania', 'letonia', 'estonia']);
  const yugoslavas = new Set(['serbia', 'croacia', 'eslovenia', 'bosnia y herzegovina', 'montenegro', 'macedonia del norte', 'yugoslavia', 'serbia y montenegro']);

  function convocar(ed, M, R) {
    const participantes = new Set(Object.values(ed.equipos).map((E) => clave(E.nombre)));
    const nacionalidad = (s) => {
      const k = clave(s);
      if (ed.anio <= 1991 && participantes.has('union sovietica') && sovieticas.has(k)) return 'union sovietica';
      if (ed.anio === 1992 && participantes.has('comunidad de estados independientes') && sovieticas.has(k) && !['lituania', 'letonia', 'estonia'].includes(k)) return 'comunidad de estados independientes';
      if (ed.anio <= 1991 && participantes.has('yugoslavia') && yugoslavas.has(k)) return 'yugoslavia';
      if (ed.anio > 1991 && ed.anio <= 2002 && participantes.has('yugoslavia') && ['serbia', 'montenegro', 'serbia y montenegro'].includes(k)) return 'yugoslavia';
      if (ed.anio <= 1992 && participantes.has('checoslovaquia') && ['republica checa', 'eslovaquia', 'chequia'].includes(k)) return 'checoslovaquia';
      return k === 'chequia' ? 'republica checa' : k;
    };
    const seleccionDe = (j) => {
      const ns = String(j.nacion || j.pais || '').split(/\s*\/\s*/).map(nacionalidad);
      const anterior = j.sel && j.sel.pais && nacionalidad(j.sel.pais);
      // Una federación desaparecida no impide representar después a su selección sucesora.
      const desaparecida = anterior && ((ed.anio > 1992 && ['union sovietica', 'comunidad de estados independientes', 'checoslovaquia'].includes(anterior)) || (ed.anio > 1991 && anterior === 'yugoslavia'));
      return anterior && !desaparecida ? anterior : ns.find((k) => participantes.has(k)) || ns[0];
    };
    const estados = [R && R.T].concat(((R && R.otros) || []).flatMap((o) => (o.ligas || []).map((l) => l.T))).map((T) => T && T.estado).filter(Boolean);
    const lesionado = (j) => estados.some((e) => e.bajas && (e.bajas.get(j) || 0) > 4);
    const activos = (M.clubes || []).flatMap((c) => c.jugadores.map((j) => ({ j, club: c.nombre })));
    const retirados = M.retirados || [];
    const mismaPersona = (a, b) => {
      const n = limpio(a.n), m = limpio(b.n);
      if (anioNac(a) && anioNac(b) && anioNac(a) !== anioNac(b)) return false;
      if (n === m) return !anioNac(a) || !anioNac(b) || anioNac(a) === anioNac(b);
      const ns = n.split(' '), ms = m.split(' '), corto = ns.length <= ms.length ? ns : ms, largo = ns.length <= ms.length ? ms : ns;
      return corto.length >= 2 && corto[0] === largo[0] && corto[corto.length - 1] === largo[largo.length - 1] && corto.every((p) => largo.includes(p));
    };
    const equipos = {}, refs = new Map();
    Object.entries(ed.equipos).forEach(([k, E]) => {
      const pais = nacionalidad(E.nombre);
      const mios = activos.filter(({ j }) => !j.relleno && !lesionado(j) && seleccionDe(j) === pais).map(({ j, club }) => {
        const ref = ed.id + '|' + E.nombre + '|' + j.n;
        refs.set(ref, j);
        return { ref, n: j.n, nac: anioNac(j), edad: ed.anio - anioNac(j), pos: j.pos, rol: j.rol, gol: j.gol,
          niv: Motor.escala.mostrar(j.niv), fin: j.fin || 1, club, caps: (j.sel && j.sel.pj) || 0 };
      });
      const externos = E.jugadores.filter((x) => {
        if (mios.some((j) => mismaPersona(x, j)) || retirados.some((j) => mismaPersona(x, j))) return false;
        // La convocatoria histórica tampoco puede recuperar una baja ni cambiar una doble nacionalidad elegida.
        return !activos.some(({ j }) => mismaPersona(x, j) && (lesionado(j) || seleccionDe(j) !== pais || j.relleno));
      });
      const todos = mios.concat(externos), lista = [];
      ['POR', 'DEF', 'MED', 'DEL'].forEach((pos) => {
        const cupo = Math.max(pos === 'POR' ? 2 : 4, E.jugadores.filter((x) => x.pos === pos).length);
        lista.push(...todos.filter((x) => x.pos === pos).sort((a, b) => b.niv - a.niv || a.n.localeCompare(b.n)).slice(0, cupo));
      });
      if (lista.length < 7) throw new Error('Faltan jugadores reales para ' + E.nombre + ' en ' + ed.nombre + ' ' + ed.edicion);
      equipos[k] = { nombre: E.nombre, jugadores: lista };
    });
    return { equipos, refs };
  }

  function torneo(ed, M, R, semilla) {
    const { equipos, refs } = convocar(ed, M, R);
    const T = Mundial.torneo(Object.assign({}, ed, { equipos }), { semilla });
    Object.assign(T, { id: ed.id, nombre: ed.nombre, edicion: ed.edicion, etiqueta: ed.etiqueta,
      real: ed.real.campeon, referencia: ed.real, fuentes: ed.fuentes });
    T.convocados = Object.fromEntries(Object.values(equipos).map((E) => [E.nombre, E.jugadores.map((x) => [x.n, x.pos, x.niv, x.ref ? 1 : 0])]));
    T.jugadores.forEach((x) => {
      const j = x.ref && refs.get(x.ref);
      x.mio = !!j;
      if (!j) return;
      const titulo = x.eq === T.campeon;
      const previo = j.selT || { pj: 0, g: 0, pais: x.eq };
      j.selT = Object.assign({}, previo, { pj: previo.pj + x.pj, g: previo.g + x.g, pais: x.eq,
        torneos: (previo.torneos || []).concat({ id: ed.id, nombre: ed.nombre, anio: ed.anio, edicion: ed.edicion, etiqueta: ed.etiqueta, pais: x.eq, pj: x.pj, g: x.g, titulo }) });
      j.sel = j.sel || { pj: 0, g: 0, mundiales: 0, titulos: 0 };
      j.sel.pj = (j.sel.pj || 0) + x.pj; j.sel.g = (j.sel.g || 0) + x.g; j.sel.pais = x.eq;
      j.sel.continentales = (j.sel.continentales || 0) + 1;
      if (titulo) j.sel.titulos = (j.sel.titulos || 0) + 1;
    });
    T.partidos.forEach((p) => { delete p.xi; });
    return T;
  }

  function jugar(M, semilla, R) {
    const datos = root.CONTINENTALES || [];
    datos.filter((ed) => ed.anio === M.anio + 1).forEach((ed, i) => {
      const T = torneo(ed, M, R, semilla + i * 101);
      if (ed.competicion === 'EURO') R.EURO = T;
      else (R.AMERICA || (R.AMERICA = [])).push(T); // En 1959 se jugaron dos ediciones distintas.
    });
  }

  function bonus(torneos, nombre, peso = 1) {
    return torneos.reduce((s, T) => {
      const j = T.jugadores.find((x) => x.n === nombre && x.mio && x.pj > 0);
      return s + (!j ? 0 : j.eq === T.campeon ? 0.25 : j.eq === T.subcampeon ? 0.075 : 0) * Math.max(0.3, peso);
    }, 0);
  }
  const api = { convocar, torneo, jugar, bonus };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Continentales = api;
})(typeof window !== 'undefined' ? window : globalThis);
