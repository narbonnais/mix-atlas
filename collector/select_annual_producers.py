"""Record why each producer qualifies from Jeremy's refreshed 2026 tracklists."""
import argparse
import json
from pathlib import Path
from build_1001 import parse_snapshot
from build_annual import original_track, FROM, THROUGH


def main():
    ap=argparse.ArgumentParser();ap.add_argument('snapshots',type=Path);args=ap.parse_args()
    root=args.snapshots;index=json.loads((root/'jeremy-index.json').read_text())
    targets={};qualifying=[];missing=[]
    for source in index['sets']:
        key=source['sourceUrl'].split('/tracklist/')[1].split('/')[0]
        raw=json.loads((root/(key+'.json')).read_text());item=parse_snapshot(raw)
        for row in item['entries']:
            players=row['performers'] or item['djs']
            if players!=['Jeremy Olander'] or not original_track(row['artist'],row['title'],row['status'],row['layer']):continue
            proof={'artist':row['artist'],'title':row['title'],'sourceUrl':item['sourceUrl'],
                   'trackId':row['trackId'],'position':row['position']}
            qualifying.append(proof)
            original=next(r for r in raw['rows'] if r['position']==row['sourcePosition'])
            if not original.get('artists'):missing.append(proof)
            for artist in original.get('artists',[]):
                target=targets.setdefault(artist['url'],{'artistCredit':row['artist'],'url':artist['url'],'evidence':[]})
                target['evidence'].append(proof)
    result={'collectedOn':THROUGH,'from':FROM,'through':THROUGH,'olanderYear':2026,
            'policy':'Identified main-layer tracks selected solely by Jeremy, without a named remix/edit/rework; parenthetical Original/Extended/Club Mix accepted. Joint selections excluded.',
            'targets':list(targets.values()),'withoutProfile':missing,'qualifyingTracks':qualifying}
    (root/'producer-targets.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'profiles':len(targets),'eligibleOccurrences':len(qualifying),'withoutProfile':len(missing)}))


if __name__=='__main__':main()
