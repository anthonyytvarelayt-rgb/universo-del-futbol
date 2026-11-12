import json,re,urllib.parse,hashlib,concurrent.futures as cf
from bdfa import get,norm,ficha
def srch(q):
  u='https://www.bdfa.com.ar/buscar.asp?'+urllib.parse.urlencode({k:v.encode('latin-1','ignore') for k,v in q.items()})
  t=get(u,'bd_s/'+hashlib.md5(u.encode()).hexdigest()+'.html')
  i=t.find('<h3 class="my-4">Busqueda'); seg=t[i:t.find('BDFA Argentina',i)] if i>0 else ''
  return sorted(set(re.findall(r'jugadores-([^"]*)-(\d+)\.html',seg)))
names=json.load(open('names.json'))
old=json.load(open('bd_search.json'))
def work(n):
  sur,_,first=n.partition(','); sur=norm(sur).strip(); fn=norm(first).split()
  if not ',' in n: sur=n.split()[0]; fn=[]
  l=set(map(tuple,old.get(n,[])))
  a=srch({'apellido':sur})
  l|=set(map(tuple,a))
  if len(a)>=40 and fn: l|=set(map(tuple,srch({'apellido':sur,'nombre':fn[0]})))
  toks=fn+sur.split()
  sc=[]
  for slug,i in l:
    st=slug.split('-')
    if not all(t in st for t in sur.split()[-1:]) : continue
    others=[t for t in st if t not in sur.split()]
    s=sum(1 for t in fn if t in st)-0.5*len([t for t in others if t not in fn])
    sc.append((s,slug,i))
  sc.sort(reverse=True)
  return n,sc[:5]
pick={}
with cf.ThreadPoolExecutor(8) as ex:
  for n,sc in ex.map(work,names): pick[n]=sc
B=json.load(open('bd_fichas.json'))
jobs=set((s,i) for v in pick.values() for _,s,i in v if i not in B['fichas'])
print('nuevas fichas',len(jobs))
with cf.ThreadPoolExecutor(8) as ex:
  for (slug,i),d in zip(jobs,ex.map(lambda j:ficha(*j),jobs)): B['fichas'][i]=dict(d,slug=slug)
B['pick']=pick
json.dump(B,open('bd_fichas.json','w'),ensure_ascii=False)
