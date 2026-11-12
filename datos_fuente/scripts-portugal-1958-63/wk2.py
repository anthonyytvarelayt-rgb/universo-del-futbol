# Fallback sin API (la API devuelve 429): páginas de categoría en HTML y Special:Export
import re, os, time, hashlib, urllib.request, urllib.parse, html as _h, xml.etree.ElementTree as _ET
UA = "SiloResearchBot/1.0 (https://claude.ai; research)"
C = "/tmp/claude-0/pt/cache"; os.makedirs(C, exist_ok=True)

def _fetch(url, data=None):
    key = url + (urllib.parse.urlencode(data) if data else '')
    f = C + "/x" + hashlib.md5(key.encode()).hexdigest()
    if os.path.exists(f): return open(f, encoding='utf-8').read()
    time.sleep(0.5); err = None
    for i in range(6):
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode() if data else None, headers={"User-Agent": UA})
            r = urllib.request.urlopen(req, timeout=90).read().decode('utf-8', 'replace')
            open(f, "w", encoding='utf-8').write(r); return r
        except Exception as e:
            err = e
            if getattr(e, 'code', None) == 404: break
            time.sleep(5 * (i + 1))
    raise err

def catmembers(lang, cat):
    out = []; url = f"https://{lang}.wikipedia.org/wiki/" + urllib.parse.quote(cat.replace(' ', '_'))
    while url:
        h = _fetch(url)
        i = h.find('id="mw-pages"'); seg = h[i:] if i >= 0 else ''
        j = seg.find('class="printfooter"'); seg = seg[:j] if j > 0 else seg
        for m in re.finditer(r'<li[^>]*><a href="/wiki/[^"]+" title="([^"]+)"', seg):
            t = _h.unescape(m.group(1))
            if t not in out: out.append(t)
        m = re.search(r'<a href="([^"]+pagefrom=[^"]+)"[^>]*>[^<]*(?:next page|página seguinte|próxima página|seguinte)', seg)
        url = ("https://%s.wikipedia.org" % lang + _h.unescape(m.group(1))) if m else None
    return out

def wikitexts(lang, titles):
    res = {}
    for i in range(0, len(titles), 50):
        x = _fetch(f"https://{lang}.wikipedia.org/wiki/Special:Export", {"pages": "\n".join(titles[i:i + 50]), "curonly": "1", "action": "submit"})
        x = re.sub(r'xmlns="[^"]+"', '', x, count=1)
        try: root = _ET.fromstring(x)
        except Exception as e: print('xml err', e); continue
        for pg in root.findall('page'):
            t = pg.findtext('title'); tx = pg.findtext('revision/text') or ''
            if re.match(r'#(REDIRECT|REDIRECIONAMENTO)', tx, re.I): continue
            res[t] = tx
    return res
