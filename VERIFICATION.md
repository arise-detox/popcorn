# Vérifications de Popcorn 1.2

Réalisées le 5 octobre 2026. Ce rapport distingue les contrôles effectués des compatibilités prévues.

## Popcorn 1.3 — progression, records, chrono persistant, GPX (5 octobre 2026)

Contrôles réalisés dans le navigateur intégré de Claude, sur un serveur local (Node n’est pas installé sur ce poste : les fichiers `tests/*.test.cjs` ont été exécutés dans le navigateur avec une petite doublure de `require`/`assert`).

- `tests/core.test.cjs` : 19 assertions réussies (dont le départ GPS optionnel d’une activité). `tests/progress.test.cjs` : toutes les assertions réussies (nature d’un résultat premier/record, records battus en ordre chronologique, série de jours, semaine du lundi, niveaux, points, 13 badges, estimation de Riegel, tableau d’allures, profil altimétrique déterministe dont le dénivelé cumulé égale celui annoncé).
- Carnet : niveau, points, barre de progression, statistiques, anneau d’objectif hebdomadaire, badges verrouillés/débloqués, records. Aucun débordement horizontal à 320 px sur les cinq écrans.
- Ajout d’un temps meilleur que le record : message « nouveau record » avec écart et confettis (désactivés si la préférence de réduction des animations est active).
- Chrono : lancé, fenêtre fermée, barre « Chrono » visible, rechargement de la page, reprise à 7:07 après avancement simulé de l’heure de départ, fin et suppression de la clé de stockage. Un second duel est redirigé vers le chrono en cours.
- Import GPX synthétique de 2,4 km avec un saut de signal : distance 2 387 m, durée 12:00, départ à 0 m du segment, association acceptée dans la tolérance de 3 %.
- Sauvegarde puis effacement puis restauration : 5 résultats et 2 favoris retrouvés ; un fichier invalide est refusé avec un message.
- Filtre Favoris (2 segments), Surprends-moi (ouvre une fiche), favoris cerclés de jaune sur le schéma.
- Service worker : cache `v1.3.0`, `progress.js` dans le shell, `skipWaiting`.

- Style Sport (`sport.css`) : accueil, carte, liste, fiche segment, carnet, défis, duel et navigation contrôlés à 375 px ; aucun débordement horizontal à 375 px sur les cinq écrans ; le style Sport est la seule apparence (bascule retirée) ; aucune erreur dans la console.

Limites : pas d’essai sur iPhone réel ; la police Anton (`fonts/anton-latin.woff2`, 18 Ko, licence OFL dans `fonts/ANTON-OFL.txt`) est embarquée en local et chargée sans requête externe ; le verrou d’écran (Wake Lock) n’a pas pu être confirmé dans le navigateur de test ; le partage natif n’a pas été déclenché ; les GPX de vraies montres n’ont pas été essayés.

## Défis 1.2 et reprise après interruption de Codex

- Les fichiers de travail ont été retrouvés après le plantage de Codex. Le serveur d’aperçu a été relancé. Ce contrôle ne diagnostique ni ne répare la cause du plantage de Codex.
- Tests du cœur : 16 assertions réussies. Tests des défis : 24 assertions réussies, couvrant les limites des segments, victoire/défaite/égalité, encodage public, chiffrement/déchiffrement privé et rejet de mots de passe/liens invalides.
- Création d’un coin public et d’un coin privé dans l’interface, refus des proportions de voies dépassant 100 %, refus d’un mot de passe trop court. Le public apparaît dans Explorer ; le privé en reste exclu. Persistance après rechargement.
- Invitations ouvertes sur une seconde origine locale sans les données du créateur : prévisualisation publique, acceptation explicite, invitation privée verrouillée, rejet d’un mot de passe incorrect puis déchiffrement et acceptation avec le mot de passe de test.
- Duel sur 2,4 km : cible olympique 7:00 ; 6:30 donne une victoire et 171 m d’écart théorique ; 8:00 donne une défaite ; 7:00 donne une égalité. Enregistrement local vérifié. Chronomètre manuel démarré et arrêté avec bilan.
- Affichage des défis à 390 pixels et du formulaire à 320 pixels : contrôles visuels, absence de débordement horizontal du document.
- Après le plantage, aucun serveur n’écoutait sur les ports de test : rechargement de Popcorn et duel réussis depuis le cache hors ligne 1.2, avec conservation des deux coins locaux.
- Aucun avertissement ou erreur JavaScript relevé dans le journal du navigateur lors de la reprise.
- Le ZIP 1.2 est `Popcorn-PWA-defis.zip`. Le rapport voisin `Popcorn-archive-verification.txt` contient les contrôles d’archive et de téléchargement HTTP local.

