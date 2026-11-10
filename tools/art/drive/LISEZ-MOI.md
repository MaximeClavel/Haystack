# Haystack — générations Gemini

La carte de Meulebourg est faite en deux temps : une **carte mère** (toute la ville en une image), puis des **morceaux** de cette image que Gemini agrandit et détaille un par un, avec les personnages et les objets des enquêtes.

## Contenu

- `00-references/` : les images de style (`diorama.jpg`, `habitants.jpg`).
- `01-personnages/` : un dossier par personnage d'enquête (25), avec sa fiche `resultat.png` une fois générée. Ces fiches sont jointes aux morceaux où le personnage apparaît.
- `02-carte-mere/` : le plan schématique `plan.png`, le `prompt` de la carte mère, puis son `resultat.png`.
- `03-morceaux/` : créé après la carte mère. Un dossier par morceau, avec le morceau à agrandir et son `prompt`.

## Marche à suivre

1. Générer la carte mère (dossier `02-carte-mere`) et l'enregistrer en `resultat.png`.
2. Claude la découpe en morceaux et prépare leurs prompts.
3. Essai sur deux morceaux voisins, en haut de la carte, avant de lancer les autres.
4. Claude recolle les morceaux agrandis.

L'ancienne méthode (36 sections générées séparément) est dans le dossier `_archive`, à la racine du Drive.
