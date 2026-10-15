// c01 — « La Main dans le sac » (difficulté 1, 4 étapes).
// Lieux : boulangerie Lemiel, place des Halles (marché), rue des Étals, cinéma Le Rex.
import type { CaseDef, PersonAppearance } from '../../types';
import { PICOTIN } from '../common';

const ROSE: PersonAppearance = {
  skin: 'pale', hair: 'bun', hairColor: 'blond', hat: 'chef', top: 'apron', topColor: 'pink', topPattern: 'plain',
  bottom: 'skirt', bottomColor: 'white', face: 'none', accessory: 'none', build: 'large',
};
/** Le voleur : bonnet orange (couleur fixe du bonnet à l’écran), pull noir rayé, masque de bandit sur les yeux. */
const LAFOUINE: PersonAppearance = {
  skin: 'light', hair: 'short', hairColor: 'brown', hat: 'beanie', top: 'sweater', topColor: 'black', topPattern: 'stripes',
  bottom: 'trousers', bottomColor: 'black', face: 'mask', accessory: 'none', build: 'slim',
};
/** Sosie volontaire du voleur : identique SAUF le masque (face: 'none'). */
const MOTUS: PersonAppearance = { ...LAFOUINE, face: 'none' };
const SPECTATRICE: PersonAppearance = {
  skin: 'dark', hair: 'long', hairColor: 'black', hat: 'none', top: 'dress', topColor: 'yellow', topPattern: 'dots',
  bottom: 'skirt', bottomColor: 'yellow', face: 'glasses', accessory: 'handbag', build: 'slim',
};
const SPECTATEUR: PersonAppearance = {
  skin: 'pale', hair: 'bald', hairColor: 'grey', hat: 'bowler', top: 'coat', topColor: 'brown', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'beige', face: 'mustache', accessory: 'umbrella', build: 'large',
};
const GAMINE: PersonAppearance = {
  skin: 'tan', hair: 'ponytail', hairColor: 'red', hat: 'cap', top: 'hoodie', topColor: 'green', topPattern: 'plain',
  bottom: 'shorts', bottomColor: 'blue', face: 'none', accessory: 'backpack', build: 'child',
};

const QUEUE_Y = 633;

