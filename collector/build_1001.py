"""Build the graph from DOM snapshots collected through the user's browser.

No HTTP requests, cookies, tokens, or hidden application state are used here.
"""
import argparse
from publish import prepare_site
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALIASES = {
    '2831b40t': 'https://watchthedj.com/djvideos/jeremy-olander-live-at-vivrant-x-city-hall-in-stockholm-2022',
    '2l5lq5vt': 'https://watchthedj.com/djvideos/jeremy-olander-live-at-vivrant-at-sea-sydney-australia-2020',
    '2385r6n9': 'https://watchthedj.com/djvideos/yotto-b2b-jeremy-olander-live-at-anjunadeep-open-air-london-2019',
}


def clean(value):
    return re.sub(r'\s+', ' ', value or '').strip().replace('( ', '(').replace(' )', ')')


def cue_seconds(value):
    if not value:
        return None
    parts = value.split(':')
    if not 2 <= len(parts) <= 3 or any(not p.isdigit() for p in parts) or any(int(p) > 59 for p in parts[1:]):
        raise ValueError('Invalid cue: ' + value)
    return sum(int(v)*60**i for i,v in enumerate(reversed(parts)))


def parse_snapshot(raw, focus_dj='Jeremy Olander'):
    set_id = raw['sourceUrl'].split('/tracklist/')[1].split('/')[0]
    djs = raw['djs']
    labels = [r.get('sectionLabel', '') for r in raw['rows'] if r.get('sectionLabel')]
    has_sections = bool(labels) and (not focus_dj or len(djs)>1 or any(focus_dj.lower() not in label.lower() for label in labels))
    entries = []
    previous_number = None
    position = 0
    prior_section = None
    excluded = 0
    for row in raw['rows']:
        full_name = clean(row['name'] or row['track'])
        pair = re.split(r'\s+-\s+', full_name, maxsplit=1)
        if len(pair) != 2:
            raise ValueError('Unrecognized row: ' + full_name)
        artist, title = pair
        printed = row['position'].strip()
        overlay = not bool(re.fullmatch(r'\d+', printed))
        section = row.get('sectionLabel', '')
        performers = [dj for dj in djs if dj.lower() in section.lower()] if section else []
        # A broadcast can contain other DJs' sets. Import only rows explicitly
        # credited to Jeremy when the page provides performer sections.
        include = not focus_dj or not has_sections or focus_dj in performers
        number = int(printed) if not overlay else None
        boundary = False
        if not overlay:
            if previous_number is None:
                position = number
            elif number > previous_number:
                position += number-previous_number
            else:
                position += 1
                boundary = True
            previous_number = number
            if entries and prior_section is not None and section != prior_section and sorted(performers) != sorted(entries[-1].get('performers', [])):
                boundary = True
            prior_section = section
        if not include:
            excluded += 1
            continue
        if not position:
            raise ValueError('Overlay without a main position')
        track_id = row.get('trackId')
        if not track_id and row.get('trackUrl'):
            match = re.match(r'/track/([a-z0-9]+)/', row['trackUrl'])
            track_id = match[1] if match else None
        if track_id and not re.fullmatch(r'[a-z0-9]{4,}', track_id):
            track_id = None
        status = 'unresolved' if re.search(r'\bID\b|\bWorking Title\b', full_name, re.I) or any(re.fullmatch(r'\?+', part.strip()) for part in pair) else 'identified'
        entry = {
            'position':position, 'sourcePosition':printed or 'w/', 'artist':artist,
            'title':title, 'timeSeconds':cue_seconds(row['cue']),
            'layer':'overlay' if overlay else 'main', 'status':status,
            'trackId':'1001:'+track_id if track_id else None,
            'sourceIdentified':row.get('isIded') == 'true',
            'genre':row.get('genre'), 'performers':performers,
            'breakBefore':bool(boundary or (has_sections and not entries)),
        }
        entries.append(entry)
    if not entries:
        raise ValueError('No rows attributable to ' + str(focus_dj))
    # Retain published ordering, but never offer a backwards cue as a reliable
    # listening location. Keep its original value for review without guessing.
    previous_cue = None
    inconsistent_cues = 0
    for entry in entries:
        if entry['layer'] != 'main':
            continue
        if entry['breakBefore']:
            previous_cue = None
        cue = entry['timeSeconds']
        if cue is None:
            continue
        if previous_cue is not None and cue < previous_cue:
            entry['sourceTimeSeconds'] = cue
            entry['timeSeconds'] = None
            inconsistent_cues += 1
        else:
            previous_cue = cue
    date = re.search(r'^\d{4}-\d{2}-\d{2}$', raw['summary'], re.M)
    total = re.search(r'(?:all\s*)?\d*\s*/\s*(\d+)', raw['summary'])
    ided = re.search(r'\bIDed\s+(all|\d+)\s*/\s*(\d+)', raw['infoText'], re.I)
    media = None
    for url in raw['media']:
        youtube = re.search(r'youtube(?:-nocookie)?\.com/embed/([\w-]+)', url)
        if youtube:
            media = 'https://www.youtube.com/watch?v=' + youtube[1]
            break
    if not media:
        media = next((u for u in raw['media'] if u.startswith('https://w.soundcloud.com/player/')), None)
    if excluded or (not focus_dj and has_sections and len(djs)>1):
        # The selected player may correspond to another DJ's portion. Open the
        # source instead of assigning that audio to Jeremy without evidence.
        media = None
    duration = re.search(r' Duration (.+?) Short link', raw['infoText'])
    duration_seconds = None
    if duration:
        duration_seconds = sum(int(n)*{'hour':3600,'minute':60,'second':1}[unit.rstrip('s')]
                               for n,unit in re.findall(r'(\d+) (hours?|minutes?|seconds?)', duration[1]))
    return {
        'id':set_id, 'sourceTracklistId':'1001:'+set_id,
        'title':raw['title'], 'djs':djs, 'date':date[0] if date else None,
        'dateType':'source', 'sourceUrl':raw['sourceUrl'], 'mediaUrl':media,
        'sourceName':'1001Tracklists', 'sourceAliases':[ALIASES[set_id]] if set_id in ALIASES else [],
        'coverage':'published', 'collectedOn':raw['collectedOn'], 'entries':entries,
        'durationSeconds':duration_seconds,
        'sourceTotalPositions':int(ided[2]) if ided else int(total[1]) if total else None,
        'sourceExtractedRows':len(raw['rows']), 'excludedOtherDjRows':excluded,
        'sourceIdentifiedPositions':(int(ided[2]) if ided[1].lower()=='all' else int(ided[1])) if ided else sum(r.get('isIded') == 'true' and r['position'].isdigit() for r in raw['rows']),
        'scopeNote':f'Seules les positions explicitement attribuées à {focus_dj} sont importées.' if excluded else None,
        'accuracyNote':f'{inconsistent_cues} repère(s) temporel(s) incohérent(s) écarté(s). L’ordre publié est conservé ; les valeurs originales restent dans l’export.' if inconsistent_cues else None,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('snapshots', type=Path)
    ap.add_argument('--allow-partial', action='store_true')
    ap.add_argument('--additional', type=Path, action='append', default=[], help='Additional independently collected sets and recordings; repeat for each collection')
    ap.add_argument('--supports', type=Path, help='Additional supporting sets and sample coverage')
    args = ap.parse_args()
    index = json.loads((args.snapshots / 'index.json').read_text())
    imported, missing = [], []
    for item in index['sets']:
        set_id = item['sourceUrl'].split('/tracklist/')[1].split('/')[0]
        file = args.snapshots / (set_id+'.json')
        if not file.exists():
            missing.append(item['sourceUrl'])
            continue
        imported.append(parse_snapshot(json.loads(file.read_text())))
    if missing and not args.allow_partial:
        raise SystemExit(f'Collection incomplete: {len(imported)}/{len(index["sets"])}')
    original = json.loads((ROOT / 'collector/initial-dataset.json').read_text())
    mirrors = {url for s in imported for url in s['sourceAliases']}
    retained = [s for s in original['sets'] if s['sourceUrl'] not in mirrors]
    dataset = {'schemaVersion':1, 'artists':json.loads((ROOT / 'dist/dataset.json').read_text()).get('artists', []), 'collectedOn':index['collectedOn'],
               'collection':{'provider':'1001Tracklists','profileUrl':index['profileUrl'],
                             'advertisedCount':index['advertisedCount'], 'indexedCount':len(index['sets']),
                             'importedCount':len(imported), 'indexComplete':index['listComplete'],
                             'detailsComplete':not missing,'missing':missing},
               'sets':imported+retained}
    for additional_path in args.additional:
        additional = json.loads(additional_path.read_text())
        existing_urls = {s['sourceUrl'] for s in dataset['sets']}
        if additional.get('replaceExistingSources'):
            replacements = {s['sourceUrl']: s for s in additional.get('sets', [])}
            dataset['sets'] = [replacements.pop(s['sourceUrl'], s) for s in dataset['sets']]
            dataset['sets'].extend(replacements.values())
        else:
            dataset['sets'].extend(s for s in additional.get('sets', []) if s['sourceUrl'] not in existing_urls)
        if additional.get('producerCollection'):
            dataset['producerCollection'] = additional['producerCollection']
        recordings = {r['sourceUrl']: r for r in dataset.get('recordings', [])}
        recordings.update({r['sourceUrl']: r for r in additional.get('recordings', [])})
        dataset['recordings'] = list(recordings.values())
        dataset.setdefault('artistCollections', []).extend(additional.get('artistCollections', []))
    if args.supports:
        supports = json.loads(args.supports.read_text())
        existing_urls = {s['sourceUrl'] for s in dataset['sets']}
        dataset['sets'].extend(s for s in supports.get('sets', []) if s['sourceUrl'] not in existing_urls)
        dataset['supportCollection'] = supports.get('supportCollection')
    serialized = json.dumps(dataset, ensure_ascii=False, indent=2)
    (ROOT / 'dist/dataset.json').write_text(serialized+'\n')
    prepare_site(ROOT)
    print(json.dumps({'imported':len(imported),'expected':len(index['sets']),
                      'rows':sum(len(s['entries']) for s in imported),
                      'excludedOtherDjRows':sum(s['excludedOtherDjRows'] for s in imported)}))


if __name__ == '__main__':
    main()
