import {norm,unresolved,trackKey,catalog,occurrences} from './core.mjs?v=17a220c19fc2';

const aliasesFor=(dj,artists=[])=>{const key=norm(dj),artist=artists.find(a=>[a.name,...(a.aliases??[])].some(name=>norm(name)===key));return key?[...new Set([key,...(artist?[artist.name,...artist.aliases].map(norm):[])])]:[];};
const credited=(text,dj,artists)=>aliasesFor(dj,artists).some(a=>{
 const value=norm(text),escaped=a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp('(^|[^\\p{L}\\p{N}])'+escaped+'(?=$|[^\\p{L}\\p{N}])','u').test(value);
});
export function trackRole(entry,dj=null,artists=[]){
 if(unresolved(entry))return 'unknown';
 if(credited(entry.artist,dj,artists))return 'production';
 if(credited(entry.title,dj,artists))return 'rework';
 return 'other';
}
const playersFor=(set,entry)=>entry.performers?.length?entry.performers:set.djs;
export function selectedBy(set,entry,dj,artists=[]){
 const players=playersFor(set,entry);
 return players.length===1&&credited(players[0],dj,artists);
}
export function otherSelections(data,dj=null,{includeReworks=false,includeJoint=false}={}){
 if(!dj)return [];
 const filtered=[],bySource=new Map(data.sets.map(s=>[s.sourceUrl,s]));
 for(const set of data.sets){
  const entries=set.entries.filter(e=>{
   const players=playersFor(set,e);
   if(!(selectedBy(set,e,dj,data.artists)||(includeJoint&&players.some(p=>credited(p,dj,data.artists)))))return false;
   const role=trackRole(e,dj,data.artists);
   return role==='other'||(includeReworks&&role==='rework');
  });
  if(entries.length)filtered.push({...set,entries});
 }
 return catalog(filtered).map(track=>({...track,role:trackRole(track,dj,data.artists),
  evidence:filtered.filter(s=>s.entries.some(e=>trackKey(e)===track.id)).flatMap(s=>
   occurrences([bySource.get(s.sourceUrl)],track.id)
    .filter(hit=>s.entries.some(e=>e.position===hit.entry.position&&e.layer===hit.entry.layer)))
 })).sort((a,b)=>b.setCount-a.setCount||a.title.localeCompare(b.title));
}
export function supportingDjs(data,dj=null,{includeReworks=false}={}){
 if(!dj)return [];
 const groups=new Map();
 for(const set of data.sets)for(const entry of set.entries){
  const role=trackRole(entry,dj,data.artists);
  if(role!=='production'&&!(includeReworks&&role==='rework'))continue;
  const players=playersFor(set,entry);
  // An artist appearing in a joint set is not proof the other DJ chose a track.
  if(!players.length||players.some(p=>credited(p,dj,data.artists)))continue;
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
