import re,json,sys
def clean(s):
    s=re.sub(r'<ref[^>]*/>|<ref.*?</ref>','',s,flags=re.S)
    s=re.sub(r'\{\{(?:flagicon|PRTb|[A-Z]{3}b|bandeira)[^}]*\}\}','',s)
    s=re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]',r'\1',s)
    s=re.sub(r"'''?","",s); s=re.sub(r'<[^>]+>',' ',s)
    return s.strip()
def infobox(t):
    m=re.search(r'\{\{\s*(Infobox football biography|Info/Futebolista|Infobox futebolista)',t,re.I)
    if not m: return None
    i=m.start(); d=0; j=i
    while j<len(t)-1:
        if t[j:j+2]=='{{': d+=1; j+=2; continue
        if t[j:j+2]=='}}':
            d-=1; j+=2
            if d==0: break
            continue
        j+=1
    body=t[i+2:j-2]
    # split top-level |
    parts=[];d=0;cur='';k=0
    while k<len(body):
        c=body[k:k+2]
        if c in('{{','[['): d+=1;cur+=c;k+=2;continue
        if c in('}}',']]'): d-=1;cur+=c;k+=2;continue
        if body[k]=='|' and d==0: parts.append(cur);cur='';k+=1;continue
        cur+=body[k];k+=1
    parts.append(cur)
    f={}
    for p in parts[1:]:
        if '=' in p:
            a,b=p.split('=',1); f[a.strip().lower()]=b.strip()
    return f
def yrs(s):
    s=clean(s); m=re.findall(r'(1[89]\d\d|20\d\d)',s)
    if not m: return None
    a=int(m[0]); b=int(m[1]) if len(m)>1 else (9999 if re.search(r'[–-]\s*$',s) else a)
    return a,b
def num(s):
    s=re.sub(r'\{\{0\|[^}]*\}\}','',s); m=re.search(r'\d+',clean(s)); return int(m.group()) if m else None
def birth(f,lang):
    s=f.get('birth_date') or f.get('nascimento_data') or f.get('data_nascimento') or ''
    m=re.search(r'(1[89]\d\d)\|(\d{1,2})\|(\d{1,2})',s)
    if m and lang=='en': return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    m2=re.search(r'(\d{1,2})\|(\d{1,2})\|(1[89]\d\d)',s)
    if m2: return f"{m2.group(3)}-{int(m2.group(2)):02d}-{int(m2.group(1)):02d}"
    if m: return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    m=re.search(r'(1[89]\d\d)',s); return m.group(1) if m else ''
def stints(f,lang):
    out=[]
    if lang=='en':
        for n in range(1,30):
            if f'years{n}' in f or f'clubs{n}' in f:
                y=yrs(f.get(f'years{n}','')); c=clean(f.get(f'clubs{n}',''))
                if y: out.append(dict(a=y[0],b=y[1],club=c,raw=f.get(f'clubs{n}',''),pj=num(f.get(f'caps{n}','')),g=num(f.get(f'goals{n}',''))))
        nat=[]
        for n in range(1,10):
            for sep in ('_',''):
                if f'national{sep}team{n}' in f:
                    t=clean(f[f'national{sep}team{n}'])
                    if re.search(r'U-?\d|under|olymp|B\b|amateur|military',t,re.I): continue
                    y=yrs(f.get(f'national{sep}years{n}',''))
                    nat.append(dict(team=t,y=y,caps=num(f.get(f'national{sep}caps{n}',''))))
    else:
        anos=re.split(r'<br\s*/?>',f.get('ano','') or f.get('anos',''))
        clubes=re.split(r'<br\s*/?>',f.get('clubes',''))
        jg=re.split(r'<br\s*/?>',f.get('jogos(golos)',''))
        for i,a in enumerate(anos):
            y=yrs(a)
            if not y or i>=len(clubes): continue
            pj=g=None
            if i<len(jg):
                s=re.sub(r'\{\{0\|[^}]*\}\}','',jg[i]); m=re.findall(r'\d+',clean(s))
                if m: pj=int(m[0]); g=int(m[1]) if len(m)>1 else None
            out.append(dict(a=y[0],b=y[1],club=clean(clubes[i]),raw=clubes[i],pj=pj,g=g))
        nat=[]
        sel=re.split(r'<br\s*/?>',f.get('selecaonacional',''))
        ys=re.split(r'<br\s*/?>',f.get('anoselecao',''))
        ps=re.split(r'<br\s*/?>',f.get('partidasselecao',''))
        for i,t in enumerate(sel):
            t=clean(t)
            if not t or re.search(r'sub-?\d|olímp|B\b|militar|esperan',t,re.I): continue
            y=yrs(ys[i]) if i<len(ys) else None
            c=num(ps[i]) if i<len(ps) else None
            nat.append(dict(team=t,y=y,caps=c))
    return out,nat
POSMAP=[(r'goal|guarda|keeper|goleiro',"POR"),(r'defen|back|zagueiro|lateral|defesa|libero|half-back|centre-half|stopper',"DEF"),(r'midf|médio|medio|meio|half|winger|ala|extremo|inside',"MED"),(r'forw|strik|avan|atacante|ponta|centre-forward|ataque',"DEL")]
def pos(f):
    s=clean(f.get('position','') or f.get('posição','') or f.get('posicao',''))
    s=s.lower()
    for r,p in POSMAP:
        if re.search(r,s): 
            if p=="MED" and re.search(r'winger|extremo|ponta|ala',s): return "DEL"
            return p
    return ""
def parse(title,t,lang):
    f=infobox(t)
    if not f: return None
    st,nat=stints(f,lang)
    short=re.sub(r'\s*\(.*\)$','',title)
    return dict(title=title,lang=lang,name=short,full=clean(f.get('full_name','') or f.get('nomecompleto','')),birth=birth(f,lang),pos=pos(f),stints=st,nat=nat,lead=clean(t[t.find("'''"):t.find("'''")+600]) if "'''" in t else '')
