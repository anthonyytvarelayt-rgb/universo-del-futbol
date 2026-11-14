# Añade a jugadores_wikidata.csv y carreras_wikidata.csv los clubes que la descarga original se dejó fuera
# (Q de Wikidata equivocado o sin Q): Sampdoria, Múnich 1860, Caen, Brest, Wimbledon, Gerona, Platense, Chacarita...
# No rehace los niveles de nadie: a los que ya estaban solo les añade sus años en esos clubes; a los nuevos les pone
# el nivel que la fórmula dio a los jugadores de su década con la misma fama (número de Wikipedias).
# Uso: python3 completar_clubes.py <carpeta con pasosNN.csv, otrosNN.csv, infoNN.csv y clubs.json bajados de Wikidata>
# (las consultas están en descargar_clubes.py; Wikidata deja una por minuto)
import csv, glob, json, re, sys, os, collections, statistics, unicodedata
D = sys.argv[1]; AQUI = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(AQUI, '..', '..', 'base')
qid = lambda u: u.rsplit('/', 1)[1] if u else ''
num = lambda x: int(float(x)) if x and re.match(r'^-?\d+(\.\d+)?$', x) else None
anio = lambda s: int(s[:4]) if s and re.match(r'\d{4}', s) else None
lee = lambda f: list(csv.DictReader(open(f, encoding='utf-8-sig')))
NUEVOS = [tuple(x) for x in json.load(open(os.path.join(D, 'clubs.json')))]
temporadas = collections.Counter(r['club'] for r in lee(os.path.join(B, 'ligas.csv')))
CLUB = {}
filas_q = lee(os.path.join(AQUI, 'clubes_q.csv'))
malos = {n for n, _, _ in NUEVOS}
for r in filas_q:
    nom = re.sub(r'\s*\(filial.*\)', '', r['club'])
    if nom in malos: continue
    if r['q'] and (r['q'] not in CLUB or temporadas[nom] > temporadas[CLUB[r['q']][0]]): CLUB[r['q']] = (nom, r['pais'])
for n, p, q in NUEVOS: CLUB[q] = (n, p)
POS = {'guardameta': 'POR', 'defensa': 'DEF', 'lateral': 'DEF', 'defensor central': 'DEF', 'líbero': 'DEF', 'carrilero': 'DEF',
       'centrocampista': 'MED', 'mediocampista defensivo': 'MED', 'volante': 'MED', 'mediocentro organizador': 'MED', 'media punta': 'MED',
       'delantero': 'DEL', 'atacante': 'DEL', 'delantero centro': 'DEL'}
NACION = {'Inglaterra': 'Inglaterra', 'Reino Unido': 'Inglaterra', 'Alemania': 'Alemania', 'Alemania Occidental': 'Alemania'}
info = {}
for r in (r for f in glob.glob(os.path.join(D, 'info*.csv')) for r in lee(f)):
    d = info.setdefault(qid(r['p']), {'sl': int(r['sl']), 'pos': set(), 'nac': set()})
    if r['pos']: d['pos'].add(r['pos'])
    if r['nac']: d['nac'].add(r['nac'])
jug, pasos = {}, collections.defaultdict(set)
# pasosNN.csv: los años en los clubes que faltaban (con nombre y nacimiento); otrosNN.csv: el resto de clubes de los jugadores nuevos
for r in (r for f in sorted(glob.glob(os.path.join(D, 'pasos*.csv')) + glob.glob(os.path.join(D, 'otros*.csv'))) for r in lee(f)):
    p, c = qid(r['p']), qid(r['c'])
    if c not in CLUB or anio(r['s']) is None: continue
    if 'pLabel' in r: jug.setdefault(p, (r['pLabel'], r['b'][:10]))
    pasos[p].add((CLUB[c][0], CLUB[c][1], anio(r['s']), anio(r['e']), num(r['m']), num(r['g'])))
def puesto(p):
    e = info.get(p, {}).get('pos', set())
    if any('extremo' in x or x in ('alero', 'ala') for x in e): return 'DEL', 'EXT'
    for x in e:
        if x in POS: return POS[x], ''
    return 'MED', ''
