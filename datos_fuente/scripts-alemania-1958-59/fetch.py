import sys,json,os; sys.path.insert(0,sys.argv[1]); from wk import api
clubs=json.load(open('clubs2.json'))
G='|'.join('Geboren_%d'%y for y in range(1915,1947))
mem=json.load(open('mem.json')) if os.path.exists('mem.json') else {}
for c in clubs:
    for n in c['cats']:
        if n in mem: continue
        cs='|'.join(('%s (%s)'%(k,n)).replace(' ','_') for k in ('Fußballspieler','Fußballtorhüter'))
        q='incategory:%s incategory:%s'%(cs,G)
        res=[];off=0
        while True:
            d=api(dict(action='query',list='search',srsearch=q,srlimit=500,sroffset=off,srprop=''))
            res+=[x['title'] for x in d['query']['search']]
            if 'continue' in d: off=d['continue']['sroffset']
            else: break
        mem[n]=res; print(n,len(res),flush=True)
        json.dump(mem,open('mem.json','w'),ensure_ascii=False)
titles=sorted(set(t for v in mem.values() for t in v))
txt=json.load(open('txt.json')) if os.path.exists('txt.json') else {}
todo=[t for t in titles if t not in txt]
print('players',len(titles),'todo',len(todo),flush=True)
for i in range(0,len(todo),50):
    d=api(dict(action='query',titles='|'.join(todo[i:i+50]),prop='revisions',rvprop='content',rvslots='main'))
    for p in d['query']['pages']:
        try: txt[p['title']]=p['revisions'][0]['slots']['main']['content']
        except Exception: txt[p['title']]=''
    json.dump(txt,open('txt.json','w'),ensure_ascii=False); print('txt',len(txt),flush=True)
