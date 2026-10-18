export const SEED_DJ = 'Jeremy Olander';
export const norm = s => String(s ?? '').normalize('NFKC').replace(/[‘’]/g, "'").replace(/\s+/g,' ').trim().toLocaleLowerCase('fr');
export const searchable = s => norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const nameKey = e => norm(e.artist) + '␟' + norm(e.title);
export const trackKey = e => e.trackId ?? nameKey(e);
export const unresolved = e => e.status === 'unresolved' || /\bID\b|\bWorking Title\b/i.test(e.artist + ' ' + e.title) || [e.artist,e.title].some(s=>/^\?+$/.test(String(s??'').trim()));
export function safeUrl(value) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Les liens doivent être des adresses HTTPS sans identifiants.');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (/^utm_/i.test(key)) url.searchParams.delete(key);
  return url.href;
}
export function validateDataset(input) {
  if (!input || input.schemaVersion !== 1 || !Array.isArray(input.sets)) throw new Error('Format attendu : { schemaVersion: 1, sets: [...] }.');
  if (input.sets.length > 1000) throw new Error('Ce prototype accepte au maximum 1 000 sets par import.');
  let rows = 0;
  const seen = new Set();
  const sets = input.sets.map((s, index) => {
    const fail = msg => { throw new Error(`Set ${index + 1} : ${msg}`); };
    const title = String(s.title ?? '').trim();
    if (!title || title.length > 400) fail('titre manquant ou trop long.');
    if (!Array.isArray(s.djs) || !s.djs.length || s.djs.length > 20 || s.djs.some(x => typeof x !== 'string' || !x.trim() || x.length > 200)) fail('liste de DJs invalide.');
    const sourceUrl = safeUrl(s.sourceUrl);
    if (!sourceUrl) fail('lien source manquant.');
    if (seen.has(sourceUrl)) fail('cette source apparaît deux fois dans le fichier.');
    seen.add(sourceUrl);
    if (!Array.isArray(s.entries) || !s.entries.length) fail('tracklist vide.');
    rows += s.entries.length;
    if (rows > 20000) fail('limite de 20 000 lignes dépassée.');
    const positions = new Set();
    let previousTime = null;
    const entries = s.entries.map(e => {
      if (!Number.isInteger(e.position) || e.position < 1) fail('les positions doivent être des entiers positifs.');
      if (!['main','overlay'].includes(e.layer ?? 'main')) fail('couche invalide.');
      const layer = e.layer ?? 'main';
      if (layer === 'main' && positions.has(e.position)) fail('position principale répétée.');
      if (layer === 'main') positions.add(e.position);
      const artist = String(e.artist ?? '').trim(), song = String(e.title ?? '').trim();
      if (!artist || !song || artist.length > 400 || song.length > 600) fail('artiste ou morceau manquant ou trop long.');
      const timeSeconds = e.timeSeconds ?? null;
      if (timeSeconds !== null && (!Number.isInteger(timeSeconds) || timeSeconds < 0 || timeSeconds > 172800)) fail('repère temporel invalide.');
      const status = unresolved({artist,title:song,status:e.status}) ? 'unresolved' : 'identified';
      const trackId=e.trackId??null;
      if(trackId && !/^1001:[a-z0-9]{4,}$/.test(trackId)) fail('identifiant de morceau invalide.');
      return {position:e.position,artist,title:song,timeSeconds,layer,status,trackId,
        sourcePosition:String(e.sourcePosition??e.position).slice(0,20),
        breakBefore:e.breakBefore===true,performers:Array.isArray(e.performers)?e.performers.filter(x=>typeof x==='string').slice(0,20):[],
        sourceIdentified:e.sourceIdentified===true,
        sourceTimeSeconds:Number.isInteger(e.sourceTimeSeconds)&&e.sourceTimeSeconds>=0?e.sourceTimeSeconds:null};
    }).sort((a,b) => a.position-b.position || (a.layer === 'main' ? -1 : 1));
    for (const e of entries.filter(e=>e.layer==='main')) {
      if(e.breakBefore) previousTime=null;
      if (e.timeSeconds !== null) {
        if (previousTime !== null && e.timeSeconds < previousTime) fail('repères temporels dans le désordre.');
        previousTime = e.timeSeconds;
      }
    }
    for (const e of entries.filter(e=>e.layer==='overlay')) if (!positions.has(e.position)) fail('superposition sans morceau principal.');
    const date = s.date ?? null;
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date)) fail('date invalide.');
    const publishedOn = s.publishedOn ?? null;
    if (publishedOn && (!/^\d{4}-\d{2}-\d{2}$/.test(publishedOn) || !Number.isFinite(Date.parse(publishedOn)) || new Date(publishedOn).toISOString().slice(0,10) !== publishedOn)) fail('date de publication invalide.');
    return {id:sourceUrl,title,djs:[...new Set(s.djs.map(x=>x.trim()))],date,dateType:s.dateType ?? 'source',sourceUrl,
      publishedOn,
      mediaUrl:safeUrl(s.mediaUrl),sourceName:String(s.sourceName ?? 'Import personnel').slice(0,200),coverage:'published',
      collectedOn:s.collectedOn ?? input.collectedOn ?? null,entries,
      sourceAliases:Array.isArray(s.sourceAliases)?s.sourceAliases.map(safeUrl).filter(Boolean):[],
      scopeNote:String(s.scopeNote??'').slice(0,600),durationSeconds:Number.isInteger(s.durationSeconds)?s.durationSeconds:null,
      accuracyNote:String(s.accuracyNote??'').slice(0,600),
      sourceIdentifiedPositions:Number.isInteger(s.sourceIdentifiedPositions)?s.sourceIdentifiedPositions:null,
      sourceTotalPositions:Number.isInteger(s.sourceTotalPositions)?s.sourceTotalPositions:null};
  });
  // Give off-site copies the same track identity only for an unambiguous exact name.
  const aliases=new Map();
  for(const s of sets) for(const e of s.entries) if(e.trackId&&!unresolved(e)){
    const name=nameKey(e);if(!aliases.has(name))aliases.set(name,new Set());aliases.get(name).add(e.trackId);
  }
  for(const s of sets)for(const e of s.entries)if(!e.trackId&&!unresolved(e)&&aliases.get(nameKey(e))?.size===1)e.trackId=[...aliases.get(nameKey(e))][0];
  const collection=input.collection && Number.isInteger(input.collection.indexedCount)?{
    provider:String(input.collection.provider??'').slice(0,100),profileUrl:safeUrl(input.collection.profileUrl),
    advertisedCount:input.collection.advertisedCount,indexedCount:input.collection.indexedCount,
    importedCount:input.collection.importedCount,indexComplete:input.collection.indexComplete===true,
    detailsComplete:input.collection.detailsComplete===true,
  }:null;
  if(input.recordings && (!Array.isArray(input.recordings)||input.recordings.length>1000))throw new Error('Liste d’enregistrements invalide.');
  const recordings=(input.recordings??[]).map(r=>{
    if(typeof r.title!=='string'||!r.title.trim()||r.title.length>400||!Array.isArray(r.djs)||!r.djs.length||r.djs.some(d=>typeof d!=='string'||!d.trim()))throw new Error('Enregistrement sans titre ou DJ.');
    const sourceUrl=safeUrl(r.sourceUrl);if(!sourceUrl)throw new Error('Enregistrement sans source.');
    const checkDate=v=>{if(!v)return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw new Error('Date d’enregistrement invalide.');return v;};
    return {title:r.title.trim(),djs:[...new Set(r.djs)],sourceUrl,mediaUrl:safeUrl(r.mediaUrl),sourceName:String(r.sourceName??'').slice(0,200),year:Number.isInteger(r.year)?r.year:null,publishedOn:checkDate(r.publishedOn),releasedOn:checkDate(r.releasedOn),tracklistStatus:'unavailable',note:String(r.note??'').slice(0,600)};
  });
  const supportCollection=input.supportCollection?{
    profileUrl:safeUrl(input.supportCollection.profileUrl),
    sourceCounterLabel:String(input.supportCollection.sourceCounterLabel??'').slice(0,50),
    listedCount:Math.max(0,Number(input.supportCollection.listedCount)||0),
    expectedNewSets:Math.max(0,Number(input.supportCollection.expectedNewSets)||0),
    importedCount:Math.max(0,Number(input.supportCollection.importedCount)||0),
    sampleOnly:true,sampleComplete:input.supportCollection.sampleComplete===true,
    collectedOn:String(input.supportCollection.collectedOn??'').slice(0,10)
  }:null;
  return {schemaVersion:1,seedDj:SEED_DJ,collectedOn:input.collectedOn ?? null,sets,collection,recordings,supportCollection};
}
export function mergeDatasets(existing, incoming) {
  const map = new Map(existing.sets.map(s=>[s.sourceUrl,s]));
  let added = 0, updated = 0;
  for (const s of incoming.sets) {
    const primary=[...map.values()].find(x=>x.sourceAliases?.includes(s.sourceUrl));
    if(primary){updated++;continue;}
    for(const alias of s.sourceAliases??[])map.delete(alias);
    if (map.has(s.sourceUrl)) updated++; else added++;
    map.set(s.sourceUrl,s);
  }
  if (map.size > 1000 || [...map.values()].reduce((n,s)=>n+s.entries.length,0)>20000) throw new Error('La taille totale dépasse les limites du prototype.');
  const recordings=new Map((existing.recordings??[]).map(r=>[r.sourceUrl,r]));
  for(const r of incoming.recordings??[])recordings.set(r.sourceUrl,r);
  return {dataset:validateDataset({...existing,sets:[...map.values()],recordings:[...recordings.values()]}),added,updated};
}
export function restoreCollection(seed, saved) {
  // Browser storage includes an older copy of the bundled sources as well as
  // personal imports. Refresh official sources while retaining personal URLs.
  const merged=mergeDatasets(saved,seed).dataset;
  return {...seed,sets:merged.sets,recordings:merged.recordings};
}
export const seedSets = (data,dj=SEED_DJ) => data.sets.filter(s=>s.djs.some(d=>norm(d)===norm(dj))).flatMap(s=>{
  const entries=s.entries.filter(e=>!e.performers?.length||e.performers.some(d=>norm(d)===norm(dj)));
  if(!entries.length)return [];
  if(entries.length===s.entries.length)return [s];
  return [{...s,entries,scopeNote:`Seules les positions explicitement attribuées à ${dj} sont affichées. Les passages partagés restent collectifs.`}];
});
export function corpus(data, expanded, dj=SEED_DJ) {
  const base = seedSets(data,dj), baseUrls = new Set(base.map(s=>s.sourceUrl));
  if (!expanded) return base;
  const keys = new Set(base.flatMap(s=>s.entries.filter(e=>!unresolved(e)).map(trackKey)));
  return data.sets.filter(s=>baseUrls.has(s.sourceUrl) || s.entries.some(e=>!unresolved(e) && keys.has(trackKey(e))));
}
export function catalog(sets) {
  const map = new Map();
  for (const s of sets) for (const e of s.entries) {
    if (unresolved(e)) continue;
    const id = trackKey(e);
    if (!map.has(id)) map.set(id,{...e,id,sets:new Set(),occurrences:0});
    const t = map.get(id); t.sets.add(s.sourceUrl); t.occurrences++;
  }
  return [...map.values()].map(t=>({...t,setCount:t.sets.size})).sort((a,b)=>b.setCount-a.setCount || a.title.localeCompare(b.title,'fr'));
}
export function transitions(sets) {
  const map = new Map();
  for (const set of sets) {
    const main = set.entries.filter(e=>e.layer==='main');
    for(let i=0;i<main.length-1;i++) {
      const from = main[i], to = main[i+1];
      if (to.position !== from.position+1 || to.breakBefore || unresolved(from) || unresolved(to)) continue;
      const fromKey = trackKey(from), toKey = trackKey(to), id = fromKey+'→'+toKey;
      if (!map.has(id)) map.set(id,{id,from:fromKey,to:toKey,fromEntry:from,toEntry:to,sets:new Set(),djs:new Set(),evidence:[]});
      const edge = map.get(id); edge.sets.add(set.sourceUrl);
      (from.performers?.length?from.performers:set.djs).forEach(d=>edge.djs.add(d));
      edge.evidence.push({set,from,to});
    }
  }
  return [...map.values()].map(e=>({...e,setCount:e.sets.size,djCount:e.djs.size}));
}
export function occurrences(sets,id) {
  const result = [];
  for (const set of sets) {
    const main = set.entries.filter(e=>e.layer==='main');
    for (const entry of set.entries) {
      if (unresolved(entry) || trackKey(entry)!==id) continue;
      const i = main.indexOf(entry);
      const beforeBoundary=entry.breakBefore===true,afterBoundary=i>=0&&main[i+1]?.breakBefore===true;
      const before = i>0&&!beforeBoundary ? main[i-1] : null, after = i>=0 && i<main.length-1&&!afterBoundary ? main[i+1] : null;
      result.push({set,entry,before,after,
        beforeBoundary,afterBoundary,
        beforeGap:entry.layer==='main' && !beforeBoundary && ((before && before.position!==entry.position-1) || (!before && entry.position!==1)),
        afterGap:entry.layer==='main' && after && after.position!==entry.position+1});
    }
  }
  return result.sort((a,b)=>(b.set.date ?? '').localeCompare(a.set.date ?? ''));
}
export function sharedRepertoire(data, focusDj=SEED_DJ) {
  const base = seedSets(data,focusDj);
  const baseKeys = new Set(base.flatMap(s=>s.entries.filter(e=>!unresolved(e)).map(trackKey)));
  const all = catalog(data.sets), tracks = new Map(all.map(t=>[t.id,t]));
  const peers = new Map();
  for(const set of data.sets) for(const dj of set.djs) {
    if(norm(dj)===norm(focusDj)) continue;
    if(!peers.has(dj)) peers.set(dj,{dj,shared:new Set(),independentSets:new Set(),b2bSets:new Set()});
    const p=peers.get(dj), isB2b=set.djs.some(d=>norm(d)===norm(focusDj));
    (isB2b?p.b2bSets:p.independentSets).add(set.sourceUrl);
    if(!isB2b) set.entries.filter(e=>!unresolved(e) && baseKeys.has(trackKey(e))).forEach(e=>p.shared.add(trackKey(e)));
  }
  return [...peers.values()].filter(p=>p.shared.size || p.b2bSets.size).map(p=>({...p,shared:[...p.shared].map(k=>tracks.get(k))})).sort((a,b)=>b.shared.length-a.shared.length);
}
export function timeLabel(sec) {
  if(sec===null || sec===undefined) return 'Sans repère';
  const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60;
  return (h?h+':':'')+(h?String(m).padStart(2,'0'):String(m))+':'+String(s).padStart(2,'0');
}
export function listenUrl(set, occurrence) {
  if(!set.mediaUrl) return set.sourceUrl;
  const url=new URL(set.mediaUrl);
  const target=occurrence.before?.timeSeconds ?? occurrence.entry.timeSeconds;
  if(target!==null && target!==undefined && /(^|\.)youtube\.com$/.test(url.hostname)) url.searchParams.set('t',String(Math.max(0,target-15)));
  return url.href;
}
export function parseTracklist(text) {
  let pos=0;
  const entries=[];
  for (const rawLine of text.split(/\r?\n/).filter(x=>x.trim())) {
    let line=rawLine.trim();
    const overlay=/^w\/\s*/i.test(line); line=line.replace(/^w\/\s*/i,'');
    const numbered=line.match(/^(\d+)[.)]\s+/);
    if(numbered) {pos=Number(numbered[1]);line=line.slice(numbered[0].length);} else if(!overlay) pos++;
    const stamp=line.match(/^(\d{1,3}:\d{2}(?::\d{2})?)\s+/);
    let timeSeconds=null;
    if(stamp) {
      const parts=stamp[1].split(':').map(Number);
      if(parts.slice(1).some(n=>n>59)) throw new Error('Repère temporel invalide : '+stamp[1]);
      timeSeconds=parts.reduce((n,v)=>n*60+v,0); line=line.slice(stamp[0].length);
    }
    line=line.replace(/\s*\[[^\]]*\]/g,'').trim();
    const pair=line.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if(!pair) throw new Error('Ligne non reconnue : '+rawLine);
    const e={position:pos,artist:pair[1].trim(),title:pair[2].trim(),timeSeconds,layer:overlay?'overlay':'main'};
    e.status=unresolved(e)?'unresolved':'identified'; entries.push(e);
  }
  return entries;
}
