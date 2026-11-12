# Taça de Portugal 1958-59: partidos desde de.wikipedia (Taça de Portugal 1958/59), mismo formato que la Coppa Italia
import re, csv
M = {'Benfica Lissabon': 'Benfica', 'FC Porto': 'Oporto', 'Sporting Lissabon': 'Sporting de Portugal', 'Belenenses Lissabon': 'Belenenses',
     'Académica de Coimbra': 'Académica', 'Vitória Setúbal': 'Vitória de Setúbal', 'Vitória Guimarães': 'Vitória de Guimarães', 'Sporting Braga': 'Braga',
     'SC Covilhã': 'Covilhã', 'Lusitano GC Évora': 'Lusitano de Évora', 'SC União Torreense': 'Torreense', 'Caldas SC': 'Caldas',
     'Atlético CP': 'Atlético CP', 'Almada AC': 'Almada', 'GD Chaves': 'Chaves', 'Juventude Évora': 'Juventude de Évora', 'Leixões SC': 'Leixões',
     'CD Montijo': 'Montijo', 'UD Oliveirense': 'Oliveirense', 'Clube Oriental de Lisboa': 'Oriental', 'GD Peniche': 'Peniche',
     'Portimonense SC': 'Portimonense', 'FC Tirsense': 'Tirsense', 'SC Vila Real': 'Vila Real', 'Marítimo Funchal': 'Marítimo',
     'Ferroviário Maputo': 'Ferroviário de Lourenço Marques'}
FECHAS = {'1.ª ronda': ('1959-05-03', '1959-05-10'), 'Octavos': ('1959-05-24', '1959-05-28'), 'Cuartos': ('1959-06-29', '1959-07-05'), 'Semifinal': ('1959-07-08', '1959-07-12')}
s = open('/tmp/claude-0/pt/taca.txt').read()
rows = []
for sec, ronda in [('== 1. Runde', '1.ª ronda'), ('== Achtelfinale', 'Octavos'), ('== Viertelfinale', 'Cuartos'), ('== Halbfinale', 'Semifinal')]:
    i = s.find(sec); j = s.find('\n== ', i + 5); part = s[i:j]
    for m in re.finditer(r'\{\{TwoLegResult\|(.*?)\}\}\n', part):
        f = [x.strip() for x in m.group(1).split('|')]
        def team(x):
            x = re.sub(r"'''", '', x); x = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', x).strip(); return M.get(x, x)
        body = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'[[\1]]', m.group(1).replace('{{0}}', ''))
        cells = body.split('||')
        t1 = team(cells[0]); t2 = team(cells[1].split('|', 1)[1])
        legs = re.findall(r'(\d+):(\d+)', cells[2])
        (a1, b1), (a2, b2) = legs[0], legs[1]
        d1, d2 = FECHAS[ronda]
        rows.append([ronda + ' (ida)', d1, t1, a1, b1, t2, 'no'])
        rows.append([ronda + ' (vuelta)', d2, t2, b2, a2, t1, 'no'])
rows.append(['Final', '1959-07-19', 'Benfica', 1, 0, 'Oporto', 'no'])
with open('/mnt/project-files/datos/portugal-taca-1958-59-partidos.csv', 'w', newline='', encoding='utf-8') as fh:
    w = csv.writer(fh); w.writerow(['ronda', 'fecha', 'local', 'goles_local', 'goles_visitante', 'visitante', 'prorroga']); w.writerows(rows)
print(len(rows)); [print(r) for r in rows[:4] + rows[-6:]]
