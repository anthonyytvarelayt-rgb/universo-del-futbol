import csv,json,unicodedata,re,os,collections
def norm(s):
    s=re.sub(r"\(.*?\)","",s)
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r"[^a-z ]"," ",s.replace("-"," ")).split()
W=collections.defaultdict(list)
for r in csv.DictReader(open('wd_fr2.csv')):
    k=" ".join(norm(r['t']))
    W[k].append(r)
    W[" ".join(sorted(norm(r['t'])))].append(r)
def find(name,bd):
    yr=int(bd[-4:]) if bd and bd[-4:].isdigit() else None
    toks=norm(name)
    cands=W.get(" ".join(toks),[])+W.get(" ".join(sorted(toks)),[])
    best=[]
    for r in cands:
        by=int(r['birth'][:4]) if r['birth'] else None
        if yr and by and abs(by-yr)>2: continue
        if r['t'] not in [b['t'] for b in best]: best.append(r)
    return best
if __name__=="__main__":
    s=json.load(open('pall.json'))
    out={}
    for x in s:
        if os.path.exists(f"wiki/{x['pid']}.json"): continue
        b=find(x['name'],x['bd'])
        if len(b)>=1: out[x['pid']]=b[0]['t']
    print(len(out)); json.dump(out,open('titles_miss.json','w'),ensure_ascii=False)
