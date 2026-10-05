/* Contrat préparatoire seulement. Aucun OAuth, Bluetooth ou accès HealthKit.
   Les imports de fichiers (JSON Popcorn, GPX) se font localement, sans envoi. */
(function () {
  'use strict';
  class WatchAdapter {
    constructor(provider) { this.provider = provider; this.status = 'not-connected'; }
    async connect() { throw new Error(`${this.provider} : connexion réelle non implémentée.`); }
    async listActivities() { throw new Error('Aucune connexion fournisseur disponible.'); }
    normalizeActivity(raw) { return window.PopcornCore.validateActivity(raw); }
  }
  /* Lit un fichier GPX : distance cumulée (en ignorant les sauts GPS impossibles), durée entre le premier et le dernier point. */
  function parseGpx(text, core) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'gpx') throw new Error('Ce fichier n’est pas un GPX valide.');
    const pts = [];
    for (const el of doc.getElementsByTagNameNS('*', 'trkpt')) {
      const lat = Number(el.getAttribute('lat')), lon = Number(el.getAttribute('lon'));
      const t = el.getElementsByTagNameNS('*', 'time')[0];
      const ms = t ? Date.parse(t.textContent.trim()) : NaN;
      if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && Number.isFinite(ms)) pts.push({lat, lon, ms});
    }
    if (pts.length < 2) throw new Error('Le GPX doit contenir au moins deux points de trace horodatés.');
    let meters = 0;
    for (let i = 1; i < pts.length; i++) {
      const step = core.distance(pts[i-1], pts[i]) * 1000, dt = (pts[i].ms - pts[i-1].ms) / 1000;
      if (dt <= 0) continue;
      if (step / dt > 12) continue; // plus de 12 m/s : saut de signal, pas de la course
      meters += step;
    }
    const first = pts[0], last = pts[pts.length-1];
    return {schemaVersion:1,sport:'running',durationSeconds:Math.round((last.ms - first.ms) / 1000),distanceMeters:Math.round(meters),startedAt:new Date(first.ms).toISOString(),source:'GPX importé',start:{lat:first.lat,lon:first.lon}};
  }
  class FileImportAdapter extends WatchAdapter {
    constructor() { super('Import local (JSON ou GPX)'); this.status = 'local-import-only'; }
    async parse(file) {
      const gpx = /\.gpx$/i.test(file.name || '');
      if (file.size > (gpx ? 5000000 : 100000)) throw new Error(gpx ? 'Fichier GPX trop volumineux : limite de 5 Mo.' : 'Fichier trop volumineux : limite de 100 Ko.');
      const text = await file.text();
      if (gpx || /^\s*<\?xml|^\s*<gpx/i.test(text)) return this.normalizeActivity(parseGpx(text, window.PopcornCore));
      let raw;
      try { raw = JSON.parse(text); } catch { throw new Error('Ce fichier ne contient ni un JSON ni un GPX valide.'); }
      return this.normalizeActivity(raw);
    }
  }
  window.PopcornWatches = {WatchAdapter,FileImportAdapter,parseGpx,providers:['Apple Watch','Garmin','COROS','Polar','Suunto'].map(name=>new WatchAdapter(name))};
})();
