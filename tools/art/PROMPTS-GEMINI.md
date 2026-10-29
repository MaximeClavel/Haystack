# Prompts Gemini — habitants, accessoires et actions (style « Ville luxuriante »)

À chaque fois : joindre **une planche de personnages de base** (par ex. `docs/art/style-retenu/bases-couleurs-reperes-2.jpg`)
comme référence de style, format **16:9**, fond blanc. Les vêtements recolorables restent en **haut vert vif / bas bleu vif**.

## A. Autres habitants

**A1 — types de vêtements**
```
Same art style, proportions, outlines and shading as the attached character sheet. A character sheet of six new townspeople standing side by side, full body, three-quarter view facing the viewer, same scale, plain white background, generous spacing, NO hats, NO accessories, NO text. Outfits: a woman in a long buttoned coat, a man in a business suit with a tie, a woman in a knee-length summer dress, a teenager in a t-shirt and shorts, a man in work overalls, an old woman in a raincoat. IMPORTANT: every upper garment (coat, suit jacket, dress, t-shirt, overalls bib, raincoat) is painted in bright saturated green; every trousers, skirt or shorts is painted in bright saturated blue (for the dress, paint the whole dress green); shirts under jackets are white; shoes are dark brown.
```

**A2 — encore plus de variété**
```
Same art style, proportions, outlines and shading as the attached character sheet. A character sheet of six new townspeople standing side by side, full body, three-quarter view facing the viewer, same scale, plain white background, generous spacing, NO hats, NO accessories, NO text: a very tall thin man with a long beard, a short round woman with a long braid, a bald middle-aged man with a goatee, a teenage girl with short dyed pink hair, a young woman with a hijab, a toddler. Varied skin tones. IMPORTANT: tops painted in bright saturated green, trousers, skirts or shorts painted in bright saturated blue, shoes dark brown.
```

**A3 — métiers (tenues fixes, couleurs réelles)**
```
Same art style, proportions, outlines and shading as the attached character sheet. A character sheet of eight townspeople in work outfits, full body, three-quarter view facing the viewer, same scale, plain white background, generous spacing, NO text: a baker with a white chef hat and white apron, a police officer in a navy uniform and kepi, a postman with a blue uniform, cap and mail bag, a gardener in green overalls with a straw hat, a waiter in a white shirt, black vest and long black apron, a nurse in a white uniform, a firefighter in a dark uniform with a helmet, a construction worker with an orange vest and yellow helmet.
```

## B. Accessoires (isolés, sans mains, à la taille des personnages)

**B1 — chapeaux**
```
Same art style, outlines and shading as the attached character sheet. A sheet of twelve hats shown alone, no heads, three-quarter view, sized to fit the heads of the attached characters, plain white background, generous spacing, NO text: a flat cap, a French beret, a bowler hat, a top hat, a knitted beanie, a fedora, a yellow construction helmet, a bicycle helmet, a white chef toque, a French police kepi, a straw boater with a ribbon, a wide sun hat.
```

**B2 — accessoires portés**
```
Same art style, outlines and shading as the attached character sheet. A sheet of accessories shown alone, nobody wearing them, three-quarter view, sized to fit the attached characters, plain white background, generous spacing, NO text: round glasses, sunglasses, a black burglar eye mask, a long knitted scarf, a backpack, a leather handbag, a briefcase, a rolling suitcase, a walking cane.
```

**B3 — objets tenus (1)**
```
Same art style, outlines and shading as the attached character sheet. A sheet of hand-held objects shown alone, no hands, sized to be held by the attached characters, plain white background, generous spacing, NO text: an open umbrella, a closed umbrella, a compact camera, a folded newspaper, a bouquet of flowers, a red balloon on a string, a baguette, an ice cream cone, a smartphone, a folded paper map, a letter in an envelope, a flashlight.
```

**B4 — objets tenus (2, enquêtes)**
```
Same art style, outlines and shading as the attached character sheet. A sheet of hand-held objects shown alone, no hands, sized to be held by the attached characters, plain white background, generous spacing, NO text, no dollar signs: a kitchen knife, a cloth money bag, a small framed painting, an old brass key, a crowbar, a glass bottle, a cake on a plate, a sparkling diamond jewel, a cardboard box, a coil of rope, a big sewing needle with thread, a small dog on a red leash.
```

**B5 — bulles d'émotion**
```
Same art style and outlines as the attached character sheet. A sheet of eleven small round comic speech bubbles shown alone, plain white background, generous spacing, no letters except the symbols listed: an exclamation mark, a question mark, a red heart, an angry red vein symbol, "Zzz" sleep, music notes, a blue sweat drop, two crossed-out eyes for knocked out, a light bulb idea, three dots for talking, a small star burst.
```

## C. Actions (16 poses du jeu)

Gabarit (remplacer `[ACTION]`, joindre une planche de base, une génération par planche et par action) :
```
Here is a character sheet of six townspeople. Redraw exactly the same six characters, same faces, hairstyles, body shapes, skin tones and clothes, with the top still bright saturated green and the bottom still bright saturated blue, in the same order from left to right, now [ACTION]. All facing right in three-quarter view, full body, same scale and same art style, plain white background, generous spacing so they don't touch, no text, no extra objects or furniture unless mentioned.
```

| Pose du jeu | `[ACTION]` |
|---|---|
| stand (debout) | déjà fait (planches de base) |
| walk (marche) | walking to the right, mid-stride, arms swinging naturally |
| run (court) | running to the right, dynamic stride, arms pumping |
| sit (assis) | sitting as if on a bench, knees bent, hands on their lap (do not draw the bench) |
| lie (allongé) | lying flat on their back on the ground, eyes closed, seen from the side |
| crouch (accroupi) | crouching down, looking at something on the ground |
| climb (grimpe) | climbing a short wooden ladder, both arms raised to grab the rungs |
| point (montre du doigt) | pointing forward to the right with one arm fully extended |
| wave (salue) | waving hello with one raised hand |
| carry (porte) | carrying a large cardboard box in front of them with both arms |
| phone (téléphone) | talking on a smartphone held to the ear |
| fight (se bat) | in a comic fighting stance, fists raised, angry face |
| handsup (mains en l'air) | both hands raised high in surrender, surprised face |
| sneak (furtif) | tiptoeing sneakily, bent forward, looking around suspiciously |
| read (lit) | reading an open newspaper held in both hands |
| window (à la fenêtre) | shown from the waist up only, leaning on their forearms as if looking out of a window (do not draw the window) |

Ordre conseillé : walk, sit, point, phone, wave, read (la foule), puis les autres (scènes d'enquête).
Le regard vers la gauche s'obtient en retournant l'image : inutile de le générer.
