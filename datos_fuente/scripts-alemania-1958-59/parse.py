import json,re,collections,datetime,sys
sys.path.insert(0,'s'); import prose
T=json.load(open('txt.json')); C=json.load(open('clubs2.json')); MEM=json.load(open('mem.json'))
MON={m:i+1 for i,m in enumerate('Januar Februar März April Mai Juni Juli August September Oktober November Dezember'.split())}
MON['Jänner']=1
def norm(s):
    s=s.lower()
    for a,b in [('ß','ss'),('ü','u'),('ö','o'),('ä','a'),('é','e')]: s=s.replace(a,b)
    return re.sub(r'[^a-z0-9]','',s)
EXTRA={'MSV Duisburg':['Meidericher SV','Meidericher Spielverein'],'Borussia Mönchengladbach':['Borussia München-Gladbach','Borussia M.Gladbach'],'TuS Koblenz':['TuS Neuendorf'],
'SC Viktoria Köln':['Viktoria Köln','SC Viktoria 04 Köln','FC Viktoria Köln'],'Tasmania Berlin, 1900':['SC Tasmania 1900 Berlin','Tasmania 1900 Berlin','Tasmania Berlin','SC Tasmania 1900 Neukölln'],'SpVgg Greuther Fürth':['SpVgg Fürth'],
'SSV Ulm 1846':['TSG Ulm 1846','Ulm 1846'],'Duisburger SpV':['Duisburger SV','Duisburger Spielverein'],'Westfalia Herne':['SC Westfalia 04 Herne','SC Westfalia Herne'],'Hertha BSC':['Hertha BSC Berlin'],
'SV Werder Bremen':['Werder Bremen'],'Altona 93':['Altonaer FC von 1893','Altonaer FC 93','FC Altona 93'],'Bremerhaven 93':['TuS Bremerhaven 93','OSC Bremerhaven'],'SC Concordia Hamburg':['Concordia Hamburg','SC Concordia von 1907'],
'Eintracht Nordhorn':['SV Eintracht Nordhorn'],'Preußen Münster':['SC Preußen Münster','SC Preußen 06 Münster'],'Eintracht Trier':['SV Eintracht Trier 05'],'Wormatia Worms':['VfR Wormatia Worms'],'Phönix Ludwigshafen':['SV Phönix Ludwigshafen','Phönix Ludwigshafen'],
'FV Speyer':['FV 1904 Speyer'],'Blau-Weiß 90 Berlin':['SpVgg Blau-Weiß 1890 Berlin','Blau-Weiß 90 Berlin','SC Blau-Weiß 90 Berlin'],'Hertha Zehlendorf':['Hertha 03 Zehlendorf'],'SV Weisenau':['SpVgg Weisenau'],'Wacker 04 Berlin':['SC Wacker 04 Berlin','SC Wacker 04'],
'FC Viktoria 1889 Berlin':['Viktoria 89 Berlin','BFC Viktoria 1889','Viktoria 89'],'Rot-Weiss Essen':['Rot-Weiß Essen'],'Rot-Weiß Oberhausen':['Rot-Weiss Oberhausen'],'SC Union 06 Berlin':['Union 06 Berlin'],'Berliner SV 1892':['Berliner SV 92','BSV 92'],
'1. FC Schweinfurt 05':['FC Schweinfurt 05'],'Eintracht Bad Kreuznach':['Eintracht Kreuznach'],'SV Viktoria Aschaffenburg':['Viktoria Aschaffenburg'],'SSV Reutlingen 05':['SSV Reutlingen'],'FC Bayern München':['Bayern München'],'TSV 1860 München':['1860 München','TSV München 1860'],
'Ludwigshafener SC':['SC Ludwigshafen'],'FC Bayern Hof':['Bayern Hof','SpVgg Bayern Hof'],'Hamborn 07':['Sportfreunde Hamborn 07','SF Hamborn 07'],'SSV Jahn Regensburg':['Jahn Regensburg'],'Bayer 04 Leverkusen':['Bayer Leverkusen'],'KSV Hessen Kassel':['Hessen Kassel'],'TSV Schwaben Augsburg':['Schwaben Augsburg'],
'1. FC Phönix Lübeck':['Phönix Lübeck'],'VfV 06 Hildesheim':['VfV Hildesheim'],'ASV Bergedorf 85':['Bergedorf 85'],'Sportfreunde 05 Saarbrücken':['Sportfreunde Saarbrücken'],'SV Saar 05 Saarbrücken':['Saar 05 Saarbrücken','SV Saar 05'],'SV Arminia Hannover':['Arminia Hannover']}
SHORT={'Werder Bremen':['SV Werder','Werder'],'Schalke 04':['Schalke'],'Hamburgo':['HSV'],'Pirmasens':['FKP','Pirmasens'],'Kaiserslautern':['Lautern','FCK'],'Westfalia Herne':['Westfalia'],'Tasmania Berlín':['Tasmania'],'Tennis Borussia':['Tennis Borussia','TeBe'],'Fortuna Düsseldorf':['Fortuna'],'Alemannia Aquisgrán':['Alemannia'],'Borussia Neunkirchen':['Neunkirchen'],'Holstein Kiel':['Holstein','KSV'],'Eintracht Braunschweig':['Eintracht Braunschweig','Braunschweig'],'Hannover 96':['Hannover'],'VfL Osnabrück':['Osnabrück'],'Kickers Offenbach':['Offenbach','OFC'],'Spandauer SV':['Spandau'],'Wormatia Worms':['Wormatia'],'Mainz 05':['Mainz'],'Eintracht Trier':['Trier'],'Saar 05':['Saar 05'],'Phönix Ludwigshafen':['Phönix'],'Viktoria 89 Berlín':['Viktoria 89'],'Union 06 Berlín':['Union 06'],'Rot-Weiss Essen':['RWE','Rot-Weiß'],'Bochum':['Bochum'],'Sodingen':['Sodingen'],'St. Pauli':['St. Pauli'],'Concordia Hamburgo':['Concordia'],'Bremerhaven 93':['Bremerhaven'],'Altona 93':['Altona'],'Preußen Münster':['Preußen'],'Meidericher SV':['Meiderich'],'Fürth':['Fürth','Kleeblatt'],'Stuttgart':['VfB'],'Karlsruhe':['KSC'],'Núremberg':['Club'],'Múnich 1860':['Löwen','1860'],'Bayern Múnich':['Bayern'],'Eintracht Fráncfort':['Eintracht'],'Colonia':['FC Köln','Geißböcke']}
for c in C:
    c['short']=set(norm(x) for x in SHORT.get(c['club'],[]))
    al=set([c['art'],c['ftab'],c.get('tab',c['ftab'])]+c['cats'])
    for n in list(al): al|=set(EXTRA.get(n,[]))
    c['al']=set(norm(a) for a in al if len(norm(a))>4)
