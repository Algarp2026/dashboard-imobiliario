'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('commercial.js','utf8');
require('./helpers/presentation-date-source.cjs').restoreDate(source);
const fn=source.slice(source.indexOf('function generateClientPresentationPdf('),source.indexOf('\n// Presentation state is isolated'));
const cases=[['2026-03-29T23:30:00Z','30/03/2026'],['2026-10-24T23:30:00Z','25/10/2026'],['2026-10-25T23:30:00Z','25/10/2026'],['2026-01-01T00:30:00Z','01/01/2026']];
for(const [instant,expected] of cases)for(const language of ['pt-en','pt-fr'])for(const include of [false,true])for(const price of [false,true]){
 let calls=0,html='';
 class Clock extends Date{constructor(){super(instant);calls++}}
 const context={Date:Clock,Intl,window:{open:()=>({document:{open(){},write(s){html=s},close(){}}})},
  esc:s=>String(s??''),money:n=>String(n),finalPrice:()=>123456,PLANT_MAP:{},commercialUxToast(){}};
 vm.createContext(context);vm.runInContext(fn+'\nglobalThis.generate=generateClientPresentationPdf',context);
 context.generate([21,22].map(number=>({number,name:'Apartamento '+number,abp:100,terrace:20})),include,{},language,price);
 assert.equal(calls,1,'Clock sampled only once per document');
 const dates=[...html.matchAll(/<div class="pdf-generated-date">([^<]+)<\/div>/g)].map(m=>m[1]);
 assert.deepEqual(dates,Array(2).fill(`Impresso em: ${expected} · ${language==='pt-fr'?'Généré le :':'Generated on:'} ${expected}`));
 assert.match(html,/timeZone|pdf-generated-date/);
 assert.match(html,/Documento meramente informativo, com imagens ilustrativas/);
 assert.equal((html.match(/class="pdf-price"/g)||[]).length,price?2:0);
}
console.log('Generation date: Lisbon DST/day boundaries, fixed clock, one timestamp/document, both languages, price/plan options and unchanged legal footer passed.');
