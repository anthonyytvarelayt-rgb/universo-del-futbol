import json,sys,urllib.request,urllib.parse,time
D=sys.argv[1]; d=json.load(open(f'{D}/agg.json')); res=json.load(open(f'{D}/wd.json'))
names={p['pid']:(p['nombre'],p['nac']) for y in d for p in d[y]['players'] if p['pid'] in res and not res[p['pid']]}
todo=list(names.items()); print(len(todo),flush=True)
LG=('de','fr','it','pt','nl','hu','pl','cs','sk','sv','tr','ro','sr','sh','hr','da','no','fi','bg','el','es')
B=30
for i in range(0,len(todo),B):
    ch=todo[i:i+B]
    vals=" ".join(f'("{n.replace(chr(34),"")}"@{lg} "{pid}" "{nac[:4]}")' for pid,(n,nac) in ch for lg in LG)
    q=f"""SELECT ?pid ?p WHERE {{ VALUES (?l ?pid ?yr) {{ {vals} }} ?p rdfs:label ?l; wdt:P569 ?bd. FILTER(ABS(YEAR(?bd)-xsd:integer(?yr))<=1) ?p wdt:P106 wd:Q937857. }}"""
    body=urllib.parse.urlencode({'format':'json','query':q}).encode()
    for t in range(4):
        try: r=json.load(urllib.request.urlopen(urllib.request.Request("https://query.wikidata.org/sparql",data=body,headers={'User-Agent':'futbol-sim-research/0.1','Content-Type':'application/x-www-form-urlencoded'}),timeout=120)); break
        except Exception as e: print('err',e,flush=True); time.sleep(30)
    else: continue
    hit={}
    for b in r['results']['bindings']: hit.setdefault(b['pid']['value'],set()).add(b['p']['value'].split('/')[-1])
    for pid,v in hit.items(): res[pid]=sorted(v)
    json.dump(res,open(f'{D}/wd.json','w')); print(i,len(hit),flush=True); time.sleep(3)
