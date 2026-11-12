/**
 * UNIVERSO DEL FÚTBOL - MÓDULO COMPLETO DE ETAPAS 1, 3 Y 6
 * Listo para integrar en el repositorio de GitHub (motor de limpieza, atributos, insignias y pruebas automáticas).
 */

// 1. ETAPA 1: CORRECCIÓN DE POSICIONES Y BLOQUEO DE FICHAJES ABSURDOS
export const POSICIONES_CORREGIDAS_FIGURAS = {
  "Lionel Messi": "ED",
  "Cristiano Ronaldo": "EI",
  "Pelé": "DC",
  "Diego Maradona": "MCO",
  "Johan Cruyff": "DC",
  "Alfredo Di Stéfano": "DC",
  "Franz Beckenbauer": "DFC",
  "Ronaldo Nazário": "DC",
  "Zinedine Zidane": "MCO",
  "Ronaldinho": "EI",
  "Garrincha": "ED",
  "Paolo Maldini": "LI",
  "Franco Baresi": "DFC",
  "Xavi Hernández": "MC",
  "Andrés Iniesta": "MC",
  "Sergio Busquets": "MCD",
  "Sergio Ramos": "DFC",
  "Kylian Mbappé": "DC"
};

/**
 * Valida que ninguna figura de nivel alto acabe en un club de prestigio muy inferior (ej. Sergio Ramos al Numancia)
 */
export function esFichajeValido(jugador, clubDestino, prestigioClubDestino) {
  const nivel = jugador.nivel || 700;
  // Si el jugador es una figura de élite (nivel >= 900) y tiene menos de 36 años, exige un club de prestigio alto (>= 75)
  if (nivel >= 920 && (jugador.edad || 25) <= 35 && prestigioClubDestino < 80) {
    return false;
  }
  if (nivel >= 880 && (jugador.edad || 25) <= 34 && prestigioClubDestino < 70) {
    return false;
  }
  return true;
}

// 2. ETAPA 3: FÓRMULA DE LOS 6 ATRIBUTOS PARA LOS 40.392 JUGADORES Y SIMULACIÓN POR INSIGNIAS
export function calcularAtributosPorFormula(jugador) {
  if (jugador.atributosManuales) return jugador.atributosManuales;
  const pos = POSICIONES_CORREGIDAS_FIGURAS[jugador.nombre] || jugador.posicion || "MC";
  const nivel = jugador.nivel || 750;
  const factor = Math.max(0.1, Math.min(1.0, (nivel - 500) / 500));
  const base = Math.round(55 + factor * 42);

  const perfiles = {
    POR: { ritmo: base, tiro: base + 1, pase: base, regate: Math.round(base * 0.82), defensa: base, fisico: Math.round(base * 0.92) },
    DFC: { ritmo: Math.round(base * 0.84), tiro: Math.round(base * 0.65), pase: Math.round(base * 0.82), regate: Math.round(base * 0.78), defensa: base + 2, fisico: Math.round(base * 0.95) },
    LD:  { ritmo: Math.round(base * 0.95), tiro: Math.round(base * 0.72), pase: Math.round(base * 0.86), regate: Math.round(base * 0.86), defensa: Math.round(base * 0.92), fisico: Math.round(base * 0.90) },
    LI:  { ritmo: Math.round(base * 0.95), tiro: Math.round(base * 0.72), pase: Math.round(base * 0.86), regate: Math.round(base * 0.86), defensa: Math.round(base * 0.92), fisico: Math.round(base * 0.90) },
    MCD: { ritmo: Math.round(base * 0.82), tiro: Math.round(base * 0.76), pase: Math.round(base * 0.90), regate: Math.round(base * 0.84), defensa: Math.round(base * 0.94), fisico: Math.round(base * 0.92) },
    MC:  { ritmo: Math.round(base * 0.86), tiro: Math.round(base * 0.84), pase: base + 1, regate: Math.round(base * 0.90), defensa: Math.round(base * 0.80), fisico: Math.round(base * 0.88) },
    MCO: { ritmo: Math.round(base * 0.90), tiro: Math.round(base * 0.90), pase: base + 2, regate: base + 2, defensa: Math.round(base * 0.55), fisico: Math.round(base * 0.80) },
    MP:  { ritmo: Math.round(base * 0.92), tiro: Math.round(base * 0.93), pase: Math.round(base * 0.95), regate: base + 2, defensa: Math.round(base * 0.50), fisico: Math.round(base * 0.80) },
    ED:  { ritmo: base + 2, tiro: Math.round(base * 0.90), pase: Math.round(base * 0.88), regate: base + 2, defensa: Math.round(base * 0.48), fisico: Math.round(base * 0.82) },
    EI:  { ritmo: base + 2, tiro: Math.round(base * 0.90), pase: Math.round(base * 0.88), regate: base + 2, defensa: Math.round(base * 0.48), fisico: Math.round(base * 0.82) },
    DC:  { ritmo: Math.round(base * 0.93), tiro: base + 3, pase: Math.round(base * 0.82), regate: Math.round(base * 0.90), defensa: Math.round(base * 0.45), fisico: Math.round(base * 0.90) }
  };

  return perfiles[pos] || perfiles.MC;
}

