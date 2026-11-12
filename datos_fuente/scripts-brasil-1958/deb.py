import json,re,csv,collections
from parse import box,split,club_key
from build import yrs,birth,pos as P
from rate import *
allp=json.load(open('allpages.json'))
o58=json.load(open('out58.json'))
in58=set(x['fuente'].split('/wiki/')[-1].replace('_',' ') for x in o58)
# clubes por año (Paulista/Carioca) 1959-63
PAUL_Y={1959:PAUL[:]+['Comercial-RP'],1960:None}
rows=[];seen=set()
for t,w in allp.items():
    f=box(w)
    if not f: continue
    nac=birth(f,w)
    if t in in58 or nac[:10] in EXN: continue
    yy=nac[:4]
    if not yy.isdigit() or not 1925<=int(yy)<=1947: continue
    an=[a for a in split(f.get('ano',''))if a];cl=[c for c in split(f.get('clubes',''))if c]
    jg=split(f.get('jogos(golos)',''))
    ent=[]
    for i,(a,c) in enumerate(zip(an,cl)):
        y=yrs(a)
        if not y: continue
        g=re.sub(r'\{\{0\|[^}]*\}\}','',jg[i]) if i<len(jg) else ''
        m=re.search(r'(\d+)\s*\(\s*(\d+)',g)
        ent.append(dict(club=club_key(c),raw=c,a=y[0],b=y[1],pj=int(m.group(1)) if m else None,gl=int(m.group(2)) if m else None))
    if not ent: continue
    first=[e for e in ent if e['club'] and 1959<=e['a']<=1963]
    if not first: continue
    e=first[0]
    if (nac[:10],e['club']) in seen: continue
    seen.add((nac[:10],e['club']))
    prev=[x for x in ent if x['a']<e['a']]
    if not prev: tipo='cantera'
    elif any(x['club'] for x in prev): tipo='regresa'
    elif any(re.search(r'Peñarol|Nacional|River|Boca|Uruguai|Argentin|Paraguai|Olimpia|Cerro|Racing|Independiente|San Lorenzo|Huracán|Lanús|Colo-Colo|Universitario|Alianza|Sporting Cristal|Millonarios',x['raw']) for x in prev): tipo='extranjero'
    else: tipo='llega'
    nat=re.sub(r'\{\{|\}\}|\[\[|\]\]','',f.get('nacionalidade','')+' '+f.get('paisnatal',''))
    pais='Brasil'
    for k,v in [('Argentin','Argentina'),('ARG','Argentina'),('Urugua','Uruguay'),('URU','Uruguay'),('Paragua','Paraguay'),('PAR','Paraguay'),('Peru','Perú'),('Chile','Chile')]:
        if k in nat and 'BRA' not in nat and 'Brasil' not in nat: pais=v;tipo='extranjero';break
    caps=re.search(r'(\d+)',re.sub(r'\{\{0\|[^}]*\}\}','',f.get('partidasselecao','')))
    x=dict(title=t,nome=re.sub(r'\s*\(.*\)','',t),nac=nac,pos=P(f) or 'MED',ent=ent,hit=[e],caps=int(caps.group(1)) if caps else 0,selys=re.findall(r'19\d\d',f.get('anoselecao','')))
    lv,tc,_,_=lvl_of(x,e['club'])
    # nivel al debutar: edad en el año de debut
    a=e['a']-int(yy)
    if a<20: lv-=20
    nome=x['nome']
    nf=re.sub(r"'''?|\[\[|\]\]",'',f.get('nome','')).split('<')[0].strip()
    if nf and len(nf)<len(nome): nome=nf
    if nac[:10] in NAMES: nome=NAMES[nac[:10]]
    rows.append(dict(division='Campeonato Paulista' if e['club'] in PAUL else 'Campeonato Carioca',club=e['club'],nombre=nome,pos=x['pos'],nac=nac,pais=pais,liga=f"{e['pj']} / {e['gl']}" if e.get('pj') else '0 / 0',nivel=lv,techo=max(tc,lv),debut=e['a'],tipo=tipo,fuente='https://pt.wikipedia.org/wiki/'+t.replace(' ','_')))
TMAN={'Jairzinho':935,'Gérson (futebolista)':920,'Carlos Alberto Torres':915,'Ademir da Guia':885,'Roberto Dias':860,'Djalma Dias':860,'Rildo':830,'Joel Camargo':840,'Paulo Henrique (futebolista, 1943)':820}
for r in rows:
    k=r['fuente'].split('/wiki/')[-1].replace('_',' ')
    if k in TMAN: r['techo']=TMAN[k]; r['nota']='techo a mano por su carrera real'
rows.sort(key=lambda r:(r['debut'],r['division'],r['club'],-r['nivel']))
json.dump(rows,open('deb.json','w'),ensure_ascii=False,indent=0)
print(len(rows),collections.Counter(r['debut'] for r in rows),collections.Counter(r['tipo'] for r in rows))
for r in sorted(rows,key=lambda r:-r['techo'])[:30]: print(r['debut'],r['club'],r['nombre'],r['nac'],r['tipo'],r['nivel'],r['techo'])
