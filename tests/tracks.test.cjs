const assert = require('assert');
const T = require('../track-utils.js');

// Polyligne : aller-retour encodage / décodage à 1e-5 près
const pts = [{ lat: 48.87964, lon: 2.38211 }, { lat: 48.88301, lon: 2.39054 }, { lat: 48.87, lon: 2.37 }, { lat: 48.87964, lon: 2.38211 }];
const back = T.decode(T.encode(pts));
assert.strictEqual(back.length, pts.length);
back.forEach((p, i) => { assert.ok(Math.abs(p.lat - pts[i].lat) < 1e-5 && Math.abs(p.lon - pts[i].lon) < 1e-5); });
assert.strictEqual(T.encode([{ lat: 38.5, lon: -120.2 }, { lat: 40.7, lon: -120.95 }, { lat: 43.252, lon: -126.453 }]), '_p~iF~ps|U_ulLnnqC_mqNvxq`@'); // exemple de référence du format

// Forme d'icône : dans le cadre 300 × 130, proportions respectées (2 km est-ouest ≈ 0,2 km nord-sud)
const line = [{ lat: 48.85, lon: 2.30 }, { lat: 48.851, lon: 2.33 }];
const shape = T.shapeOf(line);
const xy = shape.slice(1).split(' L').map(s => s.split(' ').map(Number));
assert.ok(xy.every(([x, y]) => x >= 0 && x <= 300 && y >= 0 && y <= 130));
assert.ok(Math.abs(xy[1][0] - xy[0][0]) > 200 && Math.abs(xy[1][1] - xy[0][1]) < 20);
assert.ok(/^M[\d.]+ [\d.]+ L/.test(shape));

// Profil et dénivelé : montée régulière de 0 à 40 m
const track = [0, 1, 2, 3, 4].map(i => ({ lat: 48.85 + i * 0.002, lon: 2.35 }));
const prof = T.profile(track, [0, 10, 20, 30, 40], 20);
assert.strictEqual(prof.length, 20);
assert.ok(prof[19] > prof[0] && T.gainOf(prof) >= 35 && T.gainOf(prof) <= 40);
assert.strictEqual(T.profile(track, [1, 2], 20), null);

// Application à un segment : forme, distance, boucle, altitude
const seg = { id: 'x', km: 9, gain: 0, shape: 'M0 0', lat: 48.85, lon: 2.35 };
T.apply([seg], { x: { p: T.encode(track.concat(track.slice().reverse())), z: [0, 10, 20, 30, 40, 40, 30, 20, 10, 0], l: 1 } });
assert.ok(seg.track.length === 10 && seg.loop === true && seg.shape.startsWith('M') && seg.km > 1.7 && seg.km < 1.9 && seg.gain > 30);
const custom = { id: 'y', custom: true, km: 3, shape: 'M1 1' };
T.apply([custom], { y: { p: T.encode(track), z: null, l: 0 } });
assert.strictEqual(custom.shape, 'M1 1'); // les coins proposés ne sont jamais modifiés
console.log('tracks tests ok');
