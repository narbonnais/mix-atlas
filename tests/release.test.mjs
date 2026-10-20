import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareSite,ROOT} from '../scripts/prepare.mjs';
import {collectionToCsv,parseCollectionFile} from '../dist/collection-format.mjs';
import {loadCollection,DATASET_URL} from '../dist/data.mjs';
import {importSetlists} from '../scripts/import-setlists.mjs';
const fixture=()=>{
 const root=mkdtempSync(join(tmpdir(),'atlas-release-'));
 cpSync(join(ROOT,'dist'),join(root,'dist'),{recursive:true});
 return root;
};
const read=(root,name)=>readFileSync(join(root,'dist',name),'utf8');

test('dataset updates regenerate the browser seed and every dependent asset version',()=>{
 const root=fixture();
 try{
  prepareSite({root});assert.equal(prepareSite({root,check:true}).changed.length,0);
  const before=read(root,'index.html'),dataset=JSON.parse(read(root,'dataset.json'));
  dataset.sets[0].title+=' — corrected';
  writeFileSync(join(root,'dist/dataset.json'),JSON.stringify(dataset));
  assert.throws(()=>prepareSite({root,check:true}),/stale/);
  prepareSite({root});assert.notEqual(read(root,'index.html'),before);
  assert.match(read(root,'data.mjs'),/loadCollection/);
  assert.ok(read(root,'data.mjs').length<1000);
  assert.ok(!read(root,'data.mjs').includes(dataset.sets[0].title));
  assert.equal(prepareSite({root,check:true}).changed.length,0);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('publishing an exported collection deduplicates sources and rejects bad input without writes',()=>{
 const root=fixture();
 try{
  const input=join(root,'collection.json');
  const sample={schemaVersion:1,sets:[{title:'Release test',djs:['Test DJ'],sourceUrl:'https://example.com/release-test',entries:[{position:1,artist:'Artist',title:'Track'}]}]};
  writeFileSync(input,JSON.stringify(sample));
  const before=read(root,'dataset.json');
  assert.equal(importSetlists(input,{root,dryRun:true}).added,1);assert.equal(read(root,'dataset.json'),before);
  assert.equal(importSetlists(input,{root}).added,1);
  assert.equal(importSetlists(input,{root}).added,0);
  const saved=read(root,'dataset.json');
  sample.sets[0].sourceUrl='javascript:alert(1)';writeFileSync(input,JSON.stringify(sample));
  assert.throws(()=>importSetlists(input,{root}),/HTTPS/);assert.equal(read(root,'dataset.json'),saved);
  prepareSite({root,check:true});
 }finally{rmSync(root,{recursive:true,force:true});}
});


test('CSV publication preserves untouched raw sources and incoming provenance, and invalid CSV does not write',()=>{
 const root=fixture();
 try{
  const before=JSON.parse(read(root,'dataset.json')),input=join(root,'new.csv');
  const sample={schemaVersion:1,artists:[{name:'New DJ',aliases:['Alias']}],artistCollections:[{artist:'New DJ',profileUrl:'https://example.com/profile'}],sets:[{title:'CSV set',djs:['New DJ'],sourceUrl:'https://example.com/csv-release',entries:[{position:1,artist:'Producer',title:'Track',trackId:'custom:new-track'}]}]};
  writeFileSync(input,collectionToCsv(sample));
  assert.equal(importSetlists(input,{root,dryRun:true}).added,1);assert.equal(JSON.parse(read(root,'dataset.json')).sets.length,before.sets.length);
  assert.equal(importSetlists(input,{root}).added,1);
  const result=JSON.parse(read(root,'dataset.json'));
  assert.deepEqual(result.sets.slice(0,before.sets.length),before.sets);
  assert.ok(result.artistCollections.some(c=>c.artist==='New DJ'));assert.ok(result.artistCollections.some(c=>c.artist==='CVMRN'));
  assert.equal(result.sets.at(-1).entries[0].trackId,'custom:new-track');
  const saved=read(root,'dataset.json');writeFileSync(input,'source_url,set_title,djs,position,artist,title\nhttps://example.com/bad,Bad,DJ,-2,A,B');
  assert.throws(()=>importSetlists(input,{root}),/CSV/);assert.equal(read(root,'dataset.json'),saved);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('the data loader fetches the versioned JSON and exposes failures to the retry UI',async()=>{
 const response={schemaVersion:1,sets:[]};let requested;
 assert.deepEqual(await loadCollection(async url=>{requested=url;return {ok:true,json:async()=>response};}),response);
 assert.equal(requested,DATASET_URL);assert.match(DATASET_URL.href,/dataset\.json\?v=[a-f0-9]{12}$/);
 await assert.rejects(loadCollection(async()=>({ok:false})),/load failed/);
 await assert.rejects(loadCollection(async()=>{throw Error('Offline');}),/Offline/);
 await assert.rejects(loadCollection(async()=>({ok:true,json:async()=>{throw SyntaxError('Invalid JSON');}})),/JSON/);
});
