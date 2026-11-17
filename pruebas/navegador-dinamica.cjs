// Abre la crónica de la dinámica y comprueba que reaparece igual al recargar la partida.
// Uso: node pruebas/navegador-dinamica.cjs [directorio de resultados]
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const raiz = path.resolve(__dirname, '..'), salida = path.resolve(process.argv[2] || '/tmp/dinamica-navegador');
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
      const context = await browser.newContext({ viewport: { width: inicio === 1958 ? 1440 : 390, height: inicio === 1958 ? 1000 : 844 }, ignoreHTTPSErrors: true });
      const page = await context.newPage();
      page.on('pageerror', (e) => log.erroresJS.push(e.message));
      await page.goto(`http://127.0.0.1:${servidor.address().port}`);
      await page.evaluate((anio) => { anioSel = anio; pintarInicio(); }, inicio);
      await page.locator('#empezar').click();
      await page.locator('[data-tiempo="fin"]').waitFor({ timeout: 120000 });
      await page.locator('[data-tiempo="fin"]').click();
      await page.locator('[data-tiempo="siguiente"]').waitFor({ timeout: 120000 });
      const cambios = page.locator('#s-hoy .caja').filter({ has: page.locator('.rotulo', { hasText: /^Cómo cambia el fútbol$/ }) });
      await cambios.locator('summary').first().click();
      assert.ok((await cambios.locator('small').first().textContent()).length > 10);
      await page.screenshot({ path: path.join(salida, `dinamica-${inicio}.jpg`), type: 'jpeg', quality: 83 });
      const antes = await page.evaluate(() => ({
        temporada: S.temporada, pagina: iPaso, cambios: dinamicaDe(S), modo: typeof Worker,
        ancho: document.documentElement.scrollWidth, cuerpo: innerWidth,
        balanceMadrid: S.europa === 'Real Madrid' ? S.objetivos.find((o) => o.club === S.europa).balance : null,
        tv: S.finanzas.some((x) => x.tv)
      }));
      assert.ok(antes.cambios.length > 0 && antes.ancho <= antes.cuerpo);
      if (antes.balanceMadrid) assert.equal(antes.balanceMadrid, 'superado');
      if (inicio === 2000) assert.ok(antes.tv);
      await page.reload();
      await page.locator('[data-tiempo="siguiente"]').waitFor({ timeout: 120000 });
      const despues = await page.evaluate(() => ({ temporada: S.temporada, pagina: iPaso, cambios: dinamicaDe(S) }));
      assert.deepEqual(despues, { temporada: antes.temporada, pagina: antes.pagina, cambios: antes.cambios });
      log.epocas.push({ inicio, cambios: antes.cambios.length, tv: antes.tv });
      console.log(antes.temporada, antes.cambios.length, 'historias, cierre idéntico tras recargar');
      await context.close();
    }
    assert.deepEqual(log.erroresJS, []);
    console.log('Navegador: dinámica, cierre y guardado en escritorio y móvil');
  } finally { fs.writeFileSync(path.join(salida, 'comprobacion.json'), JSON.stringify(log, null, 2)); await browser?.close(); servidor.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
