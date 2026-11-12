import json,re,collections,os
def box(t):
    m=re.search(r'\{\{\s*Info/(Futebolista|Treinador|Futebol|Jogador)',t,re.I)
    if not m: return None
    i=m.start()+2;d1=0;d2=0;j=i;parts=[];cur=i
    while j<len(t):
        if t.startswith('{{',j): d1+=1;j+=2;continue
        if t.startswith('}}',j):
            if d1==0: parts.append(t[cur:j]);break
            d1-=1;j+=2;continue
        if t.startswith('[[',j): d2+=1;j+=2;continue
        if t.startswith(']]',j): d2=max(0,d2-1);j+=2;continue
        if t[j]=='|' and d1==0 and d2==0: parts.append(t[cur:j]);cur=j+1
        j+=1
    f={}
    for p in parts[1:]:
        if '=' in p:
            k,v=p.split('=',1);f[re.sub(r'[\s_]','',k.strip().lower())]=v.strip()
    for a,b in [('datadenascimento','nascimentodata'),('datadenascimento','datanascimento')]:
        if b in f and a not in f: f[a]=f[b]
    if 'nomecompleto' not in f and 'nome completo' in f: f['nomecompleto']=f['nome completo']
    if 'clube1' in f and not f.get('clubes'):
        n=1;A=[];C=[];J=[]
        while f'clube{n}' in f or f'ano{n}' in f:
            A.append(f.get(f'ano{n}','') or '?');C.append(f.get(f'clube{n}','') or '?');J.append(f"{f.get(f'jogos{n}','')} ({f.get(f'gols{n}','')})");n+=1
        f['ano']='<br>'.join(A);f['clubes']='<br>'.join(C);f['jogos(golos)']='<br>'.join(J)
        f['partidasselecao']=str(sum(int(re.search(r'\d+',f[k]).group(0)) for k in f if re.match(r'seleção-jogos\d',k) and re.search(r'\d+',f[k])))
        f['anoselecao']=' '.join(f[k] for k in f if re.match(r'seleção-ano\d',k))
        f['selecaonacional']=' '.join(f[k] for k in f if re.match(r'seleção\d',k))
    return f
def split(v): return [x.strip() for x in re.split(r'<br\s*/?>|\n',v or '')]
def clubtxt(s):
    s=re.sub(r'<ref.*?(</ref>|/>)','',s,flags=re.S)
    s=re.sub(r'\{\{\s*(?:pequeno|small)\|[^}]*\}\}|\((?:empr|loan|emp)[^)]*\)','',s,flags=re.I)
    return s
def norm_club(s):
    s=clubtxt(s)
    m=re.search(r'\{\{\s*(?:Futebol|Fut|Ícone)\s+([^}|]+)',s,re.I)
    if m: return 'T:'+m.group(1).strip()
    m=re.search(r'\[\[([^\]]+)',s)
    if m: return 'L:'+m.group(1).strip()
    return 'X:'+re.sub(r'[^\w ]','',s).strip()
def club_key(s):
    n=norm_club(s).lower()
    if '→' in s: pass
    has=lambda *w: any(x in n for x in w)
    if has('vasco') and not has('acre','vasco esporte'): return 'Vasco da Gama'
    if has('flamengo') and not has('piau','arcoverde','guarulhos','sergipe'): return 'Flamengo'
    if has('botafogo'):
        if has('ribeir','-sp','botafogo fc','botafogo futebol clube'): return 'Botafogo-SP'
        if has('paraíba','pb','bahia','-ba','salvador','jo'): return None
        return 'Botafogo'
    if has('fluminense') and not has('feira','piau','-pi','-ba'): return 'Fluminense'
    if has('santista'): return 'Portuguesa Santista'
    if has('portuguesa'):
        if has('rio de janeiro','-rj','ilha','portuguesa (rj'): return 'Portuguesa-RJ'
        if has('santos'): return 'Portuguesa Santista'
        if has('desportos','-sp','t:portuguesa','l:portuguesa','associação portuguesa de'): return 'Portuguesa'
        return None
    if has('santos') and has('santos fc','santos futebol clube','santos f.c','t:santos','l:santos|') and not has('amap','-ap'): return 'Santos'
    if n in ('l:santos','l:santos|santos'): return 'Santos'
    if has('são paulo') and has('futebol clube','fc','t:são paulo','são paulo f') and not has('rio grande','-rs','nacional'): return 'São Paulo'
    if has('corinthians') and not has('alagoano','paranaense','presidente','casa branca','santa cruz','-al','-pr'): return 'Corinthians'
    if has('palmeiras','palestra itália','palestra italia') and not has('goi','nova','-ba','-mg','minas','belo horizonte'): return 'Palmeiras'
    if has('xv de novembro','xv de pira','xv de ja','quinze de'):
        if has('piracicaba','pira'): return 'XV de Piracicaba'
        if has('jaú','jau'): return 'XV de Jaú'
        return None
    if has('noroeste'): return 'Noroeste'
    if has('taubaté','taubate'): return 'Taubaté'
    if has('nacional') and has('são paulo','-sp','nacional atlético clube (são paulo','nacional-sp'): return 'Nacional-SP'
    if has('ferroviária') and has('araraquara','esportes','t:ferroviária','l:ferroviária|','-sp'): return 'Ferroviária'
    if has('américa','america'):
        if has('rio preto','-sp','américa futebol clube (são josé','(sp)'): return 'América-SP'
        if has('rio de janeiro','-rj','(rj)','t:america','l:america football club','america fc','l:america|'): return 'America-RJ'
        return None
    if has('ponte preta'): return 'Ponte Preta'
    if has('juventus') and has('-sp','atlético juventus','mooca','t:juventus-sp'): return 'Juventus'
    if has('guarani') and not has('juazeiro','volta redonda','divin','paraguai','sobral','palhoça','asunción','club guaraní','venâncio','-ce','-mg','bagé','ba)'): return 'Guarani'
    if has('comercial') and has('são paulo') and not has('ribeir'): return 'Comercial-SP'
    if has('jabaquara'): return 'Jabaquara'
    if has('ypiranga') and has('-sp','clube atlético ypiranga','ypiranga-sp','(são paulo'): return 'Ypiranga-SP'
    if has('bangu'): return 'Bangu'
    if has('são cristóvão','sao cristovao'): return 'São Cristóvão'
    if has('madureira'): return 'Madureira'
    if has('canto do rio'): return 'Canto do Rio'
    if has('bonsucesso'): return 'Bonsucesso'
    if has('olaria'): return 'Olaria'
    return None
