import json,sys,urllib.request,urllib.parse,time
D=sys.argv[1]; d=json.load(open(f'{D}/agg.json'))
ESP={t for y in d for t,v in d[y]['teams'].items() if v['cc']=='ESP'}
names={}
for y in d:
    for p in d[y]['players']:
        if p['tid'] in ESP: continue
        names[p['pid']]=(p['nombre'],p['nac'])
print(len(names))
try: res=json.load(open(f'{D}/wd.json'))
except: res={}
todo=[(k,v) for k,v in names.items() if k not in res]
B=120
for i in range(0,len(todo),B):
    ch=todo[i:i+B]
    vals=" ".join(f'("{n.replace(chr(34),"")}"@{lg} "{pid}" "{nac[:4]}")' for pid,(n,nac) in ch for lg in ('en','mul'))
    q=f"""SELECT ?pid ?p ?bd WHERE {{ VALUES (?l ?pid ?yr) {{ {vals} }} ?p rdfs:label ?l; wdt:P569 ?bd. FILTER(ABS(YEAR(?bd)-xsd:integer(?yr))<=1) ?p wdt:P106 wd:Q937857. }}"""
    url="https://query.wikidata.org/sparql"; body=urllib.parse.urlencode({'format':'json','query':q}).encode()
    for t in range(4):
        try:
            r=json.load(urllib.request.urlopen(urllib.request.Request(url,data=body,headers={'User-Agent':'futbol-sim-research/0.1','Content-Type':'application/x-www-form-urlencoded'}),timeout=120)); break
        except Exception as e: print('err',e); time.sleep(30)
    else: continue
    hit={}
    for b in r['results']['bindings']: hit.setdefault(b['pid']['value'],set()).add(b['p']['value'].split('/')[-1])
    for pid,_ in ch: res[pid]=sorted(hit.get(pid,[]))
    json.dump(res,open(f'{D}/wd.json','w'))
    print(i,len(hit),flush=True); time.sleep(5)
print(sum(1 for v in res.values() if v),len(res))
