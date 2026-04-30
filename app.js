let data=[];

fetch('data.xlsx')
.then(r=>r.arrayBuffer())
.then(b=>{
  const wb=XLSX.read(b,{type:"array"});
  const sheet=wb.Sheets[wb.SheetNames[0]];
  data=XLSX.utils.sheet_to_json(sheet);
  initFiltros();
  render();
});

/* ---------- UTIL ---------- */

const num = v => v ? parseFloat(v.toString().replace(",",".")) : null;

function getAreas(o){
  const abp=num(o["ABP"]);
  const varan=num(o["Varanda/Terraço"]);
  const total=num(o["Área Total"]) || ((abp||0)+(varan||0));
  return {abp,varan,total};
}

function m2(o){
  const a=getAreas(o);
  return (a.total && o.PVP)?o.PVP/a.total:null;
}

function mapT(t){ return (t==="T1+1"||t==="T1 Duplex")?"T2":t; }

/* ---------- FILTROS ---------- */

function initFiltros(){

  const base=data.filter(d=>d.Empreendimento==="The View");
  const comps=data.filter(d=>d.Empreendimento!=="The View");

  document.getElementById("piso").innerHTML =
    `<option value="">Todos</option>`+
    [...new Set(base.map(d=>d.Piso))].map(p=>`<option>${p}</option>`);

  document.getElementById("vista").innerHTML =
    `<option value="">Todas</option>`+
    [...new Set(base.map(d=>d.Vista))].map(v=>`<option>${v}</option>`);

  document.getElementById("manual").innerHTML =
    base.map(d=>`<option value="${d["Fração"]}">${d["Fração"]}</option>`);

  document.getElementById("empre").innerHTML =
    [...new Set(comps.map(d=>d.Empreendimento))]
      .map(e=>`<option selected>${e}</option>`);
}

/* ---------- RENDER ---------- */

function render(){

  let base=data.filter(d=>d.Empreendimento==="The View");

  const piso=document.getElementById("piso").value;
  const vista=document.getElementById("vista").value;
  const manual=[...document.getElementById("manual").selectedOptions].map(o=>o.value);
  const empre=[...document.getElementById("empre").selectedOptions].map(o=>o.value);

  if(piso) base=base.filter(d=>d.Piso==piso);
  if(vista) base=base.filter(d=>d.Vista==vista);
  if(manual.length) base=base.filter(d=>manual.includes(d["Fração"]));

  const comp=data.filter(d=>empre.includes(d.Empreendimento));

  const grid=document.getElementById("grid");
  grid.innerHTML="";

  base.forEach(ap=>{

    const areas=getAreas(ap);
    const priceM2=m2(ap);

    const tip=mapT(ap.Tipologia);

    const concorrentes=comp.filter(c=>mapT(c.Tipologia)===tip);

    const avgM2 = concorrentes.length
      ? concorrentes.reduce((a,b)=>a+m2(b),0)/concorrentes.length
      : null;

    const precoIdeal = avgM2 ? avgM2 * areas.total : null;

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <b>${ap["Fração"]}</b><br>
      ${ap.Tipologia} • Piso ${ap.Piso}

      <div class="small">${areas.total} m²</div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>

      <div class="small">${priceM2?priceM2.toFixed(0):"-"} €/m²</div>

      ${precoIdeal ? `<div class="small">Ideal: ${precoIdeal.toLocaleString()}€</div>`:""}
    `;

    card.onclick=()=>abrirModal(ap, concorrentes, avgM2, precoIdeal);

    grid.appendChild(card);
  });
}

/* ---------- MODAL ---------- */

function abrirModal(ap, concorrentes, avgM2, precoIdeal){

  const areas=getAreas(ap);

  document.getElementById("modal").style.display="block";
  document.getElementById("modalTitulo").innerText=ap["Fração"];

  document.getElementById("modalConteudo").innerHTML=`

    <p><b>${ap.PVP.toLocaleString()}€</b></p>

    <p>${areas.total} m²</p>

    <h4>Preço Ideal</h4>
    <p>${precoIdeal ? precoIdeal.toLocaleString()+"€" : "N/A"}</p>

    <p style="font-size:12px;color:#666;">
      Fórmula: média €/m² dos concorrentes (${avgM2?.toFixed(0)}) × área (${areas.total})
    </p>

    <div class="section">
      <b>Concorrentes (${concorrentes.length})</b>
      ${concorrentes.map(c=>`
        <div class="comp">
          ${c.Empreendimento} - ${c["Fração"]}
          <span>${c.PVP.toLocaleString()}€</span>
        </div>
      `).join("")}
    </div>
  `;
}
