// Un lesionado de la partida tampoco puede volver como jugador de la lista histórica.
// Uso: node pruebas/lesionados-mundial.js
const assert = require('node:assert/strict');
const { Motor, Mundo, BASE } = require('./cargar.js');

function comprobarBaja(semanas, nacionalidad) {
  const M = Mundo.nuevoMundo(Mundo.desdeBase(BASE, 2005));
  const raul = M.clubes.flatMap((c) => c.jugadores).find((j) => j.n === 'Raúl');
  assert.ok(raul, 'Raúl debe estar en la partida');
  raul.niv = Motor.escala.interno(1000); // Si está disponible, debe entrar por nivel.
  if (nacionalidad) raul.nacion = nacionalidad;
  const copaOriginal = Motor.copa;
  let inyectada = false;
  try {
    // Se reproduce la baja al terminar la Copa, antes de convocar el Mundial.
    Motor.copa = (equipos, opciones) => {
      const C = copaOriginal(equipos, opciones);
      if (opciones.nombre === global.Epoca.nombre('copa', 'España', 2005) && equipos.every((c) => c.pais === 'España')) {
        opciones.estado.bajas.set(raul, semanas);
        inyectada = true;
      }
      return C;
    };
    const S = Mundo.jugar(M, 7000), T = S.R.MU;
    assert.ok(inyectada, 'La prueba debe haber provocado la baja');
    assert.equal(T.anio, 2006);
    assert.equal(S.R.est.bajas.get(raul), semanas);
    const limpio = (n) => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const convocados = Object.values(T.convocados).flat();
    const elegido = convocados.find((j) => limpio(j[0]) === limpio(raul.n));
    if (semanas > 4) {
      assert.ok(!elegido, 'Raúl no puede volver ni como convocado externo');
      assert.ok(!T.jugadores.some((j) => limpio(j.n) === limpio(raul.n)), 'Raúl no debe disputar el Mundial');
    } else {
      assert.ok(elegido && elegido[3], 'Una baja de cuatro semanas permite convocarlo como jugador de la partida');
    }
    assert.ok(convocados.some((j) => j[3]), 'Los jugadores sanos de la partida siguen siendo convocables');
    console.log(`bien: convocatoria con ${semanas} semanas de baja${nacionalidad ? ' y doble nacionalidad' : ''}`);
  } finally {
    Motor.copa = copaOriginal;
  }
}
comprobarBaja(28);
comprobarBaja(4);
// La lista histórica tampoco lo recupera por la otra nacionalidad.
comprobarBaja(28, 'Portugal / España');
