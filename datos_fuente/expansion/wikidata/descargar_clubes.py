import urllib.request,urllib.parse,csv,io,sys,time,os,json
UA='SimuladorFutbolHistorico/0.1 (personal project)'
last=[time.time()-40]
def sparql(q, tries=5):
    for i in range(tries):
        w=63-(time.time()-last[0])
        if w>0: time.sleep(w)
        last[0]=time.time()
        try:
            r=urllib.request.Request('https://query.wikidata.org/sparql',data=urllib.parse.urlencode({'query':q}).encode(),headers={'User-Agent':UA,'Accept':'text/csv'})
            return list(csv.DictReader(io.StringIO(urllib.request.urlopen(r,timeout=170).read().decode())))
        except Exception as e:
            print('retry',e,flush=True)
    return None
def guarda(f, rows):
    print(f,len(rows) if rows is not None else 'FALLO',flush=True)
    if rows:
        w=csv.DictWriter(open(f,'w',newline=''),fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)
CLUBS=[('Sampdoria','Italia','Q1457'),('Wimbledon','Inglaterra','Q19482'),('Múnich 1860','Alemania','Q131603'),('Brest','Francia','Q218372'),('Caen','Francia','Q193377'),
 ('Laval','Francia','Q760736'),('Paris FC','Francia','Q1051013'),('Gerona','España','Q11945'),('Ulm 1846','Alemania','Q701290'),('Ulm 1846','Alemania','Q14551982'),
 ('Platense','Argentina','Q151907'),('Chacarita Juniors','Argentina','Q853053'),('All Boys','Argentina','Q646088'),('Temperley','Argentina','Q2778591'),
 ('Atlético de Rafaela','Argentina','Q59839'),('Sarmiento','Argentina','Q519966'),('Central Córdoba de Santiago','Argentina','Q5060684'),
 ('San Martín de Tucumán','Argentina','Q1022938'),('Patronato','Argentina','Q1773830'),('Estudiantes de Buenos Aires','Argentina','Q2333719'),
 ('Gimnasia y Tiro','Argentina','Q2759870'),('Colorado','Brasil','Q5148806')]
json.dump(CLUBS,open('clubs.json','w'))
qs=[c[2] for c in CLUBS]; N=6
for i in range(0,len(qs),N):
    v=' '.join('wd:'+q for q in qs[i:i+N])
    f='pasos%02d.csv'%(i//N)
    if not os.path.exists(f):
        guarda(f, sparql('''SELECT ?p ?pLabel ?b ?c ?s ?e ?m ?g WHERE { VALUES ?c { %s } ?p p:P54 ?st. ?st ps:P54 ?c. ?p wdt:P569 ?b; wdt:P21 wd:Q6581097. FILTER(YEAR(?b)>=1915)
 OPTIONAL{?st pq:P580 ?s} OPTIONAL{?st pq:P582 ?e} OPTIONAL{?st pq:P1350 ?m} OPTIONAL{?st pq:P1351 ?g}
 SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en,pt,it,fr,de". } }'''%v))
    f='info%02d.csv'%(i//N)
    if not os.path.exists(f):
        guarda(f, sparql('''SELECT ?p ?sl ?nac ?pos WHERE { VALUES ?c { %s } ?p wdt:P54 ?c; wdt:P21 wd:Q6581097; wikibase:sitelinks ?sl.
 OPTIONAL{?p wdt:P27 ?n. ?n rdfs:label ?nac FILTER(LANG(?nac)="es")} OPTIONAL{?p wdt:P413 ?po. ?po rdfs:label ?pos FILTER(LANG(?pos)="es")} }'''%v))
print('FIN',flush=True)
# Otros clubes de los jugadores que no teníamos
import glob
ya={r['wikidata'] for r in csv.DictReader(open('/home/user/universo-del-futbol/datos_fuente/expansion/wikidata/jugadores_wikidata.csv',encoding='utf-8-sig'))}
nuevos=sorted({r['p'].rsplit('/',1)[1] for f in glob.glob('pasos[0-9][0-9].csv') for r in csv.DictReader(open(f)) if r['s']} - ya)
print('nuevos',len(nuevos),flush=True)
M=350
for i in range(0,len(nuevos),M):
    f='otros%02d.csv'%(i//M)
    if os.path.exists(f): continue
    v=' '.join('wd:'+q for q in nuevos[i:i+M])
    guarda(f, sparql('''SELECT ?p ?c ?s ?e ?m ?g WHERE { VALUES ?p { %s } ?p p:P54 ?st. ?st ps:P54 ?c. OPTIONAL{?st pq:P580 ?s} OPTIONAL{?st pq:P582 ?e} OPTIONAL{?st pq:P1350 ?m} OPTIONAL{?st pq:P1351 ?g} }'''%v))
print('FIN2',flush=True)
for nom,q in (('br','Q155'),('pt','Q45')):
    guarda('labels_%s.csv'%nom, sparql('''SELECT ?p ?l WHERE { ?p wdt:P27 wd:%s; wdt:P106 wd:Q937857; rdfs:label ?l. FILTER(LANG(?l)="pt") }'''%q, 2))
print('FIN3',flush=True)
