import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {validateDataset} from '../dist/core.mjs';

export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=text=>createHash('sha256').update(text).digest('hex').slice(0,12);

export function prepareSite({root=ROOT,check=false}={}){
 const dist=resolve(root,'dist'),files=new Map(),visiting=new Set();
 const dataset=JSON.parse(readFileSync(resolve(dist,'dataset.json'),'utf8'));
 validateDataset(dataset);
 const data=`export const DATASET_URL=new URL('./dataset.json?v=${hash(readFileSync(resolve(dist,'dataset.json')))}',import.meta.url);
export async function loadCollection(fetcher=fetch){
 const response=await fetcher(DATASET_URL);
 if(!response.ok)throw new Error('Collection load failed.');
 return response.json();
}
`;
 const moduleSource=name=>name==='data.mjs'?data:readFileSync(resolve(dist,name),'utf8');
 function module(name){
  if(files.has(name))return files.get(name);
  if(visiting.has(name))throw new Error('Circular module dependency: '+name);
  visiting.add(name);
  const text=moduleSource(name).replace(/^((?:import|export)\b[^;\n]*?\bfrom\s*['"])(\.\/[^'"]+)(['"])/gm,(match,start,url,end)=>{
   const dependency=url.split('?')[0];
   if(!dependency.endsWith('.mjs'))throw new Error('Unsupported module: '+dependency);
   const target=relative(dist,resolve(dist,dependency));
   if(target.startsWith('..'))throw new Error('Module outside dist: '+dependency);
   return start+dependency+'?v='+hash(module(target))+end;
  });
  visiting.delete(name);files.set(name,text);return text;
 }
 for(const name of readdirSync(dist).filter(name=>name.endsWith('.mjs')))module(name);
 const index=readFileSync(resolve(dist,'index.html'),'utf8').replace(/((?:src|href)=['"])([^'"]+)(['"])/g,(match,start,url,end)=>{
  if(/^(?:https?:|#|data:)/.test(url))return match;
  const name=url.split('?')[0],path=resolve(dist,name);
  if(name.startsWith('/')||relative(dist,path).startsWith('..'))throw new Error('Use relative asset paths for GitHub Pages: '+url);
  const contents=files.get(name)??readFileSync(path);
  return start+name+'?v='+hash(contents)+end;
 });
 files.set('index.html',index);
 const changed=[...files].filter(([name,text])=>readFileSync(resolve(dist,name),'utf8')!==text);
 if(check&&changed.length)throw new Error('Generated files are stale. Run npm run prepare-site, then commit: '+changed.map(([name])=>'dist/'+name).join(', '));
 if(!check)for(const [name,text] of changed)writeFileSync(resolve(dist,name),text);
 return {sets:dataset.sets.length,changed:changed.map(([name])=>name)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(prepareSite({check:process.argv.includes('--check')})));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
