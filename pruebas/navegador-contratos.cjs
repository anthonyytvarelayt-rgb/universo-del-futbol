// Opcional: requiere Playwright y Chromium en el entorno de pruebas, sin instalar nada en el juego.
// Uso: node pruebas/navegador-contratos.cjs [directorio de resultados]
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const raiz = path.resolve(__dirname, '..'), salida = path.resolve(process.argv[2] || '/tmp/contratos-navegador');
fs.mkdirSync(salida, { recursive: true });
const log = { erroresJS: [], erroresRed: [], epocas: [] };
const servidor = http.createServer((req, res) => {
  let archivo;
  try { archivo = path.resolve(raiz, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); } catch { res.writeHead(400); return res.end(); }
  if (archivo !== raiz && !archivo.startsWith(raiz + path.sep)) { res.writeHead(403); return res.end(); }
  if (archivo === raiz) archivo = path.join(raiz, 'index.html');
  fs.readFile(archivo, (error, datos) => {
    if (error) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' })[path.extname(archivo)] || 'application/octet-stream');
    res.end(datos);
  });
});
(async () => {
  let browser;
  try {
    await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
    for (const inicio of [1958, 2000]) {
      console.log('Inicio', inicio);
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });
      const page = await context.newPage();
      page.on('pageerror', (e) => log.erroresJS.push(e.message));
      page.on('requestfailed', (req) => log.erroresRed.push({ url: req.url(), error: req.failure()?.errorText }));
      await page.goto(`http://127.0.0.1:${servidor.address().port}`);
      if (inicio !== 1958) await page.evaluate((anio) => { anioSel = anio; pintarInicio(); }, inicio);
      await page.locator('#empezar').click();
      await page.locator('[data-tiempo="fin"]').waitFor({ timeout: 120000 });
      for (let i = 0; i < 2; i++) {
        assert.equal(await page.evaluate(() => S.anio), inicio + i);
        await page.locator('[data-tiempo="fin"]').click();
        await page.locator('[data-tiempo="siguiente"]').waitFor({ timeout: 120000 });
        assert.ok(await page.evaluate(() => S.sueldos && M.clubes.every((c) => c.jugadores.every((j) => j.salario > 0))));
        if (i === 0) {
          await page.locator('[data-tiempo="siguiente"]').click();
          await page.locator('[data-tiempo="fin"]').waitFor({ timeout: 120000 });
        }
      }
      const foto = () => page.evaluate(() => JSON.stringify({
        anio: S.anio, campeon: S.campeon, europa: S.europa, sueldos: S.sueldos,
        contratos: M.clubes.map((c) => [c.nombre, c.caja, c.jugadores.map((j) => [j.n, j.nac, j.salario, j.salarioAnio, j.contrato])])
      }));
      const antes = await foto();
      await page.evaluate(() => {
        const x = S.sueldos.peticiones[0];
        const j = x ? M.clubes.flatMap((c) => c.jugadores).find((j) => j.n === x.jugador) : M.clubes.find((c) => c.nombre === 'Real Madrid').jugadores[0];
        abrirFicha({ tipo: 'j', n: j.n });
        // Las noticias y declaraciones se pueden consultar repetidamente.
        sueldosDe(S); sueldosDe(S); declaraciones(S);
      });
      const ficha = page.locator('#hoja .palmares').filter({ hasText: 'Su contrato' });
      assert.ok((await ficha.innerText()).includes('Cobra al año'));
      assert.equal(await foto(), antes, 'Abrir fichas o noticias no cambia contratos, caja ni resultados');
      await ficha.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(salida, `contrato-${inicio}-escritorio.jpg`), type: 'jpeg', quality: 80 });
      await page.setViewportSize({ width: 390, height: 844 });
      await ficha.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(salida, `contrato-${inicio}-movil.jpg`), type: 'jpeg', quality: 80 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Sin desbordamiento horizontal');
      await page.reload();
      await page.waitForFunction(() => typeof S !== 'undefined' && S && !ocupado, null, { timeout: 120000 });
      assert.equal(await foto(), antes, 'Reconstruir el guardado conserva contratos, caja, hechos y campeones');
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => S.anio), inicio + 1, 'La temporada espera al botón');
      log.epocas.push({ inicio, temporadas: 2, contratosYResultadosIdenticos: true, lecturaSinEfectos: true, movil390: true });
      await context.close();
      console.log('Completado', inicio);
    }
    assert.deepEqual(log.erroresJS, []);
    assert.deepEqual(log.erroresRed.filter((x) => x.url.startsWith('http://127.0.0.1:')), [], 'Sin fallos de archivos del juego');
  } catch (error) {
    log.fallo = error.stack;
    process.exitCode = 1;
    console.error(error);
  } finally {
    fs.writeFileSync(path.join(salida, 'navegador.json'), JSON.stringify(log, null, 2) + '\n');
    if (browser) await browser.close();
    await new Promise((resolve) => servidor.close(resolve));
    console.log(JSON.stringify(log));
  }
})();
