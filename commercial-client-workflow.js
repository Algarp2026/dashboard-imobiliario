(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const latest=event=>Array.isArray(event?.presentationHistory)?event.presentationHistory.at(-1):null;
  const isDraft=event=>latest(event)?.state==='draft'||event?.type==='Apresentação em preparação';
  const prices=event=>isDraft(event)?[]:latest(event)?.rows||event?.informedPrices||[];
  const channels=['Email','WhatsApp','Telefone','Presencial','Videochamada','Outro'];
  const movementTypes=['Proposta recebida','Contra-proposta enviada','Nova proposta recebida','Aceitação','Rejeição','Desistência','Acompanhamento da fração','Reserva efetuada','Reserva cancelada','Venda concluída'];
  const states=['Interessado','Em negociação','Aguardar decisão','Aceite','Sem interesse','Desistiu','Reservado','Vendido'];
  function buildPresentation(existing,input){
    if(latest(existing)&&latest(existing).version!==1)throw Error('Versão de apresentação não suportada. O registo foi preservado.');
    if(!input.id||!input.clientId||!/^\d{4}-\d{2}-\d{2}$/.test(input.date))throw Error('Indique a data da apresentação.');
    if(!['draft','realized'].includes(input.state))throw Error('Escolha o estado da apresentação.');
    if(!channels.includes(input.channel))throw Error('Escolha o meio de apresentação.');
    if(!Array.isArray(input.rows)||!input.rows.length)throw Error('Selecione pelo menos uma fração.');
    if(latest(existing)?.state==='realized'&&input.state!=='realized')throw Error('Uma apresentação realizada não pode voltar a preparação.');
    const numbers=new Set();
    input.rows.forEach(row=>{
      if(!Number.isInteger(row.fraction)||row.fraction<1||row.fraction>39||numbers.has(row.fraction))throw Error('Seleção de frações inválida.');
      numbers.add(row.fraction);
      if(!Number.isFinite(row.informedPrice)||row.informedPrice<0||input.state==='realized'&&row.informedPrice<=0)throw Error('Indique um preço comunicado positivo para cada fração.');
      if(row.officialPrice!==null&&(!Number.isFinite(row.officialPrice)||row.officialPrice<=0))throw Error('Preço oficial inválido.');
    });
    const snapshot={...clone(latest(existing)||{}),version:1,state:input.state,date:input.date,time:input.time||'',channel:input.channel,rows:clone(input.rows),notes:input.notes||'',documentation:input.documentation||''};
    const previous=latest(existing);
    if(previous&&JSON.stringify(previous)===JSON.stringify(snapshot))return clone(existing);
    return{...clone(existing||{}),id:input.id,clientId:input.clientId,type:input.state==='draft'?'Apresentação em preparação':'Apresentação comercial',date:input.date,time:input.time||'',channel:input.channel,notes:input.notes||'',fractions:[...numbers],presentationHistory:[...(existing?.presentationHistory||[]),snapshot],informedPrices:existing?.informedPrices||[],amount:existing?.amount||0};
  }
  function negotiation(events,clientId,number,today){
    const history=events.filter(ev=>ev.clientId===clientId&&!isDraft(ev)&&(ev.fractions||[]).map(Number).includes(Number(number))).map((ev,index)=>({ev,index})).sort((a,b)=>`${a.ev.date||''}T${a.ev.time||''}`.localeCompare(`${b.ev.date||''}T${b.ev.time||''}`)||a.index-b.index).map(({ev})=>ev);
    const movements=history.filter(ev=>ev.negotiationVersion===1);
    const last=movements.at(-1);
    const legacyStates={'Proposta recebida':'Em negociação','Nova proposta recebida':'Em negociação','Contra-proposta recebida':'Em negociação','Contra-proposta enviada':'Aguardar decisão','Aceitação':'Aceite','Rejeição':'Sem interesse','Desistência':'Desistiu','Reserva':'Reservado','Reserva efetuada':'Reservado','Reserva cancelada':'Interessado','Venda':'Vendido','Venda concluída':'Vendido'};
    const stateRecord=history.filter(ev=>ev.negotiationVersion===1&&states.includes(ev.interest)||legacyStates[ev.type]).at(-1);
    const offer=history.filter(ev=>['Proposta recebida','Nova proposta recebida','Contra-proposta recebida'].includes(ev.type)).at(-1);
    const counter=history.filter(ev=>ev.type==='Contra-proposta enviada').at(-1);
    const informed=history.flatMap(ev=>prices(ev).filter(row=>Number(row.fraction||row.unitId)===Number(number)).map(row=>({...row,eventId:ev.id,date:ev.date}))).at(-1);
    const lastAction=movements.filter(ev=>ev.nextStep||ev.followupDate).at(-1);
    const action=lastAction&&!lastAction.nextActionCompletedAt?lastAction:undefined;
    return{history,last,offer,counter,informed,state:stateRecord?.negotiationVersion===1&&states.includes(stateRecord.interest)?stateRecord.interest:legacyStates[stateRecord?.type]||'Interessado',action,overdue:!!action?.followupDate&&action.followupDate<today};
  }
  function closingError(event,oldEvent,data,revision,openingRevision,effect){
    if(!revision||revision!==openingRevision)return'A base comercial mudou desde a abertura do formulário. Reveja as condições antes de confirmar novamente.';
    const closing=ev=>ev&&(['Reserva','Reserva efetuada','Venda','Venda concluída','Reserva cancelada'].includes(ev.type)||ev.type==='Desistência'&&ev.releaseReservation);
    if(!closing(event)&&!closing(oldEvent))return'';
    for(const n of new Set([...(event.fractions||[]),...(oldEvent?.fractions||[])])){
      const status=data.statuses?.[n],owner=effect(n)?.event;
      if(!['Disponível','Reservado','Vendido','Indisponível'].includes(status))return`Apt. ${n}: disponibilidade não confirmada.`;
      if(status==='Indisponível')return`Apt. ${n}: indisponível. A alteração exige revisão comercial.`;
      if(['Reservado','Vendido'].includes(status)&&(!owner||owner.clientId!==event.clientId))return`Apt. ${n}: reserva ou venda de outro cliente, ou titularidade não confirmada.`;
      if(status==='Vendido'&&owner?.id!==oldEvent?.id)return`Apt. ${n}: já vendido. Não é possível substituir a venda.`;
      if(event.type==='Reserva cancelada'&&(status!=='Reservado'||owner?.clientId!==event.clientId))return`Apt. ${n}: não existe reserva ativa deste cliente.`;
      if(owner&&owner.id!==oldEvent?.id&&`${event.date||''}T${event.time||''}`<`${owner.date||''}T${owner.time||''}`)return`Apt. ${n}: a decisão não pode anteceder a operação comercial ativa.`;
    }
    return'';
  }
  const contactStates=['Resposta nossa pendente','A aguardar cliente','Em acompanhamento','Sem contacto'];
  const validDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value};
  function isEffectiveContact(ev){
    if(ev?.actualCommunication===false||isDraft(ev)||ev?.administrative===true||ev?.previousPreferences)return false;
    if(ev?.communicationVersion===1)return ev.actualCommunication!==false;
    if(ev?.type==='Pedido de informação recebido')return validDate(ev.date);
    return ['Contacto recebido','Contacto enviado','Contacto efetuado','Preferências recebidas','Apresentação comercial','Documentação enviada','Frações apresentadas','Preços informados','Proposta recebida','Nova proposta recebida','Contra-proposta recebida','Contra-proposta enviada','Aceitação','Rejeição','Visita','Reunião realizada','Reunião com cliente'].includes(ev?.type)||ev?.type==='Outro'&&channels.some(v=>v.toLowerCase()===String(ev.channel||'').toLowerCase());
  }
  function contactInfo(c,events,today){
    const history=events.filter(ev=>ev.clientId===c.id&&isEffectiveContact(ev)&&validDate(ev.date)&&ev.date<=today).map((ev,index)=>({ev,index})).sort((a,b)=>(a.ev.date+' '+(a.ev.time||'')).localeCompare(b.ev.date+' '+(b.ev.time||''))||a.index-b.index);
    const last=history.at(-1)?.ev;
    const manual=Array.isArray(c.contactStateHistory)?c.contactStateHistory.at(-1):null;
    const state=contactStates.includes(manual?.value)?manual.value:last?.communicationHistory?.at(-1)?.contactState||(['Pedido de informação recebido','Contacto recebido'].includes(last?.type)?contactStates[0]:last?contactStates[2]:contactStates[3]);
    return{state,lastContact:last?.date||'',days:last?Math.max(0,Math.floor((Date.parse(today+'T12:00:00Z')-Date.parse(last.date+'T12:00:00Z'))/86400000)):null};
  }
  function priority(c){return Array.isArray(c.priorityHistory)&&c.priorityHistory.at(-1)?.value===true}
  function validateDecisions(c){
    for(const key of ['contactStateHistory','priorityHistory'])if(c[key]!==undefined&&(!Array.isArray(c[key])||c[key].some(entry=>!entry||entry.version!==1)))throw Error('Histórico de acompanhamento não reconhecido. Os dados existentes foram preservados.');
  }
  function decision(c,key,value,entry){
    validateDecisions(c);
    const current=key==='priorityHistory'?priority(c):c.contactStateHistory?.at(-1)?.value;
    if(current===value)return false;
    c[key]=[...(c[key]||[]),{version:1,value,...clone(entry)}];return true;
  }
  function portfolio(clients,events,today,filters={}){
    return clients.map(c=>({client:c,...contactInfo(c,events,today),priority:priority(c)})).filter(row=>(!filters.stage||filters.stage==='all'||row.client.stage===filters.stage)&&(!filters.contact||filters.contact==='all'||row.state===filters.contact)&&(!filters.priority||filters.priority==='all'||row.priority===(filters.priority==='yes'))&&(!filters.search||String(row.client.name||'').toLocaleLowerCase('pt-PT').includes(filters.search.toLocaleLowerCase('pt-PT')))).sort((a,b)=>Number(b.priority)-Number(a.priority)||(a.lastContact||'0000').localeCompare(b.lastContact||'0000')||String(a.client.name).localeCompare(String(b.client.name),'pt-PT')||String(a.client.id).localeCompare(String(b.client.id)));
  }
  function buildCommunication(existing,input){
    if(!validDate(input.date))throw Error('Indique a data efetiva da comunicação.');
    if(!['received','sent'].includes(input.direction)||!channels.includes(input.channel)||!contactStates.includes(input.contactState))throw Error('Escolha o tipo, canal e estado do contacto.');
    if(existing?.communicationHistory?.at(-1)?.version!==undefined&&existing.communicationHistory.at(-1).version!==1)throw Error('Versão do contacto não suportada.');
    const snapshot={...clone(existing?.communicationHistory?.at(-1)||{}),version:1,date:input.date,time:input.time||'',direction:input.direction,channel:input.channel,contactState:input.contactState,notes:input.notes||'',...(input.preferencesSnapshot?{preferencesSnapshot:clone(input.preferencesSnapshot)}:{})};
    if(JSON.stringify(existing?.communicationHistory?.at(-1))===JSON.stringify(snapshot))return clone(existing);
    return{...clone(existing||{}),id:input.id,clientId:input.clientId,type:input.direction==='received'?'Contacto recebido':'Contacto enviado',communicationVersion:1,actualCommunication:true,date:input.date,time:input.time||'',channel:input.channel,notes:input.notes||'',fractions:existing?.fractions||[],communicationHistory:[...(existing?.communicationHistory||[]),snapshot]};
  }
  const api={latest,isDraft,prices,channels,movementTypes,states,buildPresentation,negotiation,closingError,contactStates,validDate,isEffectiveContact,contactInfo,priority,validateDecisions,decision,portfolio,buildCommunication};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.THE_VIEW_CLIENT_WORKFLOW=api;
})(typeof window==='object'?window:null);
