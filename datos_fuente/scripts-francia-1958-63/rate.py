import json,re,os,datetime,csv,collections,unicodedata
from infobox import parse
P=json.load(open('prestige.json'))
PAIS={'France':'Francia','Algérie':'Argelia','Cameroun':'Camerún','Maroc':'Marruecos',"Côte d'Ivoire":'Costa de Marfil','Italie':'Italia','Espagne':'España','Hongrie':'Hungría','Autriche':'Austria','Congo':'Congo','Argentine':'Argentina','Suède':'Suecia','Mali':'Malí','Suisse':'Suiza','Brésil':'Brasil','Togo':'Togo','Paraguay':'Paraguay','Sénégal':'Senegal','Pays-Bas':'Países Bajos','Uruguay':'Uruguay','Serbie':'Yugoslavia','Pologne':'Polonia','Luxembourg':'Luxemburgo','Finlande':'Finlandia','Pays de Galles':'Gales','Gabon':'Gabón','Bénin':'Benín','Tunisie':'Túnez','Belgique':'Bélgica','Allemagne':'Alemania','Danemark':'Dinamarca','Angleterre':'Inglaterra'}
FLAG={'Francia':'FRA','Argelia':'ALG','Marruecos':'MAR','Camerún':'CMR',"Costa de Marfil":'CIV','Italia':'ITA','España':'ESP','Hungría':'HUN','Austria':'AUT','Argentina':'ARG','Suecia':'SWE','Suiza':'SUI','Brasil':'BRA','Paraguay':'PAR','Uruguay':'URU','Yugoslavia':'YUG','Polonia':'POL','Luxemburgo':'LUX','Países Bajos':'NED','Túnez':'TUN','Bélgica':'BEL','Alemania':'GER','Dinamarca':'DEN','Inglaterra':'ENG','Gales':'WAL','Senegal':'SEN','Malí':'MLI','Togo':'TOG','Finlandia':'FIN'}
def posmap(p):
    if p.startswith('Gardien'): return 'POR'
    if p.startswith('Défenseur') or p=='Libéro': return 'DEF'
    if p.startswith('Milieu'): return 'MED'
    return 'DEL'
# prestigio por palabra clave para clubes de las carreras de Wikipedia (Division 1 francesa + grandes extranjeros)
KW=[('reims',880),('lille',861),('losc',861),('marseille',799),('racing club de paris',744),('rc paris',744),('racing paris',744),('racing cf',744),('nice',738),('sochaux',713),('saint-étienne',653),('saint-etienne',653),('bordeaux',652),('lens',634),('strasbourg',613),('toulouse',601),('sète',596),('nîmes',560),('nimes',560),('roubaix',552),('monaco',549),('red star',523),('metz',500),('sedan',497),('nancy',483),('lyon',476),('cannes',468),('rennes',452),('angers',440),('le havre',419),('havre',419),('montpellier',419),('valenciennes',411),('stade français',387),('stade francais',387),('rouen',370),('troyes',373),('grenoble',330),('toulon',330),('limoges',330),
('real madrid',985),('barcelone',915),('fc barcelona',915),('atlético',800),('inter',900),('juventus',850),('milan',880),('valence',760)]
def presclub(n):
    l=n.lower()
    for k,v in KW:
        if k in l: return v
    return None
def norm(s): return unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
copa={}
for r in csv.DictReader(open('/mnt/project-files/datos/copa-europa-1958-59-plantillas.csv')):
    if r['pais_club']=='Francia': copa[norm(r['nombre']).split()[-1].rstrip('s')]=r
def norm(s): return unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
def career(pid):
    f=f"wiki/{pid}.json"
    if not os.path.exists(f): return None
    d=json.load(open(f))
    return parse(d['content'])|{'title':d['title']} if d else None
def caps(sel,pais,ref_year):
    tag=FLAG.get(pais,'FRA').lower(); nm=pais.lower()
    tot=bef=0
    for r in sel:
        c=r['club'].lower()
        if any(w in c for w in ['olymp','espoir','b ','militaire','amateur','junior','-21','-23','-19','-18','jeunes']) and not c.strip()==tag: continue
        if not (tag in c or nm in c or norm(nm) in norm(c) or (tag=='fra' and 'france' in c)): continue
        m=r['m'] or 0; tot+=m
        y1,y2=r['y1'],r['y2']
        if y2<=ref_year-1: bef+=m
        elif y1<=ref_year:
            span=max(y2-y1,1); bef+=m*max(0,(ref_year-y1)+0.5)/(span+1)
    return round(bef),tot
def techo(car,lvl,age,capst,y0):
    sc=[]
    for r in car or []:
        if 'total' in r['club'].lower(): continue
        if r['y2']<y0 or r['y1']>y0+12: continue
        pr=presclub(r['club'])
        if pr is None or r['m'] is None: continue
        span=max(r['y2']-r['y1'],1)
        mps=r['m']/span
        if mps<20: continue
        n=min(r['y2'],y0+13)-max(r['y1'],y0)
        sc+= [280+0.55*pr]*max(n,1)
    sc.sort(reverse=True)
    F=(sum(sc[:3])/3 if len(sc)>=3 else (sum(sc)/len(sc) if sc else 0))+3*min(capst,30)
    if len(sc)<3: F-=40*(3-len(sc))
    if age<22: gc,mn=500,30
    elif age<25: gc,mn=150,15
    elif age<28: gc,mn=50,8
    elif age<30: gc,mn=15,3
    else: gc,mn=5,0
    return int(round(min(lvl+max(mn,min(gc,F-lvl)),1000))),len(sc)
