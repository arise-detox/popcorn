(function (root) {
  'use strict';
  const difficulty = s => { const score = s.km + s.gain / 100; return score <= 3 ? 'Facile' : score <= 6 ? 'Moyen' : 'Difficile'; };
  const flow = s => Math.round(Math.max(0, Math.min(100, s.pedestrian + .65*s.sidewalk - 5*s.lights/s.km)));
  const distance = (a,b) => {
    const r = Math.PI/180, dLat = (b.lat-a.lat)*r, dLon = (b.lon-a.lon)*r;
    const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;
    return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
  };
  const time = seconds => { const n = Math.round(seconds); return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`; };
  const validateActivity = input => {
    if (!input || input.schemaVersion !== 1 || input.sport !== 'running') throw new Error('Format attendu : schemaVersion 1 et sport "running".');
    if (typeof input.durationSeconds !== 'number' || !Number.isFinite(input.durationSeconds) || input.durationSeconds < 30 || input.durationSeconds > 86400) throw new Error('La durée doit être comprise entre 30 secondes et 24 heures.');
    if (typeof input.distanceMeters !== 'number' || !Number.isFinite(input.distanceMeters) || input.distanceMeters < 100 || input.distanceMeters > 200000) throw new Error('La distance doit être comprise entre 100 m et 200 km.');
    if (typeof input.startedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(input.startedAt) || !Number.isFinite(Date.parse(input.startedAt))) throw new Error('Date startedAt ISO 8601 invalide.');
    const out = {schemaVersion:1,sport:'running',durationSeconds:Math.round(input.durationSeconds),distanceMeters:input.distanceMeters,startedAt:input.startedAt,source:typeof input.source === 'string' ? input.source.slice(0,60) : 'Fichier local',demo:input.demo === true};
    const st = input.start;
    if (st && Number.isFinite(st.lat) && Number.isFinite(st.lon) && Math.abs(st.lat) <= 90 && Math.abs(st.lon) <= 180) out.start = {lat:st.lat,lon:st.lon};
    return out;
  };
  const api = {difficulty,flow,distance,time,validateActivity};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PopcornCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
