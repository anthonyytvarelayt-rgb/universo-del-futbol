import json,math,csv
tabs={int(k):v for k,v in json.load(open('/tmp/claude-0/pt/tabs.json')).items()}
# nombres RSSSF -> nombre del simulador
N={'SL Benfica':'Benfica','Sporting CP':'Sporting de Portugal','FC Porto':'Oporto','CF Belenenses':'Belenenses','Académica':'Académica','VFC Setúbal':'Vitória de Setúbal','VSC Guimarães':'Vitória de Guimarães','FC Barreirense':'Barreirense','SC Braga':'Braga','SC Covilhã':'Covilhã','Lusitano Évora':'Lusitano de Évora','GD CUF':'CUF','SCU Torreense':'Torreense','SC Caldas':'Caldas','Atlético CP':'Atlético CP','Leixões SC':'Leixões','Boavista FC':'Boavista','SC Olhanense':'Olhanense','GD Estoril-Praia':'Estoril','Oriental':'Oriental','SC Salgueiros':'Salgueiros','O Elvas CAD':'Elvas','Lusitano VRSA':'Lusitano VRSA','Académico do Porto':'Académico do Porto','FC Famalicão':'Famalicão','Leça FC':'Leça','UD Oliveirense':'Oliveirense','AD Sanjoanense':'Sanjoanense','Casa Pia AC':'Casa Pia','SC Beira Mar':'Beira-Mar','CD Feirense':'Feirense'}
LIGA={1938:'Oporto',1939:'Oporto',1940:'Sporting de Portugal',1941:'Benfica',1942:'Benfica',1943:'Sporting de Portugal',1944:'Benfica',1945:'Belenenses',1946:'Sporting de Portugal',1947:'Sporting de Portugal',1948:'Sporting de Portugal',1949:'Benfica',1950:'Sporting de Portugal',1951:'Sporting de Portugal',1952:'Sporting de Portugal',1953:'Sporting de Portugal',1954:'Benfica',1955:'Oporto',1956:'Benfica',1957:'Sporting de Portugal'}
LIGA_EXP={1934:'Oporto',1935:'Benfica',1936:'Benfica',1937:'Benfica'}   # Campeonato da Liga experimental, pesa 0,5
CPORT={'Oporto':4,'Sporting de Portugal':4,'Benfica':3,'Belenenses':3,'Olhanense':1}   # Campeonato de Portugal 1922-38 (copa, pesa 0,4)
TACA=[(1939,'Benfica','Belenenses'),(1940,'Sporting de Portugal','Belenenses'),(1941,'Belenenses','Vitória de Guimarães'),(1942,'Benfica','Vitória de Setúbal'),(1943,'Benfica','Estoril'),(1944,'Sporting de Portugal','Olhanense'),(1945,'Sporting de Portugal','Atlético CP'),(1947,'Sporting de Portugal','Belenenses'),(1948,'Benfica','Atlético CP'),(1950,'Benfica','Académica'),(1951,'Benfica','Sporting de Portugal'),(1952,'Benfica','Oporto'),(1953,'Sporting de Portugal','Vitória de Setúbal'),(1954,'Benfica','Sporting de Portugal'),(1955,'Oporto','Torreense'),(1956,'Benfica','Covilhã'),(1957,'Oporto','Benfica')]
sc={}
def add(c,v): sc[c]=sc.get(c,0)+v
for y,c in LIGA.items(): add(c,10)
for y,c in LIGA_EXP.items(): add(c,5)
for c,n in CPORT.items(): add(c,4*0.4*n)
for y,w,r in TACA: add(w,4); add(r,1)
seas={}
for y in range(1934,1958):
    t=[N.get(x,x) for x in tabs[y]]
    if len(t)>1: add(t[1],3)
    if len(t)>2: add(t[2],1.5)
    for i,c in enumerate(t):
        seas[c]=seas.get(c,0)+1; add(c,0.5)
        if y>=1953: add(c,0.6*max(0,10-i))   # últimas 5 temporadas
pri=json.load(open('/tmp/claude-0/pt/tabs.json'))['1958']
pri=[N.get(x,x) for x in pri]
SEG=['Atlético CP','Leixões','Boavista','Oriental','Salgueiros','Sanjoanense','Oliveirense','Peniche','Portimonense','Farense','Almada','Chaves','Juventude de Évora','Montijo','Tirsense','Vila Real','Penafiel','Olhanense','Estoril','Elvas']
for c in SEG: add(c,0.3)  # está en Segunda
mx=max(sc.values())
def pres(c): return round(250+(860-250)*math.sqrt(sc.get(c,0)/mx))
if __name__=='__main__':
    for c in pri+SEG: print(c,round(sc.get(c,0),1),seas.get(c,0),pres(c))
