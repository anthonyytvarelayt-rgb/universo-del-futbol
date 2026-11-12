import json,collections,unicodedata,re,urllib.parse,sys
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').upper()
def load(f):
  P={}
  for x in json.load(open(f)):
    p=x['p']['value']; art=x.get('art',{}).get('value')
    lab=x.get('pLabel',{}).get('value') or (urllib.parse.unquote(art.split('/wiki/')[1]).replace('_',' ') if art else '')
    lab=re.sub(r'\s*\(.*?\)','',lab)
    P.setdefault(p,dict(label=lab,b=x['b']['value'][:10],art=art))
  return P
def match(names,P):
  idx=collections.defaultdict(list)
  for p,v in P.items():
    t=norm(v['label']).split()
    for k in t[1:]: idx[k].append((p,v))
  out={}
  for n in names:
    sur,_,first=n.partition(','); sur=norm(sur).split(); fn=norm(first).split()
    if not sur or not fn: continue
    c={p:v for p,v in idx.get(sur[-1],[]) if fn[0] in norm(v['label']).split() and all(s in norm(v['label']).split() for s in sur)}
    if len(c)==1:
      p,v=list(c.items())[0]; out[n]=dict(qid=p.split('/')[-1],b=v['b'],label=v['label'],art=v['art'])
  return out
if __name__=='__main__':
  D=json.load(open('squads_pos.json'))
  names=set(r['name'] for y in D for c in D[y] for r in c['rows'])
  out=match(names,load('wd_p54.json'))
  print(len(out)); json.dump(out,open('wd_match.json','w'),ensure_ascii=False,indent=0)
