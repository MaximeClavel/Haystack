// PROVISOIRE (phase 0) — point d'entrée remplacé par le module ui en phase 2.
import { render } from 'preact';

declare global {
  interface Window {
    __haystackReady?: boolean;
  }
}

function Placeholder() {
  return <main style={{ fontFamily: 'sans-serif', padding: 24 }}>Haystack — en construction</main>;
}

render(<Placeholder />, document.getElementById('app')!);
window.__haystackReady = true;
