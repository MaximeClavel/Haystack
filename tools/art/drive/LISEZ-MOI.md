# Haystack — générations Gemini

La carte de Meulebourg est générée **section par section**, personnages, actions et objets des enquêtes compris dans l'image.

## Contenu

- `00-references/` : les deux images de style à joindre (`diorama.jpg`, `habitants.jpg`).
- `01-personnages/` : un dossier par personnage d'enquête (25). Chaque `prompt.md` donne une planche du personnage, de face et de dos. Elle sert de modèle pour que le personnage soit le même dans toutes les sections.
- `02-carte/` : un dossier par section de la carte (36), plus `plan.md`.

## Marche à suivre

1. Générer les personnages d'une enquête (leur `resultat.png` va dans leur dossier). Les sosies se font après leur modèle.
2. Générer les sections où ils apparaissent, en joignant `diorama.jpg` puis leurs `resultat.png`, dans l'ordre indiqué.
3. Contrôler la liste « À vérifier » de la section, regénérer si un détail d'enquête est faux.
4. Enregistrer l'image réussie en `resultat.png` dans le dossier de la section.
