# Plantillas Inglaterra 1958-59 (First y Second Division) a partir de Wikidata (etapas en clubes con
# partidos/goles) y, donde existe, el artículo de temporada de Wikipedia (partidos reales 1958-59).
# Uso: python3 plantillas.py <carpeta_datos_descargados> <salida.csv>
import csv,glob,json,re,sys,datetime,collections,unicodedata
D=sys.argv[1]; OUT=sys.argv[2]
clubs=json.load(open(f'{D}/clubs.json'))
qid={r['art']:r['club'].split('/')[-1] for r in csv.DictReader(open(f'{D}/clubq.csv'))}
for c in clubs: c['q']=qid[c['art']]
CQ={c['q']:c for c in clubs}
# prestigio 250-985, estimado con títulos de liga y FA Cup hasta 1958, temporadas recientes en First Division
# y puesto en 1957-58 (mismo criterio que España, ajustado a mano; Wolverhampton como en la Copa de Europa)
PRES={"Wolverhampton Wanderers":900,"Manchester United":920,"Arsenal":880,"Bolton Wanderers":760,"West Bromwich Albion":780,
"West Ham United":660,"Burnley":760,"Blackpool":780,"Birmingham City":720,"Blackburn Rovers":700,"Newcastle United":820,
"Preston North End":800,"Nottingham Forest":690,"Chelsea":760,"Leeds United":660,"Everton":780,"Luton Town":650,
"Tottenham Hotspur":820,"Leicester City":650,"Manchester City":780,"Aston Villa":800,"Portsmouth":740,
"Sheffield Wednesday":640,"Fulham":520,"Sheffield United":580,"Liverpool":640,"Stoke City":500,"Bristol Rovers":420,
"Derby County":520,"Charlton Athletic":560,"Cardiff City":540,"Bristol City":440,"Swansea Town":440,
"Brighton & Hove Albion":400,"Middlesbrough":540,"Huddersfield Town":580,"Sunderland":660,"Ipswich Town":420,
"Leyton Orient":380,"Scunthorpe United":300,"Lincoln City":360,"Rotherham United":360,"Grimsby Town":400,"Barnsley":380}
for c in clubs: c['pres']=PRES[c['name']]
DIVN={'First':'First Division','Second':'Second Division'}
def yr(s): return int(s[:4]) if s else None
def num(x):
    try: return int(float(x))
    except: return None
info={}
for r in csv.DictReader(open(f'{D}/pinfo.csv')):
    p=r['p'].split('/')[-1]; d=info.setdefault(p,dict(pos=set(),nat=set(),cit=set()))
    if r['posLabel']: d['pos'].add(r['posLabel'])
    if r['natLabel']: d['nat'].add(r['natLabel'])
car=collections.defaultdict(list)
for f in glob.glob(f'{D}/car/*.csv'):
    for r in csv.DictReader(open(f)):
        car[r['p'].split('/')[-1]].append(dict(t=r['t'].split('/')[-1],tl=r['tLabel'],s=yr(r['s']),e=yr(r['e']),m=num(r['m']),g=num(r['g'])))
sp=list(csv.DictReader(open(f'{D}/spells.csv')))
name={};birth={}
for r in sp:
    p=r['p'].split('/')[-1]; name[p]=r['pLabel']; birth[p]=r['birth'][:10] if r['birth'][:1].isdigit() else ''
season=json.load(open(f'{D}/season_apps.json'))
def norm(s): return unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower().strip()
SA={}
# solo artículos cuya tabla se lee bien (liga: partidos y goles; Aston Villa solo partidos totales)
OK_SEASON={'Manchester United','Liverpool','Birmingham City','West Ham United','Aston Villa'}
for club,d in season.items():
    if club not in OK_SEASON: continue
    for link,v in d.items():
        SA[(club,norm(re.sub(r'\s*\(.*','',link)))]=v; SA[(club,norm(v['name']))]=v
