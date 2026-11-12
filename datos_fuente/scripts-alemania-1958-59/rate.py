import json,re,csv,datetime,collections,unicodedata
S=json.load(open('squads.json')); P=json.load(open('pres.json')); C=json.load(open('clubs2.json'))
def norm(s):
    s=s.lower()
    for a,b in [('ß','ss'),('ü','u'),('ö','o'),('ä','a'),('é','e')]: s=s.replace(a,b)
    return re.sub(r'[^a-z0-9]','',s)
# prestige by any alias (for future clubs)
AL={}
for c in C:
    pr=P.get(c['club'])
    for n in [c['art']]+c['cats']+[c['ftab']]: AL[norm(n)]=pr
EXTRA_P={'wuppertalersv':520,'schwarzweissessen':480,'bayer04leverkusen':450,'stuttgarterkickers':520,'kshessenkassel':480,'fcbayernhof':430,'ssvjahnregensburg':420,'tsvmarlhuls':430,'vfblubeck':450,'vfboldenburg':430,'hamborn07':450,'arminiabielefeld':480,'vfbstuttgart':P['Stuttgart']}
import sys; sys.path.insert(0,'s'); from foreign import FOR
def prest(club):
    n=norm(club)
    if n in FOR: return FOR[n]
    if n in AL and AL[n]: return AL[n]
    if n in EXTRA_P: return EXTRA_P[n]
    for k,v in AL.items():
        if v and len(k)>6 and (k in n or n in k): return v
    if re.search(r'amateur|jugend|ii$|reserve',club,re.I): return 300
    if re.search(r'nationalmannschaft',club,re.I): return None
    return 400
CE={}
for f in ['/mnt/project-files/datos/copa-europa-1958-59-plantillas.csv','/mnt/project-files/datos/copa-europa-1959-63-plantillas.csv']:
    for r in csv.DictReader(open(f)):
        if r.get('pais_club','RFA')=='RFA' or 'Schalke' in r['club']:
            k=norm(r['nombre'])
            if k not in CE or f.endswith('1958-59-plantillas.csv'): CE[k]=r
REF=datetime.date(1958,9,1)
rows=[]
for r in S:
    pr=P[r['club']]; sp=r['sp']; dud=[r['dudoso']] if r['dudoso'] else []
    by=r['by'] or 1932
    try: age=(REF-datetime.date.fromisoformat(r['nac'])).days/365.25
    except Exception: age=1958.67-by
    if not r['by']: dud.append('sin fecha de nacimiento (edad supuesta 26)'); age=26
    g=sp.get('g'); gl=sp.get('gl')
    if g is not None and sp.get('a'):
        a=max(sp['a'],1946); b=sp['b'] if sp['b'] and sp['b']<2000 else 1963
        ns=max(1,min(b,1965)-a); gps=g/ns; glps=(gl or 0)/ns
        if sp['a']==sp['b']: gps=g; glps=gl or 0
        pj=round(min(gps,30)); gol=round(glps*pj/gps) if gps else 0
        share=min(gps/28,1); est='media por temporada del tramo '+sp['y']+' (Wikipedia)'
    elif sp.get('g58'):
        pj=sp['g58']; gol=None; share=min(pj/28,1); est='partidos 1958/59 del texto de Wikipedia'
    else:
        pj=None; gol=None; share=0.5; est='sin estadística: minutos supuestos a medias'
        dud.append('sin partidos conocidos')
    pos=r['pos']
    if not r['posok']: dud.append('posición supuesta')
    pais=r['pais']; cb=r['capsb']; ct=r['capst']
    lvl=300+0.45*pr+120*(share-0.5)+6*min(cb,25)
    if pos=='DEL' and pj and gol is not None: lvl+=140*min(gol/pj,1)*share
    elif pos=='DEL': lvl+=25
    if age<20: lvl-=30
    if age>33: lvl-=20*(age-33)
    lvl=round(lvl)
    # techo
    sc=[]
    for x in r['est']:
        if not x['a'] or x['g'] is None: continue
        a=max(x['a'],1959); b=min(x['b'] or x['a'],1972)
        if b<a or x['b'] and x['b']<1959: continue
        ns=max(1,(x['b'] or x['a'])-x['a']); gps=x['g']/ns
        if gps<15: continue
        p2=prest(x['disp'] if norm(x['disp']) in AL else x['club'])
        if p2 is None: continue
        sc+= [280+0.55*p2]*max(1,b-a)
    sc.sort(reverse=True)
    F=(sum(sc[:3])/3 if len(sc)>=3 else (sum(sc)/len(sc) if sc else 0))+3*min(ct,30)
    if len(sc)<3: F-=40*(3-len(sc))
    if age<22: gc,mn=500,30
    elif age<25: gc,mn=150,15
    elif age<28: gc,mn=50,8
    elif age<30: gc,mn=15,3
    else: gc,mn=5,0
    tech=int(round(min(lvl+max(mn,min(gc,F-lvl)),1000)))
    name=r['nombre']; ce=CE.get(norm(name)); fuente='https://de.wikipedia.org/wiki/'+r['titulo'].replace(' ','_')
    if ce:
        lvl,tech=int(ce['nivel']),int(ce['techo']); name=ce['nombre']; fuente+=' ; valor de Copa de Europa'
    MAN={'Ottmar Walter':(830,830),'Fritz Walter':(850,850)}
    if name in MAN: lvl,tech=MAN[name]; dud.append('valor a mano: veterano campeón del mundo 1954')
    rows.append(dict(division={'Nord':'Oberliga Nord','West':'Oberliga West','Sur':'Oberliga Süd','Suroeste':'Oberliga Südwest','Berlín':'Oberliga Berlin'}[r['div']],club=r['club'],nombre=name,pos=pos,nac=r['nac'],pais=pais,liga=(f"{pj} / {gol if gol is not None else '?'}" if pj is not None else '? / ?'),nivel=lvl,techo=max(tech,lvl),intern_antes=cb,intern_total=ct,estadistica=est,fuente=fuente,dudas='; '.join(d for d in dud if d),_t=r['titulo']))
json.dump(rows,open('rated.json','w'),ensure_ascii=False,indent=0)
rows.sort(key=lambda x:(x['division'],x['club'],-x['nivel']))
cols=['division','club','nombre','pos','nac','pais','liga','nivel','techo','intern_antes','intern_total','estadistica','fuente','dudas']
w=csv.DictWriter(open('alemania-1958-59-plantillas.csv','w',newline=''),fieldnames=cols,extrasaction='ignore'); w.writeheader(); w.writerows(rows)
L=sorted(x['nivel'] for x in rows); print(len(L),L[len(L)//10],L[len(L)//2],L[9*len(L)//10])
for x in sorted(rows,key=lambda x:-x['nivel'])[:30]: print(x['nombre'],x['club'],x['nivel'],x['techo'],x['liga'],x['intern_antes'])
print(sum(1 for x in rows if 'Copa de Europa' in x['fuente']))
