import json,re,csv,datetime,collections,sys
sys.argv=['x']; sys.path.insert(0,'s')
src=open('s/parse.py').read().split('res=[]')[0]
exec(src)
TB=json.load(open('tabs.json')); P=json.load(open('pres.json'))
EXP={'Eintracht Osnabrück':400,'VfB Lübeck':450,'Schwarz-Weiß Essen':480,'Hamborn 07':450,'Bayern Hof':430,'Stuttgarter Kickers':520,'SC Ludwigshafen':400,'VfR Kaiserslautern':380,'Norden-Nordwest Berlín':330,'Heider SV':360,'VfB Oldenburg':430,'Jahn Ratisbona':420,'Marl-Hüls':430,'SC Tegel':300,'Bremer SV':400,'Arminia Hannover':430,'Schwaben Augsburgo':430,'Hessen Kassel':480,'Bayer Leverkusen':450,'Wuppertaler SV':520}
DV={'oln':'Oberliga Nord','olw':'Oberliga West','ols':'Oberliga Süd','olsw':'Oberliga Südwest','olb':'Oberliga Berlin'}
# membership: (club, season_start) -> division
mb={}
for k,v in TB.items():
    y=1900+int(k[-4:-2])
    if y<1959 or y>1962: continue
    pre=re.match(r'[a-z]+',k).group(0)
    for pos,n in v['rows']:
        nn=norm(re.sub(r'\s*\(.*?\)|\*','',n))
        for c in C:
            if nn in c['al'] or any(nn==a for a in c['al']):
                mb[(c['club'],y)]=DV[pre]; break
print('memb',len(mb), [ (c['club']) for c in C if c['div']=='extra' and not any((c['club'],y) in mb for y in range(1959,1963))])
S58=set(r['titulo'] for r in json.load(open('squads.json')))
CE={}
for f in ['/mnt/project-files/datos/copa-europa-1959-63-plantillas.csv']:
    for r in csv.DictReader(open(f)):
        if r['pais_club']=='RFA': CE.setdefault(norm(r['nombre']),r)
