import json,csv,re
OUT='/mnt/project-files/datos/'
PR=json.load(open('pres.json'))
C={# club: (division, ciudad, estadio, color1, color2, duda)
'Argentinos Juniors':('Primera División','Buenos Aires (La Paternal)','Estadio de Argentinos Juniors (Boyacá y Juan Agustín García)','#E30613','#FFFFFF',''),
'Atlanta':('Primera División','Buenos Aires (Villa Crespo)','Estadio de Atlanta (en obras desde agosto de 1958; hoy Don León Kolbowski)','#003DA5','#FFD100','sin estadio propio terminado en 1958'),
'Boca Juniors':('Primera División','Buenos Aires (La Boca)','La Bombonera','#003C82','#FFD200',''),
'Central Córdoba':('Primera División','Rosario','Estadio Gabino Sosa','#002B7F','#FFFFFF','en 1958 jugó varios partidos de local en la cancha de Newell\'s'),
'Estudiantes de La Plata':('Primera División','La Plata','Estadio de 1 y 57','#D50032','#FFFFFF',''),
'Gimnasia y Esgrima La Plata':('Primera División','La Plata','Estadio del Bosque','#002B5C','#FFFFFF',''),
'Huracán':('Primera División','Buenos Aires (Parque Patricios)','Estadio Tomás Adolfo Ducó','#FFFFFF','#D50032',''),
'Independiente':('Primera División','Avellaneda','Estadio de la Doble Visera','#D50032','#FFFFFF',''),
'Lanús':('Primera División','Lanús','Estadio de Lanús (La Fortaleza)','#7A1F3D','#FFFFFF',''),
"Newell's Old Boys":('Primera División','Rosario','Estadio del Parque Independencia','#D50032','#000000',''),
'Racing Club':('Primera División','Avellaneda','Estadio Presidente Perón (El Cilindro)','#6CACE4','#FFFFFF',''),
'River Plate':('Primera División','Buenos Aires (Núñez)','Estadio Monumental','#FFFFFF','#D50032',''),
'Rosario Central':('Primera División','Rosario','Estadio de Arroyito','#003DA5','#FFD100',''),
'San Lorenzo':('Primera División','Buenos Aires (Boedo)','Gasómetro de Avenida La Plata','#002B7F','#D50032',''),
'Tigre':('Primera División','Victoria (San Fernando)','Estadio de Tigre (Victoria)','#002B7F','#D50032',''),
'Vélez Sarsfield':('Primera División','Buenos Aires (Liniers)','Estadio de Vélez Sarsfield (Liniers)','#FFFFFF','#003DA5',''),
'Ferro Carril Oeste':('Primera B','Buenos Aires (Caballito)','Estadio de Ferro (Caballito)','#00843D','#FFFFFF',''),
'Nueva Chicago':('Primera B','Buenos Aires (Mataderos)','Estadio de Nueva Chicago (Mataderos)','#00843D','#000000',''),
'Chacarita Juniors':('Primera B','San Martín','Estadio de Chacarita (San Martín)','#D50032','#000000','camiseta roja, negra y blanca'),
'Los Andes':('Primera B','Lomas de Zamora','Estadio Eduardo Gallardón','#D50032','#FFFFFF',''),
'Quilmes':('Primera B','Quilmes','Estadio de Quilmes (Guido y Sarmiento)','#FFFFFF','#002B5C',''),
'Sarmiento de Junín':('Primera B','Junín','Estadio de Sarmiento (Junín)','#00843D','#FFFFFF',''),
'All Boys':('Primera B','Buenos Aires (Floresta)','Estadio de All Boys (Floresta)','#FFFFFF','#000000',''),
'Platense':('Primera B','Buenos Aires (Saavedra)','Estadio de Manuela Pedraza','#FFFFFF','#6B3E26',''),
'Unión de Santa Fe':('Primera B','Santa Fe','Estadio 15 de Abril','#D50032','#FFFFFF',''),
'Dock Sud':('Primera B','Dock Sud (Avellaneda)','Estadio de los Inmigrantes','#002B7F','#6CACE4','colores dudosos'),
'El Porvenir':('Primera B','Gerli','Estadio de El Porvenir (Gerli)','#FFFFFF','#000000','colores dudosos'),
'Almagro':('Primera B','José Ingenieros','Estadio de Almagro','#002B5C','#000000','tricolor azul, negro y blanco'),
'Banfield':('Primera B','Banfield','Estadio Florencio Sola','#00843D','#FFFFFF',''),
'Excursionistas':('Primera B','Buenos Aires (Belgrano)','Estadio de Excursionistas (Bajo Belgrano)','#00843D','#FFFFFF',''),
'Temperley':('Primera B','Temperley','Estadio Alfredo Beranger','#6CACE4','#FFFFFF',''),
'Colón':('Primera B','Santa Fe','Estadio Brigadier López','#D50032','#000000',''),
'Talleres de Remedios de Escalada':('Primera B','Remedios de Escalada','Estadio de Talleres (Remedios de Escalada)','#D50032','#FFFFFF','colores dudosos'),
'San Telmo':('Primera B','Isla Maciel','Estadio de San Telmo (Isla Maciel)','#6CACE4','#FFFFFF','colores dudosos'),
}
with open(OUT+'argentina-clubes-1958-59.csv','w',newline='',encoding='utf-8') as f:
  w=csv.writer(f); w.writerow(['club','ciudad','estadio','color1','color2','prestigio','division','titulos_pro_1931_57','titulos_amateur','titulos_regionales','podios_1931_57','temporadas_primera_1931_57','puntos_recientes_1953_57','nota'])
  for c,(d,ci,es,c1,c2,n) in C.items():
    p=PR[c]
    w.writerow([c,ci,es,c1,c2,p['prestigio'],d,p['pro'],p['amat'],p['regional'],p['podios'],p['temporadas_primera_1931_57'],p['recientes_1953_57'],n])
# ascensos (año = temporada en que ya juega en Primera)
A=[(1959,'Ferro Carril Oeste','campeón de Primera B 1958'),(1960,'Chacarita Juniors','campeón de Primera B 1959'),(1961,'Los Andes','campeón de Primera B 1960'),(1962,'Quilmes','campeón de Primera B 1961'),(1963,'Banfield','campeón de Primera B 1962')]
with open(OUT+'argentina-ascensos-1959-63.csv','w',newline='',encoding='utf-8') as f:
  w=csv.writer(f); w.writerow(['temporada','club','ciudad','estadio','color1','color2','prestigio','nota'])
  for y,c,n in A:
    d,ci,es,c1,c2,_=C[c]; w.writerow([y,c,ci,es,c1,c2,PR[c]['prestigio'],n+'; sube 1 por año (Wikipedia, Primera B '+str(y-1)+')'])
Dd=[(1958,'Tigre','último en promedios'),(1959,'Central Córdoba','último en promedios'),(1960,"Newell's Old Boys",'último en promedios (vuelve en 1964)'),(1961,'Lanús','descenso por promedios; bajaron 2 y subió 1: 1962 se juega con 15'),(1961,'Los Andes','descenso por promedios'),(1962,'Quilmes','descenso por promedios; bajaron 2 y subió 1: 1963 se juega con 14'),(1962,'Ferro Carril Oeste','descenso por promedios'),(1963,'—','no bajó nadie; en 1964 suben Ferro y Newell\'s y vuelve a haber 16')]
with open(OUT+'argentina-descensos-1958-63.csv','w',newline='',encoding='utf-8') as f:
  w=csv.writer(f); w.writerow(['temporada','club','motivo'])
  for r in Dd: w.writerow(r)
