# Convierte la descarga de Wikidata en jugadores + carreras con nivel en la escala acordada (1-1000)
# y escribe el informe de relleno por club y temporada.
# Uso: python3 nivel_wikidata.py <carpeta con jug/, sl/, clubes_q.csv, etiquetas.csv>
import csv, glob, math, sys, os, collections, re
W = sys.argv[1]; B = '/mnt/project-files/datos/base/'; OUT = '/mnt/project-files/datos/expansion/wikidata/'
qid = lambda u: u.rsplit('/', 1)[1] if u else ''
num = lambda x: int(float(x)) if x and re.match(r'^-?\d+(\.\d+)?$', x) else None
anio = lambda s: int(s[:4]) if s and re.match(r'\d{4}', s) else None
ETI = {qid(r['x']): r['l'] for r in csv.DictReader(open(W + '/etiquetas.csv'))}
# Si varios clubes nuestros caen en el mismo Q (p. ej. CA Paris, Paris FC y PSG), se queda el de más temporadas
temporadas = collections.Counter(r['club'] for r in csv.DictReader(open(B + 'ligas.csv')))
CLUB = {}
for r in csv.DictReader(open(W + '/clubes_q.csv')):
    nom = re.sub(r'\s*\(filial.*\)', '', r['club'])
    if r['q'] and (r['q'] not in CLUB or temporadas[nom] > temporadas[CLUB[r['q']][0]]): CLUB[r['q']] = (nom, r['pais'])
# Puesto
POS = {'guardameta': 'POR', 'defensa': 'DEF', 'lateral': 'DEF', 'defensor central': 'DEF', 'líbero': 'DEF', 'carrilero': 'DEF',
       'centrocampista': 'MED', 'mediocampista defensivo': 'MED', 'volante': 'MED', 'mediocentro organizador': 'MED', 'media punta': 'MED',
       'delantero': 'DEL', 'atacante': 'DEL', 'delantero centro': 'DEL'}
NACION = {'Inglaterra': 'Inglaterra', 'Reino Unido': 'Inglaterra', 'Alemania': 'Alemania', 'Alemania Occidental': 'Alemania'}
info = {}
for r in (r for f in glob.glob(W + '/sl/*.csv') for r in csv.DictReader(open(f))):
    p = qid(r['p']); d = info.setdefault(p, {'sl': int(r['sl']), 'pos': set(), 'nac': set()})
    if r['pos']: d['pos'].add(ETI.get(qid(r['pos']), ''))
    if r['nac']: d['nac'].add(ETI.get(qid(r['nac']), ''))
# Grandeza de cada club: títulos, podios y temporadas en primera (ligas.csv)
gr = collections.Counter()
for r in csv.DictReader(open(B + 'ligas.csv')):
    if r['division'] in ('1', 'Primera') or r['division'].startswith('1'):
        pos = int(r['posicion']) if (r['posicion'] or '').isdigit() else 99
        gr[r['club']] += 0.2 + (3 if pos == 1 else 1 if pos <= 3 else 0)
# Pasos por club
jug, pasos = {}, collections.defaultdict(list)
for r in (r for f in sorted(glob.glob(W + '/jug/*.csv')) for r in csv.DictReader(open(f))):
    p, c = qid(r['p']), qid(r['c'])
    if c not in CLUB: continue
    jug.setdefault(p, (r['pLabel'], r['b'][:10]))
    pasos[p].append((CLUB[c][0], CLUB[c][1], anio(r['s']), anio(r['e']), num(r['m']), num(r['g'])))
# Quitar repetidos exactos
for p in pasos: pasos[p] = sorted(set(pasos[p]), key=lambda x: (x[2] or 9999))
def puesto(p):
    e = info.get(p, {}).get('pos', set())
    if any('extremo' in x or x in ('alero', 'ala') for x in e): return 'DEL', 'EXT'
    for x in e:
        if x in POS: return POS[x], ''
    return 'MED', ''
