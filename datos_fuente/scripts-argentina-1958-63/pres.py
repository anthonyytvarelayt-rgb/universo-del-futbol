import re,glob,collections,math,json
def short(n):
  n=n.replace('Vélez Sársfield','Vélez Sarsfield')
  M={'Estudiantes (LP)':'Estudiantes de La Plata','Gimnasia y Esgrima (LP)':'Gimnasia y Esgrima La Plata','Central Córdoba (R)':'Central Córdoba','Argentinos':'Argentinos Juniors','Chacarita':'Chacarita Juniors','Sarmiento (J)':'Sarmiento de Junín','Sarmiento':'Sarmiento de Junín','Unión':'Unión de Santa Fe','Unión (SF)':'Unión de Santa Fe','Talleres (RE)':'Talleres de Remedios de Escalada','Talleres (RdE)':'Talleres de Remedios de Escalada','Newell’s Old Boys':"Newell's Old Boys"}
  return M.get(n,n)
seas=collections.Counter(); pod=collections.Counter(); rec=collections.defaultdict(float)
for y in range(1931,1958):
  f=f'wpold/p{y}.txt' if y<1953 else f'wp_p{y}.txt'
  t=open(f).read()
  rows=re.findall(r"Tabla de posiciones equipo\|[^\n]*?pos=\s*0?(\d+)[^\n]*?eq='*\[\[(?:[^|\]]*\|)?([^\]]*)\]\]",t)
  seen={}
  for p,n in rows:
    n=short(n.strip())
    if n not in seen: seen[n]=int(p)
  N=len(seen)
  for n,p in seen.items():
    seas[n]+=1
    if p in (2,3): pod[n]+=1
    if y>=1953: rec[n]+=(N+1-p)/N
# B recientes: 1953-57 puestos en B valen poco
for y in range(1953,1958):
  t=open(f'wp_b{y}.txt').read()
  rows=re.findall(r"Tabla de posiciones equipo\|[^\n]*?pos=\s*0?(\d+)[^\n]*?eq='*\[\[(?:[^|\]]*\|)?([^\]]*)\]\]",t)
  for p,n in rows[:18]:
    n=short(n.strip()); rec[n]+=0.25*(19-int(p))/18
PRO={'Boca Juniors':7,'River Plate':12,'Independiente':3,'Racing Club':3,'San Lorenzo':3}
AMA={'Racing Club':9,'Boca Juniors':6,'Huracán':4,'San Lorenzo':3,'Independiente':2,'River Plate':1,'Estudiantes de La Plata':1,'Gimnasia y Esgrima La Plata':1,'Quilmes':1,'Banfield':1}
ROS={'Rosario Central':9,"Newell's Old Boys":8,'Central Córdoba':4,'Unión de Santa Fe':4,'Colón':4}
clubs=[l.split('\t')[1] for l in open('clubs.tsv')]
S={}
for c in clubs:
  sc=3*PRO.get(c,0)+1.2*AMA.get(c,0)+0.45*ROS.get(c,0)+1.0*pod[c]+0.15*seas[c]+1.0*rec[c]
  S[c]=dict(score=round(sc,2),pro=PRO.get(c,0),amat=AMA.get(c,0),regional=ROS.get(c,0),podios=pod[c],temporadas_primera_1931_57=seas[c],recientes_1953_57=round(rec[c],2))
mx=max(v['score'] for v in S.values()); mn=min(v['score'] for v in S.values())
for c,v in S.items(): v['prestigio']=round(250+735*math.sqrt((v['score']-mn)/(mx-mn)))
for c,v in sorted(S.items(),key=lambda x:-x[1]['prestigio']): print(v['prestigio'],c,v)
json.dump(S,open('pres.json','w'),ensure_ascii=False,indent=0)
