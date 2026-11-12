import json,re,subprocess,os,unicodedata,urllib.parse,html,concurrent.futures as cf,hashlib
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').upper()
def get(url,path):
  if os.path.exists(path) and os.path.getsize(path)>1000: return open(path,encoding='latin-1').read()
  for k in range(3):
    r=subprocess.run(['curl','-s','-L','-m','60','-A',UA,url],capture_output=True).stdout
    if len(r)>1000: open(path,'wb').write(r); return r.decode('latin-1')
  return ''
def search(name):
  sur,_,first=name.partition(',')
  sur=sur.strip(); fn=first.strip().split()
  q={'apellido':norm(sur).encode('latin-1','ignore')}
  if fn: q['nombre']=norm(fn[0]).encode('latin-1','ignore')
  u='https://www.bdfa.com.ar/buscar.asp?'+urllib.parse.urlencode(q)
  h=hashlib.md5(u.encode()).hexdigest()
  t=get(u,f'bd_s/{h}.html')
  i=t.find('<h3 class="my-4">Busqueda'); seg=t[i:t.find('BDFA Argentina',i)] if i>0 else ''
  links=sorted(set(re.findall(r'jugadores-([^"]*)-(\d+)\.html',seg)))
  return links
def ficha(slug,id_):
  u=f'https://www.bdfa.com.ar/jugadores-{slug}-{id_}.html'
  t=get(u,f'bd_p/{id_}.html')
  t=re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S)
  t=html.unescape(re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',t)))
  d={}
  m=re.search(r'Nacionalidad (.*?) (?:Nacimiento|Lugar|Posición)',t)
  if m: d['nac_pais']=m.group(1).strip()
  m=re.search(r'Nacimiento (\S+)',t)
  if m: d['nac']=m.group(1)
  m=re.search(r'Lugar (.*?) Posición',t)
  if m: d['lugar']=m.group(1).strip()
  m=re.search(r'Posición (\S+)',t)
  if m: d['pos']=m.group(1)
  i=t.find('Club / Selección PJ Goles Prom.'); j=t.find('Resumen Estadístico')
  d['tray']=t[i+30:j].strip() if i>0 else ''
  return d
if __name__=='__main__':
  names=json.load(open('names.json'))
  def work(n):
    try: return n,search(n)
    except Exception as e: return n,[]
  res={}
  with cf.ThreadPoolExecutor(8) as ex:
    for n,l in ex.map(work,names): res[n]=l
  json.dump(res,open('bd_search.json','w'),ensure_ascii=False)
  print(sum(1 for v in res.values() if v),len(res))
