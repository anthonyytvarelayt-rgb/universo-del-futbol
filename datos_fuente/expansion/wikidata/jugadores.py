import urllib.request,urllib.parse,csv,io,time,sys,os
UA='SimuladorFutbolHistorico/0.1 (personal project)'
def sparql(q):
    for i in range(12):
        try:
            r=urllib.request.Request('https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':q}),headers={'User-Agent':UA,'Accept':'text/csv'})
            return list(csv.DictReader(io.StringIO(urllib.request.urlopen(r,timeout=180).read().decode())))
        except Exception as e:
            print('retry',e,file=sys.stderr,flush=True); time.sleep(70)
    return None
Q='''SELECT ?p ?pLabel ?b ?c ?s ?e ?m ?g WHERE {
 VALUES ?c { %s }
 ?p p:P54 ?st. ?st ps:P54 ?c. ?p wdt:P569 ?b. FILTER(YEAR(?b)>=1915)
 OPTIONAL{?st pq:P580 ?s} OPTIONAL{?st pq:P582 ?e} OPTIONAL{?st pq:P1350 ?m} OPTIONAL{?st pq:P1351 ?g}
 SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en,pt,it,fr,de". } }'''
qs=sorted({r['q'] for r in csv.DictReader(open('clubes_q.csv')) if r['q']})
N=6
for i in range(0,len(qs),N):
    f=f'jug/lote{i//N:03d}.csv'
    if os.path.exists(f): continue
    rows=sparql(Q%' '.join('wd:'+q for q in qs[i:i+N]))
    if rows:
        with open(f,'w',newline='') as o:
            w=csv.DictWriter(o,fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)
    print(f,len(rows) if rows is not None else 'FALLO',flush=True); time.sleep(62)
print('FIN')
