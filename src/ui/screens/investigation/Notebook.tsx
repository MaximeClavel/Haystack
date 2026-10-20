// Carnet d'enquête (feuille glissante) : briefing, questions résolues, personnages identifiés,
// notes et punaises.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { CaseDef, CharacterDef, Vec2, World } from '../../../types';
import type { CaseSession } from '../../../game';
import { Icon } from '../../icons';
import { Portrait } from '../../components/Portrait';
import { districtName, fr, paragraphs } from '../../format';
import { testamentVerses } from './texts';

export interface NotebookProps {
  def: CaseDef;
  session: CaseSession;
  world: World;
  /** Ouvre le briefing replié d'emblée (bouton « Relire le testament » du bonus). */
  openBrief?: boolean;
  onClose: () => void;
  /** Montre une réponse trouvée (vol vers elle, carnet fermé). */
  onShow: (id: string) => void;
  onShowPin: (p: Vec2) => void;
  onRemovePin: (i: number) => void;
  onNotes: (text: string) => void;
  onPinMode: () => void;
}

/** Personnages dont au moins une apparition a été trouvée. */
export function identifiedCharacters(def: CaseDef, session: CaseSession, world: World): CharacterDef[] {
  const ids = new Set<string>();
  for (const m of session.foundMarks()) {
    const e = world.byId.get(m.id);
    if (e && e.kind === 'person' && e.character) ids.add(e.character);
  }
  return def.characters.filter((c) => ids.has(c.id));
}

