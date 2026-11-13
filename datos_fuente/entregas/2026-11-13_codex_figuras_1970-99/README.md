# Figuras de 1970-99 · lote Codex

254 figuras de 34 países; las 270 filas anteriores de `niveles_figuras.csv` se conservan byte por byte. Fuente de todas las filas nuevas: `Codex 2026-11-13, figuras 1970-99`.

Se regeneran `datos/base.js` y `datos/atributos.js` con las herramientas existentes. No se modifica `js/`, la versión de guardado ni ningún resultado a mano. La calibración sí cambia los resultados futuros de la simulación; la medición y el cambio de versión al fusionar quedan a cargo de Claude, como se ha pedido. La referencia anterior es `2b2eaf2865523fc93820077b94d4832c18ca76aa`.

## Criterio

Se valora el mejor nivel sostenido durante dos o tres temporadas, con un período de referencia por jugador. Se priorizan las figuras con mayor valoración dentro de cada cupo y se reserva presencia de varias regiones en el resto. Los nombres y nacimientos son los literales de `datos/base.js`, comprobados por guion. Para las antiguas URSS y Yugoslavia, el informe desglosa por república de origen o selección posterior.

Se mantienen las referencias acordadas: Platini 860, Matthäus/Maldini/Baggio 800, Baresi/Gullit 790, Rummenigge 781, Breitner/Neeskens 710, Zoff 700, Netzer/Scirea 690, Tardelli 661 y Gentile 650. Las valoraciones propuestas inferiores al nivel visible anterior no se añaden; tampoco quien ya tiene fila a mano. No se retocan los valores anteriores para ajustar el reparto.

La conversión a la escala interna usa enteros y algunos valores no se pueden mostrar exactamente: 720 se muestra como 719; 730 y 780, como 731 y 781. Los 49 redondeos se explicitan en `seleccion.csv`: `nivel_valorado` es lo escrito en el CSV de niveles y `nivel_despues` es lo que devuelve `Motor.escala.mostrar` sobre la base regenerada. No se cambia la tabla de conversión. El guion comprueba tanto el valor interno como el visible y que ninguno baje.

234 máximos suben y 20 se mantienen, ahora con su fila de valoración a mano. Los 40.390 jugadores conservan su nombre, nacimiento, país, posición y carreras; tampoco cambian clubes, ligas ni entrenadores.

| Grupo | Figuras |
| --- | ---: |
| Italia | 45 |
| Alemania | 40 |
| Brasil | 30 |
| Argentina | 25 |
| España | 25 |
| Francia | 20 |
| Países Bajos | 20 |
| Resto de países | 49 |
| **Total** | **254** |

## Lista por país, antes y después