DEM={'deutsch':'RFA','saarländ':'Sarre','österreich':'Austria','niederländ':'Países Bajos','ungar':'Hungría','jugoslaw':'Yugoslavia','tschech':'Checoslovaquia','schweiz':'Suiza','dän':'Dinamarca','schwed':'Suecia','italien':'Italia','luxemb':'Luxemburgo','belg':'Bélgica','polni':'Polonia','finn':'Finlandia','norweg':'Noruega','französ':'Francia','englisch':'Inglaterra','türk':'Turquía','rumän':'Rumanía','griech':'Grecia','argentin':'Argentina','brasil':'Brasil','spani':'España','schott':'Escocia','irisch':'Irlanda','japan':'Japón','südafrik':'Sudáfrica','kamerun':'Camerún'}
def birth(s):
    m=re.search(r'GEBURTSDATUM\s*=\s*([^\n|]*)',s)
    d=m.group(1).strip() if m else ''
    m=re.match(r'(\d+)\.\s*([A-Za-zäÄöü]+)\s+(\d{4})',d)
    if m and m.group(2) in MON: return datetime.date(int(m.group(3)),MON[m.group(2)],int(m.group(1))).isoformat(),int(m.group(3))
    m=re.search(r'(\d{4})',d)
    if m: return m.group(1)+' (solo año)',int(m.group(1))
    return '',None
