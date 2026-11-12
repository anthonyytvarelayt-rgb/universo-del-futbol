import os,sys,time,hashlib,subprocess
C=os.path.dirname(os.path.abspath(__file__))+"/cache/"
def get(path,wait=0.7):
    f=C+hashlib.md5(path.encode()).hexdigest()+".html"
    if os.path.exists(f) and os.path.getsize(f)>5000: return open(f,encoding='utf8',errors='replace').read()
    for i in range(4):
        r=subprocess.run(["curl","-sL","-b",C+"../jar.txt","-c",C+"../jar.txt","-m","40","-A","Mozilla/5.0 (X11; Linux x86_64) Firefox/120.0","-o",f,"-w","%{http_code}","https://www.footballdatabase.eu"+path],capture_output=True,text=True)
        time.sleep(wait)
        if r.stdout=="200" and os.path.getsize(f)>5000: return open(f,encoding='utf8',errors='replace').read()
        time.sleep(5*(i+1))
    sys.stderr.write("FAIL "+path+" "+r.stdout+"\n"); return ""
