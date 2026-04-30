let data=[];

fetch('data.xlsx')
.then(r=>r.arrayBuffer())
.then(b=>{
  const wb=XLSX.read(b,{type:"array"});
  const sheet=wb.Sheets[wb.SheetNames[0]];
  data=XLSX.utils.sheet_to_json(sheet);
  render();
});

/* ---------- AREAS ---------- */

function toNumber(v){
  if(!v) return null;
  return parseFloat(v.toString().replace(",", "."));
}

function getAreas(o){
  const abp=toNumber(o["ABP"]);
  const varan=toNumber(o["Varanda/Terraço"]);
  const totalExcel=toNumber(o["Área Total"]);

  let total= totalExcel || ((abp||0)+(varan||0));

  return { bruta:abp, varanda:varan, total };
}

function getPricePerM2(o){
  const a=getAreas(o);
  if(!a.total||!o.PVP) return null;
  return o.PVP/a.total;
}

/* ---------- CONFIG DINÂMICA ---------- */

function getConfig(){
  return {
    direto:{
      piso: parseInt(document.getElementById("cfg_direto_piso").value),
      vista: document.getElementById("cfg_direto_vista").checked
    },
    indireto:{
      piso: parseInt(document.getElementById("cfg_indireto_piso").value),
      vista:false
    },
    pouco:{
      piso: parseInt(document.getElementById("cfg_pouco_piso").value),
      vista:false
    }
  };
}

/* ---------- LOGICA ---------- */

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function getConc(ap,tipo){

  const cfg=getConfig()[tipo];
  const comp=data.filter(d=>d.Empreendimento!=="The View");
  const tip=mapTipologia(ap.Tipologia);

  return comp.filter(c=>{
    return mapTipologia(c.Tipologia)===tip &&
      Math.abs(c.Piso-ap.Piso)<=cfg.piso &&
      (cfg.vista ? c.Vista===ap.Vista : true);
  });
}

/* ---------- RENDER ---------- */

function render(){

  const base=data.filter(d=>d.Empreendimento==="The View");
  const grid=document.getElementById("grid");
  grid.innerHTML="";

  base.forEach(ap=>{

    const areas=getAreas(ap);
    const m2=getPricePerM2(ap);

    const direto=getConc(ap,"direto");
    const indireto=getConc(ap,"indireto");

    const avg = arr => arr.length?arr.reduce((a,b)=>a+b.PVP,0)/arr.length:null;

    const dDir = direto.length?((ap.PVP/avg(direto)-1)*100):null;
    const dInd = indireto.length?((ap.PVP/avg(indireto)-1)*100):null;

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="badge">${ap.Tipologia}</div>
      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}

      <div class="small">
        ${areas.bruta} m² • Var ${areas.varanda} • Total ${areas.total}
      </div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>
      <div class="small">${m2?m2.toFixed(0):"-"} €/m²</div>

      ${dDir!==null?`<div class="${dDir>0?'up':'down'}">${dDir.toFixed(1)}% Diretos</div>`:""}
      ${dInd!==null?`<div class="${dInd>0?'up':'down'}">${dInd.toFixed(1)}% Indiretos</div>`:""}
    `;

    card.onclick=()=>abrirModal(ap);
    grid.appendChild(card);
  });
}

/* ---------- MODAL ---------- */

function abrirModal(ap){

  const areas=getAreas(ap);
  const m2=getPricePerM2(ap);

  const direto=getConc(ap,"direto");
  const indireto=getConc(ap,"indireto");
  const pouco=getConc(ap,"pouco");

  const sec=(t,arr)=>`
    <div class="section">
      <b>${t} (${arr.length})</b>
      ${arr.map(c=>`
        <div class="comp">
          ${c.Empreendimento} - ${c["Fração"]}
          <span>${c.PVP.toLocaleString()}€</span>
        </div>
      `).join("")}
    </div>
  `;

  document.getElementById("modal").style.display="block";
  document.getElementById("modalTitulo").innerText=ap["Fração"];

  document.getElementById("modalConteudo").innerHTML=`
    <p>${ap.Tipologia} • Piso ${ap.Piso} • Vista ${ap.Vista}</p>

    <p>${areas.bruta} | Var ${areas.varanda} | Total ${areas.total}</p>

    <p><b>${ap.PVP.toLocaleString()}€</b> (${m2?m2.toFixed(0):"-"} €/m²)</p>

    ${sec("Diretos",direto)}
    ${sec("Indiretos",indireto)}
    ${sec("Pouco",pouco)}
  `;
}

function fecharModal(){
  document.getElementById("modal").style.display="none";
}
