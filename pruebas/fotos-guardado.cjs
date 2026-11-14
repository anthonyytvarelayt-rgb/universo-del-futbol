// Opcional: requiere Playwright y Chromium. Comprueba versión e identidad de las fotos de IndexedDB.
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const raiz = path.resolve(__dirname, '..'), salida = path.resolve(process.argv[2] || '/tmp/fotos-guardado');
fs.mkdirSync(salida, { recursive: true });
const log = { errores: [], comprobaciones: {} };
const servidor = http.createServer((req, res) => {
  const f = path.resolve(raiz, '.' + new URL(req.url, 'http://localhost').pathname);
  if (f !== raiz && !f.startsWith(raiz + path.sep)) { res.writeHead(403); return res.end(); }
  const archivo = f === raiz ? path.join(raiz, 'index.html') : f;
  fs.readFile(archivo, (e, datos) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(archivo)] || 'application/octet-stream');res.end(datos);
  });
});
(async () => {
  let browser;
  try {
    await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();page.on('pageerror', (e) => log.errores.push(e.message));
    await page.goto(`http://127.0.0.1:${servidor.address().port}`);
    await page.evaluate(() => { anioSel = 2000; pintarInicio(); });
    await page.locator('#empezar').click();
    await page.locator('[data-tiempo="fin"]').waitFor({ timeout: 120000 });
    await page.locator('[data-tiempo="fin"]').click();
    await page.locator('[data-tiempo="siguiente"]').waitFor({ timeout: 120000 });
    await page.locator('[data-tiempo="siguiente"]').click();
    await page.locator('[data-tiempo="fin"]').waitFor({ timeout: 120000 });
    await page.waitForFunction(async () => (await leerFoto())?.k === 1, null, { timeout: 120000 });
    const estado = () => page.evaluate(() => JSON.stringify({ anio: S.anio, campeon: S.campeon, europa: S.europa, tabla: S.R.T.tabla.map(t => [t.nombre,t.pts,t.gf,t.gc]), clubes: M.clubes.map(c => [c.nombre,c.caja,c.jugadores.map(j => [j.n,j.nac,j.niv,j.salario,j.contrato,j.carrera.length])]) }));
    const canonico = await estado();
    // Mantener el mundo dentro del navegador conserva los Map y Set del guardado.
    await page.evaluate(async () => { const f = await leerFoto(); await fotos('readwrite', (st) => st.put(f, 'prueba-base')); });
    for (const tipo of ['incompatible', 'sin-version', 'compatible']) {
      await page.evaluate(async (tipo) => {
        const f = structuredClone(await fotos('readonly', (st) => st.get('prueba-base'))), meta = await leerGuardada();
        f.W.__fotoPrueba = tipo;
        if (tipo === 'sin-version') delete f.version; else f.version = tipo === 'compatible' ? meta.version : meta.version - 1;
        await fotos('readwrite', (st) => st.put(f, 'ultima'));
      }, tipo);
      await page.reload();
      await page.waitForFunction(() => typeof S !== 'undefined' && S && !ocupado, null, { timeout: 120000 });
      const marca = await page.evaluate(() => M.__fotoPrueba || null);
      log.comprobaciones[tipo] = tipo === 'compatible' ? marca === tipo : marca === null;
      log[tipo] = { marcaRecuperada: marca, anio: await page.evaluate(() => S.anio) };
      log.comprobaciones[tipo + '-estado'] = (await estado()) === canonico;
    }
    log.identidad = await page.evaluate(async () => {
      const original = fotos, datos = { semilla, numPartida, anioInicio }, f = await leerFoto();
      fotos = (modo, hacer) => new Promise((r) => setTimeout(() => original(modo, hacer).then(r), 50));
      try {
        const guardando = guardarFoto(f);
        semilla += 123; numPartida += 1; anioInicio += 1;
        await guardando;
        const almacenada = await original('readonly', (st) => st.get('ultima'));
        return { esperada: datos, guardada: { semilla: almacenada.semilla, numPartida: almacenada.numPartida, anioInicio: almacenada.anio } };
      } finally {
        semilla = datos.semilla; numPartida = datos.numPartida; anioInicio = datos.anioInicio; fotos = original;
        await fotos('readwrite', (st) => st.put(f, 'ultima'));
      }
    });
    log.comprobaciones.identidad = JSON.stringify(log.identidad.esperada) === JSON.stringify(log.identidad.guardada);
    console.log(JSON.stringify(log));
    assert.ok(Object.values(log.comprobaciones).every(Boolean), 'Las fotos deben respetar versión e identidad al pedir el guardado');
    assert.deepEqual(log.errores, []);
  } catch (e) { log.fallo = e.stack; console.error(e); process.exitCode = 1; }
  finally {
    fs.writeFileSync(path.join(salida, 'resultado.json'), JSON.stringify(log, null, 2) + '\n');
    if (browser) await browser.close();await new Promise((r) => servidor.close(r));
  }
})();
