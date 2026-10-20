// Métadonnées des enquêtes utilisées par les outils de contrôle (tools/content/check.ts).

/**
 * Sosies volontaires (fausses pistes). Chaque groupe est une « famille » de personnages qui se
 * ressemblent exprès : entre deux membres d'une même famille, l'écart peut descendre sous 3 attributs
 * saillants (au moins 1). Chaque écart est documenté dans docs/CONTENT.md.
 */
export const LOOKALIKES: string[][] = [
  ['c01.lafouine', 'c01.motus'],
  ['c04.ludo', 'c04.lino'],
  ['c05.gontran', 'c05.armateur'],
  ['c03.lapince', 'c03.lapince-paille', 'c03.marin', 'c03.epouvantail', 'c03.epouvantail-nu'],
];

/** Personnages récurrents : même personne d'une enquête à l'autre (apparences identiques). */
export const RECURRING: string[][] = [['c00.picotin', 'c01.picotin', 'c02.picotin', 'c03.picotin', 'c04.picotin', 'c05.picotin']];
