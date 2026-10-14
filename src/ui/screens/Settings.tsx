// Réglages : vibrations, mode gaucher, mouvement réduit, réinitialisation de la progression.
import { useState } from 'preact/hooks';
import { useServices } from '../context';
import { useSave } from '../store';
import { Switch, TopBar } from '../components/bits';

export function SettingsScreen({ onBack, systemReduced }: { onBack: () => void; systemReduced: boolean }) {
  const { store, toast } = useServices();
  const save = useSave(store);
  const s = save.settings;
  const [askReset, setAskReset] = useState(false);
  const canVibrate =
    typeof navigator !== 'undefined' && typeof (navigator as Navigator & { vibrate?: unknown }).vibrate === 'function';
  const started = Object.keys(save.cases).length > 0;

  return (
    <div class="screen sheet-screen settings" data-testid="screen-settings">
      <TopBar title="Réglages" onBack={onBack} backLabel="Retour à l'accueil" />
      <div class="scroll">
        <div class="card-list">
          <Switch
            id="set-haptics"
            label="Vibrations"
            description="Une courte vibration quand vous trouvez une réponse."
            note={canVibrate ? undefined : 'Cet appareil ne vibre pas (iPhone, ordinateur).'}
            checked={s.haptics}
            onChange={(v) => store.setSettings({ haptics: v })}
          />
          <Switch
            id="set-left"
            label="Mode gaucher"
            description="Les boutons d’action et la minicarte passent à gauche."
            checked={s.leftHanded}
            onChange={(v) => store.setSettings({ leftHanded: v })}
          />
          <Switch
            id="set-motion"
            label="Mouvement réduit"
            description="Déplacements instantanés, sans animation."
            note={systemReduced ? 'Votre appareil demande déjà moins d’animations : elles restent réduites.' : undefined}
            checked={s.reducedMotion}
            onChange={(v) => store.setSettings({ reducedMotion: v })}
          />
        </div>

        <section class="danger-zone" aria-labelledby="reset-h">
          <h2 id="reset-h" class="section-title">
            Progression
          </h2>
          <p class="setting-desc">
            {store.isPersistent()
              ? 'Votre progression est gardée dans ce navigateur, sur cet appareil.'
              : 'Ce navigateur ne garde rien (navigation privée ?) : la progression sera perdue en fermant la page.'}
          </p>
          {askReset ? (
            <div class="inline-confirm-box" role="group" aria-labelledby="reset-q">
              <p id="reset-q">Effacer toutes les enquêtes, étoiles, notes et punaises ? C’est définitif.</p>
              <div class="btn-row">
                <button type="button" class="btn btn-paper" onClick={() => setAskReset(false)}>
                  Annuler
                </button>
                <button
                  type="button"
                  class="btn btn-danger"
                  onClick={() => {
                    store.resetProgress();
                    setAskReset(false);
                    toast('Progression réinitialisée', 'info');
                  }}
                  data-testid="reset-confirm"
                >
                  Tout effacer
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              class="btn btn-danger-outline"
              onClick={() => setAskReset(true)}
              disabled={!started}
              data-testid="reset"
            >
              Réinitialiser la progression
            </button>
          )}
        </section>
        <p class="about">Haystack · enquêtes à Meulebourg · un jeu entre amis</p>
      </div>
    </div>
  );
}
