// c04 — « La Grande Paille » (difficulté 4, 6 étapes) — FILS PARALLÈLES (s1 et s4 ouvertes dès le début).
// Lieux : bijouterie Carat (rue de la Bijouterie), Grand-Place et sa fontaine, Café du Centre,
// rue des Sabots (Faubourg), parvis de l'Hôtel de Ville.
import type { CaseDef, PersonAppearance } from '../../types';
import { PICOTIN } from '../common';

/** Le bijoutier : haut-de-forme, costume violet, canne. */
const OCTAVE: PersonAppearance = {
  skin: 'pale', hair: 'bald', hairColor: 'grey', hat: 'tophat', top: 'suit', topColor: 'purple', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'purple', face: 'glasses', accessory: 'cane', build: 'slim',
};
/** Les jumeaux Taupin : identiques, SAUF le sac à dos de Ludo. */
const LUDO: PersonAppearance = {
  skin: 'tan', hair: 'curly', hairColor: 'black', hat: 'beanie', top: 'hoodie', topColor: 'grey', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'black', face: 'sunglasses', accessory: 'backpack', build: 'large',
};
const LINO: PersonAppearance = { ...LUDO, accessory: 'none' };
/** La sœur du bijoutier, complice. */
const ZITA: PersonAppearance = {
  skin: 'dark', hair: 'bun', hairColor: 'grey', hat: 'none', top: 'coat', topColor: 'yellow', topPattern: 'checks',
  bottom: 'skirt', bottomColor: 'green', face: 'none', accessory: 'handbag', build: 'large',
};

