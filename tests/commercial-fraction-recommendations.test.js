'use strict';
const assert=require('node:assert/strict'),engine=require('../commercial-fraction-recommendations.js'),preferences=require('../commercial-client-preferences.js'),fixture=require('./helpers/client-phase2b-fixture.js');
const data=fixture(),structural=fixture.structuralFractions();assert.equal(data.clients.length,64);assert.deepEqual(structural.map(f=>f.number).sort((a,b)=>a-b),Array.from({length:39},(_,i)=>i+1));
const fractions=structural.map(f=>({...f,currentPrice:data.finalPrices[f.number]??null,priceConfirmed:Object.hasOwn(data.finalPrices,f.number),status:data.statuses[f.number]??null,statusConfirmed:Object.hasOwn(data.statuses,f.number)}));
const bytes=JSON.stringify({data,fractions});
function client(choices={}){const c={preferences:{typology:'T2'},budgetMax:750000};const d=preferences.draft(c);for(const [key,value] of Object.entries(choices))d.choices[key]=preferences.fromLegacy(key,value);return preferences.buildUpdate(c,d)||c}
function f(number,overrides={}){return{number,typology:'T2',floor:4,orientation:'Sul/Este',currentPrice:750000,priceConfirmed:true,status:'Disponível',statusConfirmed:true,...overrides}}
function evaluate(c,rows){return engine.evaluate(c,rows)}
const basic=client();let r=evaluate(basic,[f(1),f(2,{currentPrice:787500}),f(3,{currentPrice:787500.01}),f(4,{currentPrice:775000}),f(5,{currentPrice:800000})]);
assert.deepEqual(r.main.map(f=>f.number),[1]);assert.deepEqual(r.alternatives.map(f=>f.number),[4,2]);assert.equal(r.profile.alternativeMax,787500);assert.match(r.alternatives[0].explanation,/3,3%/);assert.equal(r.alternatives[0].overBudgetAmount,25000);
const multi=client({typology:'T2 ou T2+1',floor:'4 ou 5 ou 6',orientation:'Sul ou Este'});
r=evaluate(multi,[f(1),f(2,{typology:'T2+1',floor:5,orientation:'Sul/Oeste'}),f(3,{floor:6,orientation:'Este/Oeste'}),f(4,{floor:3}),f(5,{orientation:'Oeste'}),f(6,{floor:null})]);assert.deepEqual(r.main.map(f=>f.number),[1,2,3]);assert.deepEqual(r.alternatives.map(f=>f.number),[4,5,6]);assert.match(r.alternatives.find(f=>f.number===6).explanation,/Piso não confirmado/);
r=evaluate(basic,[f(1,{typology:'T2+1'}),f(2,{typology:'T1'}),f(3,{typology:'T3'}),f(4,{typology:'T1-Duplex'})]);assert.deepEqual(r.alternatives.map(f=>f.number),[1]);assert.match(r.alternatives[0].explanation,/Alternativa T2\+1 para T2/);
r=evaluate(client({typology:'T1'}),[f(1,{typology:'T1+1'}),f(2,{typology:'T1-Duplex'})]);assert.deepEqual(r.alternatives.map(f=>f.number),[1]);
r=evaluate(client({typology:'T1-Duplex'}),[f(1,{typology:'T1 Duplex'}),f(2,{typology:'T1+1'})]);assert.deepEqual(r.main.map(f=>f.number),[1]);assert.equal(r.alternatives.length,0);
r=evaluate(client({typology:'T3'}),[f(1,{typology:'T3'}),f(2,{typology:'T2+1'})]);assert.deepEqual(r.main.map(f=>f.number),[1]);assert.equal(r.alternatives.length,0);
r=evaluate(client({floor:'Indiferente',orientation:'Indiferente'}),[f(1,{floor:null,orientation:''})]);assert.equal(r.main.length,1);assert.doesNotMatch(r.main[0].explanation,/Piso preferido|Orientação preferida/);
assert.equal(evaluate({preferences:{}},fractions).profile.known,false);assert.equal(evaluate(data.clients[1],fractions).profile.known,false);
assert.equal(engine.filter(evaluate({preferences:{typology:'T2'}},[f(1)]),'within').length,0);assert.equal(evaluate({preferences:{summary:'T2 com vista mar'}},fractions).profile.known,false);
assert.equal(evaluate({preferences:{typology:'T2',selectionV1:{version:2}},budgetMax:750000},fractions).profile.known,false);
assert.equal(evaluate({...basic,budgetMax:0},[f(1,{currentPrice:1000000})]).main.length,1);assert.equal(evaluate({preferences:{typology:'T2'}},[f(1,{currentPrice:1000000})]).profile.alternativeMax,null);
r=evaluate({...basic,budgetMin:600000},[f(1,{currentPrice:599999.99}),f(2,{currentPrice:600000})]);assert.deepEqual(r.main.map(f=>f.number),[2]);
r=evaluate(basic,[f(1,{priceConfirmed:false}),f(2,{currentPrice:null}),f(3,{statusConfirmed:false}),f(4,{status:'Reservado'}),f(5,{status:'Vendido'}),f(6,{status:'Indisponível'})]);assert.equal(r.main.length+r.alternatives.length,0);
const legacy={preferences:{typology:'T2'},budget:750000};assert.equal(engine.profile(legacy).maxSource,'legacy');assert.equal(engine.profile(legacy).alternativeMax,750000);assert.equal(evaluate({...legacy,budgetMax:0},[f(1,{currentPrice:800000})]).main.length,1);
r=evaluate(data.clients[0],fractions);assert.ok(r.main.some(f=>f.number===24));assert.ok(r.main.some(f=>f.number===33));assert.ok(r.alternatives.some(f=>f.number===23));assert.ok(r.alternatives.some(f=>f.number===26));assert.ok(r.alternatives.some(f=>f.number===6));assert.ok(![...r.main,...r.alternatives].some(f=>[10,17,18,30,31,34,36].includes(f.number)));
assert.equal(new Set([...r.main,...r.alternatives].map(f=>f.number)).size,r.main.length+r.alternatives.length);
assert.ok(engine.filter(r,'plus5').every(f=>f.overBudgetAmount>0&&f.overBudgetPercent<=5));assert.ok(engine.filter(r,'within').every(f=>!f.overBudgetAmount));assert.deepEqual(engine.filter(r,'main'),r.main);assert.deepEqual(engine.filter(r,'alternatives'),r.alternatives);
assert.deepEqual(engine.search(fractions,'Apt. 30').map(f=>f.number),[30]);assert.ok(engine.search(fractions,'Piso 5').every(f=>f.floor===5));assert.ok(engine.search(fractions,'Este').length);assert.ok(engine.search(fractions,'T2+1').every(f=>f.typology==='T2+1'));
assert.deepEqual(evaluate(data.clients[0],fractions.slice().reverse()),r);assert.equal(JSON.stringify({data,fractions}),bytes);
console.log('Phase 2B engine: 64 fictitious clients / 39 structural units, exact/adjacent types, strict legacy, multi-floor, OR composite orientations, exclusive indifferent, min/max/5% cent boundaries, explicit source confirmation, stable ranking, manual search and immutable inputs passed.');
