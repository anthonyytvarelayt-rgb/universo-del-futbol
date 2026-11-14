// Barrido automático de semillas: no edita el juego ni publica cambios de código.
// Uso: node pruebas/barrido-contratos.cjs <directorio> [fecha-límite ISO] [issue GitHub]
// Sin fecha ejecuta una pasada de ocho épocas. Con fecha empieza nuevas partidas hasta ese límite.
const fs = require('node:fs'), path = require('node:path'), { spawnSync, execFileSync } = require('node:child_process');
const salida = path.resolve(process.argv[2] || '/tmp/barrido-contratos');
const hasta = process.argv[3] ? Date.parse(process.argv[3]) : null;
if (hasta !== null && (!Number.isFinite(hasta) || hasta <= Date.now())) throw Error('La fecha límite debe estar en el futuro');
const issue = process.argv[4] ? Number(process.argv[4]) : null;
if (issue !== null && (!Number.isInteger(issue) || issue < 1)) throw Error('Issue inválida');
fs.mkdirSync(salida, { recursive: true });
const estado = { revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim(), inicio: new Date().toISOString(), limite: hasta && new Date(hasta).toISOString(), finalizado: false, partidas: [], erroresPublicacion: [] };
const anos = [1958, 1962, 1970, 1980, 1992, 2000, 2015, 2025], avisados = new Set();
const resumen = () => {
  const filas = estado.partidas;
  return `Codex · barrido automático de contratos sobre ${estado.revision.slice(0, 7)}\n\n` +
    `Estado: ${estado.finalizado ? 'terminado' : 'en curso'}. Partidas terminadas: ${filas.length}. Temporadas: ${filas.reduce((s, x) => s + (x.temporadasCompletadas || 0), 0)}. Comprobaciones: ${filas.reduce((s, x) => s + (x.comprobaciones || 0), 0)}.\n\n` +
    `Partidas con fallos: ${filas.filter((x) => x.salida !== 0).length}. Refinanciaciones registradas (todos los clubes): ${filas.reduce((s, x) => s + (x.refinanciaciones?.length || 0), 0)}.\n\n` +
    (filas.filter((x) => x.salida !== 0).map((x) => `- Inicio ${x.inicio}, semilla ${x.semilla}: ${(x.fallos || [x.error]).join('; ')}`).slice(0, 30).join('\n') || 'No se han detectado incumplimientos de las invariantes comprobadas.') +
    '\n\nNo se han modificado archivos del juego, fusionado ramas ni desplegado nada. Esto es una muestra de semillas, no una garantía general. Los detalles completos quedan en el directorio de resultados de la ejecución.';
};
const guardar = () => {
  fs.writeFileSync(path.join(salida, 'resumen.json'), JSON.stringify(estado, null, 2) + '\n');
  fs.writeFileSync(path.join(salida, 'resumen.md'), resumen() + '\n');
};
const publicar = (body) => {
  if (!issue) return;
  const entrada = path.join(salida, 'comentario.json');
  fs.writeFileSync(entrada, JSON.stringify({ body }));
  const r = spawnSync('gh', ['api', '--method', 'POST', `repos/anthonyytvarelayt-rgb/universo-del-futbol/issues/${issue}/comments`, '--input', entrada, '--jq', '.html_url'], { encoding: 'utf8', timeout: 30000 });
  if (r.status !== 0) estado.erroresPublicacion.push({ cuando: new Date().toISOString(), error: r.error?.message || r.stderr });
  else console.log(r.stdout.trim());
};
guardar();
let paso = 0;
while (hasta === null ? paso < anos.length : Date.now() < hasta) {
  const inicio = anos[paso % anos.length], semilla = Math.floor(paso / anos.length) + 1;
  const nombre = `${inicio}-${semilla}`, informe = path.join(salida, nombre + '.json');
  const fd = fs.openSync(path.join(salida, nombre + '.log'), 'w');
  const r = spawnSync(process.execPath, [path.join(__dirname, 'contratos-partida.js'), String(inicio), '12', String(semilla), informe], { stdio: ['ignore', fd, fd], timeout: 30 * 60 * 1000 });
  fs.closeSync(fd);
  let resultado;
  try { resultado = JSON.parse(fs.readFileSync(informe, 'utf8')); } catch { resultado = { inicio, semilla, error: r.error?.message || 'No se generó un informe completo' }; }
  resultado.salida = r.status ?? -1;
  estado.partidas.push(resultado);
  guardar();
  console.log(nombre, resultado.salida, resultado.fallos || resultado.error || 'bien');
  if (resultado.salida !== 0) {
    const firma = JSON.stringify(resultado.fallos || resultado.error);
    if (!avisados.has(firma) && avisados.size < 5) { avisados.add(firma); publicar(`Codex: fallo durante el barrido automático. Inicio ${inicio}, semilla ${semilla}.\n\n${firma}\n\n${JSON.stringify(resultado.muestras || [], null, 2).slice(0, 5000)}`); }
  }
  paso++;
}
estado.finalizado = true;
estado.fin = new Date().toISOString();
publicar(resumen());
guardar();
console.log(resumen());
process.exitCode = estado.partidas.some((x) => x.salida !== 0) ? 1 : 0;