def toks(x): return set(re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', x).encode('ascii', 'ignore').decode().lower()).split())
MANO = [(toks(r['nombre']), int(r['nacimiento']), int(r['nivel'])) for r in lee(os.path.join(AQUI, 'figuras_a_mano.csv'))]
def a_mano(nom, nac):
    t, y = toks(nom), anio(nac)
    for tm, ym, v in MANO:
        if ym == y and tm and t and (tm == t or (len(tm) > 1 and tm <= t) or (len(t) > 1 and t <= tm)): return v
    return None
J = lee(os.path.join(AQUI, 'jugadores_wikidata.csv')); C = lee(os.path.join(AQUI, 'carreras_wikidata.csv'))
porq = {r['wikidata']: (r['nombre'], r['nacimiento']) for r in J}
claves = set(porq.values())
tiene = collections.defaultdict(set)
for r in C: tiene[(r['nombre'], r['nacimiento'])].add((r['club'], r['desde']))
formula = collections.defaultdict(lambda: collections.defaultdict(list))
for r in J:
    if r['nivel_origen'] == 'formula' and r['wikipedias'] and anio(r['nacimiento']): formula[anio(r['nacimiento']) // 10][int(r['wikipedias'])].append(int(r['nivel_max']))
def nivel(y, sl):
    t = formula[y // 10]
    if not t: return 300
    k = min(t, key=lambda x: abs(x - sl))
    return round(statistics.median(t[k]))
nombres_nuevos = {n for n, _, _ in NUEVOS}
def fila(nom, nac, s):
    club, pais, d, h, m, g = s
    h2 = max(d, h - 1) if h else None
    return {'nombre': nom, 'nacimiento': nac, 'club': club, 'pais': pais, 'desde': d, 'hasta': h2 if h2 is not None else '', 'partidos': m if m is not None else '', 'goles': g if g is not None else '', 'nivel': '', 'nota': ''}
n_ya = n_nuevo = n_pasos = 0
for p, (nom, nac) in jug.items():
    ps = sorted(pasos[p], key=lambda x: x[2])
    if p in porq:
        k = porq[p]
        for s in ps:
            if s[0] in nombres_nuevos and (s[0], str(s[2])) not in tiene[k]: C.append(fila(k[0], k[1], s)); tiene[k].add((s[0], str(s[2]))); n_pasos += 1
        n_ya += 1; continue
    y = anio(nac)
    if not y or y < 1915 or y > 2010 or re.match(r'^Q\d+$', nom) or (nom, nac) in claves or not any(s[0] in nombres_nuevos for s in ps): continue
    niv, origen = nivel(y, info.get(p, {}).get('sl', 1)), 'formula'
    m = a_mano(nom, nac)
    if m == 0: continue
    if m is not None: niv, origen = m, 'a mano'
    pos, rol = puesto(p)
    nacs = sorted(NACION.get(x, x) for x in info.get(p, {}).get('nac', set()) if x)
    J.append({'nombre': nom, 'nombre_completo': '', 'nacimiento': nac, 'nacionalidad': nacs[0] if nacs else '', 'posicion': pos, 'nivel_max': niv, 'fuente': 'wikidata', 'ficticio': '', 'rol': rol, 'wikidata': p, 'wikipedias': info.get(p, {}).get('sl', ''), 'nivel_origen': origen})
    claves.add((nom, nac)); n_nuevo += 1
    for s in ps: C.append(fila(nom, nac, s)); n_pasos += 1
def escribe(f, filas):
    w = csv.DictWriter(open(f, 'w', newline='', encoding='utf-8'), fieldnames=list(filas[0].keys())); w.writeheader(); w.writerows(filas)
escribe(os.path.join(AQUI, 'jugadores_wikidata.csv'), J); escribe(os.path.join(AQUI, 'carreras_wikidata.csv'), C)
# clubes_q.csv con los Q buenos, para la próxima descarga completa
vistos = set()
for r in filas_q:
    for n, p, q in NUEVOS:
        if r['club'] == n and n not in vistos: r['q'], r['como'] = q, 'a mano'; vistos.add(n)
for n, p, q in NUEVOS:
    if n not in vistos: filas_q.append({'pais': p, 'club': n, 'q': q, 'como': 'a mano'}); vistos.add(n)
escribe(os.path.join(AQUI, 'clubes_q.csv'), filas_q)
print('ya estaban', n_ya, 'nuevos', n_nuevo, 'pasos añadidos', n_pasos)
