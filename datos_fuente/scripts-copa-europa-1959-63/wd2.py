import json,sys,urllib.request,urllib.parse,time
D=sys.argv[1]; res=json.load(open(f'{D}/wd.json'))
q_ids=sorted({q for v in res.values() if len(v)==1 for q in v})
try: out=json.load(open(f'{D}/wd2.json'))
except: out={}
todo=[q for q in q_ids if q not in out]
print(len(q_ids),len(todo))
B=80
for i in range(0,len(todo),B):
    ch=todo[i:i+B]
    vals=" ".join("wd:"+q for q in ch)
    q=f"""SELECT ?p ?team ?tl ?nat ?s ?e ?m WHERE {{ VALUES ?p {{ {vals} }} ?p p:P54 ?st. ?st ps:P54 ?team.
 OPTIONAL{{?st pq:P580 ?s}} OPTIONAL{{?st pq:P582 ?e}} OPTIONAL{{?st pq:P1350 ?m}}
 OPTIONAL{{?team rdfs:label ?tl FILTER(LANG(?tl)='en')}}
 BIND(EXISTS{{?team wdt:P31/wdt:P279* wd:Q6979593}} AS ?nat) }}"""
    url="https://query.wikidata.org/sparql"; body=urllib.parse.urlencode({'format':'json','query':q}).encode()
    for t in range(4):
        try:
            r=json.load(urllib.request.urlopen(urllib.request.Request(url,data=body,headers={'User-Agent':'futbol-sim-research/0.1','Content-Type':'application/x-www-form-urlencoded'}),timeout=120)); break
        except Exception as e: print('err',e,flush=True); time.sleep(30)
    else: continue
    for qq in ch: out.setdefault(qq,[])
    for b in r['results']['bindings']:
        g=lambda k:b[k]['value'] if k in b else None
        out[g('p').split('/')[-1]].append(dict(team=g('team').split('/')[-1],tl=g('tl'),nat=g('nat')=='true',s=(g('s') or '')[:4],e=(g('e') or '')[:4],m=g('m')))
    json.dump(out,open(f'{D}/wd2.json','w'))
    print(i,len(r['results']['bindings']),flush=True); time.sleep(5)
