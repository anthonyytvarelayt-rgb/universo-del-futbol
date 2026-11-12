import json,csv,re
B='/tmp/claude-0/-home-user/53a70bdb-ffc0-5832-9935-b9a45e8481fd/scratchpad/it/'
C=json.load(open(B+'coaches.json'))
CLUB={'L.R. Vicenza':'Vicenza','Talmone Torino':'Torino','Simmenthal-Monza':'Monza'}
# Modena falta en la tabla de la Serie B: sale de la página de temporada del club
C.append(dict(division='Serie B',club='Modena',ppl=[['Aldo Campatelli','Italia','']],j=[1,9],desde='',hasta=''))
C.append(dict(division='Serie B',club='Modena',ppl=[['Gyula Lelovics','Hungría','']],j=[10,38],desde='',hasta=''))
EST={'Nereo Rocco':'muy defensivo: catenaccio con líbero y contragolpe',
'Giuseppe Viani':'defensivo: su "vianema" usaba un líbero detrás de la defensa (precursor del catenaccio)',
'Fulvio Bernardini':'ofensivo y técnico: juego de toque con jugadores de buen pie',
'Alfredo Foni':'defensivo: con su Inter campeón (1953 y 1954) usó un líbero y pocas concesiones'}
import coaches
A=open(B+'Serie_A_1958-1959.txt').read(); Bt=open(B+'Serie_B_1958-1959.txt').read()
DA=coaches.dates(A); DB=coaches.dates(Bt); DB.update({8:'1958-11-16',9:'1958-11-23',27:'1959-03-22',28:'1959-03-29'})
WIKI={'Serie A':'https://it.wikipedia.org/wiki/Serie_A_1958-1959','Serie B':'https://it.wikipedia.org/wiki/Serie_B_1958-1959'}
rows=[]
for x in C:
    D=DA if x['division']=='Serie A' else DB
    a,b=x['j']
    if x['club']=='Marzotto Valdagno' and b==34: b=38
    club=CLUB.get(x['club'],x['club'])
    ppl=x['ppl']
    if x['club']=='Catania' and len(ppl)==2: ppl[1][2]='director técnico'
    dt=[p for p in ppl if p[2]=='director técnico']
    main=dt[0] if dt else ppl[0]
    otros=[p for p in ppl if p is not main]
    dudas=[]
    if otros:
        for p in otros:
            dudas.append('%s (%s) figuraba como %s'%(p[0],p[1],'consejero técnico' if p[2]=='consejero' else 'entrenador junto al director técnico' if dt else 'coentrenador'))
        if dt: dudas.append('se pone como entrenador al director técnico, que llevaba la táctica')
    if x['club']=='Marzotto Valdagno' and a==18: dudas.append('Wikipedia pone 18ª-34ª; la Serie B tenía 38 jornadas, se supone hasta el final')
    if x['club']=='Modena': dudas.append('Modena no sale en la tabla de entrenadores de la Serie B; dato de la página de temporada del club')
    if x['club']=='Vigevano' and main[0]=='Marini': dudas.append('solo se conoce el apellido; interino una jornada')
    est=EST.get(main[0],'sin dato fiable')
    fuente=WIKI[x['division']]+(' ; https://it.wikipedia.org/wiki/Zenit_Modena_Football_Club_1958-1959' if x['club']=='Modena' else '')
    rows.append([x['division'],club,main[0],main[1],D.get(a,''),D.get(b,''),est,fuente,'J%d-J%d'%(a,b),'; '.join(dudas)])
with open('/mnt/project-files/datos/italia-entrenadores-1958-59.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['division','club','entrenador','nacionalidad','desde','hasta','estilo','fuente','jornadas','dudas']); w.writerows(rows)
print(len(rows))
for r in rows: print(r[:6],r[8],r[9][:80])
