// Busca fichajes absurdos: juega una partida y, cada verano, mira a los mejores jugadores del mundo (hasta 33 años).
// Avisa si uno ha cambiado a un club más débil que no es de Primera o que no está en la mitad fuerte de su liga.
// No avisa por el club donde debuta (ese es el real).
// Uso: node pruebas/absurdos.js <año> <temporadas> <semilla> [avisos permitidos] [cuántos mejores]   (sale con error si hay más de MAX avisos)
const { Motor, Mundo, BASE } = require('./cargar.js');
const anio = +process.argv[2] || 2000, n = +process.argv[3] || 10, semilla = +process.argv[4] || 7, MAX = +process.argv[5] || 0, TOP = +process.argv[6] || 40;
const avisos = new Map(), antes = new Map(); let vistos = 0;
Mundo.partida(Mundo.desdeBase(BASE, anio), { semilla, temporadas: n, alAvanzar: (res, M) => {
  const fuerza = new Map(M.clubes.map((c) => [c, Motor.fuerzaBruta(c)]));
  const puesto = new Map();
  const ligas = {};
  M.clubes.filter((c) => c.division === 1).forEach((c) => (ligas[c.pais + '|' + c.grupo] = ligas[c.pais + '|' + c.grupo] || []).push(c));
  Object.values(ligas).forEach((cs) => cs.sort((a, b) => fuerza.get(b) - fuerza.get(a)).forEach((c, i) => puesto.set(c, (i + 1) / cs.length)));
  const todos = [];
  M.clubes.forEach((c) => c.jugadores.forEach((j) => { if (!j.relleno && M.anio - +String(j.nac).slice(0, 4) <= 33) todos.push({ j, c }); }));
  todos.sort((a, b) => b.j.niv - a.j.niv).slice(0, TOP).forEach(({ j, c }) => {
    vistos++;
    const p = puesto.get(c);
    const k0 = j.n + '|' + j.nac, ant = antes.get(k0); antes.set(k0, c);
    if (ant && ant !== c && fuerza.get(c) < fuerza.get(ant) && (p === undefined || p > 0.5)) {
      const k = j.n + ' a ' + c.nombre;
      if (!avisos.has(k)) avisos.set(k, `${M.anio}: ${j.n} (nivel ${Math.round(Motor.escala.mostrar(j.niv))}, ${M.anio - +String(j.nac).slice(0, 4)} años) pasa de ${ant.nombre} a ${c.nombre}` + (p === undefined ? ', que no está en Primera' : `, puesto de fuerza ${Math.round(p * 100)} % en su liga`));
    }
  });
} });
avisos.forEach((t) => console.log(t));
console.log(`${anio} + ${n} temporadas, semilla ${semilla}: ${avisos.size} fichajes raros (de ${vistos} miradas)`);
process.exit(avisos.size > MAX ? 1 : 0);
