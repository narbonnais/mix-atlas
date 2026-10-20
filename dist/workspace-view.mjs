import {t,count as formatCount,formatDate,sourceNote,locale} from './i18n.mjs?v=9ce790547f41';
import {trackCopyButton} from './copy-track.mjs?v=350a954c381e';
import {setTracklistRows,centerSelectedTrack} from './set-tracklist.mjs?v=44d4d2599b70';
import {workspaceItems,workspaceEvidence,preferredHit,playerLabel} from './workspace-model.mjs?v=419f4d87d093';
import {searchable,trackKey,unresolved,occurrences,transitions,listenUrl} from './core.mjs?v=17a220c19fc2';
import {drawGraph} from './transition-graph.mjs?v=13d6204e7a22';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=formatDate;
const arrow=`<svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg>`;
const back=`<svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M17 10H4m5-5-5 5 5 5"/></svg>`;

export function mountWorkspace({root,data,state,onChange,onCompare}){
 let items=[],matched=[],activeItem,limit=30,stopGraph=()=>{};
 state.scope='all';state.relation='supporters';state.expanded=true;state.reworks=false;state.joint=false;
 const $=id=>root.querySelector('#'+id);
 const labels={all:'results',tracks:'tracks',djs:'djs',sets:'sets'};
 root.innerHTML=`<h1 class="sr-only">${t("Explorer la collection")}</h1><div class="unified-workbench"><section class="workspace-browser" aria-label="${t("Recherche dans la collection")}">
  <label class="sr-only" for="workspace-search">${t("Morceau, artiste, DJ ou set")}</label><div class="result-tools"><div class="discovery-search-wrap"><svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input id="workspace-search" type="search" placeholder="${t("Morceau, artiste, DJ…")}" value="${esc(state.query)}" autocomplete="off"></div><details class="filter-disclosure" id="workspace-filters"><summary title="${t("Filtres")}"><svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14"/><circle cx="7" cy="5" r="2"/><circle cx="13" cy="10" r="2"/><circle cx="8" cy="15" r="2"/></svg><span class="sr-only">${t("Filtres")}</span></summary><div class="filter-popover"><label for="workspace-sort">${t("Trier par")}</label><select id="workspace-sort"><option value="count">${t("Le plus de sets")}</option><option value="recent">${t("Les plus récents")}</option><option value="name">${t("Nom")}</option></select></div></details></div>
  <div class="entity-switch" role="group" aria-label="${t("Type de résultat")}"><button data-type="all">${t("Tout")}</button><button data-type="tracks">${t("Morceaux")}</button><button data-type="djs">${t("DJs")}</button><button data-type="sets">${t("Sets")}</button></div>
  <div id="workspace-count" class="result-count" role="status" aria-live="polite"></div><div id="workspace-results" class="workspace-results"></div><button id="workspace-more" class="text-button load-results" hidden>${t("Voir plus")}</button>
 </section><section id="workspace-detail" class="workspace-detail" aria-label="${t("Morceau et set sélectionnés")}"></section></div>
 <details class="collection-method" id="workspace-sources"><summary>${t("Sources")}</summary><p>${t('sources.method')} ${t('L’ordre publié se vérifie à l’écoute.')}</p></details><section id="workspace-comparison" hidden></section>`;
 const commit=(replace=false)=>onChange({...state},replace);
 const remember=hit=>{state.set=hit.set.sourceUrl;state.track=unresolved(hit.entry)?null:trackKey(hit.entry);state.position=hit.entry.position;state.layer=hit.entry.layer;};
 const clearPassage=()=>{state.set=null;state.position=null;state.player='';};
 const openMobile=()=>{if(!activeItem)return;if(matchMedia('(max-width:720px)').matches){root.classList.add('detail-open');$('workspace-detail').scrollIntoView({block:'start'});$('workspace-detail-heading')?.focus({preventScroll:true});}};

 function selectTrack(id,set=null,entry=null){
  state.type='all';state.scope='all';state.expanded=true;state.track=id;state.item=id;state.query='';state.player='';state.set=set?.sourceUrl??null;state.position=entry?.position??null;state.layer=entry?.layer??'main';
  $('workspace-search').value='';limit=30;recalculate();commit();openMobile();if(!matchMedia('(max-width:720px)').matches)$('workspace-detail-heading')?.focus({preventScroll:true});
 }
 function renderDetail(){
  stopGraph();stopGraph=()=>{};
  const panel=$('workspace-detail');
  if(!activeItem){panel.innerHTML=`<div class="detail-empty"><h2>${t("Aucun résultat")}</h2><p>${t("Essaie un autre nom ou élargis les filtres.")}</p><button id="workspace-reset" class="button outline">${t("Effacer les filtres")}</button></div>`;$('workspace-reset').onclick=()=>{state.query='';state.scope='all';state.relation='supporters';state.reworks=false;state.joint=false;state.expanded=true;state.item=null;state.track=null;clearPassage();$('workspace-search').value='';syncControls();recalculate();commit();};return;}
  if(activeItem.kind==='recording'){
   const r=activeItem.recording;
   panel.innerHTML=`<button class="text-button mobile-result-back" id="workspace-back">${back}${t("Résultats")}</button><div class="detail-title"><div><h2 id="workspace-detail-heading" tabindex="-1">${esc(r.title)}</h2><p>${esc(r.djs.join(' & '))} · ${date(r.publishedOn)}</p></div></div><div class="detail-empty"><h3>${t("Tracklist à identifier")}</h3><p>${esc(sourceNote(r.note))}</p></div><div class="detail-actions"><a class="button primary" href="${esc(r.mediaUrl??r.sourceUrl)}" target="_blank" rel="noopener noreferrer">${t('Écouter le set')} ${arrow}</a><a class="source-link" href="${esc(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(t(r.sourceName))} ${arrow}</a></div>`;bindBack();return;
  }
  const evidence=workspaceEvidence(data,state.dj,activeItem,{...state,allSources:true});
  if(!evidence.length){panel.innerHTML=`<div class="detail-empty"><h2>${t("Aucun passage documenté")}</h2></div>`;return;}
  const players=[...new Set(evidence.map(playerLabel))];
  if(!players.includes(state.player))state.player='';
  const visible=state.player?evidence.filter(h=>playerLabel(h)===state.player):evidence;
  const hit=preferredHit(visible,state),song=hit.entry;
  remember(hit);
  const current=visible.indexOf(hit),url=listenUrl(hit.set,hit),count=new Set(visible.map(h=>h.set.sourceUrl)).size;
  const joint=hit.entry.performers?.length>1||(!hit.entry.performers?.length&&hit.set.djs.length>1);
  const tracks=activeItem.kind==='dj'&&!activeItem.performers?activeItem.tracks:[];
  panel.innerHTML=`<button class="text-button mobile-result-back" id="workspace-back">${back}${t("Résultats")}</button><div class="detail-title"><div><h2 id="workspace-detail-heading" tabindex="-1">${esc(song.title)}</h2><p>${esc(song.artist)}</p></div>${trackCopyButton(song)}</div>
   ${tracks.length>1?`<div class="discovery-chips workspace-track-chips" aria-label="${t("Morceaux en commun")}">${tracks.map(t=>`<button data-evidence-track="${esc(t.id)}" aria-pressed="${trackKey(song)===t.id}">${esc(t.title)}</button>`).join('')}</div>`:''}
   <div class="workspace-source-fields ${players.length===1?'single-player':''}">${players.length>1?`<label for="workspace-player">DJ<select id="workspace-player"><option value="">${t('Tous les DJs ({n})',{n:players.length})}</option>${players.map(p=>`<option value="${esc(p)}" ${state.player===p?'selected':''}>${esc(p)}</option>`).join('')}</select></label>`:''}<label for="workspace-passage">${formatCount('sets',count)}<select id="workspace-passage">${visible.map((h,i)=>`<option value="${i}" ${i===current?'selected':''}>${esc(h.set.title)}${visible.filter(x=>x.set===h.set).length>1?' · '+esc(h.entry.title)+' #'+h.entry.sourcePosition:''}</option>`).join('')}</select></label></div>
   <div class="workspace-source-meta"><span>${date(hit.set.date)}</span>${players.length===1?`<span>${esc(players[0])}</span>`:''}${joint?`<span>${t("Session partagée")}</span>`:''}${activeItem.shared?`<span>${t("Répertoire partagé")}</span>`:''}</div>
   ${hit.set.scopeNote||hit.set.accuracyNote?`<details class="set-scope" id="workspace-scope-notes"><summary>${t("Notes de la source")}</summary>${[hit.set.scopeNote,hit.set.accuracyNote].filter(Boolean).map(n=>`<p>${esc(sourceNote(n))}</p>`).join('')}</details>`:''}
   <div class="set-tracklist-tools"><span>${formatCount('tracks',hit.set.entries.filter(e=>e.layer==='main').length)}</span><button id="workspace-recenter" class="text-button" aria-label="${esc(t('Recentrer sur {track}',{track:song.title}))}"><svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="5"/><path d="M10 2v4m0 8v4M2 10h4m8 0h4"/></svg>${t("Recentrer")}</button></div>
   <div id="workspace-tracklist" class="set-tracklist" role="region" aria-label="${t("Tracklist du set")}" tabindex="0"><ol role="list">${setTracklistRows(hit.set,song,{interactive:true})}</ol></div>
   <div class="detail-actions">${hit.set.mediaUrl?`<a class="button primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6Z"/></svg>${song.timeSeconds!=null&&/(^|\.)youtube\.com$/.test(new URL(hit.set.mediaUrl).hostname)?t('Écouter le passage'):t('Écouter le set')}</a>`:''}<button id="workspace-compare" class="text-button">${t("Comparer ce set")}</button><a class="source-link" href="${esc(hit.set.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(t(hit.set.sourceName))} ${arrow}</a></div>
   <details class="workspace-transitions" id="workspace-transitions"><summary>${t("Transitions autour de ce morceau")}</summary><div class="graph" id="workspace-graph"><span class="graph-caption before">${t("Joué avant")}</span><span class="graph-caption after">${t("Joué après")}</span></div><p class="field-hint">${t("Les voisins sont des alternatives observées dans la collection.")}</p></details>`;
  const list=$('workspace-tracklist');centerSelectedTrack(list);requestAnimationFrame(()=>{if(list.isConnected)centerSelectedTrack(list);});
  $('workspace-recenter').onclick=()=>{centerSelectedTrack(list);list.focus({preventScroll:true});};
  if($('workspace-player'))$('workspace-player').onchange=e=>{state.player=e.target.value;state.set=null;state.position=null;renderDetail();commit();$('workspace-player').focus({preventScroll:true});};
  $('workspace-passage').onchange=e=>{remember(visible[Number(e.target.value)]);renderDetail();commit();$('workspace-passage').focus({preventScroll:true});};
  panel.querySelectorAll('[data-evidence-track]').forEach(b=>b.onclick=()=>{state.track=b.dataset.evidenceTrack;state.set=null;state.position=null;renderDetail();commit();panel.querySelector(`[data-evidence-track="${CSS.escape(state.track)}"]`)?.focus({preventScroll:true});});
  panel.querySelectorAll('[data-set-entry]').forEach(b=>b.onclick=()=>{const entry=hit.set.entries[Number(b.dataset.setEntry)];selectTrack(trackKey(entry),hit.set,entry);});
  $('workspace-compare').onclick=()=>onCompare(hit.set);
  let graphDrawn=false;
  $('workspace-transitions').ontoggle=e=>{if(!e.target.open||graphDrawn)return;graphDrawn=true;const sets=data.sets,id=trackKey(song),edges=transitions(sets),hits=occurrences(sets,id);stopGraph=drawGraph($('workspace-graph'),{...song,setCount:new Set(hits.map(h=>h.set.sourceUrl)).size},edges.filter(e=>e.to===id).sort((a,b)=>b.setCount-a.setCount),edges.filter(e=>e.from===id).sort((a,b)=>b.setCount-a.setCount),hits,id=>selectTrack(id));};
  bindBack();
 }
 function bindBack(){$('workspace-back').onclick=()=>{root.classList.remove('detail-open');$('workspace-search').scrollIntoView({block:'center'});$('workspace-search').focus({preventScroll:true});};}
 function syncControls(){
  root.querySelectorAll('[data-type]').forEach(b=>{b.classList.toggle('active',b.dataset.type===state.type);b.setAttribute('aria-pressed',String(b.dataset.type===state.type));});
  $('workspace-sort').value=state.order;
 }
 function renderResults(){
  const q=searchable(state.query);
  matched=items.filter(item=>searchable(item.title+' '+item.artist+(item.kind==='set'?' '+item.set.entries.map(e=>e.artist+' '+e.title).join(' '):item.kind==='dj'?' '+item.tracks.map(t=>t.artist+' '+t.title).join(' '):'')).includes(q));
  const relevance=item=>q&&state.order==='count'?(searchable(item.title)===q?2:searchable(item.title).startsWith(q)?1:0):0;
  matched.sort((a,b)=>relevance(b)-relevance(a)||(state.order==='name'?(a.artist+' '+a.title).localeCompare(b.artist+' '+b.title,locale()):state.order==='recent'?(b.latestDate??b.date??'').localeCompare(a.latestDate??a.date??''):(b.setCount??0)-(a.setCount??0)||(b.latestDate??b.date??'').localeCompare(a.latestDate??a.date??'')));
  activeItem=matched.find(i=>i.id===(state.type==='tracks'?state.track:state.item??state.track))??matched[0];
  if(activeItem&&state.type!=='tracks')state.item=activeItem.id;
  const visible=matched.slice(0,limit);if(activeItem&&!visible.includes(activeItem))visible.unshift(activeItem);
  $('workspace-count').textContent=formatCount(labels[state.type],matched.length);
  $('workspace-results').innerHTML=visible.map((item,i)=>`<div class="discovery-result-row ${item===activeItem?'active':''}"><button class="discovery-result" data-result-index="${i}" aria-pressed="${item===activeItem}" aria-controls="workspace-detail"><span class="result-copy"><strong>${esc(item.title)}</strong><small>${esc(item.kind==='dj'&&item.performers?formatCount('tracks',item.tracks.length):item.artist||t('Session partagée'))}${item.kind==='recording'?' · '+t('tracklist à identifier'):''}</small>${item.joint?`<span class="joint-label">${t("Session partagée")}</span>`:''}</span><span class="result-meta">${state.type==='all'?`<span class="result-kind">${t(item.kind==='track'?'Morceau':item.kind==='dj'?'DJ':'Set')}</span>`:''}${item.kind==='track'||item.kind==='dj'?formatCount('sets',item.setCount):date(item.date)}</span></button>${item.kind==='track'?trackCopyButton(item):''}</div>`).join('')||`<p class="empty-list">${t("Aucun résultat. Essaie un autre nom.")}</p>`;
  root.querySelectorAll('[data-result-index]').forEach(b=>b.onclick=()=>{activeItem=visible[Number(b.dataset.resultIndex)];clearPassage();state.item=activeItem.id;state.track=activeItem.kind==='track'?activeItem.id:activeItem.kind==='set'?state.track:null;renderResults();commit();openMobile();if(!matchMedia('(max-width:720px)').matches)root.querySelector(`[data-result-index="${b.dataset.resultIndex}"]`)?.focus({preventScroll:true});});
  $('workspace-more').hidden=matched.length<=limit;root.classList.toggle('no-results',!activeItem);renderDetail();
 }
 function recalculate(){items=workspaceItems(data,state.dj,{...state,allSources:true});syncControls();renderResults();}
 $('workspace-search').oninput=e=>{state.query=e.target.value;limit=30;renderResults();commit(true);};
 root.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{state.type=b.dataset.type;state.item=null;state.player='';limit=30;root.classList.remove('detail-open');recalculate();commit();});
 for(const [id,key] of [['workspace-sort','order']])$(id).onchange=e=>{state[key]=e.target.value;state.item=null;clearPassage();limit=30;recalculate();commit();};
 $('workspace-more').onclick=()=>{const previous=limit;limit+=30;renderResults();root.querySelectorAll('[data-result-index]')[previous]?.focus();};
 recalculate();commit(true);
 return {selectTrack,showDetail:openMobile,openSets:()=>{state.type='sets';state.item=null;state.query='';$('workspace-search').value='';root.classList.remove('detail-open');recalculate();commit();},destroy:()=>stopGraph()};
}
