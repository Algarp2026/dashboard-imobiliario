"use strict";
(()=>{
const KEY='theView.crmCommercial.v2',LOCAL_REMOTE_BACKUP_KEY=KEY+'.backupBeforeRemoteLoad',CONFIG=window.THE_VIEW_CONFIG||{},REMOTE_URL=(CONFIG.GOOGLE_SHEETS_WEBAPP_URL||'').trim();
const PLANT_MAP={"1": {"image": "plantas/planta-apartamento-01.jpg", "pdf": "plantas/planta-apartamento-01.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_01.pdf"}, "2": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "10": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "17": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "24": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "31": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "3": {"image": "plantas/planta-apartamento-03.jpg", "pdf": "plantas/planta-apartamento-03.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_03.pdf"}, "4": {"image": "plantas/planta-apartamento-04.jpg", "pdf": "plantas/planta-apartamento-04.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_04.pdf"}, "5": {"image": "plantas/planta-apartamento-05.jpg", "pdf": "plantas/planta-apartamento-05.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_05.pdf"}, "6": {"image": "plantas/planta-apartamento-06.jpg", "pdf": "plantas/planta-apartamento-06.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_06.pdf"}, "7": {"image": "plantas/planta-apartamento-07-15.jpg", "pdf": "plantas/planta-apartamento-07-15.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf"}, "15": {"image": "plantas/planta-apartamento-07-15.jpg", "pdf": "plantas/planta-apartamento-07-15.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf"}, "8": {"image": "plantas/planta-apartamento-08.jpg", "pdf": "plantas/planta-apartamento-08.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_08.pdf"}, "9": {"image": "plantas/planta-apartamento-09-16.jpg", "pdf": "plantas/planta-apartamento-09-16.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf"}, "16": {"image": "plantas/planta-apartamento-09-16.jpg", "pdf": "plantas/planta-apartamento-09-16.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf"}, "11": {"image": "plantas/planta-apartamento-11.jpg", "pdf": "plantas/planta-apartamento-11.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_11.pdf"}, "12": {"image": "plantas/planta-apartamento-12.jpg", "pdf": "plantas/planta-apartamento-12.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_12.pdf"}, "13": {"image": "plantas/planta-apartamento-13.jpg", "pdf": "plantas/planta-apartamento-13.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_13.pdf"}, "14": {"image": "plantas/planta-apartamento-14.jpg", "pdf": "plantas/planta-apartamento-14.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_14.pdf"}, "18": {"image": "plantas/planta-apartamento-18.jpg", "pdf": "plantas/planta-apartamento-18.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_18.pdf"}, "19": {"image": "plantas/planta-apartamento-19.jpg", "pdf": "plantas/planta-apartamento-19.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_19.pdf"}, "20": {"image": "plantas/planta-apartamento-20.jpg", "pdf": "plantas/planta-apartamento-20.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_20.pdf"}, "21": {"image": "plantas/planta-apartamento-21.jpg", "pdf": "plantas/planta-apartamento-21.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_21.pdf"}, "22": {"image": "plantas/planta-apartamento-22.jpg", "pdf": "plantas/planta-apartamento-22.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_22.pdf"}, "23": {"image": "plantas/planta-apartamento-23-30.jpg", "pdf": "plantas/planta-apartamento-23-30.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf"}, "30": {"image": "plantas/planta-apartamento-23-30.jpg", "pdf": "plantas/planta-apartamento-23-30.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf"}, "25": {"image": "plantas/planta-apartamento-25.jpg", "pdf": "plantas/planta-apartamento-25.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_25.pdf"}, "26": {"image": "plantas/planta-apartamento-26.jpg", "pdf": "plantas/planta-apartamento-26.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_26.pdf"}, "27": {"image": "plantas/planta-apartamento-27.jpg", "pdf": "plantas/planta-apartamento-27.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_27.pdf"}, "28": {"image": "plantas/planta-apartamento-28.jpg", "pdf": "plantas/planta-apartamento-28.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_28.pdf"}, "29": {"image": "plantas/planta-apartamento-29.jpg", "pdf": "plantas/planta-apartamento-29.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_29.pdf"}, "32": {"image": "plantas/planta-apartamento-32.jpg", "pdf": "plantas/planta-apartamento-32.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_32.pdf"}, "33": {"image": "plantas/planta-apartamento-33.jpg", "pdf": "plantas/planta-apartamento-33.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_33.pdf"}, "34": {"image": "plantas/planta-apartamento-34.jpg", "pdf": "plantas/planta-apartamento-34.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_34.pdf"}, "35": {"image": "plantas/planta-apartamento-35.jpg", "pdf": "plantas/planta-apartamento-35.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_35.pdf"}, "36": {"image": "plantas/planta-apartamento-36.jpg", "pdf": "plantas/planta-apartamento-36.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_36.pdf"}, "37": {"image": "plantas/planta-apartamento-37.jpg", "pdf": "plantas/planta-apartamento-37.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_37.pdf"}, "38": {"image": "plantas/planta-apartamento-38.jpg", "pdf": "plantas/planta-apartamento-38.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_38.pdf"}, "39": {"image": "plantas/planta-apartamento-39.jpg", "pdf": "plantas/planta-apartamento-39.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_39.pdf"}};
const ORIENT={1:'Sul/Este',2:'Sul/Oeste',3:'Oeste',4:'Oeste',5:'Oeste',6:'Este/Oeste',7:'Este',8:'Este',9:'Sul/Este',10:'Sul/Oeste',11:'Oeste',12:'Oeste',13:'Oeste',14:'Este/Oeste',15:'Este',16:'Sul/Este',17:'Sul/Oeste',18:'Oeste',19:'Oeste',20:'Oeste',21:'Este/Oeste',22:'Este',23:'Sul/Este',24:'Sul/Oeste',25:'Oeste',26:'Este/Oeste',27:'Oeste',28:'Este/Oeste',29:'Este',30:'Sul/Este',31:'Sul/Oeste',32:'Oeste',33:'Este/Oeste',34:'Este/Oeste',35:'Este/Oeste',36:'Sul/Este',37:'Sul/Oeste',38:'Oeste',39:'Este/Oeste'};
const SUG={1:545000,2:600000,3:390000,4:475000,5:450000,6:615000,7:535000,8:390000,9:800000,10:620000,11:400000,12:440000,13:420000,14:600000,15:580000,16:900000,17:640000,18:425000,19:360000,20:410000,21:560000,22:600000,23:850000,24:700000,25:440000,26:630000,27:440000,28:500000,29:485000,30:950000,31:720000,32:455000,33:570000,34:645000,35:555000,36:1450000,37:1000000,38:470000,39:1000000};
const UPDATED_INITIAL_PRICES={1:545000,2:600000,3:390000,4:475000,5:450000,6:615000,7:535000,8:390000,9:800000,10:620000,11:400000,12:440000,13:420000,14:600000,15:580000,16:900000,17:640000,18:425000,19:360000,20:410000,21:560000,22:600000,23:850000,24:700000,25:440000,26:630000,27:440000,28:500000,29:485000,30:950000,31:720000,32:455000,33:570000,34:645000,35:555000,36:1450000,37:1000000,38:470000,39:1000000};
const STATUS=['Disponível','Reservado','Vendido','Indisponível'];
const STAGES=['Novo lead','Contactado','Visitou','Em negociação','Reserva','Vendido','Desistiu'];
const state={rows:[],fractions:[],tab:'proposals',selected:new Set(),selectedClientId:'',pf:{search:'',typology:'all',floor:'all',status:'all'},rf:{search:'',typology:'all',floor:'all',status:'all'},cf:{search:'',stage:'all'},selectedAgentId:'',pendingEventClientCreation:false,pendingClientAgentCreation:false,data:loadDataLocal()};
const el={};
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}
function init(){['dataStatus','globalErrorBox','proposalIncludePlants','proposalSearch','proposalTypology','proposalFloor','proposalStatus','proposalSelectedInfo','proposalGrid','dashboardKpis','priceSearch','priceTypology','priceFloor','priceStatus','pricesTableBody','historyFractionSelect','priceHistoryChart','historyList','compareA','compareB','compareResult','clientSearch','clientStageFilter','selectedClient','clientsList','clientDetail','salesTableBody','clientModal','closeClientModal','clientId','clientName','clientPhone','clientEmail','clientNif','clientNationality','clientOrigin','clientAgent','clientAgency','clientBudget','clientStage','clientFractions','clientNotes','eventModal','closeEventModal','eventClientId','eventType','eventDate','eventTime','eventAmount','eventInterest','eventFollowup','eventFollowupDate','eventFractions','eventObjections','eventNotes'].forEach(id=>el[id]=document.getElementById(id));bind();loadExcel();}
function bind(){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));document.getElementById('selectProposalVisible').onclick=()=>{filteredProposal().filter(f=>statusOf(f)==='Disponível').forEach(f=>state.selected.add(f.number));renderAll()};document.getElementById('clearProposalSelected').onclick=()=>{state.selected.clear();renderAll()};document.getElementById('exportClientPdf').onclick=exportPdf;document.getElementById('exportAllData').onclick=exportAll;document.getElementById('resetLocalData').onclick=resetLocal;document.getElementById('exportPriceHistory').onclick=exportPriceHistory;['proposalSearch','proposalTypology','proposalFloor','proposalStatus'].forEach(id=>{el[id].oninput=syncProposal;el[id].onchange=syncProposal});['priceSearch','priceTypology','priceFloor','priceStatus'].forEach(id=>{el[id].oninput=syncPrice;el[id].onchange=syncPrice});el.historyFractionSelect.onchange=renderHistory;el.compareA.onchange=renderCompare;el.compareB.onchange=renderCompare;document.getElementById('openClientModal').onclick=()=>openClientModal('');document.getElementById('closeClientModal').onclick=closeClientModal;document.getElementById('cancelClient').onclick=closeClientModal;document.getElementById('saveClient').onclick=saveClient;document.getElementById('openEventModalBtn').onclick=()=>openEventModal();document.getElementById('closeEventModal').onclick=closeEventModal;document.getElementById('cancelEvent').onclick=closeEventModal;document.getElementById('saveEvent').onclick=saveEvent;el.clientSearch.oninput=()=>{state.cf.search=el.clientSearch.value;renderClients()};el.clientStageFilter.onchange=()=>{state.cf.stage=el.clientStageFilter.value;renderClients()};el.selectedClient.onchange=()=>{state.selectedClientId=el.selectedClient.value;renderClients();renderClientDetail()};el.clientModal.onclick=e=>{if(e.target===el.clientModal)closeClientModal()};el.eventModal.onclick=e=>{if(e.target===el.eventModal)closeEventModal()};}
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
    const historyChanged = ensureHistory();
    populate();
    renderAll();

    if(REMOTE_URL){
      if(remoteLoaded && (shouldSyncAfterLoad || migrated || historyChanged)){
        save();
      }else if(!remoteLoaded && (migrated || historyChanged)){
        saveLocalOnly();
      }
      if(remoteLoaded){
        setStatus(migrated || historyChanged ? `${state.fractions.length} frações · preços/histórico preparados e sincronização ativa` : `${state.fractions.length} frações · sincronização Google Sheets ativa`);
      }
    }else if(migrated || historyChanged){
      save();
    }
  }catch(e){
    console.error(e);
    showError(e.message || String(e));
    setStatus('Erro ao carregar dados');
  }
}
function parseRow(raw){const development=safe(raw['Empreendimento']),fr=safe(raw['Fração']);if(!development||!fr)return null;const isTheView=norm(development)==='the view',n=isTheView?nat(fr):nat(fr,0),abp=num(raw['ABP']),terr=num(raw['Varanda/Terraço']),tot=num(raw['Área Total'])||abp+terr,price=num(raw['PVP']);return{raw,development,fractionRaw:fr,isTheView,number:n,name:isTheView?fr:`${development} · ${fr}`,typology:pretty(raw['Tipologia']),floorLabel:safe(raw['Piso'])||'—',floor:floor(raw['Piso']),view:num(raw['Vista']),orientation:isTheView?(ORIENT[n]||safe(raw['Orientação'])):safe(raw['Orientação']),abp,terrace:terr,totalArea:tot,price,pricePerSqm:tot?price/tot:0}}
function populate(){const tys=['all',...uniq(state.fractions.map(f=>f.typology))],fls=['all',...uniq(state.fractions.map(f=>String(f.floorLabel)))],sts=['all',...STATUS];fill(el.proposalTypology,tys,'Todas');fill(el.proposalFloor,fls,'Todos');fill(el.proposalStatus,sts,'Todos');fill(el.priceTypology,tys,'Todas');fill(el.priceFloor,fls,'Todos');fill(el.priceStatus,sts,'Todos');fill(el.historyFractionSelect,state.fractions.map(f=>String(f.number)),null,n=>`Apartamento ${n}`);fill(el.compareA,state.fractions.map(f=>String(f.number)),null,n=>`Apartamento ${n}`);fill(el.compareB,state.fractions.map(f=>String(f.number)),null,n=>`Apartamento ${n}`);if(state.fractions[1])el.compareB.value=String(state.fractions[1].number);fillMulti(el.clientFractions,state.fractions.map(f=>[String(f.number),f.name]));fillMulti(el.eventFractions,state.fractions.map(f=>[String(f.number),f.name]));fill(el.clientStageFilter,['all',...STAGES],'Todos');populateClientAgentSelect();}

