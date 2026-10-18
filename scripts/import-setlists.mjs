import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateDataset,mergeDatasets} from '../dist/core.mjs';
import {ROOT,prepareSite} from './prepare.mjs';

export function importSetlists(path,{root=ROOT,dryRun=false}={}){
 if(statSync(path).size>10_000_000)throw new Error('Import exceeds 10 MB.');
 const target=resolve(root,'dist/dataset.json'),original=JSON.parse(readFileSync(target,'utf8'));
 const incoming=validateDataset(JSON.parse(readFileSync(path,'utf8')));
 const result=mergeDatasets(validateDataset(original),incoming);
 if(!dryRun){
  writeFileSync(target,JSON.stringify({...original,sets:result.dataset.sets,recordings:result.dataset.recordings},null,2)+'\n');
  prepareSite({root});
 }
 return {added:result.added,updated:result.updated,total:result.dataset.sets.length,dryRun};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),path=args.find(arg=>!arg.startsWith('--'));
 if(!path){console.error('Usage: node scripts/import-setlists.mjs collection.json [--dry-run]');process.exitCode=1;}
 else try{console.log(JSON.stringify(importSetlists(path,{dryRun:args.includes('--dry-run')})));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
