(function(root){
  'use strict';
  const urgency=(row,date)=>{
    const followup=row.followup||{},day=String(followup.date||''),limit=new Date(date+'T12:00:00Z');
    limit.setUTCDate(limit.getUTCDate()+7);
    if(followup.status==='overdue')return 0;
    if(row.state==='Resposta nossa pendente')return 1;
    if(['undated','undated-review'].includes(followup.status))return 2;
    if(followup.status!=='none'&&day>=date&&day<=limit.toISOString().slice(0,10))return 3;
    return row.priority?4:5;
  };
  const syncDisplay=({phase,checking,editing,canWrite,label='',uncertain=false})=>{
    if(phase==='loading')return'initial';
    if(uncertain&&phase!=='synced')return'uncertain';
    if(phase==='conflict')return'conflict';
    if(phase==='offline')return'offline';
    if(/A aguardar confirmação|A conciliar/.test(label))return'saving';
    if(editing)return'draft';
    if(phase==='pending')return'local';
    if(checking)return'checking';
    if(canWrite===false)return'readonly';
    if(/Atualização recebida/.test(label))return'received';
    return /Alterações guardadas/.test(label)?'confirmed':'verified';
  };
  const waitingSummary=(history,state,today)=>{
    const waiting=['Resposta nossa pendente','A aguardar cliente'].includes(state),record=history?.at(-1);
    if(!waiting||record?.value!==state||!Number.isFinite(Date.parse(record?.recordedAt)))return{waiting,since:'',days:null};
    const since=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(record.recordedAt));
    const days=(Date.parse(today+'T12:00:00Z')-Date.parse(since+'T12:00:00Z'))/86400000;
    return{waiting,since:Number.isFinite(days)&&days>=0?since:'',days:Number.isFinite(days)&&days>=0?Math.floor(days):null};
  };
  root.THE_VIEW_D2={urgency,syncDisplay,waitingSummary,orderPriorities:(rows,date)=>rows.slice().sort((a,b)=>urgency(a,date)-urgency(b,date)||String(a.followup?.date||'9999').localeCompare(String(b.followup?.date||'9999')))};
  if(typeof document==='undefined')return;
  const q=(selector,parent=document)=>parent?.querySelector(selector),all=(selector,parent=document)=>[...(parent?.querySelectorAll(selector)||[])];
  const create=(tag,className,text)=>{const e=document.createElement(tag);e.className=className;if(text)e.textContent=text;return e};
  function group(parent,className,nodes,tag='div'){
    const members=nodes.filter(Boolean);if(!parent||!members.length)return null;
    let box=q(':scope>.'+className,parent);
    if(!box){box=create(tag,className);let anchor=members[0];while(anchor.parentElement&&anchor.parentElement!==parent)anchor=anchor.parentElement;if(anchor.parentElement===parent)anchor.before(box);else parent.append(box)}
    members.forEach(node=>{if(node.parentElement!==box)box.append(node)});return box;
  }
  function title(parent,text){if(parent&&!q(':scope>.d2-section-label',parent))parent.prepend(create('h3','d2-section-label',text))}
  function searchList(list,placeholder){
    if(!list||q(':scope>.d2-list-search',list.parentElement))return;
    const input=create('input','d2-list-search');input.type='search';input.placeholder=placeholder;input.setAttribute('aria-label',placeholder);
    input.addEventListener('input',()=>filterList(list,input.value));list.before(input);
  }
  function filterList(list,value){
    const query=value.trim().toLocaleLowerCase('pt-PT');
    all(':scope>[data-d2-searchable],:scope>.event-item,:scope>[data-agent-card]',list).forEach(item=>item.hidden=!item.textContent.toLocaleLowerCase('pt-PT').includes(query));
  }
  function agents(){
    const list=q('#agentsList'),detail=q('#agentDetail');if(!list||!detail)return;
    const layout=list.closest('.client-layout');if(!layout)return;layout.classList.add('d2-agent-workspace');
    const heading=q('#agentsPanel>.section-heading h2');if(heading)heading.textContent='Agentes e agências';
    let directory=q(':scope>.d2-agent-directory',layout);
    if(!directory){directory=create('aside','d2-agent-directory');list.before(directory);directory.append(list);title(directory,'Carteira de agentes')}
    searchList(list,'Pesquisar agente ou agência…');
    all('[data-agent-card]',list).forEach(card=>{
      card.tabIndex=0;card.setAttribute('role','button');
      card.onkeydown=e=>{if(e.target===card&&['Enter',' '].includes(e.key)){e.preventDefault();card.click()}};
      if(!q('.d2-agent-avatar',card)){const avatar=create('span','d2-agent-avatar',q('strong',card)?.textContent.trim().slice(0,1)||'A');avatar.setAttribute('aria-hidden','true');card.prepend(avatar)}
    });
    const metrics=q(':scope>.fraction-card__metrics',detail);
    if(metrics){
      const items=all(':scope>div',metrics),contact=group(detail,'d2-agent-contacts',items.slice(0,2));
      if(contact)title(contact,'Contactos');
      const activity=group(detail,'d2-agent-activity',items.slice(2));if(activity)title(activity,'Condições e atividade');
      if(!metrics.children.length)metrics.remove();
    }
    const input=q('.d2-list-search',directory);if(input?.value)filterList(list,input.value);
  }
  function prices(){
    const tab=q('#tab-prices'),panel=q(':scope>.panel',tab);if(!panel)return;
    panel.classList.add('d2-price-workspace');
    const filters=q('.filters-grid',panel),table=q('.table-wrap',panel);
    if(filters&&table&&!q('.d2-price-analysis',panel)){
      const analysis=group(panel,'d2-price-analysis',[filters,table]);
      const sidebar=create('aside','d2-price-filters');filters.before(sidebar);sidebar.append(filters);title(sidebar,'Consultar preços');
      const history=q(':scope>.panel:nth-child(2)',tab);
      if(history){const disclosure=create('details','d2-price-history');const summary=create('summary','','Evolução e histórico de preços');disclosure.append(summary);analysis.after(disclosure);disclosure.append(history)}
    }
    const body=q('#pricesTableBody');if(!body)return;
    let metrics=q('.d2-price-summary',panel);if(!metrics){metrics=create('div','d2-price-summary');q('.section-heading',panel)?.after(metrics)}
    const rows=all('tr',body).filter(row=>q('[data-price]',row));
    const fields=[['Frações na consulta',String(rows.length)],['Moeda','EUR'],['Fonte de preços','Comercial atual']];
    const key=JSON.stringify(fields);if(metrics.dataset.signature!==key){metrics.replaceChildren(...fields.map(([label,value])=>{const item=create('div','');item.append(create('span','',label),create('strong','',value));return item}));metrics.dataset.signature=key}
  }
  function proposals(){
    const workspace=q('.d2-proposal-workspace');if(!workspace)return;
    title(q('.d2-proposal-filters',workspace),'Selecionar frações');
    const grid=q('#proposalGrid',workspace);if(!grid)return;
    let results=q(':scope>.d2-proposal-results',workspace);
    if(!results){results=create('section','d2-proposal-results');grid.before(results);results.append(grid);title(results,'Frações para proposta')}
    const header=q('#tab-proposals .section-heading'),commands=q('.top-actions',header);
    if(commands&&!q('.d2-proposal-output',workspace)){
      const output=create('section','d2-proposal-output');q('.d2-proposal-filters',workspace).append(output);title(output,'Documento do cliente');output.append(commands);
      const count=q('#proposalSelectedInfo');if(count)output.prepend(count);
    }
  }
  function history(){
    const detail=q('#fractionHistoryDetail');if(!detail)return;
    detail.classList.add('d2-history-workspace');
    const header=q(':scope>.fraction-history-detail__header',detail),meta=q(':scope>.fraction-history-meta',detail),property=q(':scope>.fraction-history-property-grid',detail);
    if(header&&meta&&property){const overview=group(detail,'d2-history-overview',[header,meta,property]);overview?.setAttribute('aria-label','Enquadramento da fração')}
    const section=q(':scope>.crm-detail-section',detail);if(section){section.classList.add('d2-history-records');title(section,'Movimentos e proveniência')}
    const table=q('.fraction-history-table',detail);
    all('tbody tr',table).forEach(row=>{
      if(q('details.d2-record-observation',row))return;
      const cell=row.cells[6];if(!cell||cell.textContent.trim()==='—')return;
      const disclosure=create('details','d2-record-observation');disclosure.append(create('summary','','Observação'));const text=create('p','');text.append(...cell.childNodes);disclosure.append(text);cell.append(disclosure);
    });
  }
  function events(){
    const list=q('#salesEventsList');if(!list)return;
    const panel=list.parentElement;panel.classList.add('d2-event-workspace');searchList(list,'Pesquisar evento, cliente ou fração…');
    all(':scope>.event-item',list).forEach(item=>{
      if(q(':scope>.d2-event-detail',item))return;
      const heading=q(':scope>.section-heading',item);if(!heading)return;
      const label=q('strong',heading),parts=label?.textContent.split(' · ')||[],date=parts[0]||'';
      if(label&&parts.length>1)label.textContent=parts.slice(1).join(' · ');
      const rail=create('div','d2-event-date',date);item.prepend(rail);
      const details=create('details','d2-event-detail'),children=[...item.childNodes].filter(node=>node!==heading&&node!==rail);
      details.append(create('summary','','Detalhes do registo'),...children);item.append(details);
    });
    const input=q('.d2-list-search',panel);if(input?.value)filterList(list,input.value);
  }
  function reports(){
    const panel=q('#tab-reports>.panel'),options=q('.ux-report-options',panel);if(!options||q('.d2-report-catalog',panel))return;
    const catalog=create('div','d2-report-catalog');options.before(catalog);
    const labels={proposal:['Proposta ao cliente','Frações, preço de apresentação e plantas'], 'price-list':['Lista de preços','Consulta interna e colunas opcionais'],clients:['Resumo de clientes','Modelos e agrupamento comercial'], 'price-history':['Histórico de preços','Registos das alterações oficiais'],events:['Eventos comerciais','Exportação do histórico de atividade']};
    all('[data-ux-export]',options).forEach(button=>{
      const [name,description]=labels[button.dataset.uxExport]||['Exportação',''];
      const card=create('section','d2-report-card');card.dataset.reportKind=button.dataset.uxExport;
      card.append(create('h3','',name),create('p','muted',description),button);catalog.append(card);
    });options.remove();
    const maintenance=q('.ux-report-maintenance',panel);if(maintenance)maintenance.classList.add('d2-secondary');
  }
  function client(){
    const negotiation=q('[data-workflow-kind="negotiation"]');
    if(negotiation){const heading=q(':scope>.crm-detail-section__heading h3',negotiation);if(heading?.firstChild?.nodeType===3)heading.firstChild.textContent='Oportunidades ';q('h3>span',negotiation)?.classList.add('d2-count');q(':scope>.crm-detail-section__heading [data-ux-client-action="stage"]',negotiation)?.classList.add('d2-context-command');q(':scope>details:not([id])',negotiation)?.classList.add('d2-movement-command')}
    const preferences=q('#clientPanel-procura');
    if(preferences){
      const editor=q('#clientPreferencesEditor',preferences);
      if(editor){
        const selectors=all(':scope>.ux-preference-selector',editor),fields=q(':scope>.ux-preference-fields',editor);
        if(selectors.length&&fields){const layout=group(editor,'d2-preference-editor',[...selectors,fields]);const choices=group(layout,'d2-preference-choices',selectors);if(choices)title(choices,'Perfil do imóvel');title(fields,'Investimento e finalidade')}
      }else{const facts=q(':scope>dl',preferences);if(facts){facts.classList.add('d2-preference-overview');all(':scope>div',facts).forEach((item,i)=>{item.dataset.preferenceGroup=String(i)})}}
    }
    const fractions=q('#clientPanel-procura');
    if(fractions){
      const workspace=q('#clientFractionWorkspace',fractions);
      if(workspace&&!q('.d2-client-match-workspace',workspace)){
        const facts=q(':scope>dl',workspace),notice=q('#clientFractionSourceNotice',workspace),selection=q('#clientFractionSelection',workspace),filters=q(':scope>.ux-fraction-filters',workspace),results=q('#clientFractionRecommendations',workspace),manual=q('#clientFractionManual',workspace);
        const layout=group(workspace,'d2-client-match-workspace',[facts,notice,selection,filters,results,manual]);
        const profile=group(layout,'d2-client-match-profile',[facts,notice,selection],'aside');if(profile)title(profile,'Critérios e seleção');
        group(layout,'d2-client-match-results',[filters,results,manual],'section');
      }
      q('#clientRelatedDetails',fractions)?.classList.add('d2-client-related');
    }
    const presentation=q('[data-workflow-kind="presentation"]');
    if(presentation){
      const prepared=q('#clientPreparedFractions',presentation),history=all(':scope>.ux-client-section',presentation);
      if(prepared&&history.length){const workspace=group(presentation,'d2-presentation-workspace',[prepared,...history]);title(prepared,'Preparação e preços comunicados');history.forEach(section=>section.classList.add('d2-presentation-history'))}
    }
    all('[data-workflow-form]',document).forEach(form=>form.classList.add('d2-editor-surface'));
  }
  function modals(){
    all('.modal-backdrop>.modal').forEach(modal=>{
      modal.classList.add('d2-dialog');
      const heading=q(':scope>h2',modal),eyebrow=q(':scope>.eyebrow',modal),close=q(':scope>.modal-close',modal);
      if(heading)group(modal,'d2-dialog-header',[eyebrow,heading,close].filter(Boolean),'header');
      const fields=all(':scope>.form-grid,:scope>label.field',modal);
      if(fields.length)group(modal,'d2-dialog-fields',fields);
      all('.modal-actions',modal).forEach(actions=>actions.classList.add('d2-dialog-actions'));
    });
  }
  function comparator(){
    const internal=q('#tab-compare>.panel'),controls=q(':scope>.compare-controls',internal),comparison=q(':scope>#compareResult',internal);
    if(internal&&controls&&comparison)group(internal,'d2-internal-compare-workspace',[controls,comparison]);
    const view=q('#compareView'),intro=q(':scope>.intro-panel',view),filters=q(':scope>.filters-panel',view),grid=q('#compareCardsGrid',view);
    if(!intro||!filters||!grid||q('.d2-comparator-workspace',view))return;
    view.classList.add('d2-comparator');
    const result=grid.closest('.panel'),workspace=create('div','d2-comparator-workspace');filters.before(workspace);
    filters.classList.add('d2-comparator-filters');result.classList.add('d2-comparator-results');workspace.append(filters,result);
    const count=q('#compareResultCount');if(count)q('.section-heading',result)?.append(count);
    const kpis=q('#compareKpis');if(kpis){const metrics=create('section','d2-comparator-metrics');intro.after(metrics);metrics.append(kpis)}
  }
  let technicalOpen=false;
  const groupOpen=new Map();
  const drawerAnchors=new WeakMap(),identityOpen=new Map();
  function synchronization(){
    const bar=q('#commercialSyncStatus'),badge=q('#commercialSyncBadge');if(!bar||!badge)return;
    const state=syncDisplay({phase:bar.dataset.phase,checking:bar.dataset.checking==='true',editing:bar.dataset.localEdits==='true',canWrite:bar.dataset.canWrite==='true',label:badge.textContent,uncertain:!!q('[data-sync-recover]',bar)});
    if(badge.dataset.displayState!==state)badge.dataset.displayState=state;
    if(bar.dataset.displayState!==state)bar.dataset.displayState=state;
    if(!q('.d2-sync-technical',bar)){
      const nodes=all('small',bar);if(nodes.length){const details=create('details','d2-sync-technical');details.open=technicalOpen;details.append(create('summary','','Detalhes técnicos e verificação'),...nodes);bar.append(details);details.ontoggle=()=>{technicalOpen=details.open}}
    }
  }
  function followup(){
    const data=q('#clientPanel-data .op-client-data'),general=q(':scope>.ux-client-section',data),contacts=q('#clientContactSettings',data);if(!general||!contacts)return;
    const identity=q(':scope>.ux-client-facts',data),cid=q('#clientDetail')?.dataset.clientId;
    if(identity&&!q(':scope>.d2-client-identity',data)){const details=create('details','d2-client-identity');details.open=!!identityOpen.get(cid);details.append(create('summary','','Identificação e informação complementar'));identity.before(details);details.append(identity);details.ontoggle=()=>identityOpen.set(cid,details.open)}
    general.classList.add('d2-followup');const heading=q(':scope>h3',general);if(heading)heading.textContent='Seguimento comercial';
    const settings=q('[data-contact-settings]',contacts);if(settings){settings.classList.add('d2-followup-settings');if(settings.parentElement!==general)general.append(settings)}
    const label=q('[name="contactState"]',settings)?.closest('.field');if(label)q('span',label).textContent='Resposta pendente';
    const labels={'Resposta nossa pendente':'Nossa resposta','A aguardar cliente':'Resposta do cliente','Em acompanhamento':'Nenhuma · em acompanhamento','Sem contacto':'Nenhuma · sem contacto registado'};
    all('[name="contactState"] option',settings).forEach(option=>{const value=option.value;option.value=value;option.textContent=labels[value]||value});
    const next=q('.ux-next-action',general),caption=q('span',next),edit=q('[data-ux-client-action="plan"]',next);
    if(caption)caption.textContent=caption.textContent.replace('Próxima ação definida','O que está pendente?');
    if(edit)edit.textContent='Editar pendência';
    const secondary=q('.ux-client-secondary-actions',general);
    if(secondary&&!q('.d2-followup-tools',general)){const tools=create('details','d2-followup-tools');tools.append(create('summary','','Histórico, observações e estado'),secondary);general.append(tools)}
    const facts=q('.ux-client-facts',contacts);if(facts&&!q('.d2-followup-facts',general)){facts.classList.add('d2-followup-facts');general.insertBefore(facts,next)}
    const wait=q('.d2-wait-metadata',data);if(wait&&wait.parentElement!==general)general.append(wait);
    const summary=q(':scope>summary',contacts);if(summary)summary.textContent='Interações e comunicações';
    const step=q('#clientNextStep');if(step&&q('#clientModal')?.dataset.clientMode==='plan'){const text=q('span',step.closest('.field'));if(text)text.textContent='O que está pendente?';const date=q('span',q('#clientNextFollowup')?.closest('.field'));if(date)date.textContent='Lembrete opcional'}
  }
  function searchWorkspace(){
    const profile=q('#clientPanel-procura .d2-client-match-profile'),manual=q('#clientFractionManual');if(!profile||!manual)return;
    if(!q('[data-d2-add-fractions]',profile)){const button=create('button','ghost-button compact-button','Adicionar frações');button.type='button';button.dataset.d2AddFractions='';button.onclick=()=>{manual.open=true;manual.scrollIntoView({block:'start'});q('#clientFractionSearch')?.focus({preventScroll:true})};profile.prepend(button)}
    const title=q('#clientFractionWorkspace>.crm-detail-section__heading h3');if(title)title.textContent='Recomendações e seleção';
    const edit=q('[data-preferences-edit]');if(edit&&edit.parentElement!==profile)profile.append(edit);
  }
  function opportunities(){
    const host=q('#clientDetail'),list=q('.opportunity-list'),cid=host?.dataset.clientId;if(!list||!cid)return;
    const names={'Em negociação':['active','Ativas · negociação'], 'Por apresentar':['prepared','Interesses e preparação'],Apresentada:['presented','Apresentadas'],Reservada:['results','Reservadas e vendidas'],Vendida:['results','Reservadas e vendidas'],Recusada:['refused','Recusadas'],'Não concretizada':['closed','Encerradas']};
    all('[data-opportunity-unit]',host).forEach(card=>{
      const state=q(':scope>summary>strong',card)?.textContent.trim(),[key,label]=names[state]||['review','Por rever'];
      let group=q(':scope>[data-d2-op-group="'+key+'"]',list);
      if(!group){group=create(['refused','closed'].includes(key)?'details':'section','d2-opportunity-group');group.dataset.d2OpGroup=key;group.append(create(group.tagName==='DETAILS'?'summary':'h4','',label));if(group.tagName==='DETAILS'){group.open=!!groupOpen.get(cid+':'+key);group.ontoggle=()=>groupOpen.set(cid+':'+key,group.open)}list.append(group)}
      const focused=card.contains(document.activeElement)?document.activeElement:null;
      if(card.open){
        if(!drawerAnchors.has(card)){if(card.parentElement!==group)group.append(card);const anchor=document.createComment('opportunity position');card.before(anchor);drawerAnchors.set(card,anchor)}
        if(card.parentElement!==host){host.append(card);focused?.focus({preventScroll:true})}
        if(group.tagName==='DETAILS')group.open=true;
      }else{
        const anchor=drawerAnchors.get(card);if(anchor?.isConnected){anchor.replaceWith(card);drawerAnchors.delete(card);focused?.focus({preventScroll:true})}
        if(card.parentElement!==group)group.append(card);
      }
      const content=q(':scope>.opportunity-card__content',card);
      if(content&&!q('[data-d2-close-opportunity]',content)){const close=create('button','ux-text-button d2-close-opportunity','Fechar detalhe');close.type='button';close.dataset.d2CloseOpportunity='';close.onclick=()=>{if(q('fieldset:disabled',card))return;card.open=false;q(':scope>summary',card)?.focus({preventScroll:true})};content.prepend(close)}
      const close=q('[data-d2-close-opportunity]',content);if(close)close.disabled=!!q('fieldset:disabled',card);
      card.classList.toggle('d2-opportunity-drawer',card.open);
      if(card.open){card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Oportunidade Apt. '+card.dataset.opportunityUnit)}else{card.removeAttribute('role');card.removeAttribute('aria-modal');card.removeAttribute('aria-label')}
    });
    const ordered=['active','prepared','presented','results','refused','closed','review'].map(key=>q(':scope>[data-d2-op-group="'+key+'"]',list)).filter(Boolean);
    ordered.forEach((group,index)=>{if(list.children[index]!==group)list.insertBefore(group,list.children[index]||null)});
  }
  document.addEventListener('click',event=>{
    const summary=event.target.closest?.('.d2-opportunity-drawer[open]>summary');
    if(summary&&q('fieldset:disabled',summary.parentElement)){event.preventDefault();event.stopImmediatePropagation()}
  },true);
  document.addEventListener('keydown',event=>{
    const card=q('.d2-opportunity-drawer[open]');if(!card||all('.modal-backdrop:not(.hidden)').some(modal=>modal.id!=='clientProfileDialog'&&getComputedStyle(modal).display!=='none'))return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(q('fieldset:disabled',card))return;card.open=false;q(':scope>summary',card)?.focus({preventScroll:true})}
    if(event.key==='Tab'){const items=all('summary,button,input,select,textarea,a[href]',card).filter(node=>!node.disabled&&node.getClientRects().length),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
  },true);
  let scheduled=false;
  const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(compose)}});
  function compose(){
    scheduled=false;observer.disconnect();
    try{agents();prices();proposals();history();events();reports();client();followup();searchWorkspace();opportunities();modals();comparator();synchronization()}
    finally{observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','disabled','data-phase','data-checking','data-local-edits','data-can-write']})}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',compose,{once:true});else compose();
})(typeof window==='undefined'?globalThis:window);
