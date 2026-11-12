# Junta jugadores de Wikipedia (pt/en) y footballdatabase.eu y escribe portugal-1958-59-plantillas.csv
import json, csv, sys, re
sys.path.insert(0, '/tmp/claude-0/pt/scripts')
from rate import *

import selec as SEL

SEG = ['Atlético CP', 'Leixões', 'Boavista', 'Penafiel', 'Sanjoanense', 'Peniche', 'Portimonense', 'Farense', 'Chaves', 'Montijo', 'Oliveirense',
       'Oriental', 'Tirsense', 'Vila Real', 'Almada', 'Juventude de Évora']
FDB = {'71-benfica': 'Benfica', '73-fc_porto': 'Oporto', '94-sporting_cp': 'Sporting de Portugal', '834-os_belenenses': 'Belenenses',
       '831-vitoria_setubal': 'Vitória de Setúbal', '156-braga': 'Braga', '1830-barreirense': 'Barreirense', '662-academica': 'Académica',
       '5465-caldas': 'Caldas', '10628-lusitano_de_evora': 'Lusitano de Évora', '3882-fabril_do_barreiro': 'CUF'}
FPOS = {'Goalkeeper': 'POR', 'Defender': 'DEF', 'Midfield': 'MED', 'Midfielder': 'MED', 'Striker': 'DEL', 'Forward': 'DEL', 'Attacker': 'DEL'}

# nombres ya usados en la Copa de Europa (mismo jugador = mismo nombre), por fecha de nacimiento
COPA = {}
for f in ['copa-europa-1958-59-plantillas.csv', 'copa-europa-1959-63-plantillas.csv']:
    for r in csv.DictReader(open('/mnt/project-files/datos/' + f, encoding='utf-8')):
        if r.get('pais_club') == 'Portugal' and r['nac']:
            COPA.setdefault(r['nac'], r['nombre'])

sel = {}
for src in ['/tmp/claude-0/pt/wiki1.json', '/tmp/claude-0/pt/wiki2.json', '/tmp/claude-0/pt/wiki4.json']:
    for c, v in SEL.run(src).items(): sel.setdefault(c, []).extend(v)
fdb = json.load(open('/tmp/claude-0/pt/fdb.json'))

def fecha_fdb(s):
    m = re.match(r'(\d\d)/(\d\d)/(\d{4})', s or '')
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else ''

filas, notas = [], []
vistos = {}  # nacimiento+apellido -> club (un jugador solo en un club)
for club in PRIMEIRA + SEG:
    div = 'Primeira Divisão' if club in PRIMEIRA else 'Segunda Divisão'
    pr = PRES_PT(club)
    nseg = 26
    gente = []
    for p in sel.get(club, []):
        gente.append(p)
    # extras de footballdatabase.eu que no estén ya
    for fk, fc in FDB.items():
        if fc != club: continue
        for r in fdb.get(fk, []):
            b = fecha_fdb(r['bd'])
            if any(b and b == p['birth'] for p in gente): continue
            if any(norm(r['name'].split()[-1]) == norm(p['name'].split()[-1]) and (not b or not p['birth'] or b[:4] == p['birth'][:4]) for p in gente): continue
            if r['pos'] in ('Coach', 'Manager', ''): continue
            gente.append(dict(name=r['name'], full='', birth=b, pos=FPOS.get(r['pos'], 'MED'), stints=[], nat=[], lead=r['country'],
                              st=dict(a=1958, b=1959, club=club, pj=None, g=None), how='fdb', src=['footballdatabase.eu']))
    # quitar duplicados dentro del club (mismo apellido y año parecido, o un nombre dentro del otro)
    def tokens(p): return set(norm(p['name']).replace('-', ' ').split())
    def same(p, q):
        y1, y2 = (p['birth'] or '')[:4], (q['birth'] or '')[:4]
        close = not y1 or not y2 or abs(int(y1) - int(y2)) <= 1
        t1, t2 = tokens(p), tokens(q)
        return close and (norm(p['name'].split()[-1]) == norm(q['name'].split()[-1]) or t1 <= t2 or t2 <= t1)
    def score(p): return (p['how'] != 'fdb', bool(p['birth']), bool(p['nat']), p['src'][0].startswith('en'))
    limpio = []
    for p in sorted(gente, key=score, reverse=True):
        if any(same(p, q) for q in limpio): continue
        limpio.append(p)
    gente = limpio
    for p in gente:
        k = (p['birth'] or '?') + '|' + norm(p['name'].split()[-1])
        if p['birth'] and k in vistos:
            notas.append(f"{p['name']}: aparece en {vistos[k]} y {club}; se deja en {vistos[k]}"); continue
        vistos[k] = club
        a = age(p['birth'])
        pos = p['pos'] or 'MED'
        pj, g, est = temporada(p, nseg)
        if pos == 'POR': g = 0
        capst, capsb = caps(p)
        pais = pais_de(p) or ('Portugal' if 'Portug' in p.get('lead', '') or p['how'] == 'fdb' and 'Portugal' in p.get('lead', '') else 'Portugal')
        foreign = pais not in ('Portugal',) and capst == 0
        lvl = nivel(pos, pr, pj, g or 0, nseg, capsb, a, foreign)
        tec = max(lvl, techo(p, lvl, a, capst))
        nombre = COPA.get(p['birth'], p['name'])
        filas.append(dict(division=div, club=club, nombre=nombre, pos=pos, nac=p['birth'], pais=pais,
                          liga=f"{pj} / {g or 0}", nivel=lvl, techo=tec,
                          _est=est, _how=p['how'], _src=';'.join(p['src'])))
    n = sum(1 for f in filas if f['club'] == club)
    print(club, div, n)

