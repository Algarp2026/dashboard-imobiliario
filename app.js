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

  document.getElementById("piso").innerHTML =
    `<option value="">Todos</option>` +
    pisos.map(p=>`<option>${p}</option>`).join("");

  document.getElementById("vista").innerHTML =
    `<option value="">Todas</option>` +
    vistas.map(v=>`<option>${v}</option>`).join("");

  document.getElementById("fractionsBox").innerHTML =
    dados.filter(d=>d.Empreendimento === "The View")
      .map(d=>`
        <label class="checkItem">
          <input type="checkbox" value="${d.Fração}" checked onchange="render()">
          ${d.Fração}
        </label>
      `).join("");

  const emp = [...new Set(dados.map(d=>d.Empreendimento))];

  document.getElementById("empreBox").innerHTML =
    emp.filter(e=>e !== "The View")
      .map(e=>`
        <label class="checkItem">
          <input type="checkbox" value="${e}" checked onchange="render()">
          ${e}
        </label>
      `).join("");
}

function getSelecionados(id){
  return [...document.querySelectorAll(`#${id} input:checked`)]
    .map(i=>i.value);
}

function resetFiltros(){
  document.getElementById("piso").value = "";
  document.getElementById("vista").value = "";
  document.querySelectorAll("input[type=checkbox]").forEach(i=>i.checked = true);
  render();
}

/* ================= RENDER ================= */

function render(){

  const piso = document.getElementById("piso").value;
  const vista = document.getElementById("vista").value;
  const fracs = getSelecionados("fractionsBox");

  let base = dados.filter(d => d.Empreendimento === "The View");

  if(piso) base = base.filter(d => d.Piso == piso);
  if(vista) base = base.filter(d => d.Vista == vista);
  if(fracs.length > 0) base = base.filter(d => fracs.includes(d.Fração));

  const grid = document.getElementById("grid");

  grid.innerHTML = base.map(f => {

    const abp = f["Área Bruta"] || f["ABP"] || "-";
    const varanda = f["Varanda"] || f["Varanda/Terraço"] || "-";

    return `
      <div class="card" onclick='abrir("${encodeURIComponent(JSON.stringify(f))}")'>
        <div class="badge">${f.Tipologia}</div>
        <div class="title">${f.Fração}</div>
        <div class="meta">Piso ${f.Piso} • ${f.Vista}</div>
        <div class="area">${abp} m² • Var ${varanda}</div>
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
  const varanda = f["Varanda"] || f["Varanda/Terraço"] || "-";
  const total = f["Área Total"] || f["Total"] || "-";

  const emps = getSelecionados("empreBox");

  const comps = dados.filter(d =>
    d.Empreendimento !== "The View" &&
    emps.includes(d.Empreendimento)
  );

  const grupos = classificarConcorrentes(f, comps);

  function renderLista(lista){
    if(!lista.length) return "<p>Nenhum</p>";

    return lista.map(c => {

      const cabp = c["Área Bruta"] || c["ABP"] || "-";
      const cvar = c["Varanda"] || c["Varanda/Terraço"] || "-";
      const ctot = c["Área Total"] || "-";

      return `
        <div class="compRow"
             onclick='event.stopPropagation(); abrirConcorrente("${encodeURIComponent(JSON.stringify(c))}")'>

          <div>
            <strong>${c.Empreendimento} - ${c.Fração}</strong><br>
            <small>${cabp} m² • Var ${cvar} • Total ${ctot}</small>
          </div>

          <div>${c.PVP.toLocaleString()}€</div>

        </div>
      `;
    }).join("");
  }

  document.getElementById("modalConteudo").innerHTML = `
    <div class="modalHeader">
      <h2>${f.Fração}</h2>
      <span class="closeBtn" onclick="fecharModal()">✕</span>
    </div>

    <div class="bigPrice">${f.PVP.toLocaleString()}€</div>

    <div class="areas">
      ABP ${abp} • Var ${varanda} • Total ${total}
    </div>

    <h3>Concorrência</h3>

    <div class="section">
      <b>Diretos (${grupos.diretos.length})</b>
      ${renderLista(grupos.diretos)}
    </div>

    <div class="section">
      <b>Indiretos (${grupos.indiretos.length})</b>
      ${renderLista(grupos.indiretos)}
    </div>

    <div class="section">
      <b>Pouco (${grupos.poucos.length})</b>
      ${renderLista(grupos.poucos)}
    </div>
  `;

  const modal = document.getElementById("modal");
  modal.style.display = "flex";
}

/* ================= FECHAR ================= */

function fecharModal(){
  document.getElementById("modal").style.display = "none";
}

/* ================= POPUP ================= */

function abrirConcorrente(encoded){

  const c = JSON.parse(decodeURIComponent(encoded));
  const f = fracaoAtual;

  const m2F = f.PVP / (f["Área Total"] || 1);
  const m2C = c.PVP / (c["Área Total"] || 1);

  let status = "similar";
  if(m2C < m2F) status = "melhor";
  if(m2C > m2F) status = "pior";

  const popup = document.getElementById("popup");

  popup.innerHTML = `
    <div class="popupCard">

      <div class="popupHeader">
        <b>${c.Empreendimento} - ${c.Fração}</b>
        <span onclick="fecharPopup()">✕</span>
      </div>

      <div class="compareGrid">

        <div>
          <small>The View</small><br>
          ${f.PVP.toLocaleString()}€<br>
          ${Math.round(m2F)} €/m²
        </div>

        <div>
          <small>Concorrente</small><br>
          ${c.PVP.toLocaleString()}€<br>
          ${Math.round(m2C)} €/m²
        </div>

      </div>

      <div class="highlight ${status}">
        ${
          status === "melhor" ? "🟢 Melhor oportunidade" :
          status === "pior" ? "🔴 Mais caro" :
          "⚪ Similar"
        }
      </div>

    </div>
  `;

  popup.style.display = "flex";
}

function fecharPopup(){
  document.getElementById("popup").style.display = "none";
}

/* ================= LÓGICA ================= */

function classificarConcorrentes(f, comps){

  const diretos = comps.filter(c =>
    c.Tipologia === f.Tipologia &&
    Number(c.Piso) === Number(f.Piso) &&
    c.Vista === f.Vista
  );

  const indiretos = comps.filter(c =>
    c.Tipologia === f.Tipologia &&
    Number(c.Piso) === Number(f.Piso)
  );

  const poucos = comps.filter(c =>
    c.Tipologia === f.Tipologia &&
    Math.abs(Number(c.Piso) - Number(f.Piso)) === 1
  );

  return {diretos, indiretos, poucos};
}
