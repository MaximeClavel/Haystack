// Niveaux de détail du dessin.
//
//  0 : détail complet (zoom ≥ 1) — visages, motifs, textures, enseignes ;
//  1 : simplifié (0,3 ≤ zoom < 1) — pas de motifs ni de visages, fenêtres simplifiées ;
//  2 : silhouettes (zoom < 0,3) — formes pleines, aucun contour fin, très rapide.

export type Lod = 0 | 1 | 2;

export function lodForZoom(zoom: number): Lod {
  return zoom >= 1 ? 0 : zoom >= 0.3 ? 1 : 2;
}
