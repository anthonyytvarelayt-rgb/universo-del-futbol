import json, re, sys, csv
sys.path.insert(0, '/tmp/claude-0/pt/scripts')
from parse import infobox, clean, yrs
from selec import KEY
W = json.load(open('/tmp/claude-0/pt/wiki3.json'))
res = {}
for club, L in W.items():
    for lang, d in L.items():
        for title, t in d.items():
            f = infobox(t)
            if not f: continue
            st = []
            if lang == 'en':
                for n in range(1, 40):
                    for yk, ck in ((f'manager_years{n}', f'manager_clubs{n}'), (f'manageryears{n}', f'managerclubs{n}')):
                        if ck in f: st.append((yrs(f.get(yk, '')), clean(f[ck])))
            else:
                a = re.split(r'<br\s*/?>', f.get('treinadoranos', '') or f.get('anostreinador', ''))
                c = re.split(r'<br\s*/?>', f.get('treinadorclubes', '') or f.get('clubestreinador', ''))
                st = [(yrs(x), clean(y)) for x, y in zip(a, c)]
            for y, c in st:
                if not y or not re.search(KEY[club], c): continue
                if (y[0] <= 1958 and y[1] >= 1959) or y[0] in (1958,) or (y[0]==1959 and y[1]==1959):
                    nm = re.sub(r'\s*\(.*\)$', '', title)
                    lead = t[t.find("'''"):t.find("'''") + 500]
                    res.setdefault(club, {})[nm] = dict(y=y, club=c, lead=re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', lead)[:200])
for c, v in res.items():
    for n, x in v.items(): print(c, '|', n, x['y'], '|', x['lead'][:150].replace('\n', ' '))
