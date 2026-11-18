// Casos límite del cierre y dos recorridos reales que verifican el balance y el mercado.
const assert = require('node:assert/strict');
const { BASE, Mundo } = require('./cargar.js');

assert.equal(Mundo.balanceDe('titulo', 2, 20, { distancia: 15 }), 'cerca');
assert.equal(Mundo.balanceDe('titulo', 3, 20, { distancia: 2, puntosVictoria: 2 }), 'cerca');
assert.equal(Mundo.balanceDe('titulo', 8, 20, { distancia: 24 }), 'fracaso');
assert.equal(Mundo.balanceDe('salvarse', 18, 20, { descenso: false }), 'cumplido');
assert.equal(Mundo.balanceDe('salvarse', 13, 20, { descenso: true }), 'fracaso');
assert.equal(Mundo.balanceTemporada('fracaso', { tituloMayor: true, descenso: true }), 'superado');
assert.equal(Mundo.balanceTemporada('fracaso', { tituloSecundario: true }), 'cerca');
assert.equal(Mundo.balanceTemporada('fracaso', { tituloSecundario: true, descenso: true }), 'fracaso');
assert.equal(Mundo.balanceTemporada('fracaso', { finalMayor: 'Champions' }), 'cerca');
const veterano = { niv: 780, carrera: [{ niv: 900, pj: 30 }, { niv: 790, pj: 30 }] };
assert.equal(Mundo.reputacionMercado({ niv: 800, carrera: [{ niv: 950, pj: 1 }] }, 'estrellas'), 0);
assert.ok(Mundo.reputacionMercado(veterano, 'estrellas') > Mundo.reputacionMercado(veterano, 'ojeadores'));
assert.equal(Mundo.reputacionMercado({ ...veterano, relleno: true }, 'estrellas'), 0);

let titulos = 0, relevos = 0, reputaciones = 0, madrids = 0, cadenaLarga = 0;
for (const inicio of [1958, 2000]) Mundo.partida(Mundo.desdeBase(BASE, inicio), {
  semilla: 7, temporadas: 5,
  alAvanzar(res) {
    for (const copa of [res.R.EU, res.R.LIB].filter(Boolean)) {
      const obj = res.objetivos.find((x) => x.club === copa.campeon);
      if (!obj) continue;
      assert.equal(obj.balance, 'superado', `${res.temporada}: ${obj.club} ganó ${copa.nombre}`);
      assert.ok(obj.copas.includes(copa.nombre));
      assert.ok(!res.banquillos.some((b) => b.club === obj.club && b.motivo === 'despedido'));
      titulos++;
      if (obj.club === 'Real Madrid') madrids++;
    }
    const fichajes = new Set();
    res.mercado.forEach((f, i) => {
      if (f.tipo !== 'fichaje') return;
      const k = JSON.stringify([f.jugador, f.edad]);
      assert.ok(!fichajes.has(k), `Se traspasó dos veces a ${f.jugador} en ${res.anio + 1}`);
      fichajes.add(k);
      if (f.reputacion) reputaciones++;
      if (f.reemplaza == null) return;
      assert.ok(Number.isInteger(f.reemplaza) && f.reemplaza < i && f.reemplaza >= 0);
      const origen = res.mercado[f.reemplaza];
      assert.equal(origen.tipo, 'fichaje');
      assert.equal(origen.de, f.a);
      assert.equal(origen.pos, f.pos);
      if (origen.reemplaza != null) cadenaLarga++;
      relevos++;
    });
  }
});
console.log(`10 temporadas: ${titulos} campeones grandes con éxito (${madrids} del Madrid), ${relevos} relevos, ${cadenaLarga} eslabones de cadenas de al menos tres y ${reputaciones} fichajes con peso de la trayectoria.`);
assert.ok(titulos > 0 && madrids > 0 && relevos > 0, 'El recorrido debe incluir un Madrid campeón y relevos reales');
