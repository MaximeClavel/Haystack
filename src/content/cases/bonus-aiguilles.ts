// Bonus — « Les Aiguilles du Fondateur » : 10 aiguilles d'or cachées dans toute la ville (une étape, required: 10).
// Chaque aiguille est un objet 'needle' (échelle 1,5) posé dans un lieu reconnaissable ; le briefing
// est un « testament » en dix vers, un par aiguille. L'indice 2 n'a PAS de zone fixe : le jeu calcule
// le projecteur autour d'une aiguille encore cachée (il suit la progression).
import type { CaseDef, PropEntity } from '../../types';

const N = 'bonus-aiguilles';

function aiguille(n: number, x: number, y: number, extra: Partial<PropEntity> = {}): PropEntity {
  return { id: `${N}.aiguille.${n}`, kind: 'prop', prop: 'needle', x, y, scale: 1.5, tags: ['needle'], ...extra };
}

export const bonusAiguilles: CaseDef = {
  id: N,
  title: 'Les Aiguilles du Fondateur',
  difficulty: 3,
  bonus: true,
  unlockAfter: ['c00'],
  teaser: 'Dix aiguilles d’or, perdues il y a deux siècles par le fondateur de Meulebourg. La botte de foin, c’est la ville entière.',
  intro:
    'On raconte qu’Hector Meule, fondateur de la ville, cherchait une aiguille d’or dans une botte de foin quand il décida de bâtir Meulebourg autour. Il en perdit dix autres en chemin, et laissa ce testament :\n\n' +
    '« Là où l’on attend les trains, le temps a deux aiguilles : j’en ai mis une troisième.\n' +
    'Au parc qui porte mon nom, ma main levée en tient une, et ne la lâche pas.\n' +
    'Le boucher a ses crochets ; à sa porte, mon aiguille.\n' +
    'La police perd ses affaires : cherchez entre ses voitures.\n' +
    'À l’école, on apprend à compter : commencez dans la cour.\n' +
    'Les enfants creusent pour trouver des trésors : au parc, un bac à sable en cache un.\n' +
    'Un ange veille sur les morts, et sur une aiguille.\n' +
    'Sur le Pont Central, une aiguille regarde couler la Fenaison.\n' +
    'Aux jardins ouvriers, elle pousse devant la serre du coin, là où le chemin des Arrosoirs rejoint celui des Serres.\n' +
    'La capitainerie garde tout ce qui entre au port… même une aiguille. »\n\n' +
    'Zoomez bien : une aiguille d’or n’est qu’un petit trait doré.',
  start: { x: 3200, y: 2400, zoom: 0.12 },
  characters: [],
  entities: [
    // 1. Gare : sur le cadran de la grande horloge (en hauteur, sur la façade)
    aiguille(1, 779, 1571, { z: 139, sortY: 1571 }),
    // 2. Parc : dans la main levée de la Statue du Fondateur
    aiguille(2, 4578, 621, { z: 36, sortY: 621 }),
    // 3. Halles : devant la porte de la Boucherie Tendron
    aiguille(3, 2965, 366),
    // 4. Vieille Ville : devant le commissariat, entre deux voitures de police
    aiguille(4, 1820, 2584),
    // 5. Faubourg : dans la cour de l'école Jules-Botte, au pied de la façade
    aiguille(5, 1860, 3200),
    // 6. Parc : dans le bac à sable de l'aire de jeux
    aiguille(6, 6020, 1690),
    // 7. Quartier des Arts : au pied de l'ange est du cimetière
    aiguille(7, 4890, 3272),
    // 8. La Fenaison : sur le trottoir est du Pont Central, côté nord
    aiguille(8, 2232, 3712),
    // 9. Jardins ouvriers : devant la serre du coin (b.jardins.68, hors du carré des parcelles), là où le chemin des
    //    Arrosoirs rejoint le chemin des Serres (la pastille de lieu affiche les deux noms au carrefour)
    aiguille(9, 2029, 4710),
    // 10. Port : devant la porte de la Capitainerie
    aiguille(10, 4600, 4338),
  ],
  steps: [
    {
      id: 's1',
      question: 'Retrouvez les dix aiguilles d’or du Fondateur. Chaque vers du testament désigne un lieu.',
      accept: Array.from({ length: 10 }, (_, i) => `${N}.aiguille.${i + 1}`),
      required: 10,
      hints: [
        // Palier 1 (payant : 3 → 2 étoiles) : un conseil de méthode vrai pour toutes les aiguilles et absent du
        // briefing. « Chaque quartier » reste vrai tant que les 10 aiguilles couvrent les 9 quartiers (voir plus haut).
        { text: 'Chaque quartier cache au moins une aiguille. Zoomez jusqu’à bien voir les passants : l’aiguille porte une étoile claire.' },
        // Palier 2 : le projecteur est recalculé à chaque aiguille trouvée (reste utile sans nouvel indice) ; le dire.
        { text: 'Le projecteur éclaire les environs d’une aiguille encore cachée ; une fois celle-ci trouvée, il passe à une autre.' },
      ],
      solved: 'Les dix aiguilles d’or sont réunies sur votre bureau. Elles brillent comme au premier jour.',
    },
  ],
  epilogue:
    'Le maire de Meulebourg vous a remis la Meule d’Or, la plus haute distinction de la ville (un petit tas de foin en laiton, très lourd).\n\n' +
    'Hector Meule avait raison : à Meulebourg, on finit toujours par trouver l’aiguille. Il suffit de regarder chaque brin.',
  replay: [],
};
