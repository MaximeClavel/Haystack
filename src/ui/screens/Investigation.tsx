// Écran d'enquête : la carte plein écran, la barre haute, le panneau de question et toutes les
// feuilles (briefing, confirmation, résultat, carnet, fin, reconstitution).
//
// La session (src/game) est créée une fois par ouverture de l'enquête ; elle est mutable : après
// chaque action, on enregistre sa progression et on force un re-rendu (jamais à chaque image).
import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'preact/hooks';
import type { Overlay, Pick, StepDef, Vec2 } from '../../types';
import { PICK_MIN_ZOOM } from '../../config';
import {
  CaseSession,
  MAX_HINT_LEVEL,
  computeStars,
  entityCenter,
  matchTargets,
  pickAt,
  stepDependencies,
  targetRect,
  withCaseProgress,
} from '../../game';
import { useServices } from '../context';
import { useSave } from '../store';
import { TopBar } from '../components/bits';
import { Minimap, type MinimapMark } from '../components/Minimap';
import { PlaceChip } from '../components/PlaceChip';
import { Icon } from '../icons';
import { vibrate } from '../haptics';
import { caseNumber } from '../format';
import { overviewCamera } from '../views';
import type { Entry } from '../App';
import { QuestionPanel } from './investigation/QuestionPanel';
import { ConfirmSheet } from './investigation/ConfirmSheet';
import { Notebook } from './investigation/Notebook';
import { confirmLabel, foundToastText, verseFor, wrongMessage } from './investigation/texts';
import { Briefing, CaseEnd, ReplayBar, ResultSheet, type ResultCard } from './investigation/Panels';
import {
  circleRect,
  foundBounds,
  foundOverlays,
  hintOverlays,
  lastFoundId,
  pickCircle,
  pinOverlays,
  selectOverlay,
  threadOverlays,
} from './investigation/overlays';

type Phase = 'brief' | 'play' | 'end' | 'replay';

const SOLVED_TITLES = ['Bien vu !', 'Excellent !', 'Exactement !', 'Bien joué !'];
/** Zoom des vols vers une réponse (carnet, reconstitution). */
const SHOW_ZOOM = 2.4;
/** Zoom après un tap trop lointain (sous PICK_MIN_ZOOM). */
const APPROACH_ZOOM = 2;
/** Durée du vol d'approche (ms) : court, pour qu'un second tap ne tombe pas en plein vol (il l'arrêterait). */
const APPROACH_MS = 300;
/**
 * Quand l'indice éclaire la zone de la réponse (projecteur ou anneau), on la désigne dès ce zoom : sur un
 * petit écran, cadrer le projecteur laisse parfois le zoom juste sous PICK_MIN_ZOOM (1,43 pour 1,5).
 */
const HINT_PICK_ZOOM = PICK_MIN_ZOOM * 0.8;
/** Zoom de reprise sur la dernière trouvaille. */
const RESUME_ZOOM = PICK_MIN_ZOOM + 0.1;
/** Départs plus larges que ce zoom (bonus : toute la ville) : vue d'ensemble de l'accueil, sans décalage. */
const OVERVIEW_START_ZOOM = 0.5;
/** Durée pendant laquelle les appuis sont ignorés après l'apparition ou la disparition d'une feuille (ms). */
const GUARD_MS = 320;
const REPLAY_AUTO_MS = 4000;

