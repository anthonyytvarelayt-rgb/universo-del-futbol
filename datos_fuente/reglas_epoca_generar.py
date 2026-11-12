import csv,sys
W="https://es.wikipedia.org/wiki/"; E="https://en.wikipedia.org/wiki/"
F3=E+"Three_points_for_a_win"; FS=E+"Substitute_(association_football)"
rows=[]
def lab(y,split=True): return f"{y}-{str(y+1)[2:]}" if split else str(y)
def per(y,table):
    for a,b,v in table:
        if a<=y<=b: return v
    return None
def pts(y,y3): return 3 if y>=y3 else 2
def subs_gen(y,start2=1967,c="baja"):
    if y<start2: return "0"
    if y<1994: return "2"
    if y==1994: return "2 + portero"
    if y<2019: return "3"
    if y==2019: return "3 (5 tras el parón COVID)"
    return "5"
def add(**k): rows.append(k)
COLS=["tipo","pais","liga","temporada","anio_inicio","disputada","motivo","formato","clubes","puntos_victoria","puntos_empate","cambios","limite_extranjeros","descensos","notas","fuente","confianza"]

# ---------- ESPAÑA ----------
for y in range(1930,2026):
    d="si";mot="";fmt="Liga a doble vuelta";n=per(y,[(1929,1933,10),(1934,1940,12),(1941,1949,14),(1950,1970,16),(1971,1986,18),(1987,1994,20),(1995,1996,22),(1997,2025,20)])
    if 1936<=y<=1938: d="no";mot="Guerra Civil";n=""
    sub=per(y,[(1929,1934,"0 (solo portero lesionado)"),(1935,1947,"0"),(1948,1968,"0 (solo portero lesionado)"),(1969,1994,"2"),(1995,2018,"3"),(2019,2019,"3 (5 tras el parón COVID)"),(2020,2030,"5")])
    ext=per(y,[(1929,1938,"Solo extranjeros con 2 años de residencia; muy pocos"),(1939,1946,"Prohibido fichar extranjeros (españolización 1940)"),(1947,1952,"Permitidos de nuevo (cupo pequeño, ~2-3)"),(1953,1961,"2 por club (al menos 1 hispanoamericano o filipino); oriundos aparte"),(1962,1972,"Cerrado a extranjeros nuevos; solo oriundos/nacionalizados"),(1973,1987,"2 por club"),(1988,1994,"3 en plantilla / 3 en campo (aprox.)"),(1995,2030,"Comunitarios sin límite (Bosman, dic. 1995); 3 extracomunitarios")])
    des=per(y,[(1929,1933,"1"),(1934,1949,"2 + promoción"),(1950,1970,"2-3 + promoción"),(1971,1985,"3"),(1986,1986,"1 (fase final por play-off)"),(1987,1994,"2 + 2 promoción"),(1995,1995,"0 (ampliación a 22)" ),(1996,1996,"4 + promoción"),(1997,1998,"2 + promoción"),(1999,2030,"3")])
    nota=""
    if y==1995: nota="Sevilla y Celta descendidos por la vía administrativa y readmitidos: liga a 22. Primera temporada a 3 puntos."
    if y==1986: nota="Liga 1986-87 con segunda fase (play-off) por grupos."
    if y==1939: nota="Se reanuda tras la guerra."
    add(tipo="liga",pais="España",liga="Primera División",temporada=lab(y),anio_inicio=y,disputada=d,motivo=mot,formato=fmt if d=="si" else "",clubes=n,puntos_victoria=pts(y,1995) if d=="si" else "",puntos_empate=1 if d=="si" else "",cambios=sub if d=="si" else "",limite_extranjeros=ext,descensos=des if d=="si" else "",ascensos="",notas=nota,fuente=W+"Primera_División_de_España ; https://www.bdfutbol.com/foro/printthread.php?tid=1538 (cambios) ; "+F3,confianza="alta (clubes, puntos, guerra); media (cambios, extranjeros, descensos)")

