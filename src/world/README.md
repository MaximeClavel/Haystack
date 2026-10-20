# Module `world` — la ville de Meulebourg

Génère, de façon **déterministe** (graine `WORLD_SEED`), toute la ville : sol, rues, rivière, voie
ferrée, îlots bâtis, lieux remarquables, foule, véhicules, arbres et mobilier ; puis y insère les
scènes des enquêtes. Module **pur** : aucun accès au DOM, testable sous Node.

## API (`src/world/index.ts`)

| Export | Rôle |
|---|---|
| `buildWorld({ seed?, cases? }): World` | Construit le monde. Même entrée → même monde. Le monde ambiant d'une graine est mis en cache ; chaque appel renvoie des **copies** des entités (on peut modifier le `World` obtenu). |
| `groundAt(world, p): GroundKind` | Type de sol exact au point (dernière forme dessinée qui le contient). |
| `isWalkable(world, p)` | Faux hors du monde, dans l'eau (hors pont, quai, ponton) et dans l'emprise d'un bâtiment. La chaussée est praticable. |
| `buildingAt(world, p)` | Bâtiment dont l'**emprise au sol** contient p. |
| `onCrosswalk(world, p)` | p est-il sur un passage piéton ? |
| `isHiddenByRoof(world, p)` | Le sol en p est-il caché par le toit d'un bâtiment situé plus au sud ? (utile pour placer une scène) |
| `entitiesAt(world, p, tol)` | Entités dont le rectangle de désignation contient p, de la plus en avant à la plus en arrière. |
| `appearanceDistance(a, b)` | Nombre d'attributs saillants différents (`SALIENT_KEYS` : hat, top, topColor, topPattern, accessory, hair, hairColor, bottomColor, face). |
| `findFreeSpots(world, rect, opts)` | Points libres, praticables, hors chaussée et visibles (aide au placement des scènes). |
| `worldMeta(world)` | Métadonnées hors contrat : rues (noms, géométrie), îlots, emplacements, nombre d'entités retirées / « dé-sosifiées ». |
| `ambientWorld(seed)` | Monde ambiant brut (sans enquêtes), en cache. |

## Pipeline (`generate.ts`)

1. **Plan des rues** (`layout.ts`) — avenues du plan directeur (`layoutSpec.ts`, non modifié) + rues
   secondaires saisies à la main autour des lieux remarquables (56 u, ruelles 44 u) ; la partie libre
   de chaque quartier est décomposée en rectangles puis subdivisée aléatoirement (une rue aléatoire
   doit aboutir à une rue à ses deux bouts et ne toucher aucun lieu) ; enfin 4 rues en biais et des
   impasses avec aire de retournement. Chaque îlot reçoit un type : `urban`, `houses`, `square`,
   `parking`, `sand` (boulodrome), `industrial`, `empty`.
2. **Sol** (`ground.ts`) — ordre de dessin : îlots → zones (lieux et emplacements, de la plus grande
   à la plus petite) → ballast → quais et rivière → tabliers des ponts → trottoirs → chaussées. Lignes :
   marquage central des avenues, passages piétons aux carrefours, deux voies ferrées, clôtures le long
   du rail, parapets des ponts ; puis allées, haies, clôtures et murets ajoutés par les aménagements.
3. **Bâtiments** (`buildings.ts`) — lieux remarquables exactement selon `LANDMARKS` (`lm.<id>`), puis
   remplissage des îlots par rangées (voir « Vue oblique » ci-dessous). Gabarits, couleurs, enseignes
   et détails par quartier ; ids `b.<quartier>.<n>`.
4. **Aménagements des lieux** (`areas.ts`) — parc (haie, allées, statue, kiosque à musique, étang avec
   ponton, barques et canards, aire de jeux, bosquets), marché des Halles (étals en rangées, cagettes,
   camions), Grand-Place (fontaine, bancs, platanes, kiosque à journaux, terrasse du Café du Centre),
   gare (quais, parvis, taxis, bus, parking), commissariat, hôpital, garage, école, chantier, cimetière,
   parvis du musée / théâtre / église, port (grues, piles de caisses, bateaux à quai), entrepôts
   numérotés, jardins ouvriers (parcelles, cabanes, serres), squares et boulodromes.
5. **Mobilier** (`props.ts`) — réverbères réguliers, poubelles, bouches d'incendie, boîtes aux lettres,
   cabines, plaques de rue, plaques d'égout, arrêts de bus (avec bus), passages à niveau, terrasses
   devant les cafés et bars générés.
6. **Végétation** (`vegetation.ts`) — alignements sur les avenues (trottoir sud des axes est-ouest) et
   les quais, arbres et petits objets dans les cours, jardins des maisons (clôtures, haies, fruitiers).
7. **Véhicules** (`vehicles.ts`) — circulation sur les voies est-ouest (on roule à droite : voie nord
   vers l'ouest, voie sud vers l'est), stationnement le long d'un trottoir, parkings, bateaux, vélos.
8. **Foule** (`people.ts`) — places réservées (« slots » : vendeurs, musiciens, assis…), gens aux
   fenêtres, puis foule selon le sol et le quartier, en activités (groupes face à face, familles,
   promeneurs de chiens, pique-niques, joggeurs…), piétons sur les passages piétons.
9. **Garde-fou final** — les arbres dont le pied tombe sur la chaussée (bosquets du parc traversé par le
   boulevard des Halles, un arbre d'alignement au bord d'une rue en biais) sont retirés **après** toute la
   génération : la grille d'occupation garde leur trace, aucune autre entité ne bouge ni ne change d'id.
10. **Intégration des enquêtes** (`story.ts`) — voir ci-dessous.

