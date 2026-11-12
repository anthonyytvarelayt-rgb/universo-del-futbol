from build import *
import csv,json
# nombres y valores ya usados en los CSV de Copa de Europa (mismo jugador = mismo nombre)
CE={}
for f in ('copa-europa-1958-59-plantillas.csv','copa-europa-1959-63-plantillas.csv'):
    for r in csv.DictReader(open('/mnt/project-files/datos/'+f)):
        if r.get('pais_club','')=='Italia' or r['club'] in ('Juventus','Milan'):
            CE.setdefault(r['nac'][:10],[]).append(r|{'archivo':f})
def ce_match(nac,name):
    for r in CE.get(nac,[]):
        if norm(r['nombre']).split()[-1][:4]==norm(name).split()[-1][:4] or norm(r['nombre'])[:5]==norm(name)[:5]: return r
    return None
MAN=json.load(open('manual.json')) if os.path.exists('manual.json') else {}
out=[];info=[]
for L,div in (('IT1','Serie A'),('IT2','Serie B')):
    for slug,cid in clubs(L,1958):
        rows=[r for r in season_rows(L,1958) if r['cid']==cid]
        seen=set()
        for r in rows:
            if r['pid'] in seen: continue
            seen.add(r['pid'])
            x=rate(r,1958,MAN.get(r['pid']) and tuple(MAN[r['pid']]))
            m=ce_match(x['nac'],x['nombre'])
            if m:
                if m['nombre']!=x['nombre']: x['notas'].append('nombre igual que en %s (Transfermarkt: %s)'%(m['archivo'],x['nombre'])); x['nombre']=m['nombre']
                if m['archivo'].startswith('copa-europa-1958-59') and m['club']==CN[cid]:
                    x['notas'].append('nivel y techo iguales que en la Copa de Europa 1958-59 (antes %d/%d)'%(x['nivel'],x['techo'])); x['nivel']=int(m['nivel']); x['techo']=int(m['techo'])
            x['club']=CN[cid]; x['division']=div
            out.append(x)
json.dump(out,open(OUT+'it1958.json','w'),ensure_ascii=False,indent=0)
with open('/mnt/project-files/datos/italia-1958-59-plantillas.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['division','club','nombre','pos','nac','pais','liga','nivel','techo'])
    for x in sorted(out,key=lambda x:(x['division'],x['club'],-x['nivel'])):
        w.writerow([x['division'],x['club'],x['nombre'],x['pos'],x['nac'],x['pais'],'%d / %d'%(x['pj'],x['g'] if x['pos']!='POR' else 0),x['nivel'],x['techo']])
print(len(out))
