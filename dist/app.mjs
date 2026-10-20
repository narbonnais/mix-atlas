import {t,count,LANGUAGES,getLanguage,readLanguage,setLanguage,applyTranslations,translateError} from './i18n.mjs?v=9ce790547f41';
import {installTrackCopy} from './copy-track.mjs?v=350a954c381e';
import {loadCollection} from './data.mjs?v=04703d54ce2e';
import {parseWorkspaceRoute,formatWorkspaceRoute} from './route.mjs?v=ecdf53f500bf';
import {mountWorkspace} from './workspace-view.mjs?v=929d68d92878';
import {mountComparison} from './comparison-view.mjs?v=2e5b97586f7b';
import {collectionToCsv,parseCollectionFile} from './collection-format.mjs?v=947fdc3a8e58';
import {readCollection,saveCollection} from './collection-storage.mjs?v=eee7041911a1';
import {validateDataset,mergeDatasets,parseTracklist} from './core.mjs?v=17a220c19fc2';
const $=id=>document.getElementById(id);
let languageStorage;try{languageStorage=localStorage;}catch{}
setLanguage(readLanguage(languageStorage));applyTranslations();
async function start(){
syncLanguagePicker();
$('main').innerHTML=`<p class="field-hint" role="status">${t('Chargement de la collection…')}</p>`;
let data=validateDataset(await loadCollection()),state=parseWorkspaceRoute(location.hash),workspace,comparison,storageAvailable=true;
history.scrollRestoration='manual';
try{data=readCollection(data,localStorage);}catch{storageAvailable=false;}
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
function download(payload,name){const csv=name.endsWith('.csv');const blob=new Blob([csv?collectionToCsv(payload):JSON.stringify(payload,null,2)],{type:csv?'text/csv;charset=utf-8':'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function addData(payload){
 const imported=validateDataset(payload), result=mergeDatasets(data,imported);data=result.dataset;
 let persisted=false;
 try{saveCollection(data,localStorage);persisted=true;storageAvailable=true;}catch{storageAvailable=false;}
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
$('file-input').onchange=async e=>{const file=e.target.files[0];if(!file)return;$('file-error').textContent='';try{if(file.size>10000000)throw new Error('Le fichier dépasse 10 Mo.');addData(parseCollectionFile(await file.text(),file.name));e.target.value='';}catch(error){$('file-error').textContent=translateError(error);}};
$('export').onclick=()=>download(data,'mix-atlas-collection.csv');
$('export-json').onclick=()=>download(data,'mix-atlas-collection.json');
$('download-format').onclick=()=>download({schemaVersion:1,sets:[{title:t('Titre du set à remplacer'),djs:['DJ'],date:null,sourceUrl:'https://example.com/a-remplacer',mediaUrl:null,entries:[{position:1,artist:t('Artiste à remplacer'),title:t('Morceau à remplacer'),timeSeconds:null,layer:'main',status:'identified'}]}]},'mix-atlas-import-template.csv');

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

}
start().catch(()=>{
 $('main').innerHTML=`<div class="detail-empty" role="alert"><p>${t('Impossible de charger la collection. Réessaie.')}</p><button class="button outline" id="retry-load">${t('Réessayer')}</button></div>`;
 $('retry-load').onclick=()=>location.reload();
});
