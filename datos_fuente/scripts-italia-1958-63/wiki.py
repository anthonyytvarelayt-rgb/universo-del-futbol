import json,os,re,time,subprocess,urllib.parse
C='/tmp/claude-0/-home-user/53a70bdb-ffc0-5832-9935-b9a45e8481fd/scratchpad/it/wiki.json'
cache=json.load(open(C)) if os.path.exists(C) else {}
def fetch(titles):
    q=urllib.parse.urlencode({'action':'query','prop':'revisions','rvprop':'content','rvslots':'main','format':'json','redirects':1,'titles':'|'.join(titles)})
    for k in range(5):
        r=subprocess.run(['curl','-s','--max-time','60','-A','SimFutbolResearch/1.0 (anthonyproject)','https://it.wikipedia.org/w/api.php?'+q],capture_output=True)
        try: return json.loads(r.stdout)
        except Exception: time.sleep(10*(k+1))
    return {}
def pages(titles):
    need=[t for t in titles if t not in cache]
    for i in range(0,len(need),40):
        b=need[i:i+40]; d=fetch(b); q=d.get('query',{})
        red={x['from']:x['to'] for x in q.get('redirects',[])+q.get('normalized',[])}
        txt={}
        for p in q.get('pages',{}).values():
            if 'revisions' in p: txt[p['title']]=p['revisions'][0]['slots']['main']['*']
        for t in b:
            t2=red.get(t,t); t2=red.get(t2,t2)
            cache[t]=txt.get(t2,'')
        json.dump(cache,open(C,'w')); time.sleep(3)
    return {t:cache[t] for t in titles}
def natspans(txt):
    m=re.search(r'\|\s*SquadreNazionali\s*=\s*\{\{Carriera sportivo(.*?)\n\}\}',txt,re.S)
    out=[]
    if not m: return out
    body=re.sub(r'<ref[^>]*/>','',m.group(1)); body=re.sub(r'<ref[^>]*>.*?</ref>','',body,flags=re.S)
    for y1,y2,naz,rest,a in re.findall(r'\|\s*(\d{4})(?:-(\d{4}|\s*))?\s*\|\s*\{\{Naz\|[^|]*\|([A-Z]{3})([^}]*)\}\}[^|]*\|\s*(\d+)',body):
        if re.search(r'\|\s*(B|U-?\d+|Ol|OL|U\d+)\b',rest) or 'U-' in rest: continue
        out.append(dict(desde=int(y1),hasta=int(y2) if y2.strip() else int(y1),naz=naz,caps=int(a)))
    return out
def is_footballer(txt): return bool(re.search(r'\|\s*Sport\s*=\s*Calcio|Carriera sportivo',txt))
