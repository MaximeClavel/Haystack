# Personnages d'enquête à générer dans Gemini

Un dossier par personnage (fichiers générés par `python3 tools/art/dossiers.py`). Dans chaque dossier :

- `prompt.md` : les pièces jointes à donner, dans l'ordre, et les prompts à copier ;
- `1-personnage.png` : le personnage de base à transformer ;
- `2-chapeau.png`, `3-visage.png`, `4-accessoire.png`… : ce qu'il doit porter ;
- `objet-*.png` : les objets qu'il tient dans certaines poses (étape 2).

Marche à suivre : étape 1 (le personnage habillé, debout) → enregistrer l'image réussie en `resultat.png` dans le dossier → étape 2 (une génération par pose, en joignant `resultat.png`).

Les sosies et déguisements (Motus, Lino, épouvantails…) se génèrent **après** leur modèle, à partir de son `resultat.png`, pour ne changer que le détail qui compte dans l'enquête.

Les bulles d'émotion ne sont pas à dessiner sur les personnages : le jeu les pose par-dessus.

| Dossier | Personnage | Rôle | Départ |
|---|---|---|---|
| [`01-brigadier-gaston-picotin`](01-brigadier-gaston-picotin/prompt.md) | Brigadier Gaston Picotin | votre coéquipier | `s3-1` |
| [`02-timothee-fournil`](02-timothee-fournil/prompt.md) | Timothée Fournil | le livreur de la boulangerie | `s4-5` |
| [`03-rose-lemiel`](03-rose-lemiel/prompt.md) | Rose Lemiel | la boulangère volée | `s6-1` |
| [`04-ernest-lafouine`](04-ernest-lafouine/prompt.md) | Ernest Lafouine | le voleur | `s5-4` |
| [`05-motus`](05-motus/prompt.md) | Motus | le mime du marché | d'après `04-ernest-lafouine` |
| [`06-adelaide-de-la-botte`](06-adelaide-de-la-botte/prompt.md) | Adélaïde de la Botte | la propriétaire de Duchesse | `s5-5` |
| [`07-hippolyte-barbarie`](07-hippolyte-barbarie/prompt.md) | Hippolyte Barbarie | éleveur de volailles, propriétaire du Baron | `s6-2` |
| [`08-lulu`](08-lulu/prompt.md) | Lulu | le petit témoin | `base3` |
| [`09-gaspard-bigarade`](09-gaspard-bigarade/prompt.md) | Gaspard Bigarade | chef cuisinier | `s4-1` |
| [`10-achille-lapince`](10-achille-lapince/prompt.md) | Achille Lapince, dit « le Hérisson » | l’évadé | `base5` |
| [`11-achille-lapince-deguise`](11-achille-lapince-deguise/prompt.md) | Achille Lapince (déguisé) | l’évadé, en épouvantail | d'après `10-achille-lapince` |
| [`12-lola-cachou`](12-lola-cachou/prompt.md) | Lola Cachou | la fiancée de Lapince | `s3-0` |
| [`13-yves-le-goeland`](13-yves-le-goeland/prompt.md) | Yves Le Goéland | marin du quai Nord | d'après `10-achille-lapince` |
| [`14-epouvantail`](14-epouvantail/prompt.md) | Épouvantail | gardien des potagers | d'après `10-achille-lapince` |
| [`15-epouvantail-decoiffe`](15-epouvantail-decoiffe/prompt.md) | Épouvantail décoiffé | gardien des potagers, sans chapeau | d'après `14-epouvantail` |
| [`16-octave-carat`](16-octave-carat/prompt.md) | Octave Carat | le bijoutier | `base2` |
| [`17-ludo-taupin`](17-ludo-taupin/prompt.md) | Ludo Taupin | cambrioleur (le jumeau au sac à dos) | `s3-5` |
| [`18-lino-taupin`](18-lino-taupin/prompt.md) | Lino Taupin | cambrioleur (le jumeau sans sac) | d'après `17-ludo-taupin` |
| [`19-zita-pistache`](19-zita-pistache/prompt.md) | Zita Pistache | la sœur du bijoutier | `base4` |
| [`20-berenice-fard`](20-berenice-fard/prompt.md) | Bérénice Fard | la victime, diva | `s5-2` |
| [`21-gontran-lameche`](21-gontran-lameche/prompt.md) | Gontran Lamèche | le doyen de la troupe | `base1` |
| [`22-le-faux-infirmier`](22-le-faux-infirmier/prompt.md) | Le faux infirmier | voleur de poison | d'après `21-gontran-lameche` |
| [`23-petronille-doublure`](23-petronille-doublure/prompt.md) | Pétronille Doublure | la doublure | `s2-4` |
| [`24-hector-plumeau`](24-hector-plumeau/prompt.md) | Hector Plumeau | le jeune premier | `s5-1` |
| [`25-fortune-cargo`](25-fortune-cargo/prompt.md) | Fortuné Cargo | armateur | `s4-2` |
