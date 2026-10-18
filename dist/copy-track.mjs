import {t} from './i18n.mjs?v=013c303142ac';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COPY_ICON='<svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="7" width="9" height="10" rx="2"/><path d="M12 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>';
const CHECK_ICON='<svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>';

export function trackCopyButton(track){
 const text=[track.artist,track.title].map(value=>String(value??'').trim()).filter(Boolean).join(' — ');
 if(!text)return '';
 return `<button type="button" class="copy-track" data-copy-text="${esc(text)}" aria-label="${esc(t('Copier {track}',{track:text}))}" title="${t('Copier l’artiste et le titre')}">${COPY_ICON}</button>`;
}

function legacyCopy(text,button){
 const active=document.activeElement,buffer=document.createElement('textarea');
 buffer.value=text;buffer.readOnly=true;buffer.tabIndex=-1;buffer.className='copy-buffer';
 buffer.setAttribute('aria-label',t('Texte à copier'));
 // Stay inside the current dialog or search panel so its focus scope is preserved.
 button.parentElement.append(buffer);
 try{buffer.focus({preventScroll:true});buffer.select();return document.execCommand('copy');}
 finally{buffer.remove();if(active?.isConnected)active.focus({preventScroll:true});}
}

export function installTrackCopy({onCopied,onError}){
 const timers=new WeakMap();
 document.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-copy-text]');
  if(!button)return;
  event.preventDefault();event.stopPropagation();
  const text=button.dataset.copyText;
  let copied=false;
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);copied=true;}}catch{}
  if(!copied){try{copied=legacyCopy(text,button);}catch{}}
  if(!copied){onError();return;}
  button.innerHTML=CHECK_ICON;button.title=t('Copié');
  clearTimeout(timers.get(button));
  timers.set(button,setTimeout(()=>{button.innerHTML=COPY_ICON;button.title=t('Copier l’artiste et le titre');},1800));
  onCopied(text);
 },true);
}
