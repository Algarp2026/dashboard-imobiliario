"use strict";
(()=>{
const DATA_FILES=['data.xlsx','data.xls'],KEY='theView.crmCommercial.v2',CONFIG=window.THE_VIEW_CONFIG||{},REMOTE_URL=(CONFIG.GOOGLE_SHEETS_WEBAPP_URL||'').trim();
const PLANT_MAP={"1": {"image": "plantas/planta-apartamento-01.jpg", "pdf": "plantas/planta-apartamento-01.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_01.pdf"}, "2": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "10": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "17": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "24": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "31": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "3": {"image": "plantas/planta-apartamento-03.jpg", "pdf": "plantas/planta-apartamento-03.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_03.pdf"}, "4": {"image": "plantas/planta-apartamento-04.jpg", "pdf": "plantas/planta-apartamento-04.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_04.pdf"}, "5": {"image": "plantas/planta-apartamento-05.jpg", "pdf": "plantas/planta-apartamento-05.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_05.pdf"}, "6": {"image": "plantas/planta-apartamento-06.jpg", "pdf": "plantas/planta-apartamento-06.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_06.pdf"}, "7": {"image": "plantas/planta-apartamento-07-15.jpg", "pdf": "plantas/planta-apartamento-07-15.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf"}, "15": {"image": "plantas/planta-apartamento-07-15.jpg", "pdf": "plantas/planta-apartamento-07-15.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf"}, "8": {"image": "plantas/planta-apartamento-08.jpg", "pdf": "plantas/planta-apartamento-08.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_08.pdf"}, "9": {"image": "plantas/planta-apartamento-09-16.jpg", "pdf": "plantas/planta-apartamento-09-16.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf"}, "16": {"image": "plantas/planta-apartamento-09-16.jpg", "pdf": "plantas/planta-apartamento-09-16.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf"}, "11": {"image": "plantas/planta-apartamento-11.jpg", "pdf": "plantas/planta-apartamento-11.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_11.pdf"}, "12": {"image": "plantas/planta-apartamento-12.jpg", "pdf": "plantas/planta-apartamento-12.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_12.pdf"}, "13": {"image": "plantas/planta-apartamento-13.jpg", "pdf": "plantas/planta-apartamento-13.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_13.pdf"}, "14": {"image": "plantas/planta-apartamento-14.jpg", "pdf": "plantas/planta-apartamento-14.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_14.pdf"}, "18": {"image": "plantas/planta-apartamento-18.jpg", "pdf": "plantas/planta-apartamento-18.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_18.pdf"}, "19": {"image": "plantas/planta-apartamento-19.jpg", "pdf": "plantas/planta-apartamento-19.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_19.pdf"}, "20": {"image": "plantas/planta-apartamento-20.jpg", "pdf": "plantas/planta-apartamento-20.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_20.pdf"}, "21": {"image": "plantas/planta-apartamento-21.jpg", "pdf": "plantas/planta-apartamento-21.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_21.pdf"}, "22": {"image": "plantas/planta-apartamento-22.jpg", "pdf": "plantas/planta-apartamento-22.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_22.pdf"}, "23": {"image": "plantas/planta-apartamento-23-30.jpg", "pdf": "plantas/planta-apartamento-23-30.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf"}, "30": {"image": "plantas/planta-apartamento-23-30.jpg", "pdf": "plantas/planta-apartamento-23-30.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf"}, "25": {"image": "plantas/planta-apartamento-25.jpg", "pdf": "plantas/planta-apartamento-25.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_25.pdf"}, "26": {"image": "plantas/planta-apartamento-26.jpg", "pdf": "plantas/planta-apartamento-26.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_26.pdf"}, "27": {"image": "plantas/planta-apartamento-27.jpg", "pdf": "plantas/planta-apartamento-27.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_27.pdf"}, "28": {"image": "plantas/planta-apartamento-28.jpg", "pdf": "plantas/planta-apartamento-28.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_28.pdf"}, "29": {"image": "plantas/planta-apartamento-29.jpg", "pdf": "plantas/planta-apartamento-29.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_29.pdf"}, "32": {"image": "plantas/planta-apartamento-32.jpg", "pdf": "plantas/planta-apartamento-32.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_32.pdf"}, "33": {"image": "plantas/planta-apartamento-33.jpg", "pdf": "plantas/planta-apartamento-33.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_33.pdf"}, "34": {"image": "plantas/planta-apartamento-34.jpg", "pdf": "plantas/planta-apartamento-34.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_34.pdf"}, "35": {"image": "plantas/planta-apartamento-35.jpg", "pdf": "plantas/planta-apartamento-35.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_35.pdf"}, "36": {"image": "plantas/planta-apartamento-36.jpg", "pdf": "plantas/planta-apartamento-36.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_36.pdf"}, "37": {"image": "plantas/planta-apartamento-37.jpg", "pdf": "plantas/planta-apartamento-37.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_37.pdf"}, "38": {"image": "plantas/planta-apartamento-38.jpg", "pdf": "plantas/planta-apartamento-38.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_38.pdf"}, "39": {"image": "plantas/planta-apartamento-39.jpg", "pdf": "plantas/planta-apartamento-39.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_39.pdf"}};
const ORIENT={1:'Sul/Este',2:'Sul/Oeste',3:'Oeste',4:'Oeste',5:'Oeste',6:'Este/Oeste',7:'Este',8:'Este',9:'Sul/Este',10:'Sul/Oeste',11:'Oeste',12:'Oeste',13:'Oeste',14:'Este/Oeste',15:'Este',16:'Sul/Este',17:'Sul/Oeste',18:'Oeste',19:'Oeste',20:'Oeste',21:'Este/Oeste',22:'Este',23:'Sul/Este',24:'Sul/Oeste',25:'Oeste',26:'Este/Oeste',27:'Oeste',28:'Este/Oeste',29:'Este',30:'Sul/Este',31:'Sul/Oeste',32:'Oeste',33:'Este/Oeste',34:'Este/Oeste',35:'Este/Oeste',36:'Sul/Este',37:'Sul/Oeste',38:'Oeste',39:'Este/Oeste'};
const SUG={1:545000,2:600000,3:390000,4:475000,5:450000,6:615000,7:535000,8:390000,9:800000,10:620000,11:400000,12:440000,13:420000,14:600000,15:580000,16:900000,17:640000,18:425000,19:360000,20:410000,21:560000,22:600000,23:850000,24:700000,25:440000,26:630000,27:440000,28:500000,29:485000,30:950000,31:720000,32:455000,33:570000,34:645000,35:555000,36:1450000,37:1000000,38:470000,39:1000000};
const STATUS=['Disponível','Reservado','Vendido'];
const STAGES=['Novo lead','Contactado','Visitou','Em negociação','Reserva','Vendido','Desistiu'];
const state={rows:[],fractions:[],tab:'proposals',selected:new Set(),selectedClientId:'',pf:{search:'',typology:'all',floor:'all',status:'all'},rf:{search:'',typology:'all',floor:'all',status:'all'},cf:{search:'',stage:'all'},data:loadDataLocal()};
const el={};
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}
function init(){['dataStatus','globalErrorBox','proposalIncludePlants','proposalSearch','proposalTypology','proposalFloor','proposalStatus','proposalSelectedInfo','proposalGrid','dashboardKpis','priceSearch','priceTypology','priceFloor','priceStatus','pricesTableBody','historyFractionSelect','priceHistoryChart','historyList','compareA','compareB','compareResult','clientSearch','clientStageFilter','selectedClient','clientsList','clientDetail','salesTableBody','clientModal','closeClientModal','clientId','clientName','clientPhone','clientEmail','clientNif','clientNationality','clientOrigin','clientAgent','clientAgency','clientBudget','clientStage','clientFractions','clientNotes','eventModal','closeEventModal','eventClientId','eventType','eventDate','eventTime','eventAmount','eventInterest','eventFollowup','eventFollowupDate','eventFractions','eventObjections','eventNotes'].forEach(id=>el[id]=document.getElementById(id));bind();loadExcel();}
function bind(){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));document.getElementById('selectProposalVisible').onclick=()=>{filteredProposal().filter(f=>statusOf(f)!=='Vendido').forEach(f=>state.selected.add(f.number));renderAll()};document.getElementById('clearProposalSelected').onclick=()=>{state.selected.clear();renderAll()};document.getElementById('exportClientPdf').onclick=exportPdf;document.getElementById('exportAllData').onclick=exportAll;document.getElementById('resetLocalData').onclick=resetLocal;document.getElementById('exportPriceHistory').onclick=exportPriceHistory;['proposalSearch','proposalTypology','proposalFloor','proposalStatus'].forEach(id=>{el[id].oninput=syncProposal;el[id].onchange=syncProposal});['priceSearch','priceTypology','priceFloor','priceStatus'].forEach(id=>{el[id].oninput=syncPrice;el[id].onchange=syncPrice});el.historyFractionSelect.onchange=renderHistory;el.compareA.onchange=renderCompare;el.compareB.onchange=renderCompare;document.getElementById('openClientModal').onclick=()=>openClientModal(state.selectedClientId);document.getElementById('closeClientModal').onclick=closeClientModal;document.getElementById('cancelClient').onclick=closeClientModal;document.getElementById('saveClient').onclick=saveClient;document.getElementById('openEventModalBtn').onclick=()=>openEventModal();document.getElementById('closeEventModal').onclick=closeEventModal;document.getElementById('cancelEvent').onclick=closeEventModal;document.getElementById('saveEvent').onclick=saveEvent;el.clientSearch.oninput=()=>{state.cf.search=el.clientSearch.value;renderClients()};el.clientStageFilter.onchange=()=>{state.cf.stage=el.clientStageFilter.value;renderClients()};el.selectedClient.onchange=()=>{state.selectedClientId=el.selectedClient.value;renderClients();renderClientDetail()};el.clientModal.onclick=e=>{if(e.target===el.clientModal)closeClientModal()};el.eventModal.onclick=e=>{if(e.target===el.eventModal)closeEventModal()};}
async function loadExcel(){
  setStatus('A carregar dados…');
  try{
    const r = await fetch('data.json', {cache:'no-store'});
    if(!r.ok) throw new Error('Não consegui abrir data.json.');
    const rawRows = await r.json();

    state.rows = rawRows.map(parseRow).filter(Boolean);
    state.fractions = state.rows.filter(r=>r.isTheView).sort((a,b)=>a.number-b.number);

    if(!state.fractions.length) throw new Error('Não encontrei frações The View.');

    ensureHistory();
    populate();
    renderAll();

    // O painel não fica bloqueado à espera do Google Sheets.
    // Primeiro mostra os dados locais; depois tenta sincronizar em segundo plano.
    setStatus(REMOTE_URL ? `${state.fractions.length} frações carregadas · a sincronizar Google Sheets…` : `${state.fractions.length} frações carregadas`);

    if(REMOTE_URL){
      loadRemoteData()
        .then(()=>{
          ensureHistory();
          populate();
          renderAll();
          setStatus(`${state.fractions.length} frações · sincronização Google Sheets ativa`);
        })
        .catch(err=>{
          console.warn('Falha ao sincronizar Google Sheets em segundo plano', err);
          setStatus(`${state.fractions.length} frações carregadas · dados locais`);
        });
    }
  }catch(e){
    console.error(e);
    showError(e.message || String(e));
    setStatus('Erro ao carregar dados');
  }
}
function parseRow(raw){const development=safe(raw['Empreendimento']),fr=safe(raw['Fração']);if(!development||!fr)return null;const isTheView=norm(development)==='the view',n=isTheView?nat(fr):nat(fr,0),abp=num(raw['ABP']),terr=num(raw['Varanda/Terraço']),tot=num(raw['Área Total'])||abp+terr,price=num(raw['PVP']);return{raw,development,fractionRaw:fr,isTheView,number:n,name:isTheView?fr:`${development} · ${fr}`,typology:pretty(raw['Tipologia']),floorLabel:safe(raw['Piso'])||'—',floor:floor(raw['Piso']),view:num(raw['Vista']),orientation:isTheView?(ORIENT[n]||safe(raw['Orientação'])):safe(raw['Orientação']),abp,terrace:terr,totalArea:tot,price,pricePerSqm:tot?price/tot:0}}
function populate(){const tys=['all',...uniq(state.fractions.map(f=>f.typology))],fls=['all',...uniq(state.fractions.map(f=>String(f.floorLabel)))],sts=['all',...STATUS];fill(el.proposalTypology,tys,'Todas');fill(el.proposalFloor,fls,'Todos');fill(el.proposalStatus,sts,'Todos');fill(el.priceTypology,tys,'Todas');fill(el.priceFloor,fls,'Todos');fill(el.priceStatus,sts,'Todos');fill(el.historyFractionSelect,state.fractions.map(f=>String(f.number)),null,n=>`Apartamento ${n}`);fill(el.compareA,state.fractions.map(f=>String(f.number)),null,n=>`Apartamento ${n}`);fill(el.compareB,state.fractions.map(f=>String(f.number)),null,n=>`Apartamento ${n}`);if(state.fractions[1])el.compareB.value=String(state.fractions[1].number);fillMulti(el.clientFractions,state.fractions.map(f=>[String(f.number),f.name]));fillMulti(el.eventFractions,state.fractions.map(f=>[String(f.number),f.name]));fill(el.clientStageFilter,['all',...STAGES],'Todos');}

