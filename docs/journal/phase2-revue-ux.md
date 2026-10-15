# Phase 2 — agent `revue-ux` : revue de l'expérience de jeu sur téléphone

Date : 15/10/2026. Revue critique, **aucun fichier de code modifié**. Captures conservées dans
`.shots/revue-ux/` (ignoré par git, ≈ 230 PNG ; les noms commencent par le format : `p390` = 390×844,
`p360` = 360×740, `tab` = 820×1180, `land` = 844×390, tous en densité 2). Scripts de parcours (Playwright,
taps réels via `page.touchscreen.tap`, gestes via CDP) : `/tmp/claude-0/-home-user-Haystack/af7f9c2e-e1a2-5bb9-943b-ee432104c285/scratchpad/ux/`
(`play.cjs` tutoriel complet, `playc01.cjs` c01 complet, `states.cjs`, `worst.cjs`, `gestures.cjs`, `resume.cjs`…).

## Méthode

- Tutoriel c00 joué **en entier** aux 4 formats (briefing, bonne réponse, fausse piste, erreur, indices 1 et 2,
  fin, reconstitution, carnet) ; c01 joué en entier en 390×844 (fausse piste Picotin / Motus / file du cinéma,
  indices 1 à 3). c04, c05, c03 (reprise) et bonus ouverts avec des sauvegardes injectées.
