# Convierte los CSV de la Copa de Europa en motor/europa_1958-63.json: 1958-59 con el cuadro real y 1959-60 a 1962-63 con sorteo libre.
import csv, json, collections
BASE = '/mnt/project-files/'
rows = list(csv.DictReader(open(BASE + 'datos/copa-europa-1958-59-plantillas.csv', encoding='utf-8')))
# Prestigio aproximado (copa-europa-1958-59-formato.md: Reims, Juventus y Wolves 880-900; MTK, Dukla, Schalke y Sporting ~800-830; Ards, Drumcondra y HPS ~420).
PRES = {'Stade de Reims': 900, 'Juventus': 890, 'Wolverhampton Wanderers': 880, 'MTK Budapest': 830, 'Dukla Praga': 820, 'Schalke 04': 810,
        'Sporting de Portugal': 800, 'Standard de Lieja': 760, 'Young Boys': 720, 'Wiener Sport-Club': 740, 'CDNA Sofía': 740, 'Heart of Midlothian': 720,
        'Dinamo Zagreb': 720, 'Wismut Karl-Marx-Stadt': 680, 'IFK Göteborg': 640, 'Beşiktaş': 640, 'Petrolul Ploiești': 620, 'Polonia Bytom': 640,
        'DOS Utrecht': 600, 'KB Copenhague': 580, 'Jeunesse Esch': 480, 'Ards': 420, 'Drumcondra': 420, 'HPS Helsinki': 420}
clubes = collections.OrderedDict()
for r in rows:
    c = clubes.setdefault(r['club'], {'nombre': r['club'], 'pais': r['pais_club'], 'prestigio': PRES.get(r['club'], 600), 'jugadores': [], 'extranjero': True})
    nac = r['nac'][:10] if r['nac'] and 'solo año' not in r['nac'] else (r['nac'][:4] + '-07-01' if r['nac'] else '1930-07-01')
    c['jugadores'].append({'n': r['nombre'], 'pos': r['pos'], 'nac': nac, 'pais': r['pais'], 'niv': int(r['nivel']), 'tec': int(r['techo']),
                           'pjCopa': int(r['pj_copa'] or 0), 'gCopa': int(r['goles_copa'] or 0)})
# Delanteros: en la WM hay tres por dentro (8, 9 y 10) y dos extremos; los que más marcan van por dentro.
for c in clubes.values():
    dels = sorted([j for j in c['jugadores'] if j['pos'] == 'DEL'], key=lambda j: (-j['gCopa'] / max(1, j['pjCopa']), -j['niv']))
    k = max(1, round(len(dels) * 0.6))
    for i, j in enumerate(dels):
        j['rol'] = 'DC' if i < k else 'EXT'
# Cuadro real. a juega la ida en casa; en "real" cada resultado va con el de casa primero. Las referencias a otra eliminatoria son su id. "real" es el resultado histórico.
P = lambda id, a, b, real, **k: dict(id=id, a=a, b=b, real=real, **k)
cuadro = [
  {'nombre': 'Ronda previa', 'cruces': [
    P('p1', 'Juventus', 'Wiener Sport-Club', '3-1 · 7-0'), P('p2', 'Dinamo Zagreb', 'Dukla Praga', '2-2 · 2-1'),
    P('p3', 'KB Copenhague', 'Schalke 04', '3-0 · 5-2 · 1-3 (des.)'), P('p4', 'Atlético Madrid', 'Drumcondra', '8-0 · 1-5'),
    P('p5', 'Wismut Karl-Marx-Stadt', 'Petrolul Ploiești', '4-2 · 2-0 · 4-0 (des.)'), P('p6', 'Jeunesse Esch', 'IFK Göteborg', '1-2 · 0-1 · 1-5 (des.)'),
    P('p7', 'Polonia Bytom', 'MTK Budapest', '0-3 · 3-0'), P('p8', 'DOS Utrecht', 'Sporting de Portugal', '3-4 · 2-1'),
    P('p9', 'Standard de Lieja', 'Heart of Midlothian', '5-1 · 2-1'), P('p10', 'Ards', 'Stade de Reims', '1-4 · 6-2'),
    P('p11', 'Beşiktaş', None, 'Olympiakos se retiró', sinRival='Olympiakos se retiró'),
    P('p12', 'Young Boys', None, 'el Manchester United no jugó', sinRival='el Manchester United no jugó (la federación inglesa no le dejó tras Múnich)')]},
  {'nombre': 'Octavos de final', 'cruces': [
    P('o1', 'Real Madrid', 'p11', '2-0 · 1-1'), P('o2', 'p1', 'p2', '3-1 · 1-0'), P('o3', 'Wolverhampton Wanderers', 'p3', '2-2 · 2-1'),
    P('o4', 'p4', 'CDNA Sofía', '2-1 · 1-0 · 3-1 (des., pró.)'), P('o5', 'p7', 'p12', '1-2 · 4-1'), P('o6', 'p6', 'p5', '2-2 · 4-0'),
    P('o7', 'p8', 'p9', '2-3 · 3-0'), P('o8', 'p10', 'HPS Helsinki', '4-0 · 0-3')]},
  {'nombre': 'Cuartos de final', 'cruces': [
    P('c1', 'o2', 'o1', '0-0 · 7-1'), P('c2', 'o4', 'o3', '3-0 · 1-1'), P('c3', 'o5', 'o6', '2-2 · 0-0 · 2-1 (des.)'), P('c4', 'o7', 'o8', '2-0 · 3-0')]},
  {'nombre': 'Semifinales', 'cruces': [P('s1', 'c1', 'c2', '2-1 · 1-0 · 2-1 (des.)'), P('s2', 'c3', 'c4', '1-0 · 3-0')]},
  {'nombre': 'Final', 'cruces': [P('f', 's1', 's2', '2-0', final=True, sede='Neckarstadion, Stuttgart')]}]
