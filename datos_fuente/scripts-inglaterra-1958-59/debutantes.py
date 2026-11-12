# Debutantes 1959-63 en First/Second Division: jugadores con etapa en un club de esas divisiones que empieza
# en 1959-1962 (Wikidata) y que no estaban en la plantilla 1958-59. Uso: python3 debutantes.py <carpeta_datos> <salida.csv>
import csv,glob,json,re,sys,datetime,collections
D=sys.argv[1]; OUT=sys.argv[2]
Q=json.load(open(f'{D}/clubQ49.json')); QC={v:k for k,v in Q.items()}
DIV=json.load(open(f'{D}/div5963.json'))
PRES={r['club']:int(r['prestigio']) for r in csv.DictReader(open('/mnt/project-files/datos/inglaterra-clubes-1958-59.csv'))}
PRES.update({'Plymouth Argyle':400,'Hull City':400,'Southampton':420,'Norwich City':420,'Bury':360,'Walsall':330})
ya={r['wikidata'] for r in csv.DictReader(open('/mnt/project-files/datos/inglaterra-1958-59-plantillas-notas.csv'))}
def yr(s): return int(s[:4]) if s[:1].isdigit() else None
def num(x):
    try: return int(float(x))
    except: return None
car=collections.defaultdict(list); info={}
for f in glob.glob(f'{D}/car/*.csv')+[x for x in glob.glob(f'{D}/car2/*.csv') if 'info' not in x]:
    for r in csv.DictReader(open(f)):
        car[r['p'].split('/')[-1]].append(dict(t=r['t'].split('/')[-1],tl=r['tLabel'],s=yr(r['s']),e=yr(r['e']),m=num(r['m']),g=num(r['g'])))
for f in [f'{D}/pinfo.csv']+glob.glob(f'{D}/car2/info_*.csv'):
    for r in csv.DictReader(open(f)):
        d=info.setdefault(r['p'].split('/')[-1],dict(pos=set(),nat=set()))
        if r['posLabel']: d['pos'].add(r['posLabel'])
        if r['natLabel']: d['nat'].add(r['natLabel'])
CC={r['t'].split('/')[-1]:r['cLabel'] for r in csv.DictReader(open(f'{D}/clubcountry.csv')) if r['t']}
NOENG=r"Celtic|Rangers|Heart of Midlothian|Hibernian|Aberdeen|Dundee|Motherwell|Kilmarnock|Partick|St\.? Mirren|Falkirk|Airdrie|Clyde|Queen of the South|Raith|Third Lanark|Dunfermline|St\.? Johnstone|Ayr United|Hamilton Academical|Morton|Stirling|Arbroath|Montrose|Albion Rovers|Cowdenbeath|East Fife|Alloa|Brechin|Berwick|Forfar|Stenhousemuir|Queen's Park|Dumbarton|East Stirlingshire|Stranraer|Linfield|Glentoran|Distillery|Coleraine|Portadown|Ards|Glenavon|Crusaders|Cliftonville|Bangor|Derry City|Ballymena|Shamrock|Bohemian|Shelbourne|Dundalk|Drumcondra|Waterford|Cork|Limerick|St Patrick's"
def foreign(y):
    c=CC.get(y['t'],'United Kingdom')
    return c!='United Kingdom' or re.search(NOENG,y['tl'])
def youth(y): return re.search(r'under-|U\d\d|youth|reserve|amateur|schools|national',y['tl'],re.I)
SENIOR={"England men's national association football team":"Inglaterra","Scotland men's national football team":"Escocia","Wales men's national association football team":"Gales","Northern Ireland men's national association football team":"Irlanda del Norte","Republic of Ireland men's national association football team":"Irlanda"}
NAT={"England":"Inglaterra","Scotland":"Escocia","Wales":"Gales","Northern Ireland":"Irlanda del Norte","Republic of Ireland":"Irlanda","Ireland":"Irlanda","South Africa":"Sudáfrica","Jamaica":"Jamaica","Canada":"Canadá","Australia":"Australia","Netherlands":"Países Bajos","Germany":"Alemania"}
exec(open('/mnt/project-files/datos/scripts-inglaterra-1958-59/plantillas.py').read().split('def posmap')[1].split('# copa de europa')[0].join(['def posmap','']))
SEAS=['1959-60','1960-61','1961-62','1962-63']
best={}
for r in csv.DictReader(open(f'{D}/dspells.csv')):
    p=r['p'].split('/')[-1]
    if p in ya: continue
    b=r['birth'][:10] if r['birth'][:1].isdigit() else ''
    if not b or int(b[:4])<1915: continue
    s=yr(r['s']); e=yr(r['e']) or s+1; m=num(r['m'])
    club=QC[r['club'].split('/')[-1]]
    if not m: continue
    # las etapas de Wikidata empiezan al firmar de juvenil: el debut se pone como pronto a los 17 años
    by=int(b[:4])
    if s<by+17:
        s2=by+17
        if s2>1962 or s2>e: continue
        s=s2
    seas=f"{s}-{str(s+1)[2:]}"
    if not DIV.get(f"{seas}|{club}"): continue
    if p in best and best[p]['s']<=s: continue
    best[p]=dict(p=p,name=r['pLabel'],b=b,s=s,e=e,m=m,g=num(r['g']),club=club,div=DIV[f'{seas}|{club}'],seas=seas,s0=yr(r['s']))
