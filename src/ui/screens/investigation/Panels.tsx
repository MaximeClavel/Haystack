// Feuilles de l'enquête : briefing, carte de résultat (bonne réponse, fausse piste),
// fin d'enquête et barre de reconstitution.
import type { Ref } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { CaseDef } from '../../../types';
import { Difficulty, Stars } from '../../components/bits';
import { Icon } from '../../icons';
import { caseNumber, fr, paragraphs } from '../../format';
import { starsExplanation } from './texts';

export function Briefing(props: { def: CaseDef; panelRef: Ref<HTMLElement>; onStart: () => void }) {
  const { def } = props;
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section ref={props.panelRef} class="sheet briefing" role="dialog" aria-labelledby="brief-title" data-testid="briefing">
      <div class="dossier-head">
        <span class="dossier-num">{def.bonus ? 'Hors série' : `Dossier n° ${caseNumber(def)}`}</span>
        {/* Libellé masqué aux lecteurs d'écran : les loupes annoncent déjà « Difficulté N sur 5 ». */}
        <span class="dossier-diff">
          <span class="dossier-diff-label" aria-hidden="true">
            Difficulté
          </span>
          <Difficulty level={def.difficulty} />
        </span>
      </div>
      <h2 id="brief-title" ref={titleRef} tabIndex={-1} class="dossier-title">
        {def.title}
      </h2>
      <div class="scroll brief-text">
        {paragraphs(def.intro).map((t, i) => (
          <p key={i} class={t.startsWith('—') ? 'signature' : ''}>
            {t}
          </p>
        ))}
      </div>
      <button type="button" class="btn btn-primary btn-big" onClick={props.onStart} data-testid="brief-start">
        <Icon name="magnifier" />
        <span>Commencer l’enquête</span>
      </button>
    </section>
  );
}

export type ResultCard =
  | { kind: 'solved'; stepId: string; title: string; text: string; caseSolved: boolean }
  | { kind: 'near'; text: string };

export function ResultSheet(props: { card: ResultCard; onContinue: () => void }) {
  const { card } = props;
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    boxRef.current?.focus({ preventScroll: true });
  }, [card]);
  if (card.kind === 'near') {
    return (
      <div
        ref={boxRef}
        tabIndex={-1}
        class="sheet result near"
        role="dialog"
        aria-labelledby="res-k"
        aria-describedby="res-t"
        data-testid="result-near"
      >
        {/* Titre neutre : la carte dit parfois « c'est bien lui, mais plus tôt » (la bonne personne, au mauvais moment). */}
        <p id="res-k" class="result-kicker">
          Pas tout à fait…
        </p>
        <p id="res-t" class="result-text">
          {fr(card.text)}
        </p>
        <button type="button" class="btn btn-paper" onClick={props.onContinue} data-testid="result-continue">
          Compris
        </button>
      </div>
    );
  }
  return (
    <div
      ref={boxRef}
      tabIndex={-1}
      class="sheet result solved"
      role="dialog"
      aria-labelledby="res-k"
      aria-describedby="res-t"
      data-testid="result-solved"
    >
      <p id="res-k" class="result-kicker">
        <Icon name="check" size={18} /> {card.title}
      </p>
      <p id="res-t" class="result-text">
        {fr(card.text)}
      </p>
      <button type="button" class="btn btn-primary" onClick={props.onContinue} data-testid="result-continue">
        {card.caseSolved ? 'Conclure l’enquête' : 'Continuer'}
      </button>
    </div>
  );
}

