import re,html,json,glob
out={}
for f in glob.glob('/tmp/claude-0/pt/fdb/*.html'):
    h=open(f).read(); club=f.split('/')[-1][:-5]
    rows=[]
    for m in re.finditer(r"<div class='card-player module'>(.*?)(?=<div class='card-player module'>|<p class='title-position'>|$)",h,re.S):
        b=m.group(1)
        nm=re.search(r"<h3 class='name'><a[^>]*>([^<]*)</a>",b)
        if not nm: continue
        g=lambda p: (re.search(p,b,re.S).group(1).strip() if re.search(p,b,re.S) else '')
        rows.append(dict(name=html.unescape(nm.group(1)).strip(),pos=g(r"<p class='position'>([^<]*)"),country=g(r"title=\"([^\"]*)\" class='real_flag'"),arr=g(r"Arrived on :&nbsp</span>([^<]*)"),left=g(r"left on : </span>([^<]*)"),bd=g(r"B.date</td><td class='info-caract'>([^<]*)")))
    out[club]=rows
    print(club,len(rows),[r['name'] for r in rows])
json.dump(out,open('/tmp/claude-0/pt/fdb.json','w'),ensure_ascii=False,indent=0)
