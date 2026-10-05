/* Export GPX d'un segment pour une montre (Garmin, Apple Watch via une application compatible…).
   Les segments n'ont pas de tracé relevé : le fichier contient toujours le point de départ ; le tracé est, lui, généré à la demande
   par un service de routage piéton public (routing.openstreetmap.de, données OpenStreetMap) : une boucle ou un aller-retour de la
   distance du segment au départ du segment. Seules des coordonnées sont envoyées (point de départ et points intermédiaires). */
(function (root) {
  'use strict';
  const R = 6371000, rad = Math.PI / 180;
  const ROUTER = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/';
  const dest = (p, bearing, meters) => {
    const d = meters / R, b = bearing * rad, la = p.lat * rad, lo = p.lon * rad;
    const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
    const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
    return { lat: la2 / rad, lon: lo2 / rad };
  };
  // Boucle ou aller-retour d'après le motif du tracé schématique (extrémités proches = boucle).
  const isLoop = shape => {
    if (/Z\s*$/i.test(shape)) return true;
    const n = (String(shape).match(/-?\d+(?:\.\d+)?/g) || []).map(Number), pts = [];
    for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
    if (pts.length < 3) return false;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
    return Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < diag * .25;
  };
  // Points de passage : triangle (boucle) ou point de demi-tour (aller-retour). a = côté en mètres.
  const waypoints = (start, loop, bearing, a) => loop
    ? [start, dest(start, bearing, a), dest(start, bearing + 70, a), start]
    : [start, dest(start, bearing, a), start];
  const ratio = 1.25; // un trajet à pied est en moyenne plus long que la ligne droite
  const firstSide = (km, loop) => km * 1000 / (loop ? 3.147 : 2) / ratio;
  const escapeXml = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  const fixed = n => Number(n).toFixed(6);

  /* GPX 1.1 : un point de départ (wpt) et, si fourni, un tracé (trk). */
  function buildGpx({ name, description, start, points, time }) {
    const t = time || new Date().toISOString();
    const trk = points && points.length > 1
      ? `\n  <trk>\n    <name>${escapeXml(name)}</name>\n    <desc>${escapeXml(description || '')}</desc>\n    <trkseg>\n${points.map(p => Number.isFinite(p.ele) ? `      <trkpt lat="${fixed(p.lat)}" lon="${fixed(p.lon)}"><ele>${Math.round(p.ele)}</ele></trkpt>` : `      <trkpt lat="${fixed(p.lat)}" lon="${fixed(p.lon)}"/>`).join('\n')}\n    </trkseg>\n  </trk>` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Popcorn" xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata>\n    <name>${escapeXml(name)}</name>\n    <desc>${escapeXml(description || '')}</desc>\n    <time>${t}</time>\n  </metadata>\n  <wpt lat="${fixed(start.lat)}" lon="${fixed(start.lon)}">\n    <name>${escapeXml('Départ · ' + name)}</name>\n  </wpt>${trk}\n</gpx>\n`;
  }

  async function fetchRoute(wps, fetchImpl) {
    const url = ROUTER + wps.map(p => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`).join(';') + '?overview=full&geometries=geojson';
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error('Le service de routage a répondu ' + res.status + '.');
    const j = await res.json();
    if (j.code !== 'Ok' || !j.routes || !j.routes[0]) throw new Error('Aucun itinéraire piéton trouvé depuis ce départ.');
    return { distance: j.routes[0].distance, points: j.routes[0].geometry.coordinates.map(c => ({ lat: c[1], lon: c[0] })) };
  }

  /* Cherche un tracé de la distance visée : plusieurs orientations, chacune affinée deux fois. S'arrête dès qu'on est à ±10 %. */
  async function routeFor(segment, opts) {
    const o = opts || {}, fetchImpl = o.fetch || root.fetch.bind(root), onProgress = o.onProgress || (() => {});
    const start = { lat: segment.lat, lon: segment.lon }, loop = isLoop(segment.shape || ''), target = segment.km * 1000;
    const base = [...String(segment.id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 17);
    let best = null, tries = 0;
    for (const turn of [0, 120, 240]) {
      const bearing = (base + turn) % 360;
      let a = firstSide(segment.km, loop);
      for (let pass = 0; pass < 3; pass++) {
        onProgress(++tries);
        let r;
        try { r = await fetchRoute(waypoints(start, loop, bearing, a), fetchImpl); } catch (e) { if (best) return finish(best); throw e; }
        const err = Math.abs(r.distance - target) / target;
        if (!best || err < best.err) best = { ...r, err, loop };
        if (err <= .1) return finish(best);
        a = Math.max(60, Math.min(a * (target / r.distance), a * 2.5));
      }
    }
    return finish(best);
    function finish(b) { return { points: b.points, distance: b.distance, loop: b.loop, off: b.err > .1 }; }
  }

  const api = { dest, isLoop, waypoints, firstSide, buildGpx, escapeXml, routeFor, fetchRoute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PopcornGpx = api;
})(typeof window !== 'undefined' ? window : globalThis);
