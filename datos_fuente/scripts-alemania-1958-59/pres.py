import json,math,re
T=json.load(open('tabs.json')); C=json.load(open('clubs2.json'))
L={'Nord':'oln','West':'olw','Sur':'ols','Suroeste':'olsw','Berlín':'olb'}
base=[c for c in C if c['div'] in L]
for d,p in L.items():
    cs=[c for c in base if c['div']==d]; rows=T[p+'5859']['rows']
    for c,(pos,n) in zip(cs,rows): c['tab']=n; c['pos']=pos
def norm(s): return re.sub(r'[^a-z0-9]','',s.lower().replace('ß','ss').replace('ü','u').replace('ö','o').replace('mönchen','munchen').replace('*',''))
CH={'Núremberg':[1920,1921,1924,1925,1927,1936,1948],'Schalke 04':[1934,1935,1937,1939,1940,1942,1958],'Hamburgo':[1923,1928],'Fürth':[1914,1926,1929],'Hertha Berlín':[1930,1931],'Bayern Múnich':[1932],'Fortuna Düsseldorf':[1933],'Hannover 96':[1938,1954],'Holstein Kiel':[1912],'Viktoria 89 Berlín':[1908,1911],'VfR Mannheim':[1949],'Stuttgart':[1950,1952],'Kaiserslautern':[1951,1953],'Rot-Weiss Essen':[1955],'Borussia Dortmund':[1956,1957],'Karlsruhe':[]}
CUP={'Núremberg':[1935,1939],'Schalke 04':[1937],'Múnich 1860':[1942],'Rot-Weiss Essen':[1953],'Stuttgart':[1954,1958],'Karlsruhe':[1955,1956],'Bayern Múnich':[1957]}
FIN={'Kaiserslautern':[1948,1954,1955],'Eintracht Fráncfort':[1932,1938,1959],'Schalke 04':[1933,1938,1941],'Núremberg':[1922,1934,1937,1962],'Hamburgo':[1922,1957],'Fortuna Düsseldorf':[1936],'Borussia Dortmund':[1949],'Kickers Offenbach':[1950,1959],'Karlsruhe':[1956],'1. FC Saarbrücken':[1952],'Köln':[],'Stuttgart':[1953],'Werder Bremen':[]}
out=[]
for c in base:
    k=norm(c['tab']); s=0; seas=0; ol=0; rec=0
    for key,v in T.items():
        y=int(key[-4:-2])
        if y>57: continue
        for pos,n in v['rows']:
            if norm(re.sub(r'\s*\(.*?\)','',n))==k:
                seas+=1
                if pos==1: ol+=1
                if y>=53: rec+=max(0,(17-pos))/16*(1+(y-53)*0.25)
    cl=c['club']
    t=sum(10 if y>=1946 else 4 for y in CH.get(cl,[]))+sum(4 if y>=1946 else 1.6 for y in CUP.get(cl,[]))+sum(3 if y>=1946 else 1.2 for y in FIN.get(cl,[]) if y<1959)
    w={'Berlín':0.45,'Nord':0.85,'Suroeste':0.85}.get(c['div'],1.0)
    s=t+w*(ol*2.5+seas*0.6+rec*2)
    out.append([cl,c['div'],c['tab'],seas,ol,round(rec,1),round(t,1),round(s,1)])
M=max(o[-1] for o in out)
for o in out: o.append(round(250+650*math.sqrt(o[-1]/M)))
out.sort(key=lambda o:-o[-1])
for o in out: print(o)
json.dump({o[0]:o[-1] for o in out},open('pres.json','w'),ensure_ascii=False)
json.dump(base,open('base.json','w'),ensure_ascii=False)
