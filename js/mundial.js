// Juego del Mundial — Universo del Fútbol
// Juega un Mundial entero (1930-2022) con su formato real, sus grupos, su cuadro y sus convocatorias,
// sobre el mismo motor de partidos de la beta. Los datos de cada edición los prepara mundial/datos_mundial.py.
(function (root) {
  'use strict';
  const Motor = root.Motor || (typeof require !== 'undefined' ? require('./motor.js') : null);

  // Goles por partido de cada Mundial real: el motor se ajusta para acercarse (1954 fue una lluvia de goles; 1990, una sequía).
  const GOLES_REALES = { 1930: 3.89, 1934: 4.12, 1938: 4.67, 1950: 4.0, 1954: 5.38, 1958: 3.6, 1962: 2.78, 1966: 2.78, 1970: 2.97, 1974: 2.55, 1978: 2.68,
    1982: 2.81, 1986: 2.54, 1990: 2.21, 1994: 2.71, 1998: 2.67, 2002: 2.52, 2006: 2.3, 2010: 2.27, 2014: 2.67, 2018: 2.64, 2022: 2.69, 2026: 2.96 };
  // Ajuste de ocasiones por edición (calibrado con mundial/calibrar.js para que los goles se parezcan a los reales).
  const AJUSTE_OCASIONES = {"1930":1.544,"1934":1.697,"1938":1.988,"1950":1.583,"1954":2.372,"1958":1.591,"1962":0.965,"1966":0.977,"1970":1.15,"1974":0.943,"1978":1.002,"1982":1.065,"1986":0.938,"1990":0.75,"1994":1.016,"1998":0.903,"2002":0.948,"2006":0.73,"2010":0.773,"2014":0.996,"2018":0.998,"2022":1.039,"2026":1.079};

  const EMPUJE_ANFITRION = 2;
  function equipo(ed, clave) {
    const E = ed.equipos[clave];
    return {
      nombre: E.nombre, clave, elo: E.elo, anfitrion: (ed.anfitriones || [ed.sede]).includes(E.nombre),
      jugadores: E.jugadores.map((x) => {
        const j = { n: x.n, pos: x.pos, nac: x.nac ? `${x.nac}-07-01` : '', niv: Motor.escala.interno(x.niv), nivel: x.niv, fin: x.fin || 1, edad: x.edad, club: x.club, caps: x.caps, figura: !!x.figura, pais: E.nombre };
        if (x.rol) j.rol = x.rol;          // jugadores que llegan de una partida del simulador traen su rol y su olfato
        if (x.gol) j.gol = x.gol;
        if (x.ref) j.ref = x.ref;
        j.rol = Motor.rol(j);
        return j;
      })
    };
  }

  function torneo(ed, opciones) {
    const op = Object.assign({ semilla: 1 }, opciones);
    const r = Motor.rng(op.semilla);
    const est = Motor.nuevoEstado(ed.anio);
    const registro = new Map();
    const reg = ed.reglas;
    const eqs = {};
    Object.keys(ed.equipos).forEach((k) => (eqs[k] = equipo(ed, k)));
    const todos = Object.values(eqs);
    const partidos = [];   // en orden: lo que la página va enseñando paso a paso
    let paso = 0;
    const ocas = Motor.P.ocasiones, escalaP = Motor.P.escala;
    Motor.P.ocasiones = ocas * (AJUSTE_OCASIONES[ed.anio] || 1);
    // En un Mundial la diferencia de nivel pesa más que en un partido de liga: a partido único, con la escala de liga
    // ganaba un tapado uno de cada cinco torneos (Ghana, Polonia); en la historia real siempre gana un grande.
    Motor.P.escala = escalaP * (typeof CONTRASTE_MUNDIAL !== 'undefined' ? CONTRASTE_MUNDIAL : 0.5);
    try {
      // Un partido: en campo neutral salvo que juegue el anfitrión, que siempre hace de local.
      const jugar = (A, B, extra) => {
        let L = A, V = B;
        if (B.anfitrion && !A.anfitrion) { L = B; V = A; }
        // El anfitrión no tiene la ventaja de un local de liga: juega en campo neutral con el empuje de su gente (ánimo extra).
        const moral = [(est.moral.get(L) || 0) + (L.anfitrion ? EMPUJE_ANFITRION : 0), est.moral.get(V) || 0];
        const m = Motor.jugarConEstado(r, est, L, V, Object.assign({ cambios: reg.cambios, neutral: true, moral }, extra || {}), registro);
        const goles = L === A ? m.goles : [m.goles[1], m.goles[0]];
        return { m, ga: goles[0], gb: goles[1], local: L };
      };
      // Alineaciones con la nota de cada uno (para el detalle del partido).
      const onces = (x, A) => {
        const de = (xi) => xi.map((j) => [j.n, j.pos, +(x.m.notas.get(j) || 6).toFixed(1)]);
        return x.local === A ? { a: de(x.m.xiL), b: de(x.m.xiV) } : { a: de(x.m.xiV), b: de(x.m.xiL) };
      };
      const ficha = (fase, ronda, A, B, x, mas) => {
        const p = Object.assign({ paso: paso++, fase, ronda, a: A.nombre, b: B.nombre, ga: x.ga, gb: x.gb, eventos: x.m.eventos.map((e) => ({ min: e.min, tipo: e.tipo, quien: e.quien, asist: e.asist, eq: (e.lado === 0) === (x.local === A) ? 'a' : 'b' })), xi: onces(x, A) }, mas || {});
        partidos.push(p);
        return p;
      };

      // ---------- Grupos ----------
      const tablaGrupo = (G, res) => {
        const t = new Map(G.equipos.map((k) => [k, { eq: eqs[k], clave: k, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }]));
        res.forEach(([a, b, ga, gb]) => {
          const A = t.get(a), B = t.get(b);
          A.pj++; B.pj++; A.gf += ga; A.gc += gb; B.gf += gb; B.gc += ga;
          if (ga > gb) { A.g++; B.p++; A.pts += reg.puntosVictoria; } else if (ga < gb) { B.g++; A.p++; B.pts += reg.puntosVictoria; } else { A.e++; B.e++; A.pts++; B.pts++; }
        });
        const filas = [...t.values()];
        const crit = reg.desempateGrupo === 'diferencia' ? (x) => [x.pts, x.gf - x.gc, x.gf] : reg.desempateGrupo === 'golaverage' ? (x) => [x.pts, x.gc ? x.gf / x.gc : x.gf * 100] : (x) => [x.pts];
        const sorteo = new Map(filas.map((x) => [x, r()]));
        filas.sort((x, y) => { const a = crit(x), b = crit(y); for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i] - a[i]; return sorteo.get(y) - sorteo.get(x); });
        return filas;
      };
      const posiciones = {};   // 'Fase|Grupo' → [clave del 1.º, 2.º, ...]
      const fasesRes = [];
      const salidas = new Map();  // id de cruce → { gana, pierde }
      let anteriorGrupos = null;
      ed.fases.forEach((F, iF) => {
        const sig = ed.fases[iF + 1];
        if (F.tipo === 'grupos') {
          const out = { tipo: 'grupos', nombre: F.nombre, grupos: [] };
          // Equipos de cada grupo: los del sorteo real o los que salen de la fase anterior.
          const grupos = F.grupos.map((G) => {
            if (!G.de || !anteriorGrupos) return { nombre: G.nombre, equipos: [...G.equipos], partidos: G.partidos.map((p) => [...p]) };
            const equipos = G.de.map((d) => posiciones[anteriorGrupos + '|' + d.grupo][(d.puesto || 1) - 1]);
            // El calendario real se recoloca: cada equipo real ocupa el sitio del que viene en la partida.
            const mapa = new Map(G.equipos.map((k, i) => [k, equipos[i]]));
            return { nombre: G.nombre, equipos, partidos: G.partidos.map(([a, b]) => [mapa.get(a), mapa.get(b)]) };
          });
          // Jornadas: los partidos de todos los grupos van intercalados, como en el calendario real.
          const res = new Map(grupos.map((G) => [G.nombre, []]));
          const maxJ = Math.max(...grupos.map((G) => G.partidos.length));
          for (let k = 0; k < maxJ; k++) {
            grupos.forEach((G) => {
              const par = G.partidos[k];
              if (!par) return;
              const x = jugar(eqs[par[0]], eqs[par[1]]);
              ficha(F.nombre, G.nombre, eqs[par[0]], eqs[par[1]], x);
              res.get(G.nombre).push([par[0], par[1], x.ga, x.gb]);
            });
            if (k % 2 === 1) Motor.pasaSemana(est, todos);
          }
          Motor.pasaSemana(est, todos);
          // Clasificación de cada grupo; con desempate por partido (hasta 1958), los empatados en la línea de corte juegan otro.
          const pasan = cuantosPasan(ed, iF);
          grupos.forEach((G) => {
            let filas = tablaGrupo(G, res.get(G.nombre));
            if (reg.desempateGrupo === 'partido' && pasan[G.nombre]) {
              const n = pasan[G.nombre];
              const enCorte = filas.filter((x) => x.pts === filas[n - 1].pts);
              if (filas[n] && filas[n].pts === filas[n - 1].pts && enCorte.length === 2) {
                const [A, B] = enCorte.map((x) => x.eq);
                const g = eliminatoria(A, B, F.nombre, G.nombre + ' (desempate)', 'sorteo');
                const ganador = filas.find((x) => x.eq === g);
                const perdedor = filas.find((x) => x !== ganador && enCorte.includes(x));
                filas = filas.filter((x) => x !== ganador && x !== perdedor);
                filas.splice(n - 1, 0, ganador, perdedor);
                ganador.desempate = true;
              }
            }
            posiciones[F.nombre + '|' + G.nombre] = filas.map((x) => x.clave);
            out.grupos.push({ nombre: G.nombre, tabla: filas.map((x) => ({ equipo: x.eq.nombre, clave: x.clave, pj: x.pj, g: x.g, e: x.e, p: x.p, gf: x.gf, gc: x.gc, pts: x.pts, desempate: !!x.desempate })) });
          });
          // Mejores terceros (1986-1994): se ordenan para repartirlos en los cruces.
          posiciones[F.nombre + '|terceros'] = out.grupos.map((G) => Object.assign({ grupo: G.nombre }, G.tabla[2])).filter((x) => x.equipo)
            .sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf || r() - 0.5);
          anteriorGrupos = F.nombre;
          fasesRes.push(out);
          if (!sig) {  // liguilla final (1950): el primero es el campeón
            out.campeon = out.grupos[0].tabla[0].clave;
          }
        } else {
          const out = { tipo: 'ko', nombre: F.nombre, cruces: [] };
          const usados = new Set();
          // Mejores terceros: cuatro en 1986-1994, ocho en 2026.
          const plazasTercero = F.cruces.flatMap((c) => c.lados).filter((l) => l.puesto === 3).length;
          const lado = (l, rival) => {
            if (l.equipo) return l.equipo;
            if (l.gana) return salidas.get(l.gana).gana;
            if (l.pierde) return salidas.get(l.pierde).pierde;
            if (l.puesto === 3) {  // un mejor tercero que no venga del grupo de su rival
              const ter = posiciones[anteriorGrupos + '|terceros'].slice(0, plazasTercero);
              const grupoRival = rival && rival.grupo;
              const x = ter.find((t) => !usados.has(t.clave) && t.grupo !== grupoRival) || ter.find((t) => !usados.has(t.clave));
              usados.add(x.clave);
              return x.clave;
            }
            return posiciones[anteriorGrupos + '|' + l.grupo][(l.puesto || 1) - 1];
          };
          F.cruces.forEach((c) => {
            const [la, lb] = c.lados;
            const a = lado(la, lb), b = lado(lb, la);
            const final = F.nombre === 'Final';
            const g = eliminatoria(eqs[a], eqs[b], F.nombre, F.nombre, reg.empateKO, final);
            const ganador = g.clave, perdedor = g === eqs[a] ? b : a;
            salidas.set(c.id, { gana: ganador, pierde: perdedor });
            out.cruces.push({ id: c.id, a: eqs[a].nombre, b: eqs[b].nombre, ganador: eqs[ganador].nombre });
            if (final) out.campeon = ganador, out.subcampeon = perdedor;
          });
          Motor.pasaSemana(est, todos);
          fasesRes.push(out);
        }
      });

      // ---------- Eliminatoria a partido único ----------
      // repeticion (hasta 1938): prórroga y, si sigue el empate, se repite el partido; sorteo (1954-1970): prórroga y moneda
      // (la final se repetiría); penaltis (desde 1974): prórroga y tanda.
      function eliminatoria(A, B, fase, ronda, regla, final) {
        let x = jugar(A, B);
        let ga = x.ga, gb = x.gb, prorroga = false, pen = null, repetido = 0;
        const evs = [...x.m.eventos.map((e) => Object.assign({}, e, { eq: (e.lado === 0) === (x.local === A) ? 'a' : 'b' }))];
        const tiempoExtra = () => {
          const y = jugar(A, B, { duracion: 1 / 3 });
          ga += y.ga; gb += y.gb; prorroga = true;
          y.m.eventos.forEach((e) => evs.push(Object.assign({}, e, { min: 90 + Math.ceil(e.min), eq: (e.lado === 0) === (y.local === A) ? 'a' : 'b' })));
        };
        if (ga === gb) tiempoExtra();
        const p = { paso: paso++, fase, ronda, a: A.nombre, b: B.nombre, ga, gb, prorroga, eventos: evs, xi: onces(x, A) };
        partidos.push(p);
        if (ga !== gb) return ga > gb ? A : B;
        if (regla === 'penaltis') {
          pen = tanda(A, B);
          p.penaltis = pen;
          return pen[0] > pen[1] ? A : B;
        }
        if (regla === 'repeticion' || (regla === 'sorteo' && final)) {
          while (repetido++ < 2) {
            const z = jugar(A, B);
            let za = z.ga, zb = z.gb;
            const q = ficha(fase, ronda + ' (repetición)', A, B, z, { repeticion: true });
            if (za === zb) { const y = jugar(A, B, { duracion: 1 / 3 }); za += y.ga; zb += y.gb; q.ga = za; q.gb = zb; q.prorroga = true; }
            if (za !== zb) return za > zb ? A : B;
          }
        }
        const gana = r() < 0.5 ? A : B;
        p.sorteo = gana.nombre;
        return gana;
      }
      // Tanda de penaltis: cinco por equipo y luego muerte súbita; tiran los mejores rematadores del once.
      function tanda(A, B) {
        const once = (E) => Motor.jugarConEstado ? E.jugadores.filter((j) => !est.bajas.has(j)).sort((a, b) => b.niv - a.niv) : E.jugadores;
        const tir = [once(A).filter((j) => j.pos !== 'POR'), once(B).filter((j) => j.pos !== 'POR')];
        const por = [once(B).find((j) => j.pos === 'POR'), once(A).find((j) => j.pos === 'POR')];
        const marca = [0, 0], detalle = [];
        const tira = (k, i) => {
          const t = tir[k][i % tir[k].length], p = por[k];
          const pr = Math.max(0.55, Math.min(0.92, 0.75 + (t.niv - (p ? p.niv : 800)) / 2500));
          const gol = r() < pr;
          if (gol) marca[k]++;
          detalle.push({ eq: k ? 'b' : 'a', quien: t.n, gol });
        };
        for (let i = 0; i < 5; i++) {
          tira(0, i); if (marca[0] > marca[1] + (5 - i) || marca[1] > marca[0] + (5 - i - 1)) break;
          tira(1, i); if (marca[0] > marca[1] + (5 - i - 1) || marca[1] > marca[0] + (5 - i - 1)) break;
        }
        for (let i = 5; marca[0] === marca[1] && i < 30; i++) { tira(0, i); tira(1, i); }
        return [marca[0], marca[1], detalle];
      }

      const ultima = fasesRes[fasesRes.length - 1];
      const campeon = ultima.campeon;
      const G = Motor.global([{ nombre: 'Mundial', jugadores: [...registro.values()], campeon: eqs[campeon] }]);
      return { anio: ed.anio, sede: ed.sede, semilla: op.semilla, campeon: eqs[campeon].nombre, subcampeon: ultima.subcampeon ? eqs[ultima.subcampeon].nombre : (ultima.grupos ? ultima.grupos[0].tabla[1].equipo : null),
        fases: fasesRes, partidos, jugadores: G.map(resumenJugador), premios: premios(ed, G, fasesRes, eqs) };
    } finally {
      Motor.P.ocasiones = ocas;
      Motor.P.escala = escalaP;
    }
  }

  // Cuántos pasan de cada grupo: los puestos que nombra la fase siguiente.
  function cuantosPasan(ed, iF) {
    const F = ed.fases[iF], sig = ed.fases[iF + 1];
    const n = {};
    if (!sig) return n;
    const refs = sig.tipo === 'grupos' ? sig.grupos.flatMap((G) => G.de || []) : sig.cruces.flatMap((c) => c.lados);
    refs.filter((l) => l.grupo && l.puesto !== 3).forEach((l) => (n[l.grupo] = Math.max(n[l.grupo] || 0, l.puesto || 1)));
    return n;
  }

  const resumenJugador = (x) => ({ ref: x.j.ref, n: x.j.n, eq: x.eq.nombre, pos: x.j.pos, nivel: x.j.nivel, edad: x.j.edad, figura: x.j.figura, pj: x.pj, g: x.g, a: x.a, nota: +(x.sumaNota / x.pj).toFixed(2),
    paradas: x.paradas, ceros: x.ceros, regates: x.regates, pen: x.pen, rojas: x.rojas, lesiones: x.lesiones });

  // Premios del torneo: Bota de Oro (goles, luego asistencias), Balón de Oro (nota media con peso a lo lejos que llegó su selección),
  // Guante de Oro (portero) y Mejor joven (21 años o menos).
  function premios(ed, G, fases, eqs) {
    const llego = new Map();
    fases.forEach((F, i) => {
      const nombres = F.tipo === 'grupos' ? F.grupos.flatMap((g) => g.tabla.map((t) => t.equipo)) : F.cruces.flatMap((c) => [c.a, c.b]);
      nombres.forEach((n) => llego.set(n, i));
    });
    const ult = fases[fases.length - 1];
    const campeon = eqs[ult.campeon].nombre;
    const maxF = fases.length - 1;
    const minPJ = Math.max(2, Math.min(4, Math.round(Math.max(...G.map((x) => x.pj)) * 0.6)));
    const valor = (x) => x.sumaNota / x.pj + 0.25 * (llego.get(x.eq.nombre) || 0) / Math.max(1, maxF) + (x.eq.nombre === campeon ? 0.15 : 0) + Math.min(0.6, (x.g * 0.06 + x.a * 0.03));
    const mejor = (xs, f) => [...xs].sort(f)[0];
    const elegibles = G.filter((x) => x.pj >= minPJ);
    const r = (x) => x && resumenJugador(x);
    return {
      botaOro: r(mejor(G, (a, b) => b.g - a.g || b.a - a.a || a.pj - b.pj)),
      goleadores: [...G].sort((a, b) => b.g - a.g || b.a - a.a || a.pj - b.pj).slice(0, 10).map(resumenJugador),
      balonOro: r(mejor(elegibles, (a, b) => valor(b) - valor(a))),
      mejores: [...elegibles].sort((a, b) => valor(b) - valor(a)).slice(0, 10).map(resumenJugador),
      guanteOro: r(mejor(elegibles.filter((x) => x.j.pos === 'POR'), (a, b) => valor(b) - valor(a))),
      joven: r(mejor(elegibles.filter((x) => x.j.edad && x.j.edad <= 21), (a, b) => valor(b) - valor(a)))
    };
  }

  const api = { torneo, equipo, GOLES_REALES, AJUSTE_OCASIONES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Mundial = api;
})(typeof window !== 'undefined' ? window : globalThis);
