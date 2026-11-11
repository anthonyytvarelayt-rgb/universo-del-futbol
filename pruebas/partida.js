// Juega una partida entera sin navegador y resume lo que pasó.
// Uso: node pruebas/partida.js <año de inicio> <temporadas> <semilla> "Jugador" "Otro jugador"...
const { Motor, Mundo, BASE } = require('./cargar.js');
const anio = +process.argv[2] || 2000, n = +process.argv[3] || 5, semilla = +process.argv[4] || 7, nombres = process.argv.slice(5);
const liga = [], europa = [];
const mundo = Mundo.partida(Mundo.desdeBase(BASE, anio), { semilla, temporadas: n, alAvanzar: (res) => {
  liga.push(res.campeon); europa.push(res.europa || '-');
  if (res.R.MU) console.log(`Mundial ${res.R.MU.anio}: ${res.R.MU.campeon} (final ante ${res.R.MU.subcampeon}), goleador ${res.R.MU.premios.botaOro.n} con ${res.R.MU.premios.botaOro.g}`);
} });
const cuenta = (xs) => Object.entries(xs.reduce((o, x) => (o[x] = (o[x] || 0) + 1, o), {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ');
console.log('Ligas de España:', cuenta(liga)); console.log('Copas de Europa:', cuenta(europa));
nombres.forEach((nombre) => {
  let j = null, club = null;
  mundo.clubes.forEach((c) => { const x = c.jugadores.find((y) => y.n === nombre); if (x) { j = x; club = c.nombre; } });
  const r = j || mundo.retirados.find((x) => x.n === nombre);
  if (!r) return console.log(nombre + ': no aparece');
  const suma = (f) => r.carrera.reduce((s, t) => s + f(t), 0);
  console.log(`${nombre}: ${j ? 'en ' + club : 'retirado a los ' + r.edad}, ${suma((t) => t.g)} goles de club y ${suma((t) => (t.sel ? t.sel.g : 0))} de selección en ${suma((t) => t.pj)} partidos`);
});
