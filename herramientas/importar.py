# Mete en la base los CSV que Anthony sube (hechos con ChatGPT o Gemini siguiendo el plan) y vuelve a montar base.json.
# Uso: python3 motor/importar.py [archivo ...]     (sin archivos: mira las subidas nuevas de uploads/hearth/)
# Reconoce cada archivo por su cabecera (ligas, clubes, jugadores, carreras), aunque venga entre ```csv … ```.
# Nombres de club distintos para el mismo club (Athletic Club / Atlético Bilbao) se unifican con datos/base/alias.csv.
import csv, html, io, os, re, subprocess, sys, unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('BASE_DIR') or os.path.join(AQUI, '..', 'datos', 'base')  # BASE_DIR: para probar en una copia
SUBIDAS = os.path.join(AQUI, '..', 'uploads', 'hearth')
HECHOS = os.path.join(BASE, 'importados.txt')
TIPOS = {
    'ligas': ['pais', 'temporada', 'division', 'grupo', 'club', 'posicion'],
    'clubes': ['club', 'pais', 'ciudad', 'fundacion', 'color1', 'color2', 'estadio'],
    'jugadores': ['nombre', 'nombre_completo', 'nacimiento', 'nacionalidad', 'posicion', 'nivel_max', 'fuente'],
    'carreras': ['nombre', 'nacimiento', 'club', 'pais', 'desde', 'hasta', 'partidos', 'goles'],
    'entrenadores': ['nombre', 'nacionalidad', 'club', 'pais', 'desde', 'hasta'],
}

def leer_base(nombre):
    ruta = os.path.join(BASE, nombre)
    if not os.path.exists(ruta): return [], []
    r = csv.DictReader(open(ruta, encoding='utf-8-sig'))
    return list(r), r.fieldnames

def escribir_base(nombre, filas, columnas):
    with open(os.path.join(BASE, nombre), 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, columnas, extrasaction='ignore'); w.writeheader(); w.writerows(filas)

def plano(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'\b(fc|cf|sc|ac|cd|ud|sd|rcd|club|de|futbol|football|calcio|sv|vfb|vfl|1\.)\b', ' ', s)
    return re.sub(r'[^a-z0-9]+', '', s)

def bloques(texto):
    # Uno o varios bloques CSV; si vienen entre ``` se toma cada bloque por separado.
    partes = re.findall(r'```(?:csv)?\s*\n(.*?)```', texto, re.S)
    return partes or [texto]

def tipo_de(cabecera):
    c = [x.strip().lower() for x in cabecera]
    for t, cols in TIPOS.items():
        if c[:len(cols)] == cols or set(cols) <= set(c): return t
    return None

alias = {f['otro']: f['club'] for f in leer_base('alias.csv')[0]}
clubes, col_clubes = leer_base('clubes.csv')
por_plano = {plano(c['club']): c['club'] for c in clubes}
desconocidos = set()
def club_de(nombre):
    nombre = (nombre or '').strip()
    if nombre in alias: return alias[nombre]
    if any(c['club'] == nombre for c in clubes): return nombre
    p = plano(nombre)
    if p in por_plano: return por_plano[p]
    desconocidos.add(nombre)
    return nombre

archivos = sys.argv[1:]
hechos = set(open(HECHOS).read().split()) if os.path.exists(HECHOS) else set()
if not archivos and os.path.isdir(SUBIDAS):
    archivos = [os.path.join(SUBIDAS, f) for f in sorted(os.listdir(SUBIDAS)) if f not in hechos]

nuevos = {t: [] for t in TIPOS}
for ruta in archivos:
    try: texto = html.unescape(open(ruta, encoding='utf-8-sig').read())  # &#39; → ' (copiado de algunas IA)
    except UnicodeDecodeError: print('no es texto:', ruta); continue
    for b in bloques(texto):
        filas = list(csv.reader(io.StringIO(b.strip())))
        if not filas: continue
        t = tipo_de(filas[0])
        if not t: continue
        cab = [x.strip().lower() for x in filas[0]]
        nuevos[t] += [dict(zip(cab, [v.strip() for v in f])) for f in filas[1:] if any(v.strip() for v in f)]
        print(os.path.basename(ruta), '→', t, len(filas) - 1, 'filas')
    hechos.add(os.path.basename(ruta))