- Gestes : glisser, pincer, tap lointain, double tap, glisser depuis le panneau et la barre haute (CDP).
- Mesures : cibles tactiles < 44 px, corps de texte < 14 px, hauteur du panneau de question au pire cas
  (c04 s6, c05 s6, c03 s4 aux 3 niveaux d'indice), débordements, latence tap → feuille, historique du navigateur.
- Texte : extraction de tous les textes joueur (`docs`-like dump des 7 enquêtes) relue ; comparaison
  texte / dessin (couleurs de chapeaux, tenues).

## Points forts (à ne pas casser)

- Cohérence visuelle forte : interface « papier / chemise kraft / tampon » en phase avec l'illustration ; accueil, dossiers, fin d'enquête.
- La feuille de confirmation avec **vignette** évite les mauvais taps dans la foule ; zéro tap perdu sous la barre ou le panneau.
- Retours distincts et lisibles : cadre vert (trouvé), anneau orange (presque), croix rouge + toast (faux), fil rouge, reconstitution.
- Indices progressifs bien dosés (texte → projecteur → anneau) ; la confirmation d'indice est claire.
- Aucun conflit geste/bouton : glisser depuis le panneau ou la barre haute ne déplace pas la carte ; double tap = zoom sans fausse sélection.
- Cibles ≥ 44 px partout sauf les 3 interrupteurs des réglages (58×34, mais le libellé est cliquable).
- Rédaction globalement excellente (ton, humour, longueur) ; apostrophes et guillemets français soignés dans les enquêtes.
- Aucune erreur console sur l'ensemble des parcours.

## Constats (du plus grave au moins grave)

Légende : **majeur** = gêne réelle ou contresens pour un joueur ; **mineur** = confort, finition. Aucun bloquant trouvé.

### Majeurs

**M1 — Aucun nom de lieu en enquête, minicarte sans libellés.** Les questions et indices citent « rue des Étals »,
« Pont du Parc », « jardins ouvriers », « quai Sud », « Café du Centre »… mais l'écran d'enquête n'affiche jamais où l'on est
(la pastille de lieu n'existe qu'en exploration) et la minicarte n'a aucun nom de quartier. Les panneaux de rue ne se lisent
qu'au zoom ≥ 3 (6 px de haut). Cas typique : c03 question 5 « jardins ouvriers » à 2 500 u du point de départ.
Preuve : `p390-resume-c03-s5-minimap.png`, `p390-explorer.png` (la pastille existe là), `zoom-street-sign.png`.
Suggestion : réutiliser la `place-chip` d'`Explore.tsx` dans `Investigation.tsx` (même `host.onCamera` + `placeName`) ;
inscrire les 9 noms de quartiers sur la vignette de la minicarte (`Minimap.tsx`) ; proposer un bouton « Où ? » qui cadre la zone nommée.

**M2 — Reprise d'une enquête : la caméra retourne au départ de l'enquête, pas à la question en cours.**
`Investigation.tsx` l. 98 (`def.start`). Mesuré : c03 reprise à la question 5, caméra en (1060, 1856), réponse en (1100, 4370).
Le joueur rouvre le jeu et voit la gare alors que la question parle des jardins ouvriers. Preuve : `resume.cjs`,
`p390-resume-c03-s5.png`. Suggestion : à la reprise (`status === 'active'`), cadrer la **dernière trouvaille**
(`session.foundMarks()` dernier élément) ou le bout du dernier fil rouge ; garder `def.start` seulement s'il n'y a rien de trouvé.

**M3 — « Fausse piste » est le titre de TOUTES les cartes « presque », y compris « c'est bien lui, mais plus tôt ».**
`Panels.tsx` l. 62. Exemples : c00 s2 (« C'est bien lui… mais un peu plus tôt »), c02 s3 (« C'est bien Lulu… mais plus tôt »),
c05 s7 (« C'est bien lui, sur le Pont du Parc »). Le titre contredit le texte : le joueur peut croire qu'il faut écarter
cette personne alors qu'elle est la bonne, au mauvais moment. Preuve : `p390-s08-c00-q2-near.png`.
Suggestion : titre neutre « Pas tout à fait… » (ou « Presque ! ») pour toutes les cartes orange ; si on veut distinguer,
ajouter un champ `kind: 'earlier' | 'decoy'` aux `nearMiss` (titres « Bon personnage, mauvais moment » / « Fausse piste »).

**M4 — Le bouton « Retour » du système (Android, geste iOS) quitte le jeu.** Navigation par état interne, aucune entrée
d'historique : `history.length` = 2 avant et pendant une enquête ; `goBack()` renvoie à `about:blank`. Un joueur qui
appuie sur Retour pour sortir d'une enquête ou d'un écran sort du site. Preuve : `misc.cjs` (historique).
Suggestion : `history.pushState` à chaque changement d'écran / d'enquête et gestionnaire `popstate` dans `App.tsx`
(le retour système = le bouton ‹ de l'interface) ; sur l'accueil, laisser quitter.

**M5 — Indice 2 sur petit écran : le zoom retombe sous `PICK_MIN_ZOOM`, le tap sur la réponse déclenche un vol au lieu d'une sélection.**
Mesuré en 360×740 sur c00 question 2 : zoom 1,43 après l'indice 2 (seuil 1,5) ; le tap sur le livreur éclairé ne
propose rien, la carte s'approche à zoom 2 (il faut retaper). En 390×844 : 1,94 (ok) ; en 360×740 sur c00 question 1 : 1,51
(à la limite). Cause : `focusRect(circleRect(area), { maxZoom: 2.2, padding: 20 })` (`Investigation.tsx` l. 259 et 279)
calcule le zoom pour faire tenir le cercle dans la zone libre, rétrécie par le panneau qui grandit avec l'indice.
Moment de frustration garanti : le joueur est bloqué, demande un indice, voit la réponse, la touche… et rien.
Preuve : `p360-fail-c00-livreur-2.png`, `p360-s13-c00-hint2.png`, `hintzoom.cjs`.
Suggestion : plancher `Math.max(PICK_MIN_ZOOM + 0.1, z)` sur les cadrages d'indice (le cercle peut déborder un peu) ou,
si `zoom < PICK_MIN_ZOOM` et un projecteur est affiché, accepter la désignation à partir de 1,2.

**M6 — Bonus : le « testament » (les 10 indices du jeu) est écrasé en un seul paragraphe et n'est lisible que dans le carnet replié.**
Les vers sont séparés par `\n` dans `intro` ; `paragraphs()` ne coupe que sur les lignes vides et le CSS ne conserve pas
les retours à la ligne → un bloc de 11 lignes (`p390-bonus-brief.png`). En jeu, le panneau ne rappelle que « Chaque vers du testament désigne
un lieu » ; le texte est dans Carnet > Briefing > « Relire le briefing » (replié). Le compteur « 0/10 » ne dit pas quelles
aiguilles manquent. Preuve : `p390-bonus-brief.png`, `p390-bonus-start.png`.
Suggestion : `white-space: pre-line` sur `.brief-text p` et le carnet (ou découper sur `\n` quand le paragraphe commence par « ») ;
bouton « Testament » dans le panneau de question ; liste des 10 vers avec coche pour les aiguilles trouvées (l'ordre vers = `aiguille.n`).

**M7 — c01 : le texte dit « bonnet noir », le dessin montre un bonnet orange.**
Question de l'étape 2 : « bonnet et pull rayé noirs, cagoule… » ; Motus : « même bonnet, même pull rayé… ». Le bonnet est
dessiné orange (`HAT_HEX.beanie = #ec8b2f`, couleur fixe par type) ; commentaire de `c01.ts` : « bonnet noir ». Un joueur qui
cherche un bonnet noir hésite alors que le voleur est devant lui ; en plus « pull rayé noirs » accorde mal.
Preuve : `p390-c01-q4-confirm-queue.png`, `p390-c01-q3-hint2.png`. Suggestion : « bonnet orange, pull rayé noir et blanc, cagoule »
(texte de la question et feedback de Motus, commentaire du code) ; faire la même vérification systématique texte/dessin pour c02 à c05
(les autres descriptions relues — chapeaux, pantalons orange, sweat gris, béret — sont cohérentes).

### Mineurs

**m1 — Panneau de question trop haut avec un indice niveau 3 sur petit écran.** 360×740, c05 question 6 : le panneau occupe
58 % de l'écran (haut à 310 px sur 740) ; 390×844 : 49 %. En paysage il déborde (défilement interne) aux niveaux 3 de c04/c05 s6.
La carte visible se réduit à ~ 250 px. Preuve : `p360-worst-c05-s6-lvl3.png`, `land-worst-c05-s6-lvl3.png`, `worst.cjs`.
Suggestion : replier automatiquement le texte d'indice après lecture (bouton « Indice 3/3 ▾ »), ou plafonner le panneau à 45 % avec défilement interne.

**m2 — Briefing long : texte coupé sans signe de défilement.** Paysage 844×390 : 203 px de texte visible sur 469 (c05) ; ligne
coupée à mi-hauteur (`land-c05-brief-v.png`). 360×740 : la signature « — Commissaire Odile Fétu » est rognée (`p360-c05-brief-v.png`).
Suggestion : dégradé de fin de zone / ombre intérieure, ou « Lire la suite », et hauteur minimale de la zone de texte.

**m3 — Ponctuation française : pas d'espaces insécables.** Aucune espace insécable dans les textes ; une veuve visible :
« Lequel » / « ? » sur deux lignes (`p390-resume-c03-s5-minimap.png`). Suggestion : fonction `fr()` appliquée à l'affichage
(U+00A0 devant `: ; ? ! »` et après `«`).

**m4 — Apostrophes droites dans l'interface** (« Commencer l'enquête », « Conclure l'enquête », « Revoir l'histoire »,
« C'est parti ! », « Un jeu d'observation », « Aucune pour l'instant », « Personne n'est encore identifié ») alors que les
textes et d'autres écrans utilisent ’. Visible dans `p390-s02-briefing.png` (bouton) face au texte. Suggestion : normaliser en ’.

**m5 — Petits textes et interrupteurs.** 11 px (« Brigade de Meulebourg »), 12 px (pied d'accueil, sous-titres de barre, étiquettes
de dossier), 13 px (tampons, onglets de chemise) ; le pied d'accueil (12 px, blanc à 72 %) est peu contrasté sur la carte
(`p360-home.png`). Les 3 interrupteurs mesurent 58×34 px. Suggestion : ≥ 14 px pour toute information, zone de toucher de 44 px
autour des interrupteurs (ou ligne entière cliquable).

**m6 — La feuille de confirmation masque la question.** Pendant la confirmation on ne voit plus que « Question 2 sur 3 » ;
or les questions décrivent des traits visuels à comparer à la vignette (« casquette de police, uniforme bleu… »).
Preuve : `p390-s04-c00-q1-confirm.png`. Suggestion : rappeler la question en 2 lignes (clamp) dans la feuille.

**m7 — Étoiles opaques.** « Vous perdrez des étoiles » ne dit pas combien ; aucun compteur d'erreurs en jeu (3 étoiles = au plus
2 erreurs et aucun indice) ; la fin affiche « Indices : 2 niveaux » (jargon) ; le tutoriel est déjà pénalisé (2 étoiles pour 2 indices).
Preuve : `p390-s11-c00-hint-ask.png`, `p390-s20-c00-end.png`. Suggestion : « Un indice vous fera passer à 2 étoiles maximum » ;
« 2 indices utilisés » ; pas de perte d'étoile dans c00 (ou le dire).

**m8 — Latence de sélection ≈ 226 ms** entre le lâcher et l'apparition de la feuille (attente du double tap du moteur). Perceptible
à chaque désignation. Suggestion : afficher tout de suite l'anneau de sélection au lâcher (retour immédiat), la feuille ensuite.

**m9 — Onglets de questions parallèles anonymes** (c04 : « Question 1 | Question 4 » ; c05 : « Question 2 à 5 », le 5e rogné).
Rien n'indique que ce sont des pistes indépendantes ni de quoi elles parlent. Preuve : `p390-c05-tabs.png`, `p390-c04-start.png`.
Suggestion : libeller par sujet (« Infirmier », « Pétronille », « Hector », « Gontran ») ou ajouter un mot-clé aux `StepDef`.

**m10 — Vocabulaire hétérogène** : « Enquêtes » (accueil), « Dossiers » (titre), « affaire classée » (sous-titre), « Dossier n° 00 »
(tutoriel). Suggestion : trancher (Enquêtes / Dossiers) et garder « affaire » pour le récit.

**m11 — Le bonus démarre sur un bandeau sombre** au-dessus de la ville (zoom 0,12, la ville ne remplit pas l'écran portrait,
`p390-bonus-start.png`) et sans repère de départ. Suggestion : départ au zoom minimal « ville entière » centré, ou au zoom 0,3 sur le centre.

**m12 — Toast d'erreur** posé sous la barre haute (y ≈ 72–110 px) loin du point touché, il recouvre le haut de la zone de jeu ;
l'anneau rouge au point touché est lisible mais bref (1,3 s). Suggestion : toast au-dessus du panneau ou 2 s pour l'anneau.

## Non vérifié (limites de l'émulation)

- Clavier virtuel sur la zone de notes du carnet (recouvrement de la feuille) ; vibrations ; barre d'adresse mobile réelle (iOS).
- Performance perçue sur vrai téléphone (voir `revue-perf`).
- c02, c03 et c05 n'ont pas été jouées bout en bout dans cette revue (textes relus intégralement, scènes ouvertes
  et indices 1 à 3 mesurés sur c03, c04, c05 ; résolution complète déjà couverte par `tests/e2e/04-toutes-les-enquetes.spec.ts`).

## Comment rejouer

```bash
npx vite --port 5217 --host 127.0.0.1 &          # serveur de dev
node <scratchpad>/ux/play.cjs p390               # tutoriel complet ; autres formats : p360, land, tab
node <scratchpad>/ux/worst.cjs                   # hauteur du panneau au pire cas
node <scratchpad>/ux/resume.cjs                  # reprise de c03 (M2)
```
