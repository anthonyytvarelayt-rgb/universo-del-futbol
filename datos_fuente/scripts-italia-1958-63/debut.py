from build import *
import csv,json
exec(open('main1958.py').read().split('MAN=')[0].split('from build import *')[1])  # CE y ce_match
MAN=json.load(open('manual.json'))
# jugadores que ya existen en archivos de otros países (mismo nacimiento y apellido)
OTROS={}
for f,clubk in (('espana-1958-59-plantillas.csv','club'),('espana-debutantes-1959-63.csv','club'),('copa-europa-1958-59-plantillas.csv','club'),('copa-europa-1959-63-plantillas.csv','club')):
    for rr in csv.DictReader(open('/mnt/project-files/datos/'+f)):
        if rr.get('pais_club')=='Italia' or rr[clubk] in ('Juventus','Milan'): continue
        OTROS.setdefault(rr['nac'][:10],[]).append((f,rr[clubk],rr['nombre']))
NAMEFIX={'Víctor Benítes':'Morales Benítez'}
base=set(x['pid'] for x in json.load(open(OUT+'it1958.json')))
seen=set(base); out=[]
DIV={'IT1':'Serie A','IT2':'Serie B'}
for y in range(1959,1963):
    rows=[r for L in ('IT1','IT2') for r in season_rows(L,y) if r['apps']>0]
    byp=collections.defaultdict(list)
    for r in rows: byp[r['pid']].append(r)
    for pid,rs in byp.items():
        if pid in seen: continue
        seen.add(pid)
        r=max(rs,key=lambda x:(x['mins'],x['apps']))
        x=rate(r,y,MAN.get(pid) and tuple(MAN[pid]))
        prev=[h for h in H[pid] if h['y']<1958 and h['apps']>0]
        nats=DOB.get(pid,{}).get('nat') or r['nat']
        if prev: tipo='regresa'; x['notas'].append('jugó en Serie A/B por última vez en %d-%02d'%(max(h['y'] for h in prev),(max(h['y'] for h in prev)+1)%100))
        elif 'Italy' not in nats: tipo='extranjero'
        elif len(nats)>1 and x['age']>=21: tipo='extranjero'; x['notas'].append('oriundo: llega del extranjero con pasaporte italiano (cuenta como italiano)')
        else: tipo='cantera'
        if x['nombre']=='Luis Suárez': x['pais']='España'; tipo='extranjero'; x['notas']=[n for n in x['notas'] if not n.startswith('oriundo')]
        for f,cl,nm in OTROS.get(x['nac'],[]):
            if norm(nm).split()[-1][:4]==norm(x['nombre']).split()[-1][:4] or norm(nm)[:5]==norm(x['nombre'])[:5]:
                x['notas'].append('ya existe en %s (%s) como "%s": no crearlo de nuevo, es un traspaso'%(f,cl,nm))
                if nm!=x['nombre']: x['notas'].append('nombre de Transfermarkt: '+x['nombre']); x['nombre']=nm
                break
        if x['nombre'] in NAMEFIX: x['notas'].append('nombre igual que en copa-europa-1959-63-plantillas.csv (Transfermarkt: %s)'%x['nombre']); x['nombre']=NAMEFIX[x['nombre']]
        m=ce_match(x['nac'],x['nombre'])
        if m and m['nombre']!=x['nombre']:
            x['notas'].append('nombre igual que en %s (Transfermarkt: %s)'%(m['archivo'],x['nombre'])); x['nombre']=m['nombre']
        if len(rs)>1: x['notas'].append('también jugó con '+', '.join(CN[o['cid']] for o in rs if o is not r))
        x.update(club=CN[r['cid']],division=DIV[r['L']],debut=y,tipo=tipo)
        out.append(x)
json.dump(out,open(OUT+'itdeb.json','w'),ensure_ascii=False,indent=0)
with open('/mnt/project-files/datos/italia-debutantes-1959-63.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['division','club','nombre','pos','nac','pais','liga','nivel','techo','debut','tipo','nota'])
    for x in sorted(out,key=lambda x:(x['debut'],x['division'],x['club'],-x['nivel'])):
        w.writerow([x['division'],x['club'],x['nombre'],x['pos'],x['nac'],x['pais'],'%d / %d'%(x['pj'],x['g'] if x['pos']!='POR' else 0),x['nivel'],x['techo'],x['debut'],x['tipo'],'; '.join(x['notas'])])
c=collections.Counter((x['debut'],x['tipo']) for x in out); print(len(out),sorted(c.items()))
