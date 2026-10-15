// Explorer la ville : carte libre, minicarte, nom du lieu sous la caméra.
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { PICK_MIN_ZOOM } from '../../config';
import { pickAt } from '../../game';
import { useServices } from '../context';
import { useSave } from '../store';
import { TopBar } from '../components/bits';
import { Minimap } from '../components/Minimap';
import { PlaceChip } from '../components/PlaceChip';
import { Icon } from '../icons';
import { EXPLORE_START } from '../views';
import type { Entry } from '../App';

export function Explore({ onBack, entry }: { onBack: () => void; entry: Entry }) {
  const { host, world, store, toast, setBackHandler } = useServices();
  const save = useSave(store);
  const [miniOpen, setMiniOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Bouton Retour du système : ferme la minicarte avant de quitter l'écran.
  const miniRef = useRef(miniOpen);
  miniRef.current = miniOpen;
  useEffect(() => {
    setBackHandler(() => {
      if (!miniRef.current) return false;
      setMiniOpen(false);
      return true;
    });
    return () => setBackHandler(null);
  }, []);

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
    // Un tap sur un lieu remarquable affiche son nom.
    host.setTapHandler((w) => {
      const zoom = host.map.getCamera().zoom;
      if (zoom < PICK_MIN_ZOOM * 0.6) return;
      const pick = pickAt(world, w, zoom);
      const lm = pick.entityId ? world.landmarks.find((l) => l.entityId === pick.entityId) : undefined;
      if (lm) toast(lm.name, 'info');
    });
    return () => {
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
          backLabel="Retour à l’accueil"
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
        <PlaceChip host={host} world={world} />
      </div>
    </div>
  );
}
