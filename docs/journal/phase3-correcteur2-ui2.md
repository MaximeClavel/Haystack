# Phase 3 — Correcteur 2 : pastille de lieu, minicarte, feuille de confirmation (UI-2)

Périmètre : `src/ui/format.ts` + `format.test.ts`, `components/PlaceChip.tsx`, `components/Minimap.tsx` (inchangé : seul le CSS de la croix change),
la vignette de la feuille « Désigner cette personne ? » (`screens/investigation/overlays.ts` : `thumbRect` ; `ConfirmSheet.tsx` inchangé) et `styles.css`
(croix de la minicarte). Sources : `scratchpad/fix/DECISIONS.md`, verdicts `g-minicarte-et-reperage`, `c05` (`c05-vignette-confirmation-rogne-parapluie`),
`bonus-aiguilles` (`bonus-pastille-ne-nomme-pas-le-lieu-du-vers`), `g-carnet-et-textes-ui` (`g-pastille-lieu-doublon-c05`).
Aucun contrat touché (`types.ts`, `config.ts`, `art/bounds.ts`, `layoutSpec.ts`), aucune dépendance, pas de `content:doc`, rien de commité.
`src/world/meta.ts` est seulement **importé** (hors contrat, comme le recommande le verdict).

## Appliqué (ids des verdicts)

