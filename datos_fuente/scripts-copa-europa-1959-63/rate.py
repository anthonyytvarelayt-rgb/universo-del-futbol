import json,csv,sys,re,datetime,collections,unicodedata
D=sys.argv[1]; OUT=sys.argv[2]
d=json.load(open(f'{D}/agg.json')); wd=json.load(open(f'{D}/wd.json')); wd2=json.load(open(f'{D}/wd2.json'))
SEAS={1959:'1959-60',1960:'1960-61',1961:'1961-62',1962:'1962-63'}
# (nombre ES, prestigio por temporada, entrada por temporada)
CL={
'Wiener SC':('Wiener Sport-Club',{1959:760}),'RSC Anderlecht':('Anderlecht',{1959:760,1962:780}),'PFC CSKA Sofia':('CDNA Sofía',{1959:700,1960:700,1961:700,1962:720}),
'FK Senica':('Červená Hviezda Bratislava',{1959:700}),'B 1909 Odense':('B 1909 Odense',{1959:600}),'FK Vorwärts Berlin':('Vorwärts Berlín',{1959:640,1961:650,1962:650}),
'Wolverhampton Wanderers FC':('Wolverhampton Wanderers',{1959:900}),'KuPS Kuopio':('KuPS Kuopio',{1959:420}),'OGC Nice':('Niza',{1959:820}),'Olympiacos FC':('Olympiakos',{1959:600}),
'Csepel SC':('Csepel',{1959:760}),'AC Milan':('Milan',{1959:920,1962:930}),'AS Jeunesse Esch':('Jeunesse Esch',{1959:449,1960:449}),'Sparta Rotterdam':('Sparta Rotterdam',{1959:650}),
'Linfield FC':('Linfield',{1959:440,1961:440,1962:440}),'ŁKS Łódź':('ŁKS Łódź',{1959:620}),'FC Porto':('Oporto',{1959:780}),'Shamrock Rovers FC':('Shamrock Rovers',{1959:440}),
'FC Petrolul Ploieşti':('Petrolul Ploiești',{1959:620}),'Rangers FC':('Rangers',{1959:820,1961:840}),'IFK Göteborg':('IFK Göteborg',{1959:660,1961:660}),'BSC Young Boys':('Young Boys',{1959:720,1960:720}),
'Fenerbahçe SK':('Fenerbahçe',{1959:660,1961:680}),'Eintracht Frankfurt':('Eintracht Fráncfort',{1959:820}),'FK Crvena Zvezda':('Estrella Roja',{1959:820,1960:820}),
'SK Rapid':('Rapid de Viena',{1960:800}),'K. Lierse SK':('Lierse',{1960:680}),'FC Hradec Králové':('Spartak Hradec Králové',{1960:680}),'AGF Aarhus':('AGF Aarhus',{1960:620}),
'Burnley FC':('Burnley',{1960:860}),'HIFK Helsinki':('HIFK Helsinki',{1960:420,1962:420}),'Stade de Reims':('Stade de Reims',{1960:880,1962:860}),'FC Wismut Aue':('Wismut Karl-Marx-Stadt',{1960:640}),
'Panathinaikos FC':('Panathinaikos',{1960:600,1961:620,1962:620}),'Újpest FC':('Újpest Dózsa',{1960:800}),'Limerick FC':('Limerick',{1960:400}),'Juventus':('Juventus',{1960:900,1961:900}),
'AFC Ajax':('Ajax',{1960:700}),'Glenavon FC':('Glenavon',{1960:420}),'Fredrikstad FK':('Fredrikstad',{1960:560,1961:560,1962:560}),'Legia Warszawa':('Legia Varsovia',{1960:680}),
'SL Benfica':('Benfica',{1960:860,1961:940,1962:950}),'Steaua București':('CCA Bucarest',{1960:680,1961:680}),'Heart of Midlothian FC':('Heart of Midlothian',{1960:760}),
'IFK Malmö':('IFK Malmö',{1960:600}),'Beşiktaş JK':('Beşiktaş',{1960:660}),'Hamburger SV':('Hamburgo',{1960:840}),
'FK Austria Wien':('Austria de Viena',{1961:780,1962:780}),'R. Standard de Liège':('Standard de Lieja',{1961:780}),'FK Dukla Praha':('Dukla Praga',{1961:820,1962:840}),
'B 1913 Odense':('B 1913 Odense',{1961:600}),'Tottenham Hotspur':('Tottenham Hotspur',{1961:920}),'Valkeakosken Haka':('Haka Valkeakoski',{1961:420}),'AS Monaco':('Mónaco',{1961:800}),
'Vasas FC':('Vasas',{1961:800,1962:800}),'Dublin City FC':('Drumcondra',{1961:420}),'CA Spora Luxembourg':('Spora Luxemburgo',{1961:440}),'Hibernians FC':('Hibernians',{1961:380}),
'Feyenoord':('Feyenoord',{1961:760,1962:780}),'Górnik Zabrze':('Górnik Zabrze',{1961:720}),'Sporting Clube de Portugal':('Sporting de Portugal',{1961:800,1962:800}),
'FK Partizan Beograd':('Partizán de Belgrado',{1961:800,1962:800}),'Servette FC':('Servette',{1961:700,1962:700}),'1. FC Nürnberg':('Núremberg',{1961:820}),
'FK Partizani':('Partizani Tirana',{1962:450}),'Esbjerg fB':('Esbjerg',{1962:600}),'Ipswich Town FC':('Ipswich Town',{1962:820}),'US Luxembourg':('Union Luxemburgo',{1962:440}),
'Floriana FC':('Floriana',{1962:380}),'KS Polonia Bytom':('Polonia Bytom',{1962:660}),'Shelbourne FC':('Shelbourne',{1962:420}),'FC Dinamo Bucureşti':('Dinamo Bucarest',{1962:680}),
'Dundee FC':('Dundee',{1962:760}),'IFK Norrköping FK':('IFK Norrköping',{1962:640}),'Galatasaray A.Ş.':('Galatasaray',{1962:680}),'1. FC Köln':('Colonia',{1962:840}),
}
NOCHAMP={(1959,'ŁKS Łódź'):'campeón de 1958 (la liga polaca de 1959 iba a medias; acabó 8.º)',(1960,'Legia Warszawa'):'subcampeón (líder en primavera de 1960)',(1960,'IFK Malmö'):'subcampeón (líder en primavera de 1960)',
(1961,'B 1913 Odense'):'3.º (líder en primavera de 1961)',(1961,'IFK Göteborg'):'3.º (líder en primavera de 1961)',(1961,'Sporting Clube de Portugal'):'subcampeón (Benfica, campeón de liga, entra como vigente)',
(1962,'Fredrikstad FK'):'3.º (líder en el parón de julio de 1962)',(1962,'SL Benfica'):'campeón vigente (3.º en su liga)'}
GDRCL={'FK Vorwärts Berlin','FC Wismut Aue'}
PAISC={'AUT':'Austria','BEL':'Bélgica','BUL':'Bulgaria','CZE':'Checoslovaquia','SVK':'Checoslovaquia','DEN':'Dinamarca','ENG':'Inglaterra','FIN':'Finlandia','FRA':'Francia','GRE':'Grecia','HUN':'Hungría','IRL':'Irlanda','ITA':'Italia','LUX':'Luxemburgo','NED':'Países Bajos','NIR':'Irlanda del Norte','NOR':'Noruega','POL':'Polonia','POR':'Portugal','ROU':'Rumanía','SCO':'Escocia','SRB':'Yugoslavia','CRO':'Yugoslavia','BIH':'Yugoslavia','SVN':'Yugoslavia','MKD':'Yugoslavia','MNE':'Yugoslavia','SUI':'Suiza','SWE':'Suecia','TUR':'Turquía','ALB':'Albania','MLT':'Malta','WAL':'Gales','ESP':'España','ARG':'Argentina','BRA':'Brasil','URU':'Uruguay','RUS':'URSS','MOZ':'Mozambique','ANG':'Angola','RSA':'Sudáfrica','COD':'Congo','PAR':'Paraguay','CHI':'Chile','PER':'Perú','GER':'Alemania'}
W={'Hungría':.85,'Inglaterra':.9,'Francia':.8,'Suecia':.85,'RFA':.85,'Brasil':1,'URSS':.85,'Yugoslavia':.8,'Checoslovaquia':.75,'Austria':.75,'Italia':.7,'Escocia':.7,'Irlanda del Norte':.65,'Gales':.65,'España':.8,'Argentina':.85,'Uruguay':.8,
'Portugal':.5,'Bélgica':.55,'Países Bajos':.5,'Suiza':.6,'Polonia':.55,'Rumanía':.55,'Bulgaria':.6,'RDA':.4,'Dinamarca':.5,'Noruega':.45,'Finlandia':.3,'Irlanda':.4,'Turquía':.45,'Grecia':.35,'Luxemburgo':.3,'Malta':.2,'Albania':.25}
# prestigio de clubes posteriores (para el techo), por palabra clave del nombre en Wikidata
PK=[('Real Madrid',985),('Barcelona',920),('Inter',920),('Milan',920),('Juventus',900),('Benfica',920),('Santos',900),('Tottenham',880),('Manchester United',900),('Wolverhampton',860),('Reims',860),
('Atlético Madrid',800),('Athletic',840),('Valencia',760),('Roma',780),('Fiorentina',800),('Bologna',800),('Torino',740),('Napoli',740),('Lazio',720),('Sampdoria',700),('Genoa',680),('Atalanta',660),
('Arsenal',820),('Everton',820),('Burnley',820),('Liverpool',820),('Leeds',800),('Chelsea',780),('Manchester City',760),('West Ham',740),('Ipswich',760),('Rangers',820),('Celtic',820),('Dundee',720),('Hearts',720),('Heart of',720),
('Köln',820),('Hamburger',820),('Nürnberg',800),('Dortmund',800),('Bayern',800),('Eintracht Frankfurt',800),('Schalke',800),('Werder',760),('1860',760),
('Racing Club de Paris',780),('Monaco',780),('Nice',760),('Saint-Étienne',780),('Nantes',760),('Stade Français',700),('Sporting',800),('Porto',780),('Feyenoord',760),('Ajax',760),('PSV',720),
('Anderlecht',780),('Standard',780),('Dukla',820),('Honvéd',820),('Ferencváros',800),('MTK',800),('Vasas',800),('Újpest',800),('Red Star',820),('Partizan',800),('Dinamo Zagreb',760),('Hajduk',740),
('Spartak Moscow',800),('Dynamo Kyiv',800),('Dynamo Moscow',800),('CSKA',720),('Górnik',720),('Legia',700),('Rapid',780),('Austria Wien',780),('FK Austria',780),('Grasshopper',700),('Servette',700),('Young Boys',700),('Lausanne',680),
('Fenerbahçe',680),('Galatasaray',680),('Beşiktaş',680),('Peñarol',860),('River Plate',860),('Boca',860),('Panathinaikos',600),('Olympiacos',600)]
def cpres(lbl):
    for k,v in PK:
        if k.lower() in (lbl or '').lower(): return v
    return 500
