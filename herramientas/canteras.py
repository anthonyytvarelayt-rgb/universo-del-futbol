#!/usr/bin/env python3
"""Monta datos/canteras.js con las canteras reales (datos_fuente/base/canteras.csv) y los maestros de cada
entrenador (datos_fuente/base/maestros_entrenadores.csv). Solo se enseñan: no cambian los resultados del motor.
CANTERAS_REALES: jugador -> [club de formación, año de llegada, año de debut].
MAESTROS_REALES: entrenador -> [[maestro, relación (j jugador, a ayudante, d discípulo), club, desde, hasta], ...]"""
import csv, json, os, re
raiz = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
leer = lambda n: list(csv.DictReader(open(os.path.join(raiz, 'datos_fuente', 'base', n), encoding='utf-8')))
base = open(os.path.join(raiz, 'datos', 'base.js'), encoding='utf-8').read()
nombres = set(re.findall(r'"n":"([^"]+)"', base))
# Nombres de la lista que en la base se llaman de otra manera.
OTRO = {'Q207644': 'Cuauhtémoc Blanco', 'Raúl González Blanco': 'Raúl', 'Frank Watson  Lampard': 'Frank Lampard'}
alias = {f['otro']: f['club'] for f in leer('alias.csv')}
cant, faltan = {}, []
for f in leer('canteras.csv'):
    n = OTRO.get(f['jugador'], f['jugador'])
    if n not in nombres: faltan.append(n); continue
    cant[n] = [alias.get(f['club_formacion'], f['club_formacion']), int(f['anio_llegada']), int(f['anio_debut_primer_equipo'])]
# De cada pareja entrenador-maestro queda una fila: la relación más fuerte y, dentro de ella, la etapa más larga.
PESO = {'discipulo': 3, 'ayudante_de': 2, 'jugador_de': 1}
par = {}
for f in leer('maestros_entrenadores.csv'):
    d, h = (int(f['desde']) if f['desde'] else 0), (int(f['hasta']) if f['hasta'] else 0)
    k = (f['entrenador'], f['maestro']); v = (PESO[f['relacion']], h - d, f)
    a = par.get(k)
    if a and f['relacion'] == 'discipulo' and a[2]['club']: v = (3, a[1], dict(a[2], relacion='discipulo'))  # discípulo, con el club de la otra fila
    elif a and a[2]['relacion'] == 'discipulo' and not a[2]['club']: v = (3, h - d, dict(f, relacion='discipulo'))
    if not a or v[:2] > a[:2]: par[k] = v
mae = {}
for (e, m), (p, largo, f) in par.items():
    mae.setdefault(e, []).append((p, largo, [m, f['relacion'][0], f['club'], int(f['desde']) if f['desde'] else 0, int(f['hasta']) if f['hasta'] else 0]))
mae = {e: [x[2] for x in sorted(xs, key=lambda x: (-x[0], -x[1]))] for e, xs in mae.items()}
sal = 'self.CANTERAS_REALES = ' + json.dumps(cant, ensure_ascii=False, separators=(',', ':')) + ';\nself.MAESTROS_REALES = ' + json.dumps(mae, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(raiz, 'datos', 'canteras.js'), 'w', encoding='utf-8').write(sal)
print(len(cant), 'canteras;', len(faltan), 'no están en la base:', ', '.join(faltan))
print(len(mae), 'entrenadores con maestros;', sum(len(x) for x in mae.values()), 'relaciones;', round(len(sal) / 1024), 'KB')
