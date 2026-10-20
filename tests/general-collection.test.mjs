import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDataset,artistSets,corpus} from '../dist/core.mjs';
import {workspaceItems} from '../dist/workspace-model.mjs';
import {trackRole,supportingDjs} from '../dist/discover.mjs';
import {parseWorkspaceRoute,formatWorkspaceRoute,parseRoute,formatRoute} from '../dist/route.mjs';
import {comparisonDefaults} from '../dist/compare.mjs';
import {readCollection,saveCollection,COLLECTION_KEY} from '../dist/collection-storage.mjs';
const raw={schemaVersion:1,artists:[{name:'새로운 DJ',aliases:['A Different Name']}],sets:[
 {title:'New set',djs:['새로운 DJ'],sourceUrl:'https://example.com/new',entries:[{position:1,artist:'A Different Name',title:'New track'}]},
 {title:'Guest set',djs:['Guest'],sourceUrl:'https://example.com/guest',entries:[{position:1,artist:'새로운 DJ',title:'New track'}]},
]};

test('a collection containing no Olander works without any seed, allowlist or code changes',()=>{
 const data=validateDataset(raw),state=parseWorkspaceRoute();
 assert.equal(state.dj,null);assert.equal('seedDj' in data,false);
 assert.equal(artistSets(data).length,2);assert.equal(corpus(data,false).length,2);
 for(const type of ['all','tracks','sets','djs'])assert.ok(workspaceItems(data,null,{...state,type}).length);
 assert.equal(trackRole(data.sets[0].entries[0],'새로운 DJ',data.artists),'production');
 assert.equal(supportingDjs(data,'새로운 DJ')[0].label,'Guest');
 assert.equal(supportingDjs(data).length,0);
});

test('arbitrary artist links work, including Unicode, and invalid names do not select a fixed DJ',()=>{
 const state={...parseWorkspaceRoute(),dj:'새로운 DJ & Guest'};
 assert.equal(parseWorkspaceRoute(formatWorkspaceRoute(state)).dj,state.dj);
 assert.equal(parseRoute(formatRoute({dj:state.dj})).dj,state.dj);
 assert.equal(parseWorkspaceRoute('#explorer?dj=%00bad').dj,null);
 assert.ok(!formatWorkspaceRoute(parseWorkspaceRoute()).includes('dj='));
});

test('old browser collections migrate without losing personal sources or imported aliases',()=>{
 const seed=validateDataset(raw),personal=validateDataset({schemaVersion:1,artists:[{name:'Personal DJ',aliases:['Personal Alias']}],sets:[{...raw.sets[0],title:'Personal set',djs:['Personal DJ'],sourceUrl:'https://example.com/personal'}]});
 const values=new Map([['olander-atlas-v1',JSON.stringify(personal)]]),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const merged=readCollection(seed,storage);assert.equal(merged.sets.length,3);assert.ok(values.has(COLLECTION_KEY));assert.ok(merged.artists.some(a=>a.name==='Personal DJ'));
 saveCollection(merged,storage);assert.equal(readCollection(seed,storage).sets.length,3);
 assert.ok(values.has('olander-atlas-v1'));
});

test('generic validation retains source extensions, genre, recording and collection metadata',()=>{
 const input={...raw,collection:{indexedCount:2,missing:[],extra:'retain'},artistCollections:[{artist:'새로운 DJ',scope:'recent'}],producerCollection:{profilesChecked:1}};
 assert.deepEqual(validateDataset(input).artistCollections,input.artistCollections);
 assert.deepEqual(validateDataset(input).producerCollection,input.producerCollection);
 assert.equal(validateDataset(input).collection.extra,'retain');
 assert.throws(()=>validateDataset({...raw,artists:[null]}),/aliases/);
});

test('comparison defaults select recent distinct sources and respect the opened set for any DJ',()=>{
 const a={sourceUrl:'a',title:'First',date:'2024-01-01'},b={sourceUrl:'b',title:'Latest',date:'2026-10-20'},c={sourceUrl:'c',title:'Second',date:'2025-01-01'};
 assert.equal(comparisonDefaults([a,b,c]).leftId,'b');assert.equal(comparisonDefaults([a,b,c]).rightId,'c');
 assert.equal(comparisonDefaults([a,b,c],'a').leftId,'a');assert.equal(comparisonDefaults([a,b,c],'a').rightId,'b');
 assert.equal(comparisonDefaults([a]).rightId,undefined);assert.equal(comparisonDefaults([]).leftId,undefined);
});