SENIOR={"England men's national association football team":"Inglaterra","Scotland men's national football team":"Escocia",
"Wales men's national association football team":"Gales","Northern Ireland men's national association football team":"Irlanda del Norte",
"Republic of Ireland men's national association football team":"Irlanda"}
NAT={"England":"Inglaterra","Scotland":"Escocia","Wales":"Gales","Northern Ireland":"Irlanda del Norte","Republic of Ireland":"Irlanda",
"Ireland":"Irlanda","South Africa":"Sudáfrica","Jamaica":"Jamaica","Canada":"Canadá","Australia":"Australia","Netherlands":"Países Bajos",
"Germany":"Alemania","Trinidad and Tobago":"Trinidad y Tobago","Guernsey":"Inglaterra","Channel Islands":"Inglaterra","India":"India","Hungary":"Hungría","Egypt":"Egipto","Kenya":"Kenia","Malta":"Malta","Rhodesia":"Rodesia","Zimbabwe":"Rodesia","Nigeria":"Nigeria"}
def posmap(ps):
    s=" ".join(ps).lower()
    if 'goalkeeper' in s: return 'POR'
    if re.search(r'full.?back|centre.?half|centre.?back|defender|sweeper|left.?back|right.?back',s) and not re.search(r'forward|winger',s): return 'DEF'
    if re.search(r'wing.?half|half.?back|midfield',s) and not re.search(r'centre forward|winger|striker',s): return 'MED'
    if re.search(r'forward|winger|striker|outside',s): return 'DEL'
    if 'defender' in s: return 'DEF'
    return ''
# copa de europa: nombres a respetar (por fecha de nacimiento)
COPA={}
for f in ['copa-europa-1958-59-plantillas.csv','copa-europa-1959-63-plantillas.csv']:
    for r in csv.DictReader(open(f'/mnt/project-files/datos/{f}')):
        if r['pais_club']=='Inglaterra' and r['nac']:
            # en la Copa 1958-59 (Wolverhampton) se reutilizan también nivel y techo
            v=(int(r['nivel']),int(r['techo'])) if 'temporada' not in r else None
            COPA.setdefault(r['nac'][:10],[]).append((r['nombre'],r['pos'],r['pais'],v))
def copa_match(b,nm):
    for x in COPA.get(b,[]):
        if norm(x[0]).split()[-1][:4]==norm(nm).split()[-1][:4]: return x
MANUAL={'Johnny Haynes':(845,870),'Tom Finney':(840,840)}  # valores a mano: estrellas de la selección
REF=datetime.date(1958,9,1)
def pres_of(t,tl):
    if t in CQ: return CQ[t]['pres']
    return None
cand=collections.defaultdict(list)
for r in sp:
    p=r['p'].split('/')[-1]; cq=r['club'].split('/')[-1]; c=CQ[cq]
    s=yr(r['s']); e=yr(r['e']); m=num(r['m']); g=num(r['g'])
    b=birth[p]
    if not b or not (1917<=int(b[:4])<=1943): continue
    sa=SA.get((c['name'],norm(name[p])))
    if e is None:
        later=[x['s'] for x in car[p] if x['s'] and x['s']>(s or 0) and 'national' not in x['tl']]
        e=min(later) if later else (s+1 if int(b[:4])<1925 else 2100)
    core=(s<=1958 and e>=1959)
    edge=(s==1959 or e==1958)
    if not core and not (edge and sa): continue
    if sa:
        apps=sa['apps']; gl=sa['g']; src='temporada'
    else:
        if m is None: apps=None; gl=None
        else:
            n=max(1,min(e,2000)-s) if e<2100 else max(1,1960-s)
            apps=round(m/n); gl=round((g or 0)/n) if g is not None else None
        src='etapa'
    if apps==0 and src=='etapa' and m==0: continue
    cand[p].append(dict(c=c,s=s,e=e,m=m,apps=apps,g=gl,src=src))
# clubes cortos (Barnsley, Scunthorpe, Luton, Brighton): jugadores sacados de su ficha de Wikipedia (años y partidos del club)
CN={c['name']:c for c in clubs}
for x in json.load(open('/mnt/project-files/datos/scripts-inglaterra-1958-59/extra_fichas_wikipedia.json')):
    p=x['q']
    if p in cand: continue
    name[p]=x['name']; birth[p]=x['birth']
    info[p]=dict(pos=set(x['pos']),nat=set(x['nat']),cit=set())
    n=max(1,x['e']-x['s'])
    v=dict(c=CN[x['club']],s=x['s'],e=x['e'],m=x['m'],apps=round(x['m']/n),g=round((x['g'] or 0)/n),src='ficha')
    if x['e']==1958: v['dudoso']=True
    cand[p].append(v)
