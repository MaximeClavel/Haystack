// Textes du décor : enseignes, graffitis, affiches, noms de bateaux, plaques.
// Aucune enseigne ambiante ne reprend celle d'un lieu remarquable (BOULANGERIE, BIJOUTERIE…) :
// les enquêtes peuvent ainsi désigner « la boulangerie » sans ambiguïté.
import type { BuildingStyle } from '../types';
import type { Rng } from '../lib/rng';

export const SHOP_SIGNS = [
  'TABAC',
  'ÉPICERIE',
  'COIFFEUR',
  'PRESSING',
  'QUINCAILLERIE',
  'FROMAGERIE',
  'OPTICIEN',
  'LAVERIE',
  'HORLOGER',
  'CORDONNIER',
  'DROGUERIE',
  'CHAPELIER',
  'MERCERIE',
  'PRIMEUR',
  'POISSONNERIE',
  'CHARCUTERIE',
  'ANTIQUAIRE',
  'DISQUAIRE',
  'JOUETS',
  'BAZAR',
  'CAVISTE',
  'BROCANTE',
  'PAPETERIE',
  'PARFUMERIE',
  'TISSUS',
  'VÉLOS',
  'CHOCOLATIER',
  'CRÉMERIE',
  'BOUTIQUE',
  'SERRURIER',
  'PHOTO',
  'MAROQUINIER',
];

export const ARTS_SIGNS = ['GALERIE', 'ENCADREUR', 'LUTHIER', 'BOUQUINISTE', 'BEAUX-ARTS', 'PHOTO', 'ATELIER', 'DISQUAIRE', 'ANTIQUAIRE', 'COSTUMES'];

export const CAFE_SIGNS = [
  'CAFÉ DES SPORTS',
  'LE BALTO',
  'CAFÉ DE LA PAIX',
  'CHEZ MIMI',
  'SALON DE THÉ',
  'CAFÉ DU COIN',
  'CRÊPERIE',
  'PIZZERIA',
  'BISTROT',
  'RESTAURANT',
  'LA BONNE MEULE',
  'CRÊPERIE',
  'GLACIER',
];

export const BAR_SIGNS = ['BRASSERIE', 'LE ZINC', 'BAR TABAC', 'LE TONNEAU', 'CHEZ JO', 'LE NARVAL', 'L\'ESCALE', 'BRASSERIE'];
export const PORT_BAR_SIGNS = ['BAR DU PORT', 'L\'ANCRE', 'LE HOMARD', 'LA MOUETTE'];
export const BAKERY_SIGNS = ['PÂTISSERIE', 'VIENNOISERIES', 'PÂTISSERIE', 'CONFISERIE'];
export const HOTEL_SIGNS = ['HÔTEL DU NORD', 'HÔTEL TERMINUS', 'HÔTEL DES VOYAGEURS', 'HÔTEL MODERNE', 'HÔTEL DE PARIS', 'PENSION'];
export const GARAGE_SIGNS = ['CARROSSERIE', 'AUTO-ÉCOLE', 'MOTOS', 'PNEUS', 'DÉPANNAGE'];
export const WAREHOUSE_SIGNS = ['FRET', 'MARÉE', 'CORDERIE', 'DOCKS', 'TRANSPORTS', 'SCIERIE', 'GRAINS', 'FOURRAGES'];
export const FACTORY_SIGNS = ['USINE', 'BISCUITERIE', 'CONSERVERIE', 'FILATURE', 'SAVONNERIE', 'TONNELLERIE'];

export const GRAFFITI = ['ZORG', 'MEULE', 'BZZ', 'KIKI', 'YO!', 'FOIN 4 LIFE', 'RATS', 'PAF', 'NONO', 'TAG', 'LOL', 'ZAZA'];
export const POSTERS = ['CIRQUE', 'CONCERT', 'BAL', 'SOLDES', 'FÊTE', 'LOTO', 'ÉLECTIONS', 'THÉÂTRE', 'EXPO', 'CINÉMA'];

export const BOAT_NAMES = [
  'LA MOUETTE',
  'BOTTE II',
  'SAINTE-PAILLE',
  'L\'ÉPI',
  'FENAISON',
  'BELLE-MEULE',
  'LE GLANEUR',
  'MARIETTE',
  'L\'ALBATROS',
  'PETIT FOIN',
  'LE HÉRON',
  'JOSÉPHINE',
];

/** Distributeur d'enseignes : parcourt une liste mélangée pour limiter les répétitions. */
export class SignPicker {
  private readonly pools = new Map<string, { list: string[]; i: number }>();
  constructor(private readonly rng: Rng) {}

  next(key: string, source: readonly string[]): string {
    let pool = this.pools.get(key);
    if (!pool || pool.i >= pool.list.length) {
      pool = { list: this.rng.shuffle([...source]), i: 0 };
      this.pools.set(key, pool);
    }
    return pool.list[pool.i++];
  }
}

/** Enseigne pour un style de commerce (undefined si le style n'en porte pas). */
export function signFor(style: BuildingStyle, district: string, picker: SignPicker): string | undefined {
  switch (style) {
    case 'shop':
      return district === 'arts' ? picker.next('arts', ARTS_SIGNS) : picker.next('shop', SHOP_SIGNS);
    case 'cafe':
      return picker.next('cafe', CAFE_SIGNS);
    case 'bar':
      return district === 'port' ? picker.next('portbar', PORT_BAR_SIGNS) : picker.next('bar', BAR_SIGNS);
    case 'bakery':
      return picker.next('bakery', BAKERY_SIGNS);
    case 'hotel':
      return picker.next('hotel', HOTEL_SIGNS);
    case 'garage':
      return picker.next('garage', GARAGE_SIGNS);
    case 'warehouse':
      return picker.next('warehouse', WAREHOUSE_SIGNS);
    case 'factory':
      return picker.next('factory', FACTORY_SIGNS);
    default:
      return undefined;
  }
}

/** Plaque d'immatriculation fantaisiste (lisible au zoom maximal). */
export function plate(rng: Rng): string {
  const L = 'ABCDEFGHJKLMNPRSTVWXZ';
  const l = () => L[rng.int(0, L.length - 1)];
  return `${l()}${l()}-${rng.int(100, 999)}-${l()}${l()}`;
}
