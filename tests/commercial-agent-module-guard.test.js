'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8');
const code=source.slice(source.indexOf('function renderAgents(){'),source.indexOf('function ensureEventAgentFields(){'));
for(const model of [undefined,{}]){
 const state={selectedAgentId:'fixture-agent',data:{agents:[{id:'fixture-agent',name:'Fictitious agent'}],clients:[{id:'fixture-client',agentId:'fixture-agent'}],events:[],saleCommissions:{},unknown:{keep:true}}};
 const before=JSON.stringify(state),warnings=[];
 const list={innerHTML:'',querySelectorAll(){return[]}},detail={innerHTML:'',querySelector(){return null},append(node){warnings.push(node)}};
 const context={state,window:{THE_VIEW_CLIENT_WORKSPACE:{},THE_VIEW_CLIENT_WORKFLOW:model},document:{getElementById:id=>id==='agentsList'?list:detail,createElement:()=>({setAttribute(key,value){this[key]=value}})},agent:()=>state.data.agents[0],esc:String,commercialClients(){throw Error('Unconfirmed client projection must not be used')},fetch(){throw Error('Network forbidden')},localStorage:{setItem(){throw Error('Writes forbidden')}}};
 vm.createContext(context);vm.runInContext(code+';renderAgents();',context);
 assert.equal(warnings.length,1);assert.equal(warnings[0].role,'alert');assert.match(warnings[0].textContent,/indispon/);assert.equal(JSON.stringify(state),before);
 assert.doesNotMatch(detail.innerHTML,/agent-associated-row|data-agent-portfolio/);
}
console.log('Agent module guard PASS: missing/incomplete workflow shows an alert, no unconfirmed projection, network or mutation.');