function switchTab(tab){
  state.tab = tab;
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-section').forEach(sec=>sec.classList.add('hidden'));
  const target = document.getElementById('tab-' + tab);
  if(target) target.classList.remove('hidden');
  renderAll();
}

function renderAll(){renderProposals();renderDashboard();renderPrices();renderHistory();renderCompare();renderClientSelects();renderClients();renderClientDetail();renderSales();}
function renderProposals(){const fs=filteredProposal();el.proposalSelectedInfo.textContent=`${[...state.selected].filter(n=>statusOf(getF(n))!=='Vendido').length} selecionadas`;el.proposalGrid.innerHTML=fs.length?fs.map(f=>{const st=statusOf(f),sold=st==='Vendido';return`<label class="proposal-card ${sold?'proposal-card--sold':''}"><input type="checkbox" data-proposal-select="${f.number}" ${state.selected.has(f.number)&&!sold?'checked':''} ${sold?'disabled':''}/><div><span class="${badge(st)}">${sold?'Indisponível':st}</span><h3>${esc(f.name)}</h3><p class="muted">${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation||'—')}</p><p><strong>${sold?'Indisponível':money(finalPrice(f))}</strong></p><p class="muted small">ABP ${area(f.abp)} · Exterior ${area(f.terrace)} · Total ${area(f.totalArea)}</p></div></label>`}).join(''):'<div class="empty-state">Sem frações.</div>';el.proposalGrid.querySelectorAll('[data-proposal-select]').forEach(x=>x.onchange=()=>{const n=+x.dataset.proposalSelect;x.checked?state.selected.add(n):state.selected.delete(n);renderProposals()})}
function renderDashboard(){const sold=state.fractions.filter(f=>statusOf(f)==='Vendido'),available=state.fractions.filter(f=>statusOf(f)==='Disponível');el.dashboardKpis.innerHTML=[kpi('Receita de tabela',money(sum(state.fractions.map(finalPrice))),'Soma dos preços finais'),kpi('Receita de vendas reais',money(sum(sold.map(f=>salePrice(f)||finalPrice(f)))),'Apenas vendidos'),kpi('Disponíveis',available.length,'Atualiza quando vender'),kpi('Vendidas',sold.length,'Total vendidas')].join('');renderDecisionAlerts()}

