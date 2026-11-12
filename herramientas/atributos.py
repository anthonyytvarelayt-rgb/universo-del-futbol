#!/usr/bin/env python3
"""Monta datos/atributos.js con los atributos puestos a mano (datos_fuente/base/atributos.csv).
Orden: definición, desmarque, pase, visión, regate, velocidad, físico, defensa, aéreo, portería.
Avisa de los nombres que no están en la base."""
import csv, json, os, re
raiz = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
base = open(os.path.join(raiz, 'datos', 'base.js'), encoding='utf-8').read()
nombres = set(re.findall(r'"n":"([^"]+)"', base))
cols = ['definicion', 'desmarque', 'pase', 'vision', 'regate', 'velocidad', 'fisico', 'defensa', 'aereo', 'porteria']
sal, faltan = {}, []
for f in csv.DictReader(open(os.path.join(raiz, 'datos_fuente', 'base', 'atributos.csv'), encoding='utf-8')):
    if f['nombre'] not in nombres: faltan.append(f['nombre'])
    sal[f['nombre']] = [int(float(f[c])) for c in cols]
open(os.path.join(raiz, 'datos', 'atributos.js'), 'w', encoding='utf-8').write('self.ATRIBUTOS_A_MANO = ' + json.dumps(sal, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(sal), 'jugadores con atributos a mano;', len(faltan), 'no están en la base:', ', '.join(faltan))
