// c05 — « Rideau ! » (difficulté 5, 7 étapes) — FILS PARALLÈLES (s2 à s5) et TRAVERSÉE de la rivière.
// Lieux : parvis du Théâtre de la Botte, Hôpital Sainte-Paille, cimetière, Musée des Beaux-Arts,
// Pont du Parc, quais du port.
import type { CaseDef, PersonAppearance } from '../../types';
import { PICOTIN } from '../common';

const BERENICE: PersonAppearance = {
  skin: 'light', hair: 'long', hairColor: 'black', hat: 'none', top: 'dress', topColor: 'red', topPattern: 'plain',
  bottom: 'skirt', bottomColor: 'red', face: 'none', accessory: 'flowers', build: 'slim',
};
/** L'assassin : haut-de-forme, costume rouge, PANTALON ORANGE (costume de la troupe), parapluie, costaud. */
const GONTRAN: PersonAppearance = {
  skin: 'pale', hair: 'short', hairColor: 'grey', hat: 'tophat', top: 'suit', topColor: 'red', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'orange', face: 'mustache', accessory: 'umbrella', build: 'large',
};
/** Le « faux infirmier » : Gontran en blouse blanche et masque… qui a gardé chapeau, parapluie et pantalon. */
const GONTRAN_DEGUISE: PersonAppearance = { ...GONTRAN, top: 'coat', topColor: 'white', face: 'mask' };
/** Suspecte 1 : haut-de-forme et pantalon orange… mais une CANNE. */
const PETRONILLE: PersonAppearance = {
  skin: 'tan', hair: 'long', hairColor: 'red', hat: 'tophat', top: 'coat', topColor: 'green', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'orange', face: 'none', accessory: 'cane', build: 'slim',
};
/** Suspect 2 : parapluie et pantalon orange… mais un CHAPEAU MELON. */
const HECTOR: PersonAppearance = {
  skin: 'brown', hair: 'curly', hairColor: 'brown', hat: 'bowler', top: 'suit', topColor: 'blue', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'orange', face: 'none', accessory: 'umbrella', build: 'regular',
};
/** Sosie volontaire de Gontran, au port : tout pareil… sauf le pantalon NOIR. */
const ARMATEUR: PersonAppearance = { ...GONTRAN, bottomColor: 'black' };
/** Figurants. */
const MEDECIN: PersonAppearance = {
  skin: 'dark', hair: 'bun', hairColor: 'black', hat: 'none', top: 'coat', topColor: 'white', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'white', face: 'glasses', accessory: 'briefcase', build: 'regular',
};
const ADMIRATRICE: PersonAppearance = {
  skin: 'pale', hair: 'ponytail', hairColor: 'blond', hat: 'straw', top: 'dress', topColor: 'yellow', topPattern: 'dots',
  bottom: 'skirt', bottomColor: 'yellow', face: 'sunglasses', accessory: 'handbag', build: 'slim',
};

