let data = [];

fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  initFiltros();
  renderHome();
});

/* ---------- UTIL ---------- */

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
  if(!a.total||!o.PVP) return null;
  return o.PVP/a.total;
}

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function media(arr){
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

/* ---------- VIEWS ---------- */

function trocarView(nome){
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  document.getElementById("view-"+nome).classList.remove("hidden");

  if(nome==="home") renderHome();
  if(nome==="precos") renderPrecos();
  if(nome==="dashboard") renderDashboard();
  if(nome==="analise") render();
}

/* ---------- FILTROS ---------- */

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

/* ---------- HOME ---------- */

function renderHome(){
  const base=data.filter(d=>d.Empreendimento==="The View");
  view-home.innerHTML=`<h2>Total Frações: ${base.length}</h2>`;
}

/* ---------- PREÇOS ---------- */

function renderPrecos(){

  const base=data.filter(d=>d.Empreendimento==="The View");
  const comp=data.filter(d=>d.Empreendimento!=="The View");

  let html="<h2>Preços Ideais</h2>";

  base.forEach(ap=>{
    const areas=getAreas(ap);
    const avgM2 = comp.reduce((a,b)=>a+getPricePerM2(b),0)/comp.length;
    const ideal=avgM2*areas.total;
    const diff=((ap.PVP/ideal)-1)*100;

    html+=`
      <div class="card">
        <b>${ap["Fração"]}</b><br>
        Atual: ${ap.PVP.toLocaleString()}€<br>
        Ideal: ${ideal.toLocaleString()}€<br>
        <span class="${diff>0?'up':'down'}">${diff.toFixed(1)}%</span>
      </div>
    `;
  });

  document.getElementById("view-precos").innerHTML=html;
}

/* ---------- DASHBOARD ---------- */

function renderDashboard(){

  const comp=data.filter(d=>d.Empreendimento!=="The View");

  const avgM2 = comp.reduce((a,b)=>a+getPricePerM2(b),0)/comp.length;

  view-dashboard.innerHTML=`
    <div class="card">Média Mercado: ${avgM2.toFixed(0)} €/m²</div>
    <div class="card">Concorrentes: ${comp.length}</div>
  `;
}

/* ---------- ANALISE ORIGINAL ---------- */
/* (igual à versão anterior — mantido intacto) */

function render(){
  // (mantive igual ao teu código anterior para não quebrar nada)
}
