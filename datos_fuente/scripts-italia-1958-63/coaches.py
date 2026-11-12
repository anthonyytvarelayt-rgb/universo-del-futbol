import re,json
B='/tmp/claude-0/-home-user/53a70bdb-ffc0-5832-9935-b9a45e8481fd/scratchpad/it/'
MES={'set':9,'ott':10,'nov':11,'dic':12,'gen':1,'feb':2,'mar':3,'apr':4,'mag':5,'giu':6,'lug':7}
FLAG={'ITA':'Italia','HUN':'Hungría','HUN 1957-1989':'Hungría','SWE':'Suecia','YUG 1943-1992':'Yugoslavia','DNK':'Dinamarca','ARG':'Argentina','AUT':'Austria','CSK':'Checoslovaquia','FRA':'Francia','BRA 1889-1960':'Brasil','URY':'Uruguay','ENG':'Inglaterra'}
def dates(t):
    d={}
    blocks=re.split(r"'''(\d+)ª giornata'''",t)
    for k in range(1,len(blocks),2):
        n=int(blocks[k]); body=blocks[k+1]
        m=re.search(r'rowspan=\d+ \| (\d+)º? ([a-z]+)\.?\s*\|\|.*?\|\| rowspan=\d+ bgcolor=#[0-9A-F]+ \| (\d+)º? ([a-z]+)',body)
        if not m: continue
        def mk(dd,mm):
            mo=MES[mm[:3]]; y=1958 if mo>=7 else 1959
            return '%d-%02d-%02d'%(y,mo,int(dd))
        d[n]=mk(m.group(1),m.group(2))
        tot=len(blocks)//2
        d[n+tot]=mk(m.group(3),m.group(4))
    return d
def coaches(t,div,ng):
    d=dates(t)
    s=t[t.find('== Allenatori'):]; s=s[:s.find('|}')]
    rows=[r for r in s.split("\n|-\n")[1:] if r.strip().startswith("|")]
    out=[]
    for r in rows:
        ls=[x for x in r.split('\n') if x.startswith('|')]
        club=re.sub(r'<ref.*','',ls[0][1:]).strip()
        parts=ls[1][1:].split('<br />')
        for p in parts:
            m=re.search(r'\((\d+)ª(?:-(\d+)ª)?\)',p)
            a,b=(int(m.group(1)),int(m.group(2) or m.group(1))) if m else (1,ng)
            p2=re.sub(r'<small>.*?</small>','',p)
            # split people: "X e Y (D.T.)"
            ppl=[]
            for chunk in re.split(r'\s+(?:e|&)\s+(?=\{\{Bandiera)',p2):
                fl=re.findall(r'\{\{Bandiera\|([^}]+)\}\}',chunk)
                nm=re.search(r'\[\[(?:[^|\]]+\|)?([^\]]+)\]\]',chunk)
                nm=nm.group(1) if nm else re.sub(r'\{\{[^}]+\}\}','',chunk).strip()
                nm=re.sub(r'\s*\((I|II|III)\)','',nm)
                role='director técnico' if 'D.T.' in chunk else ('consejero' if 'consulente' in chunk else '')
                ppl.append((nm.strip(),' / '.join(FLAG.get(f,f) for f in fl),role))
            out.append(dict(division=div,club=club,ppl=ppl,j=(a,b),desde=d.get(a,''),hasta=d.get(b,'')))
    return out
if __name__=='__main__':
    A=coaches(open(B+'Serie_A_1958-1959.txt').read(),'Serie A',34)
    Bb=coaches(open(B+'Serie_B_1958-1959.txt').read(),'Serie B',38)
    json.dump(A+Bb,open(B+'coaches.json','w'),ensure_ascii=False,indent=0)
    for x in A+Bb: print(x)
