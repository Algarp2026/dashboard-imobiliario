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
    dados.filter(d=>d.Empreendimento==="The View")
      .map(d=>`
        <label class="checkItem">
          <input type="checkbox" value="${d.Fração}" checked onchange="render()">
          ${d.Fração}
        </label>
      `).join("");

  const emp = [...new Set(dados.map(d=>d.Empreendimento))];

  document.getElementById("empreBox").innerHTML =
    emp.filter(e=>e!=="The View")
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

/* ================= RENDER ================= */

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

    const media = media(comps);
    const diff = media ? ((f.PVP-media)/media)*100 : 0;

    return `
      <div class="card" onclick='abrir(${JSON.stringify(f)})'>

        <div class="badge">${f.Tipologia}</div>
        <div class="title">${f.Fração}</div>
        <div class="meta">Piso ${f.Piso} • Vista ${f.Vista}</div>

        <div class="area">
          ${f["Área Bruta"] || "-"} m² • Varanda ${f["Varanda"] || "-"} m²
        </div>

        <div class="price">${f.PVP.toLocaleString()}€</div>

        <div class="delta ${diff>0?'up':'down'}">
          ${diff.toFixed(1)}%
        </div>

      </div>
    `;
  }).join("");
}

/* ================= MODAL ================= */

function abrir(f){

  const emps = getSelecionados("empreBox");

  const comps = dados.filter(d=>
    d.Empreendimento!=="The View" &&
    emps.includes(d.Empreendimento)
  );

  const grupos = classificarConcorrentes(f, comps);

  const fallback = precoFallback(f, grupos);
  const rigoroso = precoRigoroso(grupos);
  const ia = calcularPrecoIA(f, grupos);

  function renderLista(lista){
    if(!lista.length) return "<p>Nenhum encontrado</p>";

    return lista.map(c=>{
      const diff = ((f.PVP - c.PVP)/c.PVP)*100;

      return `
        <div class="compRow">
          <span>${c.Empreendimento} - ${c.Fração}</span>
          <span>${c.PVP.toLocaleString()}€</span>
          <span class="${diff>0?'up':'down'}">
            ${diff.toFixed(1)}%
          </span>
        </div>
      `;
    }).join("");
  }

  document.getElementById("modalTitulo").innerText = f.Fração;

  document.getElementById("modalConteudo").innerHTML = `
    <div class="bigPrice">${f.PVP.toLocaleString()}€</div>

    <div class="areas">
      ABP: ${f["Área Bruta"] || "-"} m² |
      Varanda: ${f["Varanda"] || "-"} m² |
      Total: ${f["Área Total"] || "-"} m²
    </div>

    <div class="pricingGrid">

      <div class="priceBox blue">
        <div class="label">Fallback</div>
        <div class="value">${Math.round(fallback).toLocaleString()}€</div>
      </div>

      <div class="priceBox purple">
        <div class="label">Rigoroso</div>
        <div class="value">${Math.round(rigoroso).toLocaleString()}€</div>
      </div>

      <div class="priceBox green">
        <div class="label">Preço IA</div>
        <div class="value">${ia.valor.toLocaleString()}€</div>
        <div class="desc">${ia.exp}</div>
      </div>

    </div>

    <div class="section">
      <div class="section-header" onclick="toggle(this)">
        🔴 Diretos (${grupos.diretos.length})
      </div>
      <div class="section-body">${renderLista(grupos.diretos)}</div>
    </div>

    <div class="section">
      <div class="section-header" onclick="toggle(this)">
        🟠 Indiretos (${grupos.indiretos.length})
      </div>
      <div class="section-body">${renderLista(grupos.indiretos)}</div>
    </div>

    <div class="section">
      <div class="section-header" onclick="toggle(this)">
        🟡 Pouco concorrente (${grupos.poucos.length})
      </div>
      <div class="section-body">${renderLista(grupos.poucos)}</div>
    </div>
  `;

  document.getElementById("modal").style.display="block";
}

function fecharModal(){
  document.getElementById("modal").style.display="none";
}

function toggle(el){
  const body = el.nextElementSibling;
  body.style.display = body.style.display === "block" ? "none" : "block";
}

/* ================= LÓGICA ================= */

function classificarConcorrentes(f, comps){

  const diretos = comps.filter(c =>
    c.Tipologia === f.Tipologia &&
    c.Piso == f.Piso &&
    c.Vista == f.Vista
  );

  const indiretos = comps.filter(c =>
    c.Tipologia === f.Tipologia &&
    (c.Piso != f.Piso || c.Vista != f.Vista)
  );

  const poucos = comps.filter(c =>
    c.Tipologia !== f.Tipologia
  );

  return {diretos, indiretos, poucos};
}

function media(lista){
  if(!lista.length) return 0;
  return lista.reduce((a,b)=>a+b.PVP,0)/lista.length;
}

function precoFallback(f, g){

  if(g.diretos.length) return media(g.diretos);
  if(g.indiretos.length) return media(g.indiretos);
  if(g.poucos.length) return media(g.poucos);

  return f.PVP;
}

function precoRigoroso(g){

  let total = 0;
  let peso = 0;

  if(g.diretos.length){
    total += media(g.diretos) * 0.6;
    peso += 0.6;
  }

  if(g.indiretos.length){
    total += media(g.indiretos) * 0.3;
    peso += 0.3;
  }

  if(g.poucos.length){
    total += media(g.poucos) * 0.1;
    peso += 0.1;
  }

  if(!peso) return 0;

  return total / peso;
}

function calcularPrecoIA(f, g){

  const area = f["Área Total"];
  if(!area) return {valor:f.PVP, exp:"Sem área"};

  let lista = [];

  g.diretos.forEach(c=>{
    if(c["Área Total"]) lista.push((c.PVP/c["Área Total"])*1.0);
  });

  g.indiretos.forEach(c=>{
    if(c["Área Total"]) lista.push((c.PVP/c["Área Total"])*0.7);
  });

  g.poucos.forEach(c=>{
    if(c["Área Total"]) lista.push((c.PVP/c["Área Total"])*0.4);
  });

  if(!lista.length){
    return {valor:f.PVP, exp:"Sem dados suficientes"};
  }

  lista.sort((a,b)=>a-b);

  const corte = Math.floor(lista.length*0.1);
  lista = lista.slice(corte, lista.length-corte);

  const media = lista.reduce((a,b)=>a+b,0)/lista.length;

  const preco = media * 1.15 * area;

  return {
    valor: Math.round(preco),
    exp: `€/m² (${Math.round(media)}€/m²) + pesos + premium 15%`
  };
}
