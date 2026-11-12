import json,csv
from rate import PAUL,CAR,PR
D='/mnt/project-files/datos/'
o=json.load(open('out58.json'))
ORD={c:i for i,c in enumerate(PAUL+CAR)}
import collections
NEED={'POR':2,'DEF':6,'MED':6,'DEL':6}
for club in PAUL+CAR:
    have=collections.Counter(x['pos'] for x in o if x['club']==club)
    n=0
    for p,k in NEED.items():
        for i in range(max(0,k-have[p])):
            n+=1
            lv=round(300+0.45*PR[club]-40+((n*37)%21-10))
            yr=1930+(n*7)%9
            o.append(dict(division='Campeonato Paulista' if club in PAUL else 'Campeonato Carioca',club=club,nombre=f'Relleno {club} {n:02d}',pos=p,nac=f'{yr}-07-01 (inventado)',pais='Brasil',liga='0 / 0',nivel=lv,techo=lv+10,nombre_completo='',fuente='relleno',nota='RELLENO: jugador genérico, no real (sin datos de la plantilla de 1958); el motor puede retirarlo pronto'))
o.sort(key=lambda x:(ORD[x['club']],{'POR':0,'DEF':1,'MED':2,'DEL':3}[x['pos']],-x['nivel']))
F=['division','club','nombre','pos','nac','pais','liga','nivel','techo','nombre_completo','fuente','nota']
with open(D+'brasil-1958-59-plantillas.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=F,extrasaction='ignore');w.writeheader();w.writerows(o)
d=json.load(open('deb.json'))
F2=['division','club','nombre','pos','nac','pais','liga','nivel','techo','debut','tipo','fuente','nota']
with open(D+'brasil-debutantes-1959-63.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=F2,extrasaction='ignore');w.writeheader();w.writerows(d)
C=[("Santos","Santos","Vila Belmiro","#FFFFFF","#000000"),("São Paulo","São Paulo","Pacaembu","#FFFFFF","#E30613"),("Corinthians","São Paulo","Parque São Jorge / Pacaembu","#FFFFFF","#000000"),("Palmeiras","São Paulo","Palestra Itália","#006437","#FFFFFF"),("XV de Piracicaba","Piracicaba","Roberto Gomes Pedrosa","#000000","#FFFFFF"),("Portuguesa","São Paulo","Canindé","#E30613","#007A33"),("Noroeste","Bauru","Alfredo de Castilho","#E30613","#FFFFFF"),("Botafogo-SP","Ribeirão Preto","Luiz Pereira","#E30613","#000000"),("Taubaté","Taubaté","Joaquinzão","#1E3A8A","#FFFFFF"),("Nacional-SP","São Paulo","Nicolau Alayon","#003DA5","#FFFFFF"),("Ferroviária","Araraquara","Fonte Luminosa","#7B1E3A","#FFFFFF"),("Portuguesa Santista","Santos","Ulrico Mursa","#E30613","#007A33"),("América-SP","São José do Rio Preto","Mário Alves Mendonça","#E30613","#FFFFFF"),("Ponte Preta","Campinas","Moisés Lucarelli","#000000","#FFFFFF"),("Juventus","São Paulo","Rua Javari","#7B1E3A","#FFFFFF"),("Guarani","Campinas","Brinco de Ouro","#007A33","#FFFFFF"),("Comercial-SP","São Paulo","Pacaembu","#E30613","#000000"),("XV de Jaú","Jaú","Zezinho Magalhães","#00843D","#FFD100"),("Jabaquara","Santos","Espanha","#FFD100","#E30613"),("Ypiranga-SP","São Paulo","Ypiranga","#E30613","#000000"),
("Vasco da Gama","Rio de Janeiro","São Januário","#000000","#FFFFFF"),("Flamengo","Rio de Janeiro","Maracanã / Gávea","#E30613","#000000"),("Botafogo","Rio de Janeiro","General Severiano","#000000","#FFFFFF"),("Fluminense","Rio de Janeiro","Laranjeiras","#7A0019","#006437"),("America-RJ","Rio de Janeiro","Campos Sales","#E30613","#FFFFFF"),("Bangu","Rio de Janeiro","Proletário Guilherme da Silveira","#E30613","#FFFFFF"),("Portuguesa-RJ","Rio de Janeiro","Ilha do Governador","#E30613","#007A33"),("São Cristóvão","Rio de Janeiro","Figueira de Melo","#FFFFFF","#1C1C1C"),("Madureira","Rio de Janeiro","Conselheiro Galvão","#FFD100","#003DA5"),("Canto do Rio","Niterói","Caio Martins","#1E3A8A","#FFFFFF"),("Bonsucesso","Rio de Janeiro","Leônidas da Silva","#003DA5","#E30613"),("Olaria","Rio de Janeiro","Rua Bariri","#003DA5","#FFFFFF")]
with open(D+'brasil-clubes-1958-59.csv','w',newline='') as f:
    w=csv.writer(f);w.writerow(['club','ciudad','estadio','color1','color2','prestigio'])
    for c in C: w.writerow([*c,PR[c[0]]])
E=[("Santos","Lula (Luís Alonso Pérez)","Brasil","1954","1966","ofensivo","https://pt.wikipedia.org/wiki/Lula_(treinador)",""),
("São Paulo","Béla Guttmann / Manuel Raymundo / Armando Renganeschi","Hungría / Brasil / Argentina","1958","1958","sin dato fiable","https://en.wikipedia.org/wiki/1958_S%C3%A3o_Paulo_FC_season","tres entrenadores en el año; Renganeschi termina 1958"),
("Corinthians","","","","","sin dato fiable","","sin fuente encontrada"),
("Palmeiras","Oswaldo Brandão","Brasil","1958","1960","sin dato fiable","memoria (sin fuente en línea)","seguro en 1959 (campeón paulista); 1958 no confirmado"),
("Portuguesa","Flávio Costa","Brasil","1957","1958","sin dato fiable","https://pt.wikipedia.org/wiki/Fl%C3%A1vio_Costa",""),
("XV de Piracicaba","Armando Renganeschi","Argentina","1958","1958","sin dato fiable","https://pt.wikipedia.org/wiki/Armando_Renganeschi","antes de pasar a São Paulo"),
("Jabaquara","Wilson Francisco Alves","Brasil","1958","1958","sin dato fiable","https://pt.wikipedia.org/wiki/Wilson_Francisco_Alves",""),
("Vasco da Gama","Gradim","Brasil","1957","1959","sin dato fiable","https://pt.wikipedia.org/wiki/Gradim","campeón Carioca y Rio-São Paulo 1958"),
("Flamengo","Fleitas Solich","Paraguay","1953","1959","ofensivo","memoria (sin fuente en línea)","Wikipedia cita a Jaime de Almeida en 1958 (posible interino)"),
("Botafogo","João Saldanha","Brasil","1957","1959","ofensivo","memoria (sin fuente en línea)","Wikipedia cita a Marinho Rodrigues en 1958"),
("Fluminense","Sylvio Pirillo / Jorge Vieira","Brasil","1958","1958","sin dato fiable","https://pt.wikipedia.org/wiki/Sylvio_Pirillo","Zezé Moreira posible; no confirmado"),
("America-RJ","Jorge Vieira","Brasil","1958","1958","sin dato fiable","https://pt.wikipedia.org/wiki/Jorge_Vieira",""),
("Olaria","Santo Cristo","Brasil","1957","1958","sin dato fiable","https://pt.wikipedia.org/wiki/Santo_Cristo_(futebolista)","")]
with open(D+'brasil-entrenadores-1958-59.csv','w',newline='') as f:
    w=csv.writer(f);w.writerow(['division','club','entrenador','nacionalidad','desde','hasta','estilo','fuente','jornadas','dudas'])
    done=set()
    for e in E: w.writerow(['Campeonato Paulista' if e[0] in PAUL else 'Campeonato Carioca',e[0],e[1],e[2],e[3],e[4],e[5],e[6],'todas',e[7]]);done.add(e[0])
    for c in PAUL+CAR:
        if c not in done: w.writerow(['Campeonato Paulista' if c in PAUL else 'Campeonato Carioca',c,'','','','','sin dato fiable','','','sin fuente encontrada'])
print(len(o),len(d))
