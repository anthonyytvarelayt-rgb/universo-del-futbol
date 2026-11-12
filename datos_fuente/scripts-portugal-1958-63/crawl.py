import wk2 as wk,json,sys,re
cats=json.load(open(sys.argv[1]))  # {club: [["pt","Categoria:..."],["en","Category:..."]]}
out={}
for club,lst in cats.items():
    out[club]={}
    for lang,cat in lst:
        try: mem=wk.catmembers(lang,cat)
        except Exception as e: print('ERR',club,cat,e); continue
        txt=wk.wikitexts(lang,mem)
        out[club][lang]=txt
        print(club,lang,len(mem),len(txt),flush=True)
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False)
