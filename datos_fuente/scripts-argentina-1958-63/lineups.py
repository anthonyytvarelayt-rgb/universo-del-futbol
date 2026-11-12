import re,json,unicodedata,collections
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').upper().replace('’',"'").replace('´',"'")
KEY={'ARGENTINOS':'Argentinos','ATLANTA':'Atlanta','BOCA':'Boca','CENTRAL CORDOBA':'Central Córdoba','ESTUDIANTES':'Estudiantes','FERRO':'Ferro','GIMNASIA':'Gimnasia','HURACAN':'Huracán','INDEPENDIENTE':'Independiente','LANUS':'Lanús','NEWELL':"Newell",'RACING':'Racing','RIVER':'River','ROSARIO CENTRAL':'Rosario Central','SAN LORENZO':'San Lorenzo','TIGRE':'Tigre','VELEZ':'Vélez','CHACARITA':'Chacarita','LOS ANDES':'Los Andes','QUILMES':'Quilmes','BANFIELD':'Banfield','PLATENSE':'Platense'}
def clubkey(full):
  n=norm(full)
  for k,v in KEY.items():
    if k in n and not (k=='ROSARIO CENTRAL' and 'CORDOBA' in n): return v
  return None
def run(y,squads):
  L=open(f'raw{y}.txt').read().split('\n')
  idx={}
  for s in squads:
    ck=clubkey(s['club']); s['key']=ck
    for r in s['rows']: r.setdefault('slots',collections.Counter())
    idx[ck]=s
  i=0; nlu=0; unm=collections.Counter()
  while i<len(L):
    m=re.match(r"^([A-ZÁÉÍÓÚÑ’'´\. y]+?(?:\s?\([^)]*\))?)\s(\d+)$",L[i].strip())
    ck=clubkey(m.group(1)) if m else None
    if m and ck in idx:
      txt='';j=i+1
      while j<len(L) and j<i+8:
        txt+=' '+L[j].strip(); 
        if L[j].strip().endswith('.'): break
        j+=1
      txt=re.split(r'\.\s*A\.\s*S|\.\s*DT:',txt)[0]
      txt=txt.replace("D' ","D'").replace("D ´","D'")
      parts=txt.strip().rstrip('.').split(';')
      if len(parts)==4:
        names=[]
        for p in parts: names+= [x.strip() for x in re.split(r',| y ',p) if x.strip()]
        if len(names)==11:
          nlu+=1
          for k,nm in enumerate(names):
            r=match(nm,idx[ck]['rows'])
            if r:
              r['slots'][k]+=1; r.setdefault('disp',collections.Counter())[re.sub(r'\(.*?\)','',nm).strip()]+=1
            else: unm[(ck,nm)]+=1
        i=j
    i+=1
  return nlu,unm
def match(nm,rows):
  nm=re.sub(r'\(.*?\)','',nm).strip(); n=norm(nm)
  toks=n.split()
  cands=[]
  for r in rows:
    if ',' in r['name']: sur,_,first=r['name'].partition(',')
    else: sur,_,first=r['name'].partition(' ')
    sur=norm(sur).strip().replace("D' ","D'"); first=norm(first).replace('.','').split()
    nn=n.replace("D' ","D'")
    if not (nn.endswith(' '+sur) or nn==sur) and len(sur.split())>1 and nn.endswith(' '+sur.split()[0]): sur=sur.split()[0]
    if nn.endswith(' '+sur) or nn==sur or (len(toks)==1 and toks[0] in first+[sur]):
      pre=nn[:-len(sur)].strip().replace('.','') if nn.endswith(sur) else ''
      pt=pre.split()
      score=sum(2 if (q<len(first) and t==first[q]) else (1 if (q<len(first) and first[q].startswith(t)) else (0.5 if t in first else -1)) for q,t in enumerate(pt)) if pt else 0.5
      cands.append((score,r))
  if not cands:
    import difflib
    for r in rows:
      sur=norm(r['name'].split(',')[0]).strip()
      if toks and difflib.SequenceMatcher(None,toks[-1],sur.split()[-1]).ratio()>=0.83: cands.append((0.4,r))
  cands.sort(key=lambda x:-x[0])
  if cands and cands[0][0]>0 and (len(cands)==1 or cands[0][0]>cands[1][0]): return cands[0][1]
  if len(cands)==1: return cands[0][1]
  return None
if __name__=='__main__':
  d=json.load(open('squads_hl.json'))
  for y in d:
    nlu,unm=run(y,d[y]); print(y,'alineaciones',nlu,'sin casar',sum(unm.values()),unm.most_common(5))
  for y in d:
    for s in d[y]:
      for r in s['rows']:
        r['slots']=dict(r['slots']); r['disp']=dict(r.get('disp',{}))
  json.dump(d,open('squads_pos.json','w'),ensure_ascii=False,indent=0)
