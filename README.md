# Popcorn 🍿 — PWA de démonstration

Version 1.4 · 5 octobre 2026 · Interface en français · Fichiers statiques sans compilation ni dépendances web externes (une seule requête externe, facultative et déclenchée par vous : le routage du tracé GPX, voir 1.4).

**Cette version est un prototype fonctionnel avec données fictives, pas un service de compétition réel.** Les noms de lieux évoquent Paris et ses alentours. Les 8 segments d’origine sont fictifs ; les 28 ajoutés en 1.4 portent le nom de vrais parcs et berges de Paris et d’Île-de-France, avec le point de départ du lieu (position OpenStreetMap ou approchée). Distances, dénivelés, tracés, proportions de voies, feux et résultats sont des exemples sans validation terrain. Le schéma géographique et les motifs de tracé ne sont pas des itinéraires de navigation. Les montres ne sont pas connectées.

## Nouveautés 1.4 : animations, Île-de-France, navigation

- **28 segments de plus** : Buttes-Chaumont, Monceau, canal Saint-Martin, Coulée verte, Bercy, Montsouris, Champ de Mars, parc André-Citroën, La Villette, île de Puteaux, île Saint-Germain, Bagatelle, Hautes-Bruyères, Tremblay, bords de Marne, lac de Créteil, parc Georges-Valbon, Chanteraines, Poudrerie, forêt de Meudon, Vallée-aux-Loups, Grand Canal de Versailles, Grande Terrasse de Saint-Germain, Saint-Quentin-en-Yvelines, Cergy, forêt de Montmorency, bassin de Vaires et gorges de Franchard (Fontainebleau). Les points de départ ont été contrôlés par géocodage OpenStreetMap quand le lieu y est connu ; distance, dénivelé, revêtement et feux sont des **ordres de grandeur non relevés**.
- **Carte Paris / Île-de-France** : bascule entre deux cadres, avec la Seine, la Marne et le périphérique en positions approchées (fond schématique, pas un plan). Les départs hors du cadre sont comptés mais non dessinés ; rayon jusqu’à 50 km.
- **Navigation vers le départ** (fiche d’un segment) : boutons À pied, Transports, Vélo (Google Maps) et Plans Apple, qui ouvrent l’application de plan vers le point de départ ; le trajet est calculé par cette application. Le **guide boussole** utilise la position (`watchPosition`) et, si l’appareil le permet, l’orientation (autorisation demandée sur iPhone) pour montrer direction, distance à vol d’oiseau et temps à pied ; il prévient à moins de 50 m. Aucune position n’est enregistrée ni envoyée ; le guidage s’arrête à la fermeture de la fiche.
- **Tracés réels des icônes** (`tracks-data.js`, `track-utils.js`) : chaque segment a un tracé calculé sur OpenStreetMap (itinéraire à pied depuis son départ, boucle ou aller-retour de la distance du segment, plusieurs orientations essayées, boucles qui se recoupent peu), simplifié à quelques mètres près. L’icône des cartes et de la fiche est la **forme exacte de ce tracé**, la distance affichée est sa longueur, le profil d’altitude et le dénivelé viennent d’un modèle numérique de terrain (Open-Meteo ; bruité, précision de l’ordre de la dizaine de mètres, dénivelé calculé avec un seuil de 3 m). Ce n’est pas le parcours « officiel » d’un segment : aucun n’a de parcours relevé. Fichier généré une fois pour toutes (aucune requête à l’exécution).
- **Export GPX pour montre** (`gpx.js`, bloc « Tracé pour ma montre » d’une fiche) : *Départ seul* (hors ligne) produit un GPX avec le point de départ ; *Télécharger le tracé* (segments de la liste) livre le tracé ci-dessus avec ses altitudes, **hors ligne** ; pour un coin proposé par un coureur, *Générer le tracé* demande à un service de routage piéton public (`routing.openstreetmap.de`, données OpenStreetMap) une **boucle ou un aller-retour à pied de la distance du segment** depuis son départ (plusieurs orientations essayées, objectif ±10 %), puis propose le téléchargement ou le partage du `.gpx` (Garmin Connect, ou application compatible pour Apple Watch). Seules des coordonnées sont envoyées ; rien n’est enregistré. **Le tracé est indicatif** : les segments n’ont pas de parcours relevé, il ne reproduit donc pas forcément le chemin exact du segment, et doit être vérifié avant de courir. Hors ligne ou service indisponible : message clair, le départ seul reste disponible.
- **Animations** (`motion.css`) : bandeau défilant, bandes de l’accueil, cartes en cascade, tracés qui se dessinent, marqueurs de carte qui apparaissent, compteurs qui montent dans le Carnet, ouverture des fenêtres, onglets. Elles sont coupées si l’appareil demande « réduire les animations ».

