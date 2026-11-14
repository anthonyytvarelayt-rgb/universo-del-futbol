// Reproduce interrupciones del comprobador sin alterar el motor del juego.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict'), { spawnSync } = require('node:child_process');
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'barrido-resistencia-'));
const ejecutar = (preload, salida, casos) => spawnSync(process.execPath, ['--require', preload, path.join(__dirname, 'barrido-contratos.cjs'), salida, '--casos=' + casos], { encoding: 'utf8', timeout: 180000 });
try {
  const casos = path.join(temporal, 'casos.json');
  fs.writeFileSync(casos, JSON.stringify({ partidas: [{ inicio: 1958, semilla: 1, salida: 1 }] }));
  // Rechazar una ruta como año antes de crear archivos o quitar informes anteriores.
  const malos = path.join(temporal, 'casos-invalidos.json'), destinoInvalido = path.join(temporal, 'no-crear');
  fs.writeFileSync(malos, JSON.stringify({ partidas: [{ inicio: '../fuera', semilla: 1, salida: 1 }] }));
  const invalido = spawnSync(process.execPath, [path.join(__dirname, 'barrido-contratos.cjs'), destinoInvalido, '--casos=' + malos], { encoding: 'utf8' });
  assert.notEqual(invalido.status, 0);
  assert.ok(invalido.stderr.includes('año y semilla enteros'));
  assert.ok(!fs.existsSync(destinoInvalido));
  const preload = path.join(temporal, 'sin-informe.cjs'), salida = path.join(temporal, 'sin-informe');
  // Simula un hijo que muere antes de escribir JSON. Conserva un informe viejo para comprobar que se elimina.
  fs.mkdirSync(salida);
  fs.writeFileSync(path.join(salida, '1958-1.json'), JSON.stringify({ inicio: 1958, semilla: 1, temporadas: 12, temporadasCompletadas: 12 }));
  fs.writeFileSync(preload, `const cp = require('node:child_process'), fs = require('node:fs');\ncp.spawnSync = (programa, args, opciones) => { fs.writeSync(opciones.stdio[1], 'Interrupción controlada sin JSON'); return { status: 9, signal: null }; };\n`);
  const r = ejecutar(preload, salida, casos);
  assert.equal(r.status, 1);
  const resumen = JSON.parse(fs.readFileSync(path.join(salida, 'resumen.json'), 'utf8'));
  assert.equal(resumen.partidas.length, 1);
  assert.equal(resumen.partidas[0].salida, 9);
  assert.ok(resumen.partidas[0].error.includes('Interrupción controlada sin JSON'));
  const md = fs.readFileSync(path.join(salida, 'resumen.md'), 'utf8');
  assert.ok(md.includes('Partidas completas: 0'));
  assert.ok(md.includes('Partidas interrumpidas: 1'));
  assert.equal(resumen.finalizado, true);
  // Simula una excepción del juego tras una temporada completa. El informe debe conservar ese progreso.
  const parcial = path.join(temporal, 'parcial.json'), inyectar = path.join(temporal, 'fallo-controlado.cjs');
  fs.writeFileSync(inyectar, `const {Mundo} = require(${JSON.stringify(path.join(__dirname, 'cargar.js'))});\nlet n=0; const jugar=Mundo.jugar; Mundo.jugar=(...args)=>{ if(++n===2) throw Error('Fallo controlado tras una temporada'); return jugar(...args); };\n`);
  const hijo = spawnSync(process.execPath, ['--require', inyectar, path.join(__dirname, 'contratos-partida.js'), '2000', '3', '1', parcial], { encoding: 'utf8', timeout: 180000 });
  assert.equal(hijo.status, 1);
  const datos = JSON.parse(fs.readFileSync(parcial, 'utf8'));
  assert.equal(datos.temporadasCompletadas, 1);
  assert.ok(datos.comprobaciones > 0);
  assert.ok(datos.error.includes('Fallo controlado tras una temporada'));
  console.log('Barrido: interrupciones, informes parciales y resultados antiguos bien');
} finally {
  fs.rmSync(temporal, { recursive: true, force: true });
}
