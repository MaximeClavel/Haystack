// =============================================================================
// Contrats partagés entre les modules de Haystack.
//
// Ce fichier est la « loi » entre engine / art / world / game / content / ui.
// Toute modification doit être consignée dans docs/ARCHITECTURE.md
// (section « Journal des changements de contrat »).
//
// Repère monde : x vers la droite, y vers le bas (le sud). 1 unité = 1 px CSS au zoom 1.
// Projection : vue plongeante « oblique » — le sol est vu de dessus, les bâtiments
// montrent leur toit et leur façade SUD ; personnages, véhicules, arbres et objets
// sont dessinés debout (de profil / trois-quarts), ancrés par leur base au sol.
// Ordre de dessin (peintre) : croissant selon sortY (le plus au nord d'abord).
// =============================================================================

/* ----------------------------------------------------------------------------
 * Géométrie
 * ------------------------------------------------------------------------- */

export interface Vec2 {
  x: number;
  y: number;
}

/** Rectangle aligné sur les axes, en coordonnées monde. (x, y) = coin haut-gauche. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/* ----------------------------------------------------------------------------
 * Vocabulaire visuel (ce que le module art sait dessiner)
 * ------------------------------------------------------------------------- */

export type Color =
  | 'red'
  | 'blue'
  | 'navy'
  | 'green'
  | 'olive'
  | 'yellow'
  | 'orange'
  | 'pink'
  | 'purple'
  | 'brown'
  | 'beige'
  | 'black'
  | 'white'
  | 'grey';

export type SkinTone = 'pale' | 'light' | 'tan' | 'brown' | 'dark';
export type HairStyle = 'bald' | 'short' | 'long' | 'bun' | 'ponytail' | 'curly' | 'spiky';
export type HairColor = 'black' | 'brown' | 'blond' | 'red' | 'grey' | 'white';
export type Hat =
  | 'none'
  | 'cap'
  | 'beret'
  | 'bowler'
  | 'tophat'
  | 'beanie'
  | 'fedora'
  | 'helmet'
  | 'chef'
  | 'police'
  | 'straw';
export type TopKind =
  | 'tshirt'
  | 'shirt'
  | 'sweater'
  | 'coat'
  | 'suit'
  | 'dress'
  | 'apron'
  | 'hoodie'
  | 'uniform'
  | 'overalls';
export type BottomKind = 'trousers' | 'shorts' | 'skirt';
export type Pattern = 'plain' | 'stripes' | 'dots' | 'checks';
export type FaceDetail = 'none' | 'glasses' | 'sunglasses' | 'mustache' | 'beard' | 'mask';
export type Accessory =
  | 'none'
  | 'handbag'
  | 'briefcase'
  | 'backpack'
  | 'umbrella'
  | 'cane'
  | 'camera'
  | 'newspaper'
  | 'flowers'
  | 'balloon'
  | 'suitcase'
  | 'scarf';
/** child ≈ 13 u de haut, slim/regular ≈ 20 u, large ≈ 20 u mais plus large. */
export type Build = 'slim' | 'regular' | 'large' | 'child';

/** Apparence complète d'une personne. Deux personnes « identiques » partagent toutes ces valeurs. */
export interface PersonAppearance {
  skin: SkinTone;
  hair: HairStyle;
  hairColor: HairColor;
  hat: Hat;
  top: TopKind;
  topColor: Color;
  topPattern: Pattern;
  bottom: BottomKind;
  bottomColor: Color;
  face: FaceDetail;
  accessory: Accessory;
  build: Build;
}

export type Pose =
  | 'stand'
  | 'walk'
  | 'run'
  | 'sit' // assis (sur un banc, une chaise, le sol)
  | 'lie' // allongé au sol (dormeur, victime…)
  | 'crouch'
  | 'climb' // grimpe (échelle, mur) — bras levés
  | 'point' // montre du doigt dans la direction de facing
  | 'wave'
  | 'carry' // porte un objet volumineux devant soi (cf. holding)
  | 'phone' // téléphone à l'oreille
  | 'fight'
  | 'handsup'
  | 'sneak' // marche furtive, penché
  | 'read'
  | 'window'; // buste seul, encadré par une fenêtre (personne à l'intérieur, vue de la rue)