## 1. Ouvrir localement

1. Décompressez `Popcorn-PWA-defis.zip` avec l’Explorateur Windows ou le Finder. Ouvrez le dossier `popcorn` obtenu.
2. Pour un premier aperçu, double-cliquez sur `index.html`. Les interactions principales utilisent des scripts classiques et peuvent fonctionner en `file://`. La géolocalisation et l’installation PWA exigent cependant un serveur local ou HTTPS ; le mode hors ligne PWA ne fonctionne pas en `file://`.
3. Pour tester correctement, ouvrez un terminal **dans ce dossier** et utilisez l’une des deux options suivantes. Ces logiciels ne sont pas inclus dans le ZIP.

Avec Python 3 installé (Windows) :

```powershell
py -m http.server 8080 --bind 127.0.0.1
```

Sur macOS/Linux, ou si `py` n’existe pas :

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Avec Node.js 18 ou ultérieur installé :

```sh
node server.mjs
```

4. Ouvrez **http://localhost:8080/** sur l’ordinateur qui exécute le serveur. Arrêtez-le avec `Ctrl+C`.
5. Aucune commande `npm install`, aucune clé API, aucun compte ne sont nécessaires.

Sur iPhone, `localhost` désigne l’iPhone : il ne permet pas de joindre le serveur de votre ordinateur. Pour tester géolocalisation et installation sur iPhone, utilisez le site HTTPS publié ci-dessous. Un simple partage en HTTP sur le réseau local ne remplace pas HTTPS pour ces fonctions.

## 2. Publier sur GitHub Pages

1. Connectez-vous à GitHub et créez un dépôt nommé par exemple `popcorn`. Avec GitHub Free, choisissez un dépôt public.
2. Copiez **le contenu du dossier `popcorn`** à la racine du dépôt, pas le ZIP ni le dossier englobant. `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, `icons/` et `examples/` doivent conserver leurs chemins. Les autres fichiers peuvent rester dans le dépôt.
3. Depuis le site GitHub : **Add file → Upload files**, déposez les fichiers/dossiers puis **Commit changes**. Le fichier `.nojekyll` est caché sur certains systèmes : activez l’affichage des fichiers cachés ou créez-le via **Add file → Create new file** (un commentaire suffit).
4. Allez dans **Settings → Pages**. Sous **Build and deployment**, sélectionnez **Source: Deploy from a branch**, puis **Branch: main**, **Folder: /(root)**, et **Save**. Si votre branche porte un autre nom, sélectionnez-la.
5. Attendez la fin du déploiement (onglet **Actions**, workflow Pages). GitHub indique que cela peut prendre jusqu’à 10 minutes.
6. Dans **Settings → Pages → Visit site**, ouvrez l’adresse publiée, typiquement `https://VOTRE-PSEUDO.github.io/popcorn/`. Utilisez exactement votre pseudo et le nom de votre dépôt ; cette adresse d’exemple n’est pas un site déjà publié.
7. Activez **Enforce HTTPS** si l’option est disponible et vérifiez que l’adresse commence par `https://`.

Tous les chemins de l’app, du manifeste et du service worker sont relatifs. Elle fonctionne à la racine d’un domaine ou sous `/nom-du-depot/`, sans modifier le code ni le manifeste. Les vues utilisent des ancres `#explorer`, `#ranking`, `#watches`, `#profile`, sans redirections serveur. GitHub Pages sert uniquement les fichiers statiques ; `server.mjs` n’est utilisé qu’en local.

