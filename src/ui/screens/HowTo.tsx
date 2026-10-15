// Comment jouer : quatre étapes courtes, illustrées avec le dessin du jeu.
import { useEffect, useRef, useState } from 'preact/hooks';
import { useServices } from '../context';
import { TopBar } from '../components/bits';
import { Icon } from '../icons';
import { fr } from '../format';
import type { MapHost } from '../mapHost';
import { drawExploreIllustration, drawFollowIllustration, drawHintIllustration, drawPickIllustration } from '../illustrations';

interface Step {
  title: string;
  text: string;
  draw: (c: HTMLCanvasElement, host: MapHost) => void;
  alt: string;
}

const STEPS: Step[] = [
  {
    title: 'Zoomer et se déplacer',
    text: 'Pincez pour zoomer, glissez pour vous déplacer. Un double tap rapproche la vue. La ville fourmille de détails : prenez votre temps.',
    draw: drawExploreIllustration,
    alt: 'Une rue de Meulebourg, avec deux doigts qui pincent et un doigt qui glisse.',
  },
  {
    title: 'Suivre un personnage',
    text: 'Une même personne apparaît plusieurs fois sur la carte, à différents moments de son histoire. Repérez ses vêtements et suivez-la.',
    draw: (c) => drawFollowIllustration(c),
    alt: 'La même dame au béret vert, d’abord en train de marcher, puis assise sur un banc, reliées par un fil rouge.',
  },
  {
    title: 'Désigner',
    text: 'Touchez une personne, un objet ou un lieu, vérifiez la vignette, puis appuyez sur « Désigner ». Une erreur n’est pas grave, mais elle coûte des étoiles.',
    draw: (c) => drawPickIllustration(c),
    alt: 'Une petite foule ; un personnage masqué est encadré, avec le bouton Désigner.',
  },
  {
    title: 'Indices et carnet',
    text: 'Bloqué ? Un indice éclaire une zone de la carte. Le carnet garde le briefing, vos découvertes, vos notes et vos punaises.',
    draw: drawHintIllustration,
    alt: 'Une zone de la carte éclairée par un projecteur, et une punaise rouge.',
  },
];

export function HowTo({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { host, store } = useServices();
  const [i, setI] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  useEffect(() => {
    const c = canvasRef.current;
    if (c) step.draw(c, host);
  }, [i]);

  useEffect(() => {
    if (last && !store.get().seenHowTo) store.update((s) => ({ ...s, seenHowTo: true }));
  }, [last]);

  const go = (d: number): void => {
    setI((k) => Math.max(0, Math.min(STEPS.length - 1, k + d)));
    titleRef.current?.focus({ preventScroll: true });
  };

  // Glisser horizontalement pour changer d'étape.
  const swipe = useRef<{ x: number; y: number } | null>(null);

  return (
    <div class="screen sheet-screen howto" data-testid="screen-howto">
      <TopBar
        title="Comment jouer"
        subtitle={`Étape ${i + 1} sur ${STEPS.length}`}
        onBack={onBack}
        backLabel="Retour à l’accueil"
      />
      <div class="scroll">
        <article
          class="howto-card"
          onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
          onPointerUp={(e) => {
            const s = swipe.current;
            swipe.current = null;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) go(dx < 0 ? 1 : -1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
          }}
        >
          <canvas ref={canvasRef} class="howto-art" role="img" aria-label={step.alt} />
          <p class="howto-num" aria-hidden="true">
            {i + 1}
          </p>
          <h2 ref={titleRef} tabIndex={-1} class="howto-title">
            {step.title}
          </h2>
          <p class="howto-text">{fr(step.text)}</p>
        </article>
        <div class="howto-dots" role="tablist" aria-label="Étapes">
          {STEPS.map((s, k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === i}
              aria-label={`Étape ${k + 1} : ${s.title}`}
              class={k === i ? 'hdot on' : 'hdot'}
              onClick={() => setI(k)}
            />
          ))}
        </div>
        <div class="btn-row howto-nav">
          <button type="button" class="btn btn-paper" onClick={() => go(-1)} disabled={i === 0}>
            <Icon name="chevronLeft" />
            <span>Précédent</span>
          </button>
          {last ? (
            <button type="button" class="btn btn-primary" onClick={onDone} data-testid="howto-done">
              <span>C’est parti !</span>
            </button>
          ) : (
            <button type="button" class="btn btn-primary" onClick={() => go(1)} data-testid="howto-next">
              <span>Suivant</span>
              <Icon name="chevronRight" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
