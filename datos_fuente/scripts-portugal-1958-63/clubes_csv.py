import csv, sys
sys.path.insert(0, '/tmp/claude-0/pt/scripts')
from clubes import pres
I = [('Benfica', 'Lisboa', 'Estádio da Luz', '#E30613', '#FFFFFF'), ('Sporting de Portugal', 'Lisboa', 'Estádio José Alvalade', '#008057', '#FFFFFF'),
     ('Oporto', 'Porto', 'Estádio das Antas', '#003893', '#FFFFFF'), ('Belenenses', 'Lisboa', 'Estádio do Restelo', '#0047AB', '#FFFFFF'),
     ('Académica', 'Coimbra', 'Estádio Municipal de Coimbra', '#000000', '#FFFFFF'), ('Vitória de Setúbal', 'Setúbal', 'Estádio do Bonfim', '#007A33', '#FFFFFF'),
     ('Vitória de Guimarães', 'Guimarães', 'Campo da Amorosa', '#FFFFFF', '#000000'), ('Barreirense', 'Barreiro', 'Campo D. Manuel de Mello', '#D50032', '#FFFFFF'),
     ('Braga', 'Braga', 'Estádio 1.º de Maio', '#D50032', '#FFFFFF'), ('Covilhã', 'Covilhã', 'Estádio José dos Santos Pinto', '#007A33', '#FFFFFF'),
     ('Lusitano de Évora', 'Évora', 'Campo Estrela', '#007A33', '#FFFFFF'), ('CUF', 'Barreiro', 'Estádio Alfredo da Silva', '#007A33', '#FFFFFF'),
     ('Torreense', 'Torres Vedras', 'Estádio Manuel Marques', '#003893', '#FFFFFF'), ('Caldas', 'Caldas da Rainha', 'Campo da Mata', '#003893', '#FFFFFF'),
     ('Atlético CP', 'Lisboa', 'Estádio da Tapadinha', '#002F6C', '#FFFFFF'), ('Leixões', 'Matosinhos', 'Campo de Santana', '#D50032', '#FFFFFF'),
     ('Boavista', 'Porto', 'Estádio do Bessa', '#000000', '#FFFFFF'), ('Penafiel', 'Penafiel', 'Campo Municipal de Penafiel', '#D50032', '#000000'),
     ('Sanjoanense', 'São João da Madeira', 'Estádio Conde Dias Garcia', '#000000', '#FFFFFF'), ('Peniche', 'Peniche', 'Campo do GD Peniche', '#E30613', '#FFFFFF'),
     ('Portimonense', 'Portimão', 'Estádio Municipal de Portimão', '#000000', '#FFFFFF'), ('Farense', 'Faro', 'Estádio de São Luís', '#000000', '#FFFFFF'),
     ('Chaves', 'Chaves', 'Estádio Municipal de Chaves', '#003893', '#E30613'), ('Montijo', 'Montijo', 'Campo Luís de Almeida Fidalgo', '#E30613', '#FFFFFF'),
     ('Oliveirense', 'Oliveira de Azeméis', 'Estádio Carlos Osório', '#FFD100', '#000000'), ('Oriental', 'Lisboa', 'Campo Engenheiro Carlos Salema', '#E30613', '#FFFFFF'),
     ('Tirsense', 'Santo Tirso', 'Estádio Abel Alves de Figueiredo', '#000000', '#FFFFFF'), ('Vila Real', 'Vila Real', 'Campo do Monte da Forca', '#E30613', '#FFFFFF'),
     ('Salgueiros', 'Porto', 'Estádio Engenheiro Vidal Pinheiro', '#E30613', '#FFFFFF'), ('Elvas', 'Elvas', 'Estádio Municipal de Elvas', '#003893', '#FFFFFF'),
     ('Olhanense', 'Olhão', 'Estádio José Arcanjo', '#D50032', '#000000'), ('Estoril', 'Estoril', 'Estádio António Coimbra da Mota', '#FFD100', '#002F6C'),
     ('Espinho', 'Espinho', 'Campo da Avenida', '#000000', '#FFFFFF'), ('Feirense', 'Santa Maria da Feira', 'Estádio Marcolino de Castro', '#003893', '#FFFFFF'),
     ('Famalicão', 'Vila Nova de Famalicão', 'Campo Municipal de Famalicão', '#003893', '#FFFFFF'), ('Beira-Mar', 'Aveiro', 'Estádio Mário Duarte', '#FFD100', '#000000'),
     ('Almada', 'Almada', 'Campo do Pragal', '#E30613', '#FFFFFF'), ('Juventude de Évora', 'Évora', 'Estádio Sanches de Miranda', '#003893', '#FFFFFF')]
with open('/mnt/project-files/datos/portugal-clubes-1958-59.csv', 'w', newline='', encoding='utf-8') as fh:
    w = csv.writer(fh); w.writerow(['club', 'ciudad', 'estadio', 'color1', 'color2', 'prestigio'])
    for c in I: w.writerow(list(c) + [max(pres(c[0]), 300) if c[0] not in ('Benfica',) else pres(c[0])])
print(open('/mnt/project-files/datos/portugal-clubes-1958-59.csv').read()[:900])
