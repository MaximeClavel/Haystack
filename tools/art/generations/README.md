# Générations Gemini : décor, population, interface

Fichiers générés par `python3 tools/art/generations.py`. 51 dossiers, 112 images en tout.

Dans chaque dossier : `prompt.md` (un ou plusieurs prompts, avec le format d'image à choisir) et la ou les images de référence `ref-*.jpg` à joindre **à chaque génération** pour garder le style et l'angle de la planche retenue.

Enregistre chaque image réussie dans son dossier, sous le nom indiqué dans `prompt.md` (je la découpe et la range ensuite).

Ordre conseillé : bâtiments ordinaires (01–06), lieux (10–37), arbres et mobilier (50–57), véhicules (40–41), sols (60), population (70–73), interface (80–82). Les personnages d'enquête sont dans `../personnages/` ; la boulangerie Lemiel est déjà faite (`docs/art/style-retenu/boulangerie.jpg`).

Quelques règles communes à tous les prompts :

- même vue isométrique que la référence ; les façades d'entrée regardent vers le **bas à gauche** (l'autre orientation s'obtient en retournant l'image) ;
- fond blanc, pas d'ombre portée, **aucun texte** : les enseignes restent vierges, le jeu y écrit lui-même les noms ;
- les éléments qui changent de couleur dans le jeu sont peints en couleurs repères (murs magenta, toits bleus, carrosseries vertes, stores jaunes, hauts verts / bas bleus des habitants) : le programme les recolore.

| Dossier | Sujet | Images |
|---|---|---|
| [`01-maisons`](01-maisons/prompt.md) | Maisons | 1 |
| [`02-maisons-de-ville`](02-maisons-de-ville/prompt.md) | Maisons de ville | 1 |
| [`03-immeubles`](03-immeubles/prompt.md) | Immeubles | 1 |
| [`04-commerces`](04-commerces/prompt.md) | Commerces | 2 |
| [`05-industrie`](05-industrie/prompt.md) | Industrie | 1 |
| [`06-annexes`](06-annexes/prompt.md) | Cabanes et serres | 1 |
| [`10-gare`](10-gare/prompt.md) | Gare de Meulebourg | 1 |
| [`11-grand-hotel`](11-grand-hotel/prompt.md) | Grand Hôtel | 1 |
| [`12-bar-fer-a-cheval`](12-bar-fer-a-cheval/prompt.md) | Bar Le Fer à Cheval | 1 |
| [`13-garage-pistons`](13-garage-pistons/prompt.md) | Garage Pistons | 1 |
| [`15-boucherie-tendron`](15-boucherie-tendron/prompt.md) | Boucherie Tendron | 1 |
| [`16-cinema-le-rex`](16-cinema-le-rex/prompt.md) | Cinéma Le Rex | 1 |
| [`17-hotel-de-ville`](17-hotel-de-ville/prompt.md) | Hôtel de Ville | 1 |
| [`18-cafe-du-centre`](18-cafe-du-centre/prompt.md) | Café du Centre | 1 |
| [`19-banque-dufric`](19-banque-dufric/prompt.md) | Banque Dufric | 1 |
| [`20-eglise-saint-foin`](20-eglise-saint-foin/prompt.md) | Église Saint-Foin | 1 |
| [`21-bijouterie-carat`](21-bijouterie-carat/prompt.md) | Bijouterie Carat | 1 |
| [`22-commissariat`](22-commissariat/prompt.md) | Commissariat | 1 |
| [`23-pharmacie`](23-pharmacie/prompt.md) | Pharmacie | 1 |
| [`24-la-poste`](24-la-poste/prompt.md) | La Poste | 1 |
| [`25-fleuriste-petale`](25-fleuriste-petale/prompt.md) | Fleuriste Pétale | 1 |
| [`26-librairie-marque-page`](26-librairie-marque-page/prompt.md) | Librairie Le Marque-Page | 1 |
| [`27-ecole-jules-botte`](27-ecole-jules-botte/prompt.md) | École Jules-Botte | 1 |
| [`28-musee-beaux-arts`](28-musee-beaux-arts/prompt.md) | Musée des Beaux-Arts | 1 |
| [`29-theatre-de-la-botte`](29-theatre-de-la-botte/prompt.md) | Théâtre de la Botte | 1 |
| [`30-hopital-sainte-paille`](30-hopital-sainte-paille/prompt.md) | Hôpital Sainte-Paille | 1 |
| [`31-capitainerie`](31-capitainerie/prompt.md) | Capitainerie | 1 |
| [`32-chantier-de-la-tour`](32-chantier-de-la-tour/prompt.md) | Chantier de la Tour | 1 |
| [`33-ponts`](33-ponts/prompt.md) | Ponts | 2 |
| [`34-place-et-parc`](34-place-et-parc/prompt.md) | Fontaine, statue, kiosque | 2 |
| [`35-port`](35-port/prompt.md) | Port | 1 |
| [`36-cimetiere`](36-cimetiere/prompt.md) | Cimetière | 1 |
| [`37-jardins-ouvriers`](37-jardins-ouvriers/prompt.md) | Jardins ouvriers | 1 |
| [`40-vehicules`](40-vehicules/prompt.md) | Véhicules | 2 |
| [`41-deux-roues-bateaux`](41-deux-roues-bateaux/prompt.md) | Vélos, scooters, bateaux | 1 |
| [`50-mobilier-urbain`](50-mobilier-urbain/prompt.md) | Mobilier urbain | 2 |
| [`51-marche-terrasse`](51-marche-terrasse/prompt.md) | Marché et terrasses | 1 |
| [`52-chantier-parc`](52-chantier-parc/prompt.md) | Chantier et parc | 1 |
| [`53-arbres`](53-arbres/prompt.md) | Arbres | 1 |
| [`54-buissons-fleurs-rochers`](54-buissons-fleurs-rochers/prompt.md) | Buissons, massifs, rochers | 1 |
| [`55-animaux`](55-animaux/prompt.md) | Animaux | 1 |
| [`56-objets-au-sol`](56-objets-au-sol/prompt.md) | Objets d'enquête posés au sol | 2 |
| [`57-clotures-haies-murs`](57-clotures-haies-murs/prompt.md) | Clôtures, haies, murets | 1 |
| [`60-sols`](60-sols/prompt.md) | Textures de sol | 13 |
| [`70-habitants-1`](70-habitants-1/prompt.md) | Habitants supplémentaires (1) | 1 |
| [`71-habitants-2`](71-habitants-2/prompt.md) | Habitants supplémentaires (2) | 1 |
| [`72-metiers`](72-metiers/prompt.md) | Métiers | 4 |
| [`73-actions-foule`](73-actions-foule/prompt.md) | Actions de la foule | 36 |
| [`80-couvertures-enquetes`](80-couvertures-enquetes/prompt.md) | Couvertures des enquêtes | 6 |
| [`81-ecran-titre`](81-ecran-titre/prompt.md) | Écran d'accueil | 1 |
| [`82-icones-interface`](82-icones-interface/prompt.md) | Icônes de l'interface | 1 |