def norm(s): return unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
old=list(csv.DictReader(open('/mnt/project-files/datos/copa-europa-1958-59-plantillas.csv')))
OLDN={norm(r['nombre']):r for r in old}; OLDB=collections.defaultdict(list)
for r in old: OLDB[r['nac'][:10]].append(r)
MJ=json.load(open(f'{D}/manual.json')); MAN=MJ.get('man',{}); MPOS=MJ.get('pos',{})
rows=[];parts=[]
for y in (1959,1960,1961,1962):
    T=d[str(y)]['teams']; cpj=d[str(y)]['club_pj']
    for tid,t in T.items():
        if t['cc']=='ESP':
            ESPN={'Real Madrid C.F.':'Real Madrid','FC Barcelona':'Barcelona'}[t['uefa']]
            ent={1959:{'Real Madrid':'campeón vigente','Barcelona':'campeón de liga'},1960:{'Real Madrid':'campeón vigente','Barcelona':'campeón de liga'},1961:{'Real Madrid':'campeón de liga'},1962:{'Real Madrid':'campeón de liga'}}[y][ESPN]
            parts.append(dict(temporada=SEAS[y],club=ESPN+' (real)',pais='España',entrada=ent+' — en la partida sale de la simulación',prestigio='',partidos_jugados=cpj.get(tid,0),con_alineaciones='no hace falta (plantilla del motor)'))
            continue
        nm,pr=CL[t['uefa']]; pr=pr[y]
        pc='RDA' if t['uefa'] in GDRCL else 'RFA' if t['cc']=='GER' else PAISC[t['cc']]
        parts.append(dict(temporada=SEAS[y],club=nm,pais=pc,entrada=NOCHAMP.get((y,t['uefa']),'campeón de liga'),prestigio=pr,partidos_jugados=cpj.get(tid,0),con_alineaciones='sí' if cpj.get(tid) else 'no (se retiró)'))
    for p in d[str(y)]['players']:
        t=T[p['tid']]
        if t['cc']=='ESP':
            ESPN={'Real Madrid C.F.':'Real Madrid','FC Barcelona':'Barcelona'}[t['uefa']]
            ent={1959:{'Real Madrid':'campeón vigente','Barcelona':'campeón de liga'},1960:{'Real Madrid':'campeón vigente','Barcelona':'campeón de liga'},1961:{'Real Madrid':'campeón de liga'},1962:{'Real Madrid':'campeón de liga'}}[y][ESPN]
            parts.append(dict(temporada=SEAS[y],club=ESPN+' (real)',pais='España',entrada=ent+' — en la partida sale de la simulación',prestigio='',partidos_jugados=cpj.get(tid,0),con_alineaciones='no hace falta (plantilla del motor)'))
            continue
        nm,pr=CL[t['uefa']]; pr=pr[y]
        pc='RDA' if t['uefa'] in GDRCL else 'RFA' if t['cc']=='GER' else PAISC[t['cc']]
        dud=[]
        pa=PAISC.get(p['cc'],p['pais'] or p['cc'])
        if pa=='Alemania': pa='RDA' if pc=='RDA' else 'RFA'
        nac=p['nac']; ref=datetime.date(y,9,1)
        try:
            b=datetime.date.fromisoformat(nac); age=(ref-b).days/365.25
            if nac.endswith('-01-01'): nacs=nac+' (solo año)'; dud.append('fecha de nacimiento incompleta en UEFA (solo año)')
            else: nacs=nac
        except: age=26; nacs=''; dud.append('sin fecha de nacimiento en UEFA (se supone 26 años)')
        name=p['nombre']; o=OLDN.get(norm(name))
        if not o:
            for r in OLDB.get(nac,[]):
                if norm(r['nombre']).split()[-1]==norm(name).split()[-1] or norm(name).split()[-1] in norm(r['nombre']): o=r
        if o: name=o['nombre']
        q=wd.get(p['pid'],[]); cl=[]
        if len(q)>1: dud.append('varias fichas posibles en Wikidata; no se usa ninguna')
        if len(q)==1: cl=wd2.get(q[0],[])
        nat=[c for c in cl if c['nat'] and not re.search(r'under|U-?\d|\bB\b|amateur|olympic|youth|junior|XI',c['tl'] or '',re.I)]
        capst=sum(int(float(c['m'])) for c in nat if c['m'])
        capsb=0
        for c in nat:
            if not c['m']: continue
            m=int(float(c['m'])); s=int(c['s']) if c['s'] else None; e=int(c['e']) if c['e'] else None
            if s is None and e is None: capsb+=m*(0.5 if age>24 else 0.2); continue
            s=s or (e-8); e=e or max(s+1,2026 if s>y-3 else s+8); e=max(e,s+1)
            ov=max(0,min(e,y+1)-max(s,y-5)); capsb+=m*ov/(e-s)
        capsb=round(capsb)
        if len(q)==1 and not nat: pass
        if not q: dud.append('sin ficha en Wikidata: internacionalidades y techo estimados solo por edad')
        pj=p['pj']; g=p['g']; sh=min(pj/max(cpj[p['tid']],1),1); pos=MPOS.get(name,p['pos'])
        if name in MPOS and MPOS[name]!=p['pos']: dud.append(f"posición corregida: UEFA/dorsal dice {p['pos']}")
        w=W.get(pa,.5)
        lv=300+0.45*pr+120*(sh-0.5)+6*w*min(capsb,25)
        if pos=='DEL': lv+=140*min(g/(pj+6),1)*sh
        if age<20: lv-=30
        if age>33: lv-=20*(age-33)
        lv=round(lv)
        if age<22: gc,mn=500,30
        elif age<25: gc,mn=150,15
        elif age<28: gc,mn=50,8
        elif age<30: gc,mn=15,3
        else: gc,mn=5,0
        if q and len(q)==1:
            sc=[]
            for c in cl:
                if c['nat']: continue
                s=int(c['s']) if c['s'] else None; e=int(c['e']) if c['e'] else None
                if s is None and e is None: continue
                s=s if s is not None else e-1; e=e if e is not None else s+1
                ov=min(e,y+13)-max(s,y)
                if ov<=0 and not (s<=y<=e): continue
                yrs=max(1,ov)
                if c['m']: yrs=min(yrs,max(0,int(float(c['m'])/20)))
                sc+= [280+0.55*cpres(c['tl'])]*int(yrs)
            sc.sort(reverse=True)
            F=(sum(sc[:3])/3 if len(sc)>=3 else (sum(sc)/len(sc) if sc else 0))+3*min(capst,30)
            if len(sc)<3: F-=40*(3-len(sc))
            te=lv+max(mn,min(gc,F-lv))
        else: te=lv+mn
        te=int(round(min(te,1000)))
        if o: dud.append(f"ya estaba en la Copa 1958-59 ({o['club']}: nivel {o['nivel']}, techo {o['techo']})")
        mk=f"{y}|{name}"
        if mk in MAN:
            lv,te,why=MAN[mk]; dud.append('valor a mano: '+why)
        src=f'UEFA alineaciones Copa de Europa {SEAS[y]}'+(f'; Wikidata {q[0]}' if len(q)==1 else '')
        rows.append(dict(temporada=SEAS[y],club=nm,pais_club=pc,nombre=name,pos=pos,nac=nacs,pais=pa,pj_copa=pj,goles_copa=g,intern_antes=capsb,intern_total=capst,nivel=lv,techo=max(te,lv),fuente=src,dudas='; '.join(dud)))
rows.sort(key=lambda r:(r['temporada'],r['club'],{'POR':0,'DEF':1,'MED':2,'DEL':3}[r['pos']],-r['nivel']))
with open(OUT+'-plantillas.csv','w',newline='') as f:
    wr=csv.DictWriter(f,fieldnames=list(rows[0])); wr.writeheader(); wr.writerows(rows)
with open(OUT+'-participantes.csv','w',newline='') as f:
    wr=csv.DictWriter(f,fieldnames=list(parts[0])); wr.writeheader(); hasr={(r['temporada'],r['club']) for r in rows}
    for p in parts:
        if p['pais']!='España' and (p['temporada'],p['club']) not in hasr: p['con_alineaciones']='no (se retiró sin jugar)'; p['partidos_jugados']=0
    seen=set(); parts=[p for p in parts if not ((p['temporada'],p['club']) in seen or seen.add((p['temporada'],p['club'])))]
    wr.writerows(sorted(parts,key=lambda r:(r['temporada'],r['pais'])))
print(len(rows),len(parts))
