import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDataset,transitions,trackKey,mergeDatasets,corpus,catalog,occurrences,parseTracklist,sharedRepertoire,listenUrl} from '../dist/core.mjs';
import {compareSets} from '../dist/compare.mjs';
const e=(position,title,status='identified',layer='main')=>({position,artist:'Artist',title,status,layer,timeSeconds:null});
const set=entries=>({title:'Set',djs:['Jeremy Olander'],sourceUrl:'https://example.com/set',entries});
const valid=sets=>validateDataset({schemaVersion:1,sets});
test('unknown tracks block both neighboring transitions without bridging',()=>{
  const d=valid([set([e(1,'A'),e(2,'ID'),e(3,'B'),e(4,'C')])]);
  assert.deepEqual(transitions(d.sets).map(x=>[x.fromEntry.title,x.toEntry.title]),[['B','C']]);
});
test('positions with a missing row do not become adjacent',()=>{
  assert.equal(transitions(valid([set([e(1,'A'),e(3,'B')])]).sets).length,0);
  assert.equal(occurrences(valid([set([e(1,'A'),e(3,'B')])]).sets,trackKey(e(3,'B')))[0].beforeGap,true);
});
test('overlay is not a third chronological track',()=>{
  const s=set([e(1,'A'),e(1,'Vocal','identified','overlay'),e(2,'B')]);
  assert.deepEqual(transitions(valid([s]).sets).map(x=>[x.fromEntry.title,x.toEntry.title]),[['A','B']]);
});
test('edits remain separate and repeated transitions count distinct sets',()=>{
  const d=valid([set([e(1,'A'),e(2,'Steps'),e(3,'A'),e(4,'Steps'),e(5,'Steps (Edit)')])]);
  const edge=transitions(d.sets).find(x=>x.fromEntry.title==='A');
  assert.equal(edge.setCount,1); assert.equal(edge.evidence.length,2);
  assert.notEqual(trackKey(e(1,'Steps')),trackKey(e(1,'Steps (Edit)')));
});
test('re-import replaces a source instead of inflating counts',()=>{
  const d=valid([set([e(1,'A'),e(2,'B')])]);
  const r=mergeDatasets(d,d);assert.equal(r.dataset.sets.length,1);assert.equal(r.added,0);assert.equal(r.updated,1);
});
test('imports reject unsafe links, duplicate positions and malformed times',()=>{
  assert.throws(()=>valid([{...set([e(1,'A')]),sourceUrl:'javascript:alert(1)'}]));
  assert.throws(()=>valid([set([e(1,'A'),e(1,'B')])]));
  assert.throws(()=>parseTracklist('00:78 Artist - A'));
  assert.throws(()=>valid([{...set([e(1,'A')]),date:'2020-02-31'}]));
});
test('text parser retains numbers, times, gaps, overlays and unresolved IDs',()=>{
  const p=parseTracklist('01. 0:00 Artist - A [LABEL]\nw/ 01:20 Artist - Vocal\n03. 02:30 ID - ID');
  assert.equal(p[1].layer,'overlay');assert.equal(p[1].position,1);assert.equal(p[2].position,3);assert.equal(p[2].status,'unresolved');
});
test('real sample: Steps closes City Hall; expansion adds Rezident evidence',()=>{
  const d=validateDataset(JSON.parse(readFileSync(new URL('../collector/initial-dataset.json',import.meta.url))));
  assert.equal(corpus(d,false).length,3);assert.equal(corpus(d,true).length,4);
  const steps=catalog(d.sets).find(t=>t.title==='Steps');
  const o=occurrences(corpus(d,false),steps.id);assert.equal(o.length,1);assert.equal(o[0].after,null);
  assert.equal(o[0].before.title,'Steps (Cinematic Edit)');
  assert.equal(o[0].entry.timeSeconds,9916);
  assert.match(listenUrl(o[0].set,o[0]),/t=9716/);
  assert.equal(occurrences(corpus(d,true),steps.id).length,2);
  const peers=sharedRepertoire(d);assert.equal(peers.find(p=>p.dj==='Rezident').shared.length,1);
  assert.equal(peers.find(p=>p.dj==='Yotto').shared.length,0);
});
test('stable track IDs group variants of a spelling and bridge an exact off-site name',()=>{
  const a={...e(1,'Steps'),trackId:'1001:abcd'};
  const d=valid([set([a]),{...set([{...a,title:'STEPS'}]),sourceUrl:'https://example.com/two'},{...set([e(1,'Steps')]),sourceUrl:'https://example.com/three'}]);
  assert.equal(catalog(d.sets).length,1);assert.equal(catalog(d.sets)[0].setCount,3);
});
test('source aliases keep a mirrored tracklist from inflating the corpus after an upgrade',()=>{
  const primary=valid([{...set([e(1,'A'),e(2,'B')]),sourceUrl:'https://example.com/primary',sourceAliases:['https://example.com/set']}]);
  const old=valid([set([e(1,'A')])]);
  const result=mergeDatasets(primary,old);assert.equal(result.dataset.sets.length,1);assert.equal(result.dataset.sets[0].entries.length,2);
});
test('performer boundaries interrupt transitions and allow timestamp resets',()=>{
  const d=valid([set([{...e(1,'A'),timeSeconds:300},{...e(2,'B'),timeSeconds:0,breakBefore:true},{...e(3,'C'),timeSeconds:200}])]);
  assert.deepEqual(transitions(d.sets).map(x=>[x.fromEntry.title,x.toEntry.title]),[['B','C']]);
  assert.equal(occurrences(d.sets,trackKey(e(2,'B')))[0].before,null);
});
test('requested sets have two confirmed common tracks and four provisional labels',()=>{
  const d=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));
  const a=d.sets.find(s=>s.sourceUrl.includes('/2c4c1f1t/')),b=d.sets.find(s=>s.sourceUrl.includes('/1z0ll9p9/'));
  const c=compareSets(a,b);
  assert.equal(c.common.length,2);assert.equal(c.provisional.length,4);
  assert.equal(c.left.cadence,289);assert.equal(c.right.cadence,303);
  assert.equal(c.left.jeremyArtistCredits,4);assert.equal(c.right.jeremyArtistCredits,20);
  const song=b.entries.find(e=>e.title==='Losing You (Jeremy Olander Edit)');
  const o=occurrences([b],trackKey(song))[0];assert.equal(o.before.title,'SCR Guestmix ID 02');assert.equal(o.after.title,'Kameleon');
});
test('a backwards source cue is retained for review without a misleading listening point',()=>{
  const d=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));
  const s=d.sets.find(s=>s.sourceUrl.includes('/2ckcbldt/'));
  const e=s.entries.find(e=>e.title==='Atlanten');
  assert.equal(e.timeSeconds,null);assert.equal(e.sourceTimeSeconds,1800);
  assert.match(s.accuracyNote,/incohérent/);
  assert.equal(e.breakBefore,false);
  assert.ok(transitions([s]).some(t=>t.fromEntry.title==='Pinkerton'&&t.toEntry.title==='Atlanten'));
});
test('a question mark in a named track is punctuation while a standalone unknown blocks edges',()=>{
  const entries=parseTracklist('01. No Moon - Are We Reality Doing This?\n02. Artist - B\n03. ? - ?');
  const d=valid([set(entries)]);
  assert.equal(d.sets[0].entries[0].status,'identified');
  assert.equal(d.sets[0].entries[2].status,'unresolved');
  assert.equal(transitions(d.sets).length,1);
});
test('Mattheis has an independent corpus and recordings without tracklists create no edges',()=>{
  const d=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));
  const m=corpus(d,false,'Mattheis');
  assert.equal(m.length,4);assert.equal(m.reduce((n,s)=>n+s.entries.length,0),45);
  assert.equal(catalog(m).length,32);assert.equal(transitions(m).length,25);
  assert.equal(d.recordings.length,2);
  assert.equal(d.recordings.find(r=>r.year===2024).publishedOn,'2025-06-24');
  assert.equal(corpus(d,false).length,209);
});
test('OpenLab imports only the Mattheis portion and credits its transitions to him',()=>{
  const d=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));
  const s=d.sets.find(s=>s.sourceUrl.includes('/2022-04-20_-_Mattheis,'));
  assert.equal(s.entries.length,10);assert.equal(s.entries.at(-1).title,'Kvävd');
  assert.ok(s.entries.every(e=>e.performers.length===1&&e.performers[0]==='Mattheis'));
  assert.ok(transitions([s]).every(e=>e.djCount===1&&e.djs.has('Mattheis')));
});
test('older browser imports retain the new audio references without duplicating them',()=>{
  const d=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));
  const old=validateDataset(JSON.parse(readFileSync(new URL('../collector/initial-dataset.json',import.meta.url))));
  const restored=mergeDatasets(d,old).dataset;
  assert.equal(restored.recordings.length,2);assert.equal(restored.sets.length,d.sets.length);
  assert.equal(mergeDatasets(restored,d).dataset.recordings.length,2);
});
