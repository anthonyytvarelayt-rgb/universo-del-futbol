import re
from get import get
def natkader(nid,slug,y):
    h=get('/%s/kader/verein/%s/saison_id/%d/plus/1'%(slug,nid,y))
    i=h.find('class="items"'); seg=h[i:h.find('</table>',h.find('</tbody>',i))]
    out={}
    for r in re.split(r'<tr class="(?:odd|even)">',seg)[1:]:
        m=re.search(r'href="/[^/"]+/profil/spieler/(\d+)">([^<]+)</a>',r)
        if not m: continue
        tds=[re.sub('<[^>]+>','',t).strip() for t in re.findall(r'<td[^>]*>(.*?)</td>',r,re.S)]
        dates=[t for t in tds if re.match(r'\d\d/\d\d/\d{4}',t)]
        nums=[t for t in tds if re.fullmatch(r'\d+|-',t)]
        out[m.group(1)]=dict(name=m.group(2),tds=tds,dates=dates)
    return out