function renderDecisionAlerts(){if(!el.decisionAlerts)return;const soldBelow=state.fractions.filter(f=>statusOf(f)==='Vendido'&&salePrice(f)&&salePrice(f)<finalPrice(f));const reserved=state.fractions.filter(f=>statusOf(f)==='Reservado');const changed=state.fractions.filter(f=>historyOf(f).length>1).slice(0,8);const hot=state.fractions.map(f=>({f,m:metrics(f.number)})).filter(x=>x.m.proposals||x.m.interested).sort((a,b)=>(b.m.proposals-a.m.proposals)||(b.m.interested-a.m.interested)).slice(0,6);let blocks=[];blocks.push(`<article class="decision-alert decision-alert--warn"><h3>Reservas pendentes</h3><p><strong>${reserved.length}</strong> frações reservadas.</p><p>${reserved.slice(0,5).map(f=>esc(f.name)).join(', ')||'Sem reservas neste momento.'}</p></article>`);blocks.push(`<article class="decision-alert ${soldBelow.length?'decision-alert--danger':'decision-alert--success'}"><h3>Vendas abaixo da tabela</h3><p><strong>${soldBelow.length}</strong> vendas abaixo do preço final definido.</p><p>${soldBelow.slice(0,5).map(f=>`${esc(f.name)} (${money(finalPrice(f)-salePrice(f))})`).join(', ')||'Sem desvios negativos registados.'}</p></article>`);blocks.push(`<article class="decision-alert"><h3>Preços alterados</h3><p><strong>${changed.length}</strong> frações com histórico de alteração.</p><p>${changed.map(f=>esc(f.name)).join(', ')||'Ainda sem alterações manuais.'}</p></article>`);blocks.push(`<article class="decision-alert"><h3>Maior procura</h3><p>${hot.length?hot.map(x=>`${esc(x.f.name)} · ${x.m.interested} interessados · ${x.m.proposals} propostas`).join('<br>'):'Ainda sem eventos comerciais suficientes.'}</p></article>`);blocks.push(`<article class="decision-alert"><h3>Sincronização</h3><p>${REMOTE_URL?'Google Sheets ativo. As alterações são guardadas na base partilhada.':'Modo local. Configure o URL do Google Apps Script em config.js para partilhar dados.'}</p></article>`);el.decisionAlerts.innerHTML=blocks.join('')}

