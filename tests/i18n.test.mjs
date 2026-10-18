import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setTracklistRows} from '../dist/set-tracklist.mjs';
// Use the same versioned locale module as the production renderer.
const renderer=readFileSync(new URL('../dist/set-tracklist.mjs',import.meta.url),'utf8');
const specifier=renderer.match(/from '(\.\/i18n\.mjs[^']*)'/)[1];
const {MESSAGES,LANGUAGE_KEY,getLanguage,setLanguage,readLanguage,t,count,formatDate,number,translateError,sourceNote}=await import(new URL('../dist/'+specifier.slice(2),import.meta.url));
afterEach(()=>setLanguage('en'));

test('English is the default and preferences handle blocked storage and Korean aliases',()=>{
 assert.equal(getLanguage(),'en');assert.equal(readLanguage(),'en');
 assert.equal(readLanguage({getItem:()=>{throw new Error('blocked');}}),'en');
 assert.equal(readLanguage({getItem:()=> 'toString'}),'en');
 const saved=new Map(),storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)};
 setLanguage('fr',storage);assert.equal(saved.get(LANGUAGE_KEY),'fr');assert.equal(readLanguage(storage),'fr');
 assert.doesNotThrow(()=>setLanguage('ko',{setItem:()=>{throw new Error('blocked');}}));assert.equal(getLanguage(),'ko');
 assert.equal(setLanguage('kr'),'ko');assert.equal(setLanguage('unknown'),'en');
});

test('every language has complete copy and matching interpolation placeholders',()=>{
 const keys=Object.keys(MESSAGES.en).sort();assert.ok(keys.length>150);
 const placeholders=s=>[...s.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
 for(const language of ['en','fr','ko']){
  assert.deepEqual(Object.keys(MESSAGES[language]).sort(),keys);
  for(const key of keys){assert.ok(MESSAGES[language][key]?.trim(),language+': '+key);assert.deepEqual(placeholders(MESSAGES[language][key]),placeholders(MESSAGES.en[key]),language+': '+key);}
 }
});

test('numbers, counts and dates use the selected locale with English as default',()=>{
 assert.equal(count('tracks',1),'1 track');assert.equal(count('tracks',2),'2 tracks');assert.equal(number(1594),'1,594');assert.equal(formatDate('2021-10-08'),'Oct 8, 2021');
 setLanguage('fr');assert.equal(count('tracks',1),'1 morceau');assert.equal(count('tracks',2),'2 morceaux');assert.equal(formatDate('2021-10-08'),'8 oct. 2021');
 setLanguage('ko');assert.equal(count('tracks',36),'36곡');assert.match(formatDate('2021-10-08'),/2021년 10월 8일/);assert.equal(formatDate(null),'날짜 미상');
});

test('all three tracklists localize controls and status without changing song identities',()=>{
 const selected={position:1,layer:'main',artist:'Storken',title:'Lille Vals'},overlay={position:1,layer:'overlay',artist:'ID',title:'ID'};
 for(const [language,marker,copy,unknown] of [['en','Selected','Copy Storken','unidentified'],['fr','Sélectionné','Copier Storken','non identifié'],['ko','선택됨','Storken — Lille Vals 복사','미확인']]){
  setLanguage(language);const html=setTracklistRows({entries:[selected,overlay]},selected,{interactive:true});
  assert.ok(html.includes(marker));assert.ok(html.includes(copy));assert.ok(html.includes(unknown));assert.ok(html.includes('Lille Vals'));assert.ok(html.includes('data-copy-text="Storken — Lille Vals"'));
  assert.equal((html.match(/aria-current="true"/g)??[]).length,1);
 }
});

test('validation errors and source notes are localized with their useful details intact',()=>{
 const error=new Error('Set 3 : les positions doivent être des entiers positifs.');
 assert.equal(translateError(error),'Set 3: positions must be positive integers.');
 assert.equal(translateError(new Error('Ligne non reconnue : unusual input')),'Unrecognized line: unusual input');
 assert.match(translateError(new TypeError('Invalid URL')),/complete HTTPS/);
 setLanguage('ko');assert.match(translateError(error),/세트 3/);assert.match(translateError(error),/양의 정수/);
 assert.match(sourceNote('Seules les positions explicitement attribuées à Fahlberg sont affichées. Les passages partagés restent collectifs.'),/Fahlberg/);
 assert.equal(sourceNote('Original source wording'),'Original source wording');
 assert.equal(t('constructor'),'constructor');assert.equal(t('__proto__'),'__proto__');assert.equal(sourceNote(null),'');
});

test('static UI translation keys are present in every dictionary',()=>{
 const files=['app.mjs','workspace-view.mjs','comparison-view.mjs','copy-track.mjs','set-tracklist.mjs','transition-graph.mjs'];
 for(const file of files){
  const source=readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
  for(const match of source.matchAll(/\bt\((['"])([^'"\n]+)\1/g))assert.ok(Object.hasOwn(MESSAGES.en,match[2]),file+': '+match[2]);
 }
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/data-i18n(?:-(?:aria-label|placeholder|title))?="([^"]+)"/g))assert.ok(Object.hasOwn(MESSAGES.en,match[1]),'index: '+match[1]);
});