# Relleno con jugadores ficticios (Anthony lo eligió el 2026-10-23): hasta 22 por club, columna ficticio = sí
import random
rnd = random.Random(1958)
NOM = ['António', 'Manuel', 'José', 'Joaquim', 'Francisco', 'João', 'Fernando', 'Carlos', 'Jorge', 'Mário', 'Alberto', 'Armando', 'Augusto', 'Américo',
       'Artur', 'Domingos', 'Eduardo', 'Ernesto', 'Fausto', 'Henrique', 'Hermínio', 'Horácio', 'Jaime', 'Júlio', 'Luís', 'Rui', 'Raul', 'Rogério',
       'Silvino', 'Vítor', 'Abel', 'Adelino', 'Álvaro', 'Arnaldo', 'Belmiro', 'Custódio', 'Delfim', 'Feliciano', 'Germano', 'Gaspar', 'Humberto']
APE = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes',
       'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira',
       'Monteiro', 'Cardoso', 'Rocha', 'Neves', 'Coelho', 'Cruz', 'Cunha', 'Pires', 'Ramos', 'Reis', 'Simões', 'Antunes', 'Matos', 'Fonseca',
       'Machado', 'Araújo', 'Barbosa', 'Tavares', 'Lourenço', 'Castro', 'Valente', 'Brito', 'Sequeira', 'Baptista', 'Freitas', 'Moura']
usados = {f['nombre'] for f in filas}
OBJ = {'POR': 3, 'DEF': 7, 'MED': 6, 'DEL': 6}
for club in PRIMEIRA + SEG:
    div = 'Primeira Divisão' if club in PRIMEIRA else 'Segunda Divisão'
    pr = PRES_PT(club)
    reales = [f for f in filas if f['club'] == club]
    falta = {k: max(0, v - sum(1 for f in reales if f['pos'] == k)) for k, v in OBJ.items()}
    n = max(0, 22 - len(reales))
    orden = [k for k in ('POR', 'DEF', 'MED', 'DEL') for _ in range(falta[k])]
    while len(orden) < n: orden.append(rnd.choice(['DEF', 'MED', 'DEL']))
    orden = orden[:n]
    if not orden: continue
    usados_pj = sum(int(f['liga'].split('/')[0]) for f in reales)
    resto = max(0, 26 * 11 - usados_pj)
    pesos = [rnd.uniform(0.2, 1.6) for _ in orden]
    for pos, w in zip(orden, pesos):
        while True:
            nm = rnd.choice(NOM) + ' ' + rnd.choice(APE)
            if nm not in usados: usados.add(nm); break
        y = rnd.randint(1927, 1939); b = f"{y}-{rnd.randint(1, 12):02d}-{rnd.randint(1, 28):02d}"
        a = age(b)
        pj = min(26, round(resto * w / sum(pesos)))
        g = 0 if pos in ('POR', 'DEF') else round(pj * rnd.uniform(0.05, 0.12 if pos == 'MED' else 0.4))
        lvl = nivel(pos, pr, pj, g, 26, 0, a, False)
        crece = 60 if a < 22 else 30 if a < 25 else 10 if a < 28 else 0
        tec = lvl + rnd.randint(0, crece) if crece else lvl
        filas.append(dict(division=div, club=club, nombre=nm, pos=pos, nac=b, pais='Portugal', liga=f"{pj} / {g}", nivel=lvl, techo=tec,
                          ficticio='sí', _est=True, _how='ficticio', _src=''))
for f in filas: f.setdefault('ficticio', 'no')

filas.sort(key=lambda f: (f['division'] != 'Primeira Divisão', PRIMEIRA.index(f['club']) if f['club'] in PRIMEIRA else 100 + SEG.index(f['club']), -f['nivel']))
cols = ['division', 'club', 'nombre', 'pos', 'nac', 'pais', 'liga', 'nivel', 'techo', 'ficticio']
with open('/mnt/project-files/datos/portugal-1958-59-plantillas.csv', 'w', encoding='utf-8', newline='') as fh:
    w = csv.DictWriter(fh, cols, extrasaction='ignore'); w.writeheader(); w.writerows(filas)
with open('/tmp/claude-0/pt/plantillas_detalle.csv', 'w', encoding='utf-8', newline='') as fh:
    w = csv.DictWriter(fh, cols + ['_est', '_how', '_src']); w.writeheader(); w.writerows(filas)
print(len(filas)); print('\n'.join(notas[:30]))
