from build import *
import csv
ST=json.load(open(OUT+'stadi.json'))
ALI={'ACR Messina (1947-1998)':'Messina','Venezia (1907-1987)':'Venezia','Simmenthal-Monza':'Monza'}
ST={ALI.get(k,k):(v[0].replace('| ','').strip(),v[1]) for k,v in ST.items()}
ST['Monza']=('Monza','Stadio Gino Alfonso Sada')
COL={'Alessandria':('#8C8C8C','#FFFFFF'),'Bari':('#FFFFFF','#E30613'),'Bologna':('#A21C26','#1A2F48'),'Fiorentina':('#5B2A86','#FFFFFF'),'Genoa':('#A6192E','#002147'),'Inter':('#0068A8','#000000'),'Juventus':('#FFFFFF','#000000'),'Vicenza':('#E2001A','#FFFFFF'),'Lazio':('#87D8F7','#FFFFFF'),'Milan':('#FB090B','#000000'),'Napoli':('#12A0D7','#FFFFFF'),'Padova':('#FFFFFF','#C8102E'),'Roma':('#8E1F2F','#F0BC42'),'Sampdoria':('#1B5497','#FFFFFF'),'SPAL':('#6CACE4','#FFFFFF'),'Torino':('#881F19','#FFFFFF'),'Triestina':('#E2001A','#FFFFFF'),'Udinese':('#FFFFFF','#000000'),
'Atalanta':('#1E71B8','#000000'),'Brescia':('#0A3D91','#FFFFFF'),'Cagliari':('#A6192E','#002147'),'Catania':('#E2001A','#1E5AA8'),'Como':('#0A3E8C','#FFFFFF'),'Lecco':('#0055A5','#87CEEB'),'Marzotto Valdagno':('#FFFFFF','#1E5AA8'),'Messina':('#FFD700','#E2001A'),'Modena':('#FFD700','#0A3D91'),'Novara':('#2B65EC','#FFFFFF'),'Palermo':('#F7A8C0','#000000'),'Parma':('#FFFFFF','#000000'),'Prato':('#1E5AA8','#FFFFFF'),'Reggiana':('#7A1E2C','#FFFFFF'),'Sambenedettese':('#E2001A','#0A3D91'),'Monza':('#E2001A','#FFFFFF'),'Taranto':('#E2001A','#1E3C8C'),'Venezia':('#00703C','#000000'),'Verona':('#FFDD00','#003DA5'),'Vigevano':('#FFFFFF','#E2001A'),
'Mantova':('#E2001A','#FFFFFF'),'Catanzaro':('#FFD700','#A6192E'),'Pro Patria':('#0A3D91','#FFFFFF'),'Foggia':('#E2001A','#000000'),'Lucchese':('#E2001A','#000000'),'Cosenza':('#E2001A','#0A3D91')}
EXTRA={'Mantova':('Mantova','Stadio Danilo Martelli'),'Catanzaro':('Catanzaro','Stadio Comunale'),'Pro Patria':('Busto Arsizio','Stadio Carlo Speroni'),'Foggia':('Foggia','Stadio Pino Zaccheria'),'Lucchese':('Lucca','Stadio Porta Elisa'),'Cosenza':('Cosenza','Stadio Città di Cosenza')}
with open('/mnt/project-files/datos/italia-clubes-1958-59.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['club','ciudad','estadio','color1','color2','prestigio'])
    for L in ('IT1','IT2'):
        for s,c in sorted(clubs(L,1958),key=lambda sc:-pres(sc[1])):
            n=CN[sc[1]] if False else CN[c]; ci,es=ST[n]; c1,c2=COL[n]; w.writerow([n,ci,es,c1,c2,pres(c)])
# clubes que subieron de Serie C en 1959-63 (llegan a la Serie B)
SUB=[]
for y in range(1958,1962):
    A=set(c for s,c in clubs('IT1',y)); B=set(c for s,c in clubs('IT2',y)); B2=set(c for s,c in clubs('IT2',y+1))
    for c in sorted(B2-B-A): SUB.append((y+1,c))
with open('/mnt/project-files/datos/italia-ascendidos-serie-c-1959-63.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['temporada','club','ciudad','estadio','color1','color2','prestigio','nota'])
    for y,c in SUB:
        n=CN[c]; ci,es=ST.get(n) or EXTRA[n]; c1,c2=COL[n]; p=PR[n]
        nota='prestigio calculado con su historial (%d temporadas en A y %d en B hasta 1958)'%(p['A'],p['B'])
        if c not in NICE and p['prestigio']<300: nota+='; la fórmula daba %d, se sube al mínimo de 300 para clubes recién ascendidos'%p['prestigio']
        if c in NICE: nota='vuelve tras bajar a Serie C; ya está en italia-clubes-1958-59.csv'
        w.writerow(['%d-%02d'%(y,(y+1)%100),n,ci,es,c1,c2,pres(c),nota])
        print(y,n,pres(c))
