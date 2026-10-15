// c00 — Tutoriel : « La Tarte de bienvenue » (difficulté 1, 3 étapes).
// Lieu : square de la rue Neuve (Vieille Ville, à l'ouest), 1495–1705 × 1858–2062.
import type { CaseDef, PersonAppearance } from '../../types';
import { PICOTIN } from '../common';

const LIVREUR: PersonAppearance = {
  skin: 'tan',
  hair: 'curly',
  hairColor: 'black',
  hat: 'cap',
  top: 'apron',
  topColor: 'white',
  topPattern: 'plain',
  bottom: 'shorts',
  bottomColor: 'red',
  face: 'none',
  accessory: 'none',
  build: 'slim',
};

export const c00: CaseDef = {
  id: 'c00',
  title: 'La Tarte de bienvenue',
  difficulty: 1,
  teaser: 'Premier jour à la brigade : une tarte aux fraises s’est volatilisée entre la boulangerie et le commissariat.',
  intro:
    'Bienvenue à Meulebourg, inspecteur. Ici, on cherche des aiguilles dans des bottes de foin… et on les trouve.\n\n' +
    'Pour fêter votre arrivée, j’avais commandé une tarte aux fraises à la boulangerie. Elle n’est jamais arrivée. Ce n’est pas encore un crime, mais c’est déjà un drame. Mon chien Croquette a lui aussi disparu ce matin : je suppose que c’est une coïncidence.\n\n' +
    'Le brigadier Picotin vous attend au square de la rue Neuve. Pincez pour zoomer, glissez pour vous déplacer, et touchez une personne ou un objet pour le désigner.\n\n' +
    '— Commissaire Odile Fétu',
  start: { x: 1595, y: 1925, zoom: 1.6 },
  characters: [
    { id: 'c00.picotin', name: 'Brigadier Gaston Picotin', role: 'votre coéquipier', appearance: PICOTIN },
    { id: 'c00.livreur', name: 'Timothée Fournil', role: 'le livreur de la boulangerie', appearance: LIVREUR },
  ],
  entities: [
    { id: 'c00.picotin.1', kind: 'person', x: 1612, y: 1880, pose: 'wave', facing: 'left', character: 'c00.picotin', appearance: PICOTIN },
    { id: 'c00.livreur.1', kind: 'person', x: 1648, y: 1914, pose: 'carry', facing: 'left', holding: 'cake', character: 'c00.livreur', appearance: LIVREUR },
    { id: 'c00.banc', kind: 'prop', prop: 'bench', x: 1540, y: 1915, color: 'green' },
    { id: 'c00.livreur.2', kind: 'person', x: 1537, y: 1915.6, sortY: 1915.6, pose: 'sit', facing: 'right', emote: 'sleep', character: 'c00.livreur', appearance: LIVREUR },
    { id: 'c00.croquette', kind: 'prop', prop: 'dog', x: 1561, y: 1945, facing: 'right', color: 'white' },
    { id: 'c00.tarte', kind: 'prop', prop: 'cake', x: 1575, y: 1946 },
    { id: 'c00.pigeons', kind: 'prop', prop: 'pigeons', x: 1521, y: 1949 },
  ],
  steps: [
    {
      id: 's1',
      question: 'Trouvez le brigadier Picotin : casquette de police, uniforme bleu, bermuda beige. Il vous fait signe.',
      accept: ['c00.picotin.1'],
      hints: [
        { text: 'Il vous attend dans le square, du côté nord, près de l’allée.' },
        { text: 'Cherchez l’homme en uniforme qui agite la main.', area: { x: 1600, y: 1905, radius: 90 } },
      ],
      solved:
        '« Ah, inspecteur ! Le livreur de la boulangerie est passé devant moi avec la tarte : casquette, tablier blanc, short rouge. Il traversait le square vers l’ouest… et je ne l’ai jamais vu ressortir. »',
    },
    {
      id: 's2',
      question:
        'Où est le livreur MAINTENANT ? Astuce : un même personnage peut apparaître plusieurs fois sur la carte, à différents moments de son histoire.',
      accept: ['c00.livreur.2'],
      nearMiss: [
        {
          id: 'c00.livreur.1',
          feedback: 'C’est bien lui… mais un peu plus tôt : il porte encore la tarte. Regardez vers où il marche et cherchez la suite de son histoire.',
        },
        { id: 'c00.picotin.1', feedback: 'Picotin vous fait signe. Il attend que vous trouviez le livreur.' },
      ],
      hints: [
        { text: 'Il marchait vers l’ouest du square. Un livreur fatigué, ça finit toujours par s’asseoir.' },
        { text: 'Regardez les bancs, à l’ouest de l’allée centrale.', area: { x: 1570, y: 1890, radius: 80 } },
      ],
      solved: 'Le livreur dort à poings fermés sur un banc. Et ses bras sont vides : plus de tarte !',
      thread: [['c00.livreur.1', 'c00.livreur.2']],
    },
    {
      id: 's3',
      question: 'La tarte a disparu pendant la sieste du livreur. Qui l’a mangée ?',
      accept: ['c00.croquette'],
      nearMiss: [
        { id: 'c00.tarte', feedback: 'Voici ce qu’il reste de la tarte. Mais qui a croqué dedans ?' },
        { id: 'c00.pigeons', feedback: 'Les pigeons guettent les miettes. Une tarte entière, c’est trop lourd pour eux.' },
        { id: 'c00.livreur.2', feedback: 'Il ronfle. Difficile de manger une tarte en dormant.' },
      ],
      hints: [
        { text: 'Regardez juste devant le banc du livreur.' },
        { text: 'Un gourmand à quatre pattes, le museau dans la crème…', area: { x: 1545, y: 1915, radius: 70 } },
      ],
      solved: 'Croquette ! Le chien de la commissaire Fétu, le museau plein de crème. Une coïncidence, disiez-vous ? Affaire classée.',
      thread: [['c00.livreur.2', 'c00.croquette']],
    },
  ],
  epilogue:
    'Croquette s’était échappé du commissariat par la chatière et avait suivi l’odeur des fraises jusqu’au square. La commissaire a commandé une autre tarte… et confié la laisse à Picotin, qui n’a pas fini d’en entendre parler.\n\n' +
    'Vous connaissez la méthode : observer, suivre, désigner. Bienvenue dans la brigade, inspecteur.',
  replay: [
    { id: 'c00.livreur.1', caption: 'Le livreur traverse le square, la tarte dans les bras, sous les yeux de Picotin.' },
    { id: 'c00.livreur.2', caption: 'Épuisé par sa tournée, il s’assoit sur un banc… et s’endort.' },
    { id: 'c00.croquette', caption: 'Croquette, échappé du commissariat, flaire les fraises et se sert.' },
    { id: 'c00.picotin.1', caption: 'Picotin vous attend, sans se douter que le coupable est le chien de la commissaire.' },
  ],
};
