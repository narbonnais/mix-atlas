import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDataset,corpus,catalog,transitions,mergeDatasets} from '../dist/core.mjs';
import {parseRoute,formatRoute} from '../dist/route.mjs';

const raw=JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url)));
const data=validateDataset(raw);

test('recent Fahlberg sources are independent, deduplicated and linked from routes',()=>{
 const sets=corpus(data,false,'Fahlberg');
 assert.equal(sets.length,4);
 assert.equal(catalog(sets).length,64);
 assert.equal(transitions(sets).length,56);
 assert.equal(new Set(data.sets.map(s=>s.sourceUrl)).size,data.sets.length);
 assert.equal(mergeDatasets(data,data).added,0);
 const state={view:'sets',mode:'supporters',dj:'Fahlberg',track:null,expanded:false};
 assert.deepEqual(parseRoute(formatRoute(state)),state);
});

test('Green Valley retains performance and publication dates, IDs and overlay context',()=>{
 const set=data.sets.find(s=>s.sourceUrl.includes('/m5hq4k9/'));
 assert.equal(set.date,'2025-05-24');
 assert.equal(set.publishedOn,'2025-07-03');
 assert.equal(set.dateType,'performance');
 assert.equal(set.entries.length,22);
 assert.equal(set.entries.filter(e=>e.layer==='overlay').length,1);
 assert.equal(set.entries.filter(e=>e.status==='unresolved').length,4);
 const edges=transitions([set]);
 assert.equal(edges.length,15);
 assert.ok(edges.every(e=>e.fromEntry.layer==='main'&&e.toEntry.layer==='main'));
 assert.ok(edges.every(e=>e.toEntry.position===e.fromEntry.position+1));
 assert.ok(!edges.some(e=>e.fromEntry.position===14||e.toEntry.position===19));
 assert.throws(()=>validateDataset({...raw,sets:[{...set,publishedOn:'2025-02-31'}]}),/publication invalide/);
});

test('Fahlberg sees only his explicitly credited Bar15 section and Jeremy retains his corpus',()=>{
 const scoped=corpus(data,false,'Fahlberg').find(s=>s.sourceUrl.includes('/1pp4v34k/'));
 assert.equal(scoped.entries.length,24);
 assert.equal(scoped.entries[0].position,38);
 assert.ok(scoped.entries[0].breakBefore);
 assert.ok(scoped.entries.every(e=>e.performers.includes('Fahlberg')));
 assert.ok(transitions([scoped]).every(e=>e.djs.has('Fahlberg')&&e.djs.has('Jeremy Olander')));
 assert.equal(corpus(data,false,'Jeremy Olander').length,209);
 assert.equal(corpus(data,false,'Mattheis').length,4);
});
