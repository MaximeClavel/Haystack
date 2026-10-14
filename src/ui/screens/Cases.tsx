// Dossiers : la liste des enquêtes, façon chemises cartonnées, et le bonus à part.
import type { CaseDef } from '../../types';
import { isUnlocked } from '../../game';
import { useServices } from '../context';
import { useSave } from '../store';
import { Difficulty, Stars, TopBar } from '../components/bits';
import { Icon } from '../icons';
import { caseNumber, caseStatus, lockReason } from '../format';
import type { SaveData } from '../../types';

function Folder({ def, save, cases, onOpen }: { def: CaseDef; save: SaveData; cases: CaseDef[]; onOpen: () => void }) {
  const unlocked = isUnlocked(def, save);
  const st = caseStatus(def, save);
  const num = caseNumber(def);
  const tutorial = def.id === 'c00';
  let stamp: preact.JSX.Element;
  if (!unlocked) {
    stamp = (
      <span class="stamp stamp-locked">
        <Icon name="lock" size={16} /> Verrouillé
      </span>
    );
  } else if (st.kind === 'solved') {
    stamp = <span class="stamp stamp-solved">Résolu</span>;
  } else if (st.kind === 'active') {
    stamp = (
      <span class="stamp stamp-active">
        En cours {st.solvedSteps}/{st.totalSteps}
      </span>
    );
  } else {
    stamp = <span class="stamp stamp-new">Nouveau</span>;
  }
  const label = unlocked
    ? `Dossier ${num} : ${def.title}`
    : `Dossier ${num} : ${def.title} (verrouillé). ${lockReason(def, save, cases)}`;
  return (
    <li class={`folder ${unlocked ? '' : 'locked'} ${def.bonus ? 'bonus' : ''} ${st.kind}`}>
      <button
        type="button"
        class="folder-btn"
        onClick={unlocked ? onOpen : undefined}
        aria-disabled={!unlocked}
        aria-label={label}
        data-testid={`folder-${def.id}`}
      >
        <span class="folder-tab" aria-hidden="true">
          {def.bonus ? 'Bonus' : `N° ${num}`}
        </span>
        <span class="folder-body">
          <span class="folder-head">
            <span class="folder-title">{def.title}</span>
            {stamp}
          </span>
          <span class="folder-meta">
            <Difficulty level={def.difficulty} />
            {tutorial && <span class="folder-tag">Tutoriel</span>}
            {st.kind === 'solved' && st.stars && <Stars count={st.stars} size={16} />}
          </span>
          <span class="folder-teaser">{unlocked ? def.teaser : lockReason(def, save, cases)}</span>
        </span>
      </button>
    </li>
  );
}

export function Cases({ onBack }: { onBack: () => void }) {
  const { store, cases, openCase } = useServices();
  const save = useSave(store);
  const main = cases.filter((c) => !c.bonus);
  const bonus = cases.filter((c) => c.bonus);
  const solved = main.filter((c) => save.cases[c.id]?.status === 'solved').length;
  return (
    <div class="screen sheet-screen cases" data-testid="screen-cases">
      <TopBar
        title="Dossiers"
        subtitle={`${solved} affaire${solved > 1 ? 's' : ''} classée${solved > 1 ? 's' : ''} sur ${main.length}`}
        onBack={onBack}
        backLabel="Retour à l'accueil"
      />
      <div class="scroll">
        <ul class="folders" aria-label="Enquêtes">
          {main.map((c) => (
            <Folder key={c.id} def={c} save={save} cases={cases} onOpen={() => openCase(c.id)} />
          ))}
        </ul>
        {bonus.length > 0 && (
          <section class="bonus-section" aria-labelledby="bonus-h">
            <h2 id="bonus-h" class="section-title">
              Hors série
            </h2>
            <ul class="folders" aria-label="Bonus">
              {bonus.map((c) => (
                <Folder key={c.id} def={c} save={save} cases={cases} onOpen={() => openCase(c.id)} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
