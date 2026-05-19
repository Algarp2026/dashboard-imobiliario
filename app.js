
'use strict';

(() => {
  const DATA_FILES = ['data.xlsx', 'data.xls'];
  const STORAGE_KEY = 'theViewCommercialSuiteV1';
  const PLANT_MAP = {"1": {"image": "plantas/planta-apartamento-01.jpg", "pdf": "plantas/planta-apartamento-01.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_01.pdf"}, "2": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "10": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "17": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "24": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "31": {"image": "plantas/planta-apartamento-02-10-17-24-31.jpg", "pdf": "plantas/planta-apartamento-02-10-17-24-31.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf"}, "3": {"image": "plantas/planta-apartamento-03.jpg", "pdf": "plantas/planta-apartamento-03.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_03.pdf"}, "4": {"image": "plantas/planta-apartamento-04.jpg", "pdf": "plantas/planta-apartamento-04.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_04.pdf"}, "5": {"image": "plantas/planta-apartamento-05.jpg", "pdf": "plantas/planta-apartamento-05.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_05.pdf"}, "6": {"image": "plantas/planta-apartamento-06.jpg", "pdf": "plantas/planta-apartamento-06.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_06.pdf"}, "7": {"image": "plantas/planta-apartamento-07-15.jpg", "pdf": "plantas/planta-apartamento-07-15.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf"}, "15": {"image": "plantas/planta-apartamento-07-15.jpg", "pdf": "plantas/planta-apartamento-07-15.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf"}, "8": {"image": "plantas/planta-apartamento-08.jpg", "pdf": "plantas/planta-apartamento-08.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_08.pdf"}, "9": {"image": "plantas/planta-apartamento-09-16.jpg", "pdf": "plantas/planta-apartamento-09-16.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf"}, "16": {"image": "plantas/planta-apartamento-09-16.jpg", "pdf": "plantas/planta-apartamento-09-16.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf"}, "11": {"image": "plantas/planta-apartamento-11.jpg", "pdf": "plantas/planta-apartamento-11.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_11.pdf"}, "12": {"image": "plantas/planta-apartamento-12.jpg", "pdf": "plantas/planta-apartamento-12.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_12.pdf"}, "13": {"image": "plantas/planta-apartamento-13.jpg", "pdf": "plantas/planta-apartamento-13.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_13.pdf"}, "14": {"image": "plantas/planta-apartamento-14.jpg", "pdf": "plantas/planta-apartamento-14.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_14.pdf"}, "18": {"image": "plantas/planta-apartamento-18.jpg", "pdf": "plantas/planta-apartamento-18.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_18.pdf"}, "19": {"image": "plantas/planta-apartamento-19.jpg", "pdf": "plantas/planta-apartamento-19.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_19.pdf"}, "20": {"image": "plantas/planta-apartamento-20.jpg", "pdf": "plantas/planta-apartamento-20.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_20.pdf"}, "21": {"image": "plantas/planta-apartamento-21.jpg", "pdf": "plantas/planta-apartamento-21.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_21.pdf"}, "22": {"image": "plantas/planta-apartamento-22.jpg", "pdf": "plantas/planta-apartamento-22.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_22.pdf"}, "23": {"image": "plantas/planta-apartamento-23-30.jpg", "pdf": "plantas/planta-apartamento-23-30.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf"}, "30": {"image": "plantas/planta-apartamento-23-30.jpg", "pdf": "plantas/planta-apartamento-23-30.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf"}, "25": {"image": "plantas/planta-apartamento-25.jpg", "pdf": "plantas/planta-apartamento-25.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_25.pdf"}, "26": {"image": "plantas/planta-apartamento-26.jpg", "pdf": "plantas/planta-apartamento-26.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_26.pdf"}, "27": {"image": "plantas/planta-apartamento-27.jpg", "pdf": "plantas/planta-apartamento-27.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_27.pdf"}, "28": {"image": "plantas/planta-apartamento-28.jpg", "pdf": "plantas/planta-apartamento-28.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_28.pdf"}, "29": {"image": "plantas/planta-apartamento-29.jpg", "pdf": "plantas/planta-apartamento-29.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_29.pdf"}, "32": {"image": "plantas/planta-apartamento-32.jpg", "pdf": "plantas/planta-apartamento-32.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_32.pdf"}, "33": {"image": "plantas/planta-apartamento-33.jpg", "pdf": "plantas/planta-apartamento-33.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_33.pdf"}, "34": {"image": "plantas/planta-apartamento-34.jpg", "pdf": "plantas/planta-apartamento-34.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_34.pdf"}, "35": {"image": "plantas/planta-apartamento-35.jpg", "pdf": "plantas/planta-apartamento-35.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_35.pdf"}, "36": {"image": "plantas/planta-apartamento-36.jpg", "pdf": "plantas/planta-apartamento-36.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_36.pdf"}, "37": {"image": "plantas/planta-apartamento-37.jpg", "pdf": "plantas/planta-apartamento-37.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_37.pdf"}, "38": {"image": "plantas/planta-apartamento-38.jpg", "pdf": "plantas/planta-apartamento-38.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_38.pdf"}, "39": {"image": "plantas/planta-apartamento-39.jpg", "pdf": "plantas/planta-apartamento-39.pdf", "source": "Planta_THE VIEW OLHAO_Apartamento_39.pdf"}};

  const ORIENTATION_BY_FRACTION = {
    1:'Sul/Este',2:'Sul/Oeste',3:'Oeste',4:'Oeste',5:'Oeste',6:'Este/Oeste',7:'Este',8:'Este',9:'Sul/Este',10:'Sul/Oeste',
    11:'Oeste',12:'Oeste',13:'Oeste',14:'Este/Oeste',15:'Este',16:'Sul/Este',17:'Sul/Oeste',18:'Oeste',19:'Oeste',20:'Oeste',
    21:'Este/Oeste',22:'Este',23:'Sul/Este',24:'Sul/Oeste',25:'Oeste',26:'Este/Oeste',27:'Oeste',28:'Este/Oeste',29:'Este',30:'Sul/Este',
    31:'Sul/Oeste',32:'Oeste',33:'Este/Oeste',34:'Este/Oeste',35:'Este/Oeste',36:'Sul/Este',37:'Sul/Oeste',38:'Oeste',39:'Este/Oeste'
  };

  const DEFAULT_DECISIONS = {
    1: {state:'Rever gerência', proposedNow:545000, min:530000, classification:'Produto especial', argument:'T1 especial, com área total e exterior muito acima do padrão. Deve ser vendido como produto raro, não como T1 convencional.', strengths:'Área/exterior, Sul/Este, produto atípico.', weaknesses:'Preço alto para T1; exige explicação.', buyer:'Cliente que quer T1 especial e área exterior.', approval:true},
    2: {state:'Aplicar agora', proposedNow:615000, min:600000, classification:'T2 forte', argument:'T2 amplo Sul/Oeste. Preço reforçado, mas ainda coerente com T2 fortes.', strengths:'Área, orientação, leitura familiar.', weaknesses:'Piso 1.', buyer:'Cliente que procura T2 amplo.', approval:false},
    3: {state:'Manter', proposedNow:380000, min:370000, classification:'T1 forte de entrada', argument:'T1 Oeste com boa leitura de luminosidade/enquadramento. Deve ser defendido acima de T1 fracos, mas sem prémio de piso 4+.', strengths:'Boa planta/luz relativa.', weaknesses:'Piso baixo, Oeste.', buyer:'Cliente T1 racional.', approval:false},
    4: {state:'Manter', proposedNow:475000, min:460000, classification:'Melhor T1+1', argument:'T1+1 forte, com área interior relevante. Deve ficar acima de T1 médios e abaixo de T2 reais.', strengths:'Mais uma divisão, área interior.', weaknesses:'Oeste, piso baixo.', buyer:'Cliente que quer T1 com escritório/quarto extra.', approval:false},
    5: {state:'Manter', proposedNow:450000, min:438000, classification:'T1+1 bom', argument:'T1+1 equilibrado. Deve ficar abaixo do 4 e próximo do 12, dependendo da valorização do exterior.', strengths:'Funcionalidade +1.', weaknesses:'Piso 1.', buyer:'Cliente que valoriza divisão extra.', approval:false},
    6: {state:'Manter', proposedNow:600000, min:585000, classification:'T2+1 prudente', argument:'T2+1 deve ser mais forte que T2 médio, mas não competir com T3 verdadeiro.', strengths:'+1, área, flexibilidade.', weaknesses:'Não é T3 real.', buyer:'Família pequena ou cliente com escritório.', approval:false},
    7: {state:'Aplicar agora', proposedNow:535000, min:520000, classification:'T2 entrada', argument:'T2 Este de entrada, com vista doca garantida mas piso 1. Bom produto de acesso à tipologia.', strengths:'Este/doca, preço de entrada.', weaknesses:'Piso 1.', buyer:'Cliente que quer T2 mais acessível.', approval:false},
    8: {state:'Aplicar agora', proposedNow:385000, min:375000, classification:'T1 compacto', argument:'T1 compacto com vista Este. Mantém ponto de entrada, com pequeno reforço.', strengths:'Este/doca, preço acessível.', weaknesses:'Área menor.', buyer:'Cliente T1 compacto.', approval:false},
    9: {state:'Subida faseada', proposedNow:915000, min:895000, classification:'T3 forte', argument:'T3 Sul/Este com vista forte. Subida deve ser faseada para evitar resistência.', strengths:'Vista, área, tipologia.', weaknesses:'Salto de preço exige defesa.', buyer:'Família premium.', approval:true},
    10: {state:'Subida faseada', proposedNow:635000, min:620000, classification:'T2 forte', argument:'T2 Sul/Oeste com progressão natural face ao 2.', strengths:'Área, orientação.', weaknesses:'Não é piso 4+.', buyer:'Cliente T2 sólido.', approval:false},
    11: {state:'Manter', proposedNow:400000, min:390000, classification:'T1 médio', argument:'T1 Oeste equilibrado. Preço controlado para não competir com T1 Este/premium.', strengths:'Preço acessível.', weaknesses:'Oeste.', buyer:'Cliente T1 racional.', approval:false},
    12: {state:'Aplicar agora', proposedNow:455000, min:442000, classification:'T1+1 equivalente ao 5', argument:'T1+1 com piso superior e mais exterior. Deve ficar ligeiramente acima do 5 se a luminosidade for equivalente.', strengths:'Piso 2, exterior.', weaknesses:'Menos área interior que o 5.', buyer:'Cliente que valoriza exterior e +1.', approval:false},
    13: {state:'Aplicar agora', proposedNow:435000, min:423000, classification:'T1+1 entrada', argument:'Menor T1+1. Deve ficar acima de T1 médios, mas abaixo do 5/12/4.', strengths:'+1 a preço acessível.', weaknesses:'Menor área.', buyer:'Cliente T1+1 de entrada.', approval:false},
    14: {state:'Manter', proposedNow:580000, min:565000, classification:'T2 médio', argument:'T2 Este/Oeste com área boa; preço defensável.', strengths:'Área, dupla orientação.', weaknesses:'Antes do piso 4.', buyer:'Cliente T2 equilibrado.', approval:false},
    15: {state:'Aplicar agora', proposedNow:560000, min:545000, classification:'T2 Este', argument:'T2 Este quase equivalente ao 7 em área. Diferença deve ser moderada porque o salto qualitativo real começa no piso 4.', strengths:'Este/doca, piso 2.', weaknesses:'Área semelhante ao 7.', buyer:'Cliente T2 Este.', approval:false},
    16: {state:'Subida faseada', proposedNow:985000, min:960000, classification:'T3 premium faseado', argument:'T3 Sul/Este superior ao 9; subir por fases.', strengths:'Vista, piso, área.', weaknesses:'Preço alto.', buyer:'Família premium.', approval:true},
    17: {state:'Subida faseada', proposedNow:640000, min:625000, classification:'T2 forte', argument:'T2 Sul/Oeste com progressão controlada face ao 10.', strengths:'Piso, área, orientação.', weaknesses:'Ainda antes do piso 4.', buyer:'Cliente T2 forte.', approval:false},
    18: {state:'Aplicar agora', proposedNow:420000, min:408000, classification:'T1 médio', argument:'T1 Oeste com preço um pouco acima dos T1 de entrada, mas abaixo de T1 Este/piso 4+.', strengths:'Piso intermédio.', weaknesses:'Oeste.', buyer:'Cliente T1 médio.', approval:false},
    19: {state:'Aplicar agora', proposedNow:370000, min:360000, classification:'Oportunidade', argument:'Único T1 sem garagem. Desconto comercial forte justificado pela objeção de estacionamento.', strengths:'Preço de entrada.', weaknesses:'Sem garagem.', buyer:'Cliente que aceita abdicar de garagem.', approval:false},
    20: {state:'Manter', proposedNow:400000, min:390000, classification:'T1 sensível', argument:'T1 Oeste; manter preço controlado.', strengths:'Preço claro.', weaknesses:'Sem prémio real de vista.', buyer:'Cliente T1 racional.', approval:false},
    21: {state:'Subida faseada', proposedNow:600000, min:585000, classification:'T2 médio', argument:'T2 Este/Oeste, área menor que alguns pares; preço controlado.', strengths:'Dupla orientação.', weaknesses:'Área mais sensível.', buyer:'Cliente T2 médio.', approval:false},
    22: {state:'Subida faseada', proposedNow:590000, min:575000, classification:'T2 médio', argument:'T2 Este equilibrado. Não deve ficar demasiado acima do 21 sem razão clara.', strengths:'Este/doca.', weaknesses:'Área não premium.', buyer:'Cliente T2 Este.', approval:false},
    23: {state:'Rever gerência', proposedNow:900000, min:880000, classification:'T2 premium sensível', argument:'T2 Sul/Este vista 1. Rever coerência com o 30 antes de comunicar como tabela final.', strengths:'Vista 1, piso 4+.', weaknesses:'Comparação direta com 30.', buyer:'Cliente premium T2.', approval:true},
    24: {state:'Subida faseada', proposedNow:655000, min:640000, classification:'T2 forte', argument:'T2 Sul/Oeste piso 4+: já acima da envolvente, justifica prémio.', strengths:'Piso 4+, orientação.', weaknesses:'Abaixo dos premium vista 1.', buyer:'Cliente T2 forte.', approval:false},
    25: {state:'Subida faseada', proposedNow:430000, min:418000, classification:'T1 piso 4+', argument:'T1 Oeste já acima dos prédios envolventes; preço reforçado com prudência.', strengths:'Piso 4+.', weaknesses:'Oeste.', buyer:'Cliente T1 com mais abertura.', approval:false},
    26: {state:'Subida faseada', proposedNow:615000, min:600000, classification:'T2 piso 4+', argument:'T2 Este/Oeste com piso 4+; prémio real, mas controlado pela área.', strengths:'Piso 4+, dupla orientação.', weaknesses:'Área mais contida.', buyer:'Cliente T2 com abertura.', approval:false},
    27: {state:'Subida faseada', proposedNow:440000, min:425000, classification:'T1 sensível com exterior', argument:'Piso 4+ e exterior justificam preço, mas validar luz antes de exagerar.', strengths:'Piso 4+, exterior.', weaknesses:'Oeste e sensível.', buyer:'Cliente que valoriza exterior.', approval:false},
    28: {state:'Subida faseada', proposedNow:480000, min:462000, classification:'T1 forte', argument:'T1 Este/Oeste com área total forte e vista Este/doca garantida. Preço acima de T1 médios é defensável.', strengths:'Este/Oeste, área, piso 4+.', weaknesses:'Aproxima dos T1 premium.', buyer:'Cliente T1 forte.', approval:false},
    29: {state:'Subida faseada', proposedNow:475000, min:458000, classification:'T1 forte', argument:'T1 Este com vista doca garantida. Pode ter €/m² superior, mas deve ficar ligeiramente abaixo do 28 pela área.', strengths:'Este/doca, piso 4+.', weaknesses:'Área menor que 28.', buyer:'Cliente T1 com vista.', approval:false},
    30: {state:'Rever gerência', proposedNow:1050000, min:1020000, classification:'T2 premium', argument:'T2 Sul/Este vista 1. Referência premium dos T2, acima do 23.', strengths:'Vista 1, piso 5.', weaknesses:'Preço muito alto para T2.', buyer:'Cliente premium.', approval:true},
    31: {state:'Subida faseada', proposedNow:665000, min:650000, classification:'T2 forte', argument:'T2 Sul/Oeste piso 5; escada coerente face a 24.', strengths:'Piso 5, orientação.', weaknesses:'Abaixo de premium vista 1.', buyer:'Cliente T2 alto.', approval:false},
    32: {state:'Subida faseada', proposedNow:460000, min:442000, classification:'T1 médio alto', argument:'T1 Oeste piso 5. Deve ficar abaixo de 28/29 pela orientação e área, mas já com prémio de altura.', strengths:'Piso 5.', weaknesses:'Oeste, área menor.', buyer:'Cliente T1 alto.', approval:false},
    33: {state:'Subida faseada', proposedNow:625000, min:608000, classification:'T2 alto', argument:'T2 Este/Oeste piso 5; preço deve ficar abaixo do 34 pela área.', strengths:'Piso 5, dupla orientação.', weaknesses:'Área menor.', buyer:'Cliente T2 alto.', approval:false},
    34: {state:'Subida faseada', proposedNow:640000, min:625000, classification:'T2 forte área', argument:'T2 Este/Oeste com área total muito forte. Pode justificar 640-650 mil.', strengths:'Área, piso 5.', weaknesses:'Não é vista 1.', buyer:'Cliente T2 com área.', approval:false},
    35: {state:'Manter', proposedNow:555000, min:540000, classification:'T1 Duplex especial', argument:'Produto único. Concorrente psicológico do Apt. 1: deve ser ligeiramente acima ou próximo, mas sem virar comparação negativa com T2.', strengths:'Duplex, exterior, piso alto, escassez.', weaknesses:'Escadas internas, não é T2.', buyer:'Cliente emocional que quer produto especial.', approval:true},
    36: {state:'Rever gerência', proposedNow:1450000, min:1415000, classification:'T3 topo', argument:'Fração topo/premium. Só negociar com validação da gerência.', strengths:'Topo, vista, escassez.', weaknesses:'Preço exige forte defesa.', buyer:'Cliente premium máximo.', approval:true},
    37: {state:'Manter', proposedNow:1100000, min:1070000, classification:'T2 topo', argument:'T2 premium, piso alto. Deve ser tratado como produto de escassez.', strengths:'Piso 6, orientação, premium.', weaknesses:'Preço muito alto para T2.', buyer:'Cliente premium T2.', approval:true},
    38: {state:'Manter', proposedNow:500000, min:485000, classification:'T1 premium', argument:'T1 piso 6. Preço premium é defensável se a vista/luz real confirmar.', strengths:'Piso 6.', weaknesses:'Oeste; validar vista real.', buyer:'Cliente T1 premium.', approval:true},
    39: {state:'Rever gerência', proposedNow:1100000, min:1070000, classification:'T3 premium', argument:'T3 alto com grande área exterior. Validar diferença face ao 36.', strengths:'Piso alto, T3, exterior.', weaknesses:'Comparação com 36.', buyer:'Cliente premium T3.', approval:true}
  };

  const DEFAULT_STATUS = 'Disponível';
  const COMMERCIAL_STATES = ['Disponível','Reservado','Em negociação','Vendido','Bloqueado','Rever preço','Oportunidade','Premium'];
  const SALES_STAGES = ['Novo lead','Contactado','Visita marcada','Visitado','Proposta enviada','Em negociação','Reservado','Vendido','Perdido'];

  const state = {
    rows: [], fractions: [], competitors: [],
    activeView: 'home', commercialTab: 'dashboard',
    compare: { typology:'all', floor:'all', view:'all', fraction:'all', development:'all' },
    filters: { search:'', typologies:[], floors:[], showSuggested:true, showOriginal:true, showRationale:true, showFunnel:true },
    selected: new Set(),
    commercialData: loadStoredData()
  };

  const els = {};
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    bindEvents();
    loadData();
  }

  function cacheElements() {
    [
      'dataStatus','globalErrorBox','homeView','compareView','commercialView','backToHomeTop','compareKpis','compareCardsGrid','compareResultCount',
      'compareTypologyFilter','compareFloorFilter','compareViewFilter','compareFractionFilter','compareDevelopmentFilter','commercialKpis','commercialAlerts',
      'commercialSearch','commercialTypologyFilter','commercialFloorFilter','commercialTable','commercialTableBody','selectedFractionsInfo',
      'toggleSuggestedColumn','toggleOriginalColumn','toggleRationaleColumn','toggleFunnelColumn','internalCompareA','internalCompareB','internalCompareResult',
      'argumentFractionSelect','argumentPanel','proposalSelectionGrid','funnelTableBody','managementSummary','managementTableWrap','fractionModal','closeFractionModal','fractionModalContent'
    ].forEach(id => els[id] = document.getElementById(id));
  }

  function bindEvents() {
    document.getElementById('openCompareMode').addEventListener('click', () => showView('compare'));
    document.getElementById('openCommercialMode').addEventListener('click', () => { window.location.href = 'commercial.html'; });
    els.backToHomeTop.addEventListener('click', () => showView('home'));

    document.querySelectorAll('[data-commercial-tab]').forEach(btn => btn.addEventListener('click', () => {
      state.commercialTab = btn.dataset.commercialTab;
      switchCommercialTab();
    }));

    document.getElementById('resetCompareFilters').addEventListener('click', () => {
      state.compare = { typology:'all', floor:'all', view:'all', fraction:'all', development:'all' };
      syncCompareFilters(); renderCompare();
    });
    [['compareTypologyFilter','typology'],['compareFloorFilter','floor'],['compareViewFilter','view'],['compareFractionFilter','fraction'],['compareDevelopmentFilter','development']]
      .forEach(([id,key]) => els[id].addEventListener('change', e => { state.compare[key] = e.target.value; renderCompare(); }));

    document.getElementById('resetCommercialFilters').addEventListener('click', () => {
      state.filters = { search:'', typologies:[], floors:[], showSuggested:true, showOriginal:true, showRationale:true, showFunnel:true };
      syncCommercialFilters(); renderCommercialAll();
    });

    document.getElementById('resetCommercialData').addEventListener('click', () => {
      if (!confirm('Repor todos os dados comerciais guardados localmente?')) return;
      state.commercialData = { finalPrices: {}, minimumPrices: {}, statuses: {}, classifications: {}, arguments: {}, notes: {}, funnel: {} };
      saveStoredData();
      renderCommercialAll();
    });

    els.commercialSearch.addEventListener('input', e => { state.filters.search = e.target.value; renderCommercialAll(); });
    els.commercialTypologyFilter.addEventListener('change', () => { state.filters.typologies = getSelectedOptions(els.commercialTypologyFilter); renderCommercialAll(); });
    els.commercialFloorFilter.addEventListener('change', () => { state.filters.floors = getSelectedOptions(els.commercialFloorFilter); renderCommercialAll(); });

    els.toggleSuggestedColumn.addEventListener('change', e => { state.filters.showSuggested = e.target.checked; updateColumnVisibility(); });
    els.toggleOriginalColumn.addEventListener('change', e => { state.filters.showOriginal = e.target.checked; updateColumnVisibility(); });
    els.toggleRationaleColumn.addEventListener('change', e => { state.filters.showRationale = e.target.checked; updateColumnVisibility(); });
    els.toggleFunnelColumn.addEventListener('change', e => { state.filters.showFunnel = e.target.checked; updateColumnVisibility(); });

    document.getElementById('selectVisibleFractions').addEventListener('click', () => { getFilteredCommercialFractions().forEach(f=>state.selected.add(f.number)); renderCommercialAll(); });
    document.getElementById('clearSelectedFractions').addEventListener('click', () => { state.selected.clear(); renderCommercialAll(); });
    document.getElementById('exportClientPdf').addEventListener('click', exportClientPdf);
    document.getElementById('exportClientPdfTop').addEventListener('click', exportClientPdf);
    document.getElementById('exportCommercialExcelTop').addEventListener('click', exportCommercialExcel);
    document.getElementById('exportFunnelExcel').addEventListener('click', exportFunnelExcel);

    els.internalCompareA.addEventListener('change', renderInternalCompare);
    els.internalCompareB.addEventListener('change', renderInternalCompare);
    els.argumentFractionSelect.addEventListener('change', renderArgumentPanel);

    els.closeFractionModal.addEventListener('click', closeModal);
    els.fractionModal.addEventListener('click', e => { if (e.target === els.fractionModal) closeModal(); });
  }

  async function loadData() {
    setStatus('A carregar dados…'); hideError();
    try {
      const workbook = await loadWorkbook();
      const rows = parseWorkbook(workbook);
      state.rows = rows;
      state.fractions = rows.filter(r=>r.isTheView).sort((a,b)=>a.number-b.number);
      state.competitors = rows.filter(r=>!r.isTheView);
      if (!state.fractions.length) throw new Error('Não foram encontradas frações do The View na folha Dados.');
      populateFilters();
      renderCompare();
      renderCommercialAll();
      setStatus(`${state.rows.length} linhas · ${state.fractions.length} frações The View`);
    } catch (err) {
      console.error(err);
      showError(`Erro ao carregar o Excel.\n\n${err.message || err}`);
      setStatus('Erro no Excel');
    }
  }

  async function loadWorkbook() {
    const res = await fetch('data.json', { cache:'no-store' });
    if (!res.ok) throw new Error(`Não consegui abrir data.json (${res.status}).`);
    return await res.json();
  }

  function parseWorkbook(rawRows) {
    return rawRows.map(parseRow).filter(Boolean);
  }

  function parseRow(raw) {
    const development = safe(raw['Empreendimento']);
    const fractionRaw = safe(raw['Fração']);
    if (!development || !fractionRaw) return null;
    const isTheView = normalize(development) === 'the view';
    const number = isTheView ? naturalNumber(fractionRaw) : naturalNumber(fractionRaw, 0);
    const typology = prettyTypology(raw['Tipologia']);
    const floorLabel = safe(raw['Piso']) || '—';
    const floor = parseFloor(raw['Piso']);
    const view = parseNum(raw['Vista']);
    const abp = parseNum(raw['ABP']);
    const terrace = parseNum(raw['Varanda/Terraço']);
    const totalArea = parseNum(raw['Área Total']) || (abp + terrace);
    const price = parseNum(raw['PVP']);
    const orientation = isTheView ? (ORIENTATION_BY_FRACTION[number] || safe(raw['Orientação'])) : safe(raw['Orientação']);
    return {
      raw, development, fractionRaw, isTheView, number,
      name: isTheView ? fractionRaw : `${development} · ${fractionRaw}`,
      typology, comparableTypology: comparableTypology(typology),
      floor, floorLabel, view, orientation, abp, terrace, totalArea, price,
      pricePerSqm: totalArea ? price / totalArea : 0,
      referenceYear: parseNum(raw['Ano Referência']),
      status: safe(raw['Status']) || '—',
      weight: parseNum(raw['Peso comparável']) || 0
    };
  }

  function populateFilters() {
    fillSelect(els.compareTypologyFilter, ['all', ...unique(state.fractions.map(f=>f.typology))], 'Todas');
    fillSelect(els.compareFloorFilter, ['all', ...unique(state.fractions.map(f=>String(f.floorLabel)))], 'Todos');
    fillSelect(els.compareViewFilter, ['all', ...unique(state.fractions.map(f=>String(f.view || '—')))], 'Todas');
    fillSelect(els.compareFractionFilter, ['all', ...state.fractions.map(f=>f.name)], 'Todas');
    fillSelect(els.compareDevelopmentFilter, ['all', ...unique(state.competitors.map(c=>c.development))], 'Todos');
    fillMulti(els.commercialTypologyFilter, unique(state.fractions.map(f=>f.typology)));
    fillMulti(els.commercialFloorFilter, unique(state.fractions.map(f=>String(f.floorLabel))));
    fillSelect(els.internalCompareA, state.fractions.map(f=>String(f.number)), null, n => `Apartamento ${n}`);
    fillSelect(els.internalCompareB, state.fractions.map(f=>String(f.number)), null, n => `Apartamento ${n}`);
    if (state.fractions[1]) els.internalCompareB.value = String(state.fractions[1].number);
    fillSelect(els.argumentFractionSelect, state.fractions.map(f=>String(f.number)), null, n => `Apartamento ${n}`);
  }

  function renderCompare() {
    const fractions = filteredCompareFractions();
    const comps = filteredCompetitors();
    const avg = fractions.length ? sum(fractions.map(f=>f.pricePerSqm)) / fractions.length : 0;
    els.compareKpis.innerHTML = [
      kpi('Frações visíveis', fractions.length, 'Inventário filtrado'),
      kpi('Concorrentes', comps.length, 'Rows do compset'),
      kpi('€/m² médio', avg ? money(Math.round(avg),0) : '—', 'Área total')
    ].join('');
    els.compareResultCount.textContent = `${fractions.length} frações visíveis`;
    els.compareCardsGrid.innerHTML = fractions.length ? fractions.map(cardHtml).join('') : `<div class="empty-state">Sem frações para apresentar.</div>`;
    els.compareCardsGrid.querySelectorAll('[data-open-fraction]').forEach(btn => btn.addEventListener('click', () => openFractionModal(getFraction(Number(btn.dataset.openFraction)))));
  }

  function cardHtml(f) {
    return `<article class="fraction-card">
      <div class="fraction-card__top"><div><h3>${esc(f.name)}</h3><p class="muted small">${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation || '—')}</p></div><span class="badge badge--accent">Vista ${f.view || '—'}</span></div>
      <div class="fraction-card__metrics">
        <div class="metric-box"><span>Preço</span><strong>${money(f.price)}</strong></div>
        <div class="metric-box"><span>€/m²</span><strong>${money(Math.round(f.pricePerSqm),0)}</strong></div>
        <div class="metric-box"><span>ABP</span><strong>${area(f.abp)}</strong></div>
        <div class="metric-box"><span>Área total</span><strong>${area(f.totalArea)}</strong></div>
      </div>
      <div class="fraction-card__actions"><button class="inline-button" data-open-fraction="${f.number}" type="button">Ver detalhe e comps →</button></div>
    </article>`;
  }

  function openFractionModal(f) {
    if (!f) return;
    const direct = compMatches(f,'direct');
    const indirect = compMatches(f,'indirect');
    const broad = compMatches(f,'broad');
    els.fractionModalContent.innerHTML = `<div class="modal-grid">
      <section><p class="eyebrow eyebrow--dark">Fração</p><h2 id="modalTitle">${esc(f.name)}</h2><p class="muted">${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation || '—')}</p>
        <div class="cards-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:16px">
          ${metric('Preço',money(f.price))}${metric('€/m²',money(Math.round(f.pricePerSqm),0))}${metric('ABP',area(f.abp))}${metric('Área total',area(f.totalArea))}
        </div></section>
      <section><p class="eyebrow eyebrow--dark">Concorrência</p><h3>Comparação simplificada</h3><p class="muted small">Diretos = mesma tipologia comparável + piso + vista. Indiretos = mesma tipologia + piso. Pouco concorrente = mesma tipologia + piso ± 1.</p>
      <div class="comps-list">${compBlock('Diretos',direct)}${compBlock('Indiretos',indirect)}${compBlock('Pouco concorrente',broad)}</div></section>
    </div>`;
    els.fractionModal.classList.remove('hidden');
    document.body.style.overflow='hidden';
  }

  function closeModal() { els.fractionModal.classList.add('hidden'); document.body.style.overflow=''; }

  function compBlock(title, rows) {
    return `<div class="comp-block"><h4>${esc(title)} <span class="muted">(${rows.length})</span></h4>${rows.length ? rows.slice(0,6).map(r=>`<div class="comp-item"><div><strong>${esc(r.development)}</strong><small>${esc(r.fractionRaw)} · ${esc(r.typology)} · Piso ${esc(r.floorLabel)} · Vista ${r.view||'—'}</small></div><div class="num-col"><strong>${money(r.price)}</strong><small>${money(Math.round(r.pricePerSqm),0)} /m²</small></div></div>`).join('') : '<p class="muted small">Sem concorrentes encontrados.</p>'}</div>`;
  }

  function renderCommercialAll() {
    renderDashboard();
    renderCommercialTable();
    renderInternalCompare();
    renderArgumentPanel();
    renderProposalSelection();
    renderFunnel();
    renderManagement();
    updateColumnVisibility();
  }

  function renderDashboard() {
    const fs = filteredCommercialFractions();
    const initial = sum(fs.map(f=>f.price));
    const final = sum(fs.map(f=>finalPrice(f)));
    const min = sum(fs.map(f=>minimumPrice(f)));
    const sold = state.fractions.filter(f=>commercialStatus(f)==='Vendido');
    const inNegotiation = state.fractions.filter(f=>['Em negociação','Reservado'].includes(commercialStatus(f)));
    els.commercialKpis.innerHTML = [
      kpi('Receita tabela', money(sum(state.fractions.map(f=>finalPrice(f)))), `${state.fractions.length} frações`),
      kpi('Receita mínima', money(sum(state.fractions.map(f=>minimumPrice(f)))), 'Mínimos autorizados'),
      kpi('Disponíveis', state.fractions.filter(f=>commercialStatus(f)==='Disponível').length, 'Unidades livres'),
      kpi('Vendidas', sold.length, money(sum(sold.map(f=>finalPrice(f))))),
      kpi('Em negociação', inNegotiation.length, money(sum(inNegotiation.map(f=>finalPrice(f)))))
    ].join('');

    const alerts = state.fractions.filter(f => defaultDecision(f).approval || commercialStatus(f)==='Rever preço' || classification(f).toLowerCase().includes('sensível') || classification(f).toLowerCase().includes('premium')).slice(0,12);
    els.commercialAlerts.innerHTML = alerts.length ? alerts.map(f => `<article class="alert-card"><span class="${badgeClass(commercialStatus(f))}">${esc(commercialStatus(f))}</span><h3>${esc(f.name)}</h3><p class="muted">${esc(classification(f))}</p><p>${esc(argumentText(f))}</p></article>`).join('') : `<div class="empty-state">Sem alertas comerciais relevantes.</div>`;
  }

  function renderCommercialTable() {
    const fs = filteredCommercialFractions();
    els.selectedFractionsInfo.textContent = `${state.selected.size} frações selecionadas`;
    if (!fs.length) {
      els.commercialTableBody.innerHTML = `<tr><td colspan="14"><div class="empty-state">Sem frações para apresentar.</div></td></tr>`;
      return;
    }
    els.commercialTableBody.innerHTML = fs.map(f => {
      const delta = finalPrice(f) - f.price;
      return `<tr>
        <td class="checkbox-cell"><input type="checkbox" data-select="${f.number}" ${state.selected.has(f.number)?'checked':''} /></td>
        <td><strong>${esc(f.name)}</strong><div class="muted small">${esc(classification(f))}</div></td>
        <td>${esc(f.typology)}</td><td>${esc(f.floorLabel)}</td><td>${esc(f.orientation||'—')}</td>
        <td class="num-col col-original">${money(f.price)}</td>
        <td class="num-col col-suggested">${money(suggestedPrice(f))}</td>
        <td class="num-col"><input type="number" step="1000" min="0" data-field="finalPrices" data-number="${f.number}" value="${Math.round(finalPrice(f))}" /></td>
        <td class="num-col"><input type="number" step="1000" min="0" data-field="minimumPrices" data-number="${f.number}" value="${Math.round(minimumPrice(f))}" /></td>
        <td class="num-col ${finalPrice(f)-minimumPrice(f)>=0?'positive':'negative'}">${money(finalPrice(f)-minimumPrice(f))}</td>
        <td>${selectHtml('statuses', f.number, COMMERCIAL_STATES, commercialStatus(f))}</td>
        <td><input type="text" data-field="classifications" data-number="${f.number}" value="${escAttr(classification(f))}" /></td>
        <td class="col-rationale reason-text"><textarea data-field="arguments" data-number="${f.number}">${esc(argumentText(f))}</textarea></td>
        <td class="col-funnel"><input type="text" data-funnel-field="nextAction" data-number="${f.number}" value="${escAttr(funnel(f).nextAction || '')}" placeholder="Próxima ação" /></td>
      </tr>`;
    }).join('');
    bindCommercialTableInputs();
  }

  function bindCommercialTableInputs() {
    els.commercialTableBody.querySelectorAll('[data-field]').forEach(el => el.addEventListener('change', () => {
      const field = el.dataset.field, n = Number(el.dataset.number);
      if (!state.commercialData[field]) state.commercialData[field] = {};
      state.commercialData[field][n] = el.type === 'number' ? parseNum(el.value) : el.value;
      saveStoredData(); renderCommercialAll();
    }));
    els.commercialTableBody.querySelectorAll('[data-funnel-field]').forEach(el => el.addEventListener('change', () => {
      setFunnelValue(Number(el.dataset.number), el.dataset.funnelField, el.value); saveStoredData(); renderCommercialAll();
    }));
    els.commercialTableBody.querySelectorAll('[data-select]').forEach(el => el.addEventListener('change', () => {
      const n = Number(el.dataset.select);
      if (el.checked) state.selected.add(n); else state.selected.delete(n);
      renderCommercialAll();
    }));
  }

  function renderInternalCompare() {
    const a = getFraction(Number(els.internalCompareA.value)) || state.fractions[0];
    const b = getFraction(Number(els.internalCompareB.value)) || state.fractions[1] || state.fractions[0];
    if (!a || !b) return;
    const rows = [
      ['Preço final', money(finalPrice(a)), money(finalPrice(b))],
      ['Preço mínimo', money(minimumPrice(a)), money(minimumPrice(b))],
      ['Tipologia', a.typology, b.typology],
      ['Piso', a.floorLabel, b.floorLabel],
      ['Orientação', a.orientation || '—', b.orientation || '—'],
      ['ABP', area(a.abp), area(b.abp)],
      ['Área total', area(a.totalArea), area(b.totalArea)],
      ['€/m² final', money(Math.round(finalPrice(a)/a.totalArea),0), money(Math.round(finalPrice(b)/b.totalArea),0)],
      ['Estado', commercialStatus(a), commercialStatus(b)],
      ['Classificação', classification(a), classification(b)]
    ];
    els.internalCompareResult.innerHTML = `<div class="compare-columns">
      ${comparePanel(a)}${comparePanel(b)}
    </div><div class="panel" style="box-shadow:none;margin-top:14px"><h3>Leitura rápida</h3><table class="compare-table">${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table></div>`;
  }

  function comparePanel(f) {
    return `<div class="compare-panel"><h3>${esc(f.name)}</h3><p class="muted">${esc(argumentText(f))}</p><div class="metric-box"><span>Preço final</span><strong>${money(finalPrice(f))}</strong></div></div>`;
  }

  function renderArgumentPanel() {
    const f = getFraction(Number(els.argumentFractionSelect.value)) || state.fractions[0];
    if (!f) return;
    const d = defaultDecision(f);
    els.argumentPanel.innerHTML = `<div class="argument-layout">
      <div class="argument-card"><h3>${esc(f.name)}</h3><p class="muted">${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation||'—')}</p>
      <div class="metric-box"><span>Preço final</span><strong>${money(finalPrice(f))}</strong></div></div>
      <div class="argument-list">
        <div class="argument-card"><h3>Como vender</h3><p>${esc(argumentText(f))}</p></div>
        <div class="argument-card"><h3>Pontos fortes</h3><p>${esc(d.strengths || 'A validar.')}</p></div>
        <div class="argument-card"><h3>Pontos fracos / objeções</h3><p>${esc(d.weaknesses || 'A validar.')}</p></div>
        <div class="argument-card"><h3>Perfil de comprador</h3><p>${esc(d.buyer || 'A validar.')}</p></div>
      </div>
    </div>`;
  }

  function renderProposalSelection() {
    els.proposalSelectionGrid.innerHTML = state.fractions.map(f => `<label class="proposal-card"><input type="checkbox" data-proposal-select="${f.number}" ${state.selected.has(f.number)?'checked':''} /><div><h3>${esc(f.name)}</h3><p class="muted">${esc(f.typology)} · ${money(finalPrice(f))}</p><p>${esc(argumentText(f))}</p></div></label>`).join('');
    els.proposalSelectionGrid.querySelectorAll('[data-proposal-select]').forEach(el => el.addEventListener('change', () => {
      const n = Number(el.dataset.proposalSelect);
      if (el.checked) state.selected.add(n); else state.selected.delete(n);
      renderCommercialAll();
    }));
  }

  function renderFunnel() {
    els.funnelTableBody.innerHTML = state.fractions.map(f => {
      const fun = funnel(f);
      return `<tr>
        <td><strong>${esc(f.name)}</strong><div class="muted small">${esc(f.typology)} · ${money(finalPrice(f))}</div></td>
        <td>${selectHtml('statuses', f.number, COMMERCIAL_STATES, commercialStatus(f))}</td>
        <td><input data-funnel-field="client" data-number="${f.number}" value="${escAttr(fun.client||'')}" placeholder="Nome / lead" /></td>
        <td><input data-funnel-field="channel" data-number="${f.number}" value="${escAttr(fun.channel||'')}" placeholder="Canal" /></td>
        <td class="num-col"><input type="number" data-funnel-field="visits" data-number="${f.number}" value="${fun.visits||0}" /></td>
        <td class="num-col"><input type="number" data-funnel-field="proposals" data-number="${f.number}" value="${fun.proposals||0}" /></td>
        <td class="num-col"><input type="number" data-funnel-field="lastOffer" data-number="${f.number}" value="${fun.lastOffer||''}" placeholder="€" /></td>
        <td class="num-col"><input type="number" data-funnel-field="probability" data-number="${f.number}" value="${fun.probability||0}" min="0" max="100" /></td>
        <td><input data-funnel-field="nextAction" data-number="${f.number}" value="${escAttr(fun.nextAction||'')}" placeholder="Próxima ação" /></td>
      </tr>`;
    }).join('');
    els.funnelTableBody.querySelectorAll('[data-funnel-field]').forEach(el => el.addEventListener('change', () => {
      setFunnelValue(Number(el.dataset.number), el.dataset.funnelField, el.type === 'number' ? parseNum(el.value) : el.value);
      saveStoredData(); renderCommercialAll();
    }));
    els.funnelTableBody.querySelectorAll('[data-field]').forEach(el => el.addEventListener('change', () => {
      const field = el.dataset.field, n = Number(el.dataset.number);
      if (!state.commercialData[field]) state.commercialData[field] = {};
      state.commercialData[field][n] = el.value;
      saveStoredData(); renderCommercialAll();
    }));
  }

  function renderManagement() {
    const fs = state.fractions;
    const initial = sum(fs.map(f=>f.price));
    const final = sum(fs.map(f=>finalPrice(f)));
    const minimum = sum(fs.map(f=>minimumPrice(f)));
    const premium = fs.filter(f=>defaultDecision(f).approval || classification(f).toLowerCase().includes('premium'));
    els.managementSummary.innerHTML = [
      managementCard('Receita inicial', money(initial), 'Tabela original'),
      managementCard('Receita final', money(final), `${final-initial>=0?'+':'−'}${money(Math.abs(final-initial))} vs inicial`),
      managementCard('Receita mínima', money(minimum), 'Limite de negociação autorizado'),
      managementCard('Frações premium/sensíveis', premium.length, 'Exigem validação adicional')
    ].join('');
    els.managementTableWrap.innerHTML = `<table class="data-table"><thead><tr><th>Fração</th><th>Preço final</th><th>Mínimo</th><th>Estado</th><th>Classificação</th><th>Decisão sugerida</th></tr></thead><tbody>${premium.map(f=>`<tr><td><strong>${esc(f.name)}</strong></td><td class="num-col">${money(finalPrice(f))}</td><td class="num-col">${money(minimumPrice(f))}</td><td>${esc(commercialStatus(f))}</td><td>${esc(classification(f))}</td><td>${defaultDecision(f).approval?'Validar pela gerência':'Aprovar comercialmente'}</td></tr>`).join('')}</tbody></table>`;
  }

  function exportClientPdf() {
    const fs = selectedFractions();
    if (!fs.length) { alert('Selecione pelo menos uma fração.'); return; }
    const win = window.open('', '_blank');
    if (!win) { alert('O browser bloqueou a janela de exportação. Autorize pop-ups.'); return; }
    const pages = fs.map((f, i) => {
      const plant = PLANT_MAP[f.number]?.image || '';
      return `<section class="pdf-page ${i===fs.length-1?'last':''}">
        <div class="pdf-header"><div><p class="pdf-eyebrow">The View Olhão</p><h1>${esc(f.name)}</h1><p>${esc(f.typology)} · Piso ${esc(f.floorLabel)} · ${esc(f.orientation||'—')}</p></div><div class="pdf-price"><span>Preço de apresentação</span><strong>${money(finalPrice(f))}</strong></div></div>
        <div class="pdf-grid"><div class="pdf-cards">${pdfCard('ABP',area(f.abp))}${pdfCard('Varanda/Terraço',area(f.terrace))}${pdfCard('Área total',area(f.totalArea))}${pdfCard('Tipologia',f.typology)}</div><div class="pdf-note"><h2>Enquadramento comercial</h2><p>${esc(argumentText(f))}</p></div></div>
        <div class="pdf-plant-wrap">${plant ? `<img src="${plant}" class="pdf-plant" />` : '<div class="pdf-missing">Planta indisponível.</div>'}</div>
      </section>`;
    }).join('');
    win.document.open();
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>The View · Proposta Cliente</title><style>
      @page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;margin:0;color:#16233d}.pdf-page{min-height:calc(297mm - 28mm);page-break-after:always;display:flex;flex-direction:column;gap:18px}.last{page-break-after:auto}.pdf-header{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #d9e1eb;padding-bottom:16px}.pdf-eyebrow{margin:0 0 6px;text-transform:uppercase;letter-spacing:.22em;font-size:10px;font-weight:700;color:#8e6a34}h1{margin:0;font-size:30px}.pdf-header p{color:#5f6f89}.pdf-price{background:#f4f7fb;border:1px solid #d9e1eb;border-radius:16px;padding:14px 18px;min-width:240px;text-align:right}.pdf-price span{display:block;font-size:12px;color:#5f6f89;margin-bottom:8px}.pdf-price strong{font-size:28px}.pdf-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}.pdf-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.pdf-card{background:#f8fafc;border:1px solid #e3eaf1;border-radius:14px;padding:14px 16px}.pdf-card span{display:block;font-size:12px;color:#5f6f89;margin-bottom:6px}.pdf-card strong{font-size:20px}.pdf-note{background:#fffaf2;border:1px solid #eedbb5;border-radius:16px;padding:16px 18px}.pdf-note h2{margin:0 0 8px;font-size:18px}.pdf-note p{margin:0;color:#41506b;line-height:1.65}.pdf-plant-wrap{flex:1;display:flex;justify-content:center;align-items:center;border:1px solid #d9e1eb;border-radius:20px;overflow:hidden;padding:10px}.pdf-plant{max-width:100%;max-height:100%;object-fit:contain}.pdf-missing{color:#5f6f89}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${pages}<script>const imgs=[...document.images];let p=imgs.length;function done(){setTimeout(()=>{window.focus();window.print()},450)}if(!p)done();imgs.forEach(img=>{if(img.complete){p--;if(p<=0)done()}else{img.onload=img.onerror=()=>{p--;if(p<=0)done()}}});</script></body></html>`);
    win.document.close();
  }

  function exportCommercialExcel() {
    const rows = filteredCommercialFractions().map(f => ({
      'Apartamento': f.name, 'Tipologia': f.typology, 'Piso': f.floorLabel, 'Orientação': f.orientation, 'ABP': f.abp, 'Varanda/Terraço': f.terrace, 'Área Total': f.totalArea,
      'Preço Inicial': f.price, 'Preço Sugerido': suggestedPrice(f), 'Preço Final': finalPrice(f), 'Preço Mínimo': minimumPrice(f), 'Margem Negociação': finalPrice(f)-minimumPrice(f),
      'Estado': commercialStatus(f), 'Classificação': classification(f), 'Argumento': argumentText(f), 'Próxima Ação': funnel(f).nextAction || ''
    }));
    downloadExcel(rows, 'the-view-tabela-comercial.xlsx', 'Tabela Comercial');
  }

  function exportFunnelExcel() {
    const rows = state.fractions.map(f => {
      const fun = funnel(f);
      return { 'Apartamento': f.name, 'Estado': commercialStatus(f), 'Cliente/Lead': fun.client || '', 'Canal': fun.channel || '', 'Visitas': fun.visits || 0, 'Propostas': fun.proposals || 0, 'Última Proposta': fun.lastOffer || '', 'Probabilidade': fun.probability || 0, 'Próxima Ação': fun.nextAction || '', 'Preço Final': finalPrice(f) };
    });
    downloadExcel(rows, 'the-view-funil-vendas.xlsx', 'Funil');
  }

  function downloadExcel(rows, filename, sheetName) {
    if (!window.XLSX) { alert('Biblioteca Excel não carregada.'); return; }
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!autofilter'] = { ref: ws['!ref'] };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }

  function switchCommercialTab() {
    document.querySelectorAll('[data-commercial-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.commercialTab === state.commercialTab));
    {
      const map = {dashboard:'commercial-dashboard', table:'commercial-table-module', compare:'commercial-compare-module', arguments:'commercial-arguments-module', proposals:'commercial-proposals-module', funnel:'commercial-funnel-module', management:'commercial-management-module'};
      Object.values(map).forEach(id => document.getElementById(id).classList.add('hidden'));
      document.getElementById(map[state.commercialTab]).classList.remove('hidden');
    }
    renderCommercialAll();
  }

  function selectedFractions() {
    const selected = state.fractions.filter(f=>state.selected.has(f.number));
    return selected.length ? selected.sort((a,b)=>a.number-b.number) : filteredCommercialFractions();
  }

  function filteredCompareFractions() {
    return state.fractions.filter(f => (state.compare.typology==='all'||f.typology===state.compare.typology) && (state.compare.floor==='all'||String(f.floorLabel)===state.compare.floor) && (state.compare.view==='all'||String(f.view||'—')===state.compare.view) && (state.compare.fraction==='all'||f.name===state.compare.fraction));
  }

  function filteredCompetitors() {
    return state.competitors.filter(c => state.compare.development==='all'||c.development===state.compare.development);
  }

  function filteredCommercialFractions() {
    const s = normalize(state.filters.search);
    return state.fractions.filter(f => {
      if (state.filters.typologies.length && !state.filters.typologies.includes(f.typology)) return false;
      if (state.filters.floors.length && !state.filters.floors.includes(String(f.floorLabel))) return false;
      if (!s) return true;
      return normalize([f.name,f.typology,f.floorLabel,f.orientation,commercialStatus(f),classification(f),argumentText(f)].join(' ')).includes(s);
    });
  }

  function compMatches(f, mode) {
    return filteredCompetitors().filter(c => c.comparableTypology === f.comparableTypology).filter(c => {
      if (mode==='direct') return c.floor===f.floor && c.view===f.view;
      if (mode==='indirect') return c.floor===f.floor;
      return c.floor!==null && f.floor!==null && Math.abs(c.floor-f.floor)<=1;
    }).sort((a,b)=>(b.weight-a.weight)||(b.referenceYear-a.referenceYear)||(a.pricePerSqm-b.pricePerSqm));
  }

  function getFraction(n) { return state.fractions.find(f=>f.number===n); }
  function defaultDecision(f) { return DEFAULT_DECISIONS[f.number] || {state:'Manter', proposedNow:f.price, min:Math.round(f.price*.98), classification:'A validar', argument:'Sem argumento comercial definido.', approval:false}; }
  function suggestedPrice(f) { return defaultDecision(f).proposedNow || f.price; }
  function finalPrice(f) { return Number(state.commercialData.finalPrices[f.number]) || suggestedPrice(f); }
  function minimumPrice(f) { return Number(state.commercialData.minimumPrices[f.number]) || defaultDecision(f).min || Math.round(finalPrice(f)*.97); }
  function commercialStatus(f) { return state.commercialData.statuses[f.number] || defaultDecision(f).state || DEFAULT_STATUS; }
  function classification(f) { return state.commercialData.classifications[f.number] || defaultDecision(f).classification || 'A validar'; }
  function argumentText(f) { return state.commercialData.arguments[f.number] || defaultDecision(f).argument || 'A validar.'; }
  function funnel(f) { return state.commercialData.funnel[f.number] || {}; }
  function setFunnelValue(n, field, value) { if (!state.commercialData.funnel[n]) state.commercialData.funnel[n]={}; state.commercialData.funnel[n][field]=value; }

  function loadStoredData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultStored(); } catch { return defaultStored(); }
  }
  function defaultStored() { return { finalPrices: {}, minimumPrices: {}, statuses: {}, classifications: {}, arguments: {}, notes: {}, funnel: {} }; }
  function saveStoredData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.commercialData)); } catch {} }

  function showView(view) {
    state.activeView = view;
    [['home',els.homeView],['compare',els.compareView],['commercial',els.commercialView]].forEach(([name,el]) => el.classList.toggle('hidden', name!==view));
    els.backToHomeTop.classList.toggle('hidden', view==='home');
    if (view==='compare') renderCompare();
    if (view==='commercial') renderCommercialAll();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function updateColumnVisibility() {
    toggleClassColumn('col-suggested', state.filters.showSuggested);
    toggleClassColumn('col-original', state.filters.showOriginal);
    toggleClassColumn('col-rationale', state.filters.showRationale);
    toggleClassColumn('col-funnel', state.filters.showFunnel);
  }
  function toggleClassColumn(cls, show) { if (!els.commercialTable) return; els.commercialTable.querySelectorAll('.'+cls).forEach(n=>n.style.display=show?'':'none'); }

  function syncCompareFilters() {
    els.compareTypologyFilter.value=state.compare.typology; els.compareFloorFilter.value=state.compare.floor; els.compareViewFilter.value=state.compare.view; els.compareFractionFilter.value=state.compare.fraction; els.compareDevelopmentFilter.value=state.compare.development;
  }
  function syncCommercialFilters() {
    els.commercialSearch.value=state.filters.search; setSelected(els.commercialTypologyFilter,state.filters.typologies); setSelected(els.commercialFloorFilter,state.filters.floors);
    els.toggleSuggestedColumn.checked=state.filters.showSuggested; els.toggleOriginalColumn.checked=state.filters.showOriginal; els.toggleRationaleColumn.checked=state.filters.showRationale; els.toggleFunnelColumn.checked=state.filters.showFunnel;
  }

  function fillSelect(select, values, allLabel, labelFn) { select.innerHTML = values.map(v=>`<option value="${escAttr(v)}">${v==='all' ? allLabel : esc(labelFn ? labelFn(v) : v)}</option>`).join(''); }
  function fillMulti(select, values) { select.innerHTML = values.map(v=>`<option value="${escAttr(v)}">${esc(v)}</option>`).join(''); }
  function setSelected(select, values) { [...select.options].forEach(o=>o.selected=values.includes(o.value)); }
  function getSelectedOptions(select) { return [...select.selectedOptions].map(o=>o.value); }

  function selectHtml(field, n, options, value) { return `<select data-field="${field}" data-number="${n}">${options.map(o=>`<option value="${escAttr(o)}" ${o===value?'selected':''}>${esc(o)}</option>`).join('')}</select>`; }
  function metric(label, value) { return `<div class="metric-box"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`; }
  function pdfCard(label, value) { return `<article class="pdf-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`; }
  function kpi(label, value, hint) { return `<article class="kpi-card"><span>${esc(label)}</span><strong>${esc(value)}</strong>${hint?`<small>${esc(hint)}</small>`:''}</article>`; }
  function managementCard(label, value, hint) { return `<div class="management-row"><span class="muted small">${esc(label)}</span><h3>${esc(value)}</h3><p class="muted">${esc(hint)}</p></div>`; }
  function badgeClass(status) { return 'badge ' + (status==='Vendido'?'badge--success':status==='Em negociação'||status==='Reservado'?'badge--warning':status==='Rever preço'||status==='Bloqueado'?'badge--danger':'badge--neutral'); }

  function setStatus(text) { els.dataStatus.textContent = text; }
  function showError(msg) { els.globalErrorBox.textContent=msg; els.globalErrorBox.classList.remove('hidden'); }
  function hideError() { els.globalErrorBox.textContent=''; els.globalErrorBox.classList.add('hidden'); }

  function parseNum(v) {
    if (typeof v==='number' && isFinite(v)) return v;
    const s = safe(v).replace(/\s+/g,'').replace(/€/g,'').replace(/m²/gi,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(/,(?=\d{2,}$)/g,'.');
    const n = Number(s.replace(/[^0-9.-]/g,''));
    return isFinite(n) ? n : 0;
  }
  function parseFloor(v) { if (typeof v==='number') return v; const s=safe(v).toUpperCase(); if(!s) return null; if(['R/C','RC','0'].includes(s)) return 0; const m=s.match(/-?\d+/); return m ? Number(m[0]) : null; }
  function naturalNumber(s, fallback=null) { const m=safe(s).match(/\d+/); return m ? Number(m[0]) : fallback; }
  function prettyTypology(v) { return safe(v).replace(/\s+/g,' ').replace(/DUPLEX/i,'Duplex').replace(/DUP$/i,'Duplex'); }
  function comparableTypology(t) { let s=normalize(t).replace(/\s+/g,'').replace(/duplex/g,'').replace(/g$/,''); if(s==='t1+1')return't2'; if(s==='t2+1')return't3'; return s; }
  function safe(v) { return v==null ? '' : String(v).trim(); }
  function normalize(v) { return safe(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
  function unique(values) { return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'pt-PT',{numeric:true,sensitivity:'base'})); }
  function sum(values) { return values.reduce((a,b)=>a+(Number(b)||0),0); }
  function money(v,d=0) { return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',minimumFractionDigits:d,maximumFractionDigits:d}).format(Number(v)||0); }
  function area(v) { return `${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2}).format(Number(v)||0)} m²`; }
  function esc(v) { return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function escAttr(v) { return esc(v).replace(/`/g,'&#096;'); }
})();
