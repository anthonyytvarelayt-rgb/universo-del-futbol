import sys,json,csv; sys.path.insert(0,sys.argv[1]); from wk import api
rows=[l.rstrip('\n').split('\t') for l in open('clubs.tsv')]
t=[r[3] for r in rows]; res={}
for i in range(0,len(t),50):
    d=api(dict(action='query',titles='|'.join(t[i:i+50]),redirects=1))
    rd={x['from']:x['to'] for x in d['query'].get('redirects',[])}
    for p in d['query']['pages']: res[p['title']]=not p.get('missing',False)
    for a in t[i:i+50]: res.setdefault(a,None); 
    json.dump(rd,open('rd%d.json'%i,'w'))
rd={}
for i in range(0,len(t),50): rd.update(json.load(open('rd%d.json'%i)))
cats=['Kategorie:Fußballspieler ('+rd.get(a,a)+')' for a in t]
ok={}
for i in range(0,len(cats),50):
    d=api(dict(action='query',titles='|'.join(cats[i:i+50]),prop='categoryinfo'))
    for p in d['query']['pages']: ok[p['title']]=p.get('categoryinfo',{}).get('pages',0)
out=[]
for r,a,c in zip(rows,t,cats): out.append(r+[rd.get(a,a),c,ok.get(c,0)]); print(a,'->',rd.get(a,a),ok.get(c,0))
json.dump(out,open('clubs.json','w'),ensure_ascii=False)
