"""Import dated Layer J and CVMRN browser snapshots with explicit DJ scope."""
import argparse
import json
import re
from pathlib import Path
from build_1001 import parse_snapshot
from build_supports import source_djs

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('snapshots', type=Path)
    args = parser.parse_args()
    indexes = json.loads((args.snapshots / 'index.json').read_text())['collections']
    if any(not index['windowComplete'] for index in indexes):
        raise ValueError('A requested date window is incomplete')
    incoming = []
    for index, source in [(index, source) for index in indexes for source in index['sets']]:
        key = source['sourceUrl'].split('/tracklist/')[1].split('/')[0]
        raw = json.loads((args.snapshots / (key + '.json')).read_text())
        raw['djs'] = source_djs(raw)
        item = parse_snapshot(raw, focus_dj=index['artist'] if len(raw['djs']) > 1 else None)
        # Layershow publishes the performance date in the event title and the
        # later episode/publication date at the end of the page heading.
        performance = re.search(r'\([^)]*?(\d{4}-\d{2}-\d{2})\)', raw['title'])
        if performance:
            if item['date'] != performance[1]:
                item['publishedOn'] = item['date']
            item['date'] = performance[1]
            item['dateType'] = 'performance'
        if not index['from'] <= item['date'] <= index['through']:
            raise ValueError('Source outside requested period: ' + item['sourceUrl'])
        incoming.append(item)
    data = json.loads((ROOT / 'dist/dataset.json').read_text())
    by_url = {s['sourceUrl']: s for s in data['sets']}
    new_urls = [s['sourceUrl'] for s in incoming if s['sourceUrl'] not in by_url]
    for item in incoming:
        previous = by_url.get(item['sourceUrl'], {})
        item['sourceAliases'] = list(dict.fromkeys(previous.get('sourceAliases', []) + item.get('sourceAliases', [])))
        if not item['mediaUrl'] and previous.get('mediaUrl'):
            item['mediaUrl'] = previous['mediaUrl']
        by_url[item['sourceUrl']] = item
    coverages = []
    for index in indexes:
        coverage = {k: index[k] for k in ['artist', 'profileUrl', 'collectedOn', 'from', 'through', 'advertisedCount', 'indexedOnFirstPage', 'windowComplete']}
        coverage.update(recentSources=len(index['sets']), importedCount=len(index['sets']))
        coverages.append(coverage)
    artists = [index['artist'] for index in indexes]
    collections = [c for c in data.get('artistCollections', []) if c.get('artist', c.get('dj')) not in artists]
    data.update(sets=list(by_url.values()), artistCollections=collections + coverages)
    additional = {'schemaVersion': 1, 'collectedOn': indexes[0]['collectedOn'], 'replaceExistingSources': True,
                  'sets': incoming, 'artistCollections': coverages}
    for path, payload in [('dist/dataset.json', data), ('collector/recent-djs-dataset.json', additional)]:
        (ROOT / path).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'dist/data.mjs').write_text('export const SEED = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
    route = ROOT / 'dist/route.mjs'
    text = route.read_text()
    match = re.search(r'export const FOCUS_DJS = (\[[^;]+\]);', text)
    names = json.loads(match[1])
    for artist in artists:
        if artist not in names:
            names.append(artist)
    route.write_text(text[:match.start(1)] + json.dumps(names, ensure_ascii=False) + text[match.end(1):])
    print(json.dumps({'newSets': len(new_urls), 'sources': len(incoming), 'entries': sum(len(s['entries']) for s in incoming), 'totalSets': len(data['sets'])}))


if __name__ == '__main__':
    main()
