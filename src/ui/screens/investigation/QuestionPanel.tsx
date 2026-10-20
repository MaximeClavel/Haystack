// Panneau de question (bas de l'écran) : progression, onglets des questions ouvertes en parallèle,
// question, indices déjà obtenus, barre d'actions (Indice, Punaise, Minicarte).
import type { Ref } from 'preact';
import type { CaseDef, HintResult, StepDef, StepProgress } from '../../../types';
import { REVEAL_TEXT, requiredOf } from '../../../game';
import { Icon } from '../../icons';
import { fr } from '../../format';
import { foundCountLabel, hintCostText, panelLabel } from './texts';

export interface QuestionPanelProps {
  def: CaseDef;
  panelRef: Ref<HTMLElement>;
  open: StepDef[];
  active: StepDef | null;
  solvedIds: Set<string>;
  activeProgress: StepProgress | null;
  hint: HintResult | null;
  hintVisible: boolean;
  /** Texte de l'indice déplié (replié : seul l'en-tête reste, pour laisser la place à la carte). */
  hintOpen: boolean;
  /** Étoiles estimées maintenant, et après un indice de plus (confirmation d'indice). */
  starsNow: 1 | 2 | 3;
  starsAfterHint: 1 | 2 | 3;
  collapsed: boolean;
  hintAsk: boolean;
  pinMode: boolean;
  miniOpen: boolean;
  /** Une feuille (confirmation, résultat) le recouvre : masqué mais gardé en place. */
  covered: boolean;
  onSelectStep: (id: string) => void;
  onToggleCollapse: () => void;
  onHint: () => void;
  onHintConfirm: () => void;
  onHintCancel: () => void;
  onHintShow: () => void;
  onToggleHintVisible: () => void;
  onToggleHintOpen: () => void;
  /** Relire le briefing (bonus : le testament, dont chaque vers désigne un lieu). */
  onBriefing?: () => void;
  onTogglePin: () => void;
  onToggleMini: () => void;
  onConclude: () => void;
  /** Mode gaucher : les actions du bas sont rangées dans l'ordre visuel (Indice près du pouce gauche). */
  leftHanded: boolean;
}

const HINT_LEVEL_TEXT: Record<1 | 2 | 3, string> = {
  1: 'Indice 1 sur 3 : un conseil écrit.',
  2: 'Indice 2 sur 3 : une zone éclairée sur la carte.',
  3: 'Indice 3 sur 3 : la réponse est montrée.',
};

