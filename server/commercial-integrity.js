'use strict';
const model=require('../commercial-client-workflow.js'),ops=require('../commercial-opportunities.js');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const defaults={time:'',fractions:[],amount:0,releaseReservation:false,withAgent:false,agentId:'',commissionType:'',commissionValue:0,commissionAmount:0};
const commercialValue=(event,key)=>{
  const value=event[key]===undefined&&Object.hasOwn(defaults,key)?defaults[key]:event[key];
  return ['amount','commissionValue','commissionAmount'].includes(key)&&(typeof value==='number'||typeof value==='string'&&value.trim())&&Number.isFinite(Number(value))?Number(value):value;
};
const sameCommercialField=(a,b,key)=>equal(commercialValue(a,key),commercialValue(b,key));
function validate(previous,next){
  const reject=(reason='transition')=>{const error=Error('Commercial integrity validation failed: '+reason);error.code='COMMERCIAL_INTEGRITY';error.status=422;throw error};
  const oldEvents=new Map(previous.events.map(e=>[e.id,e]));
  const approvedReleases=new Set();
  const approvedEffects=new Set();
  const effectFields=['type','clientId','date','time','fractions','amount','releaseReservation','withAgent','agentId','commissionType','commissionValue','commissionAmount'];
  const closing=e=>['Reserva','Reserva efetuada','Venda','Venda concluída','Reserva cancelada'].includes(e?.type)||e?.type==='Desistência'&&e.releaseReservation;
  for(const old of previous.events){
    if(old.opportunityVersion===1&&!next.events.some(e=>e.id===old.id&&equal(e,old)))reject('opportunity history removed or changed');
    const current=next.events.find(e=>e.id===old.id),referenced=Object.values(previous.statusEventIds).includes(old.id)||Object.values(previous.salePriceEventIds).includes(old.id)||Object.values(previous.saleCommissions).some(c=>c?.eventId===old.id);
    const boundary=old.type==='Alteração de estado'||old.globalWithdrawal!==undefined||old.scope!==undefined||old.requalificationConfirmed!==undefined||model.globalWithdrawal(old);
    if(referenced||boundary){
      if(!current)reject('commercial provenance removed');
      const keys=['type','clientId','date','time','fractions','amount','scope','globalWithdrawal','requalificationConfirmed','administrative','releaseReservation','withAgent','agentId','commissionType','commissionValue','commissionAmount'];
      if(keys.some(key=>!sameCommercialField(old,current,key))&&!(closing(old)&&closing(current)))reject('commercial provenance changed');
    }
  }
  for(const e of next.events){
    const old=oldEvents.get(e.id);if(equal(e,old))continue;
    if(e.opportunityVersion!==undefined){
      if(old&&!equal(e,old))reject('existing opportunity record changed');
      if(e.opportunityVersion!==1)reject();
      let built;try{built=ops.build({...e,action:e.opportunityAction,rows:e.informedPrices},next)}catch{reject('opportunity schema')}
      for(const key of Object.keys(built))if(!equal(e[key],built[key]))reject('opportunity field '+key);
    }
    if(closing(e)&&(!old||effectFields.some(key=>!sameCommercialField(old,e,key)))){
      if(!ops.validDate(e.date)||!previous.clients.concat(next.clients).some(c=>c.id===e.clientId))reject();
      if(!['Reserva cancelada','Desistência'].includes(e.type)&&(!Number.isFinite(e.amount)||e.amount<=0))reject();
      if(model.closingError(e,old,previous,'checked','checked',n=>model.effectiveEffect(previous,n)))reject();
      for(const n of new Set([...(old?.fractions||[]),...(e.fractions||[])])){
        let effect;try{effect=model.effectTransition(previous,n,old,e)}catch{reject()}
        if(!effect||next.statuses[n]!==effect.status||next.statusEventIds[n]!==effect.event?.id)reject();
        if(effect.amount&&(next.salePrices[n]!==effect.amount||next.salePriceEventIds[n]!==e.id))reject();
        if(effect.status==='Disponível'){approvedReleases.add(String(n));if(next.salePriceEventIds[n]||next.saleCommissions[n])reject('released commercial references')}
        if(effect.status==='Reservado'&&!equal(previous.saleCommissions[n],next.saleCommissions[n]))reject('reservation commission changed');
        if(effect.status==='Vendido'){
          if(e.withAgent&&(!next.agents.some(a=>a.id===e.agentId)||!['percent','fixed'].includes(e.commissionType)||!Number.isFinite(e.commissionValue)||e.commissionValue<0||e.commissionType==='percent'&&e.commissionValue>100))reject();
          const amount=e.withAgent?(e.commissionType==='percent'?e.amount*e.commissionValue/100:e.commissionValue):0;
          if(e.commissionAmount!==amount||next.saleCommissions[n]?.eventId!==e.id||next.saleCommissions[n]?.amount!==amount)reject();
          const expected={withAgent:!!e.withAgent,agentId:e.agentId||'',commissionType:e.commissionType||'',commissionValue:e.commissionValue||0,netRevenue:e.amount-amount,date:e.date};
          for(const [key,value]of Object.entries(expected))if((e.negotiationVersion===1||Object.hasOwn(next.saleCommissions[n],key)||Object.hasOwn(previous.saleCommissions[n]||{},key))&&!equal(next.saleCommissions[n][key],value))reject('commission '+key);
        }
        if(!old||effectFields.some(key=>!sameCommercialField(old,e,key)))approvedEffects.add(String(n));
      }
    }
  }
  const maps=['statuses','statusEventIds','salePrices','salePriceEventIds','saleCommissions'];
  for(const n of new Set(maps.flatMap(key=>[...Object.keys(previous[key]||{}),...Object.keys(next[key]||{})]))){
    const wasClosed=['Reservado','Vendido'].includes(previous.statuses[n]),isClosed=['Reservado','Vendido'].includes(next.statuses[n]);
    const changed=maps.some(key=>!equal(previous[key]?.[n],next[key]?.[n]));
    if(wasClosed||isClosed){
      if(changed&&!approvedEffects.has(String(n)))reject('commercial effects changed without operation');
      const before=model.effectiveEffect(previous,n),after=model.effectiveEffect(next,n);
      if(before&&isClosed&&!after)reject('confirmed ownership lost');
      // Untouched incomplete legacy snapshots are preserved, never silently regularized.
      if(approvedEffects.has(String(n))&&isClosed){
        if(!after||!ops.validDate(after.event.date)||!Number.isFinite(after.amount)||after.amount<=0||next.salePrices[n]!==after.amount||next.salePriceEventIds[n]!==after.event.id)reject('closing value or provenance');
      }
    }
    if(previous.statuses[n]===next.statuses[n])continue;
    if(['Reservado','Vendido'].includes(next.statuses[n])){
      const effect=model.effectiveEffect(next,n);if(!effect||effect.status!==next.statuses[n]||equal(oldEvents.get(effect.event.id),effect.event))reject();
    }
    if(['Reservado','Vendido'].includes(previous.statuses[n])&&!['Reservado','Vendido'].includes(next.statuses[n])){
      const release=next.events.find(e=>e.id===next.statusEventIds[n]&&!oldEvents.has(e.id)&&e.fractions?.map(Number).includes(Number(n))&&(e.type==='Reserva cancelada'||e.type==='Desistência'&&e.releaseReservation));
      if((!release&&!approvedReleases.has(String(n)))||previous.statuses[n]==='Vendido')reject();
    }
  }
}
module.exports={validate};
