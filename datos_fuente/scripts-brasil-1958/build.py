import json,re,collections,os,csv,datetime
from parse import box,split,norm_club,club_key
PAUL=["Santos","São Paulo","Corinthians","Palmeiras","XV de Piracicaba","Portuguesa","Noroeste","Botafogo-SP","Taubaté","Nacional-SP","Ferroviária","Portuguesa Santista","América-SP","Ponte Preta","Juventus","Guarani","Comercial-SP","XV de Jaú","Jabaquara","Ypiranga-SP"]
CAR=["Vasco da Gama","Flamengo","Botafogo","Fluminense","America-RJ","Bangu","Portuguesa-RJ","São Cristóvão","Madureira","Canto do Rio","Bonsucesso","Olaria"]
A={}
def al(k,*xs):
    for x in xs: A[x]=k
al("Santos","T:Santos","L:Santos FC","L:Santos Futebol Clube")
al("São Paulo","T:São Paulo","L:São Paulo Futebol Clube","T:São Paulo FC","L:São Paulo FC")
al("Corinthians","T:Corinthians","L:Sport Club Corinthians Paulista")
al("Palmeiras","T:Palmeiras","L:Sociedade Esportiva Palmeiras","L:SE Palmeiras")
al("XV de Piracicaba","T:XV de Piracicaba","L:Esporte Clube XV de Novembro (Piracicaba)","L:XV de Piracicaba")
al("Portuguesa","T:Portuguesa","T:Portuguesa-SP","L:Associação Portuguesa de Desportos")
al("Noroeste","T:Noroeste","L:Esporte Clube Noroeste")
al("Botafogo-SP","T:Botafogo-SP","L:Botafogo Futebol Clube (Ribeirão Preto)")
al("Taubaté","T:Taubaté","L:Esporte Clube Taubaté")
al("Nacional-SP","T:Nacional-SP","L:Nacional Atlético Clube (São Paulo)")
al("Ferroviária","T:Ferroviária","L:Associação Ferroviária de Esportes")
al("Portuguesa Santista","T:Portuguesa Santista","L:Associação Atlética Portuguesa","L:Portuguesa Santista","L:Associação Atlética Portuguesa (Santos)")
al("América-SP","T:América-SP","L:América Futebol Clube (São José do Rio Preto)")
al("Ponte Preta","T:Ponte Preta","L:Associação Atlética Ponte Preta")
al("Juventus","T:Juventus-SP","L:Clube Atlético Juventus")
al("Guarani","T:Guarani","L:Guarani Futebol Clube")
al("Comercial-SP","T:Comercial de São Paulo","L:Comercial Futebol Clube (São Paulo)")
al("XV de Jaú","T:XV de Jaú","L:Esporte Clube XV de Novembro (Jaú)","L:XV de Jaú")
al("Jabaquara","T:Jabaquara","L:Jabaquara Atlético Clube")
al("Ypiranga-SP","T:Ypiranga-SP","L:Clube Atlético Ypiranga")
al("Vasco da Gama","T:Vasco","T:Vasco da Gama","L:Club de Regatas Vasco da Gama")
al("Flamengo","T:Flamengo","L:Clube de Regatas do Flamengo")
al("Botafogo","T:Botafogo","L:Botafogo de Futebol e Regatas")
al("Fluminense","T:Fluminense","L:Fluminense Football Club")
al("America-RJ","T:America","T:América-RJ","T:America-RJ","L:America Football Club (Rio de Janeiro)")
al("Bangu","T:Bangu","L:Bangu Atlético Clube")
al("Portuguesa-RJ","T:Portuguesa-RJ","L:Associação Atlética Portuguesa (Rio de Janeiro)")
al("São Cristóvão","T:São Cristóvão-RJ","T:São Cristóvão","L:São Cristóvão de Futebol e Regatas")
al("Madureira","T:Madureira","L:Madureira Esporte Clube")
al("Canto do Rio","T:Canto do Rio","L:Canto do Rio Foot-Ball Club","L:Canto do Rio Football Club")
al("Bonsucesso","T:Bonsucesso","L:Bonsucesso Futebol Clube")
al("Olaria","T:Olaria","L:Olaria Atlético Clube")
MES={'janeiro':1,'fevereiro':2,'março':3,'abril':4,'maio':5,'junho':6,'julho':7,'agosto':8,'setembro':9,'outubro':10,'novembro':11,'dezembro':12}
def clean(s): return re.sub(r'\{\{0\|[^}]*\}\}','',re.sub(r'<ref.*?(</ref>|/>)','',s or '',flags=re.S))
def birth(f,w):
    v=f.get('datadenascimento') or f.get('datanascimento') or f.get('nascimento') or ''
    m=re.search(r'\{\{\s*(dni|dnibr|dnfi|nascimento|dnf)\s*\|(?:lang=\w+\|)?\s*(\d{1,2})\s*\|\s*(\d{1,2})\s*\|\s*(\d{4})',v,re.I)
    if m: return f"{m.group(4)}-{int(m.group(3)):02d}-{int(m.group(2)):02d}"
    m=re.search(r'\{\{\s*(data de nascimento e idade|dnai|birth date and age|birth date|data de nascimento)\s*\|(?:[a-z]+=\w+\|)?\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})',v,re.I)
    if m: return f"{m.group(2)}-{int(m.group(3)):02d}-{int(m.group(4)):02d}"
    m=re.search(r'(\d{1,2})º? de \[?\[?(\w+)\]?\]? de \[?\[?(\d{4})',v+' '+w[:3000])
    if m and m.group(2).lower() in MES and 1900<int(m.group(3))<1950: return f"{m.group(3)}-{MES[m.group(2).lower()]:02d}-{int(m.group(1)):02d}"
    m=re.search(r'(19[0-4]\d)',v)
    if m: return m.group(1)+" (solo año)"
    return ""
