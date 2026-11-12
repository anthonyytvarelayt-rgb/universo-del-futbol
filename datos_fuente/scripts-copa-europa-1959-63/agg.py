import json,collections,sys
D=sys.argv[1]
POSM={'GOALKEEPER':'POR','DEFENDER':'DEF','MIDFIELDER':'MED','FORWARD':'DEL'}
def wm(n):
    return 'POR' if n==1 else 'DEF' if n in (2,3,5) else 'MED' if n in (4,6) else 'DEL'
out={}
for y in [1959,1960,1961,1962]:
    ms=json.load(open(f'{D}/m{y}.json'))
    teams={};pl={};cm=collections.Counter()
    for m in ms:
        for s in ('homeTeam','awayTeam'):
            t=m[s]; teams[t['id']]=dict(uefa=t['translations']['displayOfficialName']['EN'],cc=t['countryCode'])
        gl=collections.Counter()
        for sc in (m.get('playerEvents') or {}).get('scorers',[]):
            if sc.get('goalType')=='SCORED': gl[sc['player']['id']]+=1
        try: L=json.load(open(f"{D}/l/{m['id']}.json"))
        except: continue
        if 'homeTeam' not in L: continue
        for s in ('homeTeam','awayTeam'):
            tid=m[s]['id']; cm[tid]+=1
            for e in L[s]['field']+L[s].get('bench',[]):
                p=e['player']; k=(tid,p['id'])
                r=pl.setdefault(k,dict(tid=tid,pid=p['id'],nombre=p['internationalName'],nac=p.get('birthDate',''),cc=p.get('countryCode',''),fp=p.get('fieldPosition',''),nums=[],pj=0,g=0,pais=p.get('translations',{}).get('countryName',{}).get('ES','')))
                r['pj']+=1; r['g']+=gl[p['id']]; r['nums'].append(e.get('jerseyNumber'))
    for r in pl.values():
        r['pos']=POSM.get(r['fp']) or wm(collections.Counter(r['nums']).most_common(1)[0][0] or 10)
        r['club_pj']=cm[r['tid']]
    out[y]=dict(teams=teams,players=list(pl.values()),club_pj=dict(cm))
json.dump(out,open(f'{D}/agg.json','w'),ensure_ascii=False)
for y in out: print(y,len(out[y]['players']))