Référence : [Créer un site GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## 3. Installer sur iPhone avec Safari

1. Ouvrez **l’adresse HTTPS publiée** dans Safari, pas le ZIP ni une page GitHub affichant le code.
2. Attendez le chargement initial. Dans **Mon carnet**, vérifiez le message « Application prête hors ligne… ».
3. Dans Safari, touchez **Partager** (carré avec flèche vers le haut), puis **Sur l’écran d’accueil** / **Ajouter à l’écran d’accueil**. Selon la version d’iOS, cette action peut être dans **Plus** ou nécessiter de faire défiler la liste.
4. Activez **Ouvrir comme app web** si ce réglage est proposé. Gardez le nom Popcorn et touchez **Ajouter**.
5. Lancez Popcorn depuis sa nouvelle icône. Sur ce mode installé, faites un premier chargement avec Internet, puis vérifiez le message hors ligne dans Mon carnet. Ensuite, activez le mode avion et relancez l’app pour contrôler le cache.
6. Touchez **Autour de moi** et autorisez la localisation si vous voulez trier depuis votre position. Si vous refusez, les autres fonctions restent disponibles. Aucun suivi de course en arrière-plan n’est implémenté.

Référence : [Transformer un site web en app dans Safari sur l’iPhone](https://support.apple.com/fr-fr/guide/iphone/iphea86e5236/ios).

## Fonctions livrées

- Explorer les 36 segments (Paris, proche couronne et Île-de-France) via la liste ou les points du schéma ; fiche détaillée, métriques et classement.
- Recherche par nom/quartier, filtres facile/moyen/difficile, rayon de 2/5/10/20 km ou toute la région, tri proximité/longueur/fluidité.
- Géolocalisation **réelle du navigateur, à la demande**, avec gestion du refus et du délai. Sans autorisation, point de référence de démonstration au centre de Paris. Les distances sont à vol d’oiseau vers le départ approximatif, pas des distances d’itinéraire.
- Filtre favorisant les segments avec ≥ 70 % de voies piétonnes et ≥ 90 % de voies piétonnes ou dotées d’un trottoir ; tri par fluidité pour comparer les feux.
- Favoris et résultats déclaratifs persistants via `localStorage`. Un seul meilleur temps par coureur fictif et un seul meilleur temps pour « Vous » dans chaque classement. Aucun serveur, compte, authentification ou classement partagé.
- Saisie d’un temps (1 s à 24 h), import JSON normalisé, export des résultats locaux et suppression.
- PWA : manifeste relatif, icônes PNG 192/512, icône maskable, icône Apple 180, zones de sécurité iPhone, service worker pour le shell et les exemples hors ligne.
- **Carnet 1.3** : niveau et points (10 par km, 20 par nouveau segment, 15 par duel gagné), objectif hebdomadaire réglable avec anneau de progression, série de jours, allure moyenne, 13 badges, meilleur temps par segment. Tout est calculé localement à partir des résultats déclarés (`progress.js`).
- **Records** : à l’ajout d’un temps, le message indique « premier temps » ou « nouveau record » avec l’écart ; chaque fiche affiche votre record, une estimation de temps (formule de Riegel, indicative), un tableau « temps selon l’allure » et un **profil altimétrique schématique** (courbe déterministe dont le dénivelé cumulé vaut le dénivelé annoncé, jamais le relief réel).
- **Chrono persistant** : un duel lancé continue si vous fermez la fenêtre ou si iOS décharge l’app ; une barre « Chrono » en haut permet de reprendre. L’écran reste allumé pendant le chrono quand le navigateur le permet (Wake Lock).
- Explorer : filtre ★ Favoris, bouton **Surprends-moi** (tirage parmi les segments filtrés), favoris cerclés de jaune et position « Vous » sur le schéma après géolocalisation, record affiché sur les cartes.
- **Sauvegarde / restauration** complète (résultats, favoris, coins, objectif) depuis Mon carnet ; partage d’un duel par la feuille de partage du téléphone.
- **Apparence Sport** (seule apparence depuis la 1.3) : noir, blanc et gris, titres condensés en capitales (police Anton), boutons ronds, tuile d’accueil noire ; le bleu électrique et le jaune de Popcorn restent des accents. Elle vit dans `sport.css`, appliquée par `<html data-style="sport">` par-dessus `styles.css` (l’ancienne identité « arcade » 1.1).
- Interface responsive, commandes tactiles, labels accessibles, dialogs clavier et signalement explicite du mode démo.

## Estimations et données

**Difficulté** : `score = distanceKm + denivelePositifMetres / 100`.

| Score | Difficulté |
| --- | --- |
| ≤ 3 | Facile |
| > 3 et ≤ 6 | Moyen |
| > 6 | Difficile |

Cette règle indicative ne prend pas en compte la pente maximale, le terrain, la chaleur ou le niveau du coureur.

**Fluidité** : `piétonPct + 0.65 × trottoirPct - 5 × feux / distanceKm`, arrondi et limité à 0–100. Les deux parts sont disjointes et exprimées sur l’ensemble du segment. Un segment entièrement piéton sans feu obtient 100. Toutes les valeurs de ce jeu sont fictives.

Remplacez les exemples dans `data.js` par des segments vérifiés pour une suite du projet. Pour de vrais tracés, il faudra des géométries géographiques et une cartographie dédiée. Des données routières peuvent aider à repérer `footway`, `pedestrian`, `sidewalk`, `crossing` et `traffic_signals`, mais elles nécessitent de vérifier couverture, accès piéton et conditions sur place. Aucun moteur de calcul d’itinéraires n’est inclus.

## Montres : intégration préparée, pas connectée

`watch-adapters.js` expose un contrat `WatchAdapter` avec `connect()`, `listActivities()` et `normalizeActivity()`. Les méthodes de connexion et de récupération lèvent une erreur explicite : aucune connexion n’est simulée comme réelle. L’interface affiche **Non connecté** pour tous les fournisseurs.

`FileImportAdapter` fonctionne localement avec les **fichiers GPX** (export de la plupart des montres et applications de course : distance cumulée en ignorant les sauts de signal à plus de 12 m/s, durée entre le premier et le dernier point, 5 Mo maximum) ou avec le format JSON ci-dessous. FIT et TCX ne sont pas pris en charge. Une activité importée est associée manuellement au segment entier, avec confirmation, et doit être à ± 3 % de sa distance. Pour un GPX, l’écart entre le départ de l’activité et le départ du segment est affiché en avertissement. Ces comparaisons ne vérifient ni le tracé ni l’intégrité du temps.

```json
{
  "schemaVersion": 1,
  "sport": "running",
  "startedAt": "2026-10-05T08:00:00+02:00",
  "durationSeconds": 720,
  "distanceMeters": 2400,
  "source": "Export converti manuellement",
  "demo": false
}
```

Le bouton **Charger un exemple fictif** produit une activité fictive de 2,4 km / 12 min, adaptée à « La Seine en douceur ». Le fichier correspondant est dans `examples/activity-demo.json`. Taille maximale : 100 000 octets. Durée 30–86 400 s, distance 100–200 000 m, date ISO valide.

Pour une vraie intégration : développer des adaptateurs selon les APIs et conditions actuelles des fournisseurs, une app native iOS pour HealthKit si nécessaire, un serveur pour l’autorisation fournisseur et les secrets, le stockage utilisateur et la validation. **Ne jamais placer de secret dans ce dépôt public ou dans le JavaScript livré au navigateur.** GitHub Pages ne fournit pas ce serveur. Aucun dispositif Bluetooth, montre ou compte fournisseur n’est interrogé ici.

## Stockage, hors ligne et mises à jour

- Position GPS : utilisée seulement en mémoire pour la proximité ; non stockée et non envoyée par le code. Elle ne figure pas dans les exports.
- Fichiers importés : traités dans le navigateur ; aucune transmission. Aucun outil analytique ni police/cartographie distante (la police Anton du style Sport est embarquée dans `fonts/`).
- Favoris et temps : clé `popcorn-v1` dans `localStorage`. Ils peuvent être effacés par le navigateur, le mode privé ou la suppression de l’app. Le stockage peut différer entre Safari et la PWA installée ; pas de synchronisation entre appareils.
- La version accepte au maximum 500 résultats locaux. Sauvegardez-les depuis Mon carnet avant d’effacer les données.
- Le fichier de sauvegarde (`popcorn-sauvegarde.json`) se restaure depuis Mon carnet (« Restaurer une sauvegarde ») ; il remplace les données de l’appareil après confirmation. Il n’est pas un fichier d’activité et ne passe pas par l’import d’activité. Un chrono en cours est conservé sous la clé `popcorn-race-v1`.
- Le mode hors ligne exige un premier chargement réussi sous HTTPS ou localhost. Les fonctions locales et données démo fonctionnent ensuite sans réseau. La disponibilité GPS dépend du système ; aucune carte en ligne n’est requise. iOS peut vider le cache.
- Après modification des fichiers, incrémentez la version du cache dans `sw.js` (`v1.3.0` → `v1.3.1`), publiez puis fermez **tous** les onglets/fenêtres Popcorn et rouvrez avec Internet. Depuis la 1.3 le nouveau service worker s’active seul (`skipWaiting`) et l’app affiche un message invitant à recharger. Pour un test immédiat, supprimez l’ancien service worker/cache depuis les outils du navigateur, en gardant `localStorage` si vous souhaitez conserver les résultats.

## Structure

```text
popcorn/
  index.html              interface et navigation
  styles.css              thème Arcade et adaptation mobile
  sport.css               thème Sport (noir et blanc, titres condensés)
  fonts/                  police Anton (licence OFL) embarquée en local
  data.js                 segments (8 fictifs + 28 lieux réels d’Île-de-France, valeurs indicatives) et coureurs fictifs
  tracks-data.js          tracés réels encodés (généré)
  track-utils.js          décodage, icône, profil d’altitude
  gpx.js                  export GPX (boucle ou aller-retour piéton, routage OpenStreetMap)
  motion.css              animations du style Sport et styles de la navigation
  core.js                 difficulté, fluidité, distances, validation
  app.js                  interactions et stockage local
  watch-adapters.js       contrat fournisseurs et import JSON local
  challenges.js           coins des coureurs, invitations et duels
  progress.js             niveaux, badges, records, estimations, profil altimétrique schématique
  manifest.webmanifest    paramètres d’installation
  sw.js                   cache hors ligne
  icons/                  SVG, PNG et icône Apple
  examples/               activité fictive d’import
  tests/                  tests du cœur sans dépendances
  server.mjs              serveur local Node facultatif
  .nojekyll               publication statique
  README.md               ce guide
  VERIFICATION.md         résultats des contrôles réalisés
```

Pour relancer les tests de calcul/validation : `node tests/core.test.cjs`, `node tests/challenges.test.cjs` et `node tests/progress.test.cjs` (Node.js 18+). Les tests visuels et hors ligne réalisés lors de la création sont résumés dans `VERIFICATION.md`.

## Si quelque chose ne fonctionne pas

- **404 sur GitHub Pages** : vérifiez que `index.html` est à la racine de la branche/dossier choisi, que le déploiement est terminé et que l’URL contient le bon nom de dépôt.
- **Écran vide** : vérifiez que tous les fichiers et sous-dossiers ont été transférés et que JavaScript est autorisé. N’ouvrez pas l’aperçu du code dans GitHub comme s’il était le site publié.
- **Localisation refusée** : autorisez la localisation pour Safari/le site dans les réglages iPhone puis réessayez ; utilisez HTTPS.
- **Pas d’installation iPhone** : ouvrez le site directement dans Safari, puis utilisez le menu Partager, pas un navigateur intégré d’une autre app.
- **Ancienne interface après publication** : suivez la procédure de mise à jour du service worker ci-dessus.
- **Données perdues** : pas de serveur de sauvegarde dans ce prototype ; conservez vos exports.

La compatibilité est prévue pour Safari iPhone moderne (iOS 16.4+) et navigateurs actuels. Les contrôles automatisés en navigateur sont décrits dans `VERIFICATION.md` ; aucun essai sur un iPhone physique ni connexion à une montre réelle n’est revendiqué.

## Identité visuelle 1.1

Logo vectoriel ailé original dans `icons/logo.svg`, icônes PWA coordonnées, bleu électrique et accents jaune/corail. La charte et les règles de déclinaison sont dans `CHARTE-GRAPHIQUE.md`.

## Défis des coureurs et fantômes — version 1.2

### Proposer un coin connu

Ouvrez **Défis → Proposer mon coin**. Renseignez un pseudo, le nom et le quartier du segment, les repères de départ et d’arrivée, les indications pour suivre le parcours, la distance, le dénivelé et les coordonnées du départ. Les coordonnées initiales désignent seulement le centre de Paris : remplacez-les par celles de votre départ. La zone acceptée est 48,4–49,3° N et 1,6–3,2° E, autour de Paris. La distance acceptée est de 0,1 à 50 km. Les parts piétonnes et avec trottoir ne se recouvrent pas et totalisent au maximum 100 %.

Les distances, dénivelés et conditions de circulation sont **déclarés par le créateur, non vérifiés**. Le pseudo n’est pas un compte authentifié. Le dessin montré reste décoratif ; les indications écrites ne deviennent pas automatiquement un tracé GPS. Aucun relevé de parcours, routage ou validation d’accès n’a été ajouté.

Choisissez un fantôme puis une visibilité :

- **Public par lien** : le coin apparaît dans Explorer sur cet appareil. Le lien contient une copie lisible de ses informations ; toute personne le recevant peut ouvrir puis accepter ce défi. Il n’est pas automatiquement publié dans un annuaire public mondial.
- **Privé** : le coin apparaît dans Défis sur l’appareil qui le détient, et reste exclu de la liste Explorer. Au partage, choisissez un mot de passe d’au moins 8 caractères et transmettez-le séparément du lien. Le destinataire doit déchiffrer l’invitation, vérifier ses informations puis l’accepter.

**Créer mon défi local** ouvre la préparation de l’invitation. Cliquez sur **Créer le lien public/privé**, puis copiez et transmettez ce lien vous-même. En aperçu sur `localhost` / `127.0.0.1`, le lien n’est utilisable que sur le même ordinateur. Pour inviter d’autres personnes, ouvrez d’abord l’app à son adresse HTTPS GitHub Pages ; les invitations utiliseront cette adresse.

### Ce que protège le partage privé

Les données du lien privé sont chiffrées avec AES-GCM 256 bits, une clé dérivée du mot de passe par PBKDF2-SHA-256 (150 000 itérations), un sel aléatoire de 16 octets et un nonce aléatoire de 12 octets. Le mot de passe n’est pas incorporé au lien ni enregistré dans l’état local. Une nouvelle invitation utilise de nouveaux paramètres aléatoires. Le chiffrement exige un contexte sécurisé HTTPS ou localhost et Web Crypto.

Après acceptation, le segment est stocké **en clair dans localStorage sur l’appareil**, comme les autres informations de l’app. Ce mécanisme protège les détails contenus dans le lien ; il ne constitue pas une gestion de comptes ou de droits d’accès côté serveur. Les personnes disposant du lien et du mot de passe peuvent recopier le défi. Les liens et les copies reçues ne peuvent pas être révoqués à distance. Effacer vos données locales ne retire pas les copies déjà partagées.

Maximum : 50 coins par appareil. La clé de stockage reste `popcorn-v1`, pour conserver les anciens favoris et temps. Les huit segments de démonstration restent présents. Les résultats des autres appareils **ne se synchronisent pas**, et les classements des coins ajoutés sont uniquement locaux. Un futur service public/privé centralisé nécessitera un serveur, des comptes, une base de données, des autorisations et une modération.

### Défis fantômes par segment

Depuis **Défis**, choisissez un segment et un adversaire, ou touchez **Défier un fantôme** dans une fiche. Quatre allures de jeu sont proposées :

| Fantôme | Allure constante fictive |
| --- | --- |
| La Fusée olympique | 2:55 /km |
| Le Lièvre éclair | 2:00 /km |
| Cro-Magnon express | 4:30 /km |
| Le Renard tranquille | 6:00 /km |

Ces valeurs sont des **règles de jeu inventées**. Elles ne reproduisent aucun record officiel, athlète nommé, mesure animale ou capacité historique. La vitesse est supposée constante sur toute la distance ; le relief, la fatigue, les arrêts et la physiologie ne sont pas modélisés.

Le temps cible est `arrondi(distanceKm × allureSecondesParKm)`. Deux modes fonctionnent :

1. **Lancer mon chrono**, puis **J’ai terminé** : chronométrage manuel. La progression affichée pendant le chrono représente le fantôme théorique ; aucune position du coureur n’est mesurée. Fermer le dialogue annule le chrono ; iOS peut suspendre l’application en arrière-plan.
2. **Comparer un temps déjà réalisé** : saisissez les minutes et secondes, puis **Voir le duel**.

Le bilan distingue victoire, défaite et égalité : « Tu l’aurais mis dans le vent ! », « Il t’aurait rattrapé ! » ou « Photo finish : à égalité ! ». La formule « rattrapé » est un récit ludique : les deux adversaires sont supposés partir ensemble. L’écart théorique en mètres est mesuré au moment où le premier franchit l’arrivée, en supposant aussi votre allure constante.

Le résultat n’est enregistré que si vous touchez **Enregistrer mon temps local**. Il reste déclaratif et non vérifié. Les temps saisis/manuels sont acceptés de 1 seconde à 24 heures pour permettre les petits segments ; l’import d’activité JSON conserve sa validation de 30 secondes minimum.

Tests complémentaires : `node tests/challenges.test.cjs` (validation des segments, victoire/défaite/égalité, aller-retour des invitations publiques et chiffrées, refus des mots de passe incorrects et des liens invalides).
