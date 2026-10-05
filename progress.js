/* Progression locale : séries, records, niveaux, badges, estimations.
   Tout est calculé à partir des résultats déclarés sur l'appareil ; rien n'est vérifié ni partagé. */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PopcornProgress=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const levels=[
    {xp:0,name:'Grain de maïs'},{xp:40,name:'Ça chauffe'},{xp:100,name:'Premier pop'},{xp:200,name:'Pop pop pop'},{xp:350,name:'Bien éclaté'},
    {xp:550,name:'Doré à point'},{xp:800,name:'Caramel'},{xp:1100,name:'Croustillant'},{xp:1500,name:'Maître popcorn'},{xp:2000,name:'Légende du seau'}
  ];
  function mondayOf(date){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()-((d.getDay()+6)%7));return d;}
  function chronological(attempts){return attempts.map((a,i)=>({a,i,t:Date.parse(a.at)})).sort((x,y)=>x.t-y.t||x.i-y.i).map(x=>x.a);}
  /* Record battu : un résultat plus rapide qu'un résultat antérieur sur le même segment. */
  function recordsBeaten(attempts){
    const best=new Map();let beaten=0;
    for(const a of chronological(attempts)){const prev=best.get(a.segmentId);if(prev!==undefined&&a.seconds<prev)beaten++;if(prev===undefined||a.seconds<prev)best.set(a.segmentId,a.seconds);}
    return beaten;
  }
  function bests(attempts){const m=new Map();for(const a of attempts){const p=m.get(a.segmentId);if(!p||a.seconds<p.seconds)m.set(a.segmentId,a);}return m;}
  /* Nature du prochain résultat : 'first' (premier sur ce segment), 'pb' (meilleur que le record), ou null. */
  function kindOfNew(attempts,segmentId,seconds){
    const prior=attempts.filter(a=>a.segmentId===segmentId);
    if(!prior.length)return {kind:'first',delta:0};
    const best=Math.min(...prior.map(a=>a.seconds));
    return seconds<best?{kind:'pb',delta:best-seconds}:{kind:null,delta:seconds-best};
  }
  function summary(attempts,segById,now=new Date()){
    let km=0,seconds=0,gain=0,weekKm=0;const monday=mondayOf(now).getTime(),days=new Set(),tried=new Set(),ghosts=new Set();
    for(const a of attempts){
      const s=segById(a.segmentId);if(!s)continue;
      km+=s.km;seconds+=a.seconds;gain+=s.gain;tried.add(a.segmentId);
      const t=Date.parse(a.at);if(Number.isFinite(t)){days.add(dayKey(new Date(t)));if(t>=monday)weekKm+=s.km;}
      if(a.ghostWin&&a.ghostId)ghosts.add(a.ghostId);
    }
    let streak=0;const cursor=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    if(!days.has(dayKey(cursor)))cursor.setDate(cursor.getDate()-1);
    while(days.has(dayKey(cursor))){streak++;cursor.setDate(cursor.getDate()-1);}
    return {count:attempts.length,km,seconds,gain,weekKm,streak,tried:tried.size,ghostsBeaten:ghosts.size,records:recordsBeaten(attempts),avgPace:km>0?seconds/km:0};
  }
  function xp(attempts,segById){
    let total=0;const seen=new Set();
    for(const a of chronological(attempts)){
      const s=segById(a.segmentId);if(!s)continue;
      total+=s.km*10+Math.min(s.gain,500)/10;
      if(!seen.has(a.segmentId)){seen.add(a.segmentId);total+=20;}
      if(a.ghostWin)total+=15;
    }
    return Math.round(total);
  }
  function level(points){
    let i=0;while(i+1<levels.length&&points>=levels[i+1].xp)i++;
    const cur=levels[i],next=levels[i+1]||null;
    return {index:i,name:cur.name,xp:points,from:cur.xp,to:next?next.xp:null,nextName:next?next.name:null,pct:next?Math.min(100,Math.round((points-cur.xp)/(next.xp-cur.xp)*100)):100};
  }
  function badges(sum,ctx){
    const c=Object.assign({customCount:0,favorites:0,totalDemo:8},ctx||{});
    const b=(id,emoji,name,desc,value,target)=>({id,emoji,name,desc,value:Math.min(value,target),target,unlocked:value>=target});
    return [
      b('first','🍿','Premier pop','Ajouter un premier résultat.',sum.count,1),
      b('regular','🔁','Régulier','Ajouter 5 résultats.',sum.count,5),
      b('streak','🔥','Trois jours de suite','Courir 3 jours d’affilée.',sum.streak,3),
      b('explorer','🧭','Explorateur','Essayer 4 segments différents.',sum.tried,4),
      b('paris','🗼','Tour de Paris','Essayer 8 segments différents.',sum.tried,8),
      b('ten','🛣️','Les 10 premiers km','Cumuler 10 km.',Math.floor(sum.km),10),
      b('marathon','🏅','Marathon en morceaux','Cumuler 42,2 km.',Math.floor(sum.km*10)/10,42.2),
      b('climber','⛰️','Grimpeur','Cumuler 500 m de dénivelé positif.',Math.floor(sum.gain),500),
      b('record','🏆','Record battu','Battre un de vos propres records.',sum.records,1),
      b('ghost','👻','Chasseur de fantômes','Battre un fantôme en duel.',sum.ghostsBeaten,1),
      b('ghosts3','🎯','Tableau de chasse','Battre 3 fantômes différents.',sum.ghostsBeaten,3),
      b('builder','🚩','Bâtisseur de coins','Proposer un coin.',c.customCount,1),
      b('collector','⭐','Collectionneur','Mettre 3 segments en favoris.',c.favorites,3)
    ];
  }
  /* Estimation de Riegel (T2 = T1 × (D2/D1)^1,06) à partir de vos résultats sur des distances comparables. */
  function predict(attempts,segById,km){
    const pts=[];
    for(const a of chronological(attempts).reverse()){
      const s=segById(a.segmentId);if(!s||s.km<.5)continue;
      const ratio=km/s.km;if(ratio<.4||ratio>2.5)continue;
      pts.push(a.seconds*Math.pow(ratio,1.06));if(pts.length>=3)break;
    }
    if(!pts.length)return null;
    return {seconds:Math.round(pts.reduce((x,y)=>x+y,0)/pts.length),basedOn:pts.length};
  }
  function paceTable(km){return [240,270,300,330,360,420,480].map(pace=>({pace,seconds:Math.round(km*pace)}));}
  function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(seed){let a=seed;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  /* Profil schématique : une courbe déterministe dont le dénivelé positif cumulé vaut le dénivelé annoncé. */
  function elevationProfile(seg,n=48){
    const r=rng(hash(seg.id)),ph=[r()*6.28,r()*6.28,r()*6.28],raw=[];
    for(let i=0;i<n;i++){const x=i/(n-1);raw.push(Math.sin(x*6.28*1.2+ph[0])+.55*Math.sin(x*6.28*2.7+ph[1])+.25*Math.sin(x*6.28*5.3+ph[2]));}
    let up=0;for(let i=1;i<n;i++)up+=Math.max(0,raw[i]-raw[i-1]);
    const k=up>0?seg.gain/up:0,min=Math.min(...raw.map(v=>v*k));
    const pts=raw.map(v=>v*k-min);
    return {points:pts,max:Math.max(...pts,1)};
  }
  return {levels,summary,xp,level,badges,bests,kindOfNew,recordsBeaten,predict,paceTable,elevationProfile,mondayOf};
});