export function CaseEnd(props: {
  def: CaseDef;
  panelRef: Ref<HTMLElement>;
  stars: 1 | 2 | 3;
  hints: number;
  mistakes: number;
  /** Questions dont la réponse a été révélée (indice de niveau 3) : explique une note à 1 étoile. */
  reveals: number;
  onReplay: () => void;
  onLook: () => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  const { def } = props;
  const [askRestart, setAskRestart] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section ref={props.panelRef} class="sheet end" role="dialog" aria-labelledby="end-title" data-testid="case-end">
      <div class="end-head">
        <span class="stamp stamp-solved big" aria-hidden="true">
          Affaire classée
        </span>
        <h2 id="end-title" ref={titleRef} tabIndex={-1} class="dossier-title">
          {def.title}
        </h2>
        <Stars count={props.stars} size={30} />
        <p class="stars-why" data-testid="stars-why">
          {fr(
            starsExplanation({
              stars: props.stars,
              hints: props.hints,
              mistakes: props.mistakes,
              stepCount: def.steps.length,
              reveals: props.reveals,
            }),
          )}
        </p>
      </div>
      <div class="scroll end-text">
        {paragraphs(def.epilogue).map((t, i) => (
          <p key={i}>{t}</p>
        ))}
        <dl class="totals">
          <div>
            <dt>Indices utilisés</dt>
            <dd>{props.hints === 0 ? 'aucun' : props.hints}</dd>
          </div>
          <div>
            <dt>Erreurs</dt>
            <dd>{props.mistakes === 0 ? 'aucune' : props.mistakes}</dd>
          </div>
        </dl>
      </div>
      <div class="end-actions">
        {def.replay.length > 0 && (
          <button type="button" class="btn btn-primary" onClick={props.onReplay} data-testid="end-replay">
            <Icon name="play" />
            <span>Revoir l’histoire</span>
          </button>
        )}
        <button type="button" class="btn btn-paper" onClick={props.onExit} data-testid="end-exit">
          <Icon name="cases" />
          <span>Retour aux enquêtes</span>
        </button>
        <div class="end-links">
          <button type="button" class="link-btn" onClick={props.onLook} data-testid="end-look">
            Regarder la carte
          </button>
          {askRestart ? (
            <span class="inline-confirm" role="group" aria-label="Recommencer l’enquête depuis le début ?">
              Rejouer ? Votre meilleure note est gardée.
              <button type="button" class="link-btn danger" onClick={props.onRestart}>
                Oui
              </button>
              <button type="button" class="link-btn" onClick={() => setAskRestart(false)}>
                Non
              </button>
            </span>
          ) : (
            <button type="button" class="link-btn" onClick={() => setAskRestart(true)}>
              Recommencer
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function ReplayBar(props: {
  def: CaseDef;
  index: number;
  panelRef: Ref<HTMLElement>;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const { def, index } = props;
  const item = def.replay[index];
  const n = def.replay.length;
  return (
    <section ref={props.panelRef} class="sheet replay" aria-label="Reconstitution" data-testid="replay">
      <div class="replay-head">
        <span class="replay-step">
          Reconstitution · {index + 1}/{n}
        </span>
        <button
          type="button"
          class="icon-btn small"
          aria-label="Fermer la reconstitution"
          onClick={props.onClose}
          data-testid="replay-close"
        >
          <Icon name="close" />
        </button>
      </div>
      <p class="replay-caption" aria-live="polite">
        {item ? fr(item.caption) : ''}
      </p>
      <div class="replay-progress" aria-hidden="true">
        {def.replay.map((_, i) => (
          <span key={i} class={i <= index ? 'on' : ''} />
        ))}
      </div>
      <div class="btn-row">
        <button
          type="button"
          class="btn btn-paper"
          onClick={props.onPrev}
          disabled={index === 0}
          aria-label="Précédent : moment précédent"
        >
          <Icon name="chevronLeft" />
          <span>Précédent</span>
        </button>
        {index < n - 1 ? (
          <button
            type="button"
            class="btn btn-primary"
            onClick={props.onNext}
            aria-label="Suivant : moment suivant"
            data-testid="replay-next"
          >
            <span>Suivant</span>
            <Icon name="chevronRight" />
          </button>
        ) : (
          <button type="button" class="btn btn-primary" onClick={props.onClose} data-testid="replay-done">
            <span>Terminer</span>
          </button>
        )}
      </div>
    </section>
  );
}
