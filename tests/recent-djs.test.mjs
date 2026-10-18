import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDataset,corpus,transitions} from '../dist/core.mjs';
import {parseWorkspaceRoute} from '../dist/route.mjs';

const raw=JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url)));
const data=validateDataset(raw);

test('recent Layer J sources retain performance dates, overlays and exact versions without duplicating Spybar',()=>{
 const sets=corpus(data,false,'Layer J');
 assert.equal(sets.length,6);
 assert.equal(new Set(sets.map(s=>s.sourceUrl)).size,6);
 const latest=sets.find(s=>s.title.includes('011'));
 assert.equal(latest.date,'2026-09-26');
 assert.equal(latest.publishedOn,'2026-09-28');
 assert.equal(latest.entries.filter(e=>e.layer==='overlay').length,2);
 assert.ok(sets.some(s=>s.entries.some(e=>e.artist==='Jeremy Olander'&&e.title==='Billinghurst')));
 assert.equal(parseWorkspaceRoute('#explorer?dj=Layer+J&type=sets').dj,'Layer J');
});

test('CVMRN guest radio imports exclude host choices and never connect across unknowns or section boundaries',()=>{
 const sets=corpus(data,false,'CVMRN');
 assert.equal(sets.length,6);
 const therapy=sets.find(s=>s.title.includes('657'));
 assert.equal(therapy.entries.length,7);
 assert.ok(therapy.entries.every(e=>e.performers.includes('CVMRN')));
 assert.equal(therapy.entries[0].sourcePosition,'21');
 assert.equal(therapy.entries[0].breakBefore,true);
 assert.equal(therapy.mediaUrl,null);
 for(const edge of transitions(sets)){
  assert.notEqual(edge.fromEntry.status,'unresolved');
  assert.notEqual(edge.toEntry.status,'unresolved');
  assert.equal(edge.toEntry.breakBefore,false);
 }
 assert.equal(parseWorkspaceRoute('#explorer?dj=CVMRN&type=sets').dj,'CVMRN');
});
