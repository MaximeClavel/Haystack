// Nom du lieu au centre de la zone libre de la carte (lieu remarquable ou rue · quartier).
// Il suit la caméra sans re-rendre à chaque image : l'état n'est mis à jour que lorsque le nom change.
import { useEffect, useState } from 'preact/hooks';
import type { World } from '../../types';
import type { MapHost } from '../mapHost';
import { placeCaptureMargin, placeName } from '../format';
import { Icon } from '../icons';

/**
 * Nom du lieu au centre de la zone libre. La marge de capture (≈ 48 px d'écran) suit le zoom : un pont
 * ou un bâtiment étroit visible à l'écran est nommé même si son axe n'est pas exactement au centre.
 */
function nameAtCenter(host: MapHost, world: World): string {
  const r = host.freeWorldRect();
  return placeName(world, r.x + r.w / 2, r.y + r.h / 2, placeCaptureMargin(host.map.getCamera().zoom));
}

/** Nom du lieu sous le centre de la zone libre ; se met à jour quand la caméra bouge (zoom compris). */
export function usePlaceName(host: MapHost, world: World): string {
  const [place, setPlace] = useState(() => nameAtCenter(host, world));
  useEffect(() => {
    let last = '';
    const update = (): void => {
      const name = nameAtCenter(host, world);
      if (name !== last) {
        last = name;
        setPlace(name);
      }
    };
    update();
    return host.onCamera(update);
  }, [host, world]);
  return place;
}

/**
 * Pastille du lieu. Pas de `aria-live` : le nom change à chaque déplacement de la caméra, ce serait
 * du bavardage pour un lecteur d'écran ; il reste lisible à la demande (c'est un simple texte).
 */
export function PlaceChip(props: { host: MapHost; world: World; class?: string }) {
  const place = usePlaceName(props.host, props.world);
  return (
    <p class={`place-chip ${props.class ?? ''}`} data-testid="place">
      <Icon name="compass" size={18} />
      <span>{place}</span>
    </p>
  );
}
