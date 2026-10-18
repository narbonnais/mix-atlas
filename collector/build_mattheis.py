"""Normalize the public MixesDB rows and verified SoundCloud recordings.

Inputs were read from the rendered pages. This script makes no network requests.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEDIA = {
    '2022-04-20': 'https://soundcloud.com/openlabradio/observatory-030-sungate-with-mattheis-hakk',
    '2022-05-06': 'https://soundcloud.com/mattheis/mattheis-08-operator-radio-0605',
    '2022-08-04': 'https://soundcloud.com/future-intel/mattheis-future-intel-04-08-2022',
    '2022-09-09': 'https://soundcloud.com/draaimolen/mattheis-live-at-draaimolen-festival-2022',
}


def normalize(raw):
    date = raw['pageTitle'][:10]
    entries = []
    excluded = 0
    for group in raw['groups']:
        if group['performer'] and group['performer'] != 'Mattheis':
            excluded += len(group['rows'])
            continue
        for row in group['rows']:
            line = re.sub(r'\s+', ' ', row['text']).strip()
            match = re.fullmatch(r'\[(\d+)\]\s*(.*)', line)
            if not match:
                raise ValueError('Unexpected row: ' + line)
            title = re.sub(r'\s*\[[^\]]*\]\s*$', '', match[2]).strip()
            if title == '?':
                artist, title, status = 'ID', 'ID', 'unresolved'
            else:
                artist, title = title.split(' - ', 1)
                status = 'identified'
            entries.append({'position':row['position'], 'sourcePosition':str(row['position']),
                            'artist':artist,'title':title,'status':status,'layer':'main',
                            'timeSeconds':int(match[1])*60,'performers':['Mattheis']})
    if not entries:
        raise ValueError('No rows for Mattheis: ' + raw['url'])
    duration = re.search(r'\b(\d+):(\d{2}):(\d{2})\b', '\n'.join(raw['fileDetails']))
    return {'title':raw['pageTitle'][13:], 'djs':['Mattheis','Hakk'] if excluded else ['Mattheis'],
            'date':date,'dateType':'source','sourceUrl':raw['url'],'sourceName':'MixesDB',
            'mediaUrl':MEDIA[date],'coverage':'published','collectedOn':raw['collectedOn'],
            'durationSeconds':sum(int(n)*60**i for i,n in enumerate(reversed(duration.groups()))) if duration else None,
            'scopeNote':'Seule la section Mattheis de cette émission est importée. La section Hakk commence à 57 minutes.' if excluded else None,
            'accuracyNote':'Repères publiés à la minute, approximatifs. Tracklist incomplète ; les IDs interrompent les transitions.',
            'excludedOtherDjRows':excluded,'entries':entries}


def main():
    raw = json.loads((ROOT/'collector/mattheis-tracklists.json').read_text())
    sets = sorted((normalize(r) for r in raw), key=lambda s:s['date'], reverse=True)
    recordings = json.loads((ROOT/'collector/mattheis-recordings.json').read_text())
    data = {'schemaVersion':1,'collectedOn':'2026-10-18','sets':sets,'recordings':recordings}
    (ROOT/'collector/mattheis-dataset.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'sets':len(sets),'rows':sum(len(s['entries']) for s in sets),
                      'recordingsWithoutTracklist':len(recordings)}))


if __name__ == '__main__':
    main()
