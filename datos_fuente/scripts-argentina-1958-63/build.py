import json,csv,re,glob,collections,unicodedata,datetime
import rate as RT
D=RT.D; R=RT.R; W=json.load(open('wd_match.json'))
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').upper()
# --- otros CSV: argentinos ya usados en Europa
EXT=[]
for f in glob.glob('/mnt/project-files/datos/*.csv'):
  if '/argentina' in f: continue
  try: rows=list(csv.DictReader(open(f,encoding='utf-8-sig')))
  except Exception: continue
  for r in rows:
    if 'Argentin' in (r.get('pais') or '') and r.get('nombre'):
      EXT.append(dict(f=f.split('/')[-1],nombre=r['nombre'],completo=r.get('nombre_completo',''),nac=r.get('nac',''),club=r.get('club','')))
def ext_match(name,nac):
  sur,_,first=name.partition(','); sur=norm(sur).split(); fn=norm(first).split()
  hits=[]
  for e in EXT:
    t=norm(e['nombre']+' '+e['completo']).split()
    if sur and sur[-1] in t or (sur and sur[0] in t):
      ok_fn = fn and fn[0] in t
      ok_y = nac and e['nac'][:4]==nac[:4]
      near = nac and nac[:4].isdigit() and e['nac'][:4].isdigit() and abs(int(e['nac'][:4])-int(nac[:4]))<=1
      exact = nac and len(nac)==10 and e['nac']==nac
      if nac and 'estimado' in nac and not ok_fn: continue
      if exact or (ok_fn and (not nac or near or not e['nac'][:4].isdigit())) or (ok_y and len(norm(e['nombre']).split())==1):
        hits.append(e)
  return hits
def birthinfo(n,r):
  bd=R.get(n); b=RT.birth(bd)
  if b: return b.isoformat(),'BDFA'
  w=W.get(n)
  if w and re.match(r'\d{4}-\d\d-\d\d',w['b']):
    return (w['b'][:4]+' (solo año)' if w['b'][5:]=='01-01' else w['b']),'Wikidata '+w['qid']
  # estimado: primer año en la trayectoria de BDFA - 20
  t=(bd or {}).get('tray','')
  ys=[int(x) for x in re.findall(r'\b(19[2-6]\d)\b',t)]
  fo=r.get('proc') and re.search(r'\(|Sao|Paulo|Madrid|Milan|Nacional|Peñarol',r.get('proc',''))
  if ys and not fo: return f"{min(ys)-20} (estimado)",'estimado: debut en BDFA %d menos 20 años'%min(ys)
  return None,None
def first_year(n):
  ys=[int(y) for y in D for c in D[y] for r in c['rows'] if r['name']==n]
  return min(ys) if ys else None
EOF=None
def nac_for(n,r,y0):
  nac,src=birthinfo(n,r)
  if not nac:
    fy=first_year(n)
    if fy==1957 or (fy and fy<y0): nac=f"{fy-25} (estimado)"; src='estimado: ya jugaba en Primera en %d'%fy
    elif r.get('proc') and re.search(r'\(|Sao|Paulo|Madrid|Milan|Nacional|Peñarol',r.get('proc','')): nac=f"{y0-26} (estimado)"; src='estimado: llega de fuera ya formado (26 años)'
    else: nac=f"{y0-(20 if r['pj']<8 else 23)} (estimado)"; src='estimado: primer año en Primera con %d partidos'%r['pj']
  return nac,src
def player(r,club,y0,div,nj=30):
  n=r['name']; nac,src=nac_for(n,r,y0)
  x=RT.rate(r,club,y0,nj=nj,nac=nac); x['nac']=nac if not RT.birth(R.get(n)) else x['nac']
  bd=R.get(n) or {}
  if not x['pais']:
    x['pais']='Argentina'; paisnota='país supuesto (sin ficha)'
  else: paisnota=''
  hits=ext_match(n,x['nac'])
  x.update(division=div,club=club,completo=n,nac_fuente=src,bdfa=('https://www.bdfa.com.ar/jugadores-%s-%s.html'%(bd['slug'],bd['id'])) if bd.get('id') else '',
           bdfa_conf=bd.get('conf',''),wikidata=W.get(n,{}).get('qid',''),procedencia=r.get('proc',''),ext=hits,nota=paisnota)
  if len(hits)>=1:
    h=hits[0]
    x['nombre']=h['nombre']
    if h['nac'][:4].isdigit(): x['nac']=h['nac']; x['nac_fuente']='mismo dato que '+h['f']
    x['otro_csv']='; '.join(f"{e['f']} ({e['club']})" for e in hits)
  return x
if __name__=='__main__':
  rows=[];conf=[]
  NJ={'Boca':32,'San Lorenzo':32}
  for c in D['1958']:
    club=RT.KEY2[c['key']]
    for r in c['rows']:
      x=player(r,club,1958,'Primera División',NJ.get(c['key'],30))
      rows.append(x)
  for x in rows:
    if x['ext']: print(x['nombre'],x['club'],x['nac'],x['liga'],'->',[(e['f'],e['nombre'],e['nac'],e['club']) for e in x['ext']])
  json.dump(rows,open('final58.json','w'),ensure_ascii=False,default=str)
