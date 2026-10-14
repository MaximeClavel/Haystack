// Racine de l'interface : navigation par état interne, services partagés, toasts, réglages appliqués.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { CaseDef, World } from '../types';
import type { CaseSession } from '../game';
import type { MapHost } from './mapHost';
import type { AppStore } from './store';
import { useSave } from './store';
import { ServicesContext, type AppServices, type Route, type ToastTone } from './context';
import type { ScreenName, UrlParams } from './params';
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
    setRouteState(r);
  };
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
        setRouteState(r);
      },
      openCase(caseId, opts) {
        if (opts?.restart) {
          store.update((sv) => {
            const casesCopy = { ...sv.cases };
            delete casesCopy[caseId];
            return { ...sv, cases: casesCopy };
          });
        }
        entryRef.current = 'nav';
        setRouteState({ screen: 'case', caseId, runId: runCounter.current++ });
      },
      toast(text, tone = 'info') {
        window.clearTimeout(toastTimer.current);
        setToast({ id: Date.now(), text, tone });
        toastTimer.current = window.setTimeout(() => setToast(null), tone === 'bad' ? 1800 : 2600);
      },
      setActiveSession(sess) {
        bridge.session = sess;
      },
    };
    return s;
  }, [world, host, store, cases, params.debug, bridge]);

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
  switch (route.screen) {
    case 'home':
      screen = <Home onNavigate={(s) => setRoute({ screen: s })} entry={entry} />;
      break;
    case 'cases':
      screen = <Cases onBack={go('home')} />;
      break;
    case 'case':
      screen = (
        <Investigation
          key={`${route.caseId}#${route.runId}`}
          caseId={route.caseId}
          entry={entry}
          onExit={() => setRoute({ screen: 'cases' })}
        />
      );
      break;
    case 'explore':
      screen = <Explore onBack={go('home')} entry={entry} />;
      break;
    case 'howto':
      screen = <HowTo onBack={go('home')} onDone={() => setRoute({ screen: 'cases' })} />;
      break;
    case 'settings':
      screen = <SettingsScreen onBack={go('home')} systemReduced={sysReduced} />;
      break;
  }

  return (
    <ServicesContext.Provider value={services}>
      <div class="ui-root">
        {screen}
        <div class="toast-zone" aria-live="polite" aria-atomic="true">
          {toast && (
            <div key={toast.id} class={`toast ${toast.tone}`} role="status" data-testid="toast">
              {toast.text}
            </div>
          )}
        </div>
      </div>
    </ServicesContext.Provider>
  );
}
