'use strict';

(() => {
  const DATA_FILES = ['data.xlsx', 'data.xls'];
  const PROJECT_NAME = 'The View';

  const state = {
    rows: [],
    fractions: [],
    competitors: [],
    filteredFractions: [],
    filteredCompetitors: [],
    selectedFraction: null,
    activeTab: 'dashboard',
    filters: { floor: 'all', view: 'all', typology: 'all', fraction: 'all', development: 'all' },
    sort: 'name-asc'
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


  const el = {};
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    bindEvents();
    await loadExcelData();
  }

  function cacheElements() {
    [
      'dataStatus','errorBox','kpiGrid','executiveSummary','cardsGrid','resultCount',
      'marketSummary','marketTable','marketCount','idealSummary','idealTable','idealCount',
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

  function updateFilter(key, value) { state.filters[key] = value; applyFilters(); }
  function updateSort(value) { state.sort = value || 'name-asc'; applyFilters(); }
  function resetFilters() {
    state.filters = { floor: 'all', view: 'all', typology: 'all', fraction: 'all', development: 'all' };
    state.sort = 'name-asc';
    el.floorFilter.value = 'all'; el.viewFilter.value = 'all'; el.typologyFilter.value = 'all'; el.fractionFilter.value = 'all'; el.developmentFilter.value = 'all'; el.sortFilter.value = 'name-asc';
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
    renderKpis(); renderExecutiveSummary(); renderCards(); renderMarketPage(); renderIdealPage();
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
          metric('Piso', fraction.floorLabel), metric('Vista', fraction.view), metric('ABP', formatArea(fraction.abp)), metric('Varanda', formatArea(fraction.balcony)), metric('Área Total', formatArea(fraction.totalArea)), metric('€/m²', formatCurrency(fraction.eurosPerSqm, 0))
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

  function renderIdealPage() {
    const analyses = buildIdealAnalyses(state.filteredFractions);

    const headers = [
      'Fração',
      'Tipologia',
      'Piso',
      'Vista',
      'Preço atual',
      'Preço mercado',
      'Interno técnico',
      'Recomendado final',
      'Ajuste',
      'Estratégia',
      'Alerta'
    ];

    const rows = analyses.map((analysis) => {
      const fraction = analysis.fraction;
      const rec = getFinalRecommendation(fraction);
      const finalPrice = rec?.price ?? analysis.coherentPrice;
      const adjustment = Number.isFinite(finalPrice) && Number.isFinite(fraction.price)
        ? finalPrice - fraction.price
        : null;

      return [
        fraction.name,
        fraction.typology,
        fraction.floorLabel,
        fraction.view,
        formatMoney(fraction.price),
        formatMoney(analysis.marketPrice),
        formatMoney(analysis.coherentPrice),
        formatMoney(finalPrice),
        formatSignedMoney(adjustment),
        rec?.strategy || 'Modelo técnico',
        analysis.alert || 'Coerente'
      ];
    });

    renderTable(el.idealTable, headers, rows);

    if (el.idealCount) {
      el.idealCount.textContent = `${analyses.length} frações analisadas`;
    }
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
      h('p', { className: 'modal-subtitle', text: `${fraction.typology} · Piso ${fraction.floorLabel} · Vista ${fraction.view}` }),
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
    return { fraction, marketPrice: market.price, coherentPrice, coherentSqm, score, gapPct, alert, alertLevel, hierarchyAdjusted: false, finalRecommendation, finalPrice, finalGap, finalGapPct };
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
    const thead = h('thead'); const trh = h('tr'); headers.forEach((x) => trh.append(h('th', { text: x }))); thead.append(trh);
    const tbody = h('tbody');
    if (!rows.length) { const tr = h('tr'); const td = h('td', { text: 'Sem dados com os filtros atuais.', attrs: { colspan: headers.length } }); tr.append(td); tbody.append(tr); }
    rows.forEach((row) => {
      const tr = h('tr');
      row.forEach((cell, index) => {
        const td = h('td');
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
  function renderEmptyState() { replace(el.kpiGrid, kpi('Frações','—',''), kpi('Concorrentes','—',''), kpi('Mediana ponderada','—','')); replace(el.cardsGrid, empty('Dashboard sem dados.')); renderTable(el.marketTable, ['Mensagem'], [['Sem dados.']]); renderTable(el.idealTable, ['Mensagem'], [['Sem dados.']]); }
})();
