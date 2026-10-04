# Popcorn — arcade moderne

Une identité sportive, joyeuse et ouverte à tous. L’énergie des jeux de course des années 1990 se traduit par un emblème ailé, un anneau doré, du bleu vif et des lignes fluides. Le dessin est original et garde le popcorn comme symbole central.

## Logo

`icons/logo.svg` : deux ailes symétriques à trois plumes, anneau jaune, petit seau de popcorn, bandeau bleu et signature blanche inclinée. Le dessous corail donne du relief. Les ailes expriment la légèreté et le mouvement.

`icons/icon.svg` et les PNG : version compacte, symbole ailé sans texte pour l’écran d’accueil. Utiliser les PNG fournis pour la PWA et l’icône Apple.

Préférer le logo sur fond blanc ou bleu très clair. Garder une marge libre d’au moins la hauteur d’une plume. Ne pas étirer, recadrer les ailes ou ajouter d’autres contours. Le SVG contient du texte avec polices système ; une exportation destinée à l’impression pourra convertir ce texte en tracés.

## Palette

| Couleur | Valeur | Utilisation |
| --- | --- | --- |
| Bleu électrique | `#2857F0` | Actions, sélection, logo et accents |
| Bleu nuit | `#142652` | Titres et texte principal |
| Bleu ciel | `#E5EFFF` | Carte et surfaces secondaires |
| Blanc bleuté | `#F3F7FF` | Fond général |
| Jaune lumineux | `#FFDF59` | Anneau, symbole, détails de jeu |
| Corail | `#EF6A56` | Détail du logo et touches décoratives |
| Corail foncé | `#B9412D` | Accents textuels sur fond clair |
| Gris bleuté | `#526384` | Informations secondaires |

Le blanc et les bleus très clairs occupent la majorité de l’interface. Le bleu électrique indique les actions. Le jaune et le corail restent des accents, pour préserver la lisibilité.

## Typographie et composants

Polices système sans serif : SF sur iPhone, Segoe UI sur Windows. Titres forts et légèrement resserrés ; corps de texte simple et lisible. Seul le mot du logo est incliné. Pas de police pixel pour les informations, pas de scanlines ni d’effet néon sur les textes.

Cartes blanches aux coins arrondis, contours bleu clair, ombres discrètes. Boutons principaux bleus avec un léger relief, sélection bleue et petits accents jaunes. La carte prend des couleurs ciel et eau. Les badges de difficulté conservent leurs libellés et leurs couleurs distinctes.

Les anneaux décoratifs restent secondaires, sans transformer la course en interface de jeu complexe. Les interactions respectent la préférence système de réduction des animations. Les mentions Démo, les erreurs et les statuts de connexion restent clairement visibles.
