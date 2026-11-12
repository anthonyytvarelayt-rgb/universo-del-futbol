import json,re,datetime,collections,csv,math
D=json.load(open('squads_pos.json')); R=json.load(open('bd_resolved.json')); PR=json.load(open('pres.json'))
KEY2={'Argentinos':'Argentinos Juniors','Atlanta':'Atlanta','Boca':'Boca Juniors','Central Córdoba':'Central Córdoba','Estudiantes':'Estudiantes de La Plata','Ferro':'Ferro Carril Oeste','Gimnasia':'Gimnasia y Esgrima La Plata','Huracán':'Huracán','Independiente':'Independiente','Lanús':'Lanús','Newell':"Newell's Old Boys",'Racing':'Racing Club','River':'River Plate','Rosario Central':'Rosario Central','San Lorenzo':'San Lorenzo','Tigre':'Tigre','Vélez':'Vélez Sarsfield','Chacarita':'Chacarita Juniors','Los Andes':'Los Andes','Quilmes':'Quilmes','Banfield':'Banfield'}
def pres(c): return PR.get(c,{}).get('prestigio',450)
PAIS={'Argentina':'Argentina','Uruguay':'Uruguay','Paraguay':'Paraguay','Brasil':'Brasil','Chile':'Chile','Peru':'Perú','Perú':'Perú','Bolivia':'Bolivia','Italia':'Italia','España':'España','Hungria':'Hungría','Colombia':'Colombia'}
SLOTPOS={0:'POR',1:'DEF',2:'DEF',3:'DEF',4:'MED',5:'DEF',6:'DEL',7:'MED',8:'DEL',9:'MED',10:'DEL'}
BPOS={'Arquero':'POR','Defensor':'DEF','Volante':'MED','Delantero':'DEL'}
def title(s): return ' '.join(w.capitalize() if not w.startswith("D'") else "D'"+w[2:].capitalize() for w in s.lower().split())
def display(r):
  if r.get('disp'):
    full=[k for k in r['disp'] if len(k.split())>=2 and '.' not in k]
    if full and ',' in r['name']: return max(full,key=lambda k:r['disp'][k])
  sur,_,first=r['name'].partition(',')
  if not first: return title(r['name'].split()[0])
  return first.strip().split()[0]+' '+title(sur.strip())
def pos(r,bd):
  c=collections.Counter()
  for k,v in r.get('slots',{}).items():
    p=SLOTPOS[int(k)]
    c[p]+=v
  if c: return c.most_common(1)[0][0]
  return BPOS.get((bd or {}).get('pos'),'MED')
def birth(bd):
  s=(bd or {}).get('nac') or ''
  m=re.match(r'(\d+)/(\d+)/(\d{4})',s)
  if m:
    d,mo,y=map(int,m.groups())
    if y<1910: return None
    try: return datetime.date(y,mo,d)
    except: return None
  return None
def caps(bd,ref):
  t=(bd or {}).get('tray','')
  k=t.find('Selecciones Nacionales')
  if k<0: return 0,0
  seg=t[k+22:]
  tot=bef=0
  b=birth(bd)
  for m in re.finditer(r'(?:(\d{4})(?:-(\d{4}))?\s+)?([A-Z][^\d(]*?)\s(?:\([^)]*\)\s)?(\d+)\s\d+\s[\d,\.]+',seg):
    if 'Sub' in m.group(3) or 'Olímp' in m.group(3) or 'Juvenil' in m.group(3): continue
    n=int(m.group(4)); tot+=n
    if m.group(1): lo=int(m.group(1)); hi=int(m.group(2) or lo)
    elif b: lo=b.year+21; hi=b.year+31
    else: lo,hi=1950,1962
    yrs=hi-lo+1; bb=max(0,min(hi,ref-1)-lo+1); bef+=n*bb/yrs
  return round(bef),tot
# temporadas futuras en Primera (anuarios AFA 1959-63) por nombre
FUT=collections.defaultdict(list)
for y in D:
  for c in D[y]:
    for r in c['rows']:
      if r['pj']>=15: FUT[r['name']].append((int(y),KEY2.get(c['key'],c['key'])))
def foreign(bd,lo,hi):
  t=(bd or {}).get('tray',''); out=[]
  i=t.find('Ligas Extranjeras')
  if i<0: return out
  seg=t[i:]; j=min([seg.find(x) for x in ['Copa Libertadores','Selecciones'] if seg.find(x)>0] or [len(seg)]); seg=seg[:j]
  for m in re.finditer(r'(\d{4})(?:-(\d{4}))?\s+(.+?)\s(\d+)\s\d+\s[\d,\.]+',seg):
    a=int(m.group(1)); b=int(m.group(2) or a); pj=int(m.group(4)); yrs=b-a+1
    if pj/yrs>=15:
      for y in range(a,b+1):
        if lo<=y<=hi: out.append(y)
  return out