/**
 * Calcula el impacto diferenciado de dos jugadores del mismo nivel según sus atributos e insignias
 */
export function calcularImpactoPartido(jugador, contexto = { esEliminatoriaChampions: false, esFinal: false, minuto: 45 }) {
  const attr = calcularAtributosPorFormula(jugador);
  const insignias = jugador.insignias || [];

  let indiceGoles = (attr.tiro * 0.55 + attr.ritmo * 0.25 + attr.regate * 0.20);
  let indiceAsistencias = (attr.pase * 0.55 + attr.regate * 0.30 + attr.ritmo * 0.15);
  let indiceDefensa = (attr.defensa * 0.65 + attr.fisico * 0.35);

  if (insignias.includes("Finalizador") || insignias.includes("Cazagoles")) indiceGoles *= 1.12;
  if (insignias.includes("Genio") || insignias.includes("Creador")) indiceAsistencias *= 1.14;
  if (insignias.includes("Muro") || insignias.includes("Libero")) indiceDefensa *= 1.14;
  if (contexto.esEliminatoriaChampions && insignias.includes("MrChampions")) indiceGoles *= 1.10;
  if (contexto.esFinal && (insignias.includes("PartidosGrandes") || insignias.includes("Rey"))) {
    indiceGoles *= 1.08;
    indiceAsistencias *= 1.08;
  }
  if (contexto.minuto >= 85 && insignias.includes("GolMinuto93")) indiceGoles *= 1.25;

  return { indiceGoles, indiceAsistencias, indiceDefensa };
}

// 3. PRUEBA AUTOMÁTICA DE INTEGRIDAD (ETAPA 1)
export function ejecutarPruebasAutomaticas(jugadores, transferenciasPrueba) {
  const errores = [];

  for (const j of jugadores) {
    const posEsperada = POSICIONES_CORREGIDAS_FIGURAS[j.nombre];
    if (posEsperada && j.posicion !== posEsperada) {
      errores.push(`Posición incorrecta para ${j.nombre}: tiene ${j.posicion}, debería ser ${posEsperada}`);
    }
    if (!j.nacionalidad || j.nacionalidad.trim() === "") {
      errores.push(`Jugador sin nacionalidad detectado: ${j.nombre}`);
    }
  }

  for (const t of transferenciasPrueba) {
    if (!esFichajeValido(t.jugador, t.clubDestino, t.prestigioClubDestino)) {
      errores.push(`Fichaje absurdo bloqueado: ${t.jugador.nombre} (nivel ${t.jugador.nivel}) a ${t.clubDestino}`);
    }
  }

  return { exito: errores.length === 0, totalErrores: errores.length, errores };
}
