from wk import *
clubs={"Santos":"Santos Futebol Clube","São Paulo":"São Paulo Futebol Clube","Corinthians":"Sport Club Corinthians Paulista","Palmeiras":"Sociedade Esportiva Palmeiras","XV de Piracicaba":"Esporte Clube XV de Novembro (Piracicaba)","Portuguesa":"Associação Portuguesa de Desportos","Noroeste":"Esporte Clube Noroeste","Botafogo-SP":"Botafogo Futebol Clube (Ribeirão Preto)","Taubaté":"Esporte Clube Taubaté","Nacional-SP":"Nacional Atlético Clube (São Paulo)","Ferroviária":"Associação Ferroviária de Esportes","Portuguesa Santista":"Associação Atlética Portuguesa (Santos)","América-SP":"América Futebol Clube (São José do Rio Preto)","Ponte Preta":"Associação Atlética Ponte Preta","Juventus":"Clube Atlético Juventus","Guarani":"Guarani Futebol Clube","Comercial-SP":"Comercial Futebol Clube (São Paulo)","XV de Jaú":"Esporte Clube XV de Novembro (Jaú)","Jabaquara":"Jabaquara Atlético Clube","Ypiranga-SP":"Clube Atlético Ypiranga",
"Vasco da Gama":"Club de Regatas Vasco da Gama","Flamengo":"Clube de Regatas do Flamengo","Botafogo":"Botafogo de Futebol e Regatas","Fluminense":"Fluminense Football Club","America-RJ":"America Football Club (Rio de Janeiro)","Bangu":"Bangu Atlético Clube","Portuguesa-RJ":"Associação Atlética Portuguesa (Rio de Janeiro)","São Cristóvão":"São Cristóvão de Futebol e Regatas","Madureira":"Madureira Esporte Clube","Canto do Rio":"Canto do Rio Foot-Ball Club","Bonsucesso":"Bonsucesso Futebol Clube","Olaria":"Olaria Atlético Clube"}
out={}
for k,t in clubs.items():
    d=api(action='query',titles=t,prop='categories',cllimit=500,redirects=1)
    pg=list(d['query']['pages'].values())[0]
    real=pg.get('title')
    cs=[c['title'] for c in pg.get('categories',[])]
    # try candidate
    cand=None
    for pre in ['Futebolistas do ','Futebolistas da ','Futebolistas de ']:
        c='Categoria:'+pre+real
        dd=api(action='query',list='categorymembers',cmtitle=c,cmlimit=1)
        if dd['query']['categorymembers']: cand=c;break
    out[k]={'art':real,'cat':cand}
    print(k,real,cand,flush=True); time.sleep(0.5)
json.dump(out,open('cats.json','w'),ensure_ascii=False,indent=1)
