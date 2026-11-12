import json,os,re,time,urllib.request,urllib.parse,html,sys
import xml.etree.ElementTree as ET
UA='SimuladorFutbolHistorico/1.0 (https://claude.ai; research bot)'
def get(url,data=None):
    for k in range(8):
        try:
            r=urllib.request.Request(url,data=data,headers={'User-Agent':UA})
            b=urllib.request.urlopen(r,timeout=120).read(); time.sleep(0.5); return b
        except Exception as e:
            print('retry',k,e,file=sys.stderr,flush=True); time.sleep(10*(k+1))
    raise SystemExit('fail')
clubs=json.load(open('clubs2.json'))
y0,y1=int(sys.argv[1]),int(sys.argv[2])
G='|'.join('Geboren_%d'%y for y in range(y0,y1+1))
mem=json.load(open('tr/mem.json')) if os.path.exists('tr/mem.json') else {}
extra=sys.argv[3:]  # additional category names (e.g. Fußballtrainer)
jobs=[(n,('Fußballtrainer (%s)'%n).replace(' ','_')) for c in clubs if c['div']!='extra' for n in c['cats']]
for e in extra: jobs.append((e,e.replace(' ','_')))
for n,cs in jobs:
    if n in mem: continue
    res=[];off=0
    while True:
        q=urllib.parse.urlencode(dict(search='incategory:%s incategory:%s'%(cs,G),limit=500,offset=off,fulltext=1,ns0=1))
        h=get('https://de.wikipedia.org/w/index.php?'+q).decode()
        t=[html.unescape(urllib.parse.unquote(x)).replace('_',' ') for x in re.findall(r'mw-search-result-heading"><a href="/wiki/([^"]*)"',h)]
        res+=t
        if len(t)<500: break
        off+=500
    mem[n]=res; print(n,len(res),flush=True); json.dump(mem,open('tr/mem.json','w'),ensure_ascii=False)
titles=sorted(set(t for v in mem.values() for t in v))
txt=json.load(open('tr/txt.json')) if os.path.exists('tr/txt.json') else {}
todo=[t for t in titles if t not in txt]; print('players',len(titles),'todo',len(todo),flush=True)
for i in range(0,len(todo),200):
    b=get('https://de.wikipedia.org/w/index.php?title=Spezial:Exportieren&action=submit',urllib.parse.urlencode(dict(pages='\n'.join(todo[i:i+200]),curonly=1)).encode())
    root=ET.fromstring(b); ns={'m':root.tag.split('}')[0][1:]}
    for p in root.findall('m:page',ns):
        txt[p.find('m:title',ns).text]=p.find('m:revision/m:text',ns).text or ''
    for t in todo[i:i+200]: txt.setdefault(t,'')
    json.dump(txt,open('tr/txt.json','w'),ensure_ascii=False); print('txt',len(txt),flush=True)
