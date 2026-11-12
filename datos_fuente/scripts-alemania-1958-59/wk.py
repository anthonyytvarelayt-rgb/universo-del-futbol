import json,time,urllib.request,urllib.parse,sys
UA='SimuladorFutbolHistorico/1.0 (https://claude.ai; research bot) python-urllib'
def api(params,lang='de'):
    params=dict(params,format='json',formatversion='2')
    url=f'https://{lang}.wikipedia.org/w/api.php?'+urllib.parse.urlencode(params)
    for k in range(6):
        try:
            r=urllib.request.Request(url,headers={'User-Agent':UA})
            d=json.load(urllib.request.urlopen(r,timeout=60)); time.sleep(1.0); return d
        except Exception as e:
            print('retry',k,e,file=sys.stderr); time.sleep(5*(k+1))
    raise SystemExit('fail')
