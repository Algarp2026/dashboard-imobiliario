let data = [];

fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  initFiltros();
  render();
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

/* ---------- FILTROS ---------- */

function initFiltros(){

  const base=data.filter(d=>d.Empreendimento==="The View");
  const comps=data.filter(d=>d.Empreendimento!=="The View");

  piso.innerHTML=`<option value="">Todos</option>`+
    [...new Set(base.map(d=>d.Piso))].map(p=>`<option>${p}</option>`);

  vista.innerHTML=`<option value="">Todas</option>`+
    [...new Set(base.map(d=>d.Vista))].map(v=>`<option>${v}</option>`);

  manual.innerHTML=base.map(d=>`<option value="${d["Fração"]}">${d["Fração"]}</option>`);

  empre.innerHTML=[...new Set(comps.map(d=>d.Empreendimento))]
    .map(e=>`<option selected>${e}</option>`);
}

/* ---------- RENDER ---------- */

function render(){

  let base=data.filter(d=>d.Empreendimento==="The View");

  const p=piso.value;
  const v=vista.value;
  const m=[...manual.selectedOptions].map(o=>o.value);
  const e=[...empre.selectedOptions].map(o=>o.value);

  if(p) base=base.filter(d=>d.Piso==p);
  if(v) base=base.filter(d=>d.Vista==v);
  if(m.length) base=base.filter(d=>m.includes(d["Fração"]));

  const comp=data.filter(d=>e.includes(d.Empreendimento));

  grid.innerHTML="";

  base.forEach(ap=>{

    const areas=getAreas(ap);
    const m2=getPricePerM2(ap);
    const tip=mapTipologia(ap.Tipologia);

    const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
    const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);

    const dDir = direto.length ? ((ap.PVP/media(direto)-1)*100) : null;
    const dInd = indireto.length ? ((ap.PVP/media(indireto)-1)*100) : null;

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="badge">${ap.Tipologia}</div>
      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}

      <div class="small">
        ${areas.abp} m² • Var ${areas.varan} • Total ${areas.total}
      </div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>
      <div class="small">${m2?m2.toFixed(0):"-"} €/m²</div>

      ${dDir!==null?`<div class="${dDir>0?'up':'down'}">${dDir.toFixed(1)}% Diretos</div>`:""}
      ${dInd!==null?`<div class="${dInd>0?'up':'down'}">${dInd.toFixed(1)}% Indiretos</div>`:""}
    `;

    card.onclick=()=>abrirModal(ap,comp);

    grid.appendChild(card);
  });
}

/* ---------- MODAL ---------- */

function abrirModal(ap, comp){

  const areas=getAreas(ap);
  const m2=getPricePerM2(ap);
  const tip=mapTipologia(ap.Tipologia);

  const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
  const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);
  const pouco=comp.filter(c=>mapTipologia(c.Tipologia)===tip && Math.abs(c.Piso-ap.Piso)<=1);

  const avgM2 = comp.length
    ? comp.reduce((a,b)=>a+getPricePerM2(b),0)/comp.length
    : null;

  const precoIdeal = avgM2 ? avgM2 * areas.total : null;

  modal.style.display="block";
  modalTitulo.innerText=ap["Fração"];

  modalConteudo.innerHTML=`
    <p>${ap.Tipologia} • Piso ${ap.Piso} • Vista ${ap.Vista}</p>

    <p>${areas.total} m²</p>

    <p><b>${ap.PVP.toLocaleString()}€</b> (${m2?m2.toFixed(0):"-"} €/m²)</p>

    <h4>Preço Ideal</h4>
    <p>${precoIdeal?precoIdeal.toLocaleString()+"€":"-"}</p>

    <p style="font-size:12px;color:#666;">
      Fórmula: média €/m² (${avgM2?.toFixed(0)}) × área (${areas.total})
    </p>

    ${sec("Diretos",direto,ap.PVP,"d")}
    ${sec("Indiretos",indireto,ap.PVP,"i")}
    ${sec("Pouco",pouco,ap.PVP,"p")}
  `;
}

function sec(t,arr,base,id){
  return `
    <div class="section">
      <div class="section-header" onclick="toggle('${id}')">${t} (${arr.length})</div>
      <div id="${id}">
        ${arr.map(c=>{
          const dif=((base/c.PVP-1)*100);
          return `
            <div class="comp" onclick='abrirConc(${JSON.stringify(c)})'>
              <span>${c.Empreendimento} - ${c["Fração"]}</span>
              <span>${c.PVP.toLocaleString()}€ (${dif.toFixed(1)}%)</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function toggle(id){
  document.getElementById(id).classList.toggle("hidden");
}

/* ---------- CONCORRENTE ---------- */

function abrirConc(c){

  const areas=getAreas(c);
  const m2=getPricePerM2(c);

  modalConc.style.display="block";
  concTitulo.innerText=c["Fração"];

  concConteudo.innerHTML=`
    <p><b>${c.Empreendimento}</b></p>
    <p>${c.Tipologia} • Piso ${c.Piso} • Vista ${c.Vista}</p>

    <p>${areas.total} m²</p>

    <p><b>${c.PVP.toLocaleString()}€</b> (${m2?m2.toFixed(0):"-"} €/m²)</p>
  `;
}

/* ---------- CLOSE ---------- */

function fecharModal(){ modal.style.display="none"; }
function fecharConc(){ modalConc.style.display="none"; }
