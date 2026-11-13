# Validación de la entrega

Base de revisión: `1c999ae` de `main`. Comprobaciones ejecutadas el 13 de noviembre de 2026, después del último montaje de los datos.

| Comprobación | Resultado |
|---|---|
| `python3 herramientas/base.py` | Código 0; 5.704 intervalos de entrenadores compilados |
| `python3 herramientas/entrenadores.py` | Código 0; 8.942/10.320 documentados, 1.378 huecos y 95 entradas con metadatos incompletos |
| `node pruebas/auditoria.js` | Código 0; «todo bien», incluidas Eurocopa y Copa América |
| `node pruebas/famosos.js` | Código 0; 113 bien, 0 mal, 0 no están |
| `node pruebas/partida.js 2000 12 7` | Código 0; doce temporadas completadas |
| Repetir `--montar` | Mismo SHA-256 de `entrenadores.csv` antes y después |
| Comparar el JSON anterior con el nuevo | Solo cambia la clave `entrenadores` |
| Expandir los intervalos de origen por año y comparar fuera del encargo | Mismos registros y campos originales, incluidos 1958–59 |
| `git diff --check` | Sin errores |
| Diferencias en `js/` | Ninguna; versión de guardado intacta |

## Salida de la partida pedida

```text
Mundial 2002: Francia (final ante España), goleador Ronaldo con 7
Mundial 2006: Francia (final ante Brasil), goleador Cristiano Ronaldo con 7
Mundial 2010: Argentina (final ante Brasil), goleador Alberto Gilardino con 8
Ligas de España: Real Madrid 8, Barcelona 4
Copas de Europa: Real Madrid 5, Mónaco 2, Roma 1, Bayern Múnich 1, Inter 1, Lyon 1, Sporting de Portugal 1
```

## Arsenal: integración comprobada con main

Claude separó las identidades en `main` 1c999ae durante la preparación de la entrega. Se actualizó la rama y se regeneró la base para conservar ese cambio. Los nombres de entrada de los CSV se normalizan por país; no se modifica `js/`.

```sh
node - <<'JS'
const { Mundo, BASE } = require('./pruebas/cargar.js');
const d = Mundo.desdeBase(BASE, 2015);
for (const p of d.paises)
  for (const div of p.divisiones)
    for (const c of div.clubes)
      if (c.nombre === 'Arsenal' || c.nombre === 'Arsenal de Sarandí')
        console.log(p.pais, c.nombre, c.entrenadores.map(t => t.nombre).join(' / '));
JS
```

Salida comprobada:

```text
Inglaterra Arsenal Arsène Wenger
Argentina Arsenal de Sarandí Martín Palermo
```

El comprobador verifica también que cada fila de entrenadores se monta bajo el nombre y país correctos. Las 86 asignaciones de ambos clubes quedan en `identidades_verificadas.csv`.

El PR sigue en borrador por su cobertura histórica parcial. Tampoco se declaran jugables las tres ligas de 2025–26 que faltan en los datos de competiciones, aunque sus 54 técnicos ya se entregan.