def stations(sec):
    out=[]
    for x in re.findall(r'\{\{Team-Station\s*\|((?:[^{}]|\{\{[^{}]*\}\})*)\}\}',sec):
        x=re.sub(r'\{\{0\|?[^{}]*\}\}','',x)
        p=[q.strip() for q in x.split('|')]
        # rejoin links split by |
        txt=x; link=re.search(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]',txt)
        yrs=p[0]
        rest=re.sub(r'\[\[[^\]]*\]\]','LINK',x).split('|')[1:]
        club_t=link.group(1) if link else (rest[0] if rest else '')
        club_d=(link.group(2) or link.group(1)) if link else club_t
        g=gl=None
        for q in rest[1:]:
            m=re.match(r'\s*(\d+)\s*\(\s*(\d+)\s*\)',q)
            if m: g,gl=int(m.group(1)),int(m.group(2))
        ys=[int(y) for y in re.findall(r'(\d{4})',yrs)]
        a=ys[0] if ys else None; b=ys[-1] if ys else None
        if a and re.search(r'^\s*\d{4}\s*[–-]\s*$',yrs): b=2000
        if not ys and re.search(r'[–-]\s*(\d{4})',yrs): pass
        out.append(dict(y=yrs,a=a,b=b,club=club_t,disp=club_d,g=g,gl=gl))
    return out
def sections(s):
    i=s.find('{{Infobox Fußballspieler')
    if i<0: return None
    j=s.find("'''",i); ib=s[i:j if j>0 else i+8000]
    parts=re.split(r'\n\|\s*([a-zäöü_]+)\s*=',ib); d={}
    for k in range(1,len(parts)-1,2): d[parts[k]]=parts[k+1]
    return d
POSMAP=[('torwart','POR'),('torhüter','POR'),('mittelläufer','DEF'),('verteidig','DEF'),('abwehr','DEF'),('libero','DEF'),('stopper','DEF'),('außenläufer','MED'),('läufer','MED'),('mittelfeld','MED'),('halbstürmer','MED'),('halblinks','MED'),('halbrechts','MED'),('stürmer','DEL'),('sturm','DEL'),('angriff','DEL'),('außen','DEL'),('flügel','DEL'),('rechtsaußen','DEL'),('linksaußen','DEL')]
def position(ib,s):
    src=(ib.get('position','') if ib else '')
    if not norm(src): src=s[s.find("'''"):][:1500]
    src=src.lower()
    best=None
    for k,v in POSMAP:
        i=src.find(k)
        if i>=0 and (best is None or i<best[0]): best=(i,v)
    return best[1] if best else 'MED', bool(best)
def nation(s):
    m=re.search(r'KURZBESCHREIBUNG\s*=\s*([^\n]*)',s); k=(m.group(1) if m else '').lower()
    ps=[v for d,v in DEM.items() if d in k]
    if not ps and 'deutsch' in s[:3000].lower(): ps=['RFA']
    return ' / '.join(dict.fromkeys(ps)) or 'RFA'
NT_OK=['deutsche fußballnationalmannschaft','saarländische fußballnationalmannschaft']
def caps(ib):
    if not ib: return 0,0,[]
    st=stations(ib.get('nationalmannschaft_tabelle',''))
    cb=ct=0;lst=[]
    for x in st:
        c=x['club'].lower()
        if any(w in c for w in ['b-','amateur','olymp','jugend','junior','u-1','u-2','u1','u2','b-nat','b-auswahl','auswahl']): continue
        if 'nationalmannschaft' not in c: continue
        n=x['g'] or 0; ct+=n; lst.append((x['club'],x['y'],n))
        a,b=x['a'],x['b']
        if a and b:
            if b<=1958: cb+=n
            elif a<=1958: cb+=n*(1958.5-a)/(b-a+0.5)
    return round(cb),ct,lst
def prose_spells(s,c):
    body=s[s.find("'''"):]
    body=re.sub(r'<ref[^>]*/>|<ref.*?</ref>','',body,flags=re.S)
    body=re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]',r'\1',body)
    hits=[]
    for sent in re.split(r'(?<=[.!?])\s+',body):
        if not any(a in norm(sent) for a in c['al']): continue
        if re.search(r'1958/59|1958/1959',sent): hits.append(('explícito',sent[:200]))
        for m in re.finditer(r'(19[3-6]\d)(?:/\d\d)?\s*(?:–|-|bis|und)\s*(?:zum\s+)?(?:Jahr\s+)?(19[3-7]\d|\d\d)\b',sent):
            a=int(m.group(1)); b=int(m.group(2)); b=b if b>100 else 1900+b
            if a<=1958 and b>=1959: hits.append(('rango',sent[:200]))
    return hits
