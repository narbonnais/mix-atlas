import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {collectionToCsv,collectionFromCsv,parseCollectionFile} from '../dist/collection-format.mjs';
import {validateDataset,transitions} from '../dist/core.mjs';
const fixture=()=>({schemaVersion:1,artists:[{name:'가수, New DJ',aliases:['Other Name']}],provenance:{sample:'Retained'},sets:[{
 title:'Set, "quoted"\nSecond line',djs:['가수, New DJ'],sourceUrl:'https://example.com/set',date:'2026-10-20',sourceName:'Example',scopeNote:'Original section note',custom:{future:true},entries:[
 {position:1,artist:'=FORMULA()',title:"'=Literal",trackId:'1001:abcd',genre:'Progressive',performers:['가수, New DJ']},
 {position:1,artist:'+Artist',title:'@Overlay',layer:'overlay'},
 {position:3,artist:'Artist',title:'-Remix',breakBefore:true,sourcePosition:'03',sourceTimeSeconds:40},
 {position:4,artist:'Artist',title:'Track',timeSeconds:50},
 ]}],recordings:[{title:'No tracklist',djs:['New DJ'],sourceUrl:'https://example.com/audio',publishedOn:'2026-10-19',note:'Needs identification',custom:'retain'}]});

test('CSV preserves Unicode, quoted newlines, exact versions, aliases, gaps, overlays and all extension metadata',()=>{
 const input=validateDataset(fixture()),csv=collectionToCsv(input),output=collectionFromCsv(csv);
 assert.deepEqual(output,input);assert.equal(transitions(output.sets).length,1);
 assert.ok(csv.includes("'=FORMULA()"));assert.ok(csv.includes('""quoted""'));assert.ok(csv.startsWith('\uFEFF'));
 assert.deepEqual(parseCollectionFile(csv,'collection.csv'),input);
 assert.deepEqual(parseCollectionFile(JSON.stringify(input),'collection.json'),input);
});

test('the entire bundled collection round-trips through CSV without losing provenance or source details',()=>{
 const input=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));
 assert.deepEqual(collectionFromCsv(collectionToCsv(input)),input);
});

test('a small hand-written CSV needs only the six required columns',()=>{
 const csv='source_url,set_title,djs,position,artist,title\r\nhttps://example.com/new,New set,Unlisted DJ | Guest,1,Producer,Track\r\n';
 const data=collectionFromCsv(csv);assert.deepEqual(data.sets[0].djs,['Unlisted DJ','Guest']);assert.equal(data.sets[0].entries[0].title,'Track');
});

test('CSV rejects malformed quoting, conflicting source fields, unsafe URLs and invalid numbers',()=>{
 assert.throws(()=>collectionFromCsv('source_url,set_title,djs,position,artist,title\n"unclosed'),/Invalid CSV/);
 const header='source_url,set_title,djs,position,artist,title\n';
 assert.throws(()=>collectionFromCsv(header+'https://example.com/a,A,DJ,1,A,T\nhttps://example.com/a,B,DJ,2,B,U'),/Invalid CSV/);
 assert.throws(()=>collectionFromCsv(header+'javascript:alert(1),A,DJ,1,A,T'),/HTTPS/);
 assert.throws(()=>collectionFromCsv(header+'https://example.com/a,A,DJ,1.5,A,T'),/Invalid CSV/);
 assert.throws(()=>collectionFromCsv(header+'https://example.com/a,A,DJ,1,A,T\nhttps://example.com/a,A,DJ,1,B,U'),/position/);
 assert.throws(()=>parseCollectionFile('{broken','collection.json'),/Invalid collection file/);
});

test('empty collections and recording-only collections remain round-trippable',()=>{
 for(const data of [{schemaVersion:1,sets:[]},{...fixture(),sets:[]}])assert.deepEqual(collectionFromCsv(collectionToCsv(data)),validateDataset(data));
});