| País | Jugador | Nac. | Antes visible | Después visible | Valorado en CSV | Pico de referencia |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Italia | Paolo Maldini | 1968 | 800 | 800 | 800 | 1992-1995 |
| Italia | Roberto Baggio | 1967 | 800 | 800 | 800 | 1992-1995 |
| Italia | Franco Baresi | 1960 | 790 | 790 | 790 | 1988-1991 |
| Italia | Alessandro Del Piero | 1974 | 770 | 770 | 770 | 1995-1998 |
| Italia | Paolo Rossi | 1956 | 710 | 750 | 750 | 1977-1980 |
| Italia | Gianluca Vialli | 1964 | 680 | 731 | 730 | 1989-1992 |
| Italia | Bruno Conti | 1955 | 650 | 719 | 720 | 1981-1984 |
| Italia | Roberto Donadoni | 1963 | 589 | 710 | 710 | 1988-1991 |
| Italia | Walter Zenga | 1960 | 661 | 710 | 710 | 1988-1991 |
| Italia | Angelo Peruzzi | 1970 | 578 | 700 | 700 | 1994-1997 |
| Italia | Christian Vieri | 1973 | 700 | 700 | 700 | 1996-1999 |
| Italia | Dino Zoff | 1942 | 700 | 700 | 700 | 1971-1974 |
| Italia | Giancarlo Antognoni | 1954 | 680 | 700 | 700 | 1980-1983 |
| Italia | Gianluca Pagliuca | 1966 | 640 | 700 | 700 | 1990-1993 |
| Italia | Giuseppe Bergomi | 1963 | 650 | 700 | 700 | 1988-1991 |
| Italia | Roberto Bettega | 1950 | 661 | 700 | 700 | 1976-1979 |
| Italia | Roberto Mancini | 1964 | 661 | 700 | 700 | 1989-1992 |
| Italia | Antonio Cabrini | 1957 | 640 | 690 | 690 | 1981-1984 |
| Italia | Demetrio Albertini | 1971 | 630 | 690 | 690 | 1992-1995 |
| Italia | Filippo Inzaghi | 1973 | 670 | 690 | 690 | 1996-1999 |
| Italia | Gaetano Scirea | 1953 | 690 | 690 | 690 | 1981-1984 |
| Italia | Giuseppe Signori | 1968 | 640 | 690 | 690 | 1992-1995 |
| Italia | Pietro Vierchowod | 1959 | 640 | 690 | 690 | 1989-1992 |
| Italia | Alessandro Altobelli | 1955 | 630 | 680 | 680 | 1983-1986 |
| Italia | Alessandro Costacurta | 1966 | 592 | 680 | 680 | 1992-1995 |
| Italia | Carlo Ancelotti | 1959 | 620 | 680 | 680 | 1987-1990 |
| Italia | Ciro Ferrara | 1967 | 620 | 680 | 680 | 1994-1997 |
| Italia | Giancarlo De Sisti | 1943 | 535 | 680 | 680 | 1970-1973 |
| Italia | Fabrizio Ravanelli | 1968 | 620 | 670 | 670 | 1993-1996 |
| Italia | Francesco Graziani | 1952 | 549 | 670 | 670 | 1974-1977 |
| Italia | Mauro Tassotti | 1960 | 564 | 670 | 670 | 1988-1991 |
| Italia | Nicola Berti | 1967 | 557 | 670 | 670 | 1988-1991 |
| Italia | Paolino Pulici | 1950 | 517 | 670 | 670 | 1973-1976 |
| Italia | Marco Tardelli | 1954 | 661 | 661 | 661 | 1981-1984 |
| Italia | Aldo Serena | 1960 | 569 | 661 | 660 | 1986-1989 |
| Italia | Antonio Conte | 1969 | 626 | 661 | 660 | 1993-1996 |
| Italia | Bruno Giordano | 1956 | 508 | 661 | 660 | 1977-1980 |
| Italia | Christian Panucci | 1973 | 620 | 661 | 660 | 1993-1996 |
| Italia | Fabio Capello | 1946 | 600 | 661 | 660 | 1971-1974 |
| Italia | Gabriele Oriali | 1952 | 600 | 661 | 660 | 1980-1983 |
| Italia | Luca Marchegiani | 1966 | 510 | 661 | 660 | 1991-1994 |
| Italia | Salvatore Bagni | 1956 | 540 | 661 | 660 | 1985-1988 |
| Italia | Agostino Di Bartolomei | 1955 | 519 | 650 | 650 | 1981-1984 |
| Italia | Claudio Gentile | 1953 | 650 | 650 | 650 | 1980-1983 |
| Italia | Giorgio Chinaglia | 1947 | 630 | 650 | 650 | 1972-1975 |
| Alemania | Lothar Matthäus | 1961 | 800 | 800 | 800 | 1988-1991 |
| Alemania | Karl-Heinz Rummenigge | 1955 | 781 | 781 | 781 | 1979-1982 |
| Alemania | Matthias Sammer | 1967 | 710 | 781 | 780 | 1993-1996 |
| Alemania | Bernd Schuster | 1959 | 700 | 740 | 740 | 1980-1983 |
| Alemania | Jürgen Klinsmann | 1964 | 700 | 740 | 740 | 1993-1996 |
| Alemania | Thomas Häßler | 1966 | 601 | 740 | 740 | 1989-1992 |
| Alemania | Andreas Brehme | 1960 | 670 | 731 | 730 | 1988-1991 |
| Alemania | Jupp Heynckes | 1945 | 559 | 731 | 730 | 1972-1975 |
| Alemania | Pierre Littbarski | 1960 | 546 | 731 | 730 | 1981-1984 |
| Alemania | Rudi Völler | 1960 | 680 | 731 | 730 | 1989-1992 |
| Alemania | Andreas Möller | 1967 | 661 | 719 | 720 | 1993-1996 |
| Alemania | Berti Vogts | 1946 | 650 | 710 | 710 | 1973-1976 |
| Alemania | Felix Magath | 1953 | 575 | 710 | 710 | 1981-1984 |
| Alemania | Harald Schumacher | 1954 | 545 | 710 | 710 | 1983-1986 |
| Alemania | Jürgen Kohler | 1965 | 661 | 710 | 710 | 1994-1997 |
| Alemania | Klaus Fischer | 1949 | 548 | 710 | 710 | 1974-1977 |
| Alemania | Paul Breitner | 1951 | 710 | 710 | 710 | 1979-1982 |
| Alemania | Ulf Kirsten | 1965 | 510 | 710 | 710 | 1996-1999 |
| Alemania | Jürgen Grabowski | 1944 | 530 | 700 | 700 | 1972-1975 |
| Alemania | Karlheinz Förster | 1958 | 565 | 700 | 700 | 1979-1982 |
| Alemania | Klaus Allofs | 1956 | 574 | 700 | 700 | 1982-1985 |
| Alemania | Uli Hoeneß | 1952 | 661 | 700 | 700 | 1972-1975 |
| Alemania | Andreas Köpke | 1962 | 570 | 690 | 690 | 1993-1996 |
| Alemania | Dieter Müller | 1954 | 523 | 690 | 690 | 1975-1978 |
| Alemania | Guido Buchwald | 1961 | 525 | 690 | 690 | 1989-1992 |
| Alemania | Günter Netzer | 1944 | 690 | 690 | 690 | 1970-1973 |
| Alemania | Hans-Peter Briegel | 1955 | 531 | 690 | 690 | 1983-1986 |
| Alemania | Olaf Thon | 1966 | 573 | 690 | 690 | 1987-1990 |
| Alemania | Rainer Bonhof | 1952 | 560 | 690 | 690 | 1973-1976 |
| Alemania | Bernard Dietz | 1948 | 527 | 680 | 680 | 1978-1981 |
| Alemania | Bernd Hölzenbein | 1946 | 529 | 680 | 680 | 1973-1976 |
| Alemania | Bodo Illgner | 1967 | 630 | 680 | 680 | 1988-1991 |
| Alemania | Dieter Hoeneß | 1953 | 583 | 680 | 680 | 1980-1983 |
| Alemania | Hansi Müller | 1957 | 597 | 680 | 680 | 1978-1981 |
| Alemania | Horst Hrubesch | 1951 | 565 | 680 | 680 | 1979-1982 |
| Alemania | Klaus Augenthaler | 1957 | 610 | 680 | 680 | 1987-1990 |
| Alemania | Manfred Burgsmüller | 1949 | 535 | 680 | 680 | 1978-1981 |
| Alemania | Stefan Reuter | 1966 | 579 | 680 | 680 | 1994-1997 |
| Alemania | Thomas Berthold | 1964 | 575 | 680 | 680 | 1988-1991 |
| Alemania | Uli Stein | 1954 | 522 | 680 | 680 | 1981-1984 |
| Brasil | Rivaldo | 1972 | 770 | 790 | 790 | 1996-1999 |
| Brasil | Sócrates | 1954 | 770 | 770 | 770 | 1980-1983 |
| Brasil | Paulo Roberto Falcão | 1953 | 578 | 760 | 760 | 1980-1983 |
| Brasil | Careca | 1960 | 710 | 740 | 740 | 1985-1988 |
| Brasil | Bebeto | 1964 | 700 | 731 | 730 | 1992-1995 |
| Brasil | Edmundo | 1971 | 661 | 719 | 720 | 1995-1998 |
| Brasil | Leovegildo Lins da Gama Júnior | 1954 | 590 | 719 | 720 | 1980-1983 |
| Brasil | Raí | 1965 | 670 | 719 | 720 | 1991-1994 |
| Brasil | Aldair | 1965 | 601 | 710 | 710 | 1992-1995 |
| Brasil | Roberto Dinamite | 1954 | 690 | 710 | 710 | 1979-1982 |
| Brasil | Toninho Cerezo | 1955 | 661 | 710 | 710 | 1980-1983 |
| Brasil | Cláudio Taffarel | 1966 | 661 | 700 | 700 | 1991-1994 |
| Brasil | Emerson Leão | 1949 | 589 | 700 | 700 | 1973-1976 |
| Brasil | José Dirceu Guimarães | 1952 | 568 | 700 | 700 | 1976-1979 |
| Brasil | José Reinaldo de Lima | 1957 | 522 | 700 | 700 | 1980-1983 |
| Brasil | Leonardo Nascimento de Araujo | 1969 | 640 | 700 | 700 | 1995-1998 |
| Brasil | Luís Edmundo Pereira | 1949 | 553 | 700 | 700 | 1973-1976 |
| Brasil | Mauro Silva | 1968 | 505 | 700 | 700 | 1992-1995 |
| Brasil | Djalminha | 1970 | 571 | 690 | 690 | 1996-1999 |
| Brasil | Dunga | 1963 | 650 | 690 | 690 | 1991-1994 |
| Brasil | Leivinha | 1949 | 557 | 690 | 690 | 1972-1975 |
| Brasil | Müller | 1966 | 576 | 690 | 690 | 1990-1993 |
| Brasil | Nelinho | 1950 | 494 | 690 | 690 | 1974-1977 |
| Brasil | Renato Gaúcho | 1962 | 526 | 690 | 690 | 1985-1988 |
| Brasil | Valdo Filho | 1964 | 600 | 690 | 690 | 1988-1991 |
| Brasil | Branco | 1964 | 630 | 680 | 680 | 1991-1994 |
| Brasil | Carlos Mozer | 1960 | 600 | 680 | 680 | 1988-1991 |
| Brasil | Jorginho | 1964 | 630 | 680 | 680 | 1992-1995 |
| Brasil | José Oscar Bernardi | 1954 | 572 | 680 | 680 | 1980-1983 |
| Brasil | Júlio César da Silva | 1963 | 521 | 680 | 680 | 1994-1997 |
| Argentina | Gabriel Batistuta | 1969 | 781 | 790 | 790 | 1996-1999 |
| Argentina | Mario Kempes | 1954 | 760 | 760 | 760 | 1976-1979 |
| Argentina | Daniel Passarella | 1953 | 731 | 750 | 750 | 1976-1979 |
| Argentina | Fernando Redondo | 1969 | 598 | 740 | 740 | 1996-1999 |
| Argentina | Ubaldo Fillol | 1950 | 710 | 731 | 730 | 1976-1979 |
| Argentina | Ricardo Enrique Bochini | 1954 | 700 | 719 | 720 | 1982-1985 |
| Argentina | Carlos Bianchi | 1949 | 572 | 710 | 710 | 1973-1976 |
| Argentina | Claudio Caniggia | 1967 | 690 | 710 | 710 | 1988-1991 |
| Argentina | Juan Sebastián Verón | 1975 | 700 | 710 | 710 | 1997-1999 |
| Argentina | Miguel Angel Brindisi | 1950 | 551 | 710 | 710 | 1971-1974 |
| Argentina | Norberto Alonso | 1953 | 650 | 710 | 710 | 1973-1976 |
| Argentina | Ariel Ortega | 1974 | 670 | 700 | 700 | 1994-1997 |
| Argentina | Diego Simeone | 1970 | 661 | 700 | 700 | 1994-1997 |
| Argentina | René Houseman | 1953 | 640 | 700 | 700 | 1973-1976 |
| Argentina | Carlos Babington | 1949 | 481 | 690 | 690 | 1971-1974 |
| Argentina | Daniel Bertoni un crack | 1955 | 554 | 690 | 690 | 1976-1979 |
| Argentina | Jorge Burruchaga | 1962 | 661 | 690 | 690 | 1984-1987 |
| Argentina | Oscar Ruggeri | 1962 | 670 | 690 | 690 | 1985-1988 |
| Argentina | Abel Balbo | 1966 | 558 | 680 | 680 | 1992-1995 |
| Argentina | Alberto Tarantini | 1955 | 576 | 680 | 680 | 1976-1979 |
| Argentina | Jorge Valdano | 1955 | 630 | 680 | 680 | 1984-1987 |
| Argentina | Leopoldo Jacinto Luque | 1949 | 620 | 680 | 680 | 1975-1978 |
| Argentina | Ricardo Julio Villa | 1952 | 535 | 680 | 680 | 1978-1981 |
| Argentina | Sergio Goycochea | 1963 | 569 | 680 | 680 | 1989-1992 |
| Argentina | Ramón Ángel Díaz | 1959 | 650 | 670 | 670 | 1979-1982 |
| España | Emilio Butragueño | 1963 | 680 | 740 | 740 | 1985-1988 |
| España | Fernando Hierro | 1968 | 700 | 731 | 730 | 1995-1998 |
| España | Míchel González | 1963 | 596 | 719 | 720 | 1987-1990 |
| España | José Antonio Camacho | 1955 | 650 | 710 | 710 | 1981-1984 |
| España | Luis Miguel Arconada | 1954 | 670 | 710 | 710 | 1980-1983 |
| España | Santillana | 1952 | 650 | 710 | 710 | 1978-1981 |
| España | Andoni Zubizarreta | 1961 | 670 | 700 | 700 | 1985-1988 |
| España | Juanito Gómez | 1954 | 574 | 700 | 700 | 1983-1986 |
| España | Pep Guardiola | 1971 | 680 | 700 | 700 | 1991-1994 |
| España | Quini | 1949 | 640 | 700 | 700 | 1979-1982 |
| España | Rafael Gordillo | 1957 | 630 | 700 | 700 | 1983-1986 |
| España | Iribar | 1943 | 647 | 690 | 690 | 1969-1972 |
| España | Luis Enrique Martínez García | 1970 | 661 | 690 | 690 | 1996-1999 |
| España | Manuel Sanchís Hontiyuelo | 1965 | 579 | 690 | 690 | 1987-1990 |
| España | Antonio Maceda | 1957 | 563 | 680 | 680 | 1982-1985 |
| España | Carles Rexach | 1947 | 630 | 680 | 680 | 1971-1974 |
| España | Francisco Buyo | 1958 | 620 | 680 | 680 | 1987-1990 |
| España | José Eulogio Gárate | 1944 | 640 | 680 | 680 | 1969-1972 |
| España | José Luis Pérez Caminero | 1967 | 558 | 680 | 680 | 1993-1996 |
| España | José Mari Bakero | 1963 | 561 | 680 | 680 | 1990-1993 |
| España | Juan Manuel Asensi | 1949 | 620 | 680 | 680 | 1972-1975 |
| España | Luis Aragonés | 1938 | 501 | 680 | 680 | 1969-1972 |
| España | Rafael Martín Vázquez | 1965 | 572 | 680 | 680 | 1987-1990 |
| España | Roberto López Ufarte | 1958 | 533 | 680 | 680 | 1980-1983 |
| España | Txiki Begiristain | 1964 | 600 | 680 | 680 | 1990-1993 |
| Francia | Michel Platini | 1955 | 860 | 860 | 860 | 1982-1985 |
| Francia | Jean-Pierre Papin | 1963 | 700 | 781 | 780 | 1989-1992 |
| Francia | Éric Cantona | 1966 | 700 | 760 | 760 | 1993-1996 |
| Francia | Alain Giresse | 1952 | 650 | 740 | 740 | 1981-1984 |
| Francia | Lilian Thuram | 1972 | 710 | 740 | 740 | 1996-1999 |
| Francia | Marcel Desailly | 1968 | 700 | 740 | 740 | 1993-1996 |
| Francia | Jean Tigana | 1955 | 650 | 731 | 730 | 1982-1985 |
| Francia | Laurent Blanc | 1965 | 661 | 719 | 720 | 1996-1999 |
| Francia | Youri Djorkaeff | 1968 | 650 | 719 | 720 | 1995-1998 |
| Francia | Didier Deschamps | 1968 | 650 | 710 | 710 | 1995-1998 |
| Francia | Marius Tresor | 1950 | 640 | 710 | 710 | 1975-1978 |
| Francia | Bixente Lizarazu | 1969 | 650 | 700 | 700 | 1996-1999 |
| Francia | David Ginola | 1967 | 555 | 700 | 700 | 1996-1999 |
| Francia | Dominique Rocheteau | 1955 | 640 | 700 | 700 | 1983-1986 |
| Francia | Fabien Barthez | 1971 | 599 | 700 | 700 | 1996-1999 |
| Francia | Luis Fernández | 1959 | 640 | 700 | 700 | 1983-1986 |
| Francia | Manuel Amorós | 1962 | 551 | 700 | 700 | 1983-1986 |
| Francia | Henri Michel | 1947 | 552 | 690 | 690 | 1972-1975 |
| Francia | Joël Bats | 1957 | 555 | 690 | 690 | 1983-1986 |
| Francia | Patrick Battiston | 1957 | 550 | 690 | 690 | 1983-1986 |
| Países Bajos | Ruud Gullit | 1962 | 790 | 790 | 790 | 1986-1989 |
| Países Bajos | Frank Rijkaard | 1962 | 770 | 781 | 780 | 1988-1991 |
| Países Bajos | Dennis Bergkamp | 1969 | 770 | 770 | 770 | 1996-1999 |
| Países Bajos | Ronald Koeman | 1963 | 700 | 740 | 740 | 1991-1994 |
| Países Bajos | Patrick Kluivert | 1976 | 690 | 731 | 730 | 1994-1997 |
| Países Bajos | Ruud Krol | 1949 | 700 | 731 | 730 | 1971-1974 |
| Países Bajos | Edgar Davids | 1973 | 690 | 719 | 720 | 1996-1999 |
| Países Bajos | Marc Overmars | 1973 | 596 | 719 | 720 | 1996-1999 |
| Países Bajos | Frank de Boer | 1970 | 661 | 710 | 710 | 1993-1996 |
| Países Bajos | Jaap Stam | 1972 | 577 | 710 | 710 | 1996-1999 |
| Países Bajos | Johan Neeskens | 1951 | 710 | 710 | 710 | 1972-1975 |
| Países Bajos | Johnny Rep | 1951 | 661 | 710 | 710 | 1972-1975 |
| Países Bajos | Hans van Breukelen | 1956 | 505 | 700 | 700 | 1985-1988 |
| Países Bajos | Jan Wouters | 1960 | 563 | 690 | 690 | 1986-1989 |
| Países Bajos | Ronald de Boer | 1970 | 575 | 690 | 690 | 1993-1996 |
| Países Bajos | Aron Winter | 1967 | 570 | 680 | 680 | 1993-1996 |
| Países Bajos | Gerald Vanenburg | 1964 | 483 | 680 | 680 | 1985-1988 |
| Países Bajos | Kees Kist | 1952 | 531 | 680 | 680 | 1977-1980 |
| Países Bajos | Wim Kieft | 1962 | 520 | 680 | 680 | 1985-1988 |
| Países Bajos | Wim Suurbier | 1945 | 556 | 680 | 680 | 1970-1973 |
| Argelia | Rabah Madjer | 1958 | 650 | 710 | 710 | 1985-1988 |
| Argelia | Mustapha Dahleb | 1952 | 510 | 700 | 700 | 1976-1979 |
| Austria | Hans Krankl | 1953 | 670 | 731 | 730 | 1976-1979 |
| Bosnia y Herzegovina | Safet Sušić | 1955 | 563 | 731 | 730 | 1983-1986 |
| Bulgaria | Krasimir Balakov | 1966 | 567 | 719 | 720 | 1993-1996 |
| Bélgica | Enzo Scifo | 1966 | 661 | 731 | 730 | 1989-1992 |
| Bélgica | Michel Preud'homme | 1959 | 661 | 731 | 730 | 1991-1994 |
| Camerún | Roger Milla | 1952 | 650 | 731 | 730 | 1980-1983 |
| Camerún | Thomas N'Kono | 1956 | 509 | 700 | 700 | 1980-1983 |
| Chile | Iván Zamorano | 1967 | 670 | 740 | 740 | 1993-1996 |
| Chile | Marcelo Salas | 1974 | 680 | 731 | 730 | 1996-1999 |
| Colombia | Carlos Valderrama | 1961 | 690 | 731 | 730 | 1992-1995 |
| Croacia | Davor Šuker | 1968 | 700 | 750 | 750 | 1995-1998 |
| Croacia | Robert Prosinečki | 1969 | 661 | 719 | 720 | 1988-1991 |
| Croacia | Zvonimir Boban | 1968 | 670 | 719 | 720 | 1992-1995 |
| Dinamarca | Michael Laudrup | 1964 | 740 | 781 | 780 | 1991-1994 |
| Dinamarca | Allan Simonsen | 1952 | 680 | 750 | 750 | 1975-1978 |
| Dinamarca | Peter Schmeichel | 1963 | 731 | 750 | 750 | 1996-1999 |
| Dinamarca | Preben Elkjær Larsen | 1957 | 493 | 750 | 750 | 1983-1986 |
| Dinamarca | Brian Laudrup | 1969 | 670 | 731 | 730 | 1993-1996 |
| Finlandia | Jari Litmanen | 1971 | 661 | 750 | 750 | 1993-1996 |
| Ghana | Abédi Pelé | 1964 | 670 | 740 | 740 | 1990-1993 |
| Ghana | Tony Yeboah | 1966 | 530 | 700 | 700 | 1992-1995 |
| Marruecos | Ezaki Badou | 1959 | 485 | 690 | 690 | 1985-1988 |
| Montenegro | Dejan Savićević | 1966 | 690 | 740 | 740 | 1992-1995 |
| México | Hugo Sánchez | 1958 | 760 | 781 | 780 | 1986-1989 |
| Nigeria | Rashidi Yekini | 1963 | 496 | 690 | 690 | 1991-1994 |
| Noruega | Rune Bratseth | 1961 | 514 | 700 | 700 | 1990-1993 |
| Paraguay | José Luis Chilavert | 1965 | 544 | 719 | 720 | 1993-1996 |
| Perú | Teófilo Cubillas | 1949 | 750 | 760 | 760 | 1972-1975 |
| Polonia | Kazimierz Deyna | 1947 | 571 | 750 | 750 | 1972-1975 |
| Polonia | Zbigniew Boniek | 1956 | 700 | 750 | 750 | 1981-1984 |
| Portugal | Paulo Futre | 1966 | 680 | 740 | 740 | 1986-1989 |
| Portugal | Rui Costa | 1972 | 719 | 740 | 740 | 1996-1999 |
| Portugal | Fernando Chalana | 1959 | 640 | 710 | 710 | 1981-1984 |
| Portugal | Fernando Gomes | 1956 | 661 | 710 | 710 | 1982-1985 |
| Portugal | Vítor Baía | 1969 | 661 | 710 | 710 | 1992-1995 |
| Portugal | Humberto Coelho | 1950 | 640 | 700 | 700 | 1971-1974 |
| Portugal | Manuel Bento | 1948 | 595 | 690 | 690 | 1982-1985 |
| Portugal | Rui Jordão | 1952 | 620 | 690 | 690 | 1979-1982 |
| Rumania | Gheorghe Hagi | 1965 | 731 | 760 | 760 | 1988-1991 |
| Rusia | Rinat Dasáyev | 1957 | 680 | 731 | 730 | 1983-1986 |
| Serbia | Dragan Stojković | 1965 | 680 | 740 | 740 | 1987-1990 |
| Suecia | Tomas Brolin | 1969 | 505 | 719 | 720 | 1991-1994 |
| Ucrania | Íhor Belánov | 1960 | 532 | 740 | 740 | 1985-1988 |
| Uruguay | Enzo Francescoli | 1961 | 760 | 760 | 760 | 1984-1987 |
| Uruguay | Rubén Paz | 1959 | 511 | 690 | 690 | 1986-1989 |
| Uruguay | Antonio Alzamendi | 1956 | 544 | 680 | 680 | 1984-1987 |
| Uruguay | Daniel Fonseca | 1969 | 566 | 680 | 680 | 1991-1994 |

