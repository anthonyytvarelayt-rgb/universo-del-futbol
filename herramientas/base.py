# Monta datos/base.js, la base única que lee el motor para empezar en cualquier temporada, desde datos_fuente/base/:
#   ligas.csv, clubes.csv, jugadores.csv, carreras.csv, entrenadores.csv, derbis.csv y paises.json (formato de cada país).
# Antes de escribir, revisa los datos (columnas, fechas, niveles, campeones, carreras) y aparta lo que no pasa.
# Uso: python3 herramientas/base.py   (escribe datos/base.js y datos_fuente/base/revision.txt)
import csv, json, os, re
from collections import Counter, defaultdict

AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(AQUI, '..', 'datos_fuente', 'base')
POSICIONES = {'POR', 'DEF', 'MED', 'DEL'}
avisos = []

# Dos clubes distintos no pueden llamarse igual: el juego busca a los clubes por su nombre.
MISMO_NOMBRE = {('Argentina', 'Arsenal'): 'Arsenal de Sarandí'}
def sin_repetir(filas):
    for f in filas:
        nuevo = MISMO_NOMBRE.get(((f.get('pais') or '').strip(), (f.get('club') or '').strip()))
        if nuevo: f['club'] = nuevo
        yield f

def leer(nombre):
    ruta = os.path.join(BASE, nombre)
    return list(sin_repetir(csv.DictReader(open(ruta, encoding='utf-8-sig')))) if os.path.exists(ruta) else []

def entero(s, defecto=None):
    m = re.match(r'\s*(-?\d+)', str(s or ''))
    return int(m.group(1)) if m else defecto

def anio_nac(s):
    return entero((s or '')[:4])

config = json.load(open(os.path.join(BASE, 'paises.json'), encoding='utf-8'))
nombres_pais = {c['pais'] for c in config['paises']}

# Ligas: una fila por club y temporada. Fila repetida = aviso; dos campeones en el mismo grupo = aviso.
ligas, vistas = [], set()
for f in leer('ligas.csv'):
    t, d = entero(f['temporada']), entero(f['division'])
    if f['pais'] not in nombres_pais or t is None or not 1930 <= t <= 2026 or d not in (1, 2):
        avisos.append(f"ligas: fila apartada {dict(f)}"); continue
    clave = (f['pais'], t, f['club'].strip())
    if clave in vistas:
        avisos.append(f"ligas: {f['club']} sale dos veces en {f['pais']} {t}"); continue
    vistas.add(clave)
    ligas.append([f['pais'], t, d, (f.get('grupo') or '').strip(), f['club'].strip(), entero(f.get('posicion')), (f.get('nota') or '').strip()])
campeones = Counter((x[0], x[1], x[2], x[3]) for x in ligas if x[5] == 1)
for k, n in campeones.items():
    if n > 1: avisos.append(f"ligas: {n} campeones en {k}")

clubes = {}
for f in leer('clubes.csv'):
    c = {'pais': f['pais'], 'ciudad': f.get('ciudad', ''), 'c1': f.get('color1') or '#888888', 'c2': f.get('color2') or '#dddddd', 'estadio': f.get('estadio', '')}
    for k, k2 in (('prestigio', 'prestigio'), ('prestigio_anio', 'prestigioAnio'), ('fundacion', 'fundacion')):
        if entero(f.get(k)) is not None: c[k2] = entero(f.get(k))
    for k, k2 in (('id', 'id'), ('articulo', 'art'), ('apodo', 'apodo')):
        if f.get(k): c[k2] = f[k]
    clubes[f['club']] = c
for x in ligas:
    if x[4] not in clubes: clubes[x[4]] = {'pais': x[0], 'ciudad': '', 'c1': '#888888', 'c2': '#dddddd', 'estadio': ''}

# Los niveles de los CSV van en la escala acordada (1-1000); base.json guarda la escala interna del motor.
from escala import interno

