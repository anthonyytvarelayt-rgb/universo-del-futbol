"""Valida las propuestas y mide su efecto en una copia en memoria de la base; no escribe datos/base.js."""
import csv
import json
import pathlib
import subprocess

raiz = pathlib.Path(__file__).resolve().parent.parent
carpeta = raiz / 'datos_fuente/base/revision_porteros_2025'
def leer(nombre):
    with (carpeta / nombre).open(encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))

programa = r'''
const fs = require('fs'), assert = require('node:assert/strict');
const {BASE, Mundo} = require('./pruebas/cargar.js');
const entrada = JSON.parse(fs.readFileSync(0, 'utf8')), B = structuredClone(BASE);
const clave = (n, nac) => n + '|' + nac;
const clubes = [...new Set(entrada.carreras.map(r => r.club))];
const medir = (base) => {
  const M = Mundo.nuevoMundo(Mundo.desdeBase(base, 2025));
  return clubes.map(n => {
    const c = M.clubes.find(c => c.nombre === n);
    assert.ok(c, 'Club no jugado al iniciar 2025: ' + n);
    return {club:n,porterosReales:c.jugadores.filter(j=>j.pos==='POR'&&!j.relleno).map(j=>j.n),porterosDeRelleno:c.jugadores.filter(j=>j.pos==='POR'&&j.relleno).length};
  });
};
const antes = medir(BASE);
for (const r of entrada.carreras) {
  const xs = B.jugadores.filter(j => clave(j.n,j.nac) === clave(r.nombre,r.nacimiento));
  assert.equal(xs.length, 1, 'Identidad no única en base: ' + r.nombre);
  assert.ok(B.clubes[r.club], 'Club no exacto: ' + r.club);
  const j = xs[0], paso = j.carrera.find(p => p[0] === r.club && p[2] === Number(r.desde));
  if (paso) paso[3] = Number(r.hasta);
  else j.carrera.push([r.club,r.pais,Number(r.desde),Number(r.hasta),null,null]);
  j.carrera.sort((a,b)=>a[2]-b[2]);
}
for (const r of entrada.faltantes) {
  assert.ok(!BASE.jugadores.some(j => clave(j.n,j.nac) === clave(r.nombre,r.nacimiento)), 'El supuesto ausente ya está: ' + r.nombre);
  assert.ok(BASE.clubes[r.club_2025], 'Club no exacto: ' + r.club_2025);
}
const despues = medir(B);
for (const r of entrada.carreras) assert.ok(despues.find(c=>c.club===r.club).porterosReales.includes(r.nombre), 'No aparece donde se esperaba: ' + r.nombre);
console.log(JSON.stringify({base:'bf22a8f',filasValidadas:entrada.carreras.length,ausenciasComprobadas:entrada.faltantes.length,integracion:'solo en memoria',antes,despues},null,2));
'''
resultado = subprocess.run(['node', '-e', programa], cwd=raiz, input=json.dumps({'carreras': leer('carreras_confirmadas.csv'), 'faltantes': leer('faltan_en_la_base.csv')}), text=True, capture_output=True, check=True)
print(resultado.stdout, end='')
