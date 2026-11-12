import sys,os,time,hashlib,subprocess
C='/tmp/claude-0/-home-user/53a70bdb-ffc0-5832-9935-b9a45e8481fd/scratchpad/it/tm'
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
def get(path,pause=1.2):
    url=path if path.startswith('http') else 'https://www.transfermarkt.com'+path
    f=os.path.join(C,hashlib.md5(url.encode()).hexdigest()+'.html')
    if os.path.exists(f) and os.path.getsize(f)>5000: return open(f,encoding='utf-8',errors='ignore').read()
    for k in range(4):
        r=subprocess.run(['curl','-s','-L','--max-time','40','-A',UA,'-H','Accept-Language: en',url],capture_output=True)
        h=r.stdout.decode('utf-8','ignore')
        if len(h)>5000:
            open(f,'w').write(h); time.sleep(pause); return h
        time.sleep(5*(k+1))
    return ''
