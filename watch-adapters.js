/* Contrat préparatoire seulement. Aucun OAuth, Bluetooth ou accès HealthKit. */
(function () {
  'use strict';
  class WatchAdapter {
    constructor(provider) { this.provider = provider; this.status = 'not-connected'; }
    async connect() { throw new Error(`${this.provider} : connexion réelle non implémentée.`); }
    async listActivities() { throw new Error('Aucune connexion fournisseur disponible.'); }
    normalizeActivity(raw) { return window.PopcornCore.validateActivity(raw); }
  }
  class FileImportAdapter extends WatchAdapter {
    constructor() { super('Import JSON local'); this.status = 'local-import-only'; }
    async parse(file) {
      if (file.size > 100000) throw new Error('Fichier trop volumineux : limite de 100 Ko.');
      let raw;
      try { raw = JSON.parse(await file.text()); } catch { throw new Error('Ce fichier ne contient pas un JSON valide.'); }
      return this.normalizeActivity(raw);
    }
  }
  window.PopcornWatches = {WatchAdapter,FileImportAdapter,providers:['Apple Watch','Garmin','COROS','Polar','Suunto'].map(name=>new WatchAdapter(name))};
})();
