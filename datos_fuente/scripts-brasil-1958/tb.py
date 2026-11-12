import re,csv,json
t=open('rs/tb1959.txt').read()
def cl(s):
    s=re.sub(r'\{\{[^{}]*\}\}','',s);s=re.sub(r'\[\[(?:ficheiro|Ficheiro|Imagem)[^\]]*\]\]','',s)
    s=re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]',r'\1',s);s=re.sub(r'\[\[([^\]]*)\]\]',r'\1',s);s=re.sub(r"'''?",'',s)
    return re.sub(r'\s+',' ',s).strip()
rows=[];fase='';sub=''
pos=0
for m in re.finditer(r'^(={2,4})\s*([^=]+?)\s*\1\s*$|\{\{footballbox(.*?)\n\}\}(.*?)(?=\{\{footballbox|^==|\Z)',t,re.M|re.S):
    if m.group(1):
        lv=len(m.group(1));
        if lv==2: fase=m.group(2);sub=''
        elif lv==3: grp=m.group(2);fase=fase.split(' / ')[0]+' / '+grp
        else: sub=m.group(2)
        continue
    b=m.group(3);after=m.group(4)
    f={}
    for line in re.split(r'\n\s*\|',b):
        if '=' in line: k,v=line.split('=',1);f[k.strip()]=v.strip()
    sc=re.search(r'(\d+)\s*[–-]\s*(\d+)',f.get('placar',''))
    lu=re.findall(r"\*\s*'''([^']+?):'''\s*(.*)",after)
    extra='jogo extra' if 'extra' in t[max(0,m.start()-40):m.start()].lower() else ''
    rows.append(dict(fase=fase,ronda=(sub+(' (desempate)' if extra else '')).strip(),fecha=cl(f.get('data','')),local=cl(f.get('time1','')),goles_local=sc.group(1) if sc else '',goles_visitante=sc.group(2) if sc else '',visitante=cl(f.get('time2','')),goleadores_local=cl(f.get('gols1','').replace('<br />',', ').replace('<br/>',', ')),goleadores_visitante=cl(f.get('gols2','').replace('<br />',', ').replace('<br/>',', ')),estadio=cl(f.get('estadio','')),alineacion_local=cl(lu[0][1]) if len(lu)>0 else '',alineacion_visitante=cl(lu[1][1]) if len(lu)>1 else ''))
w=csv.DictWriter(open('/mnt/project-files/datos/brasil-taca-brasil-1959-partidos.csv','w',newline=''),fieldnames=list(rows[0].keys()));w.writeheader();w.writerows(rows)
print(len(rows))
for r in rows: print(r['fase'][:30],'|',r['ronda'],'|',r['fecha'],r['local'],r['goles_local'],'-',r['goles_visitante'],r['visitante'])
