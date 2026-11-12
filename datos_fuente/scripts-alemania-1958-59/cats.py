import sys,json; sys.path.insert(0,sys.argv[1]); from wk import api
out=[];c={}
while True:
    d=api(dict(action='query',list='allcategories',acprefix='Fußballspieler (',aclimit=500,**c))
    out+= [x['category'] for x in d['query']['allcategories']]
    if 'continue' not in d: break
    c={'accontinue':d['continue']['accontinue']}
json.dump(out,open('cats.json','w'),ensure_ascii=False); print(len(out))
