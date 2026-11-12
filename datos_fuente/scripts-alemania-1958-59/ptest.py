import json,re,sys; sys.path.insert(0,'s'); from prose import clean,covers
T=json.load(open('txt.json'))
for t in sys.argv[1:]:
    b=clean(T[t]); print('==',t)
    for par in b.split('\n'):
        if re.search(r'N[üu]rnberg|Club',par):
            cv=covers(par)
            if cv: print('  ',cv,par[:150])