# Clubes nuevos primero, para que las ligas y carreras los reconozcan.
for f in nuevos['clubes']:
    if not any(c['club'] == club_de(f['club']) for c in clubes):
        clubes.append({k: f.get(k, '') for k in col_clubes}); por_plano[plano(f['club'])] = f['club']
    else:  # completa los datos que falten
        c = next(c for c in clubes if c['club'] == club_de(f['club']))
        for k in ('ciudad', 'fundacion', 'color1', 'color2', 'estadio'):
            if not c.get(k) and f.get(k): c[k] = f[k]
escribir_base('clubes.csv', clubes, col_clubes)

# Ligas: una temporada completa que llega sustituye a lo que hubiera de esa temporada y país,
# salvo 1958 (la partida de ahora), donde solo se copian las posiciones.
ligas, col_ligas = leer_base('ligas.csv')
llegan = {}
for f in nuevos['ligas']:
    f['club'] = club_de(f['club'])
    llegan.setdefault((f['pais'], f['temporada']), []).append(f)
for (pais, temp), filas in llegan.items():
    if temp == '1958':
        pos = {f['club']: f.get('posicion', '') for f in filas}
        for x in ligas:
            if x['pais'] == pais and x['temporada'] == '1958' and x['club'] in pos and not x['posicion']: x['posicion'] = pos[x['club']]
        continue
    divs = {f['division'] for f in filas}  # solo se sustituyen las divisiones que llegan (si solo llega Primera, la Segunda se queda)
    ligas = [x for x in ligas if not (x['pais'] == pais and x['temporada'] == temp and x['division'] in divs)] + [dict(f, nota='') for f in filas]
escribir_base('ligas.csv', ligas, col_ligas)

# Jugadores y carreras: se añaden los que no estén (misma persona = mismo nombre y nacimiento).
jugadores, col_j = leer_base('jugadores.csv')
claves = {(j['nombre'], j['nacimiento']) for j in jugadores}
for f in nuevos['jugadores']:
    if (f['nombre'], f['nacimiento']) not in claves:
        jugadores.append(f); claves.add((f['nombre'], f['nacimiento']))
escribir_base('jugadores.csv', jugadores, col_j)
carreras, col_c = leer_base('carreras.csv')
pasos = {(c['nombre'], c['nacimiento'], c['club'], c['desde']) for c in carreras}
for f in nuevos['carreras']:
    f['club'] = club_de(f['club'])
    if (f['nombre'], f['nacimiento'], f['club'], f['desde']) not in pasos:
        carreras.append(f); pasos.add((f['nombre'], f['nacimiento'], f['club'], f['desde']))
escribir_base('carreras.csv', carreras, col_c)

# Entrenadores: se añaden los periodos que no estén (mismo nombre, club y temporada de inicio).
entrenadores, col_e = leer_base('entrenadores.csv')
periodos = {(e['nombre'], e['club'], e['desde']) for e in entrenadores}
for f in nuevos['entrenadores']:
    f['club'] = club_de(f['club'])
    if (f['nombre'], f['club'], f['desde']) not in periodos:
        entrenadores.append(f); periodos.add((f['nombre'], f['club'], f['desde']))
escribir_base('entrenadores.csv', entrenadores, col_e)

open(HECHOS, 'w').write('\n'.join(sorted(hechos)) + '\n')
if desconocidos:
    print('clubes sin ficha (añadir a clubes.csv o a alias.csv):', sorted(desconocidos)[:40], '…' if len(desconocidos) > 40 else '')
print({t: len(v) for t, v in nuevos.items()})
if not os.environ.get('BASE_DIR'): subprocess.run([sys.executable, os.path.join(AQUI, 'base.py')])
