import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDataset,catalog,transitions,seedSets} from '../dist/core.mjs';
import {workspaceItems,workspaceEvidence} from '../dist/workspace-model.mjs';

const raw=JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url)));
const data=validateDataset(raw),remix='1001:vdg8l3mp';

test('the requested Stereodrama remix has 29 complete source contexts and stays separate from the original',()=>{
 const track=catalog(data.sets).find(t=>t.id===remix);
 assert.equal(track.setCount,29);
 assert.equal(track.title,'Stereodrama (Aubrey Fry & Nick Stoynoff Remix)');
 const original=catalog(data.sets).find(t=>t.artist==='Danny Howells'&&t.title==='Stereodrama');
 assert.ok(original);assert.notEqual(original.id,remix);
 const cape=data.sets.find(s=>s.sourceUrl.includes('/2ndhhutk/'));
 assert.equal(cape.entries.length,43);
 const adjacent=transitions([cape]);
 assert.ok(adjacent.some(e=>e.fromEntry.title==='Love & Cream'&&e.to===remix));
 assert.ok(adjacent.some(e=>e.from===remix&&e.toEntry.title==='Rej (Mariano Mellino Remix)'));
});

test('Danny Howells is globally discoverable while guest sections and the Belu Clavero session retain their credits',()=>{
 const state={type:'djs',allSources:true,query:'Danny Howells'};
 const item=workspaceItems(data,'Jeremy Olander',state).find(i=>i.title==='Danny Howells');
 assert.equal(item.setCount,9);
 const hits=workspaceEvidence(data,'Jeremy Olander',item,state);
 const guest=hits.find(h=>h.set.title.includes('Transitions 1081'));
 assert.deepEqual(guest.entry.performers,['Danny Howells']);
 const scoped=seedSets(data,'Danny Howells').find(s=>s.title.includes('Transitions 1081'));
 assert.equal(scoped.entries.length,11);
 assert.ok(scoped.entries.every(e=>e.performers.includes('Danny Howells')));
 const full=data.sets.find(s=>s.title.includes('Transitions 1081'));
 assert.equal(full.entries.length,21);
 assert.equal(transitions([full]).some(e=>e.fromEntry.position===10&&e.toEntry.position===11),false);
 assert.ok(workspaceItems(data,'Jeremy Olander',state).some(i=>i.joint&&i.performers.includes('Danny Howells')&&i.performers.includes('Belu Clavero')));
});
