import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDataset} from '../dist/core.mjs';
import {trackRole,otherSelections,supportingDjs} from '../dist/discover.mjs';

const entry=(position,artist,title,extra={})=>({position,artist,title,status:'identified',layer:'main',timeSeconds:null,...extra});
const set=(id,djs,entries)=>({sourceUrl:'https://example.com/'+id,title:id,djs,entries});
const valid=sets=>validateDataset({schemaVersion:1,artists:[{name:'Jeremy Olander',aliases:['Dhillon']}],sets});

test('production credits, collaborations, own reworks, aliases and unknowns stay distinct',()=>{
 assert.equal(trackRole(entry(1,'Jeremy Olander & Moontalk','Apollo'),'Jeremy Olander',[{name:'Jeremy Olander',aliases:['Dhillon']}]),'production');
 assert.equal(trackRole(entry(1,'Dhillon','Vivrants'),'Jeremy Olander',[{name:'Jeremy Olander',aliases:['Dhillon']}]),'production');
 assert.equal(trackRole(entry(1,'Solange','Losing You (Jeremy Olander Edit)'),'Jeremy Olander',[{name:'Jeremy Olander',aliases:['Dhillon']}]),'rework');
 assert.equal(trackRole(entry(1,'Storken','Lille Vals'),'Jeremy Olander',[{name:'Jeremy Olander',aliases:['Dhillon']}]),'other');
 assert.equal(trackRole(entry(1,'Jeremy Olander','Festival ID'),'Jeremy Olander',[{name:'Jeremy Olander',aliases:['Dhillon']}]),'unknown');
 assert.equal(trackRole(entry(1,'Jeremy Olanderish','Track'),'Jeremy Olander',[{name:'Jeremy Olander',aliases:['Dhillon']}]),'other');
});
test('external selections exclude own versions and ambiguous shared choices by default',()=>{
 const data=valid([
  set('solo',['Jeremy Olander'],[entry(1,'Storken','Lille Vals'),entry(2,'Solange','Losing You (Jeremy Olander Edit)'),entry(3,'Dhillon','Intro')]),
  set('shared',['Jeremy Olander','Yotto'],[entry(1,'Artist','Shared selection')]),
  set('radio',['Host','Jeremy Olander'],[entry(1,'Artist','His selection',{performers:['Jeremy Olander']}),entry(2,'Artist','Host selection',{performers:['Host'],breakBefore:true})])
 ]);
 assert.deepEqual(otherSelections(data,'Jeremy Olander').map(t=>t.title).sort(),['His selection','Lille Vals']);
 assert.ok(otherSelections(data,'Jeremy Olander',{includeReworks:true}).some(t=>t.role==='rework'));
 assert.ok(otherSelections(data,'Jeremy Olander',{includeJoint:true}).some(t=>t.title==='Shared selection'));
});
test('support is based on the producer credit, not on arbitrary shared repertoire or cohosting',()=>{
 const data=valid([
  set('self',['Jeremy Olander'],[entry(1,'Jeremy Olander','Steps')]),
  set('other',['Rezident'],[entry(1,'Jeremy Olander','Steps'),entry(2,'Storken','Lille Vals')]),
  set('cohost',['Jeremy Olander','Host'],[entry(1,'Jeremy Olander','Steps')]),
  set('remix',['Michael Anthony'],[entry(1,'Dosem','Runnerpark (Jeremy Olander Remix)')])
 ]);
 assert.deepEqual(supportingDjs(data,'Jeremy Olander').map(p=>p.label),['Rezident']);
 assert.equal(supportingDjs(data,'Jeremy Olander',{includeReworks:true}).length,2);
});
test('a B2B without per-track attribution yields one collective session',()=>{
 const data=valid([set('b2b',['Lane 8','Kasbo'],[entry(1,'Jeremy Olander','Let Me Feel')])]);
 const peers=supportingDjs(data,'Jeremy Olander');assert.equal(peers.length,1);assert.equal(peers[0].joint,true);
 assert.deepEqual(peers[0].djs,['Lane 8','Kasbo']);
});
test('real recent evidence credits Jordan Counsel and keeps repeated sources distinct',()=>{
 const data=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));
 const peers=supportingDjs(data,'Jeremy Olander');
 assert.ok(peers.find(p=>p.label==='Eric Prydz').tracks.some(t=>t.title==='Evade'));
 const eric=peers.find(p=>p.label==='Eric Prydz');
 assert.ok(eric.setCount>=3);assert.equal(eric.setCount,new Set(eric.evidence.map(hit=>hit.set.sourceUrl)).size);
 assert.ok(peers.find(p=>p.label==='James Hype').tracks.some(t=>t.title==='Riots'));
 assert.ok(peers.find(p=>p.label==='Jordan Counsel').tracks.some(t=>t.title==='Dimensions'));
 assert.ok(!peers.some(p=>p.label==='Sean Harvey'));
 assert.equal(data.supportCollection.importedCount,28);assert.equal(data.supportCollection.sampleOnly,true);
});
test('real external selections expose the published context and do not invent missing links',()=>{
 const data=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));
 const selections=otherSelections(data,'Jeremy Olander'),song=selections.find(t=>t.artist==='J.Singh'&&t.title==='Anubis');
 assert.ok(selections.find(t=>t.artist==='Storken'&&t.title==='Lille Vals').setCount>=11);
 assert.ok(!selections.some(t=>t.artist==='Dhillon'||t.title.includes('Jeremy Olander')));
 const hit=song.evidence.find(h=>h.set.sourceUrl.includes('/2c4c1f1t/'));
 assert.equal(hit.before.title,'Hydroshima');assert.equal(hit.after.title,'Losing You (Jeremy Olander Edit)');
});
