(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PopcornChallenges=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const ghosts=[
    {id:'olympic',name:'La Fusée olympique',emoji:'🏅',pace:175,description:'Une allure de jeu de 2:55 /km, inspirée du très haut niveau. Aucun athlète réel ni record officiel.'},
    {id:'hare',name:'Le Lièvre éclair',emoji:'🐇',pace:120,description:'Un lièvre imaginaire à 2:00 /km. Une vitesse constante de jeu, pas une mesure animale.'},
    {id:'cromagnon',name:'Cro-Magnon express',emoji:'🪵',pace:270,description:'Un personnage inventé à 4:30 /km. Aucune estimation historique de ses capacités.'},
    {id:'fox',name:'Le Renard tranquille',emoji:'🦊',pace:360,description:'Un renard imaginaire à 6:00 /km, pour un premier duel accessible.'}
  ];
  function text(value,label,max,min=1){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw new Error(`${label} : entre ${min} et ${max} caractères.`);return value.trim();}
  function numeric(value,label,min,max){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error(`${label} : valeur attendue entre ${min} et ${max}.`);return value;}
  function validateSegment(s){
    if(!s||typeof s!=='object'||Array.isArray(s)||s.schemaVersion!==1)throw new Error('Format de segment non reconnu.');
    if(typeof s.id!=='string'||!/^user-[A-Za-z0-9_-]{1,75}$/.test(s.id))throw new Error('Identifiant de segment invalide.');
    if(!['public','private'].includes(s.visibility))throw new Error('Choisissez public ou privé.');
    const pedestrian=numeric(s.pedestrian,'Part piétonne',0,100),sidewalk=numeric(s.sidewalk,'Part avec trottoir',0,100);
    if(pedestrian+sidewalk>100)throw new Error('Voies piétonnes + trottoirs : le total ne peut pas dépasser 100 %.');
    const lights=numeric(s.lights,'Feux',0,100);if(!Number.isInteger(lights))throw new Error('Le nombre de feux doit être entier.');
    const creator=text(s.creator,'Pseudo du créateur',30);
    return {schemaVersion:1,id:s.id,custom:true,name:text(s.name,'Nom du segment',60),area:text(s.area,'Quartier ou commune',80),creator,
      start:text(s.start,'Départ',120),finish:text(s.finish,'Arrivée',120),description:text(s.description,'Consignes du parcours',600),
      km:numeric(s.km,'Distance en km',.1,50),gain:numeric(s.gain,'Dénivelé positif',0,3000),pedestrian,sidewalk,lights,
      lat:numeric(s.lat,'Latitude autour de Paris',48.4,49.3),lon:numeric(s.lon,'Longitude autour de Paris',1.6,3.2),visibility:s.visibility,
      ghostId:ghosts.some(g=>g.id===s.ghostId)?s.ghostId:'olympic',tag:`Coin proposé par ${creator}`,
      shape:'M25 90 Q80 15 145 65 T275 30'};
  }
  function duel(km,seconds,ghostId){
    numeric(km,'Distance',.1,50);numeric(seconds,'Temps',1,86400);
    const ghost=ghosts.find(g=>g.id===ghostId);if(!ghost)throw new Error('Fantôme inconnu.');
    const targetSeconds=Math.round(km*ghost.pace),difference=targetSeconds-seconds;
    const firstFinish=Math.min(seconds,targetSeconds);
    return {ghost,targetSeconds,difference,outcome:difference>0?'win':difference<0?'lose':'tie',
      youProgress:Math.min(1,firstFinish/seconds),ghostProgress:Math.min(1,firstFinish/targetSeconds),
      gapMeters:Math.round(km*1000*Math.abs(firstFinish/seconds-firstFinish/targetSeconds))};
  }
  function base64(bytes){let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function unbase64(s){if(typeof s!=='string'||s.length>14000||!/^[-_A-Za-z0-9]+$/.test(s))throw new Error('Lien d’invitation invalide.');try{return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}catch{throw new Error('Lien d’invitation illisible.');}}
  const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
  function cryptoAPI(){if(!globalThis.crypto?.subtle)throw new Error('Le partage privé exige HTTPS ou localhost sur un navigateur récent.');return globalThis.crypto;}
  async function derive(password,salt){
    text(password,'Mot de passe',128,8);const c=cryptoAPI();
    const key=await c.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
    return c.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  async function invitation(raw,password){
    const segment=validateSegment(raw),bytes=encoder.encode(JSON.stringify(segment));
    if(segment.visibility==='public')return 'p.'+base64(bytes);
    const c=cryptoAPI(),salt=c.getRandomValues(new Uint8Array(16)),iv=c.getRandomValues(new Uint8Array(12)),key=await derive(password,salt);
    const encrypted=await c.subtle.encrypt({name:'AES-GCM',iv},key,bytes);
    return 's.'+base64(encoder.encode(JSON.stringify({v:1,salt:base64(salt),iv:base64(iv),data:base64(new Uint8Array(encrypted))})));
  }
  async function readInvitation(token,password){
    if(typeof token!=='string'||token.length>14000)throw new Error('Lien trop long ou invalide.');
    let raw;
    try{
      if(token.startsWith('p.')){raw=JSON.parse(decoder.decode(unbase64(token.slice(2))));if(raw.visibility!=='public')throw new Error('Visibilité incohérente.');}
      else if(token.startsWith('s.')){
        const envelope=JSON.parse(decoder.decode(unbase64(token.slice(2))));
        if(envelope.v!==1)throw new Error('Version privée inconnue.');
        const salt=unbase64(envelope.salt),iv=unbase64(envelope.iv),data=unbase64(envelope.data);
        if(salt.length!==16||iv.length!==12||data.length>9000)throw new Error('Invitation privée invalide.');
        const key=await derive(password,salt);
        let bytes;try{bytes=await cryptoAPI().subtle.decrypt({name:'AES-GCM',iv},key,data);}catch{throw new Error('Mot de passe incorrect ou lien endommagé.');}
        raw=JSON.parse(decoder.decode(bytes));if(raw.visibility!=='private')throw new Error('Visibilité incohérente.');
      }else throw new Error('Format d’invitation inconnu.');
    }catch(err){if(err instanceof SyntaxError||err instanceof TypeError)throw new Error('Invitation illisible ou endommagée.');throw err;}
    return validateSegment(raw);
  }
  return {ghosts,validateSegment,duel,invitation,readInvitation};
});
