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
  .catch(err => {
    console.error(err);

    document.getElementById("grid").innerHTML = `
      <div class="erroBox">
        ⚠️ Erro ao carregar dados.<br>
        Verifique o ficheiro data.xlsx
      </div>
    `;
  });

/* ================= FILTROS ================= */

function initFiltros(){

  const pisos = [...new Set(dados.map(d=>d.Piso))];
  const vistas = [...new Set(dados.map(d=>d.Vista))];

  piso.innerHTML =
    `<option value="">Todos</option>` +
    pisos.map(p=>`<option>${safe(p)}</option>`).join("");

  vista.innerHTML =
    `<option value="">Todas</option>` +
    vistas.map(v=>`<option>${safe(v)}</option>`).join("");

  fractionsBox.innerHTML =
    dados.filter(d=>d.Empreendimento==="The View")
      .map(d=>`
        <label>
          <input type="checkbox" value="${safe(d.Fração)}" checked onchange="renderDebounced()">
          ${safe(d.Fração)}
        </label>
      `).join("");

  const emp = [...new Set(dados.map(d=>d.Empreendimento))];

  empreBox.innerHTML =
    emp.filter(e=>e!=="The View")
      .map(e=>`
        <label>
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

  const pisoVal = piso.value;
  const vistaVal = vista.value;
  const fracs = getSelecionados("fractionsBox");

  let base = dados.filter(d=>d.Empreendimento==="The View");

  if(pisoVal) base = base.filter(d=>d.Piso==pisoVal);
  if(vistaVal) base = base.filter(d=>d.Vista==vistaVal);
  if(fracs.length) base = base.filter(d=>fracs.includes(d.Fração));

  grid.innerHTML = base.map(f=>{

    const abp = num(f["Área Bruta"] || f["ABP"]);
    const varan = num(f["Varanda"] || f["Varanda/Terraço"]);

    return `
      <div class="card" onclick='abrir("${encodeURIComponent(JSON.stringify(f))}")'>

        <div class="title">${safe(f.Fração)}</div>

        <div class="meta">
          ${abp ? abp.toFixed(2)+" m²" : "-"} • 
          Var ${varan ? varan.toFixed(2) : "-"}
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

  const abp = num(f["Área Bruta"] || f["ABP"]);
  const varan = num(f["Varanda"] || f["Varanda/Terraço"]);
  const total = num(f["Área Total"]);

  const emps = getSelecionados("empreBox");

  const comps = dados.filter(d =>
    d.Empreendimento !== "The View" &&
    emps.includes(d.Empreendimento)
  );

  const g = classificarConcorrentes(f, comps);

  const fallback = precoFallback(f,g);
  const rigoroso = precoRigoroso(g);
  const ia = precoIA(f,g);

  function lista(arr){
    if(!arr.length) return "<p>Nenhum</p>";

    return arr.map(c=>{

      const ctot = num(c["Área Total"]);

      return `
        <div class="compRow"
             onclick='event.stopPropagation(); abrirConcorrente("${encodeURIComponent(JSON.stringify(c))}")'>

          <div>
            <strong>${safe(c.Empreendimento)} - ${safe(c.Fração)}</strong><br>
            <small>Total ${ctot ? ctot.toFixed(2) : "-"}</small>
          </div>

          <div>${fmt(num(c.PVP))}€</div>

        </div>
      `;
    }).join("");
  }

  modalConteudo.innerHTML = `
    <h2>${safe(f.Fração)}</h2>

    <div class="bigPrice">${fmt(num(f.PVP))}€</div>

    <div class="areas">
      ABP ${abp ? abp.toFixed(2) : "-"} • 
      Var ${varan ? varan.toFixed(2) : "-"} • 
      Total ${total ? total.toFixed(2) : "-"}
    </div>

    <div class="priceBox">
      <b>Fallback:</b> ${fmt(Math.round(fallback))}€
    </div>

    <div class="priceBox">
      <b>Rigoroso:</b> ${fmt(Math.round(rigoroso))}€
    </div>

    <div class="priceBox highlight">
      <b>Preço IA:</b> ${fmt(ia.valor)}€
      <small>${safe(ia.exp)}</small>
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
    <div class="popupCard" onclick="event.stopPropagation()">

      <h3>${safe(c.Empreendimento)} - ${safe(c.Fração)}</h3>

      <p>${fmt(num(c.PVP))}€</p>

      <p>Total ${num(c["Área Total"]).toFixed(2)}</p>

      <button onclick="fecharPopup()">Fechar</button>

    </div>
  `;

  popup.style.display = "flex";
}

function fecharPopup(){
  popup.style.display = "none";
}

/* ================= LÓGICA ================= */

function classificarConcorrentes(f, comps){

  return {
    diretos: comps.filter(c =>
      c.Tipologia === f.Tipologia &&
      Number(c.Piso) === Number(f.Piso) &&
      c.Vista === f.Vista
    ),

    indiretos: comps.filter(c =>
      c.Tipologia === f.Tipologia &&
      Number(c.Piso) === Number(f.Piso)
    ),

    poucos: comps.filter(c =>
      c.Tipologia === f.Tipologia &&
      Math.abs(Number(c.Piso) - Number(f.Piso)) === 1
    )
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

  [...g.diretos, ...g.indiretos, ...g.poucos]
    .forEach(c=>{
      const a = num(c["Área Total"]);
      if(a) lista.push(num(c.PVP)/a);
    });

  if(!lista.length) return {valor:num(f.PVP),exp:"Sem comparáveis"};

  const m2 = lista.reduce((a,b)=>a+b,0)/lista.length;

  return {
    valor: Math.round(m2*area),
    exp: `Baseado em ${lista.length} comps (${Math.round(m2)}€/m²)`
  };
}
