import {t,count} from './i18n.mjs?v=9ce790547f41';
import {trackCopyButton} from "./copy-track.mjs?v=350a954c381e";
const esc=value=>String(value??'').replace(/[&<>"\']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plur=(n,word)=>count(word==='DJ'?'players':'sets',n);
export function drawGraph(box,song,incoming,outgoing,hits,onTrack){
 const max=Math.max(1,Math.min(3,Math.max(incoming.length,outgoing.length)));
 const height=Math.max(310,110+max*144);box.style.height=height+'px';
 const mid=height/2;
 let svg=`<svg viewBox="0 0 1000 ${height}" aria-hidden="true"><defs><marker id="arrow-before" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="var(--graph-line)"/></marker><marker id="arrow-after" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="var(--graph-line)"/></marker></defs><g class="connections"></g>`;
 let nodes='';
 for(const [direction,edges] of [['before',incoming],['after',outgoing]]){
  const shown=edges.slice(0,3);
  nodes+=`<div class="graph-group ${direction}-group"><div class="graph-group-heading"><h3>${t(direction==='before'?'Joués avant':'Joués après')}</h3><p>${t("Alternatives observées, pas une suite de morceaux.")}</p></div>`;
  shown.forEach((edge,i)=>{
   const y=mid+(i-(shown.length-1)/2)*144;
   const x=direction==='before'?18:82;
   const label=direction==='before'?edge.fromEntry:edge.toEntry;
   nodes+=`<div class="graph-node ${direction}" style="left:${x}%;top:${y}px" data-node="${esc(direction==='before'?edge.from:edge.to)}"><button class="graph-open" data-node-action="${esc(direction==='before'?edge.from:edge.to)}" aria-label="${esc(t('Explorer {track}',{track:label.artist+' — '+label.title}))}"><strong>${esc(label.title)}</strong><small>${esc(label.artist)}</small><span>${plur(edge.setCount,'set')} · ${plur(edge.djCount,'DJ')}</span></button>${trackCopyButton(label)}</div>`;
  });
  if(!shown.length){
   const boundaries=hits.filter(h=>h.entry.layer==='main').every(h=>direction==='before'?(!h.before && !h.beforeGap):!h.after);
   nodes+=`<div class="graph-empty ${direction}">${boundaries && hits.some(h=>h.entry.layer==='main')?t(direction==='before'?'Début de la tracklist publiée':'Fin de la tracklist publiée'):t('Aucun voisin identifié dans ce corpus')}</div>`;
  }
  nodes+=`</div>`;
 }
 svg+=`</svg>`;
 box.insertAdjacentHTML('beforeend',svg+nodes+`<div class="graph-node center" style="left:50%;top:${mid}px"><strong>${esc(song.title)}</strong><small>${esc(song.artist)}</small><span>${plur(song.setCount,'set')}</span>${trackCopyButton(song)}</div>`);
 const connect=()=>{
  if(!box.isConnected)return;
  const bounds=box.getBoundingClientRect(), center=box.querySelector('.center').getBoundingClientRect();
  box.querySelector('svg').setAttribute('viewBox',`0 0 ${bounds.width} ${height}`);
  const paths=[];
  box.querySelectorAll('.graph-node[data-node]').forEach(node=>{
   const r=node.getBoundingClientRect(), before=node.classList.contains('before');
   const fromX=(before?r.right:center.right)-bounds.left+2;
   const toX=(before?center.left:r.left)-bounds.left-3;
   const fromY=(before?r.top+r.height/2:center.top+center.height/2)-bounds.top;
   const toY=(before?center.top+center.height/2:r.top+r.height/2)-bounds.top;
   const mx=(fromX+toX)/2, direction=before?'before':'after';
   paths.push(`<path d="M${fromX} ${fromY} C${mx} ${fromY} ${mx} ${toY} ${toX} ${toY}" stroke="var(--graph-line)" stroke-width="1.5" fill="none" marker-end="url(#arrow-${direction})"/>`);
  });
  box.querySelector('.connections').innerHTML=paths.join('');
 };
 connect();
 const observer=new ResizeObserver(connect);observer.observe(box);
 document.fonts.ready.then(connect);
 box.querySelectorAll('[data-node-action]').forEach(b=>b.onclick=()=>onTrack(b.dataset.nodeAction));
 if(incoming.length>3 || outgoing.length>3) box.insertAdjacentHTML('beforeend',`<span class="graph-caption" style="bottom:12px;top:auto;left:10px">${t("3 voisins par côté · tous les exemples sont conservés")}</span>`);
 return ()=>observer.disconnect();
}
