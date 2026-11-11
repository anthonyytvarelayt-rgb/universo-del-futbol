# Monta motor/base.json, la base única que lee el motor para empezar en cualquier temporada, desde datos/base/:
#   ligas.csv, clubes.csv, jugadores.csv, carreras.csv, entrenadores.csv, derbis.csv y paises.json (formato de cada país).
# Antes de escribir, revisa los datos (columnas, fechas, niveles, campeones, carreras) y aparta lo que no pasa.
# Uso: python3 motor/base.py            (escribe motor/base.json y datos/base/revision.txt)
import csv, json, os, re
from collections import Counter, defaultdict

AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(AQUI, '..', 'datos', 'base')
POSICIONES = {'POR', 'DEF', 'MED', 'DEL'}
avisos = []

def leer(nombre):
    ruta = os.path.join(BASE, nombre)
    return list(csv.DictReader(open(ruta, encoding='utf-8-sig'))) if os.path.exists(ruta) else []

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
WD = os.path.join(AQUI, '..', 'datos', 'expansion', 'wikidata')
def toks(x): return set(re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', x).encode('ascii', 'ignore').decode().lower()).split())
n_wd = {'nuevos': 0, 'unidos': 0, 'mujeres': 0, 'sin_sitio': 0}
if os.path.exists(os.path.join(WD, 'jugadores_wikidata.csv')):
    mujeres = set(open(os.path.join(WD, 'mujeres.txt')).read().split()) if os.path.exists(os.path.join(WD, 'mujeres.txt')) else set()
    lee = lambda n: csv.DictReader(open(os.path.join(WD, n), encoding='utf-8-sig'))
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
    for f in lee('jugadores_wikidata.csv'):
        clave = (f['nombre'].strip(), f['nacimiento'].strip())
        if f['wikidata'] in mujeres: n_wd['mujeres'] += 1; continue
        ps, maxi, pos, y = pasos_wd.get(clave), entero(f['nivel_max']), f['posicion'].strip().upper(), anio_nac(clave[1])
        if not ps or clave in nuevos or maxi is None or not 1 <= maxi <= 1000 or pos not in POSICIONES or y is None: continue
        ps = [p for p in ps if 15 <= p[2] - y <= 50]
        if not ps: continue
        t, clubes_wd, igual = toks(clave[0]), {p[0] for p in ps}, None
        for tb, cb, clubs_b in por_anio.get(y, ()):
            comun = tb & t
            # Mismo año y mismo nombre (o uno dentro del otro); o mismo club y una palabra larga en común; o misma fecha exacta y algo en común.
            if (tb and t and (tb == t or (len(tb) > 1 and tb <= t) or (len(t) > 1 and t <= tb))) \
               or (clubs_b & clubes_wd and any(len(w) >= 4 for w in comun)) \
               or (len(cb[1]) == 10 and cb[1] == clave[1] and (comun or clubs_b & clubes_wd)):
                igual = cb; break
        if igual:
            j = jugadores[igual]; ultimo = max((p[2] for p in j['carrera']), default=0)
            j['carrera'] += [p for p in ps if p[2] > ultimo]
            if not j['nacion'] and f['nacionalidad']: j['nacion'] = f['nacionalidad'].strip()
            n_wd['unidos'] += 1; continue
        j = {'n': clave[0], 'nac': clave[1], 'nacion': f['nacionalidad'].strip(), 'pos': pos, 'max': interno(maxi), 'carrera': sorted(ps, key=lambda p: p[2]), '_m': maxi}
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

for j in jugadores.values():
    j['carrera'].sort(key=lambda p: p[2])
    for a, b in zip(j['carrera'], j['carrera'][1:]):
        if a[3] is not None and a[3] >= b[2] and 'cesión' not in (b[7] + a[7]):
            avisos.append(f"carreras: {j['n']} en dos clubes a la vez ({a[0]} hasta {a[3]}, {b[0]} desde {b[2]})")
sin_carrera = [j['n'] for j in jugadores.values() if not j['carrera']]
if sin_carrera: avisos.append(f"jugadores sin carrera (no entran): {len(sin_carrera)}, por ejemplo {sin_carrera[:5]}")

entrenadores = []
for f in leer('entrenadores.csv'):
    t = {'nombre': f['nombre'], 'nac': f.get('nacionalidad', ''), 'club': f['club'], 'desde': entero(f.get('desde')), 'hasta': entero(f.get('hasta'))}
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
json.dump(base, open(os.path.join(AQUI, 'base.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
open(os.path.join(BASE, 'revision.txt'), 'w', encoding='utf-8').write('\n'.join(avisos) + '\n')
print({'ligas': len(ligas), 'clubes': len(clubes), 'jugadores': len(base['jugadores']), 'entrenadores': len(entrenadores),
       'anios': anios, 'jugables': anios_jugables, 'avisos': len(avisos), 'MB': round(os.path.getsize(os.path.join(AQUI, 'base.json')) / 1e6, 2)})