function switchTab(tab){
  state.tab = tab;
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-section').forEach(sec=>sec.classList.add('hidden'));
  const target = document.getElementById('tab-' + tab);
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


function ensureSalesManagementTabs(){
  const tab=document.getElementById('tab-sales');
  if(!tab)return;

  const clientPanel=el.clientsList?el.clientsList.closest('.panel'):null;
  const fractionsPanel=el.salesTableBody?el.salesTableBody.closest('.panel'):null;
  const agentsPanel=document.getElementById('agentsPanel');

  if(clientPanel)clientPanel.dataset.salesView='clients';
  if(fractionsPanel)fractionsPanel.dataset.salesView='fractions';
  if(agentsPanel)agentsPanel.dataset.salesView='agents';

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
      <button class="module-tab active" type="button" data-sales-subtab="fractions">Frações e Estados</button>
      <button class="module-tab" type="button" data-sales-subtab="clients">Clientes / Leads</button>
      <button class="module-tab" type="button" data-sales-subtab="agents">Agentes</button>
      <button class="module-tab" type="button" data-sales-subtab="events">Eventos / Histórico</button>
    `;
    tab.insertBefore(nav, quick ? quick.nextSibling : tab.firstChild);
    nav.querySelectorAll('[data-sales-subtab]').forEach(btn=>btn.onclick=()=>{state.salesSubtab=btn.dataset.salesSubtab;renderSalesSubTabs()});

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

  // Ordem visual: primeiro frações, depois clientes, agentes e histórico.
  const ordered=[fractionsPanel,clientPanel,agentsPanel,eventsPanel].filter(Boolean);
  let anchor=nav.nextSibling;
  ordered.forEach(panel=>{
    if(panel && panel.parentNode===tab){
      tab.insertBefore(panel, anchor);
      anchor=panel.nextSibling;
    }
  });

  if(!state.salesSubtab)state.salesSubtab='fractions';
  renderSalesSubTabs();
}

function renderSalesSubTabs(){
  const active=state.salesSubtab||'fractions';
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
        <span class="badge badge--neutral">${esc(ev.type||'Evento')}</span>
      </div>
      ${ev.commissionAmount?`<p class="muted small">Comissão: ${money(ev.commissionAmount)} · Receita líquida: ${money((ev.amount||0)-ev.commissionAmount)}</p>`:''}
      ${ev.followup?`<p><strong>Follow-up:</strong> ${esc(ev.followup)} ${ev.followupDate?'· '+esc(ev.followupDate):''}</p>`:''}
      ${ev.objections?`<p><strong>Objeções:</strong> ${esc(ev.objections)}</p>`:''}
      ${ev.notes?`<p>${esc(ev.notes)}</p>`:''}
    </div>`;
  }).join(''):'<div class="empty-state">Ainda não existem eventos registados.</div>';
}


