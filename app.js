let data = [];

/* =========================
   LOAD EXCEL
========================= */
fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  initFiltros();
  trocarView("home");
});

/* =========================
   UTIL
========================= */

function toNumber(v){
  if(!v) return null;
  return parseFloat(v.toString().replace(",", "."));
}

function getAreas(o){
  const abp = toNumber(o["ABP"]);
  const varan = toNumber(o["Varanda/Terraço"]);
  const total = toNumber(o["Área Total"]) || ((abp||0)+(varan||0));
  return {abp,varan,total};
}

function getPricePerM2(o){
  const a=getAreas(o);
  if(!a.total || !o.PVP) return null;
  return o.PVP/a.total;
}

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function media(arr){
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

/* =========================
   VIEW CONTROL (UX)
========================= */

function trocarView(nome){

  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  document.getElementById("view-"+nome).classList.remove("hidden");

  if(nome==="home") renderHome();
  if(nome==="precos") renderPrecos();
  if(nome==="dashboard") renderDashboard();
  if(nome==="analise") render(); // motor original
}

/* =========================
   FILTROS
========================= */

function initFiltros(){

  const base=data.filter(d=>d.Empreendimento==="The View");
  const comps=data.filter(d=>d.Empreendimento!=="The View");

  piso.innerHTML=`<option value="">Todos</option>`+
    [...new Set(base.map(d=>d.Piso))].map(p=>`<option>${p}</option>`);

  vista.innerHTML=`<option value="">Todas</option>`+
    [...new Set(base.map(d=>d.Vista))].map(v=>`<option>${v}</option>`);

  fractionsBox.innerHTML=base.map(d=>
    `<label><input type="checkbox" value="${d["Fração"]}" onchange="render()"> ${d["Fração"]}</label>`
  ).join("");

  empreBox.innerHTML=[...new Set(comps.map(d=>d.Empreendimento))]
    .map(e=>`<label><input type="checkbox" checked value="${e}" onchange="render()"> ${e}</label>`)
    .join("");
}

function getChecked(id){
  return [...document.querySelectorAll(`#${id} input:checked`)].map(i=>i.value);
}

function resetFiltros(){
  piso.value="";
  vista.value="";
  document.querySelectorAll("#fractionsBox input").forEach(i=>i.checked=false);
  document.querySelectorAll("#empreBox input").forEach(i=>i.checked=true);
  render();
}

/* =========================
   HOME
========================= */

function renderHome(){

  const base=data.filter(d=>d.Empreendimento==="The View");

  document.getElementById("view-home").innerHTML=`
    <div class="card">
      <h2>Total de Frações</h2>
      <h1>${base.length}</h1>
      <p>Use o menu para navegar</p>
    </div>
  `;
}

/* =========================
   PREÇOS IDEAIS
========================= */

function renderPrecos(){

  const base=data.filter(d=>d.Empreendimento==="The View");
  const comp=data.filter(d=>d.Empreendimento!=="The View");

  let html="<h2>Preços Ideais</h2><div class='grid'>";

  base.forEach(ap=>{

    const areas=getAreas(ap);

    const avgM2 = comp.reduce((a,b)=>a+getPricePerM2(b),0)/comp.length;
    const ideal = avgM2 * areas.total;

    const diff = ((ap.PVP/ideal)-1)*100;

    html+=`
      <div class="card">
        <b>${ap["Fração"]}</b><br>
        Atual: ${ap.PVP.toLocaleString()}€<br>
        Ideal: ${ideal.toLocaleString()}€<br>
        <span class="${diff>0?'up':'down'}">${diff.toFixed(1)}%</span>
      </div>
    `;
  });

  html+="</div>";

  document.getElementById("view-precos").innerHTML=html;
}

/* =========================
   DASHBOARD
========================= */

function renderDashboard(){

  const comp=data.filter(d=>d.Empreendimento!=="The View");

  const avgM2 = comp.reduce((a,b)=>a+getPricePerM2(b),0)/comp.length;

  document.getElementById("view-dashboard").innerHTML=`
    <div class="card">Média Mercado: ${avgM2.toFixed(0)} €/m²</div>
    <div class="card">Concorrentes: ${comp.length}</div>
  `;
}

/* =========================
   ANALISE (CORE ORIGINAL)
========================= */

function render(){

  let base=data.filter(d=>d.Empreendimento==="The View");

  const p=piso.value;
  const v=vista.value;
  const m=getChecked("fractionsBox");
  const e=getChecked("empreBox");

  if(p) base=base.filter(d=>d.Piso==p);
  if(v) base=base.filter(d=>d.Vista==v);
  if(m.length) base=base.filter(d=>m.includes(d["Fração"]));

  const comp=data.filter(d=>e.includes(d.Empreendimento));

  const grid=document.getElementById("grid");
  grid.innerHTML="";

  base.forEach(ap=>{

    const areas=getAreas(ap);
    const m2=getPricePerM2(ap);
    const tip=mapTipologia(ap.Tipologia);

    const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
    const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);
    const pouco=comp.filter(c=>mapTipologia(c.Tipologia)===tip && Math.abs(c.Piso-ap.Piso)<=1);

    const dDir = direto.length ? ((ap.PVP/media(direto)-1)*100) : null;
    const dInd = indireto.length ? ((ap.PVP/media(indireto)-1)*100) : null;

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="badge">${ap.Tipologia}</div>
      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}

      <div class="small">
        ${areas.abp||"-"} m² • Var ${areas.varan||"-"} • Total ${areas.total||"-"}
      </div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>
      <div class="small">${m2?m2.toFixed(0):"-"} €/m²</div>

      ${dDir!==null?`<div class="${dDir>0?'up':'down'}">${dDir.toFixed(1)}% vs Diretos</div>`:""}
      ${dInd!==null?`<div class="${dInd>0?'up':'down'}">${dInd.toFixed(1)}% vs Indiretos</div>`:""}
    `;

    card.onclick=()=>abrirModal(ap, direto, indireto, pouco);

    grid.appendChild(card);
  });
}

/* =========================
   MODAL COMPLETO
========================= */

function abrirModal(ap, direto, indireto, pouco){

  const areas=getAreas(ap);
  const m2=getPricePerM2(ap);

  modal.style.display="block";
  modalTitulo.innerText=ap["Fração"];

  modalConteudo.innerHTML=`
    <p>${ap.Tipologia} • Piso ${ap.Piso} • Vista ${ap.Vista}</p>

    <p>
      ABP: ${areas.abp || "-"} m²<br>
      Varanda: ${areas.varan || "-"} m²<br>
      Total: ${areas.total || "-"} m²
    </p>

    <p><b>${ap.PVP.toLocaleString()}€</b> (${m2?m2.toFixed(0):"-"} €/m²)</p>

    ${sec("Diretos", direto, ap)}
    ${sec("Indiretos", indireto, ap)}
    ${sec("Pouco concorrente", pouco, ap)}
  `;
}

function sec(nome, arr, base){

  return `
    <div class="section">
      <div class="section-header" onclick="toggle(this)">
        ${nome} (${arr.length})
      </div>

      <div class="section-content">

        ${arr.length===0 ? "Nenhum encontrado" :

          arr.map(c=>{
            const diff=((base.PVP/c.PVP)-1)*100;
            return `
              <div class="comp" onclick="abrirConc(event, ${encodeURIComponent(JSON.stringify(c))})">
                ${c.Empreendimento} - ${c["Fração"]}
                <span>
                  ${c.PVP.toLocaleString()}€
                  (${diff.toFixed(1)}%)
                </span>
              </div>
            `;
          }).join("")
        }

      </div>
    </div>
  `;
}

/* =========================
   TOGGLE
========================= */

function toggle(el){
  const content = el.nextElementSibling;
  content.style.display = content.style.display === "none" ? "block" : "none";
}

/* =========================
   MODAL CONCORRENTE
========================= */

function abrirConc(e, obj){
  e.stopPropagation();

  const c = JSON.parse(decodeURIComponent(obj));
  const areas=getAreas(c);

  modalConc.style.display="block";
  concTitulo.innerText=c["Fração"];

  concConteudo.innerHTML=`
    <p>${c.Empreendimento}</p>
    <p>Piso ${c.Piso} • Vista ${c.Vista}</p>

    <p>
      ABP: ${areas.abp || "-"} m²<br>
      Varanda: ${areas.varan || "-"} m²<br>
      Total: ${areas.total || "-"} m²
    </p>

    <p><b>${c.PVP.toLocaleString()}€</b></p>
  `;
}

function fecharModal(){ modal.style.display="none"; }
function fecharConc(){ modalConc.style.display="none"; }
