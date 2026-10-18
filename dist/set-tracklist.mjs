import {t} from './i18n.mjs?v=013c303142ac';
import {trackCopyButton} from './copy-track.mjs?v=e24accac4595';
import {timeLabel,unresolved} from './core.mjs?v=f639e478edea';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function setTracklistRows(set,selectedEntry,{interactive=false}={}){
 let previousMain=null;
 return set.entries.map((entry,index)=>{
  const selected=entry===selectedEntry,overlay=entry.layer==='overlay',unknown=unresolved(entry);
  const missing=overlay||entry.breakBefore?0:entry.position-(previousMain?.position??0)-1;
  const section=entry.breakBefore||(!previousMain&&entry.performers?.length)
   ?`<li class="set-tracklist-note">${esc(entry.performers?.length?entry.performers.join(' & '):t('Nouvelle section'))}</li>`:'';
  const gap=missing>0?`<li class="set-tracklist-note">${t(missing===1?'Position non renseignée':'Positions non renseignées')} : ${previousMain?previousMain.position+1:1}${missing>1?'–'+(entry.position-1):''}</li>`:'';
  if(!overlay)previousMain=entry;
  return `${section}${gap}<li class="set-track${selected?' selected':''}${overlay?' overlay':''}${unknown?' unresolved':''}"${selected?' aria-current="true"':''}>
   <span class="set-track-position">${overlay?'w/':esc(entry.sourcePosition??String(entry.position).padStart(2,'0'))}</span>
   <${interactive&&!unknown?'button type="button" data-set-entry="'+index+'"':'div'} class="set-track-copy${interactive&&!unknown?' set-track-open':''}"><strong>${esc(entry.title)}</strong><small>${esc(entry.artist)}${entry.timeSeconds!=null?` <span class="set-track-time">· ${timeLabel(entry.timeSeconds)}</span>`:''}${unknown?' · '+t('non identifié'):''}${overlay?' · '+t('superposition'):''}${selected?` <span class="set-track-current">· ${t('Sélectionné')}</span>`:''}</small></${interactive&&!unknown?'button':'div'}>
   ${trackCopyButton(entry)}
  </li>`;
 }).join('');
}

export function centerSelectedTrack(container){
 const selected=container.querySelector('[aria-current="true"]');
 if(!selected||!container.clientHeight)return;
 const listBounds=container.getBoundingClientRect(),rowBounds=selected.getBoundingClientRect();
 container.scrollTop+=rowBounds.top-listBounds.top-(container.clientHeight-rowBounds.height)/2;
}
