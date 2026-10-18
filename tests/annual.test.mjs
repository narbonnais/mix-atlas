import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDataset,restoreCollection,transitions,corpus} from '../dist/core.mjs';
import {parseWorkspaceRoute} from '../dist/route.mjs';

test('a seed refresh replaces stale official rows while preserving personal sets and recordings',()=>{
 const make=(url,title)=>({title:'Mix',djs:['Martinou'],sourceUrl:url,entries:[{position:1,artist:'Artist',title,layer:'main'}]});
 const seed=validateDataset({schemaVersion:1,sets:[make('https://example.com/official','Confirmed title')],recordings:[]});
 const saved=validateDataset({schemaVersion:1,sets:[make('https://example.com/official','ID'),make('https://example.com/personal','My track')],recordings:[{title:'My recording',djs:['Me'],sourceUrl:'https://example.com/recording'}]});
 const restored=restoreCollection(seed,saved);
 assert.equal(restored.sets.length,2);
 assert.equal(restored.sets.find(s=>s.sourceUrl.endsWith('/official')).entries[0].title,'Confirmed title');
 assert.equal(restored.sets.find(s=>s.sourceUrl.endsWith('/personal')).entries[0].title,'My track');
 assert.equal(restored.recordings.length,1);
 assert.equal(restoreCollection(seed,restored).sets.length,2);
});

test('annual imports retain producer sets, original version boundaries and shareable DJ filters',()=>{
 const raw=JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url)));
 const data=validateDataset(raw);
 const martinou=corpus(data,false,'Martinou');
 assert.equal(martinou.length,6);
 assert.equal(parseWorkspaceRoute('#explorer?dj=Martinou&type=sets&linked=0').dj,'Martinou');
 const epm=martinou.find(s=>s.title.includes('EPM'));
 assert.equal(epm.entries.length,19);
 assert.equal(epm.date,'2026-03-26');
 assert.ok(epm.entries.some(e=>e.title==='Lost In You (FDF (Italy) Down Under Cut)'));
 const truant=martinou.find(s=>s.title.includes('366'));
 assert.ok(transitions([truant]).every(t=>t.fromEntry.status!=='unresolved'&&t.toEntry.status!=='unresolved'));
 for(const source of raw.producerCollection.profiles){
  assert.ok(source.url.startsWith('https://www.1001tracklists.com/artist/'));
 }
});
