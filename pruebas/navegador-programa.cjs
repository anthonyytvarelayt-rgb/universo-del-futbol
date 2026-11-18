// Uso: node pruebas/navegador-programa.cjs [carpeta para capturas]
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const raiz = path.resolve(__dirname, '..');
const servidor = http.createServer((req, res) => {
  let archivo;
  try { archivo = path.resolve(raiz, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); } catch { res.writeHead(400); return res.end(); }
  if (archivo !== raiz && !archivo.startsWith(raiz + path.sep)) { res.writeHead(403); return res.end(); }
  if (archivo === raiz) archivo = path.join(raiz, 'index.html');
  fs.readFile(archivo, (error, datos) => {
    if (error) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' })[path.extname(archivo)] || 'application/octet-stream');
    res.end(datos);
  });
});
const salida = process.argv[2];
if (salida) fs.mkdirSync(salida, { recursive: true });

(async () => {
  let browser;
  try {
    await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
    for (const [dispositivo, width, inicio] of [['ordenador', 1440, 1958], ['movil', 390, 2000]]) {
      const p = await browser.newPage({ viewport: { width, height: width < 400 ? 844 : 1000 }, ignoreHTTPSErrors: true });
      const errores = [];
      p.on('pageerror', (e) => errores.push(e.message));
      const foto = async (pagina) => {
        assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), pagina);
        if (salida) {
          await p.evaluate(() => document.fonts.ready);
          await p.screenshot({ path: path.join(salida, dispositivo + '-' + pagina + '.jpg'), type: 'jpeg', quality: 83, animations: 'disabled' });
        }
      };
      await p.goto('http://127.0.0.1:' + servidor.address().port);
      await p.locator('[data-era="' + (inicio === 1958 ? 'Llega Pelé' : 'Messi y Cristiano') + '"]').click();
      assert.equal(await p.locator('#inicioAnio').textContent(), String(inicio));
      assert.ok(await p.locator('.programa-lamina img').evaluate((im) => im.complete && im.naturalWidth > 0));
      await foto('inicio');
      await p.locator('#empezar').click();
      const nav = (id) => p.locator('#navegar [data-s="' + id + '"]').click();
      await p.locator('[data-tiempo="fin"]').waitFor({ timeout: 120000 });
      await nav('comp');
      await p.locator('[data-vista="radio"]').click();
      assert.equal(await p.locator('#dial-minuto').count(), 0);
      await nav('hoy');
      for (let i = 0; i < 10; i++) await p.locator('[data-tiempo="semana"]').click();
      await foto('hoy');
      await p.locator('[data-radio-hoy]').click();
      const dial = p.locator('#dial-minuto');
      const minuto = async (n) => dial.evaluate((el, val) => {
        el.value = val; el.dispatchEvent(new Event('input', { bubbles: true }));
      }, n);
      const j = Number(await p.locator('[data-accion="radio-jornada"]').inputValue());
      assert.equal(await p.locator('[data-accion="radio-jornada"] option').count(), j);
      await p.locator('[data-radio-gol]').click();
      assert.ok(Number(await dial.inputValue()) > 0);
      await minuto(75);
      await foto('radio');
      await minuto(await dial.getAttribute('max'));
      const finales = await p.locator('.radio-partido b').allTextContents();
      const pts = await p.locator('.radio-tabla li').allTextContents();
      const oficiales = await p.evaluate((j) => {
        const T = S.R.T;
        return { resultados: T.resultados[j - 1].map((m) => m.ga + '–' + m.gb),
          tabla: tablaHasta(T, j, reglasDe(S, 'España').puntosVictoria).map((t) => t.nombre + t.pts + ' pts') };
      }, j);
      assert.deepEqual(finales, oficiales.resultados);
      assert.deepEqual(pts, oficiales.tabla);
      await p.selectOption('[data-accion="radio-jornada"]', '1');
      assert.equal(await dial.inputValue(), '0');
      const semana = await p.evaluate(() => iPaso);
      await dial.focus(); await p.keyboard.press('ArrowRight');
      assert.equal(await p.evaluate(() => iPaso), semana);
      await p.locator('[data-vista="datos"]').click();
      await p.locator('.balance-tardio').waitFor();
      await p.locator('[data-vista="tabla"]').click(); await foto('competiciones');
      await nav('mundo'); await foto('mundo');
      await p.locator('#resBusq [data-j]').first().click(); await foto('jugador'); await p.keyboard.press('Escape');
      await p.locator('[data-btipo="c"]').click();
      await p.locator('#resBusq [data-c]').first().click(); await foto('club'); await p.keyboard.press('Escape');
      for (let n = 0; n < 2; n++) {
        await nav('hoy');
        await p.locator('[data-tiempo="fin"]').click();
        const siguiente = p.locator('[data-tiempo="siguiente"]');
        await siguiente.waitFor({ timeout: 120000 });
        assert.equal(await p.evaluate(() => S.anio), inicio + n);
        const archivo = await p.evaluate(() => {
          const t = S.R.T.tabla[0], once = t.onceHabitual;
          const goleador = S.R.T.resultados.flat().flatMap(golesRadio)[0].quien;
          return {
            nombres: new Set(once.nombres).size, partidos: once.partidos,
            club: archivoOnce(t.nombre, 'España').includes('primera alineación'),
            gol: actasDelJugador(goleador).includes('Primer gol de liga registrado'),
            citas: hemeroteca(S), resueltas: S.promesas?.resueltas?.length || 0
          };
        });
        assert.equal(archivo.nombres, 11);
        assert.ok(archivo.partidos >= 1 && archivo.club && archivo.gol);
        if (n && archivo.resueltas) assert.match(archivo.citas, /Al cierre,/);
        if (n === 0) {
          await foto('fin');
          await nav('historia'); await foto('historia');
          await p.locator('.remontadas [data-partido]').first().click();
          await p.locator('#hoja').waitFor(); await p.keyboard.press('Escape');
          await nav('comp'); await p.locator('[data-vista="radio"]').click();
          await p.locator('#tema').click();
          await foto('radio-oscuro');
          await p.locator('#tema').click();
          await nav('hoy'); await siguiente.click();
          await p.waitForFunction((a) => S.anio === a, inicio + 1, { timeout: 120000 });
        }
      }
      assert.deepEqual(errores, []);
      console.log(dispositivo, inicio, 'dos temporadas, actas, tabla, navegación y remontadas correctas');
      await p.close();
    }
  } finally { await browser?.close(); servidor.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
