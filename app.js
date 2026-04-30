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
  const emps = getSelecionados("empreBox");

  let base = dados.filter(d => d.Empreendimento === "The View");

  if(piso) base = base.filter(d => d.Piso == piso);
  if(vista) base = base.filter(d => d.Vista == vista);
  if(fracs.length > 0) base = base.filter(d => fracs.includes(d.Fração));

  const grid = document.getElementById("grid");

  if(!base.length){
    grid.innerHTML = `<p style="padding:20px">Nenhum resultado com os filtros atuais.</p>`;
    return;
  }

  grid.innerHTML = base.map(f => {

    const abp = f["Área Bruta"] || f["ABP"] || "-";
    const varanda = f["Varanda"] || f["Varanda/Terraço"] || "-";

    const comps = dados.filter(d =>
      d.Empreendimento !== "The View" &&
      emps.includes(d.Empreendimento)
    );

    const mediaComp = comps.length ? media(comps) : f.PVP;
    const diff = ((f.PVP - mediaComp) / mediaComp) * 100;

    return `
      <div class="card" onclick='abrir("${encodeURIComponent(JSON.stringify(f))}")'>

        <div class="badge">${f.Tipologia}</div>
        <div class="title">${f.Fração}</div>
        <div class="meta">Piso ${f.Piso} • Vista ${f.Vista}</div>

        <div class="area">
          ${abp} m² • Varanda ${varanda} m²
        </div>

        <div class="price">${f.PVP.toLocaleString()}€</div>

        <div class="delta ${diff>0?'up':'down'}">
          ${diff.toFixed(1)}%
        </div>

      </div>
    `;
  }).join("");
}

/* ================= MODAL PRINCIPAL ================= */

function abrir(encoded){

  const f = JSON.parse(decodeURIComponent(encoded));

  const abp = f["Área Bruta"] || f["ABP"] || "-";
  const varanda = f["Varanda"] || f["Varanda/Terraço"] || "-";
  const total = f["Área Total"] || f["Total"] || "-";

  const emps = getSelecionados("empreBox");

  const comps = dados.filter(d =>
    d.Empreendimento !== "The View" &&
    emps.includes(d.Empreendimento)
  );

  const grupos = classificarConcorrentes(f, comps);

  const fallback = precoFallback(f, grupos);
  const rigoroso = precoRigoroso(grupos);
  const ia = calcularPrecoIA(f, grupos);

  function renderLista(lista){
    if(!lista.length) return "<p>Nenhum encontrado</p>";

    return lista.map(c => {

      const cabp = c["Área Bruta"] || c["ABP"] || "-";
      const cvar = c["Varanda"] || c["Varanda/Terraço"] || "-";

      const diff = ((f.PVP - c.PVP) / c.PVP) * 100;

      return `
        <div class="compRow" 
             onclick='event.stopPropagation(); abrirConcorrente("${encodeURIComponent(JSON.stringify(c))}")'>

          <div>
            <strong>${c.Empreendimento} - ${c.Fração}</strong><br>
            <small>${cabp} m² • Varanda ${cvar} m²</small>
          </div>

          <div>${c.PVP.toLocaleString()}€</div>

          <div class="${diff>0?'up':'down'}">
            ${diff.toFixed(1)}%
          </div>

        </div>
      `;
    }).join("");
  }

  document.getElementById("modalTitulo").innerText = f.Fração;

  document.getElementById("modalConteudo").innerHTML = `
    <div class="bigPrice">${f.PVP.toLocaleString()}€</div>

    <div class="areas">
      ABP: ${abp} m² |
      Varanda: ${varanda} m² |
      Total: ${total} m²
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
      <div class="section-header" onclick="toggle(this)">🔴 Diretos (${grupos.diretos.length})</div>
      <div class="section-body">${renderLista(grupos.diretos)}</div>
    </div>

    <div class="section">
      <div class="section-header" onclick="toggle(this)">🟠 Indiretos (${grupos.indiretos.length})</div>
      <div class="section-body">${renderLista(grupos.indiretos)}</div>
    </div>

    <div class="section">
      <div class="section-header" onclick="toggle(this)">🟡 Pouco (${grupos.poucos.length})</div>
      <div class="section-body">${renderLista(grupos.poucos)}</div>
    </div>
  `;

  document.getElementById("modal").style.display = "block";
}

/* ================= POPUP CONCORRENTE ================= */

function abrirConcorrente(encoded){

  const c = JSON.parse(decodeURIComponent(encoded));

  const abp = c["Área Bruta"] || c["ABP"] || "-";
  const varanda = c["Varanda"] || c["Varanda/Terraço"] || "-";
  const total = c["Área Total"] || c["Total"] || "-";

  alert(
`${c.Empreendimento} - ${c.Fração}

Preço: ${c.PVP.toLocaleString()}€

ABP: ${abp} m²
Varanda: ${varanda} m²
Total: ${total} m²`
  );
}

/* ================= RESTO ================= */

function fecharModal(){
  document.getElementById("modal").style.display = "none";
}

function toggle(el){
  const body = el.nextElementSibling;
  body.style.display = body.style.display === "block" ? "none" : "block";
}

function classificarConcorrentes(f, comps){

  const diretos = comps.filter(c =>
    c.Tipologia === f.Tipologia &&
    Number(c.Piso) === Number(f.Piso) &&
    c.Vista === f.Vista
  );

  const indiretos = comps.filter(c =>
    c.Tipologia === f.Tipologia &&
    Number(c.Piso) === Number(f.Piso) &&
    c.Vista !== f.Vista
  );

  const poucos = comps.filter(c =>
    c.Tipologia === f.Tipologia &&
    Math.abs(Number(c.Piso) - Number(f.Piso)) === 1
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

  let total = 0, peso = 0;

  if(g.diretos.length){ total += media(g.diretos)*0.6; peso+=0.6; }
  if(g.indiretos.length){ total += media(g.indiretos)*0.3; peso+=0.3; }
  if(g.poucos.length){ total += media(g.poucos)*0.1; peso+=0.1; }

  return peso ? total/peso : 0;
}

function calcularPrecoIA(f, g){

  const area = f["Área Total"];
  if(!area) return {valor:f.PVP, exp:"Sem área"};

  let lista = [];

  const push = (c,p)=>{
    if(c["Área Total"]) lista.push({v:c.PVP/c["Área Total"], p});
  };

  g.diretos.forEach(c=>push(c,1));
  g.indiretos.forEach(c=>push(c,0.8));
  g.poucos.forEach(c=>push(c,0.6));

  if(!lista.length) return {valor:f.PVP, exp:"Sem dados"};

  lista.sort((a,b)=>a.v-b.v);

  const corte = Math.floor(lista.length*0.1);
  lista = lista.slice(corte, lista.length-corte);

  let soma=0, peso=0;
  lista.forEach(i=>{ soma+=i.v*i.p; peso+=i.p; });

  const m2 = soma/peso;
  const preco = m2*1.1*area;

  return {
    valor: Math.round(preco),
    exp: `€/m² (${Math.round(m2)}) + ajuste`
  };
}
