# Convierte la tabla de reglas (reglas-epoca-1930-2026.csv) en la tabla que lee el motor (motor/epoca.js).
# Uso: python3 datos/reglas_a_epoca.py   (reescribe solo lo que hay entre // <tabla> y // </tabla> en epoca.js)
import csv, json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(AQUI, 'reglas-epoca-1930-2026.csv')
EPOCA = os.path.join(AQUI, '..', 'motor', 'epoca.js')

# Correcciones sobre la tabla, con su motivo.
EXCEPCIONES = {
    # El cierre de 1962 dejó entrar a los que ya habían firmado para 1962-63 (hay 19 en los datos reales).
    ('España', 1962): {'ext': 1},
}

def numero(s, defecto):
    m = re.match(r'\s*(\d+)', s or '')
    return int(m.group(1)) if m else defecto

def abierto(texto):
    t = (texto or '').strip().lower()
    return 0 if t.startswith(('cerrado', 'prohibid')) else 1

filas = [x for x in csv.DictReader(open(CSV, encoding='utf-8')) if x['tipo'] == 'liga']
por_pais = {}
for x in filas:
    anio = int(x['anio_inicio'])
    juega = 1 if x['disputada'] == 'si' else 0
    t = {
        'desde': anio,
        'juega': juega,
        'liga': x['liga'],
        'puntos': numero(x['puntos_victoria'], None),
        'cambios': numero(x['cambios'], None),
        'ext': abierto(x['limite_extranjeros']),
        'cupo': x['limite_extranjeros'].strip(),
        'clubes': numero(x['clubes'], None),
    }
    t.update(EXCEPCIONES.get((x['pais'], anio), {}))
    por_pais.setdefault(x['pais'], {})[anio] = t  # si un año sale dos veces, vale la última fila

tabla = {}
for pais, anios in por_pais.items():
    tramos, prev = [], None
    for anio in sorted(anios):
        t = anios[anio]
        # Un año sin liga no cambia puntos ni cambios: hereda los del tramo anterior.
        if prev:
            for k in ('puntos', 'cambios', 'clubes'):
                if t[k] is None: t[k] = prev[k]
        clave = {k: v for k, v in t.items() if k != 'desde'}
        if prev is None or clave != {k: v for k, v in prev.items() if k != 'desde'}:
            tramos.append([t['desde'], t['juega'], t['puntos'], t['cambios'], t['ext'], t['clubes'], t['liga'], t['cupo']])
        prev = t
    tabla[pais] = tramos

bloque = ('// <tabla> (generado por datos/reglas_a_epoca.py desde datos/reglas-epoca-1930-2026.csv; no editar a mano)\n'
          '  // Cada tramo: [desde, se juega, puntos por victoria, cambios, entran extranjeros nuevos, clubes, liga, cupo de extranjeros]\n'
          '  const TABLA = ' + json.dumps(tabla, ensure_ascii=False, separators=(',', ':')).replace('],[', '],\n    [').replace(':[[', ':[\n    [') + ';\n'
          '  // </tabla>')
src = open(EPOCA, encoding='utf-8').read()
nuevo = re.sub(r'// <tabla>.*?// </tabla>', lambda m: bloque, src, flags=re.S)
assert nuevo != src or '// <tabla>' in src, 'faltan las marcas // <tabla> en epoca.js'
open(EPOCA, 'w', encoding='utf-8').write(nuevo)
print({p: len(t) for p, t in tabla.items()})
