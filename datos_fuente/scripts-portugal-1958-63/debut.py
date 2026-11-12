# Jugadores que entran en clubes de Primeira/Segunda de 1959-60 a 1962-63 (portugal-debutantes-1959-63.csv)
import json, csv, sys, re, datetime
sys.path.insert(0, '/tmp/claude-0/pt/scripts')
import rate
from rate import *
from parse import parse
from selec import KEY
import build_helpers as H

tabs = {int(k): v for k, v in json.load(open('/tmp/claude-0/pt/tabs.json')).items()}
N = H.N
def division(club, y):
    return 'Primeira Divisão' if club in [N.get(x, x) for x in tabs[y]] else 'Segunda Divisão'

ya = {}  # jugadores del CSV 1958-59, por nacimiento+apellido
for r in csv.DictReader(open('/mnt/project-files/datos/portugal-1958-59-plantillas.csv', encoding='utf-8')):
    ya[(r['nac'], norm(r['nombre'].split()[-1]))] = r['club']
COPA = {}
for f in ['copa-europa-1959-63-plantillas.csv']:
    for r in csv.DictReader(open('/mnt/project-files/datos/' + f, encoding='utf-8')):
        if r.get('pais_club') == 'Portugal' and r['nac']: COPA.setdefault(r['nac'], r['nombre'])
OTROS = {}  # jugadores ya en España / Italia / Copa (para no crearlos dos veces)
for f in ['espana-1958-59-plantillas.csv', 'italia-1958-59-plantillas.csv', 'espana-debutantes-1959-63.csv', 'italia-debutantes-1959-63.csv']:
    try:
        for r in csv.DictReader(open('/mnt/project-files/datos/' + f, encoding='utf-8')):
            if r['nac']: OTROS[(r['nac'], norm(r['nombre'].split()[-1]))] = f.split('-')[0]
    except FileNotFoundError: pass

filas = {}
for src in sys.argv[1:]:
    W = json.load(open(src))
    for club, langs in W.items():
        for lang in ('en', 'pt'):
            for title, t in (langs.get(lang) or {}).items():
                p = parse(title, t, lang)
                if not p or not p['birth']: continue
                k = (p['birth'], norm(p['name'].split()[-1]))
                if k in ya: continue
                COL = r'Lourenço Marques|Maputo|Luanda|Lobito|Beira\b|Moçambique|Mozambique|Angola|Nova Lisboa|Sá da Bandeira|Bissau|Cabo Verde|Mindelo|Goa'
                prev_pt = [s for s in p['stints'] if s['a'] < 1959 and not re.search(COL, s['club']) and any(re.search(KEY[c], s['club']) for c in KEY)]
                for s in p['stints']:
                    if not re.search(KEY[club], s['club']): continue
                    if not (1959 <= s['a'] <= 1962): continue
                    y = s['a']
                    if (k in filas and filas[k]['debut'] <= y): break
                    a = (datetime.date(y, 9, 1) - datetime.date(*map(int, p['birth'].split('-')))).days / 365.25 if len(p['birth']) == 10 else y - int(p['birth'][:4])
                    if a > 36 or a < 15: break
                    pais = pais_de(p) or 'Portugal'
                    antes = [x for x in p['stints'] if x['a'] < y and x is not s]
                    if prev_pt: tipo, nota = 'regresa', 'jugó en Portugal antes de 1958-59 (' + ', '.join(sorted({x['club'] for x in prev_pt}))[:80] + ')'
                    elif pais != 'Portugal':
                        tipo, nota = 'extranjero', ('viene de ' + antes[-1]['club']) if antes else ''
                    else:
                        tipo, nota = 'cantera', ('viene de ' + antes[-1]['club'] + (' (colonias)' if re.search(COL, antes[-1]['club']) else '')) if antes else ''
                    pr = PRES_PT(club)
                    n = max(1, (min(s['b'], 1972) - s['a']) if s['b'] > s['a'] else 1)
                    if s['pj'] is None: pj, g, est = 13, 0, True
                    else: pj, g, est = min(26, round(s['pj'] / n)), round((s['g'] or 0) / n), False
                    pos = p['pos'] or 'MED'
                    if pos == 'POR': g = 0
                    capst, capsb = caps(p, y - 5, y)
                    lvl = nivel(pos, pr, pj, g, 26, capsb, a, pais != 'Portugal' and capst == 0)
                    tec = max(lvl, techo(p, lvl, a, capst))
                    if k in OTROS: nota = (nota + '; ' if nota else '') + 'ya existe en los datos de ' + OTROS[k] + ': traspasar, no crear de nuevo'
                    if est: nota = (nota + '; ' if nota else '') + 'sin partidos en la fuente: 13 por temporada supuestos'
                    filas[k] = dict(division=division(club, y), club=club, nombre=COPA.get(p['birth'], p['name']), pos=pos, nac=p['birth'], pais=pais,
                                    liga=f"{pj} / {g}", nivel=lvl, techo=tec, debut=y, tipo=tipo, nota=nota)
                    break
ded = {}
for k, f in sorted(filas.items(), key=lambda kv: -len(kv[0][0])):
    k2 = (f['nac'][:4], norm(f['nombre'].split()[0]), f['club'])
    if k2 in ded: continue
    ded[k2] = f
F = sorted(ded.values(), key=lambda f: (f['debut'], f['division'] != 'Primeira Divisão', f['club'], -f['nivel']))
cols = ['division', 'club', 'nombre', 'pos', 'nac', 'pais', 'liga', 'nivel', 'techo', 'debut', 'tipo', 'nota']
with open('/mnt/project-files/datos/portugal-debutantes-1959-63.csv', 'w', encoding='utf-8', newline='') as fh:
    w = csv.DictWriter(fh, cols); w.writeheader(); w.writerows(F)
from collections import Counter
print(len(F), Counter(f['tipo'] for f in F), Counter(f['debut'] for f in F), Counter(f['division'] for f in F))
for f in F:
    if f['nivel'] > 700 or 'Eus' in f['nombre']: print(f)
