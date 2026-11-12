import re,json
UP="A-ZÁÉÍÓÚÑÜÇ"
NUM=re.compile(r'\s(\d+)\s(\d+)\s(\d+)(?=\s|$)')
def isup(t): return re.fullmatch(rf"[{UP}][{UP}'´\-]*,?",t) is not None and len(t.strip(','))>=2
def rowparse(l):
  l=re.sub(r',(?=\S)',', ',l)
  m=NUM.search(' '+l)
  if not m: return None
  left=(' '+l)[:m.start()].strip(); toks=left.split()
  k=next((i for i,t in enumerate(toks) if isup(t)),None)
  if k is None: return None
  name=' '.join(toks[k:]); proc=' '.join(toks[:k])
  name=re.sub(r'([a-záéíóúñü])([A-ZÁÉÍÓÚÑ])',r'\1 \2',name)
  if not re.search(r'[a-záéíóúñü]',name) and ',' not in name: pass
  if re.search(r'^(TOTALES|JUGADOR)',name): return None
  return dict(proc=proc,name=name,pj=int(m.group(1)),g=int(m.group(2)),ex=int(m.group(3)))
def parse(y):
  L=open(f'raw{y}.txt').read().split('\n')
  out=[];cur=None;skip=False
  for i,l in enumerate(L):
    if l.startswith('PROCEDENCIA'):
      cur=dict(rows=[],club=None); out.append(cur); continue
    if cur is None: continue
    if cur['club'] is None and re.match(r'^(Club|Asociación|Racing|Quilmes|Sportivo|Ferro)',l) and not re.search(r'\d',l):
      cur['club']=l.strip(); continue
    if cur['club'] or skip: skip=False; continue
    l=l.strip()
    if re.match(r'^(PROPIOS|A FAVOR|Convertidos|Atajados|Desviados|\d+$)',l): continue
    r=rowparse(l)
    if r is None and i+1<len(L) and re.search(rf'[{UP}]{{3,}}',l):
      nx=L[i+1].strip(); n=re.match(r'^(\d+)([a-záéíóúñü]+)\s(.*)',nx)
      l2= l+n.group(2)+' '+n.group(1)+' '+n.group(3) if n else l+' '+nx
      r=rowparse(l2)
      if r: skip=True
    if r: cur['rows'].append(r)
  return out
if __name__=='__main__':
  allp={}
  for y in range(1957,1964):
    o=parse(y); allp[y]=o
    print(y,[(x['club'][-14:] if x['club'] else None,len(x['rows'])) for x in o])
  json.dump(allp,open('squads_hl.json','w'),ensure_ascii=False,indent=0)
