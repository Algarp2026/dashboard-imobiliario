let dados = [];
let renderTimer;

/* ================= HELPERS ================= */

function safe(t){
  return String(t ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function num(v){
  return Number(v) || 0;
}

function fmt(v){
  return v ? Math.round(v).toLocaleString() : "-";
}

/* ================= LEITURA ROBUSTA ================= */

function getField(row, names){
  for(let n of names){
    if(row[n] !== undefined && row[n] !== ""){
      return Number(row[n]) || 0;
    }
  }
  return 0;
}

function getText(row, names){
  for(let n of names){
    if(row[n] !== undefined && row[n] !== ""){
      return String(row[n]);
    }
  }
  return "";
}

/* ================= LOAD ================= */

fetch("data.xlsx")
.then(res => res.arrayBuffer())
.then(ab => {

  const wb = XLSX.read(ab);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws);

  dados = raw.map(r => ({

    empreendimento: getText(r, ["Empreendimento"]),
    fracao: getText(r, ["Fração", "Fracao"]),
    tipologia: getText(r, ["Tipologia"]),
    vista: getText(r, ["Vista"]),

    piso: parseInt(getText(r, ["Piso"])) || 0,

    abp: getField(r, ["ABP", "ABP m2", "Área Bruta"]),
    varanda: getField(r, ["Varanda", "Varanda m2"]),
    total: getField(r, ["Área Total", "Total m2", "Total"]),

    preco: getField(r, ["PVP", "Preço", "Preco"])

  }));

  initFiltros();
  render();

});

/* ================= FILTROS ================= */

function initFiltros(){

  piso.innerHTML =
    `<option value="">Todos</option>` +
    [...new Set(dados.map(d=>d.piso))]
      .map(p=>`<option>${p}</option>`).join("");

  vista.innerHTML =
    `<option value="">Todas</option>` +
    [...new Set(dados.map(d=>d.vista))]
      .map(v=>`<option>${safe(v)}</option>`).join("");

  fractionsBox.innerHTML =
    dados.filter(d=>d.empreendimento==="The View")
      .map(d=>`
        <label>
          <input type="checkbox" value="${safe(d.fracao)}" checked onchange="renderDebounced()">
          ${safe(d.fracao)}
        </label>
      `).join("");

  empreBox.innerHTML =
    [...new Set(dados.map(d=>d.empreendimento))]
      .filter(e=>e!=="The View")
      .map(e=>`
        <label>
          <input type="checkbox" value="${safe(e)}" checked onchange="renderDebounced()">
          ${safe(e)}
        </label>
      `).join("");
}

function renderDebounced(){
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 120);
}

function getSelecionados(id){
  return [...document.querySelectorAll(`#${id} input:checked`)]
    .map(i=>i.value);
}

function resetFiltros(){
  piso.value="";
  vista.value="";
  document.querySelectorAll("input[type=checkbox]").forEach(i=>i.checked=true);
  render();
}

/* ================= RENDER ================= */

function render(){

  let base = dados.filter(d=>d.empreendimento==="The View");

  if(piso.value) base = base.filter(d=>d.piso == piso.value);
  if(vista.value) base = base.filter(d=>d.vista == vista.value);

  grid.innerHTML = base.map(f=>`

    <div class="card" onclick='abrir("${encodeURIComponent(JSON.stringify(f))}")'>

      <div class="title">${safe(f.fracao)}</div>

      <div class="meta">
        Piso ${f.piso} • ${safe(f.vista)}
      </div>

      <div class="area">
        ABP ${f.abp.toFixed(2)} • Var ${f.varanda.toFixed(2)}
      </div>

      <div class="price">${fmt(f.preco)}€</div>

    </div>

  `).join("");
}

/* ================= MODAL ================= */

function abrir(encoded){

  const f = JSON.parse(decodeURIComponent(encoded));

  const comps = dados.filter(d=>d.empreendimento!=="The View");

  const g = classificar(f, comps);

  function linha(c){
    return `
      <div class="compRow" onclick='event.stopPropagation(); abrirConcorrente("${encodeURIComponent(JSON.stringify(c))}")'>
        <div>
          <strong>${safe(c.empreendimento)} - ${safe(c.fracao)}</strong><br>
          ${c.total.toFixed(2)} m²
        </div>
        <div>${fmt(c.preco)}€</div>
      </div>
    `;
  }

  modalConteudo.innerHTML = `

    <h2>${safe(f.fracao)}</h2>

    <div class="bigPrice">${fmt(f.preco)}€</div>

    <div>
      ABP ${f.abp.toFixed(2)} • 
      Var ${f.varanda.toFixed(2)} • 
      Total ${f.total.toFixed(2)}
    </div>

    <div class="priceBox blue">
      Fallback: ${fmt(precoFallback(f,g))}€
    </div>

    <div class="priceBox purple">
      Rigoroso: ${fmt(precoRigoroso(g))}€
    </div>

    <div class="priceBox green">
      IA: ${fmt(precoIA(f,g))}€
    </div>

    <div class="section-header" onclick="toggle(this)">Diretos (${g.d.length})</div>
    <div class="section-body">${g.d.map(linha).join("")}</div>

    <div class="section-header" onclick="toggle(this)">Indiretos (${g.i.length})</div>
    <div class="section-body">${g.i.map(linha).join("")}</div>

    <div class="section-header" onclick="toggle(this)">Pouco (${g.p.length})</div>
    <div class="section-body">${g.p.map(linha).join("")}</div>

  `;

  modal.style.display = "flex";
}

function fecharModal(){
  modal.style.display="none";
}

/* ================= POPUP ================= */

function abrirConcorrente(encoded){

  const c = JSON.parse(decodeURIComponent(encoded));

  popup.innerHTML = `
    <div class="popupOverlay" onclick="fecharPopup()">
      <div class="popupCard" onclick="event.stopPropagation()">
        <h3>${safe(c.empreendimento)}</h3>
        <p>${fmt(c.preco)}€</p>
        <p>${c.total.toFixed(2)} m²</p>
        <button onclick="fecharPopup()">Fechar</button>
      </div>
    </div>
  `;

  popup.style.display="flex";
}

function fecharPopup(){
  popup.style.display="none";
}

/* ================= LÓGICA ================= */

function classificar(f, comps){
  return {
    d: comps.filter(c=>c.tipologia===f.tipologia && c.piso==f.piso && c.vista===f.vista),
    i: comps.filter(c=>c.tipologia===f.tipologia && c.piso==f.piso),
    p: comps.filter(c=>c.tipologia===f.tipologia && Math.abs(c.piso-f.piso)==1)
  };
}

/* ================= PREÇOS ================= */

function media(arr){
  if(!arr.length) return 0;
  return arr.reduce((a,b)=>a+b.preco,0)/arr.length;
}

function precoFallback(f,g){
  if(g.d.length) return media(g.d);
  if(g.i.length) return media(g.i);
  if(g.p.length) return media(g.p);
  return f.preco;
}

function precoRigoroso(g){
  return media(g.d)*0.6 + media(g.i)*0.3 + media(g.p)*0.1;
}

function precoIA(f,g){

  let lista = [...g.d,...g.i,...g.p]
    .map(c => c.total ? c.preco / c.total : 0)
    .filter(v => v > 1000 && v < 20000);

  if(!lista.length) return f.preco;

  const m2 = lista.reduce((a,b)=>a+b,0)/lista.length;

  return m2 * f.total;
}

/* ================= UI ================= */

function toggle(el){
  const next = el.nextElementSibling;
  next.style.display = next.style.display==="none" ? "block" : "none";
}
