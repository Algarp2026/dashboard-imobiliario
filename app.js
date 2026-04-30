let dados = [];
let fracaoAtual = null;

/* ================= LOAD ================= */

fetch("data.xlsx")
  .then(res => res.arrayBuffer())
  .then(ab => {
    const wb = XLSX.read(ab);
    const ws = wb.Sheets[wb.SheetNames[0]];
    dados = XLSX.utils.sheet_to_json(ws);

    initFiltros();
    render();
  });

/* ================= FILTROS ================= */

function initFiltros(){

  const pisos = [...new Set(dados.map(d=>d.Piso))];
  const vistas = [...new Set(dados.map(d=>d.Vista))];

  piso.innerHTML = `<option value="">Todos</option>` + pisos.map(p=>`<option>${p}</option>`).join("");
  vista.innerHTML = `<option value="">Todas</option>` + vistas.map(v=>`<option>${v}</option>`).join("");

  fractionsBox.innerHTML =
    dados.filter(d=>d.Empreendimento==="The View")
      .map(d=>`
        <label>
          <input type="checkbox" value="${d.Fração}" checked onchange="render()">
          ${d.Fração}
        </label>
      `).join("");

  const emp = [...new Set(dados.map(d=>d.Empreendimento))];

  empreBox.innerHTML =
    emp.filter(e=>e!=="The View")
      .map(e=>`
        <label>
          <input type="checkbox" value="${e}" checked onchange="render()">
          ${e}
        </label>
      `).join("");
}

function getSelecionados(id){
  return [...document.querySelectorAll(`#${id} input:checked`)].map(i=>i.value);
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

    const abp = f["Área Bruta"] || f["ABP"] || "-";
    const varan = f["Varanda"] || f["Varanda/Terraço"] || "-";

    return `
      <div class="card" onclick='abrir("${encodeURIComponent(JSON.stringify(f))}")'>
        <div class="title">${f.Fração}</div>
        <div>${abp} m² • Var ${varan}</div>
        <div class="price">${f.PVP.toLocaleString()}€</div>
      </div>
    `;
  }).join("");
}

/* ================= MODAL ================= */

function abrir(encoded){

  const f = JSON.parse(decodeURIComponent(encoded));
  fracaoAtual = f;

  const abp = f["Área Bruta"] || f["ABP"] || "-";
  const varan = f["Varanda"] || f["Varanda/Terraço"] || "-";
  const total = f["Área Total"] || "-";

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
    return arr.map(c=>{

      const ctot = c["Área Total"] || "-";

      return `
        <div class="compRow" onclick='event.stopPropagation(); abrirConcorrente("${encodeURIComponent(JSON.stringify(c))}")'>
          <div>${c.Empreendimento} - ${c.Fração}<br><small>Total ${ctot}</small></div>
          <div>${c.PVP.toLocaleString()}€</div>
        </div>
      `;
    }).join("");
  }

  modalConteudo.innerHTML = `
    <h2>${f.Fração}</h2>

    <div class="bigPrice">${f.PVP.toLocaleString()}€</div>

    <div>ABP ${abp} • Var ${varan} • Total ${total}</div>

    <div class="priceBox">
      <b>Fallback:</b> ${Math.round(fallback).toLocaleString()}€
    </div>

    <div class="priceBox">
      <b>Rigoroso:</b> ${Math.round(rigoroso).toLocaleString()}€
    </div>

    <div class="priceBox">
      <b>IA:</b> ${ia.valor.toLocaleString()}€
      <small>${ia.exp}</small>
    </div>

    <h3>Diretos (${g.diretos.length})</h3>
    ${lista(g.diretos)}

    <h3>Indiretos (${g.indiretos.length})</h3>
    ${lista(g.indiretos)}

    <h3>Pouco (${g.poucos.length})</h3>
    ${lista(g.poucos)}
  `;

  modal.style.display = "block";
}

function fecharModal(){
  modal.style.display = "none";
}

/* ================= POPUP ================= */

function abrirConcorrente(encoded){

  const c = JSON.parse(decodeURIComponent(encoded));

  popup.innerHTML = `
    <div class="popupCard">
      <h3>${c.Empreendimento} - ${c.Fração}</h3>
      <p>${c.PVP.toLocaleString()}€</p>
      <p>Total ${c["Área Total"]}</p>
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
    diretos: comps.filter(c=>c.Tipologia===f.Tipologia && c.Piso==f.Piso && c.Vista===f.Vista),
    indiretos: comps.filter(c=>c.Tipologia===f.Tipologia && c.Piso==f.Piso),
    poucos: comps.filter(c=>c.Tipologia===f.Tipologia && Math.abs(c.Piso-f.Piso)==1)
  };
}

function media(arr){
  if(!arr.length) return 0;
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

function precoFallback(f,g){
  if(g.diretos.length) return media(g.diretos);
  if(g.indiretos.length) return media(g.indiretos);
  if(g.poucos.length) return media(g.poucos);
  return f.PVP;
}

function precoRigoroso(g){
  return media(g.diretos)*0.6 + media(g.indiretos)*0.3 + media(g.poucos)*0.1;
}

function precoIA(f,g){

  const area = f["Área Total"];
  if(!area) return {valor:f.PVP,exp:"sem área"};

  let lista = [];

  g.diretos.forEach(c=>lista.push(c.PVP/c["Área Total"]));
  g.indiretos.forEach(c=>lista.push(c.PVP/c["Área Total"]));
  g.poucos.forEach(c=>lista.push(c.PVP/c["Área Total"]));

  if(!lista.length) return {valor:f.PVP,exp:"sem comps"};

  const m2 = lista.reduce((a,b)=>a+b,0)/lista.length;

  return {
    valor: Math.round(m2*area),
    exp: "média €/m²"
  };
}
