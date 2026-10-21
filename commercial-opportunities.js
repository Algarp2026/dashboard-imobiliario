(function(root){
  'use strict';
  const states=['Por apresentar','Apresentada','Recusada','Em negociação','Não concretizada','Reservada','Vendida'];
  const decisions=['Em análise','Aceite','Recusada','Substituída'];
  const reasons=['Preço','Tipologia ou distribuição','Piso, vista ou orientação','Área ou espaços exteriores','Preferiu outra fração','Desistiu da aquisição','Outro motivo'];
  const clone=x=>JSON.parse(JSON.stringify(x));
  const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||'')&&Number.isFinite(Date.parse(x))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
  const key=e=>[e.date||'',e.time||'',e.recordedAt||e.createdAt||'',String(e.id||'')].join('\u0000');
  const sorted=(events,source=events)=>{
    const recordedDays=new Set(source.filter(e=>e.opportunityVersion===1&&!e.time).map(e=>e.date)),positions=new Map(source.map((e,index)=>[e,index]));
    return events.slice().sort((a,b)=>a.date===b.date&&recordedDays.has(a.date)?positions.get(a)-positions.get(b):key(a).localeCompare(key(b)));
  };
  const priceRows=e=>e.presentationHistory?.at(-1)?.state==='draft'||e.type==='Apresentação em preparação'?[]:e.presentationHistory?.at(-1)?.rows||e.informedPrices||[];
  const priced=(e,n)=>validDate(e.date)&&priceRows(e).some(r=>Number(r.fraction||r.unitId)===n&&Number.isFinite(Number(r.informedPrice))&&Number(r.informedPrice)>0);
  const actions={select:'Seleção de fração',remove:'Seleção removida',present:'Apresentação comercial',refuse:'Recusa de fração',round:'Proposta recebida',decision:'Decisão de proposta',agreement:'Acordo comercial',close:'Negociação encerrada',reopen:'Reabertura comercial'};
  const isGlobal=e=>e?.type==='Desistência'&&validDate(e.date)&&!e.releaseReservation&&!(e.globalWithdrawal===false&&e.scope==='global'||e.globalWithdrawal===true&&e.scope!==undefined&&e.scope!=='global'||e.globalWithdrawal!==undefined&&typeof e.globalWithdrawal!=='boolean'||e.scope!==undefined&&!['global','fraction'].includes(e.scope))&&(e.globalWithdrawal===true||e.scope==='global'||e.globalWithdrawal===undefined&&e.scope===undefined&&!e.administrative&&!(e.fractions||[]).length&&e.negotiationVersion!==1);
  const isQualification=e=>e?.type==='Preferências recebidas'&&e.requalificationConfirmed===true&&validDate(e.date)&&e.presentationHistory?.at(-1)?.state!=='draft';
  const priorEvents=(data,id)=>{const index=data.events.findIndex(e=>e.id===id);return index<0?data.events:data.events.slice(0,index)};
  function correctionTarget(e,events){
    const target=events.find(old=>old.id===e.corrects);
    return target&&target.opportunityVersion===1&&target.opportunityAction===e.opportunityAction&&target.clientId===e.clientId&&JSON.stringify(target.fractions)===JSON.stringify(e.fractions)&&events.indexOf(target)<events.indexOf(e)&&events.filter(other=>other.corrects===target.id).length===1?target:null;
  }
  function cycleInfo(data,cid,at={date:'9999-12-31'}){
    const source=priorEvents(data,at.id),boundaries=source.filter(e=>e.clientId===cid&&validDate(e.date)&&(e.date<at.date||e.date===at.date&&(!at.time||!e.time||e.time<=at.time))&&(isGlobal(e)||isQualification(e)));
    const timelessDays=new Set(boundaries.filter(e=>!e.time).map(e=>e.date));
    const timeline=boundaries.slice().sort((a,b)=>a.date===b.date&&timelessDays.has(a.date)?source.indexOf(a)-source.indexOf(b):key(a).localeCompare(key(b)));
    let withdrawal=null,qualification=null;
    for(const e of timeline){if(isGlobal(e)){withdrawal=e;qualification=null}else if(withdrawal&&isQualification(e))qualification=e}
    return{withdrawal,qualification,blocked:!!withdrawal&&!qualification};
  }
  function effectiveRounds(events,cid,n){
    let rounds=[];
    for(const e of sorted(events.filter(e=>e.clientId===cid&&validDate(e.date)&&(isGlobal(e)||isQualification(e)||e.fractions?.map(Number).includes(Number(n)))),events)){
      if(isGlobal(e)||isQualification(e)||['refuse','close','reopen'].includes(e.opportunityAction)||e.type==='Desistência'||e.type==='Acompanhamento da fração'&&e.interest==='Sem interesse'){rounds=[];continue}
      if(e.opportunityVersion===1&&e.opportunityAction==='round')rounds.push(e);
    }
    const invalid=new Set(rounds.filter(e=>e.corrects&&!correctionTarget(e,events)).map(e=>e.id));
    const ambiguous=new Set(rounds.filter(e=>events.filter(other=>other.corrects===e.id).length>1).map(e=>e.id));
    const superseded=new Set(rounds.filter(e=>e.corrects&&!invalid.has(e.id)).map(e=>e.corrects));
    const replaced=new Set(events.filter(e=>e.clientId===cid&&e.opportunityVersion===1&&['decision','agreement'].includes(e.opportunityAction)&&e.decision==='Substituída'&&e.fractions?.map(Number).includes(Number(n))).map(e=>e.respondsTo));
    return rounds.filter(e=>!invalid.has(e.id)&&!ambiguous.has(e.id)&&!superseded.has(e.id)&&!replaced.has(e.id));
  }
  function hasNegotiation(data,cid,n,at){
    const prior=priorEvents(data,at?.id),source=at?[...prior,at]:prior,timeline=sorted(source.filter(e=>e===at||e.clientId===cid&&validDate(e.date)&&(isGlobal(e)||isQualification(e)||e.fractions?.map(Number).includes(Number(n)))),source);
    let negotiated=false;
    for(const e of timeline){if(e===at)break;if(isGlobal(e)||isQualification(e)||['refuse','close','reopen'].includes(e.opportunityAction)||e.type==='Desistência'||e.type==='Acompanhamento da fração'&&e.interest==='Sem interesse'){negotiated=false;continue}if((e.opportunityAction==='round'||!e.opportunityVersion&&['Proposta recebida','Nova proposta recebida','Contra-proposta recebida','Contra-proposta enviada'].includes(e.type))&&(Number(e.amount)>0||String(e.terms||'').trim()))negotiated=true}
    return negotiated;
  }
  function build(input,data){
    if(!input.id||!input.clientId||!data.clients.some(c=>c.id===input.clientId))throw Error('Selecione um cliente existente.');
    if(!validDate(input.date))throw Error('Indique uma data efetiva válida.');
    if(input.recordedAt&&(!/^\d{4}-\d{2}-\d{2}T/.test(input.recordedAt)||!Number.isFinite(Date.parse(input.recordedAt))))throw Error('Momento de registo inválido.');
    if(!actions[input.action]||!Array.isArray(input.fractions)||!input.fractions.length||new Set(input.fractions).size!==input.fractions.length||input.fractions.some(n=>!Number.isInteger(n)||n<1||n>39))throw Error('Operação ou seleção de frações inválida.');
    const e={id:input.id,clientId:input.clientId,opportunityVersion:1,opportunityAction:input.action,type:actions[input.action],date:input.date,fractions:[...input.fractions],recordedAt:input.recordedAt||new Date().toISOString(),origin:'crm-opportunity-v1',notes:String(input.notes||''),amount:0};
    if(['select','remove','reopen'].includes(input.action)){e.administrative=true;e.actualCommunication=false}
    if(input.corrects){
      const position=data.events.findIndex(old=>old.id===input.id),prior=position<0?data.events:data.events.slice(0,position),target=prior.find(old=>old.id===input.corrects);
      if(!target||target.id===input.id||target.opportunityVersion!==1||target.opportunityAction!==input.action||target.clientId!==input.clientId||JSON.stringify(target.fractions)!==JSON.stringify(input.fractions)||!['present','round','refuse','close'].includes(input.action))throw Error('A correção não corresponde ao registo original.');
      if(prior.some(old=>old.corrects===target.id))throw Error('Este registo já foi corrigido. Consulte a versão mais recente.');
      e.corrects=target.id;
    }
    if(['refuse','close'].includes(input.action)){
      if(!String(input.reason||'').trim())throw Error('Indique o motivo.');
      if(input.reason==='Outro motivo'&&!String(input.notes||'').trim())throw Error('Descreva o outro motivo.');
      e.reason=input.reason;
    }
    const cycle=cycleInfo(data,input.clientId,e);
    if(!input.corrects&&['select','reopen','present','round','decision','agreement','close'].includes(input.action)&&cycle.blocked){const error=Error('Confirme a requalificação do cliente antes de iniciar um novo ciclo comercial.');error.code='REQUALIFICATION_REQUIRED';throw error}
    if(input.action==='close'&&!input.corrects&&input.fractions.some(n=>!hasNegotiation(data,input.clientId,n,e)))throw Error('Sem negociação válida neste ciclo. Utilize Recusada e indique o motivo.');
    if(!input.corrects&&!['select','remove'].includes(input.action)){
      const n=input.fractions.find(number=>['Reservado','Vendido'].includes(data.statuses?.[number]));
      if(n)throw Error('A fração tem uma reserva ou venda vigente. Resolva primeiro a operação comercial confirmada.');
    }
    if(input.action==='present'){
      if(!Array.isArray(input.rows)||input.rows.length!==input.fractions.length||input.rows.some(r=>!input.fractions.includes(r.fraction)||!Number.isFinite(r.informedPrice)||r.informedPrice<=0||r.officialPrice!==null&&(!Number.isFinite(r.officialPrice)||r.officialPrice<=0))||new Set(input.rows.map(r=>r.fraction)).size!==input.rows.length)throw Error('Indique um preço comunicado positivo por fração.');
      e.informedPrices=clone(input.rows);
    }
    if(['round','decision','agreement'].includes(input.action)){
      if(input.fractions.length!==1)throw Error('Uma decisão pertence a uma única negociação.');
      const prior=priorEvents(data,input.id);
      const previous=prior.filter(old=>old.clientId===input.clientId&&old.opportunityVersion===1&&old.opportunityAction==='round'&&old.fractions.includes(input.fractions[0]));
      const reference=previous.find(old=>old.id===input.respondsTo);
      if(input.respondsTo&&!reference)throw Error('A proposta de origem não pertence a esta oportunidade.');
      if(reference&&input.action!=='round'&&!effectiveRounds(prior,input.clientId,input.fractions[0]).some(r=>r.id===reference.id))throw Error('A proposta foi corrigida ou substituída. Escolha a versão efetiva antes de confirmar.');
      if(reference&&input.date<reference.date)throw Error('A resposta não pode anteceder a proposta.');
      if(input.action==='round'){
        if(!['cliente','empresa'].includes(input.party)||!Number.isFinite(input.amount)||input.amount<0||!input.amount&&!String(input.terms||'').trim())throw Error('Indique a parte e um valor ou condições comerciais.');
        e.party=input.party;e.amount=input.amount;e.terms=String(input.terms||'');e.roundId=input.id;e.decision='Em análise';e.type=input.party==='empresa'?'Contra-proposta enviada':'Proposta recebida';
      }else{
        if(!reference)throw Error('Escolha a proposta e as condições a que se refere a decisão.');
        e.decision=input.action==='agreement'?'Aceite':input.decision;
        if(!decisions.includes(e.decision))throw Error('Decisão inválida.');
        e.acceptedSnapshot={roundId:reference.id,amount:reference.amount,terms:reference.terms,party:reference.party};
        if(input.acceptedSnapshot&&Object.keys(e.acceptedSnapshot).some(k=>input.acceptedSnapshot[k]!==e.acceptedSnapshot[k]))throw Error('As condições da proposta mudaram. Reveja a versão efetiva.');
      }
      if(reference)e.respondsTo=reference.id;
    }
    return e;
  }
  function project(data,cid,number,legacy,helpers){
    const n=Number(number),c=data.clients.find(c=>c.id===cid)||{},all=data.events||[];
    const history=sorted(all.filter(e=>e.clientId===cid&&(e.fractions||[]).map(Number).includes(n)&&e.presentationHistory?.at(-1)?.state!=='draft'&&e.type!=='Apresentação em preparação'),all);
    const globals=sorted(all.filter(e=>e.clientId===cid&&helpers.globalWithdrawal(e)),all);
    const review=[...(legacy.review||[])],rounds=[];
    const superseded=new Set(),invalidCorrections=new Set();for(const e of history.filter(e=>e.opportunityVersion===1&&e.corrects)){const target=correctionTarget(e,all);if(target)superseded.add(target.id);else{review.push('Correção sem origem válida ou ambígua: '+e.id);invalidCorrections.add(e.id)}}
    let state=null,last=null,informed=null,closure=null,selected=false,cycleStart=null;
    const evidence=e=>e.opportunityVersion===1||priced(e,n)||['Frações apresentadas','Apresentação comercial','Preços informados','Proposta recebida','Nova proposta recebida','Contra-proposta recebida','Contra-proposta enviada','Aceitação','Rejeição','Desistência','Acompanhamento da fração','Reserva','Reserva efetuada','Venda','Venda concluída','Reserva cancelada','Interessado'].includes(e.type)&&!e.administrative;
    const qualifications=all.filter(e=>e.clientId===cid&&helpers.confirmedRequalification(e));
    for(const e of sorted([...new Map([...history.filter(e=>(!superseded.has(e.id)||e.opportunityAction==='round')&&!invalidCorrections.has(e.id)),...globals,...qualifications].map(e=>[e.id,e])).values()],all)){
      if(!validDate(e.date)){if(evidence(e))review.push('Registo sem data efetiva válida: '+e.id);continue}
      if(helpers.confirmedRequalification(e)){cycleStart=e;if(state&&!['Recusada','Não concretizada'].includes(state)){state='Não concretizada';closure=e;informed=null;last=e}continue}
      if(helpers.globalWithdrawal(e)){cycleStart=null;if(state){state='Não concretizada';closure=e;informed=null;last=e}continue}
      if(!evidence(e))continue;
      if(e.type==='Desistência'&&!helpers.movementState(e)){review.push('Desistência contraditória: '+e.id);continue}
      const a=e.opportunityVersion===1?e.opportunityAction:'';
      if(['reopen','present','round','decision','agreement'].includes(a)&&!e.corrects&&cycleInfo(data,cid,e).blocked){review.push('Movimento sem requalificação confirmada após desistência global: '+e.id);continue}
      if(a==='select'){selected=true;if(cycleInfo(data,cid,e).blocked){review.push('Seleção após desistência global sem requalificação confirmada: '+e.id);continue}if(!state||cycleStart&&closure){state='Por apresentar';closure=null;informed=null}last=e;continue}
      if(a==='remove'){selected=false;if(state==='Por apresentar')state=null;last=e;continue}
      if(a==='refuse'||e.type==='Acompanhamento da fração'&&e.interest==='Sem interesse'){state='Recusada';closure=e;last=e;continue}
      if(a==='close'||e.type==='Desistência'){if(!e.opportunityVersion&&!hasNegotiation(data,cid,n,e))review.push('Encerramento histórico sem negociação confirmada: '+e.id);state='Não concretizada';closure=e;last=e;continue}
      if(a==='reopen'){state='Por apresentar';closure=null;last=e;continue}
      if(priced(e,n)){state='Apresentada';closure=null;informed={...priceRows(e).find(r=>Number(r.fraction||r.unitId)===n),eventId:e.id,date:e.date};last=e;continue}
      if(!e.opportunityVersion&&['Frações apresentadas','Apresentação comercial','Preços informados'].includes(e.type)){state='Apresentada';closure=null;last=e;review.push('Apresentação histórica sem preço comunicado confirmado: '+e.id);continue}
      if(a==='round'){
        rounds.push({...clone(e),decision:'Em análise',supersededBy:history.find(correction=>correction.corrects===e.id&&!invalidCorrections.has(correction.id))?.id||null});if(!superseded.has(e.id)){state='Em negociação';closure=null;last=e}continue;
      }
      if(a==='decision'||a==='agreement'){
        const r=rounds.find(r=>r.id===e.respondsTo);if(!r){review.push('Decisão sem proposta correspondente: '+e.id);continue}
        if(!effectiveRounds(priorEvents(data,e.id),cid,n).some(proposal=>proposal.id===r.id)){review.push('Decisão sobre proposta corrigida ou substituída: '+e.id);continue}
        r.decision=e.decision;r.response=clone(e);if(['Recusada','Não concretizada'].includes(state)){review.push('Decisão posterior a encerramento sem reabertura: '+e.id);continue}
        state='Em negociação';last=e;continue;
      }
      const movement=helpers.movementState(e);
      if(['Em negociação','Aguardar decisão','Aceite'].includes(movement)){state='Em negociação';closure=null;last=e;continue}
      if(e.type==='Reserva cancelada'){state=informed?'Apresentada':'Por apresentar';last=e;continue}
      if(['Interessado','Apresentado'].includes(movement)||e.type==='Interessado'){if(['Recusada','Não concretizada'].includes(state)||!state){state='Por apresentar';informed=null;closure=null}last=e}
    }
    const explicitSelection=(c.presentationSelection||[]).map(Number).includes(n);
    if(!history.some(evidence)&&!explicitSelection)state=null;
    if(!state&&explicitSelection&&!globals.length){state='Por apresentar';selected=true;if(!history.some(e=>e.opportunityAction==='select'))review.push('Seleção legada sem cronologia própria')}
    if(!state&&history.some(e=>evidence(e)&&!['select','remove'].includes(e.opportunityAction))){state='Por apresentar';review.push('Condições históricas incompletas')}
    let origin=closure?{event:closure,label:helpers.globalWithdrawal(closure)?'Desistência global':closure.reason||closure.type}:null;
    const effect=helpers.effectiveEffect(data,n),own=effect?.event.clientId===cid,availability=data.statuses?.[n];
    if(own){state=effect.status==='Vendido'?'Vendida':'Reservada';last=effect.event;origin={event:effect.event,label:state}}
    else if(effect?.status==='Vendido'&&state&&!['Recusada','Não concretizada'].includes(state)){state='Não concretizada';last=effect.event;origin={event:effect.event,label:'Fração vendida a outro cliente'}}
    const effectiveIds=new Set(effectiveRounds(all,cid,n).map(e=>e.id)),currentRounds=rounds.filter(r=>effectiveIds.has(r.id));
    const current=currentRounds.at(-1),latestDecision=currentRounds.filter(r=>r.response).sort((a,b)=>key(a.response).localeCompare(key(b.response))).at(-1);
    const agreement=latestDecision?.decision==='Aceite'&&(!current||key(latestDecision.response)>=key(current))?latestDecision:null;
    const situation=agreement?'Acordo alcançado':current?.decision==='Em análise'?(current.party==='cliente'?'Aguardar empresa':'Aguardar cliente'):'Negociação aberta sem resposta pendente';
    const legacyStates={'Por apresentar':'Interessado','Apresentada':'Apresentado','Recusada':'Sem interesse','Em negociação':'Em negociação','Não concretizada':'Desistiu','Reservada':'Reservado','Vendida':'Vendido'};
    return{...legacy,number:n,commercialState:state,state:state?legacyStates[state]:legacy.state,history,selected,informed,rounds,effectiveRounds:currentRounds,situation,agreement,origin,last:last||history.at(-1)||null,presented:state==='Apresentada'||!!informed,active:!!state&&!['Recusada','Não concretizada'].includes(state)&&(own||availability==='Disponível'),effect:own?effect:null,review:[...new Set(review)]};
  }
  const api={states,decisions,reasons,actions,validDate,build,project,priceRows,effectiveRounds,hasNegotiation,cycleInfo};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.THE_VIEW_OPPORTUNITIES=api;
})(typeof window==='object'?window:null);
