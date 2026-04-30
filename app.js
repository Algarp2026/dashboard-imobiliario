let data = [];
let modo = null;

fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  render(getBase());
});

function getBase(){
  return data.filter(d=>d.Empreendimento==="The View");
}

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function media(arr){
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

function getVal(obj, keys){
  for(let k of keys){
    if(obj[k] !== undefined) return obj[k];
  }
  return "-";
}

function setMode(m){
  modo=m;
  document.getElementById("selectBox").innerHTML="";
  render(getBase());
}

function render(lista){
  const grid=document.getElementById("grid");
  grid.innerHTML="";

  const comp=data.filter(d=>d.Empreendimento!=="The View");

  lista.forEach(ap=>{
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
        ${getVal(ap,["Área Bruta","Área Bruta (m²)"])} m² • 
        Varanda ${getVal(ap,["Varanda","Varanda (m²)"])} m²
      </div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>

      ${dDir!==null ? `<div class="${dDir>0?'up':'down'}">${dDir.toFixed(1)}% vs Diretos</div>`:""}
      ${dInd!==null ? `<div class="${dInd>0?'up':'down'}">${dInd.toFixed(1)}% vs Indiretos</div>`:""}
    `;

    card.onclick=()=>abrirModal(ap);
    grid.appendChild(card);
  });
}

function abrirModal(ap){

  const comp=data.filter(d=>d.Empreendimento!=="The View");
  const tip=mapTipologia(ap.Tipologia);

  const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
  const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);
  const pouco=comp.filter(c=>mapTipologia(c.Tipologia)===tip && Math.abs(c.Piso-ap.Piso)<=1);

  document.getElementById("modal").style.display="block";
  document.getElementById("modalTitulo").innerText=ap["Fração"];

  document.getElementById("modalConteudo").innerHTML=`
    <p><b>${ap.Tipologia}</b> • Piso ${ap.Piso} • Vista ${ap.Vista}</p>
    <p><b>${ap.PVP.toLocaleString()}€</b></p>

    ${sec("🔴 Diretos", direto, ap.PVP, "d")}
    ${sec("🟠 Indiretos", indireto, ap.PVP, "i")}
    ${sec("🟡 Pouco concorrente", pouco, ap.PVP, "p")}
  `;
}

function sec(titulo, arr, base, id){
  return `
    <div class="section">
      <div class="section-header" onclick="toggle('${id}')">
        ${titulo} (${arr.length})
      </div>

      <div class="section-content" id="${id}">
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

function abrirConc(c){
  document.getElementById("modalConc").style.display="block";
  document.getElementById("concTitulo").innerText=c["Fração"];

  document.getElementById("concConteudo").innerHTML=`
    <p><b>${c.Empreendimento}</b></p>
    <p>Tipologia: ${c.Tipologia}</p>
    <p>Piso: ${c.Piso}</p>
    <p>Vista: ${c.Vista}</p>

    <p>Área Bruta: ${getVal(c,["Área Bruta","Área Bruta (m²)"])} m²</p>
    <p>Varanda: ${getVal(c,["Varanda","Varanda (m²)"])} m²</p>
    <p>Área Total: ${getVal(c,["Área Total","Área Total (m²)"])} m²</p>

    <p><b>${c.PVP.toLocaleString()}€</b></p>
  `;
}

function fecharModal(){
  document.getElementById("modal").style.display="none";
}

function fecharConc(){
  document.getElementById("modalConc").style.display="none";
}
