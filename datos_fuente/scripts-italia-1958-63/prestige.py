import json,math,collections
from tables import table
NAME={'430':'Fiorentina','5':'Milan','12':'Roma','3037':'Padova','1025':'Bologna','416':'Torino','252':'Genoa','46':'Inter','506':'Juventus','398':'Lazio','2655':'Vicenza','1038':'Sampdoria','2722':'SPAL','332':'Bari','6195':'Napoli','410':'Udinese','2721':'Alessandria','4271':'Triestina',
'57135':'Marzotto Valdagno','2919':'Monza','2250':'Prato','5621':'Reggiana','1104':'Messina','800':'Atalanta','19':'Brescia','1390':'Cagliari','5514':'Lecco','1627':'Catania','1047':'Como','276':'Verona','1385':'Modena','6692':'Novara','458':'Palermo','130':'Parma','4093':'Taranto','4330':'Sambenedettese','607':'Venezia','4170':'Vigevano'}
PRE={'Genoa':9,'Juventus':2,'Milan':3,'Inter':2,'Bologna':2,'Torino':1}   # títulos 1898-1929
CI={'Torino':[1936,1943],'Genoa':[1937],'Juventus':[1938,1942],'Inter':[1939],'Fiorentina':[1940],'Lazio':[1958]}
CIF={'Udinese':[1922],'Alessandria':[1936],'Roma':[1937,1941],'Torino':[1938],'Novara':[1939],'Genoa':[1940],'Milan':[1942],'Fiorentina':[1958]}
EUR={'Fiorentina':10,'Milan':10+4,'Bologna':2*3}  # finales/semis Copa de Europa; Bologna 2 Mitropa
def run(extra=None):
    S=collections.defaultdict(lambda: collections.Counter())
    prev=None
    for y in range(1929,1958):
        if y in (1943,1944,1945): continue
        for L in ('IT1','IT2'):
            t=table(L,y)
            for pos,cid,nm in t:
                n=NAME.get(cid)
                if not n:
                    if extra is None or cid not in extra: continue
                    n=extra[cid]
                c=S[n]
                if L=='IT1':
                    c['A']+=1
                    if pos==1: c['tit']+=1
                    if pos==2: c['2']+=1
                    if pos==3: c['3']+=1
                else: c['B']+=1
                if y>=1953:
                    w=y-1952
                    c['rec']+= w*((1+(len(t)-pos)/(len(t)-1)) if L=='IT1' else 0.6*(len(t)-pos)/(len(t)-1))
    out={}
    allc=dict(NAME); allc.update(extra or {})
    for cid,n in allc.items():
        c=S[n]
        ci=sum(4*(0.4 if y<1940 else 1) for y in CI.get(n,[]))
        cif=sum(1.5*(0.4 if y<1940 else 1) for y in CIF.get(n,[]))
        raw=10*c['tit']+4*PRE.get(n,0)+ci+cif+4*c['2']+2*c['3']+0.6*c['A']+0.15*c['B']+1.0*c['rec']+EUR.get(n,0)
        out[n]=dict(raw=round(raw,1),A=c['A'],B=c['B'],tit=c['tit'],pre=PRE.get(n,0),seg=c['2'],ter=c['3'],rec=round(c['rec'],1),ci=len(CI.get(n,[])),cif=len(CIF.get(n,[])),eur=EUR.get(n,0))
    base=[out[n]['raw'] for n in NAME.values()]
    mx=max(base); mn=min(base)
    for n,v in out.items():
        v['prestigio']=round(250+(950-250)*math.sqrt(max(v['raw']-mn,0)/(mx-mn)))
    return out
if __name__=='__main__':
    o=run(); json.dump(o,open('../it/prestigio.json','w'),ensure_ascii=False,indent=0)
    for n,v in sorted(o.items(),key=lambda x:-x[1]['prestigio']): print(n,v)
