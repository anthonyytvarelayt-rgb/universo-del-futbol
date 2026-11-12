import json,re,html,math
d=json.load(open('d1hist.json'))
# clave fdb -> (nombre en el CSV, {nombre pari-et-gagne: peso})
CL={
'148-nimes':("Nîmes",{"Nîmes Olympique":1,"SC Nîmes":0.5}),
'119-reims':("Stade de Reims",{"Stade de Reims":1}),
'140-valenciennes':("Valenciennes",{"Valenciennes FC":1}),
'19-sochaux':("Sochaux",{"FC Sochaux":1}),
'33-strasbourg':("Estrasburgo",{"RC Strasbourg":1}),
'120-saintetienne':("Saint-Étienne",{"AS Saint-Etienne":1}),
'5-lens':("Lens",{"RC Lens":1}),
'40-nice':("Niza",{"OGC Nice":1}),
'3565-toulouse_fc_1937':("Toulouse",{"Toulouse FC 1937-67":1}),
'3609-fc_nancy':("Nancy",{"FC Nancy":1}),
'27-lyon':("Lyon",{"Olympique Lyonnais":1}),
'106-racing_cff':("Racing de París",{"Racing CF":1}),
'2772-limoges_fc':("Limoges",{"Limoges Football":1}),
'168-angers':("Angers",{"SCO Angers":1}),
'8-monaco':("Mónaco",{"AS Monaco":1}),
'24-lille':("Lille",{"LOSC":1,"Olympique Lillois":0.5,"SC Fivois":0.5}),
'29-sedan':("Sedan",{"CS Sedan Ardennes":1}),
'121-ales':("Alès",{"Olympique d'Alès":1}),
'10-rennes':("Rennes",{"Stade Rennais":1}),
'2-marseille':("Marsella",{"Olympique Marseille":1}),
'254-red_star':("Red Star",{"Red Star":1}),
'39-le_havre':("Le Havre",{"Le Havre AC":1}),
'26-metz':("Metz",{"FC Metz":1}),
'3543-stade_francais':("Stade Français",{"Stade Français":1}),
'1603-forbach':("Forbach",{}),
'9-nantes':("Nantes",{"FC Nantes":1}),
'3646-co_roubaixt':("Roubaix-Tourcoing",{"CO Roubaix":1,"Excelsior AC":0.5,"RC Roubaix":0.5}),
'3924-cap_charenton':("CA Paris",{"CA Paris":1}),
'4003-as_troyes':("Troyes",{"ES Troyes AC":1}),
'103-rouen':("Rouen",{"FC Rouen":1}),
'3610-beziers':("Béziers",{"AS Béziers":1}),
'3648-so_montpellier':("Montpellier",{"Montpellier HSC":1}),
'489-canet_roussillon':("Perpignan",{}),
'3568-as_aixoise':("Aix",{}),
'151-racing_besancon':("Besançon",{}),
'366-toulon':("Toulon",{"Sporting Toulon":1}),
'23-bordeaux':("Burdeos",{"Girondins Bordeaux":1}),
'115-grenoble':("Grenoble",{"Grenoble Foot":1}),
'745-sete':("Sète",{"SC Sète":1}),
'7-cannes':("Cannes",{"AS Cannes":1}),
}
def main():
    t=open('pg/coupedefrance.html').read();t=re.sub(r'<script.*?</script>',' ',t,flags=re.S);t=html.unescape(re.sub(r'<[^>]+>','|',t));t=re.sub(r'\s*\|[\s|]*','|',t)
    fin=re.findall(r'\|(19[1-5]\d)\|([^|]+)\|([^|]+)\|([^|]+)(?=\|19|\|Contact)',t)
    fin=[f for f in fin if f[0]<='1958']
    EURO={'Stade de Reims':12,'OGC Nice':2,'AS Saint-Etienne':1}  # finales/partidos de Copa de Europa hasta 1957-58
    res={}
    for k,(nm,al) in CL.items():
        S=0;det=[]
        for s,tab in d.items():
            if s>='195859': continue
            for p,n in tab:
                w=al.get(n,0)
                if not w: continue
                S+=w*0.6  # temporada en primera
                if p==1: S+=w*10
                elif p==2: S+=w*4
                elif p==3: S+=w*2
                if s>='195354':  # puestos recientes
                    S+=w*5*(len(tab)+1-p)/len(tab)
        for y,a,sc,b in fin:
            wy=0.4 if int(y)<1940 else 1
            if a in al: S+=al[a]*5*wy
            if b in al: S+=al[b]*2*wy
        for n,v in EURO.items():
            if n in al: S+=v
        res[k]=dict(club=nm,score=round(S,1))
    mx=max(r['score'] for r in res.values())
    for k,r in res.items():
        r['prestigio']=round(250+(880-250)*math.sqrt(r['score']/mx))
    json.dump(res,open('prestige.json','w'),ensure_ascii=False,indent=0)
    for k,r in sorted(res.items(),key=lambda x:-x[1]['score']): print(r)
    print(fin[:3],len(fin))
    for k,r in res.items(): r['prestigio_final']=max(r['prestigio'],330) if k in list(CL)[:20] else r['prestigio']
    json.dump(res,open('prestige.json','w'),ensure_ascii=False,indent=0)
if __name__=='__main__': main()
