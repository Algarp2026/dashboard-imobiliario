(function(root){
  'use strict';
  root.createOpportunityWorkflow=function(a,sharedEditors){
    const originalTimeline=a.timeline;
    a={...a,timeline:e=>originalTimeline(e)+ops.priceRows(e).filter(row=>row.observation).map(row=>`<p class="muted">Apt. ${Number(row.fraction||row.unitId)} · ${esc(row.observation)}</p>`).join('')};
    const ops=root.THE_VIEW_OPPORTUNITIES,model=root.THE_VIEW_CLIENT_WORKFLOW,esc=a.esc,drafts=new Map(),opened=new Map();
    let saving=false,audit=null,feedback='';
    const field=(label,name,value='',type='text',extra='')=>`<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
    const select=(label,name,values,value)=>`<label class="field"><span>${label}</span><select name="${name}">${values.map(v=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;
    const area=(label,name,value='')=>`<label class="field"><span>${label}</span><textarea name="${name}" rows="2">${esc(value)}</textarea></label>`;
    const command=(key,label,n='',icon='plus')=>`<button class="ghost-button compact-button" type="button" data-op-command="${key}" data-number="${n}">${a.icon(icon)}${label}</button>`;
    const rows=c=>model.clientProjection(a.data(),c).relations.filter(r=>r.commercialState);
    const identity=(cid,n)=>cid+':'+n;
    const reviewMarkup=(messages,unit='')=>messages.length?`<details class="op-review" data-op-review="${unit}"><summary><span role="status">Necessita de revisão${unit?' · Apt. '+unit:''} (${messages.length})</span></summary><ul>${messages.map(message=>`<li>${esc(message)}</li>`).join('')}</ul></details>`:'';
    function transitions(c,info){
      const row=a.rows().find(r=>r.number===info.number),availability=a.status(row),blocked=ops.cycleInfo(a.data(),c.id,{date:a.today()}).blocked;
      const negotiated=ops.hasNegotiation(a.data(),c.id,info.number,{date:a.today(),opportunityVersion:1});
      return ops.states.map(state=>{
        let reason='';
        if(blocked)reason='Confirme a requalificação do cliente em Dados antes de iniciar outro ciclo.';
        else if(info.commercialState==='Vendida')reason='Venda confirmada: utilize apenas o procedimento administrativo protegido.';
        else if(info.commercialState==='Reservada'){if(state!=='Vendida')reason='Cancele a reserva pelo comando próprio antes de alterar a oportunidade.'}
        else if(availability!=='Disponível')reason='A disponibilidade ou titularidade da fração impede esta operação.';
        else if(state==='Não concretizada'&&!negotiated)reason='Sem negociação válida neste ciclo. Utilize Recusada e indique o motivo.';
        if(state===info.commercialState)reason='';
        const label=state===info.commercialState?state:state==='Reservada'?'Confirmar reserva…':state==='Vendida'?'Confirmar venda…':state==='Não concretizada'?'Encerrar negociação sem acordo':state;
        return{state,label,reason};
      });
    }
    function stateControl(c,info){
      const choices=transitions(c,info),reasons=[...new Set(choices.map(choice=>choice.reason).filter(Boolean))];
      return`<label class="field"><span>Alterar situação comercial</span><select data-op-state="${info.number}" aria-describedby="op-state-help-${info.number}" ${saving?'disabled':''}>${choices.map(choice=>`<option value="${esc(choice.state)}" ${choice.state===info.commercialState?'selected':''} ${choice.reason?'disabled':''}>${esc(choice.label)}</option>`).join('')}</select></label><p id="op-state-help-${info.number}" class="muted small">${reasons.map(esc).join(' ')}${choices.some(choice=>!choice.reason&&['Reservada','Vendida'].includes(choice.state)&&choice.state!==info.commercialState)?' Reservas e vendas exigem confirmação e validação comercial.':''}</p>`;
    }
    function begin(c,n,action,existing=null){
      const info=model.relation(a.data(),c.id,n),source=a.rows().find(r=>r.number===n),last=info.effectiveRounds.at(-1);
      const target={present:'Apresentada',refuse:'Recusada',close:'Não concretizada',round:'Em negociação',reserve:'Reservada',sale:'Vendida',reopen:'Por apresentar'}[action];
      const unavailable=target&&transitions(c,info).find(choice=>choice.state===target)?.reason;
      if(!existing&&unavailable){feedback=unavailable;a.render();return}
      drafts.set(identity(c.id,n),{id:a.id(),clientId:c.id,fractions:[n],action,date:a.today(),amount:last?.amount||info.informed?.informedPrice||source?.currentPrice||'',notes:'',reason:'',party:'cliente',terms:last?.terms||'',respondsTo:last?.id||'',decision:'Em análise',revision:a.revision(),withAgent:false,agentId:'',commissionType:'percent',commissionValue:0});opened.set(c.id,n);feedback='';a.render();a.tab('opportunities');
      if(existing)drafts.get(identity(c.id,n)).respondsTo=existing.respondsTo||'';
    }
    function editor(c,n){
      const d=drafts.get(identity(c.id,n));if(!d)return'';
      const info=model.relation(a.data(),c.id,n),closing=['reserve','sale','cancel-reservation'].includes(d.action);
      let inputs=field('Data efetiva','date',d.date,'date','required');
      if(d.action==='present')inputs+=(d.candidates||d.fractions).map(number=>`<div>${d.candidates?`<label><input type="checkbox" name="include-${number}" ${d.fractions.includes(number)?'checked':''}> Apresentar Apt. ${number}</label>`:''}${field('Preço comunicado · Apt. '+number,'price-'+number,d['price-'+number]??a.rows().find(r=>r.number===number)?.currentPrice??'','number',`min="0.01" step="0.01" ${d.fractions.includes(number)?'required':'disabled'}`)}</div>`).join('');
      if(['refuse','close'].includes(d.action))inputs+=select('Motivo','reason',['',...(d.action==='refuse'?ops.reasons:['Proposta não aceite pela empresa','Condições não aceites pelo cliente','Falta de acordo','Cliente desistiu da negociação','Outro motivo'])],d.reason);
      if(d.action==='round')inputs+=select('Proposta de','party',['cliente','empresa'],d.party)+field('Valor (€)','amount',d.amount,'number','min="0" step="0.01"')+area('Condições comerciais','terms',d.terms);
      const proposals=(info.effectiveRounds||[]).filter(r=>r.id!==d.corrects);
      if(['round','decision','agreement'].includes(d.action))inputs+=`<label class="field"><span>Proposta de referência</span><select name="respondsTo"><option value="">${d.respondsTo&&!proposals.some(r=>r.id===d.respondsTo)?'Proposta alterada: selecione a versão efetiva':d.action==='round'?'Primeira proposta':'Selecione a proposta'}</option>${proposals.map(r=>`<option value="${esc(r.id)}" ${r.id===d.respondsTo?'selected':''}>${esc(r.date)} · ${esc(r.party)} · ${a.money(r.amount)} · ${esc(r.terms||'Sem condições adicionais')}</option>`).join('')}</select></label>`;
      if(d.action==='decision')inputs+=select('Decisão sobre esta proposta','decision',ops.decisions,d.decision);
      if(closing&&d.action!=='cancel-reservation')inputs+=field(d.action==='sale'?'Valor final (€)':'Valor acordado (€)','amount',d.amount,'number','min="0.01" step="0.01" required');
      if(d.action==='sale')inputs+=`<label><input name="withAgent" type="checkbox" ${d.withAgent?'checked':''}> Venda com agente</label><div data-op-agent ${d.withAgent?'':'hidden'}><label class="field"><span>Agente</span><select name="agentId"><option value="">Selecione um agente</option>${a.agents().map(g=>`<option value="${esc(g.id)}" ${g.id===d.agentId?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label>${select('Tipo de comissão','commissionType',['percent','fixed'],d.commissionType)}${field('Comissão','commissionValue',d.commissionValue,'number','min="0" step="0.01"')}</div>`;
      return`<form data-op-form="${n}"><fieldset ${saving?'disabled':''}><legend>${esc({present:'Confirmar apresentação',refuse:'Recusar fração',close:'Encerrar definitivamente',round:'Nova ronda',decision:'Resposta à proposta',agreement:'Confirmar acordo sem reserva',reserve:'Confirmar reserva',sale:'Confirmar venda',reopen:'Reabrir oportunidade','cancel-reservation':'Cancelar reserva'}[d.action]||'Oportunidade')}</legend><div class="op-editor-grid">${inputs}</div>${area('Observações'+(d.reason==='Outro motivo'?' / descrição obrigatória':''),'notes',d.notes)}<div class="top-actions"><button class="primary-button compact-button" type="submit">${a.icon('check')}Guardar e confirmar</button>${command('cancel','Cancelar',n,'x')}</div></fieldset><p role="status" data-op-feedback>${esc(d.feedback||'')}</p></form>`;
    }
    function card(c,info){
      const n=info.number,r=a.rows().find(r=>r.number===n),d=drafts.get(identity(c.id,n)),last=info.rounds.at(-1);
      const history=model.ordered([...info.history,...(info.origin&&!info.history.some(e=>e.id===info.origin.event.id)?[info.origin.event]:[])]);
      const canClose=!transitions(c,info).find(choice=>choice.state==='Não concretizada').reason;
      return`<details class="opportunity-card" data-opportunity-unit="${n}" ${opened.get(c.id)===n?'open':''}>
        <summary><span><strong>Apt. ${n}</strong><small>${esc(r?.typology||'—')} · Piso ${esc(r?.floorLabel||'—')}</small></span><strong>${esc(info.commercialState)}</strong><span>${info.commercialState==='Em negociação'?`${last?a.money(last.amount):'Negociação legada'}<small>${esc(info.situation)} · ${info.rounds.length} rondas</small>`:info.effect?a.money(info.effect.amount):info.informed?a.money(info.informed.informedPrice):'Preço comunicado por definir'}</span><span>${a.icon('chevron-down')}</span></summary>
        <div class="opportunity-card__content"><p class="muted">Disponibilidade global: <strong>${esc(a.status(r))}</strong> · Preço oficial: ${r?a.price(r):'Não confirmado'}</p>
        ${info.origin?`<p class="opportunity-origin">${esc(info.origin.label)} · ${esc(info.origin.event.date)} · Origem ${esc(info.origin.event.id)}</p>`:''}${reviewMarkup(info.review,n)}${stateControl(c,info)}${d?editor(c,n):''}
        ${info.commercialState==='Em negociação'?`<div class="top-actions">${command('round','Nova ronda',n)}${info.effectiveRounds.length?command('decision','Registar decisão',n,'check')+command('agreement','Acordo sem reserva',n,'handshake'):''}${canClose?command('close','Encerrar sem acordo',n,'x'):''}</div><p>${esc(info.situation)}</p><details class="op-round-history"><summary>Rondas e condições (${info.rounds.length})</summary>${info.rounds.map(round=>`<article><strong>${esc(round.date)} · ${esc(round.party)} · ${a.money(round.amount)}</strong><p>${esc(round.terms||'Sem condições adicionais')}</p><span>${esc(round.decision)} · ${esc(round.id)}${round.supersededBy?' · Corrigida por '+esc(round.supersededBy):''}</span>${round.response?`<p>Decisão ${esc(round.response.date)} · ${esc(round.response.id)}</p>`:''}</article>`).join('')||'<p>Movimentos legados preservados no histórico original.</p>'}</details>`:''}
        <div class="top-actions">${command('pdf','PDF de proposta',n,'file-text')}${info.commercialState==='Reservada'?command('cancel-reservation','Cancelar reserva',n,'x'):''}</div>
        <details class="op-history"><summary>Histórico da fração (${history.length})</summary><div class="timeline">${history.map(e=>a.timeline({...e,fractions:[n],informedPrices:ops.priceRows(e).filter(p=>Number(p.fraction||p.unitId)===n),presentationHistory:undefined})).join('')}</div></details></div></details>`;
    }
    function opportunityMarkup(c){
      const items=rows(c),pending=items.filter(r=>r.commercialState==='Por apresentar');
      return`<section class="opportunity-workspace"><div class="crm-detail-section__heading"><h3>Oportunidades <span>${items.length}</span></h3>${pending.length?command('multi-present','Apresentar várias frações','','presentation'):''}</div><p role="status" class="op-workspace-feedback">${esc(feedback)}</p>${items.length?`<div class="opportunity-list">${items.map(info=>card(c,info)).join('')}</div>`:'<p class="empty-state">Selecione frações na Procura para iniciar as oportunidades.</p>'}${audit?`<details class="op-audit" open><summary>Edição administrativa de registo histórico</summary>${command('close-audit','Fechar consulta administrativa','','x')}${audit.presentationHistory?sharedEditors.presentationMarkup(c):audit.negotiationVersion?sharedEditors.negotiationMarkup(c):`<div class="timeline">${a.timeline(audit)}</div>`}</details>`:''}<details id="clientFullHistory"><summary>Histórico comercial original</summary><button class="ux-text-button" type="button" data-ux-client-action="event">Adicionar evento</button><div class="timeline">${model.ordered(a.events().filter(e=>e.clientId===c.id)).reverse().map(a.timeline).join('')}</div></details></section>`;
    }
    function dataMarkup(c){
      const items=rows(c),agent=a.agents().find(g=>g.id===c.agentId);
      const counts=ops.states.map(s=>[s,items.filter(r=>r.commercialState===s).length]);
      return`<section class="op-client-data">${a.facts([['Nome',c.name],['Telefone / WhatsApp',c.phone],['Email',c.email],['Origem',c.originManual||c.origin],['Agente',agent?.name||c.agent],['Imobiliária',agent?.agency||c.agency],['NIF',c.nif],['Nacionalidade',c.nationality],['Observações gerais',c.notes],['Último contacto efetivo',model.contactInfo(c,a.events(),a.today()).lastContact||'—']])}${a.general(c)}<details id="clientContactSettings" class="ux-client-details" ${sharedEditors.contactMarkup(c).includes('data-contact-form')?'open':''}><summary>Contactos e acompanhamento</summary>${sharedEditors.contactMarkup(c)}</details><h3>Resumo comercial</h3><div data-op-relevant-summary>${items.length?a.facts(counts.filter(([,count])=>count>0)):'<p class="muted">Sem oportunidades registadas.</p>'}</div><details class="op-full-summary"><summary>Consultar todos os estados</summary>${a.facts(counts)}</details>${ops.cycleInfo(a.data(),c.id,{date:a.today()}).blocked?command('requalify','Confirmar requalificação','','check'):''}</section>`;
    }
    function collect(form,d){
      for(const input of [...form.querySelectorAll('input[name],select[name],textarea[name]')])d[input.name]=input.type==='checkbox'?input.checked:['amount','commissionValue'].includes(input.name)||input.name.startsWith('price-')?Number(input.value):input.value;
      if(d.candidates){d.fractions=d.candidates.filter(n=>d['include-'+n]);for(const n of d.candidates){const input=form.elements['price-'+n];input.disabled=!d.fractions.includes(n);input.required=!input.disabled}}
    }
    async function submit(c,n,form){
      const d=drafts.get(identity(c.id,n));if(!d||saving)return;collect(form,d);saving=true;form.querySelector('fieldset').disabled=true;
      try{
        if(d.saved){if(await a.persist()){drafts.delete(identity(c.id,n));feedback='Gravação confirmada.'}else d.feedback='Alterações locais preservadas. Sincronização por confirmar.';return}
        if(d.revision!==a.revision())throw Error('A revisão mudou; a proposta ou as condições podem ter sido alteradas. Releia a versão efetiva e confirme novamente.');
        let ev;
        if(['reserve','sale','cancel-reservation'].includes(d.action)){
          if(!ops.validDate(d.date)||d.action!=='cancel-reservation'&&(!Number.isFinite(d.amount)||d.amount<=0))throw Error('Indique data e valor válidos.');
          const withAgent=d.action==='sale'&&d.withAgent;
          if(withAgent&&(!a.agents().some(g=>g.id===d.agentId)||!Number.isFinite(d.commissionValue)||d.commissionValue<0||d.commissionType==='percent'&&d.commissionValue>100))throw Error('Agente ou comissão inválidos.');
          ev={id:d.id,clientId:c.id,date:d.date,fractions:[n],type:d.action==='reserve'?'Reserva efetuada':d.action==='sale'?'Venda concluída':'Reserva cancelada',negotiationVersion:1,amount:d.action==='cancel-reservation'?0:d.amount,notes:d.notes,withAgent,agentId:withAgent?d.agentId:'',commissionType:withAgent?d.commissionType:'',commissionValue:withAgent?d.commissionValue:0,commissionAmount:withAgent?a.commission(d.amount,d.commissionType,d.commissionValue):0,...(d.action==='cancel-reservation'?{releaseReservation:true}:{})};
          if(!await a.confirmClosing(ev,null,d.revision))return;
        }else ev=ops.build({...d,rows:d.action==='present'?d.fractions.map(number=>({fraction:number,informedPrice:d['price-'+number]??a.rows().find(r=>r.number===number)?.currentPrice,officialPrice:a.rows().find(r=>r.number===number)?.priceConfirmed?a.rows().find(r=>r.number===number).currentPrice:null})):undefined},a.data());
        if(a.events().some(e=>e.id===ev.id))throw Error('Este registo já existe. Reveja a sincronização.');
        a.apply(ev,null);d.saved=true;
        const ok=await a.persist();d.revision=a.revision();
        if(ok){drafts.delete(identity(c.id,n));feedback='Alteração guardada e sincronizada.'}else d.feedback='Alterações locais preservadas. Sincronização por confirmar; retome sem criar outro registo.';
      }catch(error){d.feedback=error.message||'Não foi possível confirmar a operação.'}
      finally{saving=false;a.render();a.tab('opportunities');const target=document.querySelector(`[data-opportunity-unit="${n}"] [data-op-state]`);if(target)target.focus({preventScroll:true})}
    }
    function bind(c,container){
      sharedEditors.bind(c,container);
      for(const info of rows(c)){
        if(info.agreement){const content=container.querySelector(`[data-opportunity-unit="${info.number}"] .opportunity-card__content`);if(content&&!content.querySelector('[data-op-agreement]')){const line=document.createElement('p');line.dataset.opAgreement='';line.textContent='Acordo: '+info.agreement.id+' · '+a.money(info.agreement.amount)+' · '+(info.agreement.terms||'Sem condições adicionais');content.prepend(line)}}
        if(!info.informed)continue;
        const content=container.querySelector(`[data-opportunity-unit="${info.number}"] .opportunity-card__content`);
        if(content&&!content.querySelector('[data-op-presented-price]')){const line=document.createElement('p');line.dataset.opPresentedPrice='';line.textContent='Preço apresentado: '+a.money(info.informed.informedPrice)+' · '+info.informed.date+(info.informed.observation?' · '+info.informed.observation:'');content.prepend(line)}
      }
      container.querySelectorAll('[data-opportunity-unit]').forEach(details=>details.addEventListener('toggle',()=>{
        if(!details.isConnected)return;
        if(details.open){opened.set(c.id,Number(details.dataset.opportunityUnit));container.querySelectorAll('[data-opportunity-unit]').forEach(other=>{if(other!==details)other.open=false})}
        else if(opened.get(c.id)===Number(details.dataset.opportunityUnit))opened.delete(c.id);
      }));
      container.querySelectorAll('[data-opportunity-unit]>summary').forEach(summary=>summary.addEventListener('click',()=>{const details=summary.parentElement;if(!details.open){opened.set(c.id,Number(details.dataset.opportunityUnit));container.querySelectorAll('[data-opportunity-unit]').forEach(other=>{if(other!==details)other.open=false})}}));
      container.querySelectorAll('[data-op-form]').forEach(form=>{if(drafts.get(identity(c.id,Number(form.dataset.opForm)))?.saved){form.querySelectorAll('input,select,textarea').forEach(input=>input.disabled=true);form.querySelector('[type="submit"]').textContent='Confirmar sincronização pendente'}});
      container.querySelectorAll('[data-op-state]').forEach(select=>select.onchange=()=>{const action={'Por apresentar':'reopen','Apresentada':'present','Recusada':'refuse','Em negociação':'round','Não concretizada':'close','Reservada':'reserve','Vendida':'sale'}[select.value];begin(c,Number(select.dataset.opState),action)});
      container.querySelectorAll('[data-op-form]').forEach(form=>{const n=Number(form.dataset.opForm),d=drafts.get(identity(c.id,n));form.oninput=()=>collect(form,d);form.onchange=()=>{collect(form,d);const g=form.querySelector('[data-op-agent]');if(g)g.hidden=!d.withAgent};form.onsubmit=e=>{e.preventDefault();submit(c,n,form)}});
      container.querySelectorAll('[data-op-command]').forEach(button=>button.onclick=async()=>{
        if(saving)return;const n=Number(button.dataset.number),action=button.dataset.opCommand;
        if(action==='requalify'){
          const revision=a.revision(),snapshot=JSON.stringify(a.data());
          if(!await a.confirm('Confirma a requalificação e o início de um novo ciclo? O histórico anterior permanece encerrado; reservas, vendas e preços não serão alterados.','Requalificação do cliente'))return;
          if(revision!==a.revision()||snapshot!==JSON.stringify(a.data())){await a.notify('A base mudou. Reveja a decisão antes de confirmar.');return}
          saving=true;try{a.apply({id:a.id(),clientId:c.id,type:'Preferências recebidas',date:a.today(),time:new Date().toLocaleTimeString('pt-PT',{timeZone:'Europe/Lisbon',hour12:false}).slice(0,5),createdAt:new Date().toISOString(),fractions:[],administrative:true,actualCommunication:false,requalificationConfirmed:true,source:'opportunity-requalification',notes:'Novo ciclo confirmado explicitamente pelo utilizador.'},null);feedback=await a.persist()?'Requalificação guardada e sincronizada.':'Requalificação local preservada. Sincronização por confirmar.'}catch(error){feedback=error.message}finally{saving=false;a.render();a.tab('data')}return;
        }
        if(action==='cancel'){drafts.delete(identity(c.id,n));a.render();return}
        if(action==='pdf'){a.pdfFor?a.pdfFor([n]):a.pdf();return}
        if(action==='close-audit'){audit=null;a.render();return}
        if(action==='multi-present'){const pending=rows(c).filter(r=>r.commercialState==='Por apresentar').map(r=>r.number);if(!pending.length)return;begin(c,pending[0],'present');Object.assign(drafts.get(identity(c.id,pending[0])),{fractions:pending,candidates:pending});a.render();return}
        begin(c,n,action);
      });

    }
    return{...sharedEditors,opportunityMarkup,dataMarkup,reviewMarkup,bind,
      edit(ev){
        if(ev.opportunityVersion&&['present','round','refuse','close'].includes(ev.opportunityAction)){
          const c=a.client(ev.clientId),n=ev.fractions[0];begin(c,n,ev.opportunityAction,ev);
          const d=drafts.get(identity(c.id,n));Object.assign(d,{corrects:ev.id,date:ev.date,fractions:[...ev.fractions],amount:ev.amount,terms:ev.terms||'',party:ev.party||'cliente',reason:ev.reason||'',notes:ev.notes||''});
          for(const r of ev.informedPrices||[])d['price-'+r.fraction]=r.informedPrice;
          a.render();return true;
        }
        if(ev.communicationHistory){audit=null;return sharedEditors.edit(ev)}
        audit=ev;if(ev.opportunityVersion){a.render();a.tab('opportunities');return true}return sharedEditors.edit(ev);
      },
      newPresentation(cid){const c=a.client(cid),pending=rows(c).filter(r=>r.commercialState==='Por apresentar');if(pending.length)begin(c,pending[0].number,'present')},
      newContact(cid,received,event){sharedEditors.newContact(cid,received,event);a.tab('data')}
    };
  };
})(window);
