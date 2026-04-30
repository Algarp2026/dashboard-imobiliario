let dados = [];

fetch("data.xlsx")
  .then(res => res.arrayBuffer())
  .then(ab => {
    const wb = XLSX.read(ab);
    const ws = wb.Sheets[wb.SheetNames[0]];
    dados = XLSX.utils.sheet_to_json(ws);

    initFiltros();
    render();
  });

function initFiltros(){
  const pisos = [...new Set(dados.map(d=>d.Piso))];
  const vistas = [...new Set(dados.map(d=>d.Vista))];

  document.getElementById("piso").innerHTML =
    `<option value="">Todos</option>` +
    pisos.map(p=>`<option>${p}</option>`).join("");

  document.getElementById("vista").innerHTML =
    `<option value="">Todas</option>` +
    vistas.map(v=>`<option>${v}</option>`).join("");

  // FRAÇÕES
  const fracBox = document.getElementById("fractionsBox");
  fracBox.innerHTML = dados
    .filter(d=>d.Empreendimento==="The View")
    .map(d=>`
      <label class="checkItem">
        <input type="checkbox" value="${d.Fração}" checked onchange="render()">
        ${d.Fração}
      </label>
    `).join("");

  // EMPREENDIMENTOS
  const emp = [...new Set(dados.map(d=>d.Empreendimento))];

  const empBox = document.getElementById("empreBox");
  empBox.innerHTML = emp
    .filter(e=>e!=="The View")
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
  document.getElementById("piso").value="";
  document.getElementById("vista").value="";

  document.querySelectorAll("input[type=checkbox]").forEach(i=>i.checked=true);

  render();
}

function render(){

  const piso = document.getElementById("piso").value;
  const vista = document.getElementById("vista").value;
  const fracs = getSelecionados("fractionsBox");
  const emps = getSelecionados("empreBox");

  let base = dados.filter(d=>d.Empreendimento==="The View");

  if(piso) base = base.filter(d=>d.Piso==piso);
  if(vista) base = base.filter(d=>d.Vista==vista);
  if(fracs.length) base = base.filter(d=>fracs.includes(d.Fração));

  const grid = document.getElementById("grid");

  grid.innerHTML = base.map(f=>{

    const comps = dados.filter(d=>
      d.Empreendimento!=="The View" &&
      emps.includes(d.Empreendimento)
    );

    const media = mediaPreco(f, comps);

    const diff = ((f.PVP-media)/media)*100;

    return `
      <div class="card" onclick='abrir(${JSON.stringify(f)})'>

        <div class="badge">${f.Tipologia}</div>
        <div class="title">${f.Fração}</div>
        <div class="meta">Piso ${f.Piso} • Vista ${f.Vista}</div>

        <div class="area">
          ${f["Área Bruta"] || "-"} m² • Varanda ${f["Varanda"] || "-"} m²
        </div>

        <div class="price">
          ${f.PVP.toLocaleString()}€
        </div>

        <div class="delta ${diff>0?'up':'down'}">
          ${diff.toFixed(1)}%
        </div>

      </div>
    `;
  }).join("");
}

function mediaPreco(f, comps){
  const list = comps.map(c=>c.PVP);
  if(!list.length) return f.PVP;

  return list.reduce((a,b)=>a+b,0)/list.length;
}

function abrir(f){

  const comps = dados.filter(d=>d.Empreendimento!=="The View");

  const {precoIA, explicacao} = calcularPrecoIA(f, comps);

  document.getElementById("modalTitulo").innerText = f.Fração;

  document.getElementById("modalConteudo").innerHTML = `
    <div class="bigPrice">${f.PVP.toLocaleString()}€</div>

    <div class="areas">
      ABP: ${f["Área Bruta"] || "-"} m² |
      Varanda: ${f["Varanda"] || "-"} m² |
      Total: ${f["Área Total"] || "-"} m²
    </div>

    <div class="pricingGrid">

      <div class="priceBox green">
        <div class="label">Preço IA</div>
        <div class="value">${precoIA.toLocaleString()}€</div>
        <div class="desc">${explicacao}</div>
      </div>

    </div>

  `;

  document.getElementById("modal").style.display="block";
}

function fecharModal(){
  document.getElementById("modal").style.display="none";
}

/* ================= IA ================= */

function calcularPrecoIA(f, comps){

  const area = f["Área Total"];
  if(!area) return {precoIA:f.PVP, explicacao:"Sem área disponível"};

  let lista = comps.map(c=>{
    const a = c["Área Total"];
    if(!a) return null;
    return c.PVP / a;
  }).filter(Boolean);

  if(!lista.length){
    return {
      precoIA:f.PVP,
      explicacao:"Sem concorrentes válidos"
    };
  }

  // remover outliers (10%)
  lista.sort((a,b)=>a-b);
  const corte = Math.floor(lista.length*0.1);
  lista = lista.slice(corte, lista.length-corte);

  const media = lista.reduce((a,b)=>a+b,0)/lista.length;

  const ajustePremium = 1.15;

  const precoIA = media * ajustePremium * area;

  return {
    precoIA: Math.round(precoIA),
    explicacao:
      `Baseado em €/m² (${Math.round(media)}€/m²), removendo extremos, ` +
      `+ ajuste premium de 15%`
  };
}