export type Facing = 'left' | 'right';

/** Petite bulle au-dessus de la tête, lisible au zoom ≥ 1. */
export type Emote =
  | 'none'
  | 'exclaim'
  | 'question'
  | 'heart'
  | 'angry'
  | 'sleep'
  | 'music'
  | 'sweat'
  | 'ko' // yeux en croix (évanoui / victime)
  | 'idea'
  | 'talk';

/** Objet tenu en main (dessiné à la main avant, selon facing). */
export type HeldItem =
  | 'none'
  | 'knife'
  | 'moneybag'
  | 'painting'
  | 'key'
  | 'phone'
  | 'crowbar'
  | 'letter'
  | 'bottle'
  | 'cake'
  | 'leash' // laisse : un trait vers l'avant (placer un chien au bout)
  | 'flashlight'
  | 'jewel'
  | 'map'
  | 'icecream'
  | 'baguette'
  | 'box'
  | 'rope'
  | 'needle';

export type PropKind =
  // mobilier urbain
  | 'bench'
  | 'lamp'
  | 'bin'
  | 'mailbox'
  | 'hydrant'
  | 'phonebooth'
  | 'kiosk' // kiosque à journaux
  | 'busstop'
  | 'sign' // panneau sur pied (texte via PropEntity.label)
  | 'cone'
  | 'barrier'
  | 'manhole' // plaque d'égout ; variant 'open' = ouverte
  | 'fountain'
  | 'statue'
  | 'bandstand' // kiosque à musique
  // commerce, terrasse, marché, port
  | 'stall' // étal de marché (color = auvent)
  | 'parasol'
  | 'table'
  | 'chair'
  | 'cart'
  | 'crate'
  | 'barrel'
  | 'pallet'
  | 'crane' // grue portuaire ou de chantier
  | 'scaffold'
  | 'tent'
  | 'playground' // toboggan + balançoire
  // nature
  | 'bush'
  | 'flowerbed'
  | 'rock'
  | 'puddle'
  // animaux
  | 'dog'
  | 'cat'
  | 'pigeons'
  | 'duck'
  // objets d'enquête
  | 'moneybag'
  | 'suitcase'
  | 'briefcase'
  | 'knife'
  | 'painting'
  | 'safe'
  | 'ladder'
  | 'rope'
  | 'footprints' // traces de pas orientées selon facing
  | 'trashbag'
  | 'letter'
  | 'key'
  | 'jewel'
  | 'cake'
  | 'needle'; // aiguille dorée cachée (bonus)

export type VehicleKind =
  | 'car'
  | 'van'
  | 'taxi'
  | 'police'
  | 'bus'
  | 'truck'
  | 'ambulance'
  | 'bicycle'
  | 'scooter'
  | 'boat';

export type TreeKind = 'round' | 'pine' | 'poplar' | 'bare';

export type BuildingStyle =
  | 'house'
  | 'townhouse'
  | 'apartment'
  | 'shop'
  | 'cafe'
  | 'bakery'
  | 'jeweler'
  | 'bank'
  | 'police'
  | 'townhall'
  | 'church'
  | 'school'
  | 'museum'
  | 'station'
  | 'hotel'
  | 'bar'
  | 'cinema'
  | 'theatre'
  | 'hospital'
  | 'warehouse'
  | 'factory'
  | 'garage'
  | 'shed'
  | 'greenhouse'
  | 'postoffice'
  | 'pharmacy';

export type BuildingFeatureKind =
  | 'openWindow'
  | 'brokenWindow'
  | 'litWindow'
  | 'openDoor'
  | 'awning' // store au-dessus de la vitrine (color)
  | 'balcony'
  | 'graffiti' // text optionnel
  | 'poster'; // affiche collée (text optionnel)

/** Détail de façade. `at` = position horizontale le long de la façade (0 = ouest, 1 = est). */
export interface BuildingFeature {
  kind: BuildingFeatureKind;
  at: number;
  /** Étage (0 = rez-de-chaussée). */
  floor?: number;
  color?: Color;
  text?: string;
}

/* ----------------------------------------------------------------------------
 * Entités du monde
 * ------------------------------------------------------------------------- */