# Jugadores: clave nombre + nacimiento. Fecha imposible, posición o nivel fuera de escala = apartado.
jugadores = {}
for f in leer('jugadores.csv'):
    nac, pos, maxi = (f.get('nacimiento') or '').strip(), (f.get('posicion') or '').strip().upper(), entero(f.get('nivel_max'))
    # La fecha puede ser completa, solo el año o desconocida ('sin dato'); si hay año, tiene que ser posible.
    if (anio_nac(nac) is not None and not 1880 <= anio_nac(nac) <= 2012) or pos not in POSICIONES or maxi is None or not 1 <= maxi <= 1000:
        avisos.append(f"jugadores: apartado {f.get('nombre')} ({nac}, {pos}, {f.get('nivel_max')})"); continue
    clave = (f['nombre'].strip(), nac)
    if clave in jugadores:
        avisos.append(f"jugadores: {clave[0]} ({nac}) repetido"); continue
    j = {'n': clave[0], 'nac': nac, 'nacion': (f.get('nacionalidad') or '').strip(), 'pos': pos, 'max': interno(maxi), 'carrera': []}
    if f.get('nombre_completo'): j['completo'] = f['nombre_completo'].strip()
    if (f.get('ficticio') or '').strip().lower() in ('sí', 'si'): j['ficticio'] = True
    if f.get('rol'): j['rol'] = f['rol'].strip()
    jugadores[clave] = j

# Carreras: un club por fila. Sin ficha de jugador, antes de los 15 años o después de los 50 = apartado.
# El último número de cada paso es su orden en el CSV: el motor respeta ese orden en plantillas y debutantes.
for orden, f in enumerate(leer('carreras.csv')):
    clave = (f['nombre'].strip(), (f.get('nacimiento') or '').strip())
    j, desde, hasta = jugadores.get(clave), entero(f.get('desde')), entero(f.get('hasta'))
    if not j or desde is None:
        avisos.append(f"carreras: sin ficha o sin temporada: {clave[0]} en {f.get('club')}"); continue
    edad = desde - (anio_nac(clave[1]) or desde - 25)
    if not 15 <= edad <= 50 or (hasta is not None and hasta < desde):
        avisos.append(f"carreras: {clave[0]} en {f['club']} con {edad} años o fechas al revés"); continue
    paso = [f['club'].strip(), (f.get('pais') or '').strip(), desde, hasta, entero(f.get('partidos')), entero(f.get('goles')), (interno(entero(f.get('nivel'))) if entero(f.get('nivel')) else None), (f.get('nota') or '').strip(), orden]
    j['carrera'].append(paso)

