// Plan directeur de Meulebourg — le « cadastre » de la ville.
//
// Ce fichier fixe les grandes lignes (quartiers, avenues, rivière, voie ferrée, lieux
// remarquables) pour que les scénaristes puissent écrire leurs enquêtes en parallèle de
// la génération. Le générateur (src/world) DOIT respecter ces emprises ; il remplit le
// reste (rues secondaires, immeubles, foule, voitures, arbres…).
//
// Repère : x vers l'est, y vers le sud, monde de 6400 × 4800 unités.
// Rappel d'échelle : un adulte mesure 20 u, une voiture 44 u, une maison ~100 × 70 u
// d'emprise et 50 u de façade, une rue 72 u de large trottoirs compris.

import type { BuildingStyle, Color, District, DistrictId, Rect, Vec2 } from '../types';

export const DISTRICTS: District[] = [
  { id: 'gare', name: 'Quartier de la Gare', rect: { x: 0, y: 0, w: 1450, h: 3640 } },
  { id: 'halles', name: 'Les Halles', rect: { x: 1450, y: 0, w: 2800, h: 1300 } },
  { id: 'centre', name: 'Vieille Ville', rect: { x: 1450, y: 1300, w: 2800, h: 1600 } },
  { id: 'faubourg', name: 'Le Faubourg', rect: { x: 1450, y: 2900, w: 2800, h: 740 } },
  { id: 'parc', name: 'Parc des Meules', rect: { x: 4250, y: 0, w: 2150, h: 2050 } },
  { id: 'arts', name: 'Quartier des Arts', rect: { x: 4250, y: 2050, w: 2150, h: 1590 } },
  { id: 'riviere', name: 'La Fenaison', rect: { x: 0, y: 3640, w: 6400, h: 400 } },
  { id: 'jardins', name: 'Les Jardins', rect: { x: 0, y: 4040, w: 4250, h: 760 } },
  { id: 'port', name: 'Le Port', rect: { x: 4250, y: 4040, w: 2150, h: 760 } },
];

/** Lit de la rivière (eau). Les quais sont de part et d'autre. */
export const RIVER: { y0: number; y1: number; name: string } = { y0: 3700, y1: 3960, name: 'La Fenaison' };

/** Voie ferrée nord-sud (ballast + 2 voies), traverse la rivière sur un pont ferroviaire. */
export const RAIL: { x: number; width: number } = { x: 260, width: 70 };

export interface AvenueSpec {
  id: string;
  name: string;
  a: Vec2;
  b: Vec2;
  /** Largeur chaussée + trottoirs. */
  width: number;
}

/** Grands axes. Les ponts sont là où un axe nord-sud croise la rivière. */
export const AVENUES: AvenueSpec[] = [
  { id: 'bd-halles', name: 'Boulevard des Halles', a: { x: 0, y: 1300 }, b: { x: 6400, y: 1300 }, width: 72 },
  { id: 'rue-faubourg', name: 'Rue du Faubourg', a: { x: 0, y: 2900 }, b: { x: 6400, y: 2900 }, width: 72 },
  { id: 'quai-nord', name: 'Quai Nord', a: { x: 0, y: 3650 }, b: { x: 6400, y: 3650 }, width: 64 },
  { id: 'quai-sud', name: 'Quai Sud', a: { x: 0, y: 4010 }, b: { x: 4250, y: 4010 }, width: 64 },
  { id: 'av-gare', name: 'Avenue de la Gare', a: { x: 1450, y: 0 }, b: { x: 1450, y: 3650 }, width: 72 },
  { id: 'av-centrale', name: 'Avenue Centrale', a: { x: 2200, y: 0 }, b: { x: 2200, y: 4800 }, width: 72 },
  { id: 'av-parc', name: 'Avenue du Parc', a: { x: 4250, y: 0 }, b: { x: 4250, y: 4800 }, width: 72 },
  { id: 'rue-parc', name: 'Rue du Parc', a: { x: 4250, y: 2050 }, b: { x: 6400, y: 2050 }, width: 64 },
  { id: 'rue-arts', name: 'Rue des Arts', a: { x: 5300, y: 2050 }, b: { x: 5300, y: 3650 }, width: 64 },
];

