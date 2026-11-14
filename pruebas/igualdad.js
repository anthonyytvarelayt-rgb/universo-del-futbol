// Igualdad de las ligas: % de puntos (a 2 por victoria) del campeón, del 4.º y del último, goles a favor del campeón por
// partido, goles por partido del máximo goleador y goles por partido de la liga.
// Lo real, para comparar: campeón 70-78 % entre 1965 y 2005 y 80-88 % desde 2008; último 28-32 %; goleador 0,6-0,8 por partido
// (1,0 en la España de Messi y Cristiano); campeón 1,6-2,1 goles por partido antes de 2005.
// Uso: node pruebas/igualdad.js <año> <temporadas> <semilla>
const { Mundo, BASE } = require('./cargar.js');
const [a,n,s]=process.argv.slice(2).map(Number); const ac={};
const mira=(pais,T)=>{ if(!T||!T.tabla||T.tabla.length<12) return; const t=T.tabla, pc=(x)=>(2*x.g+x.e)/(2*x.pj); const top=T.jugadores.slice().sort((x,y)=>y.g-x.g)[0]; const o=ac[pais]=ac[pais]||{n:0,c:0,q:0,u:0,gf:0,pg:0,pgm:0,gpp:0};
 o.n++; o.c+=pc(t[0]); o.q+=pc(t[3]); o.u+=pc(t[t.length-1]); o.gf+=t[0].gf/t[0].pj; o.pg+=top.g/t[0].pj; o.gpp+=t.reduce((s,x)=>s+x.gf,0)/t.reduce((s,x)=>s+x.pj,0)*2; };
Mundo.partida(Mundo.desdeBase(BASE, a), { semilla:s, temporadas: n, alAvanzar: (res) => { mira('España',res.R.T); res.R.otros.forEach(o=>{ if(o.ligas&&o.ligas.length===1) mira(o.pais,o.ligas[0].T); }); } });
console.log(a+'+'+n); Object.entries(ac).forEach(([p,o])=>console.log(p.padEnd(11), 'camp '+(100*o.c/o.n).toFixed(0)+'%', '4º '+(100*o.q/o.n).toFixed(0)+'%', 'últ '+(100*o.u/o.n).toFixed(0)+'%', 'GF camp '+(o.gf/o.n).toFixed(2), 'goleador '+(o.pg/o.n).toFixed(2)+'/pj', 'goles/part '+(o.gpp/o.n).toFixed(2)));
