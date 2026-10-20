import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateDataset,mergeDatasets} from '../dist/core.mjs';
import {parseCollectionFile} from '../dist/collection-format.mjs';
import {ROOT,prepareSite} from './prepare.mjs';

export function importSetlists(path,{root=ROOT,dryRun=false}={}){
 if(statSync(path).size>10_000_000)throw new Error('Import exceeds 10 MB.');
 const target=resolve(root,'dist/dataset.json'),original=JSON.parse(readFileSync(target,'utf8'));
 const incoming=parseCollectionFile(readFileSync(path,'utf8'),path);
 const result=mergeDatasets(validateDataset(original),incoming);
 if(!dryRun){
  const changedSources=new Set(incoming.sets.map(s=>s.sourceUrl)),changedRecordings=new Set(incoming.recordings.map(r=>r.sourceUrl));
  const oldSources=new Map(original.sets.map(s=>[s.sourceUrl,s])),oldRecordings=new Map((original.recordings??[]).map(r=>[r.sourceUrl,r]));
  const published={...result.dataset,sets:result.dataset.sets.map(s=>changedSources.has(s.sourceUrl)?s:oldSources.get(s.sourceUrl)??s),recordings:result.dataset.recordings.map(r=>changedRecordings.has(r.sourceUrl)?r:oldRecordings.get(r.sourceUrl)??r)};
  writeFileSync(target,JSON.stringify(published,null,2)+'\n');
  prepareSite({root});
 }
 return {added:result.added,updated:result.updated,total:result.dataset.sets.length,dryRun};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),path=args.find(arg=>!arg.startsWith('--'));
 if(!path){console.error('Usage: node scripts/import-setlists.mjs collection.csv|collection.json [--dry-run]');process.exitCode=1;}
 else try{console.log(JSON.stringify(importSetlists(path,{dryRun:args.includes('--dry-run')})));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