## Faltan en la base

Estas 26 figuras no se crean ni se incorporan al CSV de niveles. Los nacimientos de esta lista sirven para identificar a la persona que habría que importar, no son fichas nuevas del juego.

| País | Jugador | Nacimiento |
| --- | --- | --- |
| Alemania | Hans-Jürgen Dörner | 1951 |
| Alemania | Hans-Jürgen Kreische | 1947 |
| Alemania | Joachim Streich | 1951 |
| Alemania | Jürgen Sparwasser | 1948 |
| Argelia | Lakhdar Belloumi | 1958 |
| Bélgica | Jan Ceulemans | 1957 |
| Checoslovaquia | Antonín Panenka | 1948 |
| Checoslovaquia | Ivo Viktor | 1942 |
| Egipto | Mahmoud El Khatib | 1954 |
| Países Bajos | Adri van Tiggelen | 1957 |
| Países Bajos | Arie Haan | 1948 |
| Países Bajos | Berry van Aerle | 1962 |
| Países Bajos | Erwin Koeman | 1961 |
| Países Bajos | Jan Jongbloed | 1940 |
| Países Bajos | René van de Kerkhof | 1951 |
| Países Bajos | Rob Rensenbrink | 1947 |
| Países Bajos | Willy van de Kerkhof | 1951 |
| Países Bajos | Willy van der Kuijlen | 1946 |
| Países Bajos | Wim Jansen | 1946 |
| Países Bajos | Wim van Hanegem | 1944 |
| Perú | Héctor Chumpitaz | 1943 |
| Polonia | Grzegorz Lato | 1950 |
| Polonia | Włodzimierz Lubański | 1947 |
| Ucrania | Oleg Blokhin | 1952 |
| Ucrania | Oleksiy Mykhaylychenko | 1963 |
| Zambia | Kalusha Bwalya | 1963 |

