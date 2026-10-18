import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setTracklistRows} from '../dist/set-tracklist.mjs';
import {validateDataset} from '../dist/core.mjs';
import {otherSelections} from '../dist/discover.mjs';
import {readFileSync} from 'node:fs';

test('the complete list highlights one exact occurrence, including repeated tracks and overlays',()=>{
 const entries=[
  {position:1,layer:'main',artist:'Artist',title:'Track'},
  {position:1,layer:'overlay',artist:'Artist',title:'Track'},
  {position:2,layer:'main',artist:'Artist',title:'Track (Remix)'},
  {position:3,layer:'main',artist:'Artist',title:'Track'},
  {position:4,layer:'main',artist:'ID',title:'ID',status:'unresolved'}
 ];
 const rows=setTracklistRows({entries},entries[3]);
 assert.equal((rows.match(/class="set-track[ "]/g)??[]).length,5);
 assert.equal((rows.match(/aria-current="true"/g)??[]).length,1);
 assert.match(rows,/<li class="set-track selected" aria-current="true">\s*<span class="set-track-position">03<\/span>/);
 assert.match(rows,/Track \(Remix\)/);
 assert.match(rows,/overlay/);
 assert.match(rows,/unidentified/);
 const overlay=setTracklistRows({entries},entries[1]);
 assert.match(overlay,/<li class="set-track selected overlay" aria-current="true">/);
});

test('missing positions and performer boundaries remain explicit and source text is escaped',()=>{
 const rows=setTracklistRows({entries:[
  {position:3,layer:'main',artist:'A & B',title:'<title>'},
  {position:7,layer:'main',artist:'Artist',title:'Second',breakBefore:true,performers:['Guest <DJ>']},
  {position:9,layer:'main',artist:'Artist',title:'Third'}
 ]});
 assert.match(rows,/Missing positions : 1–2/);
 assert.match(rows,/Missing position : 8/);
 assert.doesNotMatch(rows,/Missing positions : 4–6/);
 assert.match(rows,/Guest &lt;DJ&gt;/);
 assert.match(rows,/&lt;title&gt;/);
 assert.match(rows,/A &amp; B/);
 assert.doesNotMatch(rows,/aria-current/);
});

test('Lille Vals in Bijou retains the whole published set around the selected track',()=>{
 const data=validateDataset(JSON.parse(readFileSync(new URL('../dist/dataset.json',import.meta.url))));
 const track=otherSelections(data).find(t=>t.title==='Lille Vals'&&t.artist==='Storken');
 const hit=track.evidence.find(h=>h.set.title.includes('Bijou Boston'));
 const rows=setTracklistRows(hit.set,hit.entry);
 assert.equal((rows.match(/class="set-track[ "]/g)??[]).length,hit.set.entries.length);
 assert.equal((rows.match(/aria-current="true"/g)??[]).length,1);
 assert.ok(rows.indexOf('My Computer')<rows.indexOf('aria-current="true"'));
 assert.ok(rows.indexOf('Sagan')>rows.indexOf('aria-current="true"'));
});