export function QuestionPanel(p: QuestionPanelProps) {
  const { def, open, active, solvedIds, activeProgress, hint } = p;
  const index = active ? def.steps.findIndex((s) => s.id === active.id) : -1;
  const required = active ? requiredOf(active) : 1;
  const found = activeProgress?.found.length ?? 0;
  const level = activeProgress?.hints ?? 0;
  const nextLevel = Math.min(3, level + 1) as 1 | 2 | 3;

  // Textes d'indice obtenus jusqu'ici (le niveau 2 complète le niveau 1, il ne le remplace pas).
  const hintLines: string[] = [];
  if (active && hint) {
    if (hint.level >= 1 && active.hints[0]) hintLines.push(active.hints[0].text);
    if (hint.level >= 2 && active.hints[1] && active.hints[1].text !== active.hints[0]?.text)
      hintLines.push(active.hints[1].text);
    if (hint.level >= 3) hintLines.push(REVEAL_TEXT);
  }

  const cancelBtn = (
    <button key="cancel" type="button" class="btn btn-paper" onClick={p.onHintCancel} data-testid="hint-cancel">
      Non merci
    </button>
  );
  const confirmBtn = (
    <button key="confirm" type="button" class="btn btn-primary" onClick={p.onHintConfirm} data-testid="hint-confirm">
      Oui, un indice
    </button>
  );
  // Barre d'actions : Minicarte, Punaise, Indice de gauche à droite ; en gaucher l'ordre est inversé
  // (Indice sous le pouce gauche) dans le DOM aussi, pas seulement par le CSS.
  const miniBtn = (
    <button
      key="mini"
      type="button"
      class={p.miniOpen ? 'action on' : 'action'}
      aria-pressed={p.miniOpen}
      onClick={p.onToggleMini}
      data-testid="action-minimap"
    >
      <Icon name="map" />
      <span>Minicarte</span>
    </button>
  );
  const pinBtn = (
    <button
      key="pin"
      type="button"
      class={p.pinMode ? 'action on' : 'action'}
      aria-pressed={p.pinMode}
      onClick={p.onTogglePin}
      data-testid="action-pin"
    >
      <Icon name="pin" />
      <span>Punaise</span>
    </button>
  );
  const hintBtn = (
    <button key="hint" type="button" class="action hint-action" onClick={p.onHint} data-testid="action-hint">
      <Icon name="hint" />
      <span>{level >= 3 ? 'Revoir' : 'Indice'}</span>
    </button>
  );

  return (
    <section
      ref={p.panelRef}
      class={`qpanel ${p.collapsed ? 'collapsed' : ''} ${p.covered ? 'covered' : ''}`}
      aria-label="Question en cours"
      aria-hidden={p.covered}
      data-testid="question-panel"
    >
      <div class="qpanel-head">
        {def.steps.length > 1 && (
          <ol
            class="progress-dots"
            aria-label={`${solvedIds.size} question${solvedIds.size > 1 ? 's' : ''} résolue${solvedIds.size > 1 ? 's' : ''} sur ${def.steps.length}`}
          >
            {def.steps.map((s) => (
              <li key={s.id} class={solvedIds.has(s.id) ? 'dot done' : active?.id === s.id ? 'dot current' : 'dot'} />
            ))}
          </ol>
        )}
        <span class="qpanel-label">
          {!active
            ? 'Toutes les questions sont résolues'
            : panelLabel({ stepCount: def.steps.length, index, openCount: open.length })}
        </span>
        {active && required > 1 && (
          <span class="qcount" role="img" aria-label={foundCountLabel(found, required, def.bonus ? 'aiguille' : 'réponse')}>
            {found}/{required}
          </span>
        )}
        {active && (
          <button
            type="button"
            class="icon-btn small"
            aria-expanded={!p.collapsed}
            aria-label={p.collapsed ? 'Déplier la question' : 'Replier la question'}
            onClick={p.onToggleCollapse}
            data-testid="collapse"
          >
            <Icon name={p.collapsed ? 'chevronUp' : 'chevronDown'} />
          </button>
        )}
      </div>

      {open.length > 1 && (
        <div class="tabs" role="tablist" aria-label="Questions ouvertes">
          {open.map((s) => {
            const i = def.steps.findIndex((x) => x.id === s.id);
            const selected = s.id === active?.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={selected}
                class={selected ? 'tab on' : 'tab'}
                onClick={() => p.onSelectStep(s.id)}
                data-testid={`tab-${s.id}`}
              >
                {s.label ?? `Question ${i + 1}`}
              </button>
            );
          })}
        </div>
      )}

      {active ? (
        <p class="question" data-testid="question">
          {fr(active.question)}
        </p>
      ) : (
        <div class="all-done">
          <p class="question">Affaire résolue : toutes les réponses sont sur la carte.</p>
          <button type="button" class="btn btn-primary" onClick={p.onConclude} data-testid="conclude">
            Voir la conclusion
          </button>
        </div>
      )}

      {active && !p.collapsed && p.onBriefing && (
        <button type="button" class="link-btn briefing-link" onClick={p.onBriefing} data-testid="open-briefing">
          <Icon name="notebook" size={16} /> Relire le testament
        </button>
      )}

      {active && !p.collapsed && hintLines.length > 0 && (
        <div class={p.hintOpen ? 'hint-box' : 'hint-box folded'} data-testid="hint-box">
          <button
            type="button"
            class="hint-title"
            aria-expanded={p.hintOpen}
            onClick={p.onToggleHintOpen}
            data-testid="hint-toggle"
          >
            <Icon name="hint" size={16} />
            <span>
              Indice {hint?.level} sur 3{!p.hintOpen && ' · relire'}
            </span>
            <Icon name={p.hintOpen ? 'chevronDown' : 'chevronUp'} size={16} />
          </button>
          {p.hintOpen &&
            hintLines.map((t, i) => (
              <p key={i} class="hint-text">
                {fr(t)}
              </p>
            ))}
          {hint?.area && (
            <div class="hint-actions">
              <button type="button" class="link-btn" onClick={p.onHintShow}>
                <Icon name="eye" size={16} /> Voir la zone
              </button>
              {hint.level === 2 && (
                <button type="button" class="link-btn" onClick={p.onToggleHintVisible} aria-pressed={!p.hintVisible}>
                  {p.hintVisible ? 'Masquer le projecteur' : 'Afficher le projecteur'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {active &&
        (p.hintAsk ? (
          <div class="hint-ask" role="group" aria-labelledby="hint-ask-q" data-testid="hint-ask">
            <p id="hint-ask-q" class="hint-ask-q">
              Utiliser un indice ?
            </p>
            <p class="hint-ask-sub">{HINT_LEVEL_TEXT[nextLevel]}</p>
            <p class="hint-ask-stars" data-testid="hint-cost">
              <Icon name="star" size={15} filled /> {fr(hintCostText(p.starsNow, p.starsAfterHint, def.steps.length))}
            </p>
            {/* Ordre du DOM = ordre visuel (Tab, lecteur d'écran). Droitier : « Non merci » prend la place du
                bouton Indice, à droite (un double tap involontaire ne confirme pas) ; gaucher : à gauche. */}
            <div class="btn-row">{p.leftHanded ? [cancelBtn, confirmBtn] : [confirmBtn, cancelBtn]}</div>
          </div>
        ) : (
          <div class="actions" role="toolbar" aria-label="Actions">
            {p.leftHanded ? [hintBtn, pinBtn, miniBtn] : [miniBtn, pinBtn, hintBtn]}
          </div>
        ))}
    </section>
  );
}
