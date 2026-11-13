# Validación de la entrega

Base de revisión: `441402b` de `main`. Comprobaciones ejecutadas el 13 de noviembre de 2026, después del último montaje de los datos.

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
Mundial 2002: Inglaterra (final ante Portugal), goleador Francesco Totti con 6
Mundial 2006: Francia (final ante Inglaterra), goleador Raúl con 10
Mundial 2010: Portugal (final ante España), goleador Cristiano Ronaldo con 10
Ligas de España: Real Madrid 7, Barcelona 5
Copas de Europa: Juventus 3, Manchester United 3, Barcelona 3, Real Madrid 2, Bayern Múnich 1
```

## Límite de las pruebas: Arsenal

Las pruebas existentes pasan, pero no verifican que el cargador distinga los dos Arsenal. La prueba de integración manual **reproduce un fallo**, que no se declara resuelto:

```sh
node - <<'JS'
const { Mundo, BASE } = require('./pruebas/cargar.js');
const d = Mundo.desdeBase(BASE, 2015);
for (const p of d.paises)
  for (const div of p.divisiones)
    for (const c of div.clubes)
      if (c.nombre === 'Arsenal')
        console.log(p.pais, c.entrenadores.map(t => t.nombre).join(' / '));
JS
```

Salida actual:

```text
Inglaterra Martín Palermo / Arsène Wenger
Argentina Martín Palermo / Arsène Wenger
```

El CSV y la base compilada conservan el país para poder resolverlo; el filtro de `mundo.js` todavía no lo usa. El PR queda en borrador y **no debe publicarse** antes de corregir ese consumidor. Tampoco se declaran jugables las tres ligas de 2025–26 que faltan en los datos de competiciones, aunque sus 54 técnicos ya se entregan.