# ---------- ITALIA ----------
for y in range(1930,2026):
    d="si";mot="";n=per(y,[(1929,1933,18),(1934,1942,16),(1945,1945,25),(1946,1946,20),(1947,1947,21),(1948,1951,20),(1952,1966,18),(1967,1987,16),(1988,2003,18),(2004,2030,20)]);fmt="Liga a doble vuelta"
    if y in(1943,1944): d="no";mot="Segunda Guerra Mundial (Campionato Alta Italia 1944 no oficial)";n=""
    if y==1945: fmt="Divisione Nazionale: grupo Alta Italia (14) y Centro-Sur (11) + fase final de 8 (título oficial, Torino)"
    sub=per(y,[(1929,1964,"0"),(1965,1967,"0 (solo portero lesionado)"),(1968,1987,"1 (13º jugador)"),(1988,1993,"2"),(1994,1994,"2 + portero"),(1995,2018,"3"),(2019,2019,"3 (5 tras el parón COVID)"),(2020,2030,"5")])
    ext=per(y,[(1929,1945,"Prohibidos extranjeros (Carta de Viareggio 1926); oriundos permitidos"),(1946,1952,"Permitidos (cupo variable, de 5 a 3-2 por club)"),(1953,1965,"Cupo reducido (1-2 nuevos) + oriundos"),(1966,1979,"Cerrado a extranjeros (tras el Mundial 1966)"),(1980,1981,"1 por club"),(1982,1987,"2 por club"),(1988,1994,"3 por club"),(1995,2030,"Comunitarios sin límite (Bosman); extracomunitarios limitados (~2-3 fichajes/año)")])
    des=per(y,[(1929,1945,"2"),(1946,1950,"3-4 (variable)"),(1951,1951,"3 + desempate (reducción a 18)"),(1952,1966,"3"),(1967,1987,"3"),(1988,2002,"4"),(2003,2003,"2 + promoción (ampliación a 20)"),(2004,2030,"3")])
    nota="21 clubes por motivos políticos (Trieste)" if y==1947 else ("Primera temporada a 3 puntos" if y==1994 else "")
    add(tipo="liga",pais="Italia",liga="Serie A",temporada=lab(y),anio_inicio=y,disputada=d,motivo=mot,formato=fmt if d=="si" else "",clubes=n,puntos_victoria=pts(y,1994) if d=="si" else "",puntos_empate=1 if d=="si" else "",cambios=sub if d=="si" else "",limite_extranjeros=ext,descensos=des if d=="si" else "",ascensos="",notas=nota,fuente=E+"Serie_A ; https://sport.virgilio.it/sostituzioni-nel-calcio-come-funzionano-e-come-sono-cambiate-nel-tempo-794125 ; "+F3,confianza="alta (clubes, puntos, guerra); media (cambios, descensos); baja (cupos de extranjeros antes de 1966)")

# ---------- INGLATERRA ----------
for y in range(1930,2026):
    d="si";mot="";n=per(y,[(1919,1986,22),(1987,1987,21),(1988,1990,20),(1991,1994,22),(1995,2030,20)])
    liga="Premier League" if y>=1992 else "First Division"
    if 1939<=y<=1945: d="no";mot="Segunda Guerra Mundial (1939-40 anulada tras 3 jornadas; ligas regionales de guerra)";n=""
    sub=per(y,[(1930,1964,"0"),(1965,1965,"1 (solo por lesión)"),(1966,1986,"1"),(1987,1993,"2"),(1994,1994,"2 + portero"),(1995,2018,"3"),(2019,2019,"3 (5 tras el parón COVID)"),(2020,2021,"3"),(2022,2030,"5")])
    ext=per(y,[(1930,1977,"Prohibidos profesionales no británicos sin 2 años de residencia (FA, 1931)"),(1978,1994,"Sin cupo fijo; permiso de trabajo para no comunitarios"),(1995,2009,"Comunitarios libres (Bosman); no comunitarios con permiso de trabajo"),(2010,2020,"8 formados en casa en lista de 25; permiso de trabajo"),(2021,2030,"Post-Brexit: todos los extranjeros necesitan puntos GBE; 8 formados en casa")])
    des=per(y,[(1930,1972,"2"),(1973,1985,"3"),(1986,1986,"2 + 1 play-off"),(1987,1987,"3 + 1 play-off"),(1988,1989,"3"),(1990,1990,"2 (ampliación a 22)"),(1991,1993,"3"),(1994,1994,"4 (reducción a 20)"),(1995,2030,"3")])
    nota="Primera liga del mundo en dar 3 puntos" if y==1981 else ("Nace la Premier League" if y==1992 else "")
    add(tipo="liga",pais="Inglaterra",liga=liga,temporada=lab(y),anio_inicio=y,disputada=d,motivo=mot,formato="Liga a doble vuelta" if d=="si" else "",clubes=n,puntos_victoria=pts(y,1981) if d=="si" else "",puntos_empate=1 if d=="si" else "",cambios=sub if d=="si" else "",limite_extranjeros=ext,descensos=des if d=="si" else "",ascensos="",notas=nota,fuente=E+"Premier_League ; "+E+"Football_League_First_Division ; "+F3+" ; "+FS,confianza="alta (clubes, puntos, guerra, descensos); media (cambios y extranjeros)")

