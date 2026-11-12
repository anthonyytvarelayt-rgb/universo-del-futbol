import re,json,html
from get import get
D1=['148-nimes', '119-reims', '140-valenciennes', '19-sochaux', '33-strasbourg', '120-saintetienne', '5-lens', '40-nice', '3565-toulouse_fc_1937', '3609-fc_nancy', '27-lyon', '106-racing_cff', '2772-limoges_fc', '168-angers', '8-monaco', '24-lille', '29-sedan', '121-ales', '10-rennes', '2-marseille']
D2=['254-red_star', '39-le_havre', '26-metz', '3543-stade_francais', '1603-forbach', '9-nantes', '3646-co_roubaixt', '3924-cap_charenton', '4003-as_troyes', '103-rouen', '3610-beziers', '3648-so_montpellier', '489-canet_roussillon', '3568-as_aixoise', '151-racing_besancon', '366-toulon', '23-bordeaux', '115-grenoble', '745-sete', '7-cannes']
out=[]
def stat(blk,lab):
    m=re.search(r"<td class='intitule'>"+lab+r"</td>\s*<td class='info-caract'>(?:<a[^>]*>)?([^<]*)",blk)
    return m.group(1).strip() if m else ""
for div,L in (("Division 1",D1),("Division 2",D2)):
  for c in L:
    h=get(f"/fr/club/equipe/{c}/1958-1959")
    title=re.search(r"<title>(.*?)</title>",h,re.S).group(1)
    parts=re.split(r"<div class='card-player module'>",h)
    # section headings positions
    for p in parts[1:]:
        # position group: find last title-position before this card
        pid,slug=re.search(r"/fr/joueur/details/(\d+)-([^'\"]+)",p).groups()
        name=html.unescape(re.search(r"<h3 class='name'><a[^>]*>(.*?)</a>",p).group(1))
        pos=html.unescape(re.search(r"<p class='position'>(.*?)</p>",p).group(1))
        nat=re.findall(r"/fr/pays/general/\d+-[^']*'>(.*?)</a>",p)
        bd=re.search(r"D.Naissance</td><td class='info-caract'>(.*?)</td>",p)
        arr=re.search(r"Arrivé le :&nbsp</span>([^<]*)",p); dep=re.search(r"parti le : </span>([^<]*)",p)
        out.append(dict(div=div,cid=c,pid=pid,name=name,pos=pos,nat=[html.unescape(x) for x in nat],bd=bd.group(1) if bd else "",
          arr=arr.group(1) if arr else "",dep=dep.group(1) if dep else "",
          mj=stat(p,"Matchs joués"),tit=stat(p,"Titularisations"),buts=stat(p,"Buts"),mins=stat(p,"Minutes jouées")))
    # coach
    co=re.findall(r"<h3 class='name'><a[^>]*>([^<]*)</a></h3><p class='position'>Entraîneur",h)
json.dump(out,open("squads.json","w"),ensure_ascii=False,indent=0)
import collections
print(len(out),collections.Counter(x['pos'] for x in out))
for x in out[:30]: print(x)
