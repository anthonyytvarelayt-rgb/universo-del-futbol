import json,os,concurrent.futures as cf,re,urllib.parse,hashlib
from bdfa import ficha,get,norm
B=json.load(open('bd_fichas.json'))
miss=set((s,i) for v in B['pick'].values() for _,s,i in v if not os.path.exists(f'bd_p/{i}.html'))
print('faltan',len(miss))
with cf.ThreadPoolExecutor(4) as ex:
  for (slug,i),d in zip(miss,ex.map(lambda j:ficha(*j),miss)): B['fichas'][i]=dict(d,slug=slug)
# busquedas con Ñ y DE separados
def srch(q):
  u='https://www.bdfa.com.ar/buscar.asp?'+urllib.parse.urlencode({k:v.encode('latin-1','ignore') for k,v in q.items()})
  t=get(u,'bd_s/'+hashlib.md5(u.encode()).hexdigest()+'.html')
  i=t.find('<h3 class="my-4">Busqueda'); seg=t[i:t.find('BDFA Argentina',i)] if i>0 else ''
  return sorted(set(re.findall(r'jugadores-([^"]*)-(\d+)\.html',seg)))
add=0
for n,v in B['pick'].items():
  if v: continue
  sur=n.split(',')[0].strip()
  alts=[]
  if 'Ñ' in sur: alts.append(sur)
  if re.match(r'^DE[A-Z]{3,}',sur): alts.append('DE '+sur[2:])
  if ' ' in sur: alts.append(sur.split()[-1])
  fn=norm(n.partition(',')[2]).split()
  for a in alts:
    for slug,i in srch({'apellido':a}):
      st=slug.split('-'); s=sum(1 for t in fn if t in st)
      if s>0 or len(st)<=2:
        v.append((s,slug,i)); 
  v.sort(reverse=True); del v[5:]
  for _,slug,i in v:
    if i not in B['fichas']: B['fichas'][i]=dict(ficha(slug,i),slug=slug); add+=1
print('añadidas',add)
json.dump(B,open('bd_fichas.json','w'),ensure_ascii=False)
