// Opcional: requiere Playwright y Chromium en el entorno de pruebas, sin instalar nada en el juego.
// Uso: node pruebas/navegador-declaraciones.cjs [directorio de resultados]
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const raiz = path.resolve(__dirname, '..'), salida = path.resolve(process.argv[2] || '/tmp/declaraciones-navegador');
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
      for (let i = 0; i < 2; i++) {
        await page.locator('[data-tiempo="fin"]').click();
        await page.locator('[data-tiempo="siguiente"]').waitFor({ timeout: 120000 });
        const datos = await page.evaluate(() => {
          const antes = JSON.stringify({ semilla, k, iPaso, anio: S.anio, campeon: S.campeon, europa: S.europa });
          const ds = declaraciones(S), otra = declaraciones(S);
          if (JSON.stringify(ds) !== JSON.stringify(otra)) throw Error('Declaraciones inestables');
          const despues = JSON.stringify({ semilla, k, iPaso, anio: S.anio, campeon: S.campeon, europa: S.europa });
          if (antes !== despues) throw Error('La prensa cambió la partida');
          return { anio: S.anio, declaraciones: ds, entrenadores: ds.filter((x) => x.rol === 'entrenador').length, ancho: document.documentElement.scrollWidth, viewport: innerWidth };
        });
        assert.ok(datos.declaraciones.length > 0 && datos.declaraciones.length <= 8);
        assert.ok(datos.entrenadores >= 2, 'Sin voz de entrenadores');
        assert.equal(new Set(datos.declaraciones.map((d) => d.frase)).size, datos.declaraciones.length);
        assert.ok(datos.ancho <= datos.viewport, 'Desbordamiento lateral');
        const caja = page.locator('#s-hoy .caja').filter({ has: page.locator('.rotulo', { hasText: /^Declaraciones$/ }) });
        await caja.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(salida, `declaraciones-${inicio}-${i}.jpg`), type: 'jpeg', quality: 85 });
        const dt = caja.locator('[data-e]').first();
        await dt.click(); await page.locator('#hoja .arriba').waitFor();
        assert.match(await page.locator('#hoja').innerText(), /Entrenador/);
        await page.keyboard.press('Escape');
        log.epocas.push(datos); console.log(datos.anio, datos.declaraciones.length, 'voces,', datos.entrenadores, 'entrenadores');
        if (i === 0) { await page.locator('[data-tiempo="siguiente"]').click(); await page.locator('[data-tiempo="fin"]').waitFor({ timeout: 120000 }); }
      }
      await context.close();
    }
    assert.deepEqual(log.erroresJS, []);
    console.log('Navegador: cuatro temporadas, fichas de técnicos y declaraciones sin errores');
  } finally { fs.writeFileSync(path.join(salida, 'comprobacion.json'), JSON.stringify(log, null, 2)); await browser?.close(); servidor.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
