// Comprueba que los jugadores famosos salen con su posición y país correctos.
// Uso: node pruebas/famosos.js   (sale con error si falla alguno)
const fs = require('fs'), path = require('path');
const txt = fs.readFileSync(path.join(__dirname, '..', 'datos', 'base.js'), 'utf8');
const base = JSON.parse(txt.slice(txt.indexOf('{')).replace(/;\s*$/, ''));
const por = new Map(); base.jugadores.forEach(j => { const k = j.n.replace(/\s*\(.*\)$/, ''); if (!por.has(k) || por.get(k).max < j.max) por.set(k, j); });
let mal = 0, falta = 0, n = 0;
fs.readFileSync(path.join(__dirname, 'famosos.csv'), 'utf8').trim().split('\n').slice(1).forEach(l => {
  const [nombre, pos, nacion] = l.split(','); n++;
  const j = por.get(nombre);
  if (!j) { falta++; console.log('NO ESTÁ   ', nombre); return; }
  const e = [];
  if (j.pos !== pos) e.push('posición ' + j.pos + ' (debe ser ' + pos + ')');
  if (nacion && j.nacion !== nacion) e.push('país "' + (j.nacion || '') + '" (debe ser ' + nacion + ')');
  if (e.length) { mal++; console.log('MAL       ', nombre + ': ' + e.join('; ')); }
});
console.log(`${n} famosos: ${n - mal - falta} bien, ${mal} mal, ${falta} no están`);
process.exit(mal ? 1 : 0);
