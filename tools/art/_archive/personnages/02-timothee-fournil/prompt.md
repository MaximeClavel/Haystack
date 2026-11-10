# Timothée Fournil

**Rôle** : le livreur de la boulangerie · **Enquêtes** : La Tarte de bienvenue

## Étape 1 — le personnage

Pièces jointes, dans cet ordre :

1. `1-personnage.png` — le personnage de base
2. `2-chapeau.png` — le chapeau

Prompt (format **3:4**) :

```
Same art style, outlines and shading as the attached images. Edit the character in image 1: keep the same face shape, expression, proportions and drawing style, but give them: slim build, light tan skin, curly black hair. Outfit: white apron over a white shirt, red shorts, dark brown shoes. The character wears the items shown in the other attached images, copying their design and colours exactly: image 2 = the flat cap. Full body, three-quarter view, body turned slightly to the right, same scale and same art style, plain white background, no ground shadow, no text, no other character, no object other than those mentioned.
```

Garde l'image réussie sous le nom `resultat.png` dans ce dossier.

## Étape 2 — les poses de l'enquête

Une génération par ligne. Pièces jointes : `resultat.png` (et l'objet indiqué). Le regard vers la gauche s'obtient en retournant l'image : inutile de le générer.

### assis  (`resultat.png`)

```
Redraw exactly the same character as in image 1 (same face, hair, body shape, clothes, colours, hat and accessories), now sitting as if on a bench, knees bent, hands on the lap (do not draw the bench). Full body, three-quarter view, body turned slightly to the right, same scale and same art style, plain white background, no ground shadow, no text, no other character, no object other than those mentioned.
```

### porte — tient : gâteau  (`resultat.png` + `objet-cake.png`)

```
Redraw exactly the same character as in image 1 (same face, hair, body shape, clothes, colours, hat and accessories), now carrying the cake on a plate (image 2) in front of the body with both arms. Full body, three-quarter view, body turned slightly to the right, same scale and same art style, plain white background, no ground shadow, no text, no other character, no object other than those mentioned.
```