# ---- Jugadores de Wikidata (datos/expansion/wikidata): dan plantillas reales a las épocas sin datos revisados ----
# Mandan los CSV de datos/base. De Wikidata entra quien no esté ya (mismo año de nacimiento y nombre o club que casan);
# si ya está, solo se le añaden los clubes posteriores. Fuera: jugadoras (mujeres.txt) y, por tamaño, quien nunca
# estuvo entre los 22 mejores de un club en una temporada de ligas.csv.
import unicodedata
WD = os.path.join(AQUI, '..', 'datos_fuente', 'expansion', 'wikidata')
def toks(x): return set(re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', x).encode('ascii', 'ignore').decode().lower()).split())
# Para unir por club hace falta compartir el apellido (la última palabra de uno de los dos nombres), no solo el
# nombre de pila: a Carlos Polischuk se le pegaba la carrera de Carlos Salvador Bilardo por ser los dos «Carlos» de Estudiantes.
import difflib
def _orden(x): return re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', re.sub(r'\(.*?\)', ' ', x)).encode('ascii', 'ignore').decode().lower()).split()
def apellido_comun(a, b, comun):
    oa, ob = _orden(a), _orden(b)
    if not oa or not ob: return False
    if any(len(w) >= 4 and w in comun for w in (oa[-1], ob[-1])): return True
    return len(oa[-1]) >= 5 and difflib.SequenceMatcher(None, oa[-1], ob[-1]).ratio() >= 0.8
n_wd = {'nuevos': 0, 'unidos': 0, 'mujeres': 0, 'sin_sitio': 0}
if os.path.exists(os.path.join(WD, 'jugadores_wikidata.csv')):
    mujeres = set(open(os.path.join(WD, 'mujeres.txt')).read().split()) if os.path.exists(os.path.join(WD, 'mujeres.txt')) else set()
    lee = lambda n: sin_repetir(csv.DictReader(open(os.path.join(WD, n), encoding='utf-8-sig')))
    en_liga = defaultdict(set)
    for x in ligas: en_liga[x[4]].add(x[1])
    pasos_wd = defaultdict(list)
    for f in lee('carreras_wikidata.csv'):
        d, h = entero(f['desde']), entero(f['hasta'])
        if d is None or (h is not None and h < d): continue
        pasos_wd[(f['nombre'].strip(), f['nacimiento'].strip())].append([f['club'].strip(), f['pais'].strip(), d, h, entero(f['partidos']), entero(f['goles']), None, '', 0])
    por_anio = defaultdict(list)
    for clave, j in jugadores.items():
        por_anio[anio_nac(clave[1])].append((toks(clave[0]), clave, {p[0] for p in j['carrera']}))
    nuevos = {}
    # Quien tiene en Wikidata a alguien con su mismo nombre exacto y año no se une con otro que solo se le parezca
    # (a Dino Zoff se le pegaba la carrera de otro Dino de 1942 que también pasó por el Udinese).
    exactos_wd = defaultdict(set)
    for f in lee('jugadores_wikidata.csv'):
        exactos_wd[anio_nac(f['nacimiento'].strip())].add(frozenset(toks(f['nombre'].strip())))
    for f in lee('jugadores_wikidata.csv'):
        clave = (f['nombre'].strip(), f['nacimiento'].strip())
        if f['wikidata'] in mujeres: n_wd['mujeres'] += 1; continue
        ps, maxi, pos, y = pasos_wd.get(clave), entero(f['nivel_max']), f['posicion'].strip().upper(), anio_nac(clave[1])
        if not ps or clave in nuevos or maxi is None or not 1 <= maxi <= 1000 or pos not in POSICIONES or y is None: continue
        # Canteranos: Wikidata cuenta desde que entraron de niños (Busquets en el Barça desde los 12). Si siguieron
        # en el club de mayores, su etapa empieza a los 18; si no, esa etapa no cuenta.
        for p in ps:
            if p[2] - y < 15 and (p[3] is None or p[3] - y >= 19) and (p[4] or 0) >= 20: p[2] = y + 18
        ps = [p for p in ps if 15 <= p[2] - y <= 50]
        if not ps: continue
        t, clubes_wd, igual = toks(clave[0]), {p[0] for p in ps}, None
        for tb, cb, clubs_b in sorted(por_anio.get(y, ()), key=lambda x: x[0] != t):
            comun = tb & t
            if tb != t and frozenset(tb) in exactos_wd[y]: continue
            # Mismo año y mismo nombre (o uno dentro del otro); o mismo club y una palabra larga en común; o misma fecha exacta y algo en común.
            if (tb and t and (tb == t or (len(tb) > 1 and tb <= t) or (len(t) > 1 and t <= tb))) \
               or (clubs_b & clubes_wd and apellido_comun(cb[0], clave[0], comun)) \
               or (len(cb[1]) == 10 and cb[1] == clave[1] and (comun or clubs_b & clubes_wd)):
                igual = cb; break
        if igual:
            j = jugadores[igual]; ultimo = max((p[2] for p in j['carrera']), default=0)
            j['carrera'] += [p for p in ps if p[2] > ultimo]
            if not j['nacion'] and f['nacionalidad']: j['nacion'] = f['nacionalidad'].strip()
            n_wd['unidos'] += 1; continue
        j = {'n': clave[0], 'nac': clave[1], 'nacion': f['nacionalidad'].strip(), 'pos': pos, 'max': interno(maxi), 'carrera': sorted(ps, key=lambda p: p[2]), '_m': maxi, '_wd': f['wikidata']}
        if f.get('rol'): j['rol'] = f['rol'].strip()
        nuevos[clave] = j
    # Temporadas de cada uno en cada club, y los 22 mejores de cada club y temporada
    plant = defaultdict(list)
    for clave, j in nuevos.items():
        c, y = j['carrera'], anio_nac(clave[1])
        for i, p in enumerate(c):
            hasta = p[3] if p[3] is not None else max(p[2], c[i + 1][2] - 1) if i + 1 < len(c) else max(p[2], y + 36)
            for t in range(p[2], min(hasta, 2026) + 1):
                if t in en_liga.get(p[0], ()): plant[(p[0], t)].append((j['_m'], clave))
    dentro = set()
    for xs in plant.values():
        xs.sort(reverse=True); dentro.update(c for _, c in xs[:22])
    orden = 10 ** 6
    for clave, j in sorted(nuevos.items(), key=lambda kv: -kv[1]['_m']):
        if clave not in dentro: n_wd['sin_sitio'] += 1; continue
        if clave in jugadores: continue
        del j['_m']
        for p in j['carrera']: orden += 1; p[8] = orden; p[1] = ''
        jugadores[clave] = j; n_wd['nuevos'] += 1
    print('wikidata', n_wd)

# Un mismo jugador escrito dos veces (Seminario y Juan Seminario, Muller y Lucien Muller): misma fecha exacta de
# nacimiento y un nombre dentro del otro. Se queda uno solo, con el nombre más completo y la carrera de los dos.
_nom = lambda n: toks(re.sub(r'\(.*?\)', ' ', n))
_fecha = defaultdict(list)
for clave in jugadores:
    if len(clave[1]) == 10 and not clave[1].endswith(('-01-01', '-07-01')) and not clave[0].startswith('Relleno'): _fecha[clave[1]].append(clave)
n_dobles = 0
for claves in _fecha.values():
    for i, ca in enumerate(claves):
        for cb in claves[i + 1:]:
            if ca not in jugadores or cb not in jugadores: continue
            ta, tb = _nom(ca[0]), _nom(cb[0])
            if not ta or not tb or not (ta <= tb or tb <= ta): continue
            largo, corto = (ca, cb) if (len(ta), '(' not in ca[0]) >= (len(tb), '(' not in cb[0]) else (cb, ca)
            A, B = jugadores[largo], jugadores[corto]
            for pb in B['carrera']:
                choca = [pa for pa in A['carrera'] if pa[2] == pb[2] or (pa[0] == pb[0] and abs(pa[2] - pb[2]) <= 1)]
                if not choca: A['carrera'].append(pb)
                elif pb[6] is not None and all(pa[6] is None or (pb[1] == 'España' and pa[1] != 'España') for pa in choca):
                    A['carrera'] = [pa for pa in A['carrera'] if pa not in choca] + [pb]
            A['max'] = max(A['max'], B['max'])
            if any(pb[6] is not None for pb in B['carrera']) and all(pa[6] is None for pa in A['carrera'] if pa not in B['carrera']): A['pos'] = B['pos']
            if not A.get('nacion'): A['nacion'] = B.get('nacion', '')
            del jugadores[corto]; n_dobles += 1
# Y el mismo nombre, el mismo año y un club en común, con la fecha bailada en una sola cifra (Joe Baker nacido el
# 17 de junio en un sitio y el 17 de julio en otro) o con solo el año en uno de los dos: también son el mismo.
_mismo = defaultdict(list)
for clave in jugadores:
    if not clave[0].startswith('Relleno') and clave[1][:4].isdigit(): _mismo[(frozenset(_nom(clave[0])), clave[1][:4])].append(clave)
for claves in _mismo.values():
    for i, ca in enumerate(claves):
        for cb in claves[i + 1:]:
            if ca not in jugadores or cb not in jugadores: continue
            da, db = ca[1], cb[1]
            if len(da) == 10 and len(db) == 10 and not (da != db and (da[5:7] == db[5:7] or da[8:] == db[8:])): continue
            A, B = jugadores[ca], jugadores[cb]
            if not {p[0] for p in A['carrera']} & {p[0] for p in B['carrera']}: continue
            if len(B['carrera']) > len(A['carrera']): A, B, ca, cb = B, A, cb, ca
            for pb in B['carrera']:
                if not any(pa[2] == pb[2] or (pa[0] == pb[0] and abs(pa[2] - pb[2]) <= 1) for pa in A['carrera']): A['carrera'].append(pb)
            A['max'] = max(A['max'], B['max'])
            del jugadores[cb]; n_dobles += 1
print('dobles unidos', n_dobles)

for j in jugadores.values():
    j['carrera'].sort(key=lambda p: p[2])
    # Wikidata guarda la salida un año antes (temporada europea). En ligas de año natural (Brasil, Argentina) o si el
    # jugador se fue en invierno, eso deja un año en blanco entre dos clubes: ese año sigue en el club que dejaba.
    for a, b in zip(j['carrera'], j['carrera'][1:]):
        if a[3] is not None and a[6] is None and b[2] - a[3] == 2: a[3] += 1
    for a, b in zip(j['carrera'], j['carrera'][1:]):
        if a[3] is not None and a[3] >= b[2] and 'cesión' not in (b[7] + a[7]):
            avisos.append(f"carreras: {j['n']} en dos clubes a la vez ({a[0]} hasta {a[3]}, {b[0]} desde {b[2]})")
sin_carrera = [j['n'] for j in jugadores.values() if not j['carrera']]
if sin_carrera: avisos.append(f"jugadores sin carrera (no entran): {len(sin_carrera)}, por ejemplo {sin_carrera[:5]}")

entrenadores = []
for f in leer('entrenadores.csv'):
    t = {'nombre': f['nombre'], 'nacion': f.get('nacionalidad', ''), 'pais': f.get('pais', ''), 'club': f['club'], 'desde': entero(f.get('desde')), 'hasta': entero(f.get('hasta'))}
    if entero(f.get('nacimiento')) is not None: t['nac'] = str(entero(f['nacimiento']))  # sin dato no se inventa
    if entero(f.get('jornada_desde')) is not None: t['jDesde'], t['jHasta'] = entero(f['jornada_desde']), entero(f.get('jornada_hasta'))
    for k in ('estilo', 'nota'):
        if f.get(k): t[k] = f[k]
    for k in ('fisico', 'merito', 'fijo'):
        if (f.get(k) or '').lower() in ('sí', 'si'): t[k] = True
    entrenadores.append(t)

# Temporadas en las que se puede empezar: las que tienen plantillas en todos los países con liga ese año.
con_jugadores = defaultdict(set)
for j in jugadores.values():
    for p in j['carrera']: con_jugadores[p[2]].add(p[1])
por_temporada = defaultdict(set)
for x in ligas:
    if not x[6]: por_temporada[x[1]].add(x[0])
anios = sorted(t for t, ps in por_temporada.items() if 'España' in ps)

# Temporadas en las que el motor da la partida por jugable: los clubes de primera tienen plantilla real (11 o más
# jugadores de verdad). España entera y, en cada país que no se rellena a propósito, al menos el 75 % de sus clubes.
reales = defaultdict(lambda: defaultdict(int))
for j in jugadores.values():
    if j.get('ficticio'): continue
    c = j['carrera']
    try: n = int(str(j.get('nac') or '')[:4])
    except ValueError: n = None
    for i, p in enumerate(c):
        hasta = p[3] if p[3] is not None else max(p[2], c[i + 1][2] - 1) if i + 1 < len(c) else max(p[2], n + 36) if n else 2026
        for t in range(p[2], min(hasta, 2026) + 1): reales[t][p[0]] += 1
se_rellena = {P['pais'] for P in config['paises'] if P.get('rellenar')}
def jugable(t):
    arriba = defaultdict(list)
    for x in ligas:
        if x[1] == t and x[2] == 1 and not x[6]: arriba[x[0]].append(reales[t][x[4]] >= 11)
    # Con los datos revisados a mano (hasta 1969) se exige España entera; con Wikidata basta la mitad de España y el
    # 60 % de los clubes del conjunto: lo que falte se rellena con suplentes marcados (aceptado por Anthony).
    if not arriba.get('España'): return False
    if all(arriba['España']) and all(sum(v) >= 0.75 * len(v) for p, v in arriba.items() if p not in se_rellena): return True
    todos = [x for p, v in arriba.items() if p not in se_rellena for x in v]
    return sum(arriba['España']) >= 0.5 * len(arriba['España']) and sum(todos) >= 0.6 * len(todos)
anios_jugables = [t for t in anios if jugable(t)]
if os.environ.get('DIAG'):
    for t in anios:
        if t in anios_jugables: continue
        arriba = defaultdict(list)
        for x in ligas:
            if x[1] == t and x[2] == 1 and not x[6]: arriba[x[0]].append((reales[t][x[4]], x[4]))
        print(t, {p: f"{sum(1 for n, _ in v if n >= 11)}/{len(v)}" + (' ' + ','.join(f'{c}:{n}' for n, c in sorted(v)[:3]) if p == 'España' else '') for p, v in arriba.items() if p not in se_rellena or p == 'España'})

europa = json.load(open(os.path.join(AQUI, 'europa_1958-63.json'), encoding='utf-8')) if os.path.exists(os.path.join(AQUI, 'europa_1958-63.json')) else []
# ---- Limpieza (etapa 1 del plan) ----
# 1) Alemania tiene un solo nombre. 2) Nacionalidad que falta en Wikidata: país de nacimiento (nacimiento_wikidata.csv).
# 3) Posición: Wikidata da varias a los atacantes (Messi "centrocampista" y "delantero") y la primera mandaba; quien
#    viene de Wikidata como MED y marca como un delantero (un gol cada tres partidos, con 60 o más) es DEL.
# 4) correcciones.csv: arreglos a mano (pos, nacion, nombre) que mandan sobre todo lo demás.
UNA_NACION = {'RFA': 'Alemania', 'Alemania Occidental': 'Alemania', 'Alemania Federal': 'Alemania', 'Reino Unido': 'Inglaterra',
              'Unión Soviética': 'URSS', 'Reino de los Países Bajos': 'Países Bajos', 'República de Irlanda': 'Irlanda', 'Estados Unidos de América': 'Estados Unidos'}
_nace = {}
_ruta = os.path.join(WD, 'nacimiento_wikidata.csv')
if os.path.exists(_ruta):
    for f in csv.DictReader(open(_ruta, encoding='utf-8')): _nace[f['wikidata']] = f['pais']
n_limpia = Counter()
for j in jugadores.values():
    q = j.pop('_wd', None)
    if not j['nacion'] and q in _nace: j['nacion'] = _nace[q]; n_limpia['nacion de nacimiento'] += 1
    if j['nacion'] in UNA_NACION: j['nacion'] = UNA_NACION[j['nacion']]; n_limpia['nacion unificada'] += 1
    if q and j['pos'] == 'MED':
        pj = sum(p[4] or 0 for p in j['carrera'] if p[4] and p[5] is not None); g = sum(p[5] or 0 for p in j['carrera'] if p[4] and p[5] is not None)
        if pj >= 60 and g / pj >= 0.33: j['pos'] = 'DEL'; n_limpia['MED a DEL por goles'] += 1
_por = defaultdict(list)
for j in jugadores.values(): _por[j['n']].append(j)
for f in leer('correcciones.csv'):
    # El año puede ser la fecha entera (1986-07-29) para separar a dos tocayos del mismo año.
    js = [j for j in _por.get(f['nombre'], []) if j['nac'][:len(f['anio'])] == f['anio']]
    if not js: avisos.append(f"correcciones: no encuentro a {f['nombre']} ({f['anio']})"); continue
    for j in js:
        if f['campo'] == 'nivel': j['max'] = interno(entero(f['valor']))
        else: j[{'nombre': 'n'}.get(f['campo'], f['campo'])] = f['valor']
        # Tras un cambio de nombre, las correcciones siguientes lo encuentran por el nombre nuevo.
        if f['campo'] == 'nombre': _por[f['valor']].append(j)
        n_limpia['a mano'] += 1
# 5) niveles_figuras.csv: nivel máximo (escala 1-1000) de las figuras valoradas a mano, por lotes de otras IA ya revisados.
_por = defaultdict(list)
for j in jugadores.values(): _por[j['n']].append(j)
for f in leer('niveles_figuras.csv'):
    js = [j for j in _por.get(f['nombre'], []) if j['nac'][:4] == f['anio']]
    if not js: avisos.append(f"niveles_figuras: no encuentro a {f['nombre']} ({f['anio']})"); continue
    max(js, key=lambda j: j['max'])['max'] = interno(entero(f['nivel'])); n_limpia['nivel de figura'] += 1
print('limpieza', dict(n_limpia))

# Nombres únicos: dos jugadores distintos con el mismo nombre (García, Rodri...) se confundían en la página
# (al tocar el nombre salía la ficha del otro, con otra posición). El mejor conserva el nombre; el resto lleva
# su nombre completo o el año de nacimiento.
_por_nombre = defaultdict(list)
for j in jugadores.values():
    if j['carrera']: _por_nombre[j['n']].append(j)
_usados = set(_por_nombre)
for n, js in _por_nombre.items():
    if len(js) < 2: continue
    for j in sorted(js, key=lambda x: -x['max'])[1:]:
        anio = j['nac'][:4] if j['nac'][:4].isdigit() else 'deb. %s' % min(p[2] for p in j['carrera'])
        for cand in [j.get('completo'), f"{n} ({anio})", f"{n} ({anio}, {j['pos']})"] + [f"{n} ({anio}, {j['pos']} {k})" for k in range(2, 30)]:
            if cand and cand not in _usados: break
        _usados.add(cand); j['n'] = cand
# Para que la página pese menos: los pasos de Wikidata se guardan cortos (club, '', desde, hasta, partidos, goles)
# y la nacionalidad vacía no se escribe.
for j in jugadores.values():
    j['carrera'] = [p[:6] if p[8] > 10 ** 6 else p for p in j['carrera']]
    if not j['nacion']: del j['nacion']
base = {'paises': config['paises'], 'ajustes': config.get('ajustes', {}), 'clubes': clubes, 'ligas': ligas,
        'jugadores': [j for j in jugadores.values() if j['carrera']], 'entrenadores': entrenadores,
        'derbis': leer('derbis.csv'), 'europa': europa, 'aniosDisponibles': anios, 'aniosJugables': anios_jugables}
SALIDA = os.path.join(AQUI, '..', 'datos', 'base.js')
open(SALIDA, 'w', encoding='utf-8').write('window.BASE_DATOS = ' + json.dumps(base, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(BASE, 'revision.txt'), 'w', encoding='utf-8').write('\n'.join(avisos) + '\n')
print({'ligas': len(ligas), 'clubes': len(clubes), 'jugadores': len(base['jugadores']), 'entrenadores': len(entrenadores),
       'anios': anios, 'jugables': anios_jugables, 'avisos': len(avisos), 'MB': round(os.path.getsize(SALIDA) / 1e6, 2)})