rows=[]
for p,x in best.items():
    notas=[]
    prev=[y for y in car[p] if y['s'] is not None and y['s']<x['s0'] and not youth(y)]
    if any(y['t'] in QC and (y['e'] or 0)>=1950 and y['m'] for y in prev) or any(y['t']==Q[x['club']] for y in prev): tipo='regresa'
    elif any(foreign(y) for y in prev): tipo='extranjero'
    elif any(y['m'] for y in prev): tipo='divisiones inferiores'
    else: tipo='cantera'
    bd=datetime.date.fromisoformat(x['b']); age=(datetime.date(x['s'],9,1)-bd).days/365.25
    n=max(1,min(x['e'],x['s']+15)-x['s'])
    if x['s0']!=x['s']: notas.append(f"en Wikidata la etapa empieza en {x['s0']} (juvenil); debut puesto a los 17 años")
    apps=min(42,round(x['m']/n)); g=round((x['g'] or 0)/n) if x['g'] is not None else None
    notas.append(f"partidos/goles por temporada estimados con la media de su etapa {x['s']}-{x['e']} ({x['m']} partidos)")
    pos=posmap(info.get(p,{}).get('pos',[])) or 'MED'
    caps_b=caps_t=0; pais=None
    for y in car[p]:
        if y['tl'] in SENIOR:
            mm=y['m'] or 0; caps_t+=mm; pais=pais or SENIOR[y['tl']]
            if y['s'] and mm:
                ee=y['e'] or y['s']
                if ee<=x['s']: caps_b+=mm
                elif y['s']<=x['s']: caps_b+=round(mm*(x['s']+0.6-y['s'])/max(ee+0.6-y['s'],1))
    if not pais:
        nat=[NAT.get(k,k) for k in info.get(p,{}).get('nat',[])]
        pais=nat[0] if nat else 'Inglaterra'
    pr=PRES.get(x['club'],420)
    share=min(apps/38,1)
    lvl=300+0.45*pr+120*(share-0.5)+6*min(caps_b,25)
    if pos=='DEL' and apps>0 and g is not None: lvl+=140*min(g/apps,1)*share
    if x['div']=='Second Division': lvl+=40
    if age<20: lvl-=30
    if age>33: lvl-=20*(age-33)
    lvl=round(lvl)
    sc=[]
    for y in car[p]:
        ee=y['e'] or (y['s'] or 0)+1
        if y['s'] and ee>x['s'] and y['s']<=x['s']+13 and y['m'] and not youth(y):
            nn=max(1,ee-y['s'])
            if y['m']/nn>=17: sc+=[280+0.55*PRES.get(QC.get(y['t'],''),420)]*min(nn,3)
    sc.sort(reverse=True)
    F=(sum(sc[:3])/3 if len(sc)>=3 else (sum(sc)/len(sc) if sc else 0))+3*min(caps_t,60)  # en Inglaterra se cuentan hasta 60 internacionalidades (prestigios de club más bajos que en España)
    if len(sc)<3: F-=40*(3-len(sc))
    if age<22: gc,mn=500,30
    elif age<25: gc,mn=150,15
    elif age<28: gc,mn=50,8
    elif age<30: gc,mn=15,3
    else: gc,mn=5,0
    tech=int(round(min(lvl+max(mn,min(gc,F-lvl)),1000)))
    rows.append(dict(division=x['div'],club=x['club'],nombre=x['name'].replace(', Jr.',' Jr.'),pos=pos,nac=x['b'],pais=pais,liga=f"{apps} / {g if g is not None else '?'}",nivel=lvl,techo=tech,debut=x['s'],tipo=tipo,temporada=x['seas'],fuente=f"https://www.wikidata.org/wiki/{p}",nota='; '.join(notas)))
rows.sort(key=lambda r:(r['debut'],r['division'],r['club'],-r['nivel']))
with open(OUT,'w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['division','club','nombre','pos','nac','pais','liga','nivel','techo','debut','tipo','temporada','fuente','nota']); w.writeheader(); w.writerows(rows)
print(len(rows),collections.Counter(r['tipo'] for r in rows),collections.Counter(r['debut'] for r in rows))