export interface LandmarkSpec {
  id: string;
  name: string;
  district: DistrictId;
  kind: 'building' | 'area' | 'point';
  /** building : emprise au sol ; area : zone au sol ; point : petit carré autour du point. */
  rect: Rect;
  /** Pour les bâtiments. */
  style?: BuildingStyle;
  height?: number;
  sign?: string;
  wall?: Color;
  roof?: Color;
  /** Pour les zones : type de sol. */
  ground?: 'plaza' | 'park' | 'water' | 'dock' | 'garden' | 'courtyard' | 'parking';
  /** Ce qu'on y trouve / ce que le générateur doit y mettre. */
  notes?: string;
}

/**
 * Lieux remarquables. Les bâtiments deviennent des entités d'id `lm.<id>`.
 * Les façades visibles sont au SUD : une porte d'entrée « sur la place » n'est visible
 * que si la place est au sud du bâtiment.
 */
export const LANDMARKS: LandmarkSpec[] = [
  // --- Quartier de la Gare ---
  { id: 'gare', name: 'Gare de Meulebourg', district: 'gare', kind: 'building', style: 'station', rect: { x: 450, y: 1420, w: 650, h: 150 }, height: 120, sign: 'GARE', wall: 'beige', roof: 'grey', notes: 'Grande horloge en façade. Quais le long de la voie ferrée à l\'ouest.' },
  { id: 'parvis-gare', name: 'Parvis de la gare', district: 'gare', kind: 'area', ground: 'plaza', rect: { x: 420, y: 1580, w: 720, h: 230 }, notes: 'Taxis, kiosque à journaux, voyageurs avec valises, pigeons.' },
  { id: 'grand-hotel', name: 'Grand Hôtel', district: 'gare', kind: 'building', style: 'hotel', rect: { x: 1150, y: 1420, w: 230, h: 130 }, height: 140, sign: 'GRAND HÔTEL', wall: 'pink', roof: 'navy' },
  { id: 'bar-fer-a-cheval', name: 'Bar Le Fer à Cheval', district: 'gare', kind: 'building', style: 'bar', rect: { x: 650, y: 2150, w: 170, h: 90 }, height: 56, sign: 'LE FER À CHEVAL', wall: 'green', roof: 'brown', notes: 'Terrasse au sud.' },
  { id: 'garage', name: 'Garage Pistons', district: 'gare', kind: 'building', style: 'garage', rect: { x: 900, y: 3100, w: 260, h: 140 }, height: 60, sign: 'GARAGE PISTONS', wall: 'white', roof: 'red', notes: 'Voitures en réparation devant, pneus, bidons.' },

  // --- Les Halles ---
  { id: 'halles', name: 'Place des Halles (marché)', district: 'halles', kind: 'area', ground: 'plaza', rect: { x: 2500, y: 420, w: 700, h: 480 }, notes: 'Marché : rangées d\'étals colorés, cagettes, foule dense.' },
  { id: 'boulangerie', name: 'Boulangerie Lemiel', district: 'halles', kind: 'building', style: 'bakery', rect: { x: 2550, y: 260, w: 130, h: 90 }, height: 56, sign: 'BOULANGERIE', wall: 'yellow', roof: 'brown' },
  { id: 'boucherie', name: 'Boucherie Tendron', district: 'halles', kind: 'building', style: 'shop', rect: { x: 2900, y: 260, w: 130, h: 90 }, height: 56, sign: 'BOUCHERIE', wall: 'red', roof: 'grey' },
  { id: 'cinema', name: 'Cinéma Le Rex', district: 'halles', kind: 'building', style: 'cinema', rect: { x: 3350, y: 480, w: 280, h: 140 }, height: 90, sign: 'LE REX', wall: 'purple', roof: 'black' },

  // --- Vieille Ville ---
  { id: 'grand-place', name: 'Grand-Place', district: 'centre', kind: 'area', ground: 'plaza', rect: { x: 2550, y: 1780, w: 600, h: 560 }, notes: 'Pavés, fontaine au centre, bancs, kiosque à journaux, foule.' },
  { id: 'fontaine', name: 'Fontaine de la Grand-Place', district: 'centre', kind: 'point', rect: { x: 2820, y: 2040, w: 60, h: 40 } },
  { id: 'hotel-de-ville', name: 'Hôtel de Ville', district: 'centre', kind: 'building', style: 'townhall', rect: { x: 2650, y: 1620, w: 400, h: 150 }, height: 130, sign: 'HÔTEL DE VILLE', wall: 'beige', roof: 'navy', notes: 'Façade sur la Grand-Place, horloge, drapeaux.' },
  { id: 'cafe-du-centre', name: 'Café du Centre', district: 'centre', kind: 'building', style: 'cafe', rect: { x: 3080, y: 1660, w: 150, h: 100 }, height: 60, sign: 'CAFÉ DU CENTRE', wall: 'orange', roof: 'brown', notes: 'Terrasse (tables, parasols) au sud, sur la place.' },
  { id: 'banque', name: 'Banque Dufric', district: 'centre', kind: 'building', style: 'bank', rect: { x: 2300, y: 1950, w: 200, h: 120 }, height: 100, sign: 'BANQUE DUFRIC', wall: 'grey', roof: 'black' },
  { id: 'eglise', name: 'Église Saint-Foin', district: 'centre', kind: 'building', style: 'church', rect: { x: 3250, y: 1900, w: 220, h: 160 }, height: 120, wall: 'beige', roof: 'grey' },
  { id: 'bijouterie', name: 'Bijouterie Carat', district: 'centre', kind: 'building', style: 'jeweler', rect: { x: 2600, y: 2420, w: 140, h: 90 }, height: 60, sign: 'BIJOUTERIE CARAT', wall: 'navy', roof: 'grey' },
  { id: 'commissariat', name: 'Commissariat', district: 'centre', kind: 'building', style: 'police', rect: { x: 1650, y: 2450, w: 260, h: 130 }, height: 90, sign: 'POLICE', wall: 'blue', roof: 'grey', notes: 'Voitures de police garées devant.' },
  { id: 'pharmacie', name: 'Pharmacie', district: 'centre', kind: 'building', style: 'pharmacy', rect: { x: 1650, y: 1700, w: 140, h: 90 }, height: 70, sign: 'PHARMACIE', wall: 'white', roof: 'green' },
  { id: 'poste', name: 'La Poste', district: 'centre', kind: 'building', style: 'postoffice', rect: { x: 1600, y: 1420, w: 220, h: 110 }, height: 80, sign: 'LA POSTE', wall: 'yellow', roof: 'navy' },
  { id: 'fleuriste', name: 'Fleuriste Pétale', district: 'centre', kind: 'building', style: 'shop', rect: { x: 3300, y: 1450, w: 130, h: 85 }, height: 56, sign: 'FLEURISTE', wall: 'pink', roof: 'green' },
  { id: 'librairie', name: 'Librairie Le Marque-Page', district: 'centre', kind: 'building', style: 'shop', rect: { x: 3700, y: 1700, w: 140, h: 90 }, height: 60, sign: 'LIBRAIRIE', wall: 'brown', roof: 'grey' },

  // --- Le Faubourg ---
  { id: 'ecole', name: 'École Jules-Botte', district: 'faubourg', kind: 'building', style: 'school', rect: { x: 1700, y: 3020, w: 320, h: 140 }, height: 80, sign: 'ÉCOLE', wall: 'orange', roof: 'red' },
  { id: 'cour-ecole', name: 'Cour de l\'école', district: 'faubourg', kind: 'area', ground: 'courtyard', rect: { x: 1700, y: 3190, w: 320, h: 230 }, notes: 'Marelle, préau, enfants.' },
  { id: 'chantier', name: 'Chantier de la Tour', district: 'faubourg', kind: 'area', ground: 'courtyard', rect: { x: 3300, y: 3020, w: 450, h: 380 }, notes: 'Échafaudages, grue, palettes, bétonnière, ouvriers casqués, barrières.' },

  // --- Parc des Meules ---
  { id: 'parc', name: 'Parc des Meules', district: 'parc', kind: 'area', ground: 'park', rect: { x: 4350, y: 120, w: 1950, h: 1850 }, notes: 'Allées, pelouses, nombreux arbres, bancs, promeneurs, chiens.' },
  { id: 'etang', name: 'Étang aux Canards', district: 'parc', kind: 'area', ground: 'water', rect: { x: 5000, y: 550, w: 750, h: 480 }, notes: 'Canards, barques, ponton.' },
  { id: 'kiosque', name: 'Kiosque à musique', district: 'parc', kind: 'point', rect: { x: 4810, y: 1400, w: 80, h: 60 } },
  { id: 'statue', name: 'Statue du Fondateur', district: 'parc', kind: 'point', rect: { x: 4560, y: 600, w: 20, h: 20 } },
  { id: 'aire-de-jeux', name: 'Aire de jeux', district: 'parc', kind: 'area', ground: 'courtyard', rect: { x: 5750, y: 1450, w: 350, h: 300 } },

  // --- Quartier des Arts ---
  { id: 'musee', name: 'Musée des Beaux-Arts', district: 'arts', kind: 'building', style: 'museum', rect: { x: 4500, y: 2300, w: 450, h: 170 }, height: 110, sign: 'MUSÉE', wall: 'white', roof: 'grey', notes: 'Colonnes, grand escalier au sud.' },
  { id: 'theatre', name: 'Théâtre de la Botte', district: 'arts', kind: 'building', style: 'theatre', rect: { x: 5500, y: 2300, w: 330, h: 160 }, height: 110, sign: 'THÉÂTRE', wall: 'red', roof: 'navy' },
  { id: 'hopital', name: 'Hôpital Sainte-Paille', district: 'arts', kind: 'building', style: 'hospital', rect: { x: 5550, y: 2980, w: 450, h: 190 }, height: 120, sign: 'HÔPITAL', wall: 'white', roof: 'blue', notes: 'Ambulances devant.' },
  { id: 'cimetiere', name: 'Cimetière', district: 'arts', kind: 'area', ground: 'garden', rect: { x: 4400, y: 3000, w: 700, h: 500 }, notes: 'Tombes, cyprès (pine), muret.' },

  // --- Rive sud ---
  { id: 'pont-central', name: 'Pont Central', district: 'riviere', kind: 'area', rect: { x: 2160, y: 3680, w: 80, h: 300 } },
  { id: 'pont-du-parc', name: 'Pont du Parc', district: 'riviere', kind: 'area', rect: { x: 4210, y: 3680, w: 80, h: 300 } },
  { id: 'quai-port', name: 'Quais du port', district: 'port', kind: 'area', ground: 'dock', rect: { x: 4300, y: 3960, w: 2100, h: 220 }, notes: 'Bateaux amarrés, grues, caisses, tonneaux, dockers.' },
  { id: 'capitainerie', name: 'Capitainerie', district: 'port', kind: 'building', style: 'shop', rect: { x: 4500, y: 4230, w: 200, h: 100 }, height: 70, sign: 'CAPITAINERIE', wall: 'white', roof: 'red' },
  { id: 'entrepots', name: 'Entrepôts du port', district: 'port', kind: 'area', ground: 'dock', rect: { x: 4800, y: 4230, w: 1500, h: 400 }, notes: 'Plusieurs entrepôts numérotés, chariots, camions.' },
  { id: 'jardins-ouvriers', name: 'Jardins ouvriers', district: 'jardins', kind: 'area', ground: 'garden', rect: { x: 400, y: 4150, w: 1500, h: 550 }, notes: 'Parcelles, cabanes, serres, épouvantails, haies.' },
];
