#!/usr/bin/env python3
"""Monta y comprueba los entrenadores de inicio de Primera, sin consultar la red.

Uso: python3 herramientas/entrenadores.py [--montar]
Después de --montar: python3 herramientas/base.py
La procedencia y la precisión de cada temporada están en inicios.csv.
"""
import argparse
import collections
import csv
import itertools
import json
from pathlib import Path
import re
import unicodedata

RAIZ = Path(__file__).resolve().parents[1]
BASE = RAIZ / 'datos_fuente/base'
DATOS = BASE / 'entrenadores_1960_2025'


def leer(ruta):
    with ruta.open(encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))


def escribir(ruta, filas, campos):
    with ruta.open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=campos, lineterminator='\n')
        w.writeheader()
        w.writerows(filas)


def clave(f):
    return f['pais'], f['club'], int(f['temporada'])


def objetivos():
    en_ligas = {clave(f) for f in leer(BASE / 'ligas.csv')
                if f['division'] == '1' and not f['nota']
                and 1960 <= int(f['temporada']) <= 2025}
    # Tres ligas reales de 2025-26 todavía no tienen filas en ligas.csv.
    # Sus participantes se documentan aparte sin alterar las competiciones.
    return en_ligas | {clave(f) for f in leer(DATOS / 'objetivos_fuera_ligas.csv')}


def normalizar(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower())
                   if c.isalnum() and not unicodedata.combining(c))


def montar(inicios, todos):
    anteriores = leer(BASE / 'entrenadores.csv')
    campos = list(anteriores[0])
    for c in ('nacimiento', 'fuente', 'fuente_biografia', 'criterio'):
        if c not in campos:
            campos.append(c)
    filas = []
    # Conserva las temporadas ajenas al encargo, incluidos los relevos de 1958–59.
    # Si un intervalo cruza años del encargo, conserva cada tramo exterior.
    for f in anteriores:
        fuera = [y for y in range(int(f['desde']), int(f['hasta']) + 1)
                 if (f['pais'], f['club'], y) not in todos]
        for _, tramo in itertools.groupby(enumerate(fuera), lambda x: x[1] - x[0]):
            anios = [x[1] for x in tramo]
            filas.append(dict(f, desde=str(anios[0]), hasta=str(anios[-1])))
    rasgos = leer(DATOS / 'rasgos.csv')
    nuevos = []
    for f in sorted(inicios, key=clave):
        y = int(f['temporada'])
        r = {c: '' for c in campos}
        r.update(nombre=f['nombre'], nacionalidad=f['nacionalidad'], nacimiento=f['nacimiento'],
                 pais=f['pais'], club=f['club'], desde=str(y), hasta=str(y), fuente=f['fuente'],
                 fuente_biografia=f['persona'], criterio=f['criterio'])
        for t in rasgos:
            if (t['nombre'] == r['nombre'] and t['club'] == r['club']
                    and int(t['desde']) <= y <= int(t['hasta'])):
                for c in ('estilo', 'fisico', 'merito'):
                    r[c] = t[c]
        # Los intervalos describen temporadas de inicio, no días de contratación.
        if nuevos and int(nuevos[-1]['hasta']) + 1 == y and all(
                nuevos[-1].get(c, '') == r[c] for c in campos if c not in ('desde', 'hasta')):
            nuevos[-1]['hasta'] = str(y)
        else:
            nuevos.append(r)
    escribir(BASE / 'entrenadores.csv', filas + nuevos, campos)
    print(f'Montados {len(nuevos)} intervalos; conservados {len(filas)} intervalos exteriores.')


