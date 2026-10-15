// Accueil : titre, la ville en fond (vue d'ensemble, voile léger, lente dérive), menu principal.
import { useEffect } from 'preact/hooks';
import { useServices } from '../context';
import { useSave } from '../store';
import { solvedCount } from '../format';
import { Icon } from '../icons';
import type { ScreenName } from '../params';
import { overviewCamera, startDrift } from '../views';
import type { Entry } from '../App';

export function Home({ onNavigate, entry }: { onNavigate: (s: ScreenName) => void; entry: Entry }) {
  const { host, store, cases, reducedMotion } = useServices();
  const save = useSave(store);

  useEffect(() => {
    host.setInsets(0, 0);
    let stop: (() => void) | null = null;
    let cancelled = false;
    if (entry === 'nav') void host.map.flyTo(overviewCamera(host.viewport()));
    else if (entry === 'boot') host.map.setCamera(overviewCamera(host.viewport()));
    // Dérive lente une fois la carte prête (jamais en mouvement réduit ni avec une caméra imposée).
    if (entry !== 'url' && !reducedMotion()) {
      void host.map.whenIdle().then(() => {
        if (!cancelled && !reducedMotion()) stop = startDrift(host);
      });
    }
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  const solved = solvedCount(cases, save);
  const total = cases.filter((c) => !c.bonus).length;
  const started = Object.values(save.cases).some((p) => p.status !== 'new');

  return (
    <div class="screen home" data-testid="screen-home">
      <div class="home-veil" aria-hidden="true" />
      <div class="home-content">
        <div class="home-title">
          <p class="home-kicker">Brigade de Meulebourg</p>
          <h1 class="home-logo">Haystack</h1>
          <p class="home-sub">Enquêtes à Meulebourg</p>
          <span class="home-thread" aria-hidden="true" />
        </div>
        <nav class="home-menu" aria-label="Menu principal">
          <button type="button" class="btn btn-primary btn-big" onClick={() => onNavigate('cases')} data-testid="menu-cases">
            <Icon name="cases" />
            <span>Enquêtes</span>
            {started && (
              <span class="btn-badge" aria-label={`${solved} résolues sur ${total}`}>
                {solved}/{total}
              </span>
            )}
          </button>
          <button type="button" class="btn btn-paper" onClick={() => onNavigate('explore')} data-testid="menu-explore">
            <Icon name="compass" />
            <span>Explorer la ville</span>
          </button>
          <div class="home-row">
            <button type="button" class="btn btn-paper" onClick={() => onNavigate('howto')} data-testid="menu-howto">
              <Icon name="help" />
              <span>Comment jouer</span>
              {!save.seenHowTo && <span class="dot-new" aria-label="à lire" />}
            </button>
            <button type="button" class="btn btn-paper" onClick={() => onNavigate('settings')} data-testid="menu-settings">
              <Icon name="gear" />
              <span>Réglages</span>
            </button>
          </div>
        </nav>
        <p class="home-foot">
          {store.isPersistent()
            ? 'Un jeu d’observation · progression gardée dans ce navigateur'
            : 'Navigation privée ? Ce navigateur ne garde pas la progression.'}
        </p>
      </div>
    </div>
  );
}
