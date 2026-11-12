import re
def strip_tpl(s):
    # quita enlaces [[a|b]] -> b ; plantillas de bandera {{XXX-d}} etc.
    s=re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]",r"\1",s)
    s=re.sub(r"<[^>]+>","",s)
    return s
def find_tpl(c,key):
    m=re.search(r"\|\s*"+key+r"\s*=\s*\{\{\s*(?:trois colonnes|3 colonnes|parcours)",c,re.I)
    if not m: return None
    i=c.find("{{",m.start()); depth=0; j=i
    while j<len(c):
        if c.startswith("{{",j): depth+=1; j+=2; continue
        if c.startswith("}}",j):
            depth-=1; j+=2
            if depth==0: break
            continue
        j+=1
    return c[i+2:j-2]
def split_top(s):
    parts=[];depth=0;cur=""
    i=0
    while i<len(s):
        if s.startswith("{{",i) or s.startswith("[[",i): depth+=1;cur+=s[i:i+2];i+=2;continue
        if s.startswith("}}",i) or s.startswith("]]",i): depth-=1;cur+=s[i:i+2];i+=2;continue
        if s[i]=="|" and depth==0: parts.append(cur);cur="";i+=1;continue
        cur+=s[i];i+=1
    parts.append(cur);return parts
def years(s):
    s=strip_tpl(s)
    s=re.sub(r"\{\{0\|?[^}]*\}\}","",s)
    ys=[int(y) for y in re.findall(r"(1[89]\d\d|20\d\d)",s)]
    if not ys: return None
    return (ys[0],ys[-1] if len(ys)>1 else ys[0])
def num(s):
    s=re.sub(r"\{\{0\|?[^}]*\}\}","",s); s=strip_tpl(s)
    m=re.search(r"(\d+)\s*\(\s*(\d+)\s*\)",s)
    if m: return int(m.group(1)),int(m.group(2))
    m=re.search(r"(\d+)",s)
    return (int(m.group(1)),None) if m else (None,None)
def club(s):
    s=re.sub(r"\{\{Tri\|[^}]*\}\}","",s)
    s=re.sub(r"\{\{nobr\|(.*)\}\}",r"\1",s)
    s=re.sub(r"\{\{[A-Z]{3}[^}]*-d\}\}|\{\{[A-Z]{3}-d[^}]*\}\}","",s)
    s=re.sub(r"\{\{Abréviation\|([^|}]*)\|[^}]*\}\}",r"\1",s)
    s=re.sub(r"\{\{(\w+) football\}\}",r"\1",s)
    s=strip_tpl(s); s=re.sub(r"[{}]","",s)
    return re.sub(r"\s+"," ",s).strip()
def rows(c,key):
    t=find_tpl(c,key)
    if not t: return []
    p=split_top(t)[1:]
    out=[]
    for i in range(0,len(p)-2,3):
        y=years(p[i]); 
        if not y: continue
        m,g=num(p[i+2])
        out.append(dict(y1=y[0],y2=y[1],club=club(p[i+1]),m=m,g=g))
    return out
def parse(c):
    return dict(car=rows(c,"parcours senior") or rows(c,"parcours pro") or rows(c,"parcours"),sel=rows(c,"sélection nationale"),
                sel_raw=bool(re.search(r"sélection nationale\s*=",c)))
