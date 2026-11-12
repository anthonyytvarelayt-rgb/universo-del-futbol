import sys,json; sys.path.insert(0,sys.argv[1]); from wk import api
for q in sys.argv[2:]:
    d=api(dict(action='query',list='search',srsearch='Fußballspieler '+q,srnamespace=14,srlimit=4))
    print(q,'=>',[x['title'] for x in d['query']['search']])
