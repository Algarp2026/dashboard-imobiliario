'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
require('./helpers/presentation-pdf-source.cjs')();
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8'),base=cp.execFileSync('git',['show','e2c041dc:commercial.js'],{encoding:'utf8'});
const fraction=n=>({number:n,name:'Apt. '+n,typology:'T2',floorLabel:'3',orientation:'Sul',abp:102.9,terrace:20.8,price:700000});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(text,units,plants,prices,language,showPrice){let html='';const context={window:{open:()=>({document:{open(){},write:s=>html=s,close(){}}})},PLANT_MAP:{21:{image:'plantas/fiction-21.png'},22:{image:'plantas/fiction-22.png'}},esc,money:n=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(n),finalPrice:f=>f.price,notifyUser(){throw Error('Unexpected notification')},commercialUxToast(){}};vm.createContext(context);vm.runInContext(text.slice(text.indexOf('function generateClientPresentationPdf('),text.indexOf('\nfunction fractionPriceSummary('))+'\nglobalThis.generate=generateClientPresentationPdf;',context);context.generate(units,plants,prices,language,showPrice);return html}
let cases=0;
for(const count of [1,2])for(const plants of [false,true])for(const language of ['pt-en','pt-fr'])for(const showPrice of [false,true]){
 const units=Array.from({length:count},(_,i)=>fraction(21+i)),prices={21:543210,22:654321},before=JSON.stringify({units,prices});
 const html=render(source,units,plants,prices,language,showPrice),body=html.slice(html.indexOf('<body>'));
 assert.ok(html.includes('<title>Apresentação_Apt'+(count===1?'21':'21-22')+'_TheView</title>'));
 assert.equal((body.match(/<div class="pdf-price">/g)||[]).length,showPrice?count:0);
 assert.equal(body.includes(language==='pt-fr'?'Prix de présentation':'Presentation Price'),showPrice);
 assert.equal(body.includes('543'),showPrice);assert.equal((body.match(/class="pdf-plant"/g)||[]).length,plants?count:0);
 assert.equal((body.match(/<strong>100 m²/g)||[]).length,count);assert.equal((body.match(/<strong>18 m²/g)||[]).length,count);assert.equal((body.match(/<strong>118 m²/g)||[]).length,count);
 assert.equal((body.match(/class="pdf-page /g)||[]).length,count);assert.ok(html.includes('@page{size:A4 portrait;'));
 assert.equal(body.includes('pdf-header--no-price'),!showPrice);assert.ok(html.includes('.pdf-header--no-price{grid-template-columns:1fr;gap:0}'));
 assert.ok(body.includes(language==='pt-fr'?'Ce document est fourni':'This document is for informational'));assert.ok(body.includes('Documento meramente informativo'));
 assert.equal(JSON.stringify({units,prices}),before);
 if(showPrice){const previous=render(base,units,plants,prices,language);const normalized=html.replace(/<title>[^<]*<\/title>/,'<title>The View · Proposta Cliente</title>').replace('  .pdf-header--no-price{grid-template-columns:1fr;gap:0}\n','');assert.equal(normalized.replace(/\r\n/g,'\n'),previous.replace(/\r\n/g,'\n'),'Price-enabled output otherwise identical to published generator')}
 cases++;
}
const defaults=render(source,[fraction(21)],true,{21:543210},'pt-en',undefined);assert.ok(defaults.includes('<div class="pdf-price">'));
const modal=source.slice(source.indexOf('function openPresentationPriceModal('),source.indexOf('function generateClientPresentationPdf('));assert.match(modal,/id="presentationPdfShowPrice" type="checkbox" checked/);assert.match(modal,/generateClientPresentationPdf\(fs, includePlants, priceMap, pdfLanguage, showPrice\)/);
console.log('Presentation PDF: '+cases+' combinations passed; default enabled, original priced output preserved, titles, languages, plans, areas, pagination and immutable inputs');