# ---------- ALEMANIA ----------
for y in range(1930,2026):
    d="si";mot="";n="";liga="Bundesliga" if y>=1963 else "Campeonato alemán"
    if y<1933: fmt="Ligas regionales + fase final por eliminatorias (campeón de Alemania)"
    elif y<1944: fmt="Gauligen (16 o más regiones) + fase final"
    elif y<1947: fmt=""; d="no"; mot="Segunda Guerra Mundial y posguerra (1944-45 suspendida; sin campeonato nacional 1945-47)"
    elif y<1963: fmt="Oberligas regionales (Norte, Oeste, Sudoeste, Sur, Berlín) + fase final"
    else:
        fmt="Liga a doble vuelta"; n=per(y,[(1963,1964,16),(1965,1990,18),(1991,1991,20),(1992,2030,18)])
    sub=per(y,[(1930,1966,"0"),(1967,1993,"2"),(1994,1994,"2 + portero"),(1995,2018,"3"),(2019,2019,"3 (5 tras el parón COVID)"),(2020,2030,"5")])
    ext=per(y,[(1930,1962,"Amateurismo/semiprofesionalismo; casi sin extranjeros"),(1963,1991,"Máximo 2-3 extranjeros por club (aprox.)"),(1992,1994,"3 extranjeros en campo + 2 'asimilados'"),(1995,2000,"Comunitarios libres (Bosman); 3 no comunitarios en campo"),(2001,2005,"Sin cupo de extranjeros; mínimo de alemanes en plantilla"),(2006,2030,"Regla de jugadores locales (12 alemanes, 8 formados en casa)")])
    des=per(y,[(1930,1962,"Descensos dentro de cada liga regional"),(1963,1973,"2"),(1974,1980,"3"),(1981,1990,"2 + promoción (16º)"),(1991,1991,"4 (reducción a 18)"),(1992,2007,"3"),(2008,2030,"2 + promoción (16º)")])
    nota={1963:"Nace la Bundesliga",1991:"Reunificación: entran Hansa Rostock y Dynamo Dresden (RDA)",1995:"Primera temporada a 3 puntos",1949:"Desde 1949-50 existe aparte la DDR-Oberliga (RDA) hasta 1990-91"}.get(y,"")
    add(tipo="liga",pais="Alemania",liga=liga,temporada=lab(y),anio_inicio=y,disputada=d,motivo=mot,formato=fmt,clubes=n,puntos_victoria=pts(y,1995) if d=="si" else "",puntos_empate=1 if d=="si" else "",cambios=sub if d=="si" else "",limite_extranjeros=ext,descensos=des if d=="si" else "",ascensos="",notas=nota,fuente=E+"Bundesliga ; "+E+"German_football_championship ; https://web.de/magazine/sport/fussball/otto-rehhagels-wechselfehler-25-jahren-38703610 ; "+F3,confianza="alta (formato, clubes, puntos, guerra); media (descensos, cambios); baja (extranjeros 1963-1991)")

