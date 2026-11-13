"""Monta las competiciones de selecciones sin descargar nada ni instalar paquetes.

Uso: python3 herramientas/continentales.py
Las fuentes históricas están en datos_fuente/continentales. Los niveles de los
externos son estimaciones del juego, nunca resultados ni valoraciones históricas.
"""
import csv
import json
import subprocess
import unicodedata
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / 'datos_fuente/continentales'


def limpio(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if not unicodedata.combining(c)).strip()


def dato(archivo, prefijo):
    return json.loads((RAIZ / archivo).read_text().removeprefix(prefijo).strip().rstrip(';'))


def grupo(letra, puesto=1):
    return {'grupo': 'Grupo ' + letra, 'puesto': puesto}


def tercero(rango=None):
    return {'puesto': 3, **({'rangoTercero': rango} if rango else {})}


def ganador(id_):
    return {'gana': id_}


def ronda(nombre, pares, **opciones):
    return {'tipo': 'ko', 'nombre': nombre, 'cruces': [dict(id=f'{nombre}-{i}', lados=list(p), **opciones) for i, p in enumerate(pares)]}


def calendario(equipos, vuelta=False):
    # Calendario Berger: cada selección juega una vez por jornada, incluso con grupos impares.
    rueda = list(equipos) + ([None] if len(equipos) % 2 else [])
    partidos = []
    for j in range(len(rueda) - 1):
        for i in range(len(rueda) // 2):
            a, b = rueda[i], rueda[-1-i]
            if a is not None and b is not None:
                partidos.append([a, b] if j % 2 else [b, a])
        rueda = [rueda[0], rueda[-1], *rueda[1:-1]]
    return partidos + ([[b, a] for a, b in partidos] if vuelta else [])


def fase_grupos(grupos, vuelta=False, nombre='Fase de grupos'):
    return {'tipo': 'grupos', 'nombre': nombre, 'grupos': [
        {'nombre': 'Grupo ' + chr(65+i), 'equipos': eqs, 'partidos': calendario(eqs, vuelta)}
        for i, eqs in enumerate(grupos)]}


def terminar(fases, pares, terceros=False, prorroga=None):
    opciones = {} if prorroga is None else {'prorroga': prorroga}
    sf = ronda('Semifinales', pares, **opciones)
    fases.append(sf)
    ids = [c['id'] for c in sf['cruces']]
    if terceros:
        fases.append(ronda('Tercer puesto', [({'pierde': ids[0]}, {'pierde': ids[1]})], **opciones))
    fases.append(ronda('Final', [(ganador(ids[0]), ganador(ids[1]))]))


MATRIZ_2016 = dict(zip(['ABCD', 'ABCE', 'ABCF', 'ABDE', 'ABDF', 'ABEF', 'ACDE', 'ACDF', 'ACEF', 'ADEF', 'BCDE', 'BCDF', 'BCEF', 'BDEF', 'CDEF'],
                     ['CDAB', 'CABE', 'CABF', 'DABE', 'DABF', 'EABF', 'CDAE', 'CDAF', 'CAFE', 'DAFE', 'CDBE', 'CDBF', 'ECBF', 'EDBF', 'CDFE']))
MATRIZ_2020 = dict(zip(MATRIZ_2016, ['ADBC', 'AEBC', 'AFBC', 'DEAB', 'DFAB', 'EFBA', 'EDCA', 'FDCA', 'EFCA', 'EFDA', 'EDBC', 'FDCB', 'FECB', 'FEDB', 'FEDC']))


def formato(ed):
    y, f, euro = ed['edicion'], ed['formato'], ed['competicion'] == 'EURO'
    reglas = {'puntosVictoria': 2 if y <= (1992 if euro else 1993) else 3,
              'desempateGrupo': 'directo' if euro and y >= 1996 else 'diferencia',
              'empateKO': 'sorteo' if euro and y <= 1968 else 'penaltis',
              'cambios': 5 if ed['anio'] >= 2020 else 3 if y >= 1995 else 2 if y >= 1968 else 0}
    if not euro:
        reglas.update(prorroga=False, prorrogaFinal=True)
        if y == 2011:
            reglas['prorroga'] = True
    if f == 'cuatro':
        fases = []
        terminar(fases, [tuple({'equipo': p} for p in par) for par in ed['grupos']], True)
        return reglas, fases
    fases = [fase_grupos(ed['grupos'], f == 'ida-vuelta')]
    g = grupo
    if f == 'liga':
        reglas.update(desempateGrupo='partido', desempateCampeon=True)
    elif f == 'ocho-final':
        fases += [ronda('Tercer puesto', [(g('A', 2), g('B', 2))]), ronda('Final', [(g('A'), g('B'))])]
    elif f == 'ocho':
        terminar(fases, [(g('A'), g('B', 2)), (g('B'), g('A', 2))])
    elif f in ('ida-vuelta', 'campeon-semifinal'):
        campeon = {'equipo': ed['campeonExento']}
        pares = [(g('A'), g('B')), (g('C'), campeon)] if y == 1975 else [(g('A'), campeon), (g('B'), g('C'))] if y in (1979, 1987) else [(g('A'), g('C')), (g('B'), campeon)]
        terminar(fases, pares, y == 1987)
        if f == 'ida-vuelta':
            reglas['localGrupos'] = True
            for F in fases[1:]:
                for c in F['cruces']:
                    c['idaVuelta'] = True
                    if y in (1975, 1979) and F['nombre'] == 'Final':
                        c['porPuntos'] = True
                        c['globalTrasDesempate'] = y == 1979
    elif f == 'liguilla-final':
        eqs = [ed['grupos'][i][p] for i in range(2) for p in range(2)]
        final = fase_grupos([eqs], nombre='Liguilla final')
        final['grupos'][0]['de'] = [g(l, p) for l in 'AB' for p in (1, 2)]
        fases.append(final)
    elif f in ('dieciseis', 'doce', 'diez-dos-grupos'):
        sf = [(0, 2), (1, 3)]
        if f == 'dieciseis':
            pares = [(g('A'), g('B', 2)), (g('B'), g('A', 2)), (g('C'), g('D', 2)), (g('D'), g('C', 2))]
            if euro and y == 2008 or not euro and y == 2024:
                sf = [(0, 1), (2, 3)]
            if not euro and y == 2016:
                sf = [(0, 3), (1, 2)]
        elif f == 'diez-dos-grupos':
            pares = [(g('A'), g('B', 4)), (g('B'), g('A', 4)), (g('A', 2), g('B', 3)), (g('B', 2), g('A', 3))]
        else:
            T1, T2 = tercero(1), tercero(2)
            pares = [(g('A'), T2), (g('A', 2), g('B', 2)), (g('B'), g('C', 2)), (g('C'), T1)]
            sf = [(0, 1), (2, 3)]
            if y == 1993:
                pares = [(g('C'), g('A', 2)), (g('A'), T1), (g('B', 2), g('C', 2)), (g('B'), T2)]
                sf = [(0, 2), (1, 3)]
            elif y == 1997:
                pares = [(g('B'), T2), (g('A', 2), g('B', 2)), (g('C'), T1), (g('A'), g('C', 2))]
            elif y == 1999:
                sf = [(0, 3), (1, 2)]
            elif y == 2001:
                sf = [(0, 2), (1, 3)]
            elif y == 2007:
                pares = [(g('A'), T2), (g('A', 2), g('C')), (g('B'), g('C', 2)), (g('B', 2), T1)]
                sf = [(0, 3), (1, 2)]
            elif y in (2011, 2015):
                pares = [(g('A'), T1), (g('A', 2), g('C', 2)), (g('B'), T2), (g('B', 2), g('C'))]
            elif y == 2019:
                pares = [(g('A'), tercero()), (g('A', 2), g('B', 2)), (g('B'), g('C', 2)), (g('C'), tercero())]
                reglas['repartoTerceros'] = {'AB': {'A': 'B', 'C': 'A'}, 'AC': {'A': 'C', 'C': 'A'}, 'BC': {'A': 'C', 'C': 'B'}}
        cuartos = ronda('Cuartos de final', pares)
        fases.append(cuartos)
        ids = [c['id'] for c in cuartos['cruces']]
        terminar(fases, [(ganador(ids[a]), ganador(ids[b])) for a, b in sf], not euro, True if y == 2019 else None)
    elif f == 'veinticuatro':
        if y == 2016:
            pares = [(g('A', 2), g('C', 2)), (g('B'), tercero()), (g('D'), tercero()), (g('A'), tercero()), (g('C'), tercero()), (g('F'), g('E', 2)), (g('E'), g('D', 2)), (g('B', 2), g('F', 2))]
            q = [(0, 2), (1, 5), (4, 6), (3, 7)]
            matriz, receptores = MATRIZ_2016, 'ABCD'
        elif y == 2020:
            pares = [(g('A', 2), g('B', 2)), (g('A'), g('C', 2)), (g('C'), tercero()), (g('B'), tercero()), (g('D', 2), g('E', 2)), (g('F'), tercero()), (g('D'), g('F', 2)), (g('E'), tercero())]
            q = [(4, 5), (1, 3), (0, 2), (6, 7)]
            matriz, receptores = MATRIZ_2020, 'BCEF'
        else:
            pares = [(g('A', 2), g('B', 2)), (g('A'), g('C', 2)), (g('C'), tercero()), (g('B'), tercero()), (g('D', 2), g('E', 2)), (g('F'), tercero()), (g('E'), tercero()), (g('D'), g('F', 2))]
            q = [(3, 1), (5, 4), (2, 0), (6, 7)]
            matriz, receptores = MATRIZ_2020, 'BCEF'
        reglas['repartoTerceros'] = {k: dict(zip(receptores, v)) for k, v in matriz.items()}
        octavos = ronda('Octavos de final', pares)
        fases.append(octavos)
        ids = [c['id'] for c in octavos['cruces']]
        cuartos = ronda('Cuartos de final', [(ganador(ids[a]), ganador(ids[b])) for a, b in q])
        fases.append(cuartos)
        ids = [c['id'] for c in cuartos['cruces']]
        terminar(fases, [(ganador(ids[0]), ganador(ids[1])), (ganador(ids[2]), ganador(ids[3]))])
    else:
        raise ValueError('Formato desconocido: ' + f)
    return reglas, fases


def main():
    ediciones = json.loads((FUENTE / 'ediciones.json').read_text())
    filas = list(csv.DictReader((FUENTE / 'plantillas.csv').open()))
    base = dato('datos/base.js', 'window.BASE_DATOS = ')
    por_nombre = defaultdict(list)
    for j in base['jugadores']:
        por_nombre[limpio(j['n'])].append(j)
    niveles_mundial = defaultdict(list)
    for e in dato('datos/mundiales.js', 'self.MUNDIALES = '):
        for E in e['equipos'].values():
            for j in E['jugadores']:
                if j.get('nac'):
                    niveles_mundial[limpio(j['n']), str(j['nac'])[:4]].append((e['anio'], j['niv']))
    # Se utiliza la misma curva de edad pública del juego, sin cambiarla.
    codigo = "const fs=require('fs'), M=require('./js/motor.js'), W=require('./js/mundo.js');const xs=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(xs.map(([j,y])=>M.escala.mostrar(W.nivelEdad(j,y)))));"
    coincidencias = []
    for f in filas:
        candidatos = por_nombre[limpio(f['nombre'])]
        candidatos = [j for j in candidatos if f['nacimiento'] and str(j['nac'])[:4] == f['nacimiento']]
        coincidencias.append(candidatos[0] if len(candidatos) == 1 else None)
    anios = {e['id']: e['anio'] for e in ediciones}
    entrada = [[j, anios[f['edicion']]] for f, j in zip(filas, coincidencias) if j]
    niveles = iter(json.loads(subprocess.check_output(['node', '-e', codigo], input=json.dumps(entrada).encode(), cwd=RAIZ)))
    plantillas = defaultdict(list)
    cobertura, tipo_nivel = [], []
    for f, j in zip(filas, coincidencias):
        y = anios[f['edicion']]
        muestras = sorted((a, n) for a, n in niveles_mundial[limpio(f['nombre']), f['nacimiento']] if abs(a - y) <= 4)
        # Los perfiles ya valorados para el Mundial sirven también aquí (p. ej., Yashin).
        # Se interpola entre los dos Mundiales cercanos, sin crear un nuevo máximo.
        cercanos = sorted(muestras, key=lambda x: abs(x[0] - y))[:2]
        referencia = sum(n / max(1, abs(a-y)) for a, n in cercanos) / sum(1 / max(1, abs(a-y)) for a, n in cercanos) if cercanos else None
        # Valor conservador para internacionales sin perfil en BASE: es una estimación visible y documentada.
        niv = next(niveles) if j else round(referencia) if referencia is not None else 520
        tipo_nivel.append('base' if j else 'mundial' if referencia is not None else 'estimado')
        n = int(f['nacimiento']) if f['nacimiento'] else 0
        plantillas[f['edicion'], f['pais']].append({'n': f['nombre'], 'nac': n, 'pos': f['posicion'], 'club': f['club'], 'niv': niv, 'edad': anios[f['edicion']] - n if n else None})
    for ed in ediciones:
        paises = list(dict.fromkeys(p for G in ed['grupos'] for p in G))
        if ed.get('campeonExento'):
            paises.append(ed['campeonExento'])
        ed['equipos'] = {}
        for pais in paises:
            js = plantillas[ed['id'], pais]
            assert len(js) >= 11, (ed['id'], pais, len(js))
            assert all(j['pos'] in ('POR', 'DEF', 'MED', 'DEL') for j in js)
            assert any(j['pos'] == 'POR' for j in js), (ed['id'], pais, 'sin portero')
            assert len({limpio(j['n']) for j in js}) == len(js), (ed['id'], pais, 'duplicados')
            ed['equipos'][pais] = {'nombre': pais, 'jugadores': js}
        ed['reglas'], ed['fases'] = formato(ed)
        fs = [f for f in filas if f['edicion'] == ed['id']]
        cobertura.append([ed['id'], len(paises), len(fs), sum(not f['nacimiento'] for f in fs),
                          sum(f['precision'] != 'convocatoria' for f in fs),
                          sum(t == 'mundial' for f, t in zip(filas, tipo_nivel) if f['edicion'] == ed['id']),
                          sum(t == 'estimado' for f, t in zip(filas, tipo_nivel) if f['edicion'] == ed['id'])])
    (RAIZ / 'datos/continentales.js').write_text('self.CONTINENTALES = ' + json.dumps(ediciones, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with (FUENTE / 'cobertura.csv').open('w') as salida:
        w = csv.writer(salida, lineterminator='\n')
        w.writerow(['edicion', 'selecciones', 'jugadores_documentados', 'sin_nacimiento', 'plantilla_historica_parcial', 'nivel_de_mundial', 'nivel_estimado'])
        w.writerows(cobertura)
    print(f'{len(ediciones)} ediciones, {len(filas)} jugadores documentados; datos/continentales.js y cobertura.csv montados.')


if __name__ == '__main__':
    main()
