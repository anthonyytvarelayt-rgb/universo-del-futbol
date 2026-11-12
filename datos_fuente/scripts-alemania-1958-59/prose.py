import re
def clean(s):
    body=s[s.find("'''"):]
    body=re.sub(r'<ref[^>]*/>|<ref.*?</ref>','',body,flags=re.S)
    body=re.sub(r'\{\{[^{}]*\}\}','',body)
    body=re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]',r'\1',body)
    body=re.sub(r"'''?","",body)
    cut=re.search(r'\n==\s*(Literatur|Weblinks|Einzelnachweise|Quellen)',body)
    return body[:cut.start()] if cut else body
def covers(par):
    """returns list of reasons the paragraph places the player in 1958-59"""
    r=[]
    if re.search(r'\b1958/59\b|\b1958/1959\b|\bSaison 1958\b|Runde 1958/59',par): r.append('1958/59')
    for m in re.finditer(r'(?:von |zwischen |ab |seit )?(19[2-5]\d)(?:/\d\d)?\s*(?:–|-|bis|und)\s*(?:zum\s+|in die\s+)?(?:Jahr\s+|Saison\s+)?(19[5-7]\d|[5-7]\d)(?:/\d\d)?\b',par):
        a=int(m.group(1)); b=int(m.group(2)); b=b if b>100 else 1900+b
        if a<=1958 and b>=1959: r.append(m.group(0))
    for m in re.finditer(r'\b(?:ab|seit|Ab|Seit)\s+(?:der\s+Saison\s+|dem\s+Jahr\s+|Sommer\s+)?(19[45]\d)(?:/(\d\d))?',par):
        a=int(m.group(1))
        if 1950<=a<=1958: r.append(m.group(0)+'(ab)')
    return r
def norm(s):
    s=s.lower()
    for a,b in [('ß','ss'),('ü','u'),('ö','o'),('ä','a'),('é','e')]: s=s.replace(a,b)
    return re.sub(r'[^a-z0-9]','',s)
def find(s,al,others=(),shorts=None):
    b=clean(s); hits=[]; g=None
    def clubs_in(x):
        n=norm(x); return {i for i,o in enumerate(others) if any(a in n for a in o)}
    me={i for i,o in enumerate(others) if o==al}
    allc=clubs_in(b)
    for sec in re.split(r'\n(?===)',b):
        lines=sec.split('\n',1); head=lines[0] if lines[0].startswith('==') else ''
        if head:
            cv=covers(head)
            m=re.search(r'bis\s+(19\d\d)',head); ys=[int(y) for y in re.findall(r'19\d\d',sec)]
            if not cv and m and int(m.group(1))>=1959 and not re.search(r'19\d\d\s*(–|-|bis)',head) and ys and min(ys)<=1958: cv=['hasta '+m.group(1)]
            if cv:
                if any(a in norm(head) for a in al): hits.append(('título',cv[0],head.strip('= ')))
                elif others:
                    n=norm(sec); cnt={i:sum(n.count(a) for a in o) for i,o in enumerate(shorts or others)}
                    top=max(cnt.values()) if cnt else 0
                    if me and top>=2 and all(cnt[i]==top for i in me) and sum(1 for v in cnt.values() if v==top)==1: hits.append(('título+sección',cv[0],head.strip('= ')))
        sents=re.split(r'(?<=[a-zäöüß)\]])[.!?]\s+(?=[A-ZÄÖÜ])',sec)
        secc=clubs_in(sec)
        for i,se in enumerate(sents):
            here=any(a in norm(se) for a in al)
            near=any(any(a in norm(x) for a in al) for x in sents[max(0,i-2):i])
            cv=covers(se)
            ok=here or (near and '1958/59' in cv) or ('1958/59' in cv and (secc==me or (not secc and allc==me)))
            if cv and ok:
                hits.append(('frase',cv[0],se[:220]))
                if '1958/59' in cv and g is None:
                    m=re.search(r'1958/59[^.]{0,120}?(\d+)\s+(?:Liga|Oberliga|Runden|Punkt|Meisterschafts)?(?:spiel|partie|einsätz|begegnung)',se,re.I) or re.search(r'(\d+)\s+(?:Liga|Oberliga|Runden|Punkt|Meisterschafts)?(?:spiel|partie|einsätz)[^.]{0,80}1958/59',se,re.I)
                    if m and int(m.group(1))<=34: g=int(m.group(1))
    return hits,g
def bullets(s,al):
    """station lines like '* 1958–1962 1. FC Köln' or '* 1. FC Köln (1952–1961, ...)'; returns (found_any_list, covering)"""
    b=clean(s); lines=[l for l in b.split('\n') if l.startswith('*') and re.search(r'19\d\d',l)]
    st=[]
    for l in lines:
        m=re.search(r'(19\d\d)(?:/\d\d)?\s*(?:–|-|bis)\s*(19\d\d|\d\d)?',l)
        if not m: continue
        a=int(m.group(1)); bb=m.group(2); b2=(int(bb) if bb and len(bb)==4 else (1900+int(bb) if bb else a))
        st.append((a,b2,l))
    if len(st)<2: return None
    cov=[x for x in st if any(a in norm(x[2]) for a in al) and x[0]<=1958 and x[1]>=1959 and not re.search(r'jugend|amateur',x[2],re.I)]
    return cov

def clubs_in_all(x,others):
    n=norm(x); return {i for i,o in enumerate(others) if any(a in n for a in o)}
