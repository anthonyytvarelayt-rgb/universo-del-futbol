import csv,json,urllib.parse,unicodedata,re,os,time
from wikiraw import raw
Q=json.load(open('qmap.json'))
def norm(s):
    s=re.sub(r"\(.*?\)","",s); s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return " ".join(sorted(re.sub(r"[^a-z ]"," ",s.replace("-"," ")).split()))
sq=json.load(open('squads.json'))
have={}
for x in sq: have.setdefault(norm(x['name']),[]).append(x['bd'][-4:])
for f in os.listdir('wiki'):
    d=json.load(open('wiki/'+f))
    if d: have.setdefault(norm(d['title']),[]).append('')
by={}
for r in csv.DictReader(open('wd_deb.csv')):
    by.setdefault(r['p'],[]).append(r)
cand=[]
for p,rs in by.items():
    r0=min(rs,key=lambda r:r['s'])
    n=norm(r0['pLabel'])
    if n in have: continue
    cand.append(dict(q=p.split('/')[-1],name=r0['pLabel'],birth=r0['birth'][:10],nat=r0['natLabel'],pos=r0['posLabel'],art=urllib.parse.unquote(r0['art'].split('/wiki/')[-1]).replace('_',' ') if r0['art'] else '',club=Q[r0['club'].split('/')[-1]],start=int(r0['s'][:4]),end=int(r0['e'][:4]) if r0['e'] else None))
print(len(cand))
json.dump(cand,open('debcand.json','w'),ensure_ascii=False,indent=0)
for c in cand:
    f=f"wikideb/{c['q']}.json"
    if os.path.exists(f) or not c['art']: continue
    t=raw(c['art'])
    if t and re.match(r"#(REDIRECT|REDIRECTION)",t,re.I):
        m=re.search(r"\[\[([^\]|#]+)",t); t=raw(m.group(1)) if m else None
    json.dump(dict(title=c['art'],content=(t[:t.find('\n==')] if t and '\n==' in t else (t or '')[:20000])),open(f,'w'),ensure_ascii=False)
    time.sleep(0.3)
print("ok",len(os.listdir('wikideb')))
