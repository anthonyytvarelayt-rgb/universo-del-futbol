import re,collections,json
from lineups import clubkey
def dts(y):
  L=open(f'raw{y}.txt').read().split('\n'); seq=collections.defaultdict(list)
  for i,l in enumerate(L):
    m=re.match(r"^([A-ZÁÉÍÓÚÑ’'´\.\(\) y]+?)\s(\d+)$",l.strip())
    ck=clubkey(m.group(1)) if m else None
    if ck:
      txt=' '.join(x.strip() for x in L[i+1:i+7])
      n=re.search(r'DT:\s*([^.]+?(?:\s[A-Z]\.)?[^.]*?)\.',txt)
      if n: seq[ck].append(re.sub(r'\s+',' ',n.group(1)).strip())
  return seq
if __name__=='__main__':
  out={}
  for y in range(1959,1964):
    s=dts(y); out[y]={}
    for k,v in s.items():
      runs=[];
      for x in v:
        if runs and runs[-1][0]==x: runs[-1][1]+=1
        else: runs.append([x,1])
      out[y][k]=runs
  json.dump(out,open('dts.json','w'),ensure_ascii=False,indent=0)
  for k,v in out[1959].items(): print(k,v[:4])
