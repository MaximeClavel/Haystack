// Réglages internes du moteur de carte (non contractuels : seul le module engine les utilise).
// Les constantes partagées avec les autres modules vivent dans src/config.ts.

/** Couleur de la « table » sur laquelle est posée la carte (hors du monde). */
export const BACKDROP = '#2b2622';
/** Ombre portée de la carte sur la table. */
export const MAP_SHADOW = 'rgba(0, 0, 0, 0.35)';

/**
 * Débordement autorisé au-delà des bords de la ville, en fraction de la taille de l'écran.
 * Permet d'amener un bord de la ville loin des barres d'interface. Il s'annule
 * progressivement quand la ville entière tient à l'écran (centre alors verrouillé).
 */
export const EDGE_MARGIN = 0.2;

/**
 * Durée (ms) pendant laquelle un overlay « reveal » pulse après chaque `setOverlays` ; ensuite il
 * est figé (dernier état de l'onde) et la boucle d'images s'arrête : un indice peut rester affiché
 * longtemps sans vider la batterie.
 */
export const REVEAL_PULSE_MS = 6000;

/* ----------------------------------------------------------------------------
 * Gestes
 * ------------------------------------------------------------------------- */

/** Au-delà de ce déplacement (px CSS), un appui devient un glisser (et n'est plus un tap). */
export const TAP_SLOP_PX = 8;
/** Durée maximale d'un tap (ms). */
export const TAP_MAX_MS = 300;
/** Délai avant d'émettre onTap, pour laisser le temps à un double-tap (ms). */
export const TAP_DELAY_MS = 220;
/** Distance maximale entre les deux appuis d'un double-tap (px CSS). */
export const DOUBLE_TAP_SLOP_PX = 32;
/** Fenêtre d'échantillonnage de la vitesse au lâcher (ms). */
export const VELOCITY_WINDOW_MS = 80;
/** Si le doigt est immobile depuis plus longtemps avant le lâcher : pas d'inertie (ms). */
export const VELOCITY_STALE_MS = 60;
/** Constante de temps de la friction de l'inertie (ms) : v(t) = v0 · e^(−t/τ). */
export const INERTIA_TAU_MS = 325;
/** Vitesse en dessous de laquelle l'inertie s'arrête (px CSS / ms). */
export const INERTIA_MIN_SPEED = 0.02;
/** Vitesse maximale au lâcher (px CSS / ms). */
export const INERTIA_MAX_SPEED = 6;
/** Double-tap puis glisser vertical : px de glisser pour doubler le zoom. */
export const DRAG_ZOOM_PX_PER_DOUBLING = 150;

/** Durée de l'animation du double-tap (ms). */
export const DOUBLE_TAP_ZOOM_MS = 280;
/** Durée de l'animation des touches + et − (ms). */
export const KEY_ZOOM_MS = 250;
/** Durée (ms) du glissement des bornes de la caméra vers de nouvelles marges de l'interface (la caméra, repoussée, suit sans saut). */
export const INSETS_GLIDE_MS = 180;
/** Vitesse donnée par une flèche du clavier (px CSS / ms), amortie comme l'inertie. */
export const KEY_PAN_SPEED = 0.9;

/** Molette : facteur de zoom = exp(−deltaY · k), deltaY en px. */
export const WHEEL_ZOOM_SPEED = 0.0022;
/** Pincement du pavé tactile (événements wheel avec ctrlKey). */
export const TRACKPAD_PINCH_SPEED = 0.012;
/** Lissage de la molette : constante de temps (ms). */
export const WHEEL_SMOOTH_MS = 70;

/* ----------------------------------------------------------------------------
 * Tuiles et ordonnanceur
 * ------------------------------------------------------------------------- */

/**
 * Agrandissement maximal toléré d'une tuile à l'affichage. On prend le plus petit niveau L tel que
 * zoom / 2^L ≤ LEVEL_UPSCALE_MAX : une tuile est donc affichée à une échelle comprise entre
 * LEVEL_UPSCALE_MAX / 2 (≈ 0,58, réduite) et LEVEL_UPSCALE_MAX (≈ 1,15, à peine agrandie).
 */
export const LEVEL_UPSCALE_MAX = 1.15;
/** Le niveau racine (repli universel, jamais évincé) couvre la ville en au plus ce nombre de tuiles. */
export const ROOT_MAX_TILES = 16;
/** Budget de rendu de tuiles par image quand tout est calme (ms). */
export const FRAME_BUDGET_MS = 8;
/** Budget pendant un geste ou une animation (ms) : on privilégie la fluidité. */
export const FRAME_BUDGET_BUSY_MS = 5;
/** Intervalle d'image au-delà duquel l'appareil est jugé en retard (ms) : voir mapView.frame. */
export const SLOW_FRAME_MS = 25;
/** Nombre d'entités dessinées entre deux contrôles du budget. */
export const ENTITIES_PER_CHECK = 8;
/** Capacité du cache à densité 1 (divisée par la densité : ~64 tuiles à densité 2). */
export const CACHE_BASE_TILES = 128;
/** Mémoire maximale visée pour le cache de tuiles (octets). */
export const CACHE_MAX_BYTES = 256 * 1024 * 1024;
