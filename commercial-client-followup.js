(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const responses=['client','team','none'];
  const states={'A aguardar cliente':'client','Resposta nossa pendente':'team','Em acompanhamento':'none','Sem contacto':'none'};
  const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
  function validate(value){
    if(value===undefined)return;
    if(!value||value.version!==1||!responses.includes(value.response)||!['Em acompanhamento','Sem contacto'].includes(value.neutralState))throw Error('Seguimento não reconhecido. Preserve os dados e solicite revisão.');
    for(const key of ['lastInteraction','waitingSince'])if(value[key]!==''&&!date(value[key]))throw Error('Data de seguimento inválida.');
    for(const key of ['pendingDescription','observation'])if(typeof value[key]!=='string')throw Error('Texto de seguimento inválido.');
    if(!Array.isArray(value.history))throw Error('Histórico de seguimento inválido.');
    const ids=new Set();
    for(const entry of value.history){
      if(!entry||entry.version!==1||typeof entry.id!=='string'||!entry.id||ids.has(entry.id)||typeof entry.recordedAt!=='string'||!Number.isFinite(Date.parse(entry.recordedAt))||!entry.after||typeof entry.after!=='object'||Array.isArray(entry.after)||entry.before!==null&&(!entry.before||typeof entry.before!=='object'||Array.isArray(entry.before)))throw Error('Histórico de seguimento não reconhecido. Os dados foram preservados.');
      ids.add(entry.id);
    }
    if(value.reminder!==null&&(!value.reminder||!date(value.reminder.date)||!['open','done','removed'].includes(value.reminder.state)))throw Error('Lembrete inválido.');
  }
  function decisionState(client,legacyState){
    const old=client.followupV1;
    const result={response:old?.response||states[legacyState]||'none',neutralState:old?.neutralState||(legacyState==='Sem contacto'?'Sem contacto':'Em acompanhamento')};
    if(!old)return result;
    const previous=Date.parse(old.history.at(-1)?.recordedAt||''),legacy=client.contactStateHistory?.at(-1);
    if(legacy?.version!==1||!Object.hasOwn(states,legacy.value)||!Number.isFinite(previous)||!(Date.parse(legacy.recordedAt)>previous))return result;
    result.response=states[legacy.value];if(result.response==='none')result.neutralState=legacy.value;
    return result;
  }
  function view(client,legacy,events,today,isEffectiveContact){
    validate(client.followupV1);
    const value=client.followupV1||{version:1,response:states[legacy.state]||'none',neutralState:legacy.state==='Sem contacto'?'Sem contacto':'Em acompanhamento',pendingDescription:'',lastInteraction:'',waitingSince:'',observation:'',reminder:null,history:[]};
    const decision=decisionState(client,legacy.state);
    // Only genuinely later effective interactions supersede an explicit manual date.
    const effective=events.filter(e=>e.clientId===client.id&&isEffectiveContact(e)&&date(e.date)&&e.date<=today).map(e=>e.date).sort().at(-1)||'';
    const lastInteraction=value.lastInteraction?(effective>value.lastInteraction?effective:value.lastInteraction):effective;
    const days=when=>date(when)&&date(today)?Math.max(0,Math.floor((Date.parse(today+'T12:00:00Z')-Date.parse(when+'T12:00:00Z'))/86400000)):null;
    return{...clone(value),...decision,lastInteraction,daysWithoutInteraction:days(lastInteraction),daysWaiting:decision.response==='none'?null:days(value.waitingSince),internalState:decision.response==='client'?'A aguardar cliente':decision.response==='team'?'Resposta nossa pendente':decision.neutralState,reminderDue:value.reminder?.state==='open'&&value.reminder.date<=today};
  }
  function update(client,input,{id,recordedAt,legacyState}){
    validate(client.followupV1);
    if(!id||!Number.isFinite(Date.parse(recordedAt)))throw Error('Identidade de gravação inválida.');
    const old=client.followupV1,decision=decisionState(client,legacyState);
    const next={...clone(old||{}),version:1,response:input.response,neutralState:decision.neutralState,pendingDescription:input.pendingDescription,lastInteraction:input.lastInteraction,waitingSince:input.waitingSince,observation:input.observation,reminder:input.reminder===null?null:{...clone(old?.reminder||{}),...clone(input.reminder)},history:clone(old?.history||[])};
    validate(next);
    const snapshot=value=>Object.fromEntries(['response','neutralState','pendingDescription','lastInteraction','waitingSince','observation','reminder'].map(key=>[key,clone(value[key])]));
    if(old&&JSON.stringify(snapshot(old))===JSON.stringify(snapshot(next)))return clone(client);
    if(next.history.some(entry=>entry.id===id))throw Error('Identificador de seguimento já utilizado.');
    next.history.push({version:1,id,recordedAt,before:old?snapshot(old):null,after:snapshot(next)});
    return{...clone(client),followupV1:next};
  }
  const api={validate,view,update,date};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.THE_VIEW_CLIENT_FOLLOWUP=api;
  root.createClientFollowupUI=function(a){
    const drafts=new Map(),esc=a.esc;let busy=false;
    const baseline=c=>JSON.stringify([c.followupV1,c.contactStateHistory,c.priorityHistory]);
    const field=(label,name,value,type='text')=>`<label class="field"><span>${label}</span><input type="${type}" name="${name}" value="${esc(value||'')}"></label>`;
    function historyMarkup(entries){
      const labels={response:'Resposta pendente',neutralState:'Estado interno preservado',pendingDescription:'Pendência',lastInteraction:'Última interação',waitingSince:'Início da espera',observation:'Observação',reminder:'Lembrete'};
      const text=(key,value)=>key==='response'?({client:'Aguarda resposta do cliente',team:'Aguarda nossa resposta',none:'Sem resposta pendente'}[value]||value):key==='reminder'?(value?`${value.date} · ${{open:'Pendente',done:'Concluído',removed:'Removido'}[value.state]||value.state}`:'—'):value||'—';
      return entries.map(entry=>`<details><summary>${esc(entry.recordedAt)}</summary><dl>${Object.entries(labels).filter(([key])=>JSON.stringify(entry.before?.[key])!==JSON.stringify(entry.after[key])).map(([key,label])=>`<div><dt>${label}</dt><dd>${esc(text(key,entry.before?.[key]))} → ${esc(text(key,entry.after[key]))}</dd></div>`).join('')}</dl><small>Operação: ${esc(entry.id)}</small></details>`).join('')||'<p class="muted">Sem alterações registadas.</p>';
    }
    function current(c){return view(c,a.contactInfo(c),a.events(),a.today(),a.isEffectiveContact)}
    function markup(c){
      let info;try{info=current(c)}catch(error){return`<p role="alert">${esc(error.message)}</p>`}
      const d=drafts.get(c.id)||{...info,original:baseline(c),priority:a.priority(c),reminder:clone(info.reminder)};
      const days=value=>value===null?'—':String(value);
      return`<section class="client-followup"><h3>Seguimento comercial</h3><form data-client-followup><fieldset ${busy?'disabled':''}><div class="form-grid"><label class="field"><span>Resposta pendente</span><select name="response">${[['client','Aguarda resposta do cliente'],['team','Aguarda nossa resposta'],['none','Sem resposta pendente']].map(([value,label])=>`<option value="${value}" ${d.response===value?'selected':''}>${label}</option>`).join('')}</select></label>${field('O que está pendente?','pendingDescription',d.pendingDescription)}<div>${field('Última interação','lastInteraction',d.lastInteraction,'date')}<small>Dias sem interação: ${days(info.daysWithoutInteraction)}</small></div><div>${field('Início da espera','waitingSince',d.waitingSince,'date')}<small>Dias em espera: ${days(info.daysWaiting)}</small></div></div><label class="field"><span>Observação</span><textarea name="observation" rows="2">${esc(d.observation)}</textarea></label><div data-followup-reminder>${d.reminder?`${field('Lembrete','reminderDate',d.reminder.date,'date')}<label class="field"><span>Estado do lembrete</span><select name="reminderState">${[['open','Pendente / reagendar'],['done','Concluído'],['removed','Removido']].map(([value,label])=>`<option value="${value}" ${d.reminder.state===value?'selected':''}>${label}</option>`).join('')}</select></label>`:'<button type="button" class="ghost-button compact-button" data-followup-add>Adicionar lembrete</button>'}</div><label><input type="checkbox" name="priority" ${d.priority?'checked':''}> Cliente prioritário</label><div class="top-actions"><button type="submit" class="primary-button compact-button">Guardar seguimento</button><button type="button" class="ghost-button compact-button" data-followup-cancel>Cancelar alterações</button></div></fieldset><p role="status" data-followup-status>${esc(d.feedback||'')}</p></form><details><summary>Histórico do seguimento (${info.history.length})</summary>${historyMarkup(info.history)}</details></section>`;
    }
    function bind(c,container){
      const form=container.querySelector('[data-client-followup]');if(!form)return;
      const read=event=>{
        const info=current(c),d=drafts.get(c.id)||{...info,original:baseline(c)};
        for(const key of ['response','pendingDescription','lastInteraction','waitingSince','observation'])d[key]=form.elements[key].value;
        if(event?.target?.name==='lastInteraction')d.lastInteractionEdited=true;
        d.priority=form.elements.priority.checked;
        if(form.elements.reminderDate)d.reminder={...(d.reminder||{}),date:form.elements.reminderDate.value,state:form.elements.reminderState.value};
        d.feedback='Alterações do formulário por guardar.';drafts.set(c.id,d);form.querySelector('[data-followup-status]').textContent=d.feedback;return d;
      };
      form.addEventListener('input',read);form.addEventListener('change',read);
      form.querySelector('[data-followup-add]')?.addEventListener('click',()=>{const d=read();d.reminder={date:'',state:'open'};a.render()});
      form.querySelector('[data-followup-cancel]').onclick=async()=>{if(drafts.has(c.id)&&!await a.confirm('Descartar apenas as alterações não guardadas deste seguimento?','Seguimento'))return;drafts.delete(c.id);a.render()};
      form.onsubmit=async event=>{
        event.preventDefault();if(busy)return;
        if(!drafts.has(c.id)){form.querySelector('[data-followup-status]').textContent='Sem alterações por guardar.';return}
        const d=read();busy=true;form.querySelector('fieldset').disabled=true;form.querySelector('[data-followup-status]').textContent='A guardar e confirmar a sincronização…';
        try{
          const live=a.client(c.id);if(baseline(live)!==d.original)throw Error('O seguimento mudou. Preserve as alterações e reveja a versão atual antes de guardar.');
          const input={...d,lastInteraction:!d.lastInteractionEdited&&live.followupV1?live.followupV1.lastInteraction:d.lastInteraction};
          const updated=update(live,input,{id:a.id(),recordedAt:new Date().toISOString(),legacyState:a.contactInfo(live).state});
          a.setPriority(updated,d.priority);
          if(JSON.stringify(updated)===JSON.stringify(live)&&!d.savedLocally){drafts.delete(c.id);a.feedback(true,'Sem alterações por guardar.');return}
          Object.assign(live,updated);d.savedLocally=true;
          const confirmed=await a.persist();d.original=baseline(live);
          if(confirmed){drafts.delete(c.id);a.feedback(true,'Seguimento guardado e sincronizado.')}
          else d.feedback='Alterações locais preservadas. Confirmação remota pendente.';
        }catch(error){d.feedback=error.message}finally{busy=false;a.render()}
      };
    }
    api.modified=()=>drafts.size>0;
    return{markup,bind,modified:api.modified};
  };
})(typeof globalThis!=='undefined'?globalThis:this);
