#!/usr/bin/env python3
"""Comprueba las identidades y los niveles del lote de figuras de 1970-99.

Uso, después de ejecutar herramientas/base.py:
    python3 herramientas/comprobar_figuras_1970_99.py

Lee la base anterior desde Git y utiliza Motor.escala para las conversiones.
No escribe archivos ni ejecuta la simulación.
"""
import argparse
import csv
import io
import json
from pathlib import Path
import subprocess


RAIZ = Path(__file__).resolve().parent.parent
LOTE = RAIZ / 'datos_fuente/entregas/2026-11-13_codex_figuras_1970-99'
REFERENCIA = '2b2eaf2865523fc93820077b94d4832c18ca76aa'
FUENTE = 'Codex 2026-11-13, figuras 1970-99'
ISLAS = {'Inglaterra', 'Escocia', 'Gales', 'Irlanda', 'Irlanda del Norte', 'Reino Unido'}


def comprobar(condicion, mensaje):
    if not condicion:
        raise ValueError(mensaje)


def git(*argumentos):
    return subprocess.check_output(['git', *argumentos], cwd=RAIZ)


def leer_base(texto):
    return json.loads(texto[texto.index('{'):].strip().removesuffix(';'))


def leer_csv(ruta):
    with ruta.open(encoding='utf-8', newline='') as archivo:
        return list(csv.DictReader(archivo))


def identidad(jugador):
    return jugador['n'], jugador['nac'][:4]


