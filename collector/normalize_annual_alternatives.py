"""Normalize public MixesDB, publisher descriptions and WatchTheDJ snapshots."""
import argparse,json,re
from pathlib import Path


def seconds(value):
    return sum(int(v)*60**i for i,v in enumerate(reversed(value.split(':'))))


def entry(position, text, cue=None, boundary=False, source_position=None, strip_label=True):
    text=re.sub(r'\s+', ' ', text).strip()
    # A final square-bracket field on MixesDB/WatchTheDJ is a label; embedded
    # version annotations remain part of the exact title.
    if strip_label:text=re.sub(r'\s*\[[^\]]*\]+\s*$', '', text).strip()
    if text in ('?', '???', 'ID', ''):
        artist,title='ID','ID'
    else:
        pair=re.split(r'\s+[-–—]\s+',text,maxsplit=1)
        if len(pair)!=2:raise ValueError('Unrecognized track: '+text)
        artist,title=pair
    unknown=bool(re.search(r'\bID\b|\bWorking Title\b|\bUnreleased\b',artist+' '+title,re.I))
    return {'position':position,'sourcePosition':source_position or str(position),'artist':artist,'title':title,
            'timeSeconds':cue,'status':'unresolved' if unknown else 'identified','layer':'main','breakBefore':boundary}


def normalize_mixes(raw):
    if not raw.get('pageTitle') or not raw.get('blocks'):return None
    name=raw['pageTitle'][13:]
    prefix=re.split(r'\s+@\s+|\s+-\s+',name,maxsplit=1)[0]
    djs=[s.strip() for s in re.split(r'\s+b2b\s+|\s+vs\s+',prefix,flags=re.I)]
    entries=[];gap=False;position=0;approx=False
    for block in raw['blocks']:
        for line in block['text'].splitlines():
            line=line.strip()
            if not line:continue
            if line=='...':gap=True;continue
            stamp=re.match(r'^\[([0-9:]+)\]\s*(.*)',line)
            if not stamp:
                # Section headings or format notes must never become music.
                gap=True;continue
            position+=1
            mark=stamp[1];approx=approx or ':' not in mark
            moment=seconds(mark) if ':' in mark else int(mark)*60
            row=entry(position,stamp[2],moment,gap, str(block.get('position') or '—'))
            entries.append(row);gap=False
    if not entries:return None
    duration=re.search(r'\b\d+:\d{2}:\d{2}\b',raw.get('fileDetails') or '')
    return {'title':name,'djs':djs,'date':raw['pageTitle'][:10],'dateType':'source','sourceUrl':raw['url'],
            'sourceName':'MixesDB','mediaUrl':next(iter(raw['players']),None),'collectedOn':'2026-10-18',
            'durationSeconds':seconds(duration[0]) if duration else None,'coverage':'published','entries':entries,
            'accuracyNote':('Repères à la minute, approximatifs. ' if approx else '')+'Tracklist publiée ; les ellipses et les IDs interrompent les transitions.'}


