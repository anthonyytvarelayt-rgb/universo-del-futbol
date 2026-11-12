import json,csv,re,datetime,collections,os
D='/mnt/project-files/datos/'
PAUL=["Santos","São Paulo","Corinthians","Palmeiras","XV de Piracicaba","Portuguesa","Noroeste","Botafogo-SP","Taubaté","Nacional-SP","Ferroviária","Portuguesa Santista","América-SP","Ponte Preta","Juventus","Guarani","Comercial-SP","XV de Jaú","Jabaquara","Ypiranga-SP"]
CAR=["Vasco da Gama","Flamengo","Botafogo","Fluminense","America-RJ","Bangu","Portuguesa-RJ","São Cristóvão","Madureira","Canto do Rio","Bonsucesso","Olaria"]
PR={"Vasco da Gama":900,"Corinthians":900,"Palmeiras":890,"Fluminense":890,"Flamengo":890,"São Paulo":880,"Botafogo":870,"Santos":870,"Portuguesa":790,"America-RJ":760,"Bangu":680,
"Madureira":600,"São Cristóvão":590,"Olaria":580,"Bonsucesso":580,"Portuguesa-RJ":560,"Canto do Rio":560,
"XV de Piracicaba":560,"Guarani":560,"Ponte Preta":540,"Juventus":540,"Ferroviária":520,"Botafogo-SP":520,"Portuguesa Santista":520,"Ypiranga-SP":500,"Jabaquara":500,"Noroeste":500,"Taubaté":480,"Nacional-SP":470,"XV de Jaú":450,"América-SP":450,"Comercial-SP":440}
# otros clubes (para techo): grandes de otros países/estados
PRX={"Grêmio":760,"Internacional-RS":760,"Atlético-MG":760,"Cruzeiro":720,"Bahia":680,"Sport":640,"Náutico":640}
# excluir los que ya están en otras ligas en 1958-59
EXN=set()  # nacimientos de brasileños ya en otras ligas
for fn,col in [('espana-1958-59-plantillas.csv','nac'),('copa-europa-1958-59-plantillas.csv','nac')]:
    for r in csv.DictReader(open(D+fn)):
        if 'Brasil' in r.get('pais',''): EXN.add(r['nac'][:10])
MAN={ # nivel, techo, nota
"Pelé":(870,995,"valor a mano: 17 años, campeón del mundo y goleador del Paulista 1958 (58 goles)"),
"Garrincha":(900,925,"valor a mano: campeón del mundo 1958"),
"Didi (futebolista)":(900,905,"valor a mano: mejor jugador del Mundial 1958"),
"Nílton Santos":(885,885,"valor a mano: campeón del mundo 1958"),
"Djalma Santos":(880,885,"valor a mano: campeón del mundo 1958"),
"Zito (futebolista)":(850,860,"valor a mano: campeón del mundo 1958"),
"Bellini (futebolista)":(840,845,"valor a mano: capitán campeón del mundo 1958"),
"Orlando Peçanha":(835,850,"valor a mano: campeón del mundo 1958"),
"Zagallo":(840,845,"valor a mano: campeón del mundo 1958"),
"Pepe (futebolista brasileiro)":(840,860,"valor a mano: campeón del mundo 1958"),
"Dida (futebolista, 1934)":(830,840,"valor a mano"),
"Gylmar dos Santos Neves":(860,875,"valor a mano: portero campeón del mundo 1958"),
"Mauro Ramos (futebolista)":(830,840,"valor a mano"),
"Dino Sani":(810,820,"valor a mano"),
"Castilho (futebolista)":(830,835,"valor a mano"),
"Nílton De Sordi":(820,825,"valor a mano: titular en el Mundial 1958"),
"Moacir (futebolista)":(790,800,"valor a mano"),
"Canhoteiro":(820,825,"valor a mano"),
"Quarentinha":(800,830,"valor a mano: máximo goleador del Carioca 1958"),
"Coutinho (futebolista)":(640,925,"valor a mano: 15 años, debutó en 1958; techo por su carrera con Pelé"),
"Almir Pernambuquinho":(780,830,"valor a mano"),
"Telê Santana":(790,795,"valor a mano"),
"Altair (futebolista, 1938)":(760,820,"valor a mano"),
}
def age(nac):
    try: b=datetime.date.fromisoformat(nac[:10]); return (datetime.date(1958,7,1)-b).days/365.25
    except: 
        m=re.match(r'(\d{4})',nac or ''); return 1958-int(m.group(1)) if m else 26
def lvl_of(r,club):
    pr=PR[club];h=r['hit'][0]
    yrsn=max(1,min(h['b'],1972)-h['a']+1) if h['b']<2030 else 3
    share=min(h['pj']/yrsn/45,1) if h.get('pj') else 0.5
    caps=r['caps'] or 0
    ys=[int(y) for y in r.get('selys',[])]
    if caps and ys:
        a,b=min(ys),max(ys)
        capsb=0 if a>1958 else round(caps*min(1,(min(b,1958)-a+1)/(b-a+1)))
    else: capsb=0
    l=300+0.45*pr+120*(share-0.5)+6*min(capsb,25)
    if r['pos']=='DEL' and h.get('pj') and h.get('gl') is not None: l+=140*min(h['gl']/max(h['pj'],1),1)*share
    a=age(r['nac'])
    if a<20: l-=30
    if a>33: l-=20*(a-33)
    l=round(l)
    # techo
    best=[]
    for e in r['ent']:
        if e['b']>=1959 and e['a']<=1972 and e is not h:
            p=PR.get(e['club']) or 0
            if p: best.append(p)
    if h['b']>=1960: best.append(pr)
    F=(280+0.55*max(best) if best else l-40)+3*min(caps,30)
    if a<22: gc,mn=500,30
    elif a<25: gc,mn=150,15
    elif a<28: gc,mn=50,8
    elif a<30: gc,mn=15,3
    else: gc,mn=5,0
    t=int(round(min(l+max(mn,min(gc,F-l)),1000)))
    return l,t,capsb,share

# nombres ya usados en otros CSV (misma fecha de nacimiento -> mismo nombre)
NAMES={}
for fn in ['espana-debutantes-1959-63.csv','copa-europa-1959-63-plantillas.csv','espana-1958-59-plantillas.csv']:
    for r in csv.DictReader(open(D+fn)):
        if 'Brasil' in r.get('pais',''): NAMES[r['nac'][:10]]=r['nombre']
