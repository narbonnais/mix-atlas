const views=new Set(['explorer','discover','sets','compare','peers']);
const artistName=value=>typeof value==='string'&&value.trim()&&value.length<=200&&!/[\u0000-\u001f]/.test(value)?value.trim():null;
export function parseRoute(hash=''){
 const [name,query]=hash.replace(/^#/,'').split('?'),params=new URLSearchParams(query);
 return {view:views.has(name)?name:'explorer',mode:params.get('mode')==='external'?'external':'supporters',dj:artistName(params.get('dj')),track:params.get('track')||null,expanded:params.get('linked')==='1'};
}
export function formatRoute({view='explorer',mode='supporters',dj=null,track=null,expanded=false}={}){
 const params=new URLSearchParams();
 if(view==='discover')params.set('mode',mode);
 if(artistName(dj))params.set('dj',dj);
 if(track&&view==='explorer')params.set('track',track);
 if(expanded)params.set('linked','1');
 return '#'+view+(params.size?'?'+params.toString():'');
}

export function parseWorkspaceRoute(hash=''){
 const [name,query]=hash.replace(/^#/,'').split('?'),p=new URLSearchParams(query);
 const legacyType=name==='discover'?(p.get('mode')==='external'?'tracks':'djs'):name==='sets'?'sets':name==='peers'?'djs':'all';
 const type=['all','tracks','djs','sets'].includes(p.get('type'))?p.get('type'):legacyType;
 const scope=['all','productions','external'].includes(p.get('scope'))?p.get('scope'):name==='discover'&&p.get('mode')==='external'?'external':'all';
 const position=Number(p.get('position'));
 return {type,scope,dj:artistName(p.get('dj')),query:p.get('q')??'',
  track:p.get('track')||null,item:p.get('item')||null,set:p.get('set')||null,
  position:Number.isInteger(position)&&position>0?position:null,layer:p.get('layer')==='overlay'?'overlay':'main',
  player:p.get('player')??'',expanded:p.get('linked')==='1'||(name!=='sets'&&p.get('linked')!=='0'),reworks:p.get('reworks')==='1',joint:p.get('joint')==='1',
  relation:name==='peers'||p.get('relation')==='shared'?'shared':'supporters',
  order:['recent','name','count'].includes(p.get('sort'))?p.get('sort'):'count',tool:name==='compare'||p.get('tool')==='compare'?'compare':null};
}

export function formatWorkspaceRoute(state){
 const p=new URLSearchParams();
 if(state.type!=='all')p.set('type',state.type);
 if(state.scope!=='all')p.set('scope',state.scope);
 if(artistName(state.dj))p.set('dj',state.dj);
 if(state.query)p.set('q',state.query);
 if(state.track)p.set('track',state.track);
 if(state.item&&state.type!=='tracks')p.set('item',state.item);
 if(state.set)p.set('set',state.set);
 if(state.position)p.set('position',state.position);
 if(state.layer==='overlay')p.set('layer','overlay');
 if(state.player)p.set('player',state.player);
 if(!state.expanded)p.set('linked','0');
 if(state.reworks)p.set('reworks','1');
 if(state.joint)p.set('joint','1');
 if(state.relation==='shared')p.set('relation','shared');
 if(state.order!=='count')p.set('sort',state.order);
 if(state.tool)p.set('tool',state.tool);
 return '#explorer'+(p.size?'?'+p.toString():'');
}
