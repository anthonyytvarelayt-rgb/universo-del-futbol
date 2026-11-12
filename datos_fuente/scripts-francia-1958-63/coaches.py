from get import get;import re,html,json

D1=['148-nimes', '119-reims', '140-valenciennes', '19-sochaux', '33-strasbourg', '120-saintetienne', '5-lens', '40-nice', '3565-toulouse_fc_1937', '3609-fc_nancy', '27-lyon', '106-racing_cff', '2772-limoges_fc', '168-angers', '8-monaco', '24-lille', '29-sedan', '121-ales', '10-rennes', '2-marseille']
D2=['254-red_star', '39-le_havre', '26-metz', '3543-stade_francais', '1603-forbach', '9-nantes', '3646-co_roubaixt', '3924-cap_charenton', '4003-as_troyes', '103-rouen', '3610-beziers', '3648-so_montpellier', '489-canet_roussillon', '3568-as_aixoise', '151-racing_besancon', '366-toulon', '23-bordeaux', '115-grenoble', '745-sete', '7-cannes']

out=[]
for div,L in (("Division 1",D1),("Division 2",D2)):
  for c in L:
    h=get(f"/fr/club/equipe/{c}/1958-1959")
    i=h.find("id='clubManager'"); blk=h[i:h.find("manager-presidents",i+10) if h.find("president",i)<0 else h.find("president",i)]
    for sec in blk.split("<div class='section-manager")[1:]:
        nm=re.search(r"<p class='manager'>.*?title=\"([^\"]*)\".*?<a[^>]*>([^<]*)</a>",sec,re.S)
        if not nm: continue
        t=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',sec)))
        a=re.search(r"Arrivé le : (\S+)",t); p=re.search(r"Parti le : (\S+)",t); mt=re.search(r"(\d+) matchs",t); fo=re.search(r"Formation préférée (\S+)",t)
        out.append(dict(div=div,cid=c,name=html.unescape(nm.group(2)),nat=nm.group(1),arr=a.group(1) if a else "",dep=p.group(1) if p else "",matchs=mt.group(1) if mt else "",form=fo.group(1) if fo else ""))
json.dump(out,open('coaches.json','w'),ensure_ascii=False,indent=0)
for o in out: print(o)