export const c05: CaseDef = {
  id: 'c05',
  title: 'Rideau !',
  unlockAfter: ['c04'],
  difficulty: 5,
  teaser: 'Première au Théâtre de la Botte : la diva s’effondre à l’entracte. Trois comédiens, un costume, un assassin.',
  intro:
    'Ce soir, première de « Les Moissonneurs » au Théâtre de la Botte. À l’entracte, la grande Bérénice Fard boit une gorgée de sa camomille… et s’effondre sur le parvis. Empoisonnée.\n\n' +
    'Le poison a été volé ce matin à l’hôpital Sainte-Paille par un « infirmier » que personne n’y connaissait. Ce matin, justement, la troupe répétait EN COSTUME : les comédiens de la pièce portent tous le pantalon orange des moissonneurs.\n\n' +
    'Trois d’entre eux avaient de bonnes raisons d’en vouloir à Bérénice : Pétronille Doublure, sa doublure, qui rêve de ses rôles ; Hector Plumeau, le jeune premier, qu’elle venait de quitter ; et Gontran Lamèche, le doyen, qu’elle voulait envoyer à la retraite.\n\n' +
    'Picotin garde les lieux. Vous avez jusqu’au dernier bateau.\n\n— Commissaire Odile Fétu',
  start: { x: 5660, y: 2490, zoom: 1.5 },
  characters: [
    { id: 'c05.picotin', name: 'Brigadier Gaston Picotin', role: 'votre coéquipier', appearance: PICOTIN },
    { id: 'c05.berenice', name: 'Bérénice Fard', role: 'la victime, diva', appearance: BERENICE },
    { id: 'c05.gontran', name: 'Gontran Lamèche', role: 'le doyen de la troupe', appearance: GONTRAN },
    { id: 'c05.gontran-deguise', name: 'Le faux infirmier', role: 'voleur de poison', appearance: GONTRAN_DEGUISE },
    { id: 'c05.petronille', name: 'Pétronille Doublure', role: 'la doublure', appearance: PETRONILLE },
    { id: 'c05.hector', name: 'Hector Plumeau', role: 'le jeune premier', appearance: HECTOR },
    { id: 'c05.armateur', name: 'Fortuné Cargo', role: 'armateur', appearance: ARMATEUR },
  ],
  entities: [
    // Parvis du théâtre : la victime, sa camomille, Picotin… et Gontran qui lit son journal sans un regard
    { id: 'c05.berenice.1', kind: 'person', x: 5650, y: 2500, pose: 'lie', facing: 'right', holding: 'bottle', emote: 'ko', character: 'c05.berenice', appearance: BERENICE },
    { id: 'c05.picotin.1', kind: 'person', x: 5626, y: 2503, pose: 'crouch', facing: 'right', emote: 'sweat', character: 'c05.picotin', appearance: PICOTIN },
    { id: 'c05.gontran.1', kind: 'person', x: 5762, y: 2508, pose: 'read', facing: 'right', character: 'c05.gontran', appearance: GONTRAN },
    // Hôpital Sainte-Paille, ce matin : le faux infirmier sort avec le flacon
    { id: 'c05.faux-infirmier', kind: 'person', x: 5818, y: 3197, pose: 'sneak', facing: 'right', holding: 'bottle', character: 'c05.gontran-deguise', appearance: GONTRAN_DEGUISE },
    { id: 'c05.medecin', kind: 'person', x: 5758, y: 3190, pose: 'stand', facing: 'right', emote: 'question', appearance: MEDECIN },
    // Cimetière : Pétronille répète la scène de la mort entre les tombes
    { id: 'c05.petronille.1', kind: 'person', x: 4600, y: 3262, pose: 'read', facing: 'right', emote: 'music', character: 'c05.petronille', appearance: PETRONILLE },
    // Musée : Hector console son cœur brisé
    { id: 'c05.hector.1', kind: 'person', x: 4842, y: 2532, pose: 'stand', facing: 'right', emote: 'heart', character: 'c05.hector', appearance: HECTOR },
    { id: 'c05.admiratrice', kind: 'person', x: 4860, y: 2533, pose: 'stand', facing: 'left', emote: 'heart', appearance: ADMIRATRICE },
    // La fuite : le Pont du Parc, puis les quais du port
    { id: 'c05.gontran.2', kind: 'person', x: 4220, y: 3790, pose: 'run', facing: 'left', character: 'c05.gontran', appearance: GONTRAN },
    { id: 'c05.bateau', kind: 'vehicle', vehicle: 'boat', x: 5555, y: 3950, facing: 'right', color: 'white', label: 'L’ENTRACTE' },
    { id: 'c05.armateur.1', kind: 'person', x: 5592, y: 3973, pose: 'wave', facing: 'left', character: 'c05.armateur', appearance: ARMATEUR },
    { id: 'c05.caisse.1', kind: 'prop', prop: 'crate', x: 5452, y: 3996 },
    { id: 'c05.gontran.3', kind: 'person', x: 5472, y: 3992, pose: 'crouch', facing: 'right', emote: 'sweat', character: 'c05.gontran', appearance: GONTRAN },
    { id: 'c05.caisse.2', kind: 'prop', prop: 'crate', x: 5492, y: 3997 },
  ],
  steps: [
    {
      id: 's1',
      question: 'Trouvez Bérénice Fard, effondrée sur le parvis du théâtre.',
      accept: ['c05.berenice.1'],
      nearMiss: [
        { id: 'c05.picotin.1', feedback: 'Picotin veille sur le corps. Il est tout pâle : c’est son premier meurtre, à lui aussi.' },
      ],
      hints: [
        { text: 'Sur le parvis, au pied de la façade rouge du théâtre, au milieu des spectateurs de l’entracte.' },
        { text: 'Une femme en robe rouge, allongée.', area: { x: 5670, y: 2470, radius: 80 } },
      ],
      solved: 'Bérénice Fard, la diva de Meulebourg, foudroyée à l’entracte. Elle tient encore sa bouteille de camomille.',
    },
    {
      id: 's2',
      label: 'Infirmier',
      after: ['s1'],
      question: 'Ce matin, un faux infirmier a volé le poison à l’hôpital Sainte-Paille. Trouvez-le.',
      accept: ['c05.faux-infirmier'],
      nearMiss: [
        { id: 'c05.medecin', feedback: 'Une vraie médecin, en vraie blouse. Elle se demande qui était ce nouvel « infirmier »…' },
        { id: 'lm.hopital', feedback: 'L’hôpital Sainte-Paille, oui. Mais c’est l’infirmier qu’on cherche, dehors, devant l’entrée.' },
      ],
      hints: [
        { text: 'L’hôpital est au sud, rue des Brancards. Un infirmier avec un flacon… et un drôle de chapeau.' },
        { text: 'Devant l’entrée de l’hôpital, près des ambulances.', area: { x: 5810, y: 3150, radius: 90 } },
      ],
      solved:
        'Blouse blanche et masque… mais un haut-de-forme, un parapluie et le pantalon orange de la troupe ! L’assassin est l’un des comédiens. Retenez bien ces détails : le carnet les gardera pour vous.',
    },
    {
      id: 's3',
      label: 'Pétronille',
      after: ['s1'],
      question: 'Pétronille Doublure, la doublure de Bérénice, jure avoir répété « la scène de la mort » au calme pendant l’entracte. Trouvez-la.',
      accept: ['c05.petronille.1'],
      nearMiss: [
        { id: 'z.cimetiere', feedback: 'Le cimetière, oui. Mais ce n’est pas ce qu’on cherche : une femme qui déclame, partition en main.' },
      ],
      hints: [
        { text: 'Où répète-t-on la scène de la mort ? Au plus calme du quartier des Arts. Cherchez un haut-de-forme et une partition.' },
        { text: 'Au cimetière, sur l’allée centrale.', area: { x: 4640, y: 3225, radius: 110 } },
      ],
      solved:
        'Au cimetière, entre deux tombes, Pétronille déclame la mort de l’héroïne. Haut-de-forme, pantalon orange qui dépasse du long manteau vert… mais elle s’appuie sur une canne.',
    },
    {
      id: 's4',
      label: 'Hector',
      after: ['s1'],
      question: 'Hector Plumeau, le jeune premier, s’est éclipsé pendant l’entracte pour se consoler au milieu des belles choses. Trouvez-le.',
      accept: ['c05.hector.1'],
      nearMiss: [
        { id: 'c05.admiratrice', feedback: 'Une admiratrice, très consolante. Elle n’a jamais mis les pieds au théâtre.' },
        { id: 'lm.musee', feedback: 'Le Musée des Beaux-Arts, oui. Mais c’est Hector qu’on cherche, sur le parvis.' },
      ],
      hints: [
        { text: 'Quel bâtiment du quartier des Arts abrite le plus de belles choses ? Marbre, colonnes, statues… Il y est en bonne compagnie.' },
        { text: 'Sur le parvis du Musée des Beaux-Arts.', area: { x: 4890, y: 2520, radius: 110 } },
      ],
      solved: 'Devant le musée, Hector se console déjà avec une admiratrice. Pantalon orange et parapluie… mais un chapeau melon.',
    },
    {
      id: 's5',
      label: 'Gontran',
      after: ['s1'],
      question: 'Gontran Lamèche, le doyen de la troupe, jure qu’il n’a pas bougé à l’entracte : il lisait son journal. Trouvez-le.',
      accept: ['c05.gontran.1'],
      nearMiss: [
        { id: 'c05.berenice.1', feedback: 'Bérénice ne lira plus rien ce soir. Cherchez celui qui lit.' },
        { id: 'c05.picotin.1', feedback: 'Picotin veille sur la victime. Cherchez plutôt celui qui lit son journal.' },
      ],
      hints: [
        { text: 'Il est resté sur le parvis, à quelques pas de Bérénice : cherchez un costume rouge.' },
        { text: 'À l’est du parvis, un monsieur lit son journal sans lever les yeux.', area: { x: 5725, y: 2495, radius: 90 } },
      ],
      solved:
        'Gontran lit tranquillement son journal à quelques pas de la victime, sans un regard pour elle. Haut-de-forme, parapluie, pantalon orange.',
    },
    {
      id: 's6',
      after: ['s2', 's3', 's4', 's5'],
      question: 'Comparez les trois comédiens au faux infirmier de l’hôpital. Qui a empoisonné Bérénice ? Désignez-le.',
      accept: ['c05.gontran.1', 'c05.gontran.2', 'c05.gontran.3'],
      nearMiss: [
        { id: 'c05.petronille.1', feedback: 'Haut-de-forme et pantalon orange, oui… mais une canne. Le faux infirmier avait un parapluie.' },
        { id: 'c05.hector.1', feedback: 'Parapluie et pantalon orange, oui… mais un chapeau melon. Le faux infirmier portait un haut-de-forme.' },
        { id: 'c05.faux-infirmier', feedback: 'C’est bien l’assassin, déguisé. Désignez-le à visage découvert.' },
      ],
      hints: [
        { text: 'Le faux infirmier avait gardé trois choses : un haut-de-forme, un parapluie et le pantalon orange. Un seul comédien a les trois.' },
        { text: 'Celui qui lisait son journal sans regarder la victime…', area: { x: 5790, y: 2470, radius: 90 } },
      ],
      solved:
        'Gontran Lamèche : haut-de-forme, parapluie, pantalon orange. Le doyen a volé le poison ce matin, déguisé en infirmier, et l’a versé dans la camomille de Bérénice. Mais quand Picotin s’est retourné… Gontran avait disparu.',
      thread: [['c05.faux-infirmier', 'c05.gontran.1'], ['c05.gontran.1', 'c05.berenice.1']],
    },
    {
      id: 's7',
      after: ['s6'],
      question: 'Gontran file discrètement au port pour embarquer sur « L’Entracte », le dernier bateau. Retrouvez-le avant le départ !',
      accept: ['c05.gontran.3'],
      nearMiss: [
        {
          id: 'c05.armateur.1',
          feedback: 'Monsieur Cargo, l’armateur de « L’Entracte » : haut-de-forme, costume rouge, parapluie… mais un pantalon NOIR. Il attend un passager en retard.',
        },
        { id: 'c05.gontran.2', feedback: 'C’est bien lui, sur le Pont du Parc. Il a traversé la rivière : cherchez-le sur l’autre rive.' },
        { id: 'c05.gontran.1', feedback: 'C’est bien lui, mais devant le théâtre : il n’y est plus. Il file vers le port.' },
        { id: 'c05.faux-infirmier', feedback: 'Le faux infirmier, ce matin, à l’hôpital. Depuis, il a retiré sa blouse.' },
        { id: 'c05.bateau', feedback: 'Le bateau « L’Entracte » attend son dernier passager. Il n’est pas encore à bord.' },
      ],
      hints: [
        { text: 'Il a franchi le Pont du Parc, à l’entrée ouest du port, puis longé les quais vers l’est, sans aller jusqu’au bout.' },
        { text: 'Tout près du bateau, quelqu’un se cache entre deux caisses.', area: { x: 5480, y: 3940, radius: 100 } },
      ],
      solved: 'Accroupi entre deux caisses, à trois pas de la passerelle, le parapluie à la main. Picotin l’attendait — pour une fois, au bon endroit.',
      thread: [['c05.gontran.1', 'c05.gontran.2'], ['c05.gontran.2', 'c05.gontran.3']],
    },
  ],
  epilogue:
    'Gontran Lamèche a avoué sur le quai, avec le sens du drame qu’on lui connaissait : « Trente ans de seconds rôles. Ce soir, enfin, j’avais le premier. » Il a salué. Personne n’a applaudi.\n\n' +
    'Pétronille Doublure a repris le rôle dès le lendemain. Hector Plumeau s’est fiancé. Et Picotin a juré de ne plus jamais boire de camomille.',
  replay: [
    { id: 'c05.faux-infirmier', caption: 'Ce matin, Gontran, déguisé en infirmier, vole un flacon de poison à l’hôpital.' },
    { id: 'c05.berenice.1', caption: 'Il verse le poison dans la camomille de Bérénice. À l’entracte, elle boit et s’effondre.' },
    { id: 'c05.gontran.1', caption: 'Gontran lit son journal à deux pas, sans un regard.' },
    { id: 'c05.petronille.1', caption: 'Pendant ce temps, Pétronille répète au cimetière…' },
    { id: 'c05.hector.1', caption: '… et Hector se console devant le musée.' },
    { id: 'c05.gontran.2', caption: 'Démasqué, Gontran file par le Pont du Parc…' },
    { id: 'c05.gontran.3', caption: '… et se cache sur le quai, à trois pas de « L’Entracte ».' },
  ],
};