Les exemples créés pendant les essais sont dans le stockage du navigateur de test ; ils ne sont pas inclus comme données initiales du ZIP. Les fantômes sont des règles de jeu fictives. Le partage fonctionne par liens, sans annuaire commun ni synchronisation des résultats.

## Mise à jour graphique 1.1

Identité arcade moderne : logo SVG ailé original, anneau jaune, bleu électrique, accents corail, cartes et navigation redessinées, icônes PWA et Apple coordonnées. Le fichier `CHARTE-GRAPHIQUE.md` documente la palette et les usages.

Contrôles complémentaires : affichage du logo et de la nouvelle palette dans le navigateur ; absence de débordement horizontal aux largeurs 320 et 390 pixels ; filtre Difficile toujours fonctionnel (2 segments) ; service worker passé à `v1.1.0` et logo ajouté au shell hors ligne. Serveur arrêté puis page rechargée : logo chargé et 8 segments disponibles avec la nouvelle palette. Nouvelle archive `Popcorn-PWA-arcade.zip`, contrôlée par CRC, extraction, comparaison des fichiers et téléchargement HTTP local.

## Contrôles effectués

- Écriture et lecture de fichiers dans le dossier de livraison : réussies.
- Tests Node du cœur : 16 assertions réussies (seuils de difficulté, fluidité, distances à vol d’oiseau, temps et rejet d’activités invalides).
- Syntaxe JavaScript du projet vérifiée.
- Chargement HTTP de la PWA sous `/popcorn/`, représentant un sous-dossier GitHub Pages : réussi.
- Affichage dans le navigateur intégré Codex : écrans mobiles de 320 et 390 pixels, et écran de 1280 pixels ; contrôle du débordement horizontal et revue visuelle.
- Recherche « sceaux » : 1 segment. Facile : 2 segments. Difficile : 2 segments. Filtre voies piétonnes/trottoirs : 7 segments. Rayon 2 km depuis le centre de Paris : 2 segments.
- Favori ajouté ; ajout d’un temps de 12:34 ; refus d’un temps nul ; résultat et favori présents après rechargement.
- Import de l’exemple fictif via le bouton et via le fichier JSON : réussi. Confirmation d’association obligatoire. Import refusé si l’écart de distance dépasse 3 %. Le classement conserve un seul meilleur temps local par segment.
- Service worker activé et shell mis en cache. Serveur local arrêté, absence de réponse réseau confirmée, puis page rechargée : les 8 segments, les détails et les résultats locaux restent utilisables.
- Aucun message d’erreur JavaScript relevé pendant ces essais dans les journaux du navigateur.
- Icônes PNG créées aux dimensions du manifeste et de l’icône Apple.
- Archive ZIP relue intégralement avec contrôle CRC ; présence du README, du manifeste, du service worker, des scripts et des icônes ; extraction et comparaison octet par octet avec les fichiers livrés. Taille et SHA-256 figurent dans le rapport d’archive voisin du ZIP.

## Limites des essais

- Aucun iPhone physique ou navigateur Safari réel testé. Les dimensions mobiles ne remplacent pas un essai sur appareil. Les balises iOS, le manifeste relatif, le service worker, les PNG Apple et les zones de sécurité sont inclus ; l’installation Safari suit le guide Apple cité dans le README.
- Géolocalisation implémentée via l’API du navigateur avec gestion des succès, refus et délais ; aucune position personnelle réelle demandée pendant ces essais.
- Le bouton d’export a été déclenché, mais l’outil de téléchargement du navigateur intégré n’a pas confirmé la récupération du fichier Blob. Cette récupération n’est donc pas certifiée par cet essai ; elle utilise le mécanisme standard Blob + lien download. Le téléchargement du ZIP livré est distinct, par fichier local réel.
- Aucun déploiement sur un compte GitHub effectué ; la compatibilité de chemin a été contrôlée localement sous `/popcorn/`.
- Aucune montre, aucun fournisseur, aucun classement partagé ou tracé réel connecté. L’application expose ces limites à l’écran.