export const c04: CaseDef = {
  id: 'c04',
  title: 'La Grande Paille',
  unlockAfter: ['c03'],
  difficulty: 4,
  teaser: 'Le diamant le plus célèbre de Meulebourg a disparu de la bijouterie Carat. Tout le monde a menti, même le diamant.',
  intro:
    'Ce matin, avant l’ouverture, la vitrine de la bijouterie Carat a volé en éclats. Disparue : « La Grande Paille », un diamant gros comme une noisette, ainsi nommé à cause du minuscule défaut qui le rend unique.\n\n' +
    'Le bijoutier, Octave Carat, est effondré. Son assureur aussi, pour d’autres raisons. Les frères Taupin, deux jumeaux qui passent plus de temps sous la ville que dessus, sont déjà soupçonnés.\n\n' +
    'Autre chose : un voisin insomniaque affirme avoir vu, à l’aube, quelqu’un s’éloigner de la bijouterie avec une tarte. Personne ne l’a cru. Vérifiez quand même.\n\n' +
    '— Commissaire Odile Fétu',
  start: { x: 2705, y: 2500, zoom: 1.6 },
  characters: [
    { id: 'c04.picotin', name: 'Brigadier Gaston Picotin', role: 'votre coéquipier', appearance: PICOTIN },
    { id: 'c04.octave', name: 'Octave Carat', role: 'le bijoutier', appearance: OCTAVE },
    { id: 'c04.ludo', name: 'Ludo Taupin', role: 'cambrioleur (le jumeau au sac à dos)', appearance: LUDO },
    { id: 'c04.lino', name: 'Lino Taupin', role: 'cambrioleur (le jumeau sans sac)', appearance: LINO },
    { id: 'c04.zita', name: 'Zita Pistache', role: 'la sœur du bijoutier', appearance: ZITA },
  ],
  entities: [
    // Devant la bijouterie : la plaque d'égout ouverte, les jumeaux en plein cambriolage…
    { id: 'c04.egout', kind: 'prop', prop: 'manhole', variant: 'open', x: 2648, y: 2526 },
    { id: 'c04.lino.1', kind: 'person', x: 2663, y: 2529, pose: 'climb', facing: 'right', character: 'c04.lino', appearance: LINO },
    { id: 'c04.ludo.1', kind: 'person', x: 2688, y: 2523, pose: 'sneak', facing: 'right', holding: 'jewel', character: 'c04.ludo', appearance: LUDO },
    // … et, plus tard dans la matinée, le bijoutier « effondré » au téléphone avec son assureur, et Picotin
    { id: 'c04.octave.3', kind: 'person', x: 2730, y: 2525, pose: 'phone', facing: 'right', emote: 'sweat', character: 'c04.octave', appearance: OCTAVE },
    { id: 'c04.picotin.1', kind: 'person', x: 2756, y: 2527, pose: 'read', facing: 'left', character: 'c04.picotin', appearance: PICOTIN },
    // Fil 1 : Ludo (sac à dos) traverse la Grand-Place, puis jette le diamant dans la fontaine
    { id: 'c04.ludo.2', kind: 'person', x: 2760, y: 2282, pose: 'run', facing: 'right', character: 'c04.ludo', appearance: LUDO },
    { id: 'c04.ludo.3', kind: 'person', x: 2892, y: 2086, pose: 'point', facing: 'left', emote: 'angry', character: 'c04.ludo', appearance: LUDO },
    { id: 'c04.faux', kind: 'prop', prop: 'jewel', x: 2866, y: 2081, z: 9, sortY: 2081, scale: 1.5 },
    // Lino (sans sac) file vers le Faubourg : la fausse piste
    { id: 'c04.lino.2', kind: 'person', x: 2796, y: 2722, pose: 'run', facing: 'left', character: 'c04.lino', appearance: LINO },
    // Fil 2 : à l'aube, le bijoutier emporte une tarte…
    { id: 'c04.octave.1', kind: 'person', x: 3060, y: 2250, pose: 'sneak', facing: 'right', holding: 'cake', character: 'c04.octave', appearance: OCTAVE },
    // … qu'il confie à sa sœur, à la terrasse du Café du Centre
    { id: 'c04.zita.1', kind: 'person', x: 3214, y: 1792, pose: 'carry', facing: 'left', holding: 'cake', character: 'c04.zita', appearance: ZITA },
    { id: 'c04.octave.2', kind: 'person', x: 3192, y: 1795, pose: 'point', facing: 'right', character: 'c04.octave', appearance: OCTAVE },
    // Zita, voyant la police partout, se débarrasse de la tarte… en l'offrant à Picotin
    { id: 'c04.zita.2', kind: 'person', x: 2700, y: 1800, pose: 'wave', facing: 'right', character: 'c04.zita', appearance: ZITA },
    { id: 'c04.picotin.2', kind: 'person', x: 2722, y: 1802, pose: 'stand', facing: 'left', holding: 'cake', emote: 'heart', character: 'c04.picotin', appearance: PICOTIN },
  ],
  landmarkOverrides: {
    bijouterie: { features: [{ kind: 'brokenWindow', at: 0.62, floor: 0 }] },
  },
  steps: [
    {
      id: 's1',
      label: 'La bijouterie',
      after: [],
      question: 'La vitrine de la bijouterie Carat a été fracassée. Par où les cambrioleurs sont-ils arrivés ?',
      accept: ['c04.egout'],
      nearMiss: [
        { id: 'c04.octave.3', feedback: 'Le bijoutier se lamente au téléphone avec son assureur. Il a l’air presque… soulagé ?' },
        { id: 'c04.picotin.1', feedback: 'Picotin prend la déposition du bijoutier. Il a faim, ça se voit.' },
        { id: 'c04.lino.1', feedback: 'C’est l’un des jumeaux, en train de sortir de quelque part. Mais d’où, au juste ?' },
        { id: 'c04.ludo.1', feedback: 'C’est l’autre jumeau, le butin déjà en main. Regardez plutôt d’où ils sont sortis tous les deux.' },
        { id: 'lm.bijouterie', feedback: 'La vitrine fracassée : c’est par là qu’ils sont repartis. Mais par où sont-ils arrivés ?' },
      ],
      hints: [
        { text: 'Les frères Taupin passent plus de temps sous la ville que dessus.' },
        { text: 'Regardez par terre, sur le trottoir devant la bijouterie.', area: { x: 2675, y: 2515, radius: 70 } },
      ],
      solved: 'Une plaque d’égout ouverte, juste devant la vitrine : les jumeaux Taupin sont arrivés par les égouts. L’un d’eux en sort encore ; l’autre, sac au dos, serre déjà le butin.',
      thread: [['c04.egout', 'c04.ludo.1']],
    },
    {
      id: 's2',
      label: 'Les jumeaux',
      after: ['s1'],
      question: 'Les jumeaux se sont séparés en repartant. Retrouvez celui qui a emporté le diamant.',
      accept: ['c04.ludo.2', 'c04.ludo.3'],
      nearMiss: [
        { id: 'c04.ludo.1', feedback: 'C’est bien lui, le diamant à la main… au moment du vol. Où est-il allé ensuite ?' },
        { id: 'c04.lino.1', feedback: 'Lino sort de l’égout : il n’a rien en main. Regardez lequel des deux tient le diamant devant la vitrine.' },
        {
          id: 'c04.lino.2',
          feedback: 'C’est Lino, le jumeau sans sac à dos. Devant la vitrine, c’est celui au sac à dos qui tenait le diamant.',
        },
      ],
      hints: [
        { text: 'Rappelez-vous la scène de la vitrine : un seul des jumeaux tenait le diamant, celui qui avait un sac au dos. Il est parti vers le nord, vers la Grand-Place.' },
        { text: 'Un costaud en sweat gris, bonnet orange et lunettes noires, avec un sac à dos, dans la foule.', area: { x: 2735, y: 2330, radius: 140 } },
      ],
      solved: 'Ludo Taupin, sac au dos, a traversé la Grand-Place avec le butin. Son frère Lino est parti de l’autre côté, vers le Faubourg, pour brouiller les pistes.',
      thread: [['c04.ludo.1', 'c04.ludo.2']],
    },
    {
      id: 's3',
      label: 'Le diamant',
      after: ['s2'],
      question: 'Furieux, Ludo s’est débarrassé du diamant. Où est-il ?',
      accept: ['c04.faux', 'lm.fontaine'],
      nearMiss: [
        { id: 'c04.ludo.3', feedback: 'Ludo est furieux. Il vient de jeter quelque chose, juste devant lui.' },
        { id: 'c04.ludo.2', feedback: 'C’est Ludo, un peu plus tôt : il a encore le diamant. Suivez-le jusqu’à ce qu’il s’en débarrasse.' },
      ],
      hints: [
        { text: 'Il a examiné son butin au grand jour, au milieu de la Grand-Place… et ne l’a pas aimé.' },
        { text: 'Regardez la fontaine.', area: { x: 2840, y: 2085, radius: 90 } },
      ],
      solved: 'Dans la fontaine ! À la lumière du jour, Ludo a compris : c’est du verre. Le diamant de la vitrine était un FAUX.',
      thread: [['c04.ludo.2', 'c04.ludo.3'], ['c04.ludo.3', 'c04.faux']],
    },
    {
      id: 's4',
      label: 'Le voisin',
      after: [],
      question: 'Un voisin a vu quelqu’un s’éloigner de la bijouterie à l’aube, vers la Grand-Place, une tarte à la main. Retrouvez-le.',
      accept: ['c04.octave.1'],
      nearMiss: [
        { id: 'c04.octave.3', feedback: 'C’est le bijoutier, plus tard dans la matinée. Il n’a plus de tarte… Cherchez-le à l’aube, sur la Grand-Place.' },
        { id: 'c04.picotin.2', feedback: 'Picotin ? À l’aube, il dormait encore.' },
        { id: 'c04.zita.1', feedback: 'Cette dame porte bien une tarte, mais elle est à la terrasse d’un café, bien loin de la bijouterie. Ce n’est pas elle que le voisin a vue.' },
        { id: 'c04.octave.2', feedback: 'C’est bien le bijoutier, mais les mains vides, plus au nord : la tarte n’est plus là. Cherchez-le à l’aube, près de la Grand-Place.' },
      ],
      hints: [
        { text: 'Haut-de-forme, costume violet, une tarte à la main, l’air de ne pas vouloir être vu… Ça ne vous rappelle personne ?' },
        { text: 'Il a traversé l’est de la Grand-Place.', area: { x: 3010, y: 2280, radius: 140 } },
      ],
      solved: 'Octave Carat en personne, à l’aube, une tarte plaquée devant le visage ! Il file vers le nord. Le bijoutier « effondré » avait des choses à cacher.',
      thread: [['c04.octave.3', 'c04.octave.1']],
    },
    {
      id: 's5',
      label: 'La tarte',
      after: ['s4'],
      question: 'À qui le bijoutier a-t-il confié la tarte ?',
      accept: ['c04.zita.1'],
      nearMiss: [
        { id: 'c04.octave.2', feedback: 'C’est Octave, les mains vides : il vient de donner la tarte. À qui ?' },
        { id: 'c04.octave.1', feedback: 'C’est bien Octave, tarte à la main, mais plus tôt. Suivez-le : à qui va-t-il la confier ?' },
        { id: 'c04.picotin.2', feedback: 'Picotin n’a rien à voir avec ce que le bijoutier a confié : il n’était même pas là.' },
        { id: 'lm.cafe-du-centre', feedback: 'Le Café du Centre, oui. Mais c’est à une personne que le bijoutier a confié la tarte.' },
      ],
      hints: [
        { text: 'Il ne s’est arrêté qu’à une terrasse où l’on sert le café.' },
        { text: 'Regardez devant le Café du Centre.', area: { x: 3200, y: 1820, radius: 90 } },
      ],
      solved: 'À sa sœur, Zita Pistache, à la terrasse du Café du Centre. Elle devait quitter la ville avec… la tarte.',
      thread: [['c04.octave.1', 'c04.octave.2'], ['c04.octave.2', 'c04.zita.1']],
    },
    {
      id: 's6',
      after: ['s3', 's5'],
      question: 'Le diamant de la vitrine était un faux : le vrai était caché dans la tarte. Mais Zita ne l’a plus ! Où est la tarte, sur la place ?',
      accept: ['c04.picotin.2'],
      nearMiss: [
        { id: 'c04.zita.2', feedback: 'Zita, les mains vides. En voyant la police partout, elle s’est débarrassée de la tarte. Juste à côté…' },
        { id: 'c04.zita.1', feedback: 'Zita portait bien la tarte, à la terrasse du café. Mais elle n’a pas gardé cette tarte longtemps…' },
        { id: 'lm.hotel-de-ville', feedback: 'L’Hôtel de Ville, oui. Mais entre les mains de qui la tarte a-t-elle atterri ?' },
      ],
      hints: [
        { text: 'Zita a voulu se débarrasser de la tarte au plus vite, en la donnant à la dernière personne qu’on irait soupçonner.' },
        { text: 'Regardez devant l’Hôtel de Ville.', area: { x: 2760, y: 1790, radius: 90 } },
      ],
      solved: 'Dans les mains de Picotin, qui la trouve « délicieuse, un peu croquante au milieu ». Le vrai diamant était dedans, comme une fève dans la galette.',
      thread: [['c04.zita.1', 'c04.zita.2'], ['c04.zita.2', 'c04.picotin.2']],
    },
  ],
  epilogue:
    'Octave Carat, ruiné, avait remplacé la Grande Paille par un faux pour toucher l’assurance, et confié le vrai diamant à sa sœur, caché dans une tarte. Il comptait simuler un cambriolage ; les jumeaux Taupin, qui n’ont jamais su ce qu’ils volaient, lui ont épargné la peine.\n\n' +
    'Picotin a retrouvé le diamant avec une molaire. La commissaire lui a offert un dentiste et une médaille, dans cet ordre.',
  replay: [
    { id: 'c04.octave.1', caption: 'À l’aube, Octave Carat sort de sa bijouterie avec le vrai diamant, caché dans une tarte.' },
    { id: 'c04.zita.1', caption: 'Il confie la tarte à sa sœur Zita, au Café du Centre.' },
    { id: 'c04.lino.1', caption: 'Plus tard, les jumeaux Taupin surgissent des égouts…' },
    { id: 'c04.ludo.1', caption: '… brisent la vitrine et emportent le diamant — un faux.' },
    { id: 'c04.lino.2', caption: 'Lino file vers le Faubourg pour brouiller les pistes.' },
    { id: 'c04.ludo.3', caption: 'Ludo découvre la supercherie et jette le faux dans la fontaine.' },
    { id: 'c04.octave.3', caption: 'Le bijoutier joue la victime au téléphone avec son assureur.' },
    { id: 'c04.picotin.2', caption: 'Zita, prise de panique, offre la tarte au premier venu : Picotin.' },
  ],
};
