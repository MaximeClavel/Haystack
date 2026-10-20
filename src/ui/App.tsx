// Racine de l'interface : navigation par état interne, services partagés, toasts, réglages appliqués.
import { useEffect, useErrorBoundary, useMemo, useRef, useState } from 'preact/hooks';
import type { CaseDef, World } from '../types';
import { restartCaseProgress } from '../game';
import type { CaseSession } from '../game';
import type { MapHost } from './mapHost';
import type { AppStore } from './store';
import { useSave } from './store';
import { ServicesContext, type AppServices, type Route, type ToastTone } from './context';
import type { ScreenName, UrlParams } from './params';
import { fr } from './format';
import { Home } from './screens/Home';
import { Cases } from './screens/Cases';
import { Investigation } from './screens/Investigation';
import { Explore } from './screens/Explore';
import { HowTo } from './screens/HowTo';
import { SettingsScreen } from './screens/Settings';

export interface AppProps {
  world: World;
  host: MapHost;
  store: AppStore;
  cases: CaseDef[];
  params: UrlParams;
  /** Rappels exposés au mode debug (window.__haystack). */
  bridge: AppBridge;
}

/** Pont entre l'interface et le monde extérieur (debug, tests). */
export interface AppBridge {
  session: CaseSession | null;
  route: Route | null;
  navigate?: (r: Route) => void;
  openCase?: (id: string) => void;
}

export type Entry = 'url' | 'boot' | 'nav';

interface ToastState {
  id: number;
  text: string;
  tone: ToastTone;
  /** Distance (px) au bord bas de l'écran quand un panneau occupe le bas : le toast se pose juste au-dessus. */
  bottom: number | null;
}

/** Écran affiché quand on remonte d'un cran avec le bouton Retour du système ; null = quitter le jeu. */
function parentRoute(r: Route): Route | null {
  if (r.screen === 'home') return null;
  return r.screen === 'case' ? { screen: 'cases' } : { screen: 'home' };
}

type HistoryMark = { haystack?: 'base' | 'cur' } | null;

/**
 * Si un Retour a ramené l'historique sur « base » sans quitter la page (accueil, rien avant) et que le joueur
 * navigue ensuite dans le jeu, on repose « cur » : le prochain Retour sera encore traité par l'application.
 */
function ensureCurrentEntry(): void {
  try {
    if ((history.state as HistoryMark)?.haystack === 'base') history.pushState({ haystack: 'cur' }, '');
  } catch {
    // History API indisponible
  }
}

