# tools/art — images de direction artistique générées par IA

Outil de recherche graphique (non publié) : génère, pour chaque piste de style, un diorama
isométrique d'un coin de Meulebourg, une planche des quatre habitants et un bâtiment isolé.
Il passe par l'API Gemini de Google (modèles d'image « Nano Banana »). La session cloud
n'a ni carte graphique ni accès aux sites qui hébergent des modèles : un service externe est
indispensable.

## Mise en place

1. Créer une clé sur Google AI Studio (aistudio.google.com, menu « Get API key »).
2. L'ajouter dans les réglages de l'environnement cloud (menu de l'environnement dans la barre
   de titre de la session, puis « Edit ») sous le nom `GEMINI_API_KEY`. Ne jamais la coller dans
   la conversation ni dans un fichier du dépôt.
3. Ouvrir une nouvelle session (la variable n'est lue qu'au démarrage).

## Utilisation

```
python3 tools/art/generate.py --list                    # jobs disponibles
python3 tools/art/generate.py --only s4-diorama --n 2   # deux variantes d'un job
python3 tools/art/generate.py --all --refs              # tout, avec l'image de référence du style
python3 tools/art/generate.py --only s1-personnages --model gemini-3-pro-image-preview
```

Les images sortent dans `.shots/art/` (ignoré par git). Les consignes sont dans `jobs.json` :
une partie commune, une par sujet (`assets`) et une par style (`styles`).

## Styles (d'après les références de `refs/`)

| id | Piste | Référence |
|---|---|---|
| s1 | Ville luxuriante (anime peint, végétation) | `ref1-ville-luxuriante.jpg` |
| s2 | Village de pierre (diorama en coupe) | `ref2-village-de-pierre.jpg` |
| s3 | Île low-poly (3D facettée, soir) | `ref3-ile-low-poly.jpg` |
| s4 | Diorama bonbon (contour prune, couleurs vives) | `ref4-diorama-bonbon.jpg` |

`--refs` joint l'image de référence pour l'ambiance et la palette seulement : le prompt demande de
ne copier ni son contenu ni ses personnages. Les références appartiennent à leurs auteurs ; elles
servent à orienter la recherche, pas à produire des copies.

## Limites

- Chaque appel est payant (au-delà du quota gratuit de Google AI Studio).
- Les images générées ne sont pas déterministes : relancer donne d'autres variantes.
- Pour le jeu lui-même, il faudra ensuite des sprites cohérents (même éclairage, même échelle,
  fond transparent) : à traiter une fois la piste choisie.
