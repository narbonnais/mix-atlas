import {validateDataset} from './core.mjs?v=17a220c19fc2';

const columns=['source_url','set_title','djs','date','position','artist','title','time_seconds','layer','track_id','status','performers','break_before','record_type','media_url','source_name','source_position','source_time_seconds','source_identified','set_metadata','entry_metadata','collection_metadata','format_version'];
const bad=()=>{throw new Error('Invalid CSV. Use the CSV template.');};
const omit=(value,keys)=>Object.fromEntries(Object.entries(value).filter(([key])=>!keys.includes(key)));
const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
// Protect spreadsheet formula cells reversibly in files bearing our version marker.
const protect=value=>/^[=+@\-\t\r\n']/.test(value)?"'"+value:value;
const unprotect=value=>/^'[=+@\-\t\r\n']/.test(value)?value.slice(1):value;
function table(text){
 const rows=[];let row=[],cell='',quoted=false,closed=false;
 text=String(text).replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
  if(c==='"'){if(cell||closed)bad();quoted=true;continue;}
  if(c===','||c==='\n'||c==='\r'){
   row.push(cell);cell='';closed=false;
   if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(Boolean))rows.push(row);row=[];}
   if(rows.length>22000)bad();
  }else{if(closed)bad();cell+=c;}
 }
 if(quoted)bad();
 if(cell||row.length||closed){row.push(cell);if(row.some(Boolean))rows.push(row);}
 return rows;
}
const object=value=>{try{const result=JSON.parse(value);if(!result||Array.isArray(result)||typeof result!=='object')bad();return result;}catch{bad();}};
const list=value=>{
 if(!value)return [];
 if(value.startsWith('[')){try{const result=JSON.parse(value);if(!Array.isArray(result)||result.some(v=>typeof v!=='string'))bad();return result;}catch{bad();}}
 return value.split('|').map(v=>v.trim()).filter(Boolean);
};
const integer=value=>{if(value==='')return null;if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value)))bad();return Number(value);};
const boolean=value=>{if(!['','true','false','1','0'].includes(value))bad();return value==='true'||value==='1';};

export function collectionToCsv(input){
 const data=validateDataset(input),rows=[];
 const collectionMetadata=JSON.stringify(omit(data,['sets','recordings']));
 const base=set=>({source_url:set.sourceUrl,set_title:set.title,djs:JSON.stringify(set.djs),date:set.date??'',media_url:set.mediaUrl??'',source_name:set.sourceName??'',format_version:'1'});
 for(const set of data.sets)for(const [index,e] of set.entries.entries())rows.push({...base(set),
  position:e.position,artist:e.artist,title:e.title,time_seconds:e.timeSeconds??'',layer:e.layer,track_id:e.trackId??'',status:e.status,
  performers:JSON.stringify(e.performers),break_before:String(e.breakBefore),record_type:'track',source_position:e.sourcePosition,
  source_time_seconds:e.sourceTimeSeconds??'',source_identified:String(e.sourceIdentified),
  set_metadata:index===0?JSON.stringify(omit(set,['entries','sourceUrl','title','djs','date','mediaUrl','sourceName'])):'',
  entry_metadata:JSON.stringify(omit(e,['position','artist','title','timeSeconds','layer','trackId','status','performers','breakBefore','sourcePosition','sourceTimeSeconds','sourceIdentified']))});
 for(const recording of data.recordings)rows.push({...base(recording),date:recording.publishedOn??'',record_type:'recording',set_metadata:JSON.stringify(omit(recording,['sourceUrl','title','djs','mediaUrl','sourceName']))});
 if(!rows.length)rows.push({record_type:'collection',format_version:'1'});
 rows[0].collection_metadata=collectionMetadata;
 return '\uFEFF'+[columns.join(','),...rows.map(row=>columns.map(key=>quote(protect(String(row[key]??'')))).join(','))].join('\r\n')+'\r\n';
}

export function collectionFromCsv(text){
 const [headers,...rows]=table(text);
 if(!headers||new Set(headers).size!==headers.length||!['source_url','set_title','djs','position','artist','title'].every(key=>headers.includes(key)))bad();
 let metadata=null;
 const groups=new Map(),recordings=[],recordingUrls=new Set();
 for(const cells of rows){
  if(cells.length!==headers.length)bad();
  let row=Object.fromEntries(headers.map((key,index)=>[key,cells[index]]));
  if(row.format_version&&row.format_version!=='1')bad();
  if(row.format_version==='1')row=Object.fromEntries(Object.entries(row).map(([key,value])=>[key,unprotect(value)]));
  if(row.collection_metadata){if(metadata)bad();metadata=object(row.collection_metadata);}
  if(row.record_type==='collection'){if(rows.length!==1||row.source_url)bad();continue;}
  const fields={sourceUrl:row.source_url,title:row.set_title,djs:list(row.djs),date:row.date||null,mediaUrl:row.media_url||null,sourceName:row.source_name??'Personal import'};
  if(row.record_type==='recording'){
   if(recordingUrls.has(fields.sourceUrl))bad();recordingUrls.add(fields.sourceUrl);
   const extra=row.set_metadata?object(row.set_metadata):{};
   recordings.push({...extra,...omit(fields,['date']),publishedOn:fields.date});continue;
  }
  if(row.record_type&&row.record_type!=='track')bad();
  const fingerprint=JSON.stringify(fields);
  if(!groups.has(fields.sourceUrl))groups.set(fields.sourceUrl,{fields,fingerprint,metadata:null,entries:[]});
  const group=groups.get(fields.sourceUrl);if(group.fingerprint!==fingerprint)bad();
  if(row.set_metadata){if(group.metadata)bad();group.metadata=object(row.set_metadata);}
  group.entries.push({...row.entry_metadata?object(row.entry_metadata):{},position:integer(row.position??''),artist:row.artist,title:row.title,
   timeSeconds:integer(row.time_seconds??''),layer:row.layer||'main',trackId:row.track_id||null,status:row.status||'identified',
   performers:list(row.performers??''),breakBefore:boolean(row.break_before??''),sourcePosition:row.source_position||row.position,
   sourceTimeSeconds:integer(row.source_time_seconds??''),sourceIdentified:boolean(row.source_identified??'')});
 }
 if(!rows.length)bad();
 return validateDataset({...metadata,schemaVersion:1,sets:[...groups.values()].map(g=>({...g.metadata,...g.fields,entries:g.entries})),recordings});
}

export function parseCollectionFile(text,name=''){
 if(new TextEncoder().encode(text).length>10_000_000)throw new Error('Le fichier dépasse 10 Mo.');
 if(/\.csv$/i.test(name)||(!/\.json$/i.test(name)&&!/^\s*[\[{]/.test(text.replace(/^\uFEFF/,''))))return collectionFromCsv(text);
 try{return validateDataset(JSON.parse(text.replace(/^\uFEFF/,'')));}
 catch(error){if(error instanceof SyntaxError)throw new Error('Invalid collection file. Choose CSV or JSON.');throw error;}
}