# ---------- FRANCIA ----------
for y in range(1930,2026):
    d="si";mot="";fmt="Liga a doble vuelta"
    n=per(y,[(1932,1932,20),(1933,1933,14),(1934,1938,16),(1945,1945,18),(1946,1946,20),(1947,1957,18),(1958,1962,20),(1963,1964,18),(1965,1967,20),(1968,1969,18),(1970,1996,20),(1997,2001,18),(2002,2022,20),(2023,2030,18)])
    if y<1932: d="no";mot="Antes de la liga profesional (solo campeonatos regionales/amateurs)";n=""
    elif 1939<=y<=1944: d="no";mot="Segunda Guerra Mundial (campeonatos de guerra no oficiales)";n=""
    if y==1932: fmt="Dos grupos de 10 + final"
    p=pts(y,1994); pe=1
    nota=""
    if 1973<=y<=1975: nota="Punto extra por ganar por 3 o más goles (bonus ofensivo)"
    if y==1988: nota="Prueba de 3 puntos por victoria"; p=3
    if y==2019: nota="Liga detenida en la jornada 28 por la COVID; clasificación por puntos por partido"
    sub=per(y,[(1930,1966,"0"),(1967,1993,"2"),(1994,1994,"2 + portero"),(1995,2018,"3"),(2019,2019,"3 (temporada suspendida)"),(2020,2030,"5")])
    ext=per(y,[(1930,1938,"Cupo de extranjeros por club (≈5, luego 3)"),(1945,1987,"2-3 extranjeros por club (aprox.)"),(1988,1994,"3 extranjeros por club"),(1995,2030,"Comunitarios libres (Bosman); 4 extracomunitarios")]) or ""
    des=per(y,[(1932,1994,"2 + promoción (3º por la cola)"),(1995,2001,"3"),(2002,2015,"3"),(2016,2021,"2 + promoción (18º)"),(2022,2022,"4 (reducción a 18)"),(2023,2030,"2 + promoción (16º)")])
    add(tipo="liga",pais="Francia",liga="Division 1" if y<2002 else "Ligue 1",temporada=lab(y),anio_inicio=y,disputada=d,motivo=mot,formato=fmt if d=="si" else "",clubes=n,puntos_victoria=p if d=="si" else "",puntos_empate=pe if d=="si" else "",cambios=sub if d=="si" else "",limite_extranjeros=ext,descensos=des if d=="si" else "",ascensos="",notas=nota,fuente=E+"Ligue_1 ; "+F3,confianza="alta (clubes, puntos, guerra); media (descensos); baja (cambios antes de 1994, extranjeros)")

# ---------- PORTUGAL ----------
for y in range(1930,2026):
    d="si";mot="";fmt="Liga a doble vuelta"
    n=per(y,[(1934,1938,8),(1939,1939,10),(1940,1940,8),(1941,1941,12),(1942,1944,10),(1945,1945,12),(1946,1970,14),(1971,1986,16),(1987,1988,20),(1989,1989,18),(1990,1990,20),(1991,2005,18),(2006,2013,16),(2014,2030,18)])
    if y<1934: d="no";mot="Sin liga: el título era el Campeonato de Portugal (copa, 1922-1938)";n=""
    elif y<1938: fmt="Campeonato da Liga experimental (el título oficial seguía siendo el Campeonato de Portugal)"
    sub=subs_gen(y)
    ext=per(y,[(1930,1959,"Permitidos con cupo pequeño (aprox.)"),(1960,1977,"Cerrado a extranjeros; jugadores de las colonias (Angola, Mozambique) cuentan como portugueses"),(1978,1994,"2-3 extranjeros por club"),(1995,2030,"Comunitarios libres (Bosman); sin cupo estricto de extracomunitarios")])
    des=per(y,[(1934,1945,"0-2 (variable, ampliaciones)"),(1946,1986,"2 (+ liguilla algunos años)"),(1987,1990,"variable (cambios de tamaño)"),(1991,2005,"3"),(2006,2013,"2"),(2014,2020,"2"),(2021,2030,"2 + promoción (16º)")])
    nota="Primera liga oficial (Campeonato Nacional da Primeira Divisão)" if y==1938 else ("Primera temporada a 3 puntos" if y==1995 else "")
    add(tipo="liga",pais="Portugal",liga="Primeira Divisão" if y<1999 else "Primeira Liga",temporada=lab(y),anio_inicio=y,disputada=d,motivo=mot,formato=fmt if d=="si" else "",clubes=n,puntos_victoria=pts(y,1995) if d=="si" else "",puntos_empate=1 if d=="si" else "",cambios=sub if d=="si" else "",limite_extranjeros=ext,descensos=des if d=="si" else "",ascensos="",notas=nota,fuente=E+"Primeira_Liga ; "+F3,confianza="alta (clubes, puntos); media (cierre a extranjeros 1960-78); baja (cambios, descensos)")

