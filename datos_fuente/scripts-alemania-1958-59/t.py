import sys,json; sys.path.insert(0,sys.argv[1]); from wk import api
for q in sys.argv[2:]:
    d=api(dict(action='query',list='search',srsearch=q,srlimit=5,srprop=''))
    print(q[:80],d['query'].get('searchinfo'),[x['title'] for x in d['query']['search']])
