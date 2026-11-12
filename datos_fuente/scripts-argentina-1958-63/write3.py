import csv,json,re
OUT='/mnt/project-files/datos/'
WP='https://es.wikipedia.org/wiki/'
E58=[
('Argentinos Juniors','','','','','',''),
('Atlanta','','','','','','en 1959 empezó con Juan Carlos Fonda (anuario AFA 1959)'),
('Boca Juniors','Bernardo Gandulla','Argentina','1957-01-05','1958-10-26',WP+'Anexo:Entrenadores_del_Club_Atlético_Boca_Juniors','J1-J19'),
('Boca Juniors','José Manuel Moreno','Argentina','1958-11-02','1959-08-09',WP+'Anexo:Entrenadores_del_Club_Atlético_Boca_Juniors','J20-J30'),
('Central Córdoba','','','','','','sin dato; en 1957 (Primera B) lo dirigía Félix Ibarra según RSSSF'),
('Estudiantes de La Plata','Alberto Zozaya','Argentina','1957','1958',WP+'Anexo:Entrenadores_del_Club_Estudiantes_de_La_Plata','J1-J30'),
('Gimnasia y Esgrima La Plata','Francisco Varallo','Argentina','1957','1959',WP+'Anexo:Entrenadores_de_Gimnasia_y_Esgrima_La_Plata','J1-J30'),
('Huracán','','','','','','en 1959 empezó con Néstor Raúl Rossi (anuario AFA 1959)'),
('Independiente','Adolfo Pedernera','Argentina','1957','1958',WP+'Anexo:Entrenadores_del_Club_Atlético_Independiente','J1-J15'),
('Independiente','Jim Lópes','Argentina','1958','1959',WP+'Anexo:Entrenadores_del_Club_Atlético_Independiente','J16-J30'),
('Lanús','Luis Colacciati y Oscar Sastre','Argentina','1958','1958',WP+'Anexo:Entrenadores_del_Club_Atlético_Lanús','J1-J30'),
("Newell's Old Boys",'Adolfo Celli','Argentina','1958','1958',WP+'Anexo:Entrenadores_del_Club_Atlético_Newell%27s_Old_Boys','J1-J15'),
("Newell's Old Boys",'Gerónimo Díaz','Argentina','1958','1960',WP+'Anexo:Entrenadores_del_Club_Atlético_Newell%27s_Old_Boys','J16-J30'),
('Racing Club','José Della Torre','Argentina','1958','1959',WP+'Anexo:Entrenadores_del_Racing_Club','J1-J30'),
('River Plate','José María Minella','Argentina','1947','1959',WP+'Anexo:Entrenadores_del_Club_Atlético_River_Plate','J1-J30'),
('Rosario Central','Juan Bautista Piotto','Argentina','1958-05-23','1959',WP+'Anexo:Entrenadores_del_Club_Atlético_Rosario_Central','J1-J30'),
('San Lorenzo','José Barreiro','Argentina','1957','1960',WP+'Anexo:Entrenadores_del_Club_Atlético_San_Lorenzo_de_Almagro','J1-J30'),
('Tigre','','','','','',''),
('Vélez Sarsfield','','','','','','en 1959 empezó con Roberto Sbarra (anuario AFA 1959)'),
]
DUDA={'Independiente':'no se sabe en qué fecha exacta entró Jim Lópes (Alejandro Galán); se reparte a mitad','Newell\'s Old Boys':'no se sabe en qué fecha exacta entró Gerónimo Díaz; se reparte a mitad','Lanús':'dirigieron en dupla','Rosario Central':'su primer partido fue el 23/05/1958 (Copa Suecia); se le dan todas las fechas de liga','Boca Juniors':'cambio el 26/10 (fecha 19) según Historia de Boca'}
with open(OUT+'argentina-entrenadores-1958-59.csv','w',newline='',encoding='utf-8') as f:
  w=csv.writer(f); w.writerow(['division','club','entrenador','nacionalidad','desde','hasta','estilo','fuente','jornadas','dudas'])
  for c,e,n,d,h,fu,j in E58:
    if not e: w.writerow(['Primera División',c,'','','','','sin dato fiable','', '', 'no encontrado'+(': '+j if j else '')])
    else: w.writerow(['Primera División',c,e,n,d,h,'sin dato fiable',fu,j,DUDA.get(c,'')])
# 1959-63 desde las alineaciones (DT de cada partido)
KEY2={'Argentinos':'Argentinos Juniors','Atlanta':'Atlanta','Boca':'Boca Juniors','Central Córdoba':'Central Córdoba','Estudiantes':'Estudiantes de La Plata','Ferro':'Ferro Carril Oeste','Gimnasia':'Gimnasia y Esgrima La Plata','Huracán':'Huracán','Independiente':'Independiente','Lanús':'Lanús','Newell':"Newell's Old Boys",'Racing':'Racing Club','River':'River Plate','Rosario Central':'Rosario Central','San Lorenzo':'San Lorenzo','Tigre':'Tigre','Vélez':'Vélez Sarsfield','Chacarita':'Chacarita Juniors','Los Andes':'Los Andes','Quilmes':'Quilmes','Banfield':'Banfield'}
T=json.load(open('dts.json'))
def clean(s):
  s=re.split(r'\s(?:ARBITRO|[A-ZÁÉÍÓÚ]{4,}\s[A-Z]{3,})',s)[0].strip()
  s=s.replace('Alejandro "Jim Lópes" Galán','Jim Lópes').replace('Alejandro Galán','Jim Lópes').replace('"Jim Lópes"','Jim Lópes')
  return s
with open(OUT+'argentina-entrenadores-1959-63.csv','w',newline='',encoding='utf-8') as f:
  w=csv.writer(f); w.writerow(['temporada','club','entrenador','partidos','orden','fuente'])
  for y,cl in T.items():
    for k,runs in cl.items():
      agg=[]
      import collections
      var=collections.defaultdict(collections.Counter)
      for n,c in runs:
        n=clean(n)
        if len(n)>=4: var[n.split()[-1]][n]+=c
      canon={k:max(v,key=lambda x:(len(x.split()),v[x])) for k,v in var.items()}
      for n,c in runs:
        n=clean(n)
        if len(n)<4: continue
        n=canon[n.split()[-1]]
        if agg and agg[-1][0]==n: agg[-1][1]+=c
        else: agg.append([n,c])
      for i,(n,c) in enumerate(agg): w.writerow([y,KEY2.get(k,k),n,c,i+1,f'https://www.historical-lineups.com/wp-content/uploads/2019/11/{y}.pdf'])
