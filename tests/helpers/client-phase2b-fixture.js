'use strict';
const fs=require('node:fs'),vm=require('node:vm'),preferences=require('../../commercial-client-preferences.js');
function structuralFractions(){
  let source=fs.readFileSync(require.resolve('../../commercial.js'),'utf8');
  const begin=source.indexOf('const MAJUCA_IMPORT_RECORDS=['),end=source.indexOf('\n];',begin);
  if(begin<0||end<0)throw Error('Test sanitization failed');
  source=source.slice(0,begin)+'const MAJUCA_IMPORT_RECORDS=[];'+source.slice(end+3);
  const context={document:{readyState:'loading',addEventListener(){}},window:{THE_VIEW_CONFIG:{}},localStorage:{getItem(){return null}},console};vm.createContext(context);
  const finish=source.lastIndexOf('})();');vm.runInContext(source.slice(0,finish)+'globalThis.fixtureParse=parseRow;'+source.slice(finish),context);
  return JSON.parse(fs.readFileSync(require.resolve('../../data.json'),'utf8')).map(context.fixtureParse).filter(f=>f?.isTheView).map(f=>({number:f.number,typology:f.typology,floor:f.floor,floorLabel:f.floorLabel,orientation:f.orientation,abp:f.abp}));
}
function fixture(){
  const data=require('./client-phase2a-fixture.js')(),fractions=structuralFractions();
  data.finalPrices=Object.fromEntries(fractions.map(f=>[f.number,550000+f.number*4000]));data.statuses=Object.fromEntries(fractions.map(f=>[f.number,'Disponível']));
  Object.assign(data.finalPrices,{6:700000,23:787500,24:750000,26:775000,30:800000,31:787500.01,33:690000});delete data.finalPrices[34];
  Object.assign(data.statuses,{10:'Reservado',18:'Indisponível',36:'Vendido'});delete data.statuses[17];
  const d=preferences.draft(data.clients[0]);d.choices.typology={state:'selected',values:['T2']};d.choices.floor={state:'selected',values:['4','5']};d.choices.orientation={state:'selected',values:['Sul','Este']};d.budgetMin=500000;d.budgetMax=750000;data.clients[0]=preferences.buildUpdate(data.clients[0],d);
  return data;
}
module.exports=fixture;module.exports.structuralFractions=structuralFractions;
