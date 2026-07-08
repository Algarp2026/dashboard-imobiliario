"use strict";
(()=>{
const KEY='theView.crmCommercial.v2',LOCAL_REMOTE_BACKUP_KEY=KEY+'.backupBeforeRemoteLoad',CONFIG=window.THE_VIEW_CONFIG||{},REMOTE_URL=(CONFIG.GOOGLE_SHEETS_WEBAPP_URL||'').trim();
const PLANT_MAP={"1": {"image": "plantas/planta-apartamento-01.jpg", "pdf": "plantas/planta-apartamento-01.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_01.pdf"}, "2": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "10": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "17": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "24": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "31": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "3": {"image": "plantas/planta-apartamento-03.jpg", "pdf": "plantas/planta-apartamento-03.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_03.pdf"}, "4": {"image": "plantas/planta-apartamento-04.jpg", "pdf": "plantas/planta-apartamento-04.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_04.pdf"}, "5": {"image": "plantas/planta-apartamento-05.jpg", "pdf": "plantas/planta-apartamento-05.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_05.pdf"}, "6": {"image": "plantas/planta-apartamento-06.jpg", "pdf": "plantas/planta-apartamento-06.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_06.pdf"}, "7": {"image": "plantas/planta-apartamento-07-15.jpg", "pdf": "plantas/planta-apartamento-07-15.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf"}, "15": {"image": "plantas/planta-apartamento-07-15.jpg", "pdf": "plantas/planta-apartamento-07-15.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf"}, "8": {"image": "plantas/planta-apartamento-08.jpg", "pdf": "plantas/planta-apartamento-08.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_08.pdf"}, "9": {"image": "plantas/planta-apartamento-09-16.jpg", "pdf": "plantas/planta-apartamento-09-16.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf"}, "16": {"image": "plantas/planta-apartamento-09-16.jpg", "pdf": "plantas/planta-apartamento-09-16.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf"}, "11": {"image": "plantas/planta-apartamento-11.jpg", "pdf": "plantas/planta-apartamento-11.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_11.pdf"}, "12": {"image": "plantas/planta-apartamento-12.jpg", "pdf": "plantas/planta-apartamento-12.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_12.pdf"}, "13": {"image": "plantas/planta-apartamento-13.jpg", "pdf": "plantas/planta-apartamento-13.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_13.pdf"}, "14": {"image": "plantas/planta-apartamento-14.jpg", "pdf": "plantas/planta-apartamento-14.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_14.pdf"}, "18": {"image": "plantas/planta-apartamento-18.jpg", "pdf": "plantas/planta-apartamento-18.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_18.pdf"}, "19": {"image": "plantas/planta-apartamento-19.jpg", "pdf": "plantas/planta-apartamento-19.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_19.pdf"}, "20": {"image": "plantas/planta-apartamento-20.jpg", "pdf": "plantas/planta-apartamento-20.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_20.pdf"}, "21": {"image": "plantas/planta-apartamento-21.jpg", "pdf": "plantas/planta-apartamento-21.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_21.pdf"}, "22": {"image": "plantas/planta-apartamento-22.jpg", "pdf": "plantas/planta-apartamento-22.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_22.pdf"}, "23": {"image": "plantas/planta-apartamento-23-30.jpg", "pdf": "plantas/planta-apartamento-23-30.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf"}, "30": {"image": "plantas/planta-apartamento-23-30.jpg", "pdf": "plantas/planta-apartamento-23-30.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf"}, "25": {"image": "plantas/planta-apartamento-25.jpg", "pdf": "plantas/planta-apartamento-25.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_25.pdf"}, "26": {"image": "plantas/planta-apartamento-26.jpg", "pdf": "plantas/planta-apartamento-26.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_26.pdf"}, "27": {"image": "plantas/planta-apartamento-27.jpg", "pdf": "plantas/planta-apartamento-27.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_27.pdf"}, "28": {"image": "plantas/planta-apartamento-28.jpg", "pdf": "plantas/planta-apartamento-28.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_28.pdf"}, "29": {"image": "plantas/planta-apartamento-29.jpg", "pdf": "plantas/planta-apartamento-29.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_29.pdf"}, "32": {"image": "plantas/planta-apartamento-32.jpg", "pdf": "plantas/planta-apartamento-32.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_32.pdf"}, "33": {"image": "plantas/planta-apartamento-33.jpg", "pdf": "plantas/planta-apartamento-33.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_33.pdf"}, "34": {"image": "plantas/planta-apartamento-34.jpg", "pdf": "plantas/planta-apartamento-34.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_34.pdf"}, "35": {"image": "plantas/planta-apartamento-35.jpg", "pdf": "plantas/planta-apartamento-35.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_35.pdf"}, "36": {"image": "plantas/planta-apartamento-36.jpg", "pdf": "plantas/planta-apartamento-36.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_36.pdf"}, "37": {"image": "plantas/planta-apartamento-37.jpg", "pdf": "plantas/planta-apartamento-37.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_37.pdf"}, "38": {"image": "plantas/planta-apartamento-38.jpg", "pdf": "plantas/planta-apartamento-38.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_38.pdf"}, "39": {"image": "plantas/planta-apartamento-39.jpg", "pdf": "plantas/planta-apartamento-39.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_39.pdf"}};
const ORIENT={1:'Sul/Este',2:'Sul/Oeste',3:'Oeste',4:'Oeste',5:'Oeste',6:'Este/Oeste',7:'Este',8:'Este',9:'Sul/Este',10:'Sul/Oeste',11:'Oeste',12:'Oeste',13:'Oeste',14:'Este/Oeste',15:'Este',16:'Sul/Este',17:'Sul/Oeste',18:'Oeste',19:'Oeste',20:'Oeste',21:'Este/Oeste',22:'Este',23:'Sul/Este',24:'Sul/Oeste',25:'Oeste',26:'Este/Oeste',27:'Oeste',28:'Este/Oeste',29:'Este',30:'Sul/Este',31:'Sul/Oeste',32:'Oeste',33:'Este/Oeste',34:'Este/Oeste',35:'Este/Oeste',36:'Sul/Este',37:'Sul/Oeste',38:'Oeste',39:'Este/Oeste'};
const SUG={1:545000,2:600000,3:390000,4:475000,5:450000,6:615000,7:535000,8:390000,9:800000,10:620000,11:400000,12:440000,13:420000,14:600000,15:580000,16:900000,17:640000,18:425000,19:360000,20:410000,21:560000,22:600000,23:850000,24:700000,25:440000,26:630000,27:440000,28:500000,29:485000,30:950000,31:720000,32:455000,33:570000,34:645000,35:555000,36:1450000,37:1000000,38:470000,39:1000000};
const UPDATED_INITIAL_PRICES={1:545000,2:600000,3:390000,4:475000,5:450000,6:615000,7:535000,8:390000,9:800000,10:620000,11:400000,12:440000,13:420000,14:600000,15:580000,16:900000,17:640000,18:425000,19:360000,20:410000,21:560000,22:600000,23:850000,24:700000,25:440000,26:630000,27:440000,28:500000,29:485000,30:950000,31:720000,32:455000,33:570000,34:645000,35:555000,36:1450000,37:1000000,38:470000,39:1000000};
const STATUS=['Disponível','Reservado','Vendido','Indisponível'];
const STAGES=['Novo Lead','Qualificado','Apresentado','Em negociação','Reservado','Vendido','Desistiu'];
const EVENT_TYPES=['Pedido de informação recebido','Preferências recebidas','Frações apresentadas','Preços informados','Contra-proposta recebida','Contra-proposta enviada','Reserva efetuada','Reserva cancelada','Venda concluída','Desistência','Outro'];
const CLIENT_ORIGINS=['Website The View','Outdoor / Mupie','Agente','Amigo / Familiar','Outro'];
const CRM_MIGRATION_KEY='crm-funnel-2026-06-v4';
const MAX_COMPARE_FRACTIONS=4;
const state={rows:[],fractions:[],tab:'sales',selected:new Set(),selectedClientId:'',pf:{search:'',typology:'all',floor:'all',status:'all'},rf:{search:'',typology:'all',floor:'all',status:'all'},cf:{search:'',stage:'all'},salesSubtab:'clients',selectedAgentId:'',pendingEventClientCreation:false,pendingClientAgentCreation:false,data:loadDataLocal()};
const el={};
const RenderFlow={
  all(){renderProposals();renderDashboard();renderPrices();renderHistory();renderCompare();renderClientSelects();renderClients();renderClientDetail();renderSales();ensureAgentsPanel();renderAgents();ensureSalesManagementTabs();},
  priceChanged(){renderProposals();renderDashboard();renderPrices();renderHistory();renderCompare();renderSales();renderSalesEventsPanel();},
  clientChanged(){renderClientSelects();renderClients();renderClientDetail();renderSalesEventsPanel();renderMaintenanceModalLists();},
  agentChanged(){populateAgentSelect();populateClientAgentSelect(el.clientAgent?.value||'');renderAgents();renderSales();renderSalesEventsPanel();renderMaintenanceModalLists();},
  eventChanged(){renderProposals();renderDashboard();renderPrices();renderCompare();renderClientSelects();renderClients();renderClientDetail();renderSales();ensureAgentsPanel();renderAgents();renderSalesEventsPanel();renderMaintenanceModalLists();},
  salesChanged(){renderProposals();renderDashboard();renderPrices();renderCompare();renderSales();renderSalesEventsPanel();renderMaintenanceModalLists();}
};
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}
function init(){ensureCrmFormFields();['dataStatus','globalErrorBox','proposalIncludePlants','proposalSearch','proposalTypology','proposalFloor','proposalStatus','proposalSelectedInfo','proposalGrid','dashboardKpis','priceSearch','priceTypology','priceFloor','priceStatus','pricesTableBody','historyFractionSelect','priceHistoryChart','historyList','compareA','compareB','compareFractions','compareNotice','compareResult','clientSearch','clientStageFilter','selectedClient','clientsList','clientDetail','salesTableBody','clientModal','closeClientModal','clientId','clientName','clientPhone','clientEmail','clientNif','clientNationality','clientOrigin','clientOriginManual','clientAgent','clientAgency','clientBudget','clientStage','clientNextStep','clientNextFollowup','clientFractions','clientNotes','clientTypologyPreference','clientFloorPreference','clientOrientationPreference','clientPurchaseObjective','clientDecisionTime','clientPreferenceSummary','eventModal','closeEventModal','eventClientId','eventType','eventDate','eventTime','eventAmount','eventInterest','eventFollowup','eventFollowupDate','eventFractions','eventObjections','eventNotes','eventChannel','eventPreferenceFields','eventPreferenceTypology','eventPreferenceBudget','eventPreferenceFloor','eventPreferenceOrientation','eventPreferenceObjective','eventPreferenceDecisionTime','eventPreferenceSummary','eventPriceFields','eventPriceRows','eventPriceNotice'].forEach(id=>el[id]=document.getElementById(id));bind();loadExcel();}
function bind(){
  ensurePriceListButton();
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  const proposalsShortcut=document.getElementById('openProposalsArea');
  if(proposalsShortcut)proposalsShortcut.onclick=()=>switchTab('proposals');
  document.getElementById('selectProposalVisible').onclick=()=>{filteredProposal().filter(f=>statusOf(f)==='Disponível').forEach(f=>state.selected.add(f.number));renderProposals()};
  document.getElementById('clearProposalSelected').onclick=()=>{state.selected.clear();renderProposals()};
  document.getElementById('exportClientPdf').onclick=exportPdf;
  document.getElementById('exportAllData').onclick=exportAll;
  document.getElementById('resetLocalData').onclick=resetLocal;
  document.getElementById('exportPriceHistory').onclick=exportPriceHistory;
  ['proposalSearch','proposalTypology','proposalFloor','proposalStatus'].forEach(id=>{el[id].oninput=syncProposal;el[id].onchange=syncProposal});
  ['priceSearch','priceTypology','priceFloor','priceStatus'].forEach(id=>{el[id].oninput=syncPrice;el[id].onchange=syncPrice});
  el.historyFractionSelect.onchange=renderHistory;
  if(el.compareFractions)el.compareFractions.onchange=handleCompareSelection;
  if(el.compareA)el.compareA.onchange=renderCompare;
  if(el.compareB)el.compareB.onchange=renderCompare;
  document.getElementById('openClientModal').onclick=()=>openClientModal('');
  document.getElementById('closeClientModal').onclick=closeClientModal;
  document.getElementById('cancelClient').onclick=closeClientModal;
  document.getElementById('saveClient').onclick=saveClient;
  document.getElementById('openEventModalBtn').onclick=()=>openEventModal();
  document.getElementById('closeEventModal').onclick=closeEventModal;
  document.getElementById('cancelEvent').onclick=closeEventModal;
  document.getElementById('saveEvent').onclick=saveEvent;
  el.clientSearch.oninput=()=>{state.cf.search=el.clientSearch.value;renderClients()};
  el.clientStageFilter.onchange=()=>{state.cf.stage=el.clientStageFilter.value;renderClients()};
  el.selectedClient.onchange=()=>{state.selectedClientId=el.selectedClient.value;renderClients();renderClientDetail()};
  el.clientModal.onclick=e=>{if(e.target===el.clientModal)e.stopPropagation()};
  el.eventModal.onclick=e=>{if(e.target===el.eventModal)e.stopPropagation()};
}
function ensureCrmFormFields(){
  const clientStage=document.getElementById('clientStage');
  if(clientStage)clientStage.innerHTML=STAGES.map(stage=>`<option>${esc(stage)}</option>`).join('');
  const clientOrigin=document.getElementById('clientOrigin');
  if(clientOrigin){
    clientOrigin.innerHTML=CLIENT_ORIGINS.map(origin=>`<option>${esc(origin)}</option>`).join('');
    if(!document.getElementById('clientOriginManual')){
      const manualOrigin=document.createElement('label');
      manualOrigin.className='field hidden';
      manualOrigin.innerHTML='<span>Origem manual</span><input id="clientOriginManual" placeholder="Ex.: Indicação de antigo cliente">';
      clientOrigin.closest('.field').after(manualOrigin);
    }
    clientOrigin.onchange=toggleClientOriginManual;
  }
  const clientBaseGrid=clientStage?.closest('.form-grid');
  if(clientBaseGrid&&!document.getElementById('clientNextStep')){
    const nextStep=document.createElement('label');
    nextStep.className='field';
    nextStep.innerHTML='<span>Próximo passo</span><input id="clientNextStep" placeholder="Ex.: Telefonar para confirmar interesse">';
    const nextFollowup=document.createElement('label');
    nextFollowup.className='field';
    nextFollowup.innerHTML='<span>Próximo follow-up</span><input id="clientNextFollowup" type="date">';
    clientStage.closest('.field').after(nextStep,nextFollowup);
  }

  const clientFractions=document.getElementById('clientFractions');
  const clientFractionsField=clientFractions?.closest('.field');
  if(clientFractionsField&&!document.getElementById('clientPreferenceFields')){
    const section=document.createElement('section');
    section.id='clientPreferenceFields';
    section.className='crm-form-section';
    section.innerHTML=`<div class="crm-form-section__heading"><h3>Preferências estruturadas</h3><p class="muted small">Dados comerciais resumidos, independentes das notas livres.</p></div>
      <div class="form-grid">
        <label class="field"><span>Tipologia pretendida</span><input id="clientTypologyPreference" placeholder="Ex.: T2 ou T2+1"></label>
        <label class="field"><span>Piso preferido</span><input id="clientFloorPreference" placeholder="Ex.: Piso 2 ou pisos altos"></label>
        <label class="field"><span>Orientação</span><input id="clientOrientationPreference" placeholder="Ex.: Sul/Oeste"></label>
        <label class="field"><span>Objetivo da compra</span><select id="clientPurchaseObjective"><option value=""></option><option>Habitação própria</option><option>Segunda habitação</option><option>Investimento</option><option>Outro</option></select></label>
        <label class="field"><span>Prazo de decisão</span><input id="clientDecisionTime" placeholder="Ex.: 30 dias"></label>
        <label class="field"><span>Observações resumidas</span><input id="clientPreferenceSummary" placeholder="Preferências essenciais"></label>
      </div>`;
    clientFractionsField.parentElement.insertBefore(section,clientFractionsField);
  }

  const eventType=document.getElementById('eventType');
  if(eventType)eventType.innerHTML=EVENT_TYPES.map(type=>`<option>${esc(type)}</option>`).join('');
  const eventTime=document.getElementById('eventTime');
  const eventGrid=eventTime?.closest('.form-grid');
  if(eventGrid&&!document.getElementById('eventChannel')){
    const channel=document.createElement('label');
    channel.className='field';
    channel.innerHTML='<span>Canal</span><select id="eventChannel"><option value=""></option><option>Reunião</option><option>Telefone</option><option>WhatsApp</option><option>Email</option><option>Presencial</option><option>PDF</option><option>Outro</option></select>';
    eventTime.closest('.field').after(channel);
  }
  const eventFollowup=document.getElementById('eventFollowup');
  if(eventFollowup&&eventFollowup.tagName==='SELECT'){
    const input=document.createElement('input');
    input.id='eventFollowup';
    input.placeholder='Ex.: Enviar proposta revista';
    eventFollowup.replaceWith(input);
  }
  const eventFollowupField=document.getElementById('eventFollowup')?.closest('.field');
  const eventFollowupDateField=document.getElementById('eventFollowupDate')?.closest('.field');
  if(eventFollowupField?.querySelector('span'))eventFollowupField.querySelector('span').textContent='Próximo passo sugerido';
  if(eventFollowupDateField?.querySelector('span'))eventFollowupDateField.querySelector('span').textContent='Próximo follow-up';
  const eventFractions=document.getElementById('eventFractions');
  const eventFractionsField=eventFractions?.closest('.field');
  if(eventFractionsField&&!document.getElementById('eventPreferenceFields')){
    const preferences=document.createElement('section');
    preferences.id='eventPreferenceFields';
    preferences.className='crm-form-section hidden';
    preferences.innerHTML=`<div class="crm-form-section__heading"><h3>Preferências recebidas</h3><p class="muted small">Estes dados atualizam o resumo estruturado do cliente.</p></div>
      <div class="form-grid">
        <label class="field"><span>Tipologia pretendida</span><input id="eventPreferenceTypology"></label>
        <label class="field"><span>Orçamento</span><input id="eventPreferenceBudget" type="number" min="0" step="1000"></label>
        <label class="field"><span>Piso preferido</span><input id="eventPreferenceFloor"></label>
        <label class="field"><span>Orientação</span><input id="eventPreferenceOrientation"></label>
        <label class="field"><span>Objetivo da compra</span><input id="eventPreferenceObjective"></label>
        <label class="field"><span>Prazo de decisão</span><input id="eventPreferenceDecisionTime"></label>
      </div>
      <label class="field"><span>Observações resumidas</span><textarea id="eventPreferenceSummary"></textarea></label>`;
    eventFractionsField.parentElement.insertBefore(preferences,eventFractionsField);

    const prices=document.createElement('section');
    prices.id='eventPriceFields';
    prices.className='crm-form-section hidden';
    prices.innerHTML=`<div class="crm-form-section__heading"><h3>Preços comunicados por fração</h3><p class="muted small">O preço oficial fica guardado como fotografia da data e não é alterado.</p></div><div id="eventPriceNotice"></div><div id="eventPriceRows" class="event-price-rows"></div>`;
    eventFractionsField.after(prices);
  }
  if(eventFractionsField&&!document.getElementById('clearEventFractions')){
    const actions=document.createElement('div');
    actions.className='event-fraction-actions';
    actions.innerHTML='<button class="ghost-button" id="clearEventFractions" type="button">Limpar frações</button><div id="eventSelectedFractionChips" class="event-selected-fraction-chips"></div>';
    eventFractionsField.after(actions);
    actions.querySelector('#clearEventFractions').onclick=()=>{
      [...eventFractions.options].forEach(option=>{option.selected=false});
      eventFractions.dispatchEvent(new Event('change'));
    };
  }
}
function renderEventSelectedFractionChips(){
  const box=document.getElementById('eventSelectedFractionChips');
  const clear=document.getElementById('clearEventFractions');
  if(!box||!el.eventFractions)return;
  const selected=getMulti(el.eventFractions).map(Number);
  if(clear)clear.disabled=!selected.length;
  box.innerHTML=selected.map(n=>`<button class="event-fraction-chip" type="button" data-remove-event-fraction="${n}" aria-label="Remover ${attr(getF(n)?.name||'fração '+n)}">${esc(getF(n)?.name||'Apt. '+n)} <span aria-hidden="true">×</span></button>`).join('');
  box.querySelectorAll('[data-remove-event-fraction]').forEach(button=>button.onclick=()=>{
    const option=[...el.eventFractions.options].find(item=>Number(item.value)===Number(button.dataset.removeEventFraction));
    if(option)option.selected=false;
    el.eventFractions.dispatchEvent(new Event('change'));
  });
}
function clientOriginDisplayValue(value){return norm(value)==='portal imobiliario'?'Website The View':safe(value)}
function populateClientOriginSelect(value=''){
  const select=el.clientOrigin||document.getElementById('clientOrigin');if(!select)return;
  const selected=clientOriginDisplayValue(value)||'Website The View';
  select.innerHTML=CLIENT_ORIGINS.map(origin=>`<option value="${attr(origin)}">${esc(origin)}</option>`).join('');
  if(!CLIENT_ORIGINS.includes(selected))select.add(new Option(`${selected} (registo anterior)`,selected));
  select.value=selected;
}
function toggleClientOriginManual(){
  const select=el.clientOrigin||document.getElementById('clientOrigin'),input=el.clientOriginManual||document.getElementById('clientOriginManual');
  input?.closest('.field')?.classList.toggle('hidden',select?.value!=='Outro');
}
function clientOriginLabel(c){
  const origin=clientOriginDisplayValue(c?.origin)||'—',manual=safe(c?.originManual);
  return origin==='Outro'&&manual?`Outro — ${manual}`:origin;
}
function ensurePriceListButton(){
  if(document.getElementById('printPriceListBtn')) return;
  const exportBtn=document.getElementById('exportAllData');
  if(!exportBtn||!exportBtn.parentElement) return;
  const btn=document.createElement('button');
  btn.className='ghost-button';
  btn.id='printPriceListBtn';
  btn.type='button';
  btn.textContent='Imprimir Lista de Preços';
  btn.onclick=openPriceListModal;
  exportBtn.parentElement.insertBefore(btn, exportBtn);
}
function openPriceListModal(){
  if(!state.fractions.length){notifyUser('Aguarde o carregamento das frações antes de gerar a lista de preços.','Lista de Preços');return}
  const existing=document.getElementById('priceListModal');
  if(existing) existing.remove();

  const statusOptions=[
    ['Disponível','Disponíveis',true],
    ['Reservado','Reservadas',true],
    ['Indisponível','Indisponíveis',false],
    ['Vendido','Vendidas',false]
  ];
  const columnOptions=[
    ['fraction','Fração',true,true],
    ['floor','Piso',true,false],
    ['typology','Tipologia',true,false],
    ['price','Preço',true,false],
    ['status','Estado comercial',false,false],
    ['orientation','Orientação',false,false],
    ['abp','ABP',false,false],
    ['terrace','Varanda/Terraço',false,false],
    ['total','Área total',false,false],
    ['pricePerSqm','Preço/m²',false,false]
  ];

  const modal=document.createElement('div');
  modal.id='priceListModal';
  modal.className='modal-backdrop';
  modal.innerHTML=`
    <div class="modal price-list-modal">
      <button class="modal-close" type="button" data-close-price-list-modal>×</button>
      <p class="eyebrow eyebrow--dark">Documento interno</p>
      <h2>Imprimir Lista de Preços</h2>
      <p class="muted">Gera uma lista interna para consulta comercial. Não altera CRM, preços finais, histórico nem Google Sheets.</p>

      <label class="field price-list-language-field">
        <span>Idioma</span>
        <select id="priceListLanguage">
          <option value="pt-en" selected>PT/ENG</option>
          <option value="pt-fr">PT/FR</option>
        </select>
      </label>

      <div class="price-list-options">
        <section>
          <h3>Estados comerciais</h3>
          <div class="price-list-check-grid">
            ${statusOptions.map(([value,label,checked])=>`
              <label class="check-option">
                <input type="checkbox" value="${attr(value)}" data-price-list-status ${checked?'checked':''}>
                <span>${esc(label)}</span>
              </label>
            `).join('')}
          </div>
        </section>

        <section>
          <h3>Colunas a mostrar</h3>
          <div class="price-list-check-grid">
            ${columnOptions.map(([value,label,checked,required])=>`
              <label class="check-option">
                <input type="checkbox" value="${attr(value)}" data-price-list-column ${checked?'checked':''} ${required?'disabled':''}>
                <span>${esc(label)}${required?' <small>obrigatória</small>':''}</span>
              </label>
            `).join('')}
          </div>
        </section>
      </div>

      <section class="price-list-fractions-panel">
        <div class="price-list-fractions-head">
          <div>
            <h3>Frações a incluir</h3>
            <p class="muted small">Por defeito, todas as frações elegíveis estão selecionadas.</p>
          </div>
          <strong data-price-list-selected-count>0 frações selecionadas</strong>
        </div>
        <input id="priceListFractionSearch" class="price-list-search" type="search" placeholder="Pesquisar fração, piso ou tipologia…" autocomplete="off">
        <div class="price-list-quick-actions" data-price-list-quick-actions></div>
        <div class="price-list-fraction-chips" data-price-list-fraction-chips></div>
      </section>

      <div class="modal-actions">
        <button class="ghost-button" type="button" data-close-price-list-modal>Cancelar</button>
        <button class="primary-button" type="button" data-generate-price-list-pdf>Gerar PDF</button>
      </div>
    </div>
  `;

  const style=document.createElement('style');
  style.textContent=`
    #priceListModal .price-list-modal{width:min(920px,100%);}
    #priceListModal .price-list-language-field{max-width:220px;margin-top:16px;}
    #priceListModal .price-list-options{display:grid;grid-template-columns:1fr 1.35fr;gap:18px;margin-top:18px;}
    #priceListModal .price-list-options section{border:1px solid #dfe7f0;border-radius:12px;padding:14px;background:#f8fafc;}
    #priceListModal .price-list-options h3{margin:0 0 12px;color:#0e2444;font-size:15px;}
    #priceListModal .price-list-check-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px;}
    #priceListModal .check-option{display:flex;align-items:center;gap:8px;color:#213652;font-size:14px;}
    #priceListModal .check-option input{width:16px;height:16px;}
    #priceListModal .check-option small{display:block;color:#6f7f92;font-size:11px;}
    #priceListModal .price-list-fractions-panel{border:1px solid #dfe7f0;border-radius:12px;padding:14px;background:#fff;margin-top:18px;}
    #priceListModal .price-list-fractions-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;}
    #priceListModal .price-list-fractions-head h3{margin:0 0 4px;color:#0e2444;font-size:15px;}
    #priceListModal .price-list-fractions-head strong{white-space:nowrap;color:#0e2444;font-size:14px;background:#f1f5f9;border:1px solid #dfe7f0;border-radius:999px;padding:8px 12px;}
    #priceListModal .price-list-search{width:100%;margin-top:12px;border:1px solid #cfd9e6;border-radius:10px;padding:10px 12px;font:inherit;color:#0e2444;background:#fff;}
    #priceListModal .price-list-quick-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
    #priceListModal .price-list-action-chip{border:1px solid #cfd9e6;background:#f8fafc;color:#213652;border-radius:999px;padding:7px 11px;font:inherit;font-size:13px;cursor:pointer;}
    #priceListModal .price-list-action-chip:hover:not(:disabled){border-color:#9a7440;color:#0e2444;background:#fff;}
    #priceListModal .price-list-action-chip:disabled{opacity:.45;cursor:not-allowed;}
    #priceListModal .price-list-fraction-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:8px;margin-top:12px;max-height:220px;overflow:auto;padding-right:2px;}
    #priceListModal .price-list-fraction-chip{border:1px solid #d6e0eb;background:#f8fafc;color:#213652;border-radius:10px;padding:8px 9px;text-align:left;cursor:pointer;min-height:52px;}
    #priceListModal .price-list-fraction-chip strong{display:block;color:#0e2444;font-size:13px;line-height:1.15;}
    #priceListModal .price-list-fraction-chip span{display:block;color:#6f7f92;font-size:11px;line-height:1.25;margin-top:3px;}
    #priceListModal .price-list-fraction-chip.is-selected{background:#0e2444;border-color:#0e2444;box-shadow:0 8px 20px rgba(14,36,68,.14);}
    #priceListModal .price-list-fraction-chip.is-selected strong,#priceListModal .price-list-fraction-chip.is-selected span{color:#fff;}
    #priceListModal .price-list-empty{grid-column:1/-1;color:#6f7f92;background:#f8fafc;border:1px dashed #cfd9e6;border-radius:10px;padding:12px;text-align:center;}
    @media (max-width:720px){#priceListModal .price-list-options{grid-template-columns:1fr}#priceListModal .price-list-check-grid{grid-template-columns:1fr}#priceListModal .price-list-fractions-head{display:block}#priceListModal .price-list-fractions-head strong{display:inline-block;margin-top:8px}#priceListModal .price-list-fraction-chips{grid-template-columns:repeat(2,minmax(0,1fr));}}
  `;
  modal.appendChild(style);
  document.body.appendChild(modal);
  document.body.style.overflow='hidden';

  let selectedStatuses=new Set(statusOptions.filter(([, ,checked])=>checked).map(([value])=>value));
  let selectedFractions=new Set();
  let manualFractionSelection=false;
  const statusInputs=[...modal.querySelectorAll('[data-price-list-status]')];
  const fractionSearch=modal.querySelector('#priceListFractionSearch');
  const fractionCount=modal.querySelector('[data-price-list-selected-count]');
  const quickActions=modal.querySelector('[data-price-list-quick-actions]');
  const fractionChips=modal.querySelector('[data-price-list-fraction-chips]');
  const eligibleFractions=()=>state.fractions.filter(f=>selectedStatuses.has(statusOf(f))).sort((a,b)=>a.number-b.number);
  const eligibleNumberSet=()=>new Set(eligibleFractions().map(f=>f.number));
  const selectedEligibleFractions=()=>eligibleFractions().filter(f=>selectedFractions.has(f.number));
  const syncSelectedStatuses=()=>{selectedStatuses=new Set(statusInputs.filter(input=>input.checked).map(input=>input.value))};
  const syncSelectionWithEligibility=()=>{
    const eligible=eligibleNumberSet();
    selectedFractions=manualFractionSelection?new Set([...selectedFractions].filter(n=>eligible.has(n))):eligible;
  };
  const selectMatchingFractions=match=>{
    manualFractionSelection=true;
    selectedFractions=new Set(eligibleFractions().filter(match).map(f=>f.number));
    renderFractionSelector();
  };
  const quickActionDefinitions=()=>{
    const defs=[
      {id:'all',label:'Todas'},
      {id:'clear',label:'Limpar'},
      {id:'status-available',label:'Disponíveis',match:f=>statusOf(f)==='Disponível'},
      {id:'status-reserved',label:'Reservadas',match:f=>statusOf(f)==='Reservado'}
    ];
    ['T1','T1+1','T2','T2+1','T3'].forEach(t=>{
      if(state.fractions.some(f=>f.typology===t)) defs.push({id:`typology-${t}`,label:t,match:f=>f.typology===t});
    });
    if(state.fractions.some(f=>norm(f.typology).includes('duplex'))) defs.push({id:'typology-duplex',label:'Duplex',match:f=>norm(f.typology).includes('duplex')});
    uniq(state.fractions.map(f=>String(f.floorLabel))).forEach(fl=>{
      defs.push({id:`floor-${fl}`,label:`Piso ${fl}`,match:f=>String(f.floorLabel)===fl});
    });
    return defs;
  };
  const renderQuickActions=()=>{
    const eligible=eligibleFractions();
    const selectedCount=selectedEligibleFractions().length;
    quickActions.innerHTML=quickActionDefinitions().map(def=>{
      const count=def.id==='all'?eligible.length:def.id==='clear'?selectedCount:eligible.filter(def.match).length;
      return `<button class="price-list-action-chip" type="button" data-price-list-action="${attr(def.id)}" ${count?'':'disabled'}>${esc(def.label)}</button>`;
    }).join('');
  };
  const renderFractionChips=()=>{
    const q=norm(fractionSearch.value);
    const visible=eligibleFractions().filter(f=>!q||norm([f.name,priceListFractionChipLabel(f),f.typology,f.floorLabel,f.orientation,statusOf(f)].join(' ')).includes(q));
    fractionCount.textContent=priceListSelectionLabel(selectedEligibleFractions().length);
    fractionChips.innerHTML=visible.length?visible.map(f=>`
      <button class="price-list-fraction-chip ${selectedFractions.has(f.number)?'is-selected':''}" type="button" data-price-list-fraction="${f.number}">
        <strong>${esc(priceListFractionChipLabel(f))}</strong>
        <span>${esc(f.typology)} · Piso ${esc(f.floorLabel)}</span>
      </button>
    `).join(''):'<div class="price-list-empty">Sem frações elegíveis para a pesquisa atual.</div>';
  };
  function renderFractionSelector(){renderQuickActions();renderFractionChips()}
  syncSelectionWithEligibility();
  renderFractionSelector();

  const close=()=>{
    modal.remove();
    document.body.style.overflow='';
  };

  modal.querySelectorAll('[data-close-price-list-modal]').forEach(btn=>btn.addEventListener('click',close));
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  statusInputs.forEach(input=>input.addEventListener('change',()=>{
    syncSelectedStatuses();
    syncSelectionWithEligibility();
    renderFractionSelector();
  }));
  fractionSearch.addEventListener('input',renderFractionChips);
  quickActions.addEventListener('click',e=>{
    const btn=e.target.closest('[data-price-list-action]');
    if(!btn||btn.disabled) return;
    const action=btn.dataset.priceListAction;
    if(action==='all'){
      manualFractionSelection=false;
      selectedFractions=eligibleNumberSet();
      renderFractionSelector();
      return;
    }
    if(action==='clear'){
      manualFractionSelection=true;
      selectedFractions.clear();
      renderFractionSelector();
      return;
    }
    const def=quickActionDefinitions().find(item=>item.id===action);
    if(def) selectMatchingFractions(def.match);
  });
  fractionChips.addEventListener('click',e=>{
    const btn=e.target.closest('[data-price-list-fraction]');
    if(!btn) return;
    const n=Number(btn.dataset.priceListFraction);
    manualFractionSelection=true;
    selectedFractions.has(n)?selectedFractions.delete(n):selectedFractions.add(n);
    renderFractionSelector();
  });
  modal.querySelector('[data-generate-price-list-pdf]').addEventListener('click',()=>{
    const statuses=[...modal.querySelectorAll('[data-price-list-status]:checked')].map(input=>input.value);
    const columns=[...modal.querySelectorAll('[data-price-list-column]:checked')].map(input=>input.value);
    const eligible=eligibleNumberSet();
    const fractions=[...selectedFractions].filter(n=>eligible.has(n)).sort((a,b)=>a-b);
    if(!columns.includes('fraction')) columns.unshift('fraction');
    if(!fractions.length){notifyUser('Selecione pelo menos uma fração para gerar a lista de preços.','Lista de Preços');return}
    close();
    generatePriceListPdf({
      language:modal.querySelector('#priceListLanguage')?.value||'pt-en',
      statuses,
      columns,
      fractions
    });
  });
}
function generatePriceListPdf(options={}){
  const language=options.language||'pt-en';
  const selectedStatuses=new Set(options.statuses||[]);
  const hasSpecificFractions=Array.isArray(options.fractions);
  const selectedFractions=new Set((options.fractions||[]).map(Number));
  const columns=(options.columns||['fraction','floor','typology','price']).filter(Boolean);
  const rows=state.fractions.filter(f=>selectedStatuses.has(statusOf(f))&&(!hasSpecificFractions||selectedFractions.has(f.number))).sort((a,b)=>a.number-b.number);
  if(!rows.length){notifyUser('Não existem frações para os filtros escolhidos.','Lista de Preços');return}

  const copy=priceListCopy(language);
  const definitions=priceListColumnDefinitions(copy).filter(col=>columns.includes(col.key));
  const w=window.open('','_blank');
  if(!w){notifyUser('Autorize pop-ups para gerar o PDF.','Lista de Preços');return}

  const tableRows=rows.map(f=>`<tr>${definitions.map(col=>`<td class="${col.numeric?'num-col':''}">${priceListCellValue(f,col.key,copy)}</td>`).join('')}</tr>`).join('');
  const tableHead=definitions.map(col=>`<th class="${col.numeric?'num-col':''}">${esc(col.label)}</th>`).join('');
  const generatedAt=new Date().toLocaleString('pt-PT');

  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>The View · Lista de Preços</title>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap');
  @page{size:A4 portrait;margin:8mm}
  *{box-sizing:border-box}
  body{font-family:'Montserrat',Arial,sans-serif;margin:0;color:#0f2443;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .price-list-page{min-height:calc(297mm - 16mm);display:flex;flex-direction:column}
  .doc-header{display:flex;justify-content:space-between;gap:12mm;align-items:flex-start;border-bottom:1px solid #d9e1eb;padding-bottom:5mm;margin-bottom:5mm}
  .eyebrow{margin:0 0 3mm;text-transform:uppercase;letter-spacing:.24em;font-size:8px;font-weight:700;color:#9a7440}
  h1{font-family:'Cormorant Garamond','Times New Roman',serif;margin:0;color:#0e2444;font-size:27pt;line-height:1;font-weight:700}
  h2{margin:2mm 0 0;color:#435675;font-size:12pt;font-weight:600}
  .meta{margin:0;color:#62738a;font-size:8pt;text-align:right;line-height:1.45}
  table{width:100%;border-collapse:collapse;font-size:8.2pt}
  thead{display:table-header-group}
  tr{break-inside:avoid;page-break-inside:avoid}
  th,td{border-bottom:1px solid #dfe7f0;padding:2.3mm 2.1mm;text-align:left;vertical-align:top}
  th{background:#f1f5f9;color:#0e2444;font-size:7.2pt;text-transform:uppercase;letter-spacing:.04em}
  tbody tr:nth-child(even){background:#fafbfd}
  .num-col{text-align:right;white-space:nowrap}
  .footer{margin-top:auto;border-top:1px solid #d9e1eb;padding-top:3mm;color:#62738a;font-size:7.3pt;line-height:1.35}
  @media print{body{background:#fff}}
  </style></head><body>
    <main class="price-list-page">
      <header class="doc-header">
        <div>
          <p class="eyebrow">The View Olhão</p>
          <h1>The View Olhão</h1>
          <h2>${esc(copy.title)}</h2>
        </div>
        <p class="meta">Documento interno<br>${esc(generatedAt)}</p>
      </header>
      <table>
        <thead><tr>${tableHead}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <footer class="footer">${esc(copy.footer).replace(/\n/g,'<br>')}</footer>
    </main>
    <script>setTimeout(()=>{window.focus();window.print()},250)</script>
  </body></html>`);
  w.document.close();
}
function priceListCopy(language){
  const copies={
    'pt-fr':{
      title:'Lista de Preços / Liste de Prix',
      footer:'Documento interno de consulta comercial. Preços, áreas e disponibilidade sujeitos a confirmação.\nDocument interne de consultation commerciale. Prix, surfaces et disponibilité soumis à confirmation.',
      labels:{
        fraction:'Fração / Unité',
        floor:'Piso / Étage',
        typology:'Tipologia / Type de bien',
        price:'Preço / Prix',
        status:'Estado / Statut',
        orientation:'Orientação / Orientation',
        abp:'ABP aprox. / Surface brute privative approximative',
        terrace:'Varanda/Terraço aprox. / Surface balcon/terrasse approximative',
        total:'Área total aprox. / Surface totale approximative',
        pricePerSqm:'Preço/m² / Prix/m²'
      },
      statuses:{
        'Disponível':'Disponível / Disponible',
        'Reservado':'Reservado / Réservé',
        'Indisponível':'Indisponível / Indisponible',
        'Vendido':'Vendido / Vendu'
      }
    },
    'pt-en':{
      title:'Lista de Preços / Price List',
      footer:'Documento interno de consulta comercial. Preços, áreas e disponibilidade sujeitos a confirmação.\nInternal commercial reference document. Prices, areas and availability are subject to confirmation.',
      labels:{
        fraction:'Fração / Unit',
        floor:'Piso / Floor',
        typology:'Tipologia / Unit Type',
        price:'Preço / Price',
        status:'Estado / Status',
        orientation:'Orientação / Orientation',
        abp:'ABP aprox. / Approx. Gross Private Area',
        terrace:'Varanda/Terraço aprox. / Approx. Balcony/Terrace Area',
        total:'Área total aprox. / Approx. Total Area',
        pricePerSqm:'Preço/m² / Price/sqm'
      },
      statuses:{
        'Disponível':'Disponível / Available',
        'Reservado':'Reservado / Reserved',
        'Indisponível':'Indisponível / Unavailable',
        'Vendido':'Vendido / Sold'
      }
    }
  };
  return copies[language]||copies['pt-en'];
}
function priceListColumnDefinitions(copy){
  return [
    {key:'fraction',label:copy.labels.fraction},
    {key:'floor',label:copy.labels.floor},
    {key:'typology',label:copy.labels.typology},
    {key:'price',label:copy.labels.price,numeric:true},
    {key:'status',label:copy.labels.status},
    {key:'orientation',label:copy.labels.orientation},
    {key:'abp',label:copy.labels.abp,numeric:true},
    {key:'terrace',label:copy.labels.terrace,numeric:true},
    {key:'total',label:copy.labels.total,numeric:true},
    {key:'pricePerSqm',label:copy.labels.pricePerSqm,numeric:true}
  ];
}
function priceListFractionChipLabel(f){return`Apt. ${String(f.number).padStart(2,'0')}`}
function priceListSelectionLabel(count){return`${count} ${count===1?'fração selecionada':'frações selecionadas'}`}
function priceListAdjustedArea(v){return Math.max(0,Math.floor((+v||0)-2))}
function priceListCellValue(f,key,copy){
  const abp=priceListAdjustedArea(f.abp);
  const terrace=priceListAdjustedArea(f.terrace);
  const total=abp+terrace;
  const price=finalPrice(f);
  const values={
    fraction:esc(f.name),
    floor:esc(f.floorLabel),
    typology:esc(f.typology),
    price:money(price),
    status:esc(copy.statuses[statusOf(f)]||statusOf(f)),
    orientation:esc(f.orientation||'—'),
    abp:`${abp} m²`,
    terrace:`${terrace} m²`,
    total:`${total} m²`,
    pricePerSqm:total?`${money(price/total)}/m²`:'—'
  };
  return values[key]||'';
}
async function loadExcel(){
  setStatus('A carregar dados…');
  try{
    const r = await fetch('data.json', {cache:'no-store'});
    if(!r.ok) throw new Error('Não consegui abrir data.json.');
    const rawRows = await r.json();

    state.rows = rawRows.map(parseRow).filter(Boolean);
    state.fractions = state.rows.filter(r=>r.isTheView).sort((a,b)=>a.number-b.number);

    if(!state.fractions.length) throw new Error('Não encontrei frações The View.');

    let remoteLoaded=!REMOTE_URL;
    let shouldSyncAfterLoad=false;
    setStatus(REMOTE_URL ? `${state.fractions.length} frações carregadas · a sincronizar Google Sheets…` : `${state.fractions.length} frações carregadas`);

    if(REMOTE_URL){
      try{
        const remoteResult=await loadRemoteData();
        remoteLoaded=true;
        shouldSyncAfterLoad=!!remoteResult?.shouldSave;
      }catch(err){
        console.warn('Falha ao sincronizar Google Sheets antes de preparar dados locais', err);
        setStatus(`${state.fractions.length} frações carregadas · dados locais`);
      }
    }

    const migrated = applyUpdatedInitialPriceMigration();
    const crmMigrated = migrateCrmData();
    const historyChanged = ensureHistory();
    populate();
    renderAll();

    if(REMOTE_URL){
      if(remoteLoaded && (shouldSyncAfterLoad || migrated || crmMigrated || historyChanged)){
        save();
      }else if(!remoteLoaded && (migrated || crmMigrated || historyChanged)){
        saveLocalOnly();
      }
      if(remoteLoaded){
        setStatus(migrated || crmMigrated || historyChanged ? `${state.fractions.length} frações · dados preparados e sincronização ativa` : `${state.fractions.length} frações · sincronização Google Sheets ativa`);
      }
    }else if(migrated || crmMigrated || historyChanged){
      save();
    }
  }catch(e){
    console.error(e);
    showError(e.message || String(e));
    setStatus('Erro ao carregar dados');
  }
}
function parseRow(raw){const development=safe(raw['Empreendimento']),fr=safe(raw['Fração']);if(!development||!fr)return null;const isTheView=norm(development)==='the view',n=isTheView?nat(fr):nat(fr,0),abp=num(raw['ABP']),terr=num(raw['Varanda/Terraço']),tot=num(raw['Área Total'])||abp+terr,price=num(raw['PVP']);return{raw,development,fractionRaw:fr,isTheView,number:n,name:isTheView?fr:`${development} · ${fr}`,typology:pretty(raw['Tipologia']),floorLabel:safe(raw['Piso'])||'—',floor:floor(raw['Piso']),view:num(raw['Vista']),orientation:isTheView?(ORIENT[n]||safe(raw['Orientação'])):safe(raw['Orientação']),abp,terrace:terr,totalArea:tot,price,pricePerSqm:tot?price/tot:0}}
function populate(){
  const tys=['all',...uniq(state.fractions.map(f=>f.typology))],fls=['all',...uniq(state.fractions.map(f=>String(f.floorLabel)))],sts=['all',...STATUS];
  fill(el.proposalTypology,tys,'Todas');
  fill(el.proposalFloor,fls,'Todos');
  fill(el.proposalStatus,sts,'Todos');
  fill(el.priceTypology,tys,'Todas');
  fill(el.priceFloor,fls,'Todos');
  fill(el.priceStatus,sts,'Todos');
  fill(el.historyFractionSelect,state.fractions.map(f=>String(f.number)),null,n=>`Apartamento ${n}`);
  if(el.compareFractions){
    fillMulti(el.compareFractions,state.fractions.map(f=>[String(f.number),f.name]));
    [...el.compareFractions.options].slice(0,2).forEach(option=>{option.selected=true});
  }else{
    fill(el.compareA,state.fractions.map(f=>String(f.number)),null,n=>`Apartamento ${n}`);
    fill(el.compareB,state.fractions.map(f=>String(f.number)),null,n=>`Apartamento ${n}`);
    if(state.fractions[1])el.compareB.value=String(state.fractions[1].number);
  }
  fillMulti(el.clientFractions,state.fractions.map(f=>[String(f.number),f.name]));
  fillMulti(el.eventFractions,state.fractions.map(f=>[String(f.number),f.name]));
  fill(el.clientStageFilter,['all',...STAGES],'Todos');
  populateClientAgentSelect();
}

function switchTab(tab){
  state.tab = tab;
  if(tab==='sales')state.salesSubtab='clients';
  if(tab==='history')state.salesSubtab='events';
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-section').forEach(sec=>sec.classList.add('hidden'));
  const target = document.getElementById(tab==='history' ? 'tab-sales' : 'tab-' + tab);
  if(target) target.classList.remove('hidden');
  renderAll();
}


function applyUpdatedInitialPriceMigration(){
  const migrationKey = 'initial-prices-2026-05-19-v2';
  if(state.data.priceMigrationKey === migrationKey) return false;

  let changed = false;
  const keyChanged = state.data.priceMigrationKey !== migrationKey;
  state.data.finalPrices = state.data.finalPrices || {};
  state.data.priceHistory = state.data.priceHistory || {};

  Object.keys(UPDATED_INITIAL_PRICES).forEach(k=>{
    const n = Number(k);
    const newPrice = UPDATED_INITIAL_PRICES[n];
    const oldPrice = Number(state.data.finalPrices[n] || 0);

    if(oldPrice !== newPrice){
      state.data.finalPrices[n] = newPrice;
      state.data.priceHistory[n] = state.data.priceHistory[n] || [];
      state.data.priceHistory[n].push({
        date: today(),
        price: newPrice,
        oldPrice: oldPrice || '',
        reason: 'Atualização da tabela de preços iniciais'
      });
      changed = true;
    }
  });

  state.data.priceMigrationKey = migrationKey;
  return changed || keyChanged;
}

function emptyPreferences(){return{typology:'',floor:'',orientation:'',objective:'',decisionTime:'',summary:''}}
function cleanPreferences(value={}){
  return {
    typology:safe(value.typology),
    floor:safe(value.floor),
    orientation:safe(value.orientation),
    objective:safe(value.objective),
    decisionTime:safe(value.decisionTime),
    summary:safe(value.summary)
  };
}
function hasPreferenceData(value={}){return Object.values(cleanPreferences(value)).some(Boolean)}
function normalizeClientStage(stage){
  const value=norm(stage);
  const aliases={
    'novo lead':'Novo Lead','novo':'Novo Lead','contactado':'Novo Lead',
    'qualificado':'Qualificado','visitou':'Apresentado','apresentado':'Apresentado',
    'em negociacao':'Em negociação','negociacao':'Em negociação',
    'reserva':'Reservado','reservado':'Reservado','vendido':'Vendido','desistiu':'Desistiu'
  };
  return aliases[value]||'Novo Lead';
}
function stageRank(stage){return Math.max(0,STAGES.indexOf(normalizeClientStage(stage)))}
function isReservationEvent(ev){return !!ev&&['Reserva','Reserva efetuada'].includes(ev.type)}
function isSaleEvent(ev){return !!ev&&['Venda','Venda concluída'].includes(ev.type)}
function isReservationCancellationEvent(ev){return ev?.type==='Reserva cancelada'}
function isAbandonmentEvent(ev){return ev?.type==='Desistência'}
function stageFromEvent(ev){
  if(!ev)return '';
  if(isSaleEvent(ev))return 'Vendido';
  if(isReservationEvent(ev))return 'Reservado';
  if(isAbandonmentEvent(ev))return 'Desistiu';
  if(['Contra-proposta recebida','Contra-proposta enviada','Proposta recebida'].includes(ev.type))return 'Em negociação';
  if(['Reunião realizada','Frações apresentadas','Preços informados','Reunião com cliente','Visita'].includes(ev.type))return 'Apresentado';
  if(['Preferências recebidas','Interessado'].includes(ev.type))return 'Qualificado';
  if(ev.type==='Pedido de informação recebido')return 'Novo Lead';
  return '';
}
function sortedClientEvents(clientId){
  return (state.data.events||[]).map((ev,index)=>({ev,index})).filter(item=>item.ev.clientId===clientId).sort((a,b)=>eventSortKey(a.ev,a.index).localeCompare(eventSortKey(b.ev,b.index))).map(item=>item.ev);
}
function eventFractionsPresented(ev){
  return ['Frações apresentadas','Preços informados','Contra-proposta recebida','Contra-proposta enviada','Proposta recebida','Reserva efetuada','Reserva','Venda concluída','Venda','Visita','Reunião com cliente'].includes(ev.type);
}
function recalculateResumoCliente(clientId){
  const c=client(clientId);
  if(!c)return false;
  const before=JSON.stringify(c);
  const events=sortedClientEvents(clientId);
  const manualPreferences=cleanPreferences(c.manualPreferences||c.preferences||{});
  let preferences={...manualPreferences};
  let budget=Number(c.manualBudget??c.budget)||0;
  let derivedStage=(hasPreferenceData(manualPreferences)||budget>0||(c.manualFractions||[]).length)?'Qualificado':'Novo Lead';
  const presented=new Set();
  const linkedFractions=new Set((c.manualFractions||c.fractions||[]).map(Number).filter(Boolean));
  const latestPrices=new Map();

  events.forEach(ev=>{
    (ev.fractions||[]).map(Number).filter(Boolean).forEach(n=>linkedFractions.add(n));
    if(eventFractionsPresented(ev))(ev.fractions||[]).forEach(n=>presented.add(Number(n)));
    if(ev.type==='Preferências recebidas'){
      const eventPreferences=cleanPreferences(ev.preferences||{});
      Object.keys(eventPreferences).forEach(key=>{if(eventPreferences[key])preferences[key]=eventPreferences[key]});
      if(Number(ev.preferenceBudget)>0)budget=Number(ev.preferenceBudget);
    }
    (ev.informedPrices||[]).forEach(item=>{
      const n=Number(item.fraction||item.unitId);
      if(n)latestPrices.set(n,{fraction:n,officialPrice:Number(item.officialPrice)||0,informedPrice:Number(item.informedPrice)||0,observation:safe(item.observation),date:ev.date||'',eventId:ev.id});
    });
    if(isReservationCancellationEvent(ev)&&derivedStage==='Reservado')derivedStage='Apresentado';
    else{
      const next=stageFromEvent(ev);
      if(next==='Desistiu'||next==='Reservado'||next==='Vendido'||stageRank(next)>stageRank(derivedStage))derivedStage=next||derivedStage;
    }
  });
  if(c.preferencesManuallyEdited){
    preferences={...manualPreferences};
    budget=Number(c.manualBudget)||0;
  }

  const criticalDerived=['Reservado','Vendido','Desistiu'].includes(derivedStage);
  if(criticalDerived)c.stage=derivedStage;
  else if(c.stageManual&&c.manualStage)c.stage=normalizeClientStage(c.manualStage);
  else{
    const fallback=normalizeClientStage(c.legacyStageFallback||'Novo Lead');
    c.stage=stageRank(derivedStage)>=stageRank(fallback)?derivedStage:fallback;
  }
  c.preferences=preferences;
  c.budget=budget;
  c.fractions=uniqNum([...linkedFractions]);
  const followups=events.map((ev,index)=>({ev,date:ev.followupDate||(ev.type==='Reunião agendada'?ev.date:''),step:safe(ev.nextStep||ev.followup),index}));
  if(c.manualNextFollowup)followups.push({ev:null,date:c.manualNextFollowup,step:safe(c.manualNextStep),index:-1});
  const futureFollowups=followups.filter(item=>item.date&&item.date>=today()).sort((a,b)=>String(a.date).localeCompare(String(b.date))||a.index-b.index);
  const lastContact=events.slice().reverse().find(ev=>ev.date&&ev.date<=today()&&ev.type!=='Reunião agendada')?.date||'';
  const nextFollowup=futureFollowups[0]||null;
  const latestEventStep=events.slice().reverse().find(ev=>safe(ev.nextStep||ev.followup));
  c.commercialSummary={
    presentedFractions:uniqNum([...presented]),
    lastInformedPrices:[...latestPrices.values()].sort((a,b)=>a.fraction-b.fraction),
    lastContact,
    nextFollowup:nextFollowup?.date||'',
    nextStep:nextFollowup?.step||safe(latestEventStep?.nextStep||latestEventStep?.followup)||safe(c.manualNextStep)||(nextFollowup?.ev?.type==='Reunião agendada'?'Reunião agendada':'')
  };
  return before!==JSON.stringify(c);
}
function recalculateResumoTodosClientes(){return(state.data.clients||[]).reduce((changed,c)=>recalculateResumoCliente(c.id)||changed,false)}
function migrateCrmData(){
  let changed=state.data.crmMigrationKey!==CRM_MIGRATION_KEY;
  state.data.statusEventIds=state.data.statusEventIds||{};
  state.data.salePriceEventIds=state.data.salePriceEventIds||{};
  (state.data.clients||[]).forEach(c=>{
    const original=JSON.stringify(c);
    const normalizedStage=normalizeClientStage(c.stage);
    if(!Array.isArray(c.manualFractions))c.manualFractions=uniqNum(c.fractions||[]);
    if(c.manualBudget===undefined)c.manualBudget=Number(c.budget)||0;
    if(!c.manualPreferences)c.manualPreferences=cleanPreferences(c.preferences||{});
    if(c.preferencesManuallyEdited===undefined)c.preferencesManuallyEdited=!(state.data.events||[]).some(ev=>ev.clientId===c.id&&ev.type==='Preferências recebidas');
    if(c.manualNextStep===undefined)c.manualNextStep=safe(c.nextStep);
    if(c.manualNextFollowup===undefined)c.manualNextFollowup=safe(c.nextFollowup);
    if(c.originManual===undefined)c.originManual='';
    if(c.stageManual===undefined)c.stageManual=false;
    if(!c.manualStage)c.manualStage='';
    if(!c.legacyStageFallback)c.legacyStageFallback=normalizedStage;
    c.stage=normalizedStage;
    c.preferences=cleanPreferences(c.preferences||c.manualPreferences||{});
    if(original!==JSON.stringify(c))changed=true;
  });
  (state.data.events||[]).forEach(ev=>{
    const original=JSON.stringify(ev);
    ev.fractions=uniqNum(ev.fractions||[]);
    if(ev.nextStep===undefined)ev.nextStep=safe(ev.followup);
    if(ev.followup===undefined)ev.followup=safe(ev.nextStep);
    if(!Array.isArray(ev.informedPrices))ev.informedPrices=[];
    if(ev.preferences)ev.preferences=cleanPreferences(ev.preferences);
    if(original!==JSON.stringify(ev))changed=true;
  });
  state.data.crmMigrationKey=CRM_MIGRATION_KEY;
  if(recalculateResumoTodosClientes())changed=true;
  state.fractions.forEach(f=>{
    const effect=commercialEffectForFraction(f.number);
    if(effect&&statusOf(f)===effect.status&&!state.data.statusEventIds[f.number]){
      state.data.statusEventIds[f.number]=effect.event.id;
      if(effect.amount&&Number(state.data.salePrices[f.number])===Number(effect.amount))state.data.salePriceEventIds[f.number]=effect.event.id;
      changed=true;
    }
  });
  return changed;
}


function ensureSalesManagementTabs(){
  const tab=document.getElementById('tab-sales');
  if(!tab)return;

  const clientPanel=el.clientsList?el.clientsList.closest('.panel'):null;
  const fractionsPanel=el.salesTableBody?el.salesTableBody.closest('.panel'):null;
  const agentsPanel=document.getElementById('agentsPanel');

  if(clientPanel)clientPanel.dataset.salesView='clients';
  if(fractionsPanel)fractionsPanel.dataset.salesView='fractions';
  if(agentsPanel)agentsPanel.dataset.salesView='agents';
  if(clientPanel)ensureClientStickyActions(clientPanel);

  let eventsPanel=document.getElementById('salesEventsPanel');
  if(!eventsPanel){
    eventsPanel=document.createElement('section');
    eventsPanel.className='panel';
    eventsPanel.id='salesEventsPanel';
    eventsPanel.dataset.salesView='events';
    eventsPanel.innerHTML=`<div class="section-heading">
      <div><p class="eyebrow eyebrow--dark">Eventos / Histórico</p><h2>Histórico comercial</h2><p class="muted">Consulta geral de visitas, propostas, reservas, vendas, follow-ups e alterações de estado.</p></div>
      <div class="top-actions"><button class="primary-button" id="salesEventsNewEvent" type="button">Adicionar evento</button><button class="ghost-button" id="salesEventsExport" type="button">Exportar eventos</button></div>
    </div>
    <div id="salesEventsList" class="events-list"></div>`;
    tab.appendChild(eventsPanel);
    const addBtn=eventsPanel.querySelector('#salesEventsNewEvent');
    if(addBtn)addBtn.onclick=()=>openEventModal();
    const exportBtn=eventsPanel.querySelector('#salesEventsExport');
    if(exportBtn)exportBtn.onclick=exportSalesEvents;
  }

  let quick=document.getElementById('salesQuickActions');
  if(!quick){
    quick=document.createElement('section');
    quick.id='salesQuickActions';
    quick.className='panel sales-quick-actions';
    quick.innerHTML=`<div class="section-heading compact">
      <div>
        <p class="eyebrow eyebrow--dark">Ações rápidas</p>
        <h2>Gerenciamento de Vendas e Propostas</h2>
        <p class="muted">Crie clientes, agentes e eventos sem sair da visão atual.</p>
      </div>
      <div class="top-actions">
        <button class="primary-button" id="quickNewClient" type="button">Novo Cliente</button>
        <button class="primary-button" id="quickNewAgent" type="button">Novo Agente</button>
        <button class="primary-button" id="quickNewEvent" type="button">Novo Evento</button>
        <button class="ghost-button danger" id="quickMaintenance" type="button">Limpar Testes</button>
      </div>
    </div>`;
    tab.insertBefore(quick, tab.firstChild);
    const btnClient=quick.querySelector('#quickNewClient');
    const btnAgent=quick.querySelector('#quickNewAgent');
    const btnEvent=quick.querySelector('#quickNewEvent');
    const btnMaintenance=quick.querySelector('#quickMaintenance');
    if(btnClient)btnClient.onclick=()=>openClientModal('');
    if(btnAgent)btnAgent.onclick=()=>{state.salesSubtab='agents';renderSalesSubTabs();openAgentModal('');};
    if(btnEvent)btnEvent.onclick=()=>openEventModal();
    if(btnMaintenance)btnMaintenance.onclick=()=>openMaintenanceModal();
  }

  let nav=document.getElementById('salesSubTabs');
  if(!nav){
    nav=document.createElement('nav');
    nav.id='salesSubTabs';
    nav.className='module-tabs sales-subtabs';
    nav.innerHTML=`
      <button class="module-tab active" type="button" data-sales-subtab="clients">Clientes / Leads</button>
      <button class="module-tab" type="button" data-sales-subtab="fractions">Frações e Estados</button>
      <button class="module-tab" type="button" data-sales-subtab="agents">Agentes</button>
      <button class="module-tab" type="button" data-sales-subtab="events">Eventos / Histórico</button>
    `;
    tab.insertBefore(nav, quick ? quick.nextSibling : tab.firstChild);
    nav.querySelectorAll('[data-sales-subtab]').forEach(btn=>btn.onclick=()=>{
      state.salesSubtab=btn.dataset.salesSubtab;
      state.tab=state.salesSubtab==='events'?'history':'sales';
      document.querySelectorAll('[data-tab]').forEach(main=>main.classList.toggle('active',main.dataset.tab===state.tab));
      renderSalesSubTabs();
    });

    const st=document.createElement('style');
    st.id='salesSubTabsStyle';
    st.textContent=`
      #tab-sales #salesQuickActions{margin-bottom:18px}
      #tab-sales #salesSubTabs{margin-bottom:18px}
      #tab-sales .sales-quick-actions{position:relative;z-index:1}
      #tab-sales .sales-view-hidden{display:none!important}
    `;
    document.head.appendChild(st);
  }

  // Ordem visual: clientes primeiro; frações, agentes e histórico continuam preservados.
  const ordered=[clientPanel,fractionsPanel,agentsPanel,eventsPanel].filter(Boolean);
  let anchor=nav.nextSibling;
  ordered.forEach(panel=>{
    if(panel && panel.parentNode===tab){
      tab.insertBefore(panel, anchor);
      anchor=panel.nextSibling;
    }
  });

  if(!state.salesSubtab)state.salesSubtab='clients';
  renderSalesSubTabs();
}

function ensureClientStickyActions(clientPanel){
  let bar=document.getElementById('clientStickyActions');
  if(!bar){
    const heading=clientPanel.querySelector('.section-heading');
    const existingActions=heading?.querySelector('.top-actions');
    if(!heading||!existingActions)return;
    bar=document.createElement('div');
    bar.id='clientStickyActions';
    bar.className='client-sticky-actions';
    bar.innerHTML=`<div class="client-sticky-actions__context"><span>Ações</span><strong data-client-sticky-label>Clientes / Leads</strong></div><div class="top-actions client-sticky-actions__buttons"></div>`;
    const actions=bar.querySelector('.client-sticky-actions__buttons');
    const newClient=document.getElementById('openClientModal');
    const addEvent=document.getElementById('openEventModalBtn');
    if(newClient)actions.appendChild(newClient);
    if(addEvent){addEvent.textContent='Adicionar Evento';actions.appendChild(addEvent)}
    const newAgent=document.createElement('button');
    newAgent.id='clientStickyNewAgent';newAgent.className='ghost-button';newAgent.type='button';newAgent.textContent='Novo Agente';newAgent.onclick=()=>openAgentModal('');
    const printSummary=document.createElement('button');
    printSummary.id='printClientsSummaryBtn';printSummary.className='ghost-button';printSummary.type='button';printSummary.textContent='Imprimir Resumo de Clientes';printSummary.onclick=openClientsSummaryPdfModal;
    const editClient=document.createElement('button');
    editClient.id='clientStickyEditClient';editClient.className='ghost-button';editClient.type='button';editClient.textContent='Editar Cliente';editClient.onclick=()=>{if(client(state.selectedClientId))openClientModal(state.selectedClientId)};
    actions.append(newAgent,printSummary,editClient);
    if(!existingActions.children.length)existingActions.remove();
    heading.after(bar);
  }
  renderClientActionBar();
}
function renderClientActionBar(){
  const bar=document.getElementById('clientStickyActions');
  if(!bar)return;
  const selected=client(state.selectedClientId);
  const label=bar.querySelector('[data-client-sticky-label]');
  const edit=document.getElementById('clientStickyEditClient');
  if(label)label.textContent=selected?(selected.name||'Cliente selecionado'):'Clientes / Leads';
  if(edit)edit.classList.toggle('hidden',!selected);
}

function clientSummaryFollowupInfo(c){
  const candidates=sortedClientEvents(c.id).map((ev,index)=>({date:safe(ev.followupDate||(ev.type==='Reunião agendada'?ev.date:'')),step:safe(ev.nextStep||ev.followup),index}));
  if(c.manualNextFollowup)candidates.push({date:safe(c.manualNextFollowup),step:safe(c.manualNextStep),index:-1});
  const valid=candidates.filter(item=>/^\d{4}-\d{2}-\d{2}$/.test(item.date));
  const future=valid.filter(item=>item.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index)[0]||null;
  const overdue=valid.filter(item=>item.date<today()).sort((a,b)=>b.date.localeCompare(a.date)||b.index-a.index)[0]||null;
  if(future)return{status:'future',date:future.date,step:future.step};
  if(overdue)return{status:'overdue',date:overdue.date,step:overdue.step};
  return{status:'none',date:'',step:''};
}
function clientSummaryLastContact(c){
  return sortedClientEvents(c.id).filter(ev=>ev.date&&ev.date<=today()).map(ev=>ev.date).pop()||'';
}
function clientSummaryPreferencesText(c){
  const preferences=cleanPreferences(c.preferences||{}),parts=[];
  if(preferences.typology)parts.push(preferences.typology);
  if(preferences.floor)parts.push(preferences.floor);
  if(preferences.orientation)parts.push(preferences.orientation);
  if(preferences.objective)parts.push(preferences.objective);
  if(Number(c.budget)>0)parts.push(`até ${money(c.budget)}`);
  return parts.join(' · ')||'—';
}
function clientSummaryFractionsText(c){
  const summary=c.commercialSummary||{},prices=new Map((summary.lastInformedPrices||[]).map(item=>[Number(item.fraction),Number(item.informedPrice)||0]));
  const fractions=uniqNum([...(summary.presentedFractions||[]),...prices.keys()]);
  return fractions.map(n=>prices.get(n)?`Apt. ${n}: ${money(prices.get(n))}`:`Apt. ${n}`).join(' · ')||'—';
}
function clientSummaryAgentLabel(c){
  const linked=agent(c.agentId),name=linked?.name||c.agent||'',agency=linked?.agency||c.agency||'';
  return uniq([name,agency,c.origin]).join(' · ')||'—';
}
function formatCommercialDate(value){
  const match=safe(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match?`${match[3]}/${match[2]}/${match[1]}`:'—';
}
function clientSummaryShortText(value,max=100){const text=safe(value);return text.length>max?text.slice(0,max-1).trim()+'…':text||'—'}
function buildClientSummaryRows(options={}){
  const statuses=new Set(options.statuses||[]),query=norm(options.search||''),agentId=options.agentId||'all',followupFilter=options.followupFilter||'all';
  const rows=(state.data.clients||[]).filter(c=>statuses.has(normalizeClientStage(c.stage))).filter(c=>!query||norm(c.name).includes(query)).filter(c=>agentId==='all'||c.agentId===agentId).map(c=>{
    const summary=c.commercialSummary||{},followup=clientSummaryFollowupInfo(c),lastContact=clientSummaryLastContact(c),preferences=cleanPreferences(c.preferences||{});
    return{
      client:c.name||'Cliente sem nome',status:normalizeClientStage(c.stage),preferences:clientSummaryPreferencesText(c),fractions:clientSummaryFractionsText(c),
      lastContact,lastContactLabel:formatCommercialDate(lastContact),followupStatus:followup.status,followupDate:followup.date,
      followupLabel:followup.status==='overdue'?`Vencido: ${formatCommercialDate(followup.date)}`:followup.date?formatCommercialDate(followup.date):'—',
      nextStep:safe(summary.nextStep||followup.step||c.manualNextStep)||'—',contact:uniq([c.phone,c.email]).join(' · ')||'—',
      agentOrigin:clientSummaryAgentLabel(c),note:clientSummaryShortText(preferences.summary)
    };
  }).filter(row=>followupFilter==='all'||row.followupStatus===followupFilter);
  const statusOrder=new Map(STAGES.map((stage,index)=>[stage,index]));
  rows.sort((a,b)=>{
    if(options.sort==='name')return a.client.localeCompare(b.client,'pt-PT',{sensitivity:'base'});
    if(options.sort==='status')return(statusOrder.get(a.status)-statusOrder.get(b.status))||a.client.localeCompare(b.client,'pt-PT');
    if(options.sort==='lastContact')return Number(!a.lastContact)-Number(!b.lastContact)||(b.lastContact||'').localeCompare(a.lastContact||'')||a.client.localeCompare(b.client,'pt-PT');
    const group=row=>row.followupStatus==='future'?0:row.followupStatus==='overdue'?1:2;
    const groupDiff=group(a)-group(b);if(groupDiff)return groupDiff;
    if(a.followupStatus==='future')return a.followupDate.localeCompare(b.followupDate)||a.client.localeCompare(b.client,'pt-PT');
    if(a.followupStatus==='overdue')return b.followupDate.localeCompare(a.followupDate)||a.client.localeCompare(b.client,'pt-PT');
    return a.client.localeCompare(b.client,'pt-PT');
  });
  return rows;
}
function openClientsSummaryPdfModal(){
  document.getElementById('clientsSummaryPdfModal')?.remove();
  const statusOptions=STAGES.map(stage=>[stage,!['Vendido','Desistiu'].includes(stage)]);
  const columnOptions=[
    ['client','Cliente',true,true],['status','Estado',true,false],['preferences','Preferências / Interesse',true,false],
    ['fractions','Frações / últimos preços informados',true,false],['lastContact','Último contacto',true,false],
    ['nextFollowup','Próximo follow-up',true,false],['nextStep','Próximo passo',true,false],
    ['contact','Contacto',false,false],['agentOrigin','Agente / Origem',false,false],['note','Nota curta',false,false]
  ];
  const agents=(state.data.agents||[]).slice().sort((a,b)=>safe(a.name).localeCompare(safe(b.name),'pt-PT'));
  const modal=document.createElement('div');modal.id='clientsSummaryPdfModal';modal.className='modal-backdrop';modal.innerHTML=`
    <div class="modal clients-summary-modal"><button class="modal-close" type="button" data-close-clients-summary>×</button><p class="eyebrow eyebrow--dark">Documento interno</p><h2>Imprimir Resumo de Clientes</h2><p class="muted">Selecione os clientes e a informação a incluir no acompanhamento comercial.</p>
      <div class="clients-summary-options"><section><h3>Estados do funil</h3><div class="clients-summary-check-grid">${statusOptions.map(([stage,checked])=>`<label class="check-option"><input type="checkbox" value="${attr(stage)}" data-client-summary-status ${checked?'checked':''}><span>${esc(stage)}</span></label>`).join('')}</div></section>
      <section><h3>Colunas</h3><div class="clients-summary-check-grid">${columnOptions.map(([key,label,checked,required])=>`<label class="check-option"><input type="checkbox" value="${attr(key)}" data-client-summary-column ${checked?'checked':''} ${required?'disabled':''}><span>${esc(label)}${required?' <small>obrigatória</small>':''}</span></label>`).join('')}</div></section></div>
      <div class="filters-grid clients-summary-filters"><label class="field"><span>Pesquisar cliente</span><input id="clientSummarySearch" type="search" placeholder="Nome do cliente"></label><label class="field"><span>Agente</span><select id="clientSummaryAgent"><option value="all">Todos</option>${agents.map(a=>`<option value="${attr(a.id)}">${esc((a.name||'Agente')+(a.agency?' · '+a.agency:''))}</option>`).join('')}</select></label><label class="field"><span>Próximo follow-up</span><select id="clientSummaryFollowup"><option value="all">Todos</option><option value="future">Com follow-up futuro</option><option value="overdue">Follow-up vencido</option><option value="none">Sem follow-up</option></select></label><label class="field"><span>Ordenar por</span><select id="clientSummarySort"><option value="followup">Próximo follow-up</option><option value="lastContact">Último contacto</option><option value="status">Estado do funil</option><option value="name">Nome</option></select></label></div>
      <div class="clients-summary-result"><strong data-client-summary-count></strong><span class="muted small">Clientes sem follow-up ficam no fim na ordenação predefinida.</span></div>
      <div class="modal-actions"><button class="ghost-button" type="button" data-close-clients-summary>Cancelar</button><button class="primary-button" type="button" data-generate-clients-summary>Gerar PDF</button></div></div>`;
  const style=document.createElement('style');style.textContent=`#clientsSummaryPdfModal .clients-summary-modal{width:min(960px,100%)}#clientsSummaryPdfModal .clients-summary-options{display:grid;grid-template-columns:1fr 1.45fr;gap:16px;margin-top:18px}#clientsSummaryPdfModal .clients-summary-options section{border:1px solid #dfe7f0;border-radius:12px;padding:14px;background:#f8fafc}#clientsSummaryPdfModal h3{margin:0 0 12px;font-size:15px;color:#0e2444}#clientsSummaryPdfModal .clients-summary-check-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 12px}#clientsSummaryPdfModal .check-option{display:flex;align-items:flex-start;gap:8px;color:#213652;font-size:14px}#clientsSummaryPdfModal .check-option input{width:16px;height:16px;margin-top:2px}#clientsSummaryPdfModal .check-option small{display:block;color:#6f7f92;font-size:11px}#clientsSummaryPdfModal .clients-summary-filters{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:16px}#clientsSummaryPdfModal .clients-summary-result{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:14px;padding:11px 13px;border-radius:10px;background:#f1f5f9}@media(max-width:720px){#clientsSummaryPdfModal .clients-summary-options,#clientsSummaryPdfModal .clients-summary-filters{grid-template-columns:1fr}#clientsSummaryPdfModal .clients-summary-check-grid{grid-template-columns:1fr}#clientsSummaryPdfModal .clients-summary-result{display:block}}`;
  modal.appendChild(style);document.body.appendChild(modal);document.body.style.overflow='hidden';
  const readOptions=()=>({statuses:[...modal.querySelectorAll('[data-client-summary-status]:checked')].map(input=>input.value),columns:[...modal.querySelectorAll('[data-client-summary-column]:checked')].map(input=>input.value),search:modal.querySelector('#clientSummarySearch').value,agentId:modal.querySelector('#clientSummaryAgent').value,followupFilter:modal.querySelector('#clientSummaryFollowup').value,sort:modal.querySelector('#clientSummarySort').value});
  const updateCount=()=>{const count=buildClientSummaryRows(readOptions()).length;modal.querySelector('[data-client-summary-count]').textContent=`${count} ${count===1?'cliente incluído':'clientes incluídos'}`};
  const close=()=>{modal.remove();document.body.style.overflow=''};
  modal.querySelectorAll('[data-close-clients-summary]').forEach(button=>button.onclick=close);
  modal.querySelectorAll('input,select').forEach(input=>{input.addEventListener('input',updateCount);input.addEventListener('change',updateCount)});
  modal.querySelector('[data-generate-clients-summary]').onclick=()=>{const options=readOptions();if(!options.columns.includes('client'))options.columns.unshift('client');const rows=buildClientSummaryRows(options);if(!options.statuses.length){notifyUser('Selecione pelo menos um estado do funil.','Resumo de Clientes');return}if(!rows.length){notifyUser('Não existem clientes para os filtros escolhidos.','Resumo de Clientes');return}close();generateClientsSummaryPdf(rows,options.columns)};
  updateCount();
}
function generateClientsSummaryPdf(rows,columns){
  const definitions=[
    {key:'client',label:'Cliente',width:12},{key:'status',label:'Estado',width:9},{key:'preferences',label:'Preferências / Interesse',width:19},
    {key:'fractions',label:'Frações / últimos preços informados',width:20},{key:'lastContact',label:'Último contacto',width:8},
    {key:'nextFollowup',label:'Próximo follow-up',width:9},{key:'nextStep',label:'Próximo passo',width:15},
    {key:'contact',label:'Contacto',width:13},{key:'agentOrigin',label:'Agente / Origem',width:13},{key:'note',label:'Nota curta',width:14}
  ].filter(definition=>columns.includes(definition.key));
  const cell=(row,key)=>{
    if(key==='client')return`<strong>${esc(row.client)}</strong>`;
    if(key==='status')return`<span class="status-label">${esc(row.status)}</span>`;
    if(key==='nextFollowup')return`<span class="${row.followupStatus==='overdue'?'overdue':''}">${esc(row.followupLabel)}</span>`;
    const values={preferences:row.preferences,fractions:row.fractions,lastContact:row.lastContactLabel,nextStep:row.nextStep,contact:row.contact,agentOrigin:row.agentOrigin,note:row.note};
    return esc(values[key]||'—');
  };
  const w=window.open('','_blank');if(!w){notifyUser('Autorize pop-ups para gerar o PDF.','Resumo de Clientes');return}
  const fontSize=definitions.length>=9?'5.7pt':definitions.length>=7?'6.4pt':'7pt',generatedAt=new Date().toLocaleString('pt-PT');
  w.document.open();w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>The View · Resumo Comercial de Clientes</title><style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@600;700&display=swap');@page{size:A4 portrait;margin:9mm 7mm 14mm}*{box-sizing:border-box}body{font-family:'Montserrat',Arial,sans-serif;margin:0;color:#0f2443;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.doc-header{display:flex;justify-content:space-between;gap:10mm;align-items:flex-start;border-bottom:1px solid #d9e1eb;padding-bottom:4mm;margin-bottom:4mm}.eyebrow{margin:0 0 2mm;text-transform:uppercase;letter-spacing:.2em;font-size:7px;font-weight:700;color:#9a7440}h1{font-family:'Cormorant Garamond','Times New Roman',serif;margin:0;font-size:23pt;line-height:1;color:#0e2444}h2{margin:2mm 0 0;font-size:10pt;color:#435675}.meta{margin:0;text-align:right;color:#62738a;font-size:6.8pt;line-height:1.45}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:${fontSize}}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{padding:1.8mm 1.3mm;border-bottom:1px solid #dfe7f0;text-align:left;vertical-align:top;overflow-wrap:anywhere;line-height:1.35}th{background:#f1f5f9;color:#0e2444;font-size:5.6pt;text-transform:uppercase;letter-spacing:.025em}tbody tr:nth-child(even){background:#fafbfd}.status-label{font-weight:700;color:#314866}.overdue{color:#a24a21;font-weight:700}.footer{position:fixed;left:0;right:0;bottom:-9mm;border-top:1px solid #d9e1eb;padding-top:2mm;color:#62738a;font-size:6.6pt}.footer span{float:right}@media print{body{background:#fff}}</style></head><body><header class="doc-header"><div><p class="eyebrow">The View Olhão</p><h1>The View Olhão</h1><h2>Resumo Comercial de Clientes / Leads</h2></div><p class="meta">${rows.length} clientes<br>${esc(generatedAt)}</p></header><table><colgroup>${definitions.map(def=>`<col style="width:${def.width}%">`).join('')}</colgroup><thead><tr>${definitions.map(def=>`<th>${esc(def.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${definitions.map(def=>`<td>${cell(row,def.key)}</td>`).join('')}</tr>`).join('')}</tbody></table><footer class="footer">Documento interno de acompanhamento comercial. Informação sujeita a atualização.<span>The View Olhão</span></footer><script>setTimeout(()=>{window.focus();window.print()},250)</script></body></html>`);w.document.close();
}

function renderSalesSubTabs(){
  const active=state.salesSubtab||'clients';
  document.querySelectorAll('#salesSubTabs [data-sales-subtab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.salesSubtab===active));
  document.querySelectorAll('#tab-sales [data-sales-view]').forEach(panel=>panel.classList.toggle('sales-view-hidden',panel.dataset.salesView!==active));
  renderSalesEventsPanel();
}

function renderSalesEventsPanel(){
  const box=document.getElementById('salesEventsList');
  if(!box)return;
  const events=(state.data.events||[]).slice().sort((a,b)=>String((b.date||'')+(b.time||'')).localeCompare(String((a.date||'')+(a.time||''))));
  box.innerHTML=events.length?events.map(ev=>{
    const c=client(ev.clientId);
    const fr=(ev.fractions||[]).map(n=>'Apt. '+n).join(', ')||'—';
    const ag=ev.agentId?agent(ev.agentId):null;
    return `<div class="event-item">
      <div class="section-heading compact">
        <div>
          <strong>${esc(ev.date||'—')} ${esc(ev.time||'')} · ${esc(ev.type||'Evento')}</strong>
          <p class="muted small">${esc(c?.name||'Sem cliente associado')} · Frações: ${esc(fr)}${ev.amount?' · Valor: '+money(ev.amount):''}${ag?' · Agente: '+esc(ag.name||ag.agency||'—'):''}</p>
        </div>
        <div class="top-actions">
          <span class="badge badge--neutral">${esc(ev.type||'Evento')}</span>
          <button class="ghost-button" type="button" data-edit-event="${attr(ev.id)}">Editar</button>
        </div>
      </div>
      ${ev.commissionAmount?`<p class="muted small">Comissão: ${money(ev.commissionAmount)} · Receita líquida: ${money((ev.amount||0)-ev.commissionAmount)}</p>`:''}
      ${ev.channel?`<p class="muted small">Canal: ${esc(ev.channel)}</p>`:''}
      ${(ev.informedPrices||[]).length?`<p><strong>Preços informados:</strong> ${esc(ev.informedPrices.map(item=>`Apt. ${item.fraction||item.unitId}: ${money(item.informedPrice)} (oficial: ${money(item.officialPrice)})`).join(' · '))}</p>`:''}
      ${ev.followup?`<p><strong>Follow-up:</strong> ${esc(ev.followup)} ${ev.followupDate?'· '+esc(ev.followupDate):''}</p>`:''}
      ${ev.objections?`<p><strong>Objeções:</strong> ${esc(ev.objections)}</p>`:''}
      ${ev.notes?`<p>${esc(ev.notes)}</p>`:''}
    </div>`;
  }).join(''):'<div class="empty-state">Ainda não existem eventos registados.</div>';
  box.querySelectorAll('[data-edit-event]').forEach(btn=>btn.addEventListener('click',()=>openEventModal(btn.dataset.editEvent,'events')));
}


function renderAll(){RenderFlow.all();}
function renderProposals(){const fs=filteredProposal();el.proposalSelectedInfo.textContent=`${[...state.selected].filter(n=>statusOf(getF(n))!=='Vendido').length} selecionadas`;el.proposalGrid.innerHTML=fs.length?fs.map(f=>{const st=statusOf(f),blocked=st!=='Disponível';return`<label class="proposal-card ${blocked?'proposal-card--sold':''}"><input type="checkbox" data-proposal-select="${f.number}" ${state.selected.has(f.number)&&!blocked?'checked':''} ${blocked?'disabled':''}/><div><span class="${badge(st)}">${blocked?st:st}</span><h3>${esc(f.name)}</h3><p class="muted">${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation||'—')}</p><p><strong>${blocked?st:money(finalPrice(f))}</strong></p><p class="muted small">ABP ${area(f.abp)} · Exterior ${area(f.terrace)} · Total ${area(f.totalArea)}</p></div></label>`}).join(''):'<div class="empty-state">Sem frações.</div>';el.proposalGrid.querySelectorAll('[data-proposal-select]').forEach(x=>x.onchange=()=>{const n=+x.dataset.proposalSelect;x.checked?state.selected.add(n):state.selected.delete(n);renderProposals()})}
function renderDashboard(){
  const sold=state.fractions.filter(f=>statusOf(f)==='Vendido'),available=state.fractions.filter(f=>statusOf(f)==='Disponível'),reserved=state.fractions.filter(f=>statusOf(f)==='Reservado'),unavailable=state.fractions.filter(f=>statusOf(f)==='Indisponível');
  const gross=sum(sold.map(f=>salePrice(f)||finalPrice(f)));
  const commissions=sum(sold.map(f=>commissionOf(f.number).amount||0));
  const net=gross-commissions;
  el.dashboardKpis.innerHTML=[
    kpi('Receita de tabela',money(sum(state.fractions.map(finalPrice))),'Soma dos preços finais'),
    kpi('Vendas reais brutas',money(gross),'Apenas frações vendidas'),
    kpi('Comissões imobiliárias',money(commissions),'Estimativa de comissão'),
    kpi('Receita líquida estimada',money(net),'Vendas brutas - comissões'),
    kpi('Disponíveis',available.length,'Unidades livres'),
    kpi('Reservadas',reserved.length,'Reservas em aberto'),
    kpi('Vendidas',sold.length,'Total vendidas'),
    kpi('Indisponíveis',unavailable.length,'Bloqueadas manualmente')
  ].join('');renderDecisionAlerts()}

function renderDecisionAlerts(){if(!el.decisionAlerts)return;const soldBelow=state.fractions.filter(f=>statusOf(f)==='Vendido'&&salePrice(f)&&salePrice(f)<finalPrice(f));const reserved=state.fractions.filter(f=>statusOf(f)==='Reservado');const changed=state.fractions.filter(f=>historyOf(f).length>1).slice(0,8);const hot=state.fractions.map(f=>({f,m:metrics(f.number)})).filter(x=>x.m.proposals||x.m.interested).sort((a,b)=>(b.m.proposals-a.m.proposals)||(b.m.interested-a.m.interested)).slice(0,6);let blocks=[];blocks.push(`<article class="decision-alert decision-alert--warn"><h3>Reservas pendentes</h3><p><strong>${reserved.length}</strong> frações reservadas.</p><p>${reserved.slice(0,5).map(f=>esc(f.name)).join(', ')||'Sem reservas neste momento.'}</p></article>`);blocks.push(`<article class="decision-alert ${soldBelow.length?'decision-alert--danger':'decision-alert--success'}"><h3>Vendas abaixo da tabela</h3><p><strong>${soldBelow.length}</strong> vendas abaixo do preço final definido.</p><p>${soldBelow.slice(0,5).map(f=>`${esc(f.name)} (${money(finalPrice(f)-salePrice(f))})`).join(', ')||'Sem desvios negativos registados.'}</p></article>`);blocks.push(`<article class="decision-alert"><h3>Preços alterados</h3><p><strong>${changed.length}</strong> frações com histórico de alteração.</p><p>${changed.map(f=>esc(f.name)).join(', ')||'Ainda sem alterações manuais.'}</p></article>`);blocks.push(`<article class="decision-alert"><h3>Maior procura</h3><p>${hot.length?hot.map(x=>`${esc(x.f.name)} · ${x.m.interested} interessados · ${x.m.proposals} propostas`).join('<br>'):'Ainda sem eventos comerciais suficientes.'}</p></article>`);blocks.push(`<article class="decision-alert"><h3>Sincronização</h3><p>${REMOTE_URL?'Google Sheets ativo. As alterações são guardadas na base partilhada.':'Modo local. Configure o URL do Google Apps Script em config.js para partilhar dados.'}</p></article>`);el.decisionAlerts.innerHTML=blocks.join('')}

function renderPrices(){const fs=filteredPrice();el.pricesTableBody.innerHTML=fs.length?fs.map(f=>{const h=historyOf(f),last=h[h.length-1];return`<tr><td><strong>${esc(f.name)}</strong><div class="muted small">${esc(statusOf(f))}</div></td><td>${esc(f.typology)}</td><td>${esc(f.floorLabel)}</td><td>${esc(f.orientation||'—')}</td><td class="num-col">${money(f.price)}</td><td class="num-col"><input type="number" step="1000" data-price="${f.number}" value="${Math.round(finalPrice(f))}"/></td><td><textarea data-price-reason="${f.number}" placeholder="Motivo da alteração"></textarea></td><td><span class="muted small">${h.length} registos</span><br><span class="muted small">Último: ${last?esc(last.date):'—'}</span></td></tr>`}).join(''):'<tr><td colspan="8"><div class="empty-state">Sem frações.</div></td></tr>';el.pricesTableBody.querySelectorAll('[data-price]').forEach(inp=>inp.onchange=()=>{const n=+inp.dataset.price,f=getF(n),old=finalPrice(f),p=num(inp.value);if(!p||p===old)return;const r=document.querySelector(`[data-price-reason="${n}"]`).value.trim();state.data.finalPrices[n]=Math.round(p);state.data.priceHistory[n] ||= [];state.data.priceHistory[n].push({date:today(),price:Math.round(p),oldPrice:Math.round(old),reason:r||'Alteração manual'});save();RenderFlow.priceChanged()})}
function renderHistory(){const f=getF(+el.historyFractionSelect.value)||state.fractions[0];if(!f)return;const h=historyOf(f);draw(h,f);el.historyList.innerHTML=h.slice().reverse().map(x=>`<div class="history-item"><strong>${esc(x.date)} · ${money(x.price)}</strong><p class="muted">${esc(x.reason||'Sem nota')}</p></div>`).join('')}
function draw(h,f){const c=el.priceHistoryChart,ctx=c.getContext('2d'),w=c.width,hgt=c.height;ctx.clearRect(0,0,w,hgt);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,hgt);ctx.strokeStyle='#d9e1eb';for(let i=0;i<5;i++){let y=50+i*((hgt-100)/4);ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(w-30,y);ctx.stroke()}ctx.fillStyle='#16233d';ctx.font='24px sans-serif';ctx.fillText(`Evolução do preço · ${f.name}`,60,34);if(!h.length)return;let vals=h.map(x=>+x.price),mn=Math.min(...vals),mx=Math.max(...vals);if(mn===mx){mn*=.95;mx*=1.05}const L=60,R=30,T=60,B=55,PW=w-L-R,PH=hgt-T-B,x=i=>L+(h.length===1?PW/2:i*PW/(h.length-1)),y=v=>T+(mx-v)*PH/(mx-mn);ctx.strokeStyle='#1e467c';ctx.lineWidth=4;ctx.beginPath();h.forEach((it,i)=>i?ctx.lineTo(x(i),y(it.price)):ctx.moveTo(x(i),y(it.price)));ctx.stroke();h.forEach((it,i)=>{ctx.fillStyle='#b89253';ctx.beginPath();ctx.arc(x(i),y(it.price),7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#61718b';ctx.font='14px sans-serif';ctx.fillText(money(it.price),x(i)-42,y(it.price)-14)})}
function handleCompareSelection(){
  const selected=[...el.compareFractions.selectedOptions];
  if(selected.length>MAX_COMPARE_FRACTIONS){
    selected.slice(MAX_COMPARE_FRACTIONS).forEach(option=>{option.selected=false});
    showCompareNotice('Pode comparar no máximo 4 frações.');
  }else{
    showCompareNotice('');
  }
  renderCompare();
}
function selectedCompareFractions(){
  if(el.compareFractions){
    return [...el.compareFractions.selectedOptions].slice(0,MAX_COMPARE_FRACTIONS).map(option=>getF(+option.value)).filter(Boolean);
  }
  const a=getF(+el.compareA.value)||state.fractions[0],b=getF(+el.compareB.value)||state.fractions[1]||a;
  return [a,b].filter(Boolean);
}
function showCompareNotice(text){
  if(!el.compareNotice)return;
  el.compareNotice.textContent=text;
  el.compareNotice.classList.toggle('hidden',!text);
}
function renderCompare(){
  const fs=selectedCompareFractions();
  if(!fs.length){el.compareResult.innerHTML='<div class="empty-state">Selecione frações para comparar.</div>';return}
  if(fs.length<2){el.compareResult.innerHTML='<div class="empty-state">Selecione pelo menos 2 frações para comparar.</div>';return}
  el.compareResult.innerHTML=fs.map(panel).join('');
}
function panel(f){return`<article class="compare-panel"><span class="${badge(statusOf(f))}">${esc(statusOf(f))}</span><h3>${esc(f.name)}</h3><p class="muted">${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation||'—')}</p><table class="compare-table">${row('Preço final',money(finalPrice(f)))}${row('Preço inicial',money(f.price))}${row('Preço venda real',salePrice(f)?money(salePrice(f)):'—')}${row('ABP',area(f.abp))}${row('Exterior',area(f.terrace))}${row('Área total',area(f.totalArea))}${row('€/m² final',f.totalArea?money(Math.round(finalPrice(f)/f.totalArea),0):'—')}</table></article>`}
function renderClientSelects(){const opts=state.data.clients.map(c=>[c.id,c.name||'Cliente sem nome']);fillMulti(el.selectedClient,opts);fillMulti(el.eventClientId,opts);if(!state.selectedClientId&&state.data.clients[0])state.selectedClientId=state.data.clients[0].id;el.selectedClient.value=state.selectedClientId;el.eventClientId.value=state.selectedClientId;}
function renderClients(){const s=norm(state.cf.search),st=state.cf.stage;const cs=state.data.clients.filter(c=>(st==='all'||c.stage===st)&&(!s||norm([c.name,c.email,c.phone,c.origin,c.originManual,c.agent,c.agency,c.notes,c.preferences?.typology,c.preferences?.floor,c.preferences?.orientation,c.preferences?.objective,(c.fractions||[]).join(' ')].join(' ')).includes(s)));el.clientsList.innerHTML=cs.length?cs.map(c=>`<div class="client-card ${c.id===state.selectedClientId?'active':''}" data-client="${c.id}"><div class="section-heading compact"><div><strong>${esc(c.name||'Cliente sem nome')}</strong><p class="muted small">${esc(c.phone||'')} · ${esc(c.email||'')}</p><span class="badge badge--neutral">${esc(c.stage||'Novo Lead')}</span></div><button class="ghost-button" type="button" data-edit-client-card="${c.id}">Editar</button></div></div>`).join(''):'<div class="empty-state">Sem clientes.</div>';el.clientsList.querySelectorAll('[data-client]').forEach(card=>card.onclick=e=>{if(e.target.closest('[data-edit-client-card]'))return;state.selectedClientId=card.dataset.client;el.selectedClient.value=state.selectedClientId;renderClients();renderClientDetail()});el.clientsList.querySelectorAll('[data-edit-client-card]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();state.selectedClientId=btn.dataset.editClientCard;el.selectedClient.value=state.selectedClientId;openClientModal(state.selectedClientId)})}
function clientFractionCommercialRows(c,events){
  return uniqNum([...(c.fractions||[]),...(c.commercialSummary?.presentedFractions||[])]).map(n=>{
    const related=events.filter(ev=>(ev.fractions||[]).includes(n));
    const latest=related.slice().reverse().find(ev=>eventFractionsPresented(ev)||isReservationCancellationEvent(ev)||isAbandonmentEvent(ev))||null;
    const informed=related.flatMap(ev=>(ev.informedPrices||[]).filter(item=>Number(item.fraction||item.unitId)===n).map(item=>({...item,date:ev.date,eventId:ev.id}))).pop();
    let status='Interesse';
    if(latest){
      if(isSaleEvent(latest))status='Venda';
      else if(isReservationEvent(latest))status='Reserva';
      else if(isReservationCancellationEvent(latest))status='Reserva cancelada';
      else if(isAbandonmentEvent(latest))status='Desistência';
      else if(['Contra-proposta recebida','Contra-proposta enviada','Proposta recebida'].includes(latest.type))status='Negociação';
      else if(informed)status='Preço informado';
      else if(eventFractionsPresented(latest))status='Apresentada';
    }
    return{fraction:n,status,informedPrice:Number(informed?.informedPrice)||0,date:informed?.date||latest?.date||'',observation:safe(informed?.observation||latest?.notes)};
  });
}
function renderClientDetail(){
  renderClientActionBar();
  const c=client(state.selectedClientId);
  if(!c){el.clientDetail.innerHTML='<div class="empty-state">Selecione ou crie um cliente.</div>';return}
  recalculateResumoCliente(c.id);
  const chronological=sortedClientEvents(c.id),evs=chronological.slice().reverse(),summary=c.commercialSummary||{},prefs=cleanPreferences(c.preferences||{}),fractionRows=clientFractionCommercialRows(c,chronological);
  const associatedAgent=agent(c.agentId);
  const informed=(summary.lastInformedPrices||[]).map(item=>`Apt. ${item.fraction}: ${money(item.informedPrice)}`).join(' · ');
  el.clientDetail.innerHTML=`<div class="section-heading client-detail-header"><div><span class="badge badge--neutral">${esc(c.stage||'Novo Lead')}</span><h2>${esc(c.name||'Cliente sem nome')}</h2><p class="muted">${esc(c.phone||'—')} · ${esc(c.email||'—')}</p><p class="muted small">Origem: ${esc(clientOriginLabel(c))} · Agente: ${esc(associatedAgent?.name||c.agent||c.agency||'Sem agente')}</p></div><div class="top-actions"><button class="ghost-button" data-edit-client="${c.id}" type="button">Editar Cliente</button><button class="primary-button" data-add-client-event="${c.id}" type="button">Adicionar Evento</button></div></div>
    <section class="crm-detail-section"><div class="crm-detail-section__heading"><h3>Resumo Comercial</h3></div><div class="kpi-grid client-summary-grid"><article class="kpi-card"><span>Orçamento</span><strong>${c.budget?money(c.budget):'—'}</strong></article><article class="kpi-card"><span>Frações apresentadas</span><strong>${(summary.presentedFractions||[]).length}</strong><small>${esc((summary.presentedFractions||[]).map(n=>'Apt. '+n).join(', ')||'—')}</small></article><article class="kpi-card"><span>Último contacto</span><strong class="compact-value">${esc(summary.lastContact||'—')}</strong></article><article class="kpi-card"><span>Próximo follow-up</span><strong class="compact-value">${esc(summary.nextFollowup||'—')}</strong></article><article class="kpi-card"><span>Próximo passo</span><strong class="compact-value">${esc(summary.nextStep||'—')}</strong></article></div>${informed?`<p class="crm-inline-summary"><strong>Últimos preços informados:</strong> ${esc(informed)}</p>`:''}</section>
    <section class="crm-detail-section"><h3>Preferências</h3><div class="crm-preference-grid">${[['Tipologia',prefs.typology],['Piso',prefs.floor],['Orientação',prefs.orientation],['Objetivo',prefs.objective],['Prazo de decisão',prefs.decisionTime],['Resumo',prefs.summary]].map(([label,value])=>`<div><span>${esc(label)}</span><strong>${esc(value||'—')}</strong></div>`).join('')}</div></section>
    <section class="crm-detail-section"><h3>Frações e Preços</h3>${fractionRows.length?`<div class="table-wrap"><table class="data-table compact-table"><thead><tr><th>Fração</th><th>Estado com cliente</th><th class="num-col">Preço informado</th><th>Data</th><th>Observação</th></tr></thead><tbody>${fractionRows.map(row=>`<tr><td>Apt. ${row.fraction}</td><td>${esc(row.status)}</td><td class="num-col">${row.informedPrice?money(row.informedPrice):'—'}</td><td>${esc(row.date||'—')}</td><td>${esc(row.observation||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state">Ainda não existem frações associadas.</div>'}</section>
    <section class="crm-detail-section"><h3>Histórico</h3><div class="timeline">${evs.length?evs.map(e=>`<div class="timeline-item"><div class="section-heading compact"><div><strong>${esc(e.date||'')} ${esc(e.time||'')} · ${esc(e.type)}</strong><p class="muted">Frações: ${esc((e.fractions||[]).map(n=>'Apt. '+n).join(', ')||'—')}</p></div><button class="ghost-button" type="button" data-edit-client-event="${attr(e.id)}">Ver / Editar</button></div>${e.channel?`<p class="muted small">Canal: ${esc(e.channel)}</p>`:''}${e.amount?`<p><strong>Valor:</strong> ${money(e.amount)}</p>`:''}${(e.informedPrices||[]).length?`<p><strong>Preços informados:</strong> ${esc(e.informedPrices.map(item=>`Apt. ${item.fraction||item.unitId}: ${money(item.informedPrice)}`).join(' · '))}</p>`:''}${e.notes?`<p>${esc(e.notes)}</p>`:''}${e.objections?`<p><strong>Objeções:</strong> ${esc(e.objections)}</p>`:''}</div>`).join(''):'<div class="empty-state">Sem eventos para este cliente.</div>'}</div></section>
    <section class="crm-detail-section"><h3>Notas</h3><p class="muted">${esc(c.notes||'Sem notas livres.')}</p></section>`;
  el.clientDetail.querySelector('[data-edit-client]')?.addEventListener('click',()=>openClientModal(c.id));
  el.clientDetail.querySelector('[data-add-client-event]')?.addEventListener('click',()=>openEventModal('','client'));
  el.clientDetail.querySelectorAll('[data-edit-client-event]').forEach(btn=>btn.addEventListener('click',()=>openEventModal(btn.dataset.editClientEvent,'client')));
}

function commissionOf(n){return state.data.saleCommissions?.[n]||{amount:0}}
function agent(id){return (state.data.agents||[]).find(a=>a.id===id)}
function calculateCommission(amount,type,value){amount=+amount||0;value=+value||0;return type==='percent'?amount*value/100:value}
function isCommercialClosingEvent(ev){return !!ev&&(isReservationEvent(ev)||isSaleEvent(ev)||isReservationCancellationEvent(ev)||isAbandonmentEvent(ev))}
function commercialStatusFromEvent(ev){return isReservationEvent(ev)?'Reservado':isSaleEvent(ev)?'Vendido':''}
function eventDerivedStage(ev){return stageFromEvent(ev)}
function applyClientEventStage(c){if(c)recalculateResumoCliente(c.id)}
function applyReservationEvent(ev){reapplyCommercialEffectsForFractions(ev.fractions||[])}
function setSaleCommissionForFraction(n,ev){
  state.data.saleCommissions=state.data.saleCommissions||{};
  state.data.saleCommissions[n]={
    withAgent:!!ev.withAgent,
    agentId:ev.agentId||'',
    commissionType:ev.commissionType||'',
    commissionValue:+ev.commissionValue||0,
    amount:+ev.commissionAmount||0,
    netRevenue:(ev.amount||finalPrice(getF(n)))-(+ev.commissionAmount||0),
    eventId:ev.id,
    date:ev.date
  };
}
function applySaleEvent(ev){reapplyCommercialEffectsForFractions(ev.fractions||[])}
function applyEventBusinessRules(ev){
  state.data.events.push(ev);
  if(ev.type==='Preferências recebidas'&&client(ev.clientId))client(ev.clientId).preferencesManuallyEdited=false;
  applyClientEventStage(client(ev.clientId),ev);
  if(isReservationEvent(ev))applyReservationEvent(ev);
  else if(isSaleEvent(ev))applySaleEvent(ev);
  else if(isReservationCancellationEvent(ev)||isAbandonmentEvent(ev))reapplyCommercialEffectsForFractions(ev.fractions||[]);
}
function eventSortKey(ev,index=0){return`${ev.date||''} ${ev.time||''} ${String(index).padStart(6,'0')}`}
function commercialEffectForFraction(n){
  let effect=null;
  (state.data.events||[]).map((event,index)=>({event,index})).filter(item=>(item.event.fractions||[]).includes(n)).sort((a,b)=>eventSortKey(a.event,a.index).localeCompare(eventSortKey(b.event,b.index))).forEach(({event})=>{
    if(isReservationEvent(event))effect={status:'Reservado',amount:Number(event.amount)||0,event};
    else if(isSaleEvent(event))effect={status:'Vendido',amount:Number(event.amount)||0,event};
    else if(isReservationCancellationEvent(event)&&effect?.status==='Reservado'&&effect.event.clientId===event.clientId)effect=null;
    else if(isAbandonmentEvent(event)&&event.releaseReservation&&effect?.status==='Reservado'&&effect.event.clientId===event.clientId)effect=null;
  });
  return effect;
}
function latestCommercialEventForFraction(n){
  return commercialEffectForFraction(n)?.event||null;
}
function latestDerivedStageForClient(cid){
  return (state.data.events||[])
    .map((ev,index)=>({ev,index}))
    .filter(item=>item.ev.clientId===cid&&eventDerivedStage(item.ev))
    .sort((a,b)=>eventSortKey(a.ev,a.index).localeCompare(eventSortKey(b.ev,b.index)))
    .pop()?.ev;
}
function reapplyClientLinksAfterEventEdit(oldEv,newEv){
  const affected=uniq([oldEv?.clientId,newEv?.clientId]);
  affected.forEach(cid=>recalculateResumoCliente(cid));
}
function reapplyCommercialEffectsForFractions(numbers){
  state.data.statuses=state.data.statuses||{};
  state.data.salePrices=state.data.salePrices||{};
  state.data.saleCommissions=state.data.saleCommissions||{};
  state.data.statusEventIds=state.data.statusEventIds||{};
  state.data.salePriceEventIds=state.data.salePriceEventIds||{};
  uniqNum(numbers||[]).forEach(n=>{
    const effect=commercialEffectForFraction(n);
    const priorStatusSource=state.data.statusEventIds[n];
    const priorPriceSource=state.data.salePriceEventIds[n];
    if(effect){
      state.data.statuses[n]=effect.status;
      state.data.statusEventIds[n]=effect.event.id;
      if(effect.amount){state.data.salePrices[n]=effect.amount;state.data.salePriceEventIds[n]=effect.event.id}
      else if(priorPriceSource){delete state.data.salePrices[n];delete state.data.salePriceEventIds[n]}
      if(isSaleEvent(effect.event))setSaleCommissionForFraction(n,effect.event);
      else delete state.data.saleCommissions[n];
      return;
    }
    if(priorStatusSource){delete state.data.statuses[n];delete state.data.statusEventIds[n]}
    if(priorPriceSource){delete state.data.salePrices[n];delete state.data.salePriceEventIds[n]}
    if(state.data.saleCommissions[n]?.eventId)delete state.data.saleCommissions[n];
  });
}
function reapplyCommercialEffectsAfterEventEdit(oldEv,newEv){reapplyCommercialEffectsForFractions(uniqNum([...(oldEv?.fractions||[]),...(newEv?.fractions||[])]))}
function hasCriticalCommercialEventChange(oldEv,newEv){
  if(!isCommercialClosingEvent(oldEv)&&!isCommercialClosingEvent(newEv))return false;
  return oldEv.type!==newEv.type ||
    JSON.stringify(uniqNum(oldEv.fractions||[]))!==JSON.stringify(uniqNum(newEv.fractions||[])) ||
    Number(oldEv.amount||0)!==Number(newEv.amount||0) ||
    !!oldEv.withAgent!==!!newEv.withAgent ||
    (oldEv.agentId||'')!==(newEv.agentId||'') ||
    (oldEv.commissionType||'')!==(newEv.commissionType||'') ||
    Number(oldEv.commissionValue||0)!==Number(newEv.commissionValue||0);
}
function replaceEventAndReapplyBusinessRules(oldEv,newEv){
  const idx=state.data.events.findIndex(ev=>ev.id===oldEv.id);
  if(idx<0)return false;
  state.data.events[idx]=newEv;
  if(newEv.type==='Preferências recebidas'&&client(newEv.clientId))client(newEv.clientId).preferencesManuallyEdited=false;
  reapplyClientLinksAfterEventEdit(oldEv,newEv);
  reapplyCommercialEffectsAfterEventEdit(oldEv,newEv);
  return true;
}
function createManualStatusEvent(n,oldStatus,newStatus){
  return {id:id(),clientId:'',type:'Alteração de estado',date:today(),time:'',amount:0,interest:'',followup:'',followupDate:'',fractions:[n],objections:'',notes:`Estado alterado manualmente de ${oldStatus} para ${newStatus}`};
}
function applyManualStatusChange(n,oldStatus,newStatus,{unavailableReason=null,salePriceValue=null}={}){
  state.data.statusEventIds=state.data.statusEventIds||{};
  delete state.data.statusEventIds[n];
  state.data.statuses[n]=newStatus;
  if(newStatus==='Indisponível'){
    state.data.unavailableReasons=state.data.unavailableReasons||{};
    if(unavailableReason!==null)state.data.unavailableReasons[n]=String(unavailableReason).trim();
  }
  if(newStatus==='Disponível'&&state.data.unavailableReasons)delete state.data.unavailableReasons[n];
  if((newStatus==='Reservado'||newStatus==='Vendido')&&!state.data.salePrices[n]){
    const f=getF(n);
    state.data.salePrices[n]=salePriceValue?num(salePriceValue):finalPrice(f);
  }
  state.data.events.push(createManualStatusEvent(n,oldStatus,newStatus));
}

function ensureClientAgentSelect(){
  const field=el.clientAgent?.parentElement;
  if(!field || el.clientAgent?.tagName==='SELECT')return;
  const old=el.clientAgent;
  const select=document.createElement('select');
  select.id='clientAgent';
  select.innerHTML='<option value="">Sem agente associado</option>';
  old.replaceWith(select);
  el.clientAgent=select;

  const actions=document.createElement('div');
  actions.className='top-actions';
  actions.style.marginTop='8px';
  actions.innerHTML='<button class="ghost-button" id="createAgentFromClientBtn" type="button">Criar agente</button>';
  field.appendChild(actions);
  const btn=actions.querySelector('#createAgentFromClientBtn');
  if(btn)btn.onclick=()=>{state.pendingClientAgentCreation=true;openAgentModal('')};
  el.clientAgent.onchange=syncClientAgentAgency;
}
function populateClientAgentSelect(selectedId=''){
  ensureClientAgentSelect();
  if(!el.clientAgent)return;
  const agents=state.data.agents||[];
  el.clientAgent.innerHTML='<option value="">Sem agente associado</option>'+agents.map(a=>`<option value="${attr(a.id)}">${esc((a.name||'Agente sem nome')+(a.agency?' · '+a.agency:''))}</option>`).join('');
  if(selectedId)el.clientAgent.value=selectedId;
}
function syncClientAgentAgency(){
  const a=agent(el.clientAgent?.value||'');
  if(el.clientAgency)el.clientAgency.value=a?(a.agency||''):'';
}
function clientAgentIdFromClient(c={}){
  if(c.agentId)return c.agentId;
  const name=norm(c.agent||''), agency=norm(c.agency||'');
  const a=(state.data.agents||[]).find(x=>(name&&norm(x.name||'')===name)||(agency&&norm(x.agency||'')===agency));
  return a?a.id:'';
}
function ensureEventClientQuickCreate(){
  const field=el.eventClientId?.parentElement;
  if(!field || document.getElementById('eventCreateClientBtn'))return;
  const actions=document.createElement('div');
  actions.className='top-actions';
  actions.style.marginTop='8px';
  actions.innerHTML='<button class="ghost-button" id="eventCreateClientBtn" type="button">Criar novo cliente</button>';
  field.appendChild(actions);
  const btn=actions.querySelector('#eventCreateClientBtn');
  if(btn)btn.onclick=()=>{state.pendingEventClientCreation=true;openClientModal('')};
}

function openMaintenanceModal(){
  ensureMaintenanceModal();
  renderMaintenanceModalLists();
  const modal=document.getElementById('maintenanceModal');
  modal.classList.remove('hidden');
  modal.style.zIndex='90';
  document.body.style.overflow='hidden';
}
function closeMaintenanceModal(){
  const modal=document.getElementById('maintenanceModal');
  if(modal){modal.classList.add('hidden');modal.style.zIndex='';}
  const clientOpen=el.clientModal&&!el.clientModal.classList.contains('hidden');
  const eventOpen=el.eventModal&&!el.eventModal.classList.contains('hidden');
  const agentOpen=document.getElementById('agentModal')&&!document.getElementById('agentModal').classList.contains('hidden');
  document.body.style.overflow=(clientOpen||eventOpen||agentOpen)?'hidden':'';
}
function ensureMaintenanceModal(){
  if(document.getElementById('maintenanceModal'))return;
  const modal=document.createElement('div');
  modal.id='maintenanceModal';
  modal.className='modal-backdrop hidden';
  modal.innerHTML=`<div class="modal maintenance-modal">
    <button class="modal-close" id="closeMaintenanceModal" type="button">×</button>
    <p class="eyebrow eyebrow--dark">Manutenção</p>
    <h2>Limpar dados de teste</h2>
    <p class="muted">Selecione clientes, agentes e eventos de teste para eliminar definitivamente. Esta ação atualiza a Google Sheet na próxima sincronização.</p>
    <div class="filters-grid filters-grid--clients">
      <label class="field"><span>Pesquisar</span><input id="maintenanceSearch" type="search" placeholder="Ex.: teste, nome, email, agente..." /></label>
      <label class="toggle-pill"><input id="maintenanceDeleteLinkedEvents" type="checkbox" checked /> <span>Eliminar eventos ligados aos clientes selecionados</span></label>
    </div>
    <div class="maintenance-grid">
      <section class="maintenance-section"><div class="section-heading compact"><div><h3>Clientes</h3><p class="muted small">Apaga o cliente selecionado.</p></div><button class="ghost-button" type="button" data-maint-select="clients">Selecionar testes</button></div><div id="maintenanceClients" class="maintenance-list"></div></section>
      <section class="maintenance-section"><div class="section-heading compact"><div><h3>Agentes</h3><p class="muted small">Apaga o agente e limpa referências em clientes/eventos.</p></div><button class="ghost-button" type="button" data-maint-select="agents">Selecionar testes</button></div><div id="maintenanceAgents" class="maintenance-list"></div></section>
      <section class="maintenance-section"><div class="section-heading compact"><div><h3>Eventos</h3><p class="muted small">Apaga eventos selecionados.</p></div><button class="ghost-button" type="button" data-maint-select="events">Selecionar testes</button></div><div id="maintenanceEvents" class="maintenance-list"></div></section>
    </div>
    <div class="modal-actions">
      <button class="ghost-button" id="cancelMaintenance" type="button">Cancelar</button>
      <button class="primary-button danger" id="deleteMaintenanceSelected" type="button">Eliminar selecionados</button>
    </div>
  </div>`;
  const style=document.createElement('style');
  style.id='maintenanceModalStyle';
  style.textContent=`
    #maintenanceModal{z-index:90!important}
    #maintenanceModal .maintenance-modal{width:min(1180px,100%);}
    #maintenanceModal .maintenance-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}
    #maintenanceModal .maintenance-section{border:1px solid rgba(22,35,61,.1);border-radius:18px;background:rgba(255,255,255,.76);padding:14px;min-height:260px}
    #maintenanceModal .maintenance-list{display:grid;gap:8px;max-height:42vh;overflow:auto}
    #maintenanceModal .maintenance-item{display:flex;gap:10px;align-items:flex-start;border:1px solid rgba(22,35,61,.08);background:#fff;border-radius:14px;padding:10px}
    #maintenanceModal .maintenance-item input{margin-top:4px}
    @media(max-width:980px){#maintenanceModal .maintenance-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(modal);
  document.getElementById('closeMaintenanceModal').onclick=closeMaintenanceModal;
  document.getElementById('cancelMaintenance').onclick=closeMaintenanceModal;
  document.getElementById('deleteMaintenanceSelected').onclick=deleteMaintenanceSelected;
  document.getElementById('maintenanceSearch').oninput=renderMaintenanceModalLists;
  modal.querySelectorAll('[data-maint-select]').forEach(btn=>btn.onclick=()=>selectMaintenanceTests(btn.dataset.maintSelect));
  modal.onclick=e=>{if(e.target===modal)closeMaintenanceModal()};
}
function isTestLikeText(v){
  return norm(v||'').includes('teste')||norm(v||'').includes('test');
}
function maintenanceQueryMatch(values,q){
  if(!q)return true;
  return norm(values.filter(Boolean).join(' ')).includes(q);
}
function renderMaintenanceModalLists(){
  const q=norm(document.getElementById('maintenanceSearch')?.value||'');
  const clients=(state.data.clients||[]).filter(c=>maintenanceQueryMatch([c.name,c.email,c.phone,c.origin,c.agent,c.agency,c.notes],q));
  const agents=(state.data.agents||[]).filter(a=>maintenanceQueryMatch([a.name,a.agency,a.email,a.phone,a.ami,a.notes],q));
  const events=(state.data.events||[]).filter(ev=>{
    const c=client(ev.clientId);
    const ag=agent(ev.agentId);
    return maintenanceQueryMatch([ev.type,ev.date,ev.notes,ev.objections,ev.followup,c?.name,ag?.name,ag?.agency,(ev.fractions||[]).join(' ')],q);
  });
  const cBox=document.getElementById('maintenanceClients');
  const aBox=document.getElementById('maintenanceAgents');
  const eBox=document.getElementById('maintenanceEvents');
  if(cBox)cBox.innerHTML=clients.length?clients.map(c=>`<label class="maintenance-item"><input type="checkbox" data-maint-client="${esc(c.id)}"/><div><strong>${esc(c.name||'Cliente sem nome')}</strong><p class="muted small">${esc(c.email||'')} ${c.phone?'· '+esc(c.phone):''}</p></div></label>`).join(''):'<div class="empty-state">Sem clientes para este filtro.</div>';
  if(aBox)aBox.innerHTML=agents.length?agents.map(a=>`<label class="maintenance-item"><input type="checkbox" data-maint-agent="${esc(a.id)}"/><div><strong>${esc(a.name||'Agente sem nome')}</strong><p class="muted small">${esc(a.agency||'')} ${a.email?'· '+esc(a.email):''}</p></div></label>`).join(''):'<div class="empty-state">Sem agentes para este filtro.</div>';
  if(eBox)eBox.innerHTML=events.length?events.map(ev=>`<label class="maintenance-item"><input type="checkbox" data-maint-event="${esc(ev.id)}"/><div><strong>${esc(ev.date||'—')} · ${esc(ev.type||'Evento')}</strong><p class="muted small">${esc(client(ev.clientId)?.name||'Sem cliente')} · Frações: ${esc((ev.fractions||[]).join(', ')||'—')}</p>${ev.notes?`<p class="muted small">${esc(ev.notes)}</p>`:''}</div></label>`).join(''):'<div class="empty-state">Sem eventos para este filtro.</div>';
}
function selectMaintenanceTests(kind){
  const sel = kind==='clients'?'[data-maint-client]':kind==='agents'?'[data-maint-agent]':'[data-maint-event]';
  document.querySelectorAll(sel).forEach(input=>{
    const card=input.closest('.maintenance-item');
    input.checked=isTestLikeText(card?.innerText||'');
  });
}
function checkedValues(selector){
  const attr=selector.slice(1,-1);
  return [...document.querySelectorAll(selector+':checked')].map(x=>x.getAttribute(attr));
}
async function deleteMaintenanceSelected(){
  const clientIds=checkedValues('[data-maint-client]');
  const agentIds=checkedValues('[data-maint-agent]');
  const eventIds=checkedValues('[data-maint-event]');
  const deleteLinked=!!document.getElementById('maintenanceDeleteLinkedEvents')?.checked;
  if(!clientIds.length&&!agentIds.length&&!eventIds.length){await notifyUser('Selecione pelo menos um item para eliminar.','Limpar Testes');return}

  let finalEventIds=new Set(eventIds);
  if(deleteLinked){
    (state.data.events||[]).forEach(ev=>{if(clientIds.includes(ev.clientId))finalEventIds.add(ev.id)});
  }

  const msg=`Eliminar definitivamente:\n- ${clientIds.length} cliente(s)\n- ${agentIds.length} agente(s)\n- ${finalEventIds.size} evento(s)\n\nEsta ação não pode ser desfeita.`;
  if(!await confirmUser(msg,'Confirmar eliminação'))return;
  const removedEvents=(state.data.events||[]).filter(ev=>finalEventIds.has(ev.id));
  const affectedFractions=uniqNum(removedEvents.flatMap(ev=>ev.fractions||[]));
  const affectedClients=uniq(removedEvents.map(ev=>ev.clientId));

  if(clientIds.length){
    state.data.clients=(state.data.clients||[]).filter(c=>!clientIds.includes(c.id));
    if(clientIds.includes(state.selectedClientId))state.selectedClientId='';
  }

  if(agentIds.length){
    state.data.agents=(state.data.agents||[]).filter(a=>!agentIds.includes(a.id));
    (state.data.clients||[]).forEach(c=>{
      if(agentIds.includes(c.agentId)){c.agentId='';c.agent='';c.agency=''}
    });
    (state.data.events||[]).forEach(ev=>{
      if(agentIds.includes(ev.agentId)){ev.agentId='';ev.withAgent=false;ev.commissionType='';ev.commissionValue=0;ev.commissionAmount=0}
    });
    Object.keys(state.data.saleCommissions||{}).forEach(n=>{
      if(agentIds.includes(state.data.saleCommissions[n]?.agentId)){
        state.data.saleCommissions[n].agentId='';
        state.data.saleCommissions[n].withAgent=false;
      }
    });
    if(agentIds.includes(state.selectedAgentId))state.selectedAgentId='';
  }

  if(finalEventIds.size){
    state.data.events=(state.data.events||[]).filter(ev=>!finalEventIds.has(ev.id));
    Object.keys(state.data.saleCommissions||{}).forEach(n=>{
      if(finalEventIds.has(state.data.saleCommissions[n]?.eventId))delete state.data.saleCommissions[n];
    });
    reapplyCommercialEffectsForFractions(affectedFractions);
    affectedClients.forEach(cid=>recalculateResumoCliente(cid));
  }

  save();
  closeMaintenanceModal();
  RenderFlow.eventChanged();
}


function openAgentModal(aid=''){
  ensureAgentModal();
  const isEdit=!!aid;
  const a=isEdit?(agent(aid)||{}):{};
  ['agentId','agentName','agentAgency','agentAmi','agentPhone','agentEmail','agentDefaultCommission','agentNotes'].forEach(id=>{
    const e=document.getElementById(id);if(e)e.value='';
  });
  document.getElementById('agentId').value=isEdit?(a.id||''):'';
  document.getElementById('agentName').value=isEdit?(a.name||''):'';
  document.getElementById('agentAgency').value=isEdit?(a.agency||''):'';
  document.getElementById('agentAmi').value=isEdit?(a.ami||''):'';
  document.getElementById('agentPhone').value=isEdit?(a.phone||''):'';
  document.getElementById('agentEmail').value=isEdit?(a.email||''):'';
  document.getElementById('agentDefaultCommission').value=isEdit?(a.defaultCommission||''):'';
  const notes=document.getElementById('agentNotes');if(notes)notes.value=isEdit?(a.notes||''):'';
  const title=document.querySelector('#agentModal h2');if(title)title.textContent=isEdit?'Editar agente / agência':'Novo agente / agência';
  const saveBtn=document.getElementById('saveAgentBtn');if(saveBtn)saveBtn.textContent=isEdit?'Atualizar agente':'Guardar agente';
  const agentModal=document.getElementById('agentModal');
  agentModal.classList.remove('hidden');
  agentModal.style.zIndex='80';
  const clientModal=document.getElementById('clientModal');
  if(clientModal&&!clientModal.classList.contains('hidden'))clientModal.style.zIndex='50';
  document.body.style.overflow='hidden';
}
function closeAgentModal(){
  const modal=document.getElementById('agentModal');
  if(modal){modal.classList.add('hidden');modal.style.zIndex='';}
  const clientOpen=el.clientModal&&!el.clientModal.classList.contains('hidden');
  const eventOpen=el.eventModal&&!el.eventModal.classList.contains('hidden');
  document.body.style.overflow=(clientOpen||eventOpen)?'hidden':'';
  state.pendingClientAgentCreation=false;
}
function ensureAgentModal(){
  if(document.getElementById('agentModal'))return;
  const modal=document.createElement('div');
  modal.id='agentModal';
  modal.className='modal-backdrop hidden';
  const zfix=document.createElement('style');
  zfix.id='agentModalZIndexFix';
  zfix.textContent='#agentModal{z-index:80!important} #clientModal{z-index:50}';
  document.head.appendChild(zfix);
  modal.innerHTML=`<div class="modal">
    <button class="modal-close" id="closeAgentModal" type="button">×</button>
    <p class="eyebrow eyebrow--dark">Agentes / Agências</p>
    <h2>Novo agente / agência</h2>
    <input id="agentId" type="hidden" />
    <div class="form-grid">
      <label class="field"><span>Nome do agente</span><input id="agentName" placeholder="Nome" /></label>
      <label class="field"><span>Agência</span><input id="agentAgency" placeholder="Agência" /></label>
      <label class="field"><span>Nº AMI</span><input id="agentAmi" placeholder="AMI" /></label>
      <label class="field"><span>Contacto</span><input id="agentPhone" placeholder="Contacto" /></label>
      <label class="field"><span>Email</span><input id="agentEmail" placeholder="Email" /></label>
      <label class="field"><span>Comissão padrão (%)</span><input id="agentDefaultCommission" type="number" step="0.1" min="0" placeholder="Ex.: 5" /></label>
    </div>
    <label class="field"><span>Notas</span><textarea id="agentNotes" placeholder="Notas sobre o agente/agência"></textarea></label>
    <div class="modal-actions">
      <button class="ghost-button" id="cancelAgentModal" type="button">Cancelar</button>
      <button class="primary-button" id="saveAgentBtn" type="button">Guardar agente</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  document.getElementById('closeAgentModal').onclick=closeAgentModal;
  document.getElementById('cancelAgentModal').onclick=closeAgentModal;
  document.getElementById('saveAgentBtn').onclick=saveAgent;
  modal.onclick=e=>{if(e.target===modal)closeAgentModal()};
}


function ensureAgentsPanel(){
  const tab=document.getElementById('tab-sales');
  if(!tab||document.getElementById('agentsPanel'))return;
  const panel=document.createElement('section');
  panel.className='panel';
  panel.id='agentsPanel';
  panel.innerHTML=`<div class="section-heading">
    <div><p class="eyebrow eyebrow--dark">Agentes / Agências</p><h2>Cadastro de agentes imobiliários</h2><p class="muted">Lista, detalhe e edição de agentes/agências no mesmo padrão dos clientes.</p></div>
    <div class="top-actions"><button class="primary-button" id="openAgentModalBtn" type="button">Novo Agente</button></div>
  </div>
  <div class="client-layout">
    <div id="agentsList" class="clients-list"></div>
    <div id="agentDetail" class="client-detail"></div>
  </div>`;
  const first=tab.querySelector('.panel');
  if(first&&first.nextSibling)tab.insertBefore(panel,first.nextSibling);else tab.appendChild(panel);
  document.getElementById('openAgentModalBtn').onclick=()=>openAgentModal('');
  ensureAgentModal();
}
function clearAgentForm(){openAgentModal('')}
function editAgent(aid){openAgentModal(aid)}
async function saveAgent(){
  const aid=document.getElementById('agentId')?.value||id();
  const a={
    id:aid,
    name:document.getElementById('agentName').value.trim(),
    agency:document.getElementById('agentAgency').value.trim(),
    ami:document.getElementById('agentAmi').value.trim(),
    phone:document.getElementById('agentPhone').value.trim(),
    email:document.getElementById('agentEmail').value.trim(),
    defaultCommission:num(document.getElementById('agentDefaultCommission').value),
    notes:(document.getElementById('agentNotes')?.value||'').trim(),
    updated:new Date().toLocaleString('pt-PT')
  };
  if(!a.name&&!a.agency){await notifyUser('Indique pelo menos o nome do agente ou a agência.','Agente');return}
  state.data.agents=state.data.agents||[];
  const idx=state.data.agents.findIndex(x=>x.id===aid);
  idx>=0?state.data.agents[idx]=a:state.data.agents.push(a);
  state.selectedAgentId=aid;
  save();
  populateAgentSelect();
  populateClientAgentSelect(aid);
  if(state.pendingClientAgentCreation&&el.clientAgent){
    el.clientAgent.value=aid;
    syncClientAgentAgency();
  }
  closeAgentModal();
  RenderFlow.agentChanged();
  renderSalesSubTabs&&renderSalesSubTabs();
}
function renderAgents(){
  const listBox=document.getElementById('agentsList');
  const detail=document.getElementById('agentDetail');
  if(!listBox||!detail)return;
  const list=state.data.agents||[];
  if(!state.selectedAgentId&&list[0])state.selectedAgentId=list[0].id;
  if(state.selectedAgentId&&!list.some(a=>a.id===state.selectedAgentId))state.selectedAgentId=list[0]?.id||'';
  listBox.innerHTML=list.length?list.map(a=>`<div class="client-card ${a.id===state.selectedAgentId?'active':''}" data-agent-card="${a.id}">
    <div class="section-heading compact">
      <div><strong>${esc(a.name||'Agente sem nome')}</strong><p class="muted small">${esc(a.agency||'')} ${a.ami?'· AMI '+esc(a.ami):''}</p><span class="badge badge--neutral">${a.defaultCommission?esc(a.defaultCommission+'% comissão padrão'):'Sem comissão padrão'}</span></div>
      <button class="ghost-button" type="button" data-edit-agent="${a.id}">Editar</button>
    </div>
  </div>`).join(''):'<div class="empty-state">Ainda não existem agentes cadastrados.</div>';
  listBox.querySelectorAll('[data-agent-card]').forEach(card=>card.onclick=e=>{if(e.target.closest('[data-edit-agent]'))return;state.selectedAgentId=card.dataset.agentCard;renderAgents()});
  listBox.querySelectorAll('[data-edit-agent]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();state.selectedAgentId=btn.dataset.editAgent;openAgentModal(state.selectedAgentId)});
  const a=agent(state.selectedAgentId);
  if(!a){detail.innerHTML='<div class="empty-state">Selecione ou crie um agente.</div>';return}
  const relatedSales=state.data.events.filter(ev=>ev.agentId===a.id||Object.values(state.data.saleCommissions||{}).some(c=>c.agentId===a.id&&c.eventId===ev.id));
  detail.innerHTML=`<div class="section-heading">
    <div><h2>${esc(a.name||'Agente sem nome')}</h2><p class="muted">${esc(a.agency||'')} ${a.ami?'· AMI '+esc(a.ami):''}</p></div>
    <button class="ghost-button" data-edit-agent-detail="${a.id}" type="button">Editar agente</button>
  </div>
  <div class="fraction-card__metrics">
    <div class="metric-box"><span>Contacto</span><strong>${esc(a.phone||'—')}</strong></div>
    <div class="metric-box"><span>Email</span><strong>${esc(a.email||'—')}</strong></div>
    <div class="metric-box"><span>Comissão padrão</span><strong>${a.defaultCommission?esc(a.defaultCommission+'%'):'—'}</strong></div>
    <div class="metric-box"><span>Eventos associados</span><strong>${relatedSales.length}</strong></div>
  </div>
  ${a.notes?`<p class="muted">${esc(a.notes)}</p>`:''}`;
  const edit=detail.querySelector('[data-edit-agent-detail]');
  if(edit)edit.onclick=()=>openAgentModal(edit.dataset.editAgentDetail);
}
function ensureEventAgentFields(){
  if(document.getElementById('eventAgentFields'))return;
  const target=el.eventNotes?.parentElement;
  const wrap=document.createElement('div');wrap.id='eventAgentFields';wrap.className='form-grid';
  wrap.innerHTML=`<label class="toggle-pill"><input id="eventWithAgent" type="checkbox" /> <span>Venda através de agente imobiliário</span></label>
  <label class="field"><span>Agente / Agência</span><select id="eventAgentId"></select></label>
  <label class="field"><span>Tipo de comissão</span><select id="eventCommissionType"><option value="percent">Percentagem</option><option value="fixed">Valor fixo</option></select></label>
  <label class="field"><span>Comissão</span><input id="eventCommissionValue" type="number" step="0.1" min="0" placeholder="Ex.: 5 ou 20000" /></label>`;
  if(target)target.parentElement.insertBefore(wrap,target.nextSibling);else el.eventModal.querySelector('.modal').appendChild(wrap);
  document.getElementById('eventWithAgent').onchange=toggleEventAgentFields;
  document.getElementById('eventAgentId').onchange=()=>{const a=agent(document.getElementById('eventAgentId').value);if(a&&a.defaultCommission&&!document.getElementById('eventCommissionValue').value){document.getElementById('eventCommissionValue').value=a.defaultCommission;document.getElementById('eventCommissionType').value='percent';}};
}
function populateAgentSelect(){
  const sel=document.getElementById('eventAgentId');if(!sel)return;
  const list=state.data.agents||[];sel.innerHTML='<option value="">Selecionar agente/agência</option>'+list.map(a=>`<option value="${attr(a.id)}">${esc((a.name||'Agente')+(a.agency?' · '+a.agency:''))}</option>`).join('');
}
function toggleEventAgentFields(){
  const isSale=isSaleEvent({type:el.eventType?.value});
  const fields=document.getElementById('eventAgentFields');if(!fields)return;
  fields.style.display=isSale?'grid':'none';
}
function eventRequiresFractions(type){return['Frações apresentadas','Preços informados','Contra-proposta recebida','Contra-proposta enviada','Proposta recebida','Reserva efetuada','Reserva cancelada','Reserva','Venda concluída','Venda'].includes(type)}
function collectEventPriceDraft(){
  const rows=[...(el.eventPriceRows?.querySelectorAll('[data-event-price-row]')||[])];
  rows.forEach(row=>{
    const n=Number(row.dataset.eventPriceRow);
    state.eventPriceDraft=state.eventPriceDraft||{};
    state.eventPriceDraft[n]={fraction:n,officialPrice:Number(row.dataset.officialPrice)||0,informedPrice:num(row.querySelector('[data-informed-price]')?.value),observation:row.querySelector('[data-price-observation]')?.value.trim()||''};
  });
}
function previousLowerInformedPrice(n,excludeEventId=''){
  const records=(state.data.events||[]).filter(ev=>ev.id!==excludeEventId).flatMap(ev=>(ev.informedPrices||[]).filter(item=>Number(item.fraction||item.unitId)===n&&Number(item.informedPrice)>0).map(item=>({price:Number(item.informedPrice),date:ev.date||'',client:client(ev.clientId)?.name||'Cliente sem nome'})));
  const current=finalPrice(getF(n));
  return records.filter(item=>item.price<current).sort((a,b)=>a.price-b.price)[0]||null;
}
function renderEventPriceRows(initialRows=null){
  if(!el.eventPriceRows)return;
  if(initialRows){state.eventPriceDraft={};initialRows.forEach(item=>{const n=Number(item.fraction||item.unitId);if(n)state.eventPriceDraft[n]={fraction:n,officialPrice:Number(item.officialPrice)||0,informedPrice:Number(item.informedPrice)||0,observation:safe(item.observation)}})}
  else collectEventPriceDraft();
  const selected=getMulti(el.eventFractions).map(Number);
  el.eventPriceRows.innerHTML=selected.length?selected.map(n=>{
    const f=getF(n),draft=state.eventPriceDraft?.[n]||{},official=Number(draft.officialPrice)||finalPrice(f),informed=draft.informedPrice===undefined?official:Number(draft.informedPrice),difference=informed-official,previous=previousLowerInformedPrice(n,state.editingEventId);
    return `<article class="event-price-row" data-event-price-row="${n}" data-official-price="${official}"><div class="event-price-row__title"><div><strong>${esc(f?.name||'Apt. '+n)}</strong><span>Oficial na data: ${money(official)}</span></div><strong class="${difference<0?'price-negative':''}" data-price-difference>${difference?money(difference):money(0)}</strong></div><div class="form-grid"><label class="field"><span>Preço informado</span><input type="number" min="0" step="1000" value="${informed||''}" data-informed-price></label><label class="field"><span>Observação</span><input value="${attr(draft.observation||'')}" data-price-observation></label></div>${previous?`<p class="crm-warning">Atenção: esta fração já teve preço inferior informado. Menor preço: ${money(previous.price)}. Cliente: ${esc(previous.client)}. Data: ${esc(previous.date||'—')}.</p>`:''}</article>`;
  }).join(''):'<div class="empty-state">Selecione pelo menos uma fração acima.</div>';
  el.eventPriceRows.querySelectorAll('[data-informed-price]').forEach(input=>input.addEventListener('input',()=>{
    const row=input.closest('[data-event-price-row]'),difference=num(input.value)-Number(row.dataset.officialPrice),box=row.querySelector('[data-price-difference]');
    box.textContent=money(difference);box.classList.toggle('price-negative',difference<0);
  }));
}
function toggleEventSpecificFields(){
  const type=el.eventType?.value||'';
  toggleEventAgentFields();
  el.eventPreferenceFields?.classList.toggle('hidden',type!=='Preferências recebidas');
  el.eventPriceFields?.classList.toggle('hidden',type!=='Preços informados');
  if(type==='Preços informados')renderEventPriceRows();
  const amountField=el.eventAmount?.closest('.field');
  const amountLabel=amountField?.querySelector('span');
  if(amountLabel)amountLabel.textContent=isSaleEvent({type})?'Preço de venda':isReservationEvent({type})?'Valor da reserva':type.includes('Contra-proposta')||type==='Proposta recebida'?'Valor proposto':'Valor';
}

function renderSales(){el.salesTableBody.innerHTML=state.fractions.map(f=>{const m=metrics(f.number),c=commissionOf(f.number),st=statusOf(f);return`<tr><td><strong>${esc(f.name)}</strong><div class="muted small">${esc(f.typology)} · ${esc(f.orientation||'—')}</div></td><td><select data-status="${f.number}">${STATUS.map(s=>`<option ${s===st?'selected':''}>${esc(s)}</option>`).join('')}</select>${st==='Indisponível'&&state.data.unavailableReasons?.[f.number]?`<div class="muted small">${esc(state.data.unavailableReasons[f.number])}</div>`:''}</td><td class="num-col">${money(finalPrice(f))}</td><td class="num-col"><input type="number" step="1000" data-sale-price="${f.number}" value="${salePrice(f)||''}" placeholder="€"/>${c.amount?`<div class="muted small">Comissão: ${money(c.amount)}<br>Líquido: ${money((salePrice(f)||finalPrice(f))-c.amount)}</div>`:''}</td><td class="num-col">${m.visits}</td><td class="num-col">${m.interested}</td><td class="num-col">${m.proposals}</td><td class="num-col">${m.lastOffer?money(m.lastOffer):'—'}</td><td>${esc(m.lastAction||'—')}<div><button class="ghost-button compact-button" type="button" data-fraction-history="${f.number}">Histórico</button></div></td></tr>`}).join('');el.salesTableBody.querySelectorAll('[data-status]').forEach(s=>s.onchange=async()=>handleManualStatusSelect(+s.dataset.status,s.value));el.salesTableBody.querySelectorAll('[data-sale-price]').forEach(i=>i.onchange=()=>{const n=+i.dataset.salePrice;state.data.salePriceEventIds=state.data.salePriceEventIds||{};delete state.data.salePriceEventIds[n];state.data.salePrices[n]=num(i.value);save();renderDashboard();renderSales()});el.salesTableBody.querySelectorAll('[data-fraction-history]').forEach(btn=>btn.onclick=()=>openFractionHistoryModal(Number(btn.dataset.fractionHistory)))}
function getHistoricoComercialFracao(unitId){
  return (state.data.events||[]).filter(ev=>(ev.fractions||[]).includes(unitId)).map(ev=>{
    const price=(ev.informedPrices||[]).find(item=>Number(item.fraction||item.unitId)===unitId);
    const official=Number(price?.officialPrice)||0,informed=Number(price?.informedPrice)||0;
    return{eventId:ev.id,date:ev.date||'',time:ev.time||'',type:ev.type||'Evento',client:client(ev.clientId)?.name||'Sem cliente associado',officialPrice:official,informedPrice:informed,difference:informed&&official?informed-official:0,observation:safe(price?.observation||ev.notes),amount:Number(ev.amount)||0};
  }).sort((a,b)=>String(b.date+' '+b.time).localeCompare(String(a.date+' '+a.time)));
}
function openFractionHistoryModal(unitId){
  const f=getF(unitId);if(!f)return;
  document.getElementById('fractionHistoryModal')?.remove();
  const rows=getHistoricoComercialFracao(unitId),modal=document.createElement('div');
  modal.id='fractionHistoryModal';modal.className='modal-backdrop';modal.innerHTML=`<div class="modal fraction-history-modal"><button class="modal-close" type="button" data-close-fraction-history>×</button><p class="eyebrow eyebrow--dark">Frações e Estados</p><h2>Histórico Comercial · ${esc(f.name)}</h2><p class="muted">Histórico derivado dos eventos. Não altera preços nem estados.</p>${rows.length?`<div class="table-wrap"><table class="data-table compact-table"><thead><tr><th>Data</th><th>Tipo</th><th>Cliente</th><th class="num-col">Oficial na data</th><th class="num-col">Informado / Valor</th><th class="num-col">Diferença</th><th>Observação</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row.date||'—')}</td><td>${esc(row.type)}</td><td>${esc(row.client)}</td><td class="num-col">${row.officialPrice?money(row.officialPrice):'—'}</td><td class="num-col">${row.informedPrice?money(row.informedPrice):row.amount?money(row.amount):'—'}</td><td class="num-col ${row.difference<0?'price-negative':''}">${row.informedPrice&&row.officialPrice?money(row.difference):'—'}</td><td>${esc(row.observation||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state">Ainda não existem eventos associados a esta fração.</div>'}<div class="modal-actions"><button class="primary-button" type="button" data-close-fraction-history>Fechar</button></div></div>`;
  document.body.appendChild(modal);document.body.style.overflow='hidden';
  modal.querySelectorAll('[data-close-fraction-history]').forEach(btn=>btn.onclick=()=>{modal.remove();document.body.style.overflow=''});
}
async function handleManualStatusSelect(n,newStatus){
  const f=getF(n),oldStatus=statusOf(f);
  if(['Reservado','Vendido'].includes(newStatus)){
    await notifyUser('Para registar uma reserva ou venda completa, use "Adicionar evento" e escolha o tipo Reserva ou Venda. Esta alteração manual ficará apenas como ajuste de estado.','Ajuste manual de estado');
  }
  let unavailableReason=null,salePriceValue=null;
  if(newStatus==='Indisponível'){
    unavailableReason=await promptUser(`${f.name} ficará indisponível. Indique o motivo:`,state.data.unavailableReasons?.[n]||'','Motivo de indisponibilidade');
  }
  if((newStatus==='Reservado'||newStatus==='Vendido')&&!state.data.salePrices[n]){
    salePriceValue=await promptUser(`${f.name} foi marcado como ${newStatus}.\nPreço definido: ${money(finalPrice(f))}\nConfirme o preço real ou deixe vazio para usar o preço definido:`,Math.round(finalPrice(f)),'Preço real');
  }
  applyManualStatusChange(n,oldStatus,newStatus,{unavailableReason,salePriceValue});
  save();
  RenderFlow.salesChanged();
}
function openClientModal(cid=''){
  ensureClientAgentSelect();
  populateClientAgentSelect();
  const isEdit=!!cid;
  const c=isEdit?(client(cid)||{}):{};
  const aid=isEdit?clientAgentIdFromClient(c):'';
  el.clientId.value=isEdit?(c.id||''):'';
  el.clientName.value=isEdit?(c.name||''):'';
  el.clientPhone.value=isEdit?(c.phone||''):'';
  el.clientEmail.value=isEdit?(c.email||''):'';
  el.clientNif.value=isEdit?(c.nif||''):'';
  el.clientNationality.value=isEdit?(c.nationality||''):'';
  populateClientOriginSelect(isEdit?(c.origin||''):'Website The View');
  el.clientOriginManual.value=isEdit?(c.originManual||''):'';
  toggleClientOriginManual();
  if(el.clientAgent)el.clientAgent.value=aid;
  el.clientAgency.value=isEdit?(c.agency||''):'';
  if(aid)syncClientAgentAgency();
  el.clientBudget.value=isEdit?(c.budget||''):'';
  el.clientStage.value=isEdit?normalizeClientStage(c.stage):'Novo Lead';
  el.clientStage.dataset.original=el.clientStage.value;
  el.clientNextStep.value=isEdit?(c.manualNextStep||c.nextStep||''):'';
  el.clientNextFollowup.value=isEdit?(c.manualNextFollowup||c.nextFollowup||''):'';
  const preferences=cleanPreferences(isEdit?(c.preferences||c.manualPreferences||{}):{});
  el.clientTypologyPreference.value=preferences.typology;
  el.clientFloorPreference.value=preferences.floor;
  el.clientOrientationPreference.value=preferences.orientation;
  el.clientPurchaseObjective.value=preferences.objective;
  el.clientDecisionTime.value=preferences.decisionTime;
  el.clientPreferenceSummary.value=preferences.summary;
  setMulti(el.clientFractions,isEdit?(c.fractions||[]):[]);
  el.clientNotes.value=isEdit?(c.notes||''):'';
  const title=el.clientModal.querySelector('h2');
  if(title)title.textContent=isEdit?'Editar ficha do cliente':'Novo cliente';
  const saveBtn=document.getElementById('saveClient');
  if(saveBtn)saveBtn.textContent=isEdit?'Atualizar cliente':'Guardar cliente';
  el.clientModal.classList.remove('hidden');
  el.clientModal.style.zIndex='50';
  document.body.style.overflow='hidden';
}
function closeClientModal(){el.clientModal.classList.add('hidden');el.clientModal.style.zIndex='';if(el.eventModal&&el.eventModal.classList.contains('hidden'))document.body.style.overflow=''}
async function saveClient(){
  let cid=el.clientId.value||id();
  const existing=client(cid)||{};
  const selectedAgentId=el.clientAgent?.value||'';
  const selectedAgent=agent(selectedAgentId);
  const selectedOrigin=el.clientOrigin.value;
  const originManual=selectedOrigin==='Outro'?el.clientOriginManual.value.trim():'';
  const manualPreferences=cleanPreferences({typology:el.clientTypologyPreference.value,floor:el.clientFloorPreference.value,orientation:el.clientOrientationPreference.value,objective:el.clientPurchaseObjective.value,decisionTime:el.clientDecisionTime.value,summary:el.clientPreferenceSummary.value});
  const selectedStage=normalizeClientStage(el.clientStage.value);
  const stageChanged=selectedStage!==(el.clientStage.dataset.original||'Novo Lead');
  const c={
    ...existing,
    id:cid,
    name:el.clientName.value.trim(),
    phone:el.clientPhone.value.trim(),
    email:el.clientEmail.value.trim(),
    nif:el.clientNif.value.trim(),
    nationality:el.clientNationality.value.trim(),
    origin:selectedOrigin,
    originManual,
    agentId:selectedAgentId,
    agent:selectedAgent?(selectedAgent.name||''):'',
    agency:selectedAgent?(selectedAgent.agency||''):(el.clientAgency.value.trim()),
    budget:num(el.clientBudget.value),
    manualBudget:num(el.clientBudget.value),
    stage:selectedStage,
    stageManual:stageChanged?true:!!existing.stageManual,
    manualStage:stageChanged?selectedStage:(existing.manualStage||''),
    manualNextStep:el.clientNextStep.value.trim(),
    manualNextFollowup:el.clientNextFollowup.value,
    manualFractions:getMulti(el.clientFractions).map(Number),
    fractions:getMulti(el.clientFractions).map(Number),
    manualPreferences,
    preferences:manualPreferences,
    preferencesManuallyEdited:true,
    notes:el.clientNotes.value.trim(),
    updated:new Date().toLocaleString('pt-PT')
  };
  if(!c.name){await notifyUser('Indique o nome do cliente.','Cliente / Lead');return}
  const idx=state.data.clients.findIndex(x=>x.id===cid);
  idx>=0?state.data.clients[idx]=c:state.data.clients.push(c);
  recalculateResumoCliente(cid);
  state.selectedClientId=cid;
  save();
  renderClientSelects();
  if(state.pendingEventClientCreation&&el.eventClientId){
    el.eventClientId.value=cid;
    state.pendingEventClientCreation=false;
  }
  closeClientModal();
  RenderFlow.clientChanged();
}
function openEventModal(eventId='',source=''){
  ensureEventAgentFields();
  ensureEventClientQuickCreate();
  populateAgentSelect();
  renderClientSelects();
  state.editingEventId='';
  state.eventEditSource='';
  const ev=eventId?(state.data.events||[]).find(e=>e.id===eventId):null;
  if(eventId&&!ev){notifyUser('Não encontrei esse evento. Atualize a página e tente novamente.','Evento comercial');return}
  state.editingEventId=ev?.id||'';
  state.eventEditSource=source||'';
  el.eventClientId.value=ev?(ev.clientId||''):(state.selectedClientId||'');
  el.eventType.innerHTML=EVENT_TYPES.map(type=>`<option>${esc(type)}</option>`).join('');
  if(ev?.type&&![...el.eventType.options].some(option=>option.value===ev.type))el.eventType.add(new Option(ev.type,ev.type));
  el.eventType.value=ev?(ev.type||'Outro'):'Pedido de informação recebido';
  el.eventDate.value=ev?(ev.date||today()):today();
  el.eventTime.value=ev?(ev.time||''):'';
  el.eventChannel.value=ev?(ev.channel||''):'';
  el.eventAmount.value=ev?(ev.amount||''):'';
  el.eventInterest.value=ev?(ev.interest||''):'';
  el.eventFollowup.value=ev?(ev.nextStep||ev.followup||''):'';
  el.eventFollowupDate.value=ev?(ev.followupDate||''):'';
  setMulti(el.eventFractions,ev?(ev.fractions||[]):[]);
  renderEventSelectedFractionChips();
  el.eventObjections.value=ev?(ev.objections||''):'';
  el.eventNotes.value=ev?(ev.notes||''):'';
  const preferences=cleanPreferences(ev?.preferences||{});
  el.eventPreferenceTypology.value=preferences.typology;
  el.eventPreferenceBudget.value=ev?(ev.preferenceBudget||''):'';
  el.eventPreferenceFloor.value=preferences.floor;
  el.eventPreferenceOrientation.value=preferences.orientation;
  el.eventPreferenceObjective.value=preferences.objective;
  el.eventPreferenceDecisionTime.value=preferences.decisionTime;
  el.eventPreferenceSummary.value=preferences.summary;
  state.eventPriceDraft={};
  const wa=document.getElementById('eventWithAgent');
  if(wa)wa.checked=!!(ev&&ev.withAgent&&isSaleEvent(ev));
  const agentSel=document.getElementById('eventAgentId');
  if(agentSel)agentSel.value=ev?(ev.agentId||''):'';
  const ct=document.getElementById('eventCommissionType');
  if(ct)ct.value=ev?(ev.commissionType||'percent'):'percent';
  const cv=document.getElementById('eventCommissionValue');
  if(cv)cv.value=ev?(ev.commissionValue||''):'';
  const title=el.eventModal.querySelector('h2');
  if(title)title.textContent=ev?'Editar evento':'Novo evento';
  const saveBtn=document.getElementById('saveEvent');
  if(saveBtn)saveBtn.textContent=ev?'Atualizar evento':'Guardar evento';
  renderEventPriceRows(ev?(ev.informedPrices||[]):[]);
  toggleEventSpecificFields();
  el.eventType.onchange=toggleEventSpecificFields;
  el.eventFractions.onchange=()=>{renderEventSelectedFractionChips();if(el.eventType.value==='Preços informados')renderEventPriceRows()};
  el.eventModal.classList.remove('hidden');
  document.body.style.overflow='hidden';
}
function closeEventModal(){
  el.eventModal.classList.add('hidden');
  state.editingEventId='';
  state.eventEditSource='';
  const title=el.eventModal.querySelector('h2');
  if(title)title.textContent='Novo evento';
  const saveBtn=document.getElementById('saveEvent');
  if(saveBtn)saveBtn.textContent='Guardar evento';
  document.body.style.overflow='';
}
async function saveEvent(){
  const cid=el.eventClientId.value;
  if(!cid&&el.eventType.value!=='Alteração de estado'){await notifyUser('Escolha um cliente.','Evento comercial');return}
  const frs=getMulti(el.eventFractions).map(Number);
  const type=el.eventType.value;
  if(eventRequiresFractions(type)&&!frs.length){await notifyUser('Escolha pelo menos uma fração.','Evento comercial');return}
  const editingId=state.editingEventId||'';
  const returnSource=state.eventEditSource||'';
  const oldEv=editingId?(state.data.events||[]).find(ev=>ev.id===editingId):null;
  if(editingId&&!oldEv){await notifyUser('Não encontrei o evento original. Atualize a página e tente novamente.','Evento comercial');return}
  const ev=buildEventFromForm(cid,frs,editingId);
  if(type==='Preços informados'&&ev.informedPrices.some(item=>!item.informedPrice)){await notifyUser('Indique o preço informado para cada fração.','Preços informados');return}
  const reservationCandidates=isAbandonmentEvent(ev)&&!frs.length?state.fractions.map(f=>f.number):frs;
  const activeReservations=reservationCandidates.filter(n=>{const effect=commercialEffectForFraction(n);return effect?.status==='Reservado'&&effect.event.clientId===cid});
  if(isReservationCancellationEvent(ev)&&activeReservations.length){
    if(!await confirmUser(`A reserva será cancelada e ${activeReservations.map(n=>'Apt. '+n).join(', ')} voltará ao estado disponível. Confirmar?`,'Cancelar reserva'))return;
    ev.releaseReservation=true;
  }
  if(isAbandonmentEvent(ev)&&activeReservations.length){
    ev.releaseReservation=await confirmUser(`Este cliente tem reserva ativa em ${activeReservations.map(n=>'Apt. '+n).join(', ')}. Pretende libertar a reserva ao registar a desistência?`,'Desistência com reserva');
    if(ev.releaseReservation)ev.fractions=uniqNum([...(ev.fractions||[]),...activeReservations]);
  }
  if(oldEv){
    const oldSnapshot=JSON.parse(JSON.stringify(oldEv));
    if(hasCriticalCommercialEventChange(oldSnapshot,ev)){
      const msg='Está a alterar campos com efeitos comerciais: tipo, frações, valor, agente ou comissão.\n\nAo confirmar, os estados das frações, preço de reserva/venda e comissão serão recalculados para refletir o evento editado.';
      if(!await confirmUser(msg,'Atualizar evento comercial'))return;
    }
    replaceEventAndReapplyBusinessRules(oldSnapshot,ev);
  }else{
    if(isReservationEvent(ev)||isSaleEvent(ev)){
      const action=isSaleEvent(ev)?'venda':'reserva';
      if(!await confirmUser(`Confirmar ${action} de ${frs.map(n=>'Apt. '+n).join(', ')} para ${client(cid)?.name||'o cliente selecionado'}${ev.amount?' pelo valor de '+money(ev.amount):''}?`,`Confirmar ${action}`))return;
    }
    applyEventBusinessRules(ev);
  }
  if(returnSource==='events')state.salesSubtab='events';
  if(returnSource==='client'){state.salesSubtab='clients';state.selectedClientId=ev.clientId}
  save();
  closeEventModal();
  RenderFlow.eventChanged();
}
function buildEventFromForm(cid,frs,eventId=''){
  const existing=eventId?(state.data.events||[]).find(ev=>ev.id===eventId)||{}:{};
  collectEventPriceDraft();
  const withAgent=!!document.getElementById('eventWithAgent')?.checked&&isSaleEvent({type:el.eventType.value});
  const commissionType=document.getElementById('eventCommissionType')?.value||'percent';
  const commissionValue=num(document.getElementById('eventCommissionValue')?.value||0);
  const saleAmount=num(el.eventAmount.value);
  const commissionAmount=withAgent?calculateCommission(saleAmount,commissionType,commissionValue):0;
  const preferences=cleanPreferences({typology:el.eventPreferenceTypology.value,floor:el.eventPreferenceFloor.value,orientation:el.eventPreferenceOrientation.value,objective:el.eventPreferenceObjective.value,decisionTime:el.eventPreferenceDecisionTime.value,summary:el.eventPreferenceSummary.value});
  const informedPrices=el.eventType.value==='Preços informados'?frs.map(n=>state.eventPriceDraft?.[n]||{fraction:n,officialPrice:finalPrice(getF(n)),informedPrice:0,observation:''}):[];
  const nextStep=el.eventFollowup.value.trim();
  return {...existing,id:eventId||id(),clientId:cid,type:el.eventType.value,date:el.eventDate.value||today(),time:el.eventTime.value,channel:el.eventChannel.value,amount:saleAmount,interest:el.eventInterest.value,nextStep,followup:nextStep,followupDate:el.eventFollowupDate.value,fractions:frs,preferences,preferenceBudget:num(el.eventPreferenceBudget.value),informedPrices,objections:el.eventObjections.value.trim(),notes:el.eventNotes.value.trim(),withAgent,agentId:withAgent?(document.getElementById('eventAgentId')?.value||''):'',commissionType:withAgent?commissionType:'',commissionValue:withAgent?commissionValue:0,commissionAmount};
}
function exportPdf(){
  const fs=state.fractions.filter(f=>state.selected.has(f.number)&&statusOf(f)==='Disponível').sort((a,b)=>a.number-b.number);
  if(!fs.length){notifyUser('Selecione pelo menos uma fração disponível.','Propostas Clientes');return}
  const include=el.proposalIncludePlants.checked;
  openPresentationPriceModal(fs, include);
}

function openPresentationPriceModal(fs, includePlants){
  const existing=document.getElementById('presentationPriceModal');
  if(existing) existing.remove();

  const modal=document.createElement('div');
  modal.id='presentationPriceModal';
  modal.className='modal-backdrop';
  modal.innerHTML=`
    <div class="modal presentation-price-modal">
      <button class="modal-close" type="button" data-close-price-modal>×</button>
      <p class="eyebrow eyebrow--dark">Propostas Clientes</p>
      <h2>Definir preços a apresentar</h2>
      <p class="muted">Estes valores serão usados apenas neste PDF. Não alteram os preços finais, o histórico, o dashboard nem a Google Sheet.</p>

      <label class="field presentation-language-field">
        <span>Idioma do PDF</span>
        <select id="presentationPdfLanguage">
          <option value="pt-en" selected>PT/ENG</option>
          <option value="pt-fr">PT/FR</option>
        </select>
      </label>

      <div class="table-wrap presentation-price-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fração</th>
              <th>Tipologia</th>
              <th class="num-col">Preço final definido</th>
              <th class="num-col">Preço a apresentar no PDF</th>
            </tr>
          </thead>
          <tbody>
            ${fs.map(f=>`
              <tr>
                <td><strong>${esc(f.name)}</strong><div class="muted small">Piso ${esc(f.floorLabel)} · ${esc(f.orientation||'—')}</div></td>
                <td>${esc(f.typology)}</td>
                <td class="num-col">${money(finalPrice(f))}</td>
                <td class="num-col">
                  <input class="presentation-price-input" type="number" min="0" step="1000" value="${Math.round(finalPrice(f))}" data-presentation-price="${f.number}" />
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="modal-actions">
        <button class="ghost-button" type="button" data-close-price-modal>Cancelar</button>
        <button class="primary-button" type="button" data-generate-presentation-pdf>Gerar PDF com estes preços</button>
      </div>
    </div>
  `;

  const style=document.createElement('style');
  style.textContent=`
    #presentationPriceModal .presentation-price-modal{width:min(980px,100%);}
    #presentationPriceModal .presentation-language-field{max-width:220px;margin-top:16px;}
    #presentationPriceModal .presentation-price-table-wrap{max-height:55vh;overflow:auto;margin-top:16px;}
    #presentationPriceModal .presentation-price-input{width:150px;text-align:right;}
  `;
  modal.appendChild(style);
  document.body.appendChild(modal);
  document.body.style.overflow='hidden';

  const close=()=>{
    modal.remove();
    document.body.style.overflow='';
  };

  modal.querySelectorAll('[data-close-price-modal]').forEach(btn=>btn.addEventListener('click',close));
  modal.addEventListener('click',e=>{if(e.target===modal)close()});

  modal.querySelector('[data-generate-presentation-pdf]').addEventListener('click',()=>{
    const priceMap={};
    const pdfLanguage=modal.querySelector('#presentationPdfLanguage')?.value||'pt-en';
    modal.querySelectorAll('[data-presentation-price]').forEach(input=>{
      priceMap[Number(input.dataset.presentationPrice)]=num(input.value)||0;
    });
    close();
    generateClientPresentationPdf(fs, includePlants, priceMap, pdfLanguage);
  });
}

function generateClientPresentationPdf(fs, include, presentationPrices={}, language='pt-en'){
  const w=window.open('','_blank');
  if(!w){notifyUser('Autorize pop-ups para gerar o PDF.','Propostas Clientes');return}

  const publicArea=v=>Math.max(0,Math.floor((+v||0)-2));
  const presentationPriceFor=f=>presentationPrices[f.number]||finalPrice(f);
  const ptDisclaimer='Documento meramente informativo e de apresentação comercial. Os valores, áreas e condições aqui indicados não constituem proposta contratual, reserva, promessa de venda ou proposta oficial, estando sujeitos a confirmação e aprovação pela entidade promotora.';
  const copies={
    'pt-fr':{
      price:'Preço de apresentação / Prix de présentation',
      abp:'ABP aprox. / Surface brute privative approximative',
      terrace:'Varanda/Terraço aprox. / Surface balcon/terrasse approximative',
      total:'Área total aprox. / Surface totale approximative',
      typology:'Tipologia / Type de bien',
      missing:'Planta indisponível para esta fração. / Plan indisponible pour cette unité.',
      disclaimer:ptDisclaimer+'\n\nCe document est fourni uniquement à titre informatif et de présentation commerciale. Les prix, surfaces et conditions indiqués ne constituent ni une proposition contractuelle, ni une réservation, ni une promesse de vente, ni une offre officielle, et restent soumis à confirmation et approbation par le promoteur.'
    },
    'pt-en':{
      price:'Preço de apresentação / Presentation Price',
      abp:'ABP aprox. / Approx. Gross Private Area',
      terrace:'Varanda/Terraço aprox. / Approx. Balcony/Terrace Area',
      total:'Área total aprox. / Approx. Total Area',
      typology:'Tipologia / Unit Type',
      missing:'Planta indisponível para esta fração. / Floor plan unavailable for this unit.',
      disclaimer:ptDisclaimer+'\n\nThis document is for informational and commercial presentation purposes only. The prices, areas and conditions shown herein do not constitute a contractual proposal, reservation, promissory sale agreement or official offer, and are subject to confirmation and approval by the developer.'
    }
  };
  const copy=copies[language]||copies['pt-en'];

  const pages=fs.map((f,i)=>{
    const plant=(PLANT_MAP[f.number]&&PLANT_MAP[f.number].image)?PLANT_MAP[f.number].image:'';
    const abpPublic=publicArea(f.abp);
    const extPublic=publicArea(f.terrace);
    const totalPublic=abpPublic+extPublic;

    return `<section class="pdf-page ${i===fs.length-1?'last':''}">
      <header class="pdf-header">
        <div>
          <p class="pdf-eyebrow">The View Olhão</p>
          <h1>${esc(f.name)}</h1>
          <p class="pdf-subtitle">${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation||'—')}</p>
        </div>
        <div class="pdf-price"><span>${esc(copy.price)}</span><strong>${money(presentationPriceFor(f))}</strong></div>
      </header>

      <div class="pdf-cards">
        <article><span>${esc(copy.abp)}</span><strong>${abpPublic} m²</strong></article>
        <article><span>${esc(copy.terrace)}</span><strong>${extPublic} m²</strong></article>
        <article><span>${esc(copy.total)}</span><strong>${totalPublic} m²</strong></article>
        <article><span>${esc(copy.typology)}</span><strong>${esc(f.typology)}</strong></article>
      </div>

      ${include?`<div class="pdf-plant-wrap">${plant?`<img class="pdf-plant" src="${plant}" />`:`<div class="pdf-missing">${esc(copy.missing)}</div>`}</div>`:''}

      <footer class="pdf-footer">
        <p>${esc(copy.disclaimer).replace(/\n/g,'<br>')}</p>
      </footer>
    </section>`;
  }).join('');

  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>The View · Proposta Cliente</title>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap');
  @page{size:A4 portrait;margin:8mm}
  *{box-sizing:border-box}
  body{font-family:'Montserrat',Arial,sans-serif;margin:0;color:#0f2443;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pdf-page{min-height:calc(297mm - 16mm);page-break-after:always;display:flex;flex-direction:column;gap:6mm}
  .pdf-page.last{page-break-after:auto}
  .pdf-header{display:grid;grid-template-columns:1fr auto;gap:10mm;align-items:start;border-bottom:1px solid #d9e1eb;padding-bottom:4mm}
  .pdf-eyebrow{margin:0 0 4mm;text-transform:uppercase;letter-spacing:.26em;font-size:9px;font-weight:700;color:#9a7440}
  h1{font-family:'Cormorant Garamond','Times New Roman',serif;margin:0;font-size:29pt;line-height:.95;font-weight:700;letter-spacing:.01em;color:#0e2444}
  .pdf-subtitle{margin:3mm 0 0;font-size:10.5pt;color:#435675;font-weight:500}
  .pdf-price{min-width:42mm;text-align:right;background:#f5f7fa;border:1px solid #dbe4ef;border-radius:12px;padding:5mm 6mm}
  .pdf-price span{display:block;font-size:8.5pt;text-transform:uppercase;letter-spacing:.08em;color:#63748d;margin-bottom:3mm}
  .pdf-price strong{font-size:19pt;color:#0e2444;white-space:nowrap}
  .pdf-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}
  .pdf-cards article{background:#f8fafc;border:1px solid #e1e9f2;border-radius:10px;padding:3.5mm}
  .pdf-cards span{display:block;font-size:8.5pt;color:#63748d;margin-bottom:2mm}
  .pdf-cards strong{display:block;font-size:12pt;color:#0e2444}
  .pdf-plant-wrap{flex:1 1 auto;min-height:172mm;display:flex;justify-content:center;align-items:center;border:1px solid #e1e9f2;border-radius:14px;overflow:hidden;padding:2mm;background:#fff}
  .pdf-plant{width:100%;height:100%;max-width:100%;max-height:182mm;object-fit:contain;display:block}
  .pdf-missing{color:#63748d;font-size:11pt}
  .pdf-footer{margin-top:auto;border-top:1px solid #d9e1eb;padding-top:3mm}
  .pdf-footer p{margin:0;color:#62738a;font-size:7.6pt;line-height:1.35;text-align:justify}
  @media print{body{background:#fff}.pdf-page{break-after:page}.pdf-page.last{break-after:auto}}
  </style></head><body>${pages}
  <script>
  const imgs=[...document.images];
  let pending=imgs.length;
  function done(){setTimeout(()=>{window.focus();window.print()},500)}
  if(!pending) done();
  imgs.forEach(img=>{
    if(img.complete){pending--; if(pending<=0) done()}
    else {img.onload=img.onerror=()=>{pending--; if(pending<=0) done()}}
  });
  </script></body></html>`);
  w.document.close();
}

function filteredProposal(){return filterFractions(state.pf)}
function filteredPrices(){return filterFractions(state.rf)}
function filteredPrice(){return filteredPrices()}
function filterFractions(fil={}){
  const q=norm(fil.search||'');
  return state.fractions.filter(f=>
    ((fil.typology||'all')==='all'||f.typology===fil.typology) &&
    ((fil.floor||'all')==='all'||String(f.floorLabel)===String(fil.floor)) &&
    ((fil.status||'all')==='all'||statusOf(f)===fil.status) &&
    (!q||norm([f.name,f.typology,f.floorLabel,f.orientation,statusOf(f)].join(' ')).includes(q))
  );
}

function syncProposal(){state.pf={search:el.proposalSearch.value,typology:el.proposalTypology.value,floor:el.proposalFloor.value,status:el.proposalStatus.value};renderProposals()}function syncPrice(){state.rf={search:el.priceSearch.value,typology:el.priceTypology.value,floor:el.priceFloor.value,status:el.priceStatus.value};renderPrices()}
function metrics(n){const evs=state.data.events.filter(e=>(e.fractions||[]).includes(n));const visits=evs.filter(e=>['Visita','Reunião realizada'].includes(e.type)).length;const interested=evs.filter(e=>['Interessado','Reunião com cliente','Preferências recebidas','Frações apresentadas'].includes(e.type)).length;const proposalTypes=['Proposta recebida','Contra-proposta recebida','Contra-proposta enviada','Reserva','Reserva efetuada','Venda','Venda concluída'];const offers=evs.filter(e=>proposalTypes.includes(e.type)&&e.amount).map(e=>e.amount);const last=evs.slice().sort((a,b)=>eventSortKey(a).localeCompare(eventSortKey(b))).pop();return{visits,interested,proposals:evs.filter(e=>proposalTypes.includes(e.type)).length,lastOffer:offers[offers.length-1]||0,lastAction:last?`${last.type} · ${last.date}`:''}}
function ensureHistory(){let changed=false;state.data.priceHistory=state.data.priceHistory||{};state.fractions.forEach(f=>{if(!state.data.priceHistory[f.number]){state.data.priceHistory[f.number]=[{date:today(),price:finalPrice(f),reason:'Preço inicial definido'}];changed=true}});return changed}
function getF(n){return state.fractions.find(f=>f.number===n)}function client(id){return state.data.clients.find(c=>c.id===id)}function finalPrice(f){return f?(+state.data.finalPrices[f.number]||SUG[f.number]||f.price):0}function statusOf(f){return f?state.data.statuses[f.number]||'Disponível':'Disponível'}function salePrice(f){return f?(+state.data.salePrices[f.number]||0):0}function historyOf(f){return f?(state.data.priceHistory[f.number]||[]):[]}function normalizeData(d={}){return{finalPrices:d.finalPrices||{},statuses:d.statuses||{},salePrices:d.salePrices||{},priceHistory:d.priceHistory||{},clients:d.clients||[],events:d.events||[],agents:d.agents||[],saleCommissions:d.saleCommissions||{},unavailableReasons:d.unavailableReasons||{},statusEventIds:d.statusEventIds||{},salePriceEventIds:d.salePriceEventIds||{},priceMigrationKey:d.priceMigrationKey||'',crmMigrationKey:d.crmMigrationKey||''}}
function loadDataLocal(){try{return normalizeData(JSON.parse(localStorage.getItem(KEY))||{})}catch{return normalizeData()}}


function hasBusinessData(d){
  d = normalizeData(d || {});
  return Object.keys(d.finalPrices||{}).length>0 ||
    Object.keys(d.statuses||{}).length>0 ||
    Object.keys(d.salePrices||{}).length>0 ||
    Object.keys(d.priceHistory||{}).length>0 ||
    Object.keys(d.saleCommissions||{}).length>0 ||
    Object.keys(d.unavailableReasons||{}).length>0 ||
    (d.clients||[]).length>0 ||
    (d.events||[]).length>0 ||
    (d.agents||[]).length>0;
}
function loadRemoteJsonp(){
  return new Promise((resolve, reject)=>{
    if(!REMOTE_URL){ resolve(null); return; }
    const cb='theViewJsonp_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const sep=REMOTE_URL.includes('?')?'&':'?';
    const s=document.createElement('script');
    const timer=setTimeout(()=>{ cleanup(); reject(new Error('Tempo esgotado ao ler Google Sheets')); }, 12000);
    function cleanup(){ clearTimeout(timer); try{ delete window[cb]; }catch{} if(s.parentNode) s.parentNode.removeChild(s); }
    window[cb]=(data)=>{ cleanup(); resolve(data); };
    s.onerror=()=>{ cleanup(); reject(new Error('Erro ao carregar JSONP Google Sheets')); };
    s.src=REMOTE_URL+sep+'action=load&callback='+encodeURIComponent(cb)+'&ts='+Date.now();
    document.head.appendChild(s);
  });
}

async function loadRemoteData(){
  if(!REMOTE_URL) return;
  setStatus('A sincronizar com Google Sheets…');

  const localData = loadDataLocal();
  const localHasData = hasBusinessData(localData);

  const j = await loadRemoteJsonp();
  if(j && j.ok && j.data){
    const remoteData = normalizeData(j.data);
    const remoteHasData = hasBusinessData(remoteData);

    // Proteção contra perda de dados:
    // se a Google Sheet ainda estiver vazia, não deixa que ela apague o que acabou de ser criado no navegador.
    if(!remoteHasData && localHasData){
      state.data = localData;
      saveLocalOnly();
      setStatus('Google Sheets vazio · dados locais preservados');
      return {shouldSave:true};
    }

    if(remoteHasData){
      backupLocalBeforeRemoteLoad(localData, remoteData);
      state.data = remoteData;
      saveLocalOnly();
      setStatus('Dados sincronizados com Google Sheets');
      return {shouldSave:false};
    }

    state.data = localData;
    saveLocalOnly();
    setStatus('Google Sheets vazio · sem dados comerciais remotos');
    return {shouldSave:false};
  }

  if(j && j.error) throw new Error(j.error);
  throw new Error('Resposta inválida do Google Sheets');
}
let saveTimer=null;
function saveLocalOnly(){
  localStorage.setItem(KEY, JSON.stringify(state.data));
}
function backupLocalBeforeRemoteLoad(localData, remoteData){
  try{
    const local=normalizeData(localData||{}),remote=normalizeData(remoteData||{});
    if(!hasBusinessData(local)||JSON.stringify(local)===JSON.stringify(remote))return;
    localStorage.setItem(LOCAL_REMOTE_BACKUP_KEY,JSON.stringify({
      createdAt:new Date().toISOString(),
      reason:'Backup automático antes de substituir dados locais por dados do Google Sheets',
      data:local
    }));
  }catch(err){
    console.warn('Falha ao criar backup local antes da sincronização remota',err);
  }
}
function save(){
  saveLocalOnly();
  if(REMOTE_URL){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(syncRemote,300);
  }
}
async function syncRemote(){
  if(!REMOTE_URL) return;
  const payload = JSON.stringify({action:'save',data:state.data,updatedAt:new Date().toISOString()});

  try{
    setStatus('A guardar no Google Sheets…');

    // Método principal: POST por formulário oculto.
    // Isto evita bloqueios CORS/no-cors e entrega o payload ao Apps Script em e.parameter.payload.
    postToAppsScriptForm(payload);

    // Mantém também uma tentativa fetch em segundo plano. Se o browser bloquear, o formulário já fez o envio.
    try{
      await fetch(REMOTE_URL,{
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:payload,
        keepalive:true
      });
    }catch(fetchErr){
      console.warn('Fetch no-cors falhou; formulário oculto já foi enviado.', fetchErr);
    }

    setStatus('Enviado para Google Sheets');
  }catch(e){
    console.warn('Falha ao guardar Google Sheets',e);
    setStatus('Falha ao sincronizar · dados guardados localmente');
  }
}

function postToAppsScriptForm(payload){
  const iframeName = 'gsheets_sync_iframe';
  let iframe = document.getElementById(iframeName);
  if(!iframe){
    iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.id = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = REMOTE_URL;
  form.target = iframeName;
  form.style.display = 'none';

  const input = document.createElement('textarea');
  input.name = 'payload';
  input.value = payload;
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();

  setTimeout(()=>{ try{ form.remove(); }catch(e){} }, 1000);
}

function appDialog({title='Aviso',message='',confirmText='OK',cancelText='',input=false,defaultValue='',danger=false}={}){
  return new Promise(resolve=>{
    const existing=document.getElementById('appDialogModal');
    if(existing)existing.remove();
    const previousOverflow=document.body.style.overflow;
    const modal=document.createElement('div');
    modal.id='appDialogModal';
    modal.className='modal-backdrop';
    modal.style.zIndex='160';
    modal.innerHTML=`<div class="modal app-dialog-modal">
      <button class="modal-close" type="button" data-dialog-cancel>×</button>
      <p class="eyebrow eyebrow--dark">The View</p>
      <h2>${esc(title)}</h2>
      <p class="muted">${esc(message).replace(/\n/g,'<br>')}</p>
      ${input?`<label class="field"><span>Resposta</span><input id="appDialogInput" value="${attr(defaultValue)}" /></label>`:''}
      <div class="modal-actions">
        ${cancelText?`<button class="ghost-button" type="button" data-dialog-cancel>${esc(cancelText)}</button>`:''}
        <button class="primary-button ${danger?'danger':''}" type="button" data-dialog-confirm>${esc(confirmText)}</button>
      </div>
    </div>`;
    const style=document.createElement('style');
    style.textContent='#appDialogModal .app-dialog-modal{width:min(520px,100%)}#appDialogModal .field{margin-top:16px}';
    modal.appendChild(style);
    document.body.appendChild(modal);
    document.body.style.overflow='hidden';
    const inputEl=modal.querySelector('#appDialogInput');
    if(inputEl){inputEl.focus();inputEl.select();}
    const close=value=>{
      modal.remove();
      document.body.style.overflow=previousOverflow;
      resolve(value);
    };
    modal.querySelectorAll('[data-dialog-cancel]').forEach(btn=>btn.addEventListener('click',()=>close(input?null:false)));
    modal.querySelector('[data-dialog-confirm]').addEventListener('click',()=>close(input?(inputEl?.value||''):true));
    modal.addEventListener('click',e=>{if(e.target===modal)close(input?null:false)});
    modal.addEventListener('keydown',e=>{
      if(e.key==='Escape')close(input?null:false);
      if(e.key==='Enter'&&!e.shiftKey)close(input?(inputEl?.value||''):true);
    });
  });
}
function notifyUser(message,title='Aviso'){return appDialog({title,message,confirmText:'OK'});}
function confirmUser(message,title='Confirmar'){return appDialog({title,message,confirmText:'Confirmar',cancelText:'Cancelar',danger:true});}
function promptUser(message,defaultValue='',title='Informação'){return appDialog({title,message,input:true,defaultValue,confirmText:'Guardar',cancelText:'Cancelar'});}

function exportAll(){
  const rows = state.fractions.map(f=>({
    Apartamento:f.name,
    Tipologia:f.typology,
    Piso:f.floorLabel,
    Orientacao:f.orientation,
    PrecoInicial:f.price,
    PrecoFinal:finalPrice(f),
    Estado:statusOf(f),
    PrecoVendaReserva:salePrice(f)||'',
    ABP:f.abp,
    Exterior:f.terrace,
    AreaTotal:f.totalArea
  }));
  downloadJson(rows, 'the-view-dados-comerciais.json');
}

function exportPriceHistory(){
  const rows = [];
  state.fractions.forEach(f=>{
    historyOf(f).forEach(h=>rows.push({
      Apartamento:f.name,
      Data:h.date,
      Preco:h.price,
      PrecoAnterior:h.oldPrice||'',
      Razao:h.reason||''
    }));
  });
  downloadJson(rows, 'the-view-historico-precos.json');
}

function exportSalesEvents(){
  const rows = state.data.events.map(e=>({
    Data:e.date,
    Hora:e.time||'',
    Tipo:e.type,
    Cliente:client(e.clientId)?.name||'',
    Valor:e.amount||'',
    Fracoes:(e.fractions||[]).map(n=>'Apartamento '+n).join(', '),
    Notas:e.notes||'',
    Objecoes:e.objections||''
  }));
  downloadJson(rows, 'the-view-eventos-vendas.json');
}

async function resetLocal(){
  if(await confirmUser('Apagar dados locais deste navegador? Os dados da Google Sheet não serão apagados.','Repor dados locais')){
    localStorage.removeItem(KEY);
    state.data=loadDataLocal();
    ensureHistory();
    renderAll();
    setStatus('Dados locais repostos');
  }
}

function downloadJson(rows, filename){
  const blob = new Blob([JSON.stringify(rows, null, 2)], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


function fill(sel,vals,allLabel,labelFn){sel.innerHTML=vals.map(v=>`<option value="${attr(v)}">${v==='all'?allLabel:esc(labelFn?labelFn(v):v)}</option>`).join('')}function fillMulti(sel,vals){sel.innerHTML=vals.map(([v,l])=>`<option value="${attr(v)}">${esc(l)}</option>`).join('')}function setMulti(sel,vals){[...sel.options].forEach(o=>o.selected=vals.map(String).includes(o.value))}function getMulti(sel){return[...sel.selectedOptions].map(o=>o.value)}function row(a,b){return`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`}function kpi(a,b,c){return`<article class="kpi-card"><span>${esc(a)}</span><strong>${esc(b)}</strong><small>${esc(c||'')}</small></article>`}function badge(st){return'badge '+(st==='Vendido'||st==='Indisponível'?'badge--sold':st==='Reservado'?'badge--reserved':'badge--available')}function setStatus(t){el.dataStatus.textContent=t}function showError(t){el.globalErrorBox.textContent=t;el.globalErrorBox.classList.remove('hidden')}function num(v){if(typeof v==='number'&&isFinite(v))return v;const n=Number(safe(v).replace(/\s+/g,'').replace(/€/g,'').replace(/m²/gi,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(/,(?=\d{2,}$)/g,'.').replace(/[^0-9.-]/g,''));return isFinite(n)?n:0}function floor(v){if(typeof v==='number')return v;const m=safe(v).match(/-?\d+/);return m?+m[0]:null}function nat(s,fb=null){const m=safe(s).match(/\d+/);return m?+m[0]:fb}function pretty(v){return safe(v).replace(/\s+/g,' ').replace(/DUPLEX/i,'Duplex').replace(/DUP$/i,'Duplex')}function safe(v){return v==null?'':String(v).trim()}function norm(v){return safe(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}function uniq(a){return[...new Set(a.filter(Boolean))].sort((x,y)=>String(x).localeCompare(String(y),'pt-PT',{numeric:true,sensitivity:'base'}))}function uniqNum(a){return[...new Set(a.map(Number).filter(Boolean))].sort((x,y)=>x-y)}function sum(a){return a.reduce((x,y)=>x+(+y||0),0)}function money(v,d=0){return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',minimumFractionDigits:d,maximumFractionDigits:d}).format(+v||0)}function area(v){return`${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2}).format(+v||0)} m²`}function today(){return new Date().toISOString().slice(0,10)}function id(){return String(Date.now())+String(Math.random()).slice(2,7)}function esc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}function attr(v){return esc(v).replace(/`/g,'&#096;')}
})();