Une **grille d'occupation** (`raster.ts`, cases de 4 u, drapeaux conservateurs) sert aux tests de
collision pendant la génération ; elle n'est pas conservée. Les vérifications finales des piétons
utilisent le sol exact (`query.ts`).

## Vue oblique et lisibilité

Un bâtiment d'emprise F et de hauteur H occupe à l'écran la bande `[F.y − H, F.y + F.h]` (toit puis
façade sud) : il masque le sol sur H unités au nord de son emprise. Règles appliquées à tous les
bâtiments générés (et vérifiées par les tests) :

- la bande d'un bâtiment ne chevauche celle d'aucun autre : **aucune façade n'est masquée** ;
- un toit ne recouvre jamais une rue, une place, un lieu ou l'eau (drapeau `F_KEEPVIS`).

D'où l'organisation des îlots : rangée avant alignée sur la rue au sud (façades visibles), rangée
arrière dont le toit s'aligne sur la rue au nord, cour intérieure visible entre les deux (rangée du
milieu dans les îlots très profonds). Seuls quelques lieux remarquables imposés par le plan directeur
(gare, Grand Hôtel, hôpital, capitainerie…) recouvrent partiellement l'avenue qui les borde.

Les objets, arbres, véhicules et personnes marquent aussi la zone qu'ils masquent : aucun passant
ambiant n'a les pieds cachés derrière un toit, un arbre, une voiture ou un étal (sauf les vendeurs,
volontairement derrière leur comptoir).

## Intégration des enquêtes (`story.ts`)

- Le monde ambiant est généré **sans** connaître les enquêtes, puis : les entités ambiantes hors
  bâtiments (`a.*`) dont l'emprise visuelle chevauche celle d'une entité d'enquête (marge 6 u) sont
  retirées ; les autres gardent leur id et leur position.
- Une `PersonEntity` avec `character` reçoit l'apparence du `CharacterDef` correspondant.
- **Anti-sosie** : tout passant (et conducteur) qui diffère d'un personnage sur moins de 3 attributs
  saillants est modifié de façon déterministe (graine = son id), en changeant d'abord ce qui se voit le
  plus (couleur du haut, chapeau, accessoire…).
- `landmarkOverrides` (clé `banque` ou `lm.banque`) : l'enseigne est **remplacée**, les détails de
  façade sont **ajoutés** à ceux du lieu.
- Zones : `z.<id>` pour chaque lieu de type `area` (polygone de l'étang pour `z.etang`), puis les zones
  des enquêtes. Un id d'entité ou de zone en double lève une erreur.
- Tags ajoutés aux entités d'enquête : `story`, `case:<id>`.

## Identifiants

`lm.<lieu>` (bâtiments et objets remarquables : `lm.fontaine`, `lm.kiosque`, `lm.statue`),
`z.<lieu>`, `b.<quartier>.<n>`, `a.p.<n>` (personnes), `a.v.<n>` (véhicules), `a.t.<n>` (arbres),
`a.o.<n>` (objets). Les ids ambiants sont stables pour une graine et une version du générateur.

## Conventions de dessin attendues du module `art`

Valeurs libres (`variant`, `label`) employées par le générateur :

| Entité | Valeur | Sens |
|---|---|---|
| `prop: 'rock'` | `variant: 'tombstone'` | pierre tombale (cimetière) |
| `prop: 'statue'` | `variant: 'sculpture'` / `'angel'`, `scale` 0,6–0,8 | sculptures du musée, anges du cimetière |
| `prop: 'flowerbed'` | `variant: 'vegetables'` | planche de légumes (jardins ouvriers) |
| `prop: 'dog'` | `variant: 'small'` / `'big'` | chien (au bout d'une laisse : 16 u devant le maître, même `facing`) |
| `prop: 'manhole'` | `variant: 'open'` (rare) | plaque d'égout ouverte |
| `prop: 'kiosk'`, `'cart'`, `'sign'` | `label` (`JOURNAUX`, `GLACES`, `QUAI 1`, `R. DES LILAS`…) | texte affiché |
| `vehicle: 'bicycle'` | sans `driver` | vélo garé |
| `person` `pose: 'window'` | `z` = hauteur du bas de la fenêtre, `sortY` = bas de façade + 0,5 | buste à une fenêtre de la façade sud |

## Outils

- `dev/overview.html` (+ `src/dev/overview.ts`) : la ville entière ou une sous-région.
  `?scale=0.12` · `&x=&y=&w=&h=` · `&fit=1` · `&grid=1` · `&labels=1` · `&streets=1` · `&hidden=1`
  (sol caché par les toits) · `&art=0` (rendu simplifié) · `&sg=1&sb=1` (sol et bâtiments simplifiés,
  le reste par le module art) · `&cases=0` · `&lod=` · `&info=0`.
  Exemple : `node scripts/shot.mjs "/dev/overview.html?sg=1&sb=1&labels=1" .shots/ville.png --width 768 --height 576 --dpr 1`.
- `npm run world -- <commande>` : `landmarks`, `districts`, `streets [filtre]`, `zones`, `entity <id>`,
  `rect x y w h`, `near x y [r]`, `ground x y`, `free x y w h [pas]`, `lookalikes <id> [d]`, `stats`,
  option `--no-cases`.

## Tests

`npx vitest run src/world` : déterminisme, lieux et zones, sol (rivière, ponts, rail, passages
piétons), aucun chevauchement bâtiment/bâtiment/rue/eau/zone, lisibilité des façades et des rues,
foule (aucun passant dans l'eau, sur la chaussée hors passage piéton, sur le ballast ou dans un
bâtiment ; vocabulaire complet ; densités), aucun arbre sur la chaussée ni dans l'eau, comptes, ids, sens de circulation, index spatial
(exactitude et vitesse), intégration d'une enquête factice (anti-sosie, retrait, stabilité des ids),
performance.
