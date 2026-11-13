#!/usr/bin/env python3
"""Comprueba los cruces con las entradas, sin modificar ni compilar datos."""
import csv
import datetime
import re
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlsplit

RAIZ = Path(__file__).resolve().parents[3]
BASE = RAIZ / 'datos_fuente/base'

def leer(ruta, columnas=None):
    with ruta.open(encoding='utf-8', newline='') as archivo:
        lector = csv.DictReader(archivo)
        if columnas is not None:
            assert lector.fieldnames == columnas, f'Cabecera inesperada: {ruta.name}'
        filas = list(lector)
    assert all(None not in fila and all(v is not None for v in fila.values()) for fila in filas), ruta
    return filas

def clave(fila, nombre='jugador'):
    return fila[nombre], fila['nacimiento']

def fuentes(fila):
    assert fila['fuente'], f'Sin fuente: {fila}'
    for direccion in fila['fuente'].split(' | '):
        url = urlsplit(direccion)
        assert url.scheme == 'https' and url.netloc, f'Fuente no válida: {direccion}'

def comprobar():
    columnas = 'jugador,nacimiento,club_formacion,pais_club,anio_llegada,anio_debut_primer_equipo,fuente'.split(',')
    entrada = leer(RAIZ / 'datos_fuente/expansion/astra/lista_para_astra.csv')
    objetivos = {(r['nombre'], r['nacimiento']) for r in entrada}
    completas = leer(BASE / 'canteras.csv', columnas)
    huecos = leer(BASE / 'canteras_huecos.csv', columnas + ['motivo', 'nacimiento_fuente'])
    claves_completas = [clave(r) for r in completas]
    claves_huecos = [clave(r) for r in huecos]
    assert len(claves_completas) == len(set(claves_completas)), 'Canteras duplicadas'
    assert len(claves_huecos) == len(set(claves_huecos)), 'Huecos duplicados'
    assert set(claves_completas).isdisjoint(claves_huecos), 'Jugador completo y pendiente a la vez'
    assert set(claves_completas) | set(claves_huecos) == objetivos, 'Faltan o sobran nombres/nacimientos exactos'
    for r in completas:
        assert all(r.values()), f'Campo sin completar: {r}'
        nacimiento = datetime.date.fromisoformat(r['nacimiento'])
        llegada, debut = int(r['anio_llegada']), int(r['anio_debut_primer_equipo'])
        assert nacimiento.year <= llegada <= debut <= 2026, f'Cronología imposible: {r}'
        assert 12 <= debut - nacimiento.year <= 40, f'Revisar edad de debut: {r}'
        fuentes(r)
    for r in huecos:
        datetime.date.fromisoformat(r['nacimiento'])
        assert r['motivo'] and not r['anio_debut_primer_equipo'], f'Hueco sin motivo o con debut no confirmado: {r}'
        if r['fuente']:
            fuentes(r)

    # Si se conserva un alias conocido, exige el nombre exacto de clubes.csv.
    clubes = {r['club'] for r in leer(BASE / 'clubes.csv')}
    alias = defaultdict(set)
    for r in leer(BASE / 'alias.csv'):
        if r['club'] in clubes:
            alias[r['otro']].add(r['club'])
    for r in completas + huecos:
        club = r['club_formacion']
        assert club not in alias or club in clubes or len(alias[club]) != 1, f'Usar nombre de la base: {club} → {alias[club]}'

    # Recalcula los 300 desde todos los intervalos originales, sin duplicar una misma temporada de club.
    temporadas = defaultdict(set)
    for r in leer(BASE / 'entrenadores.csv'):
        if not r['nombre'] or not r['desde'] or not r['hasta']:
            continue
        for anio in range(int(r['desde']), int(r['hasta']) + 1):
            temporadas[r['nombre']].add((r['pais'], r['club'], anio))
    orden = sorted(temporadas, key=lambda n: (-len(temporadas[n]), n))
    primeros = set(orden[:300])
    texto = (RAIZ / 'js/mundo.js').read_text(encoding='utf-8')
    bloque = re.search(r'const MAESTROS = \{(.*?)\n  \};', texto, re.S)
    assert bloque, 'No se localiza MAESTROS; revisar el lector antes de cambiar datos'
    maestros = set(re.findall(r"'([^']+)'\s*:\s*\[", bloque.group(1)))
    entrenadores = primeros | maestros
    relaciones = leer(BASE / 'maestros_entrenadores.csv', 'entrenador,maestro,relacion,club,desde,hasta,fuente'.split(','))
    claves = [tuple(r[k] for k in r if k != 'fuente') for r in relaciones]
    assert len(claves) == len(set(claves)), 'Relaciones duplicadas'
    for r in relaciones:
        assert r['entrenador'] in entrenadores, f'Entrenador fuera de la selección: {r}'
        assert r['maestro'] and r['entrenador'] != r['maestro'], f'Autorreferencia: {r}'
        assert r['relacion'] in {'jugador_de', 'ayudante_de', 'discipulo'}, r
        fuentes(r)
        if r['relacion'] == 'discipulo':
            assert not r['club'] and not r['desde'] and not r['hasta'], 'No convertir la fecha de una entrevista en período laboral'
        else:
            assert r['club'] and r['desde'] and r['hasta'], f'Relación sin período: {r}'
            assert 1850 <= int(r['desde']) <= int(r['hasta']) <= 2026, f'Período no válido: {r}'
    cobertura = leer(BASE / 'canteras_y_maestros/entrenadores_cobertura.csv')
    assert len(cobertura) == len(entrenadores) and {r['entrenador'] for r in cobertura} == entrenadores, 'Cobertura distinta de la unión solicitada'
    assert len({r['entrenador'] for r in cobertura}) == len(cobertura), 'Cobertura repetida'
    recuento = Counter(r['entrenador'] for r in relaciones)
    for r in cobertura:
        n = r['entrenador']
        assert r['en_MAESTROS'] == ('sí' if n in maestros else 'no'), r
        assert r['en_300'] == ('sí' if n in primeros else 'no'), r
        assert int(r['clubes_temporada']) == len(temporadas[n]), r
        assert int(r['relaciones']) == recuento[n], r
        assert r['estado'] == ('con relaciones' if recuento[n] else 'sin relación corroborada'), r
        if not recuento[n]:
            assert r['motivo'], f'Entrenador pendiente sin explicación: {n}'
    assert len({r['entrenador'] for r in cobertura if r['en_300'] == 'sí'}) == 300
    print(f'OK: {len(entrada)} filas de entrada; {len(objetivos)} jugadores distintos; {len(completas)} canteras completas; {len(huecos)} huecos.')
    print(f'OK: {len(relaciones)} relaciones; {len(recuento)}/{len(entrenadores)} nombres con relaciones; {len(set(recuento) & maestros)}/{len(maestros)} MAESTROS.')
    print('OK: claves exactas, reparto completo, cronología, fuentes, alias, selección de entrenadores y cobertura.')

if __name__ == '__main__':
    comprobar()