def comprobar(inicios, huecos, todos):
    assert len({clave(f) for f in inicios}) == len(inicios), 'Inicio duplicado'
    assert len({clave(f) for f in huecos}) == len(huecos), 'Hueco duplicado'
    cubiertos, faltan = {clave(f) for f in inicios}, {clave(f) for f in huecos}
    assert not cubiertos & faltan, 'Un inicio también figura como hueco'
    assert cubiertos | faltan == todos, 'La cobertura no coincide con ligas.csv'
    s = (RAIZ / 'datos/base.js').read_text(encoding='utf-8')
    base = json.loads(s[s.index('{'):].rstrip().removesuffix(';'))
    # base.py también crea clubes a partir de las ligas históricas.
    clubes = set(base['clubes'])
    texto = (RAIZ / 'js/mundo.js').read_text(encoding='utf-8')
    bloque = re.search(r'const MAESTROS = \{(.*?)\n  \};', texto, re.S).group(1)
    maestros = {normalizar(n): (n, a) for n, a in re.findall(r"'([^']+)': \[(\d{4})", bloque)}
    for f in inicios:
        assert f['club'] in clubes, f'Club desconocido: {clave(f)}'
        assert f['fuente'].startswith('https://'), f'Sin fuente: {clave(f)}'
        assert f['nombre'].strip() == f['nombre'] and not re.search(r'\d| / | - ', f['nombre']), f
        if f['nacimiento']:
            assert re.fullmatch(r'\d{4}', f['nacimiento']), f
            assert 15 <= int(f['temporada']) - int(f['nacimiento']) <= 100, f
        m = maestros.get(normalizar(f['nombre']))
        if m:
            assert f['nombre'] == m[0], f'Nombre distinto de MAESTROS: {f["nombre"]}'
            assert not f['nacimiento'] or f['nacimiento'] == m[1], f
    indice = collections.defaultdict(list)
    for f in leer(BASE / 'entrenadores.csv'):
        assert f.get('estilo', '') in ('', 'ofensivo', 'equilibrado', 'defensivo', 'contragolpe'), f
        for y in range(int(f['desde']), int(f['hasta']) + 1):
            if not f['jornada_desde'] or int(f['jornada_desde']) <= 1:
                indice[f['pais'], f['club'], y].append(f)
    for f in inicios:
        candidatos = indice[clave(f)]
        assert len(candidatos) == 1, f'Más de un entrenador inicial: {clave(f)}'
        t = candidatos[0]
        for c in ('nombre', 'nacionalidad', 'nacimiento'):
            assert t.get(c, '') == f[c], (clave(f), c)
        assert not t['fijo'], 'Los datos nuevos no deben forzar resultados ni relevos'
    for f in huecos:
        assert not indice[clave(f)], f'Un hueco conserva un entrenador no contrastado: {clave(f)}'
    # Casos que distinguen al técnico que abrió el curso de su sustituto más famoso.
    casos = {('Inglaterra', 'Manchester United', 1986): 'Ron Atkinson',
             ('España', 'Barcelona', 2008): 'Pep Guardiola',
             ('España', 'Málaga', 1962): 'Sabino Barinaga Alberdi',
             ('Italia', 'Roma', 1992): 'Vujadin Boškov',
             ('Italia', 'Cesena', 1977): 'Giuseppe Marchioro',
             ('Brasil', 'Flamengo', 2020): 'Jorge Jesus',
             ('Portugal', 'Belenenses', 2018): 'Silas'}
    for k, nombre in casos.items():
        assert [r['nombre'] for r in indice[k]] == [nombre], (k, nombre)
    # Comprueba también que base.py trasladó los nombres, fechas y rasgos.
    compilados = {(r['pais'], r['club'], r['desde'], r['hasta'], r['nombre']): r for r in base['entrenadores']}
    for f in leer(BASE / 'entrenadores.csv'):
        t = compilados[f['pais'], f['club'], int(f['desde']), int(f['hasta']), f['nombre']]
        assert t['nacion'] == f['nacionalidad']
        assert t.get('nac', '') == f.get('nacimiento', '')
        if f['estilo']:
            assert t['estilo'] == f['estilo']
    cobertura = []
    for pais in sorted({k[0] for k in todos}):
        for decada in range(1960, 2021, 10):
            total = sum(p == pais and decada <= y <= min(decada + 9, 2025) for p, _, y in todos)
            con = sum(p == pais and decada <= y <= min(decada + 9, 2025) for p, _, y in cubiertos)
            cobertura.append(dict(pais=pais,desde=decada,hasta=min(decada+9,2025),
                                   clubes_temporada=total,con_entrenador=con,huecos=total-con))
    escribir(DATOS / 'cobertura.csv', cobertura, list(cobertura[0]))
    sin_meta = [f for f in inicios if not f['nacimiento'] or not f['nacionalidad']]
    escribir(DATOS / 'metadatos_pendientes.csv', sin_meta, list(inicios[0]))
    # El CSV conserva el país. El consumidor actual de mundo.js todavía filtra
    # solo por club; expone, sin ocultarla, la colisión de los dos Arsenal.
    por_nombre = collections.defaultdict(set)
    for p, c, _ in todos:
        por_nombre[c].add(p)
    bloqueados = [dict(f, bloqueo='mundo.js filtra técnicos por nombre de club, sin país')
                  for f in inicios if len(por_nombre[f['club']]) > 1]
    escribir(DATOS / 'bloqueos_integracion.csv', bloqueados, list(inicios[0]) + ['bloqueo'])
    print(f'{len(cubiertos)}/{len(todos)} clubes-temporada ({100*len(cubiertos)/len(todos):.2f} %); '
          f'{len(faltan)} huecos; {len(sin_meta)} con datos personales incompletos.')
    print('Sin duplicados iniciales; nombres de MAESTROS, fuentes y compilación comprobados.')
    if bloqueados:
        print(f'INTEGRACIÓN PENDIENTE: {len(bloqueados)} inicios de los dos Arsenal. '
              'El cargador debe usar el país del club además del nombre; ver bloqueos_integracion.csv.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--montar', action='store_true')
    args = parser.parse_args()
    inicios, huecos, todos = leer(DATOS / 'inicios.csv'), leer(DATOS / 'huecos.csv'), objetivos()
    if args.montar:
        montar(inicios, todos)
    else:
        comprobar(inicios, huecos, todos)