function renderPrices(){const fs=filteredPrice();el.pricesTableBody.innerHTML=fs.length?fs.map(f=>{const h=historyOf(f),last=h[h.length-1];return`<tr><td><strong>${esc(f.name)}</strong><div class="muted small">${esc(statusOf(f))}</div></td><td>${esc(f.typology)}</td><td>${esc(f.floorLabel)}</td><td>${esc(f.orientation||'—')}</td><td class="num-col">${money(f.price)}</td><td class="num-col"><input type="number" step="1000" data-price="${f.number}" value="${Math.round(finalPrice(f))}"/></td><td><textarea data-price-reason="${f.number}" placeholder="Motivo da alteração"></textarea></td><td><span class="muted small">${h.length} registos</span><br><span class="muted small">Último: ${last?esc(last.date):'—'}</span></td></tr>`}).join(''):'<tr><td colspan="8"><div class="empty-state">Sem frações.</div></td></tr>';el.pricesTableBody.querySelectorAll('[data-price]').forEach(inp=>inp.onchange=()=>{const n=+inp.dataset.price,f=getF(n),old=finalPrice(f),p=num(inp.value);if(!p||p===old)return;const r=document.querySelector(`[data-price-reason="${n}"]`).value.trim();state.data.finalPrices[n]=Math.round(p);state.data.priceHistory[n] ||= [];state.data.priceHistory[n].push({date:today(),price:Math.round(p),oldPrice:Math.round(old),reason:r||'Alteração manual'});save();renderAll()})}
function renderHistory(){const f=getF(+el.historyFractionSelect.value)||state.fractions[0];if(!f)return;const h=historyOf(f);draw(h,f);el.historyList.innerHTML=h.slice().reverse().map(x=>`<div class="history-item"><strong>${esc(x.date)} · ${money(x.price)}</strong><p class="muted">${esc(x.reason||'Sem nota')}</p></div>`).join('')}
function draw(h,f){const c=el.priceHistoryChart,ctx=c.getContext('2d'),w=c.width,hgt=c.height;ctx.clearRect(0,0,w,hgt);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,hgt);ctx.strokeStyle='#d9e1eb';for(let i=0;i<5;i++){let y=50+i*((hgt-100)/4);ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(w-30,y);ctx.stroke()}ctx.fillStyle='#16233d';ctx.font='24px sans-serif';ctx.fillText(`Evolução do preço · ${f.name}`,60,34);if(!h.length)return;let vals=h.map(x=>+x.price),mn=Math.min(...vals),mx=Math.max(...vals);if(mn===mx){mn*=.95;mx*=1.05}const L=60,R=30,T=60,B=55,PW=w-L-R,PH=hgt-T-B,x=i=>L+(h.length===1?PW/2:i*PW/(h.length-1)),y=v=>T+(mx-v)*PH/(mx-mn);ctx.strokeStyle='#1e467c';ctx.lineWidth=4;ctx.beginPath();h.forEach((it,i)=>i?ctx.lineTo(x(i),y(it.price)):ctx.moveTo(x(i),y(it.price)));ctx.stroke();h.forEach((it,i)=>{ctx.fillStyle='#b89253';ctx.beginPath();ctx.arc(x(i),y(it.price),7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#61718b';ctx.font='14px sans-serif';ctx.fillText(money(it.price),x(i)-42,y(it.price)-14)})}
function renderCompare(){const a=getF(+el.compareA.value)||state.fractions[0],b=getF(+el.compareB.value)||state.fractions[1]||a;el.compareResult.innerHTML=[panel(a),panel(b)].join('')}
function panel(f){return`<article class="compare-panel"><span class="${badge(statusOf(f))}">${esc(statusOf(f))}</span><h3>${esc(f.name)}</h3><p class="muted">${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation||'—')}</p><table class="compare-table">${row('Preço final',money(finalPrice(f)))}${row('Preço inicial',money(f.price))}${row('Preço venda real',salePrice(f)?money(salePrice(f)):'—')}${row('ABP',area(f.abp))}${row('Exterior',area(f.terrace))}${row('Área total',area(f.totalArea))}${row('€/m² final',f.totalArea?money(Math.round(finalPrice(f)/f.totalArea),0):'—')}</table></article>`}
function renderClientSelects(){const opts=state.data.clients.map(c=>[c.id,c.name||'Cliente sem nome']);fillMulti(el.selectedClient,opts);fillMulti(el.eventClientId,opts);if(!state.selectedClientId&&state.data.clients[0])state.selectedClientId=state.data.clients[0].id;el.selectedClient.value=state.selectedClientId;el.eventClientId.value=state.selectedClientId;}
function renderClients(){const s=norm(state.cf.search),st=state.cf.stage;const cs=state.data.clients.filter(c=>(st==='all'||c.stage===st)&&(!s||norm([c.name,c.email,c.phone,c.origin,c.agent,c.agency,c.notes].join(' ')).includes(s)));el.clientsList.innerHTML=cs.length?cs.map(c=>`<div class="client-card ${c.id===state.selectedClientId?'active':''}" data-client="${c.id}"><strong>${esc(c.name||'Cliente sem nome')}</strong><p class="muted small">${esc(c.phone||'')} · ${esc(c.email||'')}</p><span class="badge badge--neutral">${esc(c.stage||'Novo lead')}</span></div>`).join(''):'<div class="empty-state">Sem clientes.</div>';el.clientsList.querySelectorAll('[data-client]').forEach(card=>card.onclick=()=>{state.selectedClientId=card.dataset.client;el.selectedClient.value=state.selectedClientId;renderClients();renderClientDetail()})}
function renderClientDetail(){const c=client(state.selectedClientId);if(!c){el.clientDetail.innerHTML='<div class="empty-state">Selecione ou crie um cliente.</div>';return}const evs=state.data.events.filter(e=>e.clientId===c.id).sort((a,b)=>String(b.date+' '+b.time).localeCompare(String(a.date+' '+a.time)));el.clientDetail.innerHTML=`<div class="section-heading"><div><h2>${esc(c.name||'Cliente sem nome')}</h2><p class="muted">${esc(c.phone||'')} · ${esc(c.email||'')}</p></div><button class="ghost-button" data-edit-client="${c.id}">Editar ficha</button></div><div class="kpi-grid"><article class="kpi-card"><span>Estado</span><strong>${esc(c.stage||'Novo lead')}</strong></article><article class="kpi-card"><span>Orçamento</span><strong>${c.budget?money(c.budget):'—'}</strong></article><article class="kpi-card"><span>Eventos</span><strong>${evs.length}</strong></article><article class="kpi-card"><span>Frações interesse</span><strong>${(c.fractions||[]).length}</strong></article></div><h3>Linha do tempo</h3><div class="timeline">${evs.length?evs.map(e=>`<div class="timeline-item"><strong>${esc(e.date||'')} ${esc(e.time||'')} · ${esc(e.type)}</strong><p class="muted">Frações: ${esc((e.fractions||[]).map(n=>'Apt. '+n).join(', ')||'—')}</p>${e.amount?`<p><strong>Valor:</strong> ${money(e.amount)}</p>`:''}<p>${esc(e.notes||'')}</p>${e.objections?`<p><strong>Objeções:</strong> ${esc(e.objections)}</p>`:''}</div>`).join(''):'<div class="empty-state">Sem eventos para este cliente.</div>'}</div>`;el.clientDetail.querySelector('[data-edit-client]')?.addEventListener('click',()=>openClientModal(c.id))}
function renderSales(){el.salesTableBody.innerHTML=state.fractions.map(f=>{const m=metrics(f.number);return`<tr><td><strong>${esc(f.name)}</strong><div class="muted small">${esc(f.typology)} · ${esc(f.orientation||'—')}</div></td><td><select data-status="${f.number}">${STATUS.map(s=>`<option ${s===statusOf(f)?'selected':''}>${esc(s)}</option>`).join('')}</select></td><td class="num-col">${money(finalPrice(f))}</td><td class="num-col"><input type="number" step="1000" data-sale-price="${f.number}" value="${salePrice(f)||''}" placeholder="€"/></td><td class="num-col">${m.visits}</td><td class="num-col">${m.interested}</td><td class="num-col">${m.proposals}</td><td class="num-col">${m.lastOffer?money(m.lastOffer):'—'}</td><td>${esc(m.lastAction||'—')}</td></tr>`}).join('');el.salesTableBody.querySelectorAll('[data-status]').forEach(s=>s.onchange=()=>{const n=+s.dataset.status,old=statusOf(getF(n)),st=s.value;state.data.statuses[n]=st;if((st==='Reservado'||st==='Vendido')&&!state.data.salePrices[n]){const f=getF(n),v=prompt(`${f.name} foi marcado como ${st}.\nPreço definido: ${money(finalPrice(f))}\nConfirme o preço real ou deixe vazio para usar o preço definido:`,Math.round(finalPrice(f)));state.data.salePrices[n]=v?num(v):finalPrice(f)}state.data.events.push({id:id(),clientId:'',date:today(),time:'',type:'Alteração de estado',fractions:[n],amount:0,notes:`Estado alterado de ${old} para ${st}`});save();renderAll()});el.salesTableBody.querySelectorAll('[data-sale-price]').forEach(i=>i.onchange=()=>{state.data.salePrices[+i.dataset.salePrice]=num(i.value);save();renderAll()})}
function openClientModal(cid=''){const c=client(cid)||{};el.clientId.value=c.id||'';el.clientName.value=c.name||'';el.clientPhone.value=c.phone||'';el.clientEmail.value=c.email||'';el.clientNif.value=c.nif||'';el.clientNationality.value=c.nationality||'';el.clientOrigin.value=c.origin||'Portal imobiliário';el.clientAgent.value=c.agent||'';el.clientAgency.value=c.agency||'';el.clientBudget.value=c.budget||'';el.clientStage.value=c.stage||'Novo lead';setMulti(el.clientFractions,c.fractions||[]);el.clientNotes.value=c.notes||'';el.clientModal.classList.remove('hidden');document.body.style.overflow='hidden'}
function closeClientModal(){el.clientModal.classList.add('hidden');document.body.style.overflow=''}
function saveClient(){let cid=el.clientId.value||id();const c={id:cid,name:el.clientName.value.trim(),phone:el.clientPhone.value.trim(),email:el.clientEmail.value.trim(),nif:el.clientNif.value.trim(),nationality:el.clientNationality.value.trim(),origin:el.clientOrigin.value,agent:el.clientAgent.value.trim(),agency:el.clientAgency.value.trim(),budget:num(el.clientBudget.value),stage:el.clientStage.value,fractions:getMulti(el.clientFractions).map(Number),notes:el.clientNotes.value.trim(),updated:new Date().toLocaleString('pt-PT')};const idx=state.data.clients.findIndex(x=>x.id===cid);idx>=0?state.data.clients[idx]=c:state.data.clients.push(c);state.selectedClientId=cid;save();closeClientModal();renderAll()}
function openEventModal(){el.eventClientId.value=state.selectedClientId||'';el.eventType.value='Reunião com cliente';el.eventDate.value=today();el.eventTime.value='';el.eventAmount.value='';el.eventInterest.value='';el.eventFollowup.value='';el.eventFollowupDate.value='';setMulti(el.eventFractions,[]);el.eventObjections.value='';el.eventNotes.value='';el.eventModal.classList.remove('hidden');document.body.style.overflow='hidden'}
function closeEventModal(){el.eventModal.classList.add('hidden');document.body.style.overflow=''}
function saveEvent(){const cid=el.eventClientId.value;if(!cid){alert('Escolha um cliente.');return}const frs=getMulti(el.eventFractions).map(Number);if(!frs.length){alert('Escolha pelo menos uma fração.');return}const ev={id:id(),clientId:cid,type:el.eventType.value,date:el.eventDate.value||today(),time:el.eventTime.value,amount:num(el.eventAmount.value),interest:el.eventInterest.value,followup:el.eventFollowup.value,followupDate:el.eventFollowupDate.value,fractions:frs,objections:el.eventObjections.value.trim(),notes:el.eventNotes.value.trim()};state.data.events.push(ev);const c=client(cid);if(c){c.fractions=uniqNum([...(c.fractions||[]),...frs]);if(['Proposta recebida','Contra-proposta enviada'].includes(ev.type))c.stage='Em negociação';if(ev.type==='Visita')c.stage='Visitou';if(ev.type==='Reserva')c.stage='Reserva';if(ev.type==='Venda')c.stage='Vendido'}if(ev.type==='Reserva')frs.forEach(n=>{state.data.statuses[n]='Reservado';if(ev.amount)state.data.salePrices[n]=ev.amount});if(ev.type==='Venda')frs.forEach(n=>{state.data.statuses[n]='Vendido';if(ev.amount)state.data.salePrices[n]=ev.amount});save();closeEventModal();renderAll()}
function exportPdf(){
  const fs=state.fractions.filter(f=>state.selected.has(f.number)&&statusOf(f)!=='Vendido').sort((a,b)=>a.number-b.number);
  if(!fs.length){alert('Selecione pelo menos uma fração disponível.');return}
  const include=el.proposalIncludePlants.checked;
  const w=window.open('','_blank');
  if(!w){alert('Autorize pop-ups para gerar o PDF.');return}

  const publicArea=v=>Math.max(0,Math.floor((+v||0)-2));
  const disclaimer='Documento meramente informativo e de apresentação comercial. Os valores, áreas e condições aqui indicados não constituem proposta contratual, reserva, promessa de venda ou proposta oficial, estando sujeitos a confirmação e aprovação pela entidade promotora.';

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
        <div class="pdf-price"><span>Preço de apresentação</span><strong>${money(finalPrice(f))}</strong></div>
      </header>

      <div class="pdf-cards">
        <article><span>ABP aprox.</span><strong>${abpPublic} m²</strong></article>
        <article><span>Varanda/Terraço aprox.</span><strong>${extPublic} m²</strong></article>
        <article><span>Área total aprox.</span><strong>${totalPublic} m²</strong></article>
        <article><span>Tipologia</span><strong>${esc(f.typology)}</strong></article>
      </div>

      ${include?`<div class="pdf-plant-wrap">${plant?`<img class="pdf-plant" src="${plant}" />`:'<div class="pdf-missing">Planta indisponível para esta fração.</div>'}</div>`:''}

      <footer class="pdf-footer">
        <p>${esc(disclaimer)}</p>
      </footer>
    </section>`;
  }).join('');

  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>The View · Proposta Cliente</title>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap');
  @page{size:A4 portrait;margin:12mm}
  *{box-sizing:border-box}
  body{font-family:'Montserrat',Arial,sans-serif;margin:0;color:#0f2443;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pdf-page{min-height:calc(297mm - 24mm);page-break-after:always;display:flex;flex-direction:column;gap:13mm}
  .pdf-page.last{page-break-after:auto}
  .pdf-header{display:grid;grid-template-columns:1fr auto;gap:18mm;align-items:start;border-bottom:1px solid #d9e1eb;padding-bottom:8mm}
  .pdf-eyebrow{margin:0 0 4mm;text-transform:uppercase;letter-spacing:.26em;font-size:9px;font-weight:700;color:#9a7440}
  h1{font-family:'Cormorant Garamond','Times New Roman',serif;margin:0;font-size:35pt;line-height:.95;font-weight:700;letter-spacing:.01em;color:#0e2444}
  .pdf-subtitle{margin:5mm 0 0;font-size:12pt;color:#435675;font-weight:500}
  .pdf-price{min-width:48mm;text-align:right;background:#f5f7fa;border:1px solid #dbe4ef;border-radius:14px;padding:7mm 8mm}
  .pdf-price span{display:block;font-size:8.5pt;text-transform:uppercase;letter-spacing:.08em;color:#63748d;margin-bottom:3mm}
  .pdf-price strong{font-size:23pt;color:#0e2444;white-space:nowrap}
  .pdf-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}
  .pdf-cards article{background:#f8fafc;border:1px solid #e1e9f2;border-radius:12px;padding:5mm}
  .pdf-cards span{display:block;font-size:8.5pt;color:#63748d;margin-bottom:2mm}
  .pdf-cards strong{display:block;font-size:14pt;color:#0e2444}
  .pdf-plant-wrap{flex:1;min-height:130mm;display:flex;justify-content:center;align-items:center;border:1px solid #e1e9f2;border-radius:18px;overflow:hidden;padding:7mm;background:#fff}
  .pdf-plant{max-width:100%;max-height:150mm;object-fit:contain;display:block}
  .pdf-missing{color:#63748d;font-size:11pt}
  .pdf-footer{margin-top:auto;border-top:1px solid #d9e1eb;padding-top:5mm}
  .pdf-footer p{margin:0;color:#62738a;font-size:8.5pt;line-height:1.55;text-align:justify}
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
function ensureHistory(){state.fractions.forEach(f=>{state.data.priceHistory[f.number] ||= [{date:today(),price:finalPrice(f),reason:'Preço inicial definido'}]});save()}
function getF(n){return state.fractions.find(f=>f.number===n)}function client(id){return state.data.clients.find(c=>c.id===id)}function finalPrice(f){return +state.data.finalPrices[f.number]||SUG[f.number]||f.price}function statusOf(f){return f?state.data.statuses[f.number]||'Disponível':'Disponível'}function salePrice(f){return +state.data.salePrices[f.number]||0}function historyOf(f){return state.data.priceHistory[f.number]||[]}function normalizeData(d={}){return{finalPrices:d.finalPrices||{},statuses:d.statuses||{},salePrices:d.salePrices||{},priceHistory:d.priceHistory||{},clients:d.clients||[],events:d.events||[]}}
function loadDataLocal(){try{return normalizeData(JSON.parse(localStorage.getItem(KEY))||{})}catch{return normalizeData()}}

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
  const j = await loadRemoteJsonp();
  if(j && j.ok && j.data){
    state.data = normalizeData(j.data);
    localStorage.setItem(KEY, JSON.stringify(state.data));
    setStatus('Dados carregados do Google Sheets');
    return;
  }
  if(j && j.error) throw new Error(j.error);
  throw new Error('Resposta inválida do Google Sheets');
}
let saveTimer=null;
function save(){localStorage.setItem(KEY,JSON.stringify(state.data));if(REMOTE_URL){clearTimeout(saveTimer);saveTimer=setTimeout(syncRemote,500)}}
async function syncRemote(){
  if(!REMOTE_URL) return;
  try{
    setStatus('A guardar no Google Sheets…');
    await fetch(REMOTE_URL,{
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:'save',data:state.data,updatedAt:new Date().toISOString()})
    });
    // Com no-cors o browser não permite ler a resposta, mas o Apps Script recebe o POST.
    setStatus('Enviado para Google Sheets');
  }catch(e){
    console.warn('Falha ao guardar Google Sheets',e);
    setStatus('Falha ao sincronizar · dados guardados localmente');
  }
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


function fill(sel,vals,allLabel,labelFn){sel.innerHTML=vals.map(v=>`<option value="${attr(v)}">${v==='all'?allLabel:esc(labelFn?labelFn(v):v)}</option>`).join('')}function fillMulti(sel,vals){sel.innerHTML=vals.map(([v,l])=>`<option value="${attr(v)}">${esc(l)}</option>`).join('')}function setMulti(sel,vals){[...sel.options].forEach(o=>o.selected=vals.map(String).includes(o.value))}function getMulti(sel){return[...sel.selectedOptions].map(o=>o.value)}function row(a,b){return`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`}function kpi(a,b,c){return`<article class="kpi-card"><span>${esc(a)}</span><strong>${esc(b)}</strong><small>${esc(c||'')}</small></article>`}function badge(st){return'badge '+(st==='Vendido'?'badge--sold':st==='Reservado'?'badge--reserved':'badge--available')}function setStatus(t){el.dataStatus.textContent=t}function showError(t){el.globalErrorBox.textContent=t;el.globalErrorBox.classList.remove('hidden')}function num(v){if(typeof v==='number'&&isFinite(v))return v;const n=Number(safe(v).replace(/\s+/g,'').replace(/€/g,'').replace(/m²/gi,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(/,(?=\d{2,}$)/g,'.').replace(/[^0-9.-]/g,''));return isFinite(n)?n:0}function floor(v){if(typeof v==='number')return v;const m=safe(v).match(/-?\d+/);return m?+m[0]:null}function nat(s,fb=null){const m=safe(s).match(/\d+/);return m?+m[0]:fb}function pretty(v){return safe(v).replace(/\s+/g,' ').replace(/DUPLEX/i,'Duplex').replace(/DUP$/i,'Duplex')}function safe(v){return v==null?'':String(v).trim()}function norm(v){return safe(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}function uniq(a){return[...new Set(a.filter(Boolean))].sort((x,y)=>String(x).localeCompare(String(y),'pt-PT',{numeric:true,sensitivity:'base'}))}function uniqNum(a){return[...new Set(a.map(Number).filter(Boolean))].sort((x,y)=>x-y)}function sum(a){return a.reduce((x,y)=>x+(+y||0),0)}function money(v,d=0){return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',minimumFractionDigits:d,maximumFractionDigits:d}).format(+v||0)}function area(v){return`${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2}).format(+v||0)} m²`}function today(){return new Date().toISOString().slice(0,10)}function id(){return String(Date.now())+String(Math.random()).slice(2,7)}function esc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}function attr(v){return esc(v).replace(/`/g,'&#096;')}
})();