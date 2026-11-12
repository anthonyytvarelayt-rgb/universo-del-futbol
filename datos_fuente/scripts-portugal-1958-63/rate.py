# Nivel y techo de los jugadores de Portugal 1958-59 (misma regla que España / Italia).
import json, re, csv, sys, datetime, unicodedata
sys.path.insert(0, '/tmp/claude-0/pt/scripts')
from clubes import pres as PRES_PT

REF = datetime.date(1958, 9, 1)
PRIMEIRA = ['Oporto', 'Benfica', 'Belenenses', 'Sporting de Portugal', 'Vitória de Guimarães', 'Vitória de Setúbal', 'Braga', 'Covilhã',
            'Lusitano de Évora', 'Académica', 'CUF', 'Barreirense', 'Caldas', 'Torreense']
# prestigio aproximado de clubes extranjeros y portugueses fuera de la tabla, para el techo
FOREIGN = {'Real Madrid': 985, 'Barcelona': 915, 'Atlético Madrid': 800, 'Atlético de Madrid': 800, 'Valencia': 760, 'Sevilla': 700, 'Inter': 880,
           'Milan': 870, 'Juventus': 950, 'Roma': 750, 'Fiorentina': 780, 'Austria Wien': 650, 'Austria Vienna': 650, 'Flamengo': 800,
           'Vasco': 780, 'Botafogo': 780, 'Fluminense': 760, 'Santos': 800, 'São Paulo': 760, 'Palmeiras': 760, 'Corinthians': 760}
PAISES = [('Portug', 'Portugal'), ('Brazil', 'Brasil'), ('Brasil', 'Brasil'), ('brasileir', 'Brasil'), ('Argentin', 'Argentina'), ('Urugua', 'Uruguay'),
          ('Spanish', 'España'), ('Espanh', 'España'), ('Spain', 'España'), ('Hungar', 'Hungría'), ('Húngar', 'Hungría'), ('Paragua', 'Paraguay'),
          ('Chile', 'Chile'), ('Peru', 'Perú'), ('Yugoslav', 'Yugoslavia'), ('Jugosla', 'Yugoslavia'), ('Ital', 'Italia'), ('French', 'Francia'),
          ('Franc', 'Francia'), ('Austria', 'Austria'), ('Cape Verd', 'Portugal'), ('Angol', 'Portugal'), ('Mozambi', 'Portugal'), ('Moçambi', 'Portugal')]

def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')

def club_pres(name):
    for k, v in FOREIGN.items():
        if k.lower() in name.lower(): return v
    KEYS = {'Benfica': 'Benfica', 'Porto': 'Oporto', 'Sporting CP': 'Sporting de Portugal', 'Sporting Clube de Portugal': 'Sporting de Portugal',
            'Belenenses': 'Belenenses', 'Académica': 'Académica', 'Setúbal': 'Vitória de Setúbal', 'Vitória F': 'Vitória de Setúbal',
            'Guimarães': 'Vitória de Guimarães', 'Vitória S': 'Vitória de Guimarães', 'Braga': 'Braga', 'Covilhã': 'Covilhã', 'Lusitano': 'Lusitano de Évora',
            'CUF': 'CUF', 'Fabril': 'CUF', 'Barreirense': 'Barreirense', 'Caldas': 'Caldas', 'Torreense': 'Torreense', 'Atlético': 'Atlético CP',
            'Leixões': 'Leixões', 'Boavista': 'Boavista', 'Olhanense': 'Olhanense', 'Estoril': 'Estoril', 'Salgueiros': 'Salgueiros', 'Oriental': 'Oriental'}
    for k, v in KEYS.items():
        if k in name: return PRES_PT(v)
    return 380

def age(b):
    try:
        y, m, d = map(int, b.split('-')); return (REF - datetime.date(y, m, d)).days / 365.25
    except Exception:
        return 1958 - int(b[:4]) if re.match(r'\d{4}', b or '') else 26

def pais_de(p):
    for n in p['nat']:
        t = n['team'] or ''
        if 'PRT' in t or 'POR' in t or 'Portugal' in t: return 'Portugal'
        for k, v in PAISES:
            if k in t: return v
    lead = p.get('lead', '')[:400]
    for k, v in PAISES:
        if k in lead: return v
    return ''

def caps(p, lo=1953, hi=1958):
    tot = prev = 0
    for n in p['nat']:
        c = n['caps'] or 0; tot += c
        if n['y']:
            a, b = n['y']; b = min(b, 1972) if b != 9999 else 1972
            span = max(1, b - a + 1); ov = max(0, min(b, hi) - max(a, lo) + 1)
            prev += c * ov / span
    return tot, round(prev)

def temporada(p, nseg):
    s = p['st']; n = max(1, (min(s['b'], 1972) - s['a']) if s['b'] > s['a'] else 1)
    if s['pj'] is None: return 13, None, True
    pj = min(nseg, round(s['pj'] / n)); g = round((s['g'] or 0) / n) if s['g'] is not None else 0
    return pj, g, False

def techo(p, lvl, a, capst):
    sc = []
    for s in p['stints']:
        n = max(1, s['b'] - s['a']) if s['b'] != 9999 else max(1, 1972 - s['a'])
        reg = s['pj'] is not None and s['pj'] / n >= 15
        if not reg: continue
        for y in range(max(s['a'], 1959), min(s['b'] if s['b'] != 9999 else 1972, 1972)):
            sc.append(280 + 0.55 * club_pres(s['club']))
    sc.sort(reverse=True)
    F = (sum(sc[:3]) / 3 if len(sc) >= 3 else (sum(sc) / len(sc) if sc else 0)) + 3 * min(capst, 30)
    if len(sc) < 3: F -= 40 * (3 - len(sc))
    if a < 22: gc, mn = 500, 30
    elif a < 25: gc, mn = 150, 15
    elif a < 28: gc, mn = 50, 8
    elif a < 30: gc, mn = 15, 3
    else: gc, mn = 5, 0
    return int(round(min(lvl + max(mn, min(gc, F - lvl)), 1000)))

def nivel(pos, pr, pj, g, nseg, capsb, a, foreign_bonus):
    share = min(pj / nseg, 1)
    lvl = 300 + 0.45 * pr + 120 * (share - 0.5) + 6 * min(capsb, 25)
    if pos == 'DEL' and pj > 0: lvl += 140 * min(g / (pj + 6), 1) * share
    if foreign_bonus: lvl += 40
    if a < 20: lvl -= 30
    if a > 33: lvl -= 20 * (a - 33)
    return round(lvl)
