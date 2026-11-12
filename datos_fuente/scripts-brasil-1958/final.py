import json,re,csv,collections
from rate import *
from parse import box
r=json.load(open('rows58.json'));allp=json.load(open('allpages.json'))
ex=json.load(open('wd_extra.json'))
POSX={'Pelé':'DEL','Gylmar dos Santos Neves':'POR','Cláudio (futebolista)':'DEL','Haroldo (futebolista)':'DEL','Oscar Basso':'DEF','Silvio Parodi':'DEL','Sinforiano García':'POR','Mário Travaglini':'DEF','Puglia (futebolista)':'DEF','Bauer (futebolista)':'MED','Cabeção (futebolista)':'POR','Angelo Sormani':'DEL','Américo Murolo':'MED','Carlos Alberto Cavalheiro':'POR','Célio Taveira Filho':'DEL'}
for club,nm,b,s,e,art in ex:
    y=int(b[:4]) if b[:4].isdigit() else 0
    if not 1920<=y<=1943 or nm=='Wlamir Marques': continue
    key=art or nm
    if key in r: continue
    if any(x['nac'][:10]==b and x['hit'][0]['club']==club for x in r.values()): continue
    pos=POSX.get(art,'')
    if not pos and art in allp:
        f=box(allp[art]) or {}
        from build import pos as P; pos=P(f)
    caps={'Pelé':92,'Gylmar dos Santos Neves':94,'Orlando Peçanha':34}.get(art,0)
    r[key]=dict(title=key,nome=re.sub(r'\s*\(.*\)','',art) if art else nm,full=nm,nac=b,pos=pos,ent=[dict(club=club,a=int(s),b=int(e) if e else 2030,pj=None,gl=None)],hit=[dict(club=club,a=int(s),b=int(e) if e else 2030,pj=None,gl=None)],caps=caps,sel='',selys=['1957','1971'] if art=='Pelé' else (['1953','1969'] if 'Gylmar' in art else []),src='wikidata')
out=[];seen=set()
for t,x in r.items():
    club=x['hit'][0]['club']
    if x['nac'][:10] in ex_set if False else False: pass
    if x['nac'][:10] in EXN or x['nome'] in ('Mazzola',) or 'Altafini' in t: continue
    yy=x['nac'][:4]
    if yy.isdigit() and not 1919<=int(yy)<=1943: continue
    k=(x['nac'][:10],club)
    if x['nac'] and k in seen: continue
    seen.add(k)
    l,tc,capsb,share=lvl_of(x,club)
    nota=[]
    if t in MAN: l,tc,n=MAN[t];nota.append(n)
    if not x['pos']: x['pos']='MED';nota.append('posición no indicada (MED por defecto)')
    if not x['hit'][0].get('pj'): nota.append('sin partidos en la ficha: titularidad media supuesta')
    else: nota.append(f"liga = total de su etapa en el club {x['hit'][0]['a']}-{x['hit'][0]['b'] if x['hit'][0]['b']<2030 else '?'}, no solo 1958")
    if '(solo año)' in x['nac'] : nota.append('solo año de nacimiento')
    nome=x['nome']
    tt=re.sub(r'\s*\(.*\)','',x.get('title',''))
    if tt and len(tt.split())<=2 and len(tt)<=len(nome) and x.get('src')!='wikidata': nome=tt
    if x['nac'][:10] in NAMES: nome=NAMES[x['nac'][:10]]
    h=x['hit'][0]
    out.append(dict(division='Campeonato Paulista' if club in PAUL else 'Campeonato Carioca',club=club,nombre=nome,pos=x['pos'],nac=x['nac'],pais='Brasil',liga=f"{h['pj']} / {h['gl']}" if h.get('pj') else '0 / 0',nivel=l,techo=tc,nombre_completo=x.get('full',''),fuente='https://pt.wikipedia.org/wiki/'+t.replace(' ','_') if x.get('src')!='wikidata' else 'Wikidata',nota='; '.join(nota)))
json.dump(out,open('out58.json','w'),ensure_ascii=False,indent=0)
