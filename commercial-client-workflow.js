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
  const api={latest,isDraft,prices,channels,movementTypes,states,buildPresentation,negotiation,closingError};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.THE_VIEW_CLIENT_WORKFLOW=api;
})(typeof window==='object'?window:null);
