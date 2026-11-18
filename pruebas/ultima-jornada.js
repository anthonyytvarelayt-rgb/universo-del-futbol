const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const inicio = app.indexOf('function opcionesUltimaJornada(');
const fin = app.indexOf('function ligasDeCierre(', inicio);
const escenarios = vm.runInNewContext(app.slice(inicio, fin) + '\nopcionesUltimaJornada');
const equipos = (pts) => pts.map((p, i) => ({ nombre: String.fromCharCode(65 + i), pts: p }));
const partidos = [{ local: 'A', visita: 'B', ga: 10, gb: 0 }, { local: 'C', visita: 'D', ga: 0, gb: 10 }];

// Contrasta todos los escenarios con una enumeración exhaustiva de resultados.
// Un empate a puntos conserva opciones y se advierte que interviene el desempate.
for (const victoria of [2, 3]) {
  const marcadores = [[victoria, 0], [1, 1], [0, victoria]];
  for (let b = 0; b <= 5; b++) for (let c = 0; c <= 5; c++) for (let d = 0; d <= 5; d++) {
    for (const descanso of [false, true]) {
      const tabla = equipos(descanso ? [5, b, c, d, 4] : [5, b, c, d]);
      const combinaciones = marcadores.flatMap((a) => marcadores.map((b) => a.concat(b, 0)));
      const opciones = escenarios(tabla, partidos, victoria);
      for (const [i, t] of tabla.entries()) {
        const posibles = i === 4 ? [0] : [victoria, 1, 0];
        const estados = posibles.map((pv) => {
          const ventajas = combinaciones.filter((r) => r[i] === pv).map((r) =>
            t.pts + r[i] - Math.max(...tabla.filter((x) => x !== t).map((x) => x.pts + r[x.nombre.charCodeAt(0) - 65]))
          );
          return Math.max(...ventajas) < 0 ? 'fuera' : Math.min(...ventajas) > 0 ? 'primero' :
            Math.min(...ventajas) === 0 ? 'desempate' : 'depende';
        });
        const dato = opciones.find((x) => x.club === t);
        assert.deepEqual(dato ? Array.from(dato.escenarios, (e) => e.estado) : posibles.map(() => 'fuera'), estados);
        if (!dato) continue;
        for (const [j, e] of dato.escenarios.entries()) {
          if (e.estado !== 'depende') continue;
          const puntos = t.pts + posibles[j];
          for (const r of combinaciones.filter((r) => r[i] === posibles[j])) {
            const cumplen = e.depende.every(([nombre, regla]) =>
              r[nombre.charCodeAt(0) - 65] <= (regla === 'debe perder' ? 0 : 1));
            const puedeSerPrimero = tabla.every((otro) => otro.pts + r[otro.nombre.charCodeAt(0) - 65] <= puntos);
            assert.equal(cumplen, puedeSerPrimero);
          }
        }
      }
    }
  }
}
console.log('Última jornada: escenarios correctos con dos y tres puntos, rivales directos y descansos');
