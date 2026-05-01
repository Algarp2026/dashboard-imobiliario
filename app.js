let dados = [];
let fracaoAtual = null;

/* ================= LOAD ================= */

fetch("data.xlsx")
  .then(r => r.arrayBuffer())
  .then(ab => {
    const wb = XLSX.read(ab);
    const ws = wb.Sheets[wb.SheetNames[0]];
    dados = XLSX.utils.sheet_to_json(ws);

    initFiltros();
    render();
  });

/* ================= FILTROS ================= */

function initFiltros(){

  piso.innerHTML = `<option value="">Todos</option>` +
    [...new Set(dados.map(d=>d.Piso))].map(p=>`<option>${p}</option>`).join("");

  vista.innerHTML = `<option value="">Todas</option>` +
    [...new Set(dados.map(d=>d.Vista))].map(v=>`<option>${v}</option>`).join("");

  fractionsBox.innerHTML =
    dados.filter(d=>d.Empreendimento==="The View")
      .map(d=>`
        <label>
          <input type="checkbox" value="${d.Fração}" checked onchange="render()">
          ${d.Fração}
        </label>`).join("");

  empreBox.innerHTML =
    [...new Set(dados.map(d=>d.Empreendimento))]
      .filter(e=>e!=="The View")
      .map(e=>`
        <label>
          <input type="checkbox" value="${e}" checked onchange="render()">
          ${e}
        </label>`).join("");
}

function getSelecionados(id){
  return [...document.querySelectorAll(`#${id} input:checked`)].map(i=>i.value);
}

/* ================= RENDER ================= */

function render(){

  let base = dados.filter(d=>d.Empreendimento==="The View");

  if(piso.value) base = base.filter(d=>d.Piso==piso.value);
  if(vista.value) base = base.filter(d=>d.Vista==vista.value);

  const fracs = getSelecionados("fractionsBox");
  if(fracs.length) base = base.filter(d=>fracs.includes(d.Fração));

  grid.innerHTML = base.map(f=>{

    const id = `det-${f.Fração}`;

    return `
      <div class="card">

        <div onclick="toggle('${id}')">

          <div class="title">${f.Fração}</div>
          <div>${f["Área Total"]} m²</div>
          <div class="price">${f.PVP.toLocaleString()}€</div>

        </div>

        <div id="${id}" class="hidden">

          <button onclick='abrir("${encodeURIComponent(JSON.stringify(f))}")'>
            Ver análise
          </button>

        </div>

      </div>
    `;
  }).join("");
}

/* ================= TOGGLE ================= */

function toggle(id){
  const el = document.getElementById(id);
  el.classList.toggle("hidden");
}

/* ================= MODAL ================= */

function abrir(encoded){

  const f = JSON.parse(decodeURIComponent(encoded));
  fracaoAtual = f;

  const comps = dados.filter(d=>d.Empreendimento!=="The View");

  const g = classificar(f, comps);

  function lista(arr){
    return arr.map(c=>`
      <div class="comp"
           onclick='event.stopPropagation(); abrirConcorrente("${encodeURIComponent(JSON.stringify(c))}")'>
        ${c.Empreendimento} - ${c.Fração}
        <span>${c.PVP.toLocaleString()}€</span>
      </div>
    `).join("");
  }

  modalConteudo.innerHTML = `
    <h2>${f.Fração}</h2>

    <div class="bigPrice">${f.PVP.toLocaleString()}€</div>

    <h3>Diretos</h3>
    ${lista(g.d)}

    <h3>Indiretos</h3>
    ${lista(g.i)}

    <h3>Pouco</h3>
    ${lista(g.p)}
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
    <div class="popupBox" onclick="event.stopPropagation()">

      <h3>${c.Empreendimento}</h3>
      <p>${c.Fração}</p>
      <p>${c.PVP.toLocaleString()}€</p>

      <button onclick="fecharPopup()">Fechar</button>

    </div>
  `;

  popup.style.display = "flex";
}

function fecharPopup(){
  popup.style.display = "none";
}

/* ================= LÓGICA ================= */

function classificar(f, comps){
  return {
    d: comps.filter(c=>c.Tipologia===f.Tipologia && c.Piso==f.Piso && c.Vista===f.Vista),
    i: comps.filter(c=>c.Tipologia===f.Tipologia && c.Piso==f.Piso),
    p: comps.filter(c=>c.Tipologia===f.Tipologia && Math.abs(c.Piso-f.Piso)==1)
  };
}
