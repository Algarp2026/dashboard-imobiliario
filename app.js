let data = [];

fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  render();
});

function getVal(obj, keys){
  for(let k of keys){
    if(obj[k] !== undefined) return obj[k];
  }
  return "-";
}

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function render(){
  const grid=document.getElementById("grid");
  const base=data.filter(d=>d.Empreendimento==="The View");

  base.forEach(ap=>{
    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}
      <div class="price">${ap.PVP.toLocaleString()}€</div>
    `;

    card.onclick=()=>abrirModal(ap);
    grid.appendChild(card);
  });
}

function abrirModal(ap){

  const comp=data.filter(d=>d.Empreendimento!=="The View");
  const tip=mapTipologia(ap.Tipologia);

  const concorrentes=comp.filter(c=>mapTipologia(c.Tipologia)===tip);

  document.getElementById("modal").style.display="block";
  document.getElementById("modalTitulo").innerText=ap["Fração"];

  document.getElementById("modalConteudo").innerHTML=`
    <p><b>${ap.Tipologia}</b> • Piso ${ap.Piso} • Vista ${ap.Vista}</p>
    <p><b>Preço:</b> ${ap.PVP.toLocaleString()}€</p>

    <div class="section">
      <b>Concorrentes</b>
      ${concorrentes.map(c=>`
        <div class="comp" onclick='abrirConc(${JSON.stringify(c)})'>
          <span>${c.Empreendimento} - ${c["Fração"]}</span>
          <span>${c.PVP.toLocaleString()}€</span>
        </div>
      `).join("")}
    </div>
  `;
}

function abrirConc(c){

  document.getElementById("modalConc").style.display="block";
  document.getElementById("concTitulo").innerText = c["Fração"];

  document.getElementById("concConteudo").innerHTML=`
    <p><b>${c.Empreendimento}</b></p>
    <p>Tipologia: ${c.Tipologia}</p>
    <p>Piso: ${c.Piso}</p>
    <p>Vista: ${c.Vista}</p>

    <p>Área Bruta: ${getVal(c,["Área Bruta","Área Bruta (m²)"])} m²</p>
    <p>Varanda: ${getVal(c,["Varanda","Varanda (m²)"])} m²</p>
    <p>Área Total: ${getVal(c,["Área Total","Área Total (m²)"])} m²</p>

    <p><b>Preço: ${c.PVP.toLocaleString()}€</b></p>
  `;
}

function fecharModal(){
  document.getElementById("modal").style.display="none";
}

function fecharConc(){
  document.getElementById("modalConc").style.display="none";
}