ALLAL=[c['al'] for c in C if c['div']!='extra']
ALLS=[c['al']|c['short'] for c in C if c['div']!='extra']
res=[]
for c in C:
    if c['div']=='extra': continue
    tits=set(t for n in c['cats'] for t in MEM.get(n,[]))
    for t in sorted(tits):
        s=T.get(t,''); nac,by=birth(s)
        if by and by>1942: continue
        ib=sections(s); pos,posok=position(ib,s)
        st=stations(ib.get('vereine_tabelle','')) if ib else []
        sp=[x for x in st if (norm(x['club']) in c['al'] or norm(x['disp']) in c['al']) and x['a'] and x['a']<=1958 and (x['b'] or 0)>=1959]
        if not sp and ib:
            sp=[x for x in st if (norm(x['club']) in c['al'] or norm(x['disp']) in c['al']) and x['a']==1958 and x['b']==1958]
            if sp: sp[0]['dudoso']='tramo 1958'
            sp2=[x for x in st if (norm(x['club']) in c['al'] or norm(x['disp']) in c['al']) and x['a']==1959 and x['b'] and x['b']>=1959 and re.search(r'1958',x['y'])]
            sp=sp or sp2
        mode='ficha'
        if not st:
            bl=prose.bullets(s,c['al'])
            if bl is not None:
                if not bl: continue
                h=[('lista',bl[0][2][:60],bl[0][2])]; g58=None
            else:
                h,g58=prose.find(s,c['al'],ALLAL,ALLS)
                if not h: continue
                multi=[x for x in h if len(prose.clubs_in_all(x[2],ALLAL))>1]
                if len(multi)==len(h) and not any(x[1]=='1958/59' for x in h): h=[(x[0],x[1],x[2],'varios') for x in h]
            mode='texto'; sp=[dict(y=h[0][1],a=None,b=None,g=None,gl=None,club=c['art'],g58=g58,ev=h[0][2],varios=len(h[0])>3)]
        if not sp: continue
        cb,ct,cl=caps(ib)
        name=(ib.get('kurzname','').strip() if ib else '') or re.sub(r'\s*\(.*\)$','',t)
        name=re.sub(r'<.*?>|\[\[|\]\]','',name).strip() or re.sub(r'\s*\(.*\)$','',t)
        res.append(dict(club=c['club'],div=c['div'],titulo=t,nombre=name,nac=nac,by=by,pos=pos,posok=posok,pais=nation(s),sp=sp[0],modo=mode,capsb=cb,capst=ct,est=st,dudoso=sp[0].get('dudoso','')))
json.dump(res,open('squads.json','w'),ensure_ascii=False,indent=0)
cnt=collections.Counter(r['club'] for r in res)
dup=collections.Counter(r['titulo'] for r in res)
print(len(res),'dups',sum(1 for v in dup.values() if v>1))
for c in C:
    if c['div']!='extra': print(c['club'],cnt[c['club']],end=' | ')
# resolve duplicates
by=collections.defaultdict(list)
for r in res: by[r['titulo']].append(r)
def score(r):
    sp=r['sp']; s=0
    if r['modo']=='ficha': s+=10+(1 if sp.get('g') else 0)-(3 if r['dudoso'] else 0)
    else:
        if sp['y']=='1958/59' or (sp.get('ev') or '').find('1958/59')>=0: s+=6
        if sp.get('ev','').startswith('*') or 'lista' in str(sp.get('y')): s+=8
        if sp.get('varios'): s-=5
    return s
final=[]
for t,v in by.items():
    v.sort(key=score,reverse=True)
    if len(v)>1 and score(v[0])==score(v[1]):
        if score(v[0])<=1: continue   # ambiguous multi-club summary: drop
        v[0]['dudoso']=(v[0]['dudoso']+'; ' if v[0]['dudoso'] else '')+'también podría ser de '+', '.join(x['club'] for x in v[1:])
    if score(v[0])<0: continue
    final.append(v[0])
json.dump(final,open('squads.json','w'),ensure_ascii=False,indent=0)
cnt=collections.Counter(r['club'] for r in final)
print('\nfinal',len(final)); print(sorted(cnt.items(),key=lambda x:x[1]))
