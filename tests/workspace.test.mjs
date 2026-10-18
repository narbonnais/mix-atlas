import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDataset,trackKey} from '../dist/core.mjs';
import {parseWorkspaceRoute,formatWorkspaceRoute} from '../dist/route.mjs';
import {workspaceItems,workspaceEvidence,preferredHit} from '../dist/workspace-model.mjs';
const data=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));

test('old destinations resolve to filters of the same workspace',()=>{
 assert.equal(parseWorkspaceRoute('#discover?mode=external').scope,'external');
 assert.equal(parseWorkspaceRoute('#discover?mode=supporters').type,'djs');
 assert.equal(parseWorkspaceRoute('#sets?dj=Mattheis').type,'sets');
 assert.equal(parseWorkspaceRoute('#peers').relation,'shared');
 assert.equal(parseWorkspaceRoute('#sets?dj=Fahlberg').dj,'Fahlberg');
 assert.equal(parseWorkspaceRoute().type,'all');
 assert.equal(parseWorkspaceRoute('#compare').tool,'compare');
 for(const old of ['#discover?mode=external','#discover?mode=supporters','#sets','#peers','#compare'])assert.match(formatWorkspaceRoute(parseWorkspaceRoute(old)),/^#explorer/);
});
test('workspace links restore search, filters, exact version and set occurrence',()=>{
 const state={...parseWorkspaceRoute(),type:'djs',scope:'productions',dj:'Mattheis',item:'A & B',query:'Café / Remix?',set:'https://example.com/set?a=b',track:'1001:abcd',position:31,layer:'overlay',player:'A & B',expanded:false,reworks:true,joint:true,relation:'shared',order:'recent'};
 assert.deepEqual(parseWorkspaceRoute(formatWorkspaceRoute(state)),state);
 assert.equal(parseWorkspaceRoute('#missing?type=oops&scope=oops&position=-2').position,null);
});
test('one model exposes external selections, supporters, productions and complete source sets',()=>{
 const base=parseWorkspaceRoute();
 const external=workspaceItems(data,'Jeremy Olander',{...base,type:'tracks',scope:'external'});
 assert.equal(external.length,602);
 const lille=external.find(t=>t.title==='Lille Vals'&&t.artist==='Storken');
 const bijou=workspaceEvidence(data,'Jeremy Olander',lille,{...base,type:'tracks',scope:'external'}).find(h=>h.set.title.includes('Bijou Boston'));
 assert.equal(bijou.set.entries.length,36);
 const sets=workspaceItems(data,'Jeremy Olander',{...base,type:'sets'});
 assert.ok(sets.some(s=>s.id===bijou.set.sourceUrl));
 assert.equal(workspaceEvidence(data,'Jeremy Olander',sets.find(s=>s.id===bijou.set.sourceUrl),base)[0].set,bijou.set);
 const djs=workspaceItems(data,'Jeremy Olander',{...base,type:'djs'});
 assert.ok(djs.length>=21);assert.ok(djs.some(d=>d.title==='Jordan Counsel'));
 const productions=workspaceItems(data,'Jeremy Olander',{...base,type:'tracks',scope:'productions'});
 assert.ok(productions.some(t=>t.title==='Steps'));
 assert.notEqual(productions.find(t=>t.title==='Steps').id,productions.find(t=>t.title==='Steps (OLING Remix)').id);
});
test('exact occurrence preference survives following a track in its current set',()=>{
 const state=parseWorkspaceRoute(),tracks=workspaceItems(data,'Jeremy Olander',state),song=tracks.find(t=>t.title==='Lille Vals');
 const hits=workspaceEvidence(data,'Jeremy Olander',song,state),hit=hits.find(h=>h.set.title.includes('Bijou Boston'));
 assert.equal(preferredHit(hits,{set:hit.set.sourceUrl,track:trackKey(hit.entry),position:hit.entry.position,layer:hit.entry.layer}),hit);
 assert.equal(preferredHit(hits,{track:trackKey(hit.entry)}).entry.title,'Lille Vals');
 const selected=hit.set.entries.find(e=>e.title==='My Computer'),item=tracks.find(t=>t.id===trackKey(selected));
 const next=workspaceEvidence(data,'Jeremy Olander',item,state);
 assert.equal(preferredHit(next,{set:hit.set.sourceUrl,track:item.id,position:selected.position}).entry,selected);
});
test('Mattheis recordings stay available without creating a tracklist or graph evidence',()=>{
 const state={...parseWorkspaceRoute(),type:'sets',dj:'Mattheis'};
 const items=workspaceItems(data,'Mattheis',state),recording=items.find(i=>i.kind==='recording');
 assert.ok(recording);assert.deepEqual(workspaceEvidence(data,'Mattheis',recording,state),[]);
 assert.equal(items.filter(i=>i.kind==='set').length,4);
});

test('global search results include music, DJs and sets without changing destination',()=>{
 const items=workspaceItems(data,'Jeremy Olander',parseWorkspaceRoute());
 assert.ok(items.some(i=>i.kind==='dj'&&i.title==='Essco'));
 assert.ok(items.some(i=>i.kind==='track'&&i.title==='Steps'));
 assert.ok(items.some(i=>i.kind==='set'&&i.title.includes('Bijou Boston')));
});

test('opening a set found through a song keeps that song selected',()=>{
 const state={...parseWorkspaceRoute(),type:'sets',query:'Lille Vals'};
 const set=workspaceItems(data,'Jeremy Olander',state).find(i=>i.title.includes('Bijou Boston')&&i.set.entries.some(e=>e.title==='Lille Vals'));
 const hit=workspaceEvidence(data,'Jeremy Olander',set,state)[0];
 assert.equal(hit.entry.title,'Lille Vals');
 assert.equal(hit.entry.position,31);
 assert.equal(hit.set.entries.length,36);
});


test('unfiltered search reaches every collected set, DJ and track without a header picker',()=>{
 const state=parseWorkspaceRoute(),items=workspaceItems(data,'Jeremy Olander',state);
 const sets=items.filter(i=>i.kind==='set');
 assert.equal(sets.length,data.sets.length);
 assert.ok(items.some(i=>i.kind==='dj'&&i.title==='Mattheis'));
 assert.ok(items.some(i=>i.kind==='recording'&&i.recording.djs.includes('Mattheis')));
 const mattheis=data.sets.find(s=>s.djs.includes('Mattheis'));
 const entry=mattheis.entries.find(e=>e.status==='identified');
 const track=items.find(i=>i.kind==='track'&&i.id===trackKey(entry));
 assert.ok(track);assert.ok(workspaceEvidence(data,'Jeremy Olander',track,state).some(h=>h.set.sourceUrl===mattheis.sourceUrl));
});

test('global DJ results retain collective credits and exact performer sections',()=>{
 const fixture=validateDataset({schemaVersion:1,sets:[{title:'Shared radio',djs:['A','B'],sourceUrl:'https://example.com/shared',entries:[{position:1,artist:'Producer',title:'Together',performers:['A','B']},{position:2,artist:'Producer',title:'Solo',performers:['B'],breakBefore:true}]}]});
 const state=parseWorkspaceRoute(),items=workspaceItems(fixture,'A',state);
 const joint=items.find(i=>i.kind==='dj'&&i.title==='A & B'),solo=items.find(i=>i.kind==='dj'&&i.title==='B');
 assert.ok(joint.joint);assert.ok(solo);
 assert.deepEqual(workspaceEvidence(fixture,'A',joint,state).map(h=>h.entry.title),['Together']);
 assert.deepEqual(workspaceEvidence(fixture,'A',solo,state).map(h=>h.entry.title),['Solo']);
});


test('global DJ links retain existing identities and offer one passage per source set',()=>{
 const state=parseWorkspaceRoute(),items=workspaceItems(data,'Jeremy Olander',state),dj=items.find(i=>i.kind==='dj'&&i.title==='Jeremy Olander');
 assert.equal(dj.id,'jeremy olander');
 const hits=workspaceEvidence(data,'Jeremy Olander',dj,state);
 assert.equal(hits.length,new Set(hits.map(h=>h.set.sourceUrl)).size);
 assert.ok(hits.every(h=>(h.entry.performers?.length?h.entry.performers:h.set.djs).join(' & ')==='Jeremy Olander'));
});
