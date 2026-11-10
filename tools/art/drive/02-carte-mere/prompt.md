# Carte mère de Meulebourg

Une seule image de toute la ville. Elle fixe l'angle, l'échelle, les rues et la rivière ; elle est ensuite découpée en morceaux que Gemini agrandit un par un (dossier `03-morceaux`, rempli après cette étape).

## Pièces jointes, dans cet ordre

1. `00-references/diorama.jpg` (style)
2. `02-carte-mere/plan.png` (plan schématique à respecter)

## Prompt — format **1:1**, résolution la plus haute

```
Image 1 is the STYLE reference. Image 2 is a LAYOUT SKETCH of a whole small French town seen from above in isometric view: grey = streets, beige = built city blocks, green = park, blue = river and pond, yellow = hay fields, light green = countryside and gardens, dark lines = railway tracks. Each numbered circle tells what its block contains (legend below).

Paint image 2 as ONE finished, richly detailed illustration, in exactly the art style, colours, lighting and camera angle of image 1 (lush, cozy French small town, hand-painted, ivy and moss, warm daylight from the upper left).

LAYOUT RULES: keep the layout of image 2 exactly. Every street, block, the river, the two bridges, the pond and the railway stay at the same position, with the same size and the same orientation as in the sketch. All streets are straight and run along the two diagonal directions. The picture fills the whole frame from edge to edge: no floating slab, no border, no empty background. Around the town: countryside with hay fields, haystacks, hedges and trees; the river continues to the edges of the image.

CONTENT RULES: do NOT draw the numbered circles, and no text or label anywhere. The whole town is visible, so buildings are small: draw each one carefully (roofs, windows, awnings, trees, gardens). In every block the main building stands at the back of the block (upper side) and faces the lower left or the lower right. No people and no vehicles at this scale.

LEGEND:
1. railway depot: locomotive shed, water tower, wagons, railway tracks arriving from the upper right of the image.
2. quiet residential street: ivy-covered town houses with small gardens.
3. market square with striped stalls, a bakery with a pink awning and a butcher's shop behind it.
4. art deco cinema with a rounded corner tower.
5. park: lawns, trees and the bronze statue of the town founder on a pedestal.
6. park: large duck pond with a wooden jetty and a small rowing boat.
7. railway station: long stone building with a clock tower, wide forecourt, grand hotel next to it.
8. post office and pharmacy behind a small public garden with a bench.
9. town hall with a belfry, large cobbled square with a round fountain in its centre.
10. stone church with a tall bell tower, a corner café with a terrace, a florist.
11. park: white octagonal bandstand with a green roof in a clearing.
12. park: children's playground with a slide, swings and a sandpit.
13. working-class street with a small bar and narrow houses.
14. red brick police station with police cars parked in front.
15. elegant jewellery shop with a purple front, next to a bank with columns.
16. shopping street with a bookshop and small shops.
17. fine arts museum: grand classical building with a dome and columns.
18. ornate theatre with a paved forecourt.
19. car repair garage with a petrol pump and stacks of tyres.
20. primary school with a walled school yard and two plane trees.
21. modest suburb: small workers' houses, a washhouse, workshops.
22. construction site: half-built tower in scaffolding, tall yellow crane.
23. old walled cemetery with tombstones, cypress trees and a stone angel statue.
24. long white hospital with a red cross and an ambulance.
25. river quay with moored barges; a small red motor boat on the river.
26. riverside promenades; the old stone bridge with three arches crosses the river here.
27. riverside open-air café with lanterns on the north bank, washhouse and willows on the south bank.
28. riverside promenades; a graceful iron footbridge crosses the river here.
29. the river widens: fishing boats, a small beacon, fish stalls.
30. harbour quay with a crane and a white passenger boat moored.
31. allotment gardens: small vegetable plots, sheds, scarecrows.
32. allotment gardens: vegetable plots, fruit trees, a small greenhouse.
33. hay fields with big haystacks and a stone farmhouse.
34. stone windmill on a small mound, wheat field, orchard.
35. harbour master's office: small white building with a lookout tower and flags.
36. three long brick harbour warehouses, crates and barrels.
```

## À vérifier avant de garder l'image

- La ville remplit toute l'image, sans dalle flottante ni fond vide.
- Les rues sont droites et en diagonale, la rivière traverse l'image de gauche à droite en descendant, avec deux ponts.
- Le parc (étang, kiosque) est à droite, la gare et les voies ferrées en haut, le port en bas.
- Aucun numéro ni texte dans l'image.

Enregistre l'image réussie dans ce dossier sous le nom `resultat.png`.