function renderAll(){renderProposals();renderDashboard();renderPrices();renderHistory();renderCompare();renderClientSelects();renderClients();renderClientDetail();renderSales();ensureAgentsPanel();renderAgents();ensureSalesManagementTabs();}
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

function renderPrices(){const fs=filteredPrice();el.pricesTableBody.innerHTML=fs.length?fs.map(f=>{const h=historyOf(f),last=h[h.length-1];return`<tr><td><strong>${esc(f.name)}</strong><div class="muted small">${esc(statusOf(f))}</div></td><td>${esc(f.typology)}</td><td>${esc(f.floorLabel)}</td><td>${esc(f.orientation||'—')}</td><td class="num-col">${money(f.price)}</td><td class="num-col"><input type="number" step="1000" data-price="${f.number}" value="${Math.round(finalPrice(f))}"/></td><td><textarea data-price-reason="${f.number}" placeholder="Motivo da alteração"></textarea></td><td><span class="muted small">${h.length} registos</span><br><span class="muted small">Último: ${last?esc(last.date):'—'}</span></td></tr>`}).join(''):'<tr><td colspan="8"><div class="empty-state">Sem frações.</div></td></tr>';el.pricesTableBody.querySelectorAll('[data-price]').forEach(inp=>inp.onchange=()=>{const n=+inp.dataset.price,f=getF(n),old=finalPrice(f),p=num(inp.value);if(!p||p===old)return;const r=document.querySelector(`[data-price-reason="${n}"]`).value.trim();state.data.finalPrices[n]=Math.round(p);state.data.priceHistory[n] ||= [];state.data.priceHistory[n].push({date:today(),price:Math.round(p),oldPrice:Math.round(old),reason:r||'Alteração manual'});save();renderAll()})}
function renderHistory(){const f=getF(+el.historyFractionSelect.value)||state.fractions[0];if(!f)return;const h=historyOf(f);draw(h,f);el.historyList.innerHTML=h.slice().reverse().map(x=>`<div class="history-item"><strong>${esc(x.date)} · ${money(x.price)}</strong><p class="muted">${esc(x.reason||'Sem nota')}</p></div>`).join('')}
function draw(h,f){const c=el.priceHistoryChart,ctx=c.getContext('2d'),w=c.width,hgt=c.height;ctx.clearRect(0,0,w,hgt);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,hgt);ctx.strokeStyle='#d9e1eb';for(let i=0;i<5;i++){let y=50+i*((hgt-100)/4);ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(w-30,y);ctx.stroke()}ctx.fillStyle='#16233d';ctx.font='24px sans-serif';ctx.fillText(`Evolução do preço · ${f.name}`,60,34);if(!h.length)return;let vals=h.map(x=>+x.price),mn=Math.min(...vals),mx=Math.max(...vals);if(mn===mx){mn*=.95;mx*=1.05}const L=60,R=30,T=60,B=55,PW=w-L-R,PH=hgt-T-B,x=i=>L+(h.length===1?PW/2:i*PW/(h.length-1)),y=v=>T+(mx-v)*PH/(mx-mn);ctx.strokeStyle='#1e467c';ctx.lineWidth=4;ctx.beginPath();h.forEach((it,i)=>i?ctx.lineTo(x(i),y(it.price)):ctx.moveTo(x(i),y(it.price)));ctx.stroke();h.forEach((it,i)=>{ctx.fillStyle='#b89253';ctx.beginPath();ctx.arc(x(i),y(it.price),7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#61718b';ctx.font='14px sans-serif';ctx.fillText(money(it.price),x(i)-42,y(it.price)-14)})}
function renderCompare(){const a=getF(+el.compareA.value)||state.fractions[0],b=getF(+el.compareB.value)||state.fractions[1]||a;el.compareResult.innerHTML=[panel(a),panel(b)].join('')}
function panel(f){return`<article class="compare-panel"><span class="${badge(statusOf(f))}">${esc(statusOf(f))}</span><h3>${esc(f.name)}</h3><p class="muted">${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation||'—')}</p><table class="compare-table">${row('Preço final',money(finalPrice(f)))}${row('Preço inicial',money(f.price))}${row('Preço venda real',salePrice(f)?money(salePrice(f)):'—')}${row('ABP',area(f.abp))}${row('Exterior',area(f.terrace))}${row('Área total',area(f.totalArea))}${row('€/m² final',f.totalArea?money(Math.round(finalPrice(f)/f.totalArea),0):'—')}</table></article>`}
function renderClientSelects(){const opts=state.data.clients.map(c=>[c.id,c.name||'Cliente sem nome']);fillMulti(el.selectedClient,opts);fillMulti(el.eventClientId,opts);if(!state.selectedClientId&&state.data.clients[0])state.selectedClientId=state.data.clients[0].id;el.selectedClient.value=state.selectedClientId;el.eventClientId.value=state.selectedClientId;}
function renderClients(){const s=norm(state.cf.search),st=state.cf.stage;const cs=state.data.clients.filter(c=>(st==='all'||c.stage===st)&&(!s||norm([c.name,c.email,c.phone,c.origin,c.agent,c.agency,c.notes,(c.fractions||[]).join(' ')].join(' ')).includes(s)));el.clientsList.innerHTML=cs.length?cs.map(c=>`<div class="client-card ${c.id===state.selectedClientId?'active':''}" data-client="${c.id}"><div class="section-heading compact"><div><strong>${esc(c.name||'Cliente sem nome')}</strong><p class="muted small">${esc(c.phone||'')} · ${esc(c.email||'')}</p><span class="badge badge--neutral">${esc(c.stage||'Novo lead')}</span></div><button class="ghost-button" type="button" data-edit-client-card="${c.id}">Editar</button></div></div>`).join(''):'<div class="empty-state">Sem clientes.</div>';el.clientsList.querySelectorAll('[data-client]').forEach(card=>card.onclick=e=>{if(e.target.closest('[data-edit-client-card]'))return;state.selectedClientId=card.dataset.client;el.selectedClient.value=state.selectedClientId;renderClients();renderClientDetail()});el.clientsList.querySelectorAll('[data-edit-client-card]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();state.selectedClientId=btn.dataset.editClientCard;el.selectedClient.value=state.selectedClientId;openClientModal(state.selectedClientId)})}
function renderClientDetail(){const c=client(state.selectedClientId);if(!c){el.clientDetail.innerHTML='<div class="empty-state">Selecione ou crie um cliente.</div>';return}const evs=state.data.events.filter(e=>e.clientId===c.id).sort((a,b)=>String(b.date+' '+b.time).localeCompare(String(a.date+' '+a.time)));el.clientDetail.innerHTML=`<div class="section-heading"><div><h2>${esc(c.name||'Cliente sem nome')}</h2><p class="muted">${esc(c.phone||'')} · ${esc(c.email||'')}</p></div><button class="ghost-button" data-edit-client="${c.id}">Editar ficha</button></div><div class="kpi-grid"><article class="kpi-card"><span>Estado</span><strong>${esc(c.stage||'Novo lead')}</strong></article><article class="kpi-card"><span>Orçamento</span><strong>${c.budget?money(c.budget):'—'}</strong></article><article class="kpi-card"><span>Eventos</span><strong>${evs.length}</strong></article><article class="kpi-card"><span>Frações interesse</span><strong>${(c.fractions||[]).length}</strong></article></div><h3>Linha do tempo</h3><div class="timeline">${evs.length?evs.map(e=>`<div class="timeline-item"><strong>${esc(e.date||'')} ${esc(e.time||'')} · ${esc(e.type)}</strong><p class="muted">Frações: ${esc((e.fractions||[]).map(n=>'Apt. '+n).join(', ')||'—')}</p>${e.amount?`<p><strong>Valor:</strong> ${money(e.amount)}</p>`:''}<p>${esc(e.notes||'')}</p>${e.objections?`<p><strong>Objeções:</strong> ${esc(e.objections)}</p>`:''}</div>`).join(''):'<div class="empty-state">Sem eventos para este cliente.</div>'}</div>`;el.clientDetail.querySelector('[data-edit-client]')?.addEventListener('click',()=>openClientModal(c.id))}

function commissionOf(n){return state.data.saleCommissions?.[n]||{amount:0}}
function agent(id){return (state.data.agents||[]).find(a=>a.id===id)}
function calculateCommission(amount,type,value){amount=+amount||0;value=+value||0;return type==='percent'?amount*value/100:value}

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
function deleteMaintenanceSelected(){
  const clientIds=checkedValues('[data-maint-client]');
  const agentIds=checkedValues('[data-maint-agent]');
  const eventIds=checkedValues('[data-maint-event]');
  const deleteLinked=!!document.getElementById('maintenanceDeleteLinkedEvents')?.checked;
  if(!clientIds.length&&!agentIds.length&&!eventIds.length){alert('Selecione pelo menos um item para eliminar.');return}

  let finalEventIds=new Set(eventIds);
  if(deleteLinked){
    (state.data.events||[]).forEach(ev=>{if(clientIds.includes(ev.clientId))finalEventIds.add(ev.id)});
  }

  const msg=`Eliminar definitivamente:\n- ${clientIds.length} cliente(s)\n- ${agentIds.length} agente(s)\n- ${finalEventIds.size} evento(s)\n\nEsta ação não pode ser desfeita.`;
  if(!confirm(msg))return;

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
  }

  save();
  closeMaintenanceModal();
  renderAll();
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
function saveAgent(){
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
  if(!a.name&&!a.agency){alert('Indique pelo menos o nome do agente ou a agência.');return}
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
  renderAgents();
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
  const isSale=el.eventType?.value==='Venda';
  const fields=document.getElementById('eventAgentFields');if(!fields)return;
  fields.style.display=isSale?'grid':'none';
}

function renderSales(){el.salesTableBody.innerHTML=state.fractions.map(f=>{const m=metrics(f.number),c=commissionOf(f.number),st=statusOf(f);return`<tr><td><strong>${esc(f.name)}</strong><div class="muted small">${esc(f.typology)} · ${esc(f.orientation||'—')}</div></td><td><select data-status="${f.number}">${STATUS.map(s=>`<option ${s===st?'selected':''}>${esc(s)}</option>`).join('')}</select>${st==='Indisponível'&&state.data.unavailableReasons?.[f.number]?`<div class="muted small">${esc(state.data.unavailableReasons[f.number])}</div>`:''}</td><td class="num-col">${money(finalPrice(f))}</td><td class="num-col"><input type="number" step="1000" data-sale-price="${f.number}" value="${salePrice(f)||''}" placeholder="€"/>${c.amount?`<div class="muted small">Comissão: ${money(c.amount)}<br>Líquido: ${money((salePrice(f)||finalPrice(f))-c.amount)}</div>`:''}</td><td class="num-col">${m.visits}</td><td class="num-col">${m.interested}</td><td class="num-col">${m.proposals}</td><td class="num-col">${m.lastOffer?money(m.lastOffer):'—'}</td><td>${esc(m.lastAction||'—')}</td></tr>`}).join('');el.salesTableBody.querySelectorAll('[data-status]').forEach(s=>s.onchange=()=>{const n=+s.dataset.status,old=statusOf(getF(n)),st=s.value,f=getF(n);if(['Reservado','Vendido'].includes(st)){alert('Para registar uma reserva ou venda completa, use "Adicionar evento" e escolha o tipo Reserva ou Venda. Esta alteração manual ficará apenas como ajuste de estado.')}state.data.statuses[n]=st;if(st==='Indisponível'){const reason=prompt(`${f.name} ficará indisponível. Indique o motivo:`,state.data.unavailableReasons?.[n]||'');state.data.unavailableReasons=state.data.unavailableReasons||{};if(reason!==null)state.data.unavailableReasons[n]=reason.trim()}if(st==='Disponível'){if(state.data.unavailableReasons)delete state.data.unavailableReasons[n]}if((st==='Reservado'||st==='Vendido')&&!state.data.salePrices[n]){const v=prompt(`${f.name} foi marcado como ${st}.\nPreço definido: ${money(finalPrice(f))}\nConfirme o preço real ou deixe vazio para usar o preço definido:`,Math.round(finalPrice(f)));state.data.salePrices[n]=v?num(v):finalPrice(f)}state.data.events.push({id:id(),clientId:'',type:'Alteração de estado',date:today(),time:'',amount:0,interest:'',followup:'',followupDate:'',fractions:[n],objections:'',notes:`Estado alterado manualmente de ${old} para ${st}`});save();renderAll()});el.salesTableBody.querySelectorAll('[data-sale-price]').forEach(i=>i.onchange=()=>{state.data.salePrices[+i.dataset.salePrice]=num(i.value);save();renderDashboard();renderSales()})}
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
  el.clientOrigin.value=isEdit?(c.origin||''):'Portal imobiliário';
  if(el.clientAgent)el.clientAgent.value=aid;
  el.clientAgency.value=isEdit?(c.agency||''):'';
  if(aid)syncClientAgentAgency();
  el.clientBudget.value=isEdit?(c.budget||''):'';
  el.clientStage.value=isEdit?(c.stage||'Novo lead'):'Novo lead';
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
function saveClient(){
  let cid=el.clientId.value||id();
  const selectedAgentId=el.clientAgent?.value||'';
  const selectedAgent=agent(selectedAgentId);
  const c={
    id:cid,
    name:el.clientName.value.trim(),
    phone:el.clientPhone.value.trim(),
    email:el.clientEmail.value.trim(),
    nif:el.clientNif.value.trim(),
    nationality:el.clientNationality.value.trim(),
    origin:el.clientOrigin.value,
    agentId:selectedAgentId,
    agent:selectedAgent?(selectedAgent.name||''):'',
    agency:selectedAgent?(selectedAgent.agency||''):(el.clientAgency.value.trim()),
    budget:num(el.clientBudget.value),
    stage:el.clientStage.value,
    fractions:getMulti(el.clientFractions).map(Number),
    notes:el.clientNotes.value.trim(),
    updated:new Date().toLocaleString('pt-PT')
  };
  if(!c.name){alert('Indique o nome do cliente.');return}
  const idx=state.data.clients.findIndex(x=>x.id===cid);
  idx>=0?state.data.clients[idx]=c:state.data.clients.push(c);
  state.selectedClientId=cid;
  save();
  renderClientSelects();
  if(state.pendingEventClientCreation&&el.eventClientId){
    el.eventClientId.value=cid;
    state.pendingEventClientCreation=false;
  }
  closeClientModal();
  renderAll();
}
function openEventModal(){ensureEventAgentFields();ensureEventClientQuickCreate();populateAgentSelect();renderClientSelects();el.eventClientId.value=state.selectedClientId||'';el.eventType.value='Reunião com cliente';el.eventDate.value=today();el.eventTime.value='';el.eventAmount.value='';el.eventInterest.value='';el.eventFollowup.value='';el.eventFollowupDate.value='';setMulti(el.eventFractions,[]);el.eventObjections.value='';el.eventNotes.value='';const wa=document.getElementById('eventWithAgent');if(wa)wa.checked=false;const cv=document.getElementById('eventCommissionValue');if(cv)cv.value='';toggleEventAgentFields();el.eventType.onchange=toggleEventAgentFields;el.eventModal.classList.remove('hidden');document.body.style.overflow='hidden'}
function closeEventModal(){el.eventModal.classList.add('hidden');document.body.style.overflow=''}
function saveEvent(){const cid=el.eventClientId.value;if(!cid){alert('Escolha um cliente.');return}const frs=getMulti(el.eventFractions).map(Number);if(!frs.length){alert('Escolha pelo menos uma fração.');return}const withAgent=!!document.getElementById('eventWithAgent')?.checked&&el.eventType.value==='Venda';const commissionType=document.getElementById('eventCommissionType')?.value||'percent';const commissionValue=num(document.getElementById('eventCommissionValue')?.value||0);const saleAmount=num(el.eventAmount.value);const commissionAmount=withAgent?calculateCommission(saleAmount,commissionType,commissionValue):0;const ev={id:id(),clientId:cid,type:el.eventType.value,date:el.eventDate.value||today(),time:el.eventTime.value,amount:saleAmount,interest:el.eventInterest.value,followup:el.eventFollowup.value,followupDate:el.eventFollowupDate.value,fractions:frs,objections:el.eventObjections.value.trim(),notes:el.eventNotes.value.trim(),withAgent,agentId:withAgent?(document.getElementById('eventAgentId')?.value||''):'',commissionType:withAgent?commissionType:'',commissionValue:withAgent?commissionValue:0,commissionAmount};state.data.events.push(ev);const c=client(cid);if(c){c.fractions=uniqNum([...(c.fractions||[]),...frs]);if(['Proposta recebida','Contra-proposta enviada'].includes(ev.type))c.stage='Em negociação';if(ev.type==='Visita')c.stage='Visitou';if(ev.type==='Reserva')c.stage='Reserva';if(ev.type==='Venda')c.stage='Vendido'}if(ev.type==='Reserva')frs.forEach(n=>{state.data.statuses[n]='Reservado';if(ev.amount)state.data.salePrices[n]=ev.amount});if(ev.type==='Venda')frs.forEach(n=>{state.data.statuses[n]='Vendido';if(ev.amount)state.data.salePrices[n]=ev.amount;state.data.saleCommissions=state.data.saleCommissions||{};state.data.saleCommissions[n]={withAgent,agentId:ev.agentId,commissionType,commissionValue,amount:commissionAmount,netRevenue:(ev.amount||finalPrice(getF(n)))-commissionAmount,eventId:ev.id,date:ev.date}});save();closeEventModal();renderAll()}
function exportPdf(){
  const fs=state.fractions.filter(f=>state.selected.has(f.number)&&statusOf(f)==='Disponível').sort((a,b)=>a.number-b.number);
  if(!fs.length){alert('Selecione pelo menos uma fração disponível.');return}
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
  if(!w){alert('Autorize pop-ups para gerar o PDF.');return}

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
function metrics(n){const evs=state.data.events.filter(e=>(e.fractions||[]).includes(n));const cnt=t=>evs.filter(e=>e.type===t).length;const offers=evs.filter(e=>['Proposta recebida','Contra-proposta enviada','Reserva','Venda'].includes(e.type)&&e.amount).map(e=>e.amount);const last=evs[evs.length-1];return{visits:cnt('Visita'),interested:cnt('Interessado')+cnt('Reunião com cliente'),proposals:cnt('Proposta recebida')+cnt('Contra-proposta enviada')+cnt('Reserva')+cnt('Venda'),lastOffer:offers[offers.length-1]||0,lastAction:last?`${last.type} · ${last.date}`:''}}
function ensureHistory(){let changed=false;state.data.priceHistory=state.data.priceHistory||{};state.fractions.forEach(f=>{if(!state.data.priceHistory[f.number]){state.data.priceHistory[f.number]=[{date:today(),price:finalPrice(f),reason:'Preço inicial definido'}];changed=true}});return changed}
function getF(n){return state.fractions.find(f=>f.number===n)}function client(id){return state.data.clients.find(c=>c.id===id)}function finalPrice(f){return +state.data.finalPrices[f.number]||SUG[f.number]||f.price}function statusOf(f){return f?state.data.statuses[f.number]||'Disponível':'Disponível'}function salePrice(f){return +state.data.salePrices[f.number]||0}function historyOf(f){return state.data.priceHistory[f.number]||[]}function normalizeData(d={}){return{finalPrices:d.finalPrices||{},statuses:d.statuses||{},salePrices:d.salePrices||{},priceHistory:d.priceHistory||{},clients:d.clients||[],events:d.events||[],agents:d.agents||[],saleCommissions:d.saleCommissions||{},unavailableReasons:d.unavailableReasons||{},priceMigrationKey:d.priceMigrationKey||''}}
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

function resetLocal(){
  if(confirm('Apagar dados locais deste navegador? Os dados da Google Sheet não serão apagados.')){
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