const systemReduced = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function App(props: AppProps) {
  const { world, host, store, cases, params, bridge } = props;
  const save = useSave(store);

  const initialRoute = (): Route => {
    if (params.caseId && cases.some((c) => c.id === params.caseId)) return { screen: 'case', caseId: params.caseId, runId: 0 };
    return { screen: params.screen ?? 'home' };
  };
  const [route, setRouteState] = useState<Route>(initialRoute);
  /**
   * Comment l'écran affiché a été atteint : 'url' (premier écran, caméra imposée par l'URL : ne pas
   * la bouger), 'boot' (premier écran : placer la caméra sans animation), 'nav' (navigation : animer).
   */
  const entryRef = useRef<Entry>(params.camera ? 'url' : 'boot');
  const setRoute = (r: Route): void => {
    entryRef.current = 'nav';
    ensureCurrentEntry();
    setRouteState(r);
  };
  // Une exception de rendu ne doit pas figer l'écran sans issue : message + sortie.
  const [renderError, resetRenderError] = useErrorBoundary((e) => {
    console.error('[haystack] erreur d’affichage', e);
  });
  const routeRef = useRef(route);
  routeRef.current = route;
  const backHandler = useRef<(() => boolean) | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef(0);
  const runCounter = useRef(1);
  const [sysReduced, setSysReduced] = useState(systemReduced);

  // Préférence système « moins d'animations » : suivie en direct.
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = (): void => setSysReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  const reduced = save.settings.reducedMotion || sysReduced || params.reduced;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // Réglages appliqués : mouvement réduit (carte + CSS), mode gaucher.
  useEffect(() => {
    host.map.setReducedMotion(reduced);
    document.documentElement.toggleAttribute('data-reduced', reduced);
  }, [reduced, host]);
  useEffect(() => {
    document.documentElement.setAttribute('data-hand', save.settings.leftHanded ? 'left' : 'right');
  }, [save.settings.leftHanded]);

  const services = useMemo<AppServices>(() => {
    const s: AppServices = {
      world,
      host,
      store,
      cases,
      debug: params.debug,
      reducedMotion: () => reducedRef.current,
      navigate(r) {
        entryRef.current = 'nav';
        ensureCurrentEntry();
        setRouteState(r);
      },
      openCase(caseId, opts) {
        if (opts?.restart) {
          // Partie vierge, mais le meilleur résultat passé est gardé : recommencer ne doit pas
          // reverrouiller les enquêtes suivantes (déblocage = résolue au moins une fois).
          const def = cases.find((c) => c.id === caseId);
          store.update((sv) => {
            const casesCopy = { ...sv.cases };
            if (def) casesCopy[caseId] = restartCaseProgress(def, sv.cases[caseId]);
            else delete casesCopy[caseId];
            return { ...sv, cases: casesCopy };
          });
        }
        entryRef.current = 'nav';
        ensureCurrentEntry();
        setRouteState({ screen: 'case', caseId, runId: runCounter.current++ });
      },
      toast(text, tone = 'info', ms) {
        window.clearTimeout(toastTimer.current);
        // Un panneau en bas (question, exploration) : le toast se pose juste au-dessus de lui, près du
        // pouce et de la zone de jeu ; sinon (écrans sans panneau, feuille latérale) il reste en haut.
        const bottom = host.getInsets().bottom;
        setToast({ id: Date.now(), text, tone, bottom: bottom > 0 ? bottom + 12 : null });
        toastTimer.current = window.setTimeout(() => setToast(null), ms ?? (tone === 'bad' ? 1800 : 2600));
      },
      setBackHandler(fn) {
        backHandler.current = fn;
      },
      setActiveSession(sess) {
        bridge.session = sess;
      },
    };
    return s;
  }, [world, host, store, cases, params.debug, bridge]);

  // Sauvegarde impossible (navigation privée, quota) : on prévient une fois, dès que ça compte.
  useEffect(() => {
    let warned = false;
    return store.subscribe(() => {
      if (warned || store.isPersistent()) return;
      warned = true;
      services.toast('La sauvegarde est impossible dans ce navigateur : la progression sera perdue en fermant la page.', 'warn', 6000);
    });
  }, [store, services]);

  // Bouton Retour du système. L'historique ne garde que deux entrées, « base » puis « cur » (où l'on
  // est) : un Retour ramène sur « base », on le traite comme le bouton ‹ de l'interface (fermer ce qui
  // est ouvert, sinon remonter d'un écran) puis on repose « cur ». Depuis l'accueil, on laisse sortir.
  useEffect(() => {
    if (!params.ui) return;
    const mark = (haystack: 'base' | 'cur'): void => {
      try {
        history.pushState({ haystack }, '');
      } catch {
        // History API indisponible : le jeu reste jouable, Retour quitte simplement la page.
      }
    };
    try {
      const st = history.state as HistoryMark;
      if (st?.haystack !== 'cur') {
        if (st?.haystack !== 'base') history.replaceState({ haystack: 'base' }, '');
        mark('cur');
      }
    } catch {
      return;
    }
    const onPop = (e: PopStateEvent): void => {
      if ((e.state as HistoryMark)?.haystack !== 'base') return;
      if (backHandler.current?.()) {
        mark('cur');
        return;
      }
      const parent = parentRoute(routeRef.current);
      if (parent) {
        entryRef.current = 'nav';
        setRouteState(parent);
        mark('cur');
      } else {
        history.back();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Pont pour le mode debug et les tests.
  useEffect(() => {
    bridge.navigate = (r) => services.navigate(r);
    bridge.openCase = (id) => services.openCase(id);
  }, [bridge, services]);
  useEffect(() => {
    bridge.route = route;
    // Changement d'écran : on repart d'une carte propre (aucun overlay ni tap hérité).
    window.clearTimeout(toastTimer.current);
    setToast(null);
  }, [route, bridge]);

  const go = (screen: ScreenName) => () => setRoute({ screen });

  const entry = entryRef.current;
  let screen;
  if (renderError) {
    screen = (
      <div class="screen loading" role="alert" data-testid="error-fallback">
        <div class="loading-box">
          <div class="loading-mark" aria-hidden="true">
            <span class="loading-lens" />
          </div>
          <p class="loading-text">Quelque chose s’est mal passé…</p>
          <p class="loading-sub">Votre progression est gardée. Revenez aux enquêtes, ou rechargez la page.</p>
          <div class="btn-row">
            <button
              type="button"
              class="btn btn-primary"
              onClick={() => {
                resetRenderError();
                setRoute({ screen: 'cases' });
              }}
            >
              Retour aux enquêtes
            </button>
            <button type="button" class="btn btn-paper" onClick={() => location.reload()}>
              Recharger
            </button>
          </div>
        </div>
      </div>
    );
  } else if (route.screen === 'home') {
    screen = <Home onNavigate={(s) => setRoute({ screen: s })} entry={entry} />;
  } else if (route.screen === 'cases') {
    screen = <Cases onBack={go('home')} />;
  } else if (route.screen === 'case') {
    screen = (
      <Investigation
        key={`${route.caseId}#${route.runId}`}
        caseId={route.caseId}
        entry={entry}
        onExit={() => setRoute({ screen: 'cases' })}
      />
    );
  } else if (route.screen === 'explore') {
    screen = <Explore onBack={go('home')} entry={entry} />;
  } else if (route.screen === 'howto') {
    screen = <HowTo onBack={go('home')} onDone={() => setRoute({ screen: 'cases' })} />;
  } else {
    screen = <SettingsScreen onBack={go('home')} systemReduced={sysReduced} />;
  }

  return (
    <ServicesContext.Provider value={services}>
      <div class="ui-root">
        {screen}
        <div
          class="toast-zone"
          aria-live="polite"
          aria-atomic="true"
          style={toast?.bottom != null ? { top: 'auto', bottom: `${toast.bottom}px` } : undefined}
        >
          {toast && (
            <div key={toast.id} class={`toast ${toast.tone}`} role="status" data-testid="toast">
              {fr(toast.text)}
            </div>
          )}
        </div>
      </div>
    </ServicesContext.Provider>
  );
}
