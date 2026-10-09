"use strict";
(function(root,factory){
  const engine=factory();
  if(typeof module==='object'&&module.exports)module.exports=engine;
  else root.THE_VIEW_RECOMMENDATIONS=engine;
})(typeof window==='object'?window:globalThis,function(){
  const DEFAULTS=Object.freeze({firstContactDays:1,documentationDays:3,presentationDays:3,proposalDays:4,inactiveDays:10,contactIntervalHours:48,timeZone:'Europe/Lisbon',secondaryLimit:2});
  const PRIORITIES={Alta:0,'Média':1,Baixa:2};
  const CONTACT_TYPES=new Set(['Preferências recebidas','Apresentação comercial','Documentação enviada','Frações apresentadas','Preços informados','Contra-proposta recebida','Contra-proposta enviada','Proposta recebida','Proposta enviada','Reserva','Reserva efetuada','Reserva cancelada','Venda','Venda concluída','Desistência','Contacto efetuado','Follow-up','Interessado','Visita','Reunião realizada','Reunião com cliente']);
  const ADVANCED_TYPES=new Set(['Frações apresentadas','Preços informados','Contra-proposta recebida','Contra-proposta enviada','Proposta recebida','Proposta enviada','Reserva','Reserva efetuada','Venda','Venda concluída','Visita','Reunião realizada','Reunião com cliente']);
  const CLOSED_STAGES=new Set(['vendido','desistiu','desistencia','perdido','encerrado','concluido','sem interesse']);
  const CLOSED_PROPOSALS=new Set(['aceite','aceita','accepted','recusada','recusado','declined','concluida','concluido','closed','cancelada','cancelado','cancelled']);
  const text=value=>String(value??'').trim();
  const norm=value=>text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const positive=value=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):0;
  const numbers=values=>[...new Set((Array.isArray(values)?values:[]).map(Number).filter(value=>Number.isInteger(value)&&value>0))];
  function dateDay(value){
    const match=text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return null;
    const [,y,m,d]=match.map(Number),stamp=Date.UTC(y,m-1,d),date=new Date(stamp);
    return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?stamp/86400000:null;
  }
  function dateInZone(stamp,formatter){
    const parts=formatter.formatToParts(new Date(stamp));
    return Object.fromEntries(parts.filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  }
  function eventStamp(event,formatter){
    if(dateDay(event.date)===null)return null;
    const time=text(event.time),match=time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if(time&&(!match||Number(match[1])>23||Number(match[2])>59||Number(match[3]||0)>59))return null;
    // An undated time is conservatively treated as the end of that calendar day.
    const [y,m,d]=event.date.split('-').map(Number),h=match?Number(match[1]):23,min=match?Number(match[2]):59,sec=match?Number(match[3]||0):59;
    const local=Date.UTC(y,m-1,d,h,min,sec);let stamp=local;
    for(let i=0;i<3;i++){
      const p=dateInZone(stamp,formatter),represented=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
      const next=local-(represented-stamp);if(next===stamp)break;stamp=next;
    }
    const p=dateInZone(stamp,formatter);
    return +p.year===y&&+p.month===m&&+p.day===d&&+p.hour===h&&+p.minute===min?stamp:null;
  }
  function isContact(event){
    return CONTACT_TYPES.has(event.type)||(event.type==='Outro'&&['telefone','whatsapp','email','presencial','reuniao','videoconferencia'].includes(norm(event.channel)));
  }
  function buildContext(input={}){
    const settings={...DEFAULTS,...input.settings};
    for(const key of ['firstContactDays','documentationDays','presentationDays','proposalDays','inactiveDays','contactIntervalHours','secondaryLimit']){
      if(!Number.isFinite(settings[key])||settings[key]<0)settings[key]=DEFAULTS[key];
    }
    const now=input.now instanceof Date?input.now.getTime():Date.parse(text(input.now));
    const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:settings.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    let today='',day=null;
    if(Number.isFinite(now)){
      const p=dateInZone(now,formatter);today=`${p.year}-${p.month}-${p.day}`;day=dateDay(today);
    }
    const byClient=new Map();
    (input.events||[]).forEach((event,index)=>{
      const row={event,index,day:dateDay(event.date),stamp:eventStamp(event,formatter)};
      if(!byClient.has(event.clientId))byClient.set(event.clientId,[]);
      byClient.get(event.clientId).push(row);
    });
    byClient.forEach(rows=>rows.sort((a,b)=>(a.day??-Infinity)-(b.day??-Infinity)||(a.stamp??0)-(b.stamp??0)||a.index-b.index));
    return{settings,now,today,day,byClient,fractions:input.fractions||[],priceHistory:input.priceHistory||{}};
  }
  function floorPreference(value){
    const floor=norm(value).replace(/[º°]/g,'').replace(/\.(?=\s|$)/g,'').replace(/pisos?/g,'').trim();
    if(['res-do-chao','res do chao','rc','r/c'].includes(floor))return n=>n===0;
    let match=floor.match(/^(>=|≥|<=|≤|>|<)?\s*(-?\d+)$/);
    if(match){const [,op='',value]=match,n=Number(value);return v=>op==='>='||op==='≥'?v>=n:op==='<='||op==='≤'?v<=n:op==='>'?v>n:op==='<'?v<n:v===n}
    if((match=floor.match(/^(-?\d+)\s*(?:-|a|ate)\s*(-?\d+)$/))&&+match[1]<=+match[2])return n=>n>=+match[1]&&n<=+match[2];
    if(/^\d+(?:\s*(?:,|\/|ou|e)\s*\d+)+$/.test(floor)){const values=floor.match(/\d+/g).map(Number);return n=>values.includes(n)}
    return null;
  }
  function matchingFractions(client,context){
    const preferences=client.preferences||{},typology=norm(preferences.typology);
    const types=(typology.match(/t\d+(?:\s*\+\s*\d+)?(?:\s+duplex)?/g)||[]).map(type=>type.replace(/\s*\+\s*/g,'+'));
    const remainder=typology.replace(/t\d+(?:\s*\+\s*\d+)?(?:\s+duplex)?/g,'').replace(/\b(ou|e)\b/g,'').replace(/[\s,;/|]+/g,'');
    const anyType=['','indiferente','qualquer','todas'].includes(typology),max=positive(client.budgetMax)||positive(client.budget),min=positive(client.budgetMin);
    if((!anyType&&(!types.length||remainder))||(!types.length&&!max)||max&&min>max)return{known:false,matches:[]};
    const preferredFloor=floorPreference(preferences.floor),orientation=norm(preferences.orientation),orientations=orientation.match(/\b(norte|sul|este|oeste)\b/g)||[];
    const matches=context.fractions.filter(f=>f.status==='Disponível'&&positive(f.currentPrice)&&(!types.length||types.includes(norm(f.typology)))&&(!max||f.currentPrice<=max)&&(!min||f.currentPrice>=min)).map(f=>{
      const preferred=[];
      if(preferredFloor&&f.floor!==null&&f.floor!==undefined&&preferredFloor(Number(f.floor)))preferred.push('Piso');
      if(orientations.length&&orientations.every(direction=>norm(f.orientation).includes(direction)))preferred.push('Orientação');
      return{number:Number(f.number),preferenceScore:preferred.length,preferred};
    }).sort((a,b)=>b.preferenceScore-a.preferenceScore||a.number-b.number);
    return{known:true,matches};
  }
  function manualAction(client,rows,context){
    const plans=rows.map(row=>({date:text(row.event.followupDate||(row.event.type==='Reunião agendada'?row.event.date:'')),step:text(row.event.nextStep||row.event.followup),eventId:row.event.id||'',source:'event',index:row.index}));
    const ownDate=text(client.manualNextFollowup??client.nextFollowup),ownStep=text(client.manualNextStep??client.nextStep);
    if(ownDate||ownStep)plans.push({date:ownDate,step:ownStep,eventId:'',source:'client',index:-1});
    const valid=plans.filter(plan=>dateDay(plan.date)!==null);
    const future=valid.filter(plan=>plan.date>=context.today).sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index)[0];
    const overdue=valid.filter(plan=>plan.date<context.today&&(plan.source==='client'||!rows.some(row=>isContact(row.event)&&row.day>dateDay(plan.date)&&row.day<=context.day))).sort((a,b)=>b.date.localeCompare(a.date)||a.index-b.index)[0];
    const selected=future||overdue;
    if(selected)return{...selected,status:selected.date<context.today?'overdue':selected.date===context.today?'today':'future'};
    return ownStep?{date:'',step:ownStep,source:'client',eventId:'',status:'undated'}:null;
  }
  function result(client,context,values={}){return{clientId:client.id,primary:null,secondary:[],manual:null,status:'clear',message:'Sem ação adicional necessária neste momento.',matching:matchingFractions(client,context),...values}}
  function recommendClient(client,context){
    if(context.day===null)return result(client,context,{status:'unknown',message:'Data de referência inválida.'});
    const rows=context.byClient.get(client.id)||[],manual=manualAction(client,rows,context),base=result(client,context,{manual});
    if(CLOSED_STAGES.has(norm(client.stage))||client.archived===true||client.archivedAt||client.doNotContact===true||client.contactAllowed===false||client.contactConsent===false||client.contactPreferences?.doNotContact===true){
      return{...base,status:'closed',message:'Sem recomendação de contacto para este cliente.'};
    }
    const completed=rows.filter(row=>row.day!==null&&row.day<=context.day&&row.stamp!==null&&(!text(row.event.time)||row.stamp<=context.now));
    const contacts=completed.filter(row=>isContact(row.event)),last=contacts[contacts.length-1];
    const uncertain=rows.some(row=>isContact(row.event)&&(row.day===null||row.stamp===null));
    const linked=numbers([...(client.fractions||[]),...(client.manualFractions||[]),...rows.flatMap(row=>row.event.fractions||[])]);
    const recommendations=[];
    const add=(code,action,reason,priority,category,order,reference={},quickActions=[],group='')=>recommendations.push({code,action,reason,priority,category,order,reference,quickActions,group});
    const reference=row=>({eventId:row.event.id||'',fractions:numbers(row.event.fractions),date:row.event.date});
    const contactAction=label=>({id:'contact',label:label||'Registar contacto'});
    const eventAction={id:'event',label:'Ver evento'};
    const age=row=>context.day-row.day;
    const later=row=>completed.some(other=>isContact(other.event)&&(other.stamp>row.stamp||other.stamp===row.stamp&&other.index>row.index));
    const latest=type=>completed.filter(row=>row.event.type===type).pop();
    const interests=numbers([...(client.manualFractions||(!('manualFractions' in client)?client.fractions:[])||[]),...completed.filter(row=>row.event.type==='Interessado'||parseInt(row.event.interest,10)>=4).flatMap(row=>row.event.fractions||[])]);
    const unavailable=context.fractions.filter(f=>linked.includes(Number(f.number))&&f.statusConfirmed&&['Indisponível','Reservado','Vendido'].includes(f.status)&&!(f.status==='Reservado'&&f.reservationClientId===client.id));
    if(unavailable.length){
      const alternatives=base.matching.matches.filter(f=>!linked.includes(f.number));
      add('unavailable','Apresentar alternativas',`Uma fração associada já não está disponível (${unavailable.map(f=>`Apt. ${f.number}: ${f.status}`).join(', ')}). ${base.matching.known?(alternatives.length?`Existem ${alternatives.length} alternativas compatíveis.`:'Não foram encontradas alternativas compatíveis.'):'As preferências registadas não permitem confirmar alternativas.'}`,'Alta','apresentacao',10,{fractions:unavailable.map(f=>Number(f.number)),alternatives:alternatives.map(f=>f.number)},alternatives.length?[{id:'alternatives',label:'Ver alternativas'}]:[{id:'fractions',label:'Ver frações'},{id:'edit',label:'Editar cliente'}],'options');
    }
    if(manual?.status==='overdue')add('manual-overdue','Cumprir próxima ação definida',`O prazo definido para ${manual.date.split('-').reverse().join('/')} está vencido.`,'Alta','acompanhamento',0,{eventId:manual.eventId,date:manual.date},[contactAction(),{id:'plan',label:'Rever próxima ação'}],'contact');
    if(manual?.status==='today')add('manual-today','Cumprir próxima ação definida','Existe uma próxima ação definida para hoje.','Média','acompanhamento',1,{eventId:manual.eventId,date:manual.date},[contactAction(),{id:'plan',label:'Rever próxima ação'}],'contact');
    const scheduled=rows.some(row=>isContact(row.event)&&row.stamp!==null&&(row.day>context.day||text(row.event.time)&&row.stamp>context.now));
    const future=manual?.status==='future'||scheduled,recent=last&&context.now-last.stamp<context.settings.contactIntervalHours*3600000;
    // Only confirmed stock changes bypass a future agreement. No contact is sent.
    if(!future&&last&&!uncertain){
      const changed=[];
      for(const n of linked){
        const f=context.fractions.find(f=>Number(f.number)===n);if(!f)continue;
        const history=context.priceHistory[n]||[];
        const entry=history.map((entry,index)=>({entry,index,day:dateDay(entry.date)})).filter(row=>row.day!==null&&row.day<=context.day).sort((a,b)=>a.day-b.day||a.index-b.index).pop();
        if(!entry||entry.day<=last.day||positive(entry.entry.price)!==positive(f.currentPrice))continue;
        const previousEntry=history[entry.index-1],previousDay=dateDay(previousEntry?.date);
        const previous=positive(entry.entry.oldPrice)||(previousDay!==null&&previousDay<=entry.day?positive(previousEntry.price):0);
        if(previous&&positive(entry.entry.price)&&previous!==Number(entry.entry.price))changed.push(n);
      }
      if(changed.length)add('commercial-price','Rever condições comerciais da fração','O preço comercial foi atualizado depois do último contacto registado. Confirmar as condições antes de decidir qualquer comunicação.','Média','acompanhamento',40,{fractions:changed},[{id:'fractions',label:'Ver fração'}],'price');
    }
    if(!future&&!recent&&!uncertain&&!manual?.date){
      const request=latest('Pedido de informação recebido');
      const advanced=['Apresentado','Em negociação','Reservado'].includes(client.stage)||rows.some(row=>ADVANCED_TYPES.has(row.event.type));
      const outgoing=completed.filter(row=>['Proposta enviada','Contra-proposta enviada'].includes(row.event.type)).pop();
      const proposal=outgoing&&!CLOSED_PROPOSALS.has(norm(outgoing.event.proposalStatus||outgoing.event.status))&&!later(outgoing)&&age(outgoing)>=context.settings.proposalDays;
      if(proposal)add('proposal','Acompanhar proposta',`${outgoing.event.type==='Contra-proposta enviada'?'A contra-proposta':'A proposta'} foi enviada há ${age(outgoing)} dias e não existe resposta ou negociação posterior registada.`,'Alta','proposta',20,reference(outgoing),[contactAction('Registar follow-up'),{id:'event',label:'Ver proposta'}],'contact');
      if(request&&!last&&!advanced){
        add('first-contact','Realizar primeiro contacto','Pedido de informação recebido e ainda não existe um contacto comercial registado.',age(request)>context.settings.firstContactDays?'Alta':'Média','primeiro-contacto',30,reference(request),[contactAction()],'contact');
      }
      const presentation=latest('Apresentação comercial'),documentation=latest('Documentação enviada');
      if(!proposal&&presentation&&!later(presentation)&&age(presentation)>=context.settings.presentationDays)add('presentation-followup','Fazer follow-up da apresentação',`A apresentação comercial foi registada há ${age(presentation)} dias e não existe acompanhamento posterior registado.`,'Média','acompanhamento',50,reference(presentation),[contactAction('Registar follow-up'),eventAction],'contact');
      if(!proposal&&documentation&&!later(documentation)&&age(documentation)>=context.settings.documentationDays)add('documentation-followup','Acompanhar documentação enviada',`A documentação foi enviada há ${age(documentation)} dias e não existe interação posterior registada.`,'Média','acompanhamento',60,reference(documentation),[contactAction(),eventAction],'contact');
      const missing=[];
      if(!text(client.preferences?.typology))missing.push('Tipologia pretendida');
      if(!positive(client.budget)&&!positive(client.budgetMax)&&!positive(client.budgetMin))missing.push('Intervalo de investimento');
      if(!proposal&&!advanced&&last&&missing.length)add('qualification','Completar qualificação',`Já existe contacto com o cliente, mas faltam informações para identificar as frações mais adequadas. Em falta: ${missing.join(' e ')}.`,'Média','qualificacao',70,{missing},[{id:'edit',label:'Editar cliente'}],'qualification');
      if(!proposal&&!advanced&&!presentation&&!interests.length&&base.matching.known&&!unavailable.length&&(!request||last))add('matching','Apresentar frações compatíveis',base.matching.matches.length?`Encontradas ${base.matching.matches.length} frações compatíveis com a tipologia e o investimento registados.`:'Não foram encontradas frações disponíveis compatíveis com a tipologia e o investimento registados.','Média','apresentacao',90,{fractions:base.matching.matches.map(f=>f.number)},base.matching.matches.length?[{id:'matches',label:'Ver frações'},{id:'presentation',label:'Registar apresentação'}]:[{id:'edit',label:'Rever preferências'}],'options');
      if(!proposal&&!rows.some(row=>['Proposta recebida','Proposta enviada','Contra-proposta recebida','Contra-proposta enviada','Reserva','Reserva efetuada','Venda','Venda concluída'].includes(row.event.type))&&interests.length&&!unavailable.length&&!recommendations.some(rec=>rec.group==='contact'))add('interest','Aprofundar interesse nas frações','O cliente demonstrou interesse nas frações associadas, mas ainda não existe uma decisão comercial registada.','Média','acompanhamento',80,{fractions:interests},[{id:'fractions',label:'Ver frações'},contactAction()],'contact');
      if(!recommendations.length&&last&&age(last)>=context.settings.inactiveDays)add('inactive','Retomar acompanhamento',`Este cliente permanece ativo, mas não existem interações há ${age(last)} dias.`,['Em negociação','Reservado','Apresentado'].includes(client.stage)?'Média':'Baixa','acompanhamento',100,reference(last),[contactAction()],'contact');
    }
    const selected=[],groups=new Set();
    recommendations.sort((a,b)=>PRIORITIES[a.priority]-PRIORITIES[b.priority]||a.order-b.order).forEach(rec=>{
      if(rec.group&&groups.has(rec.group))return;
      if(manual?.step&&norm(manual.step)===norm(rec.action))rec.alreadyDefined=true;
      if(rec.group)groups.add(rec.group);selected.push(rec);
    });
    if(selected.length)return{...base,status:'recommended',primary:selected[0],secondary:selected.slice(1,1+Math.min(2,context.settings.secondaryLimit))};
    if(future)return{...base,status:'waiting',message:manual?.status==='future'?`Próxima ação definida para ${manual.date.split('-').reverse().join('/')}.`:'Existe uma interação registada para uma data futura.'};
    if(recent)return{...base,status:'cooldown',message:'Sem ação adicional necessária neste momento. Existe uma interação recente registada.'};
    if(uncertain)return{...base,status:'unknown',message:'O histórico contém interações sem data válida; não é possível calcular um prazo fiável.'};
    return base;
  }
  function evaluate(input={}){
    const context=buildContext(input),clients=(input.clients||[]).map(client=>({client,recommendation:recommendClient(client,context)}));
    const queue=clients.filter(item=>item.recommendation.primary).sort((a,b)=>PRIORITIES[a.recommendation.primary.priority]-PRIORITIES[b.recommendation.primary.priority]||a.recommendation.primary.order-b.recommendation.primary.order||(a.recommendation.primary.reference.date||'9999').localeCompare(b.recommendation.primary.reference.date||'9999')||text(a.client.name).localeCompare(text(b.client.name),'pt-PT')||text(a.client.id).localeCompare(text(b.client.id)));
    const counts={all:queue.length,Alta:0,'Média':0,Baixa:0};queue.forEach(item=>counts[item.recommendation.primary.priority]++);
    return{clients,queue,counts};
  }
  return Object.freeze({DEFAULTS,buildContext,recommendClient,matchingFractions,evaluate});
});
