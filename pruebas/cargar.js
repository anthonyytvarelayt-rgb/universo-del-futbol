// Carga el motor y los datos del sitio para probarlos con node, sin navegador.
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const dato = (archivo, prefijo) => JSON.parse(fs.readFileSync(path.join(raiz, 'datos', archivo), 'utf8').replace(prefijo, '').replace(/;\s*$/, ''));
global.ATRIBUTOS_A_MANO = dato('atributos.js', 'self.ATRIBUTOS_A_MANO = ');
global.Motor = require(path.join(raiz, 'js/motor.js'));
global.Epoca = require(path.join(raiz, 'js/epoca.js'));
global.Mundial = require(path.join(raiz, 'js/mundial.js'));
global.MUNDIALES = dato('mundiales.js', 'self.MUNDIALES = ');
module.exports = { Motor: global.Motor, Mundo: require(path.join(raiz, 'js/mundo.js')), BASE: dato('base.js', 'window.BASE_DATOS = ') };
