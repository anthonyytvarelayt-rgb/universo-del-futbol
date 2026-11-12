import os,csv,sys
from lib import *
from prestige import run as prestige_run
import wiki
OUT='/tmp/claude-0/-home-user/53a70bdb-ffc0-5832-9935-b9a45e8481fd/scratchpad/it/'
NICE={'430':'Fiorentina','5':'Milan','12':'Roma','3037':'Padova','1025':'Bologna','416':'Torino','252':'Genoa','46':'Inter','506':'Juventus','398':'Lazio','2655':'Vicenza','1038':'Sampdoria','2722':'SPAL','332':'Bari','6195':'Napoli','410':'Udinese','2721':'Alessandria','4271':'Triestina',
'57135':'Marzotto Valdagno','2919':'Monza','2250':'Prato','5621':'Reggiana','1104':'Messina','800':'Atalanta','19':'Brescia','1390':'Cagliari','5514':'Lecco','1627':'Catania','1047':'Como','276':'Verona','1385':'Modena','6692':'Novara','458':'Palermo','130':'Parma','4093':'Taranto','4330':'Sambenedettese','607':'Venezia','4170':'Vigevano'}
FIX={'US Catanzaro':'Catanzaro','Mantova 1911':'Mantova','Aurora Pro Patria':'Pro Patria','Calcio Foggia 1920':'Foggia','Lucchese Calcio':'Lucchese','Cosenza Calcio':'Cosenza','Varese Calcio':'Varese','Potenza Calcio':'Potenza'}
# ---------- carga de datos
LIGAS=[('IT1',y) for y in range(1950,1976)]+[('IT2',y) for y in range(1950,1964)]
H=collections.defaultdict(list); CLUBNAME={}
for L,y in LIGAS:
    for r in season_rows(L,y): H[r['pid']].append(r)
    for slug,cid in clubs(L,y):
        if cid not in NICE and cid not in CLUBNAME:
            h=get('/%s/startseite/verein/%s/saison_id/%d'%(slug,cid,y))
            m=re.search(r'<h1[^>]*>\s*([^<]+?)\s*</h1>',h)
            n=m.group(1).strip() if m else slug
            CLUBNAME[cid]=FIX.get(n,n)
CN=dict(NICE); CN.update(CLUBNAME)
PR=prestige_run({c:n for c,n in CLUBNAME.items()})
def pres(cid):
    p=PR[CN[cid]]['prestigio']
    return p if cid in NICE else max(p,300)
ITA=italy_caps()
TMC=json.load(open('tmcaps.json')) if os.path.exists('tmcaps.json') else {}
DOB={}
for L,y in [(l,yy) for l in ('IT1','IT2') for yy in range(1958,1963)]:
    for slug,cid in clubs(L,y):
        for pid,v in kader_dob(slug,cid,y).items():
            if pid not in DOB or not DOB[pid]['dob']: DOB[pid]=v
def sy(s): return s
def caps_info(pid,name,nats,S):
    """devuelve (caps_antes_5_temporadas, caps_total, fuente)"""
    cb=ct=0; src=[]
    if pid in ITA:
        e=ITA[pid]; ys=sorted(e['years']); ct+=e['caps']
        win=[y for y in ys if S-5<=y<=S]  # temporadas S-5..S (año de la convocatoria)
        cb+=e['caps']*len([y for y in ys if S-5<=y<=S])/len(ys) if ys else 0
        src.append('Italia (Transfermarkt)')
    foreign=[n for n in nats if n!='Italy']
    if foreign:
        wt=wiki.cache.get(name,'') or ''
        by=DOB.get(pid,{}).get('dob','')[-4:]
        if by and by not in wt[:3000]: wt=''
        for sp in wiki.natspans(wt):
            if sp['naz']=='ITA': continue
            yrs=list(range(sp['desde'],sp['hasta']+1)); ov=[y for y in yrs if S-5<=y<=S]
            ct+=sp['caps']; cb+=sp['caps']*len(ov)/len(yrs); src.append('selección extranjera (Wikipedia it)')
        if not wiki.natspans(wt) and pid in TMC:
            e=TMC[pid]
            if e['caps'] and e['team']!='Italy' and not re.search(r'U\d|B$|Olympic',e['team']):
                ct+=e['caps']; cb+=e['caps']*0.4; src.append('selección extranjera (Transfermarkt, reparto por años estimado)')
    return round(cb),ct,src
def seasons_of(pid,L=None):
    return [r for r in H[pid] if (L is None or r['L']==L)]
def rate(r,S,man=None):
    pid=r['pid']; L=r['L']; games=34 if L=='IT1' else 38
    rows=[x for x in H[pid] if x['y']==S and x['L']==L and x['cid']==r['cid']]
    apps=sum(x['apps'] for x in rows); g=sum(x['g'] for x in rows); mins=sum(x['mins'] for x in rows)
    notas=[]
    d=DOB.get(pid,{}).get('dob','')
    ref=datetime.date(S,9,1)
    if d:
        b=datetime.date(*map(int,iso(d).split('-'))); age=(ref-b).days/365.25; nac=iso(d)
    else:
        try: age=float(r['age'])+0.0
        except: age=25; notas.append('edad desconocida (se supone 25)')
        nac=''; notas.append('sin fecha de nacimiento')
    nats=DOB.get(pid,{}).get('nat') or r['nat']
    pr=pres(r['cid'])
    share=min(mins/(games*90),1)
    cb,ct,src=caps_info(pid,r['name'],nats,S)
    lvl=300+0.45*pr+120*(share-0.5)+6*min(cb,25)
    if r['pos']=='DEL' and apps>0: lvl+=140*min(g/apps,1)*share
    ext=(nats and nats[0]!='Italy' and 'Italy' not in nats)
    if ext and ct==0:
        lvl+=40; notas.append('extranjero sin datos de su selección: recibe el extra de extranjero (+40)')
    if age<20: lvl-=30
    if age>33: lvl-=20*(age-33)
    lvl=round(lvl)
    sc=[]
    for x in H[pid]:
        if x['L']=='IT1' and S<=x['y']<=S+13 and x['mins']>=1500: sc.append(280+0.55*pres(x['cid']))
    sc.sort(reverse=True)
    F=(sum(sc[:3])/3 if len(sc)>=3 else (sum(sc)/len(sc) if sc else 0))+3*min(ct,30)
    if len(sc)<3: F-=40*(3-len(sc))
    if age<22: gc,mn=500,30
    elif age<25: gc,mn=150,15
    elif age<28: gc,mn=50,8
    elif age<30: gc,mn=15,3
    else: gc,mn=5,0
    tech=int(round(min(lvl+max(mn,min(gc,F-lvl)),1000)))
    if man: lvl,tech=man[0],man[1]; notas.append(man[2])
    pais=' / '.join([PAIS.get(n,n) for n in nats if n!='Italy']+(['Italia'] if 'Italy' in nats else [])) or 'Italia'
    return dict(pid=pid,nombre=r['name'],pos=r['pos'],nac=nac,pais=pais,pj=apps,g=g,mins=mins,age=round(age,1),capsb=cb,capst=ct,nivel=lvl,techo=tech,pr=pr,notas=notas,src=src,ext=ext)
