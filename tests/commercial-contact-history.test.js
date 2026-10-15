const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../commercial-client-workflow.js'),copy=x=>JSON.parse(JSON.stringify(x));
const window={THE_VIEW_CLIENT_WORKFLOW:model};
vm.runInNewContext(fs.readFileSync(require.resolve('../commercial-client-workflow-ui.js'),'utf8'),{window,console});
(async()=>{
  let client={id:'fiction',preferences:{},manualPreferences:{},priorityHistory:[{version:1,value:true}]},events=[],writes=0,nextId=0;
  const ui=window.createClientWorkflow({
    esc:x=>x,client:()=>client,event:id=>events.find(e=>e.id===id),events:()=>events,
    id:()=>`fiction-${++nextId}`,today:()=> '2026-10-15',render(){},tab(){},feedback(){},
    preferences:{draft:()=>({}),options:{}},
    applyCommunication(ev,old){if(old)events[events.findIndex(e=>e.id===old.id)]=ev;else events.push(ev)},
    async persist(){writes++;client=copy(client);events=copy(events);return true}
  });
  async function submit(existing,values){
    if(existing)ui.edit(existing);else ui.newContact(client.id);
    const defaults={date:'2026-08-03',time:'10:00',direction:'sent',channel:'Email',contactState:'A aguardar cliente',notes:'Fictitious',budgetMin:0,budgetMax:0,objective:'',decisionTime:'',summary:''};
    const elements=Object.fromEntries(Object.entries({...defaults,...values}).map(([key,value])=>[key,{value}]));elements.updatePreferences={checked:false};
    const fieldset={},form={elements,querySelector:()=>fieldset,querySelectorAll:()=>[]};
    ui.bind(client,{querySelector:s=>s==='[data-contact-form]'?form:null,querySelectorAll:()=>[]});
    await form.onsubmit({preventDefault(){}});
    return events.at(-1);
  }
  const old=await submit(null,{});assert.equal(writes,1);
  await submit(null,{date:'2026-07-01',contactState:'Resposta nossa pendente'});
  assert.equal(model.contactInfo(client,events,'2026-10-15').lastContact,'2026-08-03');
  model.decision(client,'contactStateHistory','Em acompanhamento',{source:'manual',recordedAt:'2026-10-15T10:00:00Z'});
  const history=copy(client.contactStateHistory),priority=copy(client.priorityHistory);
  await submit(old,{date:'2026-06-01',contactState:'Sem contacto',notes:'Fictitious correction'});
  assert.deepEqual(client.contactStateHistory,history);assert.equal(model.contactInfo(client,events,'2026-10-15').state,'Em acompanhamento');
  assert.equal(events.filter(e=>e.id===old.id).length,1);assert.equal(events.find(e=>e.id===old.id).communicationHistory.length,2);
  await submit(events.find(e=>e.id===old.id),{date:'2026-06-02',contactState:'A aguardar cliente',notes:'Second correction'});
  assert.deepEqual(client.contactStateHistory,history);
  await submit(null,{date:'2026-09-01',contactState:'Resposta nossa pendente'});
  assert.equal(model.contactInfo(client,events,'2026-10-15').state,'Resposta nossa pendente');
  assert.equal(client.contactStateHistory.length,history.length+1);assert.deepEqual(client.priorityHistory,priority);assert.equal(writes,5);
  console.log('Historical contact regression: actual UI submission, backdated contact, later manual decision, historical state corrections, persistence round-trip and new explicit decision passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
