// Icônes en SVG (trait, couleur courante). Décoratives : le bouton porte l'aria-label.
import type { JSX } from 'preact';

export type IconName =
  | 'back'
  | 'close'
  | 'notebook'
  | 'hint'
  | 'pin'
  | 'map'
  | 'chevronDown'
  | 'chevronUp'
  | 'chevronLeft'
  | 'chevronRight'
  | 'star'
  | 'lock'
  | 'eye'
  | 'trash'
  | 'magnifier'
  | 'play'
  | 'check'
  | 'cases'
  | 'compass'
  | 'help'
  | 'gear'
  | 'replay';

const PATHS: Record<IconName, JSX.Element> = {
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  notebook: (
    <>
      <path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6z" />
      <path d="M6 3.5v17M4 7.5h4M4 12h4M4 16.5h4M10 8h5.5M10 11.5h5.5" />
    </>
  ),
  hint: (
    <>
      <path d="M9 17.5h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </>
  ),
  pin: (
    <>
      <circle cx="12" cy="8" r="4.5" />
      <path d="M12 12.5V21" />
    </>
  ),
  map: (
    <>
      <path d="M3.5 6.5l5.5-2.5 6 2.5 5.5-2.5v13.5L15 20l-6-2.5-5.5 2.5z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  star: <path d="M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.5l-5.4 2.9 1.2-5.9L3.4 9.4l6-.7z" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 13.5h9l1-13.5" />
    </>
  ),
  magnifier: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cases: (
    <>
      <path d="M3 7.5h7l2 2.5h9v9.5H3z" />
      <path d="M3 7.5V5h6l1.5 2.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.6M12 16.8v.4" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </>
  ),
  replay: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v4h4" />
    </>
  ),
};

export function Icon({ name, size = 22, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return (
    <svg
      class="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
