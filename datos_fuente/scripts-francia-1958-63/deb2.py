import json,os,csv,datetime,re
from infobox import parse
from rate import techo,caps,presclub,norm
from prestige import CL
P=json.load(open('prestige.json')); PR={v['club']:v['prestigio_final'] for v in P.values()}
d1=json.load(open('d1hist.json'))
inv={a:nm for k,(nm,al) in CL.items() for a in al}
D1S={f"{s[:4]}":{inv[n] for p,n in v} for s,v in d1.items() if s>='195960'}
POS=lambda p:('POR' if 'gardien' in p else 'DEF' if any(w in p for w in ['défenseur','arrière','libéro','stoppeur','latéral']) else 'MED' if any(w in p for w in ['milieu','demi','relayeur','meneur']) else 'DEL' if p else 'MED')
NATS={'France':'Francia','Algérie':'Argelia','Maroc':'Marruecos','Cameroun':'Camerún','Argentine':'Argentina','Hongrie':'Hungría','Yougoslavie':'Yugoslavia','Espagne':'España','Italie':'Italia','Tunisie':'Túnez','Sénégal':'Senegal','Mali':'Malí',"Côte d'Ivoire":'Costa de Marfil','Belgique':'Bélgica','Pays-Bas':'Países Bajos','Paraguay':'Paraguay','Brésil':'Brasil','Uruguay':'Uruguay','Allemagne':'Alemania','Autriche':'Austria','Suisse':'Suiza','Luxembourg':'Luxemburgo','Pologne':'Polonia','Togo':'Togo','Congo':'Congo'}
cand=json.load(open('debcand.json'))
out=[]
for c in cand:
    y=c['start']; temp=f"{y}-{str(y+1)[2:]}"
    div='Division 1' if c['club'] in D1S.get(str(y),set()) else 'Division 2'
    f=f"wikideb/{c['q']}.json"; d=json.load(open(f)) if os.path.exists(f) else None
    info=parse(d['content']) if d and d['content'] else {'car':[],'sel':[]}
    notas=[]
    # nacionalidad
    nat=c['nat']
    if not nat and d and d['content']:
        m=re.search(r"nationalité\s*=\s*([^\n]*)",d['content']); nat=m.group(1) if m else ''
    pais='Francia'
    for k,v in NATS.items():
        if k.lower()[:5] in nat.lower() or v.lower()[:5] in nat.lower(): pais=v;break
    if not nat: notas.append("país no indicado en la fuente (se supone Francia)")
    # tramo en el club
    st=[r for r in info['car'] if r['y1']<=y<=r['y2'] and presclub(r['club']) is not None and r['m'] is not None]
    st=[r for r in st if norm(c['club'])[:4] in norm(r['club']) or presclub(r['club'])==presclub(c['club'])] or st
    prev=[r for r in info['car'] if r['y2']<=y and r['y1']<y and 'total' not in r['club'].lower()]
    if st:
        r=st[0]; span=max(r['y2']-r['y1'],1); mps=r['m']/span; gps=(r['g'] or 0)/span
    else:
        mps=None; gps=0; notas.append("partidos de su primera temporada desconocidos (se supone suplente)")
    # tipo
    prevfr=[r for r in prev if presclub(r['club']) is not None]
    abroad=[r for r in prev if re.search(r"\b(ESP|ITA|ARG|HUN|YUG|URU|BRA|BEL|SUI|AUT|MAR|ALG|TUN|NED|GER|POR|PAR)\b",r['club']) ]
    if pais!='Francia' and (abroad or not prevfr): tipo='extranjero'
    elif prevfr and min(r['y1'] for r in prevfr)<1958: tipo='regresa'
    else: tipo='cantera'
    bd=c['birth']
    try: b=datetime.date.fromisoformat(bd); age=(datetime.date(y,9,1)-b).days/365.25
    except Exception: age=21; notas.append("sin fecha de nacimiento (se supone 21 años)"); bd=''
    pos=POS((c['pos'] or '').lower())
    if not c['pos'] and d and d['content']:
        m=re.search(r"position\s*=\s*([^\n]*)",d['content']); pos=POS(m.group(1).lower() if m else '')
    capsb,capst=caps(info['sel'],pais,y)
    share=min((mps if mps is not None else 8)/30,1)
    pr=PR.get(c['club'],330)
    if div=='Division 2' and pr>550: pr=550; notas.append('club en Division 2: prestigio limitado a 550 para el nivel')
    lvl=300+0.45*pr+120*(share-0.5)+6*min(capsb,25)
    if pos=='DEL' and mps: lvl+=140*min(gps/max(mps,1),0.8)*share
    if age<20: lvl-=30
    if age>33: lvl-=20*(age-33)
    if tipo=='extranjero' and capsb==0: lvl+=40; notas.append("extranjero: sin datos de su selección, recibe extra de extranjero")
    lvl+= 45 if div=='Division 1' else 54
    lvl=int(round(lvl))
    tch,_=techo(info['car'],lvl,age,capst,y)
    if not d or not d.get('content'): notas.append("sin ficha en Wikipedia: techo estimado solo por edad")
    liga=f"{round(mps)} / {round(gps)}" if mps is not None else ""
    if mps is not None: notas.append("liga = media por temporada de su etapa en el club (no la temporada exacta)")
    ES={r['nombre']:r for r in csv.DictReader(open('/mnt/project-files/datos/espana-1958-59-plantillas.csv'))}
    if c['name'] in ES and ES[c['name']]['nac']==bd:
        e=ES[c['name']]; lvl,tch,pos=int(e['nivel']),int(e['techo']),e['pos']
        if age>33: lvl-=int(20*(age-33)); tch=max(tch-int(20*(age-33)),lvl)
        tipo='regresa'; notas=[f"viene de {e['club']} (España): mismos valores que en el CSV de España"]
    out.append(dict(temporada=temp,division=div,club=c['club'],nombre=c['name'],pos=pos,nac=bd,pais=pais,liga=liga,nivel=lvl,techo=max(tch,lvl),debut=y,tipo=tipo,
        intern_antes=capsb,intern_total=capst,fuente=f"https://www.wikidata.org/wiki/{c['q']}"+(f"; https://fr.wikipedia.org/wiki/{c['art'].replace(' ','_')}" if c['art'] else ''),nota="; ".join(notas)))
out.sort(key=lambda r:(r['temporada'],r['division'],r['club'],-r['nivel']))
cols=['division','club','nombre','pos','nac','pais','liga','nivel','techo','debut','tipo','temporada','intern_antes','intern_total','fuente','nota']
w=csv.DictWriter(open('/mnt/project-files/datos/francia-debutantes-1959-63.csv','w',newline=''),fieldnames=cols);w.writeheader();w.writerows([{k:r[k] for k in cols} for r in out])
import collections
print(len(out),collections.Counter(r['tipo'] for r in out),collections.Counter(r['division'] for r in out))
for r in sorted(out,key=lambda r:-r['techo'])[:25]: print(r['temporada'],r['club'],r['nombre'],r['pos'],r['nac'],r['pais'],r['liga'],r['nivel'],r['techo'],r['tipo'],r['intern_total'])