OBL=set(c['club'] for c in C)
rows=[]
for t,s in T.items():
    if t in S58: continue
    nac,by=birth(s)
    ib=sections(s)
    if not ib: continue
    st=stations(ib.get('vereine_tabelle',''))
    best=None; prev_top=False
    for x in st:
        if not x['a']: continue
        for c in C:
            if norm(x['club']) in c['al'] or norm(x['disp']) in c['al']:
                if x['a']<=1958 and (x['g'] or 0)>0: prev_top=True
                for y in range(max(x['a'],1959),min((x['b'] or x['a']),1962)+1):
                    if (c['club'],y) in mb and (x['g'] or 0)>0 and not re.search(r'amateur|jugend',x['disp'],re.I):
                        if best is None or y<best[0]: best=(y,c,x)
                break
    if not best: continue
    y,c,x=best
    if by and y-by<16: continue
    pais=nation(s); pos,posok=position(ib,s)
    tipo='regresa' if prev_top else ('extranjero' if 'RFA' not in pais and 'Sarre' not in pais else 'cantera')
    # earlier foreign clubs
    if tipo=='cantera' and any(re.search(r'Wien|Austria|Rapid|Admira|Vienna|Budapest|Zagreb|Beograd|Belgrad|Kopenhagen|Holland|Venlo|Zürich|Basel',z['club']) for z in st if z['a'] and z['a']<y): tipo='extranjero'
    pr=P.get(c['club']) or EXP.get(c['club'],420)
    a=x['a']; b=x['b'] if x['b'] and x['b']<2000 else 1965
    ns=max(1,min(b,1965)-a); gps=(x['g'] or 0)/ns; glps=(x['gl'] or 0)/ns
    pj=round(min(gps,30)); gol=round(glps*pj/gps) if gps else 0; share=min(gps/28,1)
    try: age=(datetime.date(y,9,1)-datetime.date.fromisoformat(nac)).days/365.25
    except Exception: age=(y-by) if by else 21
    cb,ct,_=caps(ib)
    # caps before entry
    cbe=0
    for z in stations(ib.get('nationalmannschaft_tabelle','')):
        if 'nationalmannschaft' in z['club'].lower() and not re.search(r'B-|Amateur|Olymp|Jugend|Junior|U-?\d',z['club']) and z['a'] and z['b']:
            n=z['g'] or 0; cbe+= n if z['b']<=y else (n*(y+0.5-z['a'])/(z['b']-z['a']+0.5) if z['a']<=y else 0)
    cbe=round(cbe); ext=1 if tipo=='extranjero' and cbe==0 else 0
    lvl=300+0.45*pr+120*(share-0.5)+6*min(cbe,25)+(140*min(gol/pj,1)*share if pos=='DEL' and pj else 0)+25*ext
    if age<20: lvl-=30
    if age>33: lvl-=20*(age-33)
    lvl=round(lvl)
    sc=[]
    for z in st:
        if not z['a'] or z['g'] is None: continue
        a2=max(z['a'],y); b2=min(z['b'] or z['a'],y+13)
        if (z['b'] or z['a'])<y: continue
        n2=max(1,(z['b'] or z['a'])-z['a']); g2=z['g']/n2
        if g2<15: continue
        pz=None
        for cc in C:
            if norm(z['club']) in cc['al'] or norm(z['disp']) in cc['al']: pz=P.get(cc['club']) or EXP.get(cc['club']); break
        if not pz:
            from foreign import FOR
            pz=FOR.get(norm(z['club'])) or FOR.get(norm(z['disp']))
        pz=pz or 420
        sc+=[280+0.55*pz]*max(1,b2-a2)
    sc.sort(reverse=True)
    F=(sum(sc[:3])/3 if len(sc)>=3 else (sum(sc)/len(sc) if sc else 0))+3*min(ct,30)
    if len(sc)<3: F-=40*(3-len(sc))
    if age<22: gc,mn=500,30
    elif age<25: gc,mn=150,15
    elif age<28: gc,mn=50,8
    elif age<30: gc,mn=15,3
    else: gc,mn=5,0
    tech=int(round(min(lvl+max(mn,min(gc,F-lvl)),1000)))
    name=(ib.get('kurzname','').strip() or re.sub(r'\s*\(.*\)$','',t)); name=re.sub(r'<.*?>|\[\[|\]\]','',name).strip()
    ce=CE.get(norm(name)); fu='https://de.wikipedia.org/wiki/'+t.replace(' ','_'); d=[]
    if ce: lvl,tech=int(ce['nivel']),int(ce['techo']); name=ce['nombre']; fu+=' ; valor de Copa de Europa'
    if not posok: d.append('posición supuesta')
    if not by: d.append('sin fecha de nacimiento')
    rows.append(dict(temporada=f'{y}-{str(y+1)[2:]}',debut=y,tipo=tipo,division=mb[(c['club'],y)],club=c['club'],nombre=name,pos=pos,nac=nac,pais=pais,liga=f'{pj} / {gol}',nivel=lvl,techo=max(tech,lvl),fuente=fu,dudas='; '.join(d),tramo=x['y']))
rows.sort(key=lambda r:(r['debut'],r['division'],r['club'],-r['nivel']))
cols=['temporada','debut','tipo','division','club','nombre','pos','nac','pais','liga','nivel','techo','tramo','fuente','dudas']
w=csv.DictWriter(open('alemania-debutantes-1959-63.csv','w',newline=''),fieldnames=cols); w.writeheader(); w.writerows(rows)
print(len(rows),collections.Counter(r['temporada'] for r in rows),collections.Counter(r['tipo'] for r in rows))
for r in sorted(rows,key=lambda r:-r['techo'])[:15]: print(r['nombre'],r['club'],r['temporada'],r['tipo'],r['nivel'],r['techo'])
