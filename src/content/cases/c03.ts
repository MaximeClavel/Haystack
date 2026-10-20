// c03 — « La Belle Évasion » (difficulté 3, 6 étapes) — TRAVERSE LA RIVIÈRE.
// Lieux : parvis de la gare, bar Le Fer à Cheval, Garage Pistons, Quai Nord, la Fenaison (en bateau),
// Quai Sud, jardins ouvriers (épouvantails). Le Pont Central, gardé, est une fausse piste.
import type { CaseDef, PersonAppearance } from '../../types';
import { PICOTIN } from '../common';

/** Achille Lapince, évadé : pyjama rayé bleu et blanc (chemise blanche à rayures), cheveux en épis blonds. */
const LAPINCE: PersonAppearance = {
  skin: 'light', hair: 'spiky', hairColor: 'blond', hat: 'none', top: 'shirt', topColor: 'white', topPattern: 'stripes',
  bottom: 'trousers', bottomColor: 'grey', face: 'none', accessory: 'none', build: 'slim',
};
/** Lapince déguisé en épouvantail : le même, coiffé du chapeau de paille volé. */
const LAPINCE_PAILLE: PersonAppearance = { ...LAPINCE, hat: 'straw' };
/** Les épouvantails des jardins : chemise blanche à CARREAUX (et non à rayures), chapeau de paille. */
const EPOUVANTAIL: PersonAppearance = { ...LAPINCE, hat: 'straw', topPattern: 'checks' };
/** L'épouvantail dont on a volé le chapeau. */
const EPOUVANTAIL_NU: PersonAppearance = { ...EPOUVANTAIL, hat: 'none' };
/** Sosie volontaire : un marin en marinière — comme le pyjama, mais avec un bonnet. */
const MARIN: PersonAppearance = { ...LAPINCE, hat: 'beanie' };
const LOLA: PersonAppearance = {
  skin: 'brown', hair: 'curly', hairColor: 'red', hat: 'beret', top: 'dress', topColor: 'pink', topPattern: 'dots',
  bottom: 'skirt', bottomColor: 'pink', face: 'sunglasses', accessory: 'handbag', build: 'slim',
};
/** Figurants (sans personnage : n'affectent pas la règle anti-sosie). */
const AGENT: PersonAppearance = {
  skin: 'dark', hair: 'short', hairColor: 'black', hat: 'police', top: 'uniform', topColor: 'navy', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'navy', face: 'none', accessory: 'none', build: 'regular',
};
const AGENTE: PersonAppearance = { ...AGENT, skin: 'pale', hair: 'ponytail', hairColor: 'brown', face: 'sunglasses' };
const CLIENT: PersonAppearance = {
  skin: 'tan', hair: 'bald', hairColor: 'grey', hat: 'cap', top: 'tshirt', topColor: 'orange', topPattern: 'plain',
  bottom: 'trousers', bottomColor: 'blue', face: 'beard', accessory: 'none', build: 'large',
};

