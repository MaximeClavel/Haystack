// Module engine — moteur de carte de Haystack (voir README.md).
//
// API publique : createMapView(opts) → MapView (contrat dans src/types.ts), enrichie de
// debugStats() et invalidateTiles(). Les fonctions pures de caméra et de tuiles sont
// ré-exportées pour l'interface (minicarte…) et les outils.

export { createMapView, type EngineMapView, type MapDebugStats } from './mapView';
export {
  computeMinZoom,
  clampCamera,
  screenToWorld,
  worldToScreen,
  visibleWorldRect,
  zoomAround,
  fitRectCamera,
  type ScreenInsets,
  type Viewport,
} from './camera';
export { BACKDROP } from './constants';
export { MARK_STROKE } from './overlays';
