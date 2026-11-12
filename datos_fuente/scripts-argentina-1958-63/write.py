import json,csv,re,os
OUT='/mnt/project-files/datos/'
P=json.load(open('final58.json')); DEB=json.load(open('final_deb.json')); PR=json.load(open('pres.json'))
FU='https://www.historical-lineups.com/wp-content/uploads/2019/11/{y}.pdf'
def concurrent(x): return [e for e in x.get('ext',[]) if e['f'].endswith('1958-59-plantillas.csv') or e['f'].endswith('1958-59-plantillas-detalle.csv')]
keep=[x for x in P if not concurrent(x)]; drop=[x for x in P if concurrent(x)]
keep.sort(key=lambda x:(x['club'],-x['nivel']))
cols=['division','club','nombre','pos','nac','pais','liga','nivel','techo']
with open(OUT+'argentina-1958-59-plantillas.csv','w',newline='',encoding='utf-8') as f:
  w=csv.writer(f); w.writerow(cols)
  for x in keep: w.writerow([x[c] for c in cols])
dcols=cols+['nombre_completo','nac_fuente','bdfa','bdfa_confianza','wikidata','procedencia_1957','otro_csv','excluido','fuente','nota']
with open(OUT+'argentina-1958-59-plantillas-detalle.csv','w',newline='',encoding='utf-8') as f:
  w=csv.writer(f); w.writerow(dcols)
  for x in keep+drop:
    exc='sí: ya está en '+'; '.join(e['f']+' ('+e['club']+')' for e in concurrent(x)) if x in drop else ''
    w.writerow([x[c] for c in cols]+[x['completo'],x['nac_fuente'],x['bdfa'],x['bdfa_conf'],x['wikidata'],x['procedencia'],x.get('otro_csv',''),exc,FU.format(y=1958),x['nota']])
# debutantes
dc=cols+['debut','tipo','temporada','procedencia','nombre_completo','nac_fuente','bdfa','wikidata','otro_csv','fuente','nota']
DEB.sort(key=lambda x:(x['debut'],x['club'],-x['nivel']))
with open(OUT+'argentina-debutantes-1959-63.csv','w',newline='',encoding='utf-8') as f:
  w=csv.writer(f); w.writerow(dc)
  for x in DEB:
    w.writerow([x[c] for c in cols]+[x['debut'],x['tipo'],x['temporada'],x['procedencia'],x['completo'],x['nac_fuente'],x['bdfa'],x['wikidata'],x.get('otro_csv',''),FU.format(y=x['debut']),x['nota'] or 'liga = partidos / goles de esa temporada en Primera'])
print(len(keep),len(drop),len(DEB))
for x in drop: print('fuera:',x['nombre'],x['club'],x['liga'])
