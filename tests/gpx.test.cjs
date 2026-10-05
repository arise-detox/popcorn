const assert = require('assert');
const G = require('../gpx.js');

// Boucle ou aller-retour d'après le motif
assert.strictEqual(G.isLoop('M50 90 L50 30 Q150 0 250 30 L250 90 Q150 120 50 90 Z'), true);
assert.strictEqual(G.isLoop('M20 110 L95 75 L120 82 L200 40 L230 52 L285 20'), false);
assert.strictEqual(G.isLoop('M25 85 Q60 35 130 45 Q190 55 215 30 Q270 35 280 85 Q200 120 120 100 Z'), true);
assert.strictEqual(G.isLoop('M25 85 Q60 35 130 45 Q190 55 215 30 Q270 35 280 85 Q200 120 40 90'), true); // extrémités proches sans Z

// Destination : 1 km plein nord ≈ 0,009° de latitude
const p = G.dest({ lat: 48.85, lon: 2.35 }, 0, 1000);
assert.ok(Math.abs(p.lat - 48.85 - 0.00899) < 1e-4 && Math.abs(p.lon - 2.35) < 1e-6);

// Points de passage : boucle = 4 points (départ, 2 sommets, départ), aller-retour = 3
assert.strictEqual(G.waypoints({ lat: 48.85, lon: 2.35 }, true, 10, 500).length, 4);
assert.strictEqual(G.waypoints({ lat: 48.85, lon: 2.35 }, false, 10, 500).length, 3);

// GPX : XML échappé, un point de départ, un tracé
const xml = G.buildGpx({ name: 'A & B <test>', description: 'd', start: { lat: 48.85, lon: 2.35 }, points: [{ lat: 48.85, lon: 2.35 }, { lat: 48.851, lon: 2.351 }], time: '2026-10-05T00:00:00.000Z' });
assert.ok(xml.includes('A &amp; B &lt;test&gt;') && !xml.includes('<test>'));
assert.strictEqual((xml.match(/<wpt /g) || []).length, 1);
assert.strictEqual((xml.match(/<trkpt /g) || []).length, 2);
assert.ok(G.buildGpx({ name: 'x', start: { lat: 1, lon: 1 } }).indexOf('<trk>') < 0);

// Recherche de tracé avec un routeur simulé (distance = 1,25 × la ligne droite)
(async () => {
  const fake = async url => {
    const pts = url.split('/').pop().split('?')[0].split(';').map(s => s.split(',').map(Number));
    let d = 0; for (let i = 1; i < pts.length; i++) d += Math.hypot((pts[i][0] - pts[i - 1][0]) * 73000, (pts[i][1] - pts[i - 1][1]) * 111000) * 1.25;
    return { ok: true, status: 200, json: async () => ({ code: 'Ok', routes: [{ distance: d, geometry: { coordinates: pts } }] }) };
  };
  const r = await G.routeFor({ id: 'test', km: 5, shape: 'M0 0 L10 10 Z', lat: 48.85, lon: 2.35 }, { fetch: fake });
  assert.ok(!r.off && Math.abs(r.distance - 5000) / 5000 <= .1 && r.loop);
  const bad = async () => ({ ok: false, status: 500 });
  await assert.rejects(() => G.routeFor({ id: 't', km: 3, shape: 'M0 0 L9 9', lat: 48.85, lon: 2.35 }, { fetch: bad }));
  console.log('gpx tests ok');
})();
