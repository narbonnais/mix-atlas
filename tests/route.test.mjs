import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRoute,formatRoute} from '../dist/route.mjs';
test('shared links preserve exact track identity, selected DJ and expanded scope',()=>{
 const state={view:'explorer',mode:'supporters',dj:'Mattheis',track:'A & B / Café? Remix #1',expanded:true};
 assert.deepEqual(parseRoute(formatRoute(state)),state);
});
test('existing discovery links work and invalid routes have a safe default',()=>{
 assert.equal(parseRoute('#discover?mode=external').mode,'external');
 assert.deepEqual(parseRoute('#missing?dj=Unknown&linked=0'),{view:'explorer',mode:'supporters',dj:'Unknown',track:null,expanded:false});
 assert.equal(formatRoute({view:'discover',mode:'external'}),'#discover?mode=external');
});