## Revisados y no incorporados

Se conservan los niveles superiores existentes. Ardiles ya estaba en el archivo y no se duplica. Rubén Sosa (1966) sí está en la base, pero su nombre lleva un sufijo que se genera después de aplicar los niveles: se deja aparte para evitar confundirlo con el homónimo de 1940 o añadir una fila que el generador no encuentre.

| País | Jugador | Nivel conservado | Valoración | Motivo |
| --- | --- | ---: | ---: | --- |
| Brasil | Zico | 810 | 800 | Se conserva el nivel superior existente; no se añade |
| Brasil | Romário | 810 | 800 | Se conserva el nivel superior existente; no se añade |
| Brasil | Ronaldo | 900 | 850 | Se conserva el nivel superior existente; no se añade |
| Brasil | Cafú | 770 | 740 | Se conserva el nivel superior existente; no se añade |
| Brasil | Roberto Carlos | 770 | 740 | Se conserva el nivel superior existente; no se añade |
| Argentina | Diego Maradona | 950 | 920 | Se conserva el nivel superior existente; no se añade |
| Argentina | Osvaldo Ardiles | 725 | 710 | Ya está en niveles_figuras.csv |
| Francia | Zinedine Zidane | 880 | 800 | Se conserva el nivel superior existente; no se añade |
| Países Bajos | Marco van Basten | 840 | 800 | Se conserva el nivel superior existente; no se añade |
| Portugal | Luis Figo | 781 | 780 | Se conserva el nivel superior existente; no se añade |
| Bulgaria | Hristo Stoichkov | 781 | 780 | Se conserva el nivel superior existente; no se añade |
| Liberia | George Weah | 781 | 780 | Se conserva el nivel superior existente; no se añade |
| Uruguay | Rubén Sosa (1966) | 544 | 700 | Presente con sufijo; el generador aplica niveles antes de desambiguar nombres. Se deja aparte para no confundirlo con Rubén Sosa (1940) |

