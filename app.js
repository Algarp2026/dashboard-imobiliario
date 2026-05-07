'use strict';

(() => {
  const DATA_FILE = 'data.xlsx';
  const PROJECT_NAME = 'The View';

  const state = {
    rows: [],
    fractions: [],
    competitors: [],
    filteredFractions: [],
    filteredCompetitors: [],
    selectedFraction: null,
    filters: {
      floor: 'all',
      view: 'all',
      fraction: 'all',
      development: 'all'
    }
  };

  const el = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    bindGlobalEvents();
    await loadExcelData();
  }

  function cacheElements() {
    el.dataStatus = document.getElementById('dataStatus');
    el.kpiGrid = document.getElementById('kpiGrid');
    el.cardsGrid = document.getElementById('cardsGrid');
    el.resultCount = document.getElementById('resultCount');
    el.errorBox = document.getElementById('errorBox');
    el.floorFilter = document.getElementById('floorFilter');
    el.viewFilter = document.getElementById('viewFilter');
    el.fractionFilter = document.getElementById('fractionFilter');
    el.developmentFilter = document.getElementById('developmentFilter');
    el.resetFilters = document.getElementById('resetFilters');
    el.fractionModal = document.getElementById('fractionModal');
    el.fractionModalContent = document.getElementById('fractionModalContent');
    el.closeFractionModal = document.getElementById('closeFractionModal');
    el.competitorModal = document.getElementById('competitorModal');
    el.competitorModalContent = document.getElementById('competitorModalContent');
    el.closeCompetitorModal = document.getElementById('closeCompetitorModal');
  }

  function bindGlobalEvents() {
    el.floorFilter.addEventListener('change', () => updateFilter('floor', el.floorFilter.value));
    el.viewFilter.addEventListener('change', () => updateFilter('view', el.viewFilter.value));
    el.fractionFilter.addEventListener('change', () => updateFilter('fraction', el.fractionFilter.value));
    el.developmentFilter.addEventListener('change', () => updateFilter('development', el.developmentFilter.value));
    el.resetFilters.addEventListener('click', resetFilters);

    el.closeFractionModal.addEventListener('click', closeFractionModal);
    el.closeCompetitorModal.addEventListener('click', closeCompetitorModal);

    el.fractionModal.addEventListener('click', (event) => {
      if (event.target === el.fractionModal) closeFractionModal();
    });
    el.competitorModal.addEventListener('click', (event) => {
      if (event.target === el.competitorModal) closeCompetitorModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!el.competitorModal.classList.contains('hidden')) closeCompetitorModal();
      else if (!el.fractionModal.classList.contains('hidden')) closeFractionModal();
    });
  }

  async function loadExcelData() {
    try {
      setStatus('A carregar Excel…');
      if (!window.XLSX) throw new Error('A biblioteca SheetJS não foi carregada. Confirme a ligação CDN ou use uma cópia local de xlsx.full.min.js.');

      const response = await fetch(DATA_FILE, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Não foi possível carregar ${DATA_FILE}. Código HTTP ${response.status}.`);

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false, cellNF: false, cellText: true });
      const parsed = parseWorkbook(workbook);

      if (!parsed.length) throw new Error('O Excel não contém linhas válidas para apresentação.');

      state.rows = parsed;
      splitDataset(parsed);

      if (!state.fractions.length) throw new Error('Não foram encontradas frações do The View. Verifique se o Excel identifica o empreendimento/projeto como “The View” ou se existe uma coluna de tipo/categoria.');

      state.filteredFractions = [...state.fractions];
      state.filteredCompetitors = [...state.competitors];

      populateFilters();
      applyFilters();
      setStatus('Excel carregado', 'ok');
      hideError();
    } catch (error) {
      console.error(error);
      setStatus('Erro no Excel', 'error');
      showError(`Não foi possível carregar o dashboard: ${safeString(error.message)} Use um data.xlsx válido na raiz do projeto e confirme que as colunas de nome, preço, piso, vista, ABP, varanda e área total existem.`);
      renderEmptyState();
    }
  }

  function parseWorkbook(workbook) {
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

    return rawRows
      .map((raw, index) => normalizeRow(raw, index))
      .filter((row) => row.name && Number.isFinite(row.price) && Number.isFinite(row.floorNumber));
  }

  function normalizeRow(raw, index) {
    const getter = createHeaderGetter(raw);
    const name = getFirst(getter, ['nome', 'fracao', 'fração', 'unidade', 'apartamento', 'unit', 'name']);
    const development = getFirst(getter, ['empreendimento', 'projeto', 'project', 'development', 'concorrente', 'edificio', 'edifício']);
    const typology = normalizeTypology(getFirst(getter, ['tipologia', 'tipo', 'typology', 't']));
    const floorRaw = getFirst(getter, ['piso', 'floor', 'andar']);
    const view = normalizeText(getFirst(getter, ['vista', 'view', 'orientacao', 'orientação']));
    const abp = parseNumber(getFirst(getter, ['abp', 'area bruta privativa', 'área bruta privativa', 'area privativa', 'área privativa']));
    const balcony = parseNumber(getFirst(getter, ['varanda', 'terraco', 'terraço', 'balcony', 'exterior']));
    const totalArea = parseNumber(getFirst(getter, ['area total', 'área total', 'total', 'area', 'área', 'total area']));
    const price = parseNumber(getFirst(getter, ['preco', 'preço', 'valor', 'price', 'asking price']));
    const eurosPerSqmRaw = parseNumber(getFirst(getter, ['€/m2', '€/m²', 'eur/m2', 'euro/m2', 'preco m2', 'preço m2', 'price/m2']));
    const typeFlag = normalizeText(getFirst(getter, ['categoria', 'tipo dado', 'tipo de dado', 'dataset', 'origem', 'classe']));
    const floorNumber = parseFloor(floorRaw);
    const computedTotalArea = Number.isFinite(totalArea) && totalArea > 0 ? totalArea : sumAreas(abp, balcony);
    const eurosPerSqm = Number.isFinite(eurosPerSqmRaw) && eurosPerSqmRaw > 0
      ? eurosPerSqmRaw
      : safeDivide(price, computedTotalArea);

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
      totalArea: positiveOrNull(computedTotalArea),
      price: positiveOrNull(price),
      eurosPerSqm: positiveOrNull(eurosPerSqm),
      typeFlag,
      isProject: isProjectRow({ development, typeFlag, name })
    };
  }

  function createHeaderGetter(row) {
    const normalizedMap = new Map();
    Object.keys(row).forEach((key) => {
      normalizedMap.set(normalizeKey(key), row[key]);
    });
    return (candidate) => normalizedMap.get(normalizeKey(candidate));
  }

  function getFirst(getter, candidates) {
    for (const candidate of candidates) {
      const value = getter(candidate);
      if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return '';
  }

  function splitDataset(rows) {
    const explicitProjectRows = rows.filter((row) => row.isProject);
    const explicitCompetitors = rows.filter((row) => !row.isProject);

    if (explicitProjectRows.length) {
      state.fractions = explicitProjectRows;
      state.competitors = explicitCompetitors;
      return;
    }

    const groupedByDevelopment = groupBy(rows, (row) => normalizeKey(row.development || 'sem empreendimento'));
    let projectKey = '';
    let maxCount = -1;
    groupedByDevelopment.forEach((items, key) => {
      if (items.length > maxCount && key !== 'semempreendimento') {
        projectKey = key;
        maxCount = items.length;
      }
    });

    state.fractions = rows.filter((row) => normalizeKey(row.development || 'sem empreendimento') === projectKey);
    state.competitors = rows.filter((row) => normalizeKey(row.development || 'sem empreendimento') !== projectKey);
  }

  function isProjectRow({ development, typeFlag, name }) {
    const haystack = normalizeKey(`${development || ''} ${typeFlag || ''} ${name || ''}`);
    if (haystack.includes(normalizeKey(PROJECT_NAME))) return true;
    if (haystack.includes('fracao') || haystack.includes('fração') || haystack.includes('subject') || haystack.includes('projeto')) return true;
    if (haystack.includes('concorrente') || haystack.includes('competitor') || haystack.includes('benchmark')) return false;
    return false;
  }

  function populateFilters() {
    setSelectOptions(el.floorFilter, uniqueSorted(state.fractions.map((f) => f.floorNumber)), 'Todos', (value) => String(value));
    setSelectOptions(el.viewFilter, uniqueSorted(state.fractions.map((f) => f.view)), 'Todas', (value) => value);
    setSelectOptions(el.fractionFilter, uniqueSorted(state.fractions.map((f) => f.name)), 'Todas', (value) => value);
    setSelectOptions(el.developmentFilter, uniqueSorted(state.competitors.map((c) => c.development || 'Sem empreendimento')), 'Todos', (value) => value);
  }

  function setSelectOptions(select, values, allLabel, labelMapper) {
    select.replaceChildren();
    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = allLabel;
    select.appendChild(all);

    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = labelMapper(value);
      select.appendChild(option);
    });
  }

  function updateFilter(key, value) {
    state.filters[key] = value;
    applyFilters();
    if (state.selectedFraction) {
      const stillVisible = state.filteredFractions.find((fraction) => fraction.id === state.selectedFraction.id);
      if (stillVisible && !el.fractionModal.classList.contains('hidden')) openFractionModal(stillVisible.id);
    }
  }

  function resetFilters() {
    state.filters = { floor: 'all', view: 'all', fraction: 'all', development: 'all' };
    el.floorFilter.value = 'all';
    el.viewFilter.value = 'all';
    el.fractionFilter.value = 'all';
    el.developmentFilter.value = 'all';
    applyFilters();
  }

  function applyFilters() {
    state.filteredFractions = state.fractions.filter((fraction) => {
      const floorMatch = state.filters.floor === 'all' || String(fraction.floorNumber) === state.filters.floor;
      const viewMatch = state.filters.view === 'all' || fraction.view === state.filters.view;
      const fractionMatch = state.filters.fraction === 'all' || fraction.name === state.filters.fraction;
      return floorMatch && viewMatch && fractionMatch;
    });

    state.filteredCompetitors = state.competitors.filter((competitor) => {
      const development = competitor.development || 'Sem empreendimento';
      return state.filters.development === 'all' || development === state.filters.development;
    });

    renderKpis();
    renderCards();
  }

  function renderKpis() {
    const medianSqm = median(state.filteredCompetitors.map((item) => item.eurosPerSqm).filter(Number.isFinite));
    el.kpiGrid.replaceChildren(
      createKpi('Frações', state.filteredFractions.length),
      createKpi('Concorrentes', state.filteredCompetitors.length),
      createKpi('Mediana €/m²', formatCurrency(medianSqm, 0))
    );
  }

  function createKpi(label, value) {
    const card = document.createElement('article');
    card.className = 'kpi-card';
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = String(value ?? '—');
    card.append(span, strong);
    return card;
  }

  function renderCards() {
    el.cardsGrid.replaceChildren();
    el.resultCount.textContent = `${state.filteredFractions.length} fração${state.filteredFractions.length === 1 ? '' : 'ões'} visível${state.filteredFractions.length === 1 ? '' : 'eis'}`;

    if (!state.filteredFractions.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Nenhuma fração corresponde aos filtros atuais.';
      el.cardsGrid.appendChild(empty);
      return;
    }

    state.filteredFractions.forEach((fraction) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'fraction-card';
      card.addEventListener('click', () => openFractionModal(fraction.id));

      const top = document.createElement('div');
      top.className = 'card-top';
      const titleWrap = document.createElement('div');
      titleWrap.append(createTextElement('h3', 'card-title', fraction.name));
      titleWrap.append(createTextElement('p', 'card-subtitle', `${fraction.typology} · Piso ${formatPlain(fraction.floorNumber)} · ${fraction.view}`));
      top.append(titleWrap, createTextElement('span', 'badge', fraction.development || PROJECT_NAME));

      const price = document.createElement('div');
      price.className = 'price-line';
      price.append(createTextElement('strong', '', formatCurrency(fraction.price, 0)));
      price.append(createTextElement('span', '', `${formatCurrency(fraction.eurosPerSqm, 0)} /m²`));

      card.append(top, price, createMetricsGrid([
        ['ABP', formatArea(fraction.abp)],
        ['Varanda', formatArea(fraction.balcony)],
        ['Área total', formatArea(fraction.totalArea)],
        ['Vista', fraction.view]
      ]));

      el.cardsGrid.appendChild(card);
    });
  }

  function openFractionModal(fractionId) {
    const fraction = state.fractions.find((item) => item.id === fractionId);
    if (!fraction) return;
    state.selectedFraction = fraction;

    const competitorSets = getCompetitorSets(fraction, state.filteredCompetitors);
    const fallback = calculateFallbackPrice(fraction, competitorSets);
    const rigorous = calculateRigorousPrice(fraction, competitorSets);
    const ai = calculateAIPrice(fraction, competitorSets, fallback, rigorous);

    el.fractionModalContent.replaceChildren();
    el.fractionModalContent.append(
      renderFractionHeader(fraction),
      renderPricingSection(fallback, rigorous, ai),
      renderAccordionSection(fraction, competitorSets)
    );

    el.fractionModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function renderFractionHeader(fraction) {
    const fragment = document.createDocumentFragment();
    fragment.append(createTextElement('p', 'eyebrow', 'Fração selecionada'));
    const title = createTextElement('h2', 'modal-title', fraction.name);
    title.id = 'modalTitle';
    fragment.append(title);
    fragment.append(createTextElement('div', 'modal-price', formatCurrency(fraction.price, 0)));
    fragment.append(createModalMetrics([
      ['Piso', formatPlain(fraction.floorNumber)],
      ['Vista', fraction.view],
      ['ABP', formatArea(fraction.abp)],
      ['Varanda', formatArea(fraction.balcony)],
      ['Área total', formatArea(fraction.totalArea)],
      ['€/m²', `${formatCurrency(fraction.eurosPerSqm, 0)} /m²`],
      ['Tipologia', fraction.typology],
      ['Empreendimento', fraction.development || PROJECT_NAME]
    ]));
    return fragment;
  }

  function renderPricingSection(fallback, rigorous, ai) {
    const section = document.createElement('section');
    section.setAttribute('aria-label', 'Preços recomendados');
    section.append(createTextElement('p', 'eyebrow', 'Preços recomendados'));

    const grid = document.createElement('div');
    grid.className = 'pricing-grid';
    grid.append(
      createPricingCard('Preço Fallback', fallback, false),
      createPricingCard('Preço Rigoroso', rigorous, false),
      createPricingCard('Preço IA', ai, true)
    );
    section.appendChild(grid);
    return section;
  }

  function createPricingCard(title, result, hero) {
    const card = document.createElement('article');
    card.className = `pricing-card${hero ? ' pricing-card--hero' : ''}`;
    card.append(createTextElement('span', '', title));
    card.append(createTextElement('strong', '', result.price ? formatCurrency(result.price, 0) : 'Sem dados'));
    card.append(createTextElement('span', '', result.eurosPerSqm ? `${formatCurrency(result.eurosPerSqm, 0)} /m²` : '€/m² indisponível'));

    const list = document.createElement('ul');
    list.className = 'explanation';
    result.explanation.forEach((item) => list.appendChild(createTextElement('li', '', item)));
    card.appendChild(list);
    return card;
  }

  function renderAccordionSection(fraction, sets) {
    const section = document.createElement('section');
    section.className = 'accordion';
    section.setAttribute('aria-label', 'Concorrentes por categoria');

    section.append(
      createAccordionItem('Diretos', 'Mesma tipologia, piso e vista', sets.direct, fraction, true),
      createAccordionItem('Indiretos', 'Mesma tipologia e piso', sets.indirect, fraction, false),
      createAccordionItem('Pouco concorrente', 'Mesma tipologia e piso ±1', sets.weak, fraction, false)
    );
    return section;
  }

  function createAccordionItem(title, subtitle, competitors, fraction, open) {
    const item = document.createElement('article');
    item.className = `accordion-item${open ? ' is-open' : ''}`;

    const button = document.createElement('button');
    button.className = 'accordion-button';
    button.type = 'button';
    button.setAttribute('aria-expanded', String(open));

    const label = document.createElement('div');
    label.append(createTextElement('strong', '', `${title} · ${competitors.length}`));
    label.append(createTextElement('span', '', subtitle));
    button.append(label, createTextElement('span', 'chevron', '⌄'));
    button.addEventListener('click', () => {
      const isOpen = item.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });

    const panel = document.createElement('div');
    panel.className = 'accordion-panel';

    if (!competitors.length) {
      panel.append(createTextElement('div', 'empty-state', 'Sem concorrentes nesta categoria com os filtros atuais.'));
    } else {
      const list = document.createElement('div');
      list.className = 'competitor-list';
      competitors.forEach((competitor) => list.appendChild(createCompetitorRow(competitor, fraction)));
      panel.appendChild(list);
    }

    item.append(button, panel);
    return item;
  }

  function createCompetitorRow(competitor, fraction) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'competitor-row';
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openCompetitorModal(competitor, fraction);
    });

    const left = document.createElement('div');
    left.append(createTextElement('strong', '', competitor.name));
    left.append(createTextElement('small', '', `${competitor.development || 'Sem empreendimento'} · ${competitor.typology} · Piso ${formatPlain(competitor.floorNumber)} · ${competitor.view}`));

    const right = document.createElement('div');
    right.append(createTextElement('strong', '', formatCurrency(competitor.price, 0)));
    right.append(createTextElement('small', '', `${formatCurrency(competitor.eurosPerSqm, 0)} /m²`));

    button.append(left, right);
    return button;
  }

  function openCompetitorModal(competitor, fraction) {
    const comparison = compareCompetitor(competitor, fraction);
    el.competitorModalContent.replaceChildren();

    const title = createTextElement('h3', 'modal-title', competitor.name);
    title.id = 'competitorModalTitle';

    el.competitorModalContent.append(
      createTextElement('p', 'eyebrow', 'Concorrente'),
      title,
      createTextElement('div', 'modal-price', formatCurrency(competitor.price, 0)),
      createModalMetrics([
        ['Empreendimento', competitor.development || 'Sem empreendimento'],
        ['ABP', formatArea(competitor.abp)],
        ['Varanda', formatArea(competitor.balcony)],
        ['Área total', formatArea(competitor.totalArea)],
        ['€/m²', `${formatCurrency(competitor.eurosPerSqm, 0)} /m²`],
        ['Piso', formatPlain(competitor.floorNumber)]
      ]),
      createComparisonGrid(comparison)
    );

    el.competitorModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function createComparisonGrid(comparison) {
    const grid = document.createElement('div');
    grid.className = 'comparison-grid';
    grid.append(
      createDelta('Diferença de preço', comparison.priceDiff, 'currency'),
      createDelta('Diferença €/m²', comparison.sqmDiff, 'currencySqm'),
      createDelta('Diferença de área', comparison.areaDiff, 'area'),
      createDelta('Premium / desconto', comparison.premiumDiscount, 'percent')
    );
    return grid;
  }

  function createDelta(label, value, type) {
    const card = document.createElement('article');
    card.className = `delta ${value >= 0 ? 'is-positive' : 'is-negative'}`;
    card.append(createTextElement('span', '', label));

    let formatted = '—';
    if (Number.isFinite(value)) {
      if (type === 'currency') formatted = signed(formatCurrency(Math.abs(value), 0), value);
      if (type === 'currencySqm') formatted = signed(`${formatCurrency(Math.abs(value), 0)} /m²`, value);
      if (type === 'area') formatted = signed(`${formatNumber(Math.abs(value), 1)} m²`, value);
      if (type === 'percent') formatted = signed(`${formatNumber(Math.abs(value), 1)}%`, value);
    }

    card.append(createTextElement('strong', '', formatted));
    return card;
  }

  function closeFractionModal() {
    el.fractionModal.classList.add('hidden');
    closeCompetitorModal();
    state.selectedFraction = null;
    document.body.classList.remove('modal-open');
  }

  function closeCompetitorModal() {
    el.competitorModal.classList.add('hidden');
    if (el.fractionModal.classList.contains('hidden')) document.body.classList.remove('modal-open');
  }

  function getCompetitorSets(fraction, competitors) {
    const sameTypology = (competitor) => normalizeKey(competitor.typology) === normalizeKey(fraction.typology);
    const sameFloor = (competitor) => competitor.floorNumber === fraction.floorNumber;
    const sameView = (competitor) => normalizeKey(competitor.view) === normalizeKey(fraction.view);
    const floorPlusMinusOne = (competitor) => Math.abs(competitor.floorNumber - fraction.floorNumber) <= 1;

    const direct = competitors.filter((competitor) => sameTypology(competitor) && sameFloor(competitor) && sameView(competitor));
    const directIds = new Set(direct.map((item) => item.id));

    const indirect = competitors.filter((competitor) =>
      sameTypology(competitor) && sameFloor(competitor) && !directIds.has(competitor.id)
    );
    const indirectIds = new Set(indirect.map((item) => item.id));

    const weak = competitors.filter((competitor) =>
      sameTypology(competitor) && floorPlusMinusOne(competitor) && !directIds.has(competitor.id) && !indirectIds.has(competitor.id)
    );

    return { direct, indirect, weak };
  }

  function calculateFallbackPrice(fraction, sets) {
    const chosen = sets.direct.length ? sets.direct : sets.indirect.length ? sets.indirect : sets.weak;
    const category = sets.direct.length ? 'Diretos' : sets.indirect.length ? 'Indiretos' : sets.weak.length ? 'Pouco concorrente' : 'Sem dados';
    const sqmValues = chosen.map((item) => item.eurosPerSqm).filter(Number.isFinite);
    const usedSqm = median(sqmValues);
    const price = usedSqm ? usedSqm * fraction.totalArea : null;

    return {
      price,
      eurosPerSqm: usedSqm,
      competitors: chosen,
      explanation: price ? [
        `Origem dos dados: ${category}.`,
        `Concorrentes usados: ${chosen.length}.`,
        `€/m² usado: mediana de ${formatCurrency(usedSqm, 0)} /m².`,
        'Hierarquia respeitada: diretos → indiretos → pouco concorrente, sem misturar categorias.',
        'Ajustes aplicados: sem ajuste extra; cálculo por área total da fração.'
      ] : ['Sem concorrentes elegíveis com os filtros atuais.', 'Preço fallback indisponível sem €/m² comparável.']
    };
  }

  function calculateRigorousPrice(fraction, sets) {
    const weighted = [
      ...sets.direct.map((item) => ({ ...item, _weight: 3, _origin: 'Diretos' })),
      ...sets.indirect.map((item) => ({ ...item, _weight: 2, _origin: 'Indiretos' })),
      ...sets.weak.map((item) => ({ ...item, _weight: 1, _origin: 'Pouco concorrente' }))
    ].filter((item) => Number.isFinite(item.eurosPerSqm));

    const trimmed = removeExtremes(weighted, 'eurosPerSqm');
    const expanded = [];
    trimmed.forEach((item) => {
      for (let i = 0; i < item._weight; i += 1) expanded.push(item.eurosPerSqm);
    });
    const usedSqm = median(expanded);
    const price = usedSqm ? usedSqm * fraction.totalArea : null;
    const removedCount = weighted.length - trimmed.length;

    return {
      price,
      eurosPerSqm: usedSqm,
      competitors: trimmed,
      explanation: price ? [
        'Origem dos dados: concorrência elegível por tipologia/piso/vista conforme categorias originais.',
        `Concorrentes usados após limpeza: ${trimmed.length}.`,
        `€/m² usado: mediana ponderada de ${formatCurrency(usedSqm, 0)} /m².`,
        `Remoção de extremos: ${removedCount} outlier${removedCount === 1 ? '' : 's'} removido${removedCount === 1 ? '' : 's'}.`,
        'Ajustes aplicados: peso 3 para diretos, 2 para indiretos e 1 para pouco concorrente.'
      ] : ['Sem amostra suficiente para o modelo rigoroso.', 'Remoção de extremos e ponderação não aplicadas.']
    };
  }

  function calculateAIPrice(fraction, sets, fallback, rigorous) {
    const directMedian = median(sets.direct.map((item) => item.eurosPerSqm).filter(Number.isFinite));
    const indirectMedian = median(sets.indirect.map((item) => item.eurosPerSqm).filter(Number.isFinite));
    const weakMedian = median(sets.weak.map((item) => item.eurosPerSqm).filter(Number.isFinite));

    const components = [];
    if (directMedian) components.push({ value: directMedian, weight: 0.50, label: 'Diretos' });
    if (indirectMedian) components.push({ value: indirectMedian, weight: 0.30, label: 'Indiretos' });
    if (weakMedian) components.push({ value: weakMedian, weight: 0.20, label: 'Pouco concorrente' });
    if (!components.length && rigorous.eurosPerSqm) components.push({ value: rigorous.eurosPerSqm, weight: 1, label: 'Rigoroso' });
    if (!components.length && fallback.eurosPerSqm) components.push({ value: fallback.eurosPerSqm, weight: 1, label: 'Fallback' });

    const baseSqm = weightedAverage(components);
    const viewAdjustment = getViewAdjustment(fraction.view);
    const floorAdjustment = getFloorAdjustment(fraction.floorNumber);
    const sampleAdjustment = getSampleAdjustment(sets);
    const finalSqm = baseSqm ? baseSqm * (1 + viewAdjustment + floorAdjustment + sampleAdjustment) : null;
    const price = finalSqm ? finalSqm * fraction.totalArea : null;

    const premiumDiscount = fraction.eurosPerSqm && finalSqm ? ((finalSqm - fraction.eurosPerSqm) / fraction.eurosPerSqm) * 100 : null;

    return {
      price,
      eurosPerSqm: finalSqm,
      competitors: [...sets.direct, ...sets.indirect, ...sets.weak],
      explanation: price ? [
        `Origem dos dados: ${components.map((c) => c.label).join(', ')}.`,
        `Concorrentes usados: ${sets.direct.length + sets.indirect.length + sets.weak.length}.`,
        `€/m² base ponderado: ${formatCurrency(baseSqm, 0)} /m²; final: ${formatCurrency(finalSqm, 0)} /m².`,
        `Ajustes aplicados: vista ${formatPercent(viewAdjustment)}, piso ${formatPercent(floorAdjustment)}, robustez da amostra ${formatPercent(sampleAdjustment)}.`,
        `Premium/desconto face ao preço atual: ${Number.isFinite(premiumDiscount) ? signed(`${formatNumber(Math.abs(premiumDiscount), 1)}%`, premiumDiscount) : '—'}.`,
        'Modelo IA: heurístico inteligente, recalculado automaticamente pelos filtros; não é machine learning real.'
      ] : ['Sem dados suficientes para calcular o preço IA.', 'O modelo IA precisa de pelo menos uma categoria elegível com €/m² válido.']
    };
  }

  function compareCompetitor(competitor, fraction) {
    const priceDiff = competitor.price - fraction.price;
    const sqmDiff = competitor.eurosPerSqm - fraction.eurosPerSqm;
    const areaDiff = competitor.totalArea - fraction.totalArea;
    const premiumDiscount = fraction.eurosPerSqm ? (sqmDiff / fraction.eurosPerSqm) * 100 : null;
    return { priceDiff, sqmDiff, areaDiff, premiumDiscount };
  }

  function removeExtremes(items, field) {
    if (items.length < 5) return [...items];
    const values = items.map((item) => item[field]).filter(Number.isFinite).sort((a, b) => a - b);
    const q1 = percentile(values, 0.25);
    const q3 = percentile(values, 0.75);
    const iqr = q3 - q1;
    const min = q1 - 1.5 * iqr;
    const max = q3 + 1.5 * iqr;
    return items.filter((item) => item[field] >= min && item[field] <= max);
  }

  function createMetricsGrid(items) {
    const grid = document.createElement('div');
    grid.className = 'metrics-grid';
    items.forEach(([label, value]) => {
      const metric = document.createElement('div');
      metric.className = 'metric';
      metric.append(createTextElement('span', '', label), createTextElement('strong', '', value));
      grid.appendChild(metric);
    });
    return grid;
  }

  function createModalMetrics(items) {
    const grid = document.createElement('div');
    grid.className = 'modal-grid';
    items.forEach(([label, value]) => {
      const metric = document.createElement('div');
      metric.className = 'modal-metric';
      metric.append(createTextElement('span', '', label), createTextElement('strong', '', value));
      grid.appendChild(metric);
    });
    return grid;
  }

  function createTextElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = safeString(text);
    return node;
  }

  function renderEmptyState() {
    renderKpis();
    el.cardsGrid.replaceChildren(createTextElement('div', 'empty-state', 'Dashboard sem dados. Confirme o ficheiro data.xlsx e recarregue a página.'));
    el.resultCount.textContent = '0 frações visíveis';
  }

  function showError(message) {
    el.errorBox.textContent = message;
    el.errorBox.classList.remove('hidden');
  }

  function hideError() {
    el.errorBox.textContent = '';
    el.errorBox.classList.add('hidden');
  }

  function setStatus(message, variant) {
    el.dataStatus.textContent = message;
    el.dataStatus.classList.remove('is-ok', 'is-error');
    if (variant === 'ok') el.dataStatus.classList.add('is-ok');
    if (variant === 'error') el.dataStatus.classList.add('is-error');
  }

  function normalizeKey(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  function normalizeText(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
  }

  function normalizeTypology(value) {
    const text = normalizeText(value).toUpperCase();
    const match = text.match(/T\s*\d+/i);
    return match ? match[0].replace(/\s+/g, '') : text;
  }

  function parseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const cleaned = String(value ?? '')
      .replace(/\s/g, '')
      .replace(/€/g, '')
      .replace(/m²|m2/gi, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return null;
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : null;
  }

  function parseFloor(value) {
    const text = String(value ?? '').trim();
    if (!text) return NaN;
    if (/r\/c|rc|rés|res|ground/i.test(text)) return 0;
    const match = text.match(/-?\d+/);
    return match ? Number(match[0]) : NaN;
  }

  function sumAreas(...values) {
    const sum = values.filter((value) => Number.isFinite(value)).reduce((acc, value) => acc + value, 0);
    return sum > 0 ? sum : null;
  }

  function safeDivide(a, b) {
    return Number.isFinite(a) && Number.isFinite(b) && b > 0 ? a / b : null;
  }

  function positiveOrNull(value) {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  function median(values) {
    const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!clean.length) return null;
    const mid = Math.floor(clean.length / 2);
    return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
  }

  function percentile(values, p) {
    if (!values.length) return null;
    const index = (values.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return values[lower];
    return values[lower] + (values[upper] - values[lower]) * (index - lower);
  }

  function weightedAverage(components) {
    const totalWeight = components.reduce((acc, item) => acc + item.weight, 0);
    if (!totalWeight) return null;
    return components.reduce((acc, item) => acc + item.value * item.weight, 0) / totalWeight;
  }

  function getViewAdjustment(view) {
    const key = normalizeKey(view);
    if (key.includes('mar') || key.includes('sea') || key.includes('ria') || key.includes('panoramica')) return 0.035;
    if (key.includes('jardim') || key.includes('piscina') || key.includes('river') || key.includes('rio')) return 0.018;
    if (key.includes('interior') || key.includes('rua') || key.includes('cidade')) return -0.010;
    return 0;
  }

  function getFloorAdjustment(floor) {
    if (!Number.isFinite(floor)) return 0;
    if (floor >= 5) return 0.020;
    if (floor >= 3) return 0.012;
    if (floor <= 0) return -0.012;
    return 0;
  }

  function getSampleAdjustment(sets) {
    const total = sets.direct.length + sets.indirect.length + sets.weak.length;
    if (sets.direct.length >= 3) return 0.008;
    if (sets.direct.length >= 1) return 0.004;
    if (total < 3) return -0.012;
    return 0;
  }

  function uniqueSorted(values) {
    const clean = [...new Set(values.filter((value) => value !== null && value !== undefined && String(value).trim() !== '' && String(value) !== 'NaN'))];
    return clean.sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return String(a).localeCompare(String(b), 'pt', { numeric: true, sensitivity: 'base' });
    });
  }

  function groupBy(items, getter) {
    const map = new Map();
    items.forEach((item) => {
      const key = getter(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }

  function formatCurrency(value, digits = 0) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
  }

  function formatNumber(value, digits = 0) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('pt-PT', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
  }

  function formatArea(value) {
    return Number.isFinite(value) ? `${formatNumber(value, 1)} m²` : '—';
  }

  function formatPlain(value) {
    return Number.isFinite(Number(value)) ? formatNumber(Number(value), 0) : safeString(value || '—');
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return '—';
    return `${value >= 0 ? '+' : '-'}${formatNumber(Math.abs(value * 100), 1)}%`;
  }

  function signed(formattedAbsolute, rawValue) {
    if (!Number.isFinite(rawValue)) return '—';
    if (rawValue === 0) return formattedAbsolute;
    return `${rawValue > 0 ? '+' : '-'}${formattedAbsolute}`;
  }

  function safeString(value) {
    return String(value ?? '').trim();
  }

  function slugify(value) {
    return normalizeKey(value).slice(0, 48) || 'item';
  }
})();
