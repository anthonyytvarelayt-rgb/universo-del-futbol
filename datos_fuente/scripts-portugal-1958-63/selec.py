import json,sys,re
sys.path.insert(0,'/tmp/claude-0/pt/scripts')
from parse import parse
KEY={'Benfica':r'Benfica(?! (e )?Castelo)','Oporto':r'\bPorto\b(?! Alegre)','Sporting de Portugal':r'Sporting( CP| Clube de Portugal|$| Lisboa)|^Sporting\b(?! ?(de )?(Braga|Covilh|Farense|Olhan|Espinho|Gij))','Belenenses':r'Belenenses','Académica':r'Acad[ée]mica','Vitória de Setúbal':r'Vit[óo]ria( F\.?C\.?| Futebol| \(?Set|.*Set[úu]bal)|Setúbal','Vitória de Guimarães':r'Vit[óo]ria( S\.?C\.?| Sport|.*Guimar)|Guimarães','Barreirense':r'Barreirense','Braga':r'Braga','Covilhã':r'Covilh','Lusitano de Évora':r'Lusitano(?!.*(Lobito|VRSA|Vila Real))','CUF':r'CUF|Fabril','Torreense':r'Torreense','Caldas':r'Caldas',
'Atlético CP':r'Atl[ée]tico( CP| Clube de Portugal|$)','Leixões':r'Leix','Boavista':r'Boavista','Penafiel':r'Penafiel','Sanjoanense':r'Sanjoanense','Peniche':r'Peniche','Portimonense':r'Portimonense','Farense':r'Farense','Chaves':r'Chaves','Montijo':r'Montijo','Oliveirense':r'Oliveirense','Oriental':r'Oriental','Tirsense':r'Tirsense','Vila Real':r'Vila Real','Salgueiros':r'Salgueiros','Elvas':r'Elvas','Olhanense':r'Olhanense','Estoril':r'Estoril','Espinho':r'Espinho','Feirense':r'Feirense','Famalicão':r'Famalic','Beira-Mar':r'Beira[- ]Mar'}
def covers(s):
    a,b=s['a'],s['b']
    return a<=1958 and b>=1959
def single(s): return s['a']==s['b'] and s['a'] in (1958,1959)
def pick(p,club):
    rx=KEY[club]; cand=[s for s in p['stints'] if re.search(rx,s['club'])]
    full=[s for s in cand if covers(s)]
    if full: return full[0],'tramo'
    sg=[s for s in cand if single(s)]
    if sg:
        # no debe haber otro club que cubra 1958-59
        other=[s for s in p['stints'] if covers(s) and s not in cand]
        if not other: return sg[0],'un año'
    return None,None
def run(src):
    W=json.load(open(src)); res={}
    for club,langs in W.items():
        got={}
        for lang in ('en','pt'):
            for title,t in (langs.get(lang) or {}).items():
                p=parse(title,t,lang)
                if not p: continue
                s,how=pick(p,club)
                if not s: continue
                # fusión en/pt por fecha de nacimiento y apellido
                import unicodedata
                nm=''.join(c for c in unicodedata.normalize('NFD',p['name'].lower()) if unicodedata.category(c)!='Mn')
                k=nm
                if k not in got:
                    for kk,g in got.items():
                        if p['birth'] and g['birth']==p['birth'] and kk.split()[-1]==nm.split()[-1]: k=kk
                if k in got: 
                    if not got[k]['birth'] and p['birth']: got[k]['birth']=p['birth']
                    g=got[k]
                    for f in ('pos','full'): 
                        if not g[f] and p[f]: g[f]=p[f]
                    if not g['nat'] and p['nat']: g['nat']=p['nat']
                    g['src'].append(lang+':'+title); continue
                p['st']=s; p['how']=how; p['src']=[lang+':'+title]
                got[k]=p
        res[club]=list(got.values())
        print(club,len(res[club]))
    return res
if __name__=='__main__':
    json.dump(run(sys.argv[1]),open(sys.argv[2],'w'),ensure_ascii=False,indent=0)