export interface EntityBase {
  /** Identifiant unique et stable. Conventions : voir docs/ARCHITECTURE.md. */
  id: string;
  /** Point d'ancrage au sol : pieds, base, roues. Pour un bâtiment : milieu du bord sud de l'emprise. */
  x: number;
  y: number;
  /** Élévation au-dessus du sol (personne sur un toit…). L'entité est dessinée décalée de -z en y. */
  z?: number;
  /** Clé d'ordre de dessin (peintre). Si absente : voir sortKey() dans src/art/bounds.ts. */
  sortY?: number;
  /** Marqueurs libres : 'story', 'case:c01', 'ambient', 'landmark', 'needle'… */
  tags?: string[];
}

export interface PersonEntity extends EntityBase {
  kind: 'person';
  appearance: PersonAppearance;
  pose: Pose;
  facing: Facing;
  holding?: HeldItem;
  emote?: Emote;
  /** Personnage scénarisé (CharacterDef.id). Le monde copie alors l'apparence du personnage. */
  character?: string;
}

export interface PropEntity extends EntityBase {
  kind: 'prop';
  prop: PropKind;
  facing?: Facing;
  color?: Color;
  /** Variante libre selon le prop (ex. manhole 'open', dog 'small' | 'big', bench 'broken'). */
  variant?: string;
  /** Texte court (panneau, étiquette). */
  label?: string;
  /** Facteur d'échelle (défaut 1). */
  scale?: number;
}

export interface VehicleEntity extends EntityBase {
  kind: 'vehicle';
  vehicle: VehicleKind;
  facing: Facing;
  color: Color;
  /** Conducteur visible (vitre, selle). */
  driver?: PersonAppearance;
  /** Plaque ou nom de bateau, lisible au zoom max. */
  label?: string;
  doorOpen?: boolean;
}

export interface TreeEntity extends EntityBase {
  kind: 'tree';
  tree: TreeKind;
  /** Hauteur totale en unités monde (typiquement 30 à 70). */
  size: number;
}

export interface BuildingEntity extends EntityBase {
  kind: 'building';
  style: BuildingStyle;
  /** Emprise au sol. Le toit est dessiné décalé de -height, la façade sud en dessous. */
  footprint: Rect;
  /** Hauteur de façade en unités monde (rez-de-chaussée ≈ 28 u, étage ≈ 24 u). */
  height: number;
  wall: Color;
  roof: Color;
  /** Enseigne en MAJUSCULES courtes, lisible au zoom ≥ 2. */
  sign?: string;
  /** Graine des variations (fenêtres, portes). */
  seed: number;
  features?: BuildingFeature[];
}

export type Entity = PersonEntity | PropEntity | VehicleEntity | TreeEntity | BuildingEntity;
export type EntityKind = Entity['kind'];

/* ----------------------------------------------------------------------------
 * Sol (couche de fond, dessinée sous toutes les entités)
 * ------------------------------------------------------------------------- */

export type GroundKind =
  | 'grass'
  | 'park'
  | 'water'
  | 'sand'
  | 'plaza'
  | 'sidewalk'
  | 'road'
  | 'parking'
  | 'dock'
  | 'garden'
  | 'courtyard'
  | 'bridge'
  | 'railbed';

/** Polygone de sol. Ordre de dessin = ordre du tableau. */
export interface GroundShape {
  kind: GroundKind;
  points: Vec2[];
}

export type GroundLineKind =
  | 'laneline'
  | 'crosswalk'
  | 'rail'
  | 'path'
  | 'curb'
  | 'fence'
  | 'hedge'
  | 'wall';

/** Polyligne de sol (marquages, rails, clôtures…). width en unités monde. */
export interface GroundLine {
  kind: GroundLineKind;
  points: Vec2[];
  width: number;
}

export interface GroundLayer {
  /** Couleur de fond (partout où aucune forme n'est dessinée). */
  base: GroundKind;
  shapes: GroundShape[];
  lines: GroundLine[];
}

/* ----------------------------------------------------------------------------
 * Monde
 * ------------------------------------------------------------------------- */

export type DistrictId =
  | 'gare'
  | 'halles'
  | 'centre'
  | 'faubourg'
  | 'parc'
  | 'arts'
  | 'riviere'
  | 'jardins'
  | 'port';

export interface District {
  id: DistrictId;
  name: string;
  rect: Rect;
}

