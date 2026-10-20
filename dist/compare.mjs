import {trackKey,unresolved,norm} from './core.mjs?v=17a220c19fc2';
export function compareSets(left,right){
 const main=s=>s.entries.filter(e=>e.layer==='main');
 const a=main(left),b=main(right),knownB=new Map(b.filter(e=>!unresolved(e)).map(e=>[trackKey(e),e]));
 const seen=new Set();
 const common=a.filter(e=>!unresolved(e)&&knownB.has(trackKey(e))&&!seen.has(trackKey(e))&&seen.add(trackKey(e))).map(e=>({left:e,right:knownB.get(trackKey(e))}));
 const provisionalB=new Set(b.filter(unresolved).map(e=>norm(e.artist+' — '+e.title)));
 const provisional=[...new Set(a.filter(e=>unresolved(e)&&provisionalB.has(norm(e.artist+' — '+e.title))).map(e=>e.artist+' — '+e.title))];
 function cadence(entries){
  const gaps=[];
  for(let i=1;i<entries.length;i++)if(!entries[i].breakBefore&&entries[i].position===entries[i-1].position+1&&entries[i].timeSeconds!==null&&entries[i-1].timeSeconds!==null&&entries[i].timeSeconds>entries[i-1].timeSeconds)gaps.push(entries[i].timeSeconds-entries[i-1].timeSeconds);
  gaps.sort((x,y)=>x-y);const n=gaps.length;
  return n?Math.round(n%2?gaps[(n-1)/2]:(gaps[n/2-1]+gaps[n/2])/2):null;
 }
 const stats=(s,entries)=>({positions:entries.length,sourceIdentified:s.sourceIdentifiedPositions,
  resolved:entries.filter(e=>!unresolved(e)).length,duration:s.durationSeconds,
  cadence:cadence(entries)});
 return {common,provisional,left:stats(left,a),right:stats(right,b)};
}

export function comparisonDefaults(sets,leftUrl,initialState={}){
 const ordered=[...sets].sort((a,b)=>(b.date??'').localeCompare(a.date??'')||a.title.localeCompare(b.title));
 const left=ordered.find(s=>s.sourceUrl===(initialState?.leftUrl??leftUrl))??ordered[0];
 const right=ordered.find(s=>s.sourceUrl===initialState?.rightUrl)??ordered.find(s=>s.sourceUrl!==left?.sourceUrl);
 return {ordered,leftId:left?.sourceUrl,rightId:right?.sourceUrl};
}
