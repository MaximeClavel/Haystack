// c02 — « Coin-coin ! » (difficulté 2, 5 étapes).
// Lieux : Parc des Meules — rive sud-est de l'étang, boulevard des Halles (qui traverse le parc),
// kiosque à musique (concours), étang (fuite en bateau).
import type { CaseDef, PersonAppearance } from '../../types';
import { PICOTIN } from '../common';

const BARONNE: PersonAppearance = {
  skin: 'pale', hair: 'bun', hairColor: 'white', hat: 'straw', top: 'dress', topColor: 'purple', topPattern: 'dots',
  bottom: 'skirt', bottomColor: 'purple', face: 'glasses', accessory: 'handbag', build: 'large',
};
/** Le ravisseur : feutre, manteau vert à carreaux, pantalon jaune, barbe. */
const BARBARIE: PersonAppearance = {
  skin: 'pale', hair: 'bald', hairColor: 'grey', hat: 'fedora', top: 'coat', topColor: 'green', topPattern: 'checks',
  bottom: 'trousers', bottomColor: 'yellow', face: 'beard', accessory: 'none', build: 'large',
};
const LULU: PersonAppearance = {
  skin: 'brown', hair: 'spiky', hairColor: 'blond', hat: 'none', top: 'overalls', topColor: 'blue', topPattern: 'plain',
  bottom: 'shorts', bottomColor: 'orange', face: 'glasses', accessory: 'balloon', build: 'child',
};
const BIGARADE: PersonAppearance = {
  skin: 'brown', hair: 'short', hairColor: 'black', hat: 'chef', top: 'apron', topColor: 'white', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'black', face: 'mustache', accessory: 'none', build: 'large',
};
const PRESIDENT: PersonAppearance = {
  skin: 'dark', hair: 'short', hairColor: 'white', hat: 'bowler', top: 'suit', topColor: 'navy', topPattern: 'stripes',
  bottom: 'trousers', bottomColor: 'navy', face: 'glasses', accessory: 'newspaper', build: 'slim',
};
const CONCURRENTE: PersonAppearance = {
  skin: 'light', hair: 'curly', hairColor: 'grey', hat: 'beret', top: 'sweater', topColor: 'red', topPattern: 'plain',
  bottom: 'skirt', bottomColor: 'brown', face: 'none', accessory: 'cane', build: 'regular',
};

