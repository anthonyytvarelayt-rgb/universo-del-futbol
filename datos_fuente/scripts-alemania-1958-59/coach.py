import json,re,sys,csv
sys.path.insert(0,'s'); import prose
exec(open('s/parse.py').read().split('res=[]')[0].replace("T=json.load(open('txt.json'))","T=json.load(open('tr/txt.json'))").replace("MEM=json.load(open('mem.json'))","MEM=json.load(open('tr/mem.json'))"))
ALLAL=[c['al'] for c in C if c['div']!='extra']
out=[]
for c in C:
    if c['div']=='extra': continue
    tits=set(t for n in c['cats'] for t in MEM.get(n,[]))
    for t in sorted(tits):
        s=T.get(t,''); ib=sections(s)
        st=stations(ib.get('trainer_tabelle','')) if ib else []
        hit=None
        for x in st:
            if (norm(x['club']) in c['al'] or norm(x['disp']) in c['al']) and x['a'] and x['a']<=1958 and (x['b'] or 0)>=1959: hit=('ficha',x['y'])
            elif (norm(x['club']) in c['al'] or norm(x['disp']) in c['al']) and x['a'] and (x['a']==1958 or x['a']==1959 and x['b']==1959 and re.search('1958',x['y'])): hit=hit or ('ficha (tramo corto)',x['y'])
        if not hit and not st:
            h,_=prose.find(s,c['al'],ALLAL)
            h=[x for x in h if re.search(r'Trainer|trainiert|Übungsleiter',x[2]) and any(a in norm(x[2]) for a in c['al'])]
            if h: hit=('texto',h[0][1])
        if hit:
            nac=nation(s); out.append([c['club'],re.sub(r'\s*\(.*\)$','',t),nac,hit[0],hit[1],t])
for o in out: print(o)
json.dump(out,open('tr/hits.json','w'),ensure_ascii=False)
