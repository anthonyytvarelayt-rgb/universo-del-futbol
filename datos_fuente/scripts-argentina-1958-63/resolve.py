import json,re,collections
from bdfa import norm
from lineups import clubkey
d=json.load(open('squads_pos.json')); B=json.load(open('bd_fichas.json'))
occ=collections.defaultdict(list)
for y in d:
  for c in d[y]:
    for r in c['rows']: occ[r['name']].append((int(y),c['key']))
def covers(tray,club,years):
  # buscar tramos "AAAA-AAAA / AAAA Club"
  T=norm(tray); k=norm(club)
  ok=0
  for m in re.finditer(r'((?:\d{4}(?:-\d{4})?(?: / )?)+)\s+([^\d]+?)\s\d',T):
    if k.split()[0] in m.group(2):
      for a in re.findall(r'\d{4}(?:-\d{4})?',m.group(1)):
        lo,_,hi=a.partition('-'); hi=hi or lo
        if any(int(lo)<=y<=int(hi) for y in years): ok=2
        elif any(abs(int(lo)-y)<=1 or abs(int(hi)-y)<=1 for y in years): ok=max(ok,1)
  if ok==0 and k.split()[0] in T: ok=0.5
  return ok
CK={'Argentinos':'ARGENTINOS','Atlanta':'ATLANTA','Boca':'BOCA','Central Córdoba':'CENTRAL CORDOBA','Estudiantes':'ESTUDIANTES','Ferro':'FERRO','Gimnasia':'GIMNASIA','Huracán':'HURACAN','Independiente':'INDEPENDIENTE','Lanús':'LANUS','Newell':'NEWELL','Racing':'RACING','River':'RIVER','Rosario Central':'ROSARIO CENTRAL','San Lorenzo':'SAN LORENZO','Tigre':'TIGRE','Vélez':'VELEZ','Chacarita':'CHACARITA','Los Andes':'LOS ANDES','Quilmes':'QUILMES','Banfield':'BANFIELD'}
res={}
st=collections.Counter()
for n,oc in occ.items():
  cands=B['pick'].get(n) or B['pick'].get(re.sub(r'([a-záéíóúñü]) ([A-ZÁÉÍÓÚÑ])',r'\1\2',n),[])
  best=None
  for s,slug,i in cands:
    f=B['fichas'].get(i)
    if not f: continue
    sc=max(covers(f['tray'],CK[c],[y]) for y,c in oc)
    tot=sc*10+s
    if sc>0 and (best is None or tot>best[0]): best=(tot,i,f,sc)
  if best: res[n]=dict(id=best[1],conf='alta' if best[3]==2 else ('media' if best[3]==1 else 'baja'),**{k:best[2].get(k) for k in ('nac','nac_pais','lugar','pos','tray','slug')}); st[res[n]['conf']]+=1
  else: st['sin']+=1
print(st)
json.dump(res,open('bd_resolved.json','w'),ensure_ascii=False,indent=0)
n58=[r['name'] for c in d['1958'] for r in c['rows']]
print('1958:',sum(1 for n in n58 if n in res),len(n58))
print([n for n in n58 if n not in res][:40])
