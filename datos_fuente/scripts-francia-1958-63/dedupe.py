import csv,unicodedata
D="/mnt/project-files/datos/"
STOP={'jean','claude','michel','pierre','paul','andre','rene','louis','marcel','jacques','georges','henri','robert','ahmed','mohamed'}
n=lambda s:set(unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower().replace('-',' ').split())-STOP
P=list(csv.DictReader(open(D+'francia-1958-59-plantillas.csv')))
rows=list(csv.DictReader(open(D+'francia-debutantes-1959-63.csv'))); cols=list(rows[0])
def last(x): return unicodedata.normalize('NFKD',x['nombre']).encode('ascii','ignore').decode().lower().split()[-1]
def same(p,r):
    sh=n(p['nombre'])&n(r['nombre'])
    if p['nac'] and p['nac']==r['nac'] and sh: return True
    if p['nac'][:4].isdigit() and r['nac'][:4].isdigit() and abs(int(p['nac'][:4])-int(r['nac'][:4]))<=1 and last(p)==last(r) and p['nombre'][0]==r['nombre'][0]: return True
    return False
keep=[]
for r in rows:
    d=[p for p in P if same(p,r)]
    if d: print('fuera',r['nombre'],r['nac'],'=',d[0]['nombre'],d[0]['nac'],d[0]['club'])
    else: keep.append(r)
w=csv.DictWriter(open(D+'francia-debutantes-1959-63.csv','w',newline=''),fieldnames=cols);w.writeheader();w.writerows(keep)
print(len(rows),'->',len(keep))
