'use strict';
if(process.env.COMPLETE_EXPORT_FIXTURE==='true'){
 const key=require.resolve('./client-phase2b-fixture.js'),original=require(key),model=require('../../commercial-client-workflow.js');
 require.cache[key].exports=()=>{const data=original();data.events.push(model.buildPresentation(null,{id:'export-presentation',clientId:'demo-0',state:'realized',date:'2026-10-14',channel:'Email',rows:[{fraction:26,officialPrice:data.finalPrices[26],informedPrice:630000}],notes:'Fictitious export fixture'}));data.clients[0].presentationSelection=[26];return data};
}
process.env.PHASE2A_TEST_PORT=process.env.PHASE2A_TEST_PORT||'5197';
process.env.PHASE2B_FIXTURE='true';
require('./client-phase2a-preview.cjs');