export function Notebook(p: NotebookProps) {
  const { def, session, world } = p;
  const dialogRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState(session.notes());
  const timer = useRef(0);
  const pending = useRef<string | null>(null);

  useEffect(() => {
    // Le focus revient au bouton qui a ouvert le carnet quand on le ferme.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') p.onClose();
    };
    // Notes en attente : enregistrées tout de suite si la page part en arrière-plan ou se ferme
    // (les minuteries sont suspendues, voire la page tuée, avant les 500 ms de la frappe).
    const flush = (): void => {
      window.clearTimeout(timer.current);
      if (pending.current !== null) {
        const text = pending.current;
        pending.current = null;
        p.onNotes(text);
      }
    };
    const onHide = (): void => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
      // Notes en attente : enregistrées à la fermeture.
      flush();
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  function onInput(text: string): void {
    setNotes(text);
    pending.current = text;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (pending.current !== null) p.onNotes(pending.current);
      pending.current = null;
    }, 500);
  }

  const solved = session.solvedSteps();
  const testament = testamentVerses(def);
  const foundIds = new Set(def.steps[0] ? session.stepProgress(def.steps[0].id).found : []);
  const people = identifiedCharacters(def, session, world);
  const pins = session.pins();

  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && p.onClose()}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        class="sheet notebook"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nb-title"
        data-testid="notebook"
      >
        <header class="sheet-head">
          <h2 id="nb-title">Carnet</h2>
          <button type="button" class="icon-btn" aria-label="Fermer le carnet" onClick={p.onClose} data-testid="notebook-close">
            <Icon name="close" />
          </button>
        </header>
        <div class="scroll nb-scroll">
          <section class="nb-section">
            <h3>Briefing</h3>
            <details class="nb-brief" open={p.openBrief}>
              <summary>Relire le briefing</summary>
              {paragraphs(def.intro).map((t, i) => {
                if (testament && t === fr(testament.paragraph.trim())) {
                  const ids = def.steps[0].accept;
                  return (
                    <ol key={i} class="nb-verses" aria-label="Vers du testament">
                      {testament.verses.map((v, k) => {
                        const done = foundIds.has(ids[k]);
                        return (
                          <li key={k} class={done ? 'done' : ''}>
                            <span class="nb-tick" aria-hidden="true">
                              {done ? '✓' : ''}
                            </span>
                            <span class="nb-verse">{fr(v)}</span>
                            {done && <span class="sr-only"> (aiguille trouvée)</span>}
                            {done && (
                              <button
                                type="button"
                                class="link-btn"
                                aria-label={`Voir l’aiguille ${k + 1}`}
                                onClick={() => p.onShow(ids[k])}
                              >
                                Voir
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  );
                }
                return <p key={i}>{t}</p>;
              })}
            </details>
          </section>

          <section class="nb-section">
            <h3>Questions résolues</h3>
            {solved.length === 0 ? (
              <p class="nb-empty">
                {testament
                  ? foundIds.size === 0
                    ? 'Aucune aiguille trouvée pour l’instant. Observez, puis désignez.'
                    : `${foundIds.size} aiguille${foundIds.size > 1 ? 's' : ''} trouvée${foundIds.size > 1 ? 's' : ''} sur ${def.steps[0].accept.length}, cochée${foundIds.size > 1 ? 's' : ''} dans le testament.`
                  : 'Aucune pour l’instant. Observez, puis désignez.'}
              </p>
            ) : (
              <ol class="nb-solved">
                {solved.map((s) => {
                  const i = def.steps.findIndex((x) => x.id === s.id);
                  const found = session.stepProgress(s.id).found;
                  return (
                    <li key={s.id}>
                      <p class="nb-q">
                        <span class="nb-num">Q{i + 1}</span> {fr(s.question)}
                      </p>
                      <p class="nb-a">{fr(s.solved)}</p>
                      {found.length > 0 && (
                        <button
                          type="button"
                          class="link-btn"
                          aria-label={`Voir la réponse de la question ${i + 1}`}
                          onClick={() => p.onShow(found[0])}
                          data-testid={`nb-show-${s.id}`}
                        >
                          <Icon name="eye" size={16} /> Voir
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Le bonus n'a aucun personnage : la rubrique ne pourrait jamais se remplir. */}
          {def.characters.length > 0 && (
            <section class="nb-section">
              <h3>Personnages identifiés</h3>
              {people.length === 0 ? (
                <p class="nb-empty">Personne n’est encore identifié.</p>
              ) : (
                <ul class="nb-people">
                  {people.map((c) => (
                    <li key={c.id}>
                      <Portrait appearance={c.appearance} size={64} label={`Portrait de ${c.name}`} />
                      <span class="nb-name">{c.name}</span>
                      {c.role && <span class="nb-role">{c.role}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section class="nb-section">
            <h3>
              <label for="nb-notes">Notes</label>
            </h3>
            <textarea
              id="nb-notes"
              class="nb-notes"
              rows={4}
              maxLength={4000}
              placeholder="Vos déductions, des noms, des lieux…"
              value={notes}
              onInput={(e) => onInput((e.currentTarget as HTMLTextAreaElement).value)}
              data-testid="notes"
            />
          </section>

          <section class="nb-section">
            <h3>Punaises</h3>
            <button type="button" class="btn btn-paper btn-small" onClick={p.onPinMode} data-testid="nb-pin-mode">
              <Icon name="pin" size={18} /> Poser une punaise
            </button>
            {pins.length === 0 ? (
              <p class="nb-empty">Une punaise marque un endroit à revoir.</p>
            ) : (
              <ol class="nb-pins">
                {pins.map((pin, i) => (
                  <li key={`${i}-${pin.x}-${pin.y}`}>
                    <span class="nb-pin-badge" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span class="nb-pin-name">
                      Punaise {i + 1} · {districtName(world, pin.x, pin.y)}
                    </span>
                    <button
                      type="button"
                      class="icon-btn small"
                      aria-label={`Voir la punaise ${i + 1}`}
                      onClick={() => p.onShowPin(pin)}
                    >
                      <Icon name="eye" size={18} />
                    </button>
                    <button
                      type="button"
                      class="icon-btn small"
                      aria-label={`Retirer la punaise ${i + 1}`}
                      onClick={() => p.onRemovePin(i)}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
