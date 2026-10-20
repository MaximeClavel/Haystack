// Mode debug (?debug) : window.__haystack et petit affichage des coordonnées monde.
import type { CaseDef, World } from '../types';
import { entityCenter, pickAt } from '../game';
import type { MapHost } from './mapHost';
import type { AppStore } from './store';
import type { AppBridge } from './App';
import { SCREEN_ALIASES } from './params';

export interface DebugApi {
  world: World;
  map: MapHost['map'];
  host: MapHost;
  cases: CaseDef[];
  store: AppStore;
  readonly session: AppBridge['session'];
  readonly route: AppBridge['route'];
  pickAt: typeof pickAt;
  /** entityCenter(id) ou entityCenter(world, id). */
  entityCenter: (a: string | World, b?: string) => ReturnType<typeof entityCenter>;
  openCase(id: string): void;
  screen(name: string): void;
}

export function installDebug(opts: {
  world: World;
  host: MapHost;
  cases: CaseDef[];
  store: AppStore;
  bridge: AppBridge;
  hud: boolean;
}): void {
  const { world, host, cases, store, bridge } = opts;
  const api: DebugApi = {
    world,
    map: host.map,
    host,
    cases,
    store,
    get session() {
      return bridge.session;
    },
    get route() {
      return bridge.route;
    },
    pickAt,
    entityCenter: (a: string | World, b?: string) => (typeof a === 'string' ? entityCenter(world, a) : entityCenter(a, b ?? '')),
    openCase(id: string) {
      if (!cases.some((c) => c.id === id)) throw new Error(`[debug] enquête inconnue « ${id} »`);
      bridge.openCase?.(id);
    },
    screen(name: string) {
      const s = SCREEN_ALIASES[name.toLowerCase()];
      if (!s) throw new Error(`[debug] écran inconnu « ${name} » (accueil, dossiers, regles, reglages, explorer)`);
      bridge.navigate?.({ screen: s });
    },
  };
  (window as unknown as { __haystack: DebugApi }).__haystack = api;

  if (!opts.hud) return;
  const el = document.createElement('div');
  el.className = 'debug-hud';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  let tap = '';
  let last = 0;
  let pending = 0;
  const draw = (): void => {
    pending = 0;
    last = performance.now();
    const c = host.map.getCamera();
    el.textContent = `x ${c.x.toFixed(0)}  y ${c.y.toFixed(0)}  zoom ${c.zoom.toFixed(2)}${tap ? `\n${tap}` : ''}`;
  };
  host.onCamera(() => {
    // Au plus 10 mises à jour du DOM par seconde.
    if (performance.now() - last > 100) draw();
    else if (!pending) pending = window.setTimeout(draw, 100);
  });
  host.canvas.addEventListener('pointerup', (e) => {
    const r = host.canvas.getBoundingClientRect();
    const w = host.map.screenToWorld({ x: e.clientX - r.left, y: e.clientY - r.top });
    const pick = pickAt(world, w, host.map.getCamera().zoom);
    tap = `appui (${w.x.toFixed(0)}, ${w.y.toFixed(0)}) ${pick.entityId ?? '—'}`;
    draw();
  });
  draw();
}
