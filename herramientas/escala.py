# Escala de nivel acordada con Anthony (2026-10-23): 1-1000, valor = mejor momento del jugador.
# El motor trabaja por dentro con otra escala (la de la calibración de 1958). Esta tabla traduce,
# y arriba crece más deprisa: cuanto más alto el nivel, más pesa cada punto.
TABLA = [(1, 100), (100, 250), (230, 434), (380, 575), (450, 664), (520, 758), (580, 824),
         (630, 871), (690, 920), (760, 970), (850, 1040), (950, 1100), (1000, 1130)]

def _interp(x, pares):
    if x <= pares[0][0]: return pares[0][1]
    for (a, fa), (b, fb) in zip(pares, pares[1:]):
        if x <= b: return fa + (fb - fa) * (x - a) / (b - a)
    (a, fa), (b, fb) = pares[-2], pares[-1]
    return fb + (fb - fa) * (x - b) / (b - a)

def interno(nuevo): return round(_interp(nuevo, TABLA))
def nuevo(interno_): return round(_interp(interno_, [(b, a) for a, b in TABLA]))