rows=[]
for p,L in cand.items():
    L.sort(key=lambda x:(x['src']=='temporada',x['apps'] or 0),reverse=True)
    x=L[0]; c=x['c']
    b=birth[p]; bd=datetime.date.fromisoformat(b); age=(REF-bd).days/365.25
    notas=[]
    pos=posmap(info.get(p,{}).get('pos',[]))
    if not pos: pos='MED'; notas.append('posición desconocida (se pone MED)')
    caps_b=caps_t=0; pais=None
    for y in car[p]:
        if y['tl'] in SENIOR:
            mm=y['m'] or 0; caps_t+=mm; pais=pais or SENIOR[y['tl']]
            s,e=y['s'],y['e'] or y['s']
            if s and mm:
                if e<=1958: caps_b+=mm
                elif s<=1958: caps_b+=round(mm*(1958.6-s)/max(e+0.6-s,1))
    if not pais:
        nat=[NAT.get(n,n) for n in info.get(p,{}).get('nat',[])]
        pais=nat[0] if nat else 'Inglaterra'
        if not nat: notas.append('nacionalidad supuesta (Inglaterra)')
    apps=x['apps']
    if apps is None: apps=5; notas.append('sin partidos en Wikidata (se suponen 5)')
    apps=min(apps,42); g=x['g']
    if x['src']=='ficha': notas.append(f"sacado de su ficha de Wikipedia: etapa {x['s']}-{x['e']} ({x['m']} partidos), partidos 1958-59 estimados con la media"+("; dudoso: su etapa acaba en 1958 y pudo irse antes de empezar la temporada" if x.get('dudoso') else ''))
    if x['src']=='etapa': notas.append(f"partidos y goles 1958-59 estimados con la media de su etapa {x['s']}-{x['e'] if x['e']<2100 else '?'} ({x['m']} partidos)")
    if len(L)>1: notas.append('también figura en '+', '.join(y['c']['name'] for y in L[1:])+' esa temporada')
    share=min(apps/38,1)
    lvl=300+0.45*c['pres']+120*(share-0.5)+6*min(caps_b,25)
    if pos=='DEL' and apps>0 and g is not None: lvl+=140*min(g/apps,1)*share
    if c['div']=='Second': lvl+=40  # Second Division inglesa: titular medio ~600 como la Segunda española
    if age<20: lvl-=30
    if age>33: lvl-=20*(age-33)
    lvl=round(lvl)
    sc=[]
    for y in car[p]:
        ee=y['e'] or (y['s'] or 0)+1
        if y['s'] and ee>=1959 and y['s']<=1972 and y['m'] and 'national' not in y['tl']:
            n=max(1,ee-y['s'])
            dentro=max(1,min(ee,1972)-max(y['s'],1958))  # temporadas de la etapa dentro de 1958-72
            if y['m']/n>=17:
                pr=pres_of(y['t'],y['tl']) or 420
                sc+= [280+0.55*pr]*min(dentro,3)
    sc.sort(reverse=True)
    F=(sum(sc[:3])/3 if len(sc)>=3 else (sum(sc)/len(sc) if sc else 0))+3*min(caps_t,60)  # en Inglaterra se cuentan hasta 60 internacionalidades (prestigios de club más bajos que en España)
    if len(sc)<3: F-=40*(3-len(sc))
    if age<22: gc,mn=500,30
    elif age<25: gc,mn=150,15
    elif age<28: gc,mn=50,8
    elif age<30: gc,mn=15,3
    else: gc,mn=5,0
    tech=int(round(min(lvl+max(mn,min(gc,F-lvl)),1000)))
    nm=name[p]
    cm=copa_match(b,nm)
    if cm:
        nm,pos,pais,v=cm
        if v: lvl,tech=v; notas.append('nivel y techo de la Copa de Europa 1958-59')
    nm=nm.replace(', Jr.',' Jr.'); pais={'RSA':'Sudáfrica','United Kingdom':'Inglaterra'}.get(pais,pais)
    if nm in MANUAL: lvl,tech=MANUAL[nm]; notas.append('valor a mano')
    rows.append(dict(division=DIVN[c['div']],club=c['name'],nombre=nm,pos=pos,nac=b,pais=pais,
        liga=f"{apps} / {g if g is not None else '?'}",nivel=lvl,techo=tech,
        _q=p,_ord=(0 if c['div']=='First' else 1,c['pos'],-lvl),_capsb=caps_b,_capst=caps_t,_notas='; '.join(notas)))
rows.sort(key=lambda r:r['_ord'])
cols=['division','club','nombre','pos','nac','pais','liga','nivel','techo']
with open(OUT,'w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore'); w.writeheader(); w.writerows(rows)
with open(OUT.replace('.csv','-notas.csv'),'w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['club','nombre','wikidata','intern_antes','intern_total','notas']); w.writeheader()
    for r in rows: w.writerow(dict(club=r['club'],nombre=r['nombre'],wikidata=r['_q'],intern_antes=r['_capsb'],intern_total=r['_capst'],notas=r['_notas']))
cnt=collections.Counter(r['club'] for r in rows)
for c in clubs: print(c['div'],c['name'],cnt[c['name']],end=' | ')
print(len(rows))
