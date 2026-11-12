# Convierte las plantillas reales de clubes de fuera de la partida (CSV de datos_fuente/fuera/) en la tabla
# PLANTILLAS_FUERA de js/mundo.js. Uso: python3 herramientas/plantillas_fuera.py  (reescribe el bloque entre marcas)
import csv, glob, json, os, re
AQUI = os.path.dirname(os.path.abspath(__file__))
CLUB = {'AFC Ajax': 'Ajax', 'Celtic FC': 'Celtic', 'RSC Anderlecht': 'Anderlecht'}
POS = {'POR': ('POR', 'POR'), 'DFC': ('DEF', 'DEF'), 'LD': ('DEF', 'DEF'), 'LI': ('DEF', 'DEF'), 'MCD': ('MED', 'MED'), 'MC': ('MED', 'MED'),
       'MCO': ('MED', 'MED'), 'MP': ('DEL', 'DC'), 'ED': ('DEL', 'EXT'), 'EI': ('DEL', 'EXT'), 'DC': ('DEL', 'DC')}
t = {}
for f in sorted(glob.glob(os.path.join(AQUI, '..', 'datos_fuente', 'fuera', '*.csv'))):
    for r in csv.DictReader(open(f, encoding='utf-8-sig')):
        club = CLUB.get(r['club'], r['club'])
        m = re.match(r'(\d{4})-(\d{4})', r['epoca_temporadas'])
        if r['posicion'] not in POS or not m: print('aparto', r); continue
        pos, rol = POS[r['posicion']]
        t.setdefault(club, []).append([r['nombre_jugador'], pos, rol, int(m.group(1)), int(m.group(2)), int(r['año_nacimiento']), r['nacionalidad']])
bloque = '  const PLANTILLAS_FUERA = {\n' + ',\n'.join('    ' + json.dumps(c, ensure_ascii=False) + ': ' + json.dumps(js, ensure_ascii=False, separators=(',', ':')) for c, js in sorted(t.items())) + '\n  };\n'
p = os.path.join(AQUI, '..', 'js', 'mundo.js'); s = open(p, encoding='utf-8').read()
a, b = '  /*PLANTILLAS_FUERA*/\n', '  /*FIN_PLANTILLAS_FUERA*/\n'
i, j = s.index(a) + len(a), s.index(b)
open(p, 'w', encoding='utf-8').write(s[:i] + bloque + s[j:])
print({c: len(js) for c, js in t.items()})