# Puntuación: fama (artículos en Wikipedias) y grandeza del mejor club, cada una en percentil dentro de su década de nacimiento
filas = []
for p, (nom, nac) in jug.items():
    y = anio(nac)
    if not y or y < 1915 or y > 2010: continue
    sl = info.get(p, {}).get('sl', 1)
    club = max((gr[s[0]] for s in pasos[p] if s[4] is None or s[4] >= 10), default=0)
    filas.append([p, nom, nac, y // 10, math.log1p(sl), math.log1p(club)])
por = collections.defaultdict(list)
for f in filas: por[f[3]].append(f)
# La fórmula llega como mucho a 630 (Crack): por encima solo entra quien se revisa a mano (lista revisar_figuras.csv),
# porque la fama en Wikipedia infla a los jugadores modernos y a los del Real Madrid.
TABLA = [(0.003, 620), (0.012, 580), (0.04, 520), (0.1, 470), (0.25, 420), (0.55, 340), (0.85, 280), (1.0, 200)]
def nivel(q):  # q = fracción desde arriba
    a, va = 0.0, 630
    for b, vb in TABLA:
        if q <= b: return round(va + (vb - va) * (q - a) / (b - a))
        a, va = b, vb
    return 200
nivelde = {}
for dec, fs in por.items():
    n = len(fs)
    for k, i in ((4, 'rf'), (5, 'rc')):
        for r, f in enumerate(sorted(fs, key=lambda f: -f[k])): f.append(r / n)
    for r, f in enumerate(sorted(fs, key=lambda f: 0.85 * f[6] + 0.15 * f[7])): nivelde[f[0]] = nivel((r + 0.5) / n); f.append(r / n)
# Niveles que ya tenemos (a mano o de los CSV de cada país) mandan sobre la fórmula
ya = {}
for r in csv.DictReader(open(B + 'jugadores.csv')):
    if r['nivel_max'].strip(): ya[(r['nombre'], (r['nacimiento'] or '')[:4])] = int(r['nivel_max'])
# Figuras con nivel a mano (figuras_a_mano.csv: nombre, año de nacimiento, nivel; 0 = no es futbolista, se quita).
# Se empareja por año de nacimiento y nombre (todas las palabras de uno dentro del otro, sin tildes).
import unicodedata
def toks(x): return set(re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', x).encode('ascii', 'ignore').decode().lower()).split())
MANO = [(toks(r['nombre']), int(r['nacimiento']), int(r['nivel']), r['nombre']) for r in csv.DictReader(open(OUT + 'figuras_a_mano.csv'))]
usadas = set()
def a_mano(nom, nac):
    t, y = toks(nom), anio(nac)
    for tm, ym, v, n in MANO:
        if ym == y and tm and t and (tm == t or (len(tm) > 1 and tm <= t) or (len(t) > 1 and t <= tm)): usadas.add(n); return v
    return None
A_MANO = {}
J = open(OUT + 'jugadores_wikidata.csv', 'w', newline=''); wj = csv.writer(J)
wj.writerow(['nombre', 'nombre_completo', 'nacimiento', 'nacionalidad', 'posicion', 'nivel_max', 'fuente', 'ficticio', 'rol', 'wikidata', 'wikipedias', 'nivel_origen'])
C = open(OUT + 'carreras_wikidata.csv', 'w', newline=''); wc = csv.writer(C)
wc.writerow(['nombre', 'nacimiento', 'club', 'pais', 'desde', 'hasta', 'partidos', 'goles', 'nivel', 'nota'])
cubre = collections.defaultdict(set)
for p, (nom, nac) in jug.items():
    if p not in nivelde: continue
    niv, origen = nivelde[p], 'formula'
    if (nom, nac[:4]) in ya: niv, origen = ya[(nom, nac[:4])], 'base'
    m = a_mano(nom, nac)
    if m == 0: continue
    if m is not None: niv, origen = m, 'a mano'
    pos, rol = puesto(p)
    nacs = [NACION.get(x, x) for x in info.get(p, {}).get('nac', set()) if x]
    wj.writerow([nom, '', nac, nacs[0] if nacs else '', pos, niv, 'wikidata', '', rol, p, info.get(p, {}).get('sl', ''), origen])
    ps = [x for x in pasos[p] if x[2] is not None]
    for i, (club, pais, d, h, m, g) in enumerate(ps):
        h2 = max(d, h - 1) if h else None
        # Sin fecha de salida: hasta que empieza el siguiente club, o hasta los 36 años (como hace el motor)
        fin = h2 if h2 is not None else (max(d, ps[i + 1][2] - 1) if i + 1 < len(ps) else min(max(d, anio(nac) + 36), 2025))
        wc.writerow([nom, nac, club, pais, d, h2 if h2 is not None else '', m if m is not None else '', g if g is not None else '', '', ''])
        for a in range(max(d, 1950), fin + 1): cubre[(club, a)].add(p)
J.close(); C.close()
# Los más famosos de cada década, para ponerles nivel a mano
REV = open(OUT + 'revisar_figuras.csv', 'w', newline=''); wv = csv.writer(REV)
wv.writerow(['nombre', 'nacimiento', 'wikipedias', 'nivel_formula', 'nivel_a_mano'])
for dec, fs in sorted(por.items()):
    for f in sorted(fs, key=lambda f: f[8])[:max(8, round(len(fs) * 0.0072))]:
        p = f[0]; nom, nac = jug[p]
        if a_mano(nom, nac) is not None or (nom, nac[:4]) in ya: continue
        wv.writerow([nom, nac, info.get(p, {}).get('sl', ''), nivelde[p], ''])
REV.close()
# Lo que ya hay en la base (plantillas de cada país, datos de otras IA) también cuenta
for r in csv.DictReader(open(B + 'carreras.csv')):
    d = anio(r['desde'] or '')
    if d is None: continue
    h = anio(r['hasta'] or '') or d
    for a in range(max(d, 1950), h + 1): cubre[(r['club'], a)].add((r['nombre'], r['nacimiento'][:4]))
# Informe de relleno: primera división desde 1950 (Alemania desde 1954)
grandes = {c for c, v in gr.items() if v >= 25}
R = open(OUT + 'informe_relleno.csv', 'w', newline=''); wr = csv.writer(R)
wr.writerow(['pais', 'temporada', 'club', 'jugadores_reales', 'faltan_para_18', 'club_grande'])
res = collections.Counter(); tot = collections.Counter()
for r in csv.DictReader(open(B + 'ligas.csv')):
    t = int(r['temporada']); d = r['division']
    if t < 1950 or not (d in ('1', 'Primera') or d.startswith('1')) or (r['pais'] == 'Alemania' and t < 1954): continue
    n = len(cubre[(r['club'], t)]); falta = max(0, 18 - n)
    tot[r['pais']] += 1
    if falta:
        res[r['pais']] += 1
        wr.writerow([r['pais'], t, r['club'], n, falta, 'sí' if r['club'] in grandes else ''])
R.close()
print('a mano sin encontrar:', sorted({m[3] for m in MANO} - usadas))
print('jugadores', sum(1 for p in jug if p in nivelde), 'clubes-temporada con hueco por país', {p: f'{res[p]}/{tot[p]}' for p in tot})
