import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareSite,ROOT} from '../scripts/prepare.mjs';
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
  assert.deepEqual(JSON.parse(read(root,'data.mjs').replace(/^export const SEED = /,'').replace(/;\s*$/,'')),dataset);
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
