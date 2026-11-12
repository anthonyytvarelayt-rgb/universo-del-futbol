import json,glob,re,datetime,collections,csv
r=json.load(open('squads.json'))
PP=json.load(open('pres.json')); P=PP['P']; AL=PP['ALIAS']
EST={"Mallorca":430,"Pontevedra":420,"Burgos":400,"Orense":400,"Salamanca":390,"Xerez":380,"San Sebastián":330,"Mestalla":380,"Sevilla Atlético":330,"Atlético Baleares":360,"Eibar":340,"Recreativo de Huelva":380,"Cultural Leonesa":400,"Cartagena":380,"Alicante":360,"España Algeciras":300,"Constancia":330,"España de Tánger":280,"Castellón":430,"Albacete":330,"Escoriaza":260,"Melilla CF":300,"La Felguera":300,"Logroñés":380,"Caudal":330,"Balompédica Linense":300,"Lérida":360,"España Industrial":400,"Langreo":380,"Villarrobledo":270,"Alcoyano":450,"UD Huesca":300}
def pres(n):
    n2=AL.get(n,n)
    if n2 in P: return P[n2],False
    if n in EST: return EST[n],True
    return 450,True
c=json.load(open('coef.json'))
POS={"por":"POR","def":"DEF","cen":"DEF","ltd":"DEF","lti":"DEF","mig":"MED","dav":"DEL","dac":"DEL"}
PAIS={"espanya":"España","argentina":"Argentina","paraguay":"Paraguay","brasil":"Brasil","hungria":"Hungría","uruguay":"Uruguay","peru":"Perú","marruecos":"Marruecos","francia":"Francia","angola":"Angola","honduras":"Honduras","austria":"Austria","republicacheca":"Checoslovaquia","suecia":"Suecia","portugal":"Portugal","venezuela":"Venezuela","alemania":"Alemania","belgica":"Bélgica","dinamarca":"Dinamarca","chile":"Chile"}
SEAS=['1959-60','1960-61','1961-62','1962-63']
by=collections.defaultdict(list)
for x in r: by[x['jid']].append(x)
def sy(t): return int(t[:4])
rows=[]
for f in sorted(glob.glob('pj/*.json')):
    jid=f[3:-5]; j=json.load(open(f)); tr=j['trajectoria']
    es=[s for s in tr if s.get('flag')=='España' and s['jer'] in ('1ª','2ª') and isinstance(s['pj'],int) and s['pj']>0]
    if not es: continue
    first=min(s['temp'] for s in es)
    if first=='1958-59' or any(s['temp']=='1958-59' for s in es): continue
    ent=min((s['temp'] for s in es if s['temp'] in SEAS),default=None)
    if ent is None: continue
    tipo='debuta' if first>='1959-60' else 'regresa'
    sq=[x for x in by[jid] if x['temp']==ent and x['cells'] and x['cells'][1 if len(x['cells'])==9 else 0]!='0']
    es_ent=[s for s in es if s['temp']==ent]
    main=max(es_ent,key=lambda s:(s['m'] if isinstance(s['m'],int) else 0, s['pj']))
    sqm=[x for x in by[jid] if x['temp']==ent and x['club']==main['nomeq']] or sq or [x for x in by[jid] if x['temp']==ent] or by[jid]
    s0=sqm[0]
    h=j['head']
    m=re.search(r"Fecha de nacimiento ([0-9/]+)",h); bd=m.group(1) if m else ""
    notas=[]
    REF=datetime.date(sy(ent),9,1)
    try:
        dd,mm,yy=bd.split("/"); b=datetime.date(int(yy),int(mm),int(dd)); nac=b.isoformat(); age=(REF-b).days/365.25
    except Exception:
        age=None
        if re.match(r"^\d\d/\d{4}$",bd): nac=bd[3:]+"-"+bd[:2]+" (sin día)"; age=sy(ent)-int(bd[3:])
        elif re.match(r"^\d{4}$",bd): nac=bd+" (solo año)"; age=sy(ent)-int(bd)
        else: nac=""; notas.append("sin fecha de nacimiento")
    if age is None:
        e=s0['cells'][0] if len(s0['cells'])==9 else ''
        age=int(e) if e.isdigit() else (int(main['edat']) if str(main.get('edat','')).isdigit() else 22)
        if not e.isdigit() and not str(main.get('edat','')).isdigit(): notas.append("edad desconocida (se supone 22)")
    pjs=sum(s['pj'] for s in es_ent); gs=sum(s['g'] for s in es_ent if isinstance(s['g'],int))
    mins=sum(s['m'] for s in es_ent if isinstance(s['m'],int))
    if not any(isinstance(s['m'],int) and s['m']>0 for s in es_ent): mins=pjs*80; notas.append("minutos estimados")
    share=min(mins/2700,1)
    pos=POS.get(s0['pos'],"MED")
    pr,est=pres(main['nomeq'])
    if est: notas.append(f"prestigio de {main['nomeq']} estimado ({pr})")
    capsb=capst=0
    for x in j.get('internacional') or []:
        if x['key'] in ('COM','AMI'):
            for e in x['data']:
                n=e['pj'] if isinstance(e['pj'],int) else 0
                y=int(re.match(r'\d{4}',e['temp']).group(0)) if re.match(r'\d{4}',e['temp']) else 9999
                capst+=n
                if y<=sy(ent): capsb+=n
    pais=PAIS.get(s0['pais'],s0['pais'])
    if not s0['pais']:
        m=re.search(r"País de nacimiento (.*?) (?:Nacionalidad|Demarcación)",h); pais=m.group(1).strip() if m else ""; notas.append("país sacado del lugar de nacimiento")
    ext=1 if (s0['pais'] not in ('espanya','') and capsb==0) else 0
    gp=min(gs/pjs,1)*share if pos=="DEL" and pjs>0 else 0
    lvl=c[0]+c[1]*pr+c[2]*share+c[3]*min(capsb,25)+c[4]*gp+c[5]*ext+c[6]*(1 if age<20 else 0)
    if age>33: lvl-=20*(age-33)
    lvl=round(lvl)
    # techo: mejores temporadas reales en Primera (>=1500 min) desde la entrada hasta 13 años después
    sc=[];per=collections.defaultdict(int)
    for s in tr:
        if s.get('flag')=='España' and s['jer']=='1ª' and ent<=s['temp'] and sy(s['temp'])<=sy(ent)+13 and isinstance(s['m'],int):
            per[(s['temp'])]+=0
            if s['m']>=1500: sc.append(280+0.55*pres(s['nomeq'])[0])
    sc.sort(reverse=True)
    F=(sum(sc[:3])/3 if len(sc)>=3 else (sum(sc)/len(sc) if sc else 0))+3*min(capst,30)
    if len(sc)<3: F-=40*(3-len(sc))
    if age<22: gc,mn=500,30
    elif age<25: gc,mn=150,15
    elif age<28: gc,mn=50,8
    elif age<30: gc,mn=15,3
    else: gc,mn=5,0
    tech=int(round(min(lvl+max(mn,min(gc,F-lvl)),1000)))
    if tipo=='regresa': notas.append(f"ya había jugado en España antes (desde {first})")
    if ext: notas.append("extranjero: sin datos de su selección, recibe el extra de extranjero")
    if s0['durant']: notas.append("llegó con la temporada empezada")
    div=s0['div'] if s0['club']==main['nomeq'] else ("Primera" if main['jer']=='1ª' else "Segunda")
    rows.append(dict(temporada=ent,tipo=('extranjero' if s0['pais'] not in ('espanya','') else tipo),division=div,club=main['nomeq'],nombre=s0['apodo'],nombre_completo=s0['nombre'],pos=pos,nac=nac,pais=pais,liga=f"{pjs} / {gs}",nivel=lvl,techo=tech,primera_temporada_en_espana=first,partidos_espana=capst,fuente=f"https://www.bdfutbol.com/es/j/j{jid}.html",nota="; ".join(notas)))
ORD={"Primera":0,"Segunda Norte":1,"Segunda Sur":2,"Segunda":3}
rows.sort(key=lambda x:(x['temporada'],ORD.get(x['division'],4),x['club'],-x['nivel']))
json.dump(rows,open('rows.json','w'),ensure_ascii=False,indent=0)
print(len(rows),collections.Counter(x['tipo'] for x in rows),collections.Counter(x['temporada'] for x in rows))
for x in sorted(rows,key=lambda x:-x['techo'])[:45]: print(x['temporada'],x['club'],x['nombre'],x['pos'],x['nac'],x['pais'],x['liga'],x['nivel'],x['techo'],x['partidos_espana'])