def techo(r,bd,lvl,age,y0):
  sc=[]
  for y,c in FUT.get(r['name'],[]):
    if y>y0: sc.append(280+0.55*pres(c))
  fy=set(foreign(bd,y0+1,y0+13))-set(y for y,_ in FUT.get(r['name'],[]))
  sc+= [280+0.55*720]*len(fy)
  # Primera argentina 1964-71 según BDFA (tramos con >=15 PJ por año)
  t=(bd or {}).get('tray','')
  seg=t[:t.find('Ligas Extranjeras')] if 'Ligas Extranjeras' in t else t
  seg=seg[:seg.find('Segunda División')] if 'Segunda División' in seg else seg
  for m in re.finditer(r'(\d{4})(?:-(\d{4}))?\s+([A-Z][^\d]+?)\s\((?:[^)]*)\)\s(\d+)\s\d+',seg):
    a=int(m.group(1)); b=int(m.group(2) or a); pj=int(m.group(4))
    if pj/(b-a+1)>=15:
      for yy in range(max(a,1964),min(b,y0+13)+1): sc.append(280+0.55*pres(m.group(3).strip()))
  sc.sort(reverse=True)
  _,capst=caps(bd,2100)
  F=(sum(sc[:3])/3 if len(sc)>=3 else (sum(sc)/len(sc) if sc else 0))+1.5*min(capst,60)
  if len(sc)<3: F-=40*(3-len(sc))
  if age is None: gc,mn=50,8
  elif age<22: gc,mn=500,30
  elif age<25: gc,mn=150,15
  elif age<28: gc,mn=50,8
  elif age<30: gc,mn=15,3
  else: gc,mn=5,0
  return int(round(min(lvl+max(mn,min(gc,F-lvl)),1000)))
AJ=50
def rate(r,club,y0,nj=30,nac=None):
  bd=R.get(r['name'])
  b=birth(bd); ref=datetime.date(y0,4,1)
  age=(ref-b).days/365.25 if b else None
  if age is None and nac and nac[:4].isdigit():
    m=re.match(r'(\d{4})-(\d\d)-(\d\d)$',nac)
    age=(ref-datetime.date(*map(int,m.groups()))).days/365.25 if m else y0-int(nac[:4])-0.25
  pr=pres(club); share=min(r['pj']/nj,1)
  p=pos(r,bd)
  capsb,capst=caps(bd,y0)
  lvl=300+0.45*pr+120*(share-0.5)+3*min(capsb,50)  # Argentina jugaba el doble de partidos de selección que España: 3 por partido hasta 50
  fw=sum(v for k,v in r.get('slots',{}).items() if int(k)>=6); tot=sum(r.get('slots',{}).values())
  if (p=='DEL' or (tot and fw/tot>0.5)) and r['pj']>0: lvl+=140*min(r['g']/r['pj'],1)*share
  if age is not None and age<20: lvl-=30
  if age is not None and age>33: lvl-=20*(age-33)
  lvl=round(lvl)
  te=techo(r,bd,lvl,age,y0)
  # Calibración: la escala de prestigio argentina incluye a la Primera B (suelo más bajo que España);
  # se suben 50 puntos para que el titular medio de Primera quede como el de España (~650-700).
  lvl+=AJ; te=min(te+AJ,1000)
  pais=PAIS.get((bd or {}).get('nac_pais') or '', (bd or {}).get('nac_pais') or '')
  nac=b.isoformat() if b else (nac or '')
  return dict(nombre=display(r),pos=p,nac=nac,pais=pais,liga=f"{r['pj']} / {r['g']}",nivel=lvl,techo=te,_bd=bd,_capsb=capsb,_age=age)
if __name__=='__main__':
  rows=[]
  for c in D['1958']:
    club=KEY2[c['key']]
    for r in c['rows']:
      x=rate(r,club,1958); x.update(division='Primera División',club=club); rows.append(x)
  rows.sort(key=lambda x:(x['club'],-x['nivel']))
  json.dump(rows,open('rated58.json','w'),ensure_ascii=False,default=str)
  for x in sorted(rows,key=lambda x:-x['nivel'])[:25]: print(x['nivel'],x['techo'],x['nombre'],x['club'],x['pos'],x['nac'],x['liga'],x['_capsb'])
  import statistics
  for club in sorted(set(x['club'] for x in rows)):
    t=sorted([x for x in rows if x['club']==club],key=lambda x:-int(x['liga'].split('/')[0]))[:11]
    print(club,round(statistics.mean(x['nivel'] for x in t)),collections.Counter(x['pos'] for x in t))
