// Démarrage : écran de chargement, construction du monde, carte unique, interface.
import { render } from 'preact';
import type { CameraState } from '../types';
import { buildWorld } from '../world';
import { CASES } from '../content';
import { createSaveStore } from '../game';
import { createMapHost } from './mapHost';
import { createAppStore } from './store';
import { readParams } from './params';
import { App, type AppBridge } from './App';
import { installDebug } from './debug';
import { warmMinimap } from './components/Minimap';
import { overviewCamera } from './views';

declare global {
  interface Window {
    __haystackReady?: boolean;
  }
}

/** Laisse le navigateur peindre (deux images) avant un calcul long. */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([p, new Promise<void>((r) => setTimeout(r, ms))]);
}

export function Loading({ error }: { error?: string }) {
  return (
    <div class="screen loading" role="status" aria-live="polite" data-testid="loading">
      <div class="loading-box">
        <div class="loading-mark" aria-hidden="true">
          <span class="loading-lens" />
        </div>
        {error ? (
          <>
            <p class="loading-text">Meulebourg ne s’est pas réveillée…</p>
            <p class="loading-sub">{error}</p>
            <button type="button" class="btn btn-paper" onClick={() => location.reload()}>
              Réessayer
            </button>
          </>
        ) : (
          <>
            <p class="loading-text">Meulebourg se réveille…</p>
            <p class="loading-sub">On dessine les rues, les passants et les pigeons.</p>
          </>
        )}
      </div>
    </div>
  );
}

export async function boot(): Promise<void> {
  const params = readParams();
  const appEl = document.getElementById('app') as HTMLElement;
  const canvas = document.getElementById('map') as HTMLCanvasElement;
  if (params.ui) render(<Loading />, appEl);
  else appEl.remove();
  await nextPaint();

  try {
    const world = buildWorld({ cases: CASES });
    const store = createAppStore(createSaveStore());

    let initial: Partial<CameraState> | undefined;
    if (params.camera) initial = params.camera;
    else if (params.ui) initial = overviewCamera({ width: window.innerWidth, height: window.innerHeight });
    const host = createMapHost(world, canvas, initial);
    const bridge: AppBridge = { session: null, route: null };
    if (params.debug) installDebug({ world, host, cases: CASES, store, bridge, hud: true });

    if (params.ui) {
      render(<App world={world} host={host} store={store} cases={CASES} params={params} bridge={bridge} />, appEl);
    } else {
      host.map.setReducedMotion(params.reduced || store.get().settings.reducedMotion);
    }

    await nextPaint();
    await withTimeout(document.fonts?.ready ?? Promise.resolve(), 1500);
    await host.map.whenIdle();
    window.__haystackReady = true;

    // Vignette de la minicarte préparée pendant un moment calme (elle coûte quelques dizaines de ms).
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    if (params.ui) {
      if (idle) idle(() => warmMinimap(host), { timeout: 4000 });
      else setTimeout(() => warmMinimap(host), 2000);
    }
  } catch (err) {
    console.error('[haystack] échec du démarrage', err);
    if (params.ui) render(<Loading error={err instanceof Error ? err.message : String(err)} />, appEl);
  }
}
