// Explorer la ville : carte libre, minicarte, nom du lieu sous la caméra.
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { PICK_MIN_ZOOM } from '../../config';
import { pickAt } from '../../game';
import { useServices } from '../context';
import { useSave } from '../store';
import { TopBar } from '../components/bits';
import { Minimap } from '../components/Minimap';
import { Icon } from '../icons';
import { placeName } from '../format';
import { EXPLORE_START } from '../views';
import type { Entry } from '../App';

export function Explore({ onBack, entry }: { onBack: () => void; entry: Entry }) {
  const { host, world, store, toast } = useServices();
  const save = useSave(store);
  const [miniOpen, setMiniOpen] = useState(false);
  const [place, setPlace] = useState(() => {
    const c = host.map.getCamera();
    return placeName(world, c.x, c.y);
  });
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    host.measureInsets(topRef.current, bottomRef.current);
  });
  useEffect(() => {
    const onResize = (): void => host.measureInsets(topRef.current, bottomRef.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [host]);

  useEffect(() => {
    if (entry === 'nav') void host.focus({ x: EXPLORE_START.x, y: EXPLORE_START.y }, EXPLORE_START.zoom);
    else if (entry === 'boot') void host.focus({ x: EXPLORE_START.x, y: EXPLORE_START.y }, EXPLORE_START.zoom, { instant: true });
    // Nom du lieu au centre de la zone libre : mis à jour seulement quand il change.
    let last = '';
    const update = (): void => {
      const r = host.freeWorldRect();
      const name = placeName(world, r.x + r.w / 2, r.y + r.h / 2);
      if (name !== last) {
        last = name;
        setPlace(name);
      }
    };
    update();
    const off = host.onCamera(update);
    // Un tap sur un lieu remarquable affiche son nom.
    host.setTapHandler((w) => {
      const zoom = host.map.getCamera().zoom;
      if (zoom < PICK_MIN_ZOOM * 0.6) return;
      const pick = pickAt(world, w, zoom);
      const lm = pick.entityId ? world.landmarks.find((l) => l.entityId === pick.entityId) : undefined;
      if (lm) toast(lm.name, 'info');
    });
    return () => {
      off();
      host.setTapHandler(null);
      host.setInsets(0, 0);
    };
  }, []);

  return (
    <div class="screen map-screen explore" data-testid="screen-explore">
      <div ref={topRef} class="top-zone">
        <TopBar
          title="Meulebourg"
          subtitle="Exploration libre"
          onBack={onBack}
          backLabel="Retour à l'accueil"
          right={
            <button
              type="button"
              class={miniOpen ? 'icon-btn on' : 'icon-btn'}
              aria-label={miniOpen ? 'Fermer la minicarte' : 'Ouvrir la minicarte'}
              aria-pressed={miniOpen}
              onClick={() => setMiniOpen((m) => !m)}
              data-testid="explore-minimap"
            >
              <Icon name="map" />
            </button>
          }
        />
        {miniOpen && (
          <Minimap host={host} side={save.settings.leftHanded ? 'left' : 'right'} onClose={() => setMiniOpen(false)} />
        )}
      </div>
      <div ref={bottomRef} class="place-chip-zone">
        <p class="place-chip" aria-live="polite" data-testid="place">
          <Icon name="compass" size={18} />
          <span>{place}</span>
        </p>
      </div>
    </div>
  );
}
