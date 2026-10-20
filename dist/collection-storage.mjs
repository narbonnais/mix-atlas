import {validateDataset,restoreCollection} from './core.mjs?v=17a220c19fc2';
export const COLLECTION_KEY='mix-atlas-collection';
const LEGACY_KEY='olander-atlas-v1';
export function readCollection(seed,storage){
 const current=storage?.getItem(COLLECTION_KEY),saved=current??storage?.getItem(LEGACY_KEY);
 if(!saved)return seed;
 const data=restoreCollection(seed,validateDataset(JSON.parse(saved)));
 if(!current)try{storage?.setItem(COLLECTION_KEY,JSON.stringify(data));}catch{}
 return data;
}
export function saveCollection(data,storage){storage.setItem(COLLECTION_KEY,JSON.stringify(data));}
