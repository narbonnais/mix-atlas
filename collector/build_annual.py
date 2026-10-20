"""Merge a dated, browser-read collection without disturbing existing imports.

The source eligibility list records original tracks from Jeremy's 2026 sets.
The selected producers' mixes keep their full published sequences, including
remixes; eligibility is a producer filter, never a filter on sequence rows.
"""
import argparse
from publish import prepare_site
import json
import re
from pathlib import Path
from build_1001 import parse_snapshot
from build_supports import source_djs

ROOT = Path(__file__).resolve().parents[1]
FROM, THROUGH = '2025-10-18', '2026-10-18'


def original_track(artist, title, status='identified', layer='main'):
    if status != 'identified' or layer != 'main':
        return False
    if re.search(r'jeremy olander|dhillon', artist + ' ' + title, re.I):
        return False
    if re.search(r'\b(remix|edit|rework|bootleg|mashup|acappella|dub)\b', title, re.I):
        return False
    return all(re.fullmatch(r'(?:Original(?: Club)?|Extended|Club) Mix', suffix.strip(), re.I)
               for suffix in re.findall(r'\(([^)]*)\)', title))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('snapshots', type=Path)
    args = parser.parse_args()
    raw_dir = args.snapshots
    index = json.loads((raw_dir / 'jeremy-index.json').read_text())
    jeremy_urls = {s['sourceUrl'] for s in index['sets']}
    incoming = []
    for path in sorted(raw_dir.glob('*.json')):
        raw = json.loads(path.read_text())
        if not isinstance(raw, dict) or 'rows' not in raw or not raw.get('sourceUrl'):
            continue
        focus = 'Jeremy Olander' if raw['sourceUrl'] in jeremy_urls else None
        raw['djs'] = source_djs(raw)
        item = parse_snapshot(raw, focus_dj=focus)
        item['sourceAliases'] = list(dict.fromkeys([*item.get('sourceAliases', []), *raw.get('sourceAliases', [])]))
        if raw.get('publishedOn'):
            item['publishedOn'] = raw['publishedOn']
        if raw.get('publicationNote'):
            item['accuracyNote'] = ' '.join(filter(None, [item.get('accuracyNote'), raw['publicationNote']]))
        if raw['sourceUrl'] not in jeremy_urls and not FROM <= (item['date'] or '') <= THROUGH:
            raise ValueError('Source outside requested year: ' + item['sourceUrl'])
        incoming.append(item)
    supplementary = raw_dir / 'normalized-alternatives.json'
    if supplementary.exists():
        incoming.extend(json.loads(supplementary.read_text())['sets'])
    data_path = ROOT / 'dist/dataset.json'
    data = json.loads(data_path.read_text())
    before = {s['sourceUrl']: s for s in data['sets']}
    sets = dict(before)
    for item in incoming:
        prior=before.get(item['sourceUrl'])
        if prior and prior.get('mediaUrl') and not item.get('mediaUrl') and not item.get('scopeNote'):
            # A lazy player may not have instantiated during the DOM snapshot.
            # Keep an already verified recording rather than erase that link.
            item['mediaUrl']=prior['mediaUrl']
        # A canonical 1001 source replaces any explicitly reconciled mirror.
        for alias in item.get('sourceAliases', []):
            sets.pop(alias, None)
        existing = next((s for s in sets.values() if item['sourceUrl'] in s.get('sourceAliases', [])), None)
        if existing:
            continue
        sets[item['sourceUrl']] = item
    data['sets'] = list(sets.values())
    targets = json.loads((raw_dir / 'producer-targets.json').read_text())
    profiles = json.loads((raw_dir / 'profiles.json').read_text())
    candidate_urls = {s['sourceUrl'] for p in profiles for s in p.get('items', [])
                      if FROM <= (s.get('date') or '') <= THROUGH}
    reconciled = {url for s in sets.values() for url in [s['sourceUrl'], *s.get('sourceAliases', [])]}
    coverage = {'from': FROM, 'through': THROUGH, 'olanderYear': 2026,
                'collectedOn': THROUGH, 'olanderSourcesChecked': len(index['sets']),
                'newOlanderSources': len(jeremy_urls - before.keys()),
                'targetProfiles': len(targets['targets']), 'profilesChecked': len(profiles),
                'candidateSources': len(candidate_urls),
                'importedCandidateSources': len(candidate_urls & reconciled),
                'pendingSources': sorted(candidate_urls - reconciled),
                'policy': targets['policy'], 'withoutProfile': targets['withoutProfile'],
                'profiles': [{'artist': p.get('title', '').replace('Tracklists By ', ''),
                              'url': p.get('url'), 'advertisedCount': p.get('total'),
                              'windowComplete': bool(p.get('items') and p['items'][-1].get('date', '') < FROM)
                              or len(p.get('items', [])) >= int(p.get('total') or 0),
                              'recentSources': len([s for s in p.get('items', []) if FROM <= (s.get('date') or '') <= THROUGH])}
                             for p in profiles]}
    data['producerCollection'] = coverage
    serialized = json.dumps(data, ensure_ascii=False, indent=2)
    data_path.write_text(serialized + '\n')
    (ROOT / 'collector/annual-dataset.json').write_text(json.dumps({
        'schemaVersion': 1, 'collectedOn': THROUGH, 'sets': incoming,
        'replaceExistingSources': True, 'producerCollection': coverage}, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'collector/annual-coverage.json').write_text(json.dumps(coverage, ensure_ascii=False, indent=2) + '\n')
    prepare_site(ROOT)
    print(json.dumps({'incoming': len(incoming), 'newSets': len(sets.keys() - before.keys()),
                      'totalSets': len(sets), 'pending': len(coverage['pendingSources'])}))


if __name__ == '__main__':
    main()
