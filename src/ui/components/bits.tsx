// Petits composants d'affichage : étoiles, difficulté en loupes, interrupteur, barre haute.
import type { ComponentChildren } from 'preact';
import { Icon } from '../icons';

export function Stars({ count, size = 20, label = true }: { count: number; size?: number; label?: boolean }) {
  return (
    <span class="stars" role="img" aria-label={label ? `${count} étoile${count > 1 ? 's' : ''} sur 3` : undefined}>
      {[1, 2, 3].map((i) => (
        <span key={i} class={i <= count ? 'star on' : 'star'}>
          <Icon name="star" size={size} filled={i <= count} />
        </span>
      ))}
    </span>
  );
}

/** Difficulté en loupes (1 à 5). */
export function Difficulty({ level }: { level: number }) {
  return (
    <span class="difficulty" role="img" aria-label={`Difficulté ${level} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} class={i <= level ? 'loupe on' : 'loupe'}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              cx="10"
              cy="10"
              r="6.2"
              fill={i <= level ? 'currentColor' : 'none'}
              fill-opacity="0.25"
              stroke="currentColor"
              stroke-width="2.6"
            />
            <path d="M14.6 14.6l6 6" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" />
          </svg>
        </span>
      ))}
    </span>
  );
}

export function Switch(props: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  note?: string;
}) {
  const { id, label, description, checked, onChange, note } = props;
  return (
    <div class="setting">
      <div class="setting-text">
        <label for={id} class="setting-label">
          {label}
        </label>
        {description && <p class="setting-desc">{description}</p>}
        {note && <p class="setting-note">{note}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        class={checked ? 'switch on' : 'switch'}
        onClick={() => onChange(!checked)}
      >
        <span class="switch-knob" />
      </button>
    </div>
  );
}

/** Barre haute des écrans : bouton retour, titre, actions à droite. */
export function TopBar(props: {
  title: ComponentChildren;
  subtitle?: ComponentChildren;
  onBack?: () => void;
  backLabel?: string;
  right?: ComponentChildren;
  class?: string;
}) {
  return (
    <header class={`topbar ${props.class ?? ''}`}>
      {props.onBack ? (
        <button type="button" class="icon-btn" aria-label={props.backLabel ?? 'Retour'} onClick={props.onBack} data-testid="back">
          <Icon name="back" />
        </button>
      ) : (
        <span class="icon-btn-spacer" />
      )}
      <div class="topbar-title">
        <h1>{props.title}</h1>
        {props.subtitle && <p class="topbar-sub">{props.subtitle}</p>}
      </div>
      <div class="topbar-right">{props.right ?? <span class="icon-btn-spacer" />}</div>
    </header>
  );
}