| Id | Changement |
|---|---|
| `g-noms-de-rues-absents-c01` | `placeName(world, x, y, margin = 0)` nomme les **rues** (`worldMeta(world).streets`) : rues droites nommées seulement (ni diagonales `axis 'd'`, ni rues de remplissage `Rue n°N`), au plus **2 noms** (les plus proches ; à égalité, l'ordre du plan), dédoublonnés (« Rue du Ballast » et « Rue des Rails » existent en deux tronçons). Priorité : petit lieu > rue > grand lieu > quartier. Le quartier est ajouté (« Rue des Étals · Les Halles »), sauf à un **carrefour** (« Rue des Étals / Rue du Cinéma », libellé déjà long). |
| `g-pont-central-non-nomme-c03`, `g-minicarte-petite-sans-lieux-c05` (volet pastille), `g-minicarte-sans-lieux-du-poeme-bonus` (volet pastille), `bonus-pastille-ne-nomme-pas-le-lieu-du-vers` | **Marge de capture en pixels écran** : `placeCaptureMargin(zoom) = min(48, 48 / zoom)` unités monde (exportée, testée), appliquée à l'emprise des lieux ET des rues. `PlaceChip.tsx` la lit à chaque mouvement de caméra (`nameAtCenter`, `host.map.getCamera().zoom`). Parmi les lieux, celui qui **contient** le point passe d'abord, puis le plus proche, puis la plus petite emprise (sans marge : règle d'avant). |
| `g-pastille-lieu-doublon-c05` (et « Parc des Meules · Parc des Meules » vu en c02) | Lieu et quartier de même nom : une seule fois (« Parc des Meules »). Seul doublon du monde. |
| `g-minicarte-se-ferme-sans-message-c05` | CSS : la boîte de 44 × 44 px de la croix ✕ est **entièrement hors de la vignette** (`top: 0` ; `left: -48px` en droitier, `right: -48px` en gaucher). Avant : 28 × 30 px (≈ 840 px², 3 %) de la surface de pointage fermaient la minicarte au lieu de déplacer la caméra. |
| `c05-vignette-confirmation-rogne-parapluie` | `thumbRect` : vue **centrée sur `getEntityBounds`** (emprise visuelle) au lieu de `getHitRect` (corps) ; le zoom reste réglé sur le corps (`max(52, 1,4·w)` × `max(39, 1,4·h)`) sans jamais être plus petit que l'emprise visuelle. La feuille garde sa taille (canevas 132 × 99 px, CSS inchangé). Le marqueur en pointillés (`drawMarker`) utilise toujours `getHitRect`. |

## Écarté (pourquoi)

- Tous les autres `g-minicarte-*` : `g-minicarte-illisible-petit-ecran-c00`, `g-minicarte-titre-couvre-points-c02`, `g-minicarte-sans-reperes-c03`,
  `g-minicarte-reste-ouverte-apres-tap-c03` (aucun correctif ou décision « non » dans DECISIONS : pas de noms de lieux ni de marqueur de la zone de la
  question sur la minicarte, qui donneraient l'indice 2 gratuitement ; la minicarte ne se ferme pas après un tap, l'e2e 05 repose dessus).
- `mc-plaques-de-rue-absentes-ou-illisibles` : reporté (trop gros, toucherait la génération du monde et décalerait les ids ambiants) ; les noms de rues dans
  la pastille répondent au besoin.
- `Minimap.tsx` : aucune modification nécessaire (le correctif de la croix est purement CSS).

## Adaptations par rapport aux verdicts

- **Seuil « petit lieu » : 200 000 u² au lieu de 120 000.** Le verdict range « bâtiments, ponts, parvis, kiosque » dans les petits lieux, mais le Parvis de la
  gare (165 600 u²) et le Chantier de la Tour (171 000 u²) dépassent 120 000 ; les suivants sont 336 000 (Grand-Place, Place des Halles), 350 000 (Cimetière),
  360 000 (Étang), 462 000 (Quais), 600 000 et au-delà. 200 000 sépare proprement « lieu » et « grande zone ».
- Les noms de lieux et de rues sont triés par **distance puis surface** (le verdict ne disait que « emprise la plus petite gagne ») : sans cela, avec la marge, un
  kiosque de 20 × 20 u à 40 u du centre aurait volé le nom du bâtiment dans lequel on se trouve exactement.
- Le test de `placeName` demandé est dans `src/ui/format.test.ts` (et non `tests/unit/place-name.test.ts`, proposé par le verdict) : c'est le fichier de tests
  de `format.ts`, listé dans la mission.

## Vérifications (vrai jeu, Vite sur le port 5182, Chromium, tactile)

- **Pastille** (390 × 844, écran Explorer, `host.focus(..., { instant })` puis lecture de `[data-testid=place]`) : Pont Central nommé à l'axe, à 50 u à l'est
  (zoom 1,6 et 1,17), à 60 u à l'ouest, à 70 u (zoom 1,17 et 0,6) ; Capitainerie (8 u), Boucherie Tendron (16 u), Commissariat (4 u), Hôpital Sainte-Paille
  (centre 3 u sous son bord) ; « Rue des Étals / Rue du Cinéma » (3228, 660), « Rue des Étals · Les Halles », « Rue Neuve · Vieille Ville », « Boulevard des Halles ·
  Parc des Meules », « Parc des Meules » dans le parc (plus de doublon), « Étang aux Canards · Parc des Meules ».
- **Les 10 aiguilles du bonus** (zooms 0,9 / 1,2 / 1,6 ; 390 et 360 px : résultats identiques), pastille avant → après :
  1 « Quartier de la Gare » → « Gare de Meulebourg · Quartier de la Gare » ; 2 « Parc des Meules · Parc des Meules » → « Statue du Fondateur · Parc des Meules » ;
  3 « Les Halles » → « Boucherie Tendron · Les Halles » ; 4 « Vieille Ville » → « Commissariat · Vieille Ville » ; 10 « Le Port » → « Capitainerie · Le Port » ;
  5, 6, 7, 8 inchangées (déjà nommées) ; 9 « Les Jardins » inchangée (voir limites).
- **Croix de la minicarte** (c00, 390 × 844, 412 × 915 et 360 × 740, droitier ET gaucher, balayage `elementFromPoint` au pixel sur toute la surface de pointage) :
  **0 px mangé** partout (avant : 840 px²), intersection boîte du ✕ / vignette = 0, haut de la boîte à y = 70 contre bas de la barre haute à 62 (rien ne se
  recouvre). Un vrai tap à 12 px du coin (ancienne zone morte) déplace la caméra sans fermer ; un vrai tap sur la croix ferme. Captures :
  `.shots/ui2-minimap-390x844-d.png` et `-g.png`.
- **Vignette de confirmation** : sur les 98 entités de scène des 7 enquêtes, **51 voyaient leur emprise visuelle rognée** (2,5 u en haut pour presque tous les
  personnages debout, dont c05.gontran, armateur, hector, petronille, faux-infirmier ; c04.octave en haut-de-forme), **0 après**. Planche avant/après rendue par la
  carte : `.shots/ui2-thumbs-avant-apres.png` (ligne du haut : avant, canopées aplaties contre le bord ; ligne du bas : après). Feuille réelle (390 × 844, c05,
  armateur) : `.shots/ui2-confirm-sheet-390.png` ; hauteur de la feuille inchangée (236,8 px), aucune erreur console.
- **Libellés** : 681 libellés distincts sur toute la carte (zooms 0,6 / 1,2 / 1,6 / 3) : aucun « Rue n°N », aucune rue en biais, aucun doublon. Dans la vraie
  pastille, aucun n'est tronqué à 390 px (minicarte fermée ou ouverte) ni à 360 px minicarte ouverte ; 7 sur 681 le sont à 360 px minicarte fermée (voir limites).
- Coût : `placeName` ≈ 12 µs par appel (une fois par mouvement de caméra).
- `npx tsc --noEmit` : propre. `npx vitest run` : 17 fichiers, 351 tests passent (dont, dans `format.test.ts`, 22 nouveaux : `placeName` sur une ville de test
  à la main — rue, lieu, quartier, doublon, carrefour, 2 noms au plus, tronçons homonymes, rues de remplissage et diagonales ignorées, priorités, marge, ordre
  « contient d'abord », monde sans plan des rues, « Meulebourg » ; `placeCaptureMargin` ; la vraie ville — rues citées par les enquêtes, ponts et bâtiments étroits
  par la marge, balayage de toute la carte ; `thumbRect` — parapluie / haut-de-forme / sans accessoire, taille de vue 52 × 39 inchangée, toutes les entités de la
  ville contenues, zoom jamais plus petit qu'avant). `npm run content:check` : « OK : aucun problème. »
- e2e (port 5182, un fichier à la fois sur le même serveur) : `E2E_PORT=5182 npx playwright test tests/e2e/05-explorer-reglages.spec.ts tests/e2e/07-corrections.spec.ts
  tests/e2e/04-toutes-les-enquetes.spec.ts` → **18 passed (2,4 min)** ; en plus `tests/e2e/08-retours-joueurs-ui.spec.ts` (UI-1) → 10 passed.

## Limites connues

- **Aiguille 9 du bonus** : posée en (2029, 4710), à 129 u à l'est des « Jardins ouvriers » (x ≤ 1900) : aucune marge raisonnable (≤ 48 px) ne la nomme ; la
  pastille donne « Les Jardins » (le quartier). Déplacer l'aiguille relève du contenu du bonus et de `layoutSpec` (contrat), pas de ce périmètre.
- **Ellipse à 360 px** : 7 libellés sur 681 dépassent la pastille du haut (minicarte fermée) et finissent par « … » ; ce sont des noms de deux rues très longues
  à un carrefour, ou une rue longue + « Quartier de la Gare » (ex. « Rue du Grenier-à-Sel / Rue de l'Aiguillage »). Le premier nom reste lisible.
- **Un petit lieu proche du centre passe avant la rue sur laquelle on est** (par construction, nécessaire pour nommer la Boucherie à 16 u, sur le trottoir de la
  rue du Marché) : à zoom ≤ 1 (marge 48 u), le nom d'un bâtiment bordant la rue s'affiche donc même quand le centre est sur l'axe de la chaussée (la moitié de la
  largeur d'une rue est de 28 à 36 u).
- Une rue peut remplacer le nom d'une grande zone quand elle la traverse (Place des Halles : 71 % de sa surface nommée « Place des Halles (marché) » au zoom 1,2,
  Parc des Meules 76 % ; le reste affiche la rue puis le quartier, qui porte le même nom pour le parc).
- Rue voisine ajoutée avec la marge : « Rue du Marché / Rue de la Brouette » en (2700, 392) (la Brouette passe à moins de 30 u) au lieu de « Rue du Marché · Les Halles ».