export const c01: CaseDef = {
  id: 'c01',
  title: 'La Main dans le sac',
  unlockAfter: ['c00'],
  difficulty: 1,
  teaser: 'Jour de marché aux Halles : la caisse de la boulangerie s’est envolée. Le voleur n’est pas très discret.',
  intro:
    'Ce matin, à l’ouverture du marché, un individu a filé avec la caisse de la boulangerie Lemiel. Quand Rose Lemiel est en colère, tout le quartier des Halles l’entend — et là, elle est très en colère.\n\n' +
    'Le brigadier Picotin est déjà sur place : il achetait son pain, comme par hasard. Retrouvez le voleur et l’argent avant la fin du marché.\n\n' +
    '— Commissaire Odile Fétu',
  start: { x: 2640, y: 420, zoom: 1.6 },
  characters: [
    { id: 'c01.picotin', name: 'Brigadier Gaston Picotin', role: 'votre coéquipier', appearance: PICOTIN },
    { id: 'c01.rose', name: 'Rose Lemiel', role: 'la boulangère volée', appearance: ROSE },
    { id: 'c01.lafouine', name: 'Ernest Lafouine', role: 'le voleur', appearance: LAFOUINE },
    { id: 'c01.motus', name: 'Motus', role: 'le mime du marché', appearance: MOTUS },
  ],
  entities: [
    { id: 'c01.rose.1', kind: 'person', x: 2612, y: 369, pose: 'point', facing: 'right', emote: 'angry', character: 'c01.rose', appearance: ROSE },
    { id: 'c01.picotin.1', kind: 'person', x: 2645, y: 370, pose: 'stand', facing: 'left', holding: 'baguette', emote: 'heart', character: 'c01.picotin', appearance: PICOTIN },
    { id: 'c01.lafouine.1', kind: 'person', x: 2850, y: 531, pose: 'run', facing: 'right', holding: 'moneybag', character: 'c01.lafouine', appearance: LAFOUINE },
    { id: 'c01.motus.1', kind: 'person', x: 2716, y: 534, pose: 'handsup', facing: 'left', character: 'c01.motus', appearance: MOTUS },
    { id: 'c01.poubelle', kind: 'prop', prop: 'bin', x: 3250, y: 612, color: 'green' },
    { id: 'c01.caisse', kind: 'prop', prop: 'moneybag', x: 3250, y: 612.5, z: 7, sortY: 612.5 },
    { id: 'c01.lafouine.2', kind: 'person', x: 3302, y: 634, pose: 'walk', facing: 'right', character: 'c01.lafouine', appearance: LAFOUINE },
    { id: 'c01.spectatrice.1', kind: 'person', x: 3506, y: QUEUE_Y, pose: 'stand', facing: 'left', holding: 'letter', appearance: SPECTATRICE },
    { id: 'c01.spectateur.1', kind: 'person', x: 3520, y: QUEUE_Y, pose: 'read', facing: 'left', appearance: SPECTATEUR },
    { id: 'c01.lafouine.3', kind: 'person', x: 3535, y: QUEUE_Y, pose: 'stand', facing: 'left', holding: 'letter', emote: 'music', character: 'c01.lafouine', appearance: LAFOUINE },
    { id: 'c01.gamine.1', kind: 'person', x: 3549, y: QUEUE_Y, pose: 'stand', facing: 'left', holding: 'icecream', appearance: GAMINE },
  ],
  landmarkOverrides: {
    cinema: { features: [{ kind: 'poster', at: 0.12, floor: 0, text: 'LE CASSE DU SIÈCLE' }, { kind: 'poster', at: 0.88, floor: 0, text: 'LE CASSE DU SIÈCLE' }] },
  },
  steps: [
    {
      id: 's1',
      question: 'Trouvez la boulangère Rose Lemiel : toque blanche et tablier rose, devant sa boutique.',
      accept: ['c01.rose.1'],
      nearMiss: [{ id: 'c01.picotin.1', feedback: 'Picotin a acheté sa baguette. Il vous montre la boulangère du menton, la bouche pleine.' }],
      hints: [
        { text: 'La boulangerie Lemiel est au nord de la place des Halles, rue du Marché.' },
        { text: 'Elle crie et montre le marché du doigt.', area: { x: 2625, y: 390, radius: 80 } },
      ],
      solved: '« Au voleur ! Un grand maigre en pull rayé noir, avec un masque de bandit ! Il est parti dans le marché avec ma caisse ! »',
    },
    {
      id: 's2',
      question: 'Trouvez le voleur dans la foule du marché : bonnet orange, pull rayé noir, masque de bandit… et un sac d’argent à la main.',
      accept: ['c01.lafouine.1'],
      nearMiss: [
        {
          id: 'c01.motus.1',
          feedback: 'C’est Motus, le mime du marché : même bonnet, même pull rayé… mais pas de masque, et les mains vides. Il est coincé dans une boîte invisible depuis ce matin.',
        },
      ],
      hints: [
        { text: 'Il fonce vers l’est, dans l’allée entre les deux premières rangées d’étals.' },
        { text: 'Cherchez quelqu’un qui court, un sac d’argent à la main.', area: { x: 2805, y: 490, radius: 120 } },
      ],
      solved: 'Le voici, le sac de la recette à la main, qui fend la foule en direction de la rue des Étals.',
      thread: [['c01.rose.1', 'c01.lafouine.1']],
    },
    {
      id: 's3',
      question: 'Plus loin, le voleur marche les mains vides. Où a-t-il caché la caisse ?',
      accept: ['c01.caisse', 'c01.poubelle'],
      nearMiss: [
        { id: 'c01.lafouine.2', feedback: 'Le voleur, les mains vides : il vient de se débarrasser de la caisse, quelque part derrière lui.' },
        { id: 'c01.lafouine.1', feedback: 'C’est bien lui, mais plus tôt : il tenait encore le sac. Où l’a-t-il laissé en chemin ?' },
      ],
      hints: [
        { text: 'Il a traversé la rue des Étals, à la sortie est du marché.' },
        { text: 'Regardez au coin de la rue des Étals et de la rue du Cinéma.', area: { x: 3215, y: 595, radius: 80 } },
      ],
      solved: 'La recette dépasse d’une poubelle, au coin de la rue. Il comptait venir la rechercher après la séance.',
      thread: [['c01.lafouine.1', 'c01.caisse'], ['c01.caisse', 'c01.lafouine.2']],
    },
    {
      id: 's4',
      question: 'Pour se fabriquer un alibi, le voleur fait la queue au cinéma Le Rex. Désignez-le.',
      accept: ['c01.lafouine.3'],
      nearMiss: [
        { id: 'c01.spectatrice.1', feedback: 'Une cinéphile qui attend son film. Le voleur, lui, a oublié un petit détail en entrant dans la file.' },
        { id: 'c01.spectateur.1', feedback: 'Ce monsieur lit le programme. Rien à se reprocher, à part son chapeau.' },
        { id: 'c01.gamine.1', feedback: 'Une gamine et sa glace. Ce n’est pas elle.' },
        { id: 'c01.lafouine.2', feedback: 'Le voleur marche vers le cinéma, les mains vides. Suivez-le jusqu’à la file d’attente.' },
        { id: 'lm.cinema', feedback: 'Le cinéma Le Rex, oui. Mais c’est dans la file d’attente, devant la porte, qu’on cherche.' },
      ],
      hints: [
        { text: 'Le Rex est juste à l’est, rue du Cinéma. Le voleur n’a pas pensé à se changer.' },
        { text: 'Regardez la file d’attente devant la porte du cinéma.', area: { x: 3505, y: 620, radius: 70 } },
      ],
      solved: 'Le seul spectateur masqué de toute l’histoire du Rex. Picotin arrive, sa baguette à la main, et lui tapote l’épaule.',
      thread: [['c01.lafouine.2', 'c01.lafouine.3']],
    },
  ],
  epilogue:
    'Ernest Lafouine, cambrioleur à mi-temps et distrait à plein temps, a été cueilli dans la file du Rex. Il comptait voir « Le Casse du siècle » pour prendre des notes.\n\n' +
    'Rose Lemiel a récupéré sa caisse et offert à Picotin un pain de campagne… qu’il a terminé avant d’arriver au commissariat.',
  replay: [
    { id: 'c01.rose.1', caption: 'À l’ouverture, Rose Lemiel voit sa caisse filer sous son nez.' },
    { id: 'c01.lafouine.1', caption: 'Lafouine traverse le marché en courant, la caisse sous le bras.' },
    { id: 'c01.motus.1', caption: 'Il passe devant Motus, le mime, qui ne dira rien — évidemment.' },
    { id: 'c01.caisse', caption: 'Au coin de la rue, il cache la caisse dans une poubelle.' },
    { id: 'c01.lafouine.2', caption: 'Puis il file vers le cinéma, les mains vides, l’air innocent.' },
    { id: 'c01.lafouine.3', caption: 'Dans la file du Rex, il attend son alibi… en masque de bandit.' },
  ],
};
