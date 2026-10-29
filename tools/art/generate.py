#!/usr/bin/env python3
"""Génération d'images de direction artistique via l'API Gemini (modèles d'image « Nano Banana »).

Usage :
  python3 tools/art/generate.py --list
  python3 tools/art/generate.py --only s2-diorama [--refs] [--n 2] [--model gemini-2.5-flash-image]
  python3 tools/art/generate.py --all [--refs]

Lit la clé dans la variable d'environnement GEMINI_API_KEY (jamais dans un fichier du dépôt).
Les images sont écrites dans .shots/art/<job>-<n>.png (dossier ignoré par git).
Avec --refs, l'image de référence du style est jointe à la requête (ambiance et palette seulement).
Aucune dépendance : bibliothèque standard Python uniquement.
"""
import argparse, base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
API = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'


def load_jobs():
    data = json.loads((HERE / 'jobs.json').read_text(encoding='utf-8'))
    jobs = {}
    for style in data['styles']:
        for asset_id, asset in data['assets'].items():
            jid = f"{style['id']}-{asset_id}"
            prompt = '\n\n'.join([data['common'], asset['prompt'], 'ART STYLE: ' + style['style']])
            jobs[jid] = dict(prompt=prompt, ref=style.get('ref'), aspect=asset.get('aspect', '1:1'))
    return jobs


def call(model, key, prompt, ref, aspect):
    parts = [{'text': prompt}]
    if ref:
        raw = (HERE / ref).read_bytes()
        parts.append({'text': 'Reference image for mood, palette and rendering technique only. Do not copy its content, characters or composition.'})
        parts.append({'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(raw).decode()}})
    body = {
        'contents': [{'parts': parts}],
        'generationConfig': {'responseModalities': ['IMAGE', 'TEXT'], 'imageConfig': {'aspectRatio': aspect}},
    }
    req = urllib.request.Request(API.format(model=model), data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read())


def save_images(resp, out_base):
    saved = []
    for cand in resp.get('candidates', []):
        for part in cand.get('content', {}).get('parts', []):
            blob = part.get('inlineData') or part.get('inline_data')
            if blob and blob.get('data'):
                path = out_base.with_name(f'{out_base.name}-{len(saved) + 1}.png')
                path.write_bytes(base64.b64decode(blob['data']))
                saved.append(path)
            elif part.get('text'):
                print('  texte du modèle :', part['text'][:200].replace('\n', ' '))
    return saved


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--only', nargs='*', default=[])
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--refs', action='store_true', help="joindre l'image de référence du style")
    ap.add_argument('--n', type=int, default=1, help='variantes par job')
    ap.add_argument('--model', default='gemini-2.5-flash-image')
    ap.add_argument('--out', default=str(ROOT / '.shots' / 'art'))
    a = ap.parse_args()
    jobs = load_jobs()
    if a.list:
        print('\n'.join(jobs)); return
    todo = list(jobs) if a.all else a.only
    if not todo:
        ap.error('préciser --only <job> ou --all (voir --list)')
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        sys.exit('GEMINI_API_KEY absente : ajoutez-la dans les réglages de l’environnement (voir tools/art/README.md).')
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    for jid in todo:
        if jid not in jobs:
            print('job inconnu :', jid); continue
        j = jobs[jid]
        for i in range(a.n):
            print(f'→ {jid} ({i + 1}/{a.n})')
            try:
                resp = call(a.model, key, j['prompt'], j['ref'] if a.refs else None, j['aspect'])
            except urllib.error.HTTPError as e:
                print('  erreur HTTP', e.code, e.read()[:300].decode(errors='replace')); continue
            paths = save_images(resp, out / f'{jid}-v{i + 1}')
            print('  ', ', '.join(str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p) for p in paths) or 'aucune image renvoyée')
            time.sleep(1)


if __name__ == '__main__':
    main()
