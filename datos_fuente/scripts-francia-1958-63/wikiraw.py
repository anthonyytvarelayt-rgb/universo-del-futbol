import json,sys,os,time,urllib.parse,subprocess,re
if __name__!="__main__": s=[]
else: s=json.load(open(sys.argv[1]))
def raw(t):
    for i in range(6):
        r=subprocess.run(["curl","-s","-m","30","-w","\n%{http_code}","-A","Mozilla/5.0 (compatible; SimuladorFutbol/0.1)","https://fr.wikipedia.org/w/index.php?"+urllib.parse.urlencode(dict(title=t,action="raw"))],capture_output=True,text=True)
        body,code=r.stdout.rsplit("\n",1)
        if code=="200": return body
        if code=="404": return None
        time.sleep(5*(i+1))
    return None
def ok(c,x):
    if 'Infobox Footballeur' not in c and 'Infobox Football biographie' not in c: return False
    yr=x['bd'][-4:] if x['bd'] else ''
    m=re.search(r"date de naissance\s*=\s*([^\n]*)",c)
    if not (yr and m): return True
    ys=[int(y) for y in re.findall(r"19\d\d",m.group(1))]
    return (not ys) or abs(ys[0]-int(yr))<=2
miss=[]
for x in s:
    f=f"wiki/{x['pid']}.json"
    if os.path.exists(f) or os.path.exists(f"wikimiss2/{x['pid']}"): continue
    best=None
    for t in [x['name'],x['name']+" (football)",x['name']+" (footballeur)"]:
        c=raw(t)
        for _ in range(2):
            if c and re.match(r"#(REDIRECT|REDIRECTION)",c,re.I):
                m=re.search(r"\[\[([^\]|#]+)",c); c=raw(m.group(1)) if m else None
        if c and ok(c,x):
            best=dict(title=t,content=c[:c.find('\n==')] if '\n==' in c else c[:20000]);break
        time.sleep(0.3)
    if best: json.dump(best,open(f,"w"),ensure_ascii=False)
    else: open(f"wikimiss2/{x['pid']}","w").write(x['name'])
print("done",len(os.listdir('wiki')))
