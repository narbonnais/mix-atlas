"""Build a reviewed batch from browser-read 1001Tracklists snapshots.

Danny Howells: published sources dated 2025–2026. Stereodrama: every source
listed for the exact Aubrey Fry & Nick Stoynoff remix, not other versions.
"""
import argparse
import json
from pathlib import Path
from build_1001 import parse_snapshot
from build_supports import source_djs

ROOT = Path(__file__).resolve().parents[1]


def build(snapshots):
    index = json.loads((snapshots / 'index.json').read_text())
    if not index['danny']['windowComplete'] or not index['track']['indexComplete']:
        raise ValueError('Source index is incomplete')
    sets = []
    missing = []
    target_sources = set(index['track']['sources'])
    for source in index['queue']:
        key = source['sourceUrl'].split('/tracklist/')[1].split('/')[0]
        file = snapshots / (key + '.json')
        if not file.exists():
            missing.append(source['sourceUrl'])
            continue
        raw = json.loads(file.read_text())
        raw['djs'] = source_djs(raw)
        # Broadcasts are preserved in full, with explicit performer boundaries.
        # Shared names do not imply that an individual selected every record.
        item = parse_snapshot(raw, focus_dj=None)
        if item['sourceUrl'] in target_sources:
            matches = [e for e in item['entries'] if e['trackId'] == index['track']['trackId']]
            if not matches:
                raise ValueError('Requested remix absent from source: ' + item['sourceUrl'])
            if any('Stereodrama' not in e['title'] or 'Aubrey Fry' not in e['title'] or 'Nick Stoynoff' not in e['title'] for e in matches):
                raise ValueError('Remix credit mismatch: ' + item['sourceUrl'])
        sets.append(item)
    if missing:
        raise ValueError('Missing snapshots: ' + str(len(missing)))
    coverage = {k: v for k, v in index.items() if k != 'queue'}
    coverage.update(importedSources=len(sets), entries=sum(len(s['entries']) for s in sets), pendingSources=[])
    return {'schemaVersion': 1, 'collectedOn': index['collectedOn'],
            'replaceExistingSources': True, 'sets': sets}, coverage


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('snapshots', type=Path)
    args = parser.parse_args()
    data, coverage = build(args.snapshots)
    (ROOT / 'collector/howells-stereodrama-dataset.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'collector/howells-stereodrama-coverage.json').write_text(json.dumps(coverage, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'sources': len(data['sets']), 'entries': coverage['entries']}))


if __name__ == '__main__':
    main()
