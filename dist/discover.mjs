import {norm,unresolved,trackKey,catalog,occurrences} from './core.mjs?v=f639e478edea';

const aliasesFor=dj=>norm(dj)==='jeremy olander'?['jeremy olander','dhillon']:[norm(dj)];
const credited=(text,dj)=>aliasesFor(dj).some(a=>{
 const value=norm(text),escaped=a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp('(^|[^\\p{L}\\p{N}])'+escaped+'(?=$|[^\\p{L}\\p{N}])','u').test(value);
});
export function trackRole(entry,dj='Jeremy Olander'){
 if(unresolved(entry))return 'unknown';
 if(credited(entry.artist,dj))return 'production';
 if(credited(entry.title,dj))return 'rework';
 return 'other';
}
const playersFor=(set,entry)=>entry.performers?.length?entry.performers:set.djs;
export function selectedBy(set,entry,dj){
 const players=playersFor(set,entry);
 return players.length===1&&credited(players[0],dj);
}
export function otherSelections(data,dj='Jeremy Olander',{includeReworks=false,includeJoint=false}={}){
 const filtered=[],bySource=new Map(data.sets.map(s=>[s.sourceUrl,s]));
 for(const set of data.sets){
  const entries=set.entries.filter(e=>{
   const players=playersFor(set,e);
   if(!(selectedBy(set,e,dj)||(includeJoint&&players.some(p=>credited(p,dj)))))return false;
   const role=trackRole(e,dj);
   return role==='other'||(includeReworks&&role==='rework');
  });
  if(entries.length)filtered.push({...set,entries});
 }
 return catalog(filtered).map(track=>({...track,role:trackRole(track,dj),
  evidence:filtered.filter(s=>s.entries.some(e=>trackKey(e)===track.id)).flatMap(s=>
   occurrences([bySource.get(s.sourceUrl)],track.id)
    .filter(hit=>s.entries.some(e=>e.position===hit.entry.position&&e.layer===hit.entry.layer)))
 })).sort((a,b)=>b.setCount-a.setCount||a.title.localeCompare(b.title));
}
export function supportingDjs(data,dj='Jeremy Olander',{includeReworks=false}={}){
 const groups=new Map();
 for(const set of data.sets)for(const entry of set.entries){
  const role=trackRole(entry,dj);
  if(role!=='production'&&!(includeReworks&&role==='rework'))continue;
  const players=playersFor(set,entry);
  // An artist appearing in a joint set is not proof the other DJ chose a track.
  if(!players.length||players.some(p=>credited(p,dj)))continue;
  const key=players.map(norm).sort().join('␟');
  if(!groups.has(key))groups.set(key,{id:key,djs:players,label:players.join(' & '),joint:players.length>1,tracks:new Map(),sets:new Set(),evidence:[],latestDate:null});
  const group=groups.get(key),id=trackKey(entry);
  group.tracks.set(id,{...entry,id,role});group.sets.add(set.sourceUrl);
  const hit=occurrences([set],id).find(h=>h.entry.position===entry.position&&h.entry.layer===entry.layer);
  group.evidence.push(hit);
  if(set.date&&(group.latestDate===null||set.date>group.latestDate))group.latestDate=set.date;
 }
 return [...groups.values()].map(g=>({...g,tracks:[...g.tracks.values()],setCount:g.sets.size,
  evidence:g.evidence.sort((a,b)=>(b.set.date??'').localeCompare(a.set.date??''))
 })).sort((a,b)=>(b.latestDate??'').localeCompare(a.latestDate??'')||b.setCount-a.setCount||a.label.localeCompare(b.label));
}
