# Phase 2 — agent `correcteur` : traitement des constats des revues UX et code

Date : 15/10/2026. Périmètre : tout le code nécessaire, en restant minimal (`src/ui`, `src/game`, `src/engine`
pour un seul point, `src/content` pour trois textes, `tools/content`, `tests/`, documentation).
Sources : `docs/journal/phase2-revue-ux.md` (19 constats : M1–M7, m1–m12) et la revue de code (14 constats : R1–R14).

Méthode : chaque constat a d'abord été **reproduit** (script Playwright jetable, téléphone émulé, taps réels, sur une copie de
l'état d'origine) ; seuls ceux qui étaient réels ont été corrigés. **Reproduits par script avant correction** : R1, R2, R4, R5
(120 images en 2 s à l'arrêt), R6 (572,3 contre 598,3), R7, R8, R9, R10, R11, R12, R13 (zoom final 1,44), M1, M2, M4 / R3, M5, M6.
Les autres (texte, typographie, vocabulaire, tailles, contenu) sont établis par la lecture du code et des captures de la revue.
Aucun constat n'était faux ; deux points de R14 sont écartés pour une raison de fond (voir plus bas).
Chaque correction a un test (unitaire ou e2e) ou une capture avant / après.

## Résultat constat par constat

Légende : **corrigé** · **corrigé en partie** (ce qui reste est dit) · **écarté** (raison) · **reporté** (raison).

### Revue UX

| Id | Sév. | Décision | Ce qui a été fait |
|---|---|---|---|
| M1 | majeur | **corrigé** | Pastille du lieu (« Hôtel de Ville · Vieille Ville ») sous la barre haute en enquête, mêmes règles qu'en exploration (`components/PlaceChip.tsx`, partagé avec `Explore`) ; elle passe sous la minicarte quand celle-ci est ouverte. Les 9 noms de quartiers sont écrits sur la vignette de la minicarte (`Minimap.tsx`, noms longs sur deux lignes). **Reporté** : le bouton « Où ? » qui cadrerait le lieu cité dans la question (il faudrait relier les textes d'enquête à des lieux : donnée de contenu à écrire). |
| M2 | majeur | **corrigé** | À la reprise, la caméra va sur la **dernière trouvaille** chronologique (`lastFoundId` : étapes résolues par `solvedAt`), zoom ≥ 1,6 ; cadrage de départ s'il n'y a rien. Bonus : toujours la vue d'ensemble. |
| M3 | majeur | **corrigé** | Titre neutre « Pas tout à fait… » pour toutes les cartes « presque » (le champ `kind: 'earlier' \| 'decoy'` proposé n'est pas nécessaire : le titre neutre ne contredit plus aucun texte). |
| M4 | majeur | **corrigé** | Voir R3 (même cause, même correction). |
| M5 | majeur | **corrigé** | Reproduit : 360×740, c00 q2, indice 2 → zoom 1,43 < 1,5, le tap sur la réponse éclairée déclenchait un vol. Un tap **dans la zone éclairée** (projecteur ou anneau d'indice affiché) se désigne désormais dès 80 % du seuil (1,2). (Le plancher de zoom proposé n'aurait pas aidé : le texte d'indice agrandit le panneau et le cadrage tombe à ~1,35.) |
| M6 | majeur | **corrigé** | `white-space: pre-line` sur le briefing et le carnet (un vers par ligne) ; bouton **« Relire le testament »** dans le panneau du bonus (ouvre le carnet sur le briefing) ; le carnet affiche les 10 vers en liste, **cochés** quand l'aiguille est trouvée, avec « Voir » (ordre des vers = ordre de `accept`, comme le dit le commentaire du contenu). |
| M7 | majeur | **corrigé** | c01 : « bonnet orange, pull rayé noir, cagoule… » (question et commentaire du code). c04 : indice 2 « bonnet orange et lunettes noires » (ambigu). Nouvelle règle du contrôle de contenu (`tools/content/check.ts`) : une couleur de chapeau citée doit être celle du dessin (`HAT_HEX`) ; ajoutée à la bible (§ 11.2 règle 11) ; `docs/CONTENT.md` régénéré. |
| m1 | mineur | **corrigé** | Le texte d'indice devient un bloc **repliable** (en-tête « Indice 3 sur 3 ▾ ») et se replie dès que le joueur touche la carte. |
| m2 | mineur | **corrigé en partie** | Ombres de défilement en haut / bas du briefing (le texte coupé ne se confond plus avec une fin), hauteur minimale 90 px. En paysage la hauteur reste limitée par la feuille (~200 px) : le défilement est maintenant signalé, pas agrandi. |
| m3 | mineur | **corrigé** | `fr()` (format.ts) : espace insécable avant `: ; ? ! »` et après `«`, appliquée à tous les textes d'enquête affichés et à « Comment jouer » ; « Lequel ? » ne se casse plus. |
| m4 | mineur | **corrigé** | Apostrophes typographiques partout dans l'interface (boutons, libellés ARIA, carnet). |
| m5 | mineur | **corrigé en partie** | Tailles relevées : sous-titre de barre 13 px, « Brigade de Meulebourg » 13 px, pied d'accueil 14 px **et** plus contrasté (ombre portée), tags de dossier, notes de réglage, totaux, rôles du carnet. **Interrupteurs** : la zone tactile n'était **pas** réelle (le pseudo-élément ne captait pas : `elementFromPoint` 6 px au-dessus renvoyait la ligne) ; le bouton mesure maintenant 66 × 46 px. Laissés à 13 px : étiquettes décoratives (onglet « N° 00 », tampons). |
| m6 | mineur | **corrigé** | La feuille de confirmation rappelle la question en cours (3 lignes au plus). |
| m7 | mineur | **corrigé en partie** | La confirmation d'indice dit ce que ça coûte : « Votre note passera de 3 à 2 étoiles au plus » (calculée avec `computeStars`), fin : « Indices utilisés : 2 ». **Reporté** : pas de perte d'étoiles au tutoriel (règle de jeu `STAR_RULES`, décision de conception) ; compteur d'erreurs visible en jeu / dans le carnet. |
| m8 | mineur | **reporté** | La latence (~226 ms) est la fenêtre de double-tap du moteur (`TAP_DELAY_MS`), partagée avec le zoom au double tap. Un anneau « au lâcher » clignoterait à chaque double tap ; la feuille avec vignette est déjà le retour. À reprendre avec une option moteur dédiée si les testeurs s'en plaignent. |
| m9 | mineur | **corrigé** | Champ facultatif `StepDef.label` (contrat, rétro-compatible) ; onglets nommés : c04 « La bijouterie / Les jumeaux / Le diamant / La tarte », c05 « Infirmier / Pétronille / Hector / Gontran ». Validé (non vide, 24 caractères au plus). À 360 px, le 4ᵉ onglet de c05 dépasse un peu : la bande défile. |
| m10 | mineur | **corrigé** | « Enquêtes » partout (titre de la liste, retours) ; « Dossier n° 00 » reste le numéro d'une enquête ; « affaire » réservé au récit (« Affaire classée »). |
| m11 | mineur | **corrigé** | Un départ de zoom < 0,5 (bonus) utilise la vue d'ensemble de l'accueil : plus de bandeau de « table ». Sans modifier le contenu. |
| m12 | mineur | **corrigé** | Le toast se pose juste au-dessus du panneau du bas (près du pouce) quand il y en a un ; anneau rouge 2 s au lieu de 1,3 s. |

### Revue de code

| Id | Sév. | Décision | Ce qui a été fait |
|---|---|---|---|
| R1 | majeur | **corrigé** | « Recommencer » ne supprime plus la progression : `restartCaseProgress` repart de zéro **en gardant `bestStars`** ; `isUnlocked` / compteurs / raison de verrouillage utilisent `hasSolved` (résolue ou `bestStars`). La liste affiche « En cours 0/n » avec le meilleur résultat. La confirmation dit « Rejouer ? Votre meilleure note est gardée. » **Contrat** : `CaseProgress.bestStars?` (voir plus bas). |
| R2 | majeur | **corrigé** | Une désignation qui est la bonne réponse d'une **autre** question ouverte est soumise à celle-là (et l'onglet suit), au lieu de compter une erreur (3 étoiles = 2 erreurs au plus). Test e2e sur c05 (Gontran avec l'onglet « Infirmier » actif). |
| R3 | majeur | **corrigé** | Le bouton Retour du système remonte d'un écran (enquête → enquêtes → accueil) et ferme d'abord carnet / feuille / carte de résultat / demande d'indice / punaise / minicarte / reconstitution (`setBackHandler`). Deux entrées d'historique « base » / « cur » ; l'accueil laisse quitter ; la sentinelle est reposée si le Retour n'a pas quitté la page. |
| R4 | mineur | **corrigé** | Voile transparent (`tap-guard`, 320 ms) après chaque apparition / disparition d'une feuille : le second tap du double tap est avalé. Reproduit (carte « Bien vu ! » fermée sans lecture) puis test e2e. |
| R5 | mineur | **corrigé** | Moteur : un overlay `reveal` ne pulse que `REVEAL_PULSE_MS` (6 s) après chaque `setOverlays`, puis l'onde est figée et la boucle d'images s'arrête. Mesuré : 90 images / 1,5 s au début, 0 / 2 s après 8 s (120 / 2 s en continu avant). Le contrat n'est pas touché. |
| R6 | mineur | **corrigé** | `measureInsets` retire la translation de l'animation d'entrée (`DOMMatrixReadOnly`) : mesuré à l'écran de fin : marge basse 572,3 pendant le vol contre 598,3 stabilisée avant (écart de 26 px, comme dans la revue) ; 599,7 / 599,7 après. |
| R7 | mineur | **corrigé** | Le carnet enregistre les notes en attente à `pagehide` et `visibilitychange` (caché) ; test e2e. Le focus revient aussi au bouton du carnet à la fermeture. |
| R8 | mineur | **corrigé** | `.action { min-width: 0 }`, texte plus serré, icônes masquées ≤ 350 px, en-tête du panneau sur une ligne ; vérifié à 320 × 568 (test e2e : 3 boutons dans l'écran, ≥ 44 px). |
| R9 | mineur | **corrigé** | Toast d'avertissement (6 s) au **premier** échec d'écriture, et pied de l'accueil : « Navigation privée ? Ce navigateur ne garde pas la progression. » |
| R10 | mineur | **corrigé** | `AppStore.update` relit le stockage avant de modifier (lire-modifier-écrire) : un onglet périmé n'écrase plus l'autre. Pas d'écouteur `storage` : l'autre onglet ne se rafraîchit qu'à sa prochaine action (sans perte). |
| R11 | mineur | **corrigé** | `reconcileSave` (module game) passe chaque progression par `CaseSession` au démarrage ; même statut dans la liste, le déblocage et l'enquête. Les enquêtes inconnues du contenu sont **gardées** (inoffensives, utiles si elles reviennent) plutôt que supprimées. |
| R12 | mineur | **corrigé** | Frontière d'erreur (`useErrorBoundary` dans `App`) : « Quelque chose s'est mal passé… » + « Retour aux enquêtes » / « Recharger ». Pas de `window.onerror` global : des erreurs bénignes (ResizeObserver…) afficheraient des toasts à tort. |
| R13 | mineur | **corrigé en partie** | Le vol d’approche dure 300 ms (au lieu de ~1 s). Le comportement du moteur (un appui arrête un vol) reste le même, convention des cartes : un second tap dans la fenêtre du vol (≈ 220–520 ms après le premier) est encore avalé, mais la caméra s’arrête alors à ≥ 1,5 (1,8 mesuré ; 1,44 avant) et le tap suivant désigne au lieu de relancer l’approche. |
| R14 | mineur | **corrigé en partie** | Fait : focus rendu au bouton du carnet à sa fermeture ; `aria-live` retiré de la pastille du lieu ; minicarte : surface de pointage sans faux rôle « bouton » (le ✕ reste atteignable, Échap le ferme). **Écarté** : (1) `user-scalable=no` — jeu plein écran à mise en page fixe, le pincement appartient à la carte (WCAG 1.4.4 non respecté, assumé pour un jeu récréatif) ; (4) `aria-modal` sur les feuilles de confirmation et de résultat — elles ne sont pas modales (la carte reste utilisable). **Reporté** : piège à focus, flèches sur les onglets, désignation au clavier (nouvelle interaction à concevoir). |

## Changements de contrat (consignés dans `docs/ARCHITECTURE.md` § 8)

`src/types.ts` : **deux ajouts facultatifs, rétro-compatibles**, aucun champ modifié ni retiré :
- `CaseProgress.bestStars?: 1 | 2 | 3` — meilleur résultat des parties terminées ; sa présence = « résolue au moins une fois ».
  Une ancienne sauvegarde (résolue, sans `bestStars`) est lue comme `bestStars = stars`.
- `StepDef.label?: string` — libellé court d'onglet (≤ 24 caractères) pour les questions parallèles.

Inchangés : `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts`. Le moteur gagne une constante interne
(`REVEAL_PULSE_MS`, `src/engine/constants.ts`), non contractuelle.

## Fichiers touchés

- **game** : `types.ts`, `game/session.ts` (`bestStars`, `bestStarsOf`, `restartCaseProgress`), `game/save.ts` (`hasSolved`, `isUnlocked`),
  `game/reconcile.ts` (nouveau), `game/validate.ts` (`label`), `game/index.ts`, `game/README.md`.
- **engine** : `engine/mapView.ts`, `engine/constants.ts`, `engine/README.md` (pulsation limitée).
- **ui** : `App.tsx` (historique, frontière d'erreur, toasts, restart), `context.ts`, `store.ts`, `boot.tsx`, `format.ts`, `mapHost.ts`,
  `components/PlaceChip.tsx` (nouveau), `components/Minimap.tsx`, `screens/Investigation.tsx`, `screens/Explore.tsx`, `screens/Cases.tsx`,
  `screens/Home.tsx`, `screens/HowTo.tsx`, `screens/Settings.tsx`, `screens/investigation/{QuestionPanel,Panels,ConfirmSheet,Notebook,overlays}`,
  `styles.css`, `README.md`, `tools/play-c00.mjs` (attend la fin du voile anti double tap).
- **contenu** : `content/cases/c01.ts`, `c04.ts`, `c05.ts` ; `tools/content/check.ts` (règle chapeaux), `CONTENT.template.md`, `docs/CONTENT.md` (régénéré).
- **tests** : `src/game/restart.test.ts` (13), `src/ui/format.test.ts` (7), `src/game/validate.test.ts` (+1), `tests/e2e/07-corrections.spec.ts` (13) ;
  textes mis à jour dans `02`, `03`, `04`, `play.ts`.
- **docs** : `docs/ARCHITECTURE.md` (§ 6, 7, 8), `docs/screenshots/correcteur-*.jpg` (5 planches avant / après).

## Comment vérifier

```bash
npx tsc --noEmit && npx vitest run && npm run content:check && npm run build   # 299 tests unitaires ; contenu OK
npm run e2e                                                                      # 23 tests (dont 13 pour les corrections)
node src/ui/tools/play-c00.mjs && node src/ui/tools/states.mjs                   # « OK : … sans erreur »
node scripts/perf-map.mjs                                                        # 16,7 / 16,7 ms (×1), 33 / 50 ms (×4) : inchangé
```

Captures avant / après : `docs/screenshots/correcteur-*.jpg` (avant = captures de la revue UX, après = même scénario).

## Limites connues

- Pas de WebKit ici : le Retour système (`history.pushState`, geste de retour iOS), le clavier virtuel devant les notes et la perte du canevas
  en arrière-plan sur iOS restent à vérifier sur un iPhone réel.
- Le voile anti double tap ignore les appuis 320 ms après un changement de feuille : les scripts qui enchaînent un tap immédiat doivent attendre
  (les tests Playwright le font naturellement, `locator.tap()` réessaie).
- En paysage, la zone de texte du briefing reste petite (~200 px) ; le défilement est signalé mais pas agrandi.
- Quatre onglets de questions parallèles (c05) dépassent un peu sous 360 px : la bande défile.
