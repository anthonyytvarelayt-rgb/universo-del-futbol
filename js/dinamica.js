// Decisiones de club y selección que dependen de lo ocurrido en la partida.
(function (root) {
  'use strict';
  const Motor = root.Motor || (typeof require !== 'undefined' ? require('./motor.js') : null);
  const posiciones = ['POR', 'DEF', 'MED', 'DEL'];
  const plazas = { POR: 1, DEF: 4, MED: 3, DEL: 3 };
  const limitar = (n, min, max) => Math.max(min, Math.min(max, n));

  function titulares(jugadores, pos) {
    return jugadores.filter((j) => j.pos === pos).sort((a, b) => b.niv - a.niv).slice(0, plazas[pos]);
  }

  // Una idea gana peso cuando más de un club obtiene resultados con ella.
  function tendencia(tabla, objetivos, anio) {
    const esperados = new Map(objetivos.map((o) => [o.club, o.esperado]));
    const porDibujo = new Map();
    tabla.forEach((t, i) => {
      const dibujo = Motor.DIBUJOS[t.dibujo];
      if (!dibujo || anio < dibujo.desde || anio > dibujo.hasta) return;
      const esperado = esperados.get(t.nombre) || i + 1;
      const logro = i === 0 ? 3 : i <= 3 ? 1 : 0;
      const puntos = logro + limitar(esperado - i - 1, 0, 6) / 3;
      const dato = porDibujo.get(t.dibujo) || { dibujo: t.dibujo, puntos: 0, clubes: 0, destacados: [] };
      dato.puntos += puntos;
      dato.clubes++;
      if (puntos >= 1.5) dato.destacados.push(t.nombre);
      porDibujo.set(t.dibujo, dato);
    });
    return [...porDibujo.values()].filter((x) => x.destacados.length >= 2)
      .sort((a, b) => b.puntos / Math.sqrt(b.clubes) - a.puntos / Math.sqrt(a.clubes))[0] || null;
  }

  function perfilAscenso(club, estadisticas, anio) {
    let total = 0, cedidos = 0, veteranos = 0, jovenes = 0;
    club.jugadores.forEach((j) => {
      const min = (estadisticas.get(j) || {}).min || 0;
      if (!min || j.relleno) return;
      total += min;
      if (j.cedido) cedidos += min;
      else if (Motor.edad(j, anio) >= 31) veteranos += min;
      else if (Motor.edad(j, anio) <= 23 && (j.carrera || []).every((t) => t.club === j.inicio?.club)
        && j.inicio?.club === club.nombre) jovenes += min;
    });
    if (!total) return null;
    const porcentajes = Object.fromEntries(Object.entries({ cedidos, veteranos, jovenes }).map(([k, v]) => [k, Math.round(100 * v / total)]));
    const tipo = porcentajes.cedidos >= 24 ? 'cedidos' : porcentajes.veteranos >= 30 ? 'veteranos' : porcentajes.jovenes >= 28 ? 'jovenes' : null;
    return tipo ? { tipo, ...porcentajes } : null;
  }

  function prioridadTecnico(c, entrenador) {
    if (!entrenador || c.division !== 1) return null;
    const dibujo = Motor.DIBUJOS[c.dibujo];
    const hacenFalta = dibujo ? { POR: 1, DEF: dibujo.l[0], MED: dibujo.l[1], DEL: dibujo.l[2] } : plazas;
    const nivelPorPuesto = posiciones.map((pos) => {
      const linea = c.jugadores.filter((j) => j.pos === pos && !j.cedido).sort((a, b) => b.niv - a.niv);
      const ultimo = linea[hacenFalta[pos] - 1];
      return { pos, nivel: ultimo ? ultimo.niv : 300 };
    }).sort((a, b) => a.nivel - b.nivel);
    const diferencia = nivelPorPuesto[2].nivel - nivelPorPuesto[0].nivel;
    return diferencia >= 35 ? { pos: nivelPorPuesto[0].pos, dt: entrenador.nombre } : null;
  }

  function relevoPorteria(c, anio) {
    if (c.division !== 1) return null;
    const primero = titulares(c.jugadores, 'POR')[0];
    if (!primero || primero.relleno || Motor.edad(primero, anio) < 33) return null;
    const heredero = c.jugadores.some((j) => !j.relleno && !j.cedido && j.pos === 'POR' && j !== primero
      && Motor.edad(j, anio) <= 28 && (j.tec || j.niv) >= primero.niv - 35 && j.niv >= primero.niv - 130);
    return heredero ? null : primero;
  }

  function retorno(c, jugador, casa, anio, oferta) {
    if (c.nombre !== casa || c.division > 2 || Motor.edad(jugador, anio) < 31) return false;
    const ultimo = titulares(c.jugadores, jugador.pos).at(-1);
    const joven = ultimo && Motor.edad(ultimo, anio) <= 24 && ultimo.niv >= jugador.niv - 35;
    return oferta && !joven && (!ultimo || jugador.niv >= ultimo.niv - 65);
  }

  // Nivel actual primero. Vale la pena llevar a un joven cercano si la posición llega envejecida.
  function convocados(xs, cupo, anio, generacion) {
    const orden = [...xs].sort((a, b) => b.niv - a.niv || a.n.localeCompare(b.n));
    const lista = orden.slice(0, cupo);
    const edad = (x) => x.edad || (x.nac && anio - parseInt(x.nac, 10)) || 0;
    const veteranos = lista.filter((x) => edad(x) >= 31);
    if (lista.length < cupo || (veteranos.length < Math.ceil(cupo * 0.6) && !(generacion && generacion.length >= 3))) return lista;
    const ultimo = lista[lista.length - 1];
    if (edad(ultimo) && edad(ultimo) <= 24) return lista;
    const joven = orden.slice(cupo).find((x) => edad(x) > 0 && edad(x) <= 24 && x.niv >= ultimo.niv - 8);
    if (joven) lista[lista.length - 1] = joven;
    return lista;
  }

  function estadoGeneracion(lista, anterior) {
    const tras = {};
    posiciones.forEach((pos) => {
      const datos = lista.filter((x) => x[1] === pos && x[4] > 0);
      const veteranos = datos.filter((x) => x[4] >= 31).map((x) => x[0]);
      if (veteranos.length >= 3) tras[pos] = veteranos;
    });
    const cambios = [];
    Object.entries(anterior || {}).forEach(([pos, viejos]) => {
      const actuales = new Set(lista.filter((x) => x[1] === pos).map((x) => x[0]));
      const salidas = viejos.filter((n) => !actuales.has(n));
      if (salidas.length >= 2) cambios.push({ pos, salidas });
    });
    return { pendientes: tras, cambios };
  }

  // Reparte una parte de los ingresos que ya existían. No aumenta el total de la liga.
  function repartirTV(clubes, anio, ingreso) {
    const grupos = new Map(), ajustes = new Map();
    clubes.filter((c) => c.division === 1).forEach((c) => {
      const ano = { Inglaterra: 1992, España: 2016 }[c.pais];
      if (!ano || anio < ano) return;
      if (!grupos.has(c.pais)) grupos.set(c.pais, []);
      grupos.get(c.pais).push(c);
    });
    grupos.forEach((xs) => {
      const medias = Math.min(0.12, 0.045 + Math.max(0, anio - ({ Inglaterra: 1992, España: 2016 }[xs[0].pais])) * 0.009);
      const bases = xs.map(ingreso), total = bases.reduce((a, b) => a + b, 0);
      // El resto de la cuota sigue siendo proporcional a la capacidad comercial del club.
      bases.forEach((base, i) => ajustes.set(xs[i], (total / xs.length - base) * medias));
    });
    return ajustes;
  }

  function porcentajeReserva(c, anio) {
    if (c.caja < 0) return 0;
    if (c.presidente?.estilo === 'tacano') return 0.4;
    return c.ajusteSalarial?.anio === anio ? 0.25 : 0;
  }

  const api = { tendencia, perfilAscenso, prioridadTecnico, relevoPorteria, retorno, convocados, estadoGeneracion, repartirTV, porcentajeReserva };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Dinamica = api;
})(typeof self !== 'undefined' ? self : globalThis);
