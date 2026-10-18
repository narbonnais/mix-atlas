"""Normalize a bounded, browser-collected sample of the artist Supports page."""
import argparse
import json
import re
from pathlib import Path
from build_1001 import parse_snapshot, clean

ROOT = Path(__file__).resolve().parents[1]


def source_djs(raw):
    # Some names in the heading are plain text rather than artist-page links.
    # Preserve known collective names such as Above & Beyond before splitting.
    prefix = re.split(r'\s+@\s+|\s+-\s+', raw['pageTitle'], maxsplit=1)[0]
    names = list(raw['djs'])
    masked = prefix
    for i, name in enumerate(sorted(names, key=len, reverse=True)):
        masked = masked.replace(name, f'\x00{i}\x00')
    known = sorted(names, key=len, reverse=True)
    for part in masked.split(' & '):
        for i, name in enumerate(known):
            part = part.replace(f'\x00{i}\x00', name)
        name = clean(part)
        if name and name not in names:
            names.append(name)
    return names


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('snapshots', type=Path)
    ap.add_argument('--allow-partial', action='store_true')
    args = ap.parse_args()
    index = json.loads((args.snapshots/'index.json').read_text())
    sets, missing = [], []
    for item in index['sets']:
        key = item['sourceUrl'].split('/tracklist/')[1].split('/')[0]
        file = args.snapshots/(key+'.json')
        if not file.exists():
            missing.append(item['sourceUrl'])
            continue
        raw = json.loads(file.read_text())
        raw['djs'] = source_djs(raw)
        sets.append(parse_snapshot(raw, focus_dj=None))
    if missing and not args.allow_partial:
        raise SystemExit(f'Incomplete supporting-set sample: {len(sets)}/{len(index["sets"])}')
    data = {'schemaVersion':1,'collectedOn':index['collectedOn'],'sets':sets,
            'supportCollection':{'profileUrl':index['profileUrl'],'sourceCounterLabel':index['sourceCounterLabel'],
                'listedCount':index['listedCount'],'expectedNewSets':len(index['sets']),
                'importedCount':len(sets),'sampleOnly':True,'sampleComplete':not missing,
                'collectedOn':index['collectedOn']}}
    (ROOT/'collector/supports-dataset.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'sets':len(sets),'rows':sum(len(s['entries']) for s in sets),'missing':len(missing)}))


if __name__ == '__main__':
    main()