# ---------- ARGENTINA ----------
arg=[]
for y in range(1930,1985): arg.append((str(y),y))
for y in range(1985,2013): arg.append((lab(y),y))
arg+= [("2013-14",2013),("2014",2014),("2015",2015),("2016",2016),("2016-17",2016),("2017-18",2017),("2018-19",2018),("2019-20",2019),("2020",2020)]+[(str(y),y) for y in range(2021,2027)]
for t,y in arg:
    d="si";mot="";nota=""
    if y==1930: fmt="Amateur (AAF), un torneo anual";n=36
    elif y<=1966: fmt="Profesional (desde 1931), un torneo anual a doble vuelta";n=18;nota="Número de clubes entre 16 y 22 según el año" if y>1931 else "Nace el profesionalismo (Liga Argentina de Football)"
    elif y<=1984: fmt="Dos campeonatos al año: Metropolitano (liga) y Nacional (grupos + eliminatorias)";n=22;nota="Clubes aproximados del Metropolitano; el Nacional tuvo de 16 a 32"
    elif t in("2012-13","2013-14"): fmt="Torneos Inicial y Final (un campeón cada uno)";n=20
    elif y<=1990: fmt="Temporada a la europea, liga a doble vuelta";n=20
    elif y<=2011: fmt="Apertura y Clausura (dos campeones por temporada)";n=20
    elif t=="2014": fmt="Torneo de Transición (una vuelta)";n=20
    elif t in("2015","2016"): fmt="Torneo anual de 30 clubes" if t=="2015" else "Torneo corto de 30 clubes (dos zonas)";n=30
    elif t=="2016-17": fmt="Torneo largo";n=30
    elif t=="2017-18": fmt="Superliga";n=28
    elif t=="2018-19": fmt="Superliga";n=26
    elif t=="2019-20": fmt="Superliga + Copa de la Superliga (cancelada por COVID)";n=24
    elif t=="2020": fmt="Copa Diego Maradona (torneo especial COVID)";n=24
    elif y<=2024: fmt="Liga Profesional + Copa de la Liga";n=28 if y>=2022 else 26
    else: fmt="Apertura y Clausura en dos zonas + eliminatorias";n=30
    p=pts(y,1995)
    if t=="1995-96" or y>=1995: p=3
    sub="0" if y<1967 else ("2" if y<1995 else ("3" if y<2020 else "5"))
    ext=per(y,[(1930,1990,"Cupo bajo (≈2-3 extranjeros por club, aprox.)"),(1991,2030,"Cupo de extranjeros (hoy 6 en plantilla / 5 en campo, aprox.)")])
    des=per(y,[(1930,1936,"0 (aprox.)"),(1937,1956,"1-2 por tabla"),(1957,1963,"Promedios (2)"),(1964,1982,"1-2 por tabla"),(1983,2013,"2 por promedios (+ promoción 1999-2013)"),(2014,2014,"0"),(2015,2015,"0-2"),(2016,2018,"2-4 por promedios"),(2019,2021,"0 (suspendidos por COVID)"),(2022,2030,"2 (promedios y tabla anual)")])
    add(tipo="liga",pais="Argentina",liga="Primera División",temporada=t,anio_inicio=y,disputada=d,motivo=mot,formato=fmt,clubes=n,puntos_victoria=p,puntos_empate=1,cambios=sub,limite_extranjeros=ext,descensos=des,ascensos="",notas=nota,fuente=E+"Argentine_Primera_División ; "+F3,confianza="alta (formatos, puntos); media (clubes 1985-2026); baja (clubes 1931-1984, cambios, extranjeros)")