Se conserva también el nombre literal `Daniel Bertoni un crack`, tal como está en la base; no se corrigen nombres en este lote.

## Atributos de las 60 mejores figuras del lote

Se ordenan por nivel valorado descendente y, en los empates, por nombre. Las 60 tienen sus diez atributos: 22 perfiles anteriores se mantienen y se añaden 38. `atributos_top60.csv` identifica cada caso. Los perfiles distinguen estilo —por ejemplo, pase y visión de Redondo/Falcão, juego aéreo de Zamorano o defensa de Desailly— y no modifican el máximo de nivel.

Al ejecutar `python3 herramientas/atributos.py` se mantienen dos avisos que ya existían: `Lev Yashin` y `Claude Makélélé`. Ninguno de los 38 perfiles nuevos está ausente. No se corrigen los perfiles anteriores en este lote.

## Comprobaciones

Ejecutadas sobre los datos finales, incluidos los atributos:

```sh
python3 herramientas/base.py
python3 herramientas/atributos.py
python3 herramientas/comprobar_figuras_1970_99.py
node pruebas/famosos.js
node pruebas/auditoria.js
node pruebas/partida.js 1980 12 9
```

- Guion del lote: 254 nombres y años exactos; 270 filas anteriores intactas; ninguna bajada; solo cambia `max` de los seleccionados en la base generada. Comprueba además los atributos y los archivos generados.
- Ningún aviso `niveles_figuras: no encuentro` en `datos_fuente/base/revision.txt`. Sus demás avisos anteriores se conservan sin cambios.
- Famosos: 113 bien, 0 mal, 0 ausentes.
- Auditoría: todo bien.
- Partida de 1980, doce temporadas, semilla 9: termina correctamente. Resultados completos en `prueba_partida_1980_12_9.txt`.
- Sin cambios en `js/` ni en la versión de guardado.

## Medición de reparto: una partida de diagnóstico

Se comparan la base y los atributos del commit anterior con los finales usando el mismo motor y la misma semilla 9. En cada momento se toman los 20 jugadores activos de los clubes de la partida con mayor `Motor.escala.mostrar(j.niv)`, desempate por nombre con `localeCompare`. Se cuentan Inglaterra, Escocia, Gales, Irlanda e Irlanda del Norte según `j.nacion`. Es una clasificación por nivel actual; no es la votación del Balón de Oro.

Al iniciar 1980-81 hay 9 británicos entre los veinte antes y 6 después. En los doce cierres la media pasa de 8,25 a 4,75. Es el resultado de esa partida concreta, no una garantía para otras semillas o épocas. `reparto_1980_12_9.csv` contiene los conteos y `top20_antes.csv` / `top20_despues.csv` permiten revisar nombres, niveles y nacionalidades.

El guion reproducible de esta medición está en `medir_reparto.txt`.