def pos(f):
    p=clean(f.get('posição') or f.get('posicao') or '').lower()
    p=re.sub(r'\[\[[^\]|]*\|','',p)
    for k,v in [('goleiro','POR'),('guarda-redes','POR'),('arqueiro','POR'),('zagueiro','DEF'),('lateral','DEF'),('beque','DEF'),('defens','DEF'),('quarto','DEF'),('volante','MED'),('meio','MED'),('meia','MED'),('médio','MED'),('medio','MED'),('armador','MED'),('centromédio','MED'),('half','MED'),('atacante','DEL'),('ponta','DEL'),('centroavante','DEL'),('avante','DEL'),('ponteiro','DEL'),('extremo','DEL'),('ataque','DEL'),('centro-avante','DEL')]:
        if k in p: return v
    return ''
def yrs(s):
    s=clean(s); ys=re.findall(r'(1[89]\d\d|20\d\d)',s)
    if not ys: return None
    a=int(ys[0]); b=int(ys[-1]) if len(ys)>1 else (a if not re.search(r'[–-]\s*$',s.strip()) else 2030)
    m=re.match(r'.*?(1[89]\d\d)\s*[–-]\s*(\d{2})(?!\d)',s)
    if m and len(ys)==1: b=int(m.group(1)[:2]+m.group(2))
    return a,b
rows={}
seen=set()
if __name__=="__main__":
  pass
for d in [json.load(open('allpages.json'))]:
    for t,w in d.items():
        if t in seen: continue
        seen.add(t)
        f=box(w)
        if not f: continue
        anos=split(f.get('ano') or f.get('anos') or f.get('anoclubes') or '')
        cls=split(f.get('clubes') or f.get('clube') or '')
        jg=split(f.get('jogos(golos)') or f.get('jogos (golos)') or f.get('jogos(gols)') or f.get('partidas(golos)') or '')
        anos=[a for a in anos if a]; cls=[c for c in cls if c]
        ent=[]
        for i,c in enumerate(cls):
            if i>=len(anos): break
            y=yrs(anos[i]); k=club_key(c)
            if not y: continue
            g=clean(jg[i]) if i<len(jg) else ''
            m=re.search(r'(\d+)\s*\(\s*(\d+)',g)
            ent.append(dict(club=k,raw=norm_club(c),a=y[0],b=y[1],pj=int(m.group(1)) if m else None,gl=int(m.group(2)) if m else None,i=i))
        hit=[e for e in ent if e['club'] and e['a']<=1958<=e['b']]
        if len(hit)>1:
            old=[e for e in hit if e['a']<1958]
            hit=[old[-1] if old else hit[0]]
        if not hit: continue
        nome=re.sub(r"'''?|\[\[|\]\]",'',clean(f.get('nome','')).split('<')[0]).strip() or re.sub(r'\s*\(.*\)','',t)
        caps=re.search(r'(\d+)',clean(f.get('partidasselecao','') or f.get('jogosselecao','') or ''))
        sel=clean(f.get('selecaonacional',''))
        ys=re.findall(r'(19\d\d)',clean(f.get('anoselecao','')))
        rows[t]=dict(title=t,nome=nome,full=re.sub(r"\[\[|\]\]|'''?",'',clean(f.get('nomecompleto',''))).strip(),nac=birth(f,w),pos=pos(f),ent=ent,hit=hit,caps=int(caps.group(1)) if caps else 0,sel=sel,selys=ys)
json.dump(rows,open('rows58.json','w'),ensure_ascii=False,indent=0)
c=collections.Counter(h['club'] for r in rows.values() for h in r['hit'][-1:])
print(len(rows));print(c)
print(sum(1 for r in rows.values() if not r['nac']),sum(1 for r in rows.values() if not r['pos']))
