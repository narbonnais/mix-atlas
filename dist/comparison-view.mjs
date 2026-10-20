import {t,count,number,sourceNote} from './i18n.mjs?v=9ce790547f41';
import {compareSets,comparisonDefaults} from './compare.mjs?v=e9d7d5e15ddb';
import {trackKey,occurrences,timeLabel,listenUrl} from './core.mjs?v=17a220c19fc2';
import {trackCopyButton} from './copy-track.mjs?v=350a954c381e';
import {setTracklistRows,centerSelectedTrack} from './set-tracklist.mjs?v=44d4d2599b70';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function mountComparison({root,data,leftUrl,initialState,onSelect,onClose}){
 const defaults=comparisonDefaults(data.sets,leftUrl,initialState),ordered=defaults.ordered;
 let leftId=defaults.leftId,rightId=defaults.rightId;
 let selected=initialState?.track??null;
 const $=id=>root.querySelector('#'+id);
 function render(){
  const left=data.sets.find(s=>s.sourceUrl===leftId),right=data.sets.find(s=>s.sourceUrl===rightId);
  if(!left||!right){root.innerHTML=`<div class="comparison-header"><h2 id="comparison-heading" tabindex="-1">${t("Comparer deux sets")}</h2><button class="text-button" id="close-comparison">${t("Fermer")}</button></div><p class="field-hint">${t("Ajoute deux tracklists pour les comparer.")}</p>`;$('close-comparison').onclick=onClose;return;}
  const result=compareSets(left,right);if(!result.common.some(p=>trackKey(p.left)===selected))selected=result.common[0]?trackKey(result.common[0].left):null;
  const options=id=>ordered.map(s=>`<option value="${esc(s.sourceUrl)}" ${s.sourceUrl===id?'selected':''}>${esc(s.title)}</option>`).join('');
  const stats=(set,value)=>`<div><h3>${esc(set.title)}</h3>${set.scopeNote?`<p>${esc(sourceNote(set.scopeNote))}</p>`:''}<dl class="comparison-stats"><div><dt>${t("Durée indiquée")}</dt><dd>${value.duration?timeLabel(value.duration):t('Non précisée')}</dd></div><div><dt>${t("Positions importées")}</dt><dd>${number(value.positions)}</dd></div><div><dt>${t("Identifications 1001")}</dt><dd>${value.sourceIdentified!==null?number(value.sourceIdentified)+'/'+number(set.sourceTotalPositions??value.positions):'—'}</dd></div><div><dt>${t("Écart médian entre repères")}</dt><dd>${value.cadence!==null?timeLabel(value.cadence):t('Sans repères')}</dd></div></dl></div>`;
  root.innerHTML=`<div class="comparison-header"><h2 id="comparison-heading" tabindex="-1">${t("Comparer deux sets")}</h2><button class="text-button" id="close-comparison">${t("Fermer")}</button></div>
   <div class="comparison-selectors"><label for="compare-left">${t("Premier set")}<select id="compare-left">${options(leftId)}</select></label><label for="compare-right">${t("Deuxième set")}<select id="compare-right">${options(rightId)}</select></label></div>
   <div class="comparison-common"><h3>${count('common',result.common.length)}</h3><div class="discovery-chips">${result.common.map(p=>`<div class="track-chip"><button data-common="${esc(trackKey(p.left))}" aria-pressed="${trackKey(p.left)===selected}">${esc(p.left.title)}</button>${trackCopyButton(p.left)}</div>`).join('')}</div>${!result.common.length?`<p class="field-hint">${t("Aucune version exacte identifiée en commun.")}</p>`:''}${selected?`<button class="text-button" id="explore-common">${t("Explorer ce morceau")}</button>`:''}</div>
   <div class="comparison-pair">${[left,right].map((set,i)=>{const entry=result.common.find(p=>trackKey(p.left)===selected)?.[i?'right':'left'],hit=entry?occurrences([set],trackKey(entry)).find(h=>h.entry===entry):null;return `<section aria-label="${t(i?'Tracklist du deuxième set':'Tracklist du premier set')}"><div class="set-tracklist" role="region" aria-label="${esc(set.title)}" tabindex="0"><ol role="list">${setTracklistRows(set,entry)}</ol></div><div class="detail-actions">${set.mediaUrl?`<a class="button outline" href="${esc(hit?listenUrl(set,hit):set.mediaUrl)}" target="_blank" rel="noopener noreferrer">${t("Écouter le set")}</a>`:''}<a class="source-link" href="${esc(set.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(t(set.sourceName))}</a></div></section>`;}).join('')}</div>
   <details class="comparison-analysis"><summary>${t("Analyse et limites")}</summary><div class="comparison-pair">${stats(left,result.left)}${stats(right,result.right)}</div><p>${t('comparison.versions')}</p>${result.provisional.length?`<p>${esc(t('comparison.provisional',{n:result.provisional.length,titles:result.provisional.join(', ')}))}</p>`:''}<p>${t("Les écarts entre repères décrivent la cadence indiquée, pas les fondus. Les IDs ne créent pas de liens fiables.")}</p></details>`;
  root.querySelectorAll('.set-tracklist').forEach(centerSelectedTrack);
  $('close-comparison').onclick=onClose;
  for(const [id,side] of [['compare-left','left'],['compare-right','right']])$(id).onchange=e=>{if(side==='left')leftId=e.target.value;else rightId=e.target.value;selected=null;render();$(id).focus({preventScroll:true});};
  root.querySelectorAll('[data-common]').forEach(b=>b.onclick=()=>{selected=b.dataset.common;render();root.querySelector(`[data-common="${CSS.escape(selected)}"]`)?.focus({preventScroll:true});});
  if($('explore-common'))$('explore-common').onclick=()=>{const entry=result.common.find(p=>trackKey(p.left)===selected).left;onSelect(selected,left,entry);};
 }
 root.hidden=false;render();root.scrollIntoView({block:'start'});$('comparison-heading')?.focus({preventScroll:true});
 return {snapshot:()=>({leftUrl:leftId,rightUrl:rightId,track:selected})};
}
