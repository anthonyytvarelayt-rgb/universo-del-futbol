// Inventario de plantillas y entrenadores al iniciar; no cambia los datos ni juega partidos.
// Uso: node pruebas/cobertura-inicios.js <salida.json> [años separados por espacios]
const fs = require('node:fs');
const { Mundo, BASE } = require('./cargar.js');
const anos = process.argv.includes('--todos') ? Array.from({ length: 68 }, (_, i) => 1958 + i) : process.argv.slice(3).length ? process.argv.slice(3).map(Number) : [1958, 1970, 1980, 1990, 2000, 2015, 2025];
if (!process.argv[2] || anos.some((a) => !Number.isInteger(a))) throw Error('Indica el archivo de salida y años válidos');
const informe = { anos, clubes: [], cobertura: [] };
for (const anio of anos) {
  const M = Mundo.nuevoMundo(Mundo.desdeBase(BASE, anio));
  for (const c of M.clubes.filter((c) => c.division === 1)) {
    const reales = c.jugadores.filter((j) => !j.relleno), rellenos = c.jugadores.length - reales.length;
    informe.clubes.push({ anio, pais: c.pais, club: c.nombre, reales: reales.length, rellenos, porterosReales: reales.filter((j) => j.pos === 'POR').length, entrenador: c.entrenadores?.[0]?.nombre || null });
  }
  for (const pais of [...new Set(informe.clubes.filter((c) => c.anio === anio).map((c) => c.pais))]) {
    const cs = informe.clubes.filter((c) => c.anio === anio && c.pais === pais);
    informe.cobertura.push({ anio, pais, clubes: cs.length, conOnceReal: cs.filter((c) => c.reales >= 11).length, sinJugadoresReales: cs.filter((c) => !c.reales).length, sinPorteroReal: cs.filter((c) => !c.porterosReales).length, conEntrenador: cs.filter((c) => c.entrenador).length, jugadoresReales: cs.reduce((s, c) => s + c.reales, 0), rellenos: cs.reduce((s, c) => s + c.rellenos, 0) });
  }
  fs.writeFileSync(process.argv[2], JSON.stringify(informe, null, 2) + '\n');
  console.log(anio, JSON.stringify(informe.cobertura.filter((x) => x.anio === anio)));
}