def birth(bd,ref):
    if re.match(r"\d\d/\d\d/\d{4}$",bd):
        dd,mm,yy=bd.split('/'); b=datetime.date(int(yy),int(mm),int(dd)); return b.isoformat(),(ref-b).days/365.25,""
    if re.match(r"\d{4}$",bd): return bd+" (solo año)",ref.year-int(bd)-0.5,"solo año de nacimiento"
    return "",None,"sin fecha de nacimiento"
from prestige import CL
def strength():
    d=json.load(open('d1hist.json'))['195859']
    inv={a:k for k,(nm,al) in CL.items() for a in al}
    st={}
    for p,n in d: st[inv[n]]=880-(p-1)*(880-400)/19
    D2=['39-le_havre','3543-stade_francais','366-toulon','23-bordeaux','115-grenoble','26-metz','151-racing_besancon','745-sete','3648-so_montpellier','3610-beziers','1603-forbach','103-rouen','4003-as_troyes','9-nantes','489-canet_roussillon','3646-co_roubaixt','7-cannes','3568-as_aixoise','254-red_star','3924-cap_charenton']
    for i,k in enumerate(D2): st[k]=600-i*(600-250)/19
    return st
if __name__=="__main__":
    s=json.load(open('squads.json'))
    ST=strength()
    REF=datetime.date(1958,9,1)
    tmax=collections.defaultdict(int)
    for x in s: tmax[x['cid']]=max(tmax[x['cid']],int(x['mins'] or 0))
    rows=[]
    for x in s:
        if x['mj'] in ('','0'): continue
        pais=PAIS.get(x['nat'][0],x['nat'][0]) if x['nat'] else 'Francia'
        nac,age,nb=birth(x['bd'],REF); notas=[nb] if nb else []
        if age is None: age=26
        pj=int(x['mj']); g=int(x['buts'] or 0); mins=int(x['mins'] or 0)
        share=min(mins/(0.85*tmax[x['cid']]),1)
        pos=posmap(x['pos']); pr=P[x['cid']]['prestigio_final']
        if x['cid'] in ST: pr=0.5*pr+0.5*ST[x['cid']]
        car=career(x['pid'])
        if car: capsb,capst=caps(car['sel'],pais,1958)
        else: capsb=capst=0; notas.append("sin ficha en Wikipedia: internacionalidades y techo estimados solo por edad")
        lvl=300+0.45*pr+120*(share-0.5)+6*min(capsb,25)
        if pos=='DEL' and pj>0: lvl+=140*min(g/pj,0.8)*share
        if age<20: lvl-=30
        if age>33: lvl-=20*(age-33)
        rows.append(dict(x=x,div=x['div'],club=P[x['cid']]['club'],nombre=x['name'],pos=pos,nac=nac,pais=pais,liga=f"{pj} / {g}",lvl=lvl,age=age,capsb=capsb,capst=capst,car=car['car'] if car else None,notas=notas,wiki=car['title'] if car else ""))
    # calibración: titular medio (>=60% minutos) de D1 = 700, de D2 = 600
    for dv,target in (("Division 1",700),("Division 2",600)):
        tit=[r['lvl'] for r in rows if r['div']==dv and int(r['x']['mins'] or 0)>=0.6*tmax[r['x']['cid']]]
        off=target-sum(tit)/len(tit); print(dv,"offset",round(off),len(tit))
        for r in rows:
            if r['div']==dv: r['lvl']+=off
    out=[]
    for r in rows:
        lvl=int(round(r['lvl']))
        tch,ns=techo(r['car'],lvl,r['age'],r['capst'],1959)
        nombre,pos=r['nombre'],r['pos']
        c=copa.get(norm(r['nombre']).split()[-1].rstrip('s')) if r['club']=='Stade de Reims' else None
        if c:
            nombre,pos,lvl,tch=c['nombre'],c['pos'],int(c['nivel']),int(c['techo']); r['notas'].append("valores del CSV de Copa de Europa 1958-59")
        if nombre=='Thadée Cisowski': lvl,tch=900,900; r['notas'].append('valor a mano: máximo goleador, por debajo de Fontaine')
        out.append(dict(division=r['div'],club=r['club'],nombre=nombre,pos=pos,nac=r['nac'],pais=r['pais'],liga=r['liga'],nivel=lvl,techo=max(tch,lvl),
            intern_antes=r['capsb'],intern_total=r['capst'],wikipedia=r['wiki'],fuente=f"https://www.footballdatabase.eu/fr/joueur/details/{r['x']['pid']}",nota="; ".join(r['notas'])))
    json.dump(out,open('rated.json','w'),ensure_ascii=False,indent=0)
    ORD={'Division 1':0,'Division 2':1}
    out.sort(key=lambda r:(ORD[r['division']],r['club'],-r['nivel']))
    C9=['division','club','nombre','pos','nac','pais','liga','nivel','techo']
    w=csv.DictWriter(open('/mnt/project-files/datos/francia-1958-59-plantillas.csv','w',newline=''),fieldnames=C9);w.writeheader();w.writerows([{k:r[k] for k in C9} for r in out])
    w=csv.DictWriter(open('/mnt/project-files/datos/francia-1958-59-plantillas-detalle.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
    out.sort(key=lambda r:-r['nivel'])
    for r in out[:40]: print(r['club'],r['nombre'],r['pos'],r['nac'],r['liga'],r['nivel'],r['techo'],r['intern_antes'],r['intern_total'])
