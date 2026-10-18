import {catalog,corpus,seedSets,occurrences,trackKey,unresolved,norm,searchable,sharedRepertoire} from './core.mjs?v=f639e478edea';
import {otherSelections,supportingDjs,trackRole} from './discover.mjs?v=88134b6dceb7';

export function workspaceSources(data,dj,expanded=true){
 if(!expanded)return seedSets(data,dj);
 const related=new Set(corpus(data,true,dj).map(s=>s.sourceUrl));
 return data.sets.filter(s=>related.has(s.sourceUrl)||s.entries.some(e=>['production','rework'].includes(trackRole(e,dj))));
}

// The unfiltered collection must remain reachable without a header DJ picker.
function collectionDjs(data){
 const groups=new Map();
 for(const set of data.sets)for(const entry of set.entries){
  if(unresolved(entry))continue;
  const performers=entry.performers?.length?entry.performers:set.djs;
  const key=[...performers].map(norm).sort().join('␟');
  if(!groups.has(key))groups.set(key,{performers,title:performers.join(' & '),tracks:new Map(),sources:new Set()});
  const group=groups.get(key);group.tracks.set(trackKey(entry),{...entry,id:trackKey(entry)});group.sources.add(set.sourceUrl);
 }
 return [...groups.values()].map(group=>({id:group.performers.map(norm).sort().join('␟'),title:group.title,artist:[...group.tracks.values()].slice(0,3).map(t=>t.title).join(' · '),kind:'dj',performers:group.performers,joint:group.performers.length>1,setCount:group.sources.size,tracks:[...group.tracks.values()],sourceUrls:[...group.sources]}));
}

export function workspaceItems(data,dj,state){
 const {type='all',scope='all',expanded=true,reworks=false,joint=false,relation='supporters'}=state;
 if(type==='all')return [...workspaceItems(data,dj,{...state,type:'tracks',scope:'all',allSources:true}),...collectionDjs(data),...workspaceItems(data,dj,{...state,type:'sets',allSources:true})];
 if(type==='djs'){
  if(relation==='shared')return sharedRepertoire(data,dj).map(peer=>({
   id:peer.dj,title:peer.dj,artist:peer.shared.map(t=>t.title).join(' · ')||'',kind:'dj',shared:true,
   setCount:peer.independentSets.size+peer.b2bSets.size,tracks:peer.shared,
   sourceUrls:[...peer.independentSets,...peer.b2bSets]
  }));
  return supportingDjs(data,dj,{includeReworks:reworks}).map(item=>({...item,title:item.label,artist:item.tracks.map(t=>t.title).join(' · '),kind:'dj'}));
 }
 if(type==='sets'){
  const sets=(state.allSources?data.sets:workspaceSources(data,dj,expanded)).map(set=>({id:set.sourceUrl,title:set.title,artist:set.djs.join(' & '),date:set.date,kind:'set',set,sourceUrls:[set.sourceUrl]}));
  const recordings=(data.recordings??[]).filter(r=>state.allSources||r.djs.some(d=>norm(d)===norm(dj))).map(recording=>({id:recording.sourceUrl,title:recording.title,artist:recording.djs.join(' & '),date:recording.publishedOn,kind:'recording',recording}));
  return [...sets,...recordings].sort((a,b)=>(b.date??'').localeCompare(a.date??''));
 }
 const tracks=scope==='external'?otherSelections(data,dj,{includeReworks:reworks,includeJoint:joint})
  :catalog(state.allSources||scope==='productions'?data.sets:workspaceSources(data,dj,expanded)).filter(t=>scope!=='productions'||trackRole(t,dj)==='production'||(reworks&&trackRole(t,dj)==='rework'));
 const dates=new Map(data.sets.map(s=>[s.sourceUrl,s.date??'']));
 return tracks.map(track=>({...track,kind:'track',date:[...(track.sets??[])].reduce((latest,url)=>dates.get(url)>latest?dates.get(url):latest,'')}));
}

export function workspaceEvidence(data,dj,item,state){
 if(item.evidence)return item.evidence;
 if(item.kind==='recording')return [];
 const original=new Map(data.sets.map(s=>[s.sourceUrl,s]));
 if(item.kind==='set'){
  const set=original.get(item.id),query=searchable(state.query);
  const entry=set.entries.find(e=>state.track&&trackKey(e)===state.track)??set.entries.find(e=>query&&!unresolved(e)&&searchable(e.artist+' '+e.title).includes(query))??set.entries.find(e=>!unresolved(e)&&e.layer==='main')??set.entries[0];
  return [{set,entry}];
 }
 if(item.kind==='dj'){
  const sets=item.sourceUrls.map(url=>original.get(url)).filter(Boolean),keys=new Set(item.tracks.map(t=>t.id));
  if(item.performers){
   return sets.flatMap(set=>{
    const entries=set.entries.filter(entry=>{
     const players=entry.performers?.length?entry.performers:set.djs;
     return !unresolved(entry)&&players.length===item.performers.length&&players.every(player=>item.performers.some(dj=>norm(dj)===norm(player)));
    });
    const entry=entries.find(entry=>trackKey(entry)===state.track)??entries[0];
    if(!entry)return [];
    return occurrences([set],trackKey(entry)).filter(hit=>hit.entry===entry);
   }).sort((a,b)=>(b.set.date??'').localeCompare(a.set.date??''));
  }
  const hits=[...keys].flatMap(id=>occurrences(sets,id)).filter(h=>{
   const players=h.entry.performers?.length?h.entry.performers:h.set.djs;
   return item.performers?players.length===item.performers.length&&players.every(player=>item.performers.some(dj=>norm(dj)===norm(player))):players.some(player=>norm(player)===norm(item.title));
  });
  return hits.length?hits:sets.map(set=>({set,entry:set.entries[0]}));
 }
 const sets=state.type==='all'||state.scope==='productions'?data.sets:workspaceSources(data,dj,state.expanded);
 const hits=occurrences(sets.map(s=>original.get(s.sourceUrl)),item.id);
 return hits.filter(h=>sets.some(s=>s.sourceUrl===h.set.sourceUrl&&s.entries.includes(h.entry)));
}

export function preferredHit(hits,state){
 const exact=hits.find(h=>h.set.sourceUrl===state.set&&(!state.track||trackKey(h.entry)===state.track)&&(!state.position||h.entry.position===state.position)&&(!state.layer||h.entry.layer===state.layer));
 return exact??hits.find(h=>state.track&&trackKey(h.entry)===state.track)??hits[0];
}

export function playerLabel(hit){return (hit.entry.performers?.length?hit.entry.performers:hit.set.djs).join(' & ');}
