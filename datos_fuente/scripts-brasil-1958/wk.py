import json,time,urllib.request,urllib.parse,sys,os
UA='BrasilSimBot/0.1 (football history research; low volume)'
def get(url,params=None,tries=10):
    if params: url+='?'+urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=40)
            return r.read().decode('utf-8')
        except Exception as e:
            time.sleep(5*(i+1))
    raise Exception('fail '+url)
def api(lang='pt',**p):
    p['format']='json'; return json.loads(get(f'https://{lang}.wikipedia.org/w/api.php',p))
