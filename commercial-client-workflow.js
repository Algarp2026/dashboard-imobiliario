(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const latest=event=>Array.isArray(event?.presentationHistory)?event.presentationHistory.at(-1):null;
  const isDraft=event=>latest(event)?.state==='draft'||event?.type==='Apresentação em preparação';
  const prices=event=>isDraft(event)?[]:latest(event)?.rows||event?.informedPrices||[];
  const channels=['Email','WhatsApp','Telefone','Presencial','Videochamada','Outro'];
  const movementTypes=['Proposta recebida','Contra-proposta enviada','Nova proposta recebida','Aceitação','Rejeição','Desistência','Acompanhamento da fração','Reserva efetuada','Reserva cancelada','Venda concluída'];
  const states=['Interessado','Em negociação','Aguardar decisão','Aceite','Sem interesse','Desistiu','Reservado','Vendido'];
  const reserve=ev=>['Reserva','Reserva efetuada'].includes(ev?.type);
  const sale=ev=>['Venda','Venda concluída'].includes(ev?.type);
  const unitNumbers=ev=>(ev?.fractions||[]).map(Number);
  const eventKey=ev=>[ev?.date||'',ev?.time||'',ev?.createdAt||'',String(ev?.id||''),JSON.stringify(Object.keys(ev||{}).sort().map(key=>[key,ev[key]]))].join('\u0000');
  const ordered=events=>[...(events||[])].sort((a,b)=>eventKey(a)<eventKey(b)?-1:eventKey(a)>eventKey(b)?1:0);
  const withdrawalConflict=ev=>ev?.type==='Desistência'&&(ev.globalWithdrawal===false&&ev.scope==='global'||ev.globalWithdrawal===true&&ev.scope!==undefined&&ev.scope!=='global'||ev.globalWithdrawal!==undefined&&typeof ev.globalWithdrawal!=='boolean'||ev.scope!==undefined&&!['global','fraction'].includes(ev.scope));
  const globalWithdrawal=ev=>ev?.type==='Desistência'&&!withdrawalConflict(ev)&&validDate(ev.date)&&!ev.releaseReservation&&(ev.globalWithdrawal===true||ev.scope==='global'||ev.globalWithdrawal===undefined&&ev.scope===undefined&&!ev.administrative&&!unitNumbers(ev).length&&ev.negotiationVersion!==1);
  const confirmedRequalification=ev=>ev?.type==='Preferências recebidas'&&ev.requalificationConfirmed===true&&validDate(ev.date)&&!isDraft(ev);
  const movementStates={'Proposta recebida':'Em negociação','Nova proposta recebida':'Em negociação','Contra-proposta recebida':'Em negociação','Contra-proposta enviada':'Aguardar decisão','Aceitação':'Aceite','Rejeição':'Em negociação','Desistência':'Desistiu','Reserva cancelada':'Interessado'};
  const presentedEvent=ev=>!isDraft(ev)&&(!!latest(ev)||['Frações apresentadas','Preços informados','Visita','Reunião realizada','Reunião com cliente','Apresentação comercial'].includes(ev.type));
  const reopensOpportunity=ev=>validDate(ev.date)&&unitNumbers(ev).some(n=>Number.isInteger(n)&&n>=1&&n<=39)&&!isDraft(ev)&&!ev.administrative&&ev.actualCommunication!==false&&(presentedEvent(ev)||['Proposta recebida','Nova proposta recebida','Contra-proposta recebida','Contra-proposta enviada','Aceitação','Interessado'].includes(ev.type)||ev.type==='Acompanhamento da fração'&&['Interessado','Em negociação','Aguardar decisão','Aceite'].includes(ev.interest));
  function movementState(ev){
    if(withdrawalConflict(ev))return'';
    if(reserve(ev))return'Reservado';
    if(sale(ev))return'Vendido';
    return movementStates[ev?.type]||(ev?.type==='Acompanhamento da fração'&&['Interessado','Em negociação','Aguardar decisão','Aceite','Sem interesse','Desistiu'].includes(ev.interest)?ev.interest:'');
  }
  function effectiveEffect(data,number){
    const status=data.statuses?.[number],source=data.statusEventIds?.[number];
    if(!source||!['Reservado','Vendido'].includes(status))return null;
    const matches=(data.events||[]).filter(ev=>ev.id===source);
    if(matches.length!==1)return null;
    const event=matches[0];
    if(!unitNumbers(event).includes(Number(number))||!event.clientId||(data.clients||[]).filter(c=>c.id===event.clientId).length!==1)return null;
    if(status==='Vendido'?!sale(event):!reserve(event))return null;
    if(status==='Reservado'&&(data.events||[]).some(ev=>ev.id!==source&&unitNumbers(ev).includes(Number(number))&&eventKey(ev)>eventKey(event)&&(reserve(ev)||sale(ev)||ev.type==='Alteração de estado'||ev.clientId===event.clientId&&(ev.type==='Reserva cancelada'||ev.type==='Desistência'&&ev.releaseReservation))))return null;
    return{status,amount:Number(event.amount)||0,event};
  }
  function effectTransition(data,number,oldEvent,newEvent){
    const n=Number(number),status=data.statuses?.[n],source=data.statusEventIds?.[n];
    const previousEvents=oldEvent?[...(data.events||[]).filter(ev=>ev.id!==oldEvent.id),oldEvent]:data.events||[];
    const confirmed=effectiveEffect({...data,events:previousEvents},n);
    const oldOwns=oldEvent&&source===oldEvent.id&&confirmed?.event.id===oldEvent.id;
    const owner=oldOwns?{status,event:oldEvent}:effectiveEffect(data,n);
    const applies=newEvent&&unitNumbers(newEvent).includes(n);
    const referencesOld=oldEvent&&(source===oldEvent.id||data.salePriceEventIds?.[n]===oldEvent.id||data.saleCommissions?.[n]?.eventId===oldEvent.id);
    const changedEffect=oldEvent&&(!newEvent||oldEvent.type!==newEvent.type||oldEvent.clientId!==newEvent.clientId||oldEvent.date!==newEvent.date||(oldEvent.time||'')!==(newEvent.time||'')||JSON.stringify(unitNumbers(oldEvent).sort((a,b)=>a-b))!==JSON.stringify(unitNumbers(newEvent).sort((a,b)=>a-b))||!!oldEvent.releaseReservation!==!!newEvent.releaseReservation);
    if(referencesOld&&!oldOwns&&changedEffect)throw Error(`Apt. ${n}: a reposição da origem/cancelamento exige revisão comercial. Nenhuma referência foi removida.`);
    if(applies&&(!Number.isInteger(n)||n<1||n>39))throw Error(`Apt. ${n}: fração desconhecida.`);
    if(applies&&(data.clients||[]).filter(c=>c.id===newEvent.clientId).length!==1)throw Error('Cliente inexistente ou ambíguo. Reveja a operação comercial.');
    if(newEvent&&oldEvent&&unitNumbers(oldEvent).includes(n)&&(reserve(oldEvent)||sale(oldEvent))&&!oldOwns)throw Error(`Apt. ${n}: origem da operação antiga não confirmada. Revisão necessária.`);
    if(applies&&owner&&owner.event.id!==newEvent.id&&`${newEvent.date||''} ${newEvent.time||''}`<`${owner.event.date||''} ${owner.event.time||''}`)throw Error(`Apt. ${n}: a decisão antecede a operação ativa.`);
    if(applies&&(reserve(newEvent)||sale(newEvent))){
      if(data.saleCommissions?.[n]&&(!owner||data.saleCommissions[n].eventId!==owner.event.id))throw Error(`Apt. ${n}: comissão sem origem compatível. Revisão necessária.`);
      if(data.salePriceEventIds?.[n]&&data.salePriceEventIds[n]!==owner?.event.id)throw Error(`Apt. ${n}: preço comercial com outra origem. Revisão necessária.`);
      if(status==='Disponível'||oldOwns||status==='Reservado'&&owner?.event.clientId===newEvent.clientId){
        return{status:sale(newEvent)?'Vendido':'Reservado',amount:Number(newEvent.amount)||0,event:newEvent};
      }
      throw Error(`Apt. ${n}: disponibilidade ou titularidade incompatível. Reveja a operação.`);
    }
    if(applies&&(newEvent.type==='Reserva cancelada'||newEvent.type==='Desistência'&&newEvent.releaseReservation)){
      if(status!=='Reservado'||owner?.event.clientId!==newEvent.clientId)throw Error(`Apt. ${n}: não existe reserva ativa deste cliente.`);
      return{status:'Disponível',amount:0,event:newEvent};
    }
    if(oldOwns){
      if(previousEvents.some(ev=>ev.id!==oldEvent.id&&unitNumbers(ev).includes(n)&&(reserve(ev)||sale(ev))&&eventKey(ev)<eventKey(oldEvent)))throw Error(`Apt. ${n}: existem operações anteriores. A reposição exige revisão comercial explícita.`);
      return{status:'Disponível',amount:0,event:null};
    }
    return null;
  }
  function relation(data,clientId,number){
    const history=ordered((data.events||[]).filter(ev=>ev.clientId===clientId&&!isDraft(ev)&&unitNumbers(ev).includes(Number(number))));
    const review=[];
    if(!Number.isInteger(Number(number))||Number(number)<1||Number(number)>39)review.push('Fração desconhecida');
    const withdrawal=ordered((data.events||[]).filter(ev=>ev.clientId===clientId&&globalWithdrawal(ev))).at(-1);
    const qualification=ordered((data.events||[]).filter(ev=>ev.clientId===clientId&&confirmedRequalification(ev)&&(!withdrawal||eventKey(ev)>eventKey(withdrawal)))).at(-1);
    const boundary=qualification||withdrawal;
    const relevant=boundary?history.filter(ev=>eventKey(ev)>eventKey(boundary)):history;
    const record=relevant.filter(ev=>movementState(ev)&&!ev.administrative).at(-1);
    const historicalState=movementState(record)||'Interessado';
    const effect=effectiveEffect(data,number),availability=data.statuses?.[number];
    if(!['Disponível','Reservado','Vendido','Indisponível'].includes(availability))review.push('Disponibilidade não confirmada');
    if(['Reservado','Vendido'].includes(availability)&&!effect)review.push('Titularidade não confirmada');
    const source=data.statusEventIds?.[number],sources=(data.events||[]).filter(ev=>ev.id===source&&unitNumbers(ev).includes(Number(number)));
    if(source&&sources.length!==1)review.push('Referência de origem ausente ou ambígua');
    let state=historicalState;
    const opportunity=relevant.some(ev=>reopensOpportunity(ev)||!withdrawal&&ev.type==='Rejeição'&&!ev.administrative);
    if(withdrawal&&!qualification&&!opportunity)state='Desistiu';
    if(['Reservado','Vendido'].includes(state)){
      state='Interessado';
      if(effect?.event.clientId!==clientId)review.push('Operação histórica sem efeito atual confirmado');
    }
    if(effect?.event.clientId===clientId)state=effect.status;
    if(effect?.status==='Vendido'&&history.some(ev=>eventKey(ev)>eventKey(effect.event)&&(reserve(ev)||ev.type==='Reserva cancelada'||ev.type==='Desistência'&&ev.releaseReservation)))review.push('Movimento posterior incompatível com venda efetiva');
    const presented=relevant.some(presentedEvent),historicallyPresented=history.some(presentedEvent);
    const active=!review.includes('Fração desconhecida')&&(['Reservado','Vendido'].includes(state)||opportunity&&!['Reservado','Vendido','Indisponível'].includes(availability)&&!['Desistiu','Sem interesse'].includes(state));
    return{number:Number(number),history,state,historicalState,availability,effect:effect?.event.clientId===clientId?effect:null,presented,historicallyPresented,active,review};
  }
  function clientProjection(data,c){
    const events=ordered((data.events||[]).filter(ev=>ev.clientId===c.id&&!isDraft(ev)));
    const numbers=[...new Set([...(c.fractions||[]),...(c.manualFractions||[]),...events.flatMap(unitNumbers)].map(Number))].sort((a,b)=>a-b);
    const relations=numbers.map(n=>relation(data,c.id,n));
    const review=relations.flatMap(row=>row.review.map(reason=>`Apt. ${row.number}: ${reason}`));
    if(events.some(ev=>!unitNumbers(ev).length&&movementState(ev)&&!globalWithdrawal(ev)))review.push('Movimento comercial sem fração identificada');
    if(events.some(withdrawalConflict))review.push('Indicadores de desistência contraditórios; revisão necessária');
    if(events.some(ev=>ev.type==='Desistência'&&!withdrawalConflict(ev)&&(ev.globalWithdrawal===true||ev.scope==='global')&&!globalWithdrawal(ev)))review.push('Desistência global sem cronologia ou efeitos coerentes; revisão necessária');
    const active=relations.filter(row=>row.active);
    const negotiationStates=['Em negociação','Aguardar decisão','Aceite'];
    const manual=c.stageManual?c.manualStage||c.stage:'';
    const withdrawal=events.filter(globalWithdrawal).at(-1);
    const qualification=events.filter(ev=>confirmedRequalification(ev)&&(!withdrawal||eventKey(ev)>eventKey(withdrawal))).at(-1);
    let stage='Novo Lead';
    if(active.some(row=>row.state==='Vendido'))stage='Vendido';
    else if(active.some(row=>row.state==='Reservado'))stage='Reservado';
    else if(active.some(row=>negotiationStates.includes(row.state))||manual==='Em negociação'&&!withdrawal&&!qualification)stage='Em negociação';
    else if(withdrawal&&!qualification&&!active.length)stage='Desistiu';
    else if(relations.some(row=>row.presented)||manual==='Apresentado'&&!withdrawal&&!qualification)stage='Apresentado';
    else if(qualification||numbers.length||Number(c.budget)>0||Number(c.budgetMin)>0||Number(c.budgetMax)>0||['typology','floor','orientation','objective','decisionTime','summary'].some(key=>typeof c.preferences?.[key]==='string'&&!!c.preferences[key].trim())||events.some(ev=>ev.type==='Preferências recebidas')||manual==='Qualificado')stage='Qualificado';
    if(['Reservado','Vendido'].includes(manual)&&manual!==stage)review.push('Estado manual sem operação efetiva confirmada');
    if(!manual&&['Reservado','Vendido','Desistiu'].includes(c.stage)&&c.stage!==stage)review.push('Estado legado divergente da situação efetiva');
    if(manual==='Desistiu'&&stage!=='Desistiu')review.push(active.length?'Desistência manual incompatível com oportunidade ativa':'Desistência manual sem confirmação global e cronologia suficientes');
    if(manual==='Em negociação'&&(withdrawal||qualification)&&stage!=='Em negociação')review.push('Decisão manual de negociação sem cronologia própria; ciclo atual prevalece');
    return{stage,relations,review,manualStage:manual||null};
  }
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
  function negotiation(events,clientId,number,today,data={events,clients:[{id:clientId}]}){
    const projection=relation(data,clientId,number),history=projection.history;
    const movements=history.filter(ev=>ev.negotiationVersion===1);
    const last=movements.at(-1);
    const offer=history.filter(ev=>['Proposta recebida','Nova proposta recebida','Contra-proposta recebida'].includes(ev.type)).at(-1);
    const counter=history.filter(ev=>ev.type==='Contra-proposta enviada').at(-1);
    const informed=history.flatMap(ev=>prices(ev).filter(row=>Number(row.fraction||row.unitId)===Number(number)).map(row=>({...row,eventId:ev.id,date:ev.date}))).at(-1);
    const lastAction=movements.filter(ev=>ev.nextStep||ev.followupDate).at(-1);
    const action=lastAction&&!lastAction.nextActionCompletedAt?lastAction:undefined;
    return{...projection,history,last,offer,counter,informed,action,overdue:!!action?.followupDate&&action.followupDate<today};
  }
  function closingError(event,oldEvent,data,revision,openingRevision,effect){
    if(!revision||revision!==openingRevision)return'A base comercial mudou desde a abertura do formulário. Reveja as condições antes de confirmar novamente.';
    const closing=ev=>ev&&(['Reserva','Reserva efetuada','Venda','Venda concluída','Reserva cancelada'].includes(ev.type)||ev.type==='Desistência'&&ev.releaseReservation);
    if(!closing(event)&&!closing(oldEvent))return'';
    if(!unitNumbers(event).length)return'Escolha explicitamente a fração da operação comercial.';
    for(const n of new Set([...(event.fractions||[]),...(oldEvent?.fractions||[])])){
      const status=data.statuses?.[n],owner=effect(n)?.event;
      if(!Number.isInteger(Number(n))||Number(n)<1||Number(n)>39)return`Apt. ${n}: fração desconhecida.`;
      if(!['Disponível','Reservado','Vendido','Indisponível'].includes(status))return`Apt. ${n}: disponibilidade não confirmada.`;
      if(status==='Indisponível')return`Apt. ${n}: indisponível. A alteração exige revisão comercial.`;
      if(['Reservado','Vendido'].includes(status)&&(!owner||owner.clientId!==event.clientId))return`Apt. ${n}: reserva ou venda de outro cliente, ou titularidade não confirmada.`;
      if(status==='Vendido'&&owner?.id!==oldEvent?.id)return`Apt. ${n}: já vendido. Não é possível substituir a venda.`;
      if(event.type==='Reserva cancelada'&&(status!=='Reservado'||owner?.clientId!==event.clientId))return`Apt. ${n}: não existe reserva ativa deste cliente.`;
      if(event.type==='Desistência'&&event.releaseReservation&&(status!=='Reservado'||owner?.clientId!==event.clientId))return`Apt. ${n}: não existe reserva ativa deste cliente para libertar.`;
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
  const api={latest,isDraft,prices,channels,movementTypes,states,buildPresentation,negotiation,closingError,contactStates,validDate,isEffectiveContact,contactInfo,priority,validateDecisions,decision,portfolio,buildCommunication,eventKey,ordered,globalWithdrawal,confirmedRequalification,reopensOpportunity,movementState,effectiveEffect,effectTransition,relation,clientProjection};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.THE_VIEW_CLIENT_WORKFLOW=api;
})(typeof window==='object'?window:null);