export const c02: CaseDef = {
  id: 'c02',
  title: 'Coin-coin !',
  unlockAfter: ['c01'],
  difficulty: 2,
  teaser: 'Au Parc des Meules, la cane dorée de la baronne a disparu le jour du grand concours.',
  intro:
    'Cet après-midi, au kiosque à musique, se tient le Grand Concours de la Plus Belle Cane. La grande favorite : Duchesse, la cane au plumage entièrement doré de la baronne Adélaïde de la Botte. Problème : ce matin, Duchesse a disparu de l’étang aux Canards.\n\n' +
    'La baronne vous attend au bord de l’étang, au pied du ponton, avec Picotin. Elle offre une récompense, sa gratitude éternelle et sa recette de canard à l’orange — non, pardon, pas celle-là.\n\n' +
    'Retrouvez Duchesse avant le concours.\n\n— Commissaire Odile Fétu',
  start: { x: 5250, y: 980, zoom: 1.6 },
  characters: [
    { id: 'c02.picotin', name: 'Brigadier Gaston Picotin', role: 'votre coéquipier', appearance: PICOTIN },
    { id: 'c02.baronne', name: 'Adélaïde de la Botte', role: 'la propriétaire de Duchesse', appearance: BARONNE },
    { id: 'c02.barbarie', name: 'Hippolyte Barbarie', role: 'éleveur de volailles, propriétaire du Baron', appearance: BARBARIE },
    { id: 'c02.lulu', name: 'Lulu', role: 'le petit témoin', appearance: LULU },
    { id: 'c02.bigarade', name: 'Gaspard Bigarade', role: 'chef cuisinier', appearance: BIGARADE },
  ],
  entities: [
    // Au pied du ponton : la baronne et Picotin
    { id: 'c02.baronne.1', kind: 'person', x: 5300, y: 1066, pose: 'handsup', facing: 'left', emote: 'sweat', character: 'c02.baronne', appearance: BARONNE },
    { id: 'c02.picotin.1', kind: 'person', x: 5322, y: 1069, pose: 'read', facing: 'left', character: 'c02.picotin', appearance: PICOTIN },
    // Rive sud-est : Barbarie attire Duchesse avec du pain
    { id: 'c02.barbarie.1', kind: 'person', x: 5492, y: 1040, pose: 'crouch', facing: 'left', holding: 'baguette', character: 'c02.barbarie', appearance: BARBARIE },
    { id: 'c02.duchesse.1', kind: 'prop', prop: 'duck', x: 5472, y: 1041, facing: 'right', color: 'yellow', scale: 1.4 },
    // Plus à l'est : Lulu nourrit des canards ordinaires, sur l'eau
    { id: 'c02.lulu.1', kind: 'person', x: 5615, y: 998, pose: 'point', facing: 'left', holding: 'baguette', character: 'c02.lulu', appearance: LULU },
    { id: 'c02.canard.1', kind: 'prop', prop: 'duck', x: 5596, y: 966, facing: 'right' },
    { id: 'c02.canard.2', kind: 'prop', prop: 'duck', x: 5576, y: 973, facing: 'right' },
    // Barbarie emporte le carton vers le boulevard ; le chef Bigarade porte lui aussi un carton
    { id: 'c02.barbarie.2', kind: 'person', x: 5370, y: 1190, pose: 'carry', facing: 'left', holding: 'box', character: 'c02.barbarie', appearance: BARBARIE },
    { id: 'c02.bigarade.1', kind: 'person', x: 5585, y: 1165, pose: 'carry', facing: 'right', holding: 'box', emote: 'music', character: 'c02.bigarade', appearance: BIGARADE },
    // Boulevard des Halles : la camionnette ; Lulu ouvre la portière, Duchesse s'échappe
    { id: 'c02.camionnette', kind: 'vehicle', vehicle: 'van', x: 5300, y: 1297, facing: 'left', color: 'white', label: 'VOLAILLES BARBARIE', doorOpen: true },
    { id: 'c02.lulu.2', kind: 'person', x: 5266, y: 1270, pose: 'wave', facing: 'right', emote: 'heart', character: 'c02.lulu', appearance: LULU },
    { id: 'c02.duchesse.2', kind: 'prop', prop: 'duck', x: 5249, y: 1272, facing: 'left', color: 'yellow', scale: 1.4 },
    // Duchesse a traversé le boulevard
    { id: 'c02.duchesse.3', kind: 'prop', prop: 'duck', x: 5172, y: 1333, facing: 'left', color: 'yellow', scale: 1.4 },
    // Le concours, au kiosque à musique
    { id: 'c02.panneau', kind: 'prop', prop: 'sign', x: 4906, y: 1494, label: 'CONCOURS DE CANES' },
    { id: 'c02.president.1', kind: 'person', x: 4926, y: 1500, pose: 'point', facing: 'right', emote: 'exclaim', appearance: PRESIDENT },
    { id: 'c02.duchesse.4', kind: 'prop', prop: 'duck', x: 4946, y: 1503, facing: 'left', color: 'yellow', scale: 1.4 },
    { id: 'c02.canard.3', kind: 'prop', prop: 'duck', x: 4966, y: 1504, facing: 'left' },
    { id: 'c02.concurrente.1', kind: 'person', x: 4984, y: 1503, pose: 'stand', facing: 'left', emote: 'angry', appearance: CONCURRENTE },
    // Fuite en bateau, au milieu de l'étang, encerclé par les canards
    { id: 'c02.barque', kind: 'vehicle', vehicle: 'boat', x: 5390, y: 660, facing: 'right', color: 'green', label: 'LE BARON' },
    { id: 'c02.barbarie.3', kind: 'person', x: 5360, y: 661, z: 10, sortY: 661, pose: 'handsup', facing: 'right', emote: 'sweat', character: 'c02.barbarie', appearance: BARBARIE },
    { id: 'c02.canard.4', kind: 'prop', prop: 'duck', x: 5322, y: 676, facing: 'right' },
    { id: 'c02.canard.5', kind: 'prop', prop: 'duck', x: 5458, y: 672, facing: 'left' },
    { id: 'c02.canard.6', kind: 'prop', prop: 'duck', x: 5352, y: 690, facing: 'right' },
    { id: 'c02.canard.7', kind: 'prop', prop: 'duck', x: 5430, y: 694, facing: 'left' },
  ],
  steps: [
    {
      id: 's1',
      question: 'Quelqu’un a attiré Duchesse hors de l’eau avec du pain. Qui ?',
      accept: ['c02.barbarie.1'],
      nearMiss: [
        { id: 'c02.lulu.1', feedback: 'Le petit Lulu nourrit des canards ordinaires, sur l’eau. Duchesse, elle, est dorée de la tête à la queue.' },
        { id: 'c02.baronne.1', feedback: 'La baronne se lamente, les bras au ciel : « Ma Duchesse ! Ma toute belle ! »' },
        { id: 'c02.picotin.1', feedback: 'Picotin prend des notes. Enfin… il dessine des canards dans son carnet.' },
      ],
      hints: [
        { text: 'Cherchez une cane toute dorée hors de l’eau, sur la rive de l’étang.' },
        { text: 'À l’est du ponton, quelqu’un tend une baguette à ras du sol…', area: { x: 5445, y: 1020, radius: 110 } },
      ],
      solved:
        'Hippolyte Barbarie, éleveur de volailles… et propriétaire du Baron, le grand rival de Duchesse au concours. Il l’attire avec une baguette.',
      thread: [['c02.barbarie.1', 'c02.duchesse.1']],
    },
    {
      id: 's2',
      question: 'Barbarie a fourré Duchesse dans un carton. Où l’a-t-il emportée ?',
      accept: ['c02.camionnette'],
      nearMiss: [
        { id: 'c02.barbarie.2', feedback: 'C’est bien Barbarie, le carton dans les bras. Suivez-le : où va-t-il ?' },
        { id: 'c02.barbarie.1', feedback: 'C’est bien Barbarie, mais plus tôt, au bord de l’étang : il n’a pas encore de carton. Suivez-le.' },
        {
          id: 'c02.bigarade.1',
          feedback: 'Le chef Bigarade porte un carton, lui aussi : des oranges. Pour un canard à l’orange ? Il jure que non, la main sur la toque.',
        },
      ],
      hints: [
        { text: 'Barbarie a pris l’allée qui descend vers le boulevard des Halles, le boulevard qui traverse le parc.' },
        { text: 'Un véhicule à son nom est garé sur le boulevard.', area: { x: 5325, y: 1250, radius: 110 } },
      ],
      solved: 'Sa camionnette, « VOLAILLES BARBARIE », garée sur le boulevard. Il y enferme le carton et repart chercher son propre canard.',
      thread: [['c02.barbarie.1', 'c02.barbarie.2'], ['c02.barbarie.2', 'c02.camionnette']],
    },
    {
      id: 's3',
      question: 'Quand Barbarie revient, la camionnette est vide ! Quelqu’un a libéré Duchesse. Qui ?',
      accept: ['c02.lulu.2'],
      nearMiss: [
        { id: 'c02.duchesse.2', feedback: 'Duchesse saute de la camionnette ! Mais qui lui a ouvert la portière ?' },
        { id: 'c02.lulu.1', feedback: 'C’est bien Lulu… mais plus tôt, au bord de l’étang. Désignez-le au moment où il libère Duchesse.' },
      ],
      hints: [
        { text: 'Regardez juste à côté de la camionnette, portière ouverte.' },
        { text: 'Quelqu’un de petit, avec un ballon, qui a tout vu depuis la rive.', area: { x: 5295, y: 1280, radius: 70 } },
      ],
      solved: 'Le petit Lulu avait tout vu depuis la rive. Il a suivi Barbarie, ouvert la portière… et Duchesse a filé.',
      thread: [['c02.camionnette', 'c02.lulu.2']],
    },
    {
      id: 's4',
      question: 'Où est Duchesse à présent ?',
      accept: ['c02.duchesse.4'],
      nearMiss: [
        { id: 'c02.duchesse.3', feedback: 'Elle a traversé le boulevard. Bien. Mais où va-t-elle d’un pas si décidé ?' },
        { id: 'c02.duchesse.2', feedback: 'Là, elle s’échappe de la camionnette. Suivez-la.' },
        { id: 'c02.duchesse.1', feedback: 'Là, c’était ce matin, au bord de l’étang. Où est-elle maintenant ?' },
        { id: 'c02.canard.3', feedback: 'Une concurrente honorable, mais blanche comme un drap. Duchesse est dorée.' },
        { id: 'c02.president.1', feedback: 'Le président du jury, très ému. Regardez plutôt ce qu’il montre du doigt.' },
        { id: 'c02.concurrente.1', feedback: 'Mme Cancan fulmine : sa cane vient de perdre toutes ses chances. Pourquoi, à votre avis ?' },
        { id: 'lm.kiosque', feedback: 'Le kiosque à musique, oui. Mais Duchesse est juste à côté, devant le jury.' },
      ],
      hints: [
        { text: 'Elle a traversé le boulevard vers le sud. Une cane de concours sait où elle doit être cet après-midi.' },
        { text: 'Regardez près du kiosque à musique.', area: { x: 4990, y: 1470, radius: 110 } },
      ],
      solved: 'Au concours, devant le jury ! Duchesse s’est présentée toute seule, à l’heure.',
      thread: [['c02.duchesse.2', 'c02.duchesse.3'], ['c02.duchesse.3', 'c02.duchesse.4']],
    },
    {
      id: 's5',
      question: 'Démasqué, Barbarie a pris la fuite pour échapper à Picotin. Où s’est-il réfugié ?',
      accept: ['c02.barque', 'c02.barbarie.3'],
      nearMiss: [
        { id: 'c02.barbarie.1', feedback: 'C’est bien Barbarie, mais ce matin, sur la rive. Depuis, il a pris le large.' },
        { id: 'c02.barbarie.2', feedback: 'C’est bien Barbarie, mais avec son carton, à travers le parc. Depuis, il a pris le large.' },
        { id: 'c02.canard.4', feedback: 'Un canard parmi d’autres. Regardez plutôt ce qu’ils encerclent.' },
        { id: 'c02.canard.5', feedback: 'Un canard parmi d’autres. Regardez plutôt ce qu’ils encerclent.' },
        { id: 'c02.canard.6', feedback: 'Un canard parmi d’autres. Regardez plutôt ce qu’ils encerclent.' },
        { id: 'c02.canard.7', feedback: 'Un canard parmi d’autres. Regardez plutôt ce qu’ils encerclent.' },
        { id: 'z.etang', feedback: 'L’étang, oui. Mais où, au juste ? Cherchez ce qui flotte au milieu.' },
      ],
      hints: [
        { text: 'Il a filé vers le nord, là où les canards font la loi.' },
        { text: 'Regardez au milieu de l’étang.', area: { x: 5375, y: 675, radius: 120 } },
      ],
      solved: 'Au milieu de l’étang, à bord de son bateau « LE BARON » — il l’a baptisé comme son canard —, encerclé par des canards furieux. Il n’ose plus avancer.',
      thread: [['c02.camionnette', 'c02.barbarie.3']],
    },
  ],
  epilogue:
    'Duchesse a remporté le Grand Concours à l’unanimité. Le Baron a été disqualifié pour complicité, et Hippolyte Barbarie a passé deux heures au milieu de l’étang : les canards refusaient de le laisser accoster.\n\n' +
    'Le petit Lulu a reçu une médaille… et le droit de nourrir Duchesse jusqu’à la fin de ses jours.',
  replay: [
    { id: 'c02.barbarie.1', caption: 'Au petit matin, Barbarie attire Duchesse hors de l’eau avec une baguette.' },
    { id: 'c02.barbarie.2', caption: 'Il l’emporte dans un carton, à travers le parc.' },
    { id: 'c02.camionnette', caption: 'Il l’enferme dans sa camionnette, garée sur le boulevard.' },
    { id: 'c02.lulu.2', caption: 'Lulu, qui a tout vu, ouvre la portière.' },
    { id: 'c02.duchesse.3', caption: 'Duchesse traverse le boulevard…' },
    { id: 'c02.duchesse.4', caption: '… et se présente au concours, à l’heure.' },
    { id: 'c02.barbarie.3', caption: 'Démasqué, Barbarie s’enfuit en bateau. Les canards l’attendaient.' },
  ],
};
