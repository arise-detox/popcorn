const assert=require('node:assert/strict');
const P=require('../progress.js');
const segs={a:{id:'a',km:2,gain:10},b:{id:'b',km:4,gain:200},c:{id:'c',km:10,gain:0}};
const byId=id=>segs[id];
const at=(d,h=9)=>new Date(2026,9,d,h).toISOString(); // 2026-10-d, heure locale
const att=(id,segmentId,seconds,at,extra)=>Object.assign({id,segmentId,seconds,at,source:'t'},extra||{});

// nature d'un nouveau résultat
assert.equal(P.kindOfNew([],'a',600).kind,'first');
assert.equal(P.kindOfNew([att('1','a',600,at(1))],'a',590).kind,'pb');
assert.equal(P.kindOfNew([att('1','a',600,at(1))],'a',590).delta,10);
assert.equal(P.kindOfNew([att('1','a',600,at(1))],'a',600).kind,null);
assert.equal(P.kindOfNew([att('1','a',600,at(1))],'b',900).kind,'first');

// records battus (ordre chronologique, pas ordre d'insertion)
assert.equal(P.recordsBeaten([att('2','a',580,at(2)),att('1','a',600,at(1))]),1);
assert.equal(P.recordsBeaten([att('1','a',600,at(1)),att('2','a',620,at(2)),att('3','a',590,at(3))]),1);
assert.equal(P.recordsBeaten([att('1','a',600,at(1))]),0);
assert.equal(P.bests([att('1','a',600,at(1)),att('2','a',580,at(2)),att('3','b',900,at(2))]).get('a').seconds,580);

// résumé : km, série, semaine (le 5 octobre 2026 est un lundi)
const now=new Date(2026,9,7,12); // mercredi 7
const list=[att('1','a',600,at(5)),att('2','b',1200,at(6)),att('3','c',3000,at(7)),att('4','a',610,at(1))];
const s=P.summary(list,byId,now);
assert.equal(s.count,4);assert.equal(s.km,18);assert.equal(s.tried,3);
assert.equal(s.streak,3);
assert.equal(s.weekKm,16); // 5, 6 et 7 octobre
assert.equal(Math.round(s.avgPace),Math.round((600+1200+3000+610)/18));
// série : aucun résultat aujourd'hui mais hier compte encore
assert.equal(P.summary([att('1','a',600,at(6))],byId,now).streak,1);
assert.equal(P.summary([att('1','a',600,at(4))],byId,now).streak,0);
assert.equal(P.summary([],byId,now).avgPace,0);
// semaine : le dimanche 4 octobre appartient à la semaine précédente
assert.equal(P.summary([att('1','a',600,at(4,20))],byId,now).weekKm,0);

// niveaux
assert.equal(P.level(0).name,'Grain de maïs');assert.equal(P.level(0).pct,0);
assert.equal(P.level(40).index,1);
assert.equal(P.level(70).pct,50);
assert.equal(P.level(5000).pct,100);assert.equal(P.level(5000).to,null);
// points : 10/km + dénivelé/10 (plafonné) + 20 par nouveau segment + 15 par duel gagné
assert.equal(P.xp([att('1','a',600,at(1))],byId),20+1+20);
assert.equal(P.xp([att('1','a',600,at(1)),att('2','a',590,at(2),{ghostId:'fox',ghostWin:true})],byId),20+1+20+20+1+15);
assert.equal(P.xp([],byId),0);

// badges
const none=P.badges(P.summary([],byId,now));
assert.equal(none.length,13);assert.ok(none.every(b=>!b.unlocked));
const some=P.badges(s,{customCount:1,favorites:3});
assert.ok(some.find(b=>b.id==='first').unlocked);
assert.ok(some.find(b=>b.id==='streak').unlocked);
assert.ok(some.find(b=>b.id==='builder').unlocked);
assert.ok(some.find(b=>b.id==='collector').unlocked);
assert.ok(some.find(b=>b.id==='record').unlocked);
assert.ok(!some.find(b=>b.id==='marathon').unlocked);
assert.equal(some.find(b=>b.id==='marathon').value,18);

// estimation de Riegel
assert.equal(P.predict([],byId,5),null);
const est=P.predict([att('1','a',600,at(1))],byId,4); // 600 × 2^1,06
assert.ok(Math.abs(est.seconds-Math.round(600*Math.pow(2,1.06)))<=1);assert.equal(est.basedOn,1);
assert.equal(P.predict([att('1','c',3000,at(1))],byId,2),null); // 10 km → 2 km : trop éloigné
assert.equal(P.predict([att('1','a',600,at(1))],byId,40),null);

// tableau d'allures
const t=P.paceTable(5);assert.equal(t[0].pace,240);assert.equal(t[0].seconds,1200);

// profil altimétrique : déterministe, dénivelé positif cumulé = dénivelé annoncé
const e1=P.elevationProfile({id:'seine',gain:145,km:2}),e2=P.elevationProfile({id:'seine',gain:145,km:2});
assert.deepEqual(e1.points,e2.points);
let up=0;for(let i=1;i<e1.points.length;i++)up+=Math.max(0,e1.points[i]-e1.points[i-1]);
assert.ok(Math.abs(up-145)<.01);
assert.ok(Math.min(...e1.points)>=0);
const flat=P.elevationProfile({id:'x',gain:0,km:1});assert.ok(flat.points.every(v=>v===0));
assert.notDeepEqual(P.elevationProfile({id:'seine',gain:50,km:2}).points.map(v=>Math.round(v*100)),P.elevationProfile({id:'autre',gain:50,km:2}).points.map(v=>Math.round(v*100)));
console.log('Progression : toutes les assertions ont réussi.');
