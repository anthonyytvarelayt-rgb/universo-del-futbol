// Reglas por época — Universo del Fútbol
// Lo que cambia del fútbol con los años, por país. El motor y el mundo preguntan aquí en vez de llevar fechas fijas.
// La tabla de ligas sale de la investigación (datos/reglas-epoca-1930-2026.csv); vale el último tramo que haya empezado.
(function (root) {
  'use strict';

  // <tabla> (generado por datos/reglas_a_epoca.py desde datos/reglas-epoca-1930-2026.csv; no editar a mano)
  // Cada tramo: [desde, se juega, puntos por victoria, cambios, entran extranjeros nuevos, clubes, liga, cupo de extranjeros]
  const TABLA = {"España":[
    [1930,1,2,0,1,10,"Primera División","Solo extranjeros con 2 años de residencia; muy pocos"],
    [1934,1,2,0,1,12,"Primera División","Solo extranjeros con 2 años de residencia; muy pocos"],
    [1936,0,2,0,1,12,"Primera División","Solo extranjeros con 2 años de residencia; muy pocos"],
    [1939,1,2,0,0,12,"Primera División","Prohibido fichar extranjeros (españolización 1940)"],
    [1941,1,2,0,0,14,"Primera División","Prohibido fichar extranjeros (españolización 1940)"],
    [1947,1,2,0,1,14,"Primera División","Permitidos de nuevo (cupo pequeño, ~2-3)"],
    [1950,1,2,0,1,16,"Primera División","Permitidos de nuevo (cupo pequeño, ~2-3)"],
    [1953,1,2,0,1,16,"Primera División","2 por club (al menos 1 hispanoamericano o filipino); oriundos aparte"],
    [1962,1,2,0,1,16,"Primera División","Cerrado a extranjeros nuevos; solo oriundos/nacionalizados"],
    [1963,1,2,0,0,16,"Primera División","Cerrado a extranjeros nuevos; solo oriundos/nacionalizados"],
    [1969,1,2,2,0,16,"Primera División","Cerrado a extranjeros nuevos; solo oriundos/nacionalizados"],
    [1971,1,2,2,0,18,"Primera División","Cerrado a extranjeros nuevos; solo oriundos/nacionalizados"],
    [1973,1,2,2,1,18,"Primera División","2 por club"],
    [1987,1,2,2,1,20,"Primera División","2 por club"],
    [1988,1,2,2,1,20,"Primera División","3 en plantilla / 3 en campo (aprox.)"],
    [1995,1,3,3,1,22,"Primera División","Comunitarios sin límite (Bosman, dic. 1995); 3 extracomunitarios"],
    [1997,1,3,3,1,20,"Primera División","Comunitarios sin límite (Bosman, dic. 1995); 3 extracomunitarios"],
    [2020,1,3,5,1,20,"Primera División","Comunitarios sin límite (Bosman, dic. 1995); 3 extracomunitarios"]],"Italia":[
    [1930,1,2,0,0,18,"Serie A","Prohibidos extranjeros (Carta de Viareggio 1926); oriundos permitidos"],
    [1934,1,2,0,0,16,"Serie A","Prohibidos extranjeros (Carta de Viareggio 1926); oriundos permitidos"],
    [1943,0,2,0,0,16,"Serie A","Prohibidos extranjeros (Carta de Viareggio 1926); oriundos permitidos"],
    [1945,1,2,0,0,25,"Serie A","Prohibidos extranjeros (Carta de Viareggio 1926); oriundos permitidos"],
    [1946,1,2,0,1,20,"Serie A","Permitidos (cupo variable, de 5 a 3-2 por club)"],
    [1947,1,2,0,1,21,"Serie A","Permitidos (cupo variable, de 5 a 3-2 por club)"],
    [1948,1,2,0,1,20,"Serie A","Permitidos (cupo variable, de 5 a 3-2 por club)"],
    [1952,1,2,0,1,18,"Serie A","Permitidos (cupo variable, de 5 a 3-2 por club)"],
    [1953,1,2,0,1,18,"Serie A","Cupo reducido (1-2 nuevos) + oriundos"],
    [1966,1,2,0,0,18,"Serie A","Cerrado a extranjeros (tras el Mundial 1966)"],
    [1967,1,2,0,0,16,"Serie A","Cerrado a extranjeros (tras el Mundial 1966)"],
    [1968,1,2,1,0,16,"Serie A","Cerrado a extranjeros (tras el Mundial 1966)"],
    [1980,1,2,1,1,16,"Serie A","1 por club"],
    [1982,1,2,1,1,16,"Serie A","2 por club"],
    [1988,1,2,2,1,18,"Serie A","3 por club"],
    [1994,1,3,2,1,18,"Serie A","3 por club"],
    [1995,1,3,3,1,18,"Serie A","Comunitarios sin límite (Bosman); extracomunitarios limitados (~2-3 fichajes/año)"],
    [2004,1,3,3,1,20,"Serie A","Comunitarios sin límite (Bosman); extracomunitarios limitados (~2-3 fichajes/año)"],
    [2020,1,3,5,1,20,"Serie A","Comunitarios sin límite (Bosman); extracomunitarios limitados (~2-3 fichajes/año)"]],"Inglaterra":[
    [1930,1,2,0,0,22,"First Division","Prohibidos profesionales no británicos sin 2 años de residencia (FA, 1931)"],
    [1939,0,2,0,0,22,"First Division","Prohibidos profesionales no británicos sin 2 años de residencia (FA, 1931)"],
    [1946,1,2,0,0,22,"First Division","Prohibidos profesionales no británicos sin 2 años de residencia (FA, 1931)"],
    [1965,1,2,1,0,22,"First Division","Prohibidos profesionales no británicos sin 2 años de residencia (FA, 1931)"],
    [1978,1,2,1,1,22,"First Division","Sin cupo fijo; permiso de trabajo para no comunitarios"],
    [1981,1,3,1,1,22,"First Division","Sin cupo fijo; permiso de trabajo para no comunitarios"],
    [1987,1,3,2,1,21,"First Division","Sin cupo fijo; permiso de trabajo para no comunitarios"],
    [1988,1,3,2,1,20,"First Division","Sin cupo fijo; permiso de trabajo para no comunitarios"],
    [1991,1,3,2,1,22,"First Division","Sin cupo fijo; permiso de trabajo para no comunitarios"],
    [1992,1,3,2,1,22,"Premier League","Sin cupo fijo; permiso de trabajo para no comunitarios"],
    [1995,1,3,3,1,20,"Premier League","Comunitarios libres (Bosman); no comunitarios con permiso de trabajo"],
    [2010,1,3,3,1,20,"Premier League","8 formados en casa en lista de 25; permiso de trabajo"],
    [2021,1,3,3,1,20,"Premier League","Post-Brexit: todos los extranjeros necesitan puntos GBE; 8 formados en casa"],
    [2022,1,3,5,1,20,"Premier League","Post-Brexit: todos los extranjeros necesitan puntos GBE; 8 formados en casa"]],"Alemania":[
    [1930,1,2,0,1,null,"Campeonato alemán","Amateurismo/semiprofesionalismo; casi sin extranjeros"],
    [1944,0,2,0,1,null,"Campeonato alemán","Amateurismo/semiprofesionalismo; casi sin extranjeros"],
    [1947,1,2,0,1,null,"Campeonato alemán","Amateurismo/semiprofesionalismo; casi sin extranjeros"],
    [1963,1,2,0,1,16,"Bundesliga","Máximo 2-3 extranjeros por club (aprox.)"],
    [1965,1,2,0,1,18,"Bundesliga","Máximo 2-3 extranjeros por club (aprox.)"],
    [1967,1,2,2,1,18,"Bundesliga","Máximo 2-3 extranjeros por club (aprox.)"],
    [1991,1,2,2,1,20,"Bundesliga","Máximo 2-3 extranjeros por club (aprox.)"],
    [1992,1,2,2,1,18,"Bundesliga","3 extranjeros en campo + 2 'asimilados'"],
    [1995,1,3,3,1,18,"Bundesliga","Comunitarios libres (Bosman); 3 no comunitarios en campo"],
    [2001,1,3,3,1,18,"Bundesliga","Sin cupo de extranjeros; mínimo de alemanes en plantilla"],
    [2006,1,3,3,1,18,"Bundesliga","Regla de jugadores locales (12 alemanes, 8 formados en casa)"],
    [2020,1,3,5,1,18,"Bundesliga","Regla de jugadores locales (12 alemanes, 8 formados en casa)"]],"Francia":[
    [1930,0,null,null,1,null,"Division 1","Cupo de extranjeros por club (≈5, luego 3)"],
    [1932,1,2,0,1,20,"Division 1","Cupo de extranjeros por club (≈5, luego 3)"],
    [1933,1,2,0,1,14,"Division 1","Cupo de extranjeros por club (≈5, luego 3)"],
    [1934,1,2,0,1,16,"Division 1","Cupo de extranjeros por club (≈5, luego 3)"],
    [1939,0,2,0,1,16,"Division 1",""],
    [1945,1,2,0,1,18,"Division 1","2-3 extranjeros por club (aprox.)"],
    [1946,1,2,0,1,20,"Division 1","2-3 extranjeros por club (aprox.)"],
    [1947,1,2,0,1,18,"Division 1","2-3 extranjeros por club (aprox.)"],
    [1958,1,2,0,1,20,"Division 1","2-3 extranjeros por club (aprox.)"],
    [1963,1,2,0,1,18,"Division 1","2-3 extranjeros por club (aprox.)"],
    [1965,1,2,0,1,20,"Division 1","2-3 extranjeros por club (aprox.)"],
    [1967,1,2,2,1,20,"Division 1","2-3 extranjeros por club (aprox.)"],
    [1968,1,2,2,1,18,"Division 1","2-3 extranjeros por club (aprox.)"],
    [1970,1,2,2,1,20,"Division 1","2-3 extranjeros por club (aprox.)"],
    [1988,1,3,2,1,20,"Division 1","3 extranjeros por club"],
    [1989,1,2,2,1,20,"Division 1","3 extranjeros por club"],
    [1994,1,3,2,1,20,"Division 1","3 extranjeros por club"],
    [1995,1,3,3,1,20,"Division 1","Comunitarios libres (Bosman); 4 extracomunitarios"],
    [1997,1,3,3,1,18,"Division 1","Comunitarios libres (Bosman); 4 extracomunitarios"],
    [2002,1,3,3,1,20,"Ligue 1","Comunitarios libres (Bosman); 4 extracomunitarios"],
    [2020,1,3,5,1,20,"Ligue 1","Comunitarios libres (Bosman); 4 extracomunitarios"],
    [2023,1,3,5,1,18,"Ligue 1","Comunitarios libres (Bosman); 4 extracomunitarios"]],"Portugal":[
    [1930,0,null,null,1,null,"Primeira Divisão","Permitidos con cupo pequeño (aprox.)"],
    [1934,1,2,0,1,8,"Primeira Divisão","Permitidos con cupo pequeño (aprox.)"],
    [1939,1,2,0,1,10,"Primeira Divisão","Permitidos con cupo pequeño (aprox.)"],
    [1940,1,2,0,1,8,"Primeira Divisão","Permitidos con cupo pequeño (aprox.)"],
    [1941,1,2,0,1,12,"Primeira Divisão","Permitidos con cupo pequeño (aprox.)"],
    [1942,1,2,0,1,10,"Primeira Divisão","Permitidos con cupo pequeño (aprox.)"],
    [1945,1,2,0,1,12,"Primeira Divisão","Permitidos con cupo pequeño (aprox.)"],
    [1946,1,2,0,1,14,"Primeira Divisão","Permitidos con cupo pequeño (aprox.)"],
    [1960,1,2,0,0,14,"Primeira Divisão","Cerrado a extranjeros; jugadores de las colonias (Angola, Mozambique) cuentan como portugueses"],
    [1967,1,2,2,0,14,"Primeira Divisão","Cerrado a extranjeros; jugadores de las colonias (Angola, Mozambique) cuentan como portugueses"],
    [1971,1,2,2,0,16,"Primeira Divisão","Cerrado a extranjeros; jugadores de las colonias (Angola, Mozambique) cuentan como portugueses"],
    [1978,1,2,2,1,16,"Primeira Divisão","2-3 extranjeros por club"],
    [1987,1,2,2,1,20,"Primeira Divisão","2-3 extranjeros por club"],
    [1989,1,2,2,1,18,"Primeira Divisão","2-3 extranjeros por club"],
    [1990,1,2,2,1,20,"Primeira Divisão","2-3 extranjeros por club"],
    [1991,1,2,2,1,18,"Primeira Divisão","2-3 extranjeros por club"],
    [1995,1,3,3,1,18,"Primeira Divisão","Comunitarios libres (Bosman); sin cupo estricto de extracomunitarios"],
    [1999,1,3,3,1,18,"Primeira Liga","Comunitarios libres (Bosman); sin cupo estricto de extracomunitarios"],
    [2006,1,3,3,1,16,"Primeira Liga","Comunitarios libres (Bosman); sin cupo estricto de extracomunitarios"],
    [2014,1,3,3,1,18,"Primeira Liga","Comunitarios libres (Bosman); sin cupo estricto de extracomunitarios"],
    [2020,1,3,5,1,18,"Primeira Liga","Comunitarios libres (Bosman); sin cupo estricto de extracomunitarios"]],"Argentina":[
    [1930,1,2,0,1,36,"Primera División","Cupo bajo (≈2-3 extranjeros por club, aprox.)"],
    [1931,1,2,0,1,18,"Primera División","Cupo bajo (≈2-3 extranjeros por club, aprox.)"],
    [1967,1,2,2,1,22,"Primera División","Cupo bajo (≈2-3 extranjeros por club, aprox.)"],
    [1985,1,2,2,1,20,"Primera División","Cupo bajo (≈2-3 extranjeros por club, aprox.)"],
    [1991,1,2,2,1,20,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"],
    [1995,1,3,3,1,20,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"],
    [2015,1,3,3,1,30,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"],
    [2017,1,3,3,1,28,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"],
    [2018,1,3,3,1,26,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"],
    [2019,1,3,3,1,24,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"],
    [2020,1,3,5,1,24,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"],
    [2021,1,3,5,1,26,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"],
    [2022,1,3,5,1,28,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"],
    [2025,1,3,5,1,30,"Primera División","Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)"]],"Brasil":[
    [1930,0,null,null,1,null,"Campeonatos estatales","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1959,1,2,2,1,16,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1960,1,2,2,1,17,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1961,1,2,2,1,20,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1962,1,2,2,1,21,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1963,1,2,2,1,20,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1964,1,2,2,1,23,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1965,1,2,2,1,22,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1967,1,2,2,1,21,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1968,1,2,2,1,23,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1969,1,2,2,1,17,"Taça Brasil / Robertão","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1971,1,2,2,1,20,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1972,1,2,2,1,26,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1973,1,2,2,1,40,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1975,1,2,2,1,42,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1976,1,2,2,1,54,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1977,1,2,2,1,62,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1978,1,2,2,1,74,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1979,1,2,2,1,94,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1980,1,2,2,1,44,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1984,1,2,2,1,41,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1985,1,2,2,1,44,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1986,1,2,2,1,48,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1987,1,2,2,1,16,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1988,1,3,2,1,24,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1989,1,2,2,1,22,"Campeonato Brasileiro (Série A)","Pocos extranjeros; sin cupo relevante en la práctica"],
    [1990,1,2,2,1,20,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [1993,1,2,2,1,32,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [1994,1,2,2,1,24,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [1995,1,3,3,1,24,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [1997,1,3,3,1,26,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [1998,1,3,3,1,24,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [1999,1,3,3,1,22,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [2000,1,3,3,1,116,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [2001,1,3,3,1,28,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [2002,1,3,3,1,26,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [2003,1,3,3,1,24,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [2005,1,3,3,1,22,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [2006,1,3,3,1,20,"Campeonato Brasileiro (Série A)","3 extranjeros por partido"],
    [2014,1,3,3,1,20,"Campeonato Brasileiro (Série A)","5 extranjeros por partido"],
    [2020,1,3,5,1,20,"Campeonato Brasileiro (Série A)","5 extranjeros por partido"],
    [2023,1,3,5,1,20,"Campeonato Brasileiro (Série A)","7-9 extranjeros por partido (ampliado)"]]};
  // </tabla>

  // Fuera de la tabla (países sin investigar o antes de 1930): lo general de cada época.
  const GENERAL = [[1900, 1, 2, 0, 1, null, 'Liga', ''], [1969, 1, 2, 2, 1, null, 'Liga', ''], [1995, 1, 3, 3, 1, null, 'Liga', ''], [2020, 1, 3, 5, 1, null, 'Liga', '']];

  // Competiciones: primera y última temporada (por año de inicio) y años en que no se jugó.
  const COMPETICIONES = {
    'Copa del Mundo': { desde: 1930, cada: 4, sin: [1942, 1946] },
    'Copa América': { desde: 1916 },
    'Copa Mitropa': { desde: 1927, hasta: 1992, sin: [1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949, 1950, 1951, 1952, 1953, 1954] },
    'Copa Latina': { desde: 1949, hasta: 1957 },
    'Copa de Europa': { desde: 1955 },
    'Copa de Ferias': { desde: 1955, hasta: 1970 },
    'Copa de la UEFA': { desde: 1971 },
    'Recopa': { desde: 1960, hasta: 1998 },
    'Supercopa de Europa': { desde: 1972 },
    'Conference League': { desde: 2021 },
    'Eurocopa': { desde: 1960, cada: 4 },
    'Copa Libertadores': { desde: 1960 },
    'Supercopa Libertadores': { desde: 1988, hasta: 1997 },
    'Copa Conmebol': { desde: 1992, hasta: 1999 },
    'Copa Sudamericana': { desde: 2002 },
    'Recopa Sudamericana': { desde: 1989 },
    'Copa Intercontinental': { desde: 1960, hasta: 2004 },
    'Mundial de Clubes': { desde: 2000, sin: [2001, 2002, 2003, 2004, 2024] },
    'Copa Intercontinental FIFA': { desde: 2024 }
  };

  const tramo = (pais, anio) => {
    const xs = TABLA[pais] || GENERAL;
    let t = xs[0];
    xs.forEach((x) => { if (anio >= x[0]) t = x; });
    return t;
  };

  // Todo lo que rige una temporada de un país.
  function reglas(pais, anio) {
    const t = tramo(pais, anio);
    const g = tramo(null, anio);
    return {
      hayLiga: anio >= t[0] && !!t[1],
      puntosVictoria: t[2] != null ? t[2] : g[2],
      cambios: t[3] != null ? t[3] : g[3],
      extranjerosNuevos: !!t[4],
      clubes: t[5],
      liga: t[6],
      cupoExtranjeros: t[7]
    };
  }
  const hayCompeticion = (nombre, anio) => {
    const c = COMPETICIONES[nombre];
    if (!c || anio < c.desde || (c.hasta != null && anio > c.hasta) || (c.sin || []).includes(anio)) return false;
    return !c.cada || (anio - c.desde) % c.cada === 0;
  };
  const hayMundial = (anio) => hayCompeticion('Copa del Mundo', anio);

  // ===== Calendario del fútbol 1930-2026: formatos, nombres, premios y reglas de cada época =====
  // Preparado aunque todavía no haya datos de esos años: cuando lleguen, la partida ya sabe qué se juega y cómo.
  // Cada lista va por tramos [desde, ...]: vale el último que haya empezado (año = año en que empieza la temporada).
  const enTramo = (xs, anio) => { let t = null; xs.forEach((x) => { if (anio >= x[0]) t = x; }); return t; };

  // Cómo se juega cada competición internacional.
  const FORMATOS = {
    'Copa de Europa': [
      [1955, 'Eliminatorias a ida y vuelta, final a partido único. Campeones de liga de cada país.', 16],
      [1956, 'Eliminatorias a ida y vuelta, final única. Campeones de liga y el vigente campeón.', 22],
      [1991, 'Eliminatorias y dos grupos de 4 en lugar de cuartos y semifinales; los primeros, a la final.', 32],
      [1992, 'Liga de Campeones: eliminatorias previas, dos grupos de 4 y final.', 36],
      [1993, 'Liga de Campeones: dos grupos de 4, semifinales a partido único y final.', 42],
      [1994, 'Liga de Campeones: 4 grupos de 4 y eliminatorias desde cuartos. Ya no entran todos los campeones.', 24],
      [1997, 'Liga de Campeones: 6 grupos de 4; entran también subcampeones de las mejores ligas.', 24],
      [1999, 'Liga de Campeones: 32 equipos, dos fases de grupos; hasta 4 por país.', 32],
      [2003, 'Liga de Campeones: 8 grupos de 4 y eliminatorias desde octavos.', 32],
      [2024, 'Liga de Campeones: liguilla única de 36 equipos (8 partidos cada uno), eliminatoria previa y octavos.', 36]],
    'Recopa': [[1960, 'Campeones de copa de cada país; eliminatorias a ida y vuelta, final única (a doble partido en 1961).', 32]],
    'Copa de Ferias': [[1955, 'Ciudades con feria comercial; la primera edición duró de 1955 a 1958. Eliminatorias a ida y vuelta.', 12], [1960, 'Clubes invitados por liga; eliminatorias y final a doble partido.', 64]],
    'Copa de la UEFA': [
      [1971, 'Copa de la UEFA: los mejores clasificados que no van a otra copa; eliminatorias y final a doble partido.', 64],
      [1997, 'Copa de la UEFA con final a partido único.', 64],
      [1999, 'Entran también los campeones de copa (se acaba la Recopa).', 96],
      [2004, 'Fase de grupos de 5 equipos.', 80],
      [2009, 'Europa League: 12 grupos de 4 y eliminatorias con los terceros de la Liga de Campeones.', 48],
      [2021, 'Europa League: 8 grupos de 4.', 32],
      [2024, 'Europa League: liguilla única de 36 equipos.', 36]],
    'Conference League': [[2021, 'Tercera copa de la UEFA: 8 grupos de 4.', 32], [2024, 'Liguilla única de 36 equipos (6 partidos).', 36]],
    'Supercopa de Europa': [[1972, 'Campeón de Europa contra el de la Recopa, ida y vuelta.', 2], [1998, 'Partido único en Mónaco.', 2], [1999, 'Contra el campeón de la UEFA.', 2], [2013, 'Partido único en sede que cambia.', 2]],
    'Copa Libertadores': [
      [1960, 'Campeones de liga de Sudamérica; eliminatorias y final a doble partido.', 7],
      [1966, 'Entran campeón y subcampeón de cada país; fase de grupos.', 17],
      [1988, 'Grupos y octavos de final.', 21],
      [2000, '32 equipos: 8 grupos de 4 y eliminatorias.', 32],
      [2017, '47 equipos, fases previas; temporada de febrero a noviembre.', 47],
      [2019, 'Final a partido único en sede fija.', 47]],
    'Copa Intercontinental': [[1960, 'Campeón de Europa contra campeón de la Libertadores, ida y vuelta.', 2], [1980, 'Partido único en Tokio.', 2]],
    'Mundial de Clubes': [[2000, 'Primera edición con 8 clubes en Brasil.', 8], [2005, 'Campeones de cada continente, cada año, a eliminatoria.', 7], [2025, '32 clubes en Estados Unidos, grupos y eliminatorias, cada cuatro años.', 32]],
    'Copa del Mundo': [
      [1930, '13 selecciones invitadas, grupos y semifinales.', 13], [1934, '16 selecciones, eliminatorias directas.', 16],
      [1950, 'Grupos y liguilla final (sin final).', 13], [1954, '16 selecciones: grupos y eliminatorias.', 16],
      [1974, '16 selecciones con segunda fase de grupos.', 16], [1982, '24 selecciones, dos fases de grupos.', 24],
      [1986, '24 selecciones, grupos y octavos.', 24], [1998, '32 selecciones, 8 grupos de 4.', 32], [2026, '48 selecciones, 12 grupos de 4 y dieciseisavos.', 48]],
    'Eurocopa': [[1960, 'Eliminatorias y fase final de 4.', 4], [1980, 'Fase final de 8.', 8], [1996, 'Fase final de 16.', 16], [2016, 'Fase final de 24.', 24]]
  };
  const formato = (comp, anio) => { const t = FORMATOS[comp] && enTramo(FORMATOS[comp], anio); return t ? { texto: t[1], equipos: t[2], desde: t[0] } : null; };

  // Nombres que cambian con los años. clave: 'liga' o 'copa' por país, o una competición internacional.
  const NOMBRES = {
    'copa|España': [[1903, 'Copa del Rey'], [1932, 'Copa del Presidente de la República'], [1937, 'Copa del Generalísimo'], [1976, 'Copa del Rey']],
    'copa|Italia': [[1922, 'Coppa Italia']], 'copa|Inglaterra': [[1871, 'FA Cup']], 'copa|Francia': [[1917, 'Coupe de France']],
    'copa|Alemania': [[1935, 'Tschammer-Pokal'], [1952, 'DFB-Pokal']], 'copa|Portugal': [[1938, 'Taça de Portugal']],
    'copa|Argentina': [[1969, 'Copa Argentina']], 'copa|Brasil': [[1959, 'Taça Brasil'], [1971, null], [1989, 'Copa do Brasil']],
    'liga|España': [[1929, 'Primera División']], 'liga|Italia': [[1929, 'Serie A']],
    'liga|Inglaterra': [[1888, 'First Division'], [1992, 'Premier League']], 'liga|Alemania': [[1903, 'Campeonato alemán'], [1963, 'Bundesliga']],
    'liga|Francia': [[1932, 'Division 1'], [2002, 'Ligue 1']], 'liga|Portugal': [[1934, 'Primeira Divisão'], [1999, 'Primeira Liga']],
    'liga|Argentina': [[1931, 'Primera División'], [1967, 'Metropolitano y Nacional'], [1985, 'Primera División'], [1990, 'Apertura y Clausura'], [2015, 'Primera División']],
    'liga|Brasil': [[1930, 'Campeonatos estatales'], [1959, 'Taça Brasil'], [1967, 'Torneo Roberto Gomes Pedrosa'], [1971, 'Campeonato Brasileiro'], [2003, 'Brasileirão (todos contra todos)']],
    'europa': [[1955, 'Copa de Europa'], [1992, 'Liga de Campeones']], 'uefa': [[1955, 'Copa de Ferias'], [1971, 'Copa de la UEFA'], [2009, 'Europa League']]
  };
  const nombre = (clave, pais, anio) => { const t = enTramo(NOMBRES[pais ? clave + '|' + pais : clave] || [], anio); return t ? t[1] : null; };

  // Premios. quien: quién puede ganarlo en ese tramo. Los nacionales van por país.
  const PREMIOS = [
    { id: 'balon', nombre: 'Balón de Oro', tramos: [[1956, 'europeos'], [1995, 'club europeo'], [2007, 'todos'], [2010, 'todos', 'FIFA Balón de Oro'], [2016, 'todos']], sin: [2020], nota: 'France Football. Solo europeos hasta 1994; desde 1995, cualquiera que juegue en Europa; desde 2007, todo el mundo. En 2020 no se dio.' },
    { id: 'bota', nombre: 'Bota de Oro', tramos: [[1967, 'goles'], [1991, null], [1996, 'coeficiente']], nota: 'Máximo goleador de las ligas europeas. 1991-1996 sin premio oficial. Desde 1996, los goles de las grandes ligas valen el doble.' },
    { id: 'fifa', nombre: 'Mejor jugador FIFA', tramos: [[1991, 'todos', 'FIFA World Player'], [2010, null], [2016, 'todos', 'The Best FIFA']], nota: 'De 2010 a 2015 se juntó con el Balón de Oro.' },
    { id: 'onze', nombre: "Onze d'Or", tramos: [[1976, 'club europeo'], [2016, null]], nota: 'Revista Onze Mondial.' },
    { id: 'golden', nombre: 'Golden Boy', tramos: [[2003, 'sub21 europa']], nota: 'Mejor jugador de 21 años o menos en Europa (Tuttosport).' },
    { id: 'kopa', nombre: 'Trofeo Kopa', tramos: [[2018, 'sub21']], nota: 'Mejor jugador joven del Balón de Oro.' },
    { id: 'yashin', nombre: 'Trofeo Yashin', tramos: [[2019, 'porteros']], nota: 'Mejor portero del Balón de Oro.' },
    { id: 'puskas', nombre: 'Premio Puskás', tramos: [[2009, 'gol']], nota: 'Mejor gol del año (FIFA).' }
  ];
  const PREMIOS_PAIS = {
    España: [['goleador', 1929, 'Trofeo Pichichi'], ['portero', 1958, 'Trofeo Zamora'], ['mejor', 1976, 'Premio Don Balón']],
    Italia: [['goleador', 1929, 'Capocannoniere'], ['mejor', 1997, 'Oscar del Calcio']],
    Inglaterra: [['goleador', 1888, 'Máximo goleador'], ['mejor', 1947, 'Futbolista del Año FWA'], ['mejor', 1973, 'Futbolista del Año PFA'], ['goleador', 1992, 'Bota de Oro de la Premier']],
    Alemania: [['mejor', 1960, 'Futbolista del Año (Kicker)'], ['goleador', 1965, 'Torjägerkanone']],
    Francia: [['goleador', 1932, 'Máximo goleador'], ['mejor', 1959, 'Futbolista francés del año'], ['mejor', 1994, 'Mejor jugador UNFP']],
    Portugal: [['goleador', 1952, 'Bola de Prata'], ['mejor', 1970, 'Futbolista del Año']],
    Argentina: [['goleador', 1931, 'Goleador del torneo'], ['mejor', 1970, 'Premio Olimpia']],
    Brasil: [['goleador', 1959, 'Artilheiro'], ['mejor', 1973, 'Bola de Ouro (Placar)']]
  };
  // Los premios que existen un año: [{ id, nombre, quien, nota }].
  function premios(anio) {
    return PREMIOS.map((p) => { const t = enTramo(p.tramos, anio); return t && t[1] && !(p.sin || []).includes(anio) ? { id: p.id, nombre: t[2] || p.nombre, quien: t[1], nota: p.nota } : null; }).filter(Boolean);
  }
  function premiosPais(pais, anio) {
    const out = {};
    (PREMIOS_PAIS[pais] || []).forEach(([tipo, desde, n]) => { if (anio >= desde) out[tipo] = n; });
    return out;
  }

  // Reglas del juego que valen para todos (las de cada liga, como cambios o puntos, van en la tabla).
  const GLOBALES = [
    [1930, 'Sin cambios: el lesionado deja a su equipo con diez.'],
    [1958, 'La FIFA deja cambiar al portero lesionado en algunas competiciones.'],
    [1965, 'Primeros cambios en las ligas (Inglaterra, un cambio por lesión). En la UEFA cuentan los goles fuera (Recopa); la Copa de Europa los usa desde 1966.'],
    [1970, 'Tarjetas amarillas y rojas. Dos cambios en el Mundial. Primera tanda de penaltis en la UEFA.'],
    [1981, 'Tres puntos por victoria en Inglaterra.'],
    [1990, 'Roja directa al que corta una ocasión clara siendo el último defensa.'],
    [1992, 'El portero no puede coger con la mano una cesión de un compañero.'],
    [1994, 'Tres puntos por victoria en el Mundial; en 1995 en toda Europa.'],
    [1995, 'Ley Bosman: libres al acabar el contrato y sin cupo para comunitarios. Tres cambios.'],
    [1996, 'Gol de oro en prórrogas (Eurocopa 1996, Mundial 1998). Gol de plata en 2002-03.'],
    [2004, 'Se acaban el gol de oro y el de plata.'],
    [2012, 'Tecnología de gol aprobada (en la Premier desde 2013).'],
    [2017, 'VAR: Bundesliga y Serie A en 2017, Mundial 2018, LaLiga 2018, Premier 2019.'],
    [2020, 'Cinco cambios por partido.'],
    [2021, 'La UEFA quita el valor doble de los goles fuera.'],
    [2022, 'Fuera de juego semiautomático en el Mundial.']
  ];
  function reglasGlobales(anio) {
    return {
      golesFuera: anio >= 1965 && anio < 2021,
      penaltis: anio >= 1970,
      tarjetas: anio >= 1970,
      golDeOro: anio >= 1996 && anio < 2004,
      cesionPortero: anio < 1992,
      bosman: anio >= 1995,
      var: anio >= 2017,
      novedades: GLOBALES.filter((g) => g[0] === anio).map((g) => g[1]),
      vigentes: GLOBALES.filter((g) => g[0] <= anio).map((g) => g[1])
    };
  }

  // Plazas en la Copa de Europa / Liga de Campeones por país (aproximado: dependen del coeficiente de cada año).
  const PLAZAS_EUROPA = {
    España: [[1955, 1], [1997, 2], [1999, 4]], Italia: [[1955, 1], [1997, 2], [1999, 4]], Inglaterra: [[1955, 1], [1997, 2], [1999, 3], [2001, 4]],
    Alemania: [[1955, 1], [1997, 2], [1999, 4]], Francia: [[1955, 1], [1997, 2], [1999, 3], [2010, 3]], Portugal: [[1955, 1], [1997, 2], [2008, 3]]
  };
  const plazasEuropa = (pais, anio) => { const t = PLAZAS_EUROPA[pais] && enTramo(PLAZAS_EUROPA[pais], anio); return t ? t[1] : 0; };

  const api = { reglas, hayCompeticion, hayMundial, PAISES: Object.keys(TABLA), COMPETICIONES, TABLA,
    formato, nombre, premios, premiosPais, reglasGlobales, plazasEuropa, FORMATOS, NOMBRES, PREMIOS, PREMIOS_PAIS, GLOBALES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Epoca = api;
})(typeof self !== 'undefined' ? self : this);
