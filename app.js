let data = [];

fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  render();
});

/* ---------- UTIL ---------- */

function normalize(str){
  return str?.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/\s/g,"");
}

function getVal(obj, keys){
  const objKeys = Object.keys(obj);

  for(let key of keys){
    const nk = normalize(key);

    for(let k of objKeys){
      if(normalize(k) === nk){
        return parseFloat(obj[k]) || null;
      }
    }
  }
  return null;
}

function getAreas(obj){

  // leitura direta (exata do Excel)
  const abp = obj["ABP"] ?? obj["Área Bruta"] ?? null;
  const varanda = obj["Varanda/Terraço"] ?? obj["Varanda"] ?? null;
  const totalExcel = obj["Área Total"] ?? obj["Area Total"] ?? null;

  // garantir números
  const areaBruta = abp ? parseFloat(abp) : null;
  const areaVaranda = varanda ? parseFloat(varanda) : null;
  const areaTotalExcel = totalExcel ? parseFloat(totalExcel) : null;

  // lógica correta
  let total = null;

  if(areaTotalExcel){
    total = areaTotalExcel;
  } else if(areaBruta || areaVaranda){
    total = (areaBruta || 0) + (areaVaranda || 0);
  }

  return {
    bruta: areaBruta,
    varanda: areaVaranda,
    total: total
  };
}

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function media(arr){
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

/* ---------- RENDER ---------- */

function render(){
  const base = data.filter(d=>d.Empreendimento==="The View");
  const comp = data.filter(d=>d.Empreendimento!=="The View");

  const grid=document.getElementById("grid");
  grid.innerHTML="";

  base.forEach(ap=>{

    const areas = getAreas(ap);
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
        ${areas.bruta ?? "-"} m² • 
        Varanda ${areas.varanda ?? "-"} m² • 
        Total ${areas.total ? areas.total.toFixed(1) : "-"} m²
      </div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>

      ${dDir!==null ? `<div class="${dDir>0?'up':'down'}">${dDir.toFixed(1)}% vs Diretos</div>`:""}
      ${dInd!==null ? `<div class="${dInd>0?'up':'down'}">${dInd.toFixed(1)}% vs Indiretos</div>`:""}
    `;

    card.onclick=()=>abrirModal(ap);
    grid.appendChild(card);
  });
}

/* ---------- MODAL ---------- */

function abrirModal(ap){

  const areas = getAreas(ap);
  const comp = data.filter(d=>d.Empreendimento!=="The View");
  const tip=mapTipologia(ap.Tipologia);

  const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
  const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);
  const pouco=comp.filter(c=>mapTipologia(c.Tipologia)===tip && Math.abs(c.Piso-ap.Piso)<=1);

  document.getElementById("modal").style.display="block";
  document.getElementById("modalTitulo").innerText=ap["Fração"];

  document.getElementById("modalConteudo").innerHTML=`
    <p><b>${ap.Tipologia}</b> • Piso ${ap.Piso} • Vista ${ap.Vista}</p>

    <p>
      Área: ${areas.bruta ?? "-"} m² |
      Varanda: ${areas.varanda ?? "-"} m² |
      Total: ${areas.total ? areas.total.toFixed(1) : "-"} m²
    </p>

    <p><b>${ap.PVP.toLocaleString()}€</b></p>

    ${sec("Diretos", direto, ap.PVP, "d")}
    ${sec("Indiretos", indireto, ap.PVP, "i")}
    ${sec("Pouco concorrente", pouco, ap.PVP, "p")}
  `;
}

function sec(titulo, arr, base, id){
  return `
    <div class="section">
      <div class="section-header" onclick="toggle('${id}')">
        ${titulo} (${arr.length})
      </div>

      <div id="${id}">
        ${arr.map(d=>{
          const dif = ((base/d.PVP -1)*100);
          return `
            <div class="comp" onclick='abrirConc(${JSON.stringify(d)})'>
              <span>${d.Empreendimento} - ${d["Fração"]}</span>
              <span>${d.PVP.toLocaleString()}€ (${dif.toFixed(1)}%)</span>
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

  document.getElementById("modalConc").style.display="block";
  document.getElementById("concTitulo").innerText=c["Fração"];

  document.getElementById("concConteudo").innerHTML=`
    <p><b>${c.Empreendimento}</b></p>

    <p>Tipologia: ${c.Tipologia}</p>
    <p>Piso: ${c.Piso}</p>
    <p>Vista: ${c.Vista}</p>

    <p>
      Área: ${areas.bruta ?? "-"} m² |
      Varanda: ${areas.varanda ?? "-"} m² |
      Total: ${areas.total ? areas.total.toFixed(1) : "-"} m²
    </p>

    <p><b>${c.PVP.toLocaleString()}€</b></p>
  `;
}

/* ---------- CLOSE ---------- */

function fecharModal(){
  document.getElementById("modal").style.display="none";
}

function fecharConc(){
  document.getElementById("modalConc").style.display="none";
}