export interface Landmark {
  /** Id du lieu (ex. 'banque'). L'entité bâtiment associée a l'id `lm.<id>`. */
  id: string;
  name: string;
  district: DistrictId;
  kind: 'building' | 'area' | 'point';
  /** Emprise au sol (bâtiment), zone (place, parc) ou petit carré autour du point. */
  rect: Rect;
  /** Id de l'entité associée, s'il y en a une. */
  entityId?: string;
}

/** Zone cliquable (« le parc », « la cour de l'école ») utilisable comme réponse. */
export interface ZoneDef {
  id: string;
  label: string;
  points: Vec2[];
}

export interface SpatialIndex {
  /** Entités dont l'emprise visuelle intersecte rect, triées par ordre de dessin. */
  query(rect: Rect): Entity[];
}

export interface World {
  seed: number;
  width: number;
  height: number;
  ground: GroundLayer;
  /** Toutes les entités, triées par ordre de dessin. */
  entities: Entity[];
  byId: Map<string, Entity>;
  /** Emprise visuelle de chaque entité (cf. getEntityBounds). */
  bounds: Map<string, Rect>;
  index: SpatialIndex;
  districts: District[];
  landmarks: Landmark[];
  zones: Map<string, ZoneDef>;
}

/* ----------------------------------------------------------------------------
 * Enquêtes (contenu)
 * ------------------------------------------------------------------------- */

export interface CharacterDef {
  /** Id unique, préfixé par l'enquête : 'c01.robert'. */
  id: string;
  name: string;
  /** Rôle affiché au carnet une fois identifié (« la victime », « le témoin »…). */
  role?: string;
  appearance: PersonAppearance;
}

export interface HintDef {
  text: string;
  /** Zone mise en lumière (niveau 2). Si absente, calculée autour d'une réponse non trouvée. */
  area?: Circle;
}

export interface StepDef {
  /** Id unique dans l'enquête : 's1', 's2'… */
  id: string;
  question: string;
  /** Étapes à résoudre avant. Défaut : l'étape précédente du tableau. [] = ouverte dès le début. */
  after?: string[];
  /**
   * Libellé court (1 à 3 mots) de la piste, affiché sur l'onglet quand plusieurs questions sont
   * ouvertes en parallèle (ex. « Pétronille »). Facultatif : à défaut, « Question N ».
   */
  label?: string;
  /** Ids d'entités ou de zones acceptés comme bonne réponse. */
  accept: string[];
  /** Nombre de réponses distinctes à trouver parmi accept (défaut 1). */
  required?: number;
  /** Fausses pistes plausibles : message dédié au lieu d'un simple « non ». */
  nearMiss?: { id: string; feedback: string }[];
  /** Indices : [0] texte seul, [1] texte + zone. Le niveau 3 (révélation) est automatique. */
  hints: HintDef[];
  /** Texte narratif affiché quand l'étape est résolue. */
  solved: string;
  /** Fils rouges tracés à la résolution (paires d'ids d'entités). */
  thread?: [string, string][];
}

export interface CaseDef {
  /** 'c00' (tutoriel), 'c01'… ; 'bonus-aiguilles'. */
  id: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Une phrase d'accroche pour la liste des dossiers. */
  teaser: string;
  /** Briefing (paragraphes séparés par une ligne vide). */
  intro: string;
  /** Cadrage caméra au début de l'enquête. */
  start: { x: number; y: number; zoom: number };
  steps: StepDef[];
  epilogue: string;
  /** Reconstitution finale : entités dans l'ordre chronologique, avec légende. */
  replay: { id: string; caption: string }[];
  characters: CharacterDef[];
  /** Entités scénarisées ajoutées au monde (ids préfixés par l'id de l'enquête). */
  entities: Entity[];
  zones?: ZoneDef[];
  /** Modifications de lieux existants (enseigne, détails de façade) pour cette histoire. */
  landmarkOverrides?: Record<string, { sign?: string; features?: BuildingFeature[] }>;
  /** Enquêtes à terminer avant de débloquer celle-ci. */
  unlockAfter?: string[];
  bonus?: boolean;
}

/* ----------------------------------------------------------------------------
 * Partie (logique de jeu)
 * ------------------------------------------------------------------------- */

