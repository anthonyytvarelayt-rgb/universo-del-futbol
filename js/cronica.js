// Crónica de la jornada — Universo del Fútbol
// Escribe la portada de un periódico deportivo con el tono de la época a partir de los resultados.
(function (root) {
  'use strict';

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const NUM = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
  const NUM_GOL = ['', '', 'doblete', 'tres goles', 'cuatro goles', 'cinco goles', 'seis goles'];
  // Apellido para titulares: "Alfredo Di Stéfano" → "Di Stéfano"; "José María Zárraga" → "Zárraga".
  const SEGUNDO_NOMBRE = new Set(['María', 'Luis', 'Antonio', 'Manuel', 'Carlos', 'Ramón', 'Miguel', 'Ángel', 'Francisco', 'José', 'Juan', 'Pedro', 'Jesús']);
  const apellido = (n) => {
    const p = String(n).split(' ');
    if (p.length >= 3 && SEGUNDO_NOMBRE.has(p[1])) return p.slice(2).join(' ');
    return p.length > 1 ? p.slice(1).join(' ') : n;
  };
  const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  // Cronica.crear(clubes) devuelve las funciones de texto para esos clubes.
  function crear(info) {
    const C = (info && info.clubes) || {};
    const art = (club) => (C[club] && C[club].art !== undefined ? C[club].art : 'el');
    const el = (club) => (art(club) ? `${art(club)} ${club}` : club);
    const al = (club) => (art(club) === 'el' ? `al ${club}` : art(club) ? `a ${art(club)} ${club}` : `a ${club}`);
    const del = (club) => (art(club) === 'el' ? `del ${club}` : art(club) ? `de ${art(club)} ${club}` : `de ${club}`);
    const apodo = (club) => (C[club] && C[club].apodo) || `los de ${club}`;
    const campo = (club) => (C[club] && C[club].estadio) || `el campo ${del(club)}`;
    const marcador = (m) => `${m.ga}-${m.gb}`;
    // Resultado al estilo de la prensa: "Real Madrid, 6; Real Oviedo, 1".
    const resultado = (m) => `${m.local}, ${m.ga}; ${m.visita}, ${m.gb}`;
    const golesDe = (xs, n) => (xs.length ? ` ${n === 1 ? 'Gol' : 'Goles'} de ${lista(xs)}.` : ' Sin goles.');
    const goleadores = (m, lado) => {
      const cuenta = {};
      m.eventos.filter((e) => (e.tipo === 'gol' || e.tipo === 'pen') && e.lado === lado).forEach((e) => { cuenta[e.quien] = (cuenta[e.quien] || 0) + 1; });
      return Object.entries(cuenta).map(([q, g]) => apellido(q) + (g > 1 ? ` (${g})` : ''));
    };
    const lista = (xs) => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1]);

    // Portada de una jornada de Liga.
    // d = { res, antes, despues, n, total, fuerza: {club: nivel}, cracks: Set(nombres), semilla }
    function portada(d) {
      const r = rng((d.semilla || 1) * 31 + d.n * 977);
      const elige = (xs) => xs[Math.floor(r() * xs.length)];
      const notas = [];
      const add = (peso, titular, texto, partido) => notas.push({ peso: peso + r() * 4, titular, texto, partido });
      const lider = d.despues[0], liderAntes = d.antes && d.antes[0];
      const quedan = d.total - d.n;

      // Campeón: matemáticamente o en la última jornada.
      const segundo = d.despues[1];
      if (lider && segundo && (lider.pts - segundo.pts > quedan * (d.puntos || 2) || (quedan === 0))) {
        const ya = quedan > 0 ? `a falta de ${quedan === 1 ? 'una jornada' : NUM[quedan] ? NUM[quedan] + ' jornadas' : quedan + ' jornadas'}` : 'en la última jornada';
        add(200, elige([`¡${mayus(el(lider.nombre))}, campeón de Liga!`, `${mayus(apodo(lider.nombre))}, campeones de Liga`]),
          `${mayus(el(lider.nombre))} se proclama campeón ${ya}, con ${lider.pts} puntos, ${lider.g} victorias y ${lider.gf} goles a favor. ${lider.pts === segundo.pts ? `${mayus(el(segundo.nombre))} empata a puntos, pero pierde por la diferencia de goles.` : `${mayus(el(segundo.nombre))} termina a ${lider.pts - segundo.pts} ${lider.pts - segundo.pts === 1 ? 'punto' : 'puntos'}.`}`);
      } else if (lider && liderAntes && lider.nombre !== liderAntes.nombre && d.n > 1) {
        add(55, elige([`${mayus(el(lider.nombre))}, nuevo líder`, `${mayus(el(lider.nombre))} asalta el liderato`, `Cambio en la cabeza: manda ${el(lider.nombre)}`]),
          `Con ${lider.pts} puntos, ${el(lider.nombre)} desbanca ${al(liderAntes.nombre)} de la primera plaza tras la jornada ${d.n}.`);
      }
      // Descenso consumado en la última jornada.
      if (quedan === 0) {
        const bajan = d.despues.slice(-2).map((t) => el(t.nombre));
        add(60, `${mayus(lista(bajan))}, a Segunda`, `Los dos últimos de la tabla pierden la categoría al cierre del campeonato.`);
      }

      d.res.forEach((m) => {
        const loc = m.local, vis = m.visita;
        const gana = m.ga > m.gb ? loc : m.gb > m.ga ? vis : null;
        const pierde = gana === loc ? vis : gana === vis ? loc : null;
        const dif = Math.abs(m.ga - m.gb);
        const gL = goleadores(m, 0), gV = goleadores(m, 1);
        const autores = lista(gL.concat(gV)), nGoles = m.ga + m.gb;
        const aFavor = `${Math.max(m.ga, m.gb)}-${Math.min(m.ga, m.gb)}`;
        const enCampo = `en ${campo(loc)}`;

        // Tripletes y más.
        const cuenta = {};
        m.eventos.filter((e) => e.tipo === 'gol' || e.tipo === 'pen').forEach((e) => { cuenta[e.quien + '|' + e.lado] = (cuenta[e.quien + '|' + e.lado] || 0) + 1; });
        Object.entries(cuenta).forEach(([k, g]) => {
          if (g < 3) return;
          const [quien, lado] = k.split('|');
          const suyo = +lado === 0 ? loc : vis, rival = +lado === 0 ? vis : loc;
          add(60 + (g - 3) * 15 + (d.cracks.has(quien) ? 5 : 0),
            elige([`${apellido(quien)}, ${NUM_GOL[g] || g + ' goles'} ante ${el(rival)}`, `Tarde de ${apellido(quien)}: ${NUM_GOL[g] || g + ' goles'}`].concat(gana === suyo ? [`${apellido(quien)} se basta solo ${enCampo}`] : [`Los ${NUM_GOL[g] || g + ' goles'} de ${apellido(quien)} no le bastan ${al(suyo)}`])),
            `${resultado(m)}, ${enCampo}. ${mayus(el(suyo))} ${gana === suyo ? 'gana' : gana ? 'cae' : 'empata'} con ${NUM_GOL[g] || g + ' goles'} de ${apellido(quien)}.`, m);
        });
        // Derbi.
        if (m.derbi) {
          const t = gana ? elige([`${mayus(el(gana))} se lleva el ${m.derbi}`, `${mayus(el(gana))} gana el ${m.derbi} por ${aFavor}${gana === vis ? ' a domicilio' : ''}`, `${mayus(apodo(gana))} mandan en el ${m.derbi}`])
            : elige([`Tablas en el ${m.derbi}`, `Nadie gana el ${m.derbi}`]);
          add(58 + (m.derbi === 'Clásico' ? 15 : 0), t, `${resultado(m)}, ${enCampo}.${golesDe(gL.concat(gV), nGoles)}`, m);
        }
        // Goleada.
        if (dif >= 4) {
          add(30 + dif * 6, elige([`${mayus(el(gana))} arrolla ${al(pierde)}`, `Vendaval ${del(gana)}: ${aFavor}`, `Paliza en ${campo(loc)}`]),
            `${resultado(m)}.${golesDe(gL.concat(gV), nGoles)}`, m);
        }
        // Sorpresa: el débil vence al fuerte.
        if (gana && (d.fuerza[pierde] || 0) - (d.fuerza[gana] || 0) > 60) {
          add(40 + ((d.fuerza[pierde] - d.fuerza[gana]) / 5), elige([`Campanada ${enCampo}`, `${mayus(el(gana))} tumba ${al(pierde)}`, `Sorpresa mayúscula: cae ${el(pierde)}`]),
            `Nadie lo esperaba: ${el(gana)} vence ${aFavor} ${al(pierde)}${gana === vis ? ' lejos de casa' : ''}.${golesDe(gL.concat(gV), nGoles)}`, m);
        }
        // Remontada.
        let marc = [0, 0], peor = [0, 0];
        m.eventos.forEach((e) => { if (e.tipo === 'gol' || e.tipo === 'pen') { marc[e.lado]++; peor[0] = Math.min(peor[0], marc[0] - marc[1]); peor[1] = Math.min(peor[1], marc[1] - marc[0]); } });
        const contra = gana ? -peor[gana === loc ? 0 : 1] : 0;
        if (contra >= 2) {
          add(52, elige([`Remontada ${del(gana)} ${enCampo}`, `${mayus(el(gana))} levanta ${NUM[contra]} goles de desventaja`]),
            `${mayus(el(gana))} perdía por ${NUM[contra]} goles y acabó ganando ${aFavor}.${golesDe(gL.concat(gV), nGoles)}`, m);
        }
        // Incidencias.
        m.eventos.filter((e) => e.tipo === 'roja').forEach((e) => {
          const suyo = e.lado === 0 ? loc : vis;
          add(18 + (d.cracks.has(e.quien) ? 14 : 0) + (m.derbi ? 8 : 0), `Expulsado ${apellido(e.quien)}`, `${apellido(e.quien)}, ${del(suyo)}, vio la expulsión en el minuto ${e.min} y ${el(suyo)} jugó con diez.`, m);
        });
        m.eventos.filter((e) => e.tipo === 'lesion' && d.cracks.has(e.quien)).forEach((e) => {
          add(24, `Se lesiona ${apellido(e.quien)}`, `${apellido(e.quien)} se retiró en el minuto ${e.min}. Sin cambios permitidos, su equipo acabó con diez.`, m);
        });
        m.eventos.filter((e) => e.tipo === 'penFallado').forEach((e) => {
          add(14 + (e.min > 80 ? 10 : 0), `${apellido(e.quien)} falla un penalti`, `${apellido(e.quien)} erró desde los once metros en el minuto ${e.min}.`, m);
        });
      });

      // Banquillos: ceses, bajas y relevos de la jornada.
      const tecnico = (n) => apellido(String(n).replace(/\s*\(.*\)/, ''));
      (d.cambios || []).forEach((c) => {
        if (c.motivo === 'cese') add(48, elige([`${mayus(el(c.club))} destituye a ${tecnico(c.sale)}`, `${tecnico(c.entra)}, nuevo entrenador ${del(c.club)}`]), `La directiva ${del(c.club)} pierde la paciencia tras la mala racha: ${c.sale} deja el banquillo y llega ${c.entra}.`);
        else if (c.motivo === 'baja') add(45, `${tecnico(c.sale)}, de baja: ${tecnico(c.entra)} toma el mando ${del(c.club)}`, `${c.sale} deja por un tiempo el banquillo ${del(c.club)} y lo sustituye ${c.entra}.`);
        else if (c.motivo === 'vuelve') add(30, `${tecnico(c.entra)} vuelve al banquillo ${del(c.club)}`, `Recuperado, ${c.entra} vuelve a dirigir ${al(c.club)}.`);
        else add(28, `${tecnico(c.entra)} se hace cargo ${del(c.club)}`, `Termina el interinato de ${c.sale}; llega ${c.entra}.`);
      });

      // Si nada destaca, el partido del líder.
      if (!notas.length && lider) {
        const m = d.res.find((x) => x.local === lider.nombre || x.visita === lider.nombre);
        if (m) add(10, `${mayus(el(lider.nombre))} sigue al frente`, `${resultado(m)}. ${mayus(el(lider.nombre))} suma ${lider.pts} puntos.`, m);
      }
      notas.sort((a, b) => b.peso - a.peso);
      // Una noticia por partido en la portada, salvo la principal.
      const usados = new Set();
      const elegidas = [];
      notas.forEach((x) => { const k = x.partido ? x.partido.local : x.titular; if (!usados.has(k) || !x.partido) { usados.add(k); elegidas.push(x); } });
      const principal = elegidas[0] || { titular: `Jornada ${d.n}`, texto: '' };
      return { titular: principal.titular, entradilla: principal.texto, breves: elegidas.slice(1, 5) };
    }

    // Titular de la final de Copa.
    function finalCopa(copa) {
      const f = copa.rondas[copa.rondas.length - 1].cruces[0];
      const ultimo = f.partidos[f.partidos.length - 1];
      const otro = f.ganador === f.a ? f.b : f.a;
      const extra = f.partidos.length > 1 ? (f.partidos.some((p) => p.desempate) ? ' tras un partido de desempate' : ' en la prórroga') : '';
      return {
        titular: `¡${mayus(el(f.ganador))} gana la ${copa.nombre && copa.nombre !== 'Copa' ? copa.nombre : 'Copa del Generalísimo'}!`,
        entradilla: `${mayus(el(f.ganador))} vence ${Math.max(ultimo.ga, ultimo.gb)}-${Math.min(ultimo.ga, ultimo.gb)} ${al(otro)}${extra}. ${(() => { const g = goleadores(ultimo, ultimo.local === f.ganador ? 0 : 1); return g.length ? `Goles de ${lista(g)}.` : ''; })()}`
      };
    }

    return { portada, finalCopa, el, al, del, apodo, campo, apellido };
  }

  const api = { crear, apellido };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Cronica = api;
})(typeof self !== 'undefined' ? self : this);
