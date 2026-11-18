// Comprueba ambas copias, el diálogo de respaldo y el informe de una temporada anterior.
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
      const page = await browser.newPage({ viewport: { width: inicio === 1958 ? 1440 : 390, height: 844 } });
      const errores = [];
      page.on('pageerror', (e) => errores.push(e.message));
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { value: {
          writeText(texto) {
            if (window.fallarCopia) return Promise.reject(new Error('Copia rechazada'));
            window.textoCopiado = texto;
            return Promise.resolve();
          }
        } });
      });
      await page.goto(`http://127.0.0.1:${servidor.address().port}`);
      await page.evaluate((anio) => { anioSel = anio; pintarInicio(); }, inicio);
      await page.locator('#empezar').click();
      const fin = page.locator('[data-tiempo="fin"]');
      const siguiente = page.locator('[data-tiempo="siguiente"]');
      const cerrarTemporada = async () => {
        await fin.waitFor({ timeout: 120000 });
        await fin.click();
        await siguiente.waitFor({ timeout: 120000 });
      };
      await cerrarTemporada();
      const copiar = async (grupo, detallado) => {
        await grupo.getByRole('button', { name: detallado ? 'Copiar informe detallado' : 'Copiar resumen', exact: true }).click();
        await grupo.getByRole('status').getByText(detallado ? 'Informe detallado copiado' : 'Resumen copiado').waitFor();
        return page.evaluate(() => window.textoCopiado);
      };
      const hoy = page.locator('#s-hoy .exportar-resumen');
      const resumen = await copiar(hoy, false);
      const informe = await copiar(hoy, true);
      assert.ok(informe.startsWith(`⚽ UNIVERSO DEL FÚTBOL · TEMPORADA ${inicio}-`));
      assert.doesNotMatch(resumen, /INFORME DETALLADO/);
      assert.match(informe, /CLASIFICACIONES · ESPAÑA/);
      assert.match(informe, /RESULTADOS DE COPA Y PROMOCIÓN/);
      assert.match(informe, /CUENTAS DE TODOS LOS CLUBES REGISTRADOS/);
      assert.doesNotMatch(informe, /\b(?:undefined|NaN)\b/);
      if (inicio === 1958) {
        assert.match(informe, /TORNEOS DE SELECCIONES/);
        assert.match(informe, /Convocatorias/);
      }
      const mercado = informe.split('REGISTRO COMPLETO DEL MERCADO\n')[1].split('\n\n')[0].split('\n');
      assert.equal(mercado.length, await page.evaluate(() => S.mercado.length));
      assert.ok(informe.length > resumen.length);

      await page.evaluate(() => { window.fallarCopia = true; });
      await hoy.getByRole('button', { name: 'Copiar informe detallado', exact: true }).click();
      const dialogo = page.getByRole('dialog');
      await dialogo.waitFor();
      const campo = dialogo.locator('textarea');
      assert.equal(await campo.inputValue(), informe);
      assert.ok(await campo.evaluate((el) => el.selectionStart === 0 && el.selectionEnd === el.value.length));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await dialogo.getByRole('button', { name: 'Cerrar' }).click();
      await dialogo.waitFor({ state: 'hidden' });
      await page.evaluate(() => { window.fallarCopia = false; });

      await siguiente.click();
      await fin.waitFor({ timeout: 120000 });
      if (inicio === 1958) await cerrarTemporada();
      await page.locator('[data-s="historia"]').click();
      const archivo = page.locator('#s-historia .exportar-resumen');
      await archivo.getByRole('combobox', { name: 'Temporada' }).selectOption(String(inicio));
      const anterior = await copiar(archivo, true);
      assert.equal(anterior.split('\n')[0], informe.split('\n')[0]);
      const cuentas = (texto) => texto.split('CUENTAS DE TODOS LOS CLUBES REGISTRADOS')[1].split('\n\n')[0];
      assert.equal(cuentas(anterior), cuentas(informe));
      assert.deepEqual(errores, []);
      console.log(`${inicio}: resumen de ${resumen.length} caracteres, informe de ${informe.length}, respaldo y archivo correctos`);
      await page.close();
    }
  } finally {
    await browser?.close();
    servidor.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
