(function () {
  'use strict';
  const C = window.PopcornCore, D = window.PopcornChallenges, segments = window.POPCORN_SEGMENTS, demoSegments = segments.slice();
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number(value).toLocaleString('fr-FR',{maximumFractionDigits:1});
  const date = value => new Date(value).toLocaleDateString('fr-FR');
  const key = 'popcorn-v1';
  const P = window.PopcornProgress, segById = id => segments.find(s=>s.id===id);
  let storageOK = true, state = {favorites:[],attempts:[],customSegments:[],goalKm:10};
  // Assainit un état (stockage local ou sauvegarde importée) : tout champ inattendu est ignoré.
  function sanitizeState(saved) {
    const out = {favorites:[],attempts:[],customSegments:[],goalKm:10};
    if (!saved || typeof saved !== 'object') return out;
    out.customSegments = (Array.isArray(saved.customSegments)?saved.customSegments:[]).slice(0,50).flatMap(s=>{try{return [D.validateSegment(s)];}catch{return [];}}).filter((s,i,a)=>a.findIndex(x=>x.id===s.id)===i);
    const known = [...demoSegments,...out.customSegments];
    out.favorites = [...new Set((Array.isArray(saved.favorites)?saved.favorites:[]).filter(id=>known.some(s=>s.id === id)))];
    out.attempts = (Array.isArray(saved.attempts)?saved.attempts:[]).filter(a=>a && typeof a.id === 'string' && a.id.length < 100 && known.some(s=>s.id===a.segmentId) && Number.isFinite(a.seconds) && a.seconds>=1 && a.seconds<=86400 && typeof a.at === 'string' && Number.isFinite(Date.parse(a.at))).slice(-500).map(a=>{
      const r = {id:a.id,segmentId:a.segmentId,seconds:a.seconds,at:a.at,source:String(a.source || 'Saisie locale').slice(0,60)};
      if (D.ghosts.some(g=>g.id===a.ghostId)) { r.ghostId = a.ghostId; r.ghostWin = a.ghostWin === true; }
      return r;
    });
    if (Number.isFinite(saved.goalKm) && saved.goalKm >= 1 && saved.goalKm <= 200) out.goalKm = Math.round(saved.goalKm);
    return out;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) { state = sanitizeState(saved); segments.push(...state.customSegments); }
  } catch { storageOK = false; }
  let origin = {lat:48.8566,lon:2.3522}, located = false, favOnly = false, level = 'all', activeSegment = segments[0].id, pending = null, toastTimer;
  function toast(message) { $('toast').textContent = message; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,4500); }
  function persist() { try { localStorage.setItem(key,JSON.stringify(state)); storageOK=true; return true; } catch { storageOK=false; toast('Stockage indisponible : ces changements ne dureront que cette session.'); return false; } }
  const badge = s => `<span class="badge ${C.difficulty(s)==='Facile'?'easy':C.difficulty(s)==='Moyen'?'medium':'hard'}">${C.difficulty(s)}</span>`;
  const route = (s,cls='mini-route') => `<svg class="${cls}" viewBox="0 0 300 130" role="img" aria-label="${s.custom?'Schéma décoratif, sans tracé réel':'Motif de tracé fictif'}"><path d="${s.shape}" fill="none" stroke="#2857f0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${s.shape.match(/M(\d+)/)[1]}" cy="${s.shape.match(/M\d+ (\d+)/)[1]}" r="8" fill="#b9412d"/></svg>`;
  const bestOf = s => state.attempts.filter(a=>a.segmentId===s.id).sort((a,b)=>a.seconds-b.seconds)[0];
  const pbLine = s => { const b = bestOf(s); return b ? `<p class="pb-line">★ Votre record <b>${C.time(b.seconds)}</b> · ${C.time(b.seconds/s.km)} /km</p>` : ''; };
  function card(s) { return `<article class="segment-card"><button class="card-open" data-segment="${s.id}" aria-label="Voir ${escape(s.name)}">${badge(s)}<span class="distance-away">à ${number(C.distance(origin,s))} km</span><h3>${escape(s.name)}</h3><p class="area">${escape(s.area)}${s.custom?' · Proposé, non vérifié':''}</p><div class="metrics"><span><b>${number(s.km)}</b> km</span><span><b>${s.gain}</b> m D+</span><span><b>${s.lights}</b> feu${s.lights>1?'x':''}</span></div>${pbLine(s)}</button><div class="card-aside"><button class="favorite" data-favorite="${s.id}" aria-label="${state.favorites.includes(s.id)?'Retirer':'Ajouter'} ${escape(s.name)} des favoris" aria-pressed="${state.favorites.includes(s.id)}">${state.favorites.includes(s.id)?'★':'☆'}</button>${route(s)}<span class="flow"><b>${C.flow(s)}</b>/100<br>${s.custom?'fluidité estimée':'fluidité démo'}</span></div></article>`; }
  function filtered() {
    const query=$('search').value.trim().toLocaleLowerCase('fr-FR'), radius=Number($('radius').value);
    let result=segments.filter(s=>(!s.custom||s.visibility==='public') && (!favOnly||state.favorites.includes(s.id)) && (level==='all'||C.difficulty(s)===level) && `${s.name} ${s.area}`.toLocaleLowerCase('fr-FR').includes(query) && C.distance(origin,s)<=radius && (!$('friendly').checked || (s.pedestrian>=70 && s.pedestrian+s.sidewalk>=90)));
    return result.sort((a,b)=>$('sort').value==='flow' ? C.flow(b)-C.flow(a) : $('sort').value==='short' ? a.km-b.km : C.distance(origin,a)-C.distance(origin,b));
  }
  const originInView = (minLon,maxLon,minLat,maxLat) => origin.lon>=minLon && origin.lon<=maxLon && origin.lat>=minLat && origin.lat<=maxLat;
  function map(list) {
    const minLon=Math.min(2.19,...list.map(s=>s.lon))-.005,maxLon=Math.max(2.45,...list.map(s=>s.lon))+.005,minLat=Math.min(48.743,...list.map(s=>s.lat))-.005,maxLat=Math.max(48.923,...list.map(s=>s.lat))+.005;
    const x=lon=>42+(lon-minLon)/(maxLon-minLon)*440, y=lat=>28+(maxLat-lat)/(maxLat-minLat)*315;
    $('map').innerHTML=`<svg viewBox="0 0 530 370" role="group" aria-label="Schéma des départs de segments autour de Paris. Choisissez un point pour ouvrir sa fiche."><defs><pattern id="grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#d1def4" stroke-width=".7"/></pattern></defs><rect width="530" height="370" fill="url(#grid)"/><path d="M70 280 Q130 225 210 245 T320 155 T430 105" stroke="#9bcef7" stroke-width="23" fill="none"/><path d="M70 280 Q130 225 210 245 T320 155 T430 105" stroke="#eaf7ff" stroke-width="2" fill="none"/><ellipse cx="285" cy="126" rx="88" ry="74" fill="#f3f7ff" opacity=".65"/><path d="M170 80L400 210 M175 220L385 45 M125 125L445 160" stroke="#b9cced" stroke-width="5" stroke-dasharray="7 8" fill="none"/><text x="282" y="130" text-anchor="middle" font-size="23" fill="#6981ad" font-weight="650" letter-spacing="4">PARIS</text><text x="90" y="220" font-size="12" fill="#526f9e">OUEST PARISIEN</text><text x="193" y="347" font-size="12" fill="#526f9e">SCEAUX</text><text x="395" y="223" font-size="12" fill="#526f9e">VINCENNES</text><text x="30" y="30" font-size="12" fill="#526f9e">N ↑</text>${list.map(s=>`<g class="map-marker" tabindex="0" role="button" data-segment="${s.id}" aria-label="${escape(s.name)}" transform="translate(${x(s.lon).toFixed(1)} ${y(s.lat).toFixed(1)})"><title>${escape(s.name)}</title><circle r="14" fill="${C.difficulty(s)==='Difficile'?'#b9412d':'#142652'}" stroke="${state.favorites.includes(s.id)?'#ffdf59':'#f3f7ff'}" stroke-width="${state.favorites.includes(s.id)?5:4}"/><text y="5" text-anchor="middle" fill="#ffdf59" font-size="14" font-weight="700">${segments.indexOf(s)+1}</text></g>`).join('')}${located&&originInView(minLon,maxLon,minLat,maxLat)?`<g transform="translate(${x(origin.lon).toFixed(1)} ${y(origin.lat).toFixed(1)})" role="img" aria-label="Votre position"><circle r="16" fill="#2857f0" opacity=".18" class="you-pulse"/><circle r="7" fill="#2857f0" stroke="#fff" stroke-width="3"/><text y="-14" text-anchor="middle" font-size="11" font-weight="700" fill="#2857f0">Vous</text></g>`:''}</svg>`;
    $('map-count').textContent=`${list.length} départ${list.length>1?'s':''}`;
  }
  function renderExplore() { const list=filtered(); $('result-count').textContent=`${list.length} segment${list.length>1?'s':''}`; $('segment-list').innerHTML=list.length?list.map(card).join(''):'<div class="empty">Aucun segment dans ces critères. Élargissez le rayon ou changez les filtres.</div>'; map(list); }
  function rankingRows(s) {
    const seed = s.custom ? [] : window.POPCORN_RUNNERS.map((r,i)=>({name:r.name,seconds:Math.round(s.km*(r.secondsPerKm+s.gain/s.km*.6)+i*2),color:r.color,local:false}));
    // Une seule meilleure performance par coureur ; un seul coureur local (Vous).
    const local = state.attempts.filter(a=>a.segmentId===s.id).sort((a,b)=>a.seconds-b.seconds)[0];
    if(local) seed.push({name:'Vous',seconds:local.seconds,color:'yellow',local:true});
    return seed.sort((a,b)=>a.seconds-b.seconds);
  }
  function table(s) { return `<table class="leaderboard"><caption class="muted">${s.custom?'Classement local':'Classement de démonstration'} · ${escape(s.name)}</caption><thead><tr><th scope="col">#</th><th scope="col">Coureur</th><th scope="col">Temps / allure</th></tr></thead><tbody>${rankingRows(s).map((r,i)=>`<tr class="${r.local?'local-row':''}"><td>${i+1}</td><td><div class="runner-cell"><span class="avatar ${r.color}" aria-hidden="true">${escape(r.name.slice(0,1))}</span><span>${escape(r.name)}<span class="sub-label">${r.local?'Local · non vérifié':'Coureur fictif'}</span></span></div></td><td><strong>${C.time(r.seconds)}</strong><span class="sub-label">${C.time(r.seconds/s.km)} /km</span></td></tr>`).join('')}</tbody></table>`; }
  function renderRanking() { const s=segments.find(s=>s.id===$('ranking-segment').value)||segments[0]; $('ranking-content').innerHTML=`<section class="paper"><div class="section-row"><div>${badge(s)}<h2 style="margin-top:12px">${escape(s.name)}</h2><p class="muted">${number(s.km)} km · ${s.gain} m D+ · ${escape(s.area)}</p></div><button class="secondary" data-segment="${s.id}">Voir le défi</button></div>${table(s)}</section>`; }
  function renderProfile() {
    const sum=P.summary(state.attempts,segById),pts=P.xp(state.attempts,segById),lv=P.level(pts);
    $('level-card').innerHTML=`<div class="level-head"><span class="level-badge" aria-hidden="true">${lv.index+1}</span><div><p class="eyebrow">NIVEAU ${lv.index+1} · ${pts} PTS</p><h2>${lv.name}</h2></div></div><div class="xp-bar" role="progressbar" aria-label="Progression vers le niveau suivant" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${lv.pct}"><span style="width:${lv.pct}%"></span></div><p class="small-note">${lv.to===null?'Niveau maximal atteint. Le seau est plein !':`Encore <b>${lv.to-pts} pts</b> pour devenir « ${lv.nextName} ».`} Chaque km rapporte 10 pts, un nouveau segment 20, un duel gagné 15.</p>`;
    $('profile-stats').innerHTML=`<div class="stat"><b>${number(sum.km)}</b><span>km parcourus</span></div><div class="stat"><b>${sum.count}</b><span>résultat${sum.count>1?'s':''} · ${sum.tried} segment${sum.tried>1?'s':''}</span></div><div class="stat"><b>${sum.avgPace?C.time(sum.avgPace):'–'}</b><span>allure moyenne /km</span></div><div class="stat"><b>${sum.streak}</b><span>jour${sum.streak>1?'s':''} d’affilée</span></div>`;
    const goalPct=Math.min(100,Math.round(sum.weekKm/state.goalKm*100)),circ=2*Math.PI*42;
    $('goal-card').innerHTML=`<div class="goal-row"><svg class="goal-ring" viewBox="0 0 100 100" role="img" aria-label="${goalPct} % de l’objectif de la semaine"><circle cx="50" cy="50" r="42" fill="none" stroke="#e1eaff" stroke-width="10"/><circle cx="50" cy="50" r="42" fill="none" stroke="${goalPct>=100?'#ffdf59':'#2857f0'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(circ*goalPct/100).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 50 50)"/><text x="50" y="56" text-anchor="middle" font-size="22" font-weight="800" fill="#142652">${goalPct}%</text></svg><div><p class="eyebrow">OBJECTIF DE LA SEMAINE</p><h2>${number(sum.weekKm)} / ${state.goalKm} km</h2><p class="muted small-note">${goalPct>=100?'Objectif atteint, bravo ! ':'Depuis lundi, d’après les résultats ajoutés ici. '}</p><div class="goal-buttons"><button class="secondary" data-goal="-1" aria-label="Baisser l’objectif d’un kilomètre">−</button><button class="secondary" data-goal="1" aria-label="Augmenter l’objectif d’un kilomètre">+</button><button class="secondary" data-goal="5" aria-label="Augmenter l’objectif de cinq kilomètres">+5</button></div></div></div>`;
    const bl=P.badges(sum,{customCount:state.customSegments.length,favorites:state.favorites.length,totalDemo:demoSegments.length});
    $('badge-count').textContent=`${bl.filter(b=>b.unlocked).length} / ${bl.length}`;
    $('badges').innerHTML=bl.map(b=>`<div class="badge-card ${b.unlocked?'on':''}" ${b.unlocked?'':`title="${escape(b.desc)}"`}><span class="badge-emoji" aria-hidden="true">${b.emoji}</span><strong>${escape(b.name)}</strong><small>${b.unlocked?'Débloqué':escape(b.desc)}</small>${b.unlocked?'':`<span class="badge-prog" aria-hidden="true"><i style="width:${Math.round(b.value/b.target*100)}%"></i></span>`}<span class="sr-only">${b.unlocked?'Badge débloqué':`Progression ${number(b.value)} sur ${number(b.target)}`}</span></div>`).join('');
    const pbs=[...P.bests(state.attempts).values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
    $('pb-list').innerHTML=pbs.length?`<ul class="simple-list">${pbs.map(a=>{const s=segById(a.segmentId);return `<li><div><strong>${escape(s.name)}</strong><p>${number(s.km)} km · ${date(a.at)}</p></div><div class="pb-time"><strong>${C.time(a.seconds)}</strong><span>${C.time(a.seconds/s.km)} /km</span></div></li>`;}).join('')}</ul>`:'<p class="muted">Votre meilleur temps sur chaque segment apparaîtra ici.</p>';
    $('favorites-list').innerHTML=state.favorites.length?`<ul class="simple-list">${state.favorites.map(id=>{const s=segments.find(s=>s.id===id);return `<li><div><strong>${escape(s.name)}</strong><p>${number(s.km)} km · ${C.difficulty(s)}</p></div><button class="secondary" data-segment="${id}">Voir</button></li>`;}).join('')}</ul>`:'<p class="muted">Touchez l’étoile d’un segment pour le retrouver ici.</p>';
    $('attempts-list').innerHTML=state.attempts.length?`<ul class="simple-list">${[...state.attempts].reverse().map(a=>`<li><div><strong>${escape(segments.find(s=>s.id===a.segmentId).name)} · ${C.time(a.seconds)}</strong><p>${date(a.at)} · ${escape(a.source)} · non vérifié</p></div><button class="text-button danger" data-delete="${escape(a.id)}" aria-label="Supprimer ce résultat">Supprimer</button></li>`).join('')}</ul>`:'<p class="muted">Ajoutez un temps depuis une fiche de segment ou importez une activité.</p>';
    $('export').disabled=!state.attempts.length&&!state.favorites.length&&!state.customSegments.length;
  }
  function renderAll() { syncSegmentOptions(); renderExplore(); renderRanking(); renderProfile(); renderChallenges(); }
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer=document.createElement('div');layer.className='confetti';layer.setAttribute('aria-hidden','true');
    const colors=['#2857f0','#ffdf59','#ef6a56','#142652','#9bcef7'];
    for(let i=0;i<26;i++){const p=document.createElement('i');p.style.cssText=`left:${5+Math.random()*90}%;background:${colors[i%colors.length]};animation-delay:${(Math.random()*.35).toFixed(2)}s;--dx:${Math.round(Math.random()*160-80)}px;--rot:${Math.round(Math.random()*720-360)}deg`;layer.append(p);}
    document.body.append(layer);setTimeout(()=>layer.remove(),2400);
  }
  function addAttempt(segmentId,seconds,source,at,extra) {
    if(state.attempts.length>=500) {toast('Limite de 500 résultats locaux atteinte. Sauvegardez puis supprimez des résultats.'); return false;}
    const s=segById(segmentId),before=P.level(P.xp(state.attempts,segById)).index,res=P.kindOfNew(state.attempts,segmentId,seconds);
    const attempt={id:window.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,segmentId,seconds,source,at};
    if(extra&&D.ghosts.some(g=>g.id===extra.ghostId)){attempt.ghostId=extra.ghostId;attempt.ghostWin=extra.ghostWin===true;}
    state.attempts.push(attempt);
    const after=P.level(P.xp(state.attempts,segById)).index;
    const stored=persist(); renderAll();
    if(stored){
      if(res.kind==='pb'){toast(`🏆 Nouveau record sur ${s.name} : ${C.time(seconds)}, soit ${C.time(res.delta)} de mieux !`);confetti();}
      else if(res.kind==='first'){toast(`Premier temps sur ${s.name} : ${C.time(seconds)}. Ce sera votre référence !`);}
      else toast('Résultat ajouté à votre classement local, non vérifié.');
      if(after>before){setTimeout(()=>{toast(`⬆ Niveau ${after+1} : ${P.levels[after].name} !`);confetti();},res.kind?2600:0);}
    }
    return true;
  }
  function profileSvg(s) {
    const ep=P.elevationProfile(s),n=ep.points.length,W=300,H=90,top=14,bottom=10,span=Math.max(ep.max,12);
    const xy=ep.points.map((v,i)=>`${(i/(n-1)*W).toFixed(1)} ${(H-bottom-v/span*(H-bottom-top)).toFixed(1)}`);
    return `<figure class="elev"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profil altimétrique schématique : environ ${s.gain} mètres de dénivelé positif sur ${number(s.km)} kilomètres"><defs><linearGradient id="elev-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2857f0" stop-opacity=".35"/><stop offset="1" stop-color="#2857f0" stop-opacity=".04"/></linearGradient></defs><path d="M0 ${H-bottom} L${xy.join(' L')} L${W} ${H-bottom} Z" fill="url(#elev-g)"/><path d="M${xy.join(' L')}" fill="none" stroke="#2857f0" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M0 ${H-bottom}H${W}" stroke="#b5c5e2" stroke-width="1"/></svg><figcaption><span>0 km</span><span>+${s.gain} m D+</span><span>${number(s.km)} km</span></figcaption><small>Profil schématique calculé à partir du dénivelé annoncé : il ne représente pas le relief réel.</small></figure>`;
  }
  function myCard(s) {
    const b=bestOf(s),est=P.predict(state.attempts,segById,s.km);
    const paces=P.paceTable(s.km).map(r=>`<tr><td>${C.time(r.pace)} /km</td><td><strong>${C.time(r.seconds)}</strong></td></tr>`).join('');
    return `<section class="my-card">${b?`<p class="eyebrow">VOTRE RECORD</p><p class="my-record"><strong>${C.time(b.seconds)}</strong> <span>${C.time(b.seconds/s.km)} /km · ${date(b.at)}</span></p>`:'<p class="eyebrow">VOTRE RECORD</p><p class="muted small-note">Pas encore de temps ici. Ajoutez le vôtre ou lancez un duel fantôme pour fixer une référence.</p>'}${est?`<p class="small-note est">Estimation d’après vos derniers résultats : <strong>≈ ${C.time(est.seconds)}</strong> <span class="muted">(formule de Riegel, indicatif)</span></p>`:''}<details class="pace-details"><summary>Temps selon l’allure</summary><table class="pace-table"><tbody>${paces}</tbody></table></details></section>`;
  }
  function openSegment(id) {
    const s=segments.find(s=>s.id===id); if(!s)return; activeSegment=id;
    $('detail-kind').textContent=s.custom?(s.visibility==='private'?'PRIVÉ · PROPOSÉ':'PUBLIC PAR LIEN · PROPOSÉ'):'SEGMENT DE DÉMO';
    $('detail-content').innerHTML=`<p class="eyebrow">${escape(s.tag.toUpperCase())}</p><h2 id="detail-title" style="font-size:1.85rem">${escape(s.name)}</h2><p class="muted">${escape(s.area)}</p>${badge(s)}${route(s,'detail-route')}<div class="detail-metrics"><div><strong>${number(s.km)} km</strong><small>Distance fictive</small></div><div><strong>${s.gain} m</strong><small>Dénivelé positif fictif</small></div><div><strong>${C.flow(s)}/100</strong><small>Fluidité simulée</small></div></div>${profileSvg(s)}<p>${escape(s.description)}</p><ul class="quality-list"><li>${s.pedestrian} % piéton</li><li>${s.sidewalk} % avec trottoir</li><li>${s.lights} feu${s.lights>1?'x':''} (démo)</li></ul><p class="muted" style="font-size:.875rem">Difficulté : ${number(s.km+s.gain/100)} points (km + D+/100). Tracé fictif : vérifiez le terrain avant toute course.</p>${myCard(s)}${table(s)}<form class="effort-form" id="effort-form"><h3>Ajouter mon temps</h3><p class="muted">Saisie déclarative sur cet appareil. Aucun chronométrage GPS ni publication en ligne.</p><div class="time-fields"><label>Minutes<input id="minutes" type="number" inputmode="numeric" min="0" max="1440" step="1" value="${Math.ceil(s.km*5)}" required></label><label>Secondes<input id="seconds" type="number" inputmode="numeric" min="0" max="59" step="1" value="0" required></label></div><p id="effort-error" class="form-error" role="alert"></p><button type="submit" class="primary">Ajouter au classement local</button></form>`;
    if(s.custom){
      const content=$('detail-content');
      content.innerHTML=content.innerHTML.replace('Distance fictive','Distance déclarée').replace('Dénivelé positif fictif','Dénivelé déclaré').replace('Fluidité simulée','Fluidité estimée').replace(' (démo)',' (déclarés)').replace('Tracé fictif : vérifiez le terrain avant toute course.','Schéma décoratif, sans tracé GPS : vérifiez le terrain et les indications du créateur.');
      content.querySelector('.detail-route').insertAdjacentHTML('afterend',`<p class="info-card"><strong>Départ :</strong> ${escape(s.start)}<br><strong>Arrivée :</strong> ${escape(s.finish)}<br>Proposé par ${escape(s.creator)} · informations non vérifiées.</p>`);
      if(!rankingRows(s).length)content.querySelector('.leaderboard').insertAdjacentHTML('afterend','<p class="muted">Aucun résultat local sur ce segment pour le moment.</p>');
    }
    $('effort-form').insertAdjacentHTML('beforebegin',`<div class="segment-actions"><button class="primary" data-race="${s.id}" data-ghost="${s.ghostId||'olympic'}">Défier un fantôme</button>${s.custom?`<button class="secondary" data-share="${s.id}">Inviter des coureurs</button>`:''}</div>`);
    if(!$('detail-dialog').open) $('detail-dialog').showModal();
    $('effort-form').addEventListener('submit',e=>{
      e.preventDefault(); const minutes=Number($('minutes').value),sec=Number($('seconds').value),total=minutes*60+sec;
      if(!Number.isInteger(minutes)||!Number.isInteger(sec)||minutes<0||sec<0||sec>59||total<1||total>86400){$('effort-error').textContent='Indiquez un temps entre 1 seconde et 24 heures.'; return;}
      if(addAttempt(id,total,'Saisie locale',new Date().toISOString())) $('detail-dialog').close();
    });
  }
  function navigate() {
    const requested=location.hash.slice(1), view=requested.startsWith('invite=')?'challenges':['explorer','challenges','ranking','watches','profile'].includes(requested)?requested:'explorer';
    document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==`${view}-view`);
    document.querySelectorAll('[data-view]').forEach(el=>{const current=el.dataset.view===view;el.classList.toggle('active',current);if(current)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    renderAll();
    handleInvitation(requested);
  }
  function previewActivity(activity) {
    const s=segments.find(s=>s.id===$('import-segment').value);pending={activity,segmentId:s.id};
    const startKm=activity.start?C.distance(activity.start,s):null;
    const mismatch=Math.abs(activity.distanceMeters-s.km*1000)>s.km*1000*.03;
    $('import-preview').innerHTML=`<div class="import-preview"><h3>${activity.demo?'Activité fictive':'Activité importée · non vérifiée'}</h3><p>${date(activity.startedAt)} · ${number(activity.distanceMeters/1000)} km · ${C.time(activity.durationSeconds)}</p><p>Source : ${escape(activity.source)}</p><p>Segment choisi : ${escape(s.name)}</p>${activity.start?(startKm>.3?`<p class="form-error">Attention : l’activité démarre à ${number(startKm)} km du départ du segment. Vérifiez que c’est bien le même parcours.</p>`:`<p class="muted">Le départ de l’activité est à ${Math.round(startKm*1000)} m du départ du segment : bon signe, sans preuve.</p>`):''}${activity.durationSeconds&&activity.source==='GPX importé'?'<p class="muted small-note">Durée = écart entre le premier et le dernier point du fichier (pauses comprises).</p>':''}${mismatch?'<p class="form-error">La distance diffère de plus de 3 % du segment. Import refusé. Choisissez un segment correspondant et relancez l’import.</p>':'<p class="muted">L’activité doit correspondre au segment entier. La distance seule ne prouve pas le passage sur le tracé.</p><label class="toggle"><input id="confirm-match" type="checkbox"> Je confirme l’association au segment (non vérifiée).</label><button id="confirm-import" class="primary">Ajouter ce résultat local</button>'}</div>`;
    if(!mismatch) $('confirm-import').addEventListener('click',()=>{
      if(!$('confirm-match').checked){toast('Confirmez d’abord l’association au segment.');return;}
      const a=pending.activity;
      if(addAttempt(pending.segmentId,a.durationSeconds,(a.demo?'Démo · ':'Import · ')+a.source,a.startedAt)){pending=null;$('import-preview').innerHTML='<p class="info-card">Import terminé. Retrouvez le résultat dans Mon carnet.</p>';$('activity-file').value='';}
    });
  }
  let invitationHash='', invitationCandidate=null, shareSegment=null, currentRace=null, raceTimer=null;
  function syncSegmentOptions(){
    const options=segments.map(s=>`<option value="${s.id}">${escape(s.name)} · ${number(s.km)} km${s.custom?' · '+(s.visibility==='private'?'privé':'proposé'):''}</option>`).join('');
    ['ranking-segment','import-segment','ghost-segment'].forEach(id=>{const select=$(id),previous=select.value;select.innerHTML=options;if(segments.some(s=>s.id===previous))select.value=previous;});
  }
  function renderChallenges(){
    const selected=segments.find(s=>s.id===$('ghost-segment').value)||segments[0];
    $('ghost-cards').innerHTML=D.ghosts.map(g=>`<article class="ghost-card"><span class="ghost-avatar" aria-hidden="true">${g.emoji}</span><h3>${g.name}</h3><p class="ghost-pace">${C.time(g.pace)} <small>/km</small></p><p class="muted">${g.description}</p><div class="ghost-target">À battre sur ce segment : <strong>${C.time(Math.round(selected.km*g.pace))}</strong></div><button class="secondary" data-race="${selected.id}" data-ghost="${g.id}">Défier ce fantôme</button></article>`).join('');
    $('custom-count').textContent=`${state.customSegments.length} coin${state.customSegments.length>1?'s':''}`;
    $('custom-list').innerHTML=state.customSegments.length?state.customSegments.map(s=>`<article class="custom-card"><div class="section-row"><span class="badge ${s.visibility==='private'?'hard':'medium'}">${s.visibility==='private'?'🔒 Privé':'↗ Public par lien'}</span>${badge(s)}</div><h3>${escape(s.name)}</h3><p class="muted">${escape(s.area)} · proposé par ${escape(s.creator)} (pseudo non vérifié)</p><p><strong>${number(s.km)} km</strong> · ${s.gain} m D+ déclarés</p><p class="small-note">${escape(s.start)} → ${escape(s.finish)}</p><div class="custom-actions"><button class="secondary" data-segment="${s.id}">Voir le segment</button><button class="secondary" data-share="${s.id}">Inviter</button><button class="primary" data-race="${s.id}" data-ghost="${s.ghostId}">Défier le fantôme</button></div></article>`).join(''):'<div class="empty">Vous connaissez une allée, une montée ou un coin roulant ? Proposez-le et invitez les autres à relever votre défi.</div>';
  }
  function newId(){return 'user-'+(window.crypto?.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`);}
  function saveCustom(raw){
    const s=D.validateSegment(raw);
    if(segments.some(x=>x.id===s.id)){toast('Ce segment est déjà présent sur cet appareil.');return segments.find(x=>x.id===s.id);}
    if(state.customSegments.length>=50)throw new Error('Limite de 50 coins locaux atteinte.');
    state.customSegments.push(s);segments.push(s);persist();renderAll();return s;
  }
  $('coin-ghost').innerHTML=D.ghosts.map(g=>`<option value="${g.id}">${g.name} · ${C.time(g.pace)} /km</option>`).join('');
  $('create-segment').addEventListener('click',()=>{$('create-error').textContent='';$('create-dialog').showModal();});
  $('create-form').addEventListener('submit',e=>{
    e.preventDefault();$('create-error').textContent='';
    try{
      const s=saveCustom({schemaVersion:1,id:newId(),creator:$('coin-creator').value,name:$('coin-name').value,area:$('coin-area').value,start:$('coin-start').value,finish:$('coin-finish').value,description:$('coin-description').value,
        km:Number($('coin-km').value),gain:Number($('coin-gain').value),lat:Number($('coin-lat').value),lon:Number($('coin-lon').value),pedestrian:Number($('coin-pedestrian').value),sidewalk:Number($('coin-sidewalk').value),lights:Number($('coin-lights').value),ghostId:$('coin-ghost').value,visibility:document.querySelector('[name="coin-visibility"]:checked').value});
      $('create-dialog').close();$('create-form').reset();$('ghost-segment').value=s.id;renderChallenges();openShare(s.id);
    }catch(err){$('create-error').textContent=err.message;}
  });
  $('ghost-segment').addEventListener('change',renderChallenges);
  function openShare(id){
    const s=segments.find(s=>s.id===id);if(!s?.custom)return;shareSegment=s;
    $('detail-dialog').close();
    $('share-content').innerHTML=`<h3>${escape(s.name)}</h3><p>${s.visibility==='private'?'Invitation privée : les détails du segment sont chiffrés dans le lien. Transmettez le mot de passe séparément.':'Lien public : toute personne qui le reçoit peut ouvrir et copier le défi. Aucune publication dans un annuaire commun.'}</p>${s.visibility==='private'?'<label class="wide-label">Mot de passe de l’invitation (8 caractères minimum)<input type="password" id="share-password" minlength="8" maxlength="128" autocomplete="new-password"></label>':''}<p class="muted small-note">${location.protocol==='file:'?'Publiez l’application en HTTPS pour partager un lien utilisable.':/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?'Vous êtes en aperçu local : ce lien ne fonctionne que sur cet ordinateur. Utilisez le site publié pour inviter d’autres appareils.':'Le destinataire pourra accepter ce segment sur son appareil. Aucun résultat ne sera synchronisé.'}</p><button id="generate-link" class="primary">Créer le lien ${s.visibility==='private'?'privé':'public'}</button><p id="share-error" class="form-error" role="alert"></p><div id="share-output"></div><p class="muted small-note">Le lien contient le défi, pas vos résultats. Il ne peut pas être révoqué à distance. Un segment privé accepté reste enregistré en clair sur l’appareil du destinataire.</p>`;
    $('share-dialog').showModal();
    $('generate-link').addEventListener('click',async()=>{
      const button=$('generate-link');button.disabled=true;$('share-error').textContent='';$('share-output').innerHTML='';
      try{
        if(location.protocol==='file:')throw new Error('Ouvrez la version publiée en HTTPS pour créer un lien.');
        const token=await D.invitation(shareSegment,$('share-password')?.value);
        const url=new URL(location.href);url.hash='invite='+token;url.search='';
        $('share-output').innerHTML='<label class="wide-label">Lien à transmettre<textarea id="share-url" rows="3" readonly></textarea></label><button class="secondary" id="copy-link">Copier le lien</button><p id="copy-status" role="status"></p>';
        $('share-url').value=url.href;
        if($('share-password'))$('share-password').value='';
        $('copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share-url').value);$('copy-status').textContent='Lien copié. Envoyez-le aux coureurs de votre choix.';}catch{$('share-url').focus();$('share-url').select();$('copy-status').textContent='Copie automatique indisponible : copiez le texte sélectionné.';}});
      }catch(err){$('share-error').textContent=err.message;}finally{button.disabled=false;}
    });
  }
  function invitationPreview(s){
    invitationCandidate=s;
    $('invitation-panel').innerHTML=`<section class="invitation-card"><span class="demo-pill">${s.visibility==='private'?'INVITATION PRIVÉE DÉCHIFFRÉE':'INVITATION PUBLIQUE'}</span><h2>${escape(s.name)}</h2><p>${escape(s.area)} · proposé par ${escape(s.creator)} (pseudo non vérifié)</p><p><strong>${number(s.km)} km</strong> · ${s.gain} m D+ déclarés</p><p>${escape(s.start)} → ${escape(s.finish)}</p><p>${escape(s.description)}</p><p class="muted small-note">Les informations proviennent du lien reçu et ne sont pas validées par Popcorn. Accepter ajoute le défi à cet appareil ; il n’y a pas de classement partagé.</p><button id="accept-invitation" class="primary">Accepter le défi sur cet appareil</button><p id="invite-error" role="alert" class="form-error"></p></section>`;
    $('accept-invitation').addEventListener('click',()=>{try{const added=saveCustom(invitationCandidate);$('invitation-panel').innerHTML='';location.hash='challenges';$('ghost-segment').value=added.id;renderChallenges();toast('Défi accepté. Choisissez votre fantôme ou ajoutez un temps.');}catch(err){$('invite-error').textContent=err.message;}});
  }
  async function handleInvitation(hash){
    if(!hash.startsWith('invite=')){invitationHash='';invitationCandidate=null;$('invitation-panel').innerHTML='';return;}
    if(hash===invitationHash)return;invitationHash=hash;invitationCandidate=null;
    const token=hash.slice(7);
    if(token.startsWith('s.')){
      $('invitation-panel').innerHTML='<section class="invitation-card"><span class="demo-pill">INVITATION PRIVÉE</span><h2>Un coin réservé à votre groupe.</h2><p>Demandez le mot de passe au créateur du défi. Les détails ne sont pas visibles avant déchiffrement.</p><form id="unlock-form"><label class="wide-label">Mot de passe<input id="invite-password" type="password" autocomplete="off" required minlength="8" maxlength="128"></label><button class="primary" type="submit">Ouvrir l’invitation</button><p id="unlock-error" class="form-error" role="alert"></p></form></section>';
      $('unlock-form').addEventListener('submit',async e=>{e.preventDefault();const button=$('unlock-form').querySelector('button');button.disabled=true;$('unlock-error').textContent='';try{const s=await D.readInvitation(token,$('invite-password').value);if(location.hash.slice(1)===hash)invitationPreview(s);}catch(err){if($('unlock-error'))$('unlock-error').textContent=err.message;}finally{if(button.isConnected)button.disabled=false;}});
    }else{
      $('invitation-panel').textContent='Lecture de l’invitation…';
      try{const s=await D.readInvitation(token);if(location.hash.slice(1)===hash)invitationPreview(s);}catch(err){if(location.hash.slice(1)===hash)$('invitation-panel').textContent=err.message;}
    }
  }
  function stopRaceTimer(){clearInterval(raceTimer);raceTimer=null;}
  // Un chrono en cours survit à la fermeture de la fenêtre, voire de l'application (iOS peut la décharger).
  const raceKey='popcorn-race-v1';let wakeLock=null,raceBarTimer=null;
  function loadRace(){try{const r=JSON.parse(localStorage.getItem(raceKey)||'null');if(r&&segments.some(s=>s.id===r.segmentId)&&D.ghosts.some(g=>g.id===r.ghostId)&&Number.isFinite(r.startedAt)&&r.startedAt<=Date.now()+5000&&Date.now()-r.startedAt<86400000)return r;}catch{}return null;}
  function saveRace(r){try{localStorage.setItem(raceKey,JSON.stringify(r));}catch{}}
  function clearRace(){try{localStorage.removeItem(raceKey);}catch{}keepAwake(false);updateRaceBar();}
  async function keepAwake(on){try{if(on&&'wakeLock' in navigator&&!wakeLock&&document.visibilityState==='visible'){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null;});}else if(!on&&wakeLock){const w=wakeLock;wakeLock=null;await w.release();}}catch{wakeLock=null;}}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&loadRace()&&$('ghost-dialog').open)keepAwake(true);});
  function updateRaceBar(){
    const r=loadRace(),bar=$('race-bar');clearInterval(raceBarTimer);raceBarTimer=null;
    if(!r){bar.hidden=true;return;}
    const s=segById(r.segmentId),g=D.ghosts.find(g=>g.id===r.ghostId);
    const paint=()=>{$('race-bar-text').textContent=`Chrono ${C.time(Math.floor((Date.now()-r.startedAt)/1000))} · ${s.name}`;};
    paint();bar.hidden=false;raceBarTimer=setInterval(paint,1000);
  }
  function openGhost(id,ghostId){
    const active=loadRace();
    if(active&&!(active.segmentId===id&&active.ghostId===ghostId)){toast('Un chrono est déjà en cours : terminez-le ou annulez-le d’abord.');id=active.segmentId;ghostId=active.ghostId;}
    const s=segments.find(s=>s.id===id),g=D.ghosts.find(g=>g.id===ghostId);if(!s||!g)return;
    stopRaceTimer();currentRace={segment:s,ghost:g,target:Math.round(s.km*g.pace),startedAt:null};$('detail-dialog').close();
    $('ghost-content').innerHTML=`<div class="ghost-hero"><span aria-hidden="true">${g.emoji}</span><div><p class="eyebrow">VOTRE ADVERSAIRE IMAGINAIRE</p><h2 id="ghost-title">${g.name}</h2></div></div><p>${escape(s.name)} · ${number(s.km)} km</p><p class="muted">${g.description}</p><div class="target-clock"><small>Temps fantôme à battre</small><strong>${C.time(currentRace.target)}</strong><span>${C.time(g.pace)} /km · allure constante, sans ajustement du relief</span></div><div class="race-lane"><span class="lane-caption">Progression théorique du fantôme</span><div class="lane"><span id="live-ghost" class="lane-token" style="left:0%" aria-hidden="true">${g.emoji}</span></div><div class="lane-ends"><span>Départ</span><span>Arrivée</span></div></div><div class="race-controls"><strong id="race-clock">0:00</strong><button class="primary" id="start-race">Lancer mon chrono</button><button class="secondary" id="finish-race" hidden>J’ai terminé</button><button class="text-button" id="cancel-race" hidden>Annuler le chrono</button></div><p id="race-status" class="muted small-note" role="status">Chronométrage manuel, sans suivi GPS. Courez en respectant les règles du lieu.</p><form id="ghost-time-form" class="effort-form"><h3>Ou comparer un temps déjà réalisé</h3><div class="time-fields"><label>Minutes<input id="ghost-minutes" type="number" min="0" max="1440" step="1" value="${Math.floor(currentRace.target/60)}" required></label><label>Secondes<input id="ghost-seconds" type="number" min="0" max="59" step="1" value="0" required></label></div><button class="secondary" type="submit">Voir le duel</button></form><p id="ghost-error" class="form-error" role="alert"></p><div id="ghost-result" aria-live="polite"></div>`;
    if(!$('ghost-dialog').open)$('ghost-dialog').showModal();
    const beginRace=startedAt=>{currentRace.startedAt=startedAt;$('start-race').hidden=true;$('finish-race').hidden=false;$('cancel-race').hidden=false;$('ghost-time-form').hidden=true;$('ghost-result').innerHTML='';$('ghost-error').textContent='';$('race-status').textContent='Chrono en cours : il continue même si vous fermez cette fenêtre. Le marqueur représente seulement le fantôme, pas votre position.';stopRaceTimer();const tick=()=>{const elapsed=Math.max(0,(Date.now()-currentRace.startedAt)/1000);$('race-clock').textContent=C.time(Math.floor(elapsed));$('live-ghost').style.left=Math.min(100,elapsed/currentRace.target*100)+'%';};tick();raceTimer=setInterval(tick,250);keepAwake(true);};
    $('start-race').addEventListener('click',()=>{const startedAt=Date.now();saveRace({segmentId:s.id,ghostId:g.id,startedAt});beginRace(startedAt);updateRaceBar();});
    $('cancel-race').addEventListener('click',()=>{if(!confirm('Annuler ce chrono ? Le temps écoulé sera perdu.'))return;clearRace();openGhost(s.id,g.id);});
    $('finish-race').addEventListener('click',()=>{const elapsed=Math.round((Date.now()-currentRace.startedAt)/1000);if(elapsed<1){$('ghost-error').textContent='Attendez au moins une seconde.';return;}if(elapsed>86400){$('ghost-error').textContent='Le temps maximal est de 24 heures.';return;}clearRace();showDuel(elapsed);});
    if(active&&active.segmentId===s.id&&active.ghostId===g.id)beginRace(active.startedAt);
    $('ghost-time-form').addEventListener('submit',e=>{e.preventDefault();const m=Number($('ghost-minutes').value),sec=Number($('ghost-seconds').value),total=m*60+sec;if(!Number.isInteger(m)||!Number.isInteger(sec)||m<0||sec<0||sec>59||total<1||total>86400){$('ghost-error').textContent='Indiquez un temps entre 1 seconde et 24 heures.';return;}showDuel(total);});
  }
  function showDuel(seconds){
    stopRaceTimer();$('ghost-error').textContent='';$('finish-race').hidden=true;$('cancel-race').hidden=true;$('start-race').hidden=true;$('ghost-time-form').hidden=true;
    const s=currentRace.segment,result=D.duel(s.km,seconds,currentRace.ghost.id),g=result.ghost;
    $('race-clock').textContent=C.time(seconds);$('live-ghost').style.left=(result.ghostProgress*100)+'%';
    $('race-status').textContent='Duel terminé. Le bilan est une simulation à partir de votre temps déclaré.';
    const title=result.outcome==='win'?'Tu l’aurais mis dans le vent !':result.outcome==='lose'?'Il t’aurait rattrapé !':'Photo finish : à égalité !';
    const body=result.outcome==='win'?`${g.name} termine ${C.time(result.difference)} après toi.`:result.outcome==='lose'?`${g.name} termine ${C.time(-result.difference)} avant toi.`:'Vous franchissez la ligne au même instant dans cette simulation.';
    $('ghost-result').innerHTML=`<section class="duel-result ${result.outcome}"><p class="eyebrow">${result.outcome==='win'?'VICTOIRE SUR LE FANTÔME':result.outcome==='lose'?'LE FANTÔME PREND L’AVANTAGE':'MATCH NUL'}</p><h3>${title}</h3><p>${body}</p><div class="duel-times"><span>Toi <strong>${C.time(seconds)}</strong></span><span>${g.name} <strong>${C.time(result.targetSeconds)}</strong></span></div><div class="race-lane"><span class="lane-caption">Toi · progression simulée</span><div class="lane"><span class="lane-token you" style="left:${result.youProgress*100}%" aria-hidden="true">🏃</span></div></div><div class="race-lane"><span class="lane-caption">${g.name}</span><div class="lane"><span class="lane-token" style="left:${result.ghostProgress*100}%" aria-hidden="true">${g.emoji}</span></div></div><p class="small-note">Écart théorique à la première arrivée : <strong>${result.gapMeters} m</strong>. Les deux allures sont supposées constantes ; ni le relief ni les arrêts ne sont modélisés.</p><div class="custom-actions"><button id="save-duel" class="primary">Enregistrer mon temps local</button><button id="share-duel" class="secondary">Partager</button><button id="again-duel" class="secondary">Rejouer</button></div></section>`;
    $('save-duel').addEventListener('click',()=>{if(addAttempt(s.id,seconds,'Fantôme · '+g.name,new Date().toISOString(),{ghostId:g.id,ghostWin:result.outcome==='win'})){$('save-duel').disabled=true;$('save-duel').textContent='Temps enregistré';}});
    $('share-duel').addEventListener('click',async()=>{
      const msg=result.outcome==='win'?`J’ai mis ${g.name} dans le vent sur ${s.name} (${number(s.km)} km) : ${C.time(seconds)} contre ${C.time(result.targetSeconds)} ! 🍿`:result.outcome==='lose'?`${g.name} m’a rattrapé sur ${s.name} (${number(s.km)} km) : ${C.time(seconds)} contre ${C.time(result.targetSeconds)}. Revanche bientôt ! 🍿`:`Photo finish avec ${g.name} sur ${s.name} : ${C.time(seconds)} ! 🍿`;
      try{if(navigator.share){await navigator.share({title:'Popcorn',text:msg,url:location.origin+location.pathname});}else{await navigator.clipboard.writeText(msg);toast('Texte copié : collez-le dans votre message.');}}catch(err){if(err&&err.name!=='AbortError')toast('Partage indisponible sur cet appareil.');}
    });
    $('again-duel').addEventListener('click',()=>openGhost(s.id,g.id));
  }
  $('ghost-dialog').addEventListener('close',()=>{stopRaceTimer();keepAwake(false);});
  $('race-resume').addEventListener('click',()=>{const r=loadRace();if(r)openGhost(r.segmentId,r.ghostId);});
  document.addEventListener('click',e=>{
    const race=e.target.closest('[data-race]');if(race){openGhost(race.dataset.race,race.dataset.ghost||'olympic');return;}
    const share=e.target.closest('[data-share]');if(share){openShare(share.dataset.share);return;}
    const segment=e.target.closest('[data-segment]');if(segment){openSegment(segment.dataset.segment);return;}
    const fav=e.target.closest('[data-favorite]');if(fav){const id=fav.dataset.favorite;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];persist();renderAll();return;}
    const goal=e.target.closest('[data-goal]');if(goal){state.goalKm=Math.max(1,Math.min(200,state.goalKm+Number(goal.dataset.goal)));persist();renderProfile();return;}
    const del=e.target.closest('[data-delete]');if(del){state.attempts=state.attempts.filter(a=>a.id!==del.dataset.delete);persist();renderAll();return;}
    const close=e.target.closest('[data-close]');if(close) $(close.dataset.close).close();
    if(e.target.closest('[data-action="about"]')) $('about-dialog').showModal();
  });
  $('map').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.segment){e.preventDefault();openSegment(e.target.dataset.segment);}});
  document.querySelectorAll('[data-level]').forEach(btn=>btn.addEventListener('click',()=>{level=btn.dataset.level;document.querySelectorAll('[data-level]').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});renderExplore();}));
  ['search','radius','sort','friendly'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderExplore));
  syncSegmentOptions();
  $('fav-filter').addEventListener('click',()=>{favOnly=!favOnly;$('fav-filter').classList.toggle('active',favOnly);$('fav-filter').setAttribute('aria-pressed',String(favOnly));renderExplore();});
  $('surprise').addEventListener('click',()=>{const list=filtered();if(!list.length){toast('Aucun segment à proposer avec ces filtres.');return;}openSegment(list[Math.floor(Math.random()*list.length)].id);});
  $('ranking-segment').addEventListener('change',renderRanking);
  $('import-segment').addEventListener('change',()=>{pending=null;$('import-preview').innerHTML='';$('activity-file').value='';});
  $('locate').addEventListener('click',()=>{
    if(!navigator.geolocation){$('location-status').textContent='Géolocalisation indisponible. Le centre de Paris reste le point de référence.';return;}
    $('locate').disabled=true;$('location-status').textContent='Recherche de votre position…';
    navigator.geolocation.getCurrentPosition(pos=>{origin={lat:pos.coords.latitude,lon:pos.coords.longitude};located=true;$('location-status').textContent=`Distances à vol d’oiseau depuis votre position · précision ± ${Math.round(pos.coords.accuracy)} m. Aucun enregistrement de position.`;$('locate').disabled=false;renderExplore();},err=>{$('locate').disabled=false;$('location-status').textContent=err.code===1?'Localisation refusée. Autorisez-la dans les réglages du navigateur pour réessayer. Le point de référence précédent est conservé.':'Position introuvable. Vérifiez le GPS et réessayez. Le point de référence précédent est conservé.';},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
  });
  $('activity-file').addEventListener('change',async()=>{
    const file=$('activity-file').files[0];if(!file)return;
    pending=null;$('import-preview').textContent='Lecture du fichier…';
    try { previewActivity(await new window.PopcornWatches.FileImportAdapter().parse(file)); } catch(err){$('import-preview').textContent=err.message;}
  });
  $('sample-activity').addEventListener('click',()=>previewActivity(C.validateActivity({schemaVersion:1,sport:'running',startedAt:new Date().toISOString(),durationSeconds:720,distanceMeters:2400,source:'Exemple Popcorn fictif',demo:true})));
  $('export').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),notice:'Sauvegarde Popcorn : résultats locaux déclaratifs non vérifiés',favorites:state.favorites,attempts:state.attempts,customSegments:state.customSegments,goalKm:state.goalKm},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='popcorn-sauvegarde.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    $('backup-status').textContent='Sauvegarde créée. Conservez le fichier : il permet de tout restaurer sur un autre appareil ou après un effacement du navigateur.';
  });
  $('restore-file').addEventListener('change',async()=>{
    const file=$('restore-file').files[0];$('restore-file').value='';if(!file)return;
    try{
      if(file.size>2000000)throw new Error('Fichier trop volumineux pour une sauvegarde Popcorn.');
      let raw;try{raw=JSON.parse(await file.text());}catch{throw new Error('Ce fichier n’est pas une sauvegarde Popcorn valide.');}
      if(!raw||raw.schemaVersion!==1||!Array.isArray(raw.attempts))throw new Error('Ce fichier n’est pas une sauvegarde Popcorn valide.');
      const next=sanitizeState(raw);
      if(!confirm(`Restaurer cette sauvegarde ? ${next.attempts.length} résultat(s), ${next.favorites.length} favori(s) et ${next.customSegments.length} coin(s) remplaceront les données de cet appareil.`))return;
      state=next;segments.splice(0,segments.length,...demoSegments,...state.customSegments);persist();renderAll();
      $('backup-status').textContent=`Sauvegarde restaurée : ${next.attempts.length} résultat(s), ${next.favorites.length} favori(s), ${next.customSegments.length} coin(s).`;
    }catch(err){$('backup-status').textContent=err.message;}
  });
  $('reset').addEventListener('click',()=>{if(confirm('Effacer vos favoris, résultats et coins proposés sur cet appareil ? Les liens déjà partagés ne seront pas révoqués. Cette action est définitive.')){state={favorites:[],attempts:[],customSegments:[],goalKm:10};segments.splice(0,segments.length,...demoSegments);persist();renderAll();}});
  window.addEventListener('hashchange',()=>{navigate();window.scrollTo(0,0);});
  window.addEventListener('storage',e=>{if(e.key===key)toast('Les données ont changé dans un autre onglet. Rechargez Popcorn pour les actualiser.');});
  navigate(); updateRaceBar(); if(!storageOK) toast('Stockage local indisponible : les changements resteront dans cette session.');
  if('serviceWorker' in navigator && location.protocol!=='file:') {
    const hadController=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController)toast('Popcorn vient d’être mis à jour. Rechargez la page pour profiter de la nouvelle version.');});
    navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{$('offline-status').textContent='Application prête hors ligne sur ce navigateur après ce premier chargement.';}).catch(()=>{$('offline-status').textContent='Mode hors ligne indisponible ici. Utilisez HTTPS ou localhost.';});
  } else $('offline-status').textContent='Mode hors ligne PWA : ouvrez Popcorn sur HTTPS ou localhost.';
})();
