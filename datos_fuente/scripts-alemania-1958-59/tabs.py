import re,glob,json
def parse(f):
    t=re.sub(r"<[^>]*>","\n",open(f).read()); t=t.replace("&nbsp;"," ")
    import html; t=html.unescape(t)
    L=[x.strip() for x in t.split("\n") if x.strip()]
    rows=[]
    for i,x in enumerate(L):
        m=re.fullmatch(r"(\d+)\.",x)
        if m and i+2<len(L) and re.fullmatch(r"\d+",L[i+2]) and not re.fullmatch(r"\d+",L[i+1]):
            nm=re.sub(r"\s*\((M|N|P|M, P|P, M)\)\s*$","",L[i+1]).strip()
            rows.append((int(m.group(1)),nm))
    m=re.search(r"Aufsteiger:\s*([^\n]*)",t)
    return rows,(m.group(1) if m else "")
out={}
for f in sorted(glob.glob('tab/*.html')):
    k=f[4:-5]; r,a=parse(f); out[k]=dict(rows=r,auf=a)
json.dump(out,open('tabs.json','w'),ensure_ascii=False,indent=0)
for k in sorted(out): print(k,len(out[k]['rows']),out[k]['rows'][:2])