export function Investigation({ caseId, entry, onExit }: { caseId: string; entry: Entry; onExit: () => void }) {
  const svc = useServices();
  const { world, host, store, cases } = svc;
  const def = cases.find((c) => c.id === caseId)!;
  const save = useSave(store);
  const settings = save.settings;

  const session = useMemo(() => new CaseSession(def, world, store.get().cases[def.id] ?? null), [def, world]);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const initialStatus = useMemo(() => session.progress().status, [session]);
  const [phase, setPhase] = useState<Phase>(() =>
    initialStatus === 'solved' ? 'end' : initialStatus === 'active' ? 'play' : 'brief',
  );
  const [chosenStep, setChosenStep] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [selection, setSelection] = useState<Pick | null>(null);
  const [card, setCard] = useState<ResultCard | null>(null);
  const [feedback, setFeedback] = useState<Overlay[]>([]);
  const [hintAsk, setHintAsk] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [pinMode, setPinMode] = useState(false);
  const [miniOpen, setMiniOpen] = useState(false);
  const [notebook, setNotebook] = useState(false);
  /** Le carnet s'ouvre sur le briefing (testament du bonus). */
  const [notebookBrief, setNotebookBrief] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  /** Texte de l'indice déplié ? Replié dès que le joueur touche la carte (il a lu, il cherche). */
  const [hintOpen, setHintOpen] = useState(true);
  /** Garde anti-double tap : un voile transparent avale les appuis juste après un changement de feuille. */
  const [guard, setGuard] = useState(false);
  const guardTimer = useRef(0);
  const guardArmed = useRef(false);

  const topRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const feedbackTimer = useRef(0);
  const pendingFocus = useRef<null | (() => void)>(null);

  // Étape active : l'onglet choisi s'il est encore ouvert, sinon la première question ouverte.
  const open = session.openSteps();
  const active = open.find((s) => s.id === chosenStep) ?? open[0] ?? null;
  const solvedIds = new Set(session.solvedSteps().map((s) => s.id));
  const activeProgress = active ? session.stepProgress(active.id) : null;
  const hint = active ? session.currentHint(active.id) : null;

  /** Enregistre la progression et redessine l'interface. */
  function persist(): void {
    store.update((s) => withCaseProgress(s, session.progress()));
    rerender(0);
  }

  /* --------------------------------------------------------------- montage / démontage */

  useEffect(() => {
    svc.setActiveSession(session);
    if (phase === 'brief') {
      if (entry === 'boot') host.map.setCamera(overviewCamera(host.viewport()));
    } else if (phase === 'play') {
      // Reprise d'une enquête commencée : sur la dernière trouvaille (là où l'histoire s'est arrêtée),
      // ou sur le cadrage de départ si rien n'a encore été trouvé (et pour une vue d'ensemble : bonus).
      if (entry !== 'url') {
        const last = def.bonus ? null : lastFoundId(session);
        pendingFocus.current = () => {
          if (last) {
            try {
              void host.focus(entityCenter(world, last), Math.max(def.start.zoom, RESUME_ZOOM), { instant: entry === 'boot' });
              return;
            } catch {
              // cible inconnue (contenu modifié) : cadrage de départ
            }
          }
          focusStart(entry === 'boot');
        };
      }
    } else if (phase === 'end') {
      pendingFocus.current = () => fitFound(entry !== 'nav');
    }
    return () => {
      svc.setActiveSession(null);
      host.setTapHandler(null);
      host.clearLayers();
      host.setInsets(0, 0);
      window.clearTimeout(feedbackTimer.current);
    };
  }, [session]);

  // Marges de la carte : barre haute et feuille du bas (pour cadrer au-dessus du panneau).
  useLayoutEffect(() => {
    host.measureInsets(topRef.current, panelRef.current);
  });
  useEffect(() => {
    const onResize = (): void => host.measureInsets(topRef.current, panelRef.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [host]);

  // Mouvement de caméra demandé avant le dernier rendu : exécuté quand les marges sont à jour.
  useEffect(() => {
    const f = pendingFocus.current;
    pendingFocus.current = null;
    f?.();
  });

  // Overlays : recalculés après chaque rendu (donc après chaque action), jamais à chaque image.
  useEffect(() => {
    const showPlay = phase === 'play' || phase === 'end' || phase === 'replay';
    host.setLayer('found', showPlay ? foundOverlays(session, world) : []);
    host.setLayer('threads', showPlay ? threadOverlays(session) : []);
    host.setLayer('pins', phase === 'play' ? pinOverlays(session) : []);
    host.setLayer('hint', phase === 'play' && hintVisible ? hintOverlays(hint, world) : []);
    host.setLayer('select', phase === 'play' && selection ? [selectOverlay(world, selection, host.map.getCamera().zoom)] : []);
    host.setLayer('feedback', phase === 'play' ? feedback : []);
    const item = phase === 'replay' ? def.replay[replayIndex] : undefined;
    const r = item ? targetRect(world, item.id) : undefined;
    host.setLayer('replay', r ? [{ kind: 'box', rect: r, style: 'reveal' }] : []);
  });

  // Texte d'indice : redéplié à chaque nouvel indice, changement de question ou déplacement du projecteur
  // (bonus : il saute sur l'aiguille suivante après chaque trouvaille) ; replié dès que le joueur touche la
  // carte (il a lu, il cherche : on lui rend la place).
  useEffect(() => {
    setHintOpen(true);
  }, [active?.id, hint?.level, hint?.area?.x, hint?.area?.y]);
  useEffect(() => {
    const canvas = host.canvas;
    const fold = (): void => setHintOpen(false);
    canvas.addEventListener('pointerdown', fold, { passive: true });
    return () => canvas.removeEventListener('pointerdown', fold);
  }, [host]);

  // Garde anti-double tap : à chaque apparition / disparition d'une feuille, un voile transparent avale
  // les appuis pendant GUARD_MS. Sans lui, un second tap au même endroit agit sur l'interface qui vient de
  // se dévoiler dessous (ferme « Bien vu ! » sans lecture, ouvre la confirmation d'indice…).
  useEffect(() => {
    if (!guardArmed.current) {
      guardArmed.current = true; // pas de garde au montage
      return;
    }
    setGuard(true);
    window.clearTimeout(guardTimer.current);
    guardTimer.current = window.setTimeout(() => setGuard(false), GUARD_MS);
  }, [selection !== null, card?.kind, hintAsk, notebook, phase]);
  useEffect(() => () => window.clearTimeout(guardTimer.current), []);

  // Bouton Retour du système : ferme d'abord ce qui est ouvert (comme Échap), sinon l'application
  // remonte d'un écran (App.tsx).
  const backRef = useRef<() => boolean>(() => false);
  backRef.current = () => {
    if (notebook) setNotebook(false);
    else if (selection) setSelection(null);
    else if (card) {
      if (card.kind === 'solved') continueAfterCard();
      else setCard(null);
    } else if (hintAsk) setHintAsk(false);
    else if (pinMode) setPinMode(false);
    else if (miniOpen) setMiniOpen(false);
    else if (phase === 'replay') {
      setPhase('end');
      pendingFocus.current = () => fitFound(false);
    } else return false;
    return true;
  };
  useEffect(() => {
    svc.setBackHandler(() => backRef.current());
    return () => svc.setBackHandler(null);
  }, []);

  /* --------------------------------------------------------------- caméra */

  /** Cadrage de départ de l'enquête ; une vue d'ensemble (bonus) reprend celle de l'accueil, sans bandeau de « table ». */
  function focusStart(instant: boolean): void {
    if (def.start.zoom < OVERVIEW_START_ZOOM) {
      const cam = overviewCamera(host.viewport());
      if (instant) host.map.setCamera(cam);
      else void host.map.flyTo(cam);
      return;
    }
    void host.focus({ x: def.start.x, y: def.start.y }, def.start.zoom, { instant });
  }

  function fitFound(instant: boolean): void {
    if (def.bonus) {
      // Les dix aiguilles couvrent presque toute la ville : cadrer leurs bornes donnerait le zoom minimal, où le
      // monde est plus petit que l'écran (bande noire sous la barre haute). Vue d'ensemble de l'accueil à la place.
      focusStart(instant);
      return;
    }
    const b = foundBounds(session, world);
    if (b) void host.focusRect(b, { maxZoom: 2, padding: 36, instant });
    else focusStart(instant);
  }

  function showTarget(id: string): void {
    try {
      void host.focus(entityCenter(world, id), SHOW_ZOOM);
    } catch {
      // cible inconnue (contenu modifié) : on ne bouge pas
    }
  }

  /* --------------------------------------------------------------- taps sur la carte */

  const tapRef = useRef<(w: Vec2) => void>(() => {});
  tapRef.current = (w: Vec2) => {
    if (phase !== 'play' || notebook) return;
    if (card?.kind === 'solved') return;
    if (card) setCard(null);
    if (hintAsk) setHintAsk(false);
    if (pinMode) {
      session.addPin(w);
      setPinMode(false);
      vibrate('soft', settings.haptics);
      svc.toast('Punaise posée. Retrouvez-la dans le carnet.', 'info');
      persist();
      return;
    }
    const zoom = host.map.getCamera().zoom;
    // Un tap dans la zone éclairée par l'indice se désigne dès HINT_PICK_ZOOM (voir plus haut).
    const area = hint?.area;
    const inHint = !!area && hintVisible && Math.hypot(w.x - area.x, w.y - area.y) <= area.radius;
    if (zoom < (inHint ? HINT_PICK_ZOOM : PICK_MIN_ZOOM)) {
      setSelection(null);
      svc.toast('Rapprochez-vous pour désigner', 'info');
      void host.focus(w, Math.max(APPROACH_ZOOM, zoom), { duration: APPROACH_MS });
      return;
    }
    if (!active) return;
    setSelection(pickAt(world, w, zoom));
  };
  useEffect(() => {
    host.setTapHandler((w) => tapRef.current(w));
  }, [host]);

  /* --------------------------------------------------------------- désignation */

  function flash(o: Overlay, ms: number): void {
    window.clearTimeout(feedbackTimer.current);
    setFeedback([o]);
    feedbackTimer.current = window.setTimeout(() => setFeedback([]), ms);
  }

  /**
   * Question à laquelle soumettre une désignation : l'active, sauf si la cible n'est que la bonne réponse
   * d'une AUTRE question ouverte en parallèle (c04, c05) : elle compte alors pour celle-là, au lieu
   * d'être une erreur injuste. L'onglet suit.
   */
  function stepFor(pick: Pick, current: StepDef): StepDef {
    if (matchTargets(world, current.accept, pick).length > 0) return current;
    const other = session.openSteps().find((s) => s.id !== current.id && matchTargets(world, s.accept, pick).length > 0);
    return other ?? current;
  }

  function confirmPick(): void {
    const pick = selection;
    setSelection(null);
    if (!pick || !active || !session.isStepOpen(active.id)) return;
    const zoom = host.map.getCamera().zoom;
    const target = stepFor(pick, active);
    if (target.id !== active.id) setChosenStep(target.id);
    const out = session.submit(target.id, pick);
    switch (out.kind) {
      case 'correct': {
        vibrate(out.caseSolved ? 'solved' : 'found', settings.haptics);
        if (out.stepSolved) {
          const step = session.getStep(out.stepId);
          const n = session.solvedSteps().length;
          setCard({
            kind: 'solved',
            stepId: out.stepId,
            title: out.caseSolved ? 'Affaire résolue !' : SOLVED_TITLES[(n - 1) % SOLVED_TITLES.length],
            text: step.solved,
            caseSolved: out.caseSolved,
          });
        } else {
          // Bonus : le début du vers du testament rappelle laquelle des dix aiguilles vient d'être trouvée.
          const verse = verseFor(def, out.stepId, out.foundId);
          svc.toast(foundToastText(out.found, out.required, verse), 'good', verse ? 3600 : undefined);
        }
        break;
      }
      case 'near':
        flash({ kind: 'ring', circle: pickCircle(world, pick, zoom), style: 'near' }, 3500);
        setCard({ kind: 'near', text: out.feedback });
        break;
      case 'wrong': {
        flash({ kind: 'ring', circle: pickCircle(world, pick, zoom), style: 'wrong' }, 2000);
        svc.toast(wrongMessage(session.totals().mistakes), 'bad');
        break;
      }
      case 'already':
        svc.toast('Déjà trouvé', 'info');
        break;
    }
    persist();
  }

  function continueAfterCard(): void {
    const c = card;
    setCard(null);
    if (c?.kind === 'solved') {
      if (c.caseSolved) {
        setPhase('end');
        pendingFocus.current = () => fitFound(false);
      } else {
        const next = session.openSteps();
        if (next.length > 0 && !next.some((s) => s.id === chosenStep)) {
          // De préférence la suite du fil qui vient de s'ouvrir (c04 : « La tarte » après « Le voisin »), pas la
          // première question de la liste, qui appartient à l'autre fil.
          const follow = next.find((s) => stepDependencies(def, def.steps.findIndex((x) => x.id === s.id)).includes(c.stepId));
          setChosenStep((follow ?? next[0]).id);
        }
        setCollapsed(false);
      }
    }
  }

  /* --------------------------------------------------------------- indices */

  function focusHint(): void {
    if (!active) return;
    const h = session.currentHint(active.id);
    if (!h?.area) return;
    setHintVisible(true);
    void host.focusRect(circleRect(h.area), { maxZoom: h.level === 3 ? 2.6 : 2.2, padding: 20 });
  }

  function askHint(): void {
    if (!active) return;
    if (session.stepProgress(active.id).hints >= 3) {
      focusHint();
      return;
    }
    setHintAsk(true);
  }

  function confirmHint(): void {
    setHintAsk(false);
    if (!active || !session.isStepOpen(active.id)) return;
    const h = session.hint(active.id);
    setHintVisible(true);
    setCollapsed(false);
    persist();
    if (h.area)
      pendingFocus.current = () => void host.focusRect(circleRect(h.area!), { maxZoom: h.level === 3 ? 2.6 : 2.2, padding: 20 });
  }

  /* --------------------------------------------------------------- carnet, punaises */

  function openNotebook(brief = false): void {
    setNotebookBrief(brief);
    setNotebook(true);
  }

  function removePin(i: number): void {
    if (session.removePin(i)) persist();
  }

  /* --------------------------------------------------------------- briefing, fin, reconstitution */

  function startCase(): void {
    setPhase('play');
    pendingFocus.current = () => {
      if (entry === 'url') return;
      focusStart(false);
    };
  }

  useEffect(() => {
    if (phase !== 'replay') return;
    const item = def.replay[replayIndex];
    if (!item) return;
    let cancelled = false;
    let timer = 0;
    let target: Vec2;
    try {
      target = entityCenter(world, item.id);
    } catch {
      return;
    }
    void host.focus(target, SHOW_ZOOM).then(() => {
      if (cancelled || svc.reducedMotion() || replayIndex >= def.replay.length - 1) return;
      timer = window.setTimeout(() => setReplayIndex((i) => Math.min(def.replay.length - 1, i + 1)), REPLAY_AUTO_MS);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, replayIndex]);

  /* --------------------------------------------------------------- rendu */

  const marks: MinimapMark[] = useMemo(() => {
    const out: MinimapMark[] = [];
    for (const m of session.foundMarks()) {
      const r = targetRect(world, m.id);
      if (r) out.push({ at: { x: r.x + r.w / 2, y: r.y + r.h / 2 }, kind: 'found' });
    }
    for (const p of session.pins()) out.push({ at: p, kind: 'pin' });
    return out;
    // session est mutable : recalculé à chaque rendu provoqué par une action.
  }, [session, save]);

  // Étoiles : estimation actuelle, et ce qu'un indice de plus en laisserait (texte de confirmation d'indice).
  const starsNow = session.stars();
  const starsAfterHint = active
    ? computeStars(
        def.steps.map((st) => {
          const sp = session.stepProgress(st.id);
          return st.id === active.id ? { ...sp, hints: Math.min(3, sp.hints + 1) } : sp;
        }),
        def.steps.length,
      )
    : starsNow;
  const side = settings.leftHanded ? 'left' : 'right';
  const miniShown = phase === 'play' && miniOpen;
  const showChip = phase !== 'brief' && !(phase === 'play' && pinMode);
  const activeIndex = active ? def.steps.findIndex((s) => s.id === active.id) + 1 : 0;
  const totals = session.totals();

  let bottom;
  if (phase === 'brief') {
    bottom = <Briefing def={def} panelRef={panelRef} onStart={startCase} />;
  } else if (phase === 'end') {
    bottom = (
      <CaseEnd
        def={def}
        panelRef={panelRef}
        stars={session.stars()}
        hints={totals.hints}
        mistakes={totals.mistakes}
        reveals={def.steps.filter((s) => session.stepProgress(s.id).hints >= MAX_HINT_LEVEL).length}
        onReplay={() => {
          setReplayIndex(0);
          setPhase('replay');
        }}
        onLook={() => setPhase('play')}
        onExit={onExit}
        onRestart={() => svc.openCase(def.id, { restart: true })}
      />
    );
  } else if (phase === 'replay') {
    bottom = (
      <ReplayBar
        def={def}
        index={replayIndex}
        panelRef={panelRef}
        onPrev={() => setReplayIndex((i) => Math.max(0, i - 1))}
        onNext={() => setReplayIndex((i) => Math.min(def.replay.length - 1, i + 1))}
        onClose={() => {
          setPhase('end');
          pendingFocus.current = () => fitFound(false);
        }}
      />
    );
  } else {
    bottom = (
      <QuestionPanel
        def={def}
        panelRef={panelRef}
        open={open}
        active={active}
        solvedIds={solvedIds}
        activeProgress={activeProgress}
        hint={hint}
        hintVisible={hintVisible}
        hintOpen={hintOpen}
        starsNow={starsNow}
        starsAfterHint={starsAfterHint}
        collapsed={collapsed}
        hintAsk={hintAsk}
        pinMode={pinMode}
        miniOpen={miniOpen}
        covered={selection !== null || card !== null}
        onSelectStep={(id) => {
          setChosenStep(id);
          setSelection(null);
          setHintAsk(false);
        }}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onHint={askHint}
        onHintConfirm={confirmHint}
        onHintCancel={() => setHintAsk(false)}
        onHintShow={focusHint}
        onToggleHintVisible={() => setHintVisible((v) => !v)}
        onToggleHintOpen={() => setHintOpen((o) => !o)}
        onBriefing={def.bonus ? () => openNotebook(true) : undefined}
        onTogglePin={() => {
          setPinMode((m) => !m);
          setSelection(null);
        }}
        onToggleMini={() => setMiniOpen((m) => !m)}
        leftHanded={settings.leftHanded}
        onConclude={() => {
          setPhase('end');
          pendingFocus.current = () => fitFound(false);
        }}
      />
    );
  }

  return (
    <div class={`screen map-screen investigation phase-${phase}`} data-testid="screen-case" data-phase={phase}>
      {(phase === 'brief' || phase === 'end') && <div class="map-veil" aria-hidden="true" />}
      <div ref={topRef} class="top-zone">
        <div class="top-main">
          <TopBar
            title={def.title}
            subtitle={def.bonus ? 'Hors série' : `Dossier n° ${caseNumber(def)}`}
            onBack={onExit}
            backLabel="Retour aux enquêtes"
            right={
              phase === 'brief' ? undefined : (
                <button
                  type="button"
                  class="icon-btn"
                  aria-label="Ouvrir le carnet"
                  onClick={() => openNotebook()}
                  data-testid="open-notebook"
                >
                  <Icon name="notebook" />
                </button>
              )
            }
          />
          {/* Où suis-je ? Les questions citent des rues et des lieux : le nom suit la caméra. */}
          {showChip && !miniShown && <PlaceChip host={host} world={world} class="place-chip-top" />}
        </div>
        {phase === 'play' && pinMode && (
          <div class="banner" role="status" data-testid="pin-banner">
            <Icon name="pin" size={18} />
            <span>Touchez la carte pour poser une punaise.</span>
            <button type="button" class="link-btn" onClick={() => setPinMode(false)}>
              Annuler
            </button>
          </div>
        )}
        {miniShown && <Minimap host={host} marks={marks} side={side} onClose={() => setMiniOpen(false)} />}
        {showChip && miniShown && <PlaceChip host={host} world={world} class="place-chip-below" />}
      </div>

      {bottom}

      {phase === 'play' && selection && active && (
        <ConfirmSheet
          host={host}
          pick={selection}
          questionLabel={confirmLabel({
            stepCount: def.steps.length,
            index: activeIndex - 1,
            openCount: open.length,
            label: active.label,
          })}
          question={active.question}
          onConfirm={confirmPick}
          onCancel={() => setSelection(null)}
        />
      )}
      {phase === 'play' && card && !selection && <ResultSheet card={card} onContinue={continueAfterCard} />}

      {notebook && (
        <Notebook
          def={def}
          session={session}
          world={world}
          openBrief={notebookBrief}
          onClose={() => setNotebook(false)}
          onShow={(id) => {
            setNotebook(false);
            if (phase !== 'play') setPhase('play');
            pendingFocus.current = () => showTarget(id);
          }}
          onShowPin={(p) => {
            setNotebook(false);
            pendingFocus.current = () => void host.focus(p, Math.max(SHOW_ZOOM, host.map.getCamera().zoom));
          }}
          onRemovePin={removePin}
          onNotes={(t) => {
            session.setNotes(t);
            persist();
          }}
          onPinMode={() => {
            setNotebook(false);
            if (phase !== 'play') setPhase('play');
            setPinMode(true);
          }}
        />
      )}

      {guard && <div class="tap-guard" aria-hidden="true" />}
    </div>
  );
}
