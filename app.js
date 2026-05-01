let dados = [];
let fracaoAtual = null;
let renderTimer;

/* ================= HELPERS ================= */

function safe(text){
  return String(text ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function num(v){
  return Number(v) || 0;
}

function fmt(v){
  return v ? v.toLocaleString() : "-";
}

/* ================= LOAD ================= */

fetch("data.xlsx")
  .then(res => {
    if (!res.ok) throw new Error("Erro ao carregar Excel");
    return res.arrayBuffer();
  })
  .then(ab => {
    const wb = XLSX.read(ab);
    const ws = wb.Sheets[wb.SheetNames[0]];
    dados = XLSX.utils.sheet_to_json(ws);

    initFiltros();
    render();
  })
  .catch(() => {
    grid.innerHTML = `<div class="erroBox">⚠️ Erro ao carregar dados</div>`;
  });

/* ================= FILTROS ================= */

function initFiltros(){

  piso.innerHTML =
    `<option value="">Todos</option>` +
    [...new Set(dados.map(d=>d.Piso))]
      .map(p=>`<option>${safe(p)}</option>`).join("");

  vista.innerHTML =
    `<option value="">Todas</option>` +
    [...new Set(dados.map(d=>d.Vista))]
      .map(v=>`<option>${safe(v)}</option>`).join("");

  fractionsBox.innerHTML =
    dados.filter(d=>d.Empreendimento==="The View")
      .map(d=>`
        <label class="checkItem">
          <input type="checkbox" value="${safe(d.Fração)}" checked onchange="renderDebounced()">
          ${safe(d.Fração)}
        </label>
      `).join("");

  empreBox.innerHTML =
    [...new Set(dados.map(d=>d.Empreendimento))]
      .filter(e=>e!=="The View")
      .map(e=>`
        <label class="checkItem">
          <input type="checkbox" value="${safe(e)}" checked onchange="renderDebounced()">
          ${safe(e)}
        </label>
      `).join("");
}

function getSelecionados(id){
  return [...document.querySelectorAll(`#${id} input:checked`)]
    .map(i=>i.value);
}

function renderDebounced(){
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 120);
}

/* ================= RENDER ================= */

function render(){

  let base = dados.filter(d=>d.Empreendimento==="The View");

  if(piso.value) base = base.filter(d=>d.Piso==piso.value);
  if(vista.value) base = base.filter(d=>d.Vista==vista.value);

  const fracs = getSelecionados("fractionsBox");
  if(fracs.length) base = base.filter(d=>fracs.includes(d.Fração));

  grid.innerHTML = base.map(f=>{

    const abp = num(f["Área Bruta"] || f["ABP"]);
    const varan = num(f["Varanda"] || f["Varanda/Terraço"]);

    return `
      <div class="card" onclick='abrir("${encodeURIComponent(JSON.stringify(f))}")'>

        <div class="badge">${safe(f.Tipologia)}</div>

        <div class="title">${safe(f.Fração)}</div>

        <div class="meta">
          Piso ${safe(f.Piso)} • ${safe(f.Vista)}
        </div>

        <div class="area">
          ${abp ? abp.toFixed(2)+" m²" : "-"} • Var ${varan ? varan.toFixed(2) : "-"}
        </div>

        <div class="price">${fmt(num(f.PVP))}€</div>

      </div>
    `;
  }).join("");
}

/* ================= MODAL ================= */

function abrir(encoded){

  const f = JSON.parse(decodeURIComponent(encoded));
  fracaoAtual = f;

  const comps = dados.filter(d=>d.Empreendimento!=="The View");

  const g = classificarConcorrentes(f, comps);

  const fallback = precoFallback(f,g);
  const rigoroso = precoRigoroso(g);
  const ia = precoIA(f,g);

  function lista(arr){
    if(!arr.length) return "<p>Nenhum</p>";

    return arr.map(c=>`
      <div class="compRow"
           onclick='event.stopPropagation(); abrirConcorrente("${encodeURIComponent(JSON.stringify(c))}")'>

        <div>
          <strong>${safe(c.Empreendimento)} - ${safe(c.Fração)}</strong><br>
          <small>${num(c["Área Total"]).toFixed(2)} m²</small>
        </div>

        <div>${fmt(num(c.PVP))}€</div>

      </div>
    `).join("");
  }

  modalConteudo.innerHTML = `
    <h2>${safe(f.Fração)}</h2>

    <div class="bigPrice">${fmt(num(f.PVP))}€</div>

    <div class="pricingGrid">

      <div class="priceBox blue">
        <div>Fallback</div>
        <div>${fmt(Math.round(fallback))}€</div>
      </div>

      <div class="priceBox purple">
        <div>Rigoroso</div>
        <div>${fmt(Math.round(rigoroso))}€</div>
      </div>

      <div class="priceBox green">
        <div>Preço IA</div>
        <div>${fmt(ia.valor)}€</div>
        <small>${safe(ia.exp)}</small>
      </div>

    </div>

    <h3>Diretos (${g.diretos.length})</h3>
    ${lista(g.diretos)}

    <h3>Indiretos (${g.indiretos.length})</h3>
    ${lista(g.indiretos)}

    <h3>Pouco (${g.poucos.length})</h3>
    ${lista(g.poucos)}
  `;

  modal.style.display = "flex";
}

function fecharModal(){
  modal.style.display = "none";
}

/* ================= POPUP ================= */

function abrirConcorrente(encoded){

  const c = JSON.parse(decodeURIComponent(encoded));

  popup.innerHTML = `
    <div class="popupOverlay" onclick="fecharPopup()">

      <div class="popupCard" onclick="event.stopPropagation()">

        <h3>${safe(c.Empreendimento)} - ${safe(c.Fração)}</h3>

        <div class="price">${fmt(num(c.PVP))}€</div>

        <div>${num(c["Área Total"]).toFixed(2)} m²</div>

        <button onclick="fecharPopup()">Fechar</button>

      </div>

    </div>
  `;

  popup.style.display = "block";
}

function fecharPopup(){
  popup.style.display = "none";
}

/* ================= LÓGICA ================= */

function classificarConcorrentes(f, comps){
  return {
    diretos: comps.filter(c=>c.Tipologia===f.Tipologia && c.Piso==f.Piso && c.Vista===f.Vista),
    indiretos: comps.filter(c=>c.Tipologia===f.Tipologia && c.Piso==f.Piso),
    poucos: comps.filter(c=>c.Tipologia===f.Tipologia && Math.abs(c.Piso-f.Piso)==1)
  };
}

/* ================= PREÇOS ================= */

function media(arr){
  if(!arr.length) return 0;
  return arr.reduce((a,b)=>a+num(b.PVP),0)/arr.length;
}

function precoFallback(f,g){
  if(g.diretos.length) return media(g.diretos);
  if(g.indiretos.length) return media(g.indiretos);
  if(g.poucos.length) return media(g.poucos);
  return num(f.PVP);
}

function precoRigoroso(g){
  return media(g.diretos)*0.6 +
         media(g.indiretos)*0.3 +
         media(g.poucos)*0.1;
}

function precoIA(f,g){

  const area = num(f["Área Total"]);
  if(!area) return {valor:num(f.PVP),exp:"Sem área"};

  let lista = [];

  [...g.diretos,...g.indiretos,...g.poucos].forEach(c=>{
    const a = num(c["Área Total"]);
    if(a) lista.push(num(c.PVP)/a);
  });

  if(!lista.length) return {valor:num(f.PVP),exp:"Sem comps"};

  const m2 = lista.reduce((a,b)=>a+b,0)/lista.length;

  return {
    valor: Math.round(m2*area),
    exp: `${Math.round(m2)} €/m²`
  };
}