REAL = {'p1': 'Wiener Sport-Club', 'p2': 'Dukla Praga', 'p3': 'Schalke 04', 'p4': 'Atlético Madrid', 'p5': 'Wismut Karl-Marx-Stadt', 'p6': 'IFK Göteborg',
        'p7': 'MTK Budapest', 'p8': 'Sporting de Portugal', 'p9': 'Standard de Lieja', 'p10': 'Stade de Reims', 'p11': 'Beşiktaş', 'p12': 'Young Boys',
        'o1': 'Real Madrid', 'o2': 'Wiener Sport-Club', 'o3': 'Schalke 04', 'o4': 'Atlético Madrid', 'o5': 'Young Boys', 'o6': 'Wismut Karl-Marx-Stadt',
        'o7': 'Standard de Lieja', 'o8': 'Stade de Reims', 'c1': 'Real Madrid', 'c2': 'Atlético Madrid', 'c3': 'Young Boys', 'c4': 'Stade de Reims',
        's1': 'Real Madrid', 's2': 'Stade de Reims', 'f': 'Real Madrid'}
for ro in cuadro:
    for c in ro['cruces']:
        c['ganadorReal'] = REAL[c['id']]
        c['realA'], c['realB'] = REAL.get(c['a'], c['a']), REAL.get(c['b'], c['b'])
ediciones = [{'anio': 1958, 'nombre': 'Copa de Europa', 'espanoles': ['Real Madrid', 'Atlético Madrid'], 'clubes': list(clubes.values()), 'cuadro': cuadro, 'goleadorReal': 'Just Fontaine (Stade de Reims), 10 goles'}]

# 1959-60 a 1962-63: clubes extranjeros reales de cada edición; los españoles y el vigente salen de la partida y el sorteo es libre.
GOLEADOR = {1959: 'Ferenc Puskás (Real Madrid), 12 goles', 1960: 'José Águas (Benfica), 11 goles', 1961: 'Ferenc Puskás (Real Madrid), 7 goles', 1962: 'José Altafini (Milan), 14 goles'}
part = list(csv.DictReader(open(BASE + 'datos/copa-europa-1959-63-participantes.csv', encoding='utf-8')))
plan = list(csv.DictReader(open(BASE + 'datos/copa-europa-1959-63-plantillas.csv', encoding='utf-8')))
# Entraron solo porque Benfica ocupó la plaza de vigente: en la partida juegan solo si el vigente simulado es el Benfica.
SI_VIGENTE = {('1961-62', 'Sporting de Portugal'): 'Benfica', ('1962-63', 'Benfica'): 'Benfica'}
for temp in ['1959-60', '1960-61', '1961-62', '1962-63']:
    cl = collections.OrderedDict()
    for x in part:
        if x['temporada'] != temp or x['pais'] == 'España' or not x['con_alineaciones'].startswith('sí'):
            continue
        c = {'nombre': x['club'], 'pais': x['pais'], 'prestigio': int(x['prestigio'] or 600), 'jugadores': [], 'extranjero': True}
        if (temp, x['club']) in SI_VIGENTE:
            c['siVigente'] = SI_VIGENTE[(temp, x['club'])]
        cl[x['club']] = c
    for r in plan:
        if r['temporada'] != temp or r['club'] not in cl:
            continue
        nac = r['nac'][:10] if r['nac'] and 'solo año' not in r['nac'] else (r['nac'][:4] + '-07-01' if r['nac'] else '1930-07-01')
        cl[r['club']]['jugadores'].append({'n': r['nombre'], 'pos': r['pos'], 'nac': nac, 'pais': r['pais'], 'niv': int(r['nivel']), 'tec': int(r['techo']),
                                           'pjCopa': int(r['pj_copa'] or 0), 'gCopa': int(r['goles_copa'] or 0)})
    for c in cl.values():
        dels = sorted([j for j in c['jugadores'] if j['pos'] == 'DEL'], key=lambda j: (-j['gCopa'] / max(1, j['pjCopa']), -j['niv']))
        kk = max(1, round(len(dels) * 0.6))
        for i, j in enumerate(dels):
            j['rol'] = 'DC' if i < kk else 'EXT'
    vacios = [n for n, c in cl.items() if len(c['jugadores']) < 11]
    assert not vacios, (temp, vacios)
    ediciones.append({'anio': int(temp[:4]), 'nombre': 'Copa de Europa', 'clubes': list(cl.values()), 'goleadorReal': GOLEADOR[int(temp[:4])]})

json.dump(ediciones, open(BASE + 'motor/europa_1958-63.json', 'w', encoding='utf-8'), ensure_ascii=False)
for e in ediciones:
    print(e['anio'], len(e['clubes']), 'clubes', sum(len(c['jugadores']) for c in e['clubes']), 'jugadores', [c['nombre'] for c in e['clubes'] if c.get('siVigente')])