# ---------- BRASIL ----------
bra={1959:16,1960:17,1961:20,1962:21,1963:20,1964:23,1965:22,1966:22,1967:21,1968:23,1971:20,1972:26,1973:40,1974:40,1975:42,1976:54,1977:62,1978:74,1979:94,1980:44,1981:44,1982:44,1983:44,1984:41,1985:44,1986:48,1987:16,1988:24,1989:22,1990:20,1991:20,1992:20,1993:32,1994:24,1995:24,1996:24,1997:26,1998:24,1999:22,2000:116,2001:28,2002:26,2003:24,2004:24,2005:22}
rob={1967:15,1968:17,1969:17,1970:17}
desb={1988:"4",1989:"2",1990:"2",1991:"2",1992:"0",1993:"0 (fórmula de grupos)",1994:"4",1995:"2",1996:"0 (descensos anulados)",1997:"4",1998:"4",1999:"2 (promedios)",2000:"—",2001:"4",2002:"4",2003:"2",2004:"4",2005:"4"}
for y in range(1930,2027):
    d="si";mot="";nota="";n=""
    if y<1959: d="no";mot="Sin campeonato nacional: solo estatales (Paulista, Carioca, Mineiro, Gaúcho...)";fmt="";nota="Torneo Rio-São Paulo en 1933 y 1950-1966" if y in(1933,) or y>=1950 else ""
    elif y<=1970:
        parts=[]
        if y<=1968: parts.append(f"Taça Brasil (eliminatorias de campeones estatales, {bra[y]} clubes)")
        if y>=1967: parts.append(f"Robertão / Torneo Roberto Gomes Pedrosa (grupos + cuadrangular, {rob[y]} clubes)")
        fmt=" + ".join(parts); n=bra.get(y,rob.get(y)); nota="Los estatales siguen siendo muy importantes"
    elif y<=2002: fmt="Campeonato Brasileiro: fases de grupos + eliminatorias (fórmula cambia casi cada año)"; n=bra[y]
    else: fmt="Liga a doble vuelta (puntos corridos)"; n=bra.get(y,20)
    if y==1987: nota="Copa União (16) reconocida; Módulo Amarillo aparte"
    if y==2000: nota="Copa João Havelange (116 clubes en 4 módulos)"
    p=""
    if d=="si":
        p=3 if y>=1995 else 2
        if 1975<=y<=1977: nota+=(" ; " if nota else "")+"Punto extra por ganar por 2 o más goles (aprox.)"
        if y==1988: p=3; nota+=" ; Empate a penales: ganador 2 pts, perdedor 1"
    sub="" if d=="no" else ("2" if y<1995 else ("3" if y<2020 else "5"))
    ext=per(y,[(1930,1989,"Pocos extranjeros; sin cupo relevante en la práctica"),(1990,2013,"3 extranjeros por partido"),(2014,2022,"5 extranjeros por partido"),(2023,2030,"7-9 extranjeros por partido (ampliado)")])
    des="" if d=="no" else (desb.get(y,"Sin descenso (acceso por estatales/invitación)") if y<2006 else "4")
    add(tipo="liga",pais="Brasil",liga="Campeonato Brasileiro (Série A)" if y>=1971 else ("Taça Brasil / Robertão" if y>=1959 else "Campeonatos estatales"),temporada=str(y),anio_inicio=y,disputada=d,motivo=mot,formato=fmt,clubes=n,puntos_victoria=p,puntos_empate=1 if d=="si" else "",cambios=sub,limite_extranjeros=ext,descensos=des,ascensos="",notas=nota,fuente=E+"Campeonato_Brasileiro_Série_A ; "+E+"Taça_Brasil ; "+F3,confianza="alta (2003-2025, puntos); media (clubes 1971-2002); baja (descensos 1988-2002, extranjeros, bonus 1975-77)")

