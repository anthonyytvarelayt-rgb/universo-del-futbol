import re
from get import get
def table(L,y):
    h=get('/x/tabelle/wettbewerb/%s/saison_id/%d'%(L,y))
    i=h.find('class="items"')
    if i<0: return []
    seg=h[i:h.find('</table>',i)]
    out=[]
    for r in re.split(r'<tr',seg)[2:]:
        p=re.search(r'rechts hauptlink">\s*(\d+)',r) or re.search(r'>\s*(\d+)\s*<',r)
        c=re.search(r'href="/([^/]+)/spielplan/verein/(\d+)/saison_id/\d+"[^>]*>([^<]+)<',r)
        if p and c: out.append((int(p.group(1)),c.group(2),c.group(3)))
    return out
if __name__=='__main__':
    for y in (1929,1935,1943,1944,1945,1946,1957):
        for L in ('IT1','IT2'):
            t=table(L,y); print(L,y,len(t),t[:3])
