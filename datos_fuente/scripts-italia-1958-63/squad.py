import re,html as H
from get import get
def clubs(L,y):
    h=get('/x/startseite/wettbewerb/%s/saison_id/%d'%(L,y))
    seen=[];out=[]
    for s,i in re.findall(r'href="/([^/"]+)/startseite/verein/(\d+)/saison_id/%d"'%y,h):
        if i not in seen: seen.append(i); out.append((s,i))
    return out
def num(x):
    x=x.strip().replace("'","").replace('.','')
    return int(x) if x.isdigit() else 0
def squad(slug,cid,L,y):
    h=get('/%s/leistungsdaten/verein/%s/reldata/%s%%26%d/plus/1'%(slug,cid,L,y))
    i=h.find('class="items"'); h2=h[i:h.find('</table>',h.find('</tbody>',i))+8] if i>0 else ''
    rows=re.split(r'<tr class="(?:odd|even)">',h2)[1:]
    out=[]
    for r in rows:
        m=re.search(r'href="/([^/"]+)/profil/spieler/(\d+)">([^<]+)</a>',r)
        if not m: continue
        pos=re.search(r'</table></td>|<tr><td>([^<]+)</td></tr>',r)
        pp=re.findall(r'<tr><td>([^<]+)</td></tr>',r)
        nats=re.findall(r'class="flaggenrahmen"',r)
        natn=re.findall(r'title="([^"]+)" alt="[^"]+" class="flaggenrahmen"',r)
        tds=re.findall(r'<td[^>]*class="(?:zentriert|rechts)[^"]*"[^>]*>(.*?)</td>',r,re.S)
        tds=[re.sub('<[^>]+>','',t).strip() for t in tds]
        # tds: [num?] age, nat, squad, apps, goals, assists, y, yr, r, on, off, ppg, minutes
        out.append(dict(id=m.group(2),slug=m.group(1),name=H.unescape(m.group(3)),pos=pp[0] if pp else '',nat=natn,cells=tds))
    return out,h
