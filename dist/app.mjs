import {t,count,LANGUAGES,getLanguage,readLanguage,setLanguage,applyTranslations,translateError} from './i18n.mjs?v=013c303142ac';
import {installTrackCopy} from './copy-track.mjs?v=e24accac4595';
import {SEED} from './data.mjs?v=dddc305e0306';
import {parseWorkspaceRoute,formatWorkspaceRoute} from './route.mjs?v=a50bb487b14c';
import {mountWorkspace} from './workspace-view.mjs?v=64dd8c29f259';
import {mountComparison} from './comparison-view.mjs?v=5a58673aff20';
import {validateDataset,mergeDatasets,restoreCollection,parseTracklist} from './core.mjs?v=f639e478edea';
const $=id=>document.getElementById(id);
let languageStorage;try{languageStorage=localStorage;}catch{}
setLanguage(readLanguage(languageStorage));applyTranslations();syncLanguagePicker();
let data=validateDataset(SEED),state=parseWorkspaceRoute(location.hash),workspace,comparison,storageAvailable=true;
history.scrollRestoration='manual';
try{const saved=localStorage.getItem('olander-atlas-v1');if(saved)data=restoreCollection(data,validateDataset(JSON.parse(saved)));}catch{storageAvailable=false;}
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('toast').hidden=true,6000);}
installTrackCopy({onCopied:text=>notify(t('Copié : {track}',{track:text})),onError:()=>notify(t('Copie bloquée. Réessaie ou copie le texte manuellement.'))});
function updateRoute(replace=false){const hash=formatWorkspaceRoute(state);if(hash!==location.hash)history[replace?'replaceState':'pushState'](null,'',hash);}
function openComparison(set,initialState){
 state.tool='compare';updateRoute();
 comparison=mountComparison({root:$('workspace-comparison'),data,leftUrl:set?.sourceUrl,initialState,
  onClose:()=>{state.tool=null;$('workspace-comparison').hidden=true;updateRoute();$('workspace-detail-heading')?.focus({preventScroll:true});},
  onSelect:(id,set,entry)=>{state.tool=null;$('workspace-comparison').hidden=true;workspace.selectTrack(id,set,entry);}
 });
}
function mount({preservePane=false,comparisonState=null}={}){
 const wasDetail=$('main').classList.contains('detail-open'),scroll=window.scrollY;
 const openDetails=preservePane?[...$('main').querySelectorAll('details[open][id]')].map(el=>el.id):[];
 const resultScroll=$('workspace-results')?.scrollTop??0;
 const restoreSelection=Boolean(state.track||state.item||state.set);
 workspace?.destroy();$('main').classList.remove('detail-open');
 workspace=mountWorkspace({root:$('main'),data,state,onChange:(next,replace)=>{Object.assign(state,next);updateRoute(replace);},onCompare:openComparison});
 window.scrollTo({top:0,behavior:'instant'});
 if(restoreSelection&&(!preservePane||wasDetail))workspace.showDetail();
 if(state.tool==='compare')openComparison(undefined,comparisonState);
 if(preservePane){openDetails.forEach(id=>{if($(id))$(id).open=true;});if($('workspace-results'))$('workspace-results').scrollTop=resultScroll;window.scrollTo({top:scroll,behavior:'instant'});}
}
function download(payload,name){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function addData(payload){
 const imported=validateDataset(payload), result=mergeDatasets(data,imported);data=result.dataset;
 let persisted=false;
 try{localStorage.setItem('olander-atlas-v1',JSON.stringify(data));persisted=true;storageAvailable=true;}catch{storageAvailable=false;}
 mount();$('data-dialog').close();
 notify(t('import.success',{added:count('added',result.added),updated:count('updated',result.updated),storage:t(persisted?'Enregistré dans ce navigateur.':'Mémoire temporaire : exporte ta collection pour la conserver.')}));
}

document.querySelector('.skip-link').onclick=e=>{e.preventDefault();$('main').focus();$('main').scrollIntoView({block:'start'});};
document.querySelector('.brand').onclick=e=>{e.preventDefault();state={...parseWorkspaceRoute(),dj:state.dj};mount();updateRoute();};
$('open-collection').onclick=()=>{document.querySelector('.tools-menu').open=false;workspace.openSets();};
$('open-compare').onclick=()=>{document.querySelector('.tools-menu').open=false;openComparison();};
$('open-data').onclick=()=>$('data-dialog').showModal();$('close-data').onclick=()=>$('data-dialog').close();
function importTab(which){const pasted=which==='paste';$('paste-form').hidden=!pasted;$('json-panel').hidden=pasted;$('paste-tab').classList.toggle('active',pasted);$('json-tab').classList.toggle('active',!pasted);}
$('paste-tab').onclick=()=>importTab('paste');$('json-tab').onclick=()=>importTab('json');
$('paste-form').onsubmit=e=>{e.preventDefault();$('paste-error').textContent='';const f=new FormData(e.target);try{addData({schemaVersion:1,sets:[{title:f.get('setTitle'),djs:f.get('djs').split(',').map(x=>x.trim()).filter(Boolean),date:f.get('date')||null,sourceUrl:f.get('sourceUrl'),mediaUrl:f.get('mediaUrl')||null,sourceName:'Personal import',entries:parseTracklist(f.get('tracklist'))}]});e.target.reset();}catch(error){$('paste-error').textContent=translateError(error);}};
$('file-input').onchange=async e=>{const file=e.target.files[0];if(!file)return;$('file-error').textContent='';try{if(file.size>10000000)throw new Error('Le fichier dépasse 10 Mo.');addData(JSON.parse(await file.text()));e.target.value='';}catch(error){$('file-error').textContent=error instanceof SyntaxError?t('Le fichier ne contient pas une collection JSON valide.'):translateError(error);}};
$('export').onclick=()=>download(data,'mix-atlas-collection.json');
$('download-format').onclick=()=>download({schemaVersion:1,sets:[{title:t('Titre du set à remplacer'),djs:['DJ'],date:null,sourceUrl:'https://example.com/a-remplacer',mediaUrl:null,entries:[{position:1,artist:t('Artiste à remplacer'),title:t('Morceau à remplacer'),timeSeconds:null,layer:'main',status:'identified'}]}]},'mix-atlas-import-template.json');

function syncLanguagePicker(){
 const language=getLanguage(),label=`${t('Langue')}: ${LANGUAGES[language]}`;
 $('language-flag').src=`language-${language}.svg`;
 $('language-button').setAttribute('aria-label',label);$('language-button').title=label;
 document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
}
$('language-button').onclick=()=>{
 document.querySelector('.tools-menu').open=false;
 $('language-dialog').showModal();
 $('language-dialog').querySelector('[aria-pressed="true"]').focus({preventScroll:true});
};
$('close-language').onclick=()=>$('language-dialog').close();
$('language-dialog').addEventListener('close',()=>$('language-button').focus({preventScroll:true}));
document.querySelectorAll('[data-language]').forEach(button=>button.onclick=()=>{
 $('language-dialog').close();
 if(button.dataset.language===getLanguage())return;
 const comparisonState=comparison?.snapshot();setLanguage(button.dataset.language,languageStorage);applyTranslations();syncLanguagePicker();
 $('paste-error').textContent='';$('file-error').textContent='';$('toast').hidden=true;
 mount({preservePane:true,comparisonState});$('language-button').focus({preventScroll:true});
});
window.addEventListener('popstate',()=>{state=parseWorkspaceRoute(location.hash);mount();});
mount();
if(!storageAvailable)notify(t('Le stockage local est indisponible ou la sauvegarde est illisible. La collection initiale reste accessible.'));