def main():
    argumentos = argparse.ArgumentParser(description=__doc__)
    argumentos.add_argument('--base-ref', default=REFERENCIA)
    ref = argumentos.parse_args().base_ref
    antes = leer_base(git('show', f'{ref}:datos/base.js').decode())
    despues = leer_base((RAIZ / 'datos/base.js').read_text(encoding='utf-8'))
    texto_previo = git('show', f'{ref}:datos_fuente/base/niveles_figuras.csv')
    previas = list(csv.DictReader(io.StringIO(texto_previo.decode())))
    archivo_niveles = RAIZ / 'datos_fuente/base/niveles_figuras.csv'
    actuales = leer_csv(archivo_niveles)
    seleccion = leer_csv(LOTE / 'seleccion.csv')
    faltan = leer_csv(LOTE / 'faltan_en_la_base.csv')
    omitidos = leer_csv(LOTE / 'no_incorporados.csv')
    nuevas = actuales[len(previas):]
    comprobar(archivo_niveles.read_bytes().startswith(texto_previo),
              'Se ha modificado el contenido anterior de niveles_figuras.csv')
    comprobar(actuales[:len(previas)] == previas, 'Se han cambiado filas anteriores')
    comprobar(len(seleccion) == len(nuevas) == 254, 'El lote debe tener 254 filas nuevas')
    comprobar(all(f['fuente'] == FUENTE for f in nuevas), 'Fuente incorrecta')
    comprobar(len({(f['nombre'], f['anio']) for f in actuales}) == len(actuales),
              'Hay una identidad repetida en niveles_figuras.csv')
    comprobar({(f['nombre'], f['anio'], f['nivel']) for f in nuevas}
              == {(f['nombre'], f['anio'], f['nivel_valorado']) for f in seleccion},
              'La selección y las filas añadidas no coinciden')

    por_antes = {identidad(j): j for j in antes['jugadores']}
    por_despues = {identidad(j): j for j in despues['jugadores']}
    comprobar(len(por_antes) == len(antes['jugadores']), 'Identidad anterior ambigua')
    comprobar(len(por_despues) == len(despues['jugadores']), 'Identidad posterior ambigua')
    comprobar(por_antes.keys() == por_despues.keys(), 'Ha cambiado alguna identidad de la base')
    claves = {(f['nombre'], f['anio']) for f in seleccion}
    comprobar(len(claves) == len(seleccion), 'Hay una identidad repetida en la selección')
    comprobar(claves <= por_antes.keys(), 'Nombre o nacimiento no encontrado exactamente')
    comprobar(not claves.intersection((f['nombre'], f['anio']) for f in previas),
              'Se ha incluido a alguien que ya estaba valorado')
    comprobar(all(f['pais'] not in ISLAS and por_antes[(f['nombre'], f['anio'])].get('nacion') not in ISLAS
                  for f in seleccion), 'Hay una figura de las islas británicas')
    for f in seleccion:
        desde, hasta = map(int, f['pico'].split('-'))
        comprobar(2 <= hasta - desde <= 3 and desde <= 1997 and hasta >= 1972,
                  f"No hay al menos dos temporadas del pico entre 1970 y 1999: {f['nombre']}")
        comprobar(620 <= int(f['nivel_despues']) <= 1000, f"Nivel fuera de escala: {f['nombre']}")

    valores = [{'antes': por_antes[(f['nombre'], f['anio'])]['max'],
                'despues': por_despues[(f['nombre'], f['anio'])]['max'],
                'pedido': int(f['nivel_valorado'])} for f in seleccion]
    codigo = """const fs = require('fs'), Motor = require('./js/motor.js');
const valores = JSON.parse(fs.readFileSync(0, 'utf8'));
process.stdout.write(JSON.stringify(valores.map(v => ({
  antes: Motor.escala.mostrar(v.antes), despues: Motor.escala.mostrar(v.despues),
  interno: Motor.escala.interno(v.pedido), visible: Motor.escala.mostrar(Motor.escala.interno(v.pedido))
}))));"""
    conversiones = json.loads(subprocess.check_output(
        ['node', '-e', codigo], input=json.dumps(valores), text=True, cwd=RAIZ))
    for f, v, c in zip(seleccion, valores, conversiones):
        comprobar(v['antes'] == int(f['max_interno_antes']) and c['antes'] == int(f['nivel_antes']),
                  f"Nivel anterior incorrecto: {f['nombre']}")
        comprobar(c['despues'] == int(f['nivel_despues']) == c['visible'] and v['despues'] == c['interno'],
                  f"El nivel no se ha aplicado: {f['nombre']}")
        comprobar(v['pedido'] >= c['antes'] and v['despues'] >= v['antes'] and c['despues'] >= c['antes'],
                  f"Se ha bajado un nivel: {f['nombre']}")

    for clave, a in por_antes.items():
        d = por_despues[clave]
        campos = {k for k in a.keys() | d.keys() if a.get(k) != d.get(k)}
        comprobar(campos <= ({'max'} if clave in claves else set()),
                  f'Cambios ajenos al máximo del jugador seleccionado: {clave}, {campos}')
    comprobar({k: v for k, v in antes.items() if k != 'jugadores'}
              == {k: v for k, v in despues.items() if k != 'jugadores'},
              'Hay cambios en clubes, ligas u otros datos')
    for f in faltan:
        comprobar((f['nombre'], f['anio']) not in por_antes and (f['nombre'], f['anio']) not in por_despues,
                  f"No es un ausente: {f['nombre']}")
    for f in omitidos:
        clave = f['nombre'], f['anio']
        comprobar(clave not in claves and clave in por_antes and clave in por_despues,
                  f'Identidad omitida incorrecta: {clave}')
        comprobar(por_antes[clave] == por_despues[clave], f'Se ha cambiado una figura omitida: {clave}')

    atributos_previos = git('show', f'{ref}:datos_fuente/base/atributos.csv')
    archivo_atributos = RAIZ / 'datos_fuente/base/atributos.csv'
    comprobar(archivo_atributos.read_bytes().startswith(atributos_previos),
              'Se han cambiado atributos anteriores')
    anteriores_at = list(csv.DictReader(io.StringIO(atributos_previos.decode())))
    actuales_at = leer_csv(archivo_atributos)
    por_at = {f['nombre']: f for f in actuales_at}
    comprobar(len(por_at) == len(actuales_at), 'Hay perfiles de atributos duplicados')
    top60 = sorted(seleccion, key=lambda f: (-int(f['nivel_valorado']), f['nombre']))[:60]
    nombres60 = {f['nombre'] for f in top60}
    nombres_previos = {f['nombre'] for f in anteriores_at}
    nombres_nuevos = set(por_at) - nombres_previos
    comprobar(nombres60 <= por_at.keys() and nombres_nuevos == nombres60 - nombres_previos
              and len(nombres_nuevos) == 38, 'Falta algún perfil del top 60 o hay perfiles ajenos')
    nombres_base_antes = {j['n'] for j in antes['jugadores']}
    nombres_base_despues = {j['n'] for j in despues['jugadores']}
    comprobar(nombres_nuevos <= nombres_base_despues, 'Hay atributos nuevos sin jugador')
    comprobar(nombres_previos - nombres_base_antes == set(por_at) - nombres_base_despues,
              'Ha cambiado la lista anterior de atributos sin correspondencia')
    columnas_at = ['definicion', 'desmarque', 'pase', 'vision', 'regate',
                   'velocidad', 'fisico', 'defensa', 'aereo', 'porteria']
    valores_at = {nombre: [int(f[c]) for c in columnas_at] for nombre, f in por_at.items()}
    comprobar(all(1 <= n <= 100 for valores in valores_at.values() for n in valores),
              'Hay un atributo fuera del rango 1-100')
    generados_at = leer_base((RAIZ / 'datos/atributos.js').read_text(encoding='utf-8'))
    comprobar(generados_at == valores_at, 'El archivo generado de atributos no coincide con el CSV')
    informe_at = leer_csv(LOTE / 'atributos_top60.csv')
    comprobar(informe_at == [{'nombre': f['nombre'], 'origen': 'existente' if f['nombre'] in nombres_previos
                             else 'añadido en este lote'} for f in top60],
              'El informe de atributos no coincide con el top 60')
    avisos = (RAIZ / 'datos_fuente/base/revision.txt').read_text(encoding='utf-8')
    comprobar('niveles_figuras: no encuentro' not in avisos, 'Hay niveles sin correspondencia')
    comprobar(not git('diff', '--name-only', ref, '--', 'js/').strip(), 'Hay cambios en js/')
    subidas = sum(v['despues'] > v['antes'] for v in valores)
    print(f'bien: {len(nuevas)} identidades exactas; {len(previas)} filas anteriores intactas')
    print(f'bien: {subidas} máximos suben y {len(nuevas) - subidas} se mantienen; ninguna bajada')
    print(f'bien: {len(faltan)} ausentes y {len(omitidos)} omitidos aparte; ningún aviso de nivel sin jugador')
    print(f'bien: los {len(por_antes)} jugadores conservan sus demás datos; clubes, ligas y js/ intactos')
    print('bien: atributos del top 60 completos; 22 perfiles conservados y 38 nuevos, todos con jugador')
    print(f'bien: se mantienen los {len(nombres_previos - nombres_base_antes)} avisos de atributos anteriores; ninguno nuevo')


if __name__ == '__main__':
    main()