# ---------- COPAS INTERNACIONALES Y NACIONALES ----------
cups=[
("copa_internacional","Mundo","Copa del Mundo FIFA",1930,"Cada 4 años; no se jugó en 1942 ni 1946 (guerra). 48 selecciones desde 2026.","alta"),
("copa_internacional","Sudamérica","Campeonato Sudamericano / Copa América",1916,"Irregular; nombre Copa América desde 1975.","alta"),
("copa_internacional","Europa","Copa Mitropa (Europa Central: Italia, Austria, Hungría, Checoslovaquia...)",1927,"Fuerte hasta 1940; continuó de forma menor 1955-1992. Útil para Italia en los años 30.","alta"),
("copa_internacional","Europa","Copa Latina (campeones de España, Italia, Francia y Portugal)",1949,"1949-1957.","alta"),
("copa_internacional","Europa","Copa de Europa (Champions League desde 1992-93)",1955,"Primera edición 1955-56. Liguilla de grupos desde 1991-92; no campeones desde 1997-98; nuevo formato de liga de 36 desde 2024-25.","alta"),
("copa_internacional","Europa","Copa de Ferias / Copa de la UEFA / Europa League",1955,"Copa de Ferias 1955-58 a 1970-71; Copa de la UEFA 1971-72; Europa League 2009-10.","alta"),
("copa_internacional","Europa","Recopa de Europa",1960,"1960-61 a 1998-99.","alta"),
("copa_internacional","Europa","Supercopa de Europa",1972,"Oficial desde 1973.","alta"),
("copa_internacional","Europa","Conference League",2021,"Desde 2021-22.","alta"),
("copa_internacional","Europa","Eurocopa",1960,"Cada 4 años.","alta"),
("copa_internacional","Sudamérica","Copa Libertadores",1960,"Clubes brasileños no participaron en 1966, 1969 y 1970. Final única desde 2019.","alta"),
("copa_internacional","Sudamérica","Supercopa Libertadores",1988,"1988-1997.","alta"),
("copa_internacional","Sudamérica","Copa Conmebol",1992,"1992-1999.","alta"),
("copa_internacional","Sudamérica","Copa Sudamericana",2002,"Sucede a Merconorte/Mercosur (1998-2001).","alta"),
("copa_internacional","Sudamérica","Recopa Sudamericana",1989,"Anual.","alta"),
("copa_internacional","Mundo","Copa Intercontinental",1960,"1960-2004 (Europa vs Sudamérica).","alta"),
("copa_internacional","Mundo","Mundial de Clubes FIFA",2000,"2000 y desde 2005; formato de 32 clubes en 2025.","alta"),
("copa_nacional","España","Copa del Rey / Copa del Generalísimo",1903,"Copa del Generalísimo 1939-1976.","alta"),
("copa_nacional","Inglaterra","FA Cup",1871,"No se jugó 1939-1945. League Cup desde 1960-61.","alta"),
("copa_nacional","Italia","Coppa Italia",1922,"Edición única 1922; regular desde 1935-36 (parón 1943-1958).","alta"),
("copa_nacional","Alemania","DFB-Pokal (Tschammerpokal 1935-1943)",1935,"Reanudada 1952-53.","alta"),
("copa_nacional","Francia","Coupe de France",1917,"Se jugó también en la guerra.","alta"),
("copa_nacional","Portugal","Taça de Portugal",1938,"Sucede al Campeonato de Portugal (1922-1938).","alta"),
("copa_nacional","Brasil","Copa do Brasil",1989,"","alta"),
("copa_nacional","Argentina","Copa Argentina",1969,"Ediciones sueltas 1969-1970; regular desde 2011-12.","media"),
]
for tp,pa,nom,y,nota,c in cups:
    add(tipo=tp,pais=pa,liga=nom,temporada=str(y),anio_inicio=y,disputada="si",formato="",notas=nota,fuente=W+nom.split(" (")[0].split(" /")[0].replace(" ","_"),confianza=c)
glob=[
(1958,"IFAB permite sustituciones (1 cambio) en algunas competiciones; en los Mundiales desde 1970.","media"),
(1965,"Goles de visitante en copas europeas (abolidos en 2021-22).","alta"),
(1970,"Tarjetas amarilla y roja (Mundial 1970).","alta"),
(1970,"Tanda de penaltis aprobada por la IFAB (antes: sorteo o desempate).","alta"),
(1992,"Prohibido al portero coger con la mano la cesión con el pie.","alta"),
(1993,"Gol de oro en algunas competiciones (hasta 2004).","alta"),
(1995,"Sentencia Bosman (15-dic-1995): comunitarios libres y traspasos libres al acabar contrato en Europa.","alta"),
(2017,"VAR: Serie A y Bundesliga 2017-18; LaLiga y Ligue 1 2018-19; Premier 2019-20.","alta"),
(2020,"5 cambios por la COVID (permanentes desde 2022).","alta"),
]
for y,t,c in glob:
    add(tipo="regla_global",pais="Mundo",liga="Reglamento",temporada=str(y),anio_inicio=y,disputada="",notas=t,fuente=FS+" ; "+E+"Bosman_ruling",confianza=c)
out=sys.argv[1]
with open(out,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=COLS); w.writeheader()
    for r in rows: w.writerow({k:r.get(k,"") for k in COLS})
print(len(rows))
