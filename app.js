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

function getAreas(obj){
  const abp = toNumber(obj["ABP"]);
  const varanda = toNumber(obj["Varanda/Terraço"]);
  const totalExcel = toNumber(obj["Área Total"]);

  let total = totalExcel || ((abp||0)+(varanda||0));

  return { bruta:abp, varanda:varanda, total };
}

function getPricePerM2(obj){
  const a = getAreas(obj);
  if(!a.total || !obj.PVP) return null;
  return obj.PVP / a.total;
}

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function media(arr){
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

/* ---------- FILTROS ---------- */

function initFiltros(){

  const base = data.filter(d=>d.Empreendimento==="The View");

  const pisos = [...new Set(base.map(d=>d.Piso))];
  const vistas = [...new Set(base.map(d=>d.Vista))];

  const selPiso = document.getElementById("piso");
  const selVista = document.getElementById("vista");
  const selManual = document.getElementById("manual");

  selPiso.innerHTML = `<option value="">Piso</option>` + pisos.map(p=>`<option>${p}</option>`).join("");
  selVista.innerHTML = `<option value="">Vista</option>` + vistas.map(v=>`<option>${v}</option>`).join("");

  selManual.innerHTML = base.map(d=>`<option value="${d["Fração"]}">${d["Fração"]}</option>`).join("");
}

/* ---------- RENDER ---------- */

function render(){

  const modo = document.getElementById("modo").value;

  document.getElementById("manual").style.display = modo==="manual" ? "block":"none";

  let base = data.filter(d=>d.Empreendimento==="The View");

  if(modo==="piso"){
    const piso = document.getElementById("piso").value;
    base = base.filter(d=>d.Piso==piso);
  }

  if(modo==="vista"){
    const vista = document.getElementById("vista").value;
    base = base.filter(d=>d.Vista==vista);
  }

  if(modo==="manual"){
    const selected = [...document.getElementById("manual").selectedOptions].map(o=>o.value);
    base = base.filter(d=>selected.includes(d["Fração"]));
  }

  const comp = data.filter(d=>d.Empreendimento!=="The View");

  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  base.forEach(ap=>{

    const areas = getAreas(ap);
    const m2 = getPricePerM2(ap);
    const tip = mapTipologia(ap.Tipologia);

    const direto = comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
    const indireto = comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);

    const dDir = direto.length ? ((ap.PVP/media(direto)-1)*100) : null;
    const dInd = indireto.length ? ((ap.PVP/media(indireto)-1)*100) : null;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="badge">${ap.Tipologia}</div>
      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}

      <div class="small">
        ${areas.bruta ?? "-"} m² • 
        Varanda ${areas.varanda ?? "-"} • 
        Total ${areas.total ?? "-"}
      </div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>
      <div class="small">${m2 ? m2.toFixed(0) : "-"} €/m²</div>

      ${dDir!==null ? `<div class="${dDir>0?'up':'down'}">${dDir.toFixed(1)}% Diretos</div>`:""}
      ${dInd!==null ? `<div class="${dInd>0?'up':'down'}">${dInd.toFixed(1)}% Indiretos</div>`:""}
    `;

    card.onclick = ()=>abrirModal(ap);
    grid.appendChild(card);
  });
}

/* ---------- MODAL ---------- */

function abrirModal(ap){

  const areas = getAreas(ap);
  const m2 = getPricePerM2(ap);

  const comp = data.filter(d=>d.Empreendimento!=="The View");
  const tip = mapTipologia(ap.Tipologia);

  const direto = comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
  const indireto = comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);
  const pouco = comp.filter(c=>mapTipologia(c.Tipologia)===tip && Math.abs(c.Piso-ap.Piso)<=1);

  document.getElementById("modal").style.display="block";
  document.getElementById("modalTitulo").innerText=ap["Fração"];

  document.getElementById("modalConteudo").innerHTML=`
    <p>${ap.Tipologia} • Piso ${ap.Piso} • Vista ${ap.Vista}</p>

    <p>${areas.bruta} | Var ${areas.varanda} | Total ${areas.total}</p>

    <p><b>${ap.PVP.toLocaleString()}€</b> (${m2?m2.toFixed(0):"-"} €/m²)</p>

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
          const dif = ((base/c.PVP-1)*100);
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

  const areas = getAreas(c);
  const m2 = getPricePerM2(c);

  document.getElementById("modalConc").style.display="block";
  document.getElementById("concTitulo").innerText=c["Fração"];

  document.getElementById("concConteudo").innerHTML=`
    <p><b>${c.Empreendimento}</b></p>
    <p>${c.Tipologia} • Piso ${c.Piso} • Vista ${c.Vista}</p>

    <p>${areas.bruta} | Var ${areas.varanda} | Total ${areas.total}</p>

    <p><b>${c.PVP.toLocaleString()}€</b> (${m2?m2.toFixed(0):"-"} €/m²)</p>
  `;
}

/* ---------- CLOSE ---------- */

function fecharModal(){
  document.getElementById("modal").style.display="none";
}

function fecharConc(){
  document.getElementById("modalConc").style.display="none";
}
