import csv
D="/mnt/project-files/datos/"
REN={'César Héctor Gonzalès':'César Gonzales','Hector De Bourgoing':'Héctor de Bourgoing','Jacques Koczur Ferry':'Koczur Ferry','Oswaldo Dandru':'Osvaldo Dandru','René-Jean Jacquet':'René Jacquet','Claude Dubaële':'Claude Dubaele','Yvan Garofalo':'Yvon Garofalo','Vincent Scannella':'Vincent Scanella','Szkudlapski Théo':'Théodore Skudlapski','Marcel Nowak':'Marcel Novak','Karimou Djibrill':'Djibrill Karimou'}
for f in ['francia-1958-59-plantillas.csv','francia-1958-59-plantillas-detalle.csv','francia-debutantes-1959-63.csv']:
    rows=list(csv.DictReader(open(D+f))); cols=list(rows[0])
    for r in rows:
        if r['nombre'] in REN: r['nombre']=REN[r['nombre']]
    if f.startswith('francia-deb') and not any(r['nombre']=='François Soltys' for r in rows):
        c=[x for x in csv.DictReader(open(D+'copa-europa-1959-63-plantillas.csv')) if x['nombre']=='François Soltys'][0]
        rows.append(dict(division='Division 1',club='Stade de Reims',nombre='François Soltys',pos=c['pos'],nac=c['nac'],pais='Francia',liga='',nivel=c['nivel'],techo=c['techo'],debut=1962,tipo='cantera',temporada='1962-63',intern_antes=c['intern_antes'],intern_total=c['intern_total'],fuente='copa-europa-1959-63-plantillas.csv',nota='añadido desde el CSV de Copa de Europa 1959-63 (mismos valores); no estaba en Wikidata'))
        rows.sort(key=lambda r:(r['temporada'],r['division'],r['club'],-int(r['nivel'])))
    w=csv.DictWriter(open(D+f,'w',newline=''),fieldnames=cols);w.writeheader();w.writerows(rows)
print("ok")
