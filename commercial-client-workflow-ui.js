(function(root){
  'use strict';
  root.createClientWorkflow=function(a){
    const model=root.THE_VIEW_CLIENT_WORKFLOW,esc=a.esc,copy=x=>JSON.parse(JSON.stringify(x));
    const drafts=new Map();let saving=false;
    const draft=(cid,kind)=>drafts.get(cid+':'+kind);
    const button=(action,label,icon='plus',extra='')=>`<button class="ghost-button compact-button" type="button" data-workflow="${action}" ${extra}>${a.icon(icon)}${label}</button>`;
    const options=(values,value)=>values.map(v=>`<option ${v===value?'selected':''}>${esc(v)}</option>`).join('');
    const field=(label,name,value='',type='text',extra='')=>`<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
    const select=(label,name,values,value)=>`<label class="field"><span>${label}</span><select name="${name}">${options(values,value)}</select></label>`;
    const area=(label,name,value='')=>`<label class="field"><span>${label}</span><textarea name="${name}" rows="2">${esc(value)}</textarea></label>`;
    function newPresentation(cid,event){
      const previous=model.latest(event),rows=a.rows(),numbers=previous?previous.rows.map(r=>r.fraction):a.selection(a.client(cid));
      drafts.set(cid+':presentation',{id:event?.id||a.id(),clientId:cid,original:event?JSON.stringify(event):'',revision:a.revision(),state:previous?.state||'draft',date:previous?.date||a.today(),time:previous?.time||'',channel:previous?.channel||'Email',notes:previous?.notes||'',documentation:previous?.documentation||'',rows:numbers.map(n=>previous?copy(previous.rows.find(r=>r.fraction===n)):priceRow(n,rows))});
      a.render();a.tab('presentation');
    }
    function priceRow(n,rows=a.rows()){
      const row=rows.find(r=>r.number===n);
      return{fraction:n,officialPrice:row?.priceConfirmed?row.currentPrice:null,informedPrice:row?.currentPrice||0,observation:''};
    }
    function presentationMarkup(c){
      const d=draft(c.id,'presentation'),rows=a.rows(),selected=d?d.rows.map(r=>r.fraction):a.selection(c),result=a.recommend(c,rows),recommended=new Set([...result.main,...result.alternatives].map(r=>r.number));
      const history=a.events().filter(e=>e.clientId===c.id&&(model.latest(e)||e.type==='Apresentação comercial'||e.type==='Preços informados'||e.type==='Documentação enviada')).slice().reverse();
      const table=`<div class="table-wrap"><table class="data-table compact-table"><thead><tr><th>Fração / condições atuais</th><th>Preço oficial atual</th>${d?'<th>Preço comunicado</th>':''}<th>Ação</th></tr></thead><tbody>${selected.map(n=>{const r=rows.find(r=>r.number===n),p=d?.rows.find(r=>r.fraction===n);return`<tr><td>${a.reference(n)}<div>${esc(r?.typology||'')} · Piso ${esc(r?.floorLabel||'—')} · ${esc(r?.orientation||'—')}</div><div class="muted small">${esc(a.status(r))}${recommended.has(n)?'':' · Fora das recomendações atuais'}</div></td><td data-label="Preço oficial atual">${esc(a.price(r))}${p&&p.officialPrice!==r?.currentPrice?`<div class="muted small">Oficial no registo: ${p.officialPrice?a.money(p.officialPrice):'não confirmado'}</div>`:''}</td>${d?`<td><label class="field"><span class="ux-sr-only">Preço comunicado Apt. ${n}</span><input type="number" min="0" step="0.01" data-present-price="${n}" value="${p.informedPrice||''}"></label><small class="ux-workflow-warning" data-price-warning="${n}"></small></td>`:''}<td>${button('remove-unit','Retirar','x',`data-number="${n}"`)}</td></tr>`}).join('')}</tbody></table></div>`;
      return`<section class="ux-workflow" data-workflow-kind="presentation"><div class="crm-detail-section__heading"><h3>Apresentação</h3><div class="top-actions"><button class="ux-text-button" type="button" data-ux-client-action="documentation">${a.icon('send')}Registar documentação</button>${!d?button('new-presentation','Preparar apresentação','presentation'):''}</div></div>${!rows[0]?.sourceCurrent?'<p class="ux-workflow-warning">Fonte por confirmar. Os preços atuais são cópias locais; não constituem condições verificadas.</p>':''}<section id="clientPreparedFractions"><div class="top-actions"><button class="ux-text-button" type="button" data-ux-client-action="select-presentation">Adicionar / retirar frações</button></div><form data-workflow-form="presentation"><fieldset ${saving?'disabled':''}>${d?`<div class="form-grid">${field('Data','date',d.date,'date','required')}${field('Hora','time',d.time,'time')}${select('Meio','channel',model.channels,d.channel)}<label class="field"><span>Estado da apresentação</span><select name="state"><option value="draft" ${d.state==='draft'?'selected':''} ${model.latest(a.event(d.id))?.state==='realized'?'disabled':''}>Em preparação</option><option value="realized" ${d.state==='realized'?'selected':''}>Realizada</option></select></label></div>`:''}${selected.length?table:'<p class="muted">Sem frações nesta apresentação.</p>'}<div class="ux-workflow-add"><label class="field"><span>Acrescentar fração</span><select name="addUnit">${rows.filter(r=>!selected.includes(r.number)).map(r=>`<option value="${r.number}">Apt. ${r.number} · ${esc(r.typology)} · ${esc(a.status(r))}</option>`).join('')}</select></label>${button('add-unit','Acrescentar','plus')}</div>${d?`${area('Observações','notes',d.notes)}${area('Documentação enviada / referências','documentation',d.documentation)}<div class="top-actions"><button class="primary-button compact-button" type="submit">${a.icon('check')}${d.original?'Atualizar apresentação':'Guardar apresentação'}</button>${button('cancel-presentation','Fechar edição','x')}</div>`:button('pdf','Definir preços e gerar PDF','file-text')}</fieldset><p class="ux-workflow-feedback" role="status">${esc(d?.feedback||'')}</p></form></section><section class="ux-client-section"><h3>Apresentações e documentação</h3><div class="timeline ux-client-timeline">${history.length?history.map(e=>`${a.timeline(e)}${model.latest(e)?`<p class="muted small">${model.isDraft(e)?'Em preparação':'Realizada'} · ${e.presentationHistory.length} versão(ões) preservada(s)${model.latest(e).documentation?' · Documentação: '+esc(model.latest(e).documentation):''}</p><details class="ux-client-details"><summary>Versões do registo</summary>${e.presentationHistory.map((v,i)=>`<p>${i+1}. ${esc(v.date)} · ${v.state==='draft'?'Em preparação':'Realizada'} · ${v.rows.map(r=>`Apt. ${r.fraction}: ${a.money(r.informedPrice)} (oficial: ${r.officialPrice?a.money(r.officialPrice):'não confirmado'})`).join(' · ')}</p>`).join('')}</details>`:''}`).join(''):'<p class="muted">Sem apresentações registadas.</p>'}</div></section></section>`;
    }
    function newMovement(cid,number,event){
      drafts.set(cid+':negotiation',{id:event?.id||a.id(),clientId:cid,original:event?JSON.stringify(event):'',revision:a.revision(),fraction:Number(event?.fractions?.[0]||number),type:event?.type||'Proposta recebida',date:event?.date||a.today(),time:event?.time||'',amount:event?.amount||'',interest:event?.interest||'Em negociação',nextStep:event?.nextStep||'',followupDate:event?.followupDate||'',channel:event?.channel||'',notes:event?.notes||'',withAgent:!!event?.withAgent,agentId:event?.agentId||'',commissionType:event?.commissionType||'percent',commissionValue:event?.commissionValue||0});
      a.render();a.tab('negotiation');
    }
    function negotiationMarkup(c){
      const d=draft(c.id,'negotiation'),numbers=[...new Set([...a.selection(c),...(c.fractions||[]),...a.events().filter(e=>e.clientId===c.id&&!model.isDraft(e)).flatMap(e=>e.fractions||[])])].sort((x,y)=>x-y);
      const form=d?`<form data-workflow-form="negotiation"><h4>${d.original?'Editar movimento':'Novo movimento'} · Apt. ${d.fraction}</h4><fieldset ${saving?'disabled':''}><div class="form-grid">${select('Movimento','type',model.movementTypes,d.type)}${field('Data','date',d.date,'date','required')}${field('Hora','time',d.time,'time')}${field('Valor (€)','amount',d.amount,'number','min="0" step="0.01"')}${select('Estado desta negociação','interest',model.states,d.interest)}${select('Próximo contacto','channel',['',...model.channels],d.channel)}${field('Próxima ação','nextStep',d.nextStep)}${field('Data prevista','followupDate',d.followupDate,'date')}</div>${area('Observações','notes',d.notes)}<details class="ux-client-details" ${d.withAgent?'open':''}><summary>Agente e comissão na venda</summary><label><input type="checkbox" name="withAgent" ${d.withAgent?'checked':''}> Venda com agente</label><div class="form-grid"><label class="field"><span>Agente</span><select name="agentId"><option value=""></option>${a.agents().map(g=>`<option value="${esc(g.id)}" ${g.id===d.agentId?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label><label class="field"><span>Comissão</span><select name="commissionType"><option value="percent" ${d.commissionType==='percent'?'selected':''}>Percentagem</option><option value="fixed" ${d.commissionType==='fixed'?'selected':''}>Valor fixo</option></select></label>${field('Valor da comissão','commissionValue',d.commissionValue,'number','min="0" step="0.01"')}</div></details><div class="top-actions"><button class="primary-button compact-button" type="submit">${a.icon('check')}Guardar movimento</button>${button('cancel-negotiation','Fechar edição','x')}</div></fieldset><p class="ux-workflow-feedback" role="status">${esc(d.feedback||'')}</p></form>`:'';
      return`<section class="ux-workflow" data-workflow-kind="negotiation"><div class="crm-detail-section__heading"><h3>Negociação por fração</h3></div>${form}<div class="ux-workflow-add"><label class="field"><span>Fração</span><select name="negotiationUnit">${a.rows().map(r=>`<option value="${r.number}">Apt. ${r.number} · ${esc(a.status(r))}</option>`).join('')}</select></label>${button('new-movement','Novo movimento','plus')}</div>${numbers.map(n=>{const info=model.negotiation(a.events(),c.id,n,a.today()),r=a.rows().find(r=>r.number===Number(n)),followup=a.followup(c.id,info.history);if(followup){info.action=followup.status!=='none'?info.history.find(ev=>ev.id===followup.eventId):undefined;info.overdue=followup.status==='overdue'}return`<section class="ux-client-section" data-negotiation-unit="${n}"><div class="crm-detail-section__heading"><h3>Apt. ${n} <span class="badge badge--neutral">${esc(info.state)}</span></h3>${button('unit-movement','Registar movimento','plus',`data-number="${n}"`)}</div>${a.facts([['Disponibilidade global',a.status(r)],['Preço oficial atual',a.price(r)],['Último preço apresentado',info.informed?a.money(info.informed.informedPrice):'—'],['Última proposta',info.offer?a.money(info.offer.amount):'—'],['Última contraproposta',info.counter?a.money(info.counter.amount):'—']])}${info.action?`<div class="ux-next-action ${info.overdue?'ux-workflow-overdue':''}"><div>${a.icon('calendar-clock')}<span>${info.overdue?'Acompanhamento vencido':info.action.followupDate?'Acompanhamento pendente':'Acompanhamento sem data'}</span><strong>${esc(info.action.nextStep||'Contactar')} · ${esc(info.action.followupDate||'Sem data')}${info.action.channel?' · '+esc(info.action.channel):''}</strong></div>${button('complete-action','Concluir ação','check',`data-event="${esc(info.action.id)}"`)}</div>`:''}<details class="ux-client-details"><summary>Evolução comercial (${info.history.length})</summary><div class="timeline ux-client-timeline">${info.history.map(ev=>a.timeline({...ev,fractions:[Number(n)],informedPrices:model.prices(ev).filter(row=>Number(row.fraction||row.unitId)===Number(n)),presentationHistory:undefined})).join('')}</div></details></section>`}).join('')}${a.general(c)}<details class="ux-client-details" id="clientFullHistory" open><summary>Histórico comercial completo</summary><div class="top-actions">${button('old-event','Adicionar evento','plus')}</div><div class="timeline ux-client-timeline">${a.events().filter(e=>e.clientId===c.id).slice().sort((x,y)=>(y.date||'').localeCompare(x.date||'')||(y.time||'').localeCompare(x.time||'')).map(a.timeline).join('')}</div></details></section>`;
    }
    function collect(form,d){
      for(const key of ['date','time','channel','state','notes','documentation','type','interest','nextStep','followupDate','agentId','commissionType'])if(form.elements[key])d[key]=form.elements[key].value;
      for(const key of ['amount','commissionValue'])if(form.elements[key])d[key]=Number(form.elements[key].value)||0;
      if(form.elements.withAgent)d.withAgent=form.elements.withAgent.checked;
      form.querySelectorAll('[data-present-price]').forEach(input=>{const r=d.rows.find(r=>r.fraction===Number(input.dataset.presentPrice));if(r)r.informedPrice=Number(input.value)||0});
    }
    function warnings(form,d){
      for(const r of d.rows||[]){const target=form.querySelector(`[data-price-warning="${r.fraction}"]`);if(target)target.textContent=r.officialPrice&&r.informedPrice>0&&r.informedPrice<r.officialPrice?`${a.money(r.informedPrice-r.officialPrice)} (${((r.informedPrice/r.officialPrice-1)*100).toFixed(1)}%) face ao oficial registado.`:''}
    }
    async function submit(c,kind,form){
      if(saving)return;const d=draft(c.id,kind);if(!d)return;collect(form,d);
      saving=true;form.querySelector('fieldset').disabled=true;
      try{
        const old=a.event(d.id);
        if((old?JSON.stringify(old):'')!==d.original)throw Error('O registo mudou. Feche a edição e consulte a versão atual antes de continuar.');
        let ev;
        if(kind==='presentation'){
          if(d.state==='realized'&&model.latest(old)?.state!=='realized'){
            const current=a.rows();d.rows.forEach(row=>{const source=current.find(r=>r.number===row.fraction);row.officialPrice=source?.priceConfirmed?source.currentPrice:null});
          }
          ev=model.buildPresentation(old,d);
        }
        else{
          if(!model.movementTypes.includes(d.type)||!model.states.includes(d.interest)||!d.date)throw Error('Preencha a data e o movimento comercial.');
          if(['Proposta recebida','Nova proposta recebida','Contra-proposta enviada','Reserva efetuada','Venda concluída'].includes(d.type)&&!(d.amount>0))throw Error('Indique um valor positivo para este movimento.');
          const withAgent=d.type==='Venda concluída'&&d.withAgent;
          if(withAgent&&!a.agents().some(g=>g.id===d.agentId))throw Error('Selecione um agente existente.');
          if(withAgent&&(d.commissionValue<0||d.commissionType==='percent'&&d.commissionValue>100))throw Error('Comissão inválida.');
          ev={...copy(old||{}),...a.nextAction(old||{},d.nextStep,d.followupDate),id:d.id,clientId:c.id,negotiationVersion:1,type:d.type,date:d.date,time:d.time,amount:d.amount||0,fractions:[d.fraction],interest:({'Reserva efetuada':'Reservado','Venda concluída':'Vendido','Reserva cancelada':'Interessado','Aceitação':'Aceite','Rejeição':'Sem interesse','Desistência':'Desistiu'})[d.type]||d.interest,notes:d.notes,nextStep:d.nextStep,followup:d.nextStep,followupDate:d.followupDate,channel:d.channel,withAgent,agentId:withAgent?d.agentId:'',commissionType:withAgent?d.commissionType:'',commissionValue:withAgent?d.commissionValue:0,commissionAmount:withAgent?a.commission(d.amount,d.commissionType,d.commissionValue):0};
        }
        if(JSON.stringify(ev)===d.original){d.feedback='Sem alterações por guardar.';return}
        const closing=a.closing(ev)||a.closing(old);
        if(closing){
          const accepted=await a.confirmClosing(ev,old,d.revision);if(!accepted)return;
          if(ev.type==='Reserva cancelada')ev.releaseReservation=true;
        }
        // A single local mutation and CAS write contain both the event and its business effects.
        a.apply(ev,old);d.original=JSON.stringify(a.event(d.id));
        const confirmed=await a.persist();d.revision=a.revision();
        d.feedback=confirmed?'Registo guardado e sincronizado.':'Registo preservado localmente. Sincronização por confirmar; não crie outra cópia. Utilize o indicador de sincronização.';
        if(confirmed){drafts.delete(c.id+':'+kind);a.feedback(true,'Registo guardado e sincronizado.')}else a.feedback(false,'');
      }catch(error){d.feedback=error.message||'Não foi possível concluir o registo.'}
      finally{saving=false;a.render();a.tab(kind)}
    }
    function bind(c,container){
      container.querySelectorAll('[data-workflow-form]').forEach(form=>{
        const kind=form.dataset.workflowForm,d=draft(c.id,kind);
        form.onsubmit=e=>{e.preventDefault();submit(c,kind,form)};
        form.oninput=()=>{if(d){collect(form,d);warnings(form,d)}};
        form.onchange=form.oninput;if(d)warnings(form,d);
      });
      container.querySelectorAll('[data-workflow]').forEach(btn=>btn.onclick=async()=>{
        if(saving)return;const section=btn.closest('[data-workflow-kind]'),kind=section.dataset.workflowKind,d=draft(c.id,kind),action=btn.dataset.workflow;
        if(action==='new-presentation'){newPresentation(c.id);return}
        if(action==='cancel-presentation'||action==='cancel-negotiation'){if(d&&!await a.confirm('Fechar esta edição? Os valores ainda não guardados neste formulário serão descartados.','Fechar edição'))return;drafts.delete(c.id+':'+kind);a.render();return}
        if(action==='add-unit'||action==='remove-unit'){
          if(!d){const n=Number(action==='add-unit'?section.querySelector('[name="addUnit"]').value:btn.dataset.number);newPresentation(c.id);const created=draft(c.id,'presentation');if(action==='remove-unit')created.rows=created.rows.filter(r=>r.fraction!==n);else if(n&&!created.rows.some(r=>r.fraction===n))created.rows.push(priceRow(n));a.render();return}
          const n=Number(action==='add-unit'?section.querySelector('[name="addUnit"]').value:btn.dataset.number);
          if(action==='remove-unit')d.rows=d.rows.filter(r=>r.fraction!==n);
          else if(n&&!d.rows.some(r=>r.fraction===n))d.rows.push(priceRow(n));
          a.render();return;
        }
        if(action==='new-movement'||action==='unit-movement'){
          if(d&&!await a.confirm('Substituir o formulário de movimento aberto? As alterações não guardadas serão descartadas.','Novo movimento'))return;
          newMovement(c.id,Number(btn.dataset.number||section.querySelector('[name="negotiationUnit"]').value));return;
        }
        if(action==='complete-action'){
          const ev=a.event(btn.dataset.event);if(!ev||!await a.confirm('Concluir esta ação da fração, preservando o histórico?','Concluir ação'))return;
          saving=true;try{ev.nextActionCompletedAt=new Date().toISOString();a.recalculate(c.id);const ok=await a.persist();a.feedback(ok,'Ação concluída e sincronizada.')}finally{saving=false;a.render()}return;
        }
        if(action==='pdf')a.pdf();
        if(action==='old-event')a.oldEvent();
      });
    }
    function edit(ev){if(model.latest(ev)){newPresentation(ev.clientId,ev);return true}if(ev.negotiationVersion===1){newMovement(ev.clientId,ev.fractions?.[0],ev);return true}return false}
    return{presentationMarkup,negotiationMarkup,bind,edit,newPresentation};
  };
})(window);
