/* Tracés réels des segments (tracks-data.js) : décodage, forme de l'icône, profil d'altitude, application aux segments.
   Un tracé est un itinéraire piéton calculé sur OpenStreetMap depuis le départ du segment (voir README) : réel et praticable,
   mais pas le parcours « officiel » d'un segment. Altitudes : modèle numérique de terrain (précision de l'ordre de la dizaine de mètres). */
(function (root) {
  'use strict';
  // Polyligne « Google » (précision 5) : décodage et encodage.
  function decode(str) {
    const out = []; let i = 0, lat = 0, lon = 0;
    const next = () => { let r = 0, s = 0, b; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << s; s += 5; } while (b >= 32); return (r & 1) ? ~(r >> 1) : r >> 1; };
    while (i < str.length) { lat += next(); lon += next(); out.push({ lat: lat / 1e5, lon: lon / 1e5 }); }
    return out;
  }
  function encode(points) {
    let plat = 0, plon = 0, s = '';
    const put = v => { v = v < 0 ? ~(v << 1) : v << 1; while (v >= 32) { s += String.fromCharCode((32 | (v & 31)) + 63); v >>= 5; } s += String.fromCharCode(v + 63); };
    for (const p of points) { const la = Math.round(p.lat * 1e5), lo = Math.round(p.lon * 1e5); put(la - plat); put(lo - plon); plat = la; plon = lo; }
    return s;
  }
  const dist = (a, b) => { const r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r, h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2; return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); };
  const length = pts => pts.reduce((d, p, i) => i ? d + dist(pts[i - 1], p) : 0, 0);
  // Forme d'icône : le tracé réel projeté (latitude/longitude corrigée) et centré dans un cadre 300 × 130.
  function shapeOf(points, W = 300, H = 130, margin = 16) {
    const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length, k = Math.cos(lat0 * Math.PI / 180);
    const xs = points.map(p => p.lon * k), ys = points.map(p => -p.lat);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sx = maxX - minX || 1e-9, sy = maxY - minY || 1e-9, sc = Math.min((W - 2 * margin) / sx, (H - 2 * margin) / sy);
    const ox = (W - sx * sc) / 2, oy = (H - sy * sc) / 2;
    return 'M' + points.map((p, i) => ((xs[i] - minX) * sc + ox).toFixed(1) + ' ' + ((ys[i] - minY) * sc + oy).toFixed(1)).join(' L');
  }
  // Profil d'altitude à n points équidistants le long du tracé, lissé (deux passes sur 3 points).
  function profile(points, ele, n = 48) {
    if (!ele || ele.length !== points.length || points.length < 2) return null;
    const cum = [0]; for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + dist(points[i - 1], points[i]));
    const total = cum[cum.length - 1] || 1, raw = []; let j = 0;
    for (let i = 0; i < n; i++) {
      const d = total * i / (n - 1); while (j < cum.length - 2 && cum[j + 1] < d) j++;
      const span = cum[j + 1] - cum[j] || 1, t = Math.max(0, Math.min(1, (d - cum[j]) / span));
      raw.push(ele[j] + (ele[j + 1] - ele[j]) * t);
    }
    const smooth = arr => arr.map((v, i) => (arr[Math.max(0, i - 1)] + v + arr[Math.min(n - 1, i + 1)]) / 3);
    return smooth(smooth(raw));
  }
  // Dénivelé positif avec hystérésis : une montée ne compte qu'à partir de 3 m depuis le dernier creux (limite le bruit du modèle de terrain).
  const gainOf = prof => { if (!prof) return null; let g = 0, ref = prof[0]; for (const v of prof) { if (v < ref) ref = v; else if (v - ref >= 3) { g += v - ref; ref = v; } } return Math.round(g); };

  function apply(segments, tracks) {
    for (const s of segments) {
      const t = tracks && tracks[s.id]; if (!t || s.custom) continue;
      const pts = decode(t.p); if (pts.length < 2) continue;
      s.track = pts.map((p, i) => Number.isFinite(t.z && t.z[i]) ? { ...p, ele: t.z[i] } : p);
      s.loop = t.l === 1;
      s.shape = shapeOf(pts);
      s.shapeSq = shapeOf(pts, 130, 130, 12); // icône carrée des cartes
      s.km = Math.round(length(pts) / 100) / 10 || s.km;
      const prof = profile(pts, t.z);
      if (prof) { s.eleProfile = prof; const g = gainOf(prof); if (g != null) s.gain = g; }
    }
  }
  const api = { decode, encode, dist, length, shapeOf, profile, gainOf, apply };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.PopcornTracks = api; if (root.POPCORN_SEGMENTS && root.POPCORN_TRACKS) apply(root.POPCORN_SEGMENTS, root.POPCORN_TRACKS); }
})(typeof window !== 'undefined' ? window : globalThis);