def main():
    ap=argparse.ArgumentParser();ap.add_argument('snapshots',type=Path);args=ap.parse_args();root=args.snapshots
    mixes=[normalize_mixes(r) for r in json.loads((root/'alternative-tracklists.json').read_text())]
    sets=[s for s in mixes if s]
    # Reconcile known mirrors of identical dated recordings, rather than counting
    # both sources as independent performances.
    mirrors={'2026-03-26 - Martinou - EPM Podcast 198':'27d0qvs1',
             '2026-06-09 - Martinou - Truancy Volume 366':'ts4nzmk',
             '2026-04-18 - Martinou - Sauna Radio':'2mhm46y9',
             '2026-04-17 - Martinou - Ute Mix Series 122':'cstmxvk',
             '2026-06-27 - Ryan Elliott @ Lago Lago, Stroombroek, Braamt, NL':'16tz4jl1'}
    retained=[]
    for item in sets:
        key=mirrors.get(item['date']+' - '+item['title'])
        file=root/(str(key)+'.json')
        if key and file.exists():
            raw=json.loads(file.read_text());raw.setdefault('sourceAliases',[])
            if item['sourceUrl'] not in raw['sourceAliases']:raw['sourceAliases'].append(item['sourceUrl'])
            file.write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n')
        else:retained.append(item)
    sets=retained
    sebra=json.loads((root/'sebra-youtube.json').read_text())
    lines=[line for line in sebra['description'].splitlines() if re.match(r'^\d{2}:\d{2}:\d{2} ',line)]
    entries=[]
    for i,line in enumerate(lines,1):
        stamp,text=line.split(' ',1)
        # The publisher puts the label at the end in parentheses. Keep square
        # bracket version text such as [Mella Dee Dub] intact.
        text=re.sub(r'\s*\([^)]*\)$','',text)
        entries.append(entry(i,text,seconds(stamp),strip_label=False))
    if entries:
        item={'title':'The Anjunadeep Edition 574 with Sebra Cruz','djs':['Sebra Cruz'],'date':'2025-11-20',
              'dateType':'source','publishedOn':'2025-11-21','sourceUrl':'https://www.youtube.com/watch?v=d5u3TWl4e-8',
              'mediaUrl':'https://www.youtube.com/watch?v=d5u3TWl4e-8','sourceName':'Anjunadeep · YouTube',
              'collectedOn':'2026-10-18','entries':entries,'accuracyNote':'Épisode daté du 20 novembre par 1001Tracklists ; vidéo officielle diffusée le 21 novembre 2025. Les Unreleased restent non identifiés.'}
        matches=[s for s in json.loads((root/'profiles.json').read_text()) if 'Sebra Cruz' in s.get('title','')]
        alias=next((s['sourceUrl'] for p in matches for s in p.get('items',[]) if '574' in s.get('title','')),None)
        if alias:item['sourceAliases']=[alias]
        canonical = root / (alias.split('/tracklist/')[1].split('/')[0]+'.json') if alias else None
        if canonical and canonical.exists():
            raw=json.loads(canonical.read_text())
            raw['publishedOn']=item['publishedOn']
            raw['publicationNote']=item['accuracyNote']
            raw['sourceAliases']=list(dict.fromkeys([*raw.get('sourceAliases',[]),item['sourceUrl']]))
            canonical.write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n')
        else:
            sets.append(item)
    for raw in json.loads((root/'watch-tracklists.json').read_text()):
        if not raw.get('tracklist') or not raw.get('dateText'):continue
        from datetime import datetime
        date=datetime.strptime(raw['dateText'].title(),'%B %d, %Y').strftime('%Y-%m-%d')
        entries=[]
        for line in raw['tracklist'].splitlines():
            match=re.match(r'^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$',line.strip())
            if match:entries.append(entry(len(entries)+1,match[2],seconds(match[1])))
        if not entries:continue
        tv='tv05' in raw['url'];title='Sébastien Léger — Lost Miracle TV05' if tv else 'Lost Miracle — Lotus Tower, Colombo'
        media=raw['media'][0].split('/embed/')[1].split('?')[0] if raw['media'] else None
        canonical=None
        for path in root.glob('*.json'):
            candidate=json.loads(path.read_text())
            same_episode = (tv and isinstance(candidate,dict) and candidate.get('summary')=='2026-07-30'
                            and re.search(r'Lost Miracle TV\s*0?5\b',candidate.get('title',''),re.I))
            same_player = (isinstance(candidate,dict) and media
                           and any('/embed/'+media in link for link in candidate.get('media',[])))
            if isinstance(candidate,dict) and candidate.get('rows') and (same_player or same_episode):
                canonical=path
                candidate['sourceAliases']=list(dict.fromkeys([*candidate.get('sourceAliases',[]),raw['url']]))
                if media and not candidate.get('media'):
                    candidate['media']=['https://www.youtube.com/embed/'+media]
                canonical.write_text(json.dumps(candidate,ensure_ascii=False,indent=2)+'\n')
                break
        if canonical:continue
        sets.append({'title':title,'djs':['Sébastien Léger'] if tv else ['Sébastien Léger','Roy Rosenfeld'],
                     'date':date,'dateType':'publication','sourceUrl':raw['url'],'sourceName':'WatchTheDJ',
                     'mediaUrl':'https://www.youtube.com/watch?v='+media if media else None,
                     'collectedOn':'2026-10-18','entries':entries,
                     'accuracyNote':'Date de publication de la page ; date exacte de performance non confirmée.'})
    (root/'normalized-alternatives.json').write_text(json.dumps({'schemaVersion':1,'sets':sets},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'sets':len(sets),'rows':sum(len(s['entries']) for s in sets)}))


if __name__=='__main__':main()
