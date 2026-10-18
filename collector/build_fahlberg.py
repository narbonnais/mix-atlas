"""Normalize the recent Fahlberg tracklists read in the user's browser."""
import argparse
import json
from pathlib import Path
from build_1001 import parse_snapshot

ROOT = Path(__file__).resolve().parents[1]
RECENT_IDS = ['2ht55tsk', '1pp4v34k', 'm5hq4k9', 'rtxchr1']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('snapshots', type=Path)
    args = parser.parse_args()
    index = json.loads((args.snapshots / 'index.json').read_text())
    sets = []
    for key in RECENT_IDS:
        raw = json.loads((args.snapshots / (key + '.json')).read_text())
        # Bar15 is already imported through Jeremy's catalogue. Its explicit
        # performer sections are scoped per DJ by seedSets; never duplicate it.
        if key == '1pp4v34k':
            assert any('Fahlberg' in row.get('sectionLabel', '') for row in raw['rows'])
            continue
        item = parse_snapshot(raw, focus_dj='Fahlberg')
        if key == 'm5hq4k9':
            item.update(date='2025-05-24', dateType='performance', publishedOn='2025-07-03',
                        accuracyNote='Live enregistré le 24 mai 2025 à Green Valley ; publié le 3 juillet 2025. Les 4 IDs restent non identifiés. L’acappella est une superposition.')
            item['sourceAliases'] = [
                'https://www.youtube.com/watch?v=JSSYPYL8OsU',
                'https://www.mixcloud.com/1001Tracklists/fahlberg-live-green-valley-road-to-tomorrowland-brasil/',
            ]
        sets.append(item)
    collection = {'dj': 'Fahlberg', 'profileUrl': index['profileUrl'],
                  'collectedOn': index['collectedOn'], 'advertisedCount': index['advertisedCount'],
                  'indexedCount': len(index['sets']), 'indexComplete': index['listComplete'],
                  'scope': '2024-01-01 onward', 'recentSourceCount': len(RECENT_IDS),
                  'newSets': len(sets), 'alreadyPresent': ['1001:1pp4v34k']}
    result = {'schemaVersion': 1, 'collectedOn': index['collectedOn'],
              'sets': sets, 'artistCollections': [collection]}
    (ROOT / 'collector/fahlberg-dataset.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'newSets': len(sets), 'rows': sum(len(s['entries']) for s in sets)}))


if __name__ == '__main__':
    main()