/** Ce que le joueur a désigné : un point, et l'entité sous ce point s'il y en a une. */
export interface Pick {
  point: Vec2;
  entityId: string | null;
}

export type SubmitOutcome =
  | {
      kind: 'correct';
      stepId: string;
      foundId: string;
      found: number;
      required: number;
      stepSolved: boolean;
      caseSolved: boolean;
    }
  | { kind: 'near'; stepId: string; feedback: string }
  | { kind: 'already'; stepId: string }
  | { kind: 'wrong'; stepId: string };

export interface HintResult {
  level: 1 | 2 | 3;
  text: string;
  area?: Circle;
  /** Niveau 3 : ids révélés (entités ou zones). */
  reveal?: string[];
}

export interface StepProgress {
  found: string[];
  /** Niveau d'indice atteint (0 à 3). */
  hints: number;
  mistakes: number;
  solvedAt?: number;
}

export interface CaseProgress {
  caseId: string;
  status: 'new' | 'active' | 'solved';
  steps: Record<string, StepProgress>;
  pins: Vec2[];
  notes: string;
  startedAt?: number;
  solvedAt?: number;
  stars?: 1 | 2 | 3;
  /**
   * Meilleur résultat des parties terminées de cette enquête (champ ajouté après la v1, facultatif :
   * rétro-compatible). Sa présence signifie « résolue au moins une fois » : l'enquête reste comptée
   * et les suivantes restent débloquées quand le joueur la recommence ou qu'elle redevient active.
   */
  bestStars?: 1 | 2 | 3;
}

export interface Settings {
  haptics: boolean;
  leftHanded: boolean;
  reducedMotion: boolean;
}

export interface SaveData {
  version: 1;
  cases: Record<string, CaseProgress>;
  settings: Settings;
  seenHowTo: boolean;
}

/* ----------------------------------------------------------------------------
 * Carte (moteur) — API consommée par l'UI
 * ------------------------------------------------------------------------- */

/** Caméra : (x, y) = point monde au centre de l'écran ; zoom = px CSS par unité monde. */
export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export type MarkStyle = 'select' | 'found' | 'reveal' | 'wrong' | 'near';

/** Dessins par-dessus la carte, redessinés à chaque image (coordonnées monde). */
export type Overlay =
  | { kind: 'spotlight'; circle: Circle } // assombrit tout sauf le cercle
  | { kind: 'ring'; circle: Circle; style: MarkStyle }
  | { kind: 'box'; rect: Rect; style: MarkStyle }
  | { kind: 'thread'; from: Vec2; to: Vec2 } // fil rouge
  | { kind: 'pin'; at: Vec2; label?: string }; // punaise du joueur

export interface MapViewOptions {
  canvas: HTMLCanvasElement;
  world: World;
  initial?: Partial<CameraState>;
  /** Tap court (sans glisser) : point monde et point écran. */
  onTap?: (world: Vec2, screen: Vec2) => void;
  onCameraChange?: (camera: CameraState) => void;
}

export interface MapView {
  readonly world: World;
  getCamera(): CameraState;
  setCamera(camera: Partial<CameraState>): void;
  /** Déplacement animé (respecte reducedMotion si fourni via setReducedMotion). */
  flyTo(target: Partial<CameraState>, opts?: { duration?: number }): Promise<void>;
  /** Cadre un rectangle monde à l'écran. */
  fitRect(rect: Rect, opts?: { padding?: number; maxZoom?: number; animate?: boolean }): Promise<void>;
  screenToWorld(p: Vec2): Vec2;
  worldToScreen(p: Vec2): Vec2;
  setOverlays(overlays: Overlay[]): void;
  /** Rend la zone monde `rect` dans `target` (vignette, minicarte). Utilise la taille du canvas cible. */
  renderSnapshot(target: HTMLCanvasElement, rect: Rect): void;
  getMinZoom(): number;
  getMaxZoom(): number;
  setReducedMotion(on: boolean): void;
  /** Résolue quand aucune animation n'est en cours et que toutes les tuiles visibles sont rendues. */
  whenIdle(): Promise<void>;
  /** À appeler quand la taille du canvas change (géré aussi via ResizeObserver). */
  resize(): void;
  destroy(): void;
}
