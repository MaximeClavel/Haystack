# Octave Carat

**Rôle** : le bijoutier · **Enquêtes** : La Grande Paille

## Étape 1 — le personnage

Pièces jointes, dans cet ordre :

1. `1-personnage.png` — le personnage de base
2. `2-chapeau.png` — le chapeau
3. `3-visage.png` — lunettes / masque
4. `4-accessoire.png` — l'accessoire

Prompt (format **3:4**) :

```
Same art style, outlines and shading as the attached images. Edit the character in image 1: keep the same face shape, expression, proportions and drawing style, but give them: slim build, very fair skin, bald head with a little grey hair on the sides, round glasses. Outfit: purple suit jacket over a white shirt, purple trousers, dark brown shoes. The character wears the items shown in the other attached images, copying their design and colours exactly: image 2 = the top hat; image 3 = the round glasses; image 4 = the walking cane held in one hand. Full body, three-quarter view, body turned slightly to the right, same scale and same art style, plain white background, no ground shadow, no text, no other character, no object other than those mentioned.
```

Garde l'image réussie sous le nom `resultat.png` dans ce dossier.

## Étape 2 — les poses de l'enquête

Une génération par ligne. Pièces jointes : `resultat.png` (et l'objet indiqué). Le regard vers la gauche s'obtient en retournant l'image : inutile de le générer.

### montre du doigt  (`resultat.png`)

```
Redraw exactly the same character as in image 1 (same face, hair, body shape, clothes, colours, hat and accessories), now pointing forward to the right with one arm fully extended. Full body, three-quarter view, body turned slightly to the right, same scale and same art style, plain white background, no ground shadow, no text, no other character, no object other than those mentioned.
```

### téléphone  (`resultat.png`)

```
Redraw exactly the same character as in image 1 (same face, hair, body shape, clothes, colours, hat and accessories), now talking on a smartphone held to the ear. Full body, three-quarter view, body turned slightly to the right, same scale and same art style, plain white background, no ground shadow, no text, no other character, no object other than those mentioned.
```

### furtif — tient : gâteau  (`resultat.png` + `objet-cake.png`)

```
Redraw exactly the same character as in image 1 (same face, hair, body shape, clothes, colours, hat and accessories), now tiptoeing sneakily, bent forward, looking around suspiciously, holding the cake on a plate (image 2) in one hand. Full body, three-quarter view, body turned slightly to the right, same scale and same art style, plain white background, no ground shadow, no text, no other character, no object other than those mentioned.
```
