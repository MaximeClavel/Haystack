// Constantes globales du jeu. Toute valeur utilisée par plusieurs modules vit ici.

/** Taille du monde en unités monde (1 unité = 1 px CSS au zoom 1). */
export const WORLD_WIDTH = 6400;
export const WORLD_HEIGHT = 4800;

/** Graine de génération de la ville. Changer cette valeur change toute la foule ambiante. */
export const WORLD_SEED = 20261014;

/** Nom de la ville. */
export const CITY_NAME = 'Meulebourg';

/** Zoom maximal (px CSS par unité monde). Un adulte (20 u) y mesure 80 px. */
export const MAX_ZOOM = 4;
/** Plancher absolu du zoom ; le zoom minimal réel est « toute la ville tient à l'écran ». */
export const MIN_ZOOM_FLOOR = 0.03;
/** En dessous de ce zoom, un tap ne désigne pas : il rapproche la caméra. */
export const PICK_MIN_ZOOM = 1.5;
/** Tolérance de désignation, en px écran (convertie en unités monde selon le zoom). */
export const PICK_TOLERANCE_PX = 10;

/** Taille d'une tuile de rendu, en px CSS. */
export const TILE_SIZE = 256;
/** Densité de pixels maximale utilisée pour le rendu (mémoire !). */
export const MAX_DPR = 2;

/** Hauteur d'un adulte de corpulence « regular », en unités monde. */
export const PERSON_HEIGHT = 20;

/** Clé de sauvegarde localStorage (incrémenter la version si le format change). */
export const STORAGE_KEY = 'haystack:v1';
