import re,json,datetime,collections,math,unicodedata
from get import get
from squad import clubs,squad
from natk import natkader
POSM={'Goalkeeper':'POR','Sweeper':'DEF','Centre-Back':'DEF','Left-Back':'DEF','Right-Back':'DEF','Defender':'DEF',
'Defensive Midfield':'MED','Central Midfield':'MED','Midfield':'MED','Left Midfield':'MED','Right Midfield':'MED','Attacking Midfield':'DEL','Midfielder':'MED',
'Left Winger':'DEL','Right Winger':'DEL','Second Striker':'DEL','Centre-Forward':'DEL','Attack':'DEL','Forward':'DEL','Striker':'DEL'}
PAIS={'Italy':'Italia','Argentina':'Argentina','Brazil':'Brasil','Sweden':'Suecia','Uruguay':'Uruguay','Denmark':'Dinamarca','Wales':'Gales','England':'Inglaterra','Hungary':'Hungría','Austria':'Austria','France':'Francia','Spain':'España','Paraguay':'Paraguay','Peru':'Perú','Germany':'RFA','Switzerland':'Suiza','Norway':'Noruega','Netherlands':'Países Bajos','Scotland':'Escocia','Chile':'Chile','Yugoslavia':'Yugoslavia','Serbia':'Yugoslavia','Czech Republic':'Checoslovaquia','CSSR':'Checoslovaquia','Czechoslovakia':'Checoslovaquia','Belgium':'Bélgica','Poland':'Polonia','Finland':'Finlandia','Ireland':'Irlanda','Northern Ireland':'Irlanda del Norte','South Africa':'Sudáfrica','Egypt':'Egipto','Tunisia':'Túnez','Libya':'Libia','Croatia':'Yugoslavia','Slovenia':'Yugoslavia','Romania':'Rumanía','Greece':'Grecia','Malta':'Malta','Luxembourg':'Luxemburgo','Colombia':'Colombia','Mexico':'México','United States':'Estados Unidos','Venezuela':'Venezuela','Bolivia':'Bolivia','Ecuador':'Ecuador','Portugal':'Portugal','Turkey':'Turquía','Türkiye':'Turquía','Turkiye':'Turquía','DR Congo':'Congo','Cote d\'Ivoire':'Costa de Marfil','Iceland':'Islandia','Albania':'Albania','Bulgaria':'Bulgaria','Israel':'Israel','Eritrea':'Eritrea','Ethiopia':'Etiopía','Morocco':'Marruecos','Algeria':'Argelia','Montenegro':'Yugoslavia','Bosnia-Herzegovina':'Yugoslavia','Slovakia':'Checoslovaquia','Russia':'URSS','Ukraine':'URSS','Somalia':'Somalia','Canada':'Canadá','Australia':'Australia','San Marino':'San Marino','Monaco':'Mónaco','Liechtenstein':'Liechtenstein','Cyprus':'Chipre','Kosovo':'Yugoslavia','North Macedonia':'Yugoslavia'}
def norm(s):
    s=unicodedata.normalize('NFKD',s); s=''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z ]','',s.lower()).strip()
def season_rows(L,y):
    out=[]
    for slug,cid in clubs(L,y):
        rows,_=squad(slug,cid,L,y)
        for r in rows:
            c=r['cells']
            if len(c)<14 or 'Not in squad' in c[4]: apps=g=mins=0
            else:
                def n(x):
                    x=x.replace("'","").replace('.','').strip(); return int(x) if x.isdigit() else 0
                apps=n(c[4]); g=n(c[5]); mins=n(c[13])
            out.append(dict(L=L,y=y,cid=cid,slug=slug,pid=r['id'],pslug=r['slug'],name=r['name'],pos=POSM.get(r['pos'],'MED'),tmpos=r['pos'],nat=r['nat'],age=c[1] if len(c)>1 else '',apps=apps,g=g,mins=mins))
    return out
def kader_dob(slug,cid,y):
    h=get('/%s/kader/verein/%s/saison_id/%d/plus/1'%(slug,cid,y))
    i=h.find('class="items"'); seg=h[i:h.find('</table>',h.find('</tbody>',i))]
    out={}
    for r in re.split(r'<tr class="(?:odd|even)">',seg)[1:]:
        m=re.search(r'profil/spieler/(\d+)"',r)
        if not m: continue
        tds=[re.sub('<[^>]+>','',t).strip() for t in re.findall(r'<td[^>]*>(.*?)</td>',r,re.S)]
        d=[t for t in tds if re.match(r'\d\d/\d\d/\d{4}',t)]
        nat=re.findall(r'title="([^"]+)" alt="[^"]*" class="flaggenrahmen"',r)
        out[m.group(1)]=dict(dob=d[0][:10] if d else '',nat=nat)
    return out
def iso(d):
    if not d: return ''
    dd,mm,yy=d.split('/'); return '%s-%s-%s'%(yy,mm,dd)
_ITA=None
def italy_caps():
    global _ITA
    if _ITA: return _ITA
    D={}
    for y in range(1940,1976):
        try: k=natkader('3376','italien',y)
        except Exception: continue
        for pid,v in k.items():
            tds=v['tds']; caps=0
            # columna partidos internacionales: número antes de goles y fecha debut
            for j,t in enumerate(tds):
                if re.match(r'\d\d/\d\d/\d{4}',t) and j>=2 and j!=([i for i,x in enumerate(tds) if re.match(r'\d\d/\d\d/\d{4}',x)] or [0])[0]:
                    try: caps=int(tds[j-2]) if tds[j-2].isdigit() else 0
                    except: pass
            e=D.setdefault(pid,dict(name=v['name'].strip(),caps=caps,years=set()))
            e['caps']=max(e['caps'],caps); e['years'].add(y)
    _ITA=D; return D
