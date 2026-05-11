'use strict';

(() => {
  const DATA_FILES = ['data.xlsx', 'data.xls'];
  const PROJECT_NAME = 'The View';

  const state = {
    rows: [],
    fractions: [],
    competitors: [],
    benchmarks: [],
    filteredFractions: [],
    filteredCompetitors: [],
    selectedFraction: null,
    activeTab: 'dashboard',
    filters: { floor: 'all', view: 'all', typology: 'all', fraction: 'all', development: 'all' },
    sort: 'name-asc',
    commercialFilters: { state: 'all', impact: 'all', typology: 'all', floors: [], fractions: [], search: '', sort: 'immediate-desc' },
    clientFilters: { search: '', typologies: [], floors: [] },
    clientSelections: {},
    finalPrices: {},
    finalPriceFilters: { search: '', typologies: [], floors: [] },
    idealFocusedFraction: ''
  };


  const FINAL_RECOMMENDED_PRICES = {
    1: { price: 545000, strategy: 'Manter', note: 'Tabela atual defensável; fração com boa vista e preço comercialmente coerente.' },
    2: { price: 615000, strategy: 'Subida moderada', note: 'Ajuste controlado para reforçar coerência interna sem depender excessivamente do mercado.' },
    3: { price: 380000, strategy: 'Manter', note: 'Preço atual adequado para piso/vista/tipologia.' },
    4: { price: 475000, strategy: 'Manter', note: 'Tipologia com baixa comparabilidade externa; manter preço atual como referência comercial.' },
    5: { price: 450000, strategy: 'Manter', note: 'Preço atual defensável dentro da família T1+1.' },
    6: { price: 600000, strategy: 'Manter', note: 'Manter por prudência, dado o compset limitado para T2+1.' },
    7: { price: 535000, strategy: 'Subida moderada', note: 'Frações T2 de entrada parecem ter margem para reforço, mas com ajuste conservador.' },
    8: { price: 385000, strategy: 'Ajuste fino', note: 'Pequena correção de coerência interna.' },
    9: { price: 950000, strategy: 'Subida faseada', note: 'Preço-alvo para fase comercial seguinte; T3 com vista forte.' },
    10: { price: 660000, strategy: 'Subida faseada', note: 'Ajuste para melhor refletir piso, vista e escassez relativa.' },
    11: { price: 387000, strategy: 'Manter', note: 'Preço atual adequado.' },
    12: { price: 430000, strategy: 'Ajuste fino', note: 'Correção marginal para arredondamento e coerência.' },
    13: { price: 415000, strategy: 'Ajuste fino', note: 'Correção marginal para arredondamento e coerência.' },
    14: { price: 582000, strategy: 'Manter', note: 'Preço atual defensável.' },
    15: { price: 580000, strategy: 'Ajuste fino', note: 'Ajuste moderado para reduzir desalinhamento face a unidades semelhantes.' },
    16: { price: 1025000, strategy: 'Subida faseada', note: 'T3 em piso superior; preço-alvo para capturar maior valor comercial.' },
    17: { price: 670000, strategy: 'Subida faseada', note: 'Ajuste para refletir melhor piso e vista face aos T2 inferiores.' },
    18: { price: 410000, strategy: 'Subida moderada', note: 'Correção de coerência interna em piso superior.' },
    19: { price: 435000, strategy: 'Ajuste fino', note: 'Pequeno ajuste comercial.' },
    20: { price: 422000, strategy: 'Manter', note: 'Preço atual defensável.' },
    21: { price: 630000, strategy: 'Subida moderada', note: 'T2 em piso intermédio com margem para reforço.' },
    22: { price: 615000, strategy: 'Subida faseada', note: 'Ajuste faseado para melhorar coerência com restantes T2.' },
    23: { price: 900000, strategy: 'Manter', note: 'Preço atual já defende bem vista/piso.' },
    24: { price: 680000, strategy: 'Subida faseada', note: 'Ajuste para refletir melhor piso e vista.' },
    25: { price: 435000, strategy: 'Subida faseada', note: 'Preço-alvo para fase seguinte, preservando coerência por piso.' },
    26: { price: 620000, strategy: 'Subida faseada', note: 'Ajuste para T2 em piso superior.' },
    27: { price: 400000, strategy: 'Subida faseada', note: 'Correção de piso alto face a frações semelhantes.' },
    28: { price: 470000, strategy: 'Subida faseada', note: 'Ajuste para vista/piso e coerência interna.' },
    29: { price: 490000, strategy: 'Subida faseada', note: 'Ajuste para vista/piso e coerência interna.' },
    30: { price: 1050000, strategy: 'Manter', note: 'Preço atual já incorpora escassez/premium.' },
    31: { price: 690000, strategy: 'Subida faseada', note: 'Ajuste para T2 de piso alto.' },
    32: { price: 440000, strategy: 'Subida faseada', note: 'Correção de piso alto, mantendo prudência pela vista.' },
    33: { price: 630000, strategy: 'Subida faseada', note: 'Ajuste para T2 em piso alto.' },
    34: { price: 685000, strategy: 'Subida faseada', note: 'Ajuste para coerência com restantes T2.' },
    35: { price: 551000, strategy: 'Manter', note: 'Produto específico; manter até validação comercial adicional.' },
    36: { price: 1450000, strategy: 'Manter', note: 'Preço atual já defende posição premium e último piso.' },
    37: { price: 1100000, strategy: 'Manter', note: 'Preço atual já reflete escassez/piso.' },
    38: { price: 520000, strategy: 'Manter', note: 'Preço atual defensável para piso alto.' },
    39: { price: 1100000, strategy: 'Manter', note: 'Preço atual defensável para T3 premium.' }
  };

  function getFractionNumber(fraction) {
    return naturalFractionNumber(fraction?.name);
  }

  function getFinalRecommendation(fraction) {
    const n = getFractionNumber(fraction);
    return FINAL_RECOMMENDED_PRICES[n] || null;
  }



  const THE_VIEW_ORIENTATION_BY_FRACTION = {
    1: 'Sul/Este',
    2: 'Sul/Oeste',
    3: 'Oeste',
    4: 'Oeste',
    5: 'Oeste',
    6: 'Este/Oeste',
    7: 'Este',
    8: 'Este',
    9: 'Sul/Este',
    10: 'Sul/Oeste',
    11: 'Oeste',
    12: 'Oeste',
    13: 'Oeste',
    14: 'Este/Oeste',
    15: 'Este',
    16: 'Sul/Este',
    17: 'Sul/Oeste',
    18: 'Oeste',
    19: 'Oeste',
    20: 'Oeste',
    21: 'Este/Oeste',
    22: 'Este',
    23: 'Sul/Este',
    24: 'Sul/Oeste',
    25: 'Oeste',
    26: 'Este/Oeste',
    27: 'Oeste',
    28: 'Este/Oeste',
    29: 'Este',
    30: 'Sul/Este',
    31: 'Sul/Oeste',
    32: 'Oeste',
    33: 'Este/Oeste',
    34: 'Este/Oeste',
    35: 'Este/Oeste',
    36: 'Sul/Este',
    37: 'Sul/Oeste',
    38: 'Oeste',
    39: 'Este/Oeste'
  };

  function getOrientation(fraction) {
    const number = getFractionNumber(fraction);
    return THE_VIEW_ORIENTATION_BY_FRACTION[number] || safeString(fraction?.orientation) || safeString(fraction?.view) || '—';
  }

  function getFractionDescriptor(fraction) {
    return `${fraction.typology} · Piso ${fraction.floorLabel} · Orientação ${getOrientation(fraction)}`;
  }



  const THE_VIEW_PLANT_MAP = {
    1: { plantId: 'planta-apartamento-01', image: 'plantas/planta-apartamento-01.jpg', pdf: 'plantas/planta-apartamento-01.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_01.pdf" },
    2: { plantId: 'planta-apartamento-02-10-17-24-31', image: 'plantas/planta-apartamento-02-10-17-24-31.jpg', pdf: 'plantas/planta-apartamento-02-10-17-24-31.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf" },
    3: { plantId: 'planta-apartamento-03', image: 'plantas/planta-apartamento-03.jpg', pdf: 'plantas/planta-apartamento-03.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_03.pdf" },
    4: { plantId: 'planta-apartamento-04', image: 'plantas/planta-apartamento-04.jpg', pdf: 'plantas/planta-apartamento-04.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_04.pdf" },
    5: { plantId: 'planta-apartamento-05', image: 'plantas/planta-apartamento-05.jpg', pdf: 'plantas/planta-apartamento-05.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_05.pdf" },
    6: { plantId: 'planta-apartamento-06', image: 'plantas/planta-apartamento-06.jpg', pdf: 'plantas/planta-apartamento-06.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_06.pdf" },
    7: { plantId: 'planta-apartamento-07-15', image: 'plantas/planta-apartamento-07-15.jpg', pdf: 'plantas/planta-apartamento-07-15.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf" },
    8: { plantId: 'planta-apartamento-08', image: 'plantas/planta-apartamento-08.jpg', pdf: 'plantas/planta-apartamento-08.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_08.pdf" },
    9: { plantId: 'planta-apartamento-09-16', image: 'plantas/planta-apartamento-09-16.jpg', pdf: 'plantas/planta-apartamento-09-16.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf" },
    10: { plantId: 'planta-apartamento-02-10-17-24-31', image: 'plantas/planta-apartamento-02-10-17-24-31.jpg', pdf: 'plantas/planta-apartamento-02-10-17-24-31.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf" },
    11: { plantId: 'planta-apartamento-11', image: 'plantas/planta-apartamento-11.jpg', pdf: 'plantas/planta-apartamento-11.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_11.pdf" },
    12: { plantId: 'planta-apartamento-12', image: 'plantas/planta-apartamento-12.jpg', pdf: 'plantas/planta-apartamento-12.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_12.pdf" },
    13: { plantId: 'planta-apartamento-13', image: 'plantas/planta-apartamento-13.jpg', pdf: 'plantas/planta-apartamento-13.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_13.pdf" },
    14: { plantId: 'planta-apartamento-14', image: 'plantas/planta-apartamento-14.jpg', pdf: 'plantas/planta-apartamento-14.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_14.pdf" },
    15: { plantId: 'planta-apartamento-07-15', image: 'plantas/planta-apartamento-07-15.jpg', pdf: 'plantas/planta-apartamento-07-15.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_07 e 15.pdf" },
    16: { plantId: 'planta-apartamento-09-16', image: 'plantas/planta-apartamento-09-16.jpg', pdf: 'plantas/planta-apartamento-09-16.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_09 e 16.pdf" },
    17: { plantId: 'planta-apartamento-02-10-17-24-31', image: 'plantas/planta-apartamento-02-10-17-24-31.jpg', pdf: 'plantas/planta-apartamento-02-10-17-24-31.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf" },
    18: { plantId: 'planta-apartamento-18', image: 'plantas/planta-apartamento-18.jpg', pdf: 'plantas/planta-apartamento-18.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_18.pdf" },
    19: { plantId: 'planta-apartamento-19', image: 'plantas/planta-apartamento-19.jpg', pdf: 'plantas/planta-apartamento-19.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_19.pdf" },
    20: { plantId: 'planta-apartamento-20', image: 'plantas/planta-apartamento-20.jpg', pdf: 'plantas/planta-apartamento-20.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_20.pdf" },
    21: { plantId: 'planta-apartamento-21', image: 'plantas/planta-apartamento-21.jpg', pdf: 'plantas/planta-apartamento-21.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_21.pdf" },
    22: { plantId: 'planta-apartamento-22', image: 'plantas/planta-apartamento-22.jpg', pdf: 'plantas/planta-apartamento-22.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_22.pdf" },
    23: { plantId: 'planta-apartamento-23-30', image: 'plantas/planta-apartamento-23-30.jpg', pdf: 'plantas/planta-apartamento-23-30.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf" },
    24: { plantId: 'planta-apartamento-02-10-17-24-31', image: 'plantas/planta-apartamento-02-10-17-24-31.jpg', pdf: 'plantas/planta-apartamento-02-10-17-24-31.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf" },
    25: { plantId: 'planta-apartamento-25', image: 'plantas/planta-apartamento-25.jpg', pdf: 'plantas/planta-apartamento-25.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_25.pdf" },
    26: { plantId: 'planta-apartamento-26', image: 'plantas/planta-apartamento-26.jpg', pdf: 'plantas/planta-apartamento-26.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_26.pdf" },
    27: { plantId: 'planta-apartamento-27', image: 'plantas/planta-apartamento-27.jpg', pdf: 'plantas/planta-apartamento-27.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_27.pdf" },
    28: { plantId: 'planta-apartamento-28', image: 'plantas/planta-apartamento-28.jpg', pdf: 'plantas/planta-apartamento-28.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_28.pdf" },
    29: { plantId: 'planta-apartamento-29', image: 'plantas/planta-apartamento-29.jpg', pdf: 'plantas/planta-apartamento-29.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_29.pdf" },
    30: { plantId: 'planta-apartamento-23-30', image: 'plantas/planta-apartamento-23-30.jpg', pdf: 'plantas/planta-apartamento-23-30.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_23 e 30.pdf" },
    31: { plantId: 'planta-apartamento-02-10-17-24-31', image: 'plantas/planta-apartamento-02-10-17-24-31.jpg', pdf: 'plantas/planta-apartamento-02-10-17-24-31.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_02, 10, 17, 24 e 31.pdf" },
    32: { plantId: 'planta-apartamento-32', image: 'plantas/planta-apartamento-32.jpg', pdf: 'plantas/planta-apartamento-32.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_32.pdf" },
    33: { plantId: 'planta-apartamento-33', image: 'plantas/planta-apartamento-33.jpg', pdf: 'plantas/planta-apartamento-33.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_33.pdf" },
    34: { plantId: 'planta-apartamento-34', image: 'plantas/planta-apartamento-34.jpg', pdf: 'plantas/planta-apartamento-34.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_34.pdf" },
    35: { plantId: 'planta-apartamento-35', image: 'plantas/planta-apartamento-35.jpg', pdf: 'plantas/planta-apartamento-35.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_35.pdf" },
    36: { plantId: 'planta-apartamento-36', image: 'plantas/planta-apartamento-36.jpg', pdf: 'plantas/planta-apartamento-36.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_36.pdf" },
    37: { plantId: 'planta-apartamento-37', image: 'plantas/planta-apartamento-37.jpg', pdf: 'plantas/planta-apartamento-37.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_37.pdf" },
    38: { plantId: 'planta-apartamento-38', image: 'plantas/planta-apartamento-38.jpg', pdf: 'plantas/planta-apartamento-38.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_38.pdf" },
    39: { plantId: 'planta-apartamento-39', image: 'plantas/planta-apartamento-39.jpg', pdf: 'plantas/planta-apartamento-39.pdf', source: "Planta_THE VIEW OLHAO_Apartamento_39.pdf" }
  };


  function getAutomaticPlant(fraction) {
    const number = getFractionNumber(fraction);
    return THE_VIEW_PLANT_MAP[number] || null;
  }

  function getPlantImageForAnalysis(analysis) {
    const manual = safeString(analysis?.planUrl || state.finalPrices?.[analysis?.fraction?.name]?.planUrl || '');
    if (manual) return manual;

    const auto = getAutomaticPlant(analysis?.fraction);
    return auto?.image || '';
  }

  function getPlantPdfForAnalysis(analysis) {
    const auto = getAutomaticPlant(analysis?.fraction);
    return auto?.pdf || '';
  }

  function getPlantLabelForAnalysis(analysis) {
    const auto = getAutomaticPlant(analysis?.fraction);
    if (!auto) return 'Sem planta associada';
    return auto.source || auto.plantId || 'Planta automática';
  }


  const COMMERCIAL_DECISIONS = {
    1: { state: 'Rever gerência', proposedNow: 545000, target: 545000, note: 'T1 piso 1 Sul/Este com preço elevado face aos restantes T1. Manter, mas justificar pela área, vista ou característica especial.' },
    2: { state: 'Aplicar agora', proposedNow: 615000, target: 615000, note: 'Recomenda-se aplicar já o novo preço, pois o ajuste é moderado e mantém coerência com o posicionamento da tipologia.' },
    3: { state: 'Manter', proposedNow: 380000, target: 380000, note: 'Preço atual defensável. Não se recomenda alteração imediata.' },
    4: { state: 'Manter', proposedNow: 475000, target: 475000, note: 'Manter preço atual. Tipologia com comparabilidade externa limitada.' },
    5: { state: 'Manter', proposedNow: 450000, target: 450000, note: 'Preço atual defensável dentro da família T1+1.' },
    6: { state: 'Manter', proposedNow: 600000, target: 600000, note: 'Manter por prudência, dado o compset limitado para T2+1.' },
    7: { state: 'Aplicar agora', proposedNow: 535000, target: 535000, note: 'Recomenda-se aplicar já. O ajuste é controlado e melhora a coerência dos T2 de entrada.' },
    8: { state: 'Aplicar agora', proposedNow: 385000, target: 385000, note: 'Ajuste fino recomendado para melhorar coerência interna sem alterar significativamente o posicionamento.' },
    9: { state: 'Subida faseada', proposedNow: 915000, target: 950000, note: 'Modelo aponta margem de subida, mas recomenda-se aplicação faseada para evitar resistência comercial.' },
    10: { state: 'Subida faseada', proposedNow: 635000, target: 660000, note: 'Subida recomendada em duas fases, refletindo piso e orientação sem aplicar todo o alvo de imediato.' },
    11: { state: 'Manter', proposedNow: 387000, target: 387000, note: 'Preço atual adequado. Não se recomenda alteração imediata.' },
    12: { state: 'Aplicar agora', proposedNow: 430000, target: 430000, note: 'Ajuste fino aplicável já, com baixo risco comercial.' },
    13: { state: 'Aplicar agora', proposedNow: 415000, target: 415000, note: 'Ajuste fino aplicável já, mantendo coerência na família T1+1.' },
    14: { state: 'Manter', proposedNow: 582000, target: 582000, note: 'Preço atual defensável. Não se recomenda alteração imediata.' },
    15: { state: 'Aplicar agora', proposedNow: 580000, target: 580000, note: 'Aplicar agora para reduzir desalinhamento face a unidades semelhantes.' },
    16: { state: 'Subida faseada', proposedNow: 985000, target: 1025000, note: 'T3 em piso superior. Recomenda-se fasear a subida para validar procura antes de atingir o alvo.' },
    17: { state: 'Subida faseada', proposedNow: 645000, target: 670000, note: 'Subida faseada para refletir melhor piso e orientação, sem absorver todo o ajuste de imediato.' },
    18: { state: 'Aplicar agora', proposedNow: 410000, target: 410000, note: 'Aplicar agora. O ajuste reforça a coerência de piso superior.' },
    19: { state: 'Aplicar agora', proposedNow: 435000, target: 435000, note: 'Ajuste pequeno recomendado para aplicação imediata.' },
    20: { state: 'Manter', proposedNow: 422000, target: 422000, note: 'Preço atual defensável. Não se recomenda alteração imediata.' },
    21: { state: 'Subida faseada', proposedNow: 620000, target: 630000, note: 'Subida faseada curta. O alvo é próximo, mas recomenda-se aplicar em duas etapas.' },
    22: { state: 'Subida faseada', proposedNow: 590000, target: 615000, note: 'Modelo aponta margem de subida; aplicação faseada reduz resistência comercial.' },
    23: { state: 'Rever gerência', proposedNow: 900000, target: 900000, note: 'Rever coerência face ao Apartamento 30 antes de qualquer decisão.' },
    24: { state: 'Subida faseada', proposedNow: 655000, target: 680000, note: 'Subida faseada recomendada para alinhar com piso e orientação.' },
    25: { state: 'Subida faseada', proposedNow: 418000, target: 435000, note: 'Preço-alvo superior, mas recomenda-se fasear para manter absorção comercial.' },
    26: { state: 'Subida faseada', proposedNow: 600000, target: 620000, note: 'Subida faseada para T2 em piso superior.' },
    27: { state: 'Subida faseada', proposedNow: 395000, target: 400000, note: 'Evitar inicialmente a barreira psicológica dos 400.000 €.' },
    28: { state: 'Subida faseada', proposedNow: 455000, target: 470000, note: 'Aplicação faseada para ajustar vista/piso e coerência interna.' },
    29: { state: 'Subida faseada', proposedNow: 475000, target: 490000, note: 'Aplicação faseada para ajustar vista/piso e coerência interna.' },
    30: { state: 'Rever gerência', proposedNow: 1050000, target: 1050000, note: 'Rever coerência face ao Apartamento 23 antes de qualquer decisão.' },
    31: { state: 'Subida faseada', proposedNow: 665000, target: 690000, note: 'Subida faseada para T2 em piso alto.' },
    32: { state: 'Subida faseada', proposedNow: 425000, target: 440000, note: 'Correção de piso alto, mantendo prudência pela orientação.' },
    33: { state: 'Subida faseada', proposedNow: 610000, target: 630000, note: 'Subida faseada para T2 em piso alto.' },
    34: { state: 'Subida faseada', proposedNow: 660000, target: 685000, note: 'Subida faseada para reforçar coerência com restantes T2.' },
    35: { state: 'Manter', proposedNow: 551000, target: 551000, note: 'Produto específico. Manter até validação comercial adicional.' },
    36: { state: 'Rever gerência', proposedNow: 1450000, target: 1450000, note: 'Fração premium. Manter por enquanto, mas rever com base em vista real, área exterior e procura.' },
    37: { state: 'Manter', proposedNow: 1100000, target: 1100000, note: 'Preço atual já reflete escassez e piso. Manter.' },
    38: { state: 'Manter', proposedNow: 520000, target: 520000, note: 'Preço atual defensável para piso alto.' },
    39: { state: 'Rever gerência', proposedNow: 1100000, target: 1100000, note: 'T3 no piso 6. Rever se a diferença face ao Apartamento 36 está devidamente justificada.' }
  };

  function getCommercialDecision(fraction, technicalPrice) {
    const number = getFractionNumber(fraction);
    const fixed = COMMERCIAL_DECISIONS[number];

    if (fixed) {
      return {
        state: fixed.state,
        proposedNow: fixed.proposedNow,
        target: fixed.target,
        note: fixed.note
      };
    }

    const recommended = Number.isFinite(technicalPrice) ? technicalPrice : fraction.price;
    const adjustment = recommended - fraction.price;

    if (Math.abs(adjustment) < 1000) {
      return { state: 'Manter', proposedNow: fraction.price, target: fraction.price, note: 'Sem diferença material face ao preço atual.' };
    }

    if (adjustment <= 20000) {
      return { state: 'Aplicar agora', proposedNow: recommended, target: recommended, note: 'Ajuste pequeno, aplicável de imediato.' };
    }

    if (adjustment <= 35000) {
      return { state: 'Aplicar agora', proposedNow: recommended, target: recommended, note: 'Ajuste moderado, aplicável de imediato se não houver sensibilidade comercial.' };
    }

    return {
      state: 'Subida faseada',
      proposedNow: Math.round((fraction.price + recommended * 0.55) / 5000) * 5000,
      target: recommended,
      note: 'Ajuste expressivo. Recomenda-se fasear a subida.'
    };
  }

  function getCommercialAnalysis(analysis) {
    const fraction = analysis.fraction;
    const modelRecommended = analysis.finalPrice || analysis.coherentPrice;
    const decision = getCommercialDecision(fraction, modelRecommended);
    const immediateAdjustment = decision.proposedNow - fraction.price;
    const potentialAdjustment = decision.target - fraction.price;

    return {
      ...analysis,
      modelRecommended,
      commercialState: decision.state,
      proposedNow: decision.proposedNow,
      targetPrice: decision.target,
      immediateAdjustment,
      potentialAdjustment,
      commercialNote: decision.note
    };
  }


  const el = {};
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    loadClientProposalState();
    bindEvents();
    await loadExcelData();
  }

  function cacheElements() {
    [
      'dataStatus','errorBox','kpiGrid','executiveSummary','cardsGrid','resultCount',
      'marketSummary','marketTable','marketCount','idealSummary','idealCount','idealFractionSelect','idealDetails','pdfFloorChecklist','pdfFractionChecklist','selectAllPdfFloors','clearPdfFloors','selectAllPdfFractions','clearPdfFractions','exportPdfButton','commercialSummary','commercialCount','commercialSummarySection','marketContextSection','marketContextGrid','marketContextReading','marketContextSource','commercialFiltersSection','commercialCardsSection','commercialTableSection','toggleCommercialSummary','toggleMarketContext','toggleCommercialFilters','toggleCommercialCards','toggleCommercialTable','commercialStateFilter','commercialImpactFilter','commercialTypologyFilter','commercialSort','commercialFloorChecklist','commercialFractionChecklist','commercialFractionSearch','commercialSelectedChips','commercialSelectAllFloors','commercialClearFloors','commercialSelectAllFractions','commercialSelectVisibleFractions','commercialClearFractions','clearCommercialFilters','commercialCards','commercialTable','commercialPdfType','exportCommercialPdfButton','finalPricesSummary','finalPricesCount','finalPriceSearch','finalTypologyChecklist','finalFloorChecklist','finalSelectAllTypologies','finalClearTypologies','finalSelectAllFloors','finalClearFloors','finalUseSuggestedVisible','finalClearVisible','finalExportJson','finalImportJson','finalPricesCards','clientProposalSummary','clientProposalCount','clientFractionSearch','clientTypologyChecklist','clientFloorChecklist','clientSelectAllTypologies','clientClearTypologies','clientSelectAllFloors','clientClearFloors','clientSelectAll','clientClearAll','clientResetPrices','clientProposalCards','clientExportPdf','clientExportJson','clientImportJson','calculationCards','calculationCount',
      'floorFilter','viewFilter','typologyFilter','fractionFilter','developmentFilter','sortFilter','resetFilters',
      'fractionModal','fractionModalContent','closeFractionModal','competitorModal','competitorModalContent','closeCompetitorModal'
    ].forEach((id) => { el[id] = document.getElementById(id); });
    el.tabButtons = Array.from(document.querySelectorAll('.tab-button'));
    el.tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
  }

  function bindEvents() {
    el.tabButtons.forEach((button) => button.addEventListener('click', () => setActiveTab(button.dataset.tab)));
    el.floorFilter.addEventListener('change', () => updateFilter('floor', el.floorFilter.value));
    el.viewFilter.addEventListener('change', () => updateFilter('view', el.viewFilter.value));
    el.typologyFilter.addEventListener('change', () => updateFilter('typology', el.typologyFilter.value));
    el.fractionFilter.addEventListener('change', () => updateFilter('fraction', el.fractionFilter.value));
    el.developmentFilter.addEventListener('change', () => updateFilter('development', el.developmentFilter.value));
    el.sortFilter.addEventListener('change', () => updateSort(el.sortFilter.value));
    el.resetFilters.addEventListener('click', resetFilters);
    if (el.idealFractionSelect) el.idealFractionSelect.addEventListener('change', () => { state.idealFocusedFraction = el.idealFractionSelect.value || ''; renderIdealPage(); });
    if (el.exportPdfButton) el.exportPdfButton.addEventListener('click', exportRecommendedPdf);
    if (el.selectAllPdfFloors) el.selectAllPdfFloors.addEventListener('click', () => setChecklistState(el.pdfFloorChecklist, true));
    if (el.clearPdfFloors) el.clearPdfFloors.addEventListener('click', () => setChecklistState(el.pdfFloorChecklist, false));
    if (el.selectAllPdfFractions) el.selectAllPdfFractions.addEventListener('click', () => setChecklistState(el.pdfFractionChecklist, true));
    if (el.clearPdfFractions) el.clearPdfFractions.addEventListener('click', () => setChecklistState(el.pdfFractionChecklist, false));

    if (el.commercialStateFilter) el.commercialStateFilter.addEventListener('change', () => { state.commercialFilters.state = el.commercialStateFilter.value; renderCommercialPage(); });
    if (el.commercialImpactFilter) el.commercialImpactFilter.addEventListener('change', () => { state.commercialFilters.impact = el.commercialImpactFilter.value; renderCommercialPage(); });
    if (el.commercialTypologyFilter) el.commercialTypologyFilter.addEventListener('change', () => { state.commercialFilters.typology = el.commercialTypologyFilter.value; renderCommercialPage(); });
    if (el.commercialSort) el.commercialSort.addEventListener('change', () => { state.commercialFilters.sort = el.commercialSort.value; renderCommercialPage(); });
    if (el.commercialFractionSearch) el.commercialFractionSearch.addEventListener('input', () => { state.commercialFilters.search = el.commercialFractionSearch.value; renderCommercialPage(); });
    if (el.commercialSelectAllFloors) el.commercialSelectAllFloors.addEventListener('click', () => { setChecklistState(el.commercialFloorChecklist, true); updateCommercialChecklistFilters(); });
    if (el.commercialClearFloors) el.commercialClearFloors.addEventListener('click', () => { setChecklistState(el.commercialFloorChecklist, false); updateCommercialChecklistFilters(); });
    if (el.commercialSelectAllFractions) el.commercialSelectAllFractions.addEventListener('click', () => { setChecklistState(el.commercialFractionChecklist, true); updateCommercialChecklistFilters(); });
    if (el.commercialSelectVisibleFractions) el.commercialSelectVisibleFractions.addEventListener('click', () => { setChecklistState(el.commercialFractionChecklist, true); updateCommercialChecklistFilters(); });
    if (el.commercialClearFractions) el.commercialClearFractions.addEventListener('click', () => { setChecklistState(el.commercialFractionChecklist, false); updateCommercialChecklistFilters(); });
    if (el.commercialFloorChecklist) el.commercialFloorChecklist.addEventListener('change', updateCommercialChecklistFilters);
    if (el.commercialFractionChecklist) el.commercialFractionChecklist.addEventListener('change', updateCommercialChecklistFilters);
    if (el.clearCommercialFilters) el.clearCommercialFilters.addEventListener('click', resetCommercialFilters);
    if (el.exportCommercialPdfButton) el.exportCommercialPdfButton.addEventListener('click', exportCommercialPdf);

    ['toggleCommercialSummary','toggleMarketContext','toggleCommercialFilters','toggleCommercialCards','toggleCommercialTable'].forEach((id) => {
      if (el[id]) el[id].addEventListener('change', applyCommercialVisibility);
    });




    if (el.finalPriceSearch) el.finalPriceSearch.addEventListener('input', () => { state.finalPriceFilters.search = el.finalPriceSearch.value; renderFinalPricesPage(false); });
    if (el.finalTypologyChecklist) el.finalTypologyChecklist.addEventListener('change', () => { state.finalPriceFilters.typologies = getSelectedChecklistValues(el.finalTypologyChecklist); renderFinalPricesPage(false); });
    if (el.finalFloorChecklist) el.finalFloorChecklist.addEventListener('change', () => { state.finalPriceFilters.floors = getSelectedChecklistValues(el.finalFloorChecklist); renderFinalPricesPage(false); });
    if (el.finalSelectAllTypologies) el.finalSelectAllTypologies.addEventListener('click', () => { setChecklistState(el.finalTypologyChecklist, true); state.finalPriceFilters.typologies = getSelectedChecklistValues(el.finalTypologyChecklist); renderFinalPricesPage(false); });
    if (el.finalClearTypologies) el.finalClearTypologies.addEventListener('click', () => { setChecklistState(el.finalTypologyChecklist, false); state.finalPriceFilters.typologies = []; renderFinalPricesPage(false); });
    if (el.finalSelectAllFloors) el.finalSelectAllFloors.addEventListener('click', () => { setChecklistState(el.finalFloorChecklist, true); state.finalPriceFilters.floors = getSelectedChecklistValues(el.finalFloorChecklist); renderFinalPricesPage(false); });
    if (el.finalClearFloors) el.finalClearFloors.addEventListener('click', () => { setChecklistState(el.finalFloorChecklist, false); state.finalPriceFilters.floors = []; renderFinalPricesPage(false); });
    if (el.finalUseSuggestedVisible) el.finalUseSuggestedVisible.addEventListener('click', useSuggestedPricesForVisibleFinal);
    if (el.finalClearVisible) el.finalClearVisible.addEventListener('click', clearVisibleFinalPrices);
    if (el.finalExportJson) el.finalExportJson.addEventListener('click', exportFinalPricesJson);
    if (el.finalImportJson) el.finalImportJson.addEventListener('change', importFinalPricesJson);

    if (el.clientFractionSearch) el.clientFractionSearch.addEventListener('input', () => { state.clientFilters.search = el.clientFractionSearch.value; renderClientProposalPage(false); });
    if (el.clientTypologyChecklist) el.clientTypologyChecklist.addEventListener('change', () => { state.clientFilters.typologies = getSelectedChecklistValues(el.clientTypologyChecklist); renderClientProposalPage(false); });
    if (el.clientFloorChecklist) el.clientFloorChecklist.addEventListener('change', () => { state.clientFilters.floors = getSelectedChecklistValues(el.clientFloorChecklist); renderClientProposalPage(false); });
    if (el.clientSelectAllTypologies) el.clientSelectAllTypologies.addEventListener('click', () => { setChecklistState(el.clientTypologyChecklist, true); state.clientFilters.typologies = getSelectedChecklistValues(el.clientTypologyChecklist); renderClientProposalPage(false); });
    if (el.clientClearTypologies) el.clientClearTypologies.addEventListener('click', () => { setChecklistState(el.clientTypologyChecklist, false); state.clientFilters.typologies = []; renderClientProposalPage(false); });
    if (el.clientSelectAllFloors) el.clientSelectAllFloors.addEventListener('click', () => { setChecklistState(el.clientFloorChecklist, true); state.clientFilters.floors = getSelectedChecklistValues(el.clientFloorChecklist); renderClientProposalPage(false); });
    if (el.clientClearFloors) el.clientClearFloors.addEventListener('click', () => { setChecklistState(el.clientFloorChecklist, false); state.clientFilters.floors = []; renderClientProposalPage(false); });
    if (el.clientSelectAll) el.clientSelectAll.addEventListener('click', () => { getVisibleClientAnalyses().forEach((a) => setClientSelected(a.fraction.name, true)); saveClientProposalState(); renderClientProposalPage(); });
    if (el.clientClearAll) el.clientClearAll.addEventListener('click', () => { getVisibleClientAnalyses().forEach((a) => setClientSelected(a.fraction.name, false)); saveClientProposalState(); renderClientProposalPage(); });
    if (el.clientResetPrices) el.clientResetPrices.addEventListener('click', resetClientPricesForVisible);
    if (el.clientExportPdf) el.clientExportPdf.addEventListener('click', exportClientProposalFromClientTab);
    if (el.clientExportJson) el.clientExportJson.addEventListener('click', exportClientProposalJson);
    if (el.clientImportJson) el.clientImportJson.addEventListener('change', importClientProposalJson);

    el.closeFractionModal.addEventListener('click', closeFractionModal);
    el.closeCompetitorModal.addEventListener('click', closeCompetitorModal);
    el.fractionModal.addEventListener('click', (event) => { if (event.target === el.fractionModal) closeFractionModal(); });
    el.competitorModal.addEventListener('click', (event) => { if (event.target === el.competitorModal) closeCompetitorModal(); });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!el.competitorModal.classList.contains('hidden')) closeCompetitorModal();
      else if (!el.fractionModal.classList.contains('hidden')) closeFractionModal();
    });
  }

  async function loadExcelData() {
    try {
      setStatus('A carregar Excel…');
      if (!window.XLSX) throw new Error('Biblioteca SheetJS não carregada.');
      const loaded = await fetchWorkbookFile();
      const workbook = XLSX.read(loaded.buffer, { type: 'array' });
      const parsed = parseWorkbook(workbook);
      state.benchmarks = parseBenchmarkWorkbook(workbook);
      if (!parsed.length) throw new Error('Excel não contém linhas válidas.');
      state.rows = parsed;
      splitDataset(parsed);
      if (!state.fractions.length) throw new Error('Não foram encontradas frações The View.');
      populateFilters();
      applyFilters();
      hideError();
      setStatus('Excel carregado', 'ok');
    } catch (error) {
      console.error(error);
      setStatus('Erro no Excel', 'error');
      showError(`${safeString(error.message)} Confirme que o ficheiro data.xlsx está na raiz do projeto e mantém as colunas principais.`);
      renderEmptyState();
    }
  }

  async function fetchWorkbookFile() {
    let lastError = null;
    for (const file of DATA_FILES) {
      try {
        const response = await fetch(file, { cache: 'no-store' });
        if (!response.ok) {
          lastError = new Error(`${file}: HTTP ${response.status}`);
          continue;
        }
        const buffer = await response.arrayBuffer();
        if (!buffer || buffer.byteLength < 100) {
          lastError = new Error(`${file}: ficheiro vazio ou inválido`);
          continue;
        }
        return { file, buffer };
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(`Não foi possível carregar data.xlsx ou data.xls. ${lastError ? lastError.message : ''}`);
  }

  function parseWorkbook(workbook) {
    if (!workbook || !Array.isArray(workbook.SheetNames) || !workbook.SheetNames.length) return [];
    const preferredSheet = workbook.SheetNames.find((name) => normalizeKey(name) === 'dados') || workbook.SheetNames[0];
    const sheet = workbook.Sheets[preferredSheet];
    if (!sheet) return [];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    return rawRows
      .map(normalizeRow)
      .filter((row) => row.name && Number.isFinite(row.price) && row.price > 0);
  }


  function parseBenchmarkWorkbook(workbook) {
    if (!workbook || !Array.isArray(workbook.SheetNames)) return [];

    const sheetName = workbook.SheetNames.find((name) => normalizeKey(name) === 'benchmarkmercado');
    if (!sheetName) return [];

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];

    return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
      .map((row) => {
        const get = createHeaderGetter(row);
        return {
          date: normalizeText(getFirst(get, ['Data'])),
          source: normalizeText(getFirst(get, ['Fonte'])),
          dataType: normalizeText(getFirst(get, ['Tipo de dado', 'Tipo'])),
          location: normalizeText(getFirst(get, ['Localização', 'Localizacao'])),
          segment: normalizeText(getFirst(get, ['Segmento'])),
          eurosPerSqm: parseNumber(getFirst(get, ['€/m²', 'EUR/m2', 'Eur/m2', 'Preço m2', 'Preco m2'])),
          monthlyChange: parseNumber(getFirst(get, ['Variação mensal', 'Variacao mensal'])),
          quarterlyChange: parseNumber(getFirst(get, ['Variação trimestral', 'Variacao trimestral'])),
          yearlyChange: parseNumber(getFirst(get, ['Variação anual', 'Variacao anual'])),
          use: normalizeText(getFirst(get, ['Uso recomendado'])),
          note: normalizeText(getFirst(get, ['Observação', 'Observacao'])),
          url: normalizeText(getFirst(get, ['URL', 'Link']))
        };
      })
      .filter((item) => item.location && Number.isFinite(item.eurosPerSqm));
  }


  function normalizeRow(raw, index) {
    const get = createHeaderGetter(raw);
    const name = getFirst(get, ['Fração','Fracao','Nome','Unidade','Apartamento','Unit']);
    const development = getFirst(get, ['Empreendimento','Projeto','Development','Project']);
    const typology = normalizeTypology(getFirst(get, ['Tipologia','Tipo','Typology']));
    const floorRaw = getFirst(get, ['Piso','Andar','Floor']);
    const floorNumber = parseFloor(floorRaw);
    const view = normalizeText(getFirst(get, ['Vista','View','Orientação','Orientacao']));
    const abp = parseNumber(getFirst(get, ['ABP','Área Bruta Privativa','Area Bruta Privativa','Área Privativa','Area Privativa']));
    const balcony = parseNumber(getFirst(get, ['Varanda/Terraço','Varanda/Terraco','Varanda','Terraço','Terraco','Balcony']));
    const totalAreaRaw = parseNumber(getFirst(get, ['Área Total','Area Total','Total','Área','Area']));
    const price = parseNumber(getFirst(get, ['PVP','Preço','Preco','Valor','Price']));
    const eurosPerSqmRaw = parseNumber(getFirst(get, ['€/m²','€/m2','EUR/m2','Preço m2','Preco m2']));
    const referenceYear = parseNumber(getFirst(get, ['Ano Referência','Ano Referencia','Ano','Reference Year']));
    const status = normalizeText(getFirst(get, ['Status','Estado','Disponibilidade']));
    const source = normalizeText(getFirst(get, ['Fonte','Source','Portal']));
    const url = normalizeText(getFirst(get, ['URL','Link']));
    const updatedAt = normalizeText(getFirst(get, ['Data de atualização','Data de atualizacao','Data atualização','Data atualizacao','Atualizado em']));
    const notes = normalizeText(getFirst(get, ['Observações comerciais','Observacoes comerciais','Observações','Observacoes','Notas']));
    const typeFlag = normalizeText(getFirst(get, ['Categoria','Tipo dado','Tipo de dado','Origem','Classe']));
    const totalArea = Number.isFinite(totalAreaRaw) && totalAreaRaw > 0 ? totalAreaRaw : sumAreas(abp, balcony);
    const eurosPerSqm = Number.isFinite(eurosPerSqmRaw) && eurosPerSqmRaw > 0 ? eurosPerSqmRaw : safeDivide(price, totalArea);
    return {
      id: `row-${index}-${slugify(name || 'item')}`,
      raw,
      name: safeString(name),
      development: safeString(development || ''),
      typology: safeString(typology || 'N/D'),
      floorLabel: safeString(floorRaw || floorNumber),
      floorNumber,
      view: safeString(view || 'N/D'),
      abp: positiveOrNull(abp),
      balcony: positiveOrNull(balcony),
      totalArea: positiveOrNull(totalArea),
      price: positiveOrNull(price),
      eurosPerSqm: positiveOrNull(eurosPerSqm),
      referenceYear: positiveOrNull(referenceYear),
      status, source, url, updatedAt, notes, typeFlag,
      isProject: isProjectRow({ development, typeFlag, name })
    };
  }

  function splitDataset(rows) {
    const projectRows = rows.filter((row) => row.isProject || normalizeKey(row.development).includes(normalizeKey(PROJECT_NAME)));
    if (projectRows.length) {
      const projectIds = new Set(projectRows.map((row) => row.id));
      state.fractions = projectRows;
      state.competitors = rows.filter((row) => !projectIds.has(row.id));
      return;
    }
    const grouped = groupBy(rows, (row) => normalizeKey(row.development || 'sem empreendimento'));
    let projectKey = '', max = -1;
    grouped.forEach((items, key) => { if (key !== 'semempreendimento' && items.length > max) { max = items.length; projectKey = key; } });
    state.fractions = rows.filter((row) => normalizeKey(row.development || '') === projectKey);
    state.competitors = rows.filter((row) => normalizeKey(row.development || '') !== projectKey);
  }

  function isProjectRow({ development, typeFlag, name }) {
    const haystack = normalizeKey(`${development || ''} ${typeFlag || ''} ${name || ''}`);
    if (haystack.includes(normalizeKey(PROJECT_NAME))) return true;
    if (haystack.includes('concorrente') || haystack.includes('competitor') || haystack.includes('benchmark')) return false;
    if (haystack.includes('fracao') || haystack.includes('projeto')) return true;
    return false;
  }

  function populateFilters() {
    setSelectOptions(el.floorFilter, uniqueSorted(state.fractions.map((f) => f.floorNumber)), 'Todos', String);
    setSelectOptions(el.viewFilter, uniqueSorted(state.fractions.map((f) => f.view)), 'Todas', String);
    setSelectOptions(el.typologyFilter, uniqueSorted(state.fractions.map((f) => f.typology)), 'Todas', String);
    setSelectOptions(el.fractionFilter, uniqueSorted(state.fractions.map((f) => f.name)), 'Todas', String);
    setSelectOptions(el.developmentFilter, uniqueSorted(state.competitors.map((c) => c.development || 'Sem empreendimento')), 'Todos', String);
  }

  function setSelectOptions(select, values, allLabel, labelMapper) {
    select.replaceChildren(createOption('all', allLabel));
    values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').forEach((value) => select.append(createOption(String(value), labelMapper(value))));
  }

  function createOption(value, label) {
    const option = document.createElement('option');
    option.value = value; option.textContent = label;
    return option;
  }

  function setMultiSelectOptions(select, values, labelMapper) {
    if (!select) return;
    const previous = getSelectedMultiValues(select);
    select.replaceChildren();
    values
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
      .forEach((value) => {
        const option = createOption(String(value), labelMapper ? labelMapper(value) : String(value));
        option.selected = previous.includes(String(value));
        select.append(option);
      });
  }

  function getSelectedMultiValues(select) {
    if (!select) return [];
    return Array.from(select.selectedOptions || []).map((o) => o.value).filter(Boolean);
  }


  function renderChecklist(container, items, options = {}) {
    if (!container) return;
    const previous = new Set(getSelectedChecklistValues(container));
    container.replaceChildren();

    items.forEach((item) => {
      const value = String(item.value);
      const id = `${container.id}-${slugify(value)}`;

      const input = h('input', {
        attrs: {
          type: 'checkbox',
          id,
          value,
          'data-value': value
        }
      });

      if (previous.has(value)) input.checked = true;

      const label = h('label', { className: 'check-pill', attrs: { for: id } });
      label.append(input, h('span', { text: item.label }));
      container.append(label);
    });

    if (options.defaultAll && !previous.size) {
      Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach((input) => { input.checked = true; });
    }
  }

  function getSelectedChecklistValues(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
  }

  function setChecklistState(container, checked) {
    if (!container) return;
    Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach((input) => { input.checked = checked; });
  }


  function updateFilter(key, value) { state.filters[key] = value; applyFilters(); }
  function updateSort(value) { state.sort = value || 'name-asc'; applyFilters(); }
  function resetFilters() {
    state.filters = { floor: 'all', view: 'all', typology: 'all', fraction: 'all', development: 'all' };
    state.sort = 'name-asc';
    state.idealFocusedFraction = '';
    el.floorFilter.value = 'all'; el.viewFilter.value = 'all'; el.typologyFilter.value = 'all'; el.fractionFilter.value = 'all'; el.developmentFilter.value = 'all'; el.sortFilter.value = 'name-asc';
    if (el.idealFractionSelect) el.idealFractionSelect.value = '';
    applyFilters();
  }

  function applyFilters() {
    state.filteredFractions = state.fractions.filter((fraction) => {
      const floorMatch = state.filters.floor === 'all' || String(fraction.floorNumber) === state.filters.floor;
      const viewMatch = state.filters.view === 'all' || fraction.view === state.filters.view;
      const typologyMatch = state.filters.typology === 'all' || normalizeKey(fraction.typology) === normalizeKey(state.filters.typology);
      const fractionMatch = state.filters.fraction === 'all' || fraction.name === state.filters.fraction;
      return floorMatch && viewMatch && typologyMatch && fractionMatch;
    });
    state.filteredCompetitors = state.competitors.filter((competitor) => {
      const developmentMatch = state.filters.development === 'all' || (competitor.development || 'Sem empreendimento') === state.filters.development;
      const typologyMatch = state.filters.typology === 'all' || normalizeKey(competitor.typology) === normalizeKey(state.filters.typology);
      return developmentMatch && typologyMatch;
    });
    state.filteredFractions = sortFractions(state.filteredFractions, state.sort);
    renderAll();
  }

  function renderAll() {
    renderKpis(); renderExecutiveSummary(); renderCards(); renderMarketPage(); renderIdealPage(); renderMarketContext(); renderCommercialPage(); renderFinalPricesPage(); renderClientProposalPage(); renderCalculationPage();
  }

  function renderKpis() {
    const competitorMedian = median(state.filteredCompetitors.map((c) => c.eurosPerSqm).filter(Number.isFinite));
    const weightedCompetitorMedian = weightedMedian(state.filteredCompetitors.map((c) => ({ value: c.eurosPerSqm, weight: getBaseMarketWeight(c) })));
    replace(el.kpiGrid,
      kpi('Frações', state.filteredFractions.length, 'The View filtrado'),
      kpi('Concorrentes', state.filteredCompetitors.length, 'Compset filtrado'),
      kpi('Mediana ponderada', formatCurrency(weightedCompetitorMedian, 0) + '/m²', `Simples: ${formatCurrency(competitorMedian, 0)}/m²`)
    );
  }

  function renderExecutiveSummary() {
    const tvMedian = median(state.filteredFractions.map((f) => f.eurosPerSqm).filter(Number.isFinite));
    const compWeighted = weightedMedian(state.filteredCompetitors.map((c) => ({ value: c.eurosPerSqm, weight: getBaseMarketWeight(c) })));
    const gaps = state.filteredFractions.map((f) => {
      const ideal = calculateIdealMarketPrice(f, state.filteredCompetitors);
      return ideal.price && f.price ? ((f.price - ideal.price) / ideal.price) * 100 : null;
    }).filter(Number.isFinite);
    const avgGap = average(gaps);
    const above = gaps.filter((g) => g > 2).length;
    const below = gaps.filter((g) => g < -2).length;
    replace(el.executiveSummary,
      summary('€/m² The View', formatCurrency(tvMedian, 0), 'Mediana das frações filtradas'),
      summary('€/m² mercado ponderado', formatCurrency(compWeighted, 0), 'Ano + penalização Le Parc'),
      summary('Gap médio atual', Number.isFinite(avgGap) ? signed(formatNumber(Math.abs(avgGap), 1) + '%', avgGap) : '—', 'Vs preço ideal de mercado'),
      summary('Acima / abaixo', `${above} / ${below}`, 'Fora de uma banda de ±2%')
    );
  }

  function renderCards() {
    el.resultCount.textContent = `${state.filteredFractions.length} fração${state.filteredFractions.length === 1 ? '' : 'ões'} visível${state.filteredFractions.length === 1 ? '' : 'eis'}`;
    if (!state.filteredFractions.length) return replace(el.cardsGrid, empty('Sem frações com os filtros atuais.'));
    const cards = state.filteredFractions.map((fraction) => {
      const sets = getCompetitorSets(fraction, state.filteredCompetitors);
      const ideal = calculateIdealMarketPrice(fraction, state.filteredCompetitors);
      const gap = ideal.price ? ((fraction.price - ideal.price) / ideal.price) * 100 : null;
      const card = h('article', { className: 'fraction-card', attrs: { tabindex: '0', role: 'button' } });
      card.addEventListener('click', () => openFractionModal(fraction.id));
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') openFractionModal(fraction.id); });
      card.append(
        div('card-top', [div('card-name', fraction.name), div('card-price', formatCurrency(fraction.price, 0))]),
        div('card-grid', [
          metric('Piso', fraction.floorLabel), metric('Orientação', getOrientation(fraction)), metric('ABP', formatArea(fraction.abp)), metric('Varanda', formatArea(fraction.balcony)), metric('Área Total', formatArea(fraction.totalArea)), metric('€/m²', formatCurrency(fraction.eurosPerSqm, 0))
        ]),
        div('badge-row', [badge(`Diretos ${sets.direct.length}`, 'ok'), badge(`Indiretos ${sets.indirect.length}`, 'warn'), badge(Number.isFinite(gap) ? `Gap ${signed(formatNumber(Math.abs(gap),1)+'%', gap)}` : 'Sem preço ideal', Number.isFinite(gap) && gap > 3 ? 'danger' : 'ok')])
      );
      return card;
    });
    replace(el.cardsGrid, ...cards);
  }

  function renderMarketPage() {
    const byDev = groupBy(state.filteredCompetitors, (c) => c.development || 'Sem empreendimento');
    const leParcCount = state.filteredCompetitors.filter(isLeParc).length;
    const oldCount = state.filteredCompetitors.filter((c) => getYear(c) <= 2024).length;
    const avgBaseWeight = average(state.filteredCompetitors.map(getBaseMarketWeight).filter(Number.isFinite));
    replace(el.marketSummary,
      summary('Empreendimentos', byDev.size, 'Concorrentes únicos'),
      summary('Dados 2024 ou anteriores', oldCount, 'Peso reduzido por ano'),
      summary('Le Parc', leParcCount, 'Multiplicador específico 0,60'),
      summary('Peso médio base', formatNumber(avgBaseWeight, 2), 'Ano × empreendimento')
    );
    el.marketCount.textContent = `${state.filteredCompetitors.length} concorrente${state.filteredCompetitors.length === 1 ? '' : 's'}`;
    const rows = sortCompetitors([...state.filteredCompetitors]);
    renderTable(el.marketTable, ['Empreendimento','Fração','Tipologia','Piso','Vista','Ano','€/m²','Peso ano','Peso emp.','Peso base','Motivo'], rows.map((c) => [
      c.development || '—', c.name, c.typology, c.floorLabel, c.view, getYear(c) || '—', formatCurrency(c.eurosPerSqm,0), formatNumber(getYearWeight(c),2), formatNumber(getDevelopmentWeight(c),2), formatNumber(getBaseMarketWeight(c),2), getWeightReason(c)
    ]));
  }


  function formatMoney(value) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value).replace(/\s€/g, ' €');
  }

  function formatSignedMoney(value) {
    if (!Number.isFinite(value) || Math.abs(value) < 1) return '0 €';
    const sign = value > 0 ? '+' : '-';
    return `${sign}${formatMoney(Math.abs(value))}`;
  }





  function applyCommercialVisibility() {
    const pairs = [
      ['toggleCommercialSummary', 'commercialSummarySection'],
      ['toggleMarketContext', 'marketContextSection'],
      ['toggleCommercialFilters', 'commercialFiltersSection'],
      ['toggleCommercialCards', 'commercialCardsSection'],
      ['toggleCommercialTable', 'commercialTableSection']
    ];

    pairs.forEach(([toggleId, sectionId]) => {
      if (!el[toggleId] || !el[sectionId]) return;
      el[sectionId].classList.toggle('hidden', !el[toggleId].checked);
    });
  }



  function renderMarketContext() {
    if (!el.marketContextGrid) return;

    const tvMedian = median(state.filteredFractions.map((f) => f.eurosPerSqm).filter(Number.isFinite));
    const olhao = getBenchmarkValue('Olhão');
    const algarve = getBenchmarkValue('Algarve');
    const portugal = getBenchmarkValue('Portugal');

    const sourceText = getBenchmarkSourceText();

    replace(el.marketContextGrid,
      summary('The View', formatCurrency(tvMedian, 0) + '/m²', 'Mediana das frações filtradas'),
      summary('Olhão', formatCurrency(olhao?.eurosPerSqm, 0) + '/m²', olhao ? `${olhao.source} · ${olhao.date}` : 'Não encontrado no Excel'),
      summary('Algarve', formatCurrency(algarve?.eurosPerSqm, 0) + '/m²', algarve ? `${algarve.source} · ${algarve.date}` : 'Não encontrado no Excel'),
      summary('Portugal', formatCurrency(portugal?.eurosPerSqm, 0) + '/m²', portugal ? `${portugal.source} · ${portugal.date}` : 'Não encontrado no Excel'),
      summary('The View vs Olhão', formatPercentRatio(tvMedian, olhao?.eurosPerSqm), 'Prémio local'),
      summary('The View vs Algarve', formatPercentRatio(tvMedian, algarve?.eurosPerSqm), 'Posicionamento regional')
    );

    if (el.marketContextSource) {
      el.marketContextSource.textContent = sourceText;
    }

    if (el.marketContextReading) {
      const localGap = getRatioGap(tvMedian, olhao?.eurosPerSqm);
      const regionalGap = getRatioGap(tvMedian, algarve?.eurosPerSqm);
      const macroGap = getRatioGap(tvMedian, portugal?.eurosPerSqm);

      const paragraphs = [
        `O The View apresenta mediana de ${formatCurrency(tvMedian, 0)}/m² nas frações filtradas.`,
        Number.isFinite(localGap)
          ? `Face ao benchmark de Olhão, o posicionamento está ${formatSignedPercent(localGap)}.`
          : 'Não existe benchmark de Olhão disponível na folha Benchmark_Mercado.',
        Number.isFinite(regionalGap)
          ? `Face ao Algarve, o posicionamento está ${formatSignedPercent(regionalGap)}.`
          : 'Não existe benchmark do Algarve disponível na folha Benchmark_Mercado.',
        Number.isFinite(macroGap)
          ? `Face a Portugal, o posicionamento está ${formatSignedPercent(macroGap)}.`
          : 'Não existe benchmark de Portugal disponível na folha Benchmark_Mercado.',
        'Estes valores são contexto de mercado. O preço recomendado continua a ser calculado pelo compset direto e pela coerência interna.'
      ];

      replace(el.marketContextReading, ...paragraphs.map((text) => h('p', { text })));
    }
  }

  function getBenchmarkValue(location) {
    const normalized = normalizeKey(location);
    const items = state.benchmarks.filter((item) => normalizeKey(item.location) === normalized);
    if (!items.length) return null;

    const idealistaOffer = items.find((item) => normalizeKey(item.source).includes('idealista') && normalizeKey(item.dataType).includes('oferta'));
    return idealistaOffer || items[0];
  }

  function getBenchmarkSourceText() {
    if (!state.benchmarks.length) return 'Sem Benchmark_Mercado no Excel';
    const sources = uniqueSorted(state.benchmarks.map((b) => `${b.source} ${b.date}`));
    return sources.slice(0, 2).join(' · ') + (sources.length > 2 ? ' · +' + (sources.length - 2) : '');
  }

  function getRatioGap(value, base) {
    return Number.isFinite(value) && Number.isFinite(base) && base > 0 ? (value / base) - 1 : null;
  }

  function formatPercentRatio(value, base) {
    const gap = getRatioGap(value, base);
    return Number.isFinite(gap) ? formatSignedPercent(gap) : '—';
  }

  function formatSignedPercent(value) {
    if (!Number.isFinite(value)) return '—';
    return `${value >= 0 ? '+' : ''}${formatNumber(value * 100, 1)}%`;
  }


  function updateCommercialChecklistFilters() {
    state.commercialFilters.floors = getSelectedChecklistValues(el.commercialFloorChecklist);
    state.commercialFilters.fractions = getSelectedChecklistValues(el.commercialFractionChecklist);
    renderCommercialPage(false);
  }

  function resetCommercialFilters() {
    state.commercialFilters = { state: 'all', impact: 'all', typology: 'all', floors: [], fractions: [], search: '', sort: 'immediate-desc' };
    if (el.commercialStateFilter) el.commercialStateFilter.value = 'all';
    if (el.commercialImpactFilter) el.commercialImpactFilter.value = 'all';
    if (el.commercialTypologyFilter) el.commercialTypologyFilter.value = 'all';
    if (el.commercialSort) el.commercialSort.value = 'immediate-desc';
    if (el.commercialFractionSearch) el.commercialFractionSearch.value = '';
    renderCommercialPage(true);
  }

  function getCommercialAnalyses() {
    return buildIdealAnalyses(state.filteredFractions).map(getCommercialAnalysis);
  }

  function syncCommercialControls(allAnalyses, preserveSelections = true) {
    if (!el.commercialTypologyFilter) return;

    const typologies = uniqueSorted(allAnalyses.map((item) => item.fraction.typology));
    const previousTypology = state.commercialFilters.typology || 'all';
    el.commercialTypologyFilter.replaceChildren(createOption('all', 'Todas'));
    typologies.forEach((typology) => el.commercialTypologyFilter.append(createOption(typology, typology)));
    el.commercialTypologyFilter.value = typologies.includes(previousTypology) ? previousTypology : 'all';
    state.commercialFilters.typology = el.commercialTypologyFilter.value;

    const floors = uniqueSorted(allAnalyses.map((item) => item.fraction.floorNumber));
    renderChecklist(
      el.commercialFloorChecklist,
      floors.map((floor) => ({ value: String(floor), label: `Piso ${floor}` })),
      { defaultAll: true, preserve: preserveSelections }
    );

    const search = normalizeKey(state.commercialFilters.search || '');
    const fractionsForChecklist = allAnalyses
      .filter((item) => !search || normalizeKey(item.fraction.name).includes(search) || String(getFractionNumber(item.fraction)).includes(search))
      .map((item) => item.fraction.name);

    renderChecklist(
      el.commercialFractionChecklist,
      fractionsForChecklist.map((name) => ({ value: name, label: name })),
      { defaultAll: true, preserve: preserveSelections }
    );

    state.commercialFilters.floors = getSelectedChecklistValues(el.commercialFloorChecklist);
    state.commercialFilters.fractions = getSelectedChecklistValues(el.commercialFractionChecklist);
  }

  function filterCommercialAnalyses(analyses) {
    const f = state.commercialFilters;

    return analyses.filter((analysis) => {
      const fraction = analysis.fraction;
      const stateMatch = f.state === 'all' || analysis.commercialState === f.state;
      const impactMatch = f.impact === 'all' || getImpactBucket(analysis.immediateAdjustment) === f.impact;
      const typologyMatch = f.typology === 'all' || normalizeKey(fraction.typology) === normalizeKey(f.typology);
      const floorMatch = !f.floors.length || f.floors.includes(String(fraction.floorNumber));
      const fractionMatch = !f.fractions.length || f.fractions.includes(fraction.name);
      return stateMatch && impactMatch && typologyMatch && floorMatch && fractionMatch;
    });
  }

  function sortCommercialAnalyses(analyses) {
    const order = { 'Aplicar agora': 1, 'Subida faseada': 2, 'Rever gerência': 3, 'Manter': 4 };
    const sort = state.commercialFilters.sort || 'immediate-desc';
    const arr = [...analyses];

    const cmp = {
      'immediate-desc': (a,b) => b.immediateAdjustment - a.immediateAdjustment || naturalNameCompare(a.fraction,b.fraction),
      'potential-desc': (a,b) => b.potentialAdjustment - a.potentialAdjustment || naturalNameCompare(a.fraction,b.fraction),
      'floor-asc': (a,b) => a.fraction.floorNumber - b.fraction.floorNumber || naturalNameCompare(a.fraction,b.fraction),
      'current-desc': (a,b) => b.fraction.price - a.fraction.price || naturalNameCompare(a.fraction,b.fraction),
      'proposed-desc': (a,b) => b.proposedNow - a.proposedNow || naturalNameCompare(a.fraction,b.fraction),
      'state-asc': (a,b) => (order[a.commercialState] || 9) - (order[b.commercialState] || 9) || naturalNameCompare(a.fraction,b.fraction),
      'typology-asc': (a,b) => a.fraction.typology.localeCompare(b.fraction.typology, 'pt', { numeric: true }) || naturalNameCompare(a.fraction,b.fraction)
    }[sort] || ((a,b) => naturalNameCompare(a.fraction,b.fraction));

    return arr.sort(cmp);
  }

  function renderCommercialPage(syncControls = true) {
    if (!el.commercialSummary) return;

    const allAnalyses = getCommercialAnalyses();
    if (syncControls) syncCommercialControls(allAnalyses, true);

    const filtered = sortCommercialAnalyses(filterCommercialAnalyses(allAnalyses));
    renderCommercialSummary(filtered);
    renderCommercialCards(filtered);
    renderCommercialTable(filtered);
    renderCommercialSelectedChips(filtered);
    applyCommercialVisibility();

    if (el.commercialCount) {
      el.commercialCount.textContent = `${filtered.length} frações na proposta`;
    }
  }

  function renderCommercialSummary(analyses) {
    const revenueCurrent = sum(analyses.map((a) => a.fraction.price));
    const revenueProposed = sum(analyses.map((a) => a.proposedNow));
    const revenueTarget = sum(analyses.map((a) => a.targetPrice));
    const immediate = revenueProposed - revenueCurrent;
    const potential = revenueTarget - revenueCurrent;
    const counts = countByState(analyses);

    replace(el.commercialSummary,
      summary('Receita atual', formatMoney(revenueCurrent), 'Tabela atual filtrada'),
      summary('Receita proposta agora', formatMoney(revenueProposed), `${formatSignedMoney(immediate)} vs atual`),
      summary('Receita-alvo', formatMoney(revenueTarget), `${formatSignedMoney(potential)} vs atual`),
      summary('Incremento imediato', formatSignedMoney(immediate), 'Aplicação proposta agora'),
      summary('Incremento potencial', formatSignedMoney(potential), 'Segunda fase / alvo'),
      summary('Estados', `${counts['Aplicar agora'] || 0} aplicar · ${counts['Subida faseada'] || 0} fasear`, `${counts['Manter'] || 0} manter · ${counts['Rever gerência'] || 0} rever`)
    );
  }

  function renderCommercialCards(analyses) {
    if (!el.commercialCards) return;
    el.commercialCards.replaceChildren();

    if (!analyses.length) {
      el.commercialCards.append(empty('Sem frações com os filtros comerciais atuais.'));
      return;
    }

    analyses.forEach((analysis) => {
      const f = analysis.fraction;
      const card = div('commercial-card', [
        div('commercial-card-head', [
          div('commercial-card-title', [
            h('strong', { text: f.name }),
            h('span', { text: `${f.typology} · Piso ${f.floorLabel} · ${getOrientation(f)}` })
          ]),
          h('span', { className: `decision-badge ${getDecisionClass(analysis.commercialState)}`, text: analysis.commercialState })
        ]),
        div('commercial-card-grid', [
          metric('Preço atual', formatMoney(f.price)),
          metric('Recomendado modelo', formatMoney(analysis.modelRecommended)),
          metric('Proposto agora', formatMoney(analysis.proposedNow)),
          metric('Preço-alvo', formatMoney(analysis.targetPrice)),
          metric('Ajuste imediato', formatSignedMoney(analysis.immediateAdjustment)),
          metric('Ajuste potencial', formatSignedMoney(analysis.potentialAdjustment))
        ]),
        div('commercial-reading', [
          h('strong', { text: 'Leitura comercial' }),
          h('p', { text: analysis.commercialNote })
        ])
      ]);

      el.commercialCards.append(card);
    });
  }

  function renderCommercialTable(analyses) {
    if (!el.commercialTable) return;

    const headers = [
      'Fração',
      'Tipologia',
      'Piso',
      'Orientação',
      'Preço atual',
      'Preço recomendado pelo modelo',
      'Preço proposto agora',
      'Preço-alvo',
      'Ajuste imediato',
      'Ajuste potencial',
      'Estado da decisão',
      'Justificação comercial'
    ];

    const rows = analyses.map((analysis) => [
      analysis.fraction.name,
      analysis.fraction.typology,
      analysis.fraction.floorLabel,
      getOrientation(analysis.fraction),
      formatMoney(analysis.fraction.price),
      formatMoney(analysis.modelRecommended),
      formatMoney(analysis.proposedNow),
      formatMoney(analysis.targetPrice),
      formatSignedMoney(analysis.immediateAdjustment),
      formatSignedMoney(analysis.potentialAdjustment),
      { type: 'decision-state', label: analysis.commercialState },
      analysis.commercialNote
    ]);

    renderTable(el.commercialTable, headers, rows);
  }

  function renderCommercialSelectedChips(analyses) {
    if (!el.commercialSelectedChips) return;
    const selected = state.commercialFilters.fractions || [];
    el.commercialSelectedChips.replaceChildren();

    if (!selected.length) {
      el.commercialSelectedChips.append(h('span', { className: 'muted small', text: 'Nenhuma fração marcada: serão usadas todas as frações disponíveis.' }));
      return;
    }

    selected.forEach((name) => {
      const chip = h('button', { className: 'selected-chip', text: `× ${name}`, attrs: { type: 'button' } });
      chip.addEventListener('click', () => {
        const input = el.commercialFractionChecklist?.querySelector(`input[value="${cssEscape(name)}"]`);
        if (input) input.checked = false;
        updateCommercialChecklistFilters();
      });
      el.commercialSelectedChips.append(chip);
    });
  }

  function getImpactBucket(value) {
    const n = Math.abs(Number(value) || 0);
    if (n < 1000) return 'none';
    if (n <= 20000) return 'up-to-20';
    if (n <= 35000) return '20-35';
    if (n <= 55000) return '35-55';
    return 'above-55';
  }

  function countByState(analyses) {
    return analyses.reduce((acc, item) => {
      acc[item.commercialState] = (acc[item.commercialState] || 0) + 1;
      return acc;
    }, {});
  }

  function sum(values) {
    return values.filter(Number.isFinite).reduce((acc, value) => acc + value, 0);
  }

  function getDecisionClass(stateText) {
    const key = normalizeKey(stateText);
    if (key.includes('aplicar')) return 'decision-apply';
    if (key.includes('faseada')) return 'decision-phase';
    if (key.includes('rever')) return 'decision-review';
    return 'decision-keep';
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }




  function getOfficialFinalPrice(analysis) {
    const stored = state.finalPrices[analysis.fraction.name];
    const value = parseNumber(stored?.price);
    return Number.isFinite(value) ? value : null;
  }

  function getOfficialFinalNote(analysis) {
    const stored = state.finalPrices[analysis.fraction.name];
    return safeString(stored?.note || '');
  }

  function getOfficialPlanUrl(analysis) {
    const stored = state.finalPrices[analysis.fraction.name];
    return safeString(stored?.planUrl || '');
  }

  function getFinalPriceAnalyses() {
    return getCommercialAnalyses().map((analysis) => {
      const official = getOfficialFinalPrice(analysis);
      return {
        ...analysis,
        officialFinalPrice: official,
        officialPriceToUse: Number.isFinite(official) ? official : analysis.proposedNow,
        officialNote: getOfficialFinalNote(analysis) || getDefaultClientNote(analysis),
        planUrl: getOfficialPlanUrl(analysis)
      };
    });
  }

  function getVisibleFinalPriceAnalyses() {
    const search = normalizeKey(state.finalPriceFilters.search || '');
    return getFinalPriceAnalyses().filter((analysis) => {
      const f = analysis.fraction;
      const searchMatch = !search
        || normalizeKey(f.name).includes(search)
        || normalizeKey(f.typology).includes(search)
        || String(getFractionNumber(f)).includes(search);
      const typologies = state.finalPriceFilters.typologies || [];
      const floors = state.finalPriceFilters.floors || [];
      const typologyMatch = !typologies.length || typologies.includes(f.typology);
      const floorMatch = !floors.length || floors.includes(String(f.floorNumber));
      return searchMatch && typologyMatch && floorMatch;
    }).sort((a, b) => naturalNameCompare(a.fraction, b.fraction));
  }

  function renderFinalPricesPage(syncControls = true) {
    if (!el.finalPricesCards) return;

    if (syncControls) syncFinalPriceControls();

    const visible = getVisibleFinalPriceAnalyses();
    const all = getFinalPriceAnalyses();
    const confirmed = all.filter((a) => Number.isFinite(a.officialFinalPrice));
    const totalConfirmed = sum(confirmed.map((a) => a.officialFinalPrice));

    if (el.finalPricesCount) {
      el.finalPricesCount.textContent = `${confirmed.length} preço${confirmed.length === 1 ? '' : 's'} final${confirmed.length === 1 ? '' : 'is'} definido${confirmed.length === 1 ? '' : 's'}`;
    }

    if (el.finalPricesSummary) {
      replace(el.finalPricesSummary,
        summary('Preços finais definidos', formatNumber(confirmed.length), `${all.length} frações totais`),
        summary('Valor confirmado', formatMoney(totalConfirmed), 'Soma dos preços finais definidos'),
        summary('Frações visíveis', formatNumber(visible.length), 'Após filtros desta aba'),
        summary('Uso no PDF Cliente', 'Automático', 'Substitui preço sugerido quando definido')
      );
    }

    el.finalPricesCards.replaceChildren();

    if (!visible.length) {
      el.finalPricesCards.append(empty('Sem frações com os filtros atuais.'));
      return;
    }

    visible.forEach((analysis) => {
      const f = analysis.fraction;
      const official = analysis.officialFinalPrice;
      const hasOfficial = Number.isFinite(official);

      const priceInput = h('input', {
        className: 'client-price-input',
        attrs: {
          type: 'number',
          min: '0',
          step: '5000',
          value: Math.round(hasOfficial ? official : analysis.proposedNow)
        }
      });

      const noteInput = h('textarea', {
        className: 'client-note-input',
        text: analysis.officialNote,
        attrs: { rows: '2', placeholder: 'Observação curta para cliente' }
      });

      const planInput = h('input', {
        className: 'client-price-input',
        attrs: {
          type: 'text',
          value: analysis.planUrl,
          placeholder: 'Opcional: substitui a planta automática. Ex.: plantas/apto-10.jpg'
        }
      });

      priceInput.addEventListener('change', () => {
        setOfficialFinalPrice(f.name, parseNumber(priceInput.value), noteInput.value, planInput.value);
        saveClientProposalState();
        renderFinalPricesPage(false);
        renderClientProposalPage();
      });

      noteInput.addEventListener('change', () => {
        setOfficialFinalPrice(f.name, parseNumber(priceInput.value), noteInput.value, planInput.value);
        saveClientProposalState();
      });

      planInput.addEventListener('change', () => {
        setOfficialFinalPrice(f.name, parseNumber(priceInput.value), noteInput.value, planInput.value);
        saveClientProposalState();
      });

      const useSuggested = h('button', { className: 'mini-action', text: 'Usar sugerido', attrs: { type: 'button' } });
      useSuggested.addEventListener('click', () => {
        setOfficialFinalPrice(f.name, analysis.proposedNow, noteInput.value, planInput.value);
        saveClientProposalState();
        renderFinalPricesPage(false);
        renderClientProposalPage();
      });

      const clear = h('button', { className: 'mini-action', text: 'Limpar', attrs: { type: 'button' } });
      clear.addEventListener('click', () => {
        delete state.finalPrices[f.name];
        saveClientProposalState();
        renderFinalPricesPage(false);
        renderClientProposalPage();
      });

      const card = div(`final-price-card ${hasOfficial ? 'confirmed' : ''}`, [
        div('client-proposal-card-head', [
          div('client-select-title', [
            div('', [
              h('strong', { text: f.name }),
              h('span', { text: `${f.typology} · Piso ${f.floorLabel} · ${getOrientation(f)}` })
            ])
          ]),
          h('span', { className: hasOfficial ? 'final-status confirmed' : 'final-status pending', text: hasOfficial ? 'Preço final definido' : 'A usar sugerido' })
        ]),
        div('client-proposal-metrics', [
          metric('Preço sugerido', formatMoney(analysis.proposedNow)),
          metric('Preço final', formatMoney(hasOfficial ? official : analysis.proposedNow)),
          metric('ABP', formatArea(f.abp)),
          metric('Área total', formatArea(f.totalArea)),
          metric('Preço/m² final', formatCurrency((hasOfficial ? official : analysis.proposedNow) / f.totalArea, 0) + '/m²')
        ]),
        div('final-edit-grid', [
          labelWrap('Preço final a comunicar', priceInput),
          labelWrap('Observação cliente', noteInput),
          labelWrap('Planta manual opcional', planInput)
        ]),
        div('plant-auto-card', [
          h('strong', { text: 'Planta automática' }),
          h('span', { text: getPlantLabelForAnalysis(analysis) })
        ]),
        div('final-card-actions', [useSuggested, clear])
      ]);

      el.finalPricesCards.append(card);
    });
  }

  function syncFinalPriceControls() {
    const typologies = uniqueSorted(state.filteredFractions.map((f) => f.typology));
    const floors = uniqueSorted(state.filteredFractions.map((f) => f.floorNumber));

    const prevTypologies = new Set(state.finalPriceFilters.typologies || []);
    const prevFloors = new Set(state.finalPriceFilters.floors || []);

    renderChecklist(
      el.finalTypologyChecklist,
      typologies.map((typology) => ({ value: typology, label: typology })),
      { defaultAll: false }
    );

    renderChecklist(
      el.finalFloorChecklist,
      floors.map((floor) => ({ value: String(floor), label: `Piso ${floor}` })),
      { defaultAll: false }
    );

    if (prevTypologies.size && el.finalTypologyChecklist) {
      Array.from(el.finalTypologyChecklist.querySelectorAll('input[type="checkbox"]')).forEach((input) => {
        input.checked = prevTypologies.has(input.value);
      });
    }

    if (prevFloors.size && el.finalFloorChecklist) {
      Array.from(el.finalFloorChecklist.querySelectorAll('input[type="checkbox"]')).forEach((input) => {
        input.checked = prevFloors.has(input.value);
      });
    }

    state.finalPriceFilters.typologies = getSelectedChecklistValues(el.finalTypologyChecklist);
    state.finalPriceFilters.floors = getSelectedChecklistValues(el.finalFloorChecklist);
  }

  function setOfficialFinalPrice(fractionName, price, note = '', planUrl = '') {
    if (!Number.isFinite(price) || price <= 0) {
      delete state.finalPrices[fractionName];
      return;
    }

    state.finalPrices[fractionName] = {
      price,
      note: safeString(note),
      planUrl: safeString(planUrl)
    };
  }

  function useSuggestedPricesForVisible() {
    getVisibleFinalPriceAnalyses().forEach((analysis) => {
      setOfficialFinalPrice(analysis.fraction.name, analysis.proposedNow, analysis.officialNote, analysis.planUrl);
    });
    saveClientProposalState();
    renderFinalPricesPage(false);
    renderClientProposalPage();
  }

  function clearVisibleFinalPrices() {
    getVisibleFinalPriceAnalyses().forEach((analysis) => {
      delete state.finalPrices[analysis.fraction.name];
    });
    saveClientProposalState();
    renderFinalPricesPage(false);
    renderClientProposalPage();
  }

  function exportFinalPricesJson() {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      finalPrices: state.finalPrices
    };

    downloadJson(payload, 'the-view-tabela-final-precos.json');
  }

  function importFinalPricesJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        state.finalPrices = parsed.finalPrices || parsed || {};
        saveClientProposalState();
        renderFinalPricesPage();
        renderClientProposalPage();
      } catch (error) {
        alert('Não foi possível importar a tabela final.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }


  const CLIENT_STORAGE_KEY = 'theViewClientProposalV1';

  function loadClientProposalState() {
    try {
      const raw = localStorage.getItem(CLIENT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state.clientSelections = parsed.clientSelections || {};
      state.finalPrices = parsed.finalPrices || {};
    } catch (error) {
      console.warn('Não foi possível carregar preços finais do browser.', error);
    }
  }

  function saveClientProposalState() {
    try {
      localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify({
        clientSelections: state.clientSelections,
        finalPrices: state.finalPrices
      }));
    } catch (error) {
      console.warn('Não foi possível guardar preços finais no browser.', error);
    }
  }

  function getClientAnalyses() {
    return getCommercialAnalyses().map((analysis) => {
      const key = analysis.fraction.name;
      const storedPrice = parseNumber(state.finalPrices[key]?.price);
      const storedNote = safeString(state.finalPrices[key]?.note || '');
      const storedPlanUrl = safeString(state.finalPrices[key]?.planUrl || '');
      return {
        ...analysis,
        clientSelected: state.clientSelections[key] === true,
        clientFinalPrice: Number.isFinite(storedPrice) ? storedPrice : analysis.proposedNow,
        clientNote: storedNote || getDefaultClientNote(analysis),
        planUrl: storedPlanUrl,
        usesOfficialFinalPrice: Number.isFinite(storedPrice)
      };
    });
  }

  function getVisibleClientAnalyses() {
    const search = normalizeKey(state.clientFilters.search || '');
    return getClientAnalyses().filter((analysis) => {
      const f = analysis.fraction;
      const searchMatch = !search
        || normalizeKey(f.name).includes(search)
        || normalizeKey(f.typology).includes(search)
        || String(getFractionNumber(f)).includes(search);
      const typologies = state.clientFilters.typologies || [];
      const floors = state.clientFilters.floors || [];
      const typologyMatch = !typologies.length || typologies.includes(f.typology);
      const floorMatch = !floors.length || floors.includes(String(f.floorNumber));
      return searchMatch && typologyMatch && floorMatch;
    }).sort((a, b) => naturalNameCompare(a.fraction, b.fraction));
  }

  function renderClientProposalPage(syncControls = true) {
    if (!el.clientProposalCards) return;

    if (syncControls) syncClientProposalControls();

    const visible = getVisibleClientAnalyses();
    const selected = getClientAnalyses().filter((analysis) => analysis.clientSelected);
    const total = sum(selected.map((a) => a.clientFinalPrice));

    if (el.clientProposalCount) {
      el.clientProposalCount.textContent = `${selected.length} fração${selected.length === 1 ? '' : 'ões'} selecionada${selected.length === 1 ? '' : 's'}`;
    }

    if (el.clientProposalSummary) {
      replace(el.clientProposalSummary,
        summary('Frações selecionadas', formatNumber(selected.length), `${visible.length} visíveis`),
        summary('Valor total da proposta', formatMoney(total), 'Soma dos preços finais'),
        summary('Preço médio', selected.length ? formatMoney(total / selected.length) : '—', 'Frações selecionadas'),
        summary('Guardado no browser', 'Local', 'Pode exportar/importar JSON')
      );
    }

    el.clientProposalCards.replaceChildren();

    if (!visible.length) {
      el.clientProposalCards.append(empty('Sem frações com os filtros atuais.'));
      return;
    }

    visible.forEach((analysis) => {
      const f = analysis.fraction;
      const key = f.name;
      const isSelected = analysis.clientSelected;

      const card = div(`client-proposal-card ${isSelected ? 'selected' : ''}`);

      const checkbox = h('input', { attrs: { type: 'checkbox', checked: isSelected ? 'checked' : null } });
      checkbox.checked = isSelected;
      checkbox.addEventListener('change', () => {
        setClientSelected(key, checkbox.checked);
        saveClientProposalState();
        renderClientProposalPage();
      });

      const priceInput = h('input', {
        className: 'client-price-input',
        attrs: {
          type: 'number',
          min: '0',
          step: '5000',
          value: Math.round(analysis.clientFinalPrice || 0)
        }
      });
      priceInput.addEventListener('change', () => {
        const value = parseNumber(priceInput.value);
        setClientFinalPrice(key, Number.isFinite(value) ? value : analysis.proposedNow, analysis.clientNote);
        saveClientProposalState();
        renderClientProposalPage();
      });

      const noteInput = h('textarea', {
        className: 'client-note-input',
        text: analysis.clientNote,
        attrs: { rows: '2', placeholder: 'Observação curta para cliente' }
      });
      noteInput.addEventListener('change', () => {
        setClientFinalPrice(key, analysis.clientFinalPrice, noteInput.value);
        saveClientProposalState();
      });

      card.append(
        div('client-proposal-card-head', [
          div('client-select-title', [
            checkbox,
            div('', [
              h('strong', { text: f.name }),
              h('span', { text: `${f.typology} · Piso ${f.floorLabel} · ${getOrientation(f)}` })
            ])
          ]),
          h('span', { className: 'client-price-pill', text: formatMoney(analysis.clientFinalPrice) })
        ]),
        div('client-proposal-metrics', [
          metric('Preço sugerido', formatMoney(analysis.proposedNow)),
          metric('Preço final', formatMoney(analysis.clientFinalPrice)),
          metric('ABP', formatArea(f.abp)),
          metric('Varanda/Terraço', formatArea(f.balcony)),
          metric('Área total', formatArea(f.totalArea))
        ]),
        div('client-edit-grid', [
          labelWrap('Preço final a comunicar', priceInput),
          labelWrap('Observação cliente', noteInput)
        ])
      );

      el.clientProposalCards.append(card);
    });
  }

  function syncClientProposalControls() {
    const typologies = uniqueSorted(state.filteredFractions.map((f) => f.typology));
    const floors = uniqueSorted(state.filteredFractions.map((f) => f.floorNumber));

    const prevTypologies = new Set(state.clientFilters.typologies || []);
    const prevFloors = new Set(state.clientFilters.floors || []);

    renderChecklist(
      el.clientTypologyChecklist,
      typologies.map((typology) => ({ value: typology, label: typology })),
      { defaultAll: false }
    );

    renderChecklist(
      el.clientFloorChecklist,
      floors.map((floor) => ({ value: String(floor), label: `Piso ${floor}` })),
      { defaultAll: false }
    );

    if (prevTypologies.size && el.clientTypologyChecklist) {
      Array.from(el.clientTypologyChecklist.querySelectorAll('input[type="checkbox"]')).forEach((input) => {
        input.checked = prevTypologies.has(input.value);
      });
    }

    if (prevFloors.size && el.clientFloorChecklist) {
      Array.from(el.clientFloorChecklist.querySelectorAll('input[type="checkbox"]')).forEach((input) => {
        input.checked = prevFloors.has(input.value);
      });
    }

    state.clientFilters.typologies = getSelectedChecklistValues(el.clientTypologyChecklist);
    state.clientFilters.floors = getSelectedChecklistValues(el.clientFloorChecklist);
  }

  function labelWrap(label, child) {
    const wrapper = h('label', { className: 'client-edit-field' });
    wrapper.append(h('span', { text: label }), child);
    return wrapper;
  }

  function setClientSelected(fractionName, selected) {
    state.clientSelections[fractionName] = selected;
  }

  function setClientFinalPrice(fractionName, price, note = '') {
    state.finalPrices[fractionName] = {
      price,
      note: safeString(note)
    };
  }

  function getDefaultClientNote(analysis) {
    const f = analysis.fraction;
    return `Fração ${f.typology} no piso ${f.floorLabel}, com orientação ${getOrientation(f)} e área total de ${formatArea(f.totalArea)}.`;
  }

  function resetClientPricesForVisible() {
    getVisibleClientAnalyses().forEach((analysis) => {
      delete state.finalPrices[analysis.fraction.name];
    });
    saveClientProposalState();
    renderClientProposalPage();
  }

  function getSelectedClientProposalAnalyses() {
    return getClientAnalyses()
      .filter((analysis) => analysis.clientSelected)
      .sort((a, b) => naturalNameCompare(a.fraction, b.fraction));
  }

  function exportClientProposalFromClientTab() {
    const selected = getSelectedClientProposalAnalyses();
    if (!selected.length) {
      alert('Selecione pelo menos uma fração para gerar a proposta para cliente.');
      return;
    }

    exportClientProposalPdf(selected);
  }

  function exportClientProposalJson() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      clientSelections: state.clientSelections,
      finalPrices: state.finalPrices
    };

    downloadJson(payload, 'the-view-precos-finais-cliente.json');
  }

  function importClientProposalJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        state.clientSelections = parsed.clientSelections || {};
        state.finalPrices = parsed.finalPrices || {};
        saveClientProposalState();
        renderClientProposalPage();
      } catch (error) {
        alert('Não foi possível importar o ficheiro JSON.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }


  function renderCalculationPage() {
    if (!el.calculationCards) return;

    const analyses = buildIdealAnalyses(state.filteredFractions);
    el.calculationCards.replaceChildren();

    if (!analyses.length) {
      el.calculationCards.append(
        div('empty-state-card', [
          h('strong', { text: 'Sem dados com os filtros atuais.' }),
          h('p', { text: 'Ajuste os filtros para visualizar o cálculo detalhado das frações.' })
        ])
      );
    }

    analyses.forEach((analysis) => {
      const fraction = analysis.fraction;
      const rec = getFinalRecommendation(fraction);
      const finalPrice = rec?.price ?? analysis.coherentPrice;
      const adjustment = Number.isFinite(finalPrice) && Number.isFinite(fraction.price)
        ? finalPrice - fraction.price
        : null;

      const card = div('calculation-card');

      const header = div('calculation-card-header', [
        div('calculation-card-title', [
          h('button', {
            className: 'calculation-card-link',
            text: fraction.name,
            attrs: { type: 'button', 'aria-label': `Ver racional de ${fraction.name}` }
          }),
          h('p', { text: getFractionDescriptor(fraction) })
        ]),
        h('span', { className: `strategy-badge ${normalizeKey(rec?.strategy || 'Modelo técnico')}`, text: rec?.strategy || 'Modelo técnico' })
      ]);

      header.querySelector('button')?.addEventListener('click', () => openFinalRecommendationPopup(analysis));

      const topGrid = div('calculation-kpi-grid', [
        kpi('Preço atual', formatMoney(fraction.price), `${formatNumber(fraction.eurosPerSqm)} €/m² atual`),
        kpi('Preço mercado', formatMoney(analysis.marketPrice), `${formatNumber(analysis.marketSqm)} €/m²`),
        kpi('Interno puro', formatMoney(analysis.internalPurePrice), `${formatNumber(analysis.internalPureSqm)} €/m²`),
        kpi('Técnico misto', formatMoney(analysis.coherentPrice), '70% mercado + 30% interno puro'),
        kpi('Recomendado final', formatMoney(finalPrice), Number.isFinite(adjustment) ? `${formatSignedMoney(adjustment)} vs atual` : 'Sem ajuste')
      ]);

      const formula = div('calculation-formula-card', [
        h('strong', { text: 'Fórmula aplicada' }),
        h('p', { text: `Mercado ${formatMoney(analysis.marketPrice)} × 70% + Interno puro ${formatMoney(analysis.internalPurePrice)} × 30% = Técnico misto ${formatMoney(analysis.coherentPrice)}` }),
        h('p', { text: `Depois, o recomendado final fica em ${formatMoney(finalPrice)} com estratégia "${rec?.strategy || 'Modelo técnico'}".` })
      ]);

      const scoreBlock = div('calculation-text-card', [
        h('strong', { text: 'Leitura do score interno' }),
        h('p', { text: buildScoreExplanation(analysis) })
      ]);

      const reading = div('calculation-text-card', [
        h('strong', { text: 'Leitura resumida' }),
        h('p', { text: buildCalculationReading(analysis, rec) })
      ]);

      card.append(header, topGrid, formula, scoreBlock, reading);
      el.calculationCards.append(card);
    });

    if (el.calculationCount) {
      el.calculationCount.textContent = `${analyses.length} frações analisadas`;
    }
  }


  function buildScoreExplanation(analysis) {
    const fraction = analysis.fraction;
    const scorePct = Number.isFinite(analysis.scoreDelta) ? analysis.scoreDelta * 100 : null;
    const parts = [];

    parts.push(`O ${fraction.name} tem score interno ${formatNumber(analysis.score)}.`);

    if (Number.isFinite(analysis.medianScore)) {
      parts.push(`Na tipologia ${fraction.typology}, a mediana de score é ${formatNumber(analysis.medianScore)}.`);
    }

    if (Number.isFinite(scorePct)) {
      const relation = scorePct >= 0 ? 'acima' : 'abaixo';
      parts.push(`Isto coloca esta fração ${Math.abs(scorePct).toFixed(1).replace('.', ',')}% ${relation} da mediana da tipologia.`);
    }

    parts.push(`O interno puro considera apenas The View: tipologia, piso, vista, área e varanda.`);

    return parts.join(' ');
  }

  function buildCalculationReading(analysis, rec) {
    const fraction = analysis.fraction;
    const scorePct = Number.isFinite(analysis.scoreDelta) ? analysis.scoreDelta * 100 : null;
    const scoreText = Number.isFinite(scorePct)
      ? `${scorePct >= 0 ? '+' : ''}${scorePct.toFixed(1).replace('.', ',')}% face à mediana da tipologia`
      : 'sem diferença relevante face à mediana da tipologia';

    const base = `O ${fraction.name} tem score interno ${formatNumber(analysis.score)} (${scoreText}).`;

    if (rec?.strategy === 'Manter') {
      return `${base} Apesar dos modelos técnicos indicarem outro valor, a recomendação final mantém a tabela atual por prudência comercial.`;
    }

    if (rec?.strategy === 'Ajuste fino') {
      return `${base} O ajuste final é pequeno, pensado para corrigir coerência/arredondamento sem alterar o posicionamento.`;
    }

    if (rec?.strategy === 'Subida moderada') {
      return `${base} Há margem para reforço de preço, mas a subida é limitada para não depender demasiado do compset.`;
    }

    if (rec?.strategy === 'Subida faseada') {
      return `${base} O valor final é tratado como preço-alvo para fase seguinte ou validação por procura.`;
    }

    return `${base} Sem recomendação comercial fixa, usa-se o valor técnico como referência.`;
  }


  function renderIdealPage() {
    const analyses = buildIdealAnalyses(state.filteredFractions);

    renderIdealSummary(analyses);
    syncIdealSelectionControls(analyses);

    if (el.idealCount) {
      const selectedText = state.idealFocusedFraction ? ` · a ver ${state.idealFocusedFraction}` : '';
      el.idealCount.textContent = `${analyses.length} frações disponíveis${selectedText}`;
    }

    if (!el.idealDetails) return;

    if (!state.idealFocusedFraction) {
      replace(el.idealDetails,
        div('ideal-empty-card', [
          h('strong', { text: 'Escolha uma fração para continuar' }),
          h('p', { text: 'Assim a página mostra apenas a análise dessa unidade, de forma mais limpa e mais fácil de apresentar.' })
        ])
      );
      return;
    }

    const analysis = analyses.find((item) => item.fraction.name === state.idealFocusedFraction);
    if (!analysis) {
      state.idealFocusedFraction = '';
      if (el.idealFractionSelect) el.idealFractionSelect.value = '';
      replace(el.idealDetails,
        div('ideal-empty-card', [
          h('strong', { text: 'A fração selecionada já não está disponível com os filtros atuais.' }),
          h('p', { text: 'Escolha outra fração ou ajuste os filtros globais.' })
        ])
      );
      return;
    }

    const fraction = analysis.fraction;
    const rec = getFinalRecommendation(fraction);
    const finalPrice = rec?.price ?? analysis.coherentPrice;
    const adjustment = Number.isFinite(finalPrice) && Number.isFinite(fraction.price) ? finalPrice - fraction.price : null;

    const header = div('ideal-focus-header', [
      div('ideal-focus-title', [
        h('span', { className: 'eyebrow eyebrow--dark', text: 'Fração selecionada' }),
        h('h3', { text: fraction.name }),
        h('p', { text: getFractionDescriptor(fraction) })
      ]),
      h('span', { className: `strategy-badge ${normalizeKey(rec?.strategy || 'Modelo técnico')}`, text: rec?.strategy || 'Modelo técnico' })
    ]);

    const summaryGrid = div('ideal-focus-grid', [
      summary('Preço atual', formatMoney(fraction.price), `${formatNumber(fraction.eurosPerSqm)} €/m² atual`),
      summary('Preço mercado', formatMoney(analysis.marketPrice), `${formatNumber(analysis.marketSqm)} €/m²`),
      summary('Interno puro', formatMoney(analysis.internalPurePrice), `${formatNumber(analysis.internalPureSqm)} €/m²`),
      summary('Técnico misto', formatMoney(analysis.coherentPrice), '70% mercado + 30% interno puro'),
      summary('Recomendado final', formatMoney(finalPrice), Number.isFinite(adjustment) ? `${formatSignedMoney(adjustment)} vs atual` : 'Sem ajuste')
    ]);

    const decisionCard = div('ideal-decision-card', [
      h('strong', { text: 'Decisão recomendada' }),
      h('p', { text: buildRecommendedDecisionText(analysis, rec) })
    ]);

    const formulaCard = div('ideal-formula-card', [
      h('strong', { text: 'Fórmula técnica de apoio' }),
      h('p', { text: `Mercado ${formatMoney(analysis.marketPrice)} × 70% + Interno puro ${formatMoney(analysis.internalPurePrice)} × 30% = Técnico misto ${formatMoney(analysis.coherentPrice)}` }),
      h('p', { text: 'O preço recomendado final é a decisão comercial que resulta desta leitura, mas sem seguir automaticamente os modelos técnicos.' })
    ]);

    const actions = div('ideal-actions', [
      h('button', { className: 'primary-button', text: 'Ver racional completo', attrs: { type: 'button' } })
    ]);
    actions.querySelector('button')?.addEventListener('click', () => openFinalRecommendationPopup(analysis));

    replace(el.idealDetails, div('ideal-focused-card', [header, summaryGrid, decisionCard, formulaCard, actions]));
  }

  function renderIdealSummary(analyses) {
    if (!el.idealSummary) return;
    const finalPrices = analyses.map((item) => item.finalPrice).filter(Number.isFinite);
    const keepCount = analyses.filter((item) => (item.finalRecommendation?.strategy || '') === 'Manter').length;
    const upliftCount = analyses.filter((item) => Number.isFinite(item.finalGap) && item.finalGap > 0).length;

    replace(el.idealSummary,
      summary('Frações elegíveis', formatNumber(analyses.length), 'Após filtros globais'),
      summary('A manter', formatNumber(keepCount), 'Sem alteração face ao preço atual'),
      summary('Com reforço', formatNumber(upliftCount), 'Ajuste positivo recomendado'),
      summary('Mediana recomendada', formatMoney(median(finalPrices)), 'Preço recomendado final')
    );
  }

  function syncIdealSelectionControls(analyses) {
    const availableFractions = analyses.map((item) => item.fraction.name);

    if (el.idealFractionSelect) {
      const current = state.idealFocusedFraction && availableFractions.includes(state.idealFocusedFraction)
        ? state.idealFocusedFraction
        : '';
      state.idealFocusedFraction = current;
      el.idealFractionSelect.replaceChildren(createOption('', 'Escolha uma fração'));
      availableFractions.forEach((name) => el.idealFractionSelect.append(createOption(name, name)));
      el.idealFractionSelect.value = current;
    }

    const floorValues = uniqueSorted(state.filteredFractions.map((f) => f.floorNumber));
    renderChecklist(
      el.pdfFloorChecklist,
      floorValues.map((value) => ({ value: String(value), label: `Piso ${value}` })),
      { defaultAll: true }
    );
    renderChecklist(
      el.pdfFractionChecklist,
      availableFractions.map((name) => ({ value: name, label: name })),
      { defaultAll: false }
    );
  }

  function buildRecommendedDecisionText(analysis, rec) {
    const fraction = analysis.fraction;
    const finalPrice = rec?.price ?? analysis.coherentPrice;
    const adjustment = Number.isFinite(finalPrice) && Number.isFinite(fraction.price) ? finalPrice - fraction.price : null;
    const strategy = rec?.strategy || 'Modelo técnico';

    const parts = [];
    parts.push(`${fraction.name} tem preço atual de ${formatMoney(fraction.price)} e preço recomendado final de ${formatMoney(finalPrice)}.`);

    if (strategy === 'Manter') {
      parts.push('A recomendação é manter o preço atual, porque a tabela comercial já é defensável nesta fase.');
    } else if (strategy === 'Ajuste fino') {
      parts.push('A recomendação é um ajuste pequeno, para melhorar a coerência interna sem alterar o posicionamento comercial.');
    } else if (strategy === 'Subida moderada') {
      parts.push('A recomendação é uma subida moderada, porque existe margem para reforçar preço, mas com prudência.');
    } else if (strategy === 'Subida faseada') {
      parts.push('A recomendação é uma subida faseada, tratada como preço-alvo para uma fase comercial seguinte.');
    }

    if (Number.isFinite(adjustment) && adjustment !== 0) {
      parts.push(`Isto representa um ajuste de ${formatSignedMoney(adjustment)} face ao preço atual.`);
    } else {
      parts.push('Não existe ajuste face ao preço atual.');
    }

    parts.push(`Como apoio técnico, o mercado aponta para ${formatMoney(analysis.marketPrice)} e o modelo interno puro para ${formatMoney(analysis.internalPurePrice)}.`);
    return parts.join(' ');
  }


  function exportCommercialPdf() {
    const all = sortCommercialAnalyses(filterCommercialAnalyses(getCommercialAnalyses()));

    if (!all.length) {
      alert('Não existem frações para exportar com os filtros comerciais atuais.');
      return;
    }

    const type = el.commercialPdfType?.value || 'executive';

    if (type === 'client') {
      return exportClientProposalPdf(all);
    }

    if (type === 'technical') {
      return exportTechnicalCommercialPdf(all);
    }

    if (type === 'sales') {
      return exportSalesCommercialPdf(all);
    }

    return exportExecutiveCommercialPdf(all);
  }

  function exportExecutiveCommercialPdf(analyses) {
    const title = 'The View Olhão · Proposta Comercial de Preços';
    const totals = getCommercialTotals(analyses);
    const grouped = groupCommercialByState(analyses);
    const stateOrder = ['Aplicar agora', 'Subida faseada', 'Rever gerência', 'Manter'];
    const now = new Date();

    const tvMedian = median(analyses.map((a) => a.fraction.eurosPerSqm).filter(Number.isFinite));
    const olhaoBenchmark = getBenchmarkValue('Olhão');
    const algarveBenchmark = getBenchmarkValue('Algarve');
    const portugalBenchmark = getBenchmarkValue('Portugal');
    const marketContextHtml = `
      <div class="pdf-market-context">
        ${pdfKpi('The View €/m²', formatCurrency(tvMedian, 0) + '/m²')}
        ${pdfKpi('Olhão', formatCurrency(olhaoBenchmark?.eurosPerSqm, 0) + '/m²')}
        ${pdfKpi('Algarve', formatCurrency(algarveBenchmark?.eurosPerSqm, 0) + '/m²')}
        ${pdfKpi('Portugal', formatCurrency(portugalBenchmark?.eurosPerSqm, 0) + '/m²')}
        ${pdfKpi('The View vs Olhão', formatPercentRatio(tvMedian, olhaoBenchmark?.eurosPerSqm))}
        ${pdfKpi('The View vs Algarve', formatPercentRatio(tvMedian, algarveBenchmark?.eurosPerSqm))}
      </div>`;

    const stateRows = stateOrder.map((stateName) => {
      const items = grouped[stateName] || [];
      const total = getCommercialTotals(items);
      return `<tr>
        <td><span class="state-pill ${getPdfDecisionClass(stateName)}">${escapeHtml(stateName)}</span></td>
        <td>${items.length}</td>
        <td class="money">${escapeHtml(formatMoney(total.current))}</td>
        <td class="money">${escapeHtml(formatMoney(total.proposed))}</td>
        <td class="money">${escapeHtml(formatMoney(total.target))}</td>
        <td class="money positive">${escapeHtml(formatSignedMoney(total.immediate))}</td>
        <td class="money positive">${escapeHtml(formatSignedMoney(total.potential))}</td>
      </tr>`;
    }).join('');

    const detailSections = stateOrder.map((stateName) => {
      const items = grouped[stateName] || [];
      if (!items.length) return '';
      const rows = items.map((a) => `<tr>
        <td>${escapeHtml(a.fraction.name)}</td>
        <td>${escapeHtml(a.fraction.typology)}</td>
        <td>${escapeHtml(String(a.fraction.floorLabel))}</td>
        <td>${escapeHtml(getOrientation(a.fraction))}</td>
        <td class="money">${escapeHtml(formatMoney(a.fraction.price))}</td>
        <td class="money">${escapeHtml(formatMoney(a.proposedNow))}</td>
        <td class="money">${escapeHtml(formatMoney(a.targetPrice))}</td>
        <td class="money ${a.immediateAdjustment > 0 ? 'positive' : ''}">${escapeHtml(formatSignedMoney(a.immediateAdjustment))}</td>
        <td><span class="state-pill ${getPdfDecisionClass(a.commercialState)}">${escapeHtml(a.commercialState)}</span></td>
        <td>${escapeHtml(a.commercialNote)}</td>
      </tr>`).join('');

      return `<h2 class="state-title">${escapeHtml(stateName)}</h2>
      <table>
        <thead><tr><th>Fração</th><th>Tip.</th><th>Piso</th><th>Orientação</th><th>Atual</th><th>Proposto agora</th><th>Alvo</th><th>Ajuste imediato</th><th>Estado</th><th>Justificação comercial</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    }).join('');

    const html = `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
${pdfStyles()}
</head>
<body>
  <section class="page cover">
    <div class="cover-header">
      <div>
        <div class="brand">The View Olhão</div>
        <h1>Proposta Comercial<br/>de Preços</h1>
        <p class="cover-subtitle">Atualização de tabela · decisão comercial por fração</p>
      </div>
      <div class="date-card">
        <span>Gerado em</span>
        <strong>${escapeHtml(now.toLocaleDateString('pt-PT'))}</strong>
        <small>${escapeHtml(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }))}</small>
      </div>
    </div>

    <div class="executive-box">
      <h2>Resumo executivo</h2>
      <p>A análise técnica indica margem de reforço em várias frações. A proposta comercial recomenda aplicar imediatamente os ajustes finos e moderados, fasear as subidas mais expressivas e submeter frações premium ou sensíveis à validação da gerência.</p>
    </div>

    <div class="pdf-kpis">
      ${pdfKpi('Receita atual', formatMoney(totals.current))}
      ${pdfKpi('Receita proposta agora', formatMoney(totals.proposed))}
      ${pdfKpi('Receita-alvo', formatMoney(totals.target))}
      ${pdfKpi('Incremento imediato', formatSignedMoney(totals.immediate))}
      ${pdfKpi('Incremento potencial', formatSignedMoney(totals.potential))}
      ${pdfKpi('A manter', String((grouped['Manter'] || []).length))}
      ${pdfKpi('Aplicar agora', String((grouped['Aplicar agora'] || []).length))}
      ${pdfKpi('Subida faseada', String((grouped['Subida faseada'] || []).length))}
      ${pdfKpi('Rever gerência', String((grouped['Rever gerência'] || []).length))}
    </div>
    <h2 class="context-title">Contexto de mercado</h2>
    ${marketContextHtml}
  </section>

  <section class="page">
    <h1>Resumo por estado da decisão</h1>
    <table>
      <thead><tr><th>Estado</th><th>N.º frações</th><th>Receita atual</th><th>Receita proposta agora</th><th>Receita-alvo</th><th>Incremento imediato</th><th>Incremento potencial</th></tr></thead>
      <tbody>${stateRows}</tbody>
    </table>
  </section>

  <section class="page">
    <h1>Detalhe por estado da decisão</h1>
    ${detailSections}
  </section>
</body>
</html>`;

    openPdfWindow(html);
  }

  function exportTechnicalCommercialPdf(analyses) {
    const title = 'The View Olhão · PDF Técnico de Preços';
    const rows = analyses.map((a) => `<tr>
      <td>${escapeHtml(a.fraction.name)}</td>
      <td>${escapeHtml(a.fraction.typology)}</td>
      <td>${escapeHtml(String(a.fraction.floorLabel))}</td>
      <td>${escapeHtml(getOrientation(a.fraction))}</td>
      <td class="money">${escapeHtml(formatMoney(a.fraction.price))}</td>
      <td>${escapeHtml(formatMoney(a.modelRecommended))}</td>
      <td class="money">${escapeHtml(formatMoney(a.proposedNow))}</td>
      <td class="money">${escapeHtml(formatMoney(a.targetPrice))}</td>
      <td class="money ${a.immediateAdjustment > 0 ? 'positive' : ''}">${escapeHtml(formatSignedMoney(a.immediateAdjustment))}</td>
      <td>${escapeHtml(formatSignedMoney(a.potentialAdjustment))}</td>
      <td><span class="state-pill ${getPdfDecisionClass(a.commercialState)}">${escapeHtml(a.commercialState)}</span></td>
      <td>${escapeHtml(formatNumber(a.score))}</td>
      <td>${escapeHtml(buildCalculationReading(a, a.finalRecommendation))}</td>
    </tr>`).join('');

    openPdfWindow(`<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${pdfStyles()}</head><body>
      <section class="page"><div class="brand">The View Olhão</div><div class="brand">The View Olhão</div><h1>${escapeHtml(title)}</h1>
      <table><thead><tr><th>Fração</th><th>Tip.</th><th>Piso</th><th>Orientação</th><th>Atual</th><th>Modelo</th><th>Proposto agora</th><th>Alvo</th><th>Ajuste imediato</th><th>Ajuste potencial</th><th>Estado</th><th>Score</th><th>Leitura resumida</th></tr></thead><tbody>${rows}</tbody></table>
      </section></body></html>`);
  }


  function sortCommercialForClient(analyses) {
    return [...analyses].sort((a, b) => naturalNameCompare(a.fraction, b.fraction));
  }

  function getClientPriceSheetHtml(a) {
    const fraction = a.fraction;
    const finalPrice = a.clientFinalPrice || a.proposedNow;
    const pricePerSqm = Number.isFinite(finalPrice) && Number.isFinite(fraction.totalArea) && fraction.totalArea > 0
      ? finalPrice / fraction.totalArea
      : null;

    return `
      <section class="page client-price-page">
        <div class="client-sheet">
          <div class="client-sheet-top">
            <div>
              <div class="brand">The View Olhão</div>
              <h1>${escapeHtml(fraction.name)}</h1>
              <p class="client-subtitle">${escapeHtml(fraction.typology)} · Piso ${escapeHtml(String(fraction.floorLabel))} · ${escapeHtml(getOrientation(fraction))}</p>
            </div>
            <div class="client-price-box">
              <span>Preço de apresentação</span>
              <strong>${escapeHtml(formatMoney(finalPrice))}</strong>
            </div>
          </div>

          <div class="client-detail-grid">
            <div><span>Tipologia</span><strong>${escapeHtml(fraction.typology)}</strong></div>
            <div><span>Piso</span><strong>${escapeHtml(String(fraction.floorLabel))}</strong></div>
            <div><span>Orientação</span><strong>${escapeHtml(getOrientation(fraction))}</strong></div>
            <div><span>ABP</span><strong>${escapeHtml(formatArea(fraction.abp))}</strong></div>
            <div><span>Varanda/Terraço</span><strong>${escapeHtml(formatArea(fraction.balcony))}</strong></div>
            <div><span>Área total</span><strong>${escapeHtml(formatArea(fraction.totalArea))}</strong></div>
            <div><span>Preço/m²</span><strong>${escapeHtml(formatCurrency(pricePerSqm, 0))}/m²</strong></div>
          </div>

          ${getPlantImageForAnalysis(a) ? `<div class="client-plan-block"><strong>Planta da fração</strong><img src="${escapeHtml(getPlantImageForAnalysis(a))}" alt="Planta ${escapeHtml(fraction.name)}" /></div>` : ''}

          <div class="client-highlight">
            <strong>Resumo da unidade</strong>
            <p>${escapeHtml(a.clientNote || `Fração ${fraction.typology} no piso ${fraction.floorLabel}, com orientação ${getOrientation(fraction)} e área total de ${formatArea(fraction.totalArea)}.`)}</p>
          </div>

          <div class="client-note">
            <strong>Nota</strong>
            <p>Preço sujeito a confirmação de disponibilidade e validação comercial no momento da proposta.</p>
          </div>
        </div>
      </section>`;
  }


  function exportClientProposalPdf(analyses) {
    const ordered = sortCommercialForClient ? sortCommercialForClient(analyses) : [...analyses].sort((a, b) => naturalNameCompare(a.fraction, b.fraction));
    const title = 'The View Olhão · Proposta de Frações';
    const now = new Date();

    if (!ordered.length) {
      alert('Selecione pelo menos uma fração para gerar a proposta para cliente.');
      return;
    }

    const totalPrice = sum(ordered.map((a) => a.clientFinalPrice || a.proposedNow));

    const rows = ordered.map((a) => {
      const f = a.fraction;
      return `<tr>
        <td class="strong">${escapeHtml(f.name)}</td>
        <td>${escapeHtml(f.typology)}</td>
        <td class="num">${escapeHtml(String(f.floorLabel))}</td>
        <td>${escapeHtml(getOrientation(f))}</td>
        <td class="num">${escapeHtml(formatArea(f.abp))}</td>
        <td class="num">${escapeHtml(formatArea(f.balcony))}</td>
        <td class="num">${escapeHtml(formatArea(f.totalArea))}</td>
        <td class="money price-main">${escapeHtml(formatMoney(a.clientFinalPrice || a.proposedNow))}</td>
      </tr>`;
    }).join('');

    const cards = ordered.map((a) => {
      const f = a.fraction;
      return `<div class="client-option-card">
        <div>
          <span>${escapeHtml(f.typology)} · Piso ${escapeHtml(String(f.floorLabel))}</span>
          <strong>${escapeHtml(f.name)}</strong>
          <small>${escapeHtml(getOrientation(f))} · Área total ${escapeHtml(formatArea(f.totalArea))}</small>
        </div>
        <b>${escapeHtml(formatMoney(a.clientFinalPrice || a.proposedNow))}</b>
      </div>`;
    }).join('');

    const sheets = ordered.map((a) => {
      if (typeof getClientPriceSheetHtml === 'function') return getClientPriceSheetHtml(a);
      const f = a.fraction;
      return `<section class="page client-price-page">
        <div class="client-sheet">
          <div class="client-sheet-top">
            <div>
              <div class="brand">The View Olhão</div>
              <h1>${escapeHtml(f.name)}</h1>
              <p class="client-subtitle">${escapeHtml(f.typology)} · Piso ${escapeHtml(String(f.floorLabel))} · ${escapeHtml(getOrientation(f))}</p>
            </div>
            <div class="client-price-box">
              <span>Preço de apresentação</span>
              <strong>${escapeHtml(formatMoney(a.proposedNow))}</strong>
            </div>
          </div>
          <div class="client-detail-grid">
            <div><span>Tipologia</span><strong>${escapeHtml(f.typology)}</strong></div>
            <div><span>Piso</span><strong>${escapeHtml(String(f.floorLabel))}</strong></div>
            <div><span>Orientação</span><strong>${escapeHtml(getOrientation(f))}</strong></div>
            <div><span>ABP</span><strong>${escapeHtml(formatArea(f.abp))}</strong></div>
            <div><span>Varanda/Terraço</span><strong>${escapeHtml(formatArea(f.balcony))}</strong></div>
            <div><span>Área total</span><strong>${escapeHtml(formatArea(f.totalArea))}</strong></div>
          </div>
        </div>
      </section>`;
    }).join('');

    const html = `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
${pdfStyles()}
</head>
<body>
  <section class="page client-cover-page">
    <div class="client-cover">
      <div>
        <div class="client-cover-brand">The View Olhão</div>
        <h1>Proposta de Frações</h1>
        <p>Seleção de unidades para apresentação comercial a cliente.</p>
      </div>
      <div class="client-cover-meta">
        <div><span>Data</span><strong>${escapeHtml(now.toLocaleDateString('pt-PT'))}</strong></div>
        <div><span>Frações</span><strong>${ordered.length}</strong></div>
        <div><span>Valor total</span><strong>${escapeHtml(formatMoney(totalPrice))}</strong></div>
      </div>
    </div>
  </section>

  <section class="page client-options-page">
    <div class="brand">The View Olhão</div>
    <h1>Resumo da seleção</h1>
    <p class="lead">Os preços apresentados correspondem ao preço final a comunicar nesta fase.</p>
    <div class="client-options-grid">${cards}</div>
    <table class="client-options-table">
      <thead><tr><th>Fração</th><th>Tipologia</th><th>Piso</th><th>Orientação</th><th>ABP</th><th>Varanda/Terraço</th><th>Área total</th><th>Preço</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="client-disclaimer">Valores sujeitos a confirmação de disponibilidade, condições contratuais e validação comercial no momento da proposta.</p>
  </section>

  ${sheets}
</body>
</html>`;

    openPdfWindow(html);
  }


  function exportSalesCommercialPdf(analyses) {
    const title = 'The View Olhão · Tabela Comercial para Vendas';
    const ordered = sortCommercialForClient(analyses);

    const rows = ordered.map((a) => `<tr>
      <td class="strong">${escapeHtml(a.fraction.name)}</td>
      <td>${escapeHtml(a.fraction.typology)}</td>
      <td class="num">${escapeHtml(String(a.fraction.floorLabel))}</td>
      <td>${escapeHtml(getOrientation(a.fraction))}</td>
      <td class="money price-main">${escapeHtml(formatMoney(a.clientFinalPrice || a.proposedNow))}</td>
      <td><span class="state-pill ${getPdfDecisionClass(a.commercialState)}">${escapeHtml(a.commercialState)}</span></td>
    </tr>`).join('');

    const totals = getCommercialTotals(ordered);
    const clientPages = ordered.map(getClientPriceSheetHtml).join('');

    openPdfWindow(`<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${pdfStyles()}</head><body>
      <section class="page">
        <div class="cover-header sales-cover">
          <div>
            <div class="brand">The View Olhão</div>
            <h1>Tabela Comercial<br/>para Vendas</h1>
            <p class="cover-subtitle">Preço final a comunicar = preço proposto agora</p>
          </div>
          <div class="date-card">
            <span>Receita proposta</span>
            <strong>${escapeHtml(formatMoney(totals.proposed))}</strong>
            <small>${ordered.length} frações</small>
          </div>
        </div>

        <table class="sales-table">
          <thead><tr><th>Fração</th><th>Tipologia</th><th>Piso</th><th>Orientação</th><th>Preço final a comunicar</th><th>Estado</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>

      ${clientPages}
    </body></html>`);
  }

  function getSalesObservation(a) {
    if (a.commercialState === 'Aplicar agora') return 'Novo preço aplicável na tabela comercial.';
    if (a.commercialState === 'Subida faseada') return 'Preço atual de comunicação; acompanhar evolução para próxima fase.';
    if (a.commercialState === 'Rever gerência') return 'Não comunicar alteração sem validação da gerência.';
    return 'Manter preço atual.';
  }

  function getCommercialTotals(analyses) {
    const current = sum(analyses.map((a) => a.fraction.price));
    const proposed = sum(analyses.map((a) => a.proposedNow));
    const target = sum(analyses.map((a) => a.targetPrice));
    return { current, proposed, target, immediate: proposed - current, potential: target - current };
  }

  function groupCommercialByState(analyses) {
    return analyses.reduce((acc, item) => {
      if (!acc[item.commercialState]) acc[item.commercialState] = [];
      acc[item.commercialState].push(item);
      return acc;
    }, {});
  }

  function getCommercialFiltersText() {
    const parts = [];
    if (state.commercialFilters.state !== 'all') parts.push(`Estado: ${state.commercialFilters.state}`);
    if (state.commercialFilters.impact !== 'all') parts.push(`Impacto: ${state.commercialFilters.impact}`);
    if (state.commercialFilters.typology !== 'all') parts.push(`Tipologia: ${state.commercialFilters.typology}`);
    if (state.commercialFilters.floors.length) parts.push(`Pisos: ${state.commercialFilters.floors.join(', ')}`);
    if (state.commercialFilters.fractions.length) parts.push(`Frações: ${state.commercialFilters.fractions.join(', ')}`);
    return parts.length ? parts.join(' · ') : 'Sem filtros comerciais adicionais.';
  }

  function getPdfDecisionClass(stateText) {
    const key = normalizeKey(stateText);
    if (key.includes('aplicar')) return 'state-apply';
    if (key.includes('faseada')) return 'state-phase';
    if (key.includes('rever')) return 'state-review';
    return 'state-keep';
  }

  function pdfKpi(label, value) {
    return `<div class="pdf-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function pdfStyles() {
    return `<style>
      :root{
        --ink:#111827;
        --muted:#64748b;
        --line:#dbe3ef;
        --gold:#92713a;
        --gold-soft:#f7efe1;
        --soft:#f8fafc;
        --apply:#027a48;
        --phase:#b54708;
        --review:#b42318;
        --keep:#334155;
      }

      *{box-sizing:border-box}

      body{
        font-family:Inter,Arial,sans-serif;
        margin:0;
        color:var(--ink);
        background:#fff;
      }

      .page{
        page-break-after:always;
        padding:28px 32px;
      }

      .page:last-child{page-break-after:auto}

      .cover{
        padding:0;
      }

      .cover::before{
        content:"";
        display:block;
        height:14px;
        background:linear-gradient(90deg,#111827,#253044,#92713a,#f3d38a);
      }

      .brand{
        font-size:12px;
        letter-spacing:.24em;
        text-transform:uppercase;
        color:var(--gold);
        font-weight:900;
        margin-bottom:10px;
      }

      .cover .brand{
        color:#f3d38a;
      }

      h1{
        margin:0 0 10px;
        font-size:30px;
        line-height:1.06;
        letter-spacing:-.04em;
      }

      .cover h1{
        font-size:44px;
        color:#fff;
      }

      .cover-header{
        display:flex;
        justify-content:space-between;
        gap:30px;
        align-items:flex-start;
        padding:36px 40px 34px;
        background:linear-gradient(135deg,#111827,#253044 58%,#92713a);
        color:#fff;
      }

      .cover-subtitle{
        margin:0;
        color:rgba(255,255,255,.78);
        font-size:15px;
      }

      .date-card{
        min-width:190px;
        border:1px solid rgba(255,255,255,.24);
        border-radius:18px;
        padding:16px;
        background:rgba(255,255,255,.10);
        text-align:right;
      }

      .date-card span,
      .date-card small{
        display:block;
        color:rgba(255,255,255,.72);
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.08em;
        font-weight:800;
      }

      .date-card strong{
        display:block;
        font-size:22px;
        margin:6px 0;
      }

      .executive-box{
        margin:24px 32px 18px;
        border:1px solid var(--line);
        background:#f8fafc;
        border-radius:20px;
        padding:18px 20px;
      }

      .executive-box h2,
      .context-title{
        margin:0 0 10px;
        font-size:20px;
        letter-spacing:-.02em;
      }

      .executive-box p,
      .lead,
      .filters{
        color:#475569;
        line-height:1.45;
        margin:0 0 8px;
      }

      .filters{
        font-size:12px;
      }

      .pdf-kpis,
      .pdf-market-context{
        display:grid;
        grid-template-columns:repeat(5,1fr);
        gap:10px;
        margin:18px 32px;
      }

      .pdf-market-context{
        grid-template-columns:repeat(6,1fr);
      }

      .pdf-kpi{
        border:1px solid var(--line);
        border-radius:16px;
        padding:12px;
        background:#fff;
        box-shadow:0 8px 22px rgba(15,23,42,.04);
        min-height:74px;
      }

      .pdf-kpi span{
        display:block;
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.08em;
        color:var(--muted);
        font-weight:900;
      }

      .pdf-kpi strong{
        display:block;
        margin-top:6px;
        font-size:17px;
        letter-spacing:-.025em;
      }

      .context-title{
        margin:24px 32px 0;
      }

      table{
        width:100%;
        border-collapse:separate;
        border-spacing:0;
        font-size:10.5px;
        margin-top:14px;
        border:1px solid var(--line);
        border-radius:14px;
        overflow:hidden;
      }

      th,td{
        border-bottom:1px solid var(--line);
        padding:7px 8px;
        text-align:left;
        vertical-align:top;
      }

      tr:last-child td{
        border-bottom:0;
      }

      th{
        background:#f3f6fb;
        text-transform:uppercase;
        font-size:9px;
        letter-spacing:.055em;
        color:#475569;
      }

      td:nth-child(5),
      td:nth-child(6),
      td:nth-child(7),
      td:nth-child(8),
      td:nth-child(9),
      td:nth-child(10){
        text-align:right;
        white-space:nowrap;
      }

      td:last-child{
        line-height:1.35;
        color:#475569;
      }

      .state-title{
        margin:24px 0 8px;
        font-size:18px;
        letter-spacing:-.02em;
      }

      .state-title::before{
        content:"";
        display:inline-block;
        width:10px;
        height:10px;
        border-radius:999px;
        background:var(--gold);
        margin-right:8px;
      }

      .state-pill{
        display:inline-flex;
        border-radius:999px;
        padding:4px 8px;
        font-size:9.5px;
        font-weight:900;
        white-space:nowrap;
        border:1px solid rgba(15,23,42,.08);
      }

      .state-aplicaragora,
      .state-apply{
        background:#ecfdf3;
        color:#027a48;
      }

      .state-subidafaseada,
      .state-phase{
        background:#fffaeb;
        color:#b54708;
      }

      .state-revergerencia,
      .state-review{
        background:#fff1f0;
        color:#b42318;
      }

      .state-manter,
      .state-keep{
        background:#f8fafc;
        color:#334155;
      }

      .money{
        text-align:right;
        white-space:nowrap;
      }

      .positive{
        color:#027a48;
        font-weight:900;
      }

      .footer-note{
        margin-top:14px;
        color:#64748b;
        font-size:11px;
      }



      .client-cover-page{
        padding:0;
        background:#111827;
      }

      .client-cover{
        min-height:100vh;
        padding:58px;
        color:#fff;
        background:
          linear-gradient(135deg, rgba(17,24,39,.96), rgba(37,48,68,.90) 58%, rgba(146,113,58,.88)),
          radial-gradient(circle at top right, rgba(243,211,138,.45), transparent 34%);
        display:flex;
        flex-direction:column;
        justify-content:space-between;
      }

      .client-cover-brand{
        font-size:13px;
        letter-spacing:.28em;
        text-transform:uppercase;
        color:#f3d38a;
        font-weight:900;
      }

      .client-cover h1{
        font-size:58px;
        max-width:720px;
        margin:24px 0 12px;
        color:#fff;
      }

      .client-cover p{
        max-width:640px;
        color:rgba(255,255,255,.76);
        font-size:18px;
        line-height:1.45;
      }

      .client-cover-meta{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:14px;
        margin-top:40px;
      }

      .client-cover-meta div{
        border:1px solid rgba(255,255,255,.20);
        background:rgba(255,255,255,.10);
        border-radius:20px;
        padding:18px;
      }

      .client-cover-meta span{
        display:block;
        font-size:11px;
        letter-spacing:.12em;
        text-transform:uppercase;
        color:rgba(255,255,255,.62);
        font-weight:900;
      }

      .client-cover-meta strong{
        display:block;
        margin-top:8px;
        font-size:24px;
        color:#fff;
      }

      .client-options-page{
        background:#fff;
      }

      .client-options-grid{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:12px;
        margin:20px 0;
      }

      .client-option-card{
        border:1px solid #e5e7eb;
        border-radius:18px;
        padding:14px;
        background:#f8fafc;
        display:flex;
        justify-content:space-between;
        gap:12px;
        align-items:flex-start;
      }

      .client-option-card span,
      .client-option-card small{
        display:block;
        color:#64748b;
        font-size:11px;
        line-height:1.35;
      }

      .client-option-card strong{
        display:block;
        margin:5px 0;
        font-size:17px;
      }

      .client-option-card b{
        white-space:nowrap;
        font-size:15px;
      }

      .client-options-table th,
      .client-options-table td{
        font-size:10.5px;
      }

      .client-disclaimer{
        margin-top:14px;
        color:#64748b;
        font-size:11px;
      }

      .client-highlight{
        border:1px solid #e5e7eb;
        background:#f8fafc;
        border-radius:20px;
        padding:18px;
        margin-top:auto;
      }

      .client-highlight strong{
        display:block;
        color:#111827;
        margin-bottom:6px;
      }

      .client-highlight p{
        margin:0;
        color:#475569;
        line-height:1.45;
      }

      .client-price-page{
        background:#f6f3ec;
        padding:30px;
      }

      .client-sheet{
        min-height:calc(100vh - 60px);
        border-radius:28px;
        background:#fff;
        border:1px solid #e5dccb;
        box-shadow:0 24px 70px rgba(15,23,42,.08);
        padding:34px;
        display:flex;
        flex-direction:column;
        justify-content:space-between;
      }

      .client-sheet-top{
        display:flex;
        justify-content:space-between;
        gap:28px;
        align-items:flex-start;
        border-bottom:1px solid #e5e7eb;
        padding-bottom:24px;
      }

      .client-sheet h1{
        font-size:48px;
        margin:0 0 8px;
        color:#111827;
      }

      .client-subtitle{
        margin:0;
        color:#64748b;
        font-size:17px;
      }

      .client-price-box{
        min-width:260px;
        border-radius:24px;
        padding:24px;
        text-align:right;
        background:linear-gradient(135deg,#111827,#253044);
        color:#fff;
      }

      .client-price-box span{
        display:block;
        font-size:12px;
        letter-spacing:.16em;
        text-transform:uppercase;
        color:#f3d38a;
        font-weight:900;
      }

      .client-price-box strong{
        display:block;
        margin-top:8px;
        font-size:34px;
        letter-spacing:-.04em;
      }

      .client-detail-grid{
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:14px;
        margin:34px 0;
      }

      .client-detail-grid div{
        border:1px solid #e5e7eb;
        border-radius:18px;
        padding:16px;
        background:#f8fafc;
      }

      .client-detail-grid span{
        display:block;
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.08em;
        color:#64748b;
        font-weight:900;
      }

      .client-detail-grid strong{
        display:block;
        margin-top:8px;
        font-size:18px;
        color:#111827;
      }

      .client-note{
        border-top:1px solid #e5e7eb;
        padding-top:18px;
        color:#64748b;
        line-height:1.45;
      }

      .client-note strong{
        display:block;
        color:#111827;
        margin-bottom:6px;
      }

      .client-note p{
        margin:0;
      }


      .client-plan-block{margin-top:20px;border:1px solid #e5e7eb;border-radius:20px;padding:16px;background:#fff}
      .client-plan-block strong{display:block;margin-bottom:12px;color:#111827}
      .client-plan-block img{display:block;max-width:100%;max-height:330px;object-fit:contain;margin:0 auto}

      @page{
        size:A4 landscape;
        margin:10mm;
      }

      @media print{
        .page{break-after:page}
        tr{break-inside:avoid}
        .state-section{break-inside:auto}
      }
    </style>`;
  }

  function openPdfWindow(html) {
    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) {
      alert('Não foi possível abrir a janela de exportação. Verifique se pop-ups estão permitidos para este site.');
      return;
    }

    win.document.open();
    win.document.write(html + `<script>window.onload = () => setTimeout(() => window.print(), 300);<\/script>`);
    win.document.close();
    win.focus();
  }


  function exportRecommendedPdf() {
    const floorSelections = getSelectedChecklistValues(el.pdfFloorChecklist);
    const fractionSelections = getSelectedChecklistValues(el.pdfFractionChecklist);

    let items = state.filteredFractions.filter((fraction) => {
      const floorMatch = !floorSelections.length || floorSelections.includes(String(fraction.floorNumber));
      const fractionMatch = !fractionSelections.length || fractionSelections.includes(fraction.name);
      return floorMatch && fractionMatch;
    });

    items = sortFractions(items, 'name-asc');

    if (!items.length) {
      alert('Não existem frações para exportar com a seleção atual.');
      return;
    }

    const analyses = buildIdealAnalyses(items);
    const now = new Date();
    const title = `The View · Preço recomendado x Preço atual`;
    const filtersText = [
      floorSelections.length ? `Pisos: ${floorSelections.map((v) => `Piso ${v}`).join(', ')}` : 'Pisos: todos os disponíveis',
      fractionSelections.length ? `Frações: ${fractionSelections.join(', ')}` : 'Frações: todas as disponíveis'
    ].join(' · ');

    const rows = analyses.map((analysis) => {
      const fraction = analysis.fraction;
      const rec = getFinalRecommendation(fraction);
      const finalPrice = rec?.price ?? analysis.coherentPrice;
      const adjustment = Number.isFinite(finalPrice) && Number.isFinite(fraction.price) ? finalPrice - fraction.price : null;
      return `
        <tr>
          <td>${escapeHtml(fraction.name)}</td>
          <td>${escapeHtml(fraction.typology)}</td>
          <td>${escapeHtml(String(fraction.floorLabel))}</td>
          <td>${escapeHtml(getOrientation(fraction))}</td>
          <td>${escapeHtml(formatMoney(fraction.price))}</td>
          <td>${escapeHtml(formatMoney(finalPrice))}</td>
          <td>${escapeHtml(formatSignedMoney(adjustment))}</td>
          <td>${escapeHtml(rec?.strategy || 'Modelo técnico')}</td>
          <td>${escapeHtml(buildCalculationReading(analysis, rec))}</td>
        </tr>`;
    }).join('');

    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) {
      alert('Não foi possível abrir a janela de exportação. Verifique se pop-ups estão permitidos para este site.');
      return;
    }

    win.document.open();
    win.document.write(`<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;margin:32px;color:#111827}
  h1{margin:0 0 8px;font-size:28px} p{margin:0 0 8px;color:#475569} .meta{margin-bottom:22px}
  table{width:100%;border-collapse:collapse;font-size:11px} th,td{border:1px solid #dbe3ef;padding:8px;text-align:left;vertical-align:top} th{background:#f3f6fb;text-transform:uppercase;font-size:10px;letter-spacing:.05em} td:last-child{min-width:300px;line-height:1.35}
  .brand{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#92713a;font-weight:800;margin-bottom:10px}
  .footer{margin-top:18px;font-size:11px;color:#64748b}
  @page{size:A4 landscape;margin:14mm}
</style>
</head>
<body>
  <div class="brand">The View</div>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    <p>${escapeHtml(filtersText)}</p>
    <p>Gerado em ${escapeHtml(now.toLocaleString('pt-PT'))}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Fração</th><th>Tipologia</th><th>Piso</th><th>Orientação</th><th>Preço atual</th><th>Preço recomendado</th><th>Ajuste</th><th>Estratégia</th><th>Leitura resumida</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">Sugestão: no diálogo de impressão do browser, escolha “Guardar como PDF”.</p>
  <script>window.onload = () => setTimeout(() => window.print(), 250);<\/script>
</body>
</html>`);
    win.document.close();
    win.focus();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openFractionModal(fractionId) {
    const fraction = state.fractions.find((f) => f.id === fractionId);
    if (!fraction) return;
    state.selectedFraction = fraction;
    const sets = getCompetitorSets(fraction, state.filteredCompetitors);
    const fallback = calculateFallbackPrice(fraction, sets);
    const rigorous = calculateRigorousPrice(fraction, sets);
    const ai = calculateAIPrice(fraction, sets);
    replace(el.fractionModalContent,
      h('h2', { className: 'modal-title', text: fraction.name }),
      h('p', { className: 'modal-subtitle', text: getFractionDescriptor(fraction) }),
      div('summary-grid', [summary('Preço atual', formatCurrency(fraction.price,0), `${formatCurrency(fraction.eurosPerSqm,0)}/m²`), summary('ABP', formatArea(fraction.abp), `Varanda ${formatArea(fraction.balcony)}`), summary('Área total', formatArea(fraction.totalArea), 'Base para €/m²'), summary('Confiança', getConfidence(sets).label, getConfidence(sets).reason)]),
      div('price-grid', [priceCard('Preço Fallback', fallback), priceCard('Preço Rigoroso', rigorous), priceCard('Preço IA', ai)]),
      sampleAlert(sets),
      accordionSection('Diretos', sets.direct, fraction, 'same'),
      accordionSection('Indiretos', sets.indirect, fraction, 'same'),
      accordionSection('Pouco concorrente', sets.weak, fraction, 'same')
    );
    el.fractionModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function priceCard(title, model) {
    const card = div('price-card');
    card.append(h('span', { text: title }), h('strong', { text: model.price ? formatCurrency(model.price,0) : '—' }), h('small', { text: model.eurosPerSqm ? `${formatCurrency(model.eurosPerSqm,0)}/m² · ${model.category}` : model.category }));
    const ul = h('ul', { className: 'explanation' });
    model.explanation.forEach((text) => ul.append(h('li', { text })));
    card.append(ul);
    return card;
  }

  function sampleAlert(sets) {
    const total = sets.direct.length + sets.indirect.length + sets.weak.length;
    const cls = total < 3 ? 'badge danger' : total < 6 ? 'badge warn' : 'badge ok';
    return div('badge-row', [h('span', { className: cls, text: total < 3 ? `Amostra limitada: ${total} concorrente(s)` : `Amostra disponível: ${total} concorrente(s)` })]);
  }

  function accordionSection(title, items, fraction) {
    const wrapper = div('accordion');
    const button = h('button', { className: 'accordion-button', text: `${title} · ${items.length}` });
    const panel = div('accordion-panel');
    button.addEventListener('click', () => wrapper.classList.toggle('open'));
    if (!items.length) panel.append(empty('Sem concorrentes nesta categoria com os filtros atuais.'));
    items.forEach((item) => panel.append(competitorButton(item, fraction)));
    wrapper.append(button, panel);
    return wrapper;
  }

  function competitorButton(competitor, fraction) {
    const btn = h('button', { className: 'competitor-row' });
    const base = getBaseMarketWeight(competitor);
    btn.append(div('', [h('strong', { text: competitor.name }), h('small', { text: `${competitor.development || '—'} · ${competitor.typology} · Piso ${competitor.floorLabel} · ${competitor.view}` })]), div('', [h('strong', { text: formatCurrency(competitor.price,0) }), h('small', { text: `${formatCurrency(competitor.eurosPerSqm,0)}/m² · peso base ${formatNumber(base,2)}` })]));
    btn.addEventListener('click', () => openCompetitorModal(competitor, fraction));
    return btn;
  }

  function openCompetitorModal(competitor, fraction) {
    const cmp = compareCompetitor(competitor, fraction);
    replace(el.competitorModalContent,
      h('h2', { className: 'modal-title', text: competitor.name }),
      h('p', { className: 'modal-subtitle', text: competitor.development || 'Concorrente' }),
      div('summary-grid', [summary('Preço', formatCurrency(competitor.price,0), `${formatCurrency(competitor.eurosPerSqm,0)}/m²`), summary('ABP', formatArea(competitor.abp), `Varanda ${formatArea(competitor.balcony)}`), summary('Área total', formatArea(competitor.totalArea), 'Comparação de área'), summary('Peso base', formatNumber(getBaseMarketWeight(competitor),2), getWeightReason(competitor))]),
      div('price-grid', [summary('Dif. preço', signedCurrency(cmp.priceDiff), 'Concorrente vs fração'), summary('Dif. €/m²', signedCurrency(cmp.sqmDiff) + '/m²', 'Premium/desconto relativo'), summary('Dif. área', signedArea(cmp.areaDiff), cmp.premiumDiscount ? signed(formatNumber(Math.abs(cmp.premiumDiscount),1)+'%', cmp.premiumDiscount) : '—')]),
      competitor.url ? h('a', { className: 'source-link', text: 'Abrir fonte', attrs: { href: competitor.url, target: '_blank', rel: 'noopener noreferrer' } }) : h('span', { className: 'muted small', text: 'Sem URL de fonte.' })
    );
    el.competitorModal.classList.remove('hidden');
  }

  function closeFractionModal() { el.fractionModal.classList.add('hidden'); state.selectedFraction = null; document.body.style.overflow = ''; }
  function closeCompetitorModal() { el.competitorModal.classList.add('hidden'); }

  function getCompetitorSets(fraction, competitors) {
    const sameTypology = (c) => normalizeKey(c.typology) === normalizeKey(fraction.typology);
    const sameFloor = (c) => c.floorNumber === fraction.floorNumber;
    const sameView = (c) => normalizeKey(c.view) === normalizeKey(fraction.view);
    const direct = competitors.filter((c) => sameTypology(c) && sameFloor(c) && sameView(c));
    const directIds = new Set(direct.map((c) => c.id));
    const indirect = competitors.filter((c) => !directIds.has(c.id) && sameTypology(c) && sameFloor(c));
    const used = new Set([...direct, ...indirect].map((c) => c.id));
    const weak = competitors.filter((c) => !used.has(c.id) && sameTypology(c) && Math.abs(c.floorNumber - fraction.floorNumber) <= 1);
    return { direct, indirect, weak };
  }

  function calculateFallbackPrice(fraction, sets) {
    const category = sets.direct.length ? 'Diretos' : sets.indirect.length ? 'Indiretos' : sets.weak.length ? 'Pouco concorrente' : 'Sem dados';
    const items = sets.direct.length ? sets.direct : sets.indirect.length ? sets.indirect : sets.weak;
    const categoryKey = category === 'Diretos' ? 'direct' : category === 'Indiretos' ? 'indirect' : 'weak';
    const sqm = weightedMedian(items.map((item) => ({ value: item.eurosPerSqm, weight: getFinalWeight(item, categoryKey) })));
    const price = sqm && fraction.totalArea ? sqm * fraction.totalArea : null;
    return { price, eurosPerSqm: sqm, category, explanation: price ? [`Origem: apenas ${category}; nunca mistura categorias.`, `Concorrentes usados: ${items.length}.`, `€/m² ponderado: ${formatCurrency(sqm,0)}/m².`, 'Pesos: categoria × ano × empreendimento; Le Parc e dados antigos têm menos influência.'] : ['Sem concorrentes elegíveis para fallback.'] };
  }

  function calculateRigorousPrice(fraction, sets) {
    const labeled = [...sets.direct.map((i) => ({ item: i, category: 'direct' })), ...sets.indirect.map((i) => ({ item: i, category: 'indirect' })), ...sets.weak.map((i) => ({ item: i, category: 'weak' }))];
    const valid = labeled.filter(({ item }) => Number.isFinite(item.eurosPerSqm));
    const clean = removeExtremes(valid, ({ item }) => item.eurosPerSqm);
    const sqm = weightedMedian(clean.map(({ item, category }) => ({ value: item.eurosPerSqm, weight: getFinalWeight(item, category) })));
    const price = sqm && fraction.totalArea ? sqm * fraction.totalArea : null;
    return { price, eurosPerSqm: sqm, category: clean.length ? 'Oficial ponderado' : 'Sem dados', explanation: price ? [`Usa mediana ponderada com maior peso para diretos.`, `Remoção de extremos: ${valid.length - clean.length} removido(s).`, `Amostra final: ${clean.length} concorrente(s).`, `Penalização aplicada por ano e por Le Parc quando relevante.`] : ['Sem dados suficientes para o modelo rigoroso.'] };
  }

  function calculateAIPrice(fraction, sets) {
    const rigorous = calculateRigorousPrice(fraction, sets);
    if (!rigorous.eurosPerSqm) return { price: null, eurosPerSqm: null, category: 'Sem dados', explanation: ['Sem base suficiente para cálculo IA.'] };
    const viewAdj = getViewAdjustment(fraction.view);
    const floorAdj = getFloorAdjustment(fraction.floorNumber);
    const sampleCount = sets.direct.length + sets.indirect.length + sets.weak.length;
    const sampleAdj = sampleCount < 3 ? -0.03 : sampleCount >= 8 ? 0.015 : 0;
    const finalSqm = rigorous.eurosPerSqm * (1 + viewAdj + floorAdj + sampleAdj);
    const price = fraction.totalArea ? finalSqm * fraction.totalArea : null;
    const gap = price && fraction.price ? ((price - fraction.price) / fraction.price) * 100 : null;
    return { price, eurosPerSqm: finalSqm, category: 'IA heurística', explanation: [`Base: modelo rigoroso ponderado.`, `Ajustes: vista ${formatPercent(viewAdj)}, piso ${formatPercent(floorAdj)}, amostra ${formatPercent(sampleAdj)}.`, `Recalcula automaticamente com filtros.`, `Premium/desconto sugerido vs preço atual: ${Number.isFinite(gap) ? signed(formatNumber(Math.abs(gap),1)+'%', gap) : '—'}.`] };
  }

  function calculateIdealMarketPrice(fraction, competitors) {
    const sets = getCompetitorSets(fraction, competitors);
    return calculateAIPrice(fraction, sets);
  }

  function analyzeFractionIdeal(fraction) {
    const market = calculateIdealMarketPrice(fraction, state.filteredCompetitors);
    const score = getInternalScore(fraction);
    const sameType = state.fractions.filter((f) => normalizeKey(f.typology) === normalizeKey(fraction.typology));
    const medianCurrentSqm = median(sameType.map((f) => f.eurosPerSqm).filter(Number.isFinite)) || fraction.eurosPerSqm;
    const medianScore = median(sameType.map(getInternalScore).filter(Number.isFinite)) || score;
    const scoreDelta = medianScore ? (score - medianScore) / medianScore : 0;
    const internalSqm = medianCurrentSqm * (1 + clamp(scoreDelta * 0.40, -0.16, 0.18));
    const marketSqm = market.eurosPerSqm || fraction.eurosPerSqm;
    const coherentSqm = weightedAverage([{ value: marketSqm, weight: 0.70 }, { value: internalSqm, weight: 0.30 }]);
    const coherentPrice = coherentSqm && fraction.totalArea ? coherentSqm * fraction.totalArea : market.price;
    const gapPct = coherentPrice && fraction.price ? ((fraction.price - coherentPrice) / coherentPrice) * 100 : null;
    const issues = getInternalIssues(fraction);
    let alert = 'Coerente'; let alertLevel = 'ok';
    if (issues.length >= 2 || (Number.isFinite(gapPct) && Math.abs(gapPct) > 7)) { alert = issues[0] || (gapPct > 0 ? 'Possível sobrepreço' : 'Possível subpreço'); alertLevel = 'danger'; }
    else if (issues.length || (Number.isFinite(gapPct) && Math.abs(gapPct) > 3)) { alert = issues[0] || 'Ajuste ligeiro'; alertLevel = 'warn'; }
    const finalRecommendation = getFinalRecommendation(fraction);
    const finalPrice = finalRecommendation?.price ?? coherentPrice;
    const finalGap = finalPrice && fraction.price ? finalPrice - fraction.price : null;
    const finalGapPct = finalPrice && fraction.price ? (finalGap / fraction.price) * 100 : null;
    return {
      fraction,
      marketPrice: market.price,
      marketSqm,
      internalPureSqm: internalSqm,
      internalPurePrice: internalSqm && fraction.totalArea ? internalSqm * fraction.totalArea : null,
      medianCurrentSqm,
      medianScore,
      scoreDelta,
      coherentPrice,
      coherentSqm,
      score,
      gapPct,
      alert,
      alertLevel,
      hierarchyAdjusted: false,
      finalRecommendation,
      finalPrice,
      finalGap,
      finalGapPct
    };
  }


  function buildIdealAnalyses(fractions) {
    const analyses = sortFractions(fractions, 'name-asc').map((fraction) => analyzeFractionIdeal(fraction));
    enforcePriceHierarchy(analyses);
    analyses.forEach((analysis) => {
      analysis.gapPct = analysis.coherentPrice && analysis.fraction.price
        ? ((analysis.fraction.price - analysis.coherentPrice) / analysis.coherentPrice) * 100
        : null;
      analysis.finalRecommendation = getFinalRecommendation(analysis.fraction);
      analysis.finalPrice = analysis.finalRecommendation?.price ?? analysis.coherentPrice;
      analysis.finalGap = analysis.finalPrice && analysis.fraction.price ? analysis.finalPrice - analysis.fraction.price : null;
      analysis.finalGapPct = analysis.finalPrice && analysis.fraction.price ? (analysis.finalGap / analysis.fraction.price) * 100 : null;
      const issues = getInternalIssues(analysis.fraction);
      if (analysis.hierarchyAdjusted) issues.unshift('Ajustado por hierarquia interna');
      analysis.alert = 'Coerente';
      analysis.alertLevel = 'ok';
      if (issues.length >= 2 || (Number.isFinite(analysis.gapPct) && Math.abs(analysis.gapPct) > 7)) {
        analysis.alert = issues[0] || (analysis.gapPct > 0 ? 'Possível sobrepreço' : 'Possível subpreço');
        analysis.alertLevel = 'danger';
      } else if (issues.length || (Number.isFinite(analysis.gapPct) && Math.abs(analysis.gapPct) > 3)) {
        analysis.alert = issues[0] || 'Ajuste ligeiro';
        analysis.alertLevel = 'warn';
      }
    });
    return analyses;
  }

  function enforcePriceHierarchy(analyses) {
    const valid = analyses.filter((a) => Number.isFinite(a.coherentPrice) && a.coherentPrice > 0);
    if (valid.length < 2) return;

    for (let pass = 0; pass < valid.length; pass += 1) {
      let changed = false;
      valid.forEach((superior) => {
        valid.forEach((inferior) => {
          if (superior === inferior) return;
          if (!isCommerciallySuperior(superior.fraction, inferior.fraction)) return;

          const minimumPremium = getHierarchyPremium(superior.fraction, inferior.fraction);
          const minimumPrice = inferior.coherentPrice * (1 + minimumPremium);

          if (superior.coherentPrice < minimumPrice) {
            superior.coherentPrice = minimumPrice;
            superior.coherentSqm = superior.fraction.totalArea ? superior.coherentPrice / superior.fraction.totalArea : superior.coherentSqm;
            superior.hierarchyAdjusted = true;
            changed = true;
          }
        });
      });
      if (!changed) break;
    }
  }

  function isCommerciallySuperior(a, b) {
    const aType = getTypologyRank(a.typology);
    const bType = getTypologyRank(b.typology);
    const aFloor = Number(a.floorNumber);
    const bFloor = Number(b.floorNumber);
    const aView = getViewScore(a.view);
    const bView = getViewScore(b.view);
    const aArea = Number(a.totalArea) || 0;
    const bArea = Number(b.totalArea) || 0;

    const clearlyHigherTypology = aType >= bType + 0.75;
    const sameOrHigherFloor = Number.isFinite(aFloor) && Number.isFinite(bFloor) ? aFloor >= bFloor : true;
    const sameOrBetterView = aView >= bView;
    const similarOrLargerArea = aArea >= bArea * 0.92;

    return clearlyHigherTypology && sameOrHigherFloor && sameOrBetterView && similarOrLargerArea;
  }

  function getHierarchyPremium(a, b) {
    const typeGap = Math.max(0, getTypologyRank(a.typology) - getTypologyRank(b.typology));
    const floorGap = Math.max(0, (Number(a.floorNumber) || 0) - (Number(b.floorNumber) || 0));
    const viewGap = Math.max(0, getViewScore(a.view) - getViewScore(b.view));
    return clamp(0.012 + typeGap * 0.008 + floorGap * 0.003 + viewGap * 0.0008, 0.015, 0.055);
  }

  function getInternalIssues(fraction) {
    const issues = [];
    const tolerance = 0.02;
    const fScore = getInternalScore(fraction);
    state.fractions.forEach((other) => {
      if (other.id === fraction.id) return;
      const oScore = getInternalScore(other);
      const sameType = normalizeKey(other.typology) === normalizeKey(fraction.typology);
      const comparableHierarchy = sameType || isCommerciallySuperior(fraction, other) || isCommerciallySuperior(other, fraction);
      if (!comparableHierarchy) return;
      if (fScore > oScore + 8 && fraction.eurosPerSqm < other.eurosPerSqm * (1 - tolerance)) issues.push('Superior mas €/m² inferior');
      if (fScore < oScore - 8 && fraction.eurosPerSqm > other.eurosPerSqm * (1 + tolerance)) issues.push('Inferior mas €/m² superior');
    });
    return [...new Set(issues)].slice(0, 2);
  }

  function getInternalScore(fraction) {
    const typologyScore = getTypologyScore(fraction.typology);
    const floorScore = (Number(fraction.floorNumber) || 0) * 8;
    const viewScore = getViewScore(fraction.view);
    const areaScore = (Number(fraction.totalArea) || 0) * 0.6;
    const balconyScore = (Number(fraction.balcony) || 0) * 0.8;
    return typologyScore + floorScore + viewScore + areaScore + balconyScore;
  }


  function getTypologyRank(t) {
    const raw = safeString(t).toLowerCase();
    const simple = normalizeKey(t);
    const match = raw.match(/t\s*(\d+)/i);
    const base = match ? Number(match[1]) : 1;
    let rank = base;
    if (/\+\s*1/.test(raw) || simple.includes('mais1')) rank += 0.45;
    if (simple.includes('duplex')) rank += 0.25;
    return rank;
  }

  function getTypologyScore(t) {
    const raw = safeString(t).toLowerCase();
    const simple = normalizeKey(t);
    const match = raw.match(/t\s*(\d+)/i);
    const n = match ? Number(match[1]) : 1;
    let score = n * 100;
    if (simple.includes('duplex')) score += 30;
    if (/\+\s*1/.test(raw) || simple.includes('mais1')) score += 25;
    return score;
  }

  function getViewScore(view) {
    const numericView = parseNumber(view);

    if (Number.isFinite(numericView)) {
      // No The View, a escala correta é inversa:
      // Vista 1 = melhor | Vista 4 = pior.
      // Quanto melhor a vista, maior o score.
      return clamp((5 - numericView) * 12, 6, 60);
    }

    const s = normalizeKey(view);
    if (/ria|mar|frente|waterfront|sea/.test(s)) return 42;
    if (/lateral|parcial/.test(s)) return 24;
    if (/jardim|piscina/.test(s)) return 15;
    if (/cidade|urbana|rua/.test(s)) return 6;
    return 10;
  }

  function getViewAdjustment(view) { return getViewScore(view) >= 40 ? 0.035 : getViewScore(view) >= 24 ? 0.015 : getViewScore(view) <= 6 ? -0.015 : 0; }
  function getFloorAdjustment(floor) { const n = Number(floor) || 0; return clamp(n * 0.006, -0.01, 0.035); }

  function getFinalWeight(item, category) { return getCategoryWeight(category) * getYearWeight(item) * getDevelopmentWeight(item); }
  function getCategoryWeight(category) { return category === 'direct' ? 1 : category === 'indirect' ? 0.75 : 0.50; }
  function getBaseMarketWeight(item) { return getYearWeight(item) * getDevelopmentWeight(item); }
  function getYearWeight(item) { const year = getYear(item); if (!year) return 0.70; if (year >= 2026) return 1.00; if (year === 2025) return 0.85; if (year === 2024) return 0.60; return 0.40; }
  function getDevelopmentWeight(item) { return isLeParc(item) ? 0.60 : 1.00; }
  function isLeParc(item) { return normalizeKey(item.development).includes('leparc'); }
  function getYear(item) { return Number(item.referenceYear) || extractYear(item.updatedAt) || null; }
  function getWeightReason(item) {
    const parts = [];
    const year = getYear(item);
    parts.push(year ? `ano ${year}: ${formatNumber(getYearWeight(item),2)}` : 'sem ano: 0,70');
    if (isLeParc(item)) parts.push('Le Parc: 0,60');
    else parts.push('empreendimento: 1,00');
    return parts.join(' · ');
  }

  function getConfidence(sets) {
    const total = sets.direct.length + sets.indirect.length + sets.weak.length;
    if (sets.direct.length >= 3) return { label: 'Alta', reason: 'há 3 ou mais concorrentes diretos.' };
    if (sets.direct.length >= 1 || sets.indirect.length >= 3) return { label: 'Média', reason: 'há diretos limitados ou indiretos suficientes.' };
    if (total >= 1) return { label: 'Baixa', reason: 'amostra limitada.' };
    return { label: 'Sem dados', reason: 'sem concorrentes elegíveis.' };
  }

  function compareCompetitor(competitor, fraction) {
    const priceDiff = competitor.price - fraction.price;
    const sqmDiff = competitor.eurosPerSqm - fraction.eurosPerSqm;
    const areaDiff = competitor.totalArea - fraction.totalArea;
    const premiumDiscount = fraction.eurosPerSqm ? (sqmDiff / fraction.eurosPerSqm) * 100 : null;
    return { priceDiff, sqmDiff, areaDiff, premiumDiscount };
  }

  function removeExtremes(items, valueGetter) {
    if (items.length < 5) return [...items];
    const values = items.map(valueGetter).filter(Number.isFinite).sort((a,b)=>a-b);
    const q1 = percentile(values, 0.25); const q3 = percentile(values, 0.75); const iqr = q3 - q1;
    const min = q1 - 1.5 * iqr; const max = q3 + 1.5 * iqr;
    return items.filter((item) => valueGetter(item) >= min && valueGetter(item) <= max);
  }

  function renderTable(table, headers, rows) {
    table.replaceChildren();

    const thead = h('thead');
    const trh = h('tr');
    headers.forEach((x) => trh.append(h('th', { text: x })));
    thead.append(trh);

    const tbody = h('tbody');

    if (!rows.length) {
      const tr = h('tr');
      const td = h('td', { text: 'Sem dados com os filtros atuais.', attrs: { colspan: headers.length } });
      tr.append(td);
      tbody.append(tr);
    }

    rows.forEach((row) => {
      const tr = h('tr');

      row.forEach((cell) => {
        const td = h('td');

        if (cell && typeof cell === 'object' && cell.type === 'decision-state') {
          td.append(h('span', { className: `decision-badge ${getDecisionClass(cell.label)}`, text: cell.label }));
          tr.append(td);
          return;
        }

        if (cell && typeof cell === 'object' && cell.type === 'final-details') {
          const button = h('button', {
            className: 'table-link-button',
            text: cell.label,
            attrs: {
              type: 'button',
              'aria-label': `Ver racional do preço recomendado para ${cell.label}`
            }
          });
          button.addEventListener('click', () => openFinalRecommendationPopup(cell.analysis));
          td.append(button);
          tr.append(td);
          return;
        }

        const text = safeString(cell);

        if (typeof cell === 'string' && (cell.startsWith('+') || cell.startsWith('-'))) {
          td.className = cell.startsWith('+') ? 'positive final-adjust-positive' : 'negative';
        }

        if (['Manter','Ajuste fino','Subida moderada','Subida faseada','Modelo técnico'].includes(text)) {
          const span = h('span', { className: 'strategy-badge ' + normalizeKey(text), text });
          td.append(span);
        } else {
          td.textContent = text;
        }

        tr.append(td);
      });

      tbody.append(tr);
    });

    table.append(thead, tbody);
  }



  function closeFinalRecommendationPopup() {
    const existing = document.getElementById('finalRecommendationPopup');
    if (existing) existing.remove();

    const anyModalStillOpen = document.querySelector('.modal-overlay.active, .final-popup-overlay');
    if (!anyModalStillOpen) {
      document.body.classList.remove('modal-open');
    }
  }


  function openFinalRecommendationPopup(analysis) {
    closeFinalRecommendationPopup();

    const fraction = analysis.fraction;
    const rec = getFinalRecommendation(fraction);
    const finalPrice = rec?.price ?? analysis.coherentPrice;
    const adjustment = Number.isFinite(finalPrice) && Number.isFinite(fraction.price)
      ? finalPrice - fraction.price
      : null;
    const adjustmentPct = Number.isFinite(adjustment) && Number.isFinite(fraction.price) && fraction.price > 0
      ? (adjustment / fraction.price) * 100
      : null;

    const marketDelta = Number.isFinite(analysis.marketPrice) && Number.isFinite(fraction.price)
      ? analysis.marketPrice - fraction.price
      : null;
    const internalDelta = Number.isFinite(analysis.coherentPrice) && Number.isFinite(fraction.price)
      ? analysis.coherentPrice - fraction.price
      : null;

    const overlay = h('div', { className: 'final-popup-overlay', attrs: { id: 'finalRecommendationPopup' } });
    const modal = h('section', { className: 'modal-card final-popup-card', attrs: { role: 'dialog', 'aria-modal': 'true' } });

    const close = h('button', { className: 'modal-close', text: '×', attrs: { type: 'button', 'aria-label': 'Fechar' } });
    close.addEventListener('click', closeFinalRecommendationPopup);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeFinalRecommendationPopup();
    });

    const title = div('modal-title-block', [
      h('span', { className: 'eyebrow', text: 'Preço recomendado final' }),
      h('h2', { text: fraction.name }),
      h('p', { text: getFractionDescriptor(fraction) })
    ]);

    const summaryGrid = div('final-popup-grid', [
      kpi('Preço atual', formatMoney(fraction.price), `${formatNumber(fraction.eurosPerSqm)} €/m² atual`),
      kpi('Preço mercado', formatMoney(analysis.marketPrice), Number.isFinite(marketDelta) ? `${formatSignedMoney(marketDelta)} vs atual` : 'Sem base suficiente'),
      kpi('Interno puro', formatMoney(analysis.internalPurePrice), 'Só coerência The View'),
      kpi('Técnico misto', formatMoney(analysis.coherentPrice), Number.isFinite(internalDelta) ? `${formatSignedMoney(internalDelta)} vs atual` : '70% mercado + 30% interno'),
      kpi('Recomendado final', formatMoney(finalPrice), Number.isFinite(adjustmentPct) ? `${formatSignedMoney(adjustment)} · ${formatPercent(adjustmentPct)}` : 'Recomendação comercial')
    ]);

    const strategy = rec?.strategy || 'Modelo técnico';
    const rationaleItems = getFinalRationaleItems(analysis, rec, adjustment, adjustmentPct);

    const rationaleList = h('ul', { className: 'rationale-list' });
    rationaleItems.forEach((item) => rationaleList.append(h('li', { text: item })));

    const rationale = div('final-rationale-card', [
      div('rationale-header', [
        h('span', { className: `strategy-badge ${normalizeKey(strategy)}`, text: strategy }),
        h('strong', { text: 'Porque este preço?' })
      ]),
      rationaleList
    ]);

    const technical = div('final-technical-note', [
      h('strong', { text: 'Leitura técnica' }),
      h('p', { text: buildTechnicalExplanation(analysis, rec) })
    ]);

    modal.append(close, title, summaryGrid, rationale, technical);
    overlay.append(modal);
    document.body.append(overlay);
    document.body.classList.add('modal-open');

    const escHandler = (event) => {
      if (event.key === 'Escape') {
        closeFinalRecommendationPopup();
        document.removeEventListener('keydown', escHandler);
      }
    };

    overlay.dataset.escHandlerAttached = 'true';
    document.addEventListener('keydown', escHandler, { once: false });
  }

  function getFinalRationaleItems(analysis, rec, adjustment, adjustmentPct) {
    const items = [];

    if (rec?.note) items.push(rec.note);

    if (!rec) {
      items.push('Sem recomendação comercial fixa; usa-se o modelo técnico como referência.');
    } else if (rec.strategy === 'Manter') {
      items.push('Mantém a tabela atual recomendada, evitando alterar preços já comercialmente defensáveis.');
    } else if (rec.strategy === 'Ajuste fino') {
      items.push('Ajuste pequeno para melhorar arredondamento e coerência interna, sem alterar o posicionamento comercial.');
    } else if (rec.strategy === 'Subida moderada') {
      items.push('Subida controlada onde há margem de preço, mas sem seguir cegamente o compset externo.');
    } else if (rec.strategy === 'Subida faseada') {
      items.push('Preço-alvo indicado para próxima fase comercial ou após validação por procura/vendas.');
    }

    if (Number.isFinite(adjustment) && Math.abs(adjustment) > 0) {
      items.push(`Ajuste face ao preço atual: ${formatSignedMoney(adjustment)}${Number.isFinite(adjustmentPct) ? ` (${formatPercent(adjustmentPct)})` : ''}.`);
    } else {
      items.push('Sem alteração face ao preço atual.');
    }

    if (Number.isFinite(analysis.marketPrice)) {
      items.push(`O mercado ponderado aponta para ${formatMoney(analysis.marketPrice)}, mas serve como referência, não como decisão automática.`);
    } else {
      items.push('A base de mercado é insuficiente para esta fração/tipologia; por isso, a recomendação privilegia prudência comercial.');
    }

    if (Number.isFinite(analysis.coherentPrice)) {
      items.push(`A âncora interna The View aponta para ${formatMoney(analysis.coherentPrice)}, ajudando a manter coerência entre piso, vista, tipologia e área.`);
    }

    if (analysis.hierarchyAdjusted) {
      items.push('O modelo técnico aplicou ajuste de hierarquia interna para evitar incoerências entre frações superiores e inferiores.');
    }

    return items;
  }

  function buildTechnicalExplanation(analysis, rec) {
    const strategy = rec?.strategy || 'modelo técnico';
    const fraction = analysis.fraction;

    return `Para ${fraction.name}, a recomendação final segue a estratégia "${strategy}". O preço de mercado foi calculado com concorrentes ponderados por categoria, ano e empreendimento; o preço interno técnico verifica a coerência entre frações The View. A recomendação final usa a tabela atual como base e aplica apenas ajustes comerciais prudentes.`;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(value);
  }


  function setActiveTab(tab) {
    state.activeTab = tab;
    el.tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    el.tabPanels.forEach((p) => p.classList.toggle('active', p.id === `tab-${tab}`));
  }


  function naturalFractionNumber(value) {
    const text = safeString(value);
    const matches = [...text.matchAll(/\d+/g)];
    if (!matches.length) return Number.MAX_SAFE_INTEGER;
    return Number(matches[matches.length - 1][0]);
  }

  function naturalNameCompare(a, b) {
    const na = naturalFractionNumber(a.name);
    const nb = naturalFractionNumber(b.name);
    if (na !== nb) return na - nb;
    return safeString(a.name).localeCompare(safeString(b.name), 'pt', { numeric: true, sensitivity: 'base' });
  }

  function sortFractions(items, sort) {
    const arr = [...items];
    const cmp = {
      'name-asc': naturalNameCompare,
      'price-asc': (a,b) => a.price - b.price || naturalNameCompare(a,b),
      'price-desc': (a,b) => b.price - a.price || naturalNameCompare(a,b),
      'sqm-asc': (a,b) => a.eurosPerSqm - b.eurosPerSqm || naturalNameCompare(a,b),
      'sqm-desc': (a,b) => b.eurosPerSqm - a.eurosPerSqm || naturalNameCompare(a,b),
      'area-asc': (a,b) => a.totalArea - b.totalArea || naturalNameCompare(a,b),
      'area-desc': (a,b) => b.totalArea - a.totalArea || naturalNameCompare(a,b),
      'floor-asc': (a,b) => a.floorNumber - b.floorNumber || naturalNameCompare(a,b),
      'floor-desc': (a,b) => b.floorNumber - a.floorNumber || naturalNameCompare(a,b)
    }[sort] || naturalNameCompare;
    return arr.sort(cmp);
  }
  function sortCompetitors(items) { return items.sort((a,b) => getBaseMarketWeight(b) - getBaseMarketWeight(a) || (b.eurosPerSqm || 0) - (a.eurosPerSqm || 0)); }

  function createHeaderGetter(row) { const map = new Map(); Object.keys(row).forEach((key) => map.set(normalizeKey(key), row[key])); return (candidate) => map.get(normalizeKey(candidate)); }
  function getFirst(getter, candidates) { for (const c of candidates) { const v = getter(c); if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; }
  function parseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    let text = String(value ?? '').trim().replace(/\s/g,'').replace(/€/g,'').replace(/m²|m2/gi,'').replace(/[^0-9,.-]/g,'');
    if (!text || text === '-' || text === '.' || text === ',') return null;
    const lastComma = text.lastIndexOf(','); const lastDot = text.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) { const dec = lastComma > lastDot ? ',' : '.'; const thou = dec === ',' ? '.' : ','; text = text.split(thou).join('').replace(dec,'.'); }
    else if (lastComma >= 0) { const decimals = text.length - lastComma - 1; text = decimals === 3 ? text.replace(/,/g,'') : text.replace(',', '.'); }
    else if (lastDot >= 0) { const decimals = text.length - lastDot - 1; text = decimals === 3 ? text.replace(/\./g,'') : text; }
    const n = Number(text); return Number.isFinite(n) ? n : null;
  }
  function parseFloor(value) {
    const raw = safeString(value).trim();
    const key = normalizeKey(raw);
    if (!raw) return NaN;
    if (['rc','rcc','rezdochao','resdochao','terreo','groundfloor','ground'].includes(key)) return 0;
    if (key.includes('rc')) return 0;
    const n = parseNumber(raw);
    if (Number.isFinite(n)) return Math.round(n);
    const match = raw.match(/-?\d+/);
    return match ? Number(match[0]) : NaN;
  }
  function normalizeTypology(value) { return safeString(value).toUpperCase().replace(/\s+/g,'').replace('T0+1','T0+1'); }
  function normalizeText(value) { return safeString(value).replace(/\s+/g, ' ').trim(); }
  function normalizeKey(value) { return safeString(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,''); }
  function safeString(value) { return String(value ?? '').trim(); }
  function positiveOrNull(value) { return Number.isFinite(value) && value > 0 ? value : null; }
  function sumAreas(a,b) { const x = Number.isFinite(a) ? a : 0; const y = Number.isFinite(b) ? b : 0; return x + y || null; }
  function safeDivide(a,b) { return Number.isFinite(a) && Number.isFinite(b) && b > 0 ? a / b : null; }
  function slugify(v) { return normalizeKey(v).slice(0,50) || Math.random().toString(36).slice(2); }
  function groupBy(items, getter) { const map = new Map(); items.forEach((item) => { const key = getter(item); if (!map.has(key)) map.set(key, []); map.get(key).push(item); }); return map; }
  function uniqueSorted(values) { return [...new Set(values.filter((v) => v !== null && v !== undefined && String(v).trim() !== ''))].sort((a,b) => String(a).localeCompare(String(b), 'pt', { numeric: true })); }
  function extractYear(text) { const match = String(text || '').match(/20\d{2}/); return match ? Number(match[0]) : null; }
  function clamp(v,min,max) { return Math.min(max, Math.max(min, v)); }
  function median(values) { const valid = values.filter(Number.isFinite).sort((a,b)=>a-b); if (!valid.length) return null; const mid = Math.floor(valid.length/2); return valid.length % 2 ? valid[mid] : (valid[mid-1]+valid[mid])/2; }
  function average(values) { const valid = values.filter(Number.isFinite); return valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : null; }
  function percentile(values,p) { if (!values.length) return null; const idx = (values.length-1)*p; const lo = Math.floor(idx); const hi = Math.ceil(idx); if (lo===hi) return values[lo]; return values[lo] + (values[hi]-values[lo])*(idx-lo); }
  function weightedMedian(items) { const valid = items.filter((i) => Number.isFinite(i.value) && Number.isFinite(i.weight) && i.weight > 0).sort((a,b)=>a.value-b.value); if (!valid.length) return null; const total = valid.reduce((s,i)=>s+i.weight,0); let acc=0; for (const item of valid) { acc += item.weight; if (acc >= total/2) return item.value; } return valid[valid.length-1].value; }
  function weightedAverage(items) { const valid = items.filter((i) => Number.isFinite(i.value) && Number.isFinite(i.weight) && i.weight > 0); const denom = valid.reduce((s,i)=>s+i.weight,0); return denom ? valid.reduce((s,i)=>s+i.value*i.weight,0)/denom : null; }

  function h(tag, opts = {}) { const node = document.createElement(tag); if (opts.className) node.className = opts.className; if (opts.text !== undefined) node.textContent = safeString(opts.text); if (opts.attrs) Object.entries(opts.attrs).forEach(([k,v]) => node.setAttribute(k, v)); return node; }
  function div(className, children = []) {
    const node = h('div', { className });
    const list = Array.isArray(children) ? children : [children];
    list
      .filter((child) => child !== null && child !== undefined && child !== false)
      .forEach((child) => {
        if (child instanceof Node) node.append(child);
        else node.append(document.createTextNode(safeString(child)));
      });
    return node;
  }
  function replace(parent, ...children) { parent.replaceChildren(...children); }
  function metric(label, value) { return div('metric', [h('strong', { text: label }), h('span', { text: value ?? '—' })]); }
  function kpi(label, value, helper) { return div('kpi-card', [h('span', { text: label }), h('strong', { text: value ?? '—' }), h('small', { text: helper ?? '' })]); }
  function summary(label, value, helper) { return div('summary-card', [h('span', { text: label }), h('strong', { text: value ?? '—' }), h('small', { text: helper ?? '' })]); }
  function badge(text, type='') { return h('span', { className: `badge ${type}`.trim(), text }); }
  function empty(text) { return h('div', { className: 'empty-state', text }); }
  function formatCurrency(value, decimals=0) { return Number.isFinite(value) ? new Intl.NumberFormat('pt-PT', { style:'currency', currency:'EUR', maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value) : '—'; }
  function formatNumber(value, decimals=0) { return Number.isFinite(value) ? new Intl.NumberFormat('pt-PT', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value) : '—'; }
  function formatArea(value) { return Number.isFinite(value) ? `${formatNumber(value, 1)} m²` : '—'; }
  function signed(text, value) { if (!Number.isFinite(value)) return '—'; return `${value >= 0 ? '+' : '-'}${text}`; }
  function signedCurrency(value) { if (!Number.isFinite(value)) return '—'; return `${value >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value),0)}`; }
  function signedArea(value) { if (!Number.isFinite(value)) return '—'; return `${value >= 0 ? '+' : '-'}${formatArea(Math.abs(value))}`; }
  function formatPercent(value) { return Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${formatNumber(value*100,1)}%` : '—'; }
  function setStatus(text, className='') { el.dataStatus.textContent = text; el.dataStatus.className = `status-pill ${className}`.trim(); }
  function showError(message) { el.errorBox.textContent = message; el.errorBox.classList.remove('hidden'); }
  function hideError() { el.errorBox.textContent = ''; el.errorBox.classList.add('hidden'); }
  function renderEmptyState() { replace(el.kpiGrid, kpi('Frações','—',''), kpi('Concorrentes','—',''), kpi('Mediana ponderada','—','')); replace(el.cardsGrid, empty('Dashboard sem dados.')); if (el.marketTable) renderTable(el.marketTable, ['Mensagem'], [['Sem dados.']]); if (el.idealSummary) replace(el.idealSummary, summary('Frações elegíveis','—',''), summary('A manter','—',''), summary('Com reforço','—',''), summary('Mediana recomendada','—','')); if (el.idealDetails) replace(el.idealDetails, div('ideal-empty-card', [h('strong', { text: 'Sem dados.' }), h('p', { text: 'Não foi possível carregar a análise de preço recomendado.' })])); if (el.calculationCards) replace(el.calculationCards, div('empty-state-card', [h('strong', { text: 'Sem dados.' }), h('p', { text: 'Não foi possível carregar o cálculo detalhado.' })])); }
})();