export const c03: CaseDef = {
  id: 'c03',
  title: 'La Belle Évasion',
  unlockAfter: ['c02'],
  difficulty: 3,
  teaser: 'Un détenu s’est fait la belle devant la gare, en pyjama rayé. Il ne devrait pas aller bien loin, sauf si quelqu’un l’attend.',
  intro:
    'Ce matin, Achille Lapince, dit « le Hérisson » — cheveux en épis, pyjama rayé bleu et blanc —, devait être transféré à la prison de la Préfecture. Le fourgon s’est arrêté devant la gare, sous la garde du brigadier Picotin. Deux minutes plus tard, il était vide.\n\n' +
    'Depuis l’alerte, deux agents gardent le Pont Central. Lapince n’a ni argent ni vêtements de rechange, mais il a des amis. Retrouvez-le avant le train de midi.\n\n' +
    '— Commissaire Odile Fétu',
  start: { x: 1060, y: 1810, zoom: 1.5 },
  characters: [
    { id: 'c03.picotin', name: 'Brigadier Gaston Picotin', role: 'votre coéquipier', appearance: PICOTIN },
    { id: 'c03.lapince', name: 'Achille Lapince, dit « le Hérisson »', role: 'l’évadé', appearance: LAPINCE },
    { id: 'c03.lapince-paille', name: 'Achille Lapince (déguisé)', role: 'l’évadé, en épouvantail', appearance: LAPINCE_PAILLE },
    { id: 'c03.lola', name: 'Lola Cachou', role: 'la fiancée de Lapince', appearance: LOLA },
    { id: 'c03.marin', name: 'Yves Le Goéland', role: 'marin du quai Nord', appearance: MARIN },
    { id: 'c03.epouvantail', name: 'Épouvantail', role: 'gardien des potagers', appearance: EPOUVANTAIL },
    { id: 'c03.epouvantail-nu', name: 'Épouvantail décoiffé', role: 'gardien des potagers, sans chapeau', appearance: EPOUVANTAIL_NU },
  ],
  entities: [
    // Parvis de la gare : le fourgon vide, la fausse évanouie, Picotin qui l'évente
    { id: 'c03.fourgon', kind: 'vehicle', vehicle: 'van', x: 1110, y: 1846, facing: 'left', color: 'navy', label: 'POLICE', doorOpen: true },
    { id: 'c03.lola.1', kind: 'person', x: 1074, y: 1797, pose: 'lie', facing: 'right', emote: 'ko', character: 'c03.lola', appearance: LOLA },
    { id: 'c03.picotin.1', kind: 'person', x: 1098, y: 1799, pose: 'crouch', facing: 'left', emote: 'sweat', character: 'c03.picotin', appearance: PICOTIN },
    // Devant le bar Le Fer à Cheval : Lapince passe en courant, un client le montre du doigt
    { id: 'c03.lapince.1', kind: 'person', x: 856, y: 2267, pose: 'run', facing: 'left', character: 'c03.lapince', appearance: LAPINCE },
    { id: 'c03.client', kind: 'person', x: 818, y: 2269, pose: 'point', facing: 'right', emote: 'exclaim', appearance: CLIENT },
    // Garage Pistons : il se faufile vers le sud
    { id: 'c03.lapince.2', kind: 'person', x: 880, y: 3270, pose: 'sneak', facing: 'left', character: 'c03.lapince', appearance: LAPINCE },
    // Quai Nord : un marin en marinière (sosie volontaire)
    { id: 'c03.marin.1', kind: 'person', x: 1180, y: 3693, pose: 'stand', facing: 'left', holding: 'rope', character: 'c03.marin', appearance: MARIN },
    // Pont Central : gardé par deux agents (fausse piste)
    { id: 'c03.agent.1', kind: 'person', x: 2170, y: 3820, pose: 'stand', facing: 'right', appearance: AGENT },
    { id: 'c03.agent.2', kind: 'person', x: 2230, y: 3842, pose: 'stand', facing: 'left', appearance: AGENTE },
    // La Fenaison : Lola mène le bateau ; Lapince escalade le quai Sud
    { id: 'c03.bateau', kind: 'vehicle', vehicle: 'boat', x: 945, y: 3925, facing: 'left', color: 'red', label: 'LA COCOTTE' },
    { id: 'c03.lola.2', kind: 'person', x: 968, y: 3926, z: 10, sortY: 3926, pose: 'wave', facing: 'left', character: 'c03.lola', appearance: LOLA },
    { id: 'c03.lapince.3', kind: 'person', x: 905, y: 3965, pose: 'climb', facing: 'left', character: 'c03.lapince', appearance: LAPINCE },
    // Jardins ouvriers : les épouvantails… et l'imposteur
    { id: 'c03.epouvantail.1', kind: 'person', x: 760, y: 4512, pose: 'handsup', facing: 'right', character: 'c03.epouvantail', appearance: EPOUVANTAIL },
    { id: 'c03.epouvantail.2', kind: 'person', x: 1230, y: 4520, pose: 'handsup', facing: 'left', character: 'c03.epouvantail', appearance: EPOUVANTAIL },
    { id: 'c03.epouvantail.3', kind: 'person', x: 860, y: 4350, pose: 'handsup', facing: 'right', character: 'c03.epouvantail', appearance: EPOUVANTAIL },
    { id: 'c03.epouvantail-nu.1', kind: 'person', x: 1100, y: 4380, pose: 'handsup', facing: 'left', character: 'c03.epouvantail-nu', appearance: EPOUVANTAIL_NU },
    { id: 'c03.lapince.4', kind: 'person', x: 960, y: 4640, pose: 'handsup', facing: 'right', emote: 'sweat', character: 'c03.lapince-paille', appearance: LAPINCE_PAILLE },
    { id: 'c03.pigeons', kind: 'prop', prop: 'pigeons', x: 942, y: 4648 },
  ],
  steps: [
    {
      id: 's1',
      question: 'Trouvez le fourgon de police, portière ouverte, devant la gare.',
      accept: ['c03.fourgon'],
      nearMiss: [
        { id: 'c03.lola.1', feedback: 'Il y a de l’agitation sur le parvis, mais on y reviendra : trouvez d’abord le fourgon.' },
        { id: 'c03.picotin.1', feedback: 'Picotin est très occupé, là-bas. On y reviendra : trouvez d’abord le fourgon.' },
      ],
      hints: [
        { text: 'Il est garé rue de la Gare, au sud du parvis, juste à côté du bus vert.' },
        { text: 'Un fourgon bleu marine, vide.', area: { x: 1080, y: 1820, radius: 90 } },
      ],
      solved: 'Le fourgon est vide, portière grande ouverte. Mais que faisaient les agents pendant l’évasion ?',
    },
    {
      id: 's2',
      question: 'Devant la gare, les agents ont été distraits au moment de l’évasion. Qui a fait diversion ?',
      accept: ['c03.lola.1'],
      nearMiss: [
        { id: 'c03.picotin.1', feedback: 'Picotin évente la dame évanouie de son képi. Il n’a rien vu partir — il ne voit d’ailleurs pas grand-chose.' },
        { id: 'c03.fourgon', feedback: 'Le fourgon, toujours vide. Qui a détourné l’attention des agents ?' },
        // Le Pont Central, gardé depuis l'alerte, est le leurre que le briefing suggère : ni erreur comptée, ni piste ouverte.
        { id: 'c03.agent.1', feedback: 'Ces deux-là gardent le pont depuis l’alerte : l’évasion est déjà passée. Qui a retenu les agents devant la gare ?' },
        { id: 'c03.agent.2', feedback: 'Ces deux-là gardent le pont depuis l’alerte : l’évasion est déjà passée. Qui a retenu les agents devant la gare ?' },
        { id: 'z.pont-central', feedback: 'Le pont est gardé depuis l’alerte : l’évasion est déjà passée. Qui a retenu les agents devant la gare ?' },
      ],
      hints: [
        { text: 'Quelqu’un a fait un malaise très opportun, tout près du fourgon.' },
        { text: 'Regardez sur le parvis, juste au-dessus du fourgon.', area: { x: 1095, y: 1815, radius: 70 } },
      ],
      solved:
        'Une dame s’est « évanouie » sur le parvis : lunettes noires, béret, robe rose à pois. Tous les agents ont couru à son secours… Un évanouissement bien commode. Pendant ce temps, Lapince s’éclipsait par les ruelles du sud.',
      thread: [['c03.lola.1', 'c03.fourgon']],
    },
    {
      id: 's3',
      question: 'Lapince a quitté le parvis à pied, en pyjama rayé, cheveux en épis. Quelqu’un l’a vu courir : retrouvez-le.',
      accept: ['c03.lapince.1', 'c03.lapince.2'],
      nearMiss: [
        {
          id: 'c03.marin.1',
          feedback: 'Une marinière, pas un pyjama : ce marin porte un bonnet, et il n’a pas quitté son quai de la matinée.',
        },
        { id: 'c03.client', feedback: 'Un client du Fer à Cheval, très agité. Regardez plutôt ce qu’il montre du doigt.' },
        { id: 'c03.lola.1', feedback: 'La fausse malade est encore sur le parvis. Lapince, lui, a déjà pris la poudre d’escampette.' },
        { id: 'c03.lapince.3', feedback: 'C’est bien lui, mais beaucoup plus loin, de l’autre côté de la rivière. Retrouvez d’abord le début de sa fuite.' },
      ],
      hints: [
        { text: 'Cherchez le bar Le Fer à Cheval, dans la rue du même nom : un client à casquette rouge y montre un coureur du doigt.' },
        { text: 'Regardez devant la terrasse du Fer à Cheval.', area: { x: 875, y: 2220, radius: 90 } },
      ],
      solved: 'Le revoilà, qui file vers le sud — devant le Fer à Cheval, puis en se faufilant près du Garage Pistons. Il se dirige vers la rivière.',
      thread: [['c03.fourgon', 'c03.lapince.1'], ['c03.lapince.1', 'c03.lapince.2']],
    },
    {
      id: 's4',
      question: 'Le Pont Central est gardé, et Lapince a pourtant gagné la rive sud. Quelqu’un l’a aidé à traverser la Fenaison. Qui, et comment ?',
      accept: ['c03.bateau', 'c03.lola.2'],
      nearMiss: [
        { id: 'z.pont-central', feedback: 'Le Pont Central est gardé par deux agents depuis ce matin. Lapince a trouvé autre chose.' },
        { id: 'c03.lapince.3', feedback: 'C’est bien lui, déjà sur la rive sud ! Mais comment est-il arrivé là ?' },
        { id: 'c03.marin.1', feedback: 'Ce marin n’a pas bougé de son quai de la matinée : ce n’est pas lui qui a fait traverser Lapince.' },
      ],
      hints: [
        { text: 'Pas par un pont. Regardez sur l’eau, au sud du Garage Pistons : vous y croiserez une connaissance.' },
        { text: 'Un bateau rouge, tout près du quai Sud.', area: { x: 945, y: 3880, radius: 100 } },
      ],
      solved:
        'En bateau ! La capitaine n’est autre que la dame « évanouie » de la gare : Lola Cachou, la fiancée de Lapince. Pendant qu’il escalade le quai Sud, un jardinier des jardins ouvriers signale à la brigade le vol du chapeau de paille d’un de ses épouvantails.',
      thread: [['c03.lapince.2', 'c03.bateau'], ['c03.lola.1', 'c03.lola.2']],
    },
    {
      id: 's5',
      question: 'Aux jardins ouvriers, des épouvantails montent la garde, les bras en l’air. L’un d’eux s’est fait voler son chapeau de paille. Lequel ?',
      accept: ['c03.epouvantail-nu.1'],
      nearMiss: [
        { id: 'c03.epouvantail.1', feedback: 'Cet épouvantail a toujours son chapeau.' },
        { id: 'c03.epouvantail.2', feedback: 'Cet épouvantail a toujours son chapeau.' },
        { id: 'c03.epouvantail.3', feedback: 'Cet épouvantail a toujours son chapeau.' },
        { id: 'c03.lapince.4', feedback: 'Cet épouvantail a toujours son chapeau.' },
      ],
      hints: [
        { text: 'Ils se dressent au milieu des potagers, bras levés. Comptez les chapeaux.' },
        { text: 'Cherchez dans la rangée nord des jardins.', area: { x: 1085, y: 4320, radius: 120 } },
      ],
      solved: 'Un épouvantail décoiffé, cheveux de paille au vent. Quelqu’un avait besoin d’un chapeau…',
      thread: [['c03.lapince.3', 'c03.epouvantail-nu.1']],
    },
    {
      id: 's6',
      question: 'Lapince s’est déguisé en épouvantail avec le chapeau volé, mais il porte toujours son pyjama. Démasquez-le !',
      accept: ['c03.lapince.4'],
      nearMiss: [
        { id: 'c03.epouvantail.1', feedback: 'Un vrai épouvantail : pas de rayures, et il ne transpire pas.' },
        { id: 'c03.epouvantail.2', feedback: 'Un vrai épouvantail : pas de rayures, et il ne transpire pas.' },
        { id: 'c03.epouvantail.3', feedback: 'Un vrai épouvantail : pas de rayures, et il ne transpire pas.' },
        { id: 'c03.epouvantail-nu.1', feedback: 'C’est l’épouvantail volé : il n’a plus de chapeau. L’imposteur, lui, l’a sur la tête.' },
      ],
      hints: [
        { text: 'Un pyjama rayé ne ressemble pas tout à fait à une chemise à carreaux. Et un épouvantail ne transpire jamais.' },
        { text: 'Regardez la rangée sud des jardins.', area: { x: 985, y: 4585, radius: 110 } },
      ],
      solved: 'Des rayures sous le chapeau de paille, et une goutte de sueur sur le front : Achille Lapince ! Même les pigeons ne s’y trompent pas.',
      thread: [['c03.epouvantail-nu.1', 'c03.lapince.4']],
    },
  ],
  epilogue:
    'Achille Lapince a tenu quarante minutes immobile, les bras en l’air, avant que le brigadier Picotin ne lui demande l’heure. Il a répondu.\n\n' +
    'Lola Cachou a été arrêtée au quai Sud, à bord de « La Cocotte ». L’épouvantail a récupéré son chapeau, et les jardiniers jurent qu’il a l’air plus fier qu’avant.',
  replay: [
    { id: 'c03.lola.1', caption: 'Devant la gare, Lola fait un malaise spectaculaire. Tous les agents accourent.' },
    { id: 'c03.fourgon', caption: 'Pendant ce temps, Lapince saute du fourgon.' },
    { id: 'c03.lapince.1', caption: 'Il file vers le sud, devant la terrasse du Fer à Cheval…' },
    { id: 'c03.lapince.2', caption: '… se faufile près du Garage Pistons…' },
    { id: 'c03.bateau', caption: '… et rejoint Lola, qui l’attend en bateau.' },
    { id: 'c03.lapince.3', caption: 'Sur la rive sud, il escalade le quai.' },
    { id: 'c03.epouvantail-nu.1', caption: 'Aux jardins ouvriers, il vole le chapeau d’un épouvantail…' },
    { id: 'c03.lapince.4', caption: '… et se plante au milieu des potagers. Il transpire.' },
  ],
};
