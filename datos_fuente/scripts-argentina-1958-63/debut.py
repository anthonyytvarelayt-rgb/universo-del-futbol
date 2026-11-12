import json,re,collections
import build as B, rate as RT
D=RT.D
NJ={1959:30,1960:30,1961:30,1962:28,1963:26}
def key(n):
  sur,_,first=n.partition(',')
  if not first: t=B.norm(n).split(); return t[0],('*',)
  f=B.norm(first).split(); s=B.norm(sur).strip().split()
  if f and f[0]==s[0]: return s[0],('*',)
  return s[-1],tuple(f)
def same(a,b):
  if a[0]!=b[0]: return False
  if '*' in a[1] or '*' in b[1]: return True
  x,y=a[1],b[1]; k=min(len(x),len(y))
  return x[:k]==y[:k] and k>0
class S(list):
  def __contains__(self,n): k=key(n); return any(same(k,o) for o in self)
  def add(self,n): self.append(key(n))
seen=S(); [seen.add(r['name']) for c in D['1958'] for r in c['rows']]
s57=S(); [s57.add(r['name']) for c in D['1957'] for r in c['rows']]
FOREIGN=re.compile(r'\((?:Montevideo|Asunción|Italia|España|Brasil|Chile|Perú|Lima|Santiago|Bogotá|Colombia|Uruguay|Paraguay|Francia|México|Bolivia)\)|Sao Paulo|São Paulo|Peñarol|Nacional|Olimpia|Cerro|Millonarios|Botafogo|Flamengo|Vasco|Palmeiras|Santos|Fluminense|Corinthians|Portuguesa|Bangu|Wanderers|Defensor|Danubio|Guaraní|Libertad|Colo Colo|Universitario|Alianza|Barcelona|Real Madrid|Milan|Juventus|Inter|Roma|Lazio|Napoli|Genoa|Torino|Atalanta|Bologna|Fiorentina|Sampdoria',re.I)
out=[]
for y in range(1959,1964):
  for c in D[str(y)]:
    club=RT.KEY2[c['key']]
    for r in c['rows']:
      n=r['name']
      if n in seen: continue
      seen.add(n)
      x=B.player(r,club,y,'Primera División',NJ[y])
      bd=R=RT.R.get(n) or {}
      proc=r.get('proc','')
      tray=bd.get('tray','')
      prev=[int(a) for a in re.findall(r'(19[2-6]\d)',tray.split('Segunda División')[0].split('Ligas Extranjeras')[0]) if int(a)<y]
      if x['pais'] not in ('Argentina',''): tipo='extranjero'
      elif n in s57 or (prev and min(prev)<1958) or (proc and FOREIGN.search(proc)): tipo='regresa'
      else: tipo='cantera'
      x.update(debut=y,tipo=tipo,temporada=str(y),procedencia=proc)
      out.append(x)
print(len(out),collections.Counter((x['debut'],x['tipo']) for x in out))
json.dump(out,open('final_deb.json','w'),ensure_ascii=False,default=str)
for x in sorted(out,key=lambda x:-x['techo'])[:20]: print(x['debut'],x['tipo'],x['nombre'],x['club'],x['nac'],x['pais'],x['liga'],x['nivel'],x['techo'],x['procedencia'])
